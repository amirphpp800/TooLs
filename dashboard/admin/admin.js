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
  const adminHeader = $('.admin-header');

  // Views
  const viewDashboard = $('#view-dashboard');
  const viewKV = $('#view-kv');
  const viewPages = $('#view-pages');
  const viewContacts = $('#view-contacts');
  const viewSponsors = $('#view-sponsors');
  const viewPost = $('#view-post');
  const viewTemplates = $('#view-templates');
  const viewFiles = $('#view-files');
  const viewContentManager = $('#view-content-manager');
  const viewSettings = $('#view-settings');
  
  // Enhanced view switching with animation
  function switchView(viewName) {
    $$('.sidebar-link').forEach(b=>b.classList.remove('active'));
    const targetBtn = $(`.sidebar-link[data-view="${viewName}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    
    // Hide all views
    const allViews = [viewDashboard, viewKV, viewPages, viewContacts, viewSponsors, viewPost, viewTemplates, viewFiles, viewContentManager, viewSettings];
    allViews.forEach(view => {
      if (view) view.hidden = true;
    });
    
    // Show target view
    const viewMap = {
      'dashboard': viewDashboard,
      'kv': viewKV,
      'pages': viewPages,
      'contacts': viewContacts,
      'sponsors': viewSponsors,
      'post': viewPost,
      'templates': viewTemplates,
      'files': viewFiles,
      'content-manager': viewContentManager,
      'settings': viewSettings
    };
    
    const targetView = viewMap[viewName];
    if (targetView) {
      targetView.hidden = false;
      // Load data for specific views
      if (viewName === 'dashboard') loadDashboardData();
      if (viewName === 'content-manager') loadContentManager();
    }
  }
  
  // Make switchView global for onclick handlers
  window.switchView = switchView;
  
  $$('.sidebar-link').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const v = btn.getAttribute('data-view');
      switchView(v);
    });
  });

  // Dashboard data loading
  async function loadDashboardData() {
    try {
      // Load stats
      const articlesData = await api.list('articles/');
      const newsData = await api.list('news/');
      const configsData = await api.list('configs/');
      const filesData = await api.list('uploads/');
      // Users stored by key pattern: user:<telegram_id>
      const usersData = await api.list('user:');
      
      $('#articles-count').textContent = articlesData.keys?.length || 0;
      $('#news-count').textContent = newsData.keys?.length || 0;
      $('#configs-count').textContent = configsData.keys?.length || 0;
      $('#files-count').textContent = filesData.keys?.length || 0;
      const usersCountEl = document.getElementById('users-count');
      if (usersCountEl) usersCountEl.textContent = usersData.keys?.length || 0;
      
      // Load recent activity (simplified)
      const recentList = $('#recent-activity-list');
      recentList.innerHTML = `
        <div class="activity-item">
          <span class="activity-icon">📄</span>
          <span>آخرین بروزرسانی: ${new Date().toLocaleDateString('fa-IR')}</span>
        </div>
        <div class="activity-item">
          <span class="activity-icon">💾</span>
          <span>مجموع محتوا: ${(articlesData.keys?.length || 0) + (newsData.keys?.length || 0)} مورد</span>
        </div>
      `;
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  }

  // Content Manager functionality
  let currentPage = 1;
  let totalPages = 1;
  
  async function loadContentManager() {
    const contentType = $('#content-type-filter')?.value || 'all';
    try {
      // This would use the content API endpoint
      const response = await fetch(`/api/admin/content?type=${contentType}&limit=12&offset=${(currentPage-1)*12}`);
      if (response.ok) {
        const data = await response.json();
        renderContentGrid(data.content);
        updatePagination(data.total, data.limit, data.offset);
      }
    } catch (e) {
      console.error('Error loading content:', e);
      $('#content-grid').innerHTML = '<p class="loading-text">خطا در بارگذاری محتوا</p>';
    }
  }
  
  function renderContentGrid(content) {
    const grid = $('#content-grid');
    if (!content || content.length === 0) {
      grid.innerHTML = '<p class="loading-text">محتوایی برای نمایش وجود ندارد</p>';
      return;
    }
    
    grid.innerHTML = content.map(item => `
      <div class="content-item">
        <div class="content-header">
          <h4>${item.title}</h4>
          <span class="content-type">${getContentTypeLabel(item.type)}</span>
        </div>
        <p class="content-summary">${item.summary || 'بدون خلاصه'}</p>
        <div class="content-meta">
          <span>📅 ${item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
          <span>📊 ${item.status || 'منتشرشده'}</span>
        </div>
        <div class="content-actions">
          <button class="btn btn-xs btn-primary" onclick="editContent('${item.key}')">ویرایش</button>
          <button class="btn btn-xs btn-secondary" onclick="previewContent('${item.key}')">پیش‌نمایش</button>
          <button class="btn btn-xs btn-danger" onclick="deleteContent('${item.key}')">حذف</button>
        </div>
      </div>
    `).join('');
  }
  
  function getContentTypeLabel(type) {
    const labels = {
      'article': '📄 مقاله',
      'news': '📰 خبر',
      'config': '⚙️ کانفیگ',
      'download': '⬇️ دانلود'
    };
    return labels[type] || '📄 نامشخص';
  }
  
  function updatePagination(total, limit, offset) {
    totalPages = Math.ceil(total / limit);
    currentPage = Math.floor(offset / limit) + 1;
    
    const pagination = $('#content-pagination');
    const pageInfo = $('#page-info');
    const prevBtn = $('#btn-prev-page');
    const nextBtn = $('#btn-next-page');
    
    if (totalPages > 1) {
      pagination.style.display = 'flex';
      pageInfo.textContent = `صفحه ${currentPage} از ${totalPages}`;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
    } else {
      pagination.style.display = 'none';
    }
  }
  
  // Content actions
  window.editContent = function(key) {
    // Switch to KV view and load the content
    switchView('kv');
    setTimeout(() => {
      if (kvKey) kvKey.value = key;
      if (btnGet) btnGet.click();
    }, 100);
  };
  
  window.previewContent = async function(key) {
    try {
      const content = await api.get(key);
      const modal = document.createElement('div');
      modal.className = 'content-preview-modal';
      modal.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal">
            <div class="modal-header">
              <h3>پیش‌نمایش: ${key}</h3>
              <button class="modal-close" onclick="this.closest('.content-preview-modal').remove()">×</button>
            </div>
            <div class="modal-body">
              <pre>${content}</pre>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (e) {
      notify('خطا در بارگذاری محتوا', 'error');
    }
  };
  
  window.deleteContent = async function(key) {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید "${key}" را حذف کنید؟`)) return;
    try {
      await api.remove(key);
      notify('محتوا حذف شد', 'success');
      loadContentManager();
    } catch (e) {
      notify('خطا در حذف محتوا', 'error');
    }
  };

  // Settings functionality
  const settingsElements = {
    siteName: $('#site-name'),
    primaryColor: $('#primary-color'),
    searchEnabled: $('#search-enabled'),
    articlesPerPage: $('#articles-per-page'),
    btnSave: $('#btn-save-settings'),
    btnReset: $('#btn-reset-settings')
  };
  
  if (settingsElements.btnSave) {
    settingsElements.btnSave.addEventListener('click', async () => {
      try {
        const settings = {
          siteName: settingsElements.siteName.value,
          primaryColor: settingsElements.primaryColor.value,
          searchEnabled: settingsElements.searchEnabled.value === 'true',
          articlesPerPage: parseInt(settingsElements.articlesPerPage.value)
        };
        
        await api.put('settings/site.json', JSON.stringify(settings, null, 2));
        notify('تنظیمات ذخیره شد', 'success');
      } catch (e) {
        notify('خطا در ذخیره تنظیمات', 'error');
      }
    });
  }
  
  if (settingsElements.btnReset) {
    settingsElements.btnReset.addEventListener('click', () => {
      if (confirm('آیا مطمئن هستید که می‌خواهید تنظیمات را بازنشانی کنید؟')) {
        settingsElements.siteName.value = 'Pro TooLs';
        settingsElements.primaryColor.value = '#bdbdbd';
        settingsElements.searchEnabled.value = 'true';
        settingsElements.articlesPerPage.value = '10';
        notify('تنظیمات بازنشانی شد', 'success');
      }
    });
  }

  // Event listeners for new functionality
  if ($('#btn-load-content')) {
    $('#btn-load-content').addEventListener('click', loadContentManager);
  }
  
  if ($('#btn-refresh-content')) {
    $('#btn-refresh-content').addEventListener('click', () => {
      currentPage = 1;
      loadContentManager();
    });
  }
  
  if ($('#btn-prev-page')) {
    $('#btn-prev-page').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadContentManager();
      }
    });
  }
  
  if ($('#btn-next-page')) {
    $('#btn-next-page').addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadContentManager();
      }
    });
  }

  // KV Controls
  const prefixInput = $('#prefix');
  const btnList = $('#btn-list');
  const kvKey = $('#kv-key');
  const btnGet = $('#btn-get');
  const btnDelete = $('#btn-delete');
  const btnPut = $('#btn-put');
  const kvList = $('#kv-list');
  const kvValue = $('#kv-value');
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
      return `<!DOCTYPE html>\n<html lang="fa" dir="rtl">\n<head>\n  <meta charset="UTF-8"/>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n  <title>صفحه جدید</title>\n  <link rel=\"stylesheet\" href=\"/styles.css\"/>\n</head>\n<body>\n  <div class=\"section\">\n    <div class=\"container\">\n      <h1 class=\"section-title\">صفحه جدید</h1>\n      <p class=\"section-subtitle\">محتوای خود را اینجا قرار دهید.</p>\n    </div>\n  </div>\n  <script src=\"/script.js\"></script>\n</body>\n</html>`;
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
    showLoginOnly();
  });

  async function afterLogin(){
    loginSection.style.display = 'none';
    dashboardSection.classList.remove('hidden');
    dashboardSection.style.display = 'grid';
    btnLogout.hidden = false;
    if (adminHeader) adminHeader.style.display = 'flex';
    
    // Show dashboard by default
    switchView('dashboard');
    
    // preload list for KV section
    try { btnList.click(); } catch {}
  }

  function showLoginOnly(){
    loginSection.style.display = 'block';
    dashboardSection.classList.add('hidden');
    dashboardSection.style.display = 'none';
    btnLogout.hidden = true;
    if (adminHeader) adminHeader.style.display = 'none';
  }

  // Template Management
  window.applyTemplate = function(templateType) {
    const templates = {
      article: {
        key: `articles/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/new-article.json`,
        content: JSON.stringify({
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
        }, null, 2)
      },
      news: {
        key: `news/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/news-${Date.now()}.json`,
        content: JSON.stringify({
          title: "عنوان خبر یا اطلاعیه",
          summary: "خلاصه کوتاه خبر",
          body: "متن کامل خبر یا اطلاعیه را اینجا بنویسید.",
          type: "news",
          priority: "normal",
          publishedAt: new Date().toISOString(),
          expiresAt: null
        }, null, 2)
      },
      config: {
        key: `configs/${Date.now()}.json`,
        content: JSON.stringify({
          name: "کانفیگ جدید",
          type: "vpn",
          description: "توضیحات کانفیگ",
          config: "# کانفیگ شما اینجا\n",
          instructions: "راهنمای استفاده از کانفیگ",
          tags: ["vpn", "config"],
          createdAt: new Date().toISOString()
        }, null, 2)
      },
      download: {
        key: `downloads/${Date.now()}.json`,
        content: JSON.stringify({
          title: "نام نرم‌افزار",
          description: "توضیحات نرم‌افزار",
          version: "1.0.0",
          downloadUrl: "https://example.com/download",
          fileSize: "10 MB",
          requirements: "ویندوز 10 یا بالاتر",
          screenshots: [],
          features: ["ویژگی اول", "ویژگی دوم"],
          publishedAt: new Date().toISOString()
        }, null, 2)
      }
    };

    const template = templates[templateType];
    if (template && kvKey && kvValue) {
      kvKey.value = template.key;
      kvValue.value = template.content;
      notify(`تمپلیت ${templateType} اعمال شد`, 'success');
      
      // Switch to KV view
      const kvLink = document.querySelector('[data-view="kv"]');
      if (kvLink) kvLink.click();
    }
  };

  // File Management
  const fileUpload = $('#file-upload');
  const btnUpload = $('#btn-upload');
  const uploadArea = $('#upload-area');
  const filesList = $('#files-list');

  if (btnUpload) {
    btnUpload.addEventListener('click', () => {
      fileUpload?.click();
    });
  }

  if (uploadArea) {
    uploadArea.addEventListener('click', () => {
      fileUpload?.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    });
  }

  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      handleFiles(files);
    });
  }

  function handleFiles(files) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        displayFile(file, content);
      };
      
      if (file.type.startsWith('text/') || file.name.endsWith('.json') || file.name.endsWith('.html') || file.name.endsWith('.css') || file.name.endsWith('.js')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  }

  function displayFile(file, content) {
    if (!filesList) return;

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileIcon = getFileIcon(file.type, file.name);
    const fileSize = formatFileSize(file.size);
    
    fileItem.innerHTML = `
      <div class="file-info">
        <div class="file-icon">${fileIcon}</div>
        <div class="file-details">
          <h4>${file.name}</h4>
          <small>${fileSize} • ${file.type || 'نامشخص'}</small>
        </div>
      </div>
      <div class="file-actions">
        <button class="btn btn-xs" onclick="useAsContent('${file.name}', \`${content.replace(/`/g, '\\`')}\`)">استفاده</button>
        <button class="btn btn-xs btn-primary" onclick="saveToKV('${file.name}', \`${content.replace(/`/g, '\\`')}\`)">ذخیره در KV</button>
      </div>
    `;
    
    filesList.appendChild(fileItem);
  }

  function getFileIcon(type, name) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('text/') || name.endsWith('.txt')) return '📄';
    if (name.endsWith('.json')) return '📋';
    if (name.endsWith('.html')) return '🌐';
    if (name.endsWith('.css')) return '🎨';
    if (name.endsWith('.js')) return '⚡';
    if (name.endsWith('.md')) return '📝';
    return '📁';
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  window.useAsContent = function(fileName, content) {
    if (kvValue) {
      kvValue.value = content;
      notify(`محتوای ${fileName} در ویرایشگر قرار گرفت`, 'success');
      
      // Switch to KV view
      const kvLink = document.querySelector('[data-view="kv"]');
      if (kvLink) kvLink.click();
    }
  };

  window.saveToKV = async function(fileName, content) {
    try {
      const key = `uploads/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${fileName}`;
      await api.put(key, content);
      notify(`${fileName} در KV ذخیره شد`, 'success');
    } catch(e) {
      notify(`خطا در ذخیره ${fileName}`, 'error');
    }
  };

  // Enhanced notification system
  function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const content = document.querySelector('.content');
    if (content) {
      content.insertBefore(message, content.firstChild);
      setTimeout(() => message.remove(), 5000);
    }
  }

  // Button ripple effect (matching main site)
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  });

  // Enhanced notification system with better styling
  function showAdvancedNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.admin-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 
                  type === 'error' ? 'rgba(239, 83, 80, 0.9)' : 
                  type === 'warning' ? 'rgba(255, 152, 0, 0.9)' : 
                  'rgba(189, 189, 189, 0.9)',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      animation: 'slideInDown 0.3s ease',
      fontFamily: "'DanaFaNum', 'Tahoma', 'Arial', sans-serif"
    });

    document.body.appendChild(notification);

    // Auto remove
    setTimeout(() => {
      notification.style.animation = 'slideOutUp 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  // Override the existing notify function
  function notify(msg, type='info') {
    showAdvancedNotification(msg, type);
  }

  // Check session on load
  (async function init(){
    // Ensure login screen is shown initially
    showLoginOnly();
    
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
      if (me && me.authenticated) { 
        afterLogin(); 
      }
      // If not authenticated, login screen is already shown
    } catch {
      // Login screen is already shown
    }
  })();

  // Scanner Management Module
  const scannerManager = {
    // Quick Add IPv4 Servers Modal methods (moved from api)
    async showServersModal() {
      const modal = $('#servers-modal');
      await this.populateCountrySelect();
      // Reset custom fields visibility
      const wrapCode = document.getElementById('servers-custom-code-wrap');
      const wrapName = document.getElementById('servers-custom-name-wrap');
      if (wrapCode) wrapCode.style.display = 'none';
      if (wrapName) wrapName.style.display = 'none';
      if (modal) modal.style.display = 'flex';
    },
    hideServersModal() {
      const modal = $('#servers-modal');
      if (modal) modal.style.display = 'none';
    },
    isIPv4(addr) {
      const re = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
      return re.test(addr);
    },
    async addIPv4Servers({ code, name, list }) {
      const cc = (code||'').toUpperCase().trim();
      if (!cc || cc.length !== 2) throw new Error('کد کشور نامعتبر است');
      const serversFromForm = (list||'')
        .split('\n')
        .map(s=>s.trim())
        .filter(Boolean)
        .filter(s=>this.isIPv4(s));
      if (!serversFromForm.length) throw new Error('هیچ IPv4 معتبری وارد نشده است');
      const data = await this.loadCountries();
      data.countries = data.countries || [];
      const idx = data.countries.findIndex(c=>c.code === cc);
      if (idx >= 0) {
        const c = data.countries[idx];
        const merged = Array.from(new Set([...(c.servers||[]), ...serversFromForm]));
        c.servers = merged;
        c.total = merged.length;
        c.available = Math.min(c.available||0, c.total);
        if (name && name.trim()) c.name = name.trim();
        data.countries[idx] = c;
      } else {
        const countryName = (name||'').trim() || cc;
        const merged = Array.from(new Set(serversFromForm));
        data.countries.push({ code: cc, name: countryName, total: merged.length, available: merged.length, servers: merged });
      }
      await this.saveCountries(data);
      await this.refreshData();
    },
    countryCatalog() {
      // Minimal yet practical catalog with Persian names
      return [
        { code: 'IR', name: 'ایران' },
        { code: 'TR', name: 'ترکیه' },
        { code: 'AE', name: 'امارات متحده عربی' },
        { code: 'SA', name: 'عربستان سعودی' },
        { code: 'QA', name: 'قطر' },
        { code: 'OM', name: 'عمان' },
        { code: 'BH', name: 'بحرین' },
        { code: 'IQ', name: 'عراق' },
        { code: 'JO', name: 'اردن' },
        { code: 'LB', name: 'لبنان' },
        { code: 'EG', name: 'مصر' },
        { code: 'US', name: 'ایالات متحده آمریکا' },
        { code: 'CA', name: 'کانادا' },
        { code: 'GB', name: 'انگلستان' },
        { code: 'DE', name: 'آلمان' },
        { code: 'FR', name: 'فرانسه' },
        { code: 'IT', name: 'ایتالیا' },
        { code: 'ES', name: 'اسپانیا' },
        { code: 'NL', name: 'هلند' },
        { code: 'SE', name: 'سوئد' },
        { code: 'NO', name: 'نروژ' },
        { code: 'FI', name: 'فنلاند' },
        { code: 'RU', name: 'روسیه' },
        { code: 'IN', name: 'هند' },
        { code: 'PK', name: 'پاکستان' },
        { code: 'CN', name: 'چین' },
        { code: 'JP', name: 'ژاپن' },
        { code: 'KR', name: 'کره جنوبی' },
        { code: 'SG', name: 'سنگاپور' },
        { code: 'HK', name: 'هنگ کنگ' },
        { code: 'AU', name: 'استرالیا' },
        { code: 'NZ', name: 'نیوزیلند' },
        { code: 'BR', name: 'برزیل' },
        { code: 'AR', name: 'آرژانتین' },
        { code: 'MX', name: 'مکزیک' },
        { code: 'ZA', name: 'آفریقای جنوبی' }
      ];
    },
    async populateCountrySelect() {
      const sel = document.getElementById('servers-country-select');
      if (!sel) return;
      // Clear all options except the first (placeholder) and last (custom)
      const placeholder = sel.querySelector('option[value=""]');
      const custom = sel.querySelector('option[value="custom"]');
      sel.innerHTML = '';
      if (placeholder) sel.appendChild(placeholder);

      // Merge catalog with existing data from KV
      let existing = [];
      try {
        const data = await this.loadCountries();
        existing = (data.countries||[]).map(c=>({ code: c.code, name: c.name }));
      } catch {}
      const catalog = this.countryCatalog();
      const map = new Map();
      [...catalog, ...existing].forEach(c => {
        if (c?.code) map.set(c.code.toUpperCase(), { code: c.code.toUpperCase(), name: c.name || c.code.toUpperCase() });
      });
      // Sort alphabetically by Persian name
      const list = Array.from(map.values()).sort((a,b)=> (a.name||'').localeCompare(b.name||'', 'fa'));
      list.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.name} (${c.code})`;
        opt.setAttribute('data-name', c.name);
        sel.appendChild(opt);
      });
      if (custom) sel.appendChild(custom);
      sel.selectedIndex = 0; // placeholder
    },
    async loadCountries() {
      try {
        const data = await api.get('scanner/countries.json');
        return JSON.parse(data);
      } catch (e) {
        console.warn('No scanner countries data found, using defaults');
        return {
          countries: [
            { code: 'GB', name: 'انگلستان', total: 25, available: 18, servers: ['1.1.1.1', '8.8.8.8'] },
            { code: 'DE', name: 'آلمان', total: 30, available: 22, servers: ['9.9.9.9', '1.0.0.1'] }
          ]
        };
      }
    },

    async saveCountries(data) {
      await api.put('scanner/countries.json', JSON.stringify(data, null, 2));
    },

    async loadAllocations() {
      try {
        const data = await api.get('scanner/allocations.json');
        return JSON.parse(data);
      } catch (e) {
        return { allocations: [] };
      }
    },

    flagEmoji(cc) {
      if (!cc || cc.length !== 2) return '🌐';
      const codePoints = [...cc.toUpperCase()].map(c => 0x1F1E6 - 'A'.charCodeAt(0) + c.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    },

    renderCountries(countries) {
      const container = $('#countries-list');
      if (!container) return;

      const fragment = document.createDocumentFragment();
      
      countries.forEach(country => {
        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
          <div class="country-header">
            <div class="country-flag">
              <img src="https://flagcdn.com/w80/${country.code.toLowerCase()}.png" 
                   alt="${country.name} flag" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <div style="display:none; font-size:24px;">${this.flagEmoji(country.code)}</div>
            </div>
            <div class="country-info">
              <h4>${country.name}</h4>
              <small>${country.code}</small>
            </div>
          </div>
          <div class="country-stats">
            <div class="country-stat">
              <span class="number">${country.total || 0}</span>
              <span class="label">کل</span>
            </div>
            <div class="country-stat available">
              <span class="number">${country.available || 0}</span>
              <span class="label">آزاد</span>
            </div>
            <div class="country-stat allocated">
              <span class="number">${(country.total || 0) - (country.available || 0)}</span>
              <span class="label">تخصیص‌یافته</span>
            </div>
          </div>
          <div class="country-actions">
            <button class="btn btn-xs btn-secondary" onclick="scannerManager.editCountry('${country.code}')">ویرایش</button>
            <button class="btn btn-xs btn-danger" onclick="scannerManager.deleteCountry('${country.code}')">حذف</button>
          </div>
        `;
        fragment.appendChild(card);
      });

      container.innerHTML = '';
      container.appendChild(fragment);
    },

    updateStats(countries) {
      const totalCountries = countries.length;
      const totalServers = countries.reduce((sum, c) => sum + (c.total || 0), 0);
      const availableServers = countries.reduce((sum, c) => sum + (c.available || 0), 0);
      const allocatedServers = totalServers - availableServers;

      const updateStat = (id, value) => {
        const el = $(id);
        if (el) el.textContent = value;
      };

      updateStat('#total-countries', totalCountries);
      updateStat('#total-servers', totalServers);
      updateStat('#available-servers', availableServers);
      updateStat('#allocated-servers', allocatedServers);
    },

    async refreshData() {
      try {
        const data = await this.loadCountries();
        this.renderCountries(data.countries || []);
        this.updateStats(data.countries || []);
      } catch (e) {
        console.error('Error refreshing scanner data:', e);
        alert('خطا در بارگذاری داده‌ها');
      }
    },

    showCountryModal(country = null) {
      const modal = $('#country-modal');
      const title = $('#country-modal-title');
      const form = $('#country-form');
      
      if (!modal || !form) return;

      // Reset form
      form.reset();
      
      if (country) {
        title.textContent = 'ویرایش کشور';
        $('#country-code').value = country.code;
        $('#country-name').value = country.name;
        $('#country-total').value = country.total || 0;
        $('#country-available').value = country.available || 0;
        $('#country-servers').value = (country.servers || []).join('\n');
      } else {
        title.textContent = 'افزودن کشور جدید';
      }

      modal.style.display = 'flex';
    },

    hideCountryModal() {
      const modal = $('#country-modal');
      if (modal) modal.style.display = 'none';
    },

    async editCountry(countryCode) {
      try {
        const data = await this.loadCountries();
        const country = data.countries.find(c => c.code === countryCode);
        if (country) {
          this.showCountryModal(country);
        }
      } catch (e) {
        console.error('Error loading country for edit:', e);
      }
    },

    async deleteCountry(countryCode) {
      if (!confirm(`آیا از حذف کشور ${countryCode} اطمینان دارید؟`)) return;

      try {
        const data = await this.loadCountries();
        data.countries = data.countries.filter(c => c.code !== countryCode);
        await this.saveCountries(data);
        await this.refreshData();
        alert('کشور با موفقیت حذف شد');
      } catch (e) {
        console.error('Error deleting country:', e);
        alert('خطا در حذف کشور');
      }
    },

    async saveCountry(formData) {
      try {
        const data = await this.loadCountries();
        const countryIndex = data.countries.findIndex(c => c.code === formData.code);
        
        const servers = formData.servers
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        const countryData = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          total: parseInt(formData.total) || 0,
          available: parseInt(formData.available) || 0,
          servers: servers
        };

        if (countryIndex >= 0) {
          data.countries[countryIndex] = countryData;
        } else {
          data.countries.push(countryData);
        }

        await this.saveCountries(data);
        await this.refreshData();
        this.hideCountryModal();
        alert('کشور با موفقیت ذخیره شد');
      } catch (e) {
        console.error('Error saving country:', e);
        alert('خطا در ذخیره کشور');
      }
    },

    init() {
      // Refresh button
      const refreshBtn = $('#btn-scanner-refresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.refreshData());
      }

      // Add country button
      const addBtn = $('#btn-add-country');
      if (addBtn) {
        addBtn.addEventListener('click', () => this.showCountryModal());
      }

      // Quick add servers button
      const addServersBtn = $('#btn-add-servers');
      if (addServersBtn) {
        addServersBtn.addEventListener('click', () => this.showServersModal());
      }

      // Servers modal controls
      const serversClose = $('#servers-modal-close');
      const serversCancel = $('#servers-cancel');
      if (serversClose) serversClose.addEventListener('click', () => this.hideServersModal());
      if (serversCancel) serversCancel.addEventListener('click', () => this.hideServersModal());

      // Autofill country name if code exists (manual code entry)
      const codeInput = $('#servers-country-code');
      if (codeInput) {
        codeInput.addEventListener('input', async () => {
          const cc = codeInput.value.toUpperCase();
          try {
            const data = await this.loadCountries();
            const found = (data.countries||[]).find(c=>c.code === cc);
            if (found) {
              const nameInput = $('#servers-country-name');
              if (nameInput) nameInput.value = found.name || '';
            }
          } catch {}
        });
      }

      // Country select change handler (show/hide custom code/name)
      const selCountry = document.getElementById('servers-country-select');
      const customCodeWrap = document.getElementById('servers-custom-code-wrap');
      const customNameWrap = document.getElementById('servers-custom-name-wrap');
      const codeInputEl = document.getElementById('servers-country-code');
      const nameInputEl = document.getElementById('servers-country-name');
      if (selCountry) {
        selCountry.addEventListener('change', () => {
          const v = selCountry.value;
          if (v === 'custom') {
            if (customCodeWrap) customCodeWrap.style.display = '';
            if (customNameWrap) customNameWrap.style.display = '';
            if (codeInputEl) codeInputEl.value = '';
            if (nameInputEl) nameInputEl.value = '';
          } else {
            if (customCodeWrap) customCodeWrap.style.display = 'none';
            if (customNameWrap) customNameWrap.style.display = 'none';
            if (codeInputEl) codeInputEl.value = v;
            const opt = selCountry.selectedOptions?.[0];
            const nm = opt?.getAttribute('data-name') || '';
            if (nameInputEl) nameInputEl.value = nm;
          }
        });
      }

      // Servers form submission
      const serversForm = document.getElementById('servers-form');
      if (serversForm) {
        serversForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          let code = '';
          let name = '';
          if (selCountry && selCountry.value && selCountry.value !== 'custom') {
            code = selCountry.value;
            name = selCountry.selectedOptions?.[0]?.getAttribute('data-name') || '';
          } else {
            code = document.getElementById('servers-country-code')?.value || '';
            name = document.getElementById('servers-country-name')?.value || '';
          }
          const list = document.getElementById('servers-list')?.value?.trim() || '';
          try {
            await this.addIPv4Servers({ code, name, list });
            this.hideServersModal();
            alert('آدرس‌ها افزوده و ذخیره شد');
          } catch (err) {
            alert(err?.message || 'خطا در افزودن آدرس‌ها');
          }
        });
      }

      // Modal close buttons
      const closeBtn = $('#country-modal-close');
      const cancelBtn = $('#country-cancel');
      if (closeBtn) closeBtn.addEventListener('click', () => this.hideCountryModal());
      if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideCountryModal());

      // Country form submission
      const form = $('#country-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const formData = {
            code: $('#country-code').value.trim(),
            name: $('#country-name').value.trim(),
            total: $('#country-total').value,
            available: $('#country-available').value,
            servers: $('#country-servers').value.trim()
          };
          
          if (!formData.code || !formData.name) {
            alert('لطفاً کد و نام کشور را وارد کنید');
            return;
          }
          
          this.saveCountry(formData);
        });
      }

      // Load initial data when scanner view is shown
      const scannerView = $('#view-scanner');
      if (scannerView) {
        // Use MutationObserver to detect when scanner view becomes visible
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
              if (!scannerView.hasAttribute('hidden')) {
                this.refreshData();
              }
            }
          });
        });
        observer.observe(scannerView, { attributes: true });
      }
    }
  };

  // Initialize scanner manager when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scannerManager.init());
  } else {
    scannerManager.init();
  }

  // Make scannerManager globally available
  window.scannerManager = scannerManager;
})();
