# دليل النشر — CuraDesk

نشر مجاني بالكامل: Vercel (فرونت) + Render (Strapi) + Neon (قاعدة بيانات Postgres دائمة مجاناً).

---

## 1) رفع الكود على GitHub

مستودعين منفصلين أفضل من واحد (الفرونت والباك اند دورة حياة مختلفة):

```bash
# داخل مجلد الفرونت
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/curadesk-frontend.git
git push -u origin main
```

نفس الشي لمجلد الـ Strapi (repo باسم `curadesk-backend` مثلاً).

---

## 2) قاعدة البيانات — Neon

1. سجّل بـ [neon.tech](https://neon.tech) (بدون بطاقة).
2. أنشئ مشروع جديد → بيعطيك **Connection String** فيه كل شي (host, port, database, user, password).
3. احتفظ فيها، رح تحتاجها بالخطوة الجاية.

---

## 3) تجهيز Strapi لـ Postgres + الإنتاج

```bash
npm install pg
```

افتح `config/database.js` وتأكد إنه شكلها هيك (بتقرأ من متغيرات البيئة):

```js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME'),
      user: env('DATABASE_USERNAME'),
      password: env('DATABASE_PASSWORD'),
      ssl: { rejectUnauthorized: false },
    },
  },
});
```

**متغيرات البيئة المطلوبة بـ Render** (من Connection String تبع Neon):
```
DATABASE_CLIENT=postgres
DATABASE_HOST=...
DATABASE_PORT=5432
DATABASE_NAME=...
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
NODE_ENV=production
```

**زائد أسرار Strapi** (لازم توليدها، ما تستخدم قيم افتراضية):
```
APP_KEYS=<4 قيم عشوائية مفصولة بفاصلة>
API_TOKEN_SALT=<قيمة عشوائية>
ADMIN_JWT_SECRET=<قيمة عشوائية>
JWT_SECRET=<قيمة عشوائية>
TRANSFER_TOKEN_SALT=<قيمة عشوائية>
```
لتوليد قيمة عشوائية: `openssl rand -base64 32` بالتيرمينال (أو أي مولّد قيم عشوائي أونلاين موثوق).

---

## 4) نشر Strapi على Render

1. [render.com](https://render.com) → New → **Web Service** → اربط الـ GitHub repo تبع الباك اند.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start`
4. Instance Type: **Free**
5. ضيف كل متغيرات البيئة من الخطوة السابقة بقسم Environment.
6. Deploy، واستنى — أول مرة بتاخد وقت أطول (بتبني الأدمن بانل).
7. لما يخلص، بيعطيك رابط زي `https://curadesk-backend.onrender.com`.

⚠️ **مهم:** الخطة المجانية بتنام بعد 15 دقيقة بدون طلبات، وأول طلب بعدها بياخد لحدود دقيقة لحتى يصحى. طبيعي، بس خبّر أي حدا رح يجرب الديمو إنه ينتظر شوي أول مرة.

---

## 5) إعدادات لازمة بالأدمن بانل (بعد أول نشر)

روح على `https://your-app.onrender.com/admin` وأنشئ حساب أدمن جديد (قاعدة بيانات جديدة = ولا مستخدم فيها).

**لازم تعمل من جديد** (لأنها بترجع افتراضية على قاعدة بيانات جديدة):
- Settings → Roles → Authenticated: فعّل الصلاحيات (find/create/update/delete) لكل content-type يلي الفرونت بيستخدمها
- Settings → Users & Permissions Plugin → أضف أي مستخدمين/أدوار (doctor, receptionist...) كانوا عندك محلياً

**CORS:** افتح `config/middlewares.js` وضيف رابط الفرونت (Vercel) بإعدادات الـ cors:
```js
{
  name: 'strapi::cors',
  config: {
    origin: ['https://your-frontend.vercel.app'],
  },
},
```

---

## 6) نشر الفرونت على Vercel

1. [vercel.com](https://vercel.com) → Add New Project → استورد `curadesk-frontend`.
2. Framework Preset: Vite (بينكشف تلقائياً).
3. Environment Variable: `VITE_API_URL` = `https://curadesk-backend.onrender.com/api`
4. Deploy.

---

## 7) فحص نهائي

- افتح رابط Vercel، جرب تسجيل دخول
- خطأ CORS بالـ console؟ → راجع خطوة 5
- 403 Forbidden؟ → راجع صلاحيات الـ Roles بخطوة 5
- بطء أول تحميل؟ → طبيعي (cold start)، راجع خطوة 4

---

## نصيحة اختيارية: تبقية الباك اند صاحي

الخطة المجانية بتعطيك 750 ساعة/شهر (تقريباً تغطي شغل مستمر 24/7 لخدمة وحدة)، بس السيرفر لسا بينام بعد 15 دقيقة خمول. لو بدك الديمو يفتح فوراً دايماً، استخدم خدمة مجانية زي [UptimeRobot](https://uptimerobot.com) أو [cron-job.org](https://cron-job.org) تعمل ping للرابط كل 10 دقايق.
