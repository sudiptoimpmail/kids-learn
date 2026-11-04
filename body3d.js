/* =========================================================
   3D body for "Body Parts" and "Inside My Body"
   A real human anatomy model (open-anatomy-3d: BodyParts3D, HuBMAP, MakeHuman — CC BY 4.0),
   prepared for kids: the outside wears a t-shirt, shorts and shoes; reproductive anatomy is left out.
   Layers: skin (clothes on) · organs · bones · vessels (arteries & veins), seen through an x-ray skin.
   Drag to spin, tap to choose. The camera zooms to the part being asked about, and taps are generous.
   ========================================================= */
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';

export const ATTRIBUTION = '3D anatomy: BodyParts3D © The Database Center for Life Science (CC BY 4.0); Human Reference Atlas, HuBMAP (CC BY 4.0); body: MakeHuman (CC0); modified by open-anatomy-3d (CC BY 4.0) and for this app (clothes, lungs, parts removed).';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const copyT = (o, m) => { o.position.copy(m.position); o.quaternion.copy(m.quaternion); o.scale.copy(m.scale); };
let R = null, loading = null;

// mesh name → the part name used by the questions
const MESH_PART = {
  brain: 'brain', cerebellum: 'brain', brainstem: 'brain', heart: 'heart',
  lung_l: 'lungs', lung_r: 'lungs', airway_l: 'lungs', airway_r: 'lungs', bronchi: 'lungs', trachea: 'lungs',
  stomach: 'stomach', esophagus: 'stomach', liver: 'liver', gallbladder: 'liver', small_intestine: 'intestines', colon: 'intestines',
  kidney_l: 'kidneys', kidney_r: 'kidneys', bladder: 'bladder', pancreas: 'pancreas', spleen: 'spleen',
  skull: 'skull', mandible: 'jaw', teeth: 'jaw', spine_cervical: 'spine', spine_thoracic: 'spine', spine_lumbar: 'spine',
  ribs_l: 'ribs', ribs_r: 'ribs', sternum: 'ribs', clavicle_l: 'collarbone', clavicle_r: 'collarbone', scapula_l: 'shoulder blade', scapula_r: 'shoulder blade',
  pelvis: 'hip bone', femur_l: 'thigh bone', femur_r: 'thigh bone', patella_l: 'kneecap', patella_r: 'kneecap', lower_leg_l: 'shin bone', lower_leg_r: 'shin bone',
  humerus_l: 'arm bone', humerus_r: 'arm bone', forearm_l: 'forearm bones', forearm_r: 'forearm bones', hand_l: 'hand bones', hand_r: 'hand bones', foot_l: 'foot bones', foot_r: 'foot bones',
  pulmonary_vessels: 'lung vessels',
};
const vesselPart = (n) => (/^(veins|vena)/.test(n) ? 'veins' : /^(arter|aorta|carotid|coronary)/.test(n) ? 'arteries' : null);
const LOOK = {   // [color, roughness, clearcoat, opacity]
  brain: ['#eba8aa', 0.55, 0.35], cerebellum: ['#d98d96', 0.55, 0.35], brainstem: ['#e0aa9c', 0.6, 0.3], heart: ['#a51d2a', 0.42, 0.8],
  lung_l: ['#f2a0ad', 0.75, 0.2, 0.84], lung_r: ['#f2a0ad', 0.75, 0.2, 0.84], airway_l: ['#c96b82', 0.6, 0.2], airway_r: ['#c96b82', 0.6, 0.2],
  bronchi: ['#ead2c4', 0.6, 0.3], trachea: ['#ead2c4', 0.6, 0.3], stomach: ['#e98f98', 0.5, 0.6], esophagus: ['#d77c88', 0.5, 0.5],
  liver: ['#7a1e22', 0.4, 0.85], gallbladder: ['#5b8a3a', 0.4, 0.8], small_intestine: ['#f2a493', 0.5, 0.6], colon: ['#d98a72', 0.55, 0.5],
  kidney_l: ['#8a2a2c', 0.45, 0.7], kidney_r: ['#8a2a2c', 0.45, 0.7], bladder: ['#e8c271', 0.5, 0.5], pancreas: ['#f0c07a', 0.6, 0.4], spleen: ['#6e2346', 0.45, 0.6],
  teeth: ['#fbfaf2', 0.3, 0.6], pulmonary_vessels: ['#8f52c4', 0.45, 0.5],
};
const BONE = ['#eee3c8', 0.55, 0.15], ART = ['#d42b2b', 0.4, 0.6], VEIN = ['#2f62d6', 0.4, 0.6];
const CLOTHES = { shirt: '#4dabf7', shorts: '#7048e8', shoes: '#f03e3e', hair: '#4a2a17' };
const PARENT = { eyes: 'head', ears: 'head', nose: 'head', mouth: 'head', chin: 'head', cheeks: 'head', eyebrows: 'head', hair: 'head',
  fingers: 'hands', wrists: 'arms', elbows: 'arms', knees: 'legs', ankles: 'legs', shoulders: 'arms' };
