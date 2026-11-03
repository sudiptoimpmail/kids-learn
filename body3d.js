/* =========================================================
   3D body for "Body Parts" and "Inside My Body"
   A friendly kid figure built from smooth shapes, with layers:
     skin (clothes on) · bones (x-ray) · organs · vessels (arteries & veins)
   Drag to spin, tap to choose. Every part has a big invisible tap zone,
   and a tap that misses still picks the nearest part on screen.
   ========================================================= */
import * as THREE from './vendor/three.module.min.js';

let R = null;                 // the one shared renderer/scene (reused between questions)
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function build() {
  const canvas = document.createElement('canvas');
  canvas.className = 'b3d-cv';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 0.7, 0.1, 50);
  camera.position.set(0, 2.1, 9.2); camera.lookAt(0, 2.05, 0);
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a7f99', 1.25));
  const key = new THREE.DirectionalLight('#ffffff', 1.5); key.position.set(3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#b4d3ff', 0.7); rim.position.set(-4, 3, -4); scene.add(rim);

  const body = new THREE.Group(); scene.add(body);
  const parts = {};           // name → { meshes:[], proxy, center, layer, parent }
  const layers = { skin: new THREE.Group(), bones: new THREE.Group(), organs: new THREE.Group(), vessels: new THREE.Group() };
  Object.values(layers).forEach((g) => body.add(g));
  const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02, ...extra });
  const SKIN = '#f5c6a0', SHIRT = '#4dabf7', SHORTS = '#7950f2', SHOE = '#f03e3e', BONE = '#fff4dc';
  const add = (name, layer, mesh, opt = {}) => {
    layers[layer].add(mesh);
    const p = parts[name] || (parts[name] = { meshes: [], layer, parent: opt.parent || null, centers: [] });
    p.meshes.push(mesh);
    mesh.userData.part = name;
    const c = new THREE.Vector3(); mesh.getWorldPosition(c); p.centers.push(c);
    // big invisible tap zone around small parts
    const hr = opt.hit || 0;
    if (hr) { const h = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 8), new THREE.MeshBasicMaterial()); h.visible = false; h.position.copy(mesh.position); h.userData.part = name; h.userData.proxy = true; layers[layer].add(h); p.meshes.push(h); }
    return mesh;
  };
  const sph = (r, color, pos, scale) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), M(color)); m.position.copy(pos); if (scale) m.scale.set(...scale); return m; };
  const limb = (a, b, r, color) => {      // a capsule from point a to point b
    const len = a.distanceTo(b), m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, len), 8, 20), M(color));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    return m;
  };
  const tube = (pts, r, color) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 8, false), M(color, { roughness: 0.4 }));

  /* ---------------- skin layer: the kid ---------------- */
  const head = V(0, 3.42, 0);
  add('head', 'skin', sph(0.46, SKIN, head));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.49, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), M('#6b4226')); hair.position.copy(head).add(V(0, 0.02, -0.03)); hair.rotation.x = -0.25;
  add('hair', 'skin', hair, { parent: 'head', hit: 0.0 });
  for (const s of [-1, 1]) {
    add('eyes', 'skin', sph(0.075, '#ffffff', V(s * 0.16, 3.47, 0.4)), { parent: 'head', hit: 0.17 });
    add('eyes', 'skin', sph(0.045, '#2b2140', V(s * 0.16, 3.47, 0.465)), { parent: 'head' });
    const brow = limb(V(s * 0.08, 3.6, 0.42), V(s * 0.24, 3.61, 0.39), 0.022, '#6b4226'); add('eyebrows', 'skin', brow, { parent: 'head', hit: 0.13 });
    add('ears', 'skin', sph(0.1, SKIN, V(s * 0.47, 3.42, 0), [0.6, 1, 0.9]), { parent: 'head', hit: 0.2 });
    add('cheeks', 'skin', sph(0.08, '#ffa8a8', V(s * 0.25, 3.32, 0.37), [1, 0.8, 0.5]), { parent: 'head', hit: 0.14 });
  }
  add('nose', 'skin', sph(0.06, '#f4b183', V(0, 3.37, 0.47)), { parent: 'head', hit: 0.13 });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 24, Math.PI), M('#e03131')); mouth.position.set(0, 3.25, 0.43); mouth.rotation.z = Math.PI; add('mouth', 'skin', mouth, { parent: 'head', hit: 0.14 });
  add('chin', 'skin', sph(0.09, SKIN, V(0, 3.06, 0.33), [1, 0.6, 0.6]), { parent: 'head', hit: 0.14 });
  add('neck', 'skin', limb(V(0, 2.92, 0), V(0, 3.06, 0), 0.13, SKIN), { hit: 0.18 });
  add('chest', 'skin', limb(V(0, 2.55, 0), V(0, 2.72, 0), 0.4, SHIRT));
  add('tummy', 'skin', limb(V(0, 2.08, 0), V(0, 2.28, 0), 0.38, '#74c0fc'));
  add('tummy', 'skin', sph(0.025, '#1971c2', V(0, 2.12, 0.38)));
  add('hips', 'skin', limb(V(-0.12, 1.82, 0), V(0.12, 1.82, 0), 0.36, SHORTS));
  const sh = [], el = [], wr = [], hd = [];
  for (const s of [-1, 1]) {
    const S = V(s * 0.5, 2.82, 0), E = V(s * 0.6, 2.27, 0.03), W = V(s * 0.64, 1.75, 0.07), H = V(s * 0.66, 1.58, 0.09);
    sh.push(S); el.push(E); wr.push(W); hd.push(H);
    add('shoulders', 'skin', sph(0.17, '#339af0', S), { hit: 0.22 });
    add('arms', 'skin', limb(S, E.clone().add(V(0, 0.08, 0)), 0.12, SHIRT), { hit: 0 });
    add('arms', 'skin', limb(E, W, 0.1, SKIN));
    add('elbows', 'skin', sph(0.115, '#f0b98f', E), { parent: 'arms', hit: 0.2 });
    const wrist = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.03, 8, 20), M('#e8a77c')); wrist.position.copy(W); wrist.rotation.x = Math.PI / 2;
    add('wrists', 'skin', wrist, { parent: 'arms', hit: 0.16 });
    add('hands', 'skin', sph(0.13, SKIN, H, [0.8, 1.05, 0.6]), { parent: 'arms', hit: 0.2 });
    for (let f = 0; f < 4; f++) add('fingers', 'skin', limb(V(s * (0.6 + f * 0.04), 1.48, 0.1), V(s * (0.6 + f * 0.045), 1.36, 0.11), 0.022, SKIN), { parent: 'hands', hit: f === 1 ? 0.12 : 0 });
    add('fingers', 'skin', limb(V(s * 0.56, 1.6, 0.14), V(s * 0.52, 1.52, 0.17), 0.026, SKIN), { parent: 'hands' });
    const Hp = V(s * 0.2, 1.7, 0), K = V(s * 0.21, 0.98, 0.03), A = V(s * 0.21, 0.3, 0);
    add('legs', 'skin', limb(Hp, K.clone().add(V(0, 0.08, 0)), 0.15, SKIN));
    add('legs', 'skin', limb(Hp, Hp.clone().add(V(0, -0.22, 0)), 0.17, SHORTS));
    add('knees', 'skin', sph(0.14, '#f0b98f', K), { parent: 'legs', hit: 0.22 });
    add('legs', 'skin', limb(K, A, 0.12, SKIN));
    add('ankles', 'skin', sph(0.09, '#e8a77c', A), { parent: 'legs', hit: 0.16 });
    add('feet', 'skin', sph(0.15, SHOE, V(s * 0.22, 0.13, 0.12), [0.95, 0.6, 1.6]), { hit: 0.22 });
  }

  /* ---------------- bones (x-ray) ---------------- */
  const B = (r) => M(BONE, { roughness: 0.45 });
  add('skull', 'bones', sph(0.39, BONE, V(0, 3.46, 0.0), [1, 1.05, 1.05]));
  const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 10, 24, Math.PI), B()); jaw.position.set(0, 3.18, 0.12); jaw.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI); add('jaw', 'bones', jaw, { hit: 0.18 });
  for (let k = 0; k < 14; k++) add('spine', 'bones', new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.07, 12), B()).translateY(1.78 + k * 0.095).translateZ(-0.2), { hit: k % 3 ? 0 : 0.12 });
  for (let k = 0; k < 6; k++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.3 - Math.abs(k - 2) * 0.012, 0.022, 8, 32, Math.PI * 1.55), B());
    rib.position.set(0, 2.82 - k * 0.11, -0.05); rib.rotation.set(Math.PI / 2, 0, Math.PI * 0.725); rib.scale.set(1.15, 0.8, 1);
    add('ribs', 'bones', rib, { hit: k === 2 ? 0.3 : 0 });
  }
  for (const s of [-1, 1]) {
    add('collarbone', 'bones', limb(V(s * 0.06, 2.93, 0.12), V(s * 0.46, 2.88, 0.02), 0.03, BONE), { hit: 0.12 });
    add('arm bone', 'bones', limb(sh[s < 0 ? 0 : 1], el[s < 0 ? 0 : 1], 0.045, BONE), { hit: 0.14 });
    add('forearm bones', 'bones', limb(el[s < 0 ? 0 : 1], wr[s < 0 ? 0 : 1].clone().add(V(-0.025 * s, 0, 0)), 0.03, BONE), { hit: 0.12 });
    add('forearm bones', 'bones', limb(el[s < 0 ? 0 : 1].clone().add(V(0.03 * s, 0, 0)), wr[s < 0 ? 0 : 1].clone().add(V(0.03 * s, 0, 0)), 0.026, BONE));
    for (let f = 0; f < 4; f++) add('hand bones', 'bones', limb(V(s * (0.6 + f * 0.04), 1.66, 0.09), V(s * (0.6 + f * 0.045), 1.38, 0.11), 0.016, BONE), { hit: f === 1 ? 0.14 : 0 });
    const Hp = V(s * 0.2, 1.72, 0), K = V(s * 0.21, 0.98, 0.03);
    add('thigh bone', 'bones', limb(Hp, K.clone().add(V(0, 0.06, 0)), 0.05, BONE), { hit: 0.14 });
    add('kneecap', 'bones', sph(0.065, BONE, K.clone().add(V(0, 0, 0.1))), { hit: 0.14 });
    add('shin bone', 'bones', limb(K.clone().add(V(0, -0.06, 0)), V(s * 0.21, 0.32, 0), 0.045, BONE), { hit: 0.14 });
    add('shin bone', 'bones', limb(K.clone().add(V(s * 0.06, -0.08, -0.02)), V(s * 0.26, 0.33, -0.02), 0.022, BONE));
    for (let f = 0; f < 3; f++) add('foot bones', 'bones', limb(V(s * (0.17 + f * 0.04), 0.2, -0.02), V(s * (0.17 + f * 0.04), 0.1, 0.3), 0.02, BONE), { hit: f === 1 ? 0.14 : 0 });
  }
  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 10, 28), B()); pelvis.position.set(0, 1.8, -0.02); pelvis.rotation.x = Math.PI / 2.4; pelvis.scale.set(1.2, 1, 0.7);
  add('hip bone', 'bones', pelvis, { hit: 0.3 });

  /* ---------------- organs ---------------- */
  const brain = sph(0.34, '#f9a8c8', V(0, 3.52, 0)); brain.scale.set(1, 0.85, 1.05); add('brain', 'organs', brain, { hit: 0.3 });
  for (const s of [-1, 1]) add('lungs', 'organs', sph(0.2, '#ff8fa3', V(s * 0.19, 2.6, -0.02), [0.8, 1.45, 0.8]), { hit: 0.25 });
  const heart = new THREE.Group();
  heart.add(sph(0.1, '#e03131', V(-0.06, 0.04, 0)), sph(0.1, '#e03131', V(0.06, 0.04, 0)));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 20), M('#e03131')); tip.rotation.z = Math.PI; tip.position.y = -0.08; heart.add(tip);
  heart.position.set(0.06, 2.5, 0.16); heart.rotation.z = -0.3; add('heart', 'organs', heart, { hit: 0.2 });
  const liver = sph(0.2, '#a0522d', V(-0.17, 2.22, 0.07)); liver.scale.set(1.3, 0.6, 0.8); add('liver', 'organs', liver, { hit: 0.22 });
  const stomach = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.08, 12, 24, Math.PI * 1.3), M('#ffa94d')); stomach.position.set(0.15, 2.2, 0.12); stomach.rotation.z = 1.2; add('stomach', 'organs', stomach, { hit: 0.22 });
  const gut = new THREE.Mesh(new THREE.TorusKnotGeometry(0.15, 0.045, 80, 10, 2, 5), M('#ffc078')); gut.position.set(0, 1.92, 0.1); gut.scale.set(1.15, 0.9, 0.6); add('intestines', 'organs', gut, { hit: 0.26 });
  for (const s of [-1, 1]) add('kidneys', 'organs', sph(0.08, '#c2255c', V(s * 0.17, 2.12, -0.22), [0.7, 1.2, 0.6]), { hit: 0.16 });

  /* ---------------- vessels: arteries (red, from the heart) & veins (blue, back to the heart) ---------------- */
  const H0 = V(0.06, 2.5, 0.16);
  const path = (dx) => [
    [H0, V(dx, 2.75, 0.1), V(dx * 0.6, 3.05, 0.05), V(dx * 0.8, 3.35, 0.2)],
    [H0, V(0.3 + dx, 2.8, 0.05), V(0.58 + dx, 2.3, 0.1), V(0.64 + dx, 1.7, 0.12)],
    [H0, V(-0.3 + dx, 2.8, 0.05), V(-0.58 + dx, 2.3, 0.1), V(-0.64 + dx, 1.7, 0.12)],
    [H0, V(dx, 2.0, 0.05), V(0.2 + dx, 1.6, 0.08), V(0.22 + dx, 0.95, 0.1), V(0.22 + dx, 0.3, 0.06)],
    [H0, V(dx, 2.0, 0.05), V(-0.2 + dx, 1.6, 0.08), V(-0.22 + dx, 0.95, 0.1), V(-0.22 + dx, 0.3, 0.06)],
  ];
  path(0.04).forEach((p, i) => add('arteries', 'vessels', tube(p, 0.028, '#e03131'), { hit: i === 3 ? 0.22 : 0 }));
  path(-0.05).forEach((p, i) => add('veins', 'vessels', tube(p.map((v) => v.clone().add(V(-0.04, 0, -0.03))), 0.026, '#1c7ed6'), { hit: i === 4 ? 0.22 : 0 }));
  layers.vessels.add(heart.clone());

  // centers (for nearest-part tapping and highlighting)
  scene.updateMatrixWorld(true);
  for (const p of Object.values(parts)) {
    p.centers = p.meshes.filter((m) => !m.userData.proxy).map((m) => { const b = new THREE.Box3().setFromObject(m); return b.getCenter(new THREE.Vector3()); });
  }
  // remember original materials so we can fade/glow them
  body.traverse((o) => { if (o.isMesh && o.material && !o.userData.proxy) o.userData.base = { color: o.material.color.clone(), op: 1 }; });
  return { renderer, canvas, scene, camera, body, layers, parts };
}

