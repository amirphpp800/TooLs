// TooLs - Digital Tools Website JavaScript
// بیش از 2 سال تجربه در ابزارهای دیجیتال

document.addEventListener('DOMContentLoaded', function() {
    // Loading Screen Management
    const loadingScreen = document.getElementById('loading');
    const mainContent = document.getElementById('main-content');

    // Show loading briefly then fade out
    setTimeout(() => {
        loadingScreen.classList.add('hidden');

        setTimeout(() => {
            mainContent.classList.remove('hidden');
            // Trigger hero animations
            animateHeroElements();
        }, 500);
    }, 1500);

    // Mobile Navigation (Hamburger) + Dropdown Menu Functionality
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        function setHamburgerState(open) {
            hamburger.classList.toggle('active', open);
            navMenu.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');

            // Remove any existing overlay
            const existingOverlay = document.getElementById('mobileOverlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            // No overlay needed - menu works without it
            if (open) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Hamburger clicked!');
            const open = !hamburger.classList.contains('active');
            console.log('Setting hamburger state to:', open);
            setHamburgerState(open);
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && navMenu.classList.contains('active')) {
                // Check if click is outside menu and hamburger
                if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                    console.log('Clicked outside menu, closing...');
                    setHamburgerState(false);
                }
            }
        });

    // Generic copy handler for buttons with data-copy attribute
    document.addEventListener('click', function(e) {
        const copyBtn = e.target.closest('[data-copy]');
        if (copyBtn) {
            const text = copyBtn.getAttribute('data-copy');
            if (text) {
                navigator.clipboard.writeText(text).then(() => {
                    showNotification('کپی شد', 'success');
                }).catch(() => showNotification('خطا در کپی', 'error'));
            }
        }

        const copyGroupBtn = e.target.closest('[data-copy-group]');
        if (copyGroupBtn) {
            const selector = copyGroupBtn.getAttribute('data-copy-group');
            if (selector) {
                const nodes = document.querySelectorAll(selector);
                const text = Array.from(nodes).map(n => n.textContent.trim()).join('\n');
                navigator.clipboard.writeText(text).then(() => {
                    showNotification('همه آیتم‌ها کپی شد', 'success');
                }).catch(() => showNotification('خطا در کپی', 'error'));
            }
        }
    });

        // Close on link click (mobile) - but NOT when clicking dropdown toggles
        navMenu.addEventListener('click', (ev) => {
            const a = ev.target.closest('a');
            if (!a) return;
            
            console.log('Nav link clicked:', a.textContent.trim());
            const isToggle = a.classList.contains('dropdown-toggle');
            const href = a.getAttribute('href');
            console.log('Is toggle:', isToggle, 'Href:', href, 'Window width:', window.innerWidth);
            
            if (window.innerWidth <= 768) {
                if (!isToggle && href && href !== '#') {
                    // Actual navigation link - close menu
                    console.log('Closing menu for navigation');
                    setTimeout(() => setHamburgerState(false), 100);
                }
                // If it's a dropdown toggle or '#', keep menu open to show items
            }
        });
    }

    // Dropdown Menu Functionality
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');

        if (toggle && menu) {
            // Accessibility: declare semantics
            toggle.setAttribute('aria-haspopup', 'true');
            toggle.setAttribute('aria-expanded', 'false');
            if (menu.id) {
                toggle.setAttribute('aria-controls', menu.id);
            }
            // Desktop hover functionality
            dropdown.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    dropdown.classList.add('active');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });

            dropdown.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) {
                    dropdown.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Mobile click functionality
            toggle.addEventListener('click', (e) => {
                // Prevent page jump on # even on desktop
                const href = toggle.getAttribute('href');
                if (href === '#') {
                    e.preventDefault();
                }
                if (window.innerWidth <= 768) {
                    dropdown.classList.toggle('active');
                    toggle.setAttribute('aria-expanded', dropdown.classList.contains('active') ? 'true' : 'false');

                    // Close other dropdowns
                    dropdowns.forEach(otherDropdown => {
                        if (otherDropdown !== dropdown) {
                            otherDropdown.classList.remove('active');
                            const otherToggle = otherDropdown.querySelector('.dropdown-toggle');
                            if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
                        }
                    });
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    });

    // Smooth scrolling for in-page anchors (ignore plain '#')
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return; // safety guard
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerEl = document.querySelector('.header');
                const headerHeight = headerEl ? headerEl.offsetHeight : 0;
                const targetPosition = target.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close dropdown on mobile after clicking
                if (window.innerWidth <= 768) {
                    dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
                }
            }
        });
    });

    // Enhanced Header scroll effect + progress bar
    const header = document.querySelector('.header');
    const progressBar = document.querySelector('.scroll-progress span');
    let lastScrollTop = 0;
    let ticking = false;

    function updateHeader() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class for enhanced styling
        if (scrollTop > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Smooth scroll progress
        if (progressBar) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = progress + '%';
        }

        // Parallax effect for hero elements
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrollTop < window.innerHeight) {
            const parallaxSpeed = scrollTop * 0.5;
            heroContent.style.transform = `translateY(${parallaxSpeed}px)`;
        }

        lastScrollTop = scrollTop;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });

    // Active navigation link highlighting
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const headerHeight = document.querySelector('.header').offsetHeight;

            if (window.pageYOffset >= (sectionTop - headerHeight - 50)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    // =====================
    // Registration Flow UI
    // =====================
    const tgIdInput = document.getElementById('tgIdInput');
    const startBtn = document.getElementById('startRegisterBtn');
    const regStatus = document.getElementById('regStatus');
    const step2Box = document.getElementById('registerStep2');
    const botLink = document.getElementById('botLink');
    const resendBtn = document.getElementById('resendCodeBtn');
    const codeInput = document.getElementById('codeInput');
    const verifyBtn = document.getElementById('verifyCodeBtn');
    const verifyStatus = document.getElementById('verifyStatus');
    // New tab buttons and captions
    const authTabLogin = document.getElementById('authTabLogin');
    const authTabRegister = document.getElementById('authTabRegister');
    const tgIdCaption = document.getElementById('tgIdCaption');
    const step2Title = document.getElementById('step2Title');
    const step2Caption = document.getElementById('step2Caption');
    const codePrompt = document.getElementById('codePrompt');
    const authModeBadge = document.getElementById('authModeBadge');
    const authModeHint = document.getElementById('authModeHint');
    const viewAuthPanel = document.getElementById('view-auth');
    let AUTH_MODE = 'login'; // 'login' | 'register'

    function setText(el, text) {
        if (el) el.textContent = text || '';
    }

    function isValidTgId(val) {
        return /^[0-9]{5,15}$/.test(String(val || '').trim());
    }

    async function apiPost(path, payload) {
        const res = await fetch(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    }

    // Open/close auth modal and tab switching
    const authModal = document.getElementById('authModal');
    const openAuthModalBtn = document.getElementById('openAuthModalBtn');
    const openAuthModalHeaderBtn = document.getElementById('openAuthModalHeaderBtn');
    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    const cancelAuthModalBtn = document.getElementById('cancelAuthModalBtn');
    const headerDashboardLink = document.getElementById('headerDashboardLink');
    const tabAuth = document.getElementById('tab-auth');
    const tabGold = document.getElementById('tab-gold');
    const viewAuth = document.getElementById('view-auth');
    const viewGold = document.getElementById('view-gold');

    function openAuthModal(mode) {
        if (authModal) {
            authModal.style.display = 'flex';
            if (mode === 'login' || mode === 'register') {
                applyAuthMode(mode);
            }
        } else {
            // Fallback for pages without modal: redirect to index with hash
            const m = mode ? `?mode=${mode}` : '';
            window.location.href = `/index.html#register${m}`;
        }
    }
    function closeAuthModal() {
        if (authModal) authModal.style.display = 'none';
    }
    openAuthModalBtn?.addEventListener('click', () => openAuthModal());
    openAuthModalHeaderBtn?.addEventListener('click', () => openAuthModal());
    closeAuthModalBtn?.addEventListener('click', closeAuthModal);
    cancelAuthModalBtn?.addEventListener('click', closeAuthModal);
    
    // Mobile auth link handler
    const mobileAuthLink = document.getElementById('mobileAuthLink');
    mobileAuthLink?.addEventListener('click', (e) => {
        const href = mobileAuthLink.getAttribute('href');
        if (href === '#register') {
            e.preventDefault();
            openAuthModal();
            // Close mobile menu
            const hamburger = document.querySelector('.hamburger');
            const navMenu = document.querySelector('.nav-menu');
            if (hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        }
    });
    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });

    function switchTab(which) {
        if (!tabAuth || !tabGold || !viewAuth || !viewGold) return;
        if (which === 'gold') {
            viewAuth.style.display = 'none';
            viewGold.style.display = 'block';
            tabGold.classList.add('btn-primary');
            tabAuth.classList.remove('btn-primary');
        } else {
            viewAuth.style.display = 'block';
            viewGold.style.display = 'none';
            tabAuth.classList.add('btn-primary');
            tabGold.classList.remove('btn-primary');
        }
    }
    tabAuth?.addEventListener('click', () => switchTab('auth'));
    tabGold?.addEventListener('click', () => switchTab('gold'));
    // default
    switchTab('auth');

    // New: Login/Register mode switching within auth view
    function applyAuthMode(mode) {
        AUTH_MODE = mode;
        if (authTabLogin && authTabRegister) {
            if (mode === 'login') {
                authTabLogin.classList.add('btn-primary');
                authTabRegister.classList.remove('btn-primary');
                authTabLogin.classList.remove('btn-outline');
                authTabRegister.classList.add('btn-outline');
                authTabLogin.setAttribute('aria-selected', 'true');
                authTabRegister.setAttribute('aria-selected', 'false');
                authTabLogin.classList.add('is-active');
                authTabLogin.classList.remove('is-inactive');
                authTabRegister.classList.add('is-inactive');
                authTabRegister.classList.remove('is-active');
            } else {
                authTabRegister.classList.add('btn-primary');
                authTabLogin.classList.remove('btn-primary');
                authTabRegister.classList.remove('btn-outline');
                authTabLogin.classList.add('btn-outline');
                authTabLogin.setAttribute('aria-selected', 'false');
                authTabRegister.setAttribute('aria-selected', 'true');
                authTabRegister.classList.add('is-active');
                authTabRegister.classList.remove('is-inactive');
                authTabLogin.classList.add('is-inactive');
                authTabLogin.classList.remove('is-active');
            }
        }
        // Update captions
        if (tgIdCaption) tgIdCaption.textContent = mode === 'login' ? 'برای ورود، آیدی عددی تلگرام خود را وارد کنید (فقط اعداد بدون @).' : 'برای ثبت‌نام، آیدی عددی تلگرام خود را وارد کنید (فقط اعداد بدون @).';
        if (step2Title) step2Title.textContent = 'مرحله ۲: دریافت و ورود کد';
        if (step2Caption) step2Caption.textContent = 'ربات را استارت کنید تا کد ۴ رقمی برای شما ارسال شود.';
        if (codePrompt) codePrompt.textContent = 'کد ۴ رقمی را وارد کنید:';
        if (startBtn) startBtn.textContent = mode === 'login' ? 'ارسال کد ورود' : 'ارسال کد ثبت‌نام';
        if (verifyBtn) verifyBtn.textContent = mode === 'login' ? 'تایید ورود' : 'تایید ثبت‌نام';
        if (authModeBadge) authModeBadge.textContent = mode === 'login' ? '(ورود)' : '(ثبت‌نام)';
        if (authModeHint) authModeHint.textContent = mode === 'login'
            ? 'در حالت ورود هستید. شماره آیدی تلگرام را وارد کنید تا کد برای شما ارسال شود.'
            : 'در حالت ثبت‌نام هستید. شماره آیدی تلگرام را وارد کنید تا کد ثبت‌نام برای شما ارسال شود.';
        if (viewAuthPanel) viewAuthPanel.setAttribute('aria-labelledby', mode === 'login' ? 'authTabLogin' : 'authTabRegister');
        setText(regStatus, '');
        setText(verifyStatus, '');
        step2Box && (step2Box.style.display = 'none');
    }
    authTabLogin?.addEventListener('click', () => applyAuthMode('login'));
    authTabRegister?.addEventListener('click', () => applyAuthMode('register'));
    applyAuthMode('login');

    // If we landed on index with #register (from other pages), auto-open modal and apply mode
    try {
        const hash = window.location.hash || '';
        const params = new URLSearchParams(window.location.search);
        const modeParam = params.get('mode');
        if (hash.startsWith('#register')) {
            const m = (modeParam === 'login' || modeParam === 'register') ? modeParam : undefined;
            openAuthModal(m);
        }
    } catch {}

    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            const tgId = (tgIdInput?.value || '').trim();
            if (!isValidTgId(tgId)) {
                setText(regStatus, 'آیدی عددی معتبر وارد کنید.');
                showNotification('آیدی عددی معتبر نیست', 'error');
                return;
            }
            setText(regStatus, AUTH_MODE === 'login' ? 'در حال ارسال کد ورود به ربات تلگرام...' : 'در حال ارسال کد ثبت‌نام به ربات تلگرام...');
            startBtn.disabled = true;
            try {
                const { ok, data } = await apiPost('/api/register/start', { telegram_id: tgId });
                if (!ok) {
                    const errMsg = data?.error === 'RATE_LIMITED' ? 'محدودیت ارسال. بعدا تلاش کنید.' : 'خطا در شروع فرآیند';
                    setText(regStatus, errMsg);
                    showNotification(errMsg, 'error');
                    return;
                }
                // Save for later steps
                localStorage.setItem('tg_numeric_id', tgId);
                if (data?.bot_link && botLink) {
                    botLink.href = data.bot_link;
                }
                setText(regStatus, 'اگر ربات را استارت نکرده‌اید، ابتدا ربات را استارت کنید سپس کد را وارد نمایید.');
                if (step2Box) step2Box.style.display = 'block';
                // Smooth scroll to step 2
                step2Box?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                setText(regStatus, 'اشکال در ارتباط با سرور');
            } finally {
                startBtn.disabled = false;
            }
        });
    }

    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            const tgId = localStorage.getItem('tg_numeric_id') || (tgIdInput?.value || '').trim();
            if (!isValidTgId(tgId)) {
                showNotification('ابتدا آیدی عددی معتبر وارد کنید.', 'error');
                return;
            }
            resendBtn.disabled = true;
            setText(verifyStatus, 'در حال ارسال مجدد کد...');
            try {
                const { ok } = await apiPost('/api/register/resend', { telegram_id: tgId });
                if (ok) {
                    showNotification('کد مجددا ارسال شد.', 'success');
                    setText(verifyStatus, 'کد مجددا ارسال شد. لطفاً تلگرام را بررسی کنید.');
                } else {
                    showNotification('خطا در ارسال مجدد کد', 'error');
                    setText(verifyStatus, 'خطا در ارسال مجدد کد');
                }
            } finally {
                resendBtn.disabled = false;
            }
        });
    }

    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const tgId = localStorage.getItem('tg_numeric_id') || (tgIdInput?.value || '').trim();
            const code = (codeInput?.value || '').trim();
            if (!isValidTgId(tgId)) {
                showNotification('آیدی عددی صحیح نیست', 'error');
                return;
            }
            if (!/^\d{4}$/.test(code)) {
                showNotification('کد ۴ رقمی معتبر وارد کنید', 'error');
                return;
            }
            verifyBtn.disabled = true;
            setText(verifyStatus, 'در حال تایید...');
            try {
                const { ok, data } = await apiPost('/api/register/verify', { telegram_id: tgId, code });
                if (ok && data?.status === 'VERIFIED') {
                    showNotification('ثبت‌نام با موفقیت انجام شد', 'success');
                    setText(verifyStatus, 'حساب شما تایید و ساخته شد.');
                    // Close modal and redirect to dashboard
                    closeAuthModal();
                    setTimeout(() => {
                        window.location.href = '/dashboard/user/';
                    }, 500);
                } else {
                    const msg = data?.error === 'CODE_MISMATCH' ? 'کد نادرست است' : (data?.error || 'خطا در تایید');
                    showNotification(msg, 'error');
                    setText(verifyStatus, msg);
                }
            } catch (e) {
                showNotification('اشکال در ارتباط با سرور', 'error');
                setText(verifyStatus, 'اشکال در ارتباط با سرور');
            } finally {
                verifyBtn.disabled = false;
            }
        });
    }

    // =====================
    // Enhanced Auth system with favorites
    // =====================
    let AUTH = { authenticated: false, checked: false, user: null };
    let userFavorites = [];

    async function refreshAuth() {
        try {
            const res = await fetch('/api/auth/status', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            AUTH = { authenticated: Boolean(data?.authenticated), checked: true, user: data?.user || null };
            
            if (AUTH.authenticated) {
                await loadUserFavorites();
            }
        } catch {
            AUTH = { authenticated: false, checked: true, user: null };
        }
    }

    async function loadUserFavorites() {
        try {
            const res = await fetch('/api/favorites', { credentials: 'include' });
            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    userFavorites = await res.json();
                    updateFavoriteButtons();
                } else {
                    // Server returned non-JSON response (likely HTML error page)
                    console.warn('سرور پاسخ غیر JSON برگرداند - احتمالاً API در دسترس نیست');
                    userFavorites = [];
                }
            } else {
                // API endpoint not available or user not authenticated
                userFavorites = [];
            }
        } catch (e) {
            console.error('خطا در بارگذاری علاقه‌مندی‌ها:', e);
            userFavorites = [];
        }
    }

    function updateFavoriteButtons() {
        document.querySelectorAll('[data-favorite-id]').forEach(btn => {
            const id = btn.getAttribute('data-favorite-id');
            const isFavorite = userFavorites.some(fav => fav.id === id);
            
            btn.classList.toggle('favorited', isFavorite);
            btn.innerHTML = isFavorite ? 
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' :
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
            
            btn.title = isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'اضافه به علاقه‌مندی‌ها';
        });
    }

    async function toggleFavorite(id, title, type, url) {
        if (!AUTH.authenticated) {
            showAuthRequiredModal();
            return;
        }

        try {
            const isFavorite = userFavorites.some(fav => fav.id === id);
            
            if (isFavorite) {
                // حذف از علاقه‌مندی‌ها
                const res = await fetch(`/api/favorites/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (res.ok) {
                    userFavorites = userFavorites.filter(fav => fav.id !== id);
                    showNotification('از علاقه‌مندی‌ها حذف شد', 'success');
                } else {
                    showNotification('خطا در حذف از علاقه‌مندی‌ها', 'error');
                }
            } else {
                // اضافه به علاقه‌مندی‌ها
                const res = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ id, title, type, url })
                });
                
                if (res.ok) {
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const newFavorite = await res.json();
                        userFavorites.push(newFavorite);
                        showNotification('به علاقه‌مندی‌ها اضافه شد', 'success');
                    } else {
                        showNotification('سرور پاسخ نامعتبر داد', 'error');
                    }
                } else {
                    showNotification('خطا در اضافه کردن به علاقه‌مندی‌ها', 'error');
                }
            }
            
            updateFavoriteButtons();
        } catch (e) {
            showNotification('خطا در ارتباط با سرور', 'error');
        }
    }

    function showAuthRequiredModal() {
        const wrapper = document.createElement('div');
        wrapper.className = 'auth-required-modal';
        wrapper.innerHTML = `
            <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div class="modal" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 2rem; max-width: 400px; text-align: center;">
                    <div style="margin-bottom: 1rem; font-size: 3rem;">🔒</div>
                    <h3 style="color: var(--text); margin-bottom: 1rem;">ورود به حساب کاربری</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem; line-height: 1.6;">برای استفاده از این قابلیت ابتدا باید وارد حساب کاربری خود شوید.</p>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button class="btn btn-primary" data-auth-required="confirm">ورود / ثبت‌نام</button>
                        <button class="btn btn-secondary" data-auth-required="cancel">انصراف</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper);
        
        const backdrop = wrapper.querySelector('.modal-backdrop');
        const btnConfirm = wrapper.querySelector('[data-auth-required="confirm"]');
        const btnCancel = wrapper.querySelector('[data-auth-required="cancel"]');

        // بستن با کلیک روی پس‌زمینه
        backdrop.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) wrapper.remove();
        });

        // تایید => باز کردن مودال اصلی احراز هویت
        btnConfirm?.addEventListener('click', () => {
            if (authModal) {
                openAuthModal();
            } else {
                window.location.href = '/index.html#register';
            }
            wrapper.remove();
        });

        // انصراف => بستن
        btnCancel?.addEventListener('click', () => wrapper.remove());
    }

    // Fire and forget on load
    refreshAuth().then(() => {
        // Adapt navbar register link to 'داشبورد' when authenticated
        try {
            if (AUTH.authenticated) {
                const regLink = document.querySelector('a.nav-link[href="#register"]');
                if (regLink) {
                    regLink.setAttribute('href', '/dashboard/user/');
                    const spanText = regLink.querySelector('span:last-child');
                    if (spanText) spanText.textContent = 'داشبورد';
                }
            }
        } catch {}

        // Toggle header auth actions visibility
        try {
            const mobileAuthLink = document.getElementById('mobileAuthLink');
            const mobileAuthText = document.getElementById('mobileAuthText');
            
            if (AUTH.authenticated) {
                // Desktop buttons
                if (headerDashboardLink) headerDashboardLink.style.display = 'inline-flex';
                if (openAuthModalHeaderBtn) openAuthModalHeaderBtn.style.display = 'none';
                
                // Mobile menu item
                if (mobileAuthLink) {
                    mobileAuthLink.setAttribute('href', '/dashboard/user/');
                    mobileAuthLink.classList.remove('protected-content');
                }
                if (mobileAuthText) mobileAuthText.textContent = 'حساب کاربری';
            } else {
                // Desktop buttons
                if (headerDashboardLink) headerDashboardLink.style.display = 'none';
                if (openAuthModalHeaderBtn) openAuthModalHeaderBtn.style.display = 'inline-flex';
                
                // Mobile menu item
                if (mobileAuthLink) {
                    mobileAuthLink.setAttribute('href', '#register');
                    mobileAuthLink.classList.add('protected-content');
                }
                if (mobileAuthText) mobileAuthText.textContent = 'ورود / ثبت‌نام';
            }
        } catch {}

        // اضافه کردن دکمه‌های علاقه‌مندی به مقالات و کانفیگ‌ها
        addFavoriteButtons();
    });

    function guardOrScrollToRegister(e) {
        if (!AUTH.authenticated) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            showAuthRequiredModal();
            return true;
        }
        return false;
    }

    function addFavoriteButtons() {
        // حذف هر دکمه علاقه‌مندی قبلی از بخش ثبت‌نام/ورود
        document.querySelectorAll('#register .favorite-btn').forEach(el => el.remove());

        // اضافه کردن دکمه علاقه‌مندی فقط به مقاله‌ها و پنل‌ها
        document.querySelectorAll('.article-card, .dns-server-card').forEach((card, index) => {
            // پرهیز از افزودن به کارت‌های داخل سکشن ثبت‌نام یا کارت‌های عمومی
            if (card.closest('#register') || card.hasAttribute('data-no-favorite')) return;
            if (card.querySelector('.favorite-btn')) return; // اگر قبلاً اضافه شده
            
            const title = card.querySelector('.card-title, .article-title, .dns-server-name')?.textContent || `آیتم ${index + 1}`;
            const type = card.classList.contains('article-card') ? 'article' : 'config';
            const url = window.location.pathname;
            const id = `${type}_${index}_${Date.now()}`;
            
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn';
            favoriteBtn.setAttribute('data-favorite-id', id);
            
            favoriteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(id, title, type, url);
            });
            
            card.style.position = 'relative';
            card.appendChild(favoriteBtn);
        });
        
        updateFavoriteButtons();
    }

    // Enhanced navigation with auth protection
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        
        // Allow clicking the register anchor explicitly
        if (href.startsWith('#register')) return;
        
        // Allow external links and protocols
        if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        
        // Check for protected content markers
        const isProtected = a.classList.contains('protected-content') || 
                           a.closest('.protected-content') ||
                           a.getAttribute('data-requires-auth') === 'true';
        
        if (isProtected && !AUTH.authenticated) {
            e.preventDefault();
            guardOrScrollToRegister(e);
            return;
        }
        // Otherwise, allow free navigation within site without forcing auth
    }, true);

    // Enhanced article and content card protection
    document.addEventListener('click', (e) => {
        // Skip if clicking on favorite button
        if (e.target.closest('.favorite-btn')) return;
        
        const card = e.target.closest('.article-card, .dns-server-card');
        if (card && !AUTH.authenticated) {
            e.preventDefault();
            e.stopPropagation();
            guardOrScrollToRegister(e);
            return;
        }
        
        // Handle download buttons
        const downloadBtn = e.target.closest('[data-download], .download-btn');
        if (downloadBtn && !AUTH.authenticated) {
            e.preventDefault();
            e.stopPropagation();
            guardOrScrollToRegister(e);
            return;
        }
    }, true);

    window.addEventListener('scroll', updateActiveNavLink);

    // =====================
    // OS Apps Renderer
    // =====================
    async function renderOsApps() {
        try {
            const path = (location.pathname || '').toLowerCase();
            let os = null;
            if (path.includes('/pages/ios')) os = 'ios';
            else if (path.includes('/pages/android')) os = 'android';
            else if (path.includes('/pages/windows')) os = 'windows';
            if (!os) return; // Only render on OS pages

            const res = await fetch('/apps.json', { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json().catch(() => null);
            if (!data || !Array.isArray(data.apps)) return;

            const apps = data.apps.filter(app => Array.isArray(app.os) && app.os.includes(os));
            if (!apps.length) return;

            const container = document.querySelector('.section .container');
            if (!container) return;

            // Create grid
            let grid = document.getElementById('apps-grid');
            if (!grid) {
                grid = document.createElement('div');
                grid.id = 'apps-grid';
                grid.className = 'app-grid';
                // insert after .section-header if exists
                const sectionHeader = container.querySelector('.section-header');
                if (sectionHeader && sectionHeader.parentElement === container) {
                    sectionHeader.insertAdjacentElement('afterend', grid);
                } else {
                    container.appendChild(grid);
                }
            }

            grid.innerHTML = apps.map(app => `
                <div class="app-card">
                    <img class="app-icon" src="/${app.icon}" alt="${app.name}" loading="lazy" />
                    <div class="app-name">${app.name}</div>
                    <a class="btn btn-primary" href="${app.link || '#'}" target="_blank" rel="noopener">دانلود</a>
                </div>
            `).join('');
        } catch (e) {
            console.warn('OS apps render failed:', e);
        }
    }

    // Render apps after auth/UI init to ensure DOM is ready
    renderOsApps();

    // Animate hero elements on load
    function animateHeroElements() {
        const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-description, .hero-buttons');
        heroElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.2}s`;
        });
    }

    // Card parallax tilt and interactions
    const cards = document.querySelectorAll('.glass-card');
    const maxTilt = 8; // degrees
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const px = (x / rect.width) - 0.5;
            const py = (y / rect.height) - 0.5;
            const rx = (py * maxTilt).toFixed(2);
            const ry = (-px * maxTilt).toFixed(2);
            card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0)';
        });
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 120ms ease';
        });
    });

    // Button ripple effect
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Download button functionality (placeholder)
    const downloadBtns = document.querySelectorAll('.btn[href="#"]');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();

            // Create a simple notification
            showNotification('دانلود شروع شد...', 'success');

            // Simulate download delay
            setTimeout(() => {
                showNotification('دانلود با موفقیت تکمیل شد!', 'success');
            }, 2000);
        });
    });

    // Copy code functionality
    const codeBlocks = document.querySelectorAll('.code-block');
    codeBlocks.forEach(block => {
        block.addEventListener('click', function() {
            const code = this.querySelector('code');
            if (code) {
                // Copy code to clipboard
                navigator.clipboard.writeText(code.textContent).then(() => {
                    showNotification('کد کپی شد!', 'success');
                }).catch(() => {
                    showNotification('خطا در کپی کد', 'error');
                });
            }
        });

        // Add copy icon on hover
        block.style.cursor = 'pointer';
        block.title = 'برای کپی کلیک کنید';
    });

    // Enhanced Notification system
    function showNotification(message, type = 'info', duration = 4000) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        // Create notification content
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'بستن اعلان');
        closeBtn.addEventListener('click', () => removeNotification(notification));
        
        notification.appendChild(content);
        notification.appendChild(closeBtn);

        // Enhanced styling
        const colors = {
            success: 'var(--success)',
            error: 'var(--error)',
            warning: 'var(--warning)',
            info: 'var(--accent)'
        };

        Object.assign(notification.style, {
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: `rgba(10, 10, 10, 0.95)`,
            border: `2px solid ${colors[type] || colors.info}`,
            color: '#ffffff',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${colors[type] || colors.info}33`,
            animation: 'slideInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            minWidth: '200px'
        });

        document.body.appendChild(notification);

        // Auto remove
        const timeoutId = setTimeout(() => removeNotification(notification), duration);
        
        // Store timeout ID for manual removal
        notification.timeoutId = timeoutId;
    }

    function removeNotification(notification) {
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }
        
        notification.style.animation = 'slideOutUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Enhanced dynamic styles
    if (!document.querySelector('#enhanced-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-styles';
        style.textContent = `
            .notification {
                font-family: inherit;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background var(--duration-fast) ease;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .glass-card:hover .card-icon {
                transform: scale(1.1) rotate(5deg);
                transition: transform var(--duration-normal) ease;
            }
            
            .favorite-btn.favorited {
                color: var(--error) !important;
                background: rgba(var(--error-rgb), 0.1) !important;
                border-color: var(--error) !important;
            }
            
            .favorite-btn:not(.favorited) {
                color: var(--text-muted);
            }
            
            .favorite-btn:not(.favorited):hover {
                color: var(--error) !important;
            }

            .code-block:hover {
                background: var(--accent-glow);
                border-color: var(--accent);
                transition: all var(--duration-normal) ease;
            }

            .stats .stat {
                transition: transform var(--duration-normal) ease;
            }

            .stats .stat:hover {
                transform: translateY(-5px);
            }

            .footer-list a {
                position: relative;
                transition: all var(--duration-normal) ease;
            }

            .footer-list a::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 0;
                height: 2px;
                background: linear-gradient(90deg, var(--accent), var(--accent-light));
                transition: width var(--duration-normal) ease;
            }

            .footer-list a:hover::after {
                width: 100%;
            }
            
            /* Enhanced focus indicators */
            .keyboard-navigation *:focus {
                outline: 3px solid var(--accent) !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 6px var(--accent-glow) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Enhanced Performance monitoring and optimization
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
        const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
        console.log(`🚀 Pro TooLs loaded in ${loadTime}ms`);
        console.log(`✅ با بیش از 2 سال تجربه در ابزارهای دیجیتال - Pro TooLs Team`);
        
        // Performance metrics
        const metrics = {
            loadTime,
            domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
            firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
        
        // Log performance warnings
        if (loadTime > 3000) {
            console.warn('⚠️ Slow loading detected. Consider optimizing assets.');
        }
        
        // Store metrics for analytics
        window.proToolsMetrics = metrics;
    }
    
    // Lazy loading for images
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });

    // Enhanced Keyboard navigation and accessibility
    let isKeyboardUser = false;
    
    document.addEventListener('keydown', function(e) {
        // Escape key to close mobile menu and modals
        if (e.key === 'Escape') {
            if (navMenu && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
            
            // Close auth modal
            const authModal = document.getElementById('authModal');
            if (authModal && authModal.style.display === 'flex') {
                authModal.style.display = 'none';
            }
        }

        // Tab navigation enhancement
        if (e.key === 'Tab') {
            isKeyboardUser = true;
            document.body.classList.add('keyboard-navigation');
        }
        
        // Arrow key navigation for dropdowns
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const activeDropdown = document.querySelector('.dropdown.active');
            if (activeDropdown) {
                e.preventDefault();
                const items = activeDropdown.querySelectorAll('.dropdown-item');
                const currentFocus = document.activeElement;
                const currentIndex = Array.from(items).indexOf(currentFocus);
                
                let nextIndex;
                if (e.key === 'ArrowDown') {
                    nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                } else {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                }
                
                items[nextIndex]?.focus();
            }
        }
    });

    document.addEventListener('mousedown', function() {
        if (isKeyboardUser) {
            isKeyboardUser = false;
            document.body.classList.remove('keyboard-navigation');
        }
    });
    
    // Enhanced focus management
    document.addEventListener('focusin', function(e) {
        if (isKeyboardUser) {
            e.target.setAttribute('data-keyboard-focus', 'true');
        }
    });
    
    document.addEventListener('focusout', function(e) {
        e.target.removeAttribute('data-keyboard-focus');
    });

    // Enhanced accessibility features
    function addSkipLink() {
        if (!document.querySelector('.skip-link')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.className = 'skip-link';
            skipLink.textContent = 'پرش به محتوای اصلی';
            document.body.insertBefore(skipLink, document.body.firstChild);
        }
    }
    
    // Add ARIA labels to interactive elements
    function enhanceAccessibility() {
        // Add ARIA labels to buttons without text
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
            if (!btn.textContent.trim()) {
                if (btn.classList.contains('modal-close')) {
                    btn.setAttribute('aria-label', 'بستن');
                } else if (btn.classList.contains('hamburger')) {
                    btn.setAttribute('aria-label', 'منوی ناوبری');
                } else if (btn.classList.contains('favorite-btn')) {
                    btn.setAttribute('aria-label', 'اضافه به علاقه‌مندی‌ها');
                }
            }
        });
        
        // Enhance form accessibility
        document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
            const placeholder = input.getAttribute('placeholder');
            if (placeholder) {
                input.setAttribute('aria-label', placeholder);
            }
        });
        
        // Add live region for dynamic content
        if (!document.querySelector('#live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(liveRegion);
        }
    }
    
    // Removed skip link injection to avoid visible text on some pages
    // addSkipLink();
    enhanceAccessibility();

    // Enhanced Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                target.classList.add('animate-in');
                
                // Add staggered animation delay for multiple elements
                const siblings = Array.from(target.parentElement?.children || []);
                const index = siblings.indexOf(target);
                target.style.animationDelay = `${index * 100}ms`;
                
                animationObserver.unobserve(target);
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animateElements = document.querySelectorAll('.glass-card, .section-title, .hero-content > *');
    animateElements.forEach((element, index) => {
        element.classList.add('animate-ready');
        animationObserver.observe(element);
    });
    
    // Add animation styles
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        .animate-ready {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        @media (prefers-reduced-motion: reduce) {
            .animate-ready,
            .animate-in {
                opacity: 1;
                transform: none;
                transition: none;
            }
        }
    `;
    document.head.appendChild(animationStyle);

    // Theme management (basic)
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark'); // Force dark theme
    }

    // Error handling
    window.addEventListener('error', function(e) {
        console.error('🚨 Pro TooLs Error:', e.error);
        showNotification('خطایی رخ داد. لطفاً صفحه را رفرش کنید.', 'error');
    });

    // Service Worker registration (if available)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                    console.log('✅ Service Worker registered successfully');
                })
                .catch(function(error) {
                    console.log('❌ Service Worker registration failed');
                });
        });
    }

    // Set current year in footer (if present)
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Enhanced initialization and feature detection
    const features = {
        webp: document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0,
        intersectionObserver: 'IntersectionObserver' in window,
        serviceWorker: 'serviceWorker' in navigator,
        localStorage: (() => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch { return false; }
        })()
    };
    
    // Apply feature classes to body
    Object.entries(features).forEach(([feature, supported]) => {
        document.body.classList.add(supported ? `${feature}-supported` : `no-${feature}`);
    });
    
    console.log(`
    ╔══════════════════════════════════════╗
    ║        🚀 Pro TooLs Enhanced!        ║
    ║  بیش از 2 سال تجربه در ابزارهای دیجیتال  ║
    ║    Digital Tools Expert Team         ║
    ║                                      ║
    ║  ✨ Enhanced UI/UX Features:         ║
    ║  • Modern Design System              ║
    ║  • Enhanced Accessibility            ║
    ║  • Smooth Animations                 ║
    ║  • Better Performance                ║
    ║  • Mobile Optimized                  ║
    ╚══════════════════════════════════════╝
    `);
    
    // Announce to screen readers that page is ready
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
        setTimeout(() => {
            liveRegion.textContent = 'صفحه بارگذاری شد و آماده استفاده است';
        }, 1000);
    }

    // Initialize particles background if library and container are present
    const particlesEl = document.getElementById('tsparticles');
    if (window.tsParticles && particlesEl) {
        tsParticles.load('tsparticles', {
            fpsLimit: 60,
            background: { color: 'transparent' },
            fullScreen: { enable: false },
            particles: {
                number: { value: 100, density: { enable: true, area: 900 } },
                color: { value: '#ffffff' },
                links: { enable: true, color: '#bdbdbd', distance: 150, opacity: 0.25, width: 1 },
                move: { enable: true, speed: 0.9, direction: 'none', outModes: { default: 'out' } },
                opacity: { value: 0.35 },
                size: { value: { min: 1, max: 2 } },
            },
            interactivity: {
                events: { onHover: { enable: true, mode: 'grab' }, resize: true },
                modes: { grab: { distance: 140, links: { opacity: 0.45 } } }
            },
            detectRetina: true,
            responsive: [
                { maxWidth: 1024, options: { particles: { number: { value: 80 } } } },
                { maxWidth: 768, options: { particles: { number: { value: 60 }, links: { distance: 130 } } } },
                { maxWidth: 480, options: { particles: { number: { value: 45 }, move: { speed: 0.7 } } } }
            ]
        });
    }
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced utility functions
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function preloadCriticalResources() {
    const criticalImages = document.querySelectorAll('img[data-critical]');
    criticalImages.forEach(img => {
        if (img.dataset.src) {
            img.src = img.dataset.src;
        }
    });
}

// Initialize critical resources
preloadCriticalResources();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debounce, throttle, showNotification, removeNotification };
}
