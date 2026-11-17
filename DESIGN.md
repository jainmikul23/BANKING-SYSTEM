# Apple "Liquid Glass" UI: Design System & Engineering Guide

> **Design Language**: Apple iOS 26 / macOS Tahoe / visionOS Liquid Glass  
> **Target Refresh Rate**: 60 FPS – 120 FPS fluid execution  
> **Brand**: Atheria Reserve Institutional Banking Engine  

---

## 1. Optical Philosophy

Apple's **Liquid Glass** treats UI elements not as simple blurred rectangles, but as physical lenses of cast optical glass suspended in space. Light refracts through the material, picks up specular highlights at the edges, bends ambient colors behind it, and responds with mechanical spring inertia to touch, drag, and velocity.

---

## 2. The 5-Layer Optical Material Architecture

Every liquid glass surface is constructed from five distinct physical layers rendered in strict order:

```
[ FRONT / EYE ]
  ▲
  │  Layer 5: Dynamic Specular Sheen (Radial highlight tracking pointer opposite to tilt)
  │  Layer 4: Inner Glow & Occlusion Depth (inset 0 -8px 16px rgba(255,255,255,0.06) + soft shadow)
  │  Layer 3: Specular Edge Highlight (1px light-bending gradient border + inset 0 1px 0 rgba(255,255,255,0.60))
  │  Layer 2: Adaptive Tint Fill (rgba(255,255,255, alpha); dynamically lightening on press)
  │  Layer 1: Backdrop Blur & Saturation (blur(14px) saturate(160%) brightness(1.05))
  ▼
[ BACKDROP / BACKGROUND ]
```

### Layer Details:
1. **Backdrop Blur & Saturation**:
   ```css
   -webkit-backdrop-filter: blur(14px) saturate(160%) brightness(1.05);
   backdrop-filter: blur(14px) saturate(160%) brightness(1.05);
   ```
   *Performance budget*: Maximum 2–3 active blurred surfaces simultaneously on screen (Navbar, active Modal, and moving Lens). Scrolling list cards use the **cheap glass** optimization (tint + highlight + border, zero blur cost).

2. **Adaptive Tint Fill**:
   - Dark mode base: `rgba(255, 255, 255, 0.10)`
   - Light mode base: `rgba(255, 255, 255, 0.55)`
   - On button press / touch: alpha drops by **30%** (`alpha * 0.70`) and brightness lifts (`brightness(1.15)`), giving the optical illusion of the glass lens lifting off the surface.

3. **Specular Edge Highlight**:
   A 1px hairline border lit from top-left, fading to transparency at the bottom-right:
   ```css
   border: 1px solid rgba(255, 255, 255, 0.08);
   border-top-color: rgba(255, 255, 255, 0.65);
   box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.60);
   ```

4. **Inner Glow & Occlusion Depth**:
   ```css
   box-shadow: 
     inset 0 1px 0 rgba(255, 255, 255, 0.60),
     inset 0 -8px 16px rgba(255, 255, 255, 0.06),
     0 10px 30px rgba(0, 0, 0, 0.18);
   ```

5. **Dynamic Specular Sheen**:
   A pseudo-element shifting with pointer coordinates smoothed via rAF springs:
   ```css
   background: radial-gradient(
     500px circle at var(--glass-sheen-x, 50%) var(--glass-sheen-y, 50%),
     rgba(255, 255, 255, 0.12),
     transparent 65%
   );
   ```

---

## 3. Concentric Radii Scale

To maintain optical continuity, nested curved elements must obey the **concentric radius rule**:

$$\text{Inner Radius} = \text{Outer Radius} - \text{Container Padding}$$

| Role | Outer Radius | Container Padding | Inner Radius |
| :--- | :--- | :--- | :--- |
| **Buttons & Tab Bars** | `999px` (Pill) | `4px – 10px` | `999px` |
| **Hero Panels** | `34px` | `24px` | `10px` |
| **Cards & Modals** | `28px` | `16px` | `12px` |
| **Dense Controls** | `20px` | `8px` | `12px` |

Defined in `static/css/liquid-glass-tokens.css`:
```css
--radius-pill: 999px;
--radius-card: 28px;
--radius-inner-md: calc(var(--radius-card) - 16px);
```

---

## 4. Standardized Spring Physics

No mechanical interaction uses linear or plain ease curves. Everything moves via damped harmonic oscillators:

### Mechanical Spring Configuration:
1. **Press and Release**:
   - Physics: $\text{Stiffness} \approx 500, \text{Damping} \approx 18, \text{Mass} = 1$
   - Behavior: Instant squash on pointer-down (`scale(0.94)`), springs back on release with overshoot to `scale(1.05)` before settling at `1.0` in ~380ms. Fully interruptible.
   - CSS token: `--spring-press`

2. **Lens Travel Between Tabs**:
   - Physics: $\text{Stiffness} \approx 260, \text{Damping} \approx 15$
   - Behavior: Directional stretch along flight path (`scaleX` up to 1.25, `scaleY` down to 0.92), 6–10% arrival overshoot, followed by a 3-wave decaying jelly wobble on arrival:
     $$(1, 1) \rightarrow (1.08, 0.94) \rightarrow (0.97, 1.03) \rightarrow (1.02, 0.99) \rightarrow (1, 1)$$
   - CSS token: `--spring-lens`

