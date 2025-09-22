import { json, requireAuth, requireCsrf, sameOrigin } from '../../_utils.js';

export async function onRequestGet({ request, env }) {
  const authData = await requireAuth(request, env);
  if (!authData) return json({ error: 'UNAUTHORIZED' }, 401);

  const templates = {
    article: {
      name: "مقاله آموزشی",
      description: "برای نوشتن راهنما و آموزش‌های فنی",
      icon: "📄",
      keyPattern: "articles/{year}/{month}/{slug}.json",
      template: {
        title: "عنوان مقاله جدید",
        cover: "/Articles/covers/default.jpg",
        summary: "خلاصه کوتاه مقاله که در لیست نمایش داده می‌شود",
        body: `# عنوان اصلی مقاله

## مقدمه
متن مقدمه شما اینجا قرار می‌گیرد.

## محتوای اصلی
محتوای اصلی مقاله را اینجا بنویسید.

### نکات مهم
- نکته اول
- نکته دوم
- نکته سوم

## نتیجه‌گیری
نتیجه‌گیری مقاله را اینجا بنویسید.`,
        tags: ["آموزش", "راهنما"],
        publishedAt: new Date().toISOString(),
        author: "Pro TooLs",
        status: "published"
      }
    },
    news: {
      name: "خبر و اطلاعیه",
      description: "برای انتشار اخبار و اطلاعیه‌ها",
      icon: "📰",
      keyPattern: "news/{year}/{month}/news-{timestamp}.json",
      template: {
        title: "عنوان خبر یا اطلاعیه",
        summary: "خلاصه کوتاه خبر",
        body: "متن کامل خبر یا اطلاعیه را اینجا بنویسید.",
        type: "news",
        priority: "normal",
        publishedAt: new Date().toISOString(),
        expiresAt: null
      }
    },
    config: {
      name: "کانفیگ و تنظیمات",
      description: "برای اشتراک کانفیگ‌های VPN و تنظیمات",
      icon: "⚙️",
      keyPattern: "configs/{timestamp}.json",
      template: {
        name: "کانفیگ جدید",
        type: "vpn",
        description: "توضیحات کانفیگ",
        config: "# کانفیگ شما اینجا\n",
        instructions: "راهنمای استفاده از کانفیگ",
        tags: ["vpn", "config"],
        createdAt: new Date().toISOString()
      }
    },
    download: {
      name: "صفحه دانلود",
      description: "برای معرفی و دانلود نرم‌افزارها",
      icon: "⬇️",
      keyPattern: "downloads/{timestamp}.json",
      template: {
        title: "نام نرم‌افزار",
        description: "توضیحات نرم‌افزار",
        version: "1.0.0",
        downloadUrl: "https://example.com/download",
        fileSize: "10 MB",
        requirements: "ویندوز 10 یا بالاتر",
        screenshots: [],
        features: ["ویژگی اول", "ویژگی دوم"],
        publishedAt: new Date().toISOString()
      }
    },
    page: {
      name: "صفحه HTML",
      description: "برای ساخت صفحات استاتیک",
      icon: "🌐",
      keyPattern: "pages/{slug}.html",
      template: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>صفحه جدید | Pro TooLs</title>
  <link rel="stylesheet" href="/styles.css"/>
</head>
<body>
  <div class="section">
    <div class="container">
      <h1 class="section-title">صفحه جدید</h1>
      <p class="section-subtitle">محتوای خود را اینجا قرار دهید.</p>
    </div>
  </div>
  <script src="/script.js"></script>
</body>
</html>`
    }
  };

  return json({ templates });
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'CORS' }, 403);
  if (!requireCsrf(request)) return json({ error: 'CSRF' }, 403);
  
  const authData = await requireAuth(request, env);
  if (!authData) return json({ error: 'UNAUTHORIZED' }, 401);

  try {
    const body = await request.json();
    const { templateType, customData } = body;

    if (!templateType) {
      return json({ error: 'Template type required' }, 400);
    }

    // Generate key based on template pattern
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    
    let key = '';
    let content = '';

    switch (templateType) {
      case 'article':
        key = `articles/${year}/${month}/${customData?.slug || 'new-article'}.json`;
        content = JSON.stringify({
          title: customData?.title || "عنوان مقاله جدید",
          cover: customData?.cover || "/Articles/covers/default.jpg",
          summary: customData?.summary || "خلاصه کوتاه مقاله",
          body: customData?.body || "محتوای مقاله...",
          tags: customData?.tags || ["آموزش"],
          publishedAt: now.toISOString(),
          author: "Pro TooLs",
          status: "published"
        }, null, 2);
        break;
      
      case 'news':
        key = `news/${year}/${month}/news-${timestamp}.json`;
        content = JSON.stringify({
          title: customData?.title || "عنوان خبر",
          summary: customData?.summary || "خلاصه خبر",
          body: customData?.body || "متن کامل خبر...",
          type: "news",
          priority: customData?.priority || "normal",
          publishedAt: now.toISOString(),
          expiresAt: customData?.expiresAt || null
        }, null, 2);
        break;
      
      case 'config':
        key = `configs/${timestamp}.json`;
        content = JSON.stringify({
          name: customData?.name || "کانفیگ جدید",
          type: customData?.type || "vpn",
          description: customData?.description || "توضیحات کانفیگ",
          config: customData?.config || "# کانفیگ شما اینجا\n",
          instructions: customData?.instructions || "راهنمای استفاده",
          tags: customData?.tags || ["vpn", "config"],
          createdAt: now.toISOString()
        }, null, 2);
        break;
      
      case 'download':
        key = `downloads/${timestamp}.json`;
        content = JSON.stringify({
          title: customData?.title || "نام نرم‌افزار",
          description: customData?.description || "توضیحات نرم‌افزار",
          version: customData?.version || "1.0.0",
          downloadUrl: customData?.downloadUrl || "https://example.com/download",
          fileSize: customData?.fileSize || "10 MB",
          requirements: customData?.requirements || "ویندوز 10 یا بالاتر",
          screenshots: customData?.screenshots || [],
          features: customData?.features || ["ویژگی اول", "ویژگی دوم"],
          publishedAt: now.toISOString()
        }, null, 2);
        break;
      
      case 'page':
        key = `pages/${customData?.slug || 'new-page'}.html`;
        content = customData?.content || `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${customData?.title || 'صفحه جدید'} | Pro TooLs</title>
  <link rel="stylesheet" href="/styles.css"/>
</head>
<body>
  <div class="section">
    <div class="container">
      <h1 class="section-title">${customData?.title || 'صفحه جدید'}</h1>
      <p class="section-subtitle">${customData?.description || 'محتوای خود را اینجا قرار دهید.'}</p>
    </div>
  </div>
  <script src="/script.js"></script>
</body>
</html>`;
        break;
      
      default:
        return json({ error: 'Invalid template type' }, 400);
    }

    return json({ key, content, success: true });

  } catch (e) {
    return json({ error: 'INVALID_JSON' }, 400);
  }
}
