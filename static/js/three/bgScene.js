/**
 * Apex Global Bank - Ambient 3D Background with Low-Poly Floating Glass Orbs
 */

(function () {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 18;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  // Ambient & Soft Directional Lighting
  const ambLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambLight);

  const dirLight = new THREE.DirectionalLight(0x5EEAD4, 1.8);
  dirLight.position.set(5, 8, 4);
  scene.add(dirLight);

  // Group of Floating Low-Poly Glass Orbs
  const orbsGroup = new THREE.Group();
  const orbGeo = new THREE.IcosahedronGeometry(1.2, 1); // Low-poly faceting

  const orbMat = new THREE.MeshPhysicalMaterial({
    color: 0x5EEAD4,
    metalness: 0.2,
    roughness: 0.15,
    transmission: 0.7,
    thickness: 1.0,
    transparent: true,
    opacity: 0.22,
    wireframe: false,
  });

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x38BDF8,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });

  const orbs = [];
  const orbCount = 10;

  for (let i = 0; i < orbCount; i++) {
    const orb = new THREE.Mesh(orbGeo, orbMat);
    const wire = new THREE.Mesh(orbGeo, wireMat);
    orb.add(wire);

    const scale = 0.6 + Math.random() * 1.4;
    orb.scale.set(scale, scale, scale);

    orb.position.set(
      (Math.random() - 0.5) * 36,
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 12
    );

    orb.userData = {
      baseY: orb.position.y,
      speedY: 0.001 + Math.random() * 0.002,
      rotX: 0.003 + Math.random() * 0.004,
      rotY: 0.004 + Math.random() * 0.005,
      phase: Math.random() * Math.PI * 2
    };

    orbsGroup.add(orb);
    orbs.push(orb);
  }

  scene.add(orbsGroup);

  // Parallax Mouse Movement
  let targetCamX = 0;
  let targetCamY = 0;
  window.addEventListener('mousemove', (e) => {
    targetCamX = ((e.clientX / window.innerWidth) - 0.5) * 1.5;
    targetCamY = -(((e.clientY / window.innerHeight) - 0.5) * 1.5);
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let isRunning = true;
  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!isRunning) return;

    const t = clock.getElapsedTime();

    // Smooth camera drift
    camera.position.x += (targetCamX - camera.position.x) * 0.03;
    camera.position.y += (targetCamY - camera.position.y) * 0.03;

    // Drifting orbs
    orbs.forEach(orb => {
      orb.rotation.x += orb.userData.rotX;
      orb.rotation.y += orb.userData.rotY;
      orb.position.y = orb.userData.baseY + Math.sin(t * 0.8 + orb.userData.phase) * 0.8;
    });

    renderer.render(scene, camera);
  }

  animate();
})();
