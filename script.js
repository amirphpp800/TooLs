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
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
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
        navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', (ev) => {
            const isToggle = a.classList.contains('dropdown-toggle');
            const href = a.getAttribute('href');
            if (window.innerWidth <= 768) {
                if (!isToggle && href && href !== '#') {
                    // Actual navigation link - close menu
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
                // If it's a dropdown toggle or '#', keep menu open to show items
            }
        }));
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

    // Header scroll effect + progress bar
    const header = document.querySelector('.header');
    const progressBar = document.querySelector('.scroll-progress span');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 100) {
            header.style.background = 'rgba(15, 15, 15, 0.7)'; // matches --bg-rgb glass
            header.style.backdropFilter = 'blur(26px) saturate(160%)';
        } else {
            header.style.background = 'rgba(15, 15, 15, 0.55)';
            header.style.backdropFilter = 'blur(26px) saturate(160%)';
        }

        // Scroll progress width
        if (progressBar) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = progress + '%';
        }

        lastScrollTop = scrollTop;
    });

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
    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    const tabAuth = document.getElementById('tab-auth');
    const tabGold = document.getElementById('tab-gold');
    const viewAuth = document.getElementById('view-auth');
    const viewGold = document.getElementById('view-gold');

    function openAuthModal() {
        if (authModal) authModal.style.display = 'flex';
    }
    function closeAuthModal() {
        if (authModal) authModal.style.display = 'none';
    }
    openAuthModalBtn?.addEventListener('click', openAuthModal);
    closeAuthModalBtn?.addEventListener('click', closeAuthModal);
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

    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            const tgId = (tgIdInput?.value || '').trim();
            if (!isValidTgId(tgId)) {
                setText(regStatus, 'آیدی عددی معتبر وارد کنید.');
                showNotification('آیدی عددی معتبر نیست', 'error');
                return;
            }
            setText(regStatus, 'در حال ارسال کد به ربات تلگرام...');
            startBtn.disabled = true;
            try {
                const { ok, data } = await apiPost('/api/register/start', { telegram_id: tgId });
                if (!ok) {
                    setText(regStatus, data?.error === 'RATE_LIMITED' ? 'محدودیت ارسال. بعدا تلاش کنید.' : 'خطا در شروع ثبت‌نام');
                    showNotification('خطا در شروع ثبت‌نام', 'error');
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
    // Auth gating for site actions
    // =====================
    let AUTH = { authenticated: false, checked: false };
    async function refreshAuth() {
        try {
            const res = await fetch('/api/auth/status', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            AUTH = { authenticated: Boolean(data?.authenticated), checked: true, user: data?.user || null };
        } catch {
            AUTH = { authenticated: false, checked: true };
        }
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
    });

    function guardOrScrollToRegister(e) {
        if (!AUTH.authenticated) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            const reg = document.getElementById('register');
            if (reg) reg.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showNotification('برای ادامه ابتدا ثبت‌نام کنید.', 'error');
            return true;
        }
        return false;
    }

    // Intercept internal navigation clicks (anchors)
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        // Allow clicking the register anchor explicitly
        if (href.startsWith('#register')) return;
        // Allow external links and protocols
        if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        // Normalize internal URL
        try {
            const url = new URL(href, location.href);
            if (url.origin === location.origin) {
                // Allow scrolling to in-page anchors on the same page (home/register already handled)
                if (href.startsWith('#')) return;
                // Allow only specific informational pages and admin without forcing registration
                const p = url.pathname;
                const infoPaths = new Set([
                    '/',
                    '/index.html',
                    '/Pages/about.html',
                    '/Pages/help.html',
                    '/Pages/faq.html'
                ]);
                if (p.startsWith('/dashboard/admin/') || p === '/dashboard/admin' || infoPaths.has(p)) {
                    return;
                }
                guardOrScrollToRegister(e);
            }
        } catch {
            // If URL parsing fails, guard conservatively
            guardOrScrollToRegister(e);
        }
    }, true);

    // Intercept article card opens
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.article-card');
        if (card) {
            guardOrScrollToRegister(e);
        }
    }, true);

    window.addEventListener('scroll', updateActiveNavLink);

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

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: type === 'success' ? 'rgba(0, 212, 255, 0.9)' : 'rgba(255, 68, 68, 0.9)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            animation: 'slideInDown 0.3s ease'
        });

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add notification animations to CSS dynamically
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInDown {
                from {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutUp {
                from {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
            }

            .glass-card:hover .card-icon {
                transform: scale(1.1) rotate(5deg);
                transition: transform 0.3s ease;
            }

            .code-block:hover {
                background: rgba(0, 212, 255, 0.1);
                border-color: rgba(0, 212, 255, 0.3);
                transition: all 0.3s ease;
            }

            .stats .stat {
                transition: transform 0.3s ease;
            }

            .stats .stat:hover {
                transform: translateY(-5px);
            }

            .footer-list a {
                position: relative;
                transition: all 0.3s ease;
            }

            .footer-list a::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 0;
                height: 2px;
                background: linear-gradient(90deg, #00d4ff, #0099cc);
                transition: width 0.3s ease;
            }

            .footer-list a:hover::after {
                width: 100%;
            }
        `;
        document.head.appendChild(style);
    }

    // Performance monitoring (basic)
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
        console.log(`🚀 Pro TooLs loaded in ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
        console.log(`✅ با بیش از 2 سال تجربه در ابزارهای دیجیتال - Pro TooLs Team`);
    }

    // Keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Escape key to close mobile menu
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }

        // Tab navigation enhancement
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });

    // Add keyboard navigation styles
    if (!document.querySelector('#keyboard-nav-styles')) {
        const keyboardStyle = document.createElement('style');
        keyboardStyle.id = 'keyboard-nav-styles';
        keyboardStyle.textContent = `
            .keyboard-navigation *:focus {
                outline: 2px solid #00d4ff !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(keyboardStyle);
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards for scroll animations
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

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

    // Final initialization message
    console.log(`
    ╔══════════════════════════════════════╗
    ║        🚀 Pro TooLs Loaded!          ║
    ║  بیش از 2 سال تجربه در ابزارهای دیجیتال  ║
    ║    Digital Tools Expert Team         ║
    ╚══════════════════════════════════════╝
    `);

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

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debounce, showNotification };
}
