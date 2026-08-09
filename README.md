# MUHAMMADJONOV — platforma (frontend + backend)

Bu loyiha ikki qismdan iborat:

```
muhammadjonov-app/
├── public/
│   └── index.html      ← saytning o'zi (frontend)
├── api/
│   └── generate.js     ← AI so'rovlarini xavfsiz yuboradigan backend (API kalit shu yerda)
├── package.json
├── .env.example
└── .gitignore
```

Muhim: **API kalit endi brauzerda emas, faqat serverda** (`api/generate.js` ichida,
`process.env.ANTHROPIC_API_KEY` orqali) ishlatiladi. Frontend faqat o'z serveringizdagi
`/api/generate` manziliga so'rov yuboradi — hech qachon Anthropic'ga to'g'ridan-to'g'ri
ulanmaydi va kalitni ko'rmaydi.

---

## 1) Eng oson yo'l — Vercel (tavsiya etiladi)

Vercel bepul, server boshqarishni talab qilmaydi va `/api` papkasini avtomatik
serverless funksiyaga aylantiradi.

**A. GitHub orqali (eng qulay)**
1. Bu papkani GitHub'ga reponame bilan yuklang (`git init`, `git add .`, `git commit`, `git push`).
2. https://vercel.com ga kiring → **New Project** → GitHub repongizni tanlang → **Import**.
3. Deploy paytida **Environment Variables** bo'limiga qo'shing:
   - Key: `ANTHROPIC_API_KEY`
   - Value: sizning haqiqiy Anthropic API kalitingiz (https://console.anthropic.com dan olinadi)
4. **Deploy** tugmasini bosing. Bir necha soniyada `https://sizning-loyiha.vercel.app` manzili tayyor bo'ladi.

**B. Vercel CLI orqali**
```bash
npm install -g vercel
cd muhammadjonov-app
vercel login
vercel env add ANTHROPIC_API_KEY   # kalitni shu yerda kiritasiz (production uchun)
vercel --prod
```

Shu bilan sayt to'liq ishlaydi — AI generatsiya, barcha vositalar, real backend orqali.

---

## 2) Muqobil variant — o'z serveringiz / boshqa hosting (Render, Railway, VPS)

Agar Vercel emas, oddiy Node server kerak bo'lsa, `api/generate.js`dagi mantiqni
Express bilan o'rab qo'yish kifoya:

```bash
npm init -y
npm install express dotenv
```

```js
// server.js
import express from 'express';
import dotenv from 'dotenv';
import generateHandler from './api/generate.js'; // eslatma: Express uchun (req,res) formatiga moslashtirish kerak
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.post('/api/generate', generateHandler);

app.listen(process.env.PORT || 3000, () => console.log('Server ishga tushdi'));
```

`.env` faylga (repo'ga qo'shmasdan!) `ANTHROPIC_API_KEY=...` yozing, so'ng hostingda
(Render/Railway) shu o'zgaruvchini "Environment Variables" bo'limida kiritasiz.

---

## 3) Lokal (kompyuteringizda) sinab ko'rish

```bash
npm install -g vercel
cd muhammadjonov-app
cp .env.example .env.local
# .env.local ichiga haqiqiy kalitni yozing
vercel dev
```

Brauzerda `http://localhost:3000` ochiladi — barcha AI vositalar shu yerda ham ishlaydi.

---

## Xavfsizlik va cheklovlar haqida ochiq ma'lumot

- **API kalit hech qachon** frontend kodiga yoki GitHub repoga (ochiq holda) yozilmasin.
  `.env` va `.env.local` fayllari `.gitignore`da — tasodifan commit qilinmaydi.
- `api/generate.js` ichida oddiy **rate limiting** bor (1 daqiqada bitta IP'dan ~8 ta so'rov).
  Bu boshlang'ich himoya — jiddiy trafik/hujumlarga qarshi Upstash Redis yoki Vercel KV
  kabi umumiy (barcha serverlar ko'radigan) hisoblagichga o'tkazish tavsiya etiladi.
- **Haqiqiy auth (login/parol), to'lov tizimi (Payme/Click), va admin panelning
  ma'lumotlar bazasi** hali ulanmagan — bular alohida ish: auth uchun masalan
  Clerk/Supabase Auth, to'lov uchun Payme/Click API, ma'lumotlar uchun Supabase/Postgres.
  Xohlasangiz, keyingi qadam sifatida shularni ham qo'shib beraman.
- Statistikalar (10,000+ generatsiya va h.k.) hali ham **namunaviy** — real sonlarni
  ko'rsatish uchun generatsiyalarni bazaga yozib borish kerak bo'ladi.

---

## Nima ishlaydi, nima hali yo'q

✅ AI generatsiya — real, `/api/generate` orqali, kalit xavfsiz  
✅ Freemium hisoblagich, forma validatsiyasi, xato holatlari  
✅ Tarix (nusxalash/saqlash/o'chirish) — sessiya davomida  
✅ UZ/EN/RU tillar, Dark/Light/System tema  
✅ Rate limiting (boshlang'ich daraja)  

⏳ Haqiqiy foydalanuvchi hisoblari (login qilib kirish, ko'p qurilmada saqlash)  
⏳ To'lov tizimi (Pro rejaga real o'tish)  
⏳ Admin panelning ma'lumotlar bazasi bilan ulanishi  
⏳ Real statistikalar (hozircha demo)