function setLayer(view, layer) {
  const { layers } = R;
  // skin always shows; inner layers make the skin see-through like an x-ray
  for (const [name, g] of Object.entries(layers)) {
    g.visible = name === 'skin' || name === layer || (layer === 'vessels' && name === 'organs' && false);
    g.traverse((o) => {
      if (!o.isMesh || o.userData.proxy) return;
      const xray = name === 'skin' && layer !== 'skin';
      if (o.material.transparent !== xray) o.material.needsUpdate = true;
      o.material.transparent = xray; o.material.opacity = xray ? 0.13 : 1; o.material.depthWrite = !xray;
    });
  }
  view.layer = layer;
}
function glow(name) {
  for (const p of Object.values(R.parts)) for (const m of p.meshes) {
    if (m.userData.proxy) continue;
    m.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) o.material.emissive.set(name && o.userData.part === name || (name && m.userData.part === name) ? '#ff9f1c' : '#000000'); });
  }
  R.glowing = name;
}

// opts: { layer, highlight, tappable:[names], onTap(namesHit), label }
export function mount(host, opts = {}) {
  if (!R) R = build();
  const view = { alive: true };
  host.innerHTML = '';
  host.appendChild(R.canvas);
  const lab = document.createElement('div'); lab.className = 'b3d-label'; lab.hidden = true; host.appendChild(lab);
  const tools = document.createElement('div'); tools.className = 'b3d-tools';
  tools.innerHTML = '<span>👆 Drag to spin</span>';
  host.appendChild(tools);
  const size = () => { const w = host.clientWidth, h = Math.round(Math.min(w * 1.25, innerHeight * 0.52)); R.renderer.setSize(w, h, true); R.camera.aspect = w / h; R.camera.updateProjectionMatrix(); };
  size();
  setLayer(view, opts.layer || 'skin');
  glow(opts.highlight || null);
  R.body.rotation.y = 0;
  let spin = 0, drag = null;
  const tappable = new Set(opts.tappable || []);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(cx, cy) {
    const r = R.canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, R.camera);
    const groups = [R.layers[view.layer]].concat(view.layer === 'skin' ? [] : [R.layers.skin]);
    const hits = ray.intersectObjects(groups, true).map((h) => h.object.userData.part || (h.object.parent && h.object.parent.userData.part)).filter(Boolean);
    let names = [...new Set(hits)].filter((n) => !tappable.size || tappable.has(n) || tappable.has(R.parts[n] && R.parts[n].parent));
    // generous: also anything whose center is within ~48px of the finger
    const near = [];
    for (const [n, p] of Object.entries(R.parts)) {
      if (R.parts[n].layer !== view.layer && !(view.layer !== 'skin' && false)) continue;
      if (tappable.size && !tappable.has(n)) continue;
      for (const c of p.centers) {
        const v = c.clone().applyAxisAngle(V(0, 1, 0), R.body.rotation.y).project(R.camera);
        const px = (v.x + 1) / 2 * r.width + r.left, py = (1 - v.y) / 2 * r.height + r.top;
        const d = Math.hypot(px - cx, py - cy);
        if (d < 48) near.push([d, n]);
      }
    }
    near.sort((a, b) => a[0] - b[0]);
    names = [...new Set(names.concat(near.map((x) => x[1])))];
    // a tap on an eye also counts as the head, a tap on a knee also counts as the leg
    const withParents = [];
    for (const n of names) { withParents.push(n); let p = R.parts[n] && R.parts[n].parent; while (p) { withParents.push(p); p = R.parts[p] && R.parts[p].parent; } }
    return [...new Set(withParents)];
  }
  const onDown = (e) => { e.preventDefault(); drag = { x: e.clientX, y: e.clientY, rot: R.body.rotation.y, moved: 0 }; R.canvas.setPointerCapture && R.canvas.setPointerCapture(e.pointerId); };
  const onMove = (e) => { if (!drag) return; const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx)); R.body.rotation.y = drag.rot + dx / 90; };
  const onUp = (e) => {
    if (drag && drag.moved < 10 && opts.onTap) { const names = pickAt(e.clientX, e.clientY); if (names.length) opts.onTap(names); }
    drag = null;
  };
  R.canvas.addEventListener('pointerdown', onDown); R.canvas.addEventListener('pointermove', onMove);
  R.canvas.addEventListener('pointerup', onUp); R.canvas.addEventListener('pointercancel', () => (drag = null));
  let raf = 0, t = 0, last = 0;
  const loop = (now) => {
    if (!view.alive) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; t += dt;
    if (R.glowing) {           // pulse the glowing part
      const k = 0.55 + 0.45 * Math.sin(t * 5);
      for (const m of (R.parts[R.glowing] || { meshes: [] }).meshes) m.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) o.material.emissiveIntensity = k; });
    }
    if (spin) { R.body.rotation.y += spin * dt; }
    if (view.label) {
      const c = view.label.c.clone().applyAxisAngle(V(0, 1, 0), R.body.rotation.y).project(R.camera);
      lab.style.left = `${(c.x + 1) / 2 * 100}%`; lab.style.top = `${(1 - c.y) / 2 * 100}%`;
    }
    R.renderer.render(R.scene, R.camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  addEventListener('resize', size);

  view.highlight = (name) => glow(name);
  view.layerTo = (layer) => setLayer(view, layer);
  // show what is inside: switch to an inner layer, glow a part and float a label on it
  view.reveal = ({ layer, part, text }) => {
    setLayer(view, layer); glow(part);
    const p = R.parts[part];
    if (p && p.centers.length) { view.label = { c: p.centers[0] }; lab.textContent = text; lab.hidden = false; }
  };
  view.dispose = () => {
    view.alive = false; cancelAnimationFrame(raf); removeEventListener('resize', size);
    R.canvas.removeEventListener('pointerdown', onDown); R.canvas.removeEventListener('pointermove', onMove); R.canvas.removeEventListener('pointerup', onUp);
    glow(null);
    if (R.canvas.parentNode) R.canvas.parentNode.removeChild(R.canvas);
  };
  window.__b3dParts = R.parts;   // used by automated tests
  return view;
}
export const partNames = () => (R ? Object.keys(R.parts) : []);
