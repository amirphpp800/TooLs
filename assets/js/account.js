(function(){
  'use strict';
  const $ = (s, c=document)=>c.querySelector(s);

  const apiBase = ()=> (window.APP_CONFIG?.CF_API_BASE || '').replace(/\/$/, '');
  const status = $('#auth-status');

  function setToken(token){ localStorage.setItem('auth_token', token); }
  function getToken(){ return localStorage.getItem('auth_token') || ''; }
  function clearToken(){ localStorage.removeItem('auth_token'); }

  function maskId(id){ return id ? id.slice(0,3) + '••••••' + id.slice(-3) : '******'; }

  async function loadProfile(){
    try {
      const base = apiBase(); 
      if (!base) {
        // Demo mode - show dashboard with sample data
        showDashboard({
          telegram_id: '123456789',
          name: 'کاربر نمونه',
          plan: 'پلن طلایی',
          downloads: 15,
          configs: 3,
          days_left: 25,
          traffic_used: '2.5 GB'
        });
        return;
      }
      
      const token = getToken(); 
      if (!token) return;
      
      const res = await fetch(`${base}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      showDashboard(data?.user || {});
    } catch (e){ 
      console.warn('profile load failed', e); 
      // Show demo dashboard on error
      showDashboard({
        telegram_id: '123456789',
        name: 'کاربر نمونه',
        plan: 'پلن پایه',
        downloads: 5,
        configs: 1,
        days_left: '∞',
        traffic_used: '0.8 GB'
      });
    }
  }

  function showDashboard(user = {}){
    // Hide login section and show dashboard
    const loginSection = $('#login-section');
    const dashboardSection = $('#dashboard-section');
    
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    
    // Update user info
    const userName = $('#user-name');
    const userId = $('#user-id');
    const userPlan = $('#user-plan');
    
    if (userName) userName.textContent = user.name || 'کاربر گرامی';
    if (userId) userId.textContent = `ID: ${maskId(user.telegram_id)}`;
    if (userPlan) userPlan.textContent = user.plan || 'پلن پایه';
    
    // Update stats
    const downloadCount = $('#download-count');
    const configCount = $('#config-count');
    const daysLeft = $('#days-left');
    const trafficUsed = $('#traffic-used');
    
    if (downloadCount) downloadCount.textContent = user.downloads || '0';
    if (configCount) configCount.textContent = user.configs || '0';
    if (daysLeft) daysLeft.textContent = user.days_left || '∞';
    if (trafficUsed) trafficUsed.textContent = user.traffic_used || '0 GB';
    
    // Animate stats with counter effect
    animateStats();
  }

  function animateStats() {
    const stats = ['download-count', 'config-count'];
    stats.forEach(id => {
      const el = $(`#${id}`);
      if (!el) return;
      
      const target = parseInt(el.textContent) || 0;
      let current = 0;
      const increment = Math.ceil(target / 20);
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current;
      }, 50);
    });
  }

  async function requestCode(){
    const base = apiBase(); if (!base) return alert('CF_API_BASE تنظیم نشده است.');
    const id = ($('#tg-id').value||'').trim();
    if (!/^\d+$/.test(id)) return alert('شناسه عددی تلگرام را صحیح وارد کنید.');
    const res = await fetch(`${base}/api/auth/request`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ telegram_id: id }) });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) return alert(data?.error || 'ارسال کد ناموفق بود.');
    status.textContent = 'کد ارسال شد. تلگرام خود را بررسی کنید.';
    $('#otp-section').style.display = 'block';
  }

  async function verify(){
    const base = apiBase(); 
    if (!base) {
      // Demo mode - simulate successful login
      const id = ($('#tg-id').value||'').trim();
      const code = ($('#otp').value||'').trim();
      if (!/^\d{4}$/.test(code)) return alert('کد ۴ رقمی را صحیح وارد کنید.');
      
      setToken('demo_token_' + Date.now());
      status.textContent = 'حساب تایید شد.';
      loadProfile();
      return;
    }
    
    const id = ($('#tg-id').value||'').trim();
    const code = ($('#otp').value||'').trim();
    if (!/^\d{4}$/.test(code)) return alert('کد ۴ رقمی را صحیح وارد کنید.');
    const res = await fetch(`${base}/api/auth/verify`, { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ telegram_id:id, code }) });
    const data = await res.json().catch(()=>({}));
    if (!res.ok || !data?.token) return alert(data?.error || 'تایید ناموفق بود.');
    setToken(data.token);
    status.textContent = 'حساب تایید شد.';
    loadProfile();
  }

  function updateState(){
    const token = getToken();
    const loginSection = $('#login-section');
    const dashboardSection = $('#dashboard-section');
    
    if (token) {
      if (loginSection) loginSection.style.display = 'none';
      if (dashboardSection) dashboardSection.style.display = 'block';
      loadProfile();
    } else {
      if (loginSection) loginSection.style.display = 'block';
      if (dashboardSection) dashboardSection.style.display = 'none';
      $('#otp-section').style.display = 'none';
    }
  }

  function logout(){
    clearToken();
    const loginSection = $('#login-section');
    const dashboardSection = $('#dashboard-section');
    
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
    
    status.textContent = 'خروج انجام شد.';
    
    // Reset form
    $('#tg-id').value = '';
    $('#otp').value = '';
    $('#otp-section').style.display = 'none';
  }

  function setupDashboardActions() {
    // Get config button
    const getConfigBtn = $('#btn-get-config');
    if (getConfigBtn) {
      getConfigBtn.addEventListener('click', () => {
        alert('کانفیگ جدید در حال آماده‌سازی است...\nبه زودی از طریق تلگرام ارسال می‌شود.');
      });
    }
    
    // Demo mode message
    setTimeout(() => {
      const base = apiBase();
      if (!base && status) {
        status.innerHTML = '<small style="color: var(--muted);">حالت نمایشی - برای اتصال به API، CF_API_BASE را تنظیم کنید</small>';
      }
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    $('#btn-request-code')?.addEventListener('click', requestCode);
    $('#btn-verify')?.addEventListener('click', verify);
    
    // Demo dashboard button
    $('#btn-demo')?.addEventListener('click', () => {
      setToken('demo_token_preview');
      loadProfile();
    });
    
    // Handle both logout buttons (in login and dashboard sections)
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-logout') {
        logout();
      }
    });
    
    setupDashboardActions();
    updateState();
  });
})();
