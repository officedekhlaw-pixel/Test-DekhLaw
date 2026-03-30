/**
 * DekhLaw — Frontend API Connector
 */

const API_BASE = "https://dekhlawwebite-production.up.railway.app/api";

// ─── Core fetch helpers ───────────────────────────────────────────────────────

async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  return res.json();
}

async function apiFormCall(endpoint, method = 'POST', formData, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: formData });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const getToken  = ()  => localStorage.getItem('dekhlaw_token');
const setToken  = (t) => localStorage.setItem('dekhlaw_token', t);
const clearToken = () => localStorage.removeItem('dekhlaw_token');
const getUser   = ()  => JSON.parse(localStorage.getItem('dekhlaw_user') || 'null');
const setUser   = (u) => localStorage.setItem('dekhlaw_user', JSON.stringify(u));

// ─── UI helpers ───────────────────────────────────────────────────────────────

function redirectToThankYou(type) {
  window.location.href = `thank-you.html?type=${type}`;
}

function showError(message) {
  const existing = document.getElementById('dekhlaw-error-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'dekhlaw-error-toast';
  toast.style.cssText = `
    position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
    background:#dc2626; color:#fff; padding:14px 28px; border-radius:10px;
    font-size:15px; font-weight:600; z-index:99999;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function showSuccess(message) {
  const existing = document.getElementById('dekhlaw-success-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'dekhlaw-success-toast';
  toast.style.cssText = `
    position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
    background:#16a34a; color:#fff; padding:14px 28px; border-radius:10px;
    font-size:15px; font-weight:600; z-index:99999;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function setBtnLoading(btn, text) {
  if (!btn) return;
  btn.disabled = true;
  btn._originalHTML = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${text}`;
}

function resetBtn(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.innerHTML = btn._originalHTML || btn.innerHTML;
}

function parseError(data) {
  if (data?.errors?.length) {
    return data.errors.map(err => `${err.path || err.param || 'Error'}: ${err.msg}`).join('\n');
  }
  return data?.message || 'Something went wrong. Please try again.';
}

// ─── 1. CONTACT FORM ──────────────────────────────────────────────────────────

function initContactForm() {
  const form = document.querySelector('.contact-form form, #contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    setBtnLoading(btn, 'Sending…');
    try {
      const data = await apiCall('/contact', 'POST', {
        name:    form.querySelector('input[type="text"]')?.value?.trim(),
        email:   form.querySelector('input[type="email"]')?.value?.trim(),
        phone:   form.querySelector('input[type="tel"]')?.value?.trim(),
        message: form.querySelector('textarea')?.value?.trim(),
      });
      if (data.success) {
        redirectToThankYou('contact');
      } else {
        resetBtn(btn);
        showError(parseError(data));
      }
    } catch {
      resetBtn(btn);
      showError('Network error. Please check your connection.');
    }
  });
}

// ─── 2. USER REGISTRATION ─────────────────────────────────────────────────────

function initUserRegistration() {
  const isUserPage = window.location.pathname.includes('user-registration');
  const forms = document.querySelectorAll('.registration-form');
  if (forms.length === 0 || !isUserPage) return;

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setBtnLoading(btn, 'Creating account…');

      const fd = new FormData();
      
      const fullName = document.getElementById('reg_fullname');
      const phone    = document.getElementById('reg_phone');
      const email    = document.getElementById('reg_email');
      const city     = document.getElementById('reg_city');
      const whatsapp = document.getElementById('whatsappUser'); // Assuming standard ID or checkbox
      const photo    = document.getElementById('reg_photo');

      if (fullName?.value) fd.append('full_name', fullName.value.trim());
      if (phone?.value)    fd.append('phone', phone.value.trim());
      if (email?.value)    fd.append('email', email.value.trim());
      
      if (city && city.value && !city.value.includes('*')) {
        fd.append('city', city.value.trim());
      }

      // Check if whatsapp element exists, if not default to true as per user-registration.html logic
      const whatsappChecked = whatsapp ? whatsapp.checked : true;
      fd.append('whatsapp', whatsappChecked ? 'true' : 'false');
      
      if (photo?.files[0]) fd.append('profilePhoto', photo.files[0]);

      try {
        const data = await apiFormCall('/auth/register/user', 'POST', fd);
        if (data.success) {
          setToken(data.token);
          setUser(data.user);
          redirectToThankYou('user');
        } else {
          resetBtn(btn);
          showError(parseError(data));
        }
      } catch {
        resetBtn(btn);
        showError('Network error. Please try again.');
      }
    });
  });
}

// ─── 3. LAWYER REGISTRATION ───────────────────────────────────────────────────

function initLawyerRegistration() {
  const isLawyerPage = window.location.pathname.includes('lawyer-registration');
  const forms = document.querySelectorAll('.registration-form');
  if (forms.length === 0 || !isLawyerPage) return;

  forms.forEach(form => {
    // Skip forms that are in the navbar (hidden/duplicate) or the main form handled by inline scripts
    if (form.closest('.mm-nav') || form.closest('.nav-desktop') || form.id === 'lawyerRegForm') return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setBtnLoading(btn, 'Submitting profile…');

      const fd = new FormData();

      const fullName  = document.getElementById('reg_fullname');
      const phone     = document.getElementById('reg_phone');
      const email     = document.getElementById('reg_email');
      const password  = document.getElementById('reg_password');
      const city      = document.getElementById('reg_city');
      const exp       = document.getElementById('reg_exp');
      const barNumber = document.getElementById('reg_barcouncil');
      const areas     = document.getElementById('reg_practice_areas');
      const court     = document.getElementById('reg_court');
      const whatsapp  = document.getElementById('whatsappLawyer');

      if (fullName?.value) fd.append('full_name', fullName.value.trim());
      if (phone?.value)    fd.append('phone', phone.value.trim());
      if (email?.value)    fd.append('email', email.value.trim());
      if (password?.value) fd.append('password', password.value);
      if (city?.value && !city.value.includes('*')) fd.append('city', city.value.trim());
      if (exp?.value && !exp.value.includes('*'))   fd.append('years_experience', exp.value.trim());
      if (barNumber?.value) fd.append('bar_council_number', barNumber.value.trim());
      if (areas?.value)     fd.append('practice_area', areas.value.trim());
      if (court?.value)     fd.append('court_of_practice', court.value.trim());

      fd.append('whatsapp', whatsapp?.checked ? 'true' : 'false');

      const photoInput = document.getElementById('reg_photo');
      if (photoInput?.files[0]) {
        fd.append('profilePhoto', photoInput.files[0]);
      }

      console.log('Registering Lawyer with:', Object.fromEntries(fd.entries()));

      try {
        const data = await apiFormCall('/auth/register/lawyer', 'POST', fd);
        if (data.success) {
          setToken(data.token);
          redirectToThankYou('lawyer');
        } else {
          resetBtn(btn);
          showError(parseError(data));
        }
      } catch (err) {
        console.error(err);
        resetBtn(btn);
        showError('Network error. Please try again.');
      }
    });
  });
}

// ─── 4. SOS FORM ─────────────────────────────────────────────────────────────

function initSOSForm() {
  const form = document.querySelector('#sos-form form, .sos-form-section form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"], .sos-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) setBtnLoading(submitBtn, 'Activating SOS…');

    const inputs = form.querySelectorAll('input:not([type="checkbox"]), select, textarea');
    const fields = {};
    inputs.forEach(el => {
      const ph = (el.placeholder || el.id || '').toLowerCase();
      fields[ph] = el.value.trim();
    });

    const payload = {
      name:       fields['your full name']         || Object.values(fields)[0],
      phone:      fields['your mobile number']      || Object.values(fields)[1],
      legalIssue: form.querySelector('select')?.value,
      city:       fields['your city']              || Object.values(fields)[3],
      description: fields['describe your situation'] || '',
    };

    try {
      const data = await apiCall('/sos', 'POST', payload);
      if (data.success) {
        redirectToThankYou('sos');
      } else {
        if (submitBtn) resetBtn(submitBtn);
        showError(parseError(data));
      }
    } catch {
      if (submitBtn) resetBtn(submitBtn);
      showError('Network error. Please try again.');
    }
  });
}

// ─── 5. HOMEPAGE LAWYER SEARCH ────────────────────────────────────────────────

function initLawyerSearch() {
  const searchBtn = document.querySelector('#heroSearchBtn, .hero-search-btn, .search-btn');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', () => {
    const cityInput  = document.querySelector('#heroSearchCity, input[placeholder*="city" i]');
    const areaSelect = document.querySelector('#heroSearchArea, .hero-search-select, .search-box select');

    const city = cityInput?.value?.trim()   || '';
    const area = (areaSelect?.value && areaSelect.value !== '' && !areaSelect.value.includes('Select'))
                   ? areaSelect.value : '';

    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (area) params.set('practice_area', area);

    window.location.href = `lawyers.html${params.toString() ? '?' + params.toString() : ''}`;
  });
}

// ─── 6. LAWYERS PAGE ──────────────────────────────────────────────────────────

async function initLawyersPage() {
  const grid = document.querySelector('.lawyers-grid, #lawyers-container');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const city         = params.get('city')          || '';
  const practiceArea = params.get('practice_area') || '';

  loadLawyers({ city, practice_area: practiceArea });
}

async function loadLawyers(filters = {}) {
  const grid = document.querySelector('.lawyers-grid, #lawyers-container');
  if (!grid) return;

  const params = new URLSearchParams(filters);
  try {
    grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
    const data = await apiCall(`/lawyers?${params}`);

    if (!data.success || !data.data.length) {
      grid.innerHTML = '<div class="col-12 text-center py-5 text-muted">No lawyers found for your search.</div>';
      return;
    }

    grid.innerHTML = data.data.map(l => renderLawyerCard(l)).join('');
  } catch {
    grid.innerHTML = '<div class="col-12 text-center py-5 text-danger">Failed to load lawyers.</div>';
  }
}
function renderLawyerCard(l) {
  const backendBase = API_BASE.replace('/api', '');

  // If profile_photo is a full URL (Cloudinary), use it directly. Otherwise construct path.
  let photo = 'images/expert-lawyer.jpg';
  if (l.profile_photo) {
    photo = l.profile_photo.startsWith('http') ? l.profile_photo : `${backendBase}/uploads/profiles/${l.profile_photo}`;
  }

  const badge  = l.is_verified ? '<span class="badge bg-success ms-2"><i class="bi bi-patch-check-fill"></i> Verified</span>' : '';

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="lawyer-card h-100 shadow-sm border-0">
        <div class="card-img-wrapper" style="height:200px; overflow:hidden;">
          <img src="${photo}" class="card-img-top w-100 h-100 object-fit-cover" alt="${l.full_name}" onerror="this.src='images/expert-lawyer.jpg'">
        </div>
        <div class="card-body">
...
          <h5 class="card-title fw-bold mb-1">${l.full_name} ${badge}</h5>
          <p class="text-accent-gold mb-2 small fw-semibold">${l.practice_area}</p>
          <div class="mb-3">
            <div class="small text-muted mb-1"><i class="bi bi-geo-alt-fill me-1"></i> ${l.city || 'N/A'}</div>
            <div class="small text-muted mb-1"><i class="bi bi-briefcase-fill me-1"></i> ${l.years_experience || 'N/A'} Experience</div>
          </div>
          <a href="lawyers-profile.html?id=${l.id}" class="btn btn-primary w-100">View Profile</a>
        </div>
      </div>
    </div>
  `;
}

// ─── 7. LAWYER PROFILE PAGE ───────────────────────────────────────────────────

async function initLawyerProfilePage() {
  const isProfilePage = window.location.pathname.includes('lawyers-profile');
  if (!isProfilePage) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  try {
    const res = await apiCall(`/lawyers/${id}`);
    if (!res.success) {
      showError('Lawyer profile not found.');
      return;
    }

    const l = res.data;
    const backendBase = API_BASE.replace('/api', '');
    
    // Update Profile Hero
    const nameEl = document.querySelector('.lawyer-name');
    if (nameEl) nameEl.textContent = l.full_name;
    
    const metaEl = document.querySelector('.lawyer-meta');
    if (metaEl) metaEl.innerHTML = `${l.practice_area} &bull; ${l.court_of_practice || 'High Court'}`;
    
    // If profile_photo is a full URL (Cloudinary), use it directly. Otherwise construct local path.
    let photo = 'https://images.unsplash.com/photo-1607746882042-944635dfe10e'; // Fallback
    if (l.profile_photo) {
      photo = l.profile_photo.startsWith('http') ? l.profile_photo : `${backendBase}/uploads/profiles/${l.profile_photo}`;
    }

    const imgEl = document.querySelector('.profile-image');
    if (imgEl) {
      imgEl.src = photo;
      imgEl.onerror = () => { imgEl.src = 'images/expert-lawyer.jpg'; };
    }
    
    // Update Stats
    const stats = document.querySelectorAll('.profile-stats span');
    if (stats.length >= 3) {
      stats[0].innerHTML = `<i class="bi bi-clock-fill me-1"></i>${l.years_experience}`;
      stats[1].innerHTML = `<i class="bi bi-briefcase-fill me-1"></i>Verified Advocate`;
      stats[2].innerHTML = `<i class="bi bi-geo-alt-fill me-1"></i>${l.city}`;
    }

    // About Section
    const aboutEl = document.getElementById('profile-about');
    if (aboutEl) {
        aboutEl.textContent = l.bio || `Advocate ${l.full_name} is a highly experienced legal professional specializing in ${l.practice_area}. With over ${l.years_experience} in the legal field, they have successfully represented numerous clients in ${l.court_of_practice || 'various courts'}.`;
    }

    // Practice Areas
    const tagContainer = document.getElementById('profile-practice-tags');
    if (tagContainer) {
      const areas = l.practice_area ? l.practice_area.split(',').map(s => s.trim()) : ['General Practice'];
      tagContainer.innerHTML = areas.map(a => `<span class="practice-tag">${a}</span>`).join('');
    }

    // Lawyer Information Sidebar
    const infoSections = document.querySelectorAll('.profile-section');
    infoSections.forEach(sec => {
        const h5 = sec.querySelector('h5');
        if (h5 && h5.textContent.includes('Lawyer Information')) {
            sec.innerHTML = `
                <h5 class="fw-bold mb-3">Lawyer Information</h5>
                <p><strong>Location:</strong> ${l.city || 'N/A'}</p>
                <p><strong>Court:</strong> ${l.court_of_practice || 'N/A'}</p>
                <p><strong>Languages:</strong> ${l.languages || 'English, Hindi'}</p>
                <p><strong>Consultation:</strong> Online / Phone</p>
            `;
        }
    });

    // WhatsApp Link
    if (l.whatsapp && l.phone) {
      const consultBtn = document.querySelector('.consult-btn');
      if (consultBtn) {
        consultBtn.innerHTML = `<i class="bi bi-whatsapp me-2"></i>Contact via WhatsApp`;
        consultBtn.onclick = () => window.open(`https://wa.me/91${l.phone}`, '_blank');
      }
    }

  } catch (err) {
    console.error('Profile load error:', err);
    showError('Failed to load lawyer profile.');
  }
}

// ─── 8. NAVBAR LOGGED-IN STATE ────────────────────────────────────────────────

function initNavAuth() {
  const user = getUser();
  if (!user) return;

  document.querySelectorAll('[data-register-modal]').forEach(btn => {
    btn.textContent  = (user.name || user.full_name || '').split(' ')[0] || 'Profile';
    btn.title        = 'Click to logout';
    btn.removeAttribute('data-register-modal');
    btn.addEventListener('click', () => {
      clearToken();
      localStorage.removeItem('dekhlaw_user');
      window.location.reload();
    });
  });
}

// ─── Init on DOM Ready ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initUserRegistration();
  initLawyerRegistration();
  initSOSForm();
  initLawyerSearch();
  initLawyersPage();
  initLawyerProfilePage();
  initNavAuth();
});
