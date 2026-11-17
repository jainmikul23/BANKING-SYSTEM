/**
 * Atheria Reserve Bank - Photorealistic 3D Spatial Titanium Card Engine
 * Technology: Three.js (ExtrudeGeometry with rounded bevels, MeshPhysicalMaterial,
 * 2048x1292 Retina procedural canvas texture, dynamic specular lighting,
 * smooth mouse parallax, automatic loader dismissal, and WebGL fallback)
 */

(function () {
  function initHeroCard() {
    const container = document.getElementById('hero-3d-canvas-wrap');
    const loader = document.getElementById('hero-3d-loader');
    if (!container) return;

    // Helper: Dismiss loader immediately
    function dismissLoader() {
      if (loader) {
        loader.classList.add('is-loaded');
        loader.style.display = 'none';
      }
    }

    // Fallback poster if WebGL is unavailable
    function showFallbackPoster() {
      dismissLoader();
      container.innerHTML = `
        <div class="hero-fallback-poster" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px;">
          <div class="bank-card bank-card-savings" style="width: 100%; max-width: 480px; height: 280px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15); border-radius: 20px; position: relative; z-index: 2; padding: 28px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 50%, #0A0F1D 100%);">
            <div class="card-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="/static/img/logo-emblem.png" alt="Atheria Emblem" width="36" height="36" style="border-radius: 8px;">
                <span style="font-weight: 700; font-size: 1.15rem; letter-spacing: -0.01em; color: #FFFFFF;">ATHERIA RESERVE</span>
              </div>
              <div class="card-chip" style="width: 46px; height: 34px; background: #F59E0B; border-radius: 6px;"></div>
            </div>
            <div class="card-number" style="font-family: 'SF Mono', monospace; font-size: 1.35rem; font-weight: 600; letter-spacing: 3px; color: #FFFFFF; margin: 28px 0;">•••• &nbsp; •••• &nbsp; •••• &nbsp; 8829</div>
            <div class="card-bottom" style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 0.65rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px;">Cardholder</div>
                <div class="card-holder-name" style="font-size: 0.95rem; font-weight: 600; color: #FFFFFF;">SIDDHARTH SINGHANIA</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.65rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px;">Valid Thru</div>
                <div style="font-size: 0.95rem; font-weight: 600; font-family: 'SF Mono', monospace; color: #FFFFFF;">09/31</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Safety timeout: Never leave loader visible longer than 500ms
    setTimeout(dismissLoader, 500);

    // Check Three.js availability
    if (typeof THREE === 'undefined') {
      showFallbackPoster();
      return;
    }

    try {
      // 1. Scene & Camera Setup
      const scene = new THREE.Scene();

      let width = container.clientWidth || 620;
      let height = container.clientHeight || 520;
      if (width < 320) width = 580;
      if (height < 320) height = 500;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 5.8); // Perfectly scaled, bold and prominently visible

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
      } catch (e) {
        showFallbackPoster();
        return;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // 2. High-Luminance Studio Lighting for Brilliant Surface Details
      const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.2);
      scene.add(ambientLight);

      // Key light with cool platinum tint
      const keyLight = new THREE.DirectionalLight(0xF8FAFC, 3.2);
      keyLight.position.set(4, 5, 5);
      scene.add(keyLight);

      // Fill light with sapphire reflection
      const fillLight = new THREE.DirectionalLight(0x60A5FA, 2.6);
      fillLight.position.set(-5, -3, 4);
      scene.add(fillLight);

      // Warm specular point light following dynamic cursor
      const specularLight = new THREE.PointLight(0xFFFFFF, 3.8, 14);
      specularLight.position.set(0, 1.5, 4);
      scene.add(specularLight);

      // Rim light for sharp bevel definition
      const rimLight = new THREE.PointLight(0x3B82F6, 3.2, 10);
      rimLight.position.set(0, 3, -3);
      scene.add(rimLight);

      // Safe roundRect utility
      function drawRoundRect(ctx, x, y, w, h, r) {
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, w, h, r);
        } else {
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
        }
      }

      // 3. Dynamic High-Resolution Texture Canvas (2048 x 1292 ISO/IEC 7810 ID-1 standard)
      function createCardTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1292;
        const ctx = canvas.getContext('2d');

        // Executive Titanium Slate Brushed Background with Sapphire Gradient
        const grad = ctx.createLinearGradient(0, 0, 2048, 1292);
        grad.addColorStop(0, '#1E293B');
        grad.addColorStop(0.3, '#141E30');
        grad.addColorStop(0.65, '#0F172A');
        grad.addColorStop(1, '#0A0F1D');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 2048, 1292);

        // Radiant Sapphire Accent Sheen
        const radialSheen = ctx.createRadialGradient(400, 250, 50, 400, 250, 1100);
        radialSheen.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
        radialSheen.addColorStop(0.5, 'rgba(59, 130, 246, 0.12)');
        radialSheen.addColorStop(1, 'transparent');
        ctx.fillStyle = radialSheen;
        ctx.fillRect(0, 0, 2048, 1292);

        // Brushed Micro-Linear Metal Grain
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1.2;
        for (let y = 0; y < 1292; y += 4) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(2048, y);
          ctx.stroke();
        }

        // Concentric Laser Security Matrix
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < 2048; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 1292);
          ctx.stroke();
        }

        // Precision Perimeter Border (High Visibility Metallic Rim)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        drawRoundRect(ctx, 30, 30, 1988, 1232, 70);
        ctx.stroke();

        // Brand Emblem Monogram & Wordmark
        const cardName = (window.CARD_NAME_UPPER || 'ATHERIA RESERVE');
        const cardParts = cardName.split(' ');
        const brandWord1 = cardParts[0] || 'ATHERIA';
        const brandWord2 = cardParts.slice(1).join(' ') || 'RESERVE';

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 82px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
        ctx.letterSpacing = '-1px';
        ctx.fillText(brandWord1, 140, 175);

        const word1Width = ctx.measureText(brandWord1).width;
        ctx.fillStyle = '#60A5FA';
        ctx.font = '600 42px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        ctx.letterSpacing = '6px';
        ctx.fillText(brandWord2, 140 + word1Width + 36, 175);

        ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
        ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('TITANIUM PRIVATE RESERVE', 140, 235);

        // Contactless NFC Waves (Platinum Glow)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 7;
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(1860, 160, i * 20, -Math.PI * 0.45, Math.PI * 0.45, false);
          ctx.stroke();
        }

        // EMV Gold Security Chip
        const chipX = 140;
        const chipY = 380;
        const chipW = 230;
        const chipH = 175;
        const chipR = 26;

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        drawRoundRect(ctx, chipX, chipY, chipW, chipH, chipR);
        ctx.fill();

        ctx.lineWidth = 4;
        ctx.strokeStyle = '#92400E';
        ctx.stroke();

        // Chip traces
        ctx.beginPath();
        ctx.moveTo(chipX + 75, chipY); ctx.lineTo(chipX + 75, chipY + chipH);
        ctx.moveTo(chipX + 155, chipY); ctx.lineTo(chipX + 155, chipY + chipH);
        ctx.moveTo(chipX, chipY + 88); ctx.lineTo(chipX + chipW, chipY + 88);
        ctx.stroke();

        // Embossed Account Card Number (Crisp White with Depth Shadow)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 70px "SF Mono", monospace';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 5;
        ctx.fillText('••••   ••••   ••••   8829', 140, 750);
        ctx.shadowColor = 'transparent';

        // Cardholder Information
        ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        ctx.fillStyle = 'rgba(241, 245, 249, 0.70)';
        ctx.fillText('CARDHOLDER', 140, 980);

        ctx.font = '700 42px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('SIDDHARTH SINGHANIA', 140, 1040);

        // Expiration
        ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        ctx.fillStyle = 'rgba(241, 245, 249, 0.70)';
        ctx.fillText('EXPIRES', 1140, 980);

        ctx.font = '700 42px "SF Mono", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('09 / 31', 1140, 1040);

        // Metallic Hologram Security Crest
        const holoX = 1760;
        const holoY = 1010;
        const holoR = 95;
        const holoGrad = ctx.createRadialGradient(holoX, holoY, 15, holoX, holoY, holoR);
        holoGrad.addColorStop(0, '#FFFFFF');
        holoGrad.addColorStop(0.45, '#94A3B8');
        holoGrad.addColorStop(1, '#334155');
        ctx.fillStyle = holoGrad;
        ctx.beginPath();
        ctx.arc(holoX, holoY, holoR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = 'bold 36px -apple-system, sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(window.BANK_MONOGRAM || 'ARB', holoX, holoY);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

        const texture = new THREE.CanvasTexture(canvas);
        const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
        texture.anisotropy = maxAniso;
        texture.needsUpdate = true;

        // Stamp High-Res Atheria Emblem Image onto Hologram & Header
        const emblemImg = new Image();
        emblemImg.src = '/static/img/logo-emblem.png';
        emblemImg.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(holoX, holoY, holoR - 6, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(emblemImg, holoX - (holoR - 6), holoY - (holoR - 6), (holoR - 6) * 2, (holoR - 6) * 2);
          ctx.restore();
          texture.needsUpdate = true;
        };

        return texture;
      }

      // 4. Photorealistic Rounded Extruded Credit Card Geometry
      const cardWidth = 3.60;
      const cardHeight = 2.27; // Exact ISO-7810 1.586 ratio
      const cornerRadius = 0.18;

      const shape = new THREE.Shape();
      const x0 = -cardWidth / 2;
      const y0 = -cardHeight / 2;
      const x1 = cardWidth / 2;
      const y1 = cardHeight / 2;

      shape.moveTo(x0 + cornerRadius, y0);
      shape.lineTo(x1 - cornerRadius, y0);
      shape.quadraticCurveTo(x1, y0, x1, y0 + cornerRadius);
      shape.lineTo(x1, y1 - cornerRadius);
      shape.quadraticCurveTo(x1, y1, x1 - cornerRadius, y1);
      shape.lineTo(x0 + cornerRadius, y1);
      shape.quadraticCurveTo(x0, y1, x0, y1 - cornerRadius);
      shape.lineTo(x0, y0 + cornerRadius);
      shape.quadraticCurveTo(x0, y0, x0 + cornerRadius, y0);

      const extrudeSettings = {
        depth: 0.05,
        bevelEnabled: true,
        bevelSegments: 8,
        steps: 1,
        bevelSize: 0.026,
        bevelThickness: 0.026
      };

      const cardGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      cardGeo.center();

      // Normalize UV attributes across vertices
      const pos = cardGeo.attributes.position;
      const uvs = cardGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const u = (pos.getX(i) + cardWidth / 2) / cardWidth;
        const v = (pos.getY(i) + cardHeight / 2) / cardHeight;
        uvs.setXY(i, u, v);
      }
      uvs.needsUpdate = true;

      const cardTexture = createCardTexture();

      // Premium Titanium Brushed Physical Material (Zero transmission bug, 100% visible)
      const cardMat = new THREE.MeshPhysicalMaterial({
        map: cardTexture,
        color: 0xFFFFFF,
        roughness: 0.22,
        metalness: 0.50,
        clearcoat: 0.90,
        clearcoatRoughness: 0.12,
        reflectivity: 0.90,
        side: THREE.DoubleSide
      });

      const cardGroup = new THREE.Group();
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardGroup.add(cardMesh);
      scene.add(cardGroup);

      // 5. Orbiting Polyhedral Sapphire Crystal Particles
      const tokens = [];
      const tokenGeos = [
        new THREE.IcosahedronGeometry(0.22, 0),
        new THREE.OctahedronGeometry(0.20, 0),
        new THREE.DodecahedronGeometry(0.24, 0)
      ];

      const tokenMat = new THREE.MeshPhysicalMaterial({
        color: 0x60A5FA,
        metalness: 0.2,
        roughness: 0.1,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.88,
        reflectivity: 0.95
      });

      for (let i = 0; i < 6; i++) {
        const geo = tokenGeos[i % tokenGeos.length];
        const mesh = new THREE.Mesh(geo, tokenMat);
        const angle = (i / 6) * Math.PI * 2;
        const radius = 2.45 + (i % 2) * 0.45;
        mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * 1.25, (Math.random() - 0.5) * 1.2);
        mesh.userData = {
          angle: angle,
          radius: radius,
          speed: 0.0035 + (i % 3) * 0.0015,
          rotX: 0.012,
          rotY: 0.015,
          baseY: mesh.position.y
        };
        tokens.push(mesh);
        scene.add(mesh);
      }

      // 6. Interactive Physics & Input Tracking
      let targetRotX = 0;
      let targetRotY = 0;
      let currentRotX = 0;
      let currentRotY = 0;
      let scrollTilt = 0;

      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY || window.pageYOffset;
        scrollTilt = Math.min(scrollY / 700, 1.2);
      }, { passive: true });

      function handlePointer(clientX, clientY) {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

        targetRotY = x * 0.55;
        targetRotX = -y * 0.42;

        specularLight.position.x = x * 3.5;
        specularLight.position.y = y * 2.5 + 1.5;
      }

      window.addEventListener('mousemove', (e) => {
        handlePointer(e.clientX, e.clientY);
      }, { passive: true });

      container.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          handlePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      // Responsive Resize
      function handleResize() {
        if (!container) return;
        width = container.clientWidth || 620;
        height = container.clientHeight || 520;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
      window.addEventListener('resize', handleResize);

      // 7. Render Loop with Guaranteed Immediate Start
      let isIntersecting = true;
      let isTabVisible = !document.hidden;

      if (typeof IntersectionObserver !== 'undefined') {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            isIntersecting = entry.isIntersecting || entry.intersectionRatio > 0;
          });
        }, { threshold: 0 });
        io.observe(container);
      }

      document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
      });

      const clock = new THREE.Clock();
      let hasDismissedLoader = false;

      function animate() {
        requestAnimationFrame(animate);
        if (!isIntersecting || !isTabVisible) return;

        const time = clock.getElapsedTime();

        // Buttery exponential spring easing
        const effectiveTargetY = targetRotY + Math.sin(time * 0.7) * 0.14 - (scrollTilt * 0.4);
        const effectiveTargetX = targetRotX + Math.cos(time * 0.55) * 0.09 + (scrollTilt * 0.35);

        currentRotY += (effectiveTargetY - currentRotY) * 0.045;
        currentRotX += (effectiveTargetX - currentRotX) * 0.045;

        cardGroup.rotation.y = currentRotY;
        cardGroup.rotation.x = currentRotX;
        cardGroup.rotation.z = Math.sin(time * 0.5) * 0.025;

        // Floating hover harmonic bobbing
        cardGroup.position.y = Math.sin(time * 0.9) * 0.12 + Math.cos(time * 1.5) * 0.03;
        cardGroup.position.z = -scrollTilt * 0.8;

        // Orbit tokens
        tokens.forEach((t) => {
          t.userData.angle += t.userData.speed;
          t.position.x = Math.cos(t.userData.angle) * t.userData.radius;
          t.position.y = t.userData.baseY + Math.sin(time * 1.4 + t.userData.angle) * 0.22;
          t.rotation.x += t.userData.rotX;
          t.rotation.y += t.userData.rotY;
        });

        renderer.render(scene, camera);

        // Immediately dismiss loader on first successful frame
        if (!hasDismissedLoader) {
          hasDismissedLoader = true;
          dismissLoader();
        }
      }

      animate();
    } catch (err) {
      console.warn('[Atheria 3D Engine] Fallback:', err);
      showFallbackPoster();
    }
  }

  // Ensure DOM is ready before initialising
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroCard);
  } else {
    initHeroCard();
  }
})();
