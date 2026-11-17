/**
 * Atheria Reserve Bank - VisionOS Micro-Interactions & Super-Smooth Motion Engine
 * Features: Lenis Smooth Scrolling, GSAP ScrollTrigger Integration, 3D Card Parallax,
 * Scroll-Driven Section Reveals, and Reactive Specular Lighting
 */

document.addEventListener('DOMContentLoaded', () => {
  initLenisSmoothScroll();
  initGSAPScrollAnimations();
  initCardStackScroll();
  initCellDivisionObserver();
  initRevealObserver();
  initSmoothAnchorLinks();
  initThemeToggle();
  initGlassSpecularTracking();
  init3DCardParallaxHover();
  initNumberCounters();
  initModals();
  initToasts();
  initNavbarScrollState();
});

// 1. Lenis Smooth Momentum Scrolling (Synced with GSAP ScrollTrigger)
let lenis = null;
function initLenisSmoothScroll() {
  if (typeof Lenis !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple exponential spring ease
      direction: 'vertical',
      smooth: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

// 2. GSAP ScrollTrigger Integration & Scroll-Driven Choreography
function initGSAPScrollAnimations() {
  if (typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Sync Lenis with GSAP ScrollTrigger
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Staggered Entrance for Hero Elements on Page Load
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    gsap.from('.hero-pill, .hero-title, .hero-desc, .hero-cta, .hero-stats', {
      y: 40,
      opacity: 0,
      duration: 1.0,
      ease: 'power3.out',
      stagger: 0.12,
      clearProps: 'transform,opacity',
    });

    gsap.from('.hero-3d-container', {
      scale: 0.92,
      opacity: 0,
      duration: 1.4,
      ease: 'power2.out',
      delay: 0.15,
      clearProps: 'transform,opacity',
    });
  }

  // ScrollTrigger for Section Headers & Grids
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.utils.toArray('.section-head').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 45,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    });

    gsap.utils.toArray('.features-grid').forEach((grid) => {
      const cards = grid.querySelectorAll('.feature-card');
      gsap.from(cards, {
        scrollTrigger: {
          trigger: grid,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.85,
        stagger: 0.16,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    });

    // Dashboard Cards Stagger Entrance
    gsap.utils.toArray('.kpi-grid, .admin-charts-grid, .dashboard-hero-grid, .quick-actions-bar').forEach((container) => {
      gsap.from(container.children, {
        scrollTrigger: {
          trigger: container,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    });
  }
}

// 2b. Card-Based Scrolling Stacking Controller
function initCardStackScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) return;

  const stackCards = gsap.utils.toArray('.stack-card');
  if (stackCards.length < 2) return;

  stackCards.forEach((card, index) => {
    if (index === stackCards.length - 1) return; // Topmost card does not get covered
    const nextCard = stackCards[index + 1];

    ScrollTrigger.create({
      trigger: nextCard,
      start: 'top 85%',
      end: 'top 104px',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        const scale = 1 - p * 0.06; // Scales down to 0.94
        const brightness = 1 - p * 0.35; // Dims slightly for depth
        const yOffset = p * 12;
        card.style.transform = `scale(${scale}) translateY(${yOffset}px)`;
        card.style.filter = `brightness(${brightness})`;
        card.style.opacity = `${1 - p * 0.22}`;
      }
    });
  });
}

// 2c. Mitotic Cell Division Observer (Only animates when in viewport)
function initCellDivisionObserver() {
  const cellDivisions = document.querySelectorAll('.cell-division');
  if (!cellDivisions.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-animating');
      } else {
        entry.target.classList.remove('is-animating');
      }
    });
  }, { threshold: 0.1 });

  cellDivisions.forEach((el) => observer.observe(el));
}

// 2d. Smooth Anchor Link Handler (Preserves Lenis momentum scroll)
function initSmoothAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElem = document.querySelector(targetId);
        if (targetElem) {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(targetElem, { offset: -90 });
          } else {
            targetElem.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  });
}

// 2e. Apple Glass Reveal Observer (Toggles .in via IntersectionObserver)
function initRevealObserver() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach((el) => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach((el) => observer.observe(el));
}

// 3. Dynamic Specular Lighting for Glass Surfaces
function initGlassSpecularTracking() {
  const glassElements = document.querySelectorAll('.glass-panel, .glass-card, .bank-card, .feature-card');
  glassElements.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// 4. Apple Wallet 3D Card Tilt Interaction
function init3DCardParallaxHover() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.bank-card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotX = -(y / (rect.height / 2)) * 10;
      const rotY = (x / (rect.width / 2)) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)`;
      card.style.transition = 'transform 0.5s var(--ease)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });
}

// 5. Navbar Floating Glass Dynamic State on Scroll
function initNavbarScrollState() {
  const nav = document.querySelector('.landing-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 50) {
      nav.style.top = '16px';
      nav.style.boxShadow = '0 24px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
    } else {
      nav.style.top = '28px';
      nav.style.boxShadow = '0 20px 44px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.14)';
    }
  }, { passive: true });
}

// 6. Theme Management
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('atheria_theme') || localStorage.getItem('aetheria_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('atheria_theme', nextTheme);
    });
  }
}

// 7. Currency Formatter (INR)
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

// 8. Number Counters (Triggered on Visibility)
function initNumberCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  counters.forEach((c) => observer.observe(c));

  function animateCounter(counter) {
    const target = parseFloat(counter.getAttribute('data-counter')) || 0;
    const isCurrency = counter.hasAttribute('data-is-currency');
    const duration = 1200;
    const startTime = performance.now();

    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;

      if (isCurrency) {
        counter.textContent = formatINR(current);
      } else {
        counter.textContent = Math.round(current).toLocaleString('en-IN');
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = isCurrency ? formatINR(target) : target.toLocaleString('en-IN');
      }
    }
    requestAnimationFrame(update);
  }
}

// 9. Modals
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-open');
      const target = document.getElementById(modalId);
      if (target) target.classList.add('active');
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
}

// 10. Toasts
function initToasts() {
  document.querySelectorAll('.toast').forEach((toast) => {
    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s var(--ease), transform 0.4s var(--ease)';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  });
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s var(--ease), transform 0.4s var(--ease)';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px) scale(0.95)';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}
