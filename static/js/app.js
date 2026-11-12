/**
 * Apex Global Bank - VisionOS Micro-Interactions & Super-Smooth Motion Engine
 * Features: Lenis Smooth Scrolling, 3D Card Hover Tilts, Dynamic Specular Lighting
 */

document.addEventListener('DOMContentLoaded', () => {
  initLenisSmoothScroll();
  initThemeToggle();
  initGlassSpecularTracking();
  init3DCardParallaxHover();
  initNumberCounters();
  initModals();
  initToasts();
});

// 1. Lenis Smooth Scrolling (target 60fps)
let lenis = null;
function initLenisSmoothScroll() {
  if (typeof Lenis !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like exponential ease
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

// 2. Dynamic Specular Lighting for Glass Surfaces
function initGlassSpecularTracking() {
  const glassElements = document.querySelectorAll('.glass-panel, .glass-card, .bank-card');
  glassElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// 3. Apple Wallet 3D Card Tilt Interaction
function init3DCardParallaxHover() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.bank-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotX = -(y / (rect.height / 2)) * 10; // Max 10 deg
      const rotY = (x / (rect.width / 2)) * 12; // Max 12 deg

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

// 4. Theme Management
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('apex_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('apex_theme', nextTheme);
    });
  }
}

// 5. Currency Formatter (INR)
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

// 6. Smooth Number Counters on Load
function initNumberCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach(counter => {
    const target = parseFloat(counter.getAttribute('data-counter')) || 0;
    const isCurrency = counter.hasAttribute('data-is-currency');
    const duration = 1000;
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
        if (isCurrency) {
          counter.textContent = formatINR(target);
        } else {
          counter.textContent = target.toLocaleString('en-IN');
        }
      }
    }
    requestAnimationFrame(update);
  });
}

// 7. Modals
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-open');
      const target = document.getElementById(modalId);
      if (target) target.classList.add('active');
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
}

// 8. Toasts
function initToasts() {
  document.querySelectorAll('.toast').forEach(toast => {
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
