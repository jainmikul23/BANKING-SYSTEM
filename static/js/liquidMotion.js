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
        // Trigger subtle landing spring
        el.classList.add('is-released');
        setTimeout(() => el.classList.remove('is-released'), 400);
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

    let lens = container.querySelector('.glass-lens');
    if (!lens) {
      lens = document.createElement('div');
      lens.className = 'glass-lens';
      lens.setAttribute('aria-hidden', 'true');
      container.prepend(lens);
    }

    const items = Array.from(container.querySelectorAll('.nav-item, .mobile-tab-item, [role="tab"], .glass-tab-item'));
    if (items.length === 0) return null;

    // Physics instances for lens position & dimensions
    const springX = new Spring({ stiffness: 260, damping: 15 });
    const springW = new Spring({ stiffness: 300, damping: 18 });
    const springStretch = new Spring({ stiffness: 240, damping: 14 });

    let activeItem = items.find((it) => it.classList.contains('active')) || items[0];
    let isDragging = false;
    let dragStartX = 0;
    let dragCurrentX = 0;
    let isAnimating = false;
    let unregisterRaf = null;

    function getContainerRelativeRect(elem) {
      const cRect = container.getBoundingClientRect();
      const eRect = elem.getBoundingClientRect();
      return {
        left: eRect.left - cRect.left + container.scrollLeft,
        top: eRect.top - cRect.top + container.scrollTop,
        width: eRect.width,
        height: eRect.height,
        centerX: eRect.left - cRect.left + container.scrollLeft + eRect.width / 2,
      };
    }

    function positionLensImmediately(target) {
      if (!target) return;
      const rect = getContainerRelativeRect(target);
      springX.reset(rect.left);
      springW.reset(rect.width);
      springStretch.reset(0);

      lens.style.transform = `translate3d(${rect.left}px, 0, 0) scale(1, 1)`;
      lens.style.width = `${rect.width}px`;
      lens.style.height = `${rect.height}px`;
      lens.style.opacity = '1';

      items.forEach((it) => {
        if (it === target) {
          it.classList.add('active');
        } else {
          it.classList.remove('active');
        }
      });
    }

    function animateTo(target, withWobble = true) {
      if (!target || prefersReducedMotion) {
        positionLensImmediately(target);
        return;
      }

      const rect = getContainerRelativeRect(target);
      const currentPos = springX.val;
      const dx = rect.left - currentPos;

      // Calculate directional stretch (up to 1.25 scaleX, 0.92 scaleY)
      const maxDistance = Math.max(container.clientWidth * 0.5, 120);
      const stretchAmount = Math.min(Math.abs(dx) / maxDistance, 1) * 0.25;
      springStretch.reset(stretchAmount);

      springX.setTarget(rect.left);
      springW.setTarget(rect.width);
      springStretch.setTarget(0);

      items.forEach((it) => {
        if (it === target) {
          it.classList.add('active');
        } else {
          it.classList.remove('active');
        }
      });
      activeItem = target;

      if (!isAnimating) {
        isAnimating = true;
        unregisterRaf = registerRaf((dt) => {
          const movingX = springX.update(dt);
          const movingW = springW.update(dt);
          const movingS = springStretch.update(dt);

          const curX = springX.val;
          const curW = springW.val;
          const curS = springStretch.val;

          // Stretch along direction of motion
          const scaleX = 1 + curS;
          const scaleY = Math.max(0.92, 1 - curS * 0.32);

          lens.style.width = `${curW}px`;
          lens.style.transform = `translate3d(${curX}px, 0, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;

          if (!movingX && !movingW && !movingS) {
            isAnimating = false;
            if (unregisterRaf) unregisterRaf();
            unregisterRaf = null;

            // Trigger arrival jelly landing jiggle
            if (withWobble) {
              lens.classList.remove('lens-jiggle');
              void lens.offsetWidth; // trigger reflow
              lens.classList.add('lens-jiggle');
              triggerHaptic(8);
            }
          }
        });
      }
    }

    // Attach click/hover listeners
    items.forEach((item) => {
      item.addEventListener('click', (e) => {
        // If it's an internal tab button or hash link, animate smoothly
        animateTo(item, true);
      });

      // Hover preview if device supports hover
      if (!supportsTouch) {
        item.addEventListener('mouseenter', () => {
          if (!isDragging) {
            animateTo(item, false);
          }
        });
      }
    });

    if (!supportsTouch) {
      container.addEventListener('mouseleave', () => {
        if (!isDragging && activeItem) {
          animateTo(activeItem, true);
        }
      });
    }

    // Drag / Touch gestures across the tab bar with rubber-band follow
    container.addEventListener('pointerdown', (e) => {
      // Ignore if clicking a button specifically with direct link
      isDragging = true;
      dragStartX = e.clientX;
      dragCurrentX = e.clientX;
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      dragCurrentX = e.clientX;

      // Find closest item to cursor
      const cRect = container.getBoundingClientRect();
      const relativeX = dragCurrentX - cRect.left;

      let closest = items[0];
      let minDist = Infinity;
      items.forEach((it) => {
        const iRect = getContainerRelativeRect(it);
        const dist = Math.abs(iRect.centerX - relativeX);
        if (dist < minDist) {
          minDist = dist;
          closest = it;
        }
      });

      if (closest && closest !== activeItem) {
        animateTo(closest, false);
      }
    }, { passive: true });

    window.addEventListener('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        if (activeItem) {
          animateTo(activeItem, true);
        }
      }
    }, { passive: true });

    // Initial positioning
    requestAnimationFrame(() => {
      positionLensImmediately(activeItem);
    });

    // ResizeObserver to recalibrate on window resize
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (activeItem) {
          positionLensImmediately(activeItem);
        }
      });
      ro.observe(container);
    }

    return {
      setActive: (item) => animateTo(item, true),
      recalculate: () => positionLensImmediately(activeItem),
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
    const tabBars = document.querySelectorAll('.glass-tab-bar, .landing-nav .nav-menu, .mobile-tab-bar');
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
