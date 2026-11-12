/**
 * Apex Global Bank - 3D Vault Rings Gyroscopic Scene for Authentication Pages
 */

(function () {
  const container = document.getElementById('vault-canvas-container');
  if (!container || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Soft Lights
  const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambLight);

  const light1 = new THREE.PointLight(0x5EEAD4, 3.5, 20);
  light1.position.set(4, 5, 4);
  scene.add(light1);

  const light2 = new THREE.PointLight(0x38BDF8, 2.5, 20);
  light2.position.set(-4, -4, 3);
  scene.add(light2);

  // Glass Vault Ring Material
  const ringMat = new THREE.MeshPhysicalMaterial({
    color: 0x5EEAD4,
    metalness: 0.25,
    roughness: 0.12,
    transmission: 0.85,
    thickness: 0.8,
    transparent: true,
    opacity: 0.55,
    clearcoat: 1.0,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xF5B461,
    metalness: 0.85,
    roughness: 0.2,
  });

  // Ring 1 (Outer)
  const ring1Geo = new THREE.TorusGeometry(3.6, 0.12, 16, 100);
  const ring1 = new THREE.Mesh(ring1Geo, ringMat);
  scene.add(ring1);

  // Ring 2 (Middle)
  const ring2Geo = new THREE.TorusGeometry(2.7, 0.1, 16, 80);
  const ring2 = new THREE.Mesh(ring2Geo, ringMat);
  scene.add(ring2);

  // Ring 3 (Inner)
  const ring3Geo = new THREE.TorusGeometry(1.8, 0.08, 16, 60);
  const ring3 = new THREE.Mesh(ring3Geo, ringMat);
  scene.add(ring3);

  // Center Vault Tumbler Core
  const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
  const coreMesh = new THREE.Mesh(coreGeo, goldMat);
  coreMesh.rotation.x = Math.PI / 2;
  scene.add(coreMesh);

  // Responsive Resize
  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Mouse Tracking
  let targetX = 0;
  let targetY = 0;
  window.addEventListener('mousemove', (e) => {
    targetX = ((e.clientX / window.innerWidth) * 2 - 1) * 0.4;
    targetY = -((e.clientY / window.innerHeight) * 2 - 1) * 0.4;
  });

  // Render Loop
  let isRunning = true;
  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!isRunning) return;

    const t = clock.getElapsedTime();

    ring1.rotation.x = t * 0.35 + targetY;
    ring1.rotation.y = t * 0.25 + targetX;

    ring2.rotation.y = -t * 0.4 + targetX;
    ring2.rotation.z = t * 0.3;

    ring3.rotation.x = -t * 0.5;
    ring3.rotation.z = -t * 0.35 + targetY;

    coreMesh.rotation.z = t * 0.6;

    renderer.render(scene, camera);
  }

  animate();
})();

