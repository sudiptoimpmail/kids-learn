/* =========================================================
   3D Pinball — 2D physics on the playfield, drawn as a real machine with three.js
   Three rotating tables (a random one every game), each with its own layout:
   pop bumpers, ramps the ball rides up and around, drop-target banks, spinners,
   saucers that catch and kick the ball, stand-up targets and rollover lanes.
   Every hit shows its points; a dot-matrix display keeps the score.
   Tap the left / right side (or the big buttons) to flip. Tap to launch.
   ========================================================= */
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const TARGET = [3000, 5000, 8000, 12000, 18000], SAVER = [12, 9, 7, 5, 4], GRAVITY = [8.2, 8.8, 9.4, 10, 10.6];
const R = 0.25;                               // ball radius (table units; the playfield is 10 × 18)

// ramps share these paths: [x, y, height] in table units
const RAMP_LEFT = { mouth: [1.55, 9.3], path: [[1.55, 9.9, 0], [1.7, 12.4, 0.8], [2.25, 14.8, 1.3], [1.7, 16.1, 1.5], [0.8, 15.2, 1.45], [0.55, 11.6, 1.05], [0.55, 9.0, 0.5], [0.55, 7.4, 0.05]], exit: [0.55, 7.3, 0, -3] };
const RAMP_RIGHT = { mouth: [7.45, 9.1], path: [[7.45, 9.7, 0], [7.5, 12.2, 0.8], [7.25, 14.8, 1.3], [8.0, 16.0, 1.5], [8.65, 14.6, 1.45], [8.6, 11.2, 1.05], [8.6, 8.6, 0.45], [8.6, 7.4, 0.05]], exit: [8.6, 7.3, 0, -3] };
const RAMP_CENTER = { mouth: [5.15, 10.2], path: [[5.15, 10.8, 0], [5.25, 13.3, 0.9], [6.1, 15.6, 1.45], [7.6, 15.7, 1.55], [8.55, 13.8, 1.45], [8.6, 11.0, 1.05], [8.6, 8.6, 0.45], [8.6, 7.4, 0.05]], exit: [8.6, 7.3, 0, -3] };

const TABLES = [
  { name: 'Space Station', icon: '🚀', art: ['🪐', '⭐', '🌙'], base: ['#141a52', '#2a1c6b'], ink: '#7cc4ff', glow: '#ffe066', wall: '#9775fa', rubber: '#f8f9fa', flip: '#ffd43b', bump: ['#ff6bb5', '#4dabf7', '#69db7c'], bumpIcons: ['🚀', '🪐', '👽'],
    bumpers: [[3.3, 13.6], [5.9, 13.6], [4.6, 11.8]], ramps: [RAMP_LEFT], drops: [[7.75, 7.9, 8.05, 10.2, 3]], spinners: [[7.85, 12.6, 9.05, 12.6]],
    rollovers: [[3.4, 16.2], [4.6, 16.7], [5.8, 16.2]], standups: [], saucers: [] },
  { name: 'Pirate Cove', icon: '🏴‍☠️', art: ['🏴‍☠️', '⚓', '🦜'], base: ['#0b5d6e', '#06394a'], ink: '#ffe8a3', glow: '#ffd43b', wall: '#8d5a2b', rubber: '#f1f3f5', flip: '#ff922b', bump: ['#ffd43b', '#ff8787', '#63e6be'], bumpIcons: ['💰', '🦜', '🐙'],
    bumpers: [[2.3, 13.5], [3.4, 11.6], [7.1, 13.9]], ramps: [RAMP_CENTER], drops: [[2.5, 8.6, 4.4, 8.6, 3]], spinners: [[0.1, 12.2, 1.35, 12.2]],
    rollovers: [[2.7, 15.9], [3.9, 16.6], [5.1, 16.8]], standups: [], saucers: [[7.25, 10.6, -5, -4]] },
  { name: 'Candy Carnival', icon: '🍭', art: ['🍭', '🍩', '🧁'], base: ['#ff9fca', '#ffd6e8'], ink: '#ffffff', glow: '#fff3bf', wall: '#e64980', rubber: '#ffffff', flip: '#7048e8', bump: ['#4dabf7', '#ffd43b', '#69db7c', '#ff922b'], bumpIcons: ['🍬', '🍩', '🧁', '🍪'],
    bumpers: [[4.4, 14.6], [3.1, 13.0], [5.7, 13.0], [4.4, 11.4]], ramps: [RAMP_RIGHT], drops: [], spinners: [[3.85, 8.6, 4.95, 8.6]],
    rollovers: [[3.0, 16.4], [5.8, 16.4]], standups: [[1.15, 10.4, 0], [2.3, 15.6, -0.6], [6.4, 15.9, 0.6]], saucers: [[1.6, 13.5, 4, -4]] },
  { name: 'Jungle Temple', icon: '🐒', art: ['🐒', '🦁', '🌴'], base: ['#2b8a3e', '#1b4d2a'], ink: '#d8f5a2', glow: '#fff3bf', wall: '#8d5a2b', rubber: '#f8f9fa', flip: '#ffd43b', bump: ['#ff922b', '#ff6b6b', '#fcc419'], bumpIcons: ['🦁', '🐒', '🦜'],
    bumpers: [[6.2, 14.6], [7.5, 12.8], [5.6, 12.3]], ramps: [RAMP_LEFT], drops: [[2.9, 11.3, 3.75, 13.4, 3]], spinners: [[7.9, 10.9, 9.05, 10.9]],
    rollovers: [[5.2, 16.7], [6.4, 16.3], [7.5, 15.6]], standups: [], saucers: [[4.2, 15.3, 0.6, -7]] },
  { name: 'Dino Volcano', icon: '🦖', art: ['🦖', '🌋', '🦕'], base: ['#c2410c', '#5c1f06'], ink: '#ffe066', glow: '#ff922b', wall: '#5c3d2e', rubber: '#f8f9fa', flip: '#40c057', bump: ['#ffd43b', '#4dabf7', '#ff8787'], bumpIcons: ['🦖', '🦕', '🥚'],
    bumpers: [[2.6, 14.3], [4.6, 15.4], [6.6, 14.3]], ramps: [RAMP_RIGHT], drops: [[1.9, 9.4, 3.8, 9.4, 3]], spinners: [[0.1, 12.2, 1.35, 12.2]],
    rollovers: [], standups: [[5.9, 10.2, 0.3]], saucers: [[4.6, 12.2, 0, -7]] },
  { name: 'Ice Castle', icon: '🐧', art: ['❄️', '🐧', '⛄'], base: ['#a5d8ff', '#e7f5ff'], ink: '#1864ab', glow: '#ffffff', wall: '#1971c2', rubber: '#ffffff', flip: '#e64980', bump: ['#748ffc', '#63e6be', '#ffa8a8'], bumpIcons: ['❄️', '⛄', '🐧'],
    bumpers: [[3.8, 11.2], [2.6, 13.0], [5.0, 13.0]], ramps: [RAMP_CENTER], drops: [[1.2, 8.7, 1.4, 10.6, 3]], spinners: [[0.1, 12.8, 1.35, 12.8]],
    rollovers: [[3.0, 16.3], [4.4, 16.8]], standups: [[2.0, 15.4, -0.5], [6.4, 15.9, 0.6]], saucers: [] },
];

