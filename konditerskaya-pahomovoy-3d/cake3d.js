/* Real-time 3D hero cake (three.js). Reads the same layer palettes as the SVG (window.specOf),
   follows the hero caption (cake name), rotates, can be dragged, and "explodes" its layers on scroll. */
import * as THREE from '../_vendor/three.module.min.js';
import { RoomEnvironment } from '../_vendor/RoomEnvironment.js';

const stage = document.getElementById('heroStage');
const cap = document.getElementById('heroCap');
const svg = document.getElementById('heroSvg');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
if (stage && window.specOf && webglOK()) init();

function init() {
  const canvas = document.createElement('canvas');
  canvas.className = 'cake3d';
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);
  stage.classList.add('has3d');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  // lights: warm key with soft shadow + cool rim
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
  key.shadow.radius = 6; key.shadow.bias = -0.0008;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9e4, 1.2); rim.position.set(-4, 3, -3); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xfff8ef, 0xe9d9cf, 0.55));

  // ground shadow catcher + cake stand
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; ground.receiveShadow = true; scene.add(ground);

  const standMat = new THREE.MeshPhysicalMaterial({ color: 0xfbf7f2, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.15 });
  const stand = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.38, 0.06, 96), standMat); plate.position.y = -0.03;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.55, 0.5, 64), standMat); foot.position.y = -0.31;
  [plate, foot].forEach((m) => { m.castShadow = true; m.receiveShadow = true; stand.add(m); });
  scene.add(stand);

  const root = new THREE.Group(); scene.add(root);
  let cake = null, layers = [], topGroup = null, current = '';
  const R = 1, H = 0.95, CUT = Math.PI / 3; // 60° wedge removed

  const mats = new Map();
  const mat = (hex, rough = 0.78, sheen = 0) => {
    const k = hex + rough + sheen; if (mats.has(k)) return mats.get(k);
    const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: 0, sheen, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff) });
    mats.set(k, m); return m;
  };
  const isCream = (hex) => /^#f[0-9a-f]/i.test(hex) && parseInt(hex.slice(3, 5), 16) > 0xd0;

  function build(sp) {
    if (cake) { root.remove(cake); cake.traverse((o) => o.geometry && o.geometry.dispose()); }
    cake = new THREE.Group(); layers = [];
    const tot = sp.L.reduce((s, l) => s + l[1], 0);
    let y = 0;
    sp.L.forEach((l) => {
      const h = H * l[1] / tot, col = l[0], cream = isCream(col);
      const g = new THREE.Group();
      const m = mat(col, cream ? 0.55 : 0.86, cream ? 0.4 : 0.15);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, h, 128, 1, false, CUT, Math.PI * 2 - CUT), m);
      // the two cut faces show the inside of the layer
      const faceGeo = new THREE.PlaneGeometry(R, h);
      faceGeo.translate(R / 2, 0, 0);
      const f1 = new THREE.Mesh(faceGeo, m); f1.rotation.y = CUT - Math.PI / 2;
      const f2 = new THREE.Mesh(faceGeo.clone(), m); f2.rotation.y = -Math.PI / 2; f2.scale.z = -1;
      f1.material = f2.material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(col).offsetHSL(0, 0.02, 0.03), roughness: cream ? 0.6 : 0.95, side: THREE.DoubleSide });
      [body, f1, f2].forEach((x) => { x.castShadow = true; x.receiveShadow = true; g.add(x); });
      g.position.y = y + h / 2; g.userData.base = g.position.y;
      cake.add(g); layers.push(g); y += h;
    });
    // top: cream disc + piped rosettes + berries / beans / crumbs
    topGroup = new THREE.Group();
    const topCol = sp.top || '#F7EBD3';
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, 0.05, 128, 1, false, CUT, Math.PI * 2 - CUT), mat(topCol, 0.45, 0.5));
    disc.castShadow = true; topGroup.add(disc);
    const rosMat = mat('#FFFDF8', 0.4, 0.6);
    for (let i = 0; i < 14; i++) {
      const a = CUT + 0.18 + (Math.PI * 2 - CUT - 0.36) * (i / 13);
      const r = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), rosMat);
      r.scale.set(1, 0.8, 1); r.position.set(Math.sin(a) * 0.86, 0.07, Math.cos(a) * 0.86); r.castShadow = true; topGroup.add(r);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 16), rosMat); tip.position.set(r.position.x, 0.15, r.position.z); topGroup.add(tip);
    }
    const ber = sp.berries || [];
    ber.forEach((c, i) => {
      const a = CUT + 0.6 + i * 0.95, rr = 0.45 + (i % 2) * 0.18;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.1 - (i % 2) * 0.015, 32, 24), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.2 }));
      b.position.set(Math.sin(a) * rr, 0.11, Math.cos(a) * rr); b.castShadow = true; topGroup.add(b);
    });
    if (sp.beans) for (let i = 0; i < 5; i++) { const a = CUT + 0.7 + i * 1; const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), mat('#3B2219', 0.5)); b.scale.set(1.3, 0.6, 0.9); b.position.set(Math.sin(a) * 0.5, 0.06, Math.cos(a) * 0.5); topGroup.add(b); }
    if (sp.crumbs) for (let i = 0; i < 40; i++) { const a = CUT + (Math.PI * 2 - CUT) * ((i * 0.618) % 1), rr = 0.75 * Math.sqrt((i * 0.381) % 1); const c = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.04), mat(sp.crumbs, 0.9)); c.position.set(Math.sin(a) * rr, 0.04, Math.cos(a) * rr); c.rotation.set(i, i * 2, i * 3); topGroup.add(c); }
    if (sp.drizzle) { const d = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.022, 10, 120, Math.PI * 2 - CUT), mat(sp.drizzle, 0.35)); d.rotation.x = Math.PI / 2; d.rotation.z = -(Math.PI / 2 + CUT) + Math.PI; d.position.y = 0.04; topGroup.add(d); }
    topGroup.position.y = y + 0.025; topGroup.userData.base = topGroup.position.y;
    cake.add(topGroup);
    cake.position.y = 0.0;
    cake.scale.setScalar(0.001);
    root.add(cake);
    growT = 0;
  }

  // sizing
  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize();

  // interaction: drag to rotate, scroll to explode
  let idle = 0, rotY = -0.35, vel = reduced ? 0 : 0.0035, dragging = false, lastX = 0, explode = 0, explodeTarget = 0, growT = 1;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; rotY += dx * 0.01; vel = dx * 0.0006; });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.style.touchAction = 'pan-y';
  function onScroll() {
    const r = stage.getBoundingClientRect(), vh = innerHeight;
    explodeTarget = Math.min(1, Math.max(0, (vh * 0.55 - r.top) / (r.height * 0.9)));
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // follow the hero caption (the page already cycles cakes)
  function sync() { const t = cap.textContent.trim(); if (t && t !== current) { current = t; build(window.specOf(t)); } }
  new MutationObserver(sync).observe(cap, { childList: true, characterData: true, subtree: true });
  sync();

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);

  svg.style.transition = 'opacity .6s'; svg.style.opacity = '0';

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!dragging) { rotY += vel; vel += (0 - vel) * 0.04; idle += dt; if (!reduced) rotY += Math.sin(idle * 0.6) * 0.0032; }
    explode += (explodeTarget - explode) * Math.min(1, dt * 6);
    growT = Math.min(1, growT + dt * 2.2);
    if (cake) {
      const s = 1 - Math.pow(1 - growT, 3);
      cake.scale.setScalar(Math.max(0.001, s));
      cake.rotation.y = rotY;
      layers.forEach((g, i) => { g.position.y = g.userData.base + explode * i * (1.0 / Math.max(3, layers.length)); g.rotation.y = explode * (i % 2 ? 0.12 : -0.12); });
      if (topGroup) topGroup.position.y = topGroup.userData.base + explode * (layers.length * (1.0 / Math.max(3, layers.length)) + 0.12);
    }
    const spread = explode * 1.1;
    const narrow = camera.aspect < 0.95 ? 1.25 : 1;
    camera.position.set(0, 2.15 + spread * 0.6, (5.4 + spread * 1.9) * narrow);
    camera.lookAt(0, 0.45 + spread * 0.5, 0);
    renderer.render(scene, camera);
  }
  frame();
}
