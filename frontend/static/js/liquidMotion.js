/**
 * ============================================================================
 * Apple "Liquid Glass" Motion & Physics Engine (iOS 26 / Tahoe / visionOS)
 * Zero-dependency, single rAF delta-time loop, spring physics, adaptive
 * transparency, fluid moving glass lens, 3D card tilt & sheen, and sheet morphing.
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  // Feature detection
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /* --------------------------------------------------------------------------
     1. HAPTIC FEEDBACK (Subtle 8ms vibration on mobile taps)
     -------------------------------------------------------------------------- */
  function triggerHaptic(duration = 8) {
    if (prefersReducedMotion) return;
    if (typeof window.AtheriaHaptics !== 'undefined') {
      window.AtheriaHaptics.trigger(duration);
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(duration);
      }
    } catch (_) {
      // Ignored if browser blocks vibration without direct gesture
    }
  }

  /* --------------------------------------------------------------------------
     2. SPRING PHYSICS RUNNER (Analytical Damped Harmonic Oscillator)
     -------------------------------------------------------------------------- */
  class Spring {
    constructor({ stiffness = 260, damping = 15, mass = 1, initial = 0 } = {}) {
      this.stiffness = stiffness;
      this.damping = damping;
      this.mass = mass;
      this.val = initial;
      this.target = initial;
      this.vel = 0;
      this.restThreshold = 0.001;
    }

    setTarget(t) {
      this.target = t;
    }

    reset(v) {
      this.val = v;
      this.target = v;
      this.vel = 0;
    }

    update(dt) {
      // Semi-implicit Euler integration
      const clampedDt = Math.min(dt, 0.05); // prevent explosion on tab backgrounding
      const force = -this.stiffness * (this.val - this.target) - this.damping * this.vel;
      const accel = force / this.mass;
      this.vel += accel * clampedDt;
      this.val += this.vel * clampedDt;

      const isResting = Math.abs(this.vel) < this.restThreshold && Math.abs(this.val - this.target) < this.restThreshold;
      if (isResting) {
        this.val = this.target;
        this.vel = 0;
      }
      return !isResting;
    }
  }

  /* --------------------------------------------------------------------------
     3. MASTER REQUEST-ANIMATION-FRAME LOOP & FPS ADAPTIVE QUALITY
     -------------------------------------------------------------------------- */
  const rafCallbacks = new Set();
  let lastTime = performance.now();
  let isRunning = false;

  // FPS Monitor
  let frameCount = 0;
  let fpsTimer = performance.now();
  let consecutiveDropTime = 0;
  let isLowPowerMode = false;

  function masterLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Monitor performance
    frameCount++;
    const elapsed = now - fpsTimer;
    if (elapsed >= 500) {
      const avgFrameTime = elapsed / frameCount;
      // If frame time > 16.6ms (dropped below 60fps) or on high-refresh > 12ms
      if (avgFrameTime > 18.0) {
        consecutiveDropTime += elapsed;
        if (consecutiveDropTime > 2000 && !isLowPowerMode) {
          isLowPowerMode = true;
          document.documentElement.dataset.perf = 'low-power';
        }
      } else {
        consecutiveDropTime = Math.max(0, consecutiveDropTime - elapsed);
        if (consecutiveDropTime === 0 && isLowPowerMode) {
          isLowPowerMode = false;
          if (document.documentElement.dataset.perf === 'low-power') {
            delete document.documentElement.dataset.perf;
          }
        }
      }
      frameCount = 0;
      fpsTimer = now;
    }

    // Execute registered animation ticks
    for (const cb of rafCallbacks) {
      try {
        cb(dt, now, isLowPowerMode);
      } catch (err) {
        console.warn('[LiquidMotion] Frame error:', err);
      }
    }

    if (rafCallbacks.size > 0) {
      requestAnimationFrame(masterLoop);
    } else {
      isRunning = false;
    }
  }

  function registerRaf(cb) {
    rafCallbacks.add(cb);
    if (!isRunning) {
      isRunning = true;
      lastTime = performance.now();
      requestAnimationFrame(masterLoop);
    }
    return () => {
      rafCallbacks.delete(cb);
    };
  }

  /* --------------------------------------------------------------------------
     4. ADAPTIVE TRANSPARENCY & SCROLL ENGINE
     - Linearly maps 0 to 24px of scroll to navbar tint
     - Intersecting sections adapt --glass-tint-alpha and text color
     - Button pointerdown drops alpha by 30% and lifts brightness
     -------------------------------------------------------------------------- */
  function initAdaptiveTransparency() {
    const navbar = document.querySelector('.glass-nav, .landing-nav');

    // Scroll-driven navbar tint saturation (0 to 24px)
    if (navbar) {
      let ticking = false;
      function onScroll() {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollY = window.scrollY || window.pageYOffset || 0;
            // 0px -> alpha 0.82; 24px -> alpha 0.94
            const progress = Math.min(scrollY / 24, 1);
            const baseAlpha = document.documentElement.dataset.theme === 'light' ? 0.75 : 0.80;
            const targetAlpha = baseAlpha + progress * 0.14;
            navbar.style.setProperty('--nav-scroll-alpha', targetAlpha.toFixed(3));
            if (progress > 0.05) {
              navbar.classList.add('nav-scrolled');
            } else {
              navbar.classList.remove('nav-scrolled');
            }
            ticking = false;
          });
          ticking = true;
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Active button press lens-lift effect (alpha drops 30%, brightness up)
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('.glass-btn, .btn, .glass-card, [data-glass-press]');
      if (!btn) return;
      btn.classList.add('is-pressed');
    }, { passive: true });

    const clearPress = (e) => {
      const pressed = document.querySelectorAll('.is-pressed');
      pressed.forEach((el) => {
        el.classList.remove('is-pressed');
      });
      if (pressed.length > 0) {
        triggerHaptic(8);
      }
    };

    document.addEventListener('pointerup', clearPress, { passive: true });
    document.addEventListener('pointercancel', clearPress, { passive: true });
  }

  /* --------------------------------------------------------------------------
     5. FLUID MOVING GLASS LENS (GlassTabBar with stretch, squash & landing wobble)
     -------------------------------------------------------------------------- */
  function initGlassTabBar(container) {
    if (!container) return null;

    // Remove any duplicate or rogue lenses to guarantee strictly 1 lens
    const existingLenses = container.querySelectorAll(':scope > .glass-lens, .glass-lens');
    existingLenses.forEach((l, idx) => {
      if (idx > 0) l.remove();
    });

    let lens = container.querySelector(':scope > .glass-lens');
    if (!lens) {
      lens = document.createElement('div');
      lens.className = 'glass-lens';
      lens.setAttribute('aria-hidden', 'true');
      container.prepend(lens);
    }

    const items = Array.from(container.querySelectorAll('.nav-item, .mobile-tab-item, [role="tab"], .glass-tab-item'));
    if (items.length === 0) return null;

    function getContainerRelativeRect(elem) {
      const cRect = container.getBoundingClientRect();
      const eRect = elem.getBoundingClientRect();
      const clientLeft = container.clientLeft || 0;
      const clientTop = container.clientTop || 0;
      return {
        left: eRect.left - cRect.left - clientLeft + container.scrollLeft,
        top: eRect.top - cRect.top - clientTop + container.scrollTop,
        width: eRect.width,
        height: eRect.height,
      };
    }

    let currentTarget = null;

    function positionLens(target, animate = true) {
      if (!target) return;
      currentTarget = target;

      // Toggle active class before rect measurement so active typography applies
      items.forEach((it) => {
        it.classList.toggle('active', it === target);
      });

      const rect = getContainerRelativeRect(target);
      if (animate && !prefersReducedMotion) {
        lens.style.transition = 'transform 220ms cubic-bezier(0.2, 0, 0, 1), width 220ms cubic-bezier(0.2, 0, 0, 1), height 220ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms ease';
      } else {
        lens.style.transition = 'none';
      }
      lens.style.transform = `translate3d(${rect.left.toFixed(2)}px, ${rect.top.toFixed(2)}px, 0)`;
      lens.style.width = `${rect.width.toFixed(2)}px`;
      lens.style.height = `${rect.height.toFixed(2)}px`;
      lens.style.opacity = '1';
    }

    // Initial placement on active or first item
    const initialTarget = items.find((it) => it.classList.contains('active')) || items[0];
    if (initialTarget) {
      currentTarget = initialTarget;
      requestAnimationFrame(() => {
        positionLens(initialTarget, false);
      });
    }

    // HARD CLICK ONLY - Hover strictly disabled per user specification
    items.forEach((item) => {
      item.addEventListener('click', (e) => {
        positionLens(item, true);
        triggerHaptic(6);
      });
    });

    function getActiveItem() {
      return items.find((it) => it.classList.contains('active')) || currentTarget || items[0];
    }

    // Resize recalibration
    window.addEventListener('resize', () => {
      const active = getActiveItem();
      if (active) {
        positionLens(active, false);
      }
    }, { passive: true });

    // ResizeObserver to recalibrate on window/container resize
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        const active = getActiveItem();
        if (active) {
          positionLens(active, false);
        }
      });
      ro.observe(container);
    }

    // Fonts ready recalibration (ensures exact text bounding rect once fonts render)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        const active = getActiveItem();
        if (active) {
          positionLens(active, false);
        }
      });
    }

    return {
      setActive: (item) => positionLens(item, true),
      recalculate: () => {
        const active = getActiveItem();
        if (active) positionLens(active, false);
      },
    };
  }

  /* --------------------------------------------------------------------------
     6. POINTER-FOLLOW 3D TILT & SPECULAR SHEEN (GlassCard)
     - rAF spring physics smoothing
     - Max 4-6 degrees rotation
     - Dynamic specular sheen moves in opposite direction
     -------------------------------------------------------------------------- */
  function initGlassCardTilt() {
    if (prefersReducedMotion || supportsTouch) return;

    const cards = document.querySelectorAll('.glass-card, .feature-card');
    cards.forEach((card) => {
      let isHovered = false;
      const rotX = new Spring({ stiffness: 180, damping: 20 });
      const rotY = new Spring({ stiffness: 180, damping: 20 });
      const sheenX = new Spring({ stiffness: 200, damping: 22, initial: 50 });
      const sheenY = new Spring({ stiffness: 200, damping: 22, initial: 50 });

      let cardRect = null;
      let unregister = null;

      function onMouseMove(e) {
        if (!cardRect) cardRect = card.getBoundingClientRect();
        const x = e.clientX - cardRect.left;
        const y = e.clientY - cardRect.top;

        const normX = (x / cardRect.width) * 2 - 1; // -1 to 1
        const normY = (y / cardRect.height) * 2 - 1;

        // Subtle tilt: max 4 deg
        const targetRotY = normX * 4;
        const targetRotX = -normY * 4;

        // Specular sheen moves opposite
        const targetSheenX = 50 - normX * 35;
        const targetSheenY = 50 - normY * 35;

        rotX.setTarget(targetRotX);
        rotY.setTarget(targetRotY);
        sheenX.setTarget(targetSheenX);
        sheenY.setTarget(targetSheenY);
      }

      function onMouseEnter() {
        if (document.documentElement.dataset.perf === 'low-power') return;
        isHovered = true;
        cardRect = card.getBoundingClientRect();
        card.style.willChange = 'transform';

        if (!unregister) {
          unregister = registerRaf((dt, now, isLowPower) => {
            if (isLowPower) {
              card.style.transform = '';
              return;
            }

            const activeX = rotX.update(dt);
            const activeY = rotY.update(dt);
            const activeSX = sheenX.update(dt);
            const activeSY = sheenY.update(dt);

            card.style.transform = `perspective(1000px) rotateX(${rotX.val.toFixed(2)}deg) rotateY(${rotY.val.toFixed(2)}deg) translateY(-3px)`;
            card.style.setProperty('--glass-sheen-x', `${sheenX.val.toFixed(1)}%`);
            card.style.setProperty('--glass-sheen-y', `${sheenY.val.toFixed(1)}%`);

            if (!isHovered && !activeX && !activeY && !activeSX && !activeSY) {
              card.style.willChange = '';
              card.style.transform = '';
              if (unregister) {
                unregister();
                unregister = null;
              }
            }
          });
        }
      }

      function onMouseLeave() {
        isHovered = false;
        cardRect = null;
        rotX.setTarget(0);
        rotY.setTarget(0);
        sheenX.setTarget(50);
        sheenY.setTarget(50);
      }

      card.addEventListener('mouseenter', onMouseEnter, { passive: true });
      card.addEventListener('mousemove', onMouseMove, { passive: true });
      card.addEventListener('mouseleave', onMouseLeave, { passive: true });
    });
  }

  /* --------------------------------------------------------------------------
     7. APPLE-STYLE SHEET & MODAL SYSTEM (Background Scale-Down + Spring Rise)
     -------------------------------------------------------------------------- */
  function initGlassModals() {
    const rootContainer = document.querySelector('.app-container, .landing-viewport, body > main') || document.body;

    function openModal(modal) {
      if (!modal) return;
      modal.classList.add('active');
      document.body.classList.add('modal-open');
      rootContainer.classList.add('page-sheet-scaled');
      triggerHaptic(12);

      // Focus first actionable element
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove('active');
      
      const anyActive = document.querySelector('.modal-overlay.active, .glass-overlay.active');
      if (!anyActive) {
        document.body.classList.remove('modal-open');
        rootContainer.classList.remove('page-sheet-scaled');
      }
    }

    document.querySelectorAll('[data-modal-open]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-modal-open');
        const modal = document.getElementById(id);
        if (modal) openModal(modal);
      });
    });

    document.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = btn.closest('.modal-overlay, .glass-overlay');
        if (modal) closeModal(modal);
      });
    });

    document.querySelectorAll('.modal-overlay, .glass-overlay').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    });

    // Escape key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active, .glass-overlay.active');
        if (activeModal) closeModal(activeModal);
      }
    });

    window.GlassModal = {
      open: openModal,
      close: closeModal,
    };
  }

  /* --------------------------------------------------------------------------
     8. VIEW TRANSITIONS API HELPER (Route & Tab Morphing)
     -------------------------------------------------------------------------- */
  function viewTransition(updateCallback) {
    if (prefersReducedMotion || !document.startViewTransition) {
      updateCallback();
      return Promise.resolve();
    }
    return document.startViewTransition(updateCallback).finished;
  }

  /* --------------------------------------------------------------------------
     9. AUTO-INITIALIZATION ON DOM READY
     -------------------------------------------------------------------------- */
  function initAll() {
    initAdaptiveTransparency();

    // Tab bars (Navbars, segmented controls, mobile tab bar)
    const tabBars = document.querySelectorAll('.glass-tab-bar, .mobile-tab-bar');
    const tabBarInstances = [];
    tabBars.forEach((tb) => {
      const inst = initGlassTabBar(tb);
      if (inst) tabBarInstances.push(inst);
    });

    initGlassCardTilt();
    initGlassModals();

    // Export global API
    window.LiquidMotion = {
      Spring,
      registerRaf,
      triggerHaptic,
      viewTransition,
      tabBarInstances,
      refresh: () => {
        tabBarInstances.forEach((inst) => inst.recalculate());
      },
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})(window, document);