const PLAY_TABLES = [TABLES[0], TABLES[2], TABLES[4]];
export function start(tableIndex) {
  const lv = GL('pinball');
  const T = PLAY_TABLES[tableIndex != null ? tableIndex % PLAY_TABLES.length : Math.floor(Math.random() * PLAY_TABLES.length)];
  const area = $('#gameArea');
  area.innerHTML = `<div class="pb-dmd"><div class="pb-dmd-top"><b class="pb-score">0</b><span class="pb-dmd-msg">${T.icon} ${T.name}</span><span class="pb-balls">● ● ●</span><span class="pb-mult">×1</span></div><div class="pb-dmd-bot"><span>TARGET ${TARGET[lv - 1].toLocaleString()}</span></div></div>
    <div class="b3-wrap pb-wrap"><canvas class="game-cv pb-cv"></canvas><div class="b3-msg" hidden></div><button class="pb-launch pb-plunger" type="button" aria-label="Launch ball from the right lane">⬆<small>Launch</small></button></div>
    <div class="pb-btns"><button class="pb-flip" data-f="L" type="button" aria-label="Left flipper">◀ <span>LEFT</span></button><button class="pb-flip" data-f="R" type="button" aria-label="Right flipper"><span>RIGHT</span> ▶</button></div>`;
  say('Tap to launch the ball!');

  const cv = $('.pb-cv', area), wrap = $('.b3-wrap', area);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0d0b14');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight('#ffffff', '#3b3350', 0.7));
  const sun = new THREE.DirectionalLight('#fff4e0', 1.3); sun.position.set(-2, 14, 3); scene.add(sun);
  const P = (x, y, h = 0) => new THREE.Vector3(x - 5, h, -y);          // table (x, y) → 3D
  function size() {
    const w = wrap.clientWidth, top = wrap.getBoundingClientRect().top;
    const h = Math.max(270, Math.min(Math.max(270, innerHeight - top - 105 - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')) || 0)), w * 1.8));
    renderer.setSize(w, h, true); camera.aspect = w / h;
    // keep the whole table in view whatever the screen shape
    camera.fov = THREE.MathUtils.clamp(46 * Math.pow(0.62 / camera.aspect, 0.55), 40, 64);
    camera.updateProjectionMatrix();
  }
  size();
  camera.position.set(0, 16.2, 4.2); camera.lookAt(0, 0, -8.2);

  /* ---------------- the cabinet and playfield ---------------- */
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const field = canvasTex(512, 922, (g, w, h) => {
    const s = w / 10, Y = (y) => h - y * s;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, T.base[1]); gr.addColorStop(1, T.base[0]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // starburst behind the bumpers
    g.save(); g.translate(4.6 * s, Y(13)); g.globalAlpha = 0.12; g.fillStyle = T.ink;
    for (let i = 0; i < 18; i++) { g.rotate(Math.PI / 9); g.beginPath(); g.moveTo(0, 0); g.lineTo(-30, -600); g.lineTo(30, -600); g.fill(); }
    g.restore();
    g.globalAlpha = 0.16; g.font = `${s * 3.2}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(T.art[0], 4.6 * s, Y(6.6)); g.font = `${s * 1.6}px system-ui`; g.fillText(T.art[1], 2.2 * s, Y(10.5)); g.fillText(T.art[2], 7.0 * s, Y(10.5));
    g.globalAlpha = 1;
    // painted lanes and arrows pointing at the shots
    g.strokeStyle = T.ink; g.lineWidth = 3; g.globalAlpha = 0.45;
    g.beginPath(); g.arc(5 * s, Y(13), 4.55 * s, Math.PI, 2 * Math.PI); g.stroke();
    g.globalAlpha = 1;
    const arrow = (x, y, ang, col) => { g.save(); g.translate(x * s, Y(y)); g.rotate(-ang); g.fillStyle = col; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(0, -22); g.lineTo(14, 8); g.lineTo(0, 0); g.lineTo(-14, 8); g.closePath(); g.fill(); g.restore(); };
    for (const r of T.ramps) arrow(r.mouth[0], r.mouth[1] - 1.1, 0, T.glow);
    for (const sp of T.spinners) arrow((sp[0] + sp[2]) / 2, sp[1] - 1.0, 0, '#ffffff');
    // the name at the bottom, like the apron art
    g.fillStyle = T.ink; g.globalAlpha = 0.9; g.font = `900 ${s * 0.52}px system-ui`; g.fillText(T.name.toUpperCase(), 4.6 * s, Y(1.1));
    g.globalAlpha = 1;
  });
  const play = new THREE.Mesh(new THREE.PlaneGeometry(10, 18), new THREE.MeshPhysicalMaterial({ map: field, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }));
  play.rotation.x = -Math.PI / 2; play.position.set(0, 0, -9); scene.add(play);
  const wood = canvasTex(64, 512, (g, w, h) => {
    g.fillStyle = '#6b3d1e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(${40 + Math.random() * 40},${20 + Math.random() * 20},10,.5)`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const x = Math.random() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 6, h / 3, x - 6, h * 2 / 3, x + Math.random() * 6, h); g.stroke(); }
  });
  const woodMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.45 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#e9ecef', metalness: 1, roughness: 0.18 });
  for (const sx of [-5.35, 5.35]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 19.2), woodMat); rail.position.set(sx, 0.35, -9); scene.add(rail);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 19.2), chrome); trim.position.set(sx, 0.92, -9); scene.add(trim); }
  const head = new THREE.Mesh(new THREE.BoxGeometry(11.4, 1.6, 0.7), woodMat); head.position.set(0, 0.6, -18.35); scene.add(head);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 1.6), new THREE.MeshStandardMaterial({ color: '#1a1a22', metalness: 0.4, roughness: 0.5 }));
  apron.position.set(-0.45, 0.25, 0.4); scene.add(apron);
  const lockbar = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.3, 0.5), chrome); lockbar.position.set(0, 0.85, 1.35); scene.add(lockbar);

  /* ---------------- physics objects ---------------- */
  const segs = [];
  const guideMat = new THREE.MeshStandardMaterial({ color: '#d7dbe0', metalness: 0.95, roughness: 0.22 });
  const wallMat = new THREE.MeshStandardMaterial({ color: T.wall, roughness: 0.5, metalness: 0.1 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: T.rubber, roughness: 0.8 });
  const addSeg = (x1, y1, x2, y2, opt = {}) => {
    const s = { x1, y1, x2, y2, ...opt }; segs.push(s);
    if (opt.hidden) return s;
    const len = Math.hypot(x2 - x1, y2 - y1);
    let m;
    if (opt.kick) {           // slingshot: a stretched rubber band in front of a lit plastic
      m = new THREE.Group();
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 10), rubberMat); band.rotation.z = Math.PI / 2; band.position.y = 0.22; m.add(band);
      const lit = new THREE.Mesh(new THREE.BoxGeometry(len * 0.9, 0.34, 0.05), new THREE.MeshStandardMaterial({ color: T.glow, emissive: T.glow, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 }));
      lit.position.set(0, 0.2, -0.12); m.add(lit); s.lit = lit;
    } else if (opt.metal) {   // shiny wire guide
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 8), guideMat); m.rotation.z = Math.PI / 2;
      const g = new THREE.Group(); m.position.y = 0.3; g.add(m); m = g;
    } else {
      m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.55, 0.16), wallMat); m.position.y = 0.27;
      const g = new THREE.Group(); g.add(m); m = g;
    }
    m.position.add(P((x1 + x2) / 2, (y1 + y2) / 2, 0)); m.rotation.y = Math.atan2(y2 - y1, x2 - x1); scene.add(m);
    s.mesh = m; return s;
  };
  const posts = [];
  const post = (x, y, solid) => {   // metal post with a rubber ring
    if (solid) posts.push({ x, y, r: 0.15 });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 10), chrome); m.position.copy(P(x, y, 0.3)); scene.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.05, 8, 16), rubberMat); ring.rotation.x = Math.PI / 2; ring.position.copy(P(x, y, 0.25)); scene.add(ring);
  };
  // outer walls: left, the round top, right; the plunger lane and its one-way gate
  const arc = [];
  for (let a = 180; a >= 0; a -= 10) arc.push([5 + 5 * Math.cos(a * Math.PI / 180), 13 + 5 * Math.sin(a * Math.PI / 180)]);
  addSeg(0, 0, 0, 13, { hidden: true }); for (let k = 0; k < arc.length - 1; k++) addSeg(arc[k][0], arc[k][1], arc[k + 1][0], arc[k + 1][1], { hidden: true }); addSeg(10, 13, 10, 0, { hidden: true });
  { // the curved back wall and the side walls: polished metal
    const top = new THREE.Mesh(new THREE.CylinderGeometry(5.06, 5.06, 0.6, 64, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: '#d7dbe0', metalness: 0.95, roughness: 0.22, side: THREE.DoubleSide }));
    top.position.set(0, 0.3, -13); scene.add(top);
    for (const sx of [-5.06, 5.06]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 13), guideMat); w.position.set(sx, 0.3, -6.5); scene.add(w); }
  }
  addSeg(9.1, 0, 9.1, 12.6);
  addSeg(9.1, 12.6, 10, 13.6, { oneway: true, metal: true });
  addSeg(0, 4.6, 2.3, 2.98); addSeg(9.1, 4.6, 6.7, 2.98);
  // slingshots: closed triangles; only the side facing the middle kicks
  for (const s of [addSeg(1.25, 5.9, 2.3, 4.15, { kick: 7 }), addSeg(7.85, 5.9, 6.8, 4.15, { kick: 7 })]) {
    s.pts = 20; const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2; s.front = Math.sign((s.x2 - s.x1) * (5.5 - my) - (s.y2 - s.y1) * (4.55 - mx));
  }
  addSeg(1.25, 5.9, 1.25, 4.7); addSeg(1.25, 4.7, 2.3, 4.15); addSeg(7.85, 5.9, 7.85, 4.7); addSeg(7.85, 4.7, 6.8, 4.15);
  addSeg(1.25, 5.9, 1.25, 7.4, { metal: true }); addSeg(7.85, 5.9, 7.85, 7.4, { metal: true });
  addSeg(0.6, 8.6, 1.6, 8.0, { metal: true }); addSeg(8.5, 8.6, 7.5, 8.0, { metal: true });
  [[1.25, 5.9], [2.3, 4.15], [1.25, 7.4], [1.25, 4.7], [7.85, 5.9], [6.8, 4.15], [7.85, 7.4], [7.85, 4.7], [1.6, 8.0], [7.5, 8.0]].forEach(([x, y]) => post(x, y));

  // ---- pop bumpers: skirt, colored body, see-through cap with a picture, a light that flashes
  const bumpers = T.bumpers.map(([x, y], i) => {
    const col = T.bump[i % T.bump.length], g = new THREE.Group(); g.position.copy(P(x, y, 0));
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 0.12, 28), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.2 })); skirt.position.y = 0.06; g.add(skirt);
    const bodyM = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, emissive: col, emissiveIntensity: 0.1 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.45, 28), bodyM); body.position.y = 0.32; g.add(body);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 32), chrome); ring.rotation.x = Math.PI / 2; ring.position.y = 0.18; g.add(ring);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 28), [new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 0.6, roughness: 0.1, transparent: true, opacity: 0.85 }),
      new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(64, 64, 64, 0, 7); c.fill(); c.font = '84px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(T.bumpIcons[i % T.bumpIcons.length], 64, 70); }), roughness: 0.25 }), new THREE.MeshStandardMaterial({ color: '#fff' })]);
    cap.position.y = 0.62; g.add(cap);
    const light = new THREE.PointLight(col, 0, 3.5); light.position.y = 1.0; g.add(light);
    scene.add(g);
    return { x, y, r: 0.62, g, bodyM, light, glow: 0 };
  });
  // ---- drop-target banks: they drop when hit; knock down the whole bank for a bonus
  const banks = T.drops.map(([x1, y1, x2, y2, n]) => {
    const list = [];
    for (let k = 0; k < n; k++) {
      const a = k / n, b = (k + 1) / n, gap = 0.08;
      const sx1 = x1 + (x2 - x1) * (a + gap / 2), sy1 = y1 + (y2 - y1) * (a + gap / 2), sx2 = x1 + (x2 - x1) * (b - gap / 2), sy2 = y1 + (y2 - y1) * (b - gap / 2);
      const s = { x1: sx1, y1: sy1, x2: sx2, y2: sy2, drop: true, up: true };
      segs.push(s);
      const len = Math.hypot(sx2 - sx1, sy2 - sy1);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.55, 0.12), [new THREE.MeshStandardMaterial({ color: T.glow }), new THREE.MeshStandardMaterial({ color: T.glow }), new THREE.MeshStandardMaterial({ color: '#fff' }), new THREE.MeshStandardMaterial({ color: '#fff' }),
        new THREE.MeshStandardMaterial({ map: canvasTex(64, 64, (c) => { c.fillStyle = T.glow; c.fillRect(0, 0, 64, 64); c.fillStyle = '#222'; c.font = '900 40px system-ui'; c.textAlign = 'center'; c.fillText(String(k + 1), 32, 48); }) }), new THREE.MeshStandardMaterial({ color: T.glow })]);
      m.position.copy(P((sx1 + sx2) / 2, (sy1 + sy2) / 2, 0.27)); m.rotation.y = Math.atan2(sy2 - sy1, sx2 - sx1); scene.add(m);
      s.mesh = m; list.push(s);
    }
    return { list, reset: 0 };
  });
  // ---- stand-up targets (always there, light up when hit)
  const standups = T.standups.map(([x, y, ang]) => {
    const w = 0.7, dx = Math.cos(ang) * w / 2, dy = Math.sin(ang) * w / 2;
    const s = { x1: x - dy, y1: y + dx, x2: x + dy, y2: y - dx, stand: true };
    // the target faces down the table: a short segment across the ball's path
    s.x1 = x - Math.cos(ang) * w / 2; s.y1 = y - Math.sin(ang) * w / 2; s.x2 = x + Math.cos(ang) * w / 2; s.y2 = y + Math.sin(ang) * w / 2;
    if (Math.abs(ang) < 0.01 && x < 2) { s.x1 = x; s.x2 = x; s.y1 = y - 0.35; s.y2 = y + 0.35; }     // on the left wall: faces right
    segs.push(s);
    const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    const mat = new THREE.MeshStandardMaterial({ color: '#ff6b6b', emissive: '#ff6b6b', emissiveIntensity: 0.1 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, 0.1), mat); m.position.copy(P((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2, 0.3)); m.rotation.y = Math.atan2(s.y2 - s.y1, s.x2 - s.x1); scene.add(m);
    s.mesh = m; s.mat = mat; return s;
  });
  // ---- spinners: a flat plate on a wire bracket that spins when the ball goes through
  const spinners = T.spinners.map(([x1, y1, x2, y2]) => {
    const g = new THREE.Group(); g.position.copy(P((x1 + x2) / 2, y1, 0));
    const w = Math.abs(x2 - x1);
    const bracket = new THREE.Mesh(new THREE.TorusGeometry(w / 2, 0.035, 6, 24, Math.PI), chrome); bracket.position.y = 0.05; g.add(bracket);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.55, 0.04), new THREE.MeshStandardMaterial({ map: canvasTex(128, 64, (c) => { c.fillStyle = '#f8f9fa'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#e03131'; c.font = '900 30px system-ui'; c.textAlign = 'center'; c.fillText('SPIN', 64, 43); }), metalness: 0.3, roughness: 0.3 }));
    const pivot = new THREE.Group(); pivot.position.y = w / 2 - 0.05; plate.position.y = -0.3; pivot.add(plate); g.add(pivot);
    scene.add(g);
    return { x1: Math.min(x1, x2), x2: Math.max(x1, x2), y: y1, pivot, spin: 0 };
  });
  // ---- saucers: a hole that catches the ball, then kicks it out
  const saucers = T.saucers.map(([x, y, ex, ey]) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 10, 28), chrome); rim.rotation.x = Math.PI / 2; rim.position.copy(P(x, y, 0.03)); scene.add(rim);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.4, 28), new THREE.MeshBasicMaterial({ color: '#050505' })); hole.rotation.x = -Math.PI / 2; hole.position.copy(P(x, y, 0.012)); scene.add(hole);
    const glowM = new THREE.MeshBasicMaterial({ color: T.glow, transparent: true, opacity: 0.25 });
    const ringL = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.65, 28), glowM); ringL.rotation.x = -Math.PI / 2; ringL.position.copy(P(x, y, 0.014)); scene.add(ringL);
    return { x, y, ex, ey, glowM, cool: 0 };
  });
  // ---- rollover lanes (lights in the playfield)
  const lights = T.rollovers.map(([x, y]) => {
    const mat = new THREE.MeshStandardMaterial({ color: '#444', emissive: T.glow, emissiveIntensity: 0, roughness: 0.2 });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 24), mat); m.position.copy(P(x, y, 0.016)); scene.add(m);
    post(x - 0.55, y, true); post(x + 0.55, y, true);
    return { x, y, on: false, mat };
  });
  // ---- ramps: shiny wire rails on a see-through plastic ribbon
  const ramps = T.ramps.map((rp) => {
    const [mx, my] = rp.mouth;
    addSeg(mx - 0.48, my - 0.15, mx - 0.48, my + 0.55); addSeg(mx + 0.48, my - 0.15, mx + 0.48, my + 0.55);
    const gate = { x1: mx - 0.48, y1: my + 0.55, x2: mx + 0.48, y2: my + 0.55, ramp: null }; segs.push(gate);
    const curve = new THREE.CatmullRomCurve3(rp.path.map(([x, y, h]) => P(x, y, h + 0.25)));
    const N = 90, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = curve.getPointAt(t), tg = curve.getTangentAt(t), side = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(0.42);
      pos.push(p.x - side.x, p.y - 0.25, p.z - side.z, p.x + side.x, p.y - 0.25, p.z + side.z);
    }
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
    scene.add(new THREE.Mesh(rg, new THREE.MeshPhysicalMaterial({ color: T.glow, transparent: true, opacity: 0.38, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false })));
    for (const sd of [-1, 1]) {
      const pts = []; for (let i = 0; i <= N; i++) { const t = i / N, p = curve.getPointAt(t), tg = curve.getTangentAt(t); pts.push(p.clone().add(new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(0.46 * sd)).add(new THREE.Vector3(0, -0.02, 0))); }
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.04, 6, false), chrome));
    }
    // posts holding the ramp up
    for (const t of [0.3, 0.55, 0.8]) { const p = curve.getPointAt(t); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, p.y, 6), chrome); m.position.set(p.x, p.y / 2, p.z); scene.add(m); }
    const r = { gate, curve, len: curve.getLength(), exit: rp.exit, mouth: rp.mouth };
    gate.ramp = r; return r;
  });

  // ---- flippers: white bats with a red rubber
  const mkFlip = (px, py, rest, up) => {
    const g = new THREE.Group(); g.position.copy(P(px, py, 0.05));
    const shape = new THREE.Shape(); shape.absarc(0, 0, 0.22, Math.PI / 2, Math.PI * 1.5, false); shape.lineTo(1.65, -0.09); shape.absarc(1.65, 0, 0.09, -Math.PI / 2, Math.PI / 2, false); shape.lineTo(0, 0.22);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); geo.rotateX(Math.PI / 2); geo.translate(0, 0.33, 0);
    const bat = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })); g.add(bat);
    const rub = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.21, 0), new THREE.MeshStandardMaterial({ color: T.flip, roughness: 0.8 }));
    rub.scale.set(1.04, 1, 1.12); g.add(rub);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 10), chrome); pin.position.y = 0.2; g.add(pin);
    scene.add(g);
    return { px, py, len: 1.65, rest, up, a: rest, w: 0, pressed: false, g };
  };
  const D = Math.PI / 180;
  const flips = { L: mkFlip(2.45, 2.65, -28 * D, 28 * D), R: mkFlip(6.55, 2.65, 208 * D, 152 * D) };
  // ---- the ball and the plunger
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 20), new THREE.MeshStandardMaterial({ color: '#f1f3f5', metalness: 1, roughness: 0.08 }));
  scene.add(ball);
  const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.0, 16), chrome); plunger.rotation.x = Math.PI / 2; scene.add(plunger);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshStandardMaterial({ color: '#e03131', roughness: 0.3 })); scene.add(knob);

  /* ---------------- points you can see ---------------- */
  const pops = [];
  function popup(x, y, text, color = '#ffffff') {
    const tex = canvasTex(256, 96, (g) => { g.font = '900 64px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = '#000000aa'; g.strokeText(text, 128, 50); g.fillStyle = color; g.fillText(text, 128, 50); });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(1.9, 0.72, 1); sp.position.copy(P(x, y, 1.1)); sp.renderOrder = 10; scene.add(sp);
    pops.push({ sp, t: 0 });
  }

  /* ---------------- game state ---------------- */
  const G = { x: 9.55, y: 0.6, vx: 0, vy: 0, h: 0, inLane: true, score: 0, balls: 3, saver: 0, over: false, leveled: false, best: state.pinBest || 0,
    mult: 1, ride: null, held: null, still: 0, lastRamp: -99, t: 0, hits: {} };
  const grav = GRAVITY[lv - 1];
  const msg = $('.b3-msg', area), dmdMsg = $('.pb-dmd-msg', area);
  const flash = (t) => { msg.textContent = t; msg.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (msg.hidden = true), 1100); };
  const dmd = (t) => { dmdMsg.textContent = t; dmdMsg.classList.remove('blink'); void dmdMsg.offsetWidth; dmdMsg.classList.add('blink'); };
  const addScore = (n, x, y, label) => {
    const pts = n * G.mult;
    G.score += pts; $('.pb-score', area).textContent = G.score.toLocaleString();
    if (x != null) popup(x, y, `+${pts}`, pts >= 500 ? T.glow : '#ffffff');
    if (label) dmd(`${label}  +${pts}`);
    if (!G.leveled && G.score >= TARGET[lv - 1]) { G.leveled = true; flash('🎯 Target reached!'); sfx.win(); confetti(80, 0.4); }
  };
  const hit = (k) => (G.hits[k] = (G.hits[k] || 0) + 1);
  const ballsTxt = () => ($('.pb-balls', area).textContent = '● '.repeat(Math.max(0, G.balls)).trim());
  function launch() {
    if (!G.inLane || G.over) return;
    $('.pb-launch', area).hidden = true;
    G.inLane = false; G.vy = 15.5 + Math.random() * 5; G.vx = 0; G.saver = SAVER[lv - 1];
    tone([220, 330, 440], { dur: 0.06, gap: 0.04, vol: 0.12, type: 'sawtooth' });
  }
  function resetBall() { $('.pb-launch', area).hidden = false; G.x = 9.55; G.y = 0.6; G.vx = G.vy = 0; G.h = 0; G.inLane = true; G.ride = null; G.held = null; G.still = 0; }

  /* ---------------- input ---------------- */
  const press = (side, on) => { const f = flips[side]; if (on && !f.pressed) tone([side === 'L' ? 300 : 340], { dur: 0.03, vol: 0.06 }); f.pressed = on; };
  const pointers = new Map();
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (G.inLane) { launch(); return; }
    const r = cv.getBoundingClientRect(), side = e.clientX - r.left < r.width / 2 ? 'L' : 'R';
    pointers.set(e.pointerId, side); press(side, true);
  });
  const release = (e) => { const side = pointers.get(e.pointerId); if (side) { pointers.delete(e.pointerId); if (![...pointers.values()].includes(side)) press(side, false); } };
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
  $$('.pb-flip', area).forEach((b) => {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(b.dataset.f, true); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => press(b.dataset.f, false)));
  });
  $('.pb-launch', area).onclick = launch;
  const key = (e) => { const on = e.type === 'keydown'; if (e.key === 'ArrowLeft' || e.key === 'z') press('L', on); if (e.key === 'ArrowRight' || e.key === '/') press('R', on); if (on && (e.key === ' ' || e.key === 'ArrowDown')) launch(); };
  addEventListener('keydown', key); addEventListener('keyup', key);

  /* ---------------- physics ---------------- */
  function collideSeg(s, rest = 0.45) {
    if (s.drop && !s.up) return false;
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy;
    let t = ((G.x - s.x1) * dx + (G.y - s.y1) * dy) / L2; t = Math.max(0, Math.min(1, t));
    const cx = s.x1 + t * dx, cy = s.y1 + t * dy, ox = G.x - cx, oy = G.y - cy, d = Math.hypot(ox, oy);
    if (d >= R || d === 0) return false;
    const nx = ox / d, ny = oy / d;
    if (s.oneway && G.vy > 0) return false;
    const vn = G.vx * nx + G.vy * ny;
    if (s.ramp && vn < -5.5 && G.vy > 0) { startRide(s.ramp); return true; }      // fast enough: up the ramp!
    G.x = cx + nx * (R + 0.001); G.y = cy + ny * (R + 0.001);
    if (vn < 0) { G.vx -= (1 + rest) * vn * nx; G.vy -= (1 + rest) * vn * ny; }
    if (vn < -1.2) {
      if (s.kick && Math.sign((s.x2 - s.x1) * (G.y - s.y1) - (s.y2 - s.y1) * (G.x - s.x1)) === s.front) { G.vx += nx * s.kick; G.vy += ny * s.kick; addScore(s.pts, G.x, G.y); hit('sling'); tone([600], { dur: 0.04, vol: 0.08 }); s.glow = 0.2; }
      if (s.drop) dropHit(s);
      if (s.stand) { s.glow = 0.5; addScore(150, G.x, G.y); hit('standup'); tone([740, 990], { dur: 0.05, gap: 0.03, vol: 0.09 }); }
    }
    return true;
  }
  function dropHit(s) {
    s.up = false; addScore(250, G.x, G.y); hit('drop'); tone([520, 390], { dur: 0.05, gap: 0.03, vol: 0.1, type: 'square' });
    const bank = banks.find((b) => b.list.includes(s));
    if (bank && bank.list.every((x) => !x.up)) { addScore(1000, (s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2 + 1, 'TARGETS DOWN'); flash('🎯 Bank bonus!'); bank.reset = 1.6; hit('bank'); }
  }
  function collideFlipper(f) {
    const tx = f.px + f.len * Math.cos(f.a), ty = f.py + f.len * Math.sin(f.a);
    const dx = tx - f.px, dy = ty - f.py, L2 = dx * dx + dy * dy;
    let t = ((G.x - f.px) * dx + (G.y - f.py) * dy) / L2; t = Math.max(0, Math.min(1, t));
    const cx = f.px + t * dx, cy = f.py + t * dy, ox = G.x - cx, oy = G.y - cy, d = Math.hypot(ox, oy);
    const thick = 0.17 * (1 - t * 0.4);
    if (d >= R + thick || d === 0) return;
    const nx = ox / d, ny = oy / d;
    G.x = cx + nx * (R + thick + 0.001); G.y = cy + ny * (R + thick + 0.001);
    const rx = cx - f.px, ry = cy - f.py, fvx = -f.w * ry, fvy = f.w * rx;      // speed of the flipper surface
    const rvx = G.vx - fvx, rvy = G.vy - fvy, vn = rvx * nx + rvy * ny;
    if (vn < 0) { G.vx = rvx - 1.3 * vn * nx + fvx; G.vy = rvy - 1.3 * vn * ny + fvy; }
  }
  function startRide(r) {
    G.ride = { r, t: 0 };
    tone([392, 523, 659, 784], { dur: 0.07, gap: 0.05, vol: 0.1 });
  }
  function endRide() {
    const r = G.ride.r; G.ride = null;
    [G.x, G.y, G.vx, G.vy] = r.exit; G.h = 0;
    const combo = G.t - G.lastRamp < 6; G.lastRamp = G.t; hit('ramp');
    addScore(combo ? 1500 : 750, r.mouth[0], r.mouth[1] + 1.2, combo ? 'RAMP COMBO' : 'RAMP');
    flash(combo ? '🔥 Ramp combo!' : '🎢 Ramp!');
  }
  function step(dt) {
    for (const f of Object.values(flips)) {
      const target = f.pressed ? f.up : f.rest, dir = Math.sign(target - f.a), spd = f.pressed ? 22 : 13;
      const na = Math.abs(target - f.a) < spd * dt ? target : f.a + dir * spd * dt;
      f.w = (na - f.a) / dt; f.a = na;
    }
    if (G.inLane) return;
    if (G.ride) { G.ride.t += dt * 13 / G.ride.r.len; if (G.ride.t >= 1) endRide(); return; }
    if (G.held) {
      G.held.t -= dt; G.x = G.held.s.x; G.y = G.held.s.y; G.vx = G.vy = 0;
      if (G.held.t <= 0) { const s = G.held.s; G.held = null; s.cool = 1; G.vx = s.ex + (Math.random() - 0.5) * 1.5; G.vy = s.ey; G.x += Math.sign(s.ex || 0.01) * 0.5; G.y += s.ey < 0 ? -0.5 : 0.5; tone([200, 150], { dur: 0.08, gap: 0.02, vol: 0.12, type: 'square' }); }
      return;
    }
    const py = G.y;
    G.vy -= grav * dt;
    const sp = Math.hypot(G.vx, G.vy); if (sp > 26) { G.vx *= 26 / sp; G.vy *= 26 / sp; }
    G.x += G.vx * dt; G.y += G.vy * dt;
    for (const s of segs) { if (collideSeg(s) && G.ride) return; }
    for (const b of bumpers) {
      const dx = G.x - b.x, dy = G.y - b.y, d = Math.hypot(dx, dy);
      if (d < R + b.r && d > 0) {
        const nx = dx / d, ny = dy / d; G.x = b.x + nx * (R + b.r); G.y = b.y + ny * (R + b.r);
        const vn = G.vx * nx + G.vy * ny; G.vx -= 2 * vn * nx; G.vy -= 2 * vn * ny; G.vx += nx * 5; G.vy += ny * 5;
        b.glow = 0.25; addScore(100, b.x, b.y + 0.5); hit('bumper'); tone([880 + Math.random() * 200, 660], { dur: 0.05, gap: 0.04, vol: 0.1, type: 'square' });
      }
    }
    for (const q of posts) {
      const dx = G.x - q.x, dy = G.y - q.y, d = Math.hypot(dx, dy);
      if (d < R + q.r && d > 0) { const nx = dx / d, ny = dy / d; G.x = q.x + nx * (R + q.r); G.y = q.y + ny * (R + q.r); const vn = G.vx * nx + G.vy * ny; if (vn < 0) { G.vx -= 1.6 * vn * nx; G.vy -= 1.6 * vn * ny; } }
    }
    collideFlipper(flips.L); collideFlipper(flips.R);
    for (const s of spinners) if (G.x > s.x1 && G.x < s.x2 && (py - s.y) * (G.y - s.y) <= 0 && py !== G.y) {
      const turns = Math.max(2, Math.round(Math.abs(G.vy) * 1.6)); s.spin = Math.max(s.spin, turns * 2.2); hit('spinner');
      addScore(10 * turns, (s.x1 + s.x2) / 2, s.y + 0.6, 'SPINNER'); tone(Array.from({ length: Math.min(turns, 8) }, (_, i) => 900 + i * 40), { dur: 0.025, gap: 0.03, vol: 0.06 });
    }
    for (const s of saucers) {
      if (s.cool > 0) continue;
      if (Math.hypot(G.x - s.x, G.y - s.y) < 0.36 && Math.hypot(G.vx, G.vy) < 15) {
        G.held = { s, t: 1.1 }; hit('saucer'); addScore(500, s.x, s.y + 0.6, 'SAUCER'); flash('💫 Caught!'); tone([300, 450, 600], { dur: 0.08, gap: 0.05, vol: 0.1 });
      }
    }
    for (const l of lights) if (!l.on && Math.hypot(G.x - l.x, G.y - l.y) < 0.45) {
      l.on = true; addScore(50, l.x, l.y + 0.5); hit('rollover'); tone([1046], { dur: 0.06, vol: 0.08 });
      if (lights.every((x) => x.on)) {
        G.mult = Math.min(5, G.mult + 1); $('.pb-mult', area).textContent = `×${G.mult}`;
        addScore(500, 4.6, 15, `LANES  ×${G.mult}`); flash(`✨ Bonus ×${G.mult}!`);
        setTimeout(() => lights.forEach((x) => (x.on = false)), 900);
      }
    }
    if (G.x < -1 || G.x > 11 || G.y > 20) resetBall();          // safety
    if (G.y < -0.6) drain();
  }
  function drain() {
    if (G.saver > 0) { flash('🛟 Ball saved!'); resetBall(); return; }
    G.balls--; ballsTxt(); sfx.no(); G.mult = 1; $('.pb-mult', area).textContent = '×1';
    if (G.balls <= 0) return gameOver();
    flash('Next ball!'); dmd('NEXT BALL'); resetBall();
  }
  function gameOver() {
    G.over = true; G.inLane = true; $('.pb-launch', area).hidden = true;
    state.pinBest = Math.max(state.pinBest || 0, G.score);
    const up = G.leveled ? gameLevelUp('pinball', 1) : (save(), false);
    gameWin(G.leveled ? 'Awesome job!' : 'Great game!');
    later(() => endPanel(`Score: ${G.score.toLocaleString()}${G.leveled ? '' : `<br><small>Score ${TARGET[lv - 1].toLocaleString()} to reach the next level</small>`}<br><small>Best: ${state.pinBest.toLocaleString()}</small>`, '🎯', () => start(), up), 700);
  }

  /* ---------------- the loop ---------------- */
  let raf = 0, last = 0, alive = true;
  function update(dt) {
    G.t += dt;
    if (G.saver > 0 && !G.inLane && !G.ride && !G.held) G.saver -= dt;
    const n = 8; for (let k = 0; k < n; k++) step(dt / n);
    // a ball that stops moving gets a gentle nudge (no stuck balls for little players)
    if (!G.inLane && !G.ride && !G.held && Math.hypot(G.vx, G.vy) < 0.4) { G.still += dt; if (G.still > 2.5) { G.vx += (Math.random() - 0.5) * 6; G.vy += 4; G.still = 0; hit('nudge'); flash('👋 Nudge!'); } } else G.still = 0;
    for (const b of banks) if (b.reset > 0) { b.reset -= dt; if (b.reset <= 0) b.list.forEach((s) => (s.up = true)); }
    for (const s of saucers) s.cool = Math.max(0, s.cool - dt);
  }
  function draw(dt) {
    if (G.ride) { const p = G.ride.r.curve.getPointAt(Math.min(1, G.ride.t)); ball.position.copy(p); }
    else ball.position.copy(P(G.x, G.y, R + 0.01));
    ball.rotation.x -= G.vy * dt * 2; ball.rotation.z -= G.vx * dt * 2;
    plunger.position.copy(P(9.55, G.inLane ? -0.55 : -0.85, 0.25)); knob.position.copy(P(9.55, G.inLane ? -1.1 : -1.4, 0.25));
    for (const f of Object.values(flips)) f.g.rotation.y = f.a;
    for (const b of bumpers) { b.glow = Math.max(0, b.glow - dt); b.g.scale.set(1 + b.glow * 0.5, 1 - b.glow * 0.6, 1 + b.glow * 0.5); b.light.intensity = b.glow * 60; b.bodyM.emissiveIntensity = 0.1 + b.glow * 4; }
    for (const s of segs) {
      if (s.lit) { s.glow = Math.max(0, (s.glow || 0) - dt); s.lit.material.emissiveIntensity = 0.25 + s.glow * 6; }
      if (s.drop) { const ty = s.up ? 0.27 : -0.3; s.mesh.position.y += (ty - s.mesh.position.y) * Math.min(1, dt * 14); }
      if (s.stand) { s.glow = Math.max(0, (s.glow || 0) - dt); s.mat.emissiveIntensity = 0.1 + s.glow * 3; }
    }
    for (const s of spinners) { s.pivot.rotation.x += s.spin * dt * 6; s.spin = Math.max(0, s.spin - dt * 2.5); }
    const blink = 0.5 + 0.5 * Math.sin(G.t * 6);
    for (const s of saucers) s.glowM.opacity = G.held && G.held.s === s ? 0.4 + 0.6 * blink : 0.2 + 0.1 * blink;
    for (const l of lights) l.mat.emissiveIntensity = l.on ? 2.2 : 0.15 * blink;
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += dt; p.sp.position.y += dt * 1.4; p.sp.material.opacity = Math.max(0, 1 - p.t / 0.9);
      if (p.t > 0.9) { scene.remove(p.sp); p.sp.material.map.dispose(); p.sp.material.dispose(); pops.splice(i, 1); }
    }
    renderer.render(scene, camera);
  }
  function frame(now) {
    if (!alive) return;
    const dt = last ? Math.min(0.033, (now - last) / 1000) : 0; last = now;
    update(dt); draw(dt);
    raf = requestAnimationFrame(frame);
  }
  const onResize = () => size();
  addEventListener('resize', onResize);
  function cleanup() {
    alive = false; cancelAnimationFrame(raf);
    removeEventListener('resize', onResize); removeEventListener('keydown', key); removeEventListener('keyup', key);
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
    if (scene.environment) scene.environment.dispose(); pmrem.dispose();
    renderer.dispose();
  }
  gameCleanup = cleanup;
  // used by automated tests: run the game fast with a simple robot flipper
  window.__pb = { G, flips, launch, table: T.name, sim(seconds, robot = true) {
    for (let t = 0; t < seconds; t += 1 / 60) {
      if (robot) { for (const [k, f] of Object.entries(flips)) { const near = !G.inLane && G.y < 3.9 && G.y > 2.2 && G.vy < -0.5 && (k === 'L' ? G.x < 4.9 && G.x > 1.8 : G.x > 4.1 && G.x < 7.2); f.pressed = near || (f.pressed && f.hold > 0); f.hold = near ? 0.15 : (f.hold || 0) - 1 / 60; } if (G.inLane && !G.over) launch(); }
      update(1 / 60);
      if (G.over) break;
    }
    return { score: G.score, balls: G.balls, hits: { ...G.hits }, over: G.over };
  } };
  raf = requestAnimationFrame(frame);
}
export const TABLE_NAMES = TABLES.map((t) => t.name);
