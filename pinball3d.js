/* =========================================================
   3D Pinball — 2D physics on the table, drawn in 3D with three.js
   Tap the left / right side (or the big buttons) to flip. Tap to launch.
   A random skin every game: Space, Ocean, Candy, Jungle, Dino, Ice.
   ========================================================= */
import * as THREE from './vendor/three.module.min.js';

const SKINS = [
  { name: 'Space', table: '#1b1f4a', stripe: '#262b66', wall: '#7950f2', flip: '#ffd43b', bump: ['#ff6bb5', '#4dabf7', '#69db7c', '#ffa94d'], icons: ['⭐', '🪐', '🚀', '🌙'], bg: '#0b0d26', light: '#ffe066' },
  { name: 'Ocean', table: '#0c8599', stripe: '#1098ad', wall: '#e3fafc', flip: '#ff922b', bump: ['#ffd43b', '#ff8787', '#da77f2', '#8ce99a'], icons: ['🐙', '🐠', '🐬', '🦀'], bg: '#0b4f5c', light: '#ffffff' },
  { name: 'Candy', table: '#ffd6e8', stripe: '#ffc2dc', wall: '#f06595', flip: '#7048e8', bump: ['#4dabf7', '#ffd43b', '#69db7c', '#ff922b'], icons: ['🍭', '🍩', '🧁', '🍬'], bg: '#ffe3f1', light: '#f06595' },
  { name: 'Jungle', table: '#2b8a3e', stripe: '#2f9e44', wall: '#8d5a2b', flip: '#ffd43b', bump: ['#ff922b', '#ff6b6b', '#fcc419', '#74c0fc'], icons: ['🦁', '🐒', '🦜', '🐘'], bg: '#1e5631', light: '#fff3bf' },
  { name: 'Dino', table: '#e8590c', stripe: '#f76707', wall: '#5c3d2e', flip: '#40c057', bump: ['#ffd43b', '#4dabf7', '#ff8787', '#b197fc'], icons: ['🦖', '🦕', '🌋', '🥚'], bg: '#7a2e05', light: '#fff9db' },
  { name: 'Ice', table: '#d0ebff', stripe: '#a5d8ff', wall: '#1971c2', flip: '#e64980', bump: ['#748ffc', '#63e6be', '#ffa8a8', '#ffe066'], icons: ['❄️', '⛄', '🐧', '🧊'], bg: '#e7f5ff', light: '#1971c2' },
];
const TARGET = [1500, 2500, 3500, 5000, 7000], SAVER = [10, 8, 6, 5, 4], GRAVITY = [8.5, 9, 9.5, 10, 10.6];
const R = 0.25;                               // ball radius (table units; table is 10 × 18)

