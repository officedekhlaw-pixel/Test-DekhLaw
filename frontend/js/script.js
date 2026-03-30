document.addEventListener("DOMContentLoaded", function () {

  /* ===========================
     FIX MOBILE 100VH ISSUE
  ============================ */
  function setRealHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setRealHeight();
  window.addEventListener('resize', setRealHeight);

  /* ===========================
     AOS INITIALIZATION
  ============================ */
  if (typeof AOS !== "undefined") {
    AOS.init({ 
      duration: 800, 
      once: true, 
      easing: "ease-out-quart",
      offset: 50
    });
  }

  /* ===========================
     MOBILE MENU TOGGLE
  ============================ */
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeMenu  = document.getElementById("closeMenu");

  if (menuToggle && mobileMenu && closeMenu && !menuToggle.dataset.bound) {
    menuToggle.dataset.bound = '1';
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.add("active");
      menuToggle.classList.add("open");
      document.body.style.overflow = "hidden";
    });
    closeMenu.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      menuToggle.classList.remove("open");
      document.body.style.overflow = "auto";
    });
    document.querySelectorAll(".menu-links a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        menuToggle.classList.remove("open");
        document.body.style.overflow = "auto";
      });
    });
  }

  /* ===========================
     COUNTER ANIMATION
  ============================ */
  const counters = document.querySelectorAll('.counter');
  const statsSection = document.querySelector('.stats');
  if (counters.length && statsSection) {
    let counterStarted = false;
    function startCounters() {
      counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 1200;
        const startTime = performance.now();
        function update(currentTime) {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          counter.innerText = Math.floor(progress * target);
          if (progress < 1) requestAnimationFrame(update);
          else counter.innerText = target;
        }
        requestAnimationFrame(update);
      });
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counterStarted) {
          counterStarted = true;
          startCounters();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(statsSection);
  }

  /* ===========================
     SWIPER: LEGAL ANSWERS
  ============================ */
  if (typeof Swiper !== "undefined" && document.querySelector('.answersSwiper')) {
    new Swiper(".answersSwiper", {
      slidesPerView: 1, spaceBetween: 24, loop: true, speed: 700,
      autoplay: { delay: 3500, disableOnInteraction: false },
      navigation: { nextEl: ".answers-next", prevEl: ".answers-prev" },
      breakpoints: { 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }
    });
  }

  /* ===========================
     SWIPER: TESTIMONIALS
  ============================ */
  if (typeof Swiper !== "undefined" && document.querySelector('.clientSwiper')) {
    new Swiper(".clientSwiper", {
      slidesPerView: 1, spaceBetween: 24, loop: true, speed: 700,
      autoplay: { delay: 3500, disableOnInteraction: false },
      navigation: { nextEl: ".testimonial-next", prevEl: ".testimonial-prev" },
      breakpoints: { 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }
    });
  }

  /* ===========================
     FAQ ACCORDION (custom)
  ============================ */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ===========================
     LOAD MORE LAWYERS
  ============================ */
  const loadMoreBtn = document.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      document.querySelectorAll('.extra-lawyer').forEach(el => el.style.display = 'block');
      loadMoreBtn.style.display = 'none';
    });
  }

});
