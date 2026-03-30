/* ============================================================
   DekhLaw — Shared Navbar Injector v5
   ============================================================ */
(function () {

  /* ── Active page detection ─────────────────────────────── */
  var path = window.location.pathname.split('/').pop() || 'index.html';
  var isActive = {
    home   : (path === '' || path === 'index.html'),
    lawyers: (path === 'lawyers.html' || path === 'lawyers-profile.html'),
    about  : (path === 'about-us.html'),
    contact: (path === 'contact-us.html'),
  };

  /* ── Mega dropdown HTML ────────────────────────────────── */
  var megaDropdown = ''
    + '<div class="mega-dropdown" id="megaDropdown" role="menu">'
    +   '<div class="mega-inner">'
    +     '<div class="mega-col"><div class="mega-col-title">Personal / Family</div><ul>'
    +       '<li><a href="lawyers.html?area=divorce">Divorce</a></li>'
    +       '<li><a href="lawyers.html?area=family-dispute">Family Dispute</a></li>'
    +       '<li><a href="lawyers.html?area=child-custody">Child Custody</a></li>'
    +       '<li><a href="lawyers.html?area=muslim-law">Muslim Law</a></li>'
    +       '<li><a href="lawyers.html?area=medical-negligence">Medical Negligence</a></li>'
    +       '<li><a href="lawyers.html?area=motor-accident">Motor Accident</a></li>'
    +     '</ul></div>'
    +     '<div class="mega-col"><div class="mega-col-title">Criminal / Property</div><ul>'
    +       '<li><a href="lawyers.html?area=criminal">Criminal</a></li>'
    +       '<li><a href="lawyers.html?area=property">Property</a></li>'
    +       '<li><a href="lawyers.html?area=landlord-tenant">Landlord / Tenant</a></li>'
    +       '<li><a href="lawyers.html?area=cyber-crime">Cyber Crime</a></li>'
    +       '<li><a href="lawyers.html?area=wills-trusts">Wills / Trusts</a></li>'
    +       '<li><a href="lawyers.html?area=labour-service">Labour &amp; Service</a></li>'
    +     '</ul></div>'
    +     '<div class="mega-col"><div class="mega-col-title">Civil / Debt Matters</div><ul>'
    +       '<li><a href="lawyers.html?area=documentation">Documentation</a></li>'
    +       '<li><a href="lawyers.html?area=consumer-court">Consumer Court</a></li>'
    +       '<li><a href="lawyers.html?area=civil">Civil</a></li>'
    +       '<li><a href="lawyers.html?area=cheque-bounce">Cheque Bounce</a></li>'
    +       '<li><a href="lawyers.html?area=recovery">Recovery</a></li>'
    +     '</ul></div>'
    +     '<div class="mega-col"><div class="mega-col-title">Corporate Law</div><ul>'
    +       '<li><a href="lawyers.html?area=arbitration">Arbitration</a></li>'
    +       '<li><a href="lawyers.html?area=trademark">Trademark &amp; Copyright</a></li>'
    +       '<li><a href="lawyers.html?area=customs">Customs &amp; Central Excise</a></li>'
    +       '<li><a href="lawyers.html?area=startup">Startup</a></li>'
    +       '<li><a href="lawyers.html?area=banking-finance">Banking / Finance</a></li>'
    +       '<li><a href="lawyers.html?area=gst">GST</a></li>'
    +       '<li><a href="lawyers.html?area=corporate">Corporate</a></li>'
    +       '<li><a href="lawyers.html?area=tax">Tax</a></li>'
    +     '</ul></div>'
    +     '<div class="mega-col"><div class="mega-col-title">Others</div><ul>'
    +       '<li><a href="lawyers.html?area=armed-forces">Armed Forces Tribunal</a></li>'
    +       '<li><a href="lawyers.html?area=supreme-court">Supreme Court</a></li>'
    +       '<li><a href="lawyers.html?area=insurance">Insurance</a></li>'
    +       '<li><a href="lawyers.html?area=immigration">Immigration</a></li>'
    +       '<li><a href="lawyers.html?area=international-law">International Law</a></li>'
    +     '</ul></div>'
    +     '<div class="mega-col mega-col-cta">'
    +       '<div class="mega-cta-img-wrap">'
    +         '<img src="https://images.unsplash.com/photo-1521791055366-0d553872952f?q=80&w=600&auto=format&fit=crop" class="mega-cta-img" alt="Verified Lawyer">'
    +         '<div class="mega-cta-img-badge"><i class="bi bi-patch-check-fill"></i> Verified Advocates</div>'
    +       '</div>'
    +       '<div class="mega-cta-content">'
    +         '<div class="mega-cta-eyebrow"><span class="mega-dot-gold"></span>New User Benefit</div>'
    +         '<p class="mega-cta-headline">First Consult <span>Free</span></p>'
    +         '<p class="mega-cta-sub">Sign up once. Free call with a verified lawyer + member rates on every session.</p>'
    +         '<div class="mega-cta-perks">'
    +           '<span><i class="bi bi-check2-circle"></i> Free first call</span>'
    +           '<span><i class="bi bi-check2-circle"></i> Faster matching</span>'
    +           '<span><i class="bi bi-check2-circle"></i> Member rates</span>'
    +         '</div>'
    +         '<a href="user-registration.html" class="mega-cta-signup-btn">Sign Up Free &#8594;</a>'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  /* ── Full HTML ─────────────────────────────────────────── */
  var html = ''
    /* TOP UTILITY BAR */
    + '<div class="top-utility-bar">'
    +   '<div class="container">'
    +     '<div class="tub-left">'
    +       '<span class="tub-tagline">'
    +         '<i class="bi bi-shield-fill-check me-1"></i>'
    +         '<span data-i18n="tub.tagline">India\'s Trusted Legal Platform</span>'
    +       '</span>'
    +     '</div>'
    +     '<div class="tub-right">'
    +       '<a href="lawyers.html" class="tub-link"><i class="bi bi-person-lines-fill"></i> <span data-i18n="tub.contact_lawyer">Contact a Lawyer</span></a>'
    +       '<a href="sos.html" class="tub-link tub-sos"><i class="bi bi-telephone-fill"></i> <span data-i18n="tub.sos">SOS</span></a>'
    +       '<a href="contact-us.html" class="tub-link"><i class="bi bi-chat-dots-fill"></i> <span data-i18n="tub.ask">Ask a Question</span></a>'
    +       '<div class="tub-divider"></div>'
    +       '<div class="tub-lang-pills" id="tubLangPills">'
    +         '<button class="tub-lang-pill active" data-lang="en" onclick="setLang(\'en\')">EN</button>'
    +         '<button class="tub-lang-pill" data-lang="hi" onclick="setLang(\'hi\')">हिंदी</button>'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>'

    /* MAIN NAVBAR */
    + '<nav class="navbar custom-navbar fixed-main-nav">'
    +   '<div class="container">'
    +     '<a class="navbar-brand" href="index.html"><img src="images/logo.svg" alt="DekhLaw" height="38"></a>'
    +     '<nav class="nav-desktop">'
    +       '<a href="index.html"' + (isActive.home ? ' class="active"' : '') + ' data-i18n="nav.home">Home</a>'
    +       '<div class="nav-mega-wrap" id="navMegaWrap">'
    +         '<a href="lawyers.html" class="nav-mega-trigger' + (isActive.lawyers ? ' active' : '') + '" id="navMegaTrigger" aria-haspopup="true" aria-expanded="false">'
    +           '<span data-i18n="nav.find_lawyer">Find A Lawyer</span>'
    +           '<i class="bi bi-chevron-down nav-mega-chevron"></i>'
    +         '</a>'
    +         megaDropdown
    +       '</div>'
    +       '<a href="about-us.html"' + (isActive.about ? ' class="active"' : '') + ' data-i18n="nav.about">About Us</a>'
    +       '<a href="contact-us.html"' + (isActive.contact ? ' class="active"' : '') + ' data-i18n="nav.contact">Contact Us</a>'
    +       '<a href="lawyer-login.html" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:0.84rem;font-weight:600;color:#333;text-decoration:none;margin-right:6px;transition:border-color 0.18s,color 0.18s,background 0.18s;" class="nav-lawyer-login-btn"><i class="bi bi-person-badge"></i> Lawyer Login</a>'
    +       '<button class="nav-register-btn" data-register-modal data-i18n="nav.register">Register</button>'
    +     '</nav>'
    +     '<div class="menu-toggle" id="menuToggle" role="button" aria-label="Open menu" aria-expanded="false">'
    +       '<span></span><span></span><span></span>'
    +     '</div>'
    +   '</div>'
    + '</nav>'

    /* ── MOBILE MENU OVERLAY ── */
    + '<div class="mm-overlay" id="mmOverlay">'
    + '<div class="mm-panel" id="mmPanel">'

    + '<div class="mm-header">'
    + '<a href="index.html" class="mm-logo-link">'
    + '<img src="images/logo.svg" alt="DekhLaw" class="mm-logo-img">'
    + '</a>'
    + '<button class="mm-close-btn" id="mmCloseBtn" aria-label="Close menu">'
    + '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<line x1="1" y1="1" x2="21" y2="21" stroke="#111111" stroke-width="2.5" stroke-linecap="round"/>'
    + '<line x1="21" y1="1" x2="1" y2="21" stroke="#111111" stroke-width="2.5" stroke-linecap="round"/>'
    + '</svg>'
    + '</button>'
    + '</div>'

    + '<div class="mm-sos-hero">'
    + '<div class="mm-sos-pulse-ring"></div>'
    + '<div class="mm-sos-pulse-ring mm-sos-pulse-ring--2"></div>'
    + '<a href="sos.html" class="mm-sos-hero-btn">'
    + '<span class="mm-sos-hero-icon">'
    + '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.59 1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>'
    + '</span>'
    + '<span class="mm-sos-hero-text">'
    + '<strong>SOS Legal Help</strong>'
    + '<small>Emergency? Connect with a lawyer now</small>'
    + '</span>'
    + '<span class="mm-sos-hero-arrow">&#8594;</span>'
    + '</a>'
    + '<p class="mm-sos-hero-note">For physical danger, call <strong>112</strong></p>'
    + '</div>'

    + '<nav class="mm-nav">'
    + '<a href="index.html" class="mm-item' + (isActive.home    ? ' mm-active' : '') + '"><i class="bi bi-house-fill"></i>\u00a0Home</a>'
    + '<a href="lawyers.html" class="mm-item' + (isActive.lawyers ? ' mm-active' : '') + '"><i class="bi bi-person-lines-fill"></i>\u00a0Find A Lawyer</a>'
    + '<a href="about-us.html" class="mm-item' + (isActive.about   ? ' mm-active' : '') + '"><i class="bi bi-info-circle-fill"></i>\u00a0About Us</a>'
    + '<a href="contact-us.html" class="mm-item' + (isActive.contact ? ' mm-active' : '') + '"><i class="bi bi-chat-dots-fill"></i>\u00a0Contact Us</a>'
    + '<a href="blog.html" class="mm-item"><i class="bi bi-journal-text"></i>\u00a0Blog</a>'
    + '<a href="faq.html" class="mm-item"><i class="bi bi-question-circle-fill"></i>\u00a0FAQ</a>'
    + '<a href="lawyer-login.html" class="mm-item"><i class="bi bi-person-badge"></i>\u00a0Lawyer Login</a>'
    + '<a href="lawyer-registration.html" class="mm-item"><i class="bi bi-pencil-square"></i>\u00a0Register As a Lawyer</a>'
    + '<a href="user-registration.html" class="mm-item"><i class="bi bi-person-plus-fill"></i>\u00a0Register As a User</a>'
    + '</nav>'

    + '<div class="mm-footer">'
    + '<div class="mm-lang-wrap">'
    + '<span class="mm-lang-label">Language:</span>'
    + '<button class="mm-lang-btn mm-lang-active" data-lang="en" onclick="setLang(\'en\')">EN</button>'
    + '<span class="mm-lang-sep">|</span>'
    + '<button class="mm-lang-btn" data-lang="hi" onclick="setLang(\'hi\')">&#2361;&#2367;&#2306;&#2342;&#2368;</button>'
    + '</div>'
    + '</div>'

    + '</div>'
    + '</div>'
    /* SOS FLOAT */
    + '<a href="sos.html" class="sos-float" data-i18n-title="nav.sos_mob">'
    +   '<div class="sos-float-btn"><i class="bi bi-telephone-fill"></i></div>'
    +   '<span class="sos-float-label" data-i18n="sos.float_label">SOS Help</span>'
    + '</a>';

  /* ── Mount ─────────────────────────────────────────────── */
  var mount = document.getElementById('dl-nav-root');
  if (mount) {
    mount.innerHTML = html;
  } else {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    while (tmp.firstChild) document.body.insertBefore(tmp.firstChild, document.body.firstChild);
  }

  /* ── Init ──────────────────────────────────────────────── */
  function init() {
    setupScroll();
    setupMegaDropdown();
    setupMobileMenu();
    updateOnlineCount();
  }

  /* ── Scroll behaviour ──────────────────────────────────── */
  function setupScroll() {
    var tubBar  = document.querySelector('.top-utility-bar');
    var mainNav = document.querySelector('.fixed-main-nav');
    var mega    = document.getElementById('megaDropdown');
    if (!tubBar || !mainNav) return;
    function update() {
      var h        = tubBar.getBoundingClientRect().height;
      var scrolled = window.scrollY > h;
      mainNav.style.top      = scrolled ? '0' : h + 'px';
      tubBar.style.transform = scrolled ? 'translateY(-100%)' : 'translateY(0)';
      if (mega) {
        var navH   = mainNav.getBoundingClientRect().height;
        var navTop = parseFloat(mainNav.style.top) || 0;
        mega.style.top = (navTop + navH) + 'px';
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── Mega dropdown ─────────────────────────────────────── */
  function setupMegaDropdown() {
    var wrap    = document.getElementById('navMegaWrap');
    var trigger = document.getElementById('navMegaTrigger');
    var dd      = document.getElementById('megaDropdown');
    if (!wrap || !trigger || !dd) return;
    var t;
    function openDD() { clearTimeout(t); dd.classList.add('open'); trigger.setAttribute('aria-expanded','true'); trigger.classList.add('mega-open'); }
    function closeDD() { t = setTimeout(function(){ dd.classList.remove('open'); trigger.setAttribute('aria-expanded','false'); trigger.classList.remove('mega-open'); }, 120); }
    wrap.addEventListener('mouseenter', openDD);
    wrap.addEventListener('mouseleave', closeDD);
    dd.addEventListener('mouseenter', function(){ clearTimeout(t); });
    dd.addEventListener('mouseleave', closeDD);
    document.addEventListener('click', function(e){ if(!wrap.contains(e.target)) closeDD(); });
  }

  /* ── Mobile menu ───────────────────────────────────────── */
  function setupMobileMenu() {
    var hamburger = document.getElementById('menuToggle');
    var overlay   = document.getElementById('mmOverlay');
    var panel     = document.getElementById('mmPanel');
    var closeBtn  = document.getElementById('mmCloseBtn');

    if (!hamburger || !overlay || !panel) {
      console.warn('DekhLaw: mobile menu elements not found');
      return;
    }

    /* OPEN */
    function openMenu() {
      overlay.classList.add('mm-overlay--open');
      panel.classList.add('mm-panel--open');
      document.body.classList.add('mm-body-lock');
      hamburger.setAttribute('aria-expanded', 'true');
    }

    /* CLOSE */
    function closeMenu() {
      overlay.classList.remove('mm-overlay--open');
      panel.classList.remove('mm-panel--open');
      document.body.classList.remove('mm-body-lock');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    /* Hamburger click */
    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      overlay.classList.contains('mm-overlay--open') ? closeMenu() : openMenu();
    });

    /* Close button click */
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeMenu();
      });
    }

    /* Click on dark backdrop (overlay itself, not panel) */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeMenu();
    });

    /* Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ── Online count ──────────────────────────────────────── */
  function updateOnlineCount() {
    var el = document.querySelector('.mega-cta-badge');
    if (!el) return;
    var base = 230 + Math.floor(Math.random() * 40);
    setInterval(function () {
      base = Math.max(200, Math.min(320, base + Math.floor(Math.random() * 7) - 3));
      el.innerHTML = '<span class="mega-dot"></span>' + base + ' Lawyers Online';
    }, 5000);
  }

  /* ── Boot ──────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