export function start(skinIndex) {
  const lv = GL('pinball');
  const skin = SKINS[skinIndex != null ? skinIndex : Math.floor(Math.random() * SKINS.length)];
  const area = $('#gameArea');
  area.innerHTML = `<div class="pb-hud"><b class="pb-score">0</b><span>🎯 ${TARGET[lv - 1]}</span><span class="pb-balls">⚪⚪⚪</span><span class="pb-skin">${skin.name}</span></div>
    <div class="b3-wrap"><canvas class="game-cv pb-cv"></canvas><div class="b3-msg" hidden></div></div>
    <div class="pb-btns"><button class="pb-flip" data-f="L">◀</button><button class="pb-launch">🚀 Launch</button><button class="pb-flip" data-f="R">▶</button></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="skin">🎨 New skin</button></div>`;
  say('Tap to launch the ball!');

  const cv = $('.pb-cv', area), wrap = $('.b3-wrap', area);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(); scene.background = new THREE.Color(skin.bg);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight('#ffffff', '#666688', 1.2));
  const sun = new THREE.DirectionalLight('#ffffff', 1.1); sun.position.set(-3, 12, 4); scene.add(sun);
  function size() {
    const w = wrap.clientWidth, top = wrap.getBoundingClientRect().top;
    const h = Math.max(380, Math.min(innerHeight - top - 150, w * 1.75));
    renderer.setSize(w, h, true); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  size();
  camera.position.set(0, 15.5, 6.5); camera.lookAt(0, 0, -8.6);
  const P = (x, y, h = 0) => new THREE.Vector3(x - 5, h, -y);          // table (x, y) → 3D

  // ---- the table
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 460; const g = c.getContext('2d');
    g.fillStyle = skin.table; g.fillRect(0, 0, 256, 460);
    g.fillStyle = skin.stripe; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(128, 300, 30 + i * 22, Math.PI, 2 * Math.PI); g.lineWidth = 8; g.strokeStyle = skin.stripe; g.stroke(); }
    g.font = '90px system-ui'; g.textAlign = 'center'; g.globalAlpha = 0.25; g.fillText(skin.icons[0], 128, 250); g.globalAlpha = 1;
    return new THREE.CanvasTexture(c);
  })();
  const table = new THREE.Mesh(new THREE.PlaneGeometry(10, 18), new THREE.MeshLambertMaterial({ map: tex }));
  table.rotation.x = -Math.PI / 2; table.position.set(0, 0, -9); scene.add(table);

  // ---- walls (segments). oneway: only blocks a ball moving down (the gate at the top of the launch lane)
  const segs = [];
  const wallMat = new THREE.MeshLambertMaterial({ color: skin.wall });
  const addSeg = (x1, y1, x2, y2, opt = {}) => {
    segs.push({ x1, y1, x2, y2, ...opt });
    if (opt.hidden) return;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, opt.kick ? 0.35 : 0.5, opt.kick ? 0.18 : 0.14), opt.kick ? new THREE.MeshLambertMaterial({ color: skin.light, emissive: '#333' }) : wallMat);
    m.position.copy(P((x1 + x2) / 2, (y1 + y2) / 2, 0.22)); m.rotation.y = Math.atan2(y2 - y1, x2 - x1); scene.add(m);
    if (opt.kick) segs[segs.length - 1].mesh = m;
  };
  const arc = [];
  for (let a = 180; a >= 0; a -= 12) arc.push([5 + 5 * Math.cos(a * Math.PI / 180), 13 + 5 * Math.sin(a * Math.PI / 180)]);
  addSeg(0, 0, 0, 13); for (let k = 0; k < arc.length - 1; k++) addSeg(arc[k][0], arc[k][1], arc[k + 1][0], arc[k + 1][1]); addSeg(10, 13, 10, 0);
  addSeg(9.1, 0, 9.1, 12.6);                                        // launch lane wall
  addSeg(9.1, 12.6, 10, 13.6, { oneway: true, hidden: false });      // gate: lets the ball out, not back in
  addSeg(0, 4.6, 2.35, 2.75); addSeg(9.1, 4.6, 6.65, 2.75);          // funnels into the flippers
  addSeg(1.0, 5.6, 2.2, 3.7, { kick: 7 }); addSeg(8.1, 5.6, 6.9, 3.7, { kick: 7 });    // slingshots
  addSeg(1.0, 5.6, 1.0, 7.4); addSeg(8.1, 5.6, 8.1, 7.4);
  addSeg(0.6, 8.6, 1.6, 8.0); addSeg(8.5, 8.6, 7.5, 8.0);

  // ---- bumpers with the skin's pictures on top
  const bumpers = [[3, 11.2], [6.2, 11.2], [4.6, 13.2]].concat(lv >= 3 ? [[4.6, 9.4]] : []).map(([x, y], i) => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = skin.bump[i % 4]; g.beginPath(); g.arc(64, 64, 64, 0, 7); g.fill();
    g.font = '78px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(skin.icons[i % 4], 64, 70);
    const top = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) }), side = new THREE.MeshLambertMaterial({ color: skin.bump[i % 4] });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.55, 28), [side, top, side]);
    m.position.copy(P(x, y, 0.28)); scene.add(m);
    return { x, y, r: 0.62, mesh: m, glow: 0 };
  });
  // ---- rollover lights at the top: light all three for a bonus
  const lights = [[2.6, 15.4], [4.6, 16.1], [6.6, 15.4]].map(([x, y]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 20), new THREE.MeshBasicMaterial({ color: '#555' }));
    m.position.copy(P(x, y, 0.02)); scene.add(m); return { x, y, on: false, mesh: m };
  });
  // ---- flippers
  const flipMat = new THREE.MeshLambertMaterial({ color: skin.flip });
  const mkFlip = (px, py, rest, up) => {
    const g = new THREE.Group(); g.position.copy(P(px, py, 0.2));
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.3, 0.32), flipMat); body.position.x = 0.82; g.add(body);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 16), flipMat); g.add(cap);
    scene.add(g);
    return { px, py, len: 1.65, rest, up, a: rest, w: 0, pressed: false, g };
  };
  const D = Math.PI / 180;
  const flips = { L: mkFlip(2.45, 2.65, -28 * D, 28 * D), R: mkFlip(6.55, 2.65, 208 * D, 152 * D) };
  // ---- the ball
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), new THREE.MeshStandardMaterial({ color: '#e9ecef', metalness: 0.8, roughness: 0.25 }));
  scene.add(ball);
  const plunger = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.8), new THREE.MeshLambertMaterial({ color: '#adb5bd' })); scene.add(plunger);

  // ---- game state
  const G = { x: 9.55, y: 0.6, vx: 0, vy: 0, inLane: true, score: 0, balls: 3, saver: 0, over: false, leveled: false, best: state.pinBest || 0 };
  const grav = GRAVITY[lv - 1];
  const msg = $('.b3-msg', area);
  const flash = (t) => { msg.textContent = t; msg.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (msg.hidden = true), 1000); };
  const addScore = (n) => {
    G.score += n; $('.pb-score', area).textContent = G.score;
    if (!G.leveled && G.score >= TARGET[lv - 1]) { G.leveled = true; flash('🎯 Target reached!'); sfx.win(); confetti(80, 0.4); }
  };
  const ballsTxt = () => ($('.pb-balls', area).textContent = '⚪'.repeat(Math.max(0, G.balls)));
  function launch() {
    if (!G.inLane || G.over) return;
    G.inLane = false; G.vy = 20 + Math.random() * 2.5; G.vx = 0; G.saver = SAVER[lv - 1];
    tone([220, 330, 440], { dur: 0.06, gap: 0.04, vol: 0.12, type: 'sawtooth' });
  }
  function resetBall() { G.x = 9.55; G.y = 0.6; G.vx = G.vy = 0; G.inLane = true; }

  // ---- input: left/right half of the table, the big buttons, or arrow keys
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
  area.querySelector('[data-a="skin"]').onclick = () => { cleanup(); start((SKINS.indexOf(skin) + 1 + Math.floor(Math.random() * (SKINS.length - 1))) % SKINS.length); };

  // ---- physics
  function collideSeg(s, rest = 0.45) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy;
    let t = ((G.x - s.x1) * dx + (G.y - s.y1) * dy) / L2; t = Math.max(0, Math.min(1, t));
    const cx = s.x1 + t * dx, cy = s.y1 + t * dy, ox = G.x - cx, oy = G.y - cy, d = Math.hypot(ox, oy);
    if (d >= R || d === 0) return false;
    const nx = ox / d, ny = oy / d;
    if (s.oneway && G.vy > 0) return false;
    G.x = cx + nx * (R + 0.001); G.y = cy + ny * (R + 0.001);
    const vn = G.vx * nx + G.vy * ny;
    if (vn < 0) { G.vx -= (1 + rest) * vn * nx; G.vy -= (1 + rest) * vn * ny; }
    if (s.kick) { G.vx += nx * s.kick; G.vy += ny * s.kick; addScore(20); tone([600], { dur: 0.04, vol: 0.08 }); s.glow = 0.2; }
    return true;
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
  function step(dt) {
    for (const f of Object.values(flips)) {
      const target = f.pressed ? f.up : f.rest, dir = Math.sign(target - f.a), spd = f.pressed ? 22 : 13;
      const na = Math.abs(target - f.a) < spd * dt ? target : f.a + dir * spd * dt;
      f.w = (na - f.a) / dt; f.a = na;
    }
    if (G.inLane) return;
    G.vy -= grav * dt;
    const sp = Math.hypot(G.vx, G.vy); if (sp > 26) { G.vx *= 26 / sp; G.vy *= 26 / sp; }
    G.x += G.vx * dt; G.y += G.vy * dt;
    for (const s of segs) collideSeg(s);
    for (const b of bumpers) {
      const dx = G.x - b.x, dy = G.y - b.y, d = Math.hypot(dx, dy);
      if (d < R + b.r && d > 0) {
        const nx = dx / d, ny = dy / d; G.x = b.x + nx * (R + b.r); G.y = b.y + ny * (R + b.r);
        const vn = G.vx * nx + G.vy * ny; G.vx -= 2 * vn * nx; G.vy -= 2 * vn * ny; G.vx += nx * 5; G.vy += ny * 5;
        b.glow = 0.25; addScore(100); tone([880 + Math.random() * 200, 660], { dur: 0.05, gap: 0.04, vol: 0.1, type: 'square' });
      }
    }
    collideFlipper(flips.L); collideFlipper(flips.R);
    for (const l of lights) if (!l.on && Math.hypot(G.x - l.x, G.y - l.y) < 0.45) {
      l.on = true; l.mesh.material.color.set(skin.light); addScore(50); tone([1046], { dur: 0.06, vol: 0.08 });
      if (lights.every((x) => x.on)) { addScore(500); flash('✨ Bonus +500!'); setTimeout(() => lights.forEach((x) => { x.on = false; x.mesh.material.color.set('#555'); }), 900); }
    }
    if (G.x < -1 || G.x > 11 || G.y > 20) resetBall();          // safety
    if (G.y < -0.6) drain();
  }
  function drain() {
    if (G.saver > 0) { flash('🛟 Ball saved!'); resetBall(); return; }
    G.balls--; ballsTxt(); sfx.no();
    if (G.balls <= 0) return gameOver();
    flash('Next ball!'); resetBall();
  }
  function gameOver() {
    G.over = true; G.inLane = true;
    state.pinBest = Math.max(state.pinBest || 0, G.score);
    const up = G.leveled ? gameLevelUp('pinball', 1) : (save(), false);
    gameWin(G.leveled ? 'Awesome job!' : 'Great game!');
    setTimeout(() => endPanel(`Score: ${G.score}${G.leveled ? '' : `<br><small>Score ${TARGET[lv - 1]} to reach the next level</small>`}<br><small>Best: ${state.pinBest}</small>`, '🎯', () => start(), up), 700);
  }

  let raf = 0, last = 0, alive = true;
  function frame(now) {
    if (!alive) return;
    const dt = last ? Math.min(0.033, (now - last) / 1000) : 0; last = now;
    if (G.saver > 0 && !G.inLane) G.saver -= dt;
    const n = 8; for (let k = 0; k < n; k++) step(dt / n);
    // draw
    ball.position.copy(P(G.x, G.y, R));
    plunger.position.copy(P(9.55, G.inLane ? 0.0 : -0.3, 0.15));
    for (const f of Object.values(flips)) f.g.rotation.y = f.a;
    for (const b of bumpers) { b.glow = Math.max(0, b.glow - dt); b.mesh.scale.setScalar(1 + b.glow * 0.8); }
    for (const s of segs) if (s.mesh) { s.glow = Math.max(0, (s.glow || 0) - dt); s.mesh.scale.y = 1 + s.glow * 3; }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  const onResize = () => size();
  addEventListener('resize', onResize);
  function cleanup() {
    alive = false; cancelAnimationFrame(raf);
    removeEventListener('resize', onResize); removeEventListener('keydown', key); removeEventListener('keyup', key);
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
    renderer.dispose();
  }
  gameCleanup = cleanup;
  window.__pb = { G, flips, launch };   // used by automated tests
  raf = requestAnimationFrame(frame);
}
