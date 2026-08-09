// /api/generate.js
// Serverless endpoint the frontend calls instead of hitting Anthropic directly.
// The API key lives ONLY here, as a server environment variable — it never
// reaches the browser. Deploy target: Vercel (Node.js serverless function).
//
// Required environment variable (set in your hosting dashboard, not in code):
//   ANTHROPIC_API_KEY = sk-ant-...

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 daqiqa
const RATE_LIMIT_MAX = 8;               // shu vaqt oralig'ida bitta IP uchun so'rovlar soni

// Eslatma: bu oddiy xotira-ichi (in-memory) limiter — bitta serverless instance
// ichida ishlaydi, lekin ko'p instance/region bo'lsa har biri o'z hisobini yuritadi.
// Jiddiy trafik uchun Upstash Redis yoki Vercel KV kabi umumiy xotiraga o'tkazing.
const hits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  hits.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: "Faqat POST so'rovlar qabul qilinadi." });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .toString()
    .split(',')[0]
    .trim();

  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: "Juda ko'p so'rov yuborildi. Bir necha soniyadan keyin qayta urinib ko'ring." });
    return;
  }

  // --- Input validation ---
  const body = req.body || {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  if (!prompt || prompt.length < 2) {
    res.status(400).json({ error: "So'rov matni juda qisqa yoki bo'sh." });
    return;
  }
  if (prompt.length > 4000) {
    res.status(400).json({ error: "So'rov matni juda uzun (4000 belgidan oshmasin)." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is not set.');
    res.status(500).json({ error: "Server sozlanmagan: API kaliti topilmadi." });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('Anthropic API error:', upstream.status, errText);
      if (upstream.status === 429) {
        res.status(429).json({ error: "AI xizmati band. Birozdan so'ng qayta urinib ko'ring." });
      } else {
        res.status(502).json({ error: "AI xizmatidan javob olib bo'lmadi." });
      }
      return;
    }

    const data = await upstream.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');

    if (!textBlock || !textBlock.text) {
      res.status(502).json({ error: "AI bo'sh javob qaytardi." });
      return;
    }

    res.status(200).json({ text: textBlock.text });
  } catch (err) {
    console.error('Server error in /api/generate:', err);
    res.status(500).json({ error: 'Server xatosi yuz berdi.' });
  }
}
