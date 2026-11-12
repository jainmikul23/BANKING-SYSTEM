/**
 * Apex Global Bank - High-End 3D Glass Debit Card Scene
 * Technology: Three.js (MeshPhysicalMaterial with transmission, dynamic canvas texture, procedural EMV chip, drifting 3D coins)
 */

(function () {
  const container = document.getElementById('hero-3d-canvas-wrap');
  if (!container || typeof THREE === 'undefined') return;

  // 1. Scene & Setup
  const scene = new THREE.Scene();
  const width = container.clientWidth || 550;
  const height = container.clientHeight || 550;

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0, 8.2);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);

  // 2. High-Precision Studio Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0x5EEAD4, 4.0);
  keyLight.position.set(6, 6, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38BDF8, 2.5);
  fillLight.position.set(-6, -4, 4);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xF5B461, 3.0, 15);
  rimLight.position.set(0, 3, -2);
  scene.add(rimLight);

  // 3. Dynamic High-Resolution Card Texture Generator
  function createCardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 646; // Standard 85.6mm x 53.98mm aspect ratio
    const ctx = canvas.getContext('2d');

    // Frosted Titanium/Glass gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 646);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
    grad.addColorStop(0.5, 'rgba(11, 20, 38, 0.85)');
    grad.addColorStop(1, 'rgba(15, 118, 110, 0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 646);

    // Subtle fine geometric grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 646);
      ctx.stroke();
    }
    for (let y = 0; y < 646; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Top Brand Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px -apple-system, Inter, sans-serif';
    ctx.fillText('APEX BANK', 60, 80);

    ctx.fillStyle = '#5EEAD4';
    ctx.font = '600 20px -apple-system, Inter, monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText('TITANIUM RESERVE', 60, 114);

    // Contactless Wave Icon
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(880, 80, i * 14, -0.6, 0.6);
      ctx.stroke();
    }

    // Metallic Gold EMV Chip
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.roundRect(60, 200, 120, 95, 12);
    ctx.fill();

    // Chip Micro-circuits
    ctx.strokeStyle = '#713F12';
    ctx.lineWidth = 2;
    ctx.strokeRect(75, 215, 90, 65);
    ctx.beginPath();
    ctx.moveTo(120, 200); ctx.lineTo(120, 295);
    ctx.moveTo(60, 247); ctx.lineTo(180, 247);
    ctx.stroke();

    // Embossed Card Number
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 44px "SF Mono", "JetBrains Mono", monospace';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fillText('5010  4920  8472  5671', 60, 420);

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Valid Thru
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 16px -apple-system, Inter, sans-serif';
    ctx.fillText('VALID THRU', 60, 490);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('11/29', 60, 520);

    // Cardholder Name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 16px -apple-system, Inter, sans-serif';
    ctx.fillText('CARDHOLDER', 320, 490);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px -apple-system, Inter, sans-serif';
    ctx.fillText('AARAV SHARMA', 320, 520);

    // Holographic Foil Emblem
    const holoGrad = ctx.createLinearGradient(820, 480, 940, 560);
    holoGrad.addColorStop(0, '#5EEAD4');
    holoGrad.addColorStop(0.3, '#38BDF8');
    holoGrad.addColorStop(0.7, '#C084FC');
    holoGrad.addColorStop(1, '#F5B461');

    ctx.fillStyle = holoGrad;
    ctx.beginPath();
    ctx.ellipse(880, 510, 55, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 4. Construct 3D Glass Debit Card Mesh
  const cardGroup = new THREE.Group();
  const cardTexture = createCardTexture();

  const cardWidth = 3.8;
  const cardHeight = 2.4;
  const cardThickness = 0.09;
  const cardGeo = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness, 32, 32, 4);

  // High-End Physical Glass Material
  const glassFrontMat = new THREE.MeshPhysicalMaterial({
    map: cardTexture,
    color: 0xFFFFFF,
    metalness: 0.15,
    roughness: 0.1,
    transmission: 0.88,
    thickness: 1.4,
    ior: 1.52,
    reflectivity: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: 0.98,
  });

  const cardMesh = new THREE.Mesh(cardGeo, glassFrontMat);
  cardGroup.add(cardMesh);
  scene.add(cardGroup);

  // 5. Procedural 3D Rupee Coins Drifting in Orbit
  const coins = [];
  const coinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 36);
  const coinMat = new THREE.MeshPhysicalMaterial({
    color: 0x5EEAD4,
    metalness: 0.85,
    roughness: 0.18,
    transmission: 0.6,
    thickness: 0.8,
    transparent: true,
    opacity: 0.85,
    clearcoat: 0.8,
  });

  for (let i = 0; i < 7; i++) {
    const coin = new THREE.Mesh(coinGeo, coinMat);
    const angle = (i / 7) * Math.PI * 2;
    const radius = 2.8 + (Math.random() - 0.5) * 1.2;

    coin.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * (radius * 0.75) + (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 3.0
    );

    coin.userData = {
      angle: angle,
      radius: radius,
      speed: 0.003 + Math.random() * 0.005,
      rotX: 0.01 + Math.random() * 0.015,
      rotY: 0.01 + Math.random() * 0.015,
      baseY: coin.position.y
    };

    scene.add(coin);
    coins.push(coin);
  }

  // 6. Smooth Mouse Parallax Tracking
  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;

  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    targetRotY = x * 0.55;
    targetRotX = -y * 0.42;
  });

  // 7. Responsive Resizing
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // 8. Animation Loop
  let isRunning = true;
  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
  });

  const clock = new THREE.Clock();

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    if (!isRunning) return;

    const time = clock.getElapsedTime();

    // Gentle float wave + mouse parallax with smooth damping
    currentRotY += (targetRotY + Math.sin(time * 0.7) * 0.12 - currentRotY) * 0.05;
    currentRotX += (targetRotX + Math.cos(time * 0.6) * 0.08 - currentRotX) * 0.05;

    cardGroup.rotation.y = currentRotY;
    cardGroup.rotation.x = currentRotX;
    cardGroup.position.y = Math.sin(time * 1.2) * 0.14;

    // Coins animation
    coins.forEach((c) => {
      c.userData.angle += c.userData.speed;
      c.position.x = Math.cos(c.userData.angle) * c.userData.radius;
      c.position.y = c.userData.baseY + Math.sin(time * 1.5 + c.userData.angle) * 0.2;
      c.rotation.x += c.userData.rotX;
      c.rotation.y += c.userData.rotY;
    });

    renderer.render(scene, camera);
  }

  renderLoop();
})();