const FACE = new Set(['head', 'hair', 'eyes', 'ears', 'nose', 'mouth', 'chin', 'cheeks', 'eyebrows', 'skull', 'jaw', 'brain']);
const TORSO = new Set(['neck', 'shoulders', 'chest', 'tummy', 'heart', 'lungs', 'stomach', 'liver', 'intestines', 'kidneys', 'ribs', 'spine', 'collarbone', 'hip bone']);

function eyeTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f3ee'; g.fillRect(0, 0, 256, 128);
  const cx = 64, cy = 64;
  const ir = g.createRadialGradient(cx, cy, 2, cx, cy, 22); ir.addColorStop(0, '#2a1608'); ir.addColorStop(0.35, '#3d230d'); ir.addColorStop(0.8, '#7a4a20'); ir.addColorStop(1, '#3a210c');
  g.fillStyle = ir; g.beginPath(); g.ellipse(cx, cy, 13, 22, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#080808'; g.beginPath(); g.ellipse(cx, cy, 5.5, 9.5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffffdd'; g.beginPath(); g.ellipse(cx - 4, cy - 7, 2.5, 4, 0, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function ponytail() {
  const curve = new THREE.CatmullRomCurve3([V(0, 1.575, -0.085), V(0, 1.555, -0.125), V(0, 1.49, -0.14), V(0.004, 1.42, -0.125), V(0.006, 1.37, -0.11)]);
  const N = 40, M = 14, pos = [], idx = [];
  const fr = curve.computeFrenetFrames(N, false);
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPointAt(t), r = 0.026 * (t < 0.12 ? 0.7 + t * 2.5 : 1 - 0.75 * Math.pow((t - 0.12) / 0.88, 1.4));
    for (let j = 0; j <= M; j++) {
      const a = j / M * Math.PI * 2, n = fr.normals[i].clone().multiplyScalar(Math.cos(a)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// see-through "x-ray" skin: bright at the edges, clear in the middle
const ghostMat = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { col: { value: new THREE.Color('#8fd3ff') } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform vec3 col; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(col, 0.05 + 0.55*pow(f, 2.2)); }',
});

async function build() {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('./vendor/body.glb', import.meta.url).href);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 0.7, 0.05, 20);
  scene.add(new THREE.HemisphereLight('#ffffff', '#6b6080', 1.5));
  const key = new THREE.DirectionalLight('#fff6ec', 2.2); key.position.set(1.5, 3, 3); scene.add(key);
  const fill = new THREE.DirectionalLight('#dbe9ff', 0.9); fill.position.set(-2, 1, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight('#bfe0ff', 1.0); rim.position.set(-1, 2, -3); scene.add(rim);

  const body = new THREE.Group(); scene.add(body);
  const layers = {}; const parts = {}; const skinMeshes = []; let ghost = null;
  const partNames = gltf.scene.userData.parts || [];
  const addPart = (name, mesh, layer) => { const p = parts[name] || (parts[name] = { meshes: [], layer, center: null }); p.meshes.push(mesh); mesh.userData.part = name; };
  for (const g of [...gltf.scene.children]) {
    const lname = { outside: 'skin', skeleton: 'bones', organs: 'organs', vessels: 'vessels' }[g.name.replace(/_\d+$/, '')];
    if (!lname) continue;
    layers[lname] = g; body.add(g);
    for (const m of [...g.children]) {
      if (!m.isMesh) continue;
      m.name = m.name.replace(/_\d+$/, '');   // the loader adds _1 to names it has seen before
      if (!m.geometry.getAttribute('normal')) m.geometry.computeVertexNormals();
      if (lname === 'skin') {
        const lab = m.geometry.getAttribute('_part');
        if (m.name === 'skin') {
          // skin tone with rosy lips and cheeks, dark eyebrows
          const n = m.geometry.getAttribute('position').count, col = new Float32Array(n * 3);
          const base = new THREE.Color('#e9b994'), tint = { mouth: ['#c9746f', 0.75], cheeks: ['#eda593', 0.45], eyebrows: ['#6b4428', 0.55] }, c = new THREE.Color();
          for (let i = 0; i < n; i++) { const t = tint[partNames[lab ? lab.getX(i) : 0]]; c.copy(base); if (t) c.lerp(new THREE.Color(t[0]), t[1]); col.set([c.r, c.g, c.b], i * 3); }
          m.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
          m.material = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, sheen: 0.4, sheenColor: new THREE.Color('#ffcfb8') });
          ghost = new THREE.Mesh(m.geometry, ghostMat()); ghost.visible = false; copyT(ghost, m); body.add(ghost);
        } else {
          m.material = new THREE.MeshStandardMaterial({ color: CLOTHES[m.name] || '#999', roughness: m.name === 'hair' ? 0.5 : 0.85, side: THREE.DoubleSide });
        }
        skinMeshes.push(m);
        continue;
      }
      const look = LOOK[m.name] || (lname === 'bones' ? BONE : vesselPart(m.name) === 'veins' ? VEIN : vesselPart(m.name) === 'arteries' ? ART : ['#c88', 0.6, 0.3]);
      m.material = new THREE.MeshPhysicalMaterial({ color: look[0], roughness: look[1], clearcoat: look[2] || 0, clearcoatRoughness: 0.35,
        transparent: !!look[3], opacity: look[3] || 1, depthWrite: !look[3] });
      if (look[3]) m.renderOrder = 2;
      const pn = MESH_PART[m.name] || vesselPart(m.name);
      if (pn) addPart(pn, m, lname);
    }
  }
  // eyeballs and a ponytail on the outside
  const eyeTex = eyeTexture();
  for (const e of gltf.scene.userData.eyes || []) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(e.r * 0.94, 32, 20), new THREE.MeshPhysicalMaterial({ map: eyeTex, roughness: 0.15, clearcoat: 1 }));
    s.position.set(e.c[0], e.c[1], e.c[2] + 0.001); s.rotation.y = e.c[0] > 0 ? 0.12 : -0.12; s.name = 'eye'; layers.skin.add(s); skinMeshes.push(s);
  }
  const tail = new THREE.Mesh(ponytail(), new THREE.MeshStandardMaterial({ color: CLOTHES.hair, roughness: 0.5 })); tail.name = 'ponytail'; layers.skin.add(tail); skinMeshes.push(tail);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.006, 10, 24), new THREE.MeshStandardMaterial({ color: '#f783ac', roughness: 0.4 }));
  tie.position.set(0, 1.556, -0.124); tie.rotation.x = 1.1; layers.skin.add(tie);
  // the heart also shows with the blood vessels
  const heart2 = parts.heart && parts.heart.meshes[0].clone(); if (heart2) { heart2.userData = {}; layers.vessels.add(heart2); }

  // part centers (for labels / framing)
  scene.updateMatrixWorld(true);
  // centers (for labels / framing / tests); a left-right pair uses the one on the right of the screen
  for (const p of Object.values(parts)) {
    const left = p.meshes.filter((m) => /_l$/.test(m.name)), use = left.length && left.length < p.meshes.length ? left : p.meshes;
    const b = new THREE.Box3(); use.forEach((m) => b.expandByObject(m)); p.center = b.getCenter(new THREE.Vector3());
  }
  // outside parts from the per-vertex labels
  const sums = {};
  for (const m of skinMeshes) {
    const lab = m.geometry.getAttribute('_part'), pos = m.geometry.getAttribute('position'); if (!lab) continue;
    m.updateMatrix(); const q = new THREE.Vector3();
    for (let i = 0; i < lab.count; i += 2) { const n = partNames[lab.getX(i)]; q.fromBufferAttribute(pos, i).applyMatrix4(m.matrix); const k = n + (q.x > 0.012 ? '+' : q.x < -0.012 ? '-' : '0'); const s = sums[k] || (sums[k] = [0, 0, 0, 0]); s[0] += q.x; s[1] += q.y; s[2] += q.z; s[3]++; }
  }
  for (const n of partNames) {
    const r = sums[n + '+'], l = sums[n + '-'], m0 = sums[n + '0'];
    const tot = (r ? r[3] : 0) + (l ? l[3] : 0) + (m0 ? m0[3] : 0); if (!tot || parts[n]) continue;
    let s;
    if (r && l && r[3] > tot * 0.25 && l[3] > tot * 0.25) s = r;           // a pair: use one side
    else { s = [0, 0, 0, 0]; for (const t of [r, l, m0]) if (t) for (let i = 0; i < 4; i++) s[i] += t[i]; }
    parts[n] = { meshes: [], layer: 'skin', center: V(s[0] / s[3], s[1] / s[3], s[2] / s[3]) };
  }
  if (parts.eyes) parts.eyes.center.z += 0.01;
  if (parts.hair) parts.hair.center.set(0, 1.605, 0.03);   // the top of the head, where a finger would go
  return { renderer: null, canvas: null, scene, camera, body, layers, parts, skinMeshes, ghost, partNames, overlay: null, cam: { y: 0.83, h: 1.8, ty: 0.83, th: 1.8 } };
}

