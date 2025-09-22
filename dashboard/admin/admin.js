(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  let CSRF_TOKEN = '';

  const api = {
    async login(username, password){
      const res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': CSRF_TOKEN },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async logout(){
      await fetch('/api/admin/logout', { method: 'POST', headers: { 'X-CSRF-Token': CSRF_TOKEN } });
    },
    async me(){
      const res = await fetch('/api/admin/me');
      if (!res.ok) return null; return res.json();
    },
    async list(prefix){
      const url = new URL('/api/kv/list', location.origin);
      if (prefix) url.searchParams.set('prefix', prefix);
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async get(key){
      const url = new URL('/api/kv/get', location.origin);
      url.searchParams.set('key', key);
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const text = await res.text();
      return text;
    },
    async put(key, value){
      const res = await fetch('/api/kv/put', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': CSRF_TOKEN },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async remove(key){
      const res = await fetch('/api/kv/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': CSRF_TOKEN },
        body: JSON.stringify({ key })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  };

  function notify(msg, type='info'){
    const n = document.createElement('div');
    n.className = 'notify ' + type;
    n.textContent = msg;
    Object.assign(n.style, {
      position:'fixed', top:'20px', left:'50%', transform:'translateX(-50%)',
      background: type==='error' ? 'rgba(239,83,80,.95)' : type==='success' ? 'rgba(0,212,255,.9)' : 'rgba(0,0,0,.85)',
      color:'#fff', padding:'10px 16px', borderRadius:'10px', zIndex:9999,
      boxShadow:'0 6px 20px rgba(0,0,0,.35)'
    });
    document.body.appendChild(n);
    setTimeout(()=> n.remove(), 2500);
  }

  // Elements
  const loginSection = $('#login-section');
  const dashboardSection = $('#dashboard-section');
  const loginForm = $('#login-form');
  const btnLogout = $('#btn-logout');
  const healthBox = $('#health');

  // Views
  const viewKV = $('#view-kv');
  const viewPages = $('#view-pages');
  const viewContacts = $('#view-contacts');
  const viewSponsors = $('#view-sponsors');
  const viewPost = $('#view-post');
  $$('.sidebar-link').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.sidebar-link').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const v = btn.getAttribute('data-view');
      viewKV.hidden = v !== 'kv';
      viewPages.hidden = v !== 'pages';
      if (viewContacts) viewContacts.hidden = v !== 'contacts';
      if (viewSponsors) viewSponsors.hidden = v !== 'sponsors';
      if (viewPost) viewPost.hidden = v !== 'post';
    });
  });

  // KV Controls
  const prefixInput = $('#prefix');
  const btnList = $('#btn-list');
  const kvKey = $('#kv-key');
  const btnGet = $('#btn-get');
  const btnDelete = $('#btn-delete');
  const btnPut = $('#btn-put');
  const kvList = $('#kv-list');
  const templateSelect = $('#template-select');
  const btnApplyTemplate = $('#btn-apply-template');
  const btnKvDraftSave = $('#btn-kv-draft-save');
  const btnKvDraftLoad = $('#btn-kv-draft-load');
  const btnKvDraftClear = $('#btn-kv-draft-clear');
  // Preset helper for prefixes (ease of use)
  if (prefixInput) {
    prefixInput.setAttribute('list', 'prefixes');
    const dl = document.createElement('datalist');
    dl.id = 'prefixes';
    dl.innerHTML = [
      'articles/','pages/','settings/','settings/contacts.json','settings/sponsors.json','sitepanels/web/','sitepanels/python/'
    ].map(p=>`<option value="${p}"></option>`).join('');
    document.body.appendChild(dl);
  }

  // Template presets for non-technical admins
  function suggestKeyByTemplate(tpl){
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,'0');
    const d = String(now.getDate()).padStart(2,'0');
    if (tpl === 'article') return `articles/${y}/${m}/${d}/new-article.json`;
    if (tpl === 'page') return `pages/new-page.html`;
    if (tpl === 'settings') return `settings/config.json`;
    return '';
  }

  function getTemplateContent(tpl){
    if (tpl === 'article') {
      return JSON.stringify({
        title: "عنوان مقاله",
        cover: "/Articles/covers/cover.jpg",
        summary: "خلاصه کوتاه مقاله",
        body: "متن کامل مقاله...",
        tags: ["برچسب1","برچسب2"],
        publishedAt: new Date().toISOString()
      }, null, 2);
    }
    if (tpl === 'page') {
      return `<!DOCTYPE html>\n<html lang="fa" dir="rtl">\n<head>\n  <meta charset="UTF-8"/>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n  <title>صفحه جدید</title>\n  <link rel=\"/styles.css\" rel=\"stylesheet\"/>\n</head>\n<body>\n  <div class=\"section\">\n    <div class=\"container\">\n      <h1 class=\"section-title\">صفحه جدید</h1>\n      <p class=\"section-subtitle\">محتوای خود را اینجا قرار دهید.</p>\n    </div>\n  </div>\n  <script src=\"/script.js\"></script>\n</body>\n</html>`;
    }
    if (tpl === 'settings') {
      return JSON.stringify({
        siteName: "Pro TooLs",
        theme: "dark",
        features: { search: true, analytics: false }
      }, null, 2);
    }
    return '';
  }

  if (btnApplyTemplate) btnApplyTemplate.addEventListener('click', ()=>{
    const tpl = templateSelect?.value || '';
    if (!tpl) return notify('یک تمپلیت انتخاب کنید', 'error');
    if (!kvKey.value) kvKey.value = suggestKeyByTemplate(tpl);
    kvValue.value = getTemplateContent(tpl);
    notify('تمپلیت اعمال شد','success');
  });

  // Local draft for KV editor
  const KV_DRAFT_KEY = 'admin_kv_draft';
  btnKvDraftSave?.addEventListener('click', ()=>{
    const payload = { key: kvKey.value, value: kvValue.value };
    localStorage.setItem(KV_DRAFT_KEY, JSON.stringify(payload));
    notify('پیش‌نویس ذخیره شد','success');
  });
  btnKvDraftLoad?.addEventListener('click', ()=>{
    try { const p = JSON.parse(localStorage.getItem(KV_DRAFT_KEY)||'');
      kvKey.value = p?.key || kvKey.value;
      kvValue.value = p?.value || kvValue.value;
      notify('پیش‌نویس بارگذاری شد','success');
    } catch { notify('پیش‌نویسی یافت نشد','error'); }
  });
  btnKvDraftClear?.addEventListener('click', ()=>{
    localStorage.removeItem(KV_DRAFT_KEY);
    notify('پیش‌نویس پاک شد','success');
  });

  // Post wizard
  const postTitle = $('#post-title');
  const postCover = $('#post-cover');
  const postSummary = $('#post-summary');
  const postTags = $('#post-tags');
  const postBody = $('#post-body');
  const postKey = $('#post-key');
  const btnPostGenKey = $('#btn-post-generate-key');
  const btnPostPreview = $('#btn-post-preview');
  const btnPostSaveKV = $('#btn-post-save-kv');
  const btnPostDraftSave = $('#btn-post-draft-save');
  const btnPostDraftLoad = $('#btn-post-draft-load');
  const btnPostDraftClear = $('#btn-post-draft-clear');
  const postPreviewBox = $('#post-preview');
  const postPreviewContent = $('#post-preview-content');

  function makeSlug(str){
    return (str||'')
      .toString()
      .trim()
      .replace(/[\s]+/g,'-')
      .replace(/[^\u0600-\u06FF\w\-]+/g,'')
      .toLowerCase();
  }
  function genPostKey(){
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,'0');
    const slug = makeSlug(postTitle.value) || 'post';
    return `articles/${y}/${m}/${slug}.json`;
  }
  btnPostGenKey?.addEventListener('click', ()=>{ postKey.value = genPostKey(); notify('کلید تولید شد','success'); });
  btnPostPreview?.addEventListener('click', ()=>{
    const tags = (postTags.value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const data = { title: postTitle.value, cover: postCover.value, summary: postSummary.value, tags, body: postBody.value };
    postPreviewBox.style.display = 'block';
    postPreviewContent.innerHTML = `
      <h4>${data.title||''}</h4>
      ${data.cover?`<img src="${data.cover}" alt="cover" style="max-width:100%;border-radius:10px;margin:8px 0;"/>`:''}
      <p>${data.summary||''}</p>
      ${tags.length?`<p style="color:#9aa0a6">برچسب‌ها: ${tags.join(', ')}</p>`:''}
      <div style="white-space:pre-wrap;color:#ddd;">${(data.body||'')}</div>
    `;
  });
  btnPostSaveKV?.addEventListener('click', async ()=>{
    try {
      const tags = (postTags.value||'').split(',').map(s=>s.trim()).filter(Boolean);
      const payload = {
        title: postTitle.value.trim(),
        cover: postCover.value.trim(),
        summary: postSummary.value.trim(),
        body: postBody.value,
        tags,
        publishedAt: new Date().toISOString()
      };
      const key = (postKey.value.trim()||genPostKey());
      await api.put(key, JSON.stringify(payload, null, 2));
      notify('پست ذخیره شد','success');
    } catch(e){ notify('خطا در ذخیره پست','error'); }
  });

  // Local drafts for post wizard
  const POST_DRAFT_KEY = 'admin_post_draft';
  btnPostDraftSave?.addEventListener('click', ()=>{
    const payload = {
      title: postTitle.value, cover: postCover.value, summary: postSummary.value,
      tags: postTags.value, body: postBody.value, key: postKey.value
    };
    localStorage.setItem(POST_DRAFT_KEY, JSON.stringify(payload));
    notify('پیش‌نویس پست ذخیره شد','success');
  });
  btnPostDraftLoad?.addEventListener('click', ()=>{
    try { const p = JSON.parse(localStorage.getItem(POST_DRAFT_KEY)||'');
      postTitle.value = p?.title||'';
      postCover.value = p?.cover||'';
      postSummary.value = p?.summary||'';
      postTags.value = p?.tags||'';
      postBody.value = p?.body||'';
      postKey.value = p?.key||'';
      notify('پیش‌نویس پست بارگذاری شد','success');
    } catch { notify('پیش‌نویسی برای پست یافت نشد','error'); }
  });
  btnPostDraftClear?.addEventListener('click', ()=>{
    localStorage.removeItem(POST_DRAFT_KEY);
    notify('پیش‌نویس پست پاک شد','success');
  });

  btnList.addEventListener('click', async ()=>{
    try {
      const { keys } = await api.list(prefixInput.value.trim());
      kvList.innerHTML = '';
      (keys||[]).forEach(k=>{
        const tpl = document.importNode($('#tpl-item').content, true);
        tpl.querySelector('.kv-key').textContent = k;
        tpl.querySelector('[data-act="load"]').addEventListener('click', async ()=>{
          kvKey.value = k;
          kvValue.value = await api.get(k);
          notify('بارگذاری شد', 'success');
        });
        tpl.querySelector('[data-act="remove"]').addEventListener('click', async ()=>{
          if (!confirm('حذف شود؟')) return;
          await api.remove(k);
          notify('حذف شد', 'success');
          btnList.click();
        });
        kvList.appendChild(tpl);
      });
      notify('لیست به‌روزرسانی شد', 'success');
    } catch(e){
      notify(e.message||'خطا در دریافت لیست', 'error');
    }
  });

  btnGet.addEventListener('click', async ()=>{
    try {
      kvValue.value = await api.get(kvKey.value.trim());
      notify('دریافت شد', 'success');
    } catch(e){ notify(e.message||'خطا در دریافت', 'error'); }
  });

  btnPut.addEventListener('click', async ()=>{
    try {
      await api.put(kvKey.value.trim(), kvValue.value);
      notify('ذخیره شد', 'success');
    } catch(e){ notify(e.message||'خطا در ذخیره', 'error'); }
  });

  btnDelete.addEventListener('click', async ()=>{
    try {
      await api.remove(kvKey.value.trim());
      notify('حذف شد', 'success');
    } catch(e){ notify(e.message||'خطا در حذف', 'error'); }
  });

  // Contacts manager
  const c1Label = $('#c1-label');
  const c1Url = $('#c1-url');
  const c2Label = $('#c2-label');
  const c2Url = $('#c2-url');
  const btnContactsLoad = $('#btn-contacts-load');
  const btnContactsSave = $('#btn-contacts-save');
  const CONTACTS_KEY = 'settings/contacts.json';

  if (btnContactsLoad) btnContactsLoad.addEventListener('click', async ()=>{
    try {
      const txt = await api.get(CONTACTS_KEY);
      const data = JSON.parse(txt);
      c1Label.value = data?.items?.[0]?.label || '';
      c1Url.value = data?.items?.[0]?.url || '';
      c2Label.value = data?.items?.[1]?.label || '';
      c2Url.value = data?.items?.[1]?.url || '';
      notify('تماس‌ها بارگذاری شد','success');
    } catch(e){ notify('اطلاعاتی یافت نشد/فرمت نادرست', 'error'); }
  });
  if (btnContactsSave) btnContactsSave.addEventListener('click', async ()=>{
    try {
      const payload = {
        items: [
          { label: c1Label.value.trim(), url: c1Url.value.trim() },
          { label: c2Label.value.trim(), url: c2Url.value.trim() },
        ].filter(x=>x.label||x.url)
      };
      await api.put(CONTACTS_KEY, JSON.stringify(payload, null, 2));
      notify('تماس‌ها ذخیره شد','success');
    } catch(e){ notify('خطا در ذخیره تماس‌ها','error'); }
  });

  // Sponsors manager
  const spList = $('#sponsors-list');
  const btnSpAdd = $('#btn-sp-add');
  const btnSpLoad = $('#btn-sp-load');
  const btnSpSave = $('#btn-sp-save');
  const SP_KEY = 'settings/sponsors.json';

  function renderSponsorRow(item={name:'',url:''}){
    const row = document.createElement('div');
    row.className = 'kv-item';
    row.innerHTML = `
      <div class="sp-row">
        <input class="input sp-name" placeholder="نام" value="${item.name||''}">
        <input class="input sp-url" placeholder="لینک" value="${item.url||''}">
      </div>
      <div class="kv-actions">
        <button data-act="remove" class="btn btn-xs btn-danger">حذف</button>
      </div>`;
    row.querySelector('[data-act="remove"]').addEventListener('click', ()=>{
      row.remove();
    });
    spList.appendChild(row);
  }

  if (btnSpAdd) btnSpAdd.addEventListener('click', ()=> renderSponsorRow());

  if (btnSpLoad) btnSpLoad.addEventListener('click', async ()=>{
    try {
      spList.innerHTML = '';
      const txt = await api.get(SP_KEY);
      const data = JSON.parse(txt);
      (data?.items||[]).forEach(renderSponsorRow);
      notify('اسپانسرها بارگذاری شدند','success');
    } catch(e){ notify('اطلاعاتی یافت نشد/فرمت نادرست','error'); }
  });

  if (btnSpSave) btnSpSave.addEventListener('click', async ()=>{
    try {
      const items = Array.from(spList.querySelectorAll('.kv-item')).map(row=>({
        name: row.querySelector('.sp-name').value.trim(),
        url: row.querySelector('.sp-url').value.trim(),
      })).filter(x=>x.name||x.url);
      const payload = { items };
      await api.put(SP_KEY, JSON.stringify(payload, null, 2));
      notify('اسپانسرها ذخیره شدند','success');
    } catch(e){ notify('خطا در ذخیره اسپانسرها','error'); }
  });

  // Login flow
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = new FormData(loginForm);
    const username = data.get('username');
    const password = data.get('password');
    try {
      await api.login(username, password);
      await afterLogin();
    } catch(e){ notify('ورود ناموفق', 'error'); }
  });

  btnLogout.addEventListener('click', async ()=>{
    try { await api.logout(); } catch {}
    loginSection.hidden = false;
    dashboardSection.hidden = true;
    btnLogout.hidden = true;
  });

  async function afterLogin(){
    loginSection.hidden = true;
    dashboardSection.hidden = false;
    btnLogout.hidden = false;
    // preload list
    try { btnList.click(); } catch {}
  }

  // Check session on load
  (async function init(){
    // Fetch health
    try {
      // Get CSRF token for subsequent POSTs
      try {
        const t = await fetch('/api/admin/csrf');
        if (t.ok) {
          const d = await t.json();
          if (d && d.token) CSRF_TOKEN = d.token;
        }
      } catch {}

      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (healthBox) {
          const set = (k, ok) => {
            const el = healthBox.querySelector(`.health-item[data-key="${k}"] .status`);
            if (el) {
              el.textContent = ok ? 'متصل' : 'نامشخص/تنظیم نشده';
              el.classList.toggle('ok', !!ok);
              el.classList.toggle('bad', !ok);
            }
          };
          set('kv', !!data.kv);
          set('adminEnv', !!data.adminEnv);
          set('secret', !!data.secret);
        }
      }
    } catch {}

    try {
      const me = await api.me();
      if (me && me.authenticated) { afterLogin(); }
    } catch {}
  })();
})();
