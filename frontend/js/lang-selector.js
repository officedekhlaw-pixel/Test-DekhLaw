/* DekhLaw — Multilingual Language Selector
   Injects a dropdown into the desktop navbar and a grid into
   the mobile menu on every page that includes this script.
   ---------------------------------------------------------- */
(function () {
  'use strict';

  /* ── All 22 scheduled Indian languages + English ─────── */
  var LANGS = [
    { code: 'en',  label: 'English',    native: 'English'     },
    { code: 'hi',  label: 'Hindi',      native: 'हिंदी'       },
    { code: 'bn',  label: 'Bengali',    native: 'বাংলা'       },
    { code: 'te',  label: 'Telugu',     native: 'తెలుగు'      },
    { code: 'mr',  label: 'Marathi',    native: 'मराठी'       },
    { code: 'ta',  label: 'Tamil',      native: 'தமிழ்'       },
    { code: 'gu',  label: 'Gujarati',   native: 'ગુજરાતી'     },
    { code: 'kn',  label: 'Kannada',    native: 'ಕನ್ನಡ'       },
    { code: 'ml',  label: 'Malayalam',  native: 'മലയാളം'      },
    { code: 'pa',  label: 'Punjabi',    native: 'ਪੰਜਾਬੀ'      },
    { code: 'or',  label: 'Odia',       native: 'ଓଡ଼ିଆ'       },
    { code: 'as',  label: 'Assamese',   native: 'অসমীয়া'     },
    { code: 'ur',  label: 'Urdu',       native: 'اردو'        },
    { code: 'mai', label: 'Maithili',   native: 'मैथिली'      },
    { code: 'sa',  label: 'Sanskrit',   native: 'संस्कृत'     },
    { code: 'kok', label: 'Konkani',    native: 'कोंकणी'      },
    { code: 'ne',  label: 'Nepali',     native: 'नेपाली'      },
    { code: 'ks',  label: 'Kashmiri',   native: 'كٲشُر'       },
    { code: 'sd',  label: 'Sindhi',     native: 'سنڌي'        },
    { code: 'doi', label: 'Dogri',      native: 'डोगरी'       },
    { code: 'mni', label: 'Manipuri',   native: 'মৈতৈলোন্'   },
    { code: 'sat', label: 'Santali',    native: 'ᱥᱟᱱᱛᱟᱲᱤ'   },
    { code: 'bo',  label: 'Bodo',       native: 'बर\''/        },
  ];

  /* Sanitise Bodo label edge case */
  LANGS[LANGS.length - 1].native = 'बड़ो';

  /* ── State ───────────────────────────────────────────── */
  var activeLang = localStorage.getItem('dl_lang') || 'en';

  function getActive() {
    return LANGS.find(function(l){ return l.code === activeLang; }) || LANGS[0];
  }

  /* ── Desktop dropdown HTML ───────────────────────────── */
  function buildDesktopSelector() {
    var wrap = document.createElement('div');
    wrap.className = 'lang-selector';
    wrap.id = 'langSelector';

    var btn = document.createElement('button');
    btn.className = 'lang-btn';
    btn.type = 'button';
    btn.id = 'langBtn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    updateBtnLabel(btn);

    var dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';
    dropdown.id = 'langDropdown';
    dropdown.setAttribute('role', 'listbox');

    var header = document.createElement('div');
    header.className = 'lang-dropdown-header';
    header.textContent = 'Select Language';
    dropdown.appendChild(header);

    LANGS.forEach(function(lang) {
      var opt = document.createElement('button');
      opt.className = 'lang-option' + (lang.code === activeLang ? ' active' : '');
      opt.type = 'button';
      opt.setAttribute('role', 'option');
      opt.dataset.code = lang.code;
      opt.innerHTML = '<span>' + lang.label + '</span><span class="lang-native">' + lang.native + '</span>';
      opt.addEventListener('click', function() {
        selectLang(lang.code);
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
      dropdown.appendChild(opt);
    });

    wrap.appendChild(btn);
    wrap.appendChild(dropdown);

    /* Toggle */
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    /* Close on outside click */
    document.addEventListener('click', function() {
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    dropdown.addEventListener('click', function(e){ e.stopPropagation(); });

    return wrap;
  }

  function updateBtnLabel(btn) {
    var lang = getActive();
    btn.innerHTML =
      '<i class="bi bi-translate lang-globe"></i>' +
      '<span>' + lang.label + '</span>' +
      '<i class="bi bi-chevron-down lang-arrow"></i>';
  }

  /* ── Mobile menu language grid ───────────────────────── */
  function buildMobileSelector() {
    var wrap = document.createElement('div');
    wrap.className = 'mobile-lang-wrap';

    var label = document.createElement('div');
    label.className = 'mobile-lang-label';
    label.innerHTML = '<i class="bi bi-translate me-1"></i> Language';
    wrap.appendChild(label);

    var grid = document.createElement('div');
    grid.className = 'mobile-lang-grid';
    grid.id = 'mobileLangGrid';

    LANGS.forEach(function(lang) {
      var btn = document.createElement('button');
      btn.className = 'mobile-lang-btn' + (lang.code === activeLang ? ' active' : '');
      btn.type = 'button';
      btn.dataset.code = lang.code;
      btn.innerHTML = '<div>' + lang.label + '</div><div style="font-size:.7rem;opacity:.6;margin-top:1px">' + lang.native + '</div>';
      btn.addEventListener('click', function() { selectLang(lang.code); });
      grid.appendChild(btn);
    });

    wrap.appendChild(grid);
    return wrap;
  }

  /* ── Select a language ───────────────────────────────── */
  function selectLang(code) {
    activeLang = code;
    localStorage.setItem('dl_lang', code);

    /* Update desktop dropdown active state */
    document.querySelectorAll('#langDropdown .lang-option').forEach(function(o) {
      o.classList.toggle('active', o.dataset.code === code);
    });
    /* Update desktop button label */
    var btn = document.getElementById('langBtn');
    if (btn) updateBtnLabel(btn);

    /* Update mobile grid active state */
    document.querySelectorAll('#mobileLangGrid .mobile-lang-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.code === code);
    });

    /* ── Practical: Google Translate hook (optional) ──── */
    /* If Google Translate widget is loaded, trigger it.
       Otherwise just store preference for future backend use. */
    try {
      var gt = document.querySelector('.goog-te-combo');
      if (gt) {
        var gtCode = code === 'or' ? 'or' : code;
        gt.value = gtCode;
        gt.dispatchEvent(new Event('change'));
      }
    } catch(e) {}
  }

  /* ── Inject on DOM ready ─────────────────────────────── */
  function inject() {
    /* Desktop navbar — insert before SOS button */
    var navDesktop = document.querySelector('.nav-desktop');
    if (navDesktop) {
      var sosLink = navDesktop.querySelector('.nav-sos');
      var selector = buildDesktopSelector();
      if (sosLink) {
        navDesktop.insertBefore(selector, sosLink);
      } else {
        navDesktop.appendChild(selector);
      }
    }

    /* Mobile menu — append after last link */
    var mobileLinks = document.querySelector('.menu-links');
    if (mobileLinks) {
      mobileLinks.appendChild(buildMobileSelector());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();
