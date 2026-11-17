/**
 * Aetheria Reserve Bank - Photorealistic 3D Rounded Spatial Card Engine
 * Technology: Three.js (ExtrudeGeometry with rounded corners, beveled edges, MeshPhysicalMaterial,
 * dynamic canvas texture, dynamic anisotropic specular gleam, and scroll-driven tilt)
 */

(function () {
  const container = document.getElementById('hero-3d-canvas-wrap');
  if (!container || typeof THREE === 'undefined') return;

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    // Brand Monogram & Wordmark
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 76px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.letterSpacing = '-1px';
    ctx.fillText('AETHERIA', 120, 160);

    ctx.fillStyle = '#60A5FA';
    ctx.font = '600 36px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('RESERVE', 530, 160);

    ctx.fillStyle = 'rgba(235, 235, 245, 0.6)';
    ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('TITANIUM PRIVATE RESERVE', 120, 215);

    // Contactless NFC Wave Glyphs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 6;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(1820, 160, i * 26, -0.6, 0.6);
      ctx.stroke();
    }

    // High-Precision EMV Security Microchip
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(120, 390, 230, 180, 24);
    ctx.fill();

    // Chip internal circuit tracings
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3;
    ctx.strokeRect(150, 420, 170, 120);
    ctx.beginPath();
    ctx.moveTo(235, 390); ctx.lineTo(235, 570);
    ctx.moveTo(120, 480); ctx.lineTo(350, 480);
    ctx.stroke();

    // Embossed Card Number with Realistic Dual-Depth Shadow
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 88px "SF Mono", SFMono-Regular, Menlo, monospace';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillText('5010  8429  9302  1184', 120, 830);
    ctx.shadowColor = 'transparent';

    // Valid Thru Label & Date
    ctx.fillStyle = 'rgba(235, 235, 245, 0.65)';
    ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.fillText('VALID THRU', 120, 970);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px "SF Mono", monospace';
    ctx.fillText('12/30', 120, 1030);

    // Cardholder Name
    ctx.fillStyle = 'rgba(235, 235, 245, 0.65)';
    ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.fillText('CARDHOLDER', 560, 970);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillText('AARAV SHARMA', 560, 1030);

    // Brushed Metallic Security Medallion
    const holoGrad = ctx.createLinearGradient(1680, 950, 1920, 1100);
    holoGrad.addColorStop(0, '#FFFFFF');
    holoGrad.addColorStop(0.5, '#94A3B8');
    holoGrad.addColorStop(1, '#475569');

    ctx.fillStyle = holoGrad;
    ctx.beginPath();
    ctx.ellipse(1780, 1000, 110, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // Micro-etched concentric rings on medallion
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    for (let r = 20; r < 70; r += 12) {
      ctx.beginPath();
      ctx.arc(1780, 1000, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  // 4. Construct Photorealistic Rounded Card ExtrudeGeometry
  const cardWidth = 3.9;
  const cardHeight = 2.46;
  const cornerRadius = 0.22;

  function createRoundedCardShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  const cardShape = createRoundedCardShape(cardWidth, cardHeight, cornerRadius);
  const extrudeSettings = {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 2,
    bevelSize: 0.024,
    bevelThickness: 0.024,
  };

  const cardGeo = new THREE.ExtrudeGeometry(cardShape, extrudeSettings);
  cardGeo.center();

  // UV mapping adjustment for ExtrudeGeometry front face
  const pos = cardGeo.attributes.position;
  const uvs = [];
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const u = (px + cardWidth / 2) / cardWidth;
    const v = (py + cardHeight / 2) / cardHeight;
    uvs.push(Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
  }
  cardGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  // Materials: Front texture & Brushed Titanium Edge Core
  const cardTexture = createCardTexture();
  const cardMat = new THREE.MeshPhysicalMaterial({
    map: cardTexture,
    color: 0xFFFFFF,
    metalness: 0.45,
    roughness: 0.18,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    reflectivity: 0.9,
    transmission: 0.15,
  });

  const cardGroup = new THREE.Group();
  const cardMesh = new THREE.Mesh(cardGeo, cardMat);
  cardGroup.add(cardMesh);
  scene.add(cardGroup);

  // 5. Floating Polyhedral Orbit Tokens (Refractive Jewels)
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
    const radius = 2.9 + (Math.random() - 0.5) * 1.0;

    mesh.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * (radius * 0.7) + (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 2.5
    );

    mesh.userData = {
      angle: angle,
      radius: radius,
      speed: 0.0035 + Math.random() * 0.004,
      rotX: 0.012 + Math.random() * 0.01,
      rotY: 0.015 + Math.random() * 0.01,
      baseY: mesh.position.y
    };

    scene.add(mesh);
    tokens.push(mesh);
  }

  // 6. Multi-Tiered Ultrasmooth Inertia Tracking
  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;
  let scrollTilt = 0;

  // Window scroll hook for scroll-based 3D card tilt
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY || window.pageYOffset;
    scrollTilt = Math.min(scrollY / 700, 1.2);
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    // Normalized distance from center (-1 to +1)
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    targetRotY = x * 0.52;
    targetRotX = -y * 0.40;

    // Move specular highlight with cursor
    specularLight.position.x = x * 3.5;
    specularLight.position.y = y * 2.5 + 1.5;
  });

  // Responsive resize
  function handleResize() {
    width = container.clientWidth;
    height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', handleResize);

  // 7. 60-120fps Animation Loop with Organic Damping
  let isRunning = true;
  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!isRunning) return;

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
  }

  animate();
})();
