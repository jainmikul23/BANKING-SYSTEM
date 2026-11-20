/**
 * Atheria Reserve Bank - VisionOS Micro-Interactions & Super-Smooth Motion Engine
 * Features: Lenis Smooth Scrolling, GSAP ScrollTrigger Integration, 3D Card Parallax,
 * Scroll-Driven Section Reveals, and Reactive Specular Lighting
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdaptivePerformance();
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
        const scale = 1 - p * 0.05; // Scales down smoothly to 0.95
        const yOffset = p * 10;
        card.style.transform = `translate3d(0, ${yOffset}px, 0) scale(${scale})`;
        card.style.opacity = `${1 - p * 0.32}`;
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
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach((el) => observer.observe(el));
}

// 3. Dynamic Specular Lighting for Glass Surfaces (Event Delegation, zero layout thrashing)
function initGlassSpecularTracking() {
  if (window.matchMedia('(hover: none)').matches) return;
  let ticking = false;

  document.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const el = e.target.closest('.glass-panel, .glass-card, .bank-card, .feature-card');
      if (el) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
      ticking = false;
    });
  }, { passive: true });
}

// 4. Apple Wallet 3D Card Tilt Interaction (Cached Rectangles, zero reflow per frame)
function init3DCardParallaxHover() {
  if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.bank-card');
  cards.forEach((card) => {
    let rect = null;

    card.addEventListener('mouseenter', () => {
      rect = card.getBoundingClientRect();
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('mousemove', (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotX = -(y / (rect.height / 2)) * 10;
      const rotY = (x / (rect.width / 2)) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      rect = null;
      card.style.transition = 'transform 0.4s var(--ease)';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    }, { passive: true });
  });
}

// 5. Navbar Floating Glass Dynamic State on Scroll (Batched via Lenis/rAF)
function initNavbarScrollState() {
  const nav = document.querySelector('.landing-nav');
  if (!nav) return;

  let isScrolled = false;
  function updateNav(y) {
    const shouldBeScrolled = y > 50;
    if (shouldBeScrolled !== isScrolled) {
      isScrolled = shouldBeScrolled;
      if (isScrolled) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    }
  }

  if (lenis) {
    lenis.on('scroll', ({ scroll }) => updateNav(scroll));
  } else {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateNav(window.scrollY || window.pageYOffset);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
}

// 6. Adaptive Performance & Low-Power Engine (120 FPS Enforcer)
function initAdaptivePerformance() {
  function enableLowPowerMode() {
    if (!document.documentElement.hasAttribute('data-perf')) {
      document.documentElement.setAttribute('data-perf', 'low-power');
      window.IS_LOW_POWER_MODE = true;
    }
  }

  // Adaptive FPS Tracker: detects sub-40 FPS sustained drops and adapts automatically
  let frameCount = 0;
  let lastTime = performance.now();
  let subTargetCount = 0;

  function monitorFPS() {
    frameCount++;
    const now = performance.now();
    const elapsed = now - lastTime;

    if (elapsed >= 1000) {
      const currentFps = (frameCount * 1000) / elapsed;
      if (currentFps < 40) {
        subTargetCount++;
        if (subTargetCount >= 2) {
          enableLowPowerMode();
        }
      } else {
        subTargetCount = 0;
      }
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(monitorFPS);
  }
  requestAnimationFrame(monitorFPS);
}

// 6. Centralized Single-Source Theme Management
window.AtheriaTheme = (function () {
  const THEME_KEY = 'atheria_theme';

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem(THEME_KEY) || 'dark';
  }

  function applyTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
      document.cookie = `${THEME_KEY}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}

    updateToggleIcons(theme);

    // Notify components (charts, WebGL, custom widgets)
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  function toggle() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return next;
  }

  function updateToggleIcons(theme) {
    const isLight = theme === 'light';
    const toggles = document.querySelectorAll('#theme-toggle-btn, .theme-toggle-btn, [data-theme-toggle]');
    toggles.forEach((btn) => {
      btn.setAttribute('aria-label', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');
      btn.setAttribute('title', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');
      btn.innerHTML = isLight
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    });
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    const current = getTheme();
    applyTheme(current);

    // Global click listener via delegation for all theme toggle buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#theme-toggle-btn, .theme-toggle-btn, [data-theme-toggle]');
      if (btn) {
        e.preventDefault();
        toggle();
      }
    });

    // Cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === THEME_KEY && e.newValue) {
        applyTheme(e.newValue);
      }
    });
  }

  return {
    getTheme,
    setTheme: applyTheme,
    toggle,
    init,
    updateIcons: updateToggleIcons,
  };
})();

function initThemeToggle() {
  window.AtheriaTheme.init();
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
