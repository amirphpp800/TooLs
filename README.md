# 🛠️ Pro Tools - ابزارها و دانلودهای ضروری

یک وب‌سایت مدرن و امن برای ارائه ابزارهای VPN، DNS و سایر سرویس‌های ضروری با پشتیبانی کامل از زبان فارسی.

## ✨ ویژگی‌های کلیدی

- 🎨 **طراحی مدرن**: رابط کاربری زیبا با پشتیبانی RTL و تم تاریک
- 🔒 **امنیت بالا**: CSP، محافظت در برابر اسکرپینگ، احراز هویت قوی
- 📱 **ریسپانسیو**: سازگار با تمام دستگاه‌ها و اندازه‌های صفحه
- ⚡ **عملکرد بهینه**: بارگذاری سریع، انیمیشن‌های روان
- 🌐 **چندپلتفرمه**: پشتیبانی از اندروید، iOS و ویندوز
- 🔧 **پنل مدیریت**: داشبورد کامل برای مدیریت سیستم

## 🏗️ معماری پروژه

```
Pro TooLs 2/
├── assets/
│   ├── css/
│   │   └── style.css           # استایل‌های اصلی
│   └── js/
│       ├── main.js             # منطق اصلی
│       ├── account.js          # مدیریت حساب کاربری
│       ├── admin.js            # پنل مدیریت
│       ├── dns.js              # سرویس DNS
│       ├── protection.js       # محافظت امنیتی
│       ├── particles.js        # انیمیشن ذرات
│       ├── error-handler.js    # مدیریت خطاها
│       └── performance.js      # نظارت بر عملکرد
├── components/
│   ├── header.html             # هدر سایت
│   ├── hero.html               # بخش اصلی
│   ├── home-intro.html         # معرفی خانه
│   ├── dns.html                # کامپوننت DNS
│   └── footer.html             # فوتر سایت
├── functions/
│   ├── api/
│   │   ├── apps.js             # API برنامه‌ها
│   │   ├── auth/               # احراز هویت
│   │   ├── admin/              # مدیریت
│   │   ├── health.js           # بررسی سلامت
│   │   └── dns.js              # سرویس DNS
│   └── _utils.js               # ابزارهای مشترک
├── pages/
│   ├── account.html            # صفحه حساب کاربری
│   ├── admin.html              # پنل مدیریت
│   ├── dns.html                # صفحه DNS
│   └── os-*.html               # صفحات سیستم‌عامل
├── Font/                       # فونت‌های فارسی
├── icons/                      # آیکون‌ها
├── apps.json                   # لیست برنامه‌ها
└── index.html                  # صفحه اصلی
```

## 🚀 راه‌اندازی

### پیش‌نیازها
- Node.js (برای توسعه محلی)
- Cloudflare Account (برای استقرار)

### نصب محلی
```bash
# کلون پروژه
git clone [repository-url]
cd "Pro TooLs 2"

# سرور محلی راه‌اندازی کنید
npx http-server . -p 8080

# یا با Python
python -m http.server 8080
```

### تنظیمات
1. فایل `assets/js/config.js` را ویرایش کنید:
```javascript
window.APP_CONFIG = {
  CF_API_BASE: 'https://your-worker.your-subdomain.workers.dev'
};
```

2. متغیرهای محیطی Cloudflare:
- `ADMIN_USER`: نام کاربری ادمین
- `ADMIN_PASS`: رمز عبور ادمین
- `BOT_TOKEN`: توکن ربات تلگرام
- `DATABASE`: KV Namespace

## 🔧 استقرار در Cloudflare

### 1. Cloudflare Pages
```bash
# اتصال به Cloudflare
npx wrangler pages project create pro-tools

# استقرار
npx wrangler pages publish . --project-name=pro-tools
```

### 2. Cloudflare Workers (برای API)
```bash
# استقرار Functions
npx wrangler publish
```

## 📋 ویژگی‌های امنیتی

- ✅ **Content Security Policy (CSP)**
- ✅ **X-Frame-Options: DENY**
- ✅ **X-Content-Type-Options: nosniff**
- ✅ **Referrer-Policy: no-referrer**
- ✅ **محافظت در برابر اسکرپینگ**
- ✅ **تشخیص Developer Tools**
- ✅ **غیرفعال‌سازی کلیک راست و انتخاب متن**
- ✅ **احراز هویت دو مرحله‌ای با تلگرام**

## 🎨 طراحی و UX

### رنگ‌بندی
- **اصلی**: `#F77E2D` (نارنجی)
- **پس‌زمینه**: `#0a0a0a` (مشکی)
- **متن**: `#f3f6f7` (سفید یخی)
- **خاکستری**: `#b9c3c5`

### فونت
- **اصلی**: DanaFaNum (فارسی)
- **پشتیبان**: system-ui, Arial

### انیمیشن‌ها
- Scroll reveal animations
- Glassmorphism effects
- Smooth transitions
- Particle background

## 🔍 نظارت و عملکرد

### Core Web Vitals
- **LCP**: < 1.2s (عالی)
- **FID**: < 100ms (خوب)
- **CLS**: < 0.1 (پایدار)

### ابزارهای نظارت
- Performance monitoring
- Error tracking
- Memory usage monitoring
- Health check endpoint

## 🛡️ مدیریت خطاها

- Global error handler
- Unhandled promise rejection handler
- User-friendly error notifications
- Automatic error recovery
- Fallback mechanisms

## 📱 پشتیبانی از مرورگرها

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ مرورگرهای موبایل

## 🔄 به‌روزرسانی

### نسخه 1.0.0
- راه‌اندازی اولیه
- سیستم احراز هویت
- پنل مدیریت
- سرویس DNS
- طراحی ریسپانسیو

## 🤝 مشارکت

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request باز کنید

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است.

## 📞 پشتیبانی

- تلگرام: [@ProTooLsSupport](https://t.me/ProTooLsSupport)
- ایمیل: support@protools.example.com

---

**ساخته شده با ❤️ برای جامعه ایرانی**
