(function(){
  'use strict';
  const $ = (s, c=document)=>c.querySelector(s);

  const apiBase = ()=> (window.APP_CONFIG?.CF_API_BASE || '').replace(/\/$/, '');

  // KV Storage functions (same as admin.js)
  async function getFromKV(key) {
    const base = apiBase();
    if (!base) {
      // Demo mode - use localStorage
      const data = localStorage.getItem(`kv_${key}`);
      return data ? JSON.parse(data) : null;
    }
    
    try {
      const res = await fetch(`${base}/api/kv/${key}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function saveToKV(key, value) {
    const base = apiBase();
    if (!base) {
      // Demo mode - use localStorage
      localStorage.setItem(`kv_${key}`, JSON.stringify(value));
      return;
    }
    
    await fetch(`${base}/api/kv/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    });
  }

  async function getAddress() {
    const country = $('#scanner-country').value;
    const statusEl = $('#scanner-status');
    const resultEl = $('#address-result');
    
    try {
      statusEl.textContent = 'در حال دریافت آدرس...';
      
      // Get available addresses for the country
      const addresses = await getFromKV(`scanner_addresses_${country}`) || [];
      
      if (addresses.length === 0) {
        statusEl.textContent = 'متأسفانه آدرسی برای این کشور موجود نیست.';
        return;
      }

      // Get a random address
      const randomIndex = Math.floor(Math.random() * addresses.length);
      const selectedAddress = addresses[randomIndex];

      // Remove the address from available list
      addresses.splice(randomIndex, 1);
      await saveToKV(`scanner_addresses_${country}`, addresses);

      // Add to used addresses list
      const usedAddresses = await getFromKV(`used_addresses_${country}`) || [];
      usedAddresses.push({
        address: selectedAddress,
        timestamp: Date.now(),
        user_ip: 'hidden' // In real implementation, you might want to track this
      });
      await saveToKV(`used_addresses_${country}`, usedAddresses);

      // Show the address to user
      showAddressResult(selectedAddress);
      statusEl.textContent = '';

    } catch (error) {
      console.error('Error getting address:', error);
      statusEl.textContent = 'خطا در دریافت آدرس. لطفاً دوباره تلاش کنید.';
    }
  }

  function showAddressResult(address) {
    const resultEl = $('#address-result');
    const addressEl = $('#received-address');
    
    addressEl.textContent = address;
    resultEl.style.display = 'block';
    
    // Scroll to result
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function copyAddress() {
    const address = $('#received-address').textContent;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address).then(() => {
        showCopyFeedback();
      }).catch(() => {
        fallbackCopy(address);
      });
    } else {
      fallbackCopy(address);
    }
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      showCopyFeedback();
    } catch (err) {
      console.error('Copy failed:', err);
      alert('خطا در کپی کردن. لطفاً دستی کپی کنید.');
    }
    
    document.body.removeChild(textArea);
  }

  function showCopyFeedback() {
    const btn = $('#btn-copy-address');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<img src="https://api.iconify.design/material-symbols/check.svg?color=%2300D4AA" style="width:16px; height:16px;" /> کپی شد!';
    btn.style.background = 'rgba(0,212,170,0.2)';
    btn.style.borderColor = '#00D4AA';
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
      btn.style.borderColor = '';
    }, 2000);
  }

  function resetForm() {
    const resultEl = $('#address-result');
    const statusEl = $('#scanner-status');
    
    resultEl.style.display = 'none';
    statusEl.textContent = '';
    
    // Scroll back to top
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Initialize demo data if needed
  async function initializeDemoData() {
    const base = apiBase();
    if (base) return; // Only for demo mode
    
    const countries = ['uk', 'us', 'de', 'nl', 'fr'];
    const demoAddresses = {
      uk: ['185.199.108.153:443', '185.199.109.153:443', '185.199.110.153:443'],
      us: ['104.21.45.67:443', '172.67.74.226:443', '104.26.10.78:443'],
      de: ['46.232.249.138:443', '178.162.192.148:443', '95.179.158.23:443'],
      nl: ['45.83.104.125:443', '178.128.196.118:443', '164.90.204.145:443'],
      fr: ['51.15.228.83:443', '163.172.107.158:443', '195.154.169.198:443']
    };
    
    for (const country of countries) {
      const existing = await getFromKV(`scanner_addresses_${country}`);
      if (!existing || existing.length === 0) {
        await saveToKV(`scanner_addresses_${country}`, demoAddresses[country]);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // Initialize demo data
    await initializeDemoData();
    
    // Event listeners
    $('#btn-get-address')?.addEventListener('click', getAddress);
    $('#btn-copy-address')?.addEventListener('click', copyAddress);
    $('#btn-get-another')?.addEventListener('click', resetForm);
    
    // Show demo message if in demo mode
    const base = apiBase();
    if (!base) {
      setTimeout(() => {
        const statusEl = $('#scanner-status');
        if (statusEl && !statusEl.textContent) {
          statusEl.innerHTML = '<small style="color: var(--muted);">حالت نمایشی - برای اتصال به API، CF_API_BASE را تنظیم کنید</small>';
        }
      }, 1000);
    }
  });
})();