/* ---------- glow: inner parts pulse orange; outside parts get an orange patch over the real surface ---------- */
function clearGlow() {
  if (R.overlay) { R.overlay.forEach((o) => { o.parent && o.parent.remove(o); o.geometry.dispose(); }); R.overlay = null; }
  for (const p of Object.values(R.parts)) for (const m of p.meshes) { m.material.emissive && m.material.emissive.set('#000'); }
  for (const l of ['organs', 'bones', 'vessels']) R.layers[l] && R.layers[l].traverse((o) => {
    if (o.isMesh && o.userData.fade) { o.material.opacity = o.userData.fade[0]; o.material.transparent = o.userData.fade[1]; o.material.depthWrite = o.userData.fade[2]; o.userData.fade = null; o.material.needsUpdate = true; }
  });
  R.glowing = null;
}
function glow(name) {
  clearGlow();
  if (!name) return;
  R.glowing = name;
  const p = R.parts[name];
  if (p && p.layer !== 'skin') {
    for (const m of p.meshes) m.material.emissive.set('#ff8c1a');
    // fade the other parts so a hidden one (like the kidneys) can be seen
    R.layers[p.layer].traverse((o) => {
      if (!o.isMesh || o.userData.part === name || o.userData.fade) return;
      o.userData.fade = [o.material.opacity, o.material.transparent, o.material.depthWrite];
      o.material.transparent = true; o.material.opacity = 0.22; o.material.depthWrite = false; o.material.needsUpdate = true;
    });
    return;
  }
  const want = new Set([name]); for (const [c, par] of Object.entries(PARENT)) if (par === name) want.add(c);
  const ids = new Set(R.partNames.map((n, i) => (want.has(n) ? i : -1)).filter((i) => i >= 0));
  R.overlay = [];
  const mat = new THREE.MeshBasicMaterial({ color: '#ffa21f', transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, side: THREE.DoubleSide });
  for (const m of R.skinMeshes) {
    const lab = m.geometry.getAttribute('_part');
    if (!lab) { if ((name === 'eyes' && m.name === 'eye') || ((name === 'hair' || name === 'head') && m.name === 'ponytail')) { const o = new THREE.Mesh(m.geometry, mat); copyT(o, m); o.scale.multiplyScalar(1.03); m.parent.add(o); R.overlay.push(o); } continue; }
    const idx = m.geometry.index.array, keep = [];
    for (let t = 0; t < idx.length; t += 3) if (ids.has(lab.getX(idx[t])) || ids.has(lab.getX(idx[t + 1])) || ids.has(lab.getX(idx[t + 2]))) keep.push(idx[t], idx[t + 1], idx[t + 2]);
    if (!keep.length) continue;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', m.geometry.getAttribute('position')); g.setIndex(keep);
    const o = new THREE.Mesh(g, mat); copyT(o, m); m.parent.add(o); R.overlay.push(o);
  }
}

