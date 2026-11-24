/**
 * Atheria Reserve Bank - Advanced Vibration & Haptic Feedback Engine
 * 
 * Features:
 * 1. Hybrid Dual-Engine:
 *    - Hardware Vibration API (navigator.vibrate) for Android/Mobile devices
 *    - Synthesized Web Audio Micro-Haptics (AudioContext mechanical impulses) for iOS Safari & Desktop
 * 2. Signature Haptic Profiles (tick, tap, medium, heavy, success, warning, error, vault, section, payment)
 * 3. Section-Level Intersection Observer (tactile notches as user scrolls through major sections)
 * 4. Micro-Interaction Listeners (Buttons, Sliders, Chips, Tabs, Form Inputs, Modals, Toasts)
 * 5. Accessibility & Power Management (Respects prefers-reduced-motion, intelligent throttle, persistence)
 */

(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'atheria_haptics_enabled';
  const COOLDOWN_MS = 65; // Minimum interval between successive haptic pulses to prevent fatigue
  let lastHapticTime = 0;
  let audioCtx = null;
  let audioAllowed = false;

  // Haptic vibration patterns in milliseconds [vibrate, pause, vibrate, ...]
  const HAPTIC_PROFILES = {
    notch: [6],                      // Ultra-light micro-detent for sliders & scroll section markers
    tick: [10],                      // Subtle input focus & card hover
    tap: [16],                       // Standard button click & navigation link
    medium: [24],                    // Modal open, tab change, dropdown select, theme toggle
    heavy: [35, 20, 15],             // Fund transfer review, loan application submit
    success: [15, 50, 25],           // Transaction authorized, login success, KYC approved
    warning: [30, 45, 30],           // Daily limit warning, unsaved changes prompt
    error: [40, 50, 40, 50, 40],     // Validation failure, account lockout, invalid input
    vault: [18, 30, 15, 25, 28],     // Gyroscope vault lock tumbler sequence on auth
    section: [8, 25, 6],             // Section scroll boundary transition pulse
    payment: [20, 40, 20, 55, 35]    // Fund transfer completed & ledger written
  };

  // Synthesized Web Audio acoustic profiles (Frequency, Duration, Gain, Type)
  const AUDIO_PROFILES = {
    notch: { freq: 320, duration: 0.012, gain: 0.035, type: 'triangle' },
    tick: { freq: 280, duration: 0.016, gain: 0.04, type: 'sine' },
    tap: { freq: 220, duration: 0.022, gain: 0.05, type: 'sine' },
    medium: { freq: 180, duration: 0.03, gain: 0.065, type: 'triangle' },
    heavy: { freq: 120, duration: 0.045, gain: 0.08, type: 'square' },
    success: { freq: 440, duration: 0.06, gain: 0.06, type: 'sine' },
    warning: { freq: 160, duration: 0.05, gain: 0.07, type: 'sawtooth' },
    error: { freq: 90, duration: 0.07, gain: 0.09, type: 'sawtooth' },
    vault: { freq: 380, duration: 0.02, gain: 0.05, type: 'triangle' },
    section: { freq: 260, duration: 0.018, gain: 0.04, type: 'sine' },
    payment: { freq: 523, duration: 0.055, gain: 0.065, type: 'sine' }
  };

  /**
   * Initializes Web Audio Context on first direct user gesture.
   */
  function initAudioContext() {
    if (audioCtx || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        audioAllowed = true;
      }
    } catch (_) {
      // AudioContext unavailable or restricted
    }
  }

  /**
   * Emits a synthesized mechanical tactile click for platforms lacking navigator.vibrate (e.g. iOS Safari / Desktop).
   */
  function playSyntheticAudioHaptic(profileName) {
    if (!audioCtx || audioCtx.state === 'suspended') {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return;
    }

    const cfg = AUDIO_PROFILES[profileName] || AUDIO_PROFILES.tap;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = cfg.type;
      osc.frequency.setValueAtTime(cfg.freq, audioCtx.currentTime);

      // Exponential decay envelope simulating mechanical relay impact
      gain.gain.setValueAtTime(cfg.gain, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + cfg.duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + cfg.duration);
    } catch (_) {
      // Fallback gracefully
    }
  }

  const AtheriaHaptics = {
    /**
     * Checks whether haptics are enabled by user and system settings.
     */
    isEnabled: function () {
      if (typeof window === 'undefined') return false;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== 'false'; // Enabled by default
    },

    /**
     * Toggles haptic feedback preference globally.
     */
    toggle: function () {
      const current = this.isEnabled();
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
      } catch (_) {}

      this.updateToggleButtons(next);

      if (next) {
        this.trigger('success');
      }
      window.dispatchEvent(new CustomEvent('atheria:haptics-changed', { detail: { enabled: next } }));
      return next;
    },

    /**
     * Core trigger function for all haptic events.
     * @param {string|Array<number>} pattern - Profile name or raw duration array
     * @param {Object} [options] - Optional overrides { force: boolean, audioOnly: boolean }
     */
    trigger: function (pattern, options = {}) {
      if (!this.isEnabled() && !options.force) return false;

      const now = performance.now();
      if (!options.force && now - lastHapticTime < COOLDOWN_MS) {
        return false;
      }
      lastHapticTime = now;

      // Ensure AudioContext is warm
      initAudioContext();

      let vibrationPattern = null;
      let profileName = typeof pattern === 'string' ? pattern : 'tap';

      if (typeof pattern === 'string') {
        vibrationPattern = HAPTIC_PROFILES[pattern] || HAPTIC_PROFILES.tap;
      } else if (Array.isArray(pattern)) {
        vibrationPattern = pattern;
      } else if (typeof pattern === 'number') {
        vibrationPattern = [pattern];
      }

      let hasHardwareVibrated = false;

      // 1. Hardware Vibration API execution
      if (!options.audioOnly && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          hasHardwareVibrated = navigator.vibrate(vibrationPattern);
        } catch (_) {
          hasHardwareVibrated = false;
        }
      }

      // 2. Synthetic Audio Impulse reinforcement / fallback (essential for iOS Safari & Desktop trackpads)
      playSyntheticAudioHaptic(profileName);

      return true;
    },

    /**
     * Updates UI icons across all haptic toggle buttons in DOM.
     */
    updateToggleButtons: function (enabled) {
      const btns = document.querySelectorAll('.haptic-toggle-btn, #haptic-toggle-btn');
      btns.forEach((btn) => {
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.setAttribute('title', enabled ? 'Haptic Feedback: Enabled' : 'Haptic Feedback: Muted');
        if (enabled) {
          btn.classList.add('is-active');
          btn.classList.remove('is-muted');
        } else {
          btn.classList.remove('is-active');
          btn.classList.add('is-muted');
        }
      });
    },

    /**
     * Section-Level Scroll Intersection Observer.
     * Generates smooth tactile detents as the user journeys through distinct page sections.
     */
    initSectionScrollHaptics: function () {
      if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

      // Target all primary structural sections across Landing, Dashboard, and Portals
      const sectionSelectors = [
        'section',
        'article.stack-card',
        '.dashboard-hero-grid',
        '.quick-actions-bar',
        '.dashboard-sections-grid',
        '.kpi-grid',
        '.admin-charts-grid',
        '.admin-table-card',
        '.auth-card',
        '#hero',
        '#architecture',
        '#concurrency',
        '#customers',
        '#audit',
        '#rates',
        '#faq',
        '.features-grid',
        '.cell-division-divider',
        '.landing-footer'
      ];

      const sections = document.querySelectorAll(sectionSelectors.join(', '));
      if (!sections.length) return;

      let lastObservedSection = null;
      let lastSectionTriggerTime = 0;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            const currentSection = entry.target;
            const now = performance.now();

            // Prevent repeat triggers for the same section or rapid scrolling spasms
            if (currentSection !== lastObservedSection && now - lastSectionTriggerTime > 320) {
              lastObservedSection = currentSection;
              lastSectionTriggerTime = now;

              // Choose tactile signature based on section identity
              if (currentSection.id === 'concurrency' || currentSection.classList.contains('quick-actions-bar')) {
                AtheriaHaptics.trigger('medium');
              } else if (currentSection.id === 'audit' || currentSection.classList.contains('dashboard-hero-grid')) {
                AtheriaHaptics.trigger('heavy');
              } else {
                AtheriaHaptics.trigger('section');
              }
            }
          }
        });
      }, {
        threshold: [0.35, 0.6],
        rootMargin: '-5% 0px -15% 0px'
      });

      sections.forEach((sec) => observer.observe(sec));
    },

    /**
     * Automatic Event Binding for Interactive Components across the DOM.
     */
    initInteractiveHaptics: function () {
      // 1. Buttons & Action Tiles (Touchstart / Pointerdown for zero-latency physical press)
      document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('button, .btn, .chip, .action-tile, .filter-pill, .tab-btn, .mobile-tab-item, [role="button"]');
        if (!btn) return;

        // Specific button profiles
        if (btn.classList.contains('btn-primary') || btn.type === 'submit' || btn.classList.contains('auth-submit-btn')) {
          AtheriaHaptics.trigger('heavy');
        } else if (btn.classList.contains('theme-toggle-btn') || btn.classList.contains('haptic-toggle-btn')) {
          AtheriaHaptics.trigger('medium');
        } else if (btn.classList.contains('chip')) {
          AtheriaHaptics.trigger('notch');
        } else {
          AtheriaHaptics.trigger('tap');
        }
      }, { passive: true });

      // 2. Range Sliders (Interactive EMI calculator & financial projections)
      document.addEventListener('input', (e) => {
        if (e.target && e.target.type === 'range') {
          AtheriaHaptics.trigger('notch');
        }
      }, { passive: true });

      // 3. Form Inputs (Focus micro-tick)
      document.addEventListener('focusin', (e) => {
        const el = e.target;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) {
          AtheriaHaptics.trigger('tick');
        }
      }, { passive: true });

      // 4. Form Validation Failure & Error Alerts
      document.addEventListener('invalid', (e) => {
        AtheriaHaptics.trigger('error');
      }, true);

      // 5. Global click listener for Haptic Toggle buttons
      document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.haptic-toggle-btn, #haptic-toggle-btn');
        if (toggleBtn) {
          e.preventDefault();
          AtheriaHaptics.toggle();
        }
      });

      // 6. AudioContext unlock on first user gesture
      const unlockAudio = () => {
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      };
      document.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
      document.addEventListener('keydown', unlockAudio, { passive: true, once: true });
    },

    /**
     * Initializes the entire Haptic Feedback Engine.
     */
    init: function () {
      this.updateToggleButtons(this.isEnabled());
      this.initInteractiveHaptics();
      this.initSectionScrollHaptics();
    }
  };

  // Expose AtheriaHaptics to window global scope
  window.AtheriaHaptics = AtheriaHaptics;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AtheriaHaptics.init());
  } else {
    AtheriaHaptics.init();
  }

})(window, document);