3. **Cards & Modals**:
   - Physics: $\text{Stiffness} \approx 180, \text{Damping} \approx 20$
   - Behavior: Calm, smooth deceleration with minimal overshoot.
   - CSS token: `--spring-card`

### CSS `linear()` Spring Generator Curves:
```css
--spring-press: linear(
  0, 0.009, 0.035 1.1%, 0.141 2.4%, 0.315 4%, 0.536 5.8%, 0.778 7.9%, 
  1.002 10.2%, 1.107 12.6%, 1.144 14.8%, 1.129 17.1%, 1.077 19.8%, 
  1.021 23%, 0.985 26.7%, 0.974 30.6%, 0.983 35.3%, 1.001 41.5%, 
  1.006 48.7%, 1 65%, 1
);

--spring-lens: linear(
  0, 0.006, 0.024 1.2%, 0.096 2.6%, 0.216 4.3%, 0.375 6.2%, 0.562 8.4%, 
  0.762 10.9%, 0.957 13.7%, 1.085 16.5%, 1.127 18.9%, 1.118 21.6%, 
  1.066 24.9%, 0.998 28.9%, 0.949 33.5%, 0.938 38.3%, 0.959 44.2%, 
  0.992 51.5%, 1.014 60.1%, 1.011 70.3%, 1.001 82.5%, 1
);
```

---

## 5. Reusable Component Catalog

### 1. `GlassSurface` (`.glass-surface`)
The foundation element implementing the complete 5-layer optical model.
```html
<div class="glass-surface">
  <div class="content">...</div>
</div>
```

### 2. `GlassButton` (`.glass-btn`, `.btn-glass`)
Spring squish, release overshoot, adaptive lightness, and visionOS `:focus-visible` ring.
```html
<button class="btn btn-glass">
  <span>Confirm Transfer</span>
</button>
```

### 3. `GlassTabBar` (`.glass-tab-bar`)
Container hosting the sliding drop of glass lens indicator (`.glass-lens`).
```html
<nav class="glass-tab-bar">
  <div class="glass-lens" aria-hidden="true"></div>
  <a href="#tab1" class="nav-item active">Overview</a>
  <a href="#tab2" class="nav-item">Ledger</a>
  <a href="#tab3" class="nav-item">Settings</a>
</nav>
```
*Features*:
- Dynamic `translateX` and `scaleX/scaleY` interpolation.
- Arrival jelly landing jiggle.
- Active item icon & label gentle scale-up (~1.06).
- Touch drag / swipe with spring rubber band and snap-to-nearest.

### 4. `GlassCard` (`.glass-card`)
28px radius card with pointer-follow 3D tilt (max 4°) and counter-moving specular sheen.
```html
<div class="glass-card">
  <h3>Card Title</h3>
  <p>Concentric content automatically styled.</p>
</div>
```

### 5. `GlassModal` & `GlassSheet` (`.modal-overlay`, `.modal-content`)
Apple sheet pattern with background page scaling down to `scale(0.96)`, `border-radius: 16px`, and dimming.
```html
<div class="modal-overlay" id="myModal">
  <div class="modal-content glass-surface">
    <h2>Institutional Transfer</h2>
    <button data-modal-close>Dismiss</button>
  </div>
</div>
```

---

## 6. Motion Helper Module API (`window.LiquidMotion`)

Located in [static/js/liquidMotion.js](file:///Users/mikuljain09/Desktop/DBMS%20_PROJECT/static/js/liquidMotion.js):

```javascript
// Register a callback to the master delta-time rAF loop
const unregister = window.LiquidMotion.registerRaf((dt, now, isLowPower) => {
  // Run custom compositor physics
});

// Trigger subtle 8ms haptic pulse on mobile devices
window.LiquidMotion.triggerHaptic(8);

// Morph transitions via View Transitions API
window.LiquidMotion.viewTransition(() => {
  // Update DOM / switch tab content
});

// Programmatic modal management
window.GlassModal.open(modalElement);
window.GlassModal.close(modalElement);
```

---

## 7. 120 FPS Performance Rules & Adaptive Quality

1. **Blur Budget**: Strictly $\le 3$ elements with `backdrop-filter` concurrently on screen.
2. **Compositor Isolation**: All animations animate only `transform` and `opacity`. No animating `blur`, `box-shadow`, `width`, `height`, or `left`.
3. **Adaptive Quality Engine**:
   `liquidMotion.js` measures rolling frame times. If frame time exceeds threshold ($>18\text{ms}$) continuously for $>2000\text{ms}$, it sets `data-perf="low-power"`.
   In low-power mode:
   - `backdrop-filter` is dropped in favor of solid glass.
   - 3D card tilt & sheen rAF tracking are disarmed.
   - Spring curves and functionality remain fully interactive.
4. **Accessibility Overrides**:
   - `prefers-reduced-motion`: Wobble, stretch, tilt, and spring overshoot are replaced with instantaneous 150ms opacity fades.
   - `prefers-reduced-transparency`: Glass backdrops become 100% opaque solid surfaces with verified 4.5:1 text contrast.