function frameFor(name, layer) {
  if (FACE.has(name)) return [1.5, 0.36];
  if (layer === 'organs' && !name) return [1.2, 0.95];
  if (layer === 'organs' || TORSO.has(name)) return [1.15, 0.8];
  return [0.83, 1.8];
}
function setLayer(view, layer) {
  view.layer = layer;
  const x = layer !== 'skin';
  for (const m of R.skinMeshes) m.visible = !x;
  R.layers.skin.traverse((o) => { if (o !== R.layers.skin && !R.skinMeshes.includes(o) && o.isMesh) o.visible = !x; });
  R.ghost.visible = x;
  for (const l of ['organs', 'bones', 'vessels']) R.layers[l].visible = l === layer;
  view.host.classList.toggle('xray', x);
}

// opts: { layer, highlight, focus, tappable:[names], onTap(namesHit) }
export function mount(host, opts = {}) {
  const view = { alive: true, host, layer: opts.layer || 'skin', pending: [] };
  if (!host.querySelector('.b3d-loading')) host.innerHTML = '<div class="b3d-loading">🧍 Getting ready…</div>';
  const ready = (R ? Promise.resolve(R) : (loading = loading || build().then((r) => (R = r)))).then(() => { if (view.alive) start(view, host, opts); });
  ready.catch((e) => { console.warn(e); loading = null; if (view.alive) host.innerHTML = '<div class="b3d-loading">3D body could not load. Try again soon!</div>'; });
  // calls that come before the model is ready are queued
  view.highlight = (n) => view.pending.push(['highlight', n]);
  view.reveal = (r) => view.pending.push(['reveal', r]);
  view.layerTo = (l) => view.pending.push(['layerTo', l]);
  view.dispose = () => { view.alive = false; };
  window.__b3dReady = ready;
  return view;
}

