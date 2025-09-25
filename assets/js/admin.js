(function(){
  'use strict';
  const $ = (s, c=document)=>c.querySelector(s);

  const apiBase = ()=> (window.APP_CONFIG?.CF_API_BASE || '').replace(/\/$/, '');
  let adminToken = '';
  let currentCountry = 'uk'; // Default to UK

  async function getJSON(url, opts={}){
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  // KV Storage functions
  async function saveToKV(key, value) {
    const base = apiBase();
    if (!base) {
      // Demo mode - use localStorage
      localStorage.setItem(`kv_${key}`, JSON.stringify(value));
      return;
    }
    
    if (!adminToken) throw new Error('Admin token required');
    
    await getJSON(`${base}/api/kv/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(value)
    });
  }

  async function getFromKV(key) {
    const base = apiBase();
    if (!base) {
      // Demo mode - use localStorage
      const data = localStorage.getItem(`kv_${key}`);
      return data ? JSON.parse(data) : null;
    }
    
    try {
      return await getJSON(`${base}/api/kv/${key}`);
    } catch (e) {
      return null;
    }
  }

  async function deleteFromKV(key) {
    const base = apiBase();
    if (!base) {
      // Demo mode - use localStorage
      localStorage.removeItem(`kv_${key}`);
      return;
    }
    
    if (!adminToken) throw new Error('Admin token required');
    
    await fetch(`${base}/api/kv/${key}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  }

  // Scanner address management
  async function loadAddresses() {
    try {
      const addresses = await getFromKV(`scanner_addresses_${currentCountry}`) || [];
      const usedAddresses = await getFromKV(`used_addresses_${currentCountry}`) || [];
      
      updateAddressesList(addresses, usedAddresses);
      updateStats(addresses, usedAddresses);
    } catch (e) {
      console.error('Error loading addresses:', e);
      $('#addresses-list').innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">خطا در بارگذاری آدرس‌ها</div>';
    }
  }

  function updateAddressesList(addresses, usedAddresses) {
    const container = $('#addresses-list');
    if (!addresses.length) {
      container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">آدرسی موجود نیست</div>';
      return;
    }

    const html = addresses.map((addr, index) => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; border-bottom:1px solid var(--stroke);">
        <span style="font-family:monospace; color:var(--text);">${addr}</span>
        <button class="btn" style="padding:4px 8px; font-size:0.8rem;" onclick="removeAddress(${index})">حذف</button>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  function updateStats(addresses, usedAddresses) {
    $('#total-addresses').textContent = addresses.length + usedAddresses.length;
    $('#used-addresses').textContent = usedAddresses.length;
    $('#remaining-addresses').textContent = addresses.length;
  }

  async function addAddresses() {
    const input = $('#addresses-input').value.trim();
    if (!input) return alert('آدرس‌هایی را وارد کنید');

    const newAddresses = input.split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes(':'));

    if (!newAddresses.length) {
      return alert('آدرس معتبری یافت نشد. فرمت: IP:PORT');
    }

    try {
      const existingAddresses = await getFromKV(`scanner_addresses_${currentCountry}`) || [];
      const allAddresses = [...existingAddresses, ...newAddresses];
      
      await saveToKV(`scanner_addresses_${currentCountry}`, allAddresses);
      
      $('#addresses-input').value = '';
      loadAddresses();
      
      alert(`${newAddresses.length} آدرس اضافه شد`);
    } catch (e) {
      console.error('Error adding addresses:', e);
      alert('خطا در اضافه کردن آدرس‌ها');
    }
  }

  async function clearAddresses() {
    if (!confirm('آیا مطمئن هستید که می‌خواهید همه آدرس‌ها را پاک کنید؟')) return;

    try {
      await deleteFromKV(`scanner_addresses_${currentCountry}`);
      await deleteFromKV(`used_addresses_${currentCountry}`);
      
      loadAddresses();
      alert('همه آدرس‌ها پاک شدند');
    } catch (e) {
      console.error('Error clearing addresses:', e);
      alert('خطا در پاک کردن آدرس‌ها');
    }
  }

  // Make removeAddress global so it can be called from HTML
  window.removeAddress = async function(index) {
    try {
      const addresses = await getFromKV(`scanner_addresses_${currentCountry}`) || [];
      addresses.splice(index, 1);
      await saveToKV(`scanner_addresses_${currentCountry}`, addresses);
      loadAddresses();
    } catch (e) {
      console.error('Error removing address:', e);
      alert('خطا در حذف آدرس');
    }
  }

  function onCountryChange() {
    currentCountry = $('#country-select').value;
    loadAddresses();
  }

  // Admin Login: send 5-digit OTP
  async function adminSend(){
    const base = apiBase(); 
    if (!base) {
      // Demo mode - validate inputs first
      const u = ($('#adm-user').value||'').trim();
      const p = ($('#adm-pass').value||'').trim();
      const id = ($('#adm-id').value||'').trim();
      
      if (!u || !p || !id) {
        $('#adm-status').textContent = 'لطفاً تمام فیلدها را پر کنید.';
        return;
      }
      
      if (!/^\d+$/.test(id)) {
        $('#adm-status').textContent = 'آیدی تلگرام باید فقط شامل اعداد باشد.';
        return;
      }
      
      $('#adm-status').textContent = 'حالت نمایشی - کد ارسال شد. کد نمونه: 12345';
      $('#admin-otp-section').style.display = 'block';
      return;
    }
    
    const u = ($('#adm-user').value||'');
    const p = ($('#adm-pass').value||'');
    const id = ($('#adm-id').value||'').trim();
    if (!u || !p || !/^\d+$/.test(id)) {
      $('#adm-status').textContent = 'نام کاربری، رمز و آیدی عددی را درست وارد کنید.';
      return;
    }
    
    try {
      const h = 'Basic ' + btoa(`${u}:${p}`);
      const res = await fetch(`${base}/api/admin/login`, { method:'POST', headers: { 'Authorization': h, 'Content-Type':'application/json' }, body: JSON.stringify({ admin_id: id }) });
      const data = await res.json().catch(()=>({}));
      $('#adm-status').textContent = res.ok ? 'کد ارسال شد.' : (data?.error || 'خطا در ارسال کد');
      if (res.ok) $('#admin-otp-section').style.display = 'block';
    } catch (error) {
      $('#adm-status').textContent = 'خطا در برقراری ارتباط با سرور.';
    }
  }

  // Admin Verify: get bearer token
  async function adminVerify(){
    const base = apiBase(); 
    if (!base) {
      // Demo mode
      const code = ($('#adm-otp').value||'').trim();
      if (!/^\d{5}$/.test(code)) return alert('کد ۵ رقمی را درست وارد کنید.');
      
      adminToken = 'demo_admin_token';
      $('#adm-status').textContent = 'ورود ادمین موفق بود.';
      showAdminDashboard();
      return;
    }
    
    const id = ($('#adm-id').value||'').trim();
    const code = ($('#adm-otp').value||'').trim();
    if (!/^\d{5}$/.test(code)) return alert('کد ۵ رقمی را درست وارد کنید.');
    const res = await fetch(`${base}/api/admin/verify`, { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ admin_id: id, code }) });
    const data = await res.json().catch(()=>({}));
    if (res.ok && data?.token){ 
      adminToken = data.token; 
      $('#adm-status').textContent = 'ورود ادمین موفق بود.'; 
      showAdminDashboard();
    }
    else { $('#adm-status').textContent = data?.error || 'کد نامعتبر است.'; }
  }

  function showAdminDashboard() {
    // Hide login section and show dashboard
    const loginSection = document.querySelector('#admin-page > div');
    const dashboardSection = $('#admin-dashboard');
    
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) {
      dashboardSection.style.display = 'block';
      loadAddresses(); // Load addresses for default country
    }
  }

  // Initialize demo data for UK
  async function initializeDemoData() {
    const base = apiBase();
    if (base) return; // Only for demo mode
    
    const demoAddresses = [
      '185.199.108.153:443',
      '185.199.109.153:443',
      '185.199.110.153:443',
      '185.199.111.153:443'
    ];
    
    const existing = await getFromKV('scanner_addresses_uk');
    if (!existing || existing.length === 0) {
      await saveToKV('scanner_addresses_uk', demoAddresses);
    }
  }

  // System Status Check
  async function checkSystemStatus() {
    // Check KV Storage
    await checkKVStatus();
    
    // Check API Connection
    await checkAPIStatus();
    
    // Check Environment Variables
    checkENVStatus();
  }

  async function checkKVStatus() {
    const indicator = $('#kv-indicator');
    const text = $('#kv-text');
    
    try {
      // Try to read/write a test value
      await saveToKV('test_connection', { timestamp: Date.now() });
      const testData = await getFromKV('test_connection');
      
      if (testData && testData.timestamp) {
        setStatus(indicator, text, 'online', 'متصل');
      } else {
        setStatus(indicator, text, 'warning', 'مشکوک');
      }
    } catch (error) {
      setStatus(indicator, text, 'offline', 'قطع');
    }
  }

  async function checkAPIStatus() {
    const indicator = $('#api-indicator');
    const text = $('#api-text');
    const base = apiBase();
    
    if (!base) {
      setStatus(indicator, text, 'warning', 'حالت نمایشی');
      return;
    }
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${base}/api/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setStatus(indicator, text, 'online', 'متصل');
      } else {
        setStatus(indicator, text, 'warning', `خطا ${response.status}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setStatus(indicator, text, 'offline', 'تایم‌اوت');
      } else {
        setStatus(indicator, text, 'offline', 'قطع');
      }
    }
  }

  function checkENVStatus() {
    const indicator = $('#env-indicator');
    const text = $('#env-text');
    const base = apiBase();
    
    if (!base) {
      setStatus(indicator, text, 'warning', 'CF_API_BASE خالی');
    } else {
      setStatus(indicator, text, 'online', 'تنظیم شده');
    }
  }

  function setStatus(indicator, text, status, message) {
    if (!indicator || !text) return;
    
    // Remove all status classes
    indicator.classList.remove('online', 'offline', 'warning');
    
    // Add new status class
    indicator.classList.add(status);
    
    // Update text
    text.textContent = message;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // Initialize demo data
    initializeDemoData();
    
    // Admin login handlers
    $('#btn-admin-send')?.addEventListener('click', adminSend);
    $('#btn-admin-verify')?.addEventListener('click', adminVerify);
    
    // Scanner management handlers
    $('#country-select')?.addEventListener('change', onCountryChange);
    $('#btn-add-addresses')?.addEventListener('click', addAddresses);
    $('#btn-clear-addresses')?.addEventListener('click', clearAddresses);
    
    // System status handlers
    $('#btn-refresh-status')?.addEventListener('click', checkSystemStatus);
    
    // Check system status on load with a small delay to ensure elements are ready
    setTimeout(() => {
      checkSystemStatus();
    }, 500);
  });
})();
