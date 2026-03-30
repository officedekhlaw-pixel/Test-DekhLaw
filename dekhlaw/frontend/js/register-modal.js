/* DekhLaw – Registration Type Modal
   Intercepts every "Register As…" link/button and shows a
   "Register As User  |  Register As Lawyer" choice modal.
   ---------------------------------------------------------- */
(function () {
  'use strict';

  /* ── 1. Inject modal HTML ─────────────────────────────── */
  const modalHTML = `
<div class="reg-modal-overlay" id="regModalOverlay" role="dialog" aria-modal="true" aria-labelledby="regModalTitle">
  <div class="reg-modal-box">
    <button class="reg-modal-close" id="regModalClose" aria-label="Close">&times;</button>
    <div class="reg-modal-title" id="regModalTitle">Join DekhLaw</div>
    <div class="reg-modal-sub">Who are you joining as?</div>
    <div class="reg-modal-cards">
      <a href="user-registration.html" class="reg-modal-card" id="regCardUser">
        <div class="reg-modal-icon user-icon"><i class="bi bi-person-fill"></i></div>
        <div>
          <div class="reg-modal-card-title">Sign Up as a User</div>
          <div class="reg-modal-card-desc">Find &amp; connect with verified lawyers across India — free</div>
        </div>
      </a>
      <a href="lawyer-registration.html" class="reg-modal-card" id="regCardLawyer">
        <div class="reg-modal-icon lawyer-icon"><i class="bi bi-briefcase-fill"></i></div>
        <div>
          <div class="reg-modal-card-title">Register as a Lawyer</div>
          <div class="reg-modal-card-desc">List your profile, get discovered by clients — free</div>
        </div>
      </a>
    </div>
  </div>
</div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const overlay  = document.getElementById('regModalOverlay');
  const closeBtn = document.getElementById('regModalClose');

  function openModal() { overlay.classList.add('show'); document.body.style.overflow = 'hidden'; }
  function closeModal() { overlay.classList.remove('show'); document.body.style.overflow = ''; }

  /* Close on overlay click */
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  /* Close on × button */
  closeBtn.addEventListener('click', closeModal);

  /* Close on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ── 2. Intercept all register-related links/buttons ──── */
  /* Matches nav links, CTA buttons, hero buttons, footer links
     that point to either registration page, AND any element
     with data-register-modal attribute.                     */
  function isRegisterTrigger(el) {
    /* Any element with data-register-modal attribute */
    if (el.dataset && el.dataset.registerModal !== undefined) return true;
    /* <a> pointing to a registration page (footer links etc.) */
    if (el.tagName === 'A') {
      const href = (el.getAttribute('href') || '').replace(/^.*\//, '');
      if (href === 'user-registration.html' || href === 'lawyer-registration.html') return true;
    }
    /* Hero CTA button text */
    const txt = el.textContent.trim().toLowerCase();
    if (el.tagName === 'A' && (txt.includes('sign up as a lawyer') || txt.includes('sign up as a user'))) return true;
    return false;
  }

  document.addEventListener('click', function (e) {
    /* If the click is inside the modal, let it navigate normally */
    if (overlay.contains(e.target)) return;

    /* Walk up max 3 levels to find the actual link/button */
    let el = e.target;
    for (let i = 0; i < 3; i++) {
      if (!el || el === document.body) break;
      if (isRegisterTrigger(el)) {
        e.preventDefault();
        openModal();
        return;
      }
      el = el.parentElement;
    }
  }, true); /* capture phase so it fires before other handlers */

})();