// the WebGL renderer is made when a body question shows and released when the child leaves the game;
// the loaded model stays in memory so the next question opens instantly
function ensureRenderer() {
  if (R.renderer) return;
  const canvas = document.createElement('canvas'); canvas.className = 'b3d-cv';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  R.renderer = renderer; R.canvas = canvas;
}
export function release() {
  if (!R || !R.renderer) return;
  clearGlow();
  R.renderer.dispose(); R.renderer.forceContextLoss();
  if (R.canvas.parentNode) R.canvas.parentNode.removeChild(R.canvas);
  R.renderer = null; R.canvas = null;
}
function start(view, host, opts) {
  ensureRenderer();
  host.innerHTML = '';
  host.appendChild(R.canvas);
  const lab = document.createElement('div'); lab.className = 'b3d-label'; lab.hidden = true; host.appendChild(lab);
  const tools = document.createElement('div'); tools.className = 'b3d-tools'; tools.innerHTML = '<span>👆 Drag to spin</span>'; host.appendChild(tools);
  const credit = document.createElement('div'); credit.className = 'b3d-credit'; credit.textContent = '3D: BodyParts3D/DBCLS · HuBMAP · MakeHuman · CC BY 4.0'; host.appendChild(credit);
  const size = () => { const w = host.clientWidth, h = Math.round(Math.min(w * 1.25, innerHeight * 0.52)); R.renderer.setSize(w, h, true); R.camera.aspect = w / h; R.camera.updateProjectionMatrix(); };
  size();
  setLayer(view, opts.layer || 'skin');
  glow(opts.highlight || null);
  const fr = frameFor(opts.focus || opts.highlight || '', view.layer);
  R.cam.ty = fr[0]; R.cam.th = fr[1]; R.cam.y = fr[0]; R.cam.h = fr[1];
  R.body.rotation.y = 0;
  const tappable = new Set(opts.tappable || []);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function namesAt(cx, cy) {
    const r = R.canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, R.camera);
    const out = [];
    if (view.layer === 'skin') {
      const h = ray.intersectObjects(R.skinMeshes, false)[0];
      if (h) {
        if (h.object.name === 'eye') out.push('eyes');
        else if (h.object.name === 'ponytail') out.push('hair');
        else { const la = h.object.geometry.getAttribute('_part'); if (la) out.push(R.partNames[la.getX(h.face.a)], R.partNames[la.getX(h.face.b)], R.partNames[la.getX(h.face.c)]); }
      }
    } else {
      for (const h of ray.intersectObjects([R.layers[view.layer]], true)) if (h.object.userData.part) out.push(h.object.userData.part);
    }
    return out;
  }
  function pickAt(cx, cy) {
    let names = namesAt(cx, cy);
    // a little ring of extra taps around the finger, wider if the finger missed everything
    const rads = names.length ? [16] : [16, 30, 46];
    for (const rad of rads) for (let k = 0; k < 8; k++) names = names.concat(namesAt(cx + Math.cos(k * Math.PI / 4) * rad, cy + Math.sin(k * Math.PI / 4) * rad));
    const withParents = [];
    for (const n of names) { if (!n || n === 'body') continue; withParents.push(n); let p = PARENT[n]; while (p) { withParents.push(p); p = PARENT[p]; } }
    let res = [...new Set(withParents)];
    if (tappable.size) res = res.filter((n) => tappable.has(n)).concat(res.filter((n) => !tappable.has(n)));
    return res;
  }
  let drag = null;
  const onDown = (e) => { e.preventDefault(); drag = { x: e.clientX, y: e.clientY, rot: R.body.rotation.y, moved: 0 }; R.canvas.setPointerCapture && R.canvas.setPointerCapture(e.pointerId); };
  const onMove = (e) => { if (!drag) return; const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx)); R.body.rotation.y = drag.rot + dx / 90; };
  const onUp = (e) => {
    if (drag && drag.moved < 10 && opts.onTap) { const names = pickAt(e.clientX, e.clientY); if (names.length) opts.onTap(names); }
    drag = null;
  };
  R.canvas.addEventListener('pointerdown', onDown); R.canvas.addEventListener('pointermove', onMove);
  R.canvas.addEventListener('pointerup', onUp); R.canvas.addEventListener('pointercancel', () => (drag = null));
  let raf = 0, t = 0, last = 0;
  const placeCam = () => {
    const c = R.cam, dist = c.h / 2 / Math.tan(THREE.MathUtils.degToRad(R.camera.fov / 2)) * 1.08;
    R.camera.position.set(0, c.y + c.h * 0.04, dist); R.camera.lookAt(0, c.y, 0);
  };
  const loop = (now) => {
    if (!view.alive) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; t += dt;
    const c = R.cam, k = 1 - Math.exp(-dt * 4); c.y += (c.ty - c.y) * k; c.h += (c.th - c.h) * k; placeCam();
    if (R.glowing) {
      const s = 0.5 + 0.5 * Math.sin(t * 5);
      if (R.overlay) R.overlay.forEach((o) => (o.material.opacity = 0.35 + 0.5 * s));
      const p = R.parts[R.glowing]; if (p && p.layer !== 'skin') p.meshes.forEach((m) => (m.material.emissiveIntensity = 0.25 + 0.75 * s));
    }
    if (view.label) {
      const v = view.label.c.clone().applyAxisAngle(V(0, 1, 0), R.body.rotation.y).project(R.camera);
      lab.style.left = `${(v.x + 1) / 2 * 100}%`; lab.style.top = `${Math.max(12, (1 - v.y) / 2 * 100)}%`;
    }
    R.renderer.render(R.scene, R.camera);
    raf = requestAnimationFrame(loop);
  };
  placeCam();
  raf = requestAnimationFrame(loop);
  addEventListener('resize', size);

  view.highlight = (name) => { glow(name); const f = frameFor(name, view.layer); R.cam.ty = f[0]; R.cam.th = f[1]; };
  view.layerTo = (layer) => setLayer(view, layer);
  // show what is inside: switch to an inner layer, glow the part and float a label on it
  view.reveal = ({ layer, part, text }) => {
    setLayer(view, layer); glow(part);
    const p = R.parts[part];
    const f = frameFor(part, layer); R.cam.ty = f[0]; R.cam.th = f[1];
    if (p && p.center) { view.label = { c: p.center }; lab.textContent = text; lab.hidden = false; }
  };
  view.dispose = () => {
    view.alive = false; cancelAnimationFrame(raf); removeEventListener('resize', size);
    clearGlow();
    if (!R.canvas) return;
    R.canvas.removeEventListener('pointerdown', onDown); R.canvas.removeEventListener('pointermove', onMove); R.canvas.removeEventListener('pointerup', onUp);
    if (R.canvas.parentNode) R.canvas.parentNode.removeChild(R.canvas);
  };
  view.pickAt = pickAt;
  for (const [fn, arg] of view.pending) view[fn](arg);
  view.pending = [];
  window.__b3dParts = R.parts;   // used by automated tests
  window.__b3dView = view; window.__b3dCam = R.camera;
}
export const partNames = () => (R ? Object.keys(R.parts) : []);
