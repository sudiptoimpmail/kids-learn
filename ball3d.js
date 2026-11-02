/* =========================================================
   Rolling Ball 3D — a sky-track runner (like mobile "rolling" games)
   The ball rolls forward by itself. Drag left/right to steer, tap to jump.
   Avoid gaps and blocks, collect gems, reach the finish arch.
   Uses the shared helpers from app.js / games.js (GL, gameLevelUp, endPanel…).
   ========================================================= */
import * as THREE from './vendor/three.module.min.js';

const LANES = 5;                      // lanes at x = -2 … 2
const CHECK = 15;                     // checkpoint every 15 rows
// level tuning (index 0 = level 1)
const T = {
  speed: [4.6, 5.2, 5.8, 6.3, 6.8, 7.3, 7.8, 8.4],
  rows: [70, 85, 100, 115, 130, 145, 160, 180],
  hole: [0, 0.18, 0.3, 0.42, 0.5, 0.6, 0.68, 0.76],     // chance a side tile is missing
  block: [0.03, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18],
  drift: [0.06, 0.1, 0.14, 0.18, 0.22, 0.26, 0.3, 0.34],  // how often the safe path moves sideways
  jumps: [0, 0, 1, 2, 3, 4, 5, 6],                        // full-width gaps you must jump
  gapLen: [1, 1, 1, 1, 1, 2, 2, 2],
  movers: [0, 0, 0, 0, 0, 2, 4, 6],                       // sliding blocks
};

function buildTrack(lv) {
  const i = lv - 1, rows = T.rows[i];
  const floor = [], block = [], gem = [], safe = [];
  const jumpRows = new Set();
  for (let k = 0; k < T.jumps[i]; k++) {
    const r = 20 + Math.floor(((k + 0.5) / T.jumps[i]) * (rows - 35));
    for (let g = 0; g < T.gapLen[i]; g++) jumpRows.add(r + g);
  }
  const nearJump = (r) => [...jumpRows].some((j) => (r >= j - 4 && r < j) || (r > j && r <= j + 3 && !jumpRows.has(r)));
  // 1) the safe path: one lane per row, moving at most one lane at a time, never at a jump
  let lane = 2;
  for (let r = 0; r < rows; r++) {
    const easy = r < 8 || r > rows - 6;
    if (!easy && !nearJump(r) && !jumpRows.has(r) && r % 2 === 0 && Math.random() < T.drift[i])
      lane = Math.max(0, Math.min(LANES - 1, lane + (Math.random() < 0.5 ? -1 : 1)));
    safe.push(lane);
  }
  // 2) tiles: safe lane always there; when the path shifts, both lanes stay for 3 rows on each side
  for (let r = 0; r < rows; r++) {
    const easy = r < 8 || r > rows - 6, near = nearJump(r);
    const keep = new Set([safe[r]]);
    for (let d = -3; d <= 3; d++) { const q = r + d; if (q > 0 && q < rows && safe[q] !== safe[q - 1]) { keep.add(safe[q]); keep.add(safe[q - 1]); } }
    const f = [], b = [];
    for (let x = 0; x < LANES; x++) {
      let on = easy || near || keep.has(x) || Math.random() > T.hole[i];
      if (jumpRows.has(r)) on = false;
      f.push(on);
      b.push(on && !easy && !near && !keep.has(x) && Math.random() < T.block[i]);
    }
    floor.push(f); block.push(b);
    gem.push(!easy && !jumpRows.has(r) && r % 3 === 0 && Math.random() < 0.6 ? safe[r] : -1);
  }
  // 3) sliding blocks sit on full rows away from jumps
  const movers = [];
  for (let k = 0; k < T.movers[i]; k++) {
    const r = 25 + Math.floor(Math.random() * (rows - 40));
    if ([r - 1, r, r + 1].some((q) => jumpRows.has(q) || nearJump(q))) continue;
    for (let x = 0; x < LANES; x++) { floor[r][x] = true; block[r][x] = false; }
    movers.push({ r, phase: Math.random() * 6, speed: 1.2 + Math.random() * 0.8 });
  }
  return { rows, floor, block, gem, safe, movers, jumpRows };
}

