/**
 * Atheria Reserve Bank - Photorealistic 3D Rounded Spatial Card Engine
 * Technology: Three.js (ExtrudeGeometry with rounded corners, beveled edges, MeshPhysicalMaterial,
 * dynamic canvas texture, dynamic anisotropic specular gleam, scroll-driven tilt,
 * IntersectionObserver auto-pause, loader coordination, and WebGL error fallback)
 */

(function () {
  const container = document.getElementById('hero-3d-canvas-wrap');
  if (!container) return;

  function showFallbackPoster() {
    const loader = document.getElementById('hero-3d-loader');
    if (loader) loader.classList.add('is-loaded');
    container.innerHTML = `
      <div class="hero-fallback-poster" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="bank-card bank-card-savings" style="width: 100%; max-width: 460px; height: 260px; box-shadow: var(--shadow-floating); position: relative; z-index: 2;">
          <div class="card-top">
            <div class="card-bank-name">${window.CARD_NAME_UPPER || 'ATHERIA RESERVE'}</div>
            <div class="card-chip"></div>
          </div>
          <div class="card-number">•••• •••• •••• 8829</div>
          <div class="card-bottom">
            <div>
              <div style="font-size: 0.625rem; color: var(--muted); text-transform: uppercase;">Cardholder</div>
              <div class="card-holder-name">SIDDHARTH SINGHANIA</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.625rem; color: var(--muted); text-transform: uppercase;">Valid Thru</div>
              <div style="font-size: 0.813rem; font-weight: 600; font-family: var(--font-mono);">09/31</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Check WebGL availability
  if (typeof THREE === 'undefined') {
    showFallbackPoster();
    return;
  }

  try {
    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    let width = container.clientWidth || 580;
    let height = container.clientHeight || 580;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Multi-Point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.6);
    scene.add(ambientLight);

    // Key directional light with subtle sapphire reflection
    const keyLight = new THREE.DirectionalLight(0x93C5FD, 2.8);
    keyLight.position.set(5, 6, 6);
    scene.add(keyLight);

    // Cool fill light from opposing angle
    const fillLight = new THREE.DirectionalLight(0xE2E8F0, 2.4);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    // Warm specular point light following dynamic mouse
    const specularLight = new THREE.PointLight(0xFFFFFF, 3.8, 14);
    specularLight.position.set(0, 2, 4);
    scene.add(specularLight);

    // Rim back-light for glass edge definition
    const rimLight = new THREE.PointLight(0x2563EB, 3.2, 12);
    rimLight.position.set(0, 4, -3);
    scene.add(rimLight);

    // 3. Dynamic High-Resolution Texture Canvas (2048 x 1292 for Retina Clarity)
    function createCardTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1292; // Exact ISO/IEC 7810 ID-1 ratio (1.586)
      const ctx = canvas.getContext('2d');

      // Luxury Obsidian Slate Titanium Brushed Texture
      const grad = ctx.createLinearGradient(0, 0, 2048, 1292);
      grad.addColorStop(0, '#161D2B');
      grad.addColorStop(0.35, '#0E1420');
      grad.addColorStop(0.7, '#0A0E17');
      grad.addColorStop(1, '#07090E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1292);

      // Micro-anodized brushed linear grain
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let y = 0; y < 1292; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }

      // Subtle laser-etched concentric alignment grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < 2048; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, 1292);
        ctx.stroke();
      }

      // Brand Monogram & Wordmark using Central CARD_NAME
      const cardDisplayName = (window.CARD_NAME_UPPER || 'ATHERIA RESERVE').split(' ');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 76px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      ctx.letterSpacing = '-1px';
      const brandFirstWord = cardDisplayName[0] || 'ATHERIA';
      ctx.fillText(brandFirstWord, 120, 160);

      const firstWordWidth = ctx.measureText(brandFirstWord).width;
      ctx.fillStyle = '#60A5FA';
      ctx.font = '600 36px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      ctx.letterSpacing = '6px';
      const brandSecondWord = cardDisplayName.slice(1).join(' ') || 'RESERVE';
      ctx.fillText(brandSecondWord, 120 + firstWordWidth + 36, 160);

      ctx.fillStyle = 'rgba(235, 235, 245, 0.6)';
      ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('TITANIUM PRIVATE RESERVE', 120, 215);

      // Contactless NFC Wave Glyphs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 6;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(1880, 150, i * 18, -Math.PI * 0.45, Math.PI * 0.45, false);
        ctx.stroke();
      }

      // EMV Gold Security Microchip (Realistic Segmented Pads)
      const chipX = 120;
      const chipY = 380;
      const chipW = 220;
      const chipH = 170;
      const chipR = 24;

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, chipR);
      ctx.fill();

      // Chip internal circuit traces
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#78350F';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(chipX + 70, chipY); ctx.lineTo(chipX + 70, chipY + chipH);
      ctx.moveTo(chipX + 150, chipY); ctx.lineTo(chipX + 150, chipY + chipH);
      ctx.moveTo(chipX, chipY + 85); ctx.lineTo(chipX + chipW, chipY + 85);
      ctx.stroke();

      // Embossed Account Card Number (Retina Kerning)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 64px "SF Mono", monospace';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillText('••••   ••••   ••••   8829', 120, 740);
      ctx.shadowColor = 'transparent';

      // Cardholder Information & Valid Thru
      ctx.font = '500 26px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      ctx.fillStyle = 'rgba(235, 235, 245, 0.65)';
      ctx.fillText('CARDHOLDER', 120, 980);

      ctx.font = '600 38px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('SIDDHARTH SINGHANIA', 120, 1035);

      ctx.font = '500 26px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      ctx.fillStyle = 'rgba(235, 235, 245, 0.65)';
      ctx.fillText('EXPIRES', 1140, 980);

      ctx.font = '600 38px "SF Mono", monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('09 / 31', 1140, 1035);

      // Metallic Hologram Medallion
      const holoX = 1760;
      const holoY = 1010;
      const holoR = 90;
      const holoGrad = ctx.createRadialGradient(holoX, holoY, 10, holoX, holoY, holoR);
      holoGrad.addColorStop(0, '#FFFFFF');
      holoGrad.addColorStop(0.5, '#94A3B8');
      holoGrad.addColorStop(1, '#475569');
      ctx.fillStyle = holoGrad;
      ctx.beginPath();
      ctx.arc(holoX, holoY, holoR, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 36px -apple-system, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(window.BANK_MONOGRAM || 'ARB', holoX, holoY);

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.needsUpdate = true;
      return texture;
    }

    // 4. Photorealistic Rounded Extruded Credit Card Geometry
    const cardWidth = 3.60;
    const cardHeight = 2.27; // 1.586 ISO-7810 ratio
    const cornerRadius = 0.16;

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
      depth: 0.045,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 0.024,
      bevelThickness: 0.024
    };

    const cardGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    cardGeo.center();

    // Fix planar UVs for the front canvas texture
    const pos = cardGeo.attributes.position;
    const uvs = cardGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + cardWidth / 2) / cardWidth;
      const v = (pos.getY(i) + cardHeight / 2) / cardHeight;
      uvs.setXY(i, u, v);
    }
    uvs.needsUpdate = true;

    const cardTexture = createCardTexture();

    // High Clearcoat Anisotropic Titanium Face Material
    const cardMat = new THREE.MeshPhysicalMaterial({
      map: cardTexture,
      roughness: 0.18,
      metalness: 0.35,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.85,
      transmission: 0.15,
    });

    const cardGroup = new THREE.Group();
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    cardGroup.add(cardMesh);
    scene.add(cardGroup);

    // 5. Floating Polyhedral Orbit Tokens (Refractive Sapphire Crystals)
    const tokens = [];
    const tokenGeos = [
      new THREE.IcosahedronGeometry(0.24, 0),
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.DodecahedronGeometry(0.26, 0)
    ];

    const tokenMat = new THREE.MeshPhysicalMaterial({
      color: 0x3B82F6,
      metalness: 0.3,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.6,
      ior: 1.52,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0,
    });

    for (let i = 0; i < 6; i++) {
      const geo = tokenGeos[i % tokenGeos.length];
      const mesh = new THREE.Mesh(geo, tokenMat);
      const angle = (i / 6) * Math.PI * 2;
      const radius = 2.45 + (i % 2) * 0.45;
      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * 1.25, (Math.random() - 0.5) * 1.5);
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

    // 6. Interactive Physics & Input Damping
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
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      targetRotY = x * 0.52;
      targetRotX = -y * 0.40;

      specularLight.position.x = x * 3.5;
      specularLight.position.y = y * 2.5 + 1.5;
    }

    window.addEventListener('mousemove', (e) => {
      handlePointer(e.clientX, e.clientY);
    }, { passive: true });

    // Touch support for mobile/tablets
    container.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // Device orientation support (optional gyro on mobile)
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        targetRotY = (e.gamma / 45) * 0.35;
        targetRotX = ((e.beta - 45) / 45) * 0.25;
      }
    }, { passive: true });

    // Responsive resize
    function handleResize() {
      width = container.clientWidth;
      height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', handleResize);

    // 7. Performance: Pause rendering when off-screen via IntersectionObserver
    let isIntersecting = true;
    let isTabVisible = !document.hidden;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isIntersecting = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    io.observe(container);

    document.addEventListener('visibilitychange', () => {
      isTabVisible = !document.hidden;
    });

    const clock = new THREE.Clock();
    let hasDismissedLoader = false;

    function animate() {
      requestAnimationFrame(animate);
      if (!isIntersecting || !isTabVisible) return;

      const time = clock.getElapsedTime();

      // Damped exponential spring lerp for zero-jitter, buttery smoothness
      const effectiveTargetY = targetRotY + Math.sin(time * 0.7) * 0.14 - (scrollTilt * 0.4);
      const effectiveTargetX = targetRotX + Math.cos(time * 0.55) * 0.09 + (scrollTilt * 0.35);

      currentRotY += (effectiveTargetY - currentRotY) * 0.045;
      currentRotX += (effectiveTargetX - currentRotX) * 0.045;

      cardGroup.rotation.y = currentRotY;
      cardGroup.rotation.x = currentRotX;
      cardGroup.rotation.z = Math.sin(time * 0.5) * 0.025;

      // Organic compound floating elevation
      cardGroup.position.y = Math.sin(time * 0.9) * 0.12 + Math.cos(time * 1.5) * 0.03;
      cardGroup.position.z = -scrollTilt * 0.8;

      // Orbit tokens rotation & harmonic bobbing
      tokens.forEach((t) => {
        t.userData.angle += t.userData.speed;
        t.position.x = Math.cos(t.userData.angle) * t.userData.radius;
        t.position.y = t.userData.baseY + Math.sin(time * 1.4 + t.userData.angle) * 0.22;
        t.rotation.x += t.userData.rotX;
        t.rotation.y += t.userData.rotY;
      });

      renderer.render(scene, camera);

      // Dissolve the cell division loader smoothly after first successful frames
      if (!hasDismissedLoader && time > 0.2) {
        hasDismissedLoader = true;
        const loader = document.getElementById('hero-3d-loader');
        if (loader) {
          loader.classList.add('is-loaded');
        }
      }
    }

    animate();
  } catch (err) {
    console.warn('[Atheria 3D Engine] WebGL initialization fallback:', err);
    showFallbackPoster();
  }
})();