export function start() {
  const lv = GL('ball');
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Steer to the finish! 🏁<small>Drag left & right · tap to jump${lv >= 3 ? ' over gaps' : ''}</small></div>
    <div class="b3-wrap"><canvas class="game-cv b3-cv"></canvas>
      <div class="b3-hud"><div class="b3-bar"><i></i></div><span class="b3-gems">💎 0</span></div>
      <div class="b3-msg" hidden></div></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="tilt">📱 Tilt to steer</button><button class="big-btn alt small" data-a="maze">🟫 Ball Maze</button></div>`;
  say(lv >= 3 ? ['Steer the ball!', 'Tap to jump over gaps!'] : 'Steer the ball!');

  const cv = $('.b3-cv', area);
  const wrap = $('.b3-wrap', area);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bfe3ff');
  scene.fog = new THREE.Fog('#bfe3ff', 14, 34);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
  scene.add(new THREE.HemisphereLight('#ffffff', '#88a', 1.1));
  const sun = new THREE.DirectionalLight('#ffffff', 1.3); sun.position.set(3, 8, -4); scene.add(sun);

  function size() {
    const w = wrap.clientWidth, top = wrap.getBoundingClientRect().top;
    const h = Math.max(360, Math.min(innerHeight - top - 90, w * 1.7));
    renderer.setSize(w, h, true);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    return { w, h };
  }
  let { w } = size();

  const track = buildTrack(lv);
  const tileColors = ['#ff8fab', '#ffd166', '#8ce99a', '#74c0fc', '#b197fc'];
  // floor tiles (instanced for speed)
  let nTiles = 0; track.floor.forEach((r) => r.forEach((v) => v && nTiles++));
  const tileGeo = new THREE.BoxGeometry(0.94, 0.3, 0.94);
  const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshLambertMaterial(), nTiles);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  let k = 0;
  track.floor.forEach((row, r) => row.forEach((on, x) => {
    if (!on) return;
    m4.makeTranslation(x - 2, -0.15, r);
    tiles.setMatrixAt(k, m4);
    col.set(r % CHECK === 0 && r > 0 ? '#ffffff' : tileColors[(x + Math.floor(r / 4)) % tileColors.length]);
    tiles.setColorAt(k++, col);
  }));
  scene.add(tiles);
  // blocks
  const blockGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const blockMat = new THREE.MeshLambertMaterial({ color: '#ff6b6b' });
  const blocks = [];
  track.block.forEach((row, r) => row.forEach((on, x) => {
    if (!on) return;
    const b = new THREE.Mesh(blockGeo, blockMat); b.position.set(x - 2, 0.4, r); scene.add(b); blocks.push({ mesh: b, x: x - 2, r });
  }));
  const moverMat = new THREE.MeshLambertMaterial({ color: '#845ef7' });
  const movers = track.movers.map((m) => { const b = new THREE.Mesh(blockGeo, moverMat); b.position.set(0, 0.4, m.r); scene.add(b); return { ...m, mesh: b, x: 0 }; });
  // gems
  const gemGeo = new THREE.OctahedronGeometry(0.22);
  const gemMat = new THREE.MeshLambertMaterial({ color: '#fcc419', emissive: '#7a5a00' });
  const gems = [];
  track.gem.forEach((x, r) => { if (x < 0) return; const g = new THREE.Mesh(gemGeo, gemMat); g.position.set(x - 2, 0.55, r); scene.add(g); gems.push({ mesh: g, x: x - 2, r, got: false }); });
  // jump arrows before each gap
  const arrowMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  [...track.jumpRows].filter((r) => !track.jumpRows.has(r - 1)).forEach((r) => {
    for (let x = 0; x < LANES; x++) {
      const a = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 3), arrowMat);
      a.rotation.x = Math.PI / 2; a.position.set(x - 2, 0.02, r - 2); scene.add(a);
    }
  });
  // finish arch
  const archMat = new THREE.MeshLambertMaterial({ color: '#40c057' });
  const archZ = track.rows - 2;
  [[-2.7, 1.1, 0.25, 2.2], [2.7, 1.1, 0.25, 2.2], [0, 2.3, 5.65, 0.3]].forEach(([x, y, ww, hh]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, 0.3), archMat); m.position.set(x, y, archZ); scene.add(m);
  });
  for (let x = 0; x < 10; x++) {   // checkered finish line
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.02, 0.47), new THREE.MeshBasicMaterial({ color: x % 2 ? '#222' : '#fff' }));
    m.position.set(-2.25 + x * 0.5, 0.01, archZ); scene.add(m);
  }
  // clouds for depth
  const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  for (let c = 0; c < track.rows / 6; c++) {
    const g = new THREE.Group();
    for (let p = 0; p < 3; p++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.5, 10, 8), cloudMat); s.position.set(p * 0.8, Math.random() * 0.3, 0); g.add(s); }
    g.position.set((Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 5), -2 - Math.random() * 3, c * 6 + Math.random() * 4);
    scene.add(g);
  }
  // the ball
  const ballTex = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#339af0'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(16 + i * 32, 32, 9, 0, 7); x.fill(); }
    return new THREE.CanvasTexture(c);
  })();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 28, 20), new THREE.MeshLambertMaterial({ map: ballTex }));
  scene.add(ball);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.33, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.22 }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

  // state
  const S = { x: track.safe[0] - 2, tx: track.safe[0] - 2, y: 0.35, vy: 0, z: 0, falling: false, dead: 0, gems: 0, tries: 0, done: false, check: 0 };
  const speed0 = T.speed[lv - 1];
  const floorAt = (x, z) => {
    const r = Math.round(z), lane = Math.round(x + 2);
    if (r < 0) return true;
    if (r >= track.rows) return true;
    if (lane < 0 || lane >= LANES || Math.abs(x) > 2.45) return false;
    return track.floor[r][lane];
  };

  // input: drag to steer, quick tap to jump
  let drag = null, tilt = null;
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = { x0: e.clientX, t0: S.tx, time: performance.now(), moved: 0 }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0; drag.moved = Math.max(drag.moved, Math.abs(dx));
    S.tx = Math.max(-2.2, Math.min(2.2, drag.t0 + dx / (w / 5.5)));
  });
  const up = () => {
    if (drag && drag.moved < 12 && performance.now() - drag.time < 300) jump();
    drag = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => (drag = null));
  function jump() { if (!S.falling && S.y <= 0.36 && !S.done) { S.vy = 5.6; tone([440, 660], { dur: 0.05, gap: 0.05, vol: 0.08 }); } }
  const onTilt = (e) => { tilt = Math.max(-25, Math.min(25, e.gamma || 0)) / 25; };
  area.querySelector('[data-a="tilt"]').onclick = async (ev) => {
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return;
      }
      addEventListener('deviceorientation', onTilt); ev.target.textContent = '📱 Tilting on!'; ev.target.disabled = true;
    } catch { }
  };
  area.querySelector('[data-a="maze"]').onclick = () => { cleanup(); startBallMaze(); };

  const msg = $('.b3-msg', area);
  function flash(t) { msg.textContent = t; msg.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (msg.hidden = true), 900); }
  function respawn() {
    S.tries++;
    const r = Math.max(0, Math.floor(S.z / CHECK) * CHECK);
    S.z = r; S.x = S.tx = track.safe[r] - 2; S.y = 0.35; S.vy = 0; S.falling = false; S.dead = 1.2;   // 1.2 s safe time
    flash('Try again! 💪');
  }

  let raf = 0, last = 0, alive = true, t = 0;
  function frame(now) {
    if (!alive) return;
    const dt = last ? Math.min(0.04, (now - last) / 1000) : 0; last = now; t += dt;
    if (!S.done) {
      const v = speed0 * (1 + Math.min(0.25, S.z / track.rows * 0.25));    // speeds up a bit along the track
      if (tilt != null && !drag) S.tx = Math.max(-2.2, Math.min(2.2, S.tx + tilt * 5 * dt));
      S.x += (S.tx - S.x) * Math.min(1, dt * 12);
      if (!S.falling) S.z += v * dt;
      // vertical
      S.vy -= 15 * dt; S.y += S.vy * dt;
      const ground = floorAt(S.x, S.z);
      if (!S.falling && S.y <= 0.35) {
        if (ground) { S.y = 0.35; S.vy = 0; }
        else if (S.y < 0.2) { S.falling = true; sfx.no(); }
      }
      if (S.falling && S.y < -4) respawn();
      if (S.dead > 0) S.dead -= dt;
      // blocks
      if (S.dead <= 0 && !S.falling) {
        const hitBlock = (bx, bz) => Math.abs(bx - S.x) < 0.62 && Math.abs(bz - S.z) < 0.6 && S.y < 0.95;
        if (blocks.some((b) => hitBlock(b.x, b.r)) || movers.some((m) => hitBlock(m.x, m.r))) { tone([160, 120], { dur: 0.08, gap: 0.08, vol: 0.12 }); respawn(); }
      }
      for (const g of gems) if (!g.got && Math.abs(g.x - S.x) < 0.5 && Math.abs(g.r - S.z) < 0.5 && S.y < 1.2) {
        g.got = true; g.mesh.visible = false; S.gems++; $('.b3-gems', area).textContent = `💎 ${S.gems}`;
        tone([988, 1319], { dur: 0.05, gap: 0.05, vol: 0.09 });
      }
      if (Math.floor(S.z / CHECK) > S.check) { S.check = Math.floor(S.z / CHECK); flash('✔ Checkpoint!'); }
      $('.b3-bar i', area).style.width = `${Math.min(100, (S.z / archZ) * 100)}%`;
      if (S.z >= archZ) finish();
    }
    // animate
    for (const m of movers) { m.x = Math.sin(t * m.speed + m.phase) * 2; m.mesh.position.x = m.x; }
    for (const g of gems) if (!g.got) { g.mesh.rotation.y += dt * 3; g.mesh.position.y = 0.55 + Math.sin(t * 3 + g.r) * 0.08; }
    ball.position.set(S.x, S.y, S.z);
    ball.rotation.x += (S.done ? 0 : speed0 * dt) / 0.35;
    ball.material.opacity = 1; ball.visible = !(S.dead > 0 && Math.floor(t * 10) % 2);
    shadow.position.set(S.x, 0.011, S.z); shadow.visible = !S.falling && floorAt(S.x, S.z);
    shadow.scale.setScalar(Math.max(0.4, 1 - (S.y - 0.35) * 0.4));
    camera.position.set(S.x * 0.6, 3.1, S.z - 5.2);
    camera.lookAt(S.x * 0.75, 0, S.z + 4.5);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function finish() {
    S.done = true;
    const lvUp = gameLevelUp('ball', 1);
    gameWin(pick(['You did it!', 'Awesome job!', 'Fantastic!']));
    setTimeout(() => {
      endPanel(`You reached the finish!<br><small>💎 ${S.gems} gems · ${S.tries === 0 ? 'no falls!' : `${S.tries} restart${S.tries > 1 ? 's' : ''}`}</small>`, '🏁', start, lvUp);
    }, 900);
  }
  const onResize = () => { ({ w } = size()); };
  addEventListener('resize', onResize);
  function cleanup() {
    alive = false; cancelAnimationFrame(raf);
    removeEventListener('resize', onResize); removeEventListener('deviceorientation', onTilt);
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
    renderer.dispose();
  }
  gameCleanup = cleanup;
  raf = requestAnimationFrame(frame);
}
