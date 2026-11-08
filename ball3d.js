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
  hole: [0, 0.1, 0.17, 0.24, 0.3, 0.36, 0.42, 0.48],     // chance a side tile is missing
  block: [0.03, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18],
  drift: [0.06, 0.1, 0.14, 0.18, 0.22, 0.26, 0.3, 0.34],  // how often the safe path moves sideways
  jumps: [0, 0, 1, 2, 3, 4, 5, 6],                        // full-width gaps you must jump
  gapLen: [1, 1, 1, 1, 1, 1, 2, 2],
  movers: [0, 0, 0, 0, 0, 2, 4, 6],                       // sliding blocks
  bridges: [0, 1, 1, 1, 2, 2, 2, 3],                      // ramp + broken bridge to fly over
  falls: [0, 0, 0, 1, 1, 1, 2, 2],                        // ramp + waterfall canyon to fly over
  planks: [0, 0, 0, 0, 1, 1, 2, 2],                       // narrow one-lane plank bridges
  gates: [1, 2, 3, 4, 5, 6, 7, 8],                        // tall candy walls with one opening: you must steer left or right
  bend: [0.9, 1.2, 1.5, 1.8, 2.0, 2.2, 2.4, 2.6],         // how far the winding track swings sideways
};
const LAUNCH = 8.6, GRAV = 15;
const RAMP_LEN = 3.6, RAMP_H = 0.7;                       // a long run-up that climbs to the launch lip                           // ramp launch speed and gravity

function buildTrack(lv) {
  const i = lv - 1, rows = T.rows[i];
  const floor = [], block = [], gem = [], safe = [];
  const jumpRows = new Set();
  for (let k = 0; k < T.jumps[i]; k++) {
    const r = 20 + Math.floor(((k + 0.5) / T.jumps[i]) * (rows - 35));
    for (let g = 0; g < T.gapLen[i]; g++) jumpRows.add(r + g);
  }
  const nearJump = (r) => [...jumpRows].some((j) => (r >= j - 4 && r < j) || (r > j && r <= j + 3 && !jumpRows.has(r)));
  // gate walls: tall candy blocks across the track with a single opening, so the ball has to be steered left or right
  const gates = [];
  for (let k = 0, prev = 2; k < T.gates[i]; k++) {
    const r = 16 + Math.floor(((k + 0.5) / T.gates[i]) * (rows - 32)) + Math.floor(Math.random() * 3) - 1;
    if ([r - 4, r - 2, r, r + 2, r + 4].some((q) => jumpRows.has(q) || nearJump(q))) continue;
    if ([...jumpRows].some((j) => r >= j - 6 && r <= j + 12)) continue;      // never right where a jump lands: no time to steer
    const open = prev <= 2 ? [3, 4][Math.floor(Math.random() * 2)] : [0, 1][Math.floor(Math.random() * 2)];
    gates.push({ r, open }); prev = open;
  }
  const gateRows = new Set(gates.map((g) => g.r));
  // 1) the safe path: one lane per row. It glides from one gate opening to the next (a lane every couple of rows),
  //    and otherwise drifts a little, never at a jump
  const holds = [{ r: 0, lane: 2 }, ...gates.map((g) => ({ r: g.r, lane: g.open })), { r: rows - 1, lane: 2 }];
  let lane = 2;
  for (let r = 0; r < rows; r++) {
    const easy = r < 8 || r > rows - 6;
    const nx = holds.findIndex((h) => h.r >= r), a = holds[Math.max(0, nx - 1)], b = holds[nx];
    if (gates.length) lane = a.r === b.r ? b.lane : Math.round(a.lane + (b.lane - a.lane) * Math.min(1, Math.max(0, (r - a.r - 2) / Math.max(1, b.r - a.r - 5))));
    else if (!easy && !nearJump(r) && !jumpRows.has(r) && r % 2 === 0 && Math.random() < T.drift[i])
      lane = Math.max(0, Math.min(LANES - 1, lane + (Math.random() < 0.5 ? -1 : 1)));
    safe.push(Math.max(0, Math.min(LANES - 1, lane)));
  }
  // 2) tiles: safe lane always there; when the path shifts, both lanes stay for 3 rows on each side
  for (let r = 0; r < rows; r++) {
    const easy = r < 8 || r > rows - 6, near = nearJump(r);
    const keep = new Set([safe[r]]);
    for (let d = -3; d <= 3; d++) { const q = r + d; if (q > 0 && q < rows && safe[q] !== safe[q - 1]) { keep.add(safe[q]); keep.add(safe[q - 1]); } }
    const f = [], b = [];
    for (let x = 0; x < LANES; x++) {
      let on = easy || near || keep.has(x) || Math.random() > T.hole[i] * (0.25 + 0.75 * Math.min(1, r / (rows * 0.65)));
      if (jumpRows.has(r)) on = false;
      f.push(on);
      b.push(on && !easy && !near && !keep.has(x) && Math.random() < T.block[i]);
    }
    floor.push(f); block.push(b);
    gem.push(!easy && !jumpRows.has(r) && (r % 2 === 0 || r % 3 === 0) && Math.random() < 0.9 ? safe[r] : -1);
  }
  // 3) sliding blocks sit on full rows away from jumps
  const movers = [];
  for (let k = 0; k < T.movers[i]; k++) {
    const r = 25 + Math.floor(Math.random() * (rows - 40));
    if ([r - 1, r, r + 1].some((q) => jumpRows.has(q) || nearJump(q) || [...gateRows].some((g) => Math.abs(g - q) < 3))) continue;
    for (let x = 0; x < LANES; x++) { floor[r][x] = true; block[r][x] = false; }
    movers.push({ r, phase: Math.random() * 6, speed: 1.2 + Math.random() * 0.8 });
  }
  // 4) ramps that launch the ball over a broken bridge or a waterfall canyon, and narrow planks
  const ramps = new Set(), features = [], plankRows = new Set(), airGems = [];
  const speed = T.speed[i], flight = speed * (2 * LAUNCH / GRAV);   // rows travelled in the air
  const busy = (a, b) => { for (let r = a; r <= b; r++) if (r < 10 || r > rows - 8 || jumpRows.has(r) || [...gateRows].some((g) => Math.abs(g - r) < 4) || ramps.has(r) || plankRows.has(r) || movers.some((m) => m.r === r)) return true; return features.some((f) => !(b < f.from - 2 || a > f.to + 2)); };
  const place = (kind, gap) => {
    for (let tries = 0; tries < 40; tries++) {
      const r = 14 + Math.floor(Math.random() * (rows - 32)), from = r - 3, to = r + 1 + gap + 4;
      if (busy(from, to)) continue;
      for (let q = from; q <= to; q++) { for (let x = 0; x < LANES; x++) { floor[q][x] = true; block[q][x] = false; } gem[q] = -1; }
      for (let q = r + 1; q <= r + gap; q++) for (let x = 0; x < LANES; x++) floor[q][x] = false;
      ramps.add(r);
      features.push({ kind, ramp: r, gs: r + 1, ge: r + gap, from, to });
      // a trail of gems along the flying arc
      for (let k = 1; k < 10; k++) { const t = k / 10 * (2 * LAUNCH / GRAV), z = r + speed * t; airGems.push([safe[r] - 2, 0.35 + LAUNCH * t - GRAV * t * t / 2 + 0.2, z]); }
      for (let q = from; q <= to; q++) safe[q] = safe[r];
      return true;
    }
    return false;
  };
  const gapFor = (kind) => Math.max(2, Math.min(kind === 'falls' ? 4 : 3, Math.floor(flight - 3.2)));
  for (let k = 0; k < T.falls[i]; k++) place('falls', gapFor('falls'));
  for (let k = 0; k < T.bridges[i]; k++) place('bridge', gapFor('bridge'));
  for (let k = 0; k < T.planks[i]; k++) {
    for (let tries = 0; tries < 40; tries++) {
      const len = 6 + Math.floor(Math.random() * 5), r = 12 + Math.floor(Math.random() * (rows - 30));
      if (busy(r - 2, r + len + 2)) continue;
      let steady = true; for (let q = r - 5; q <= r + len + 5; q++) if (q >= 0 && q < rows && safe[q] !== safe[r]) steady = false;
      if (!steady) continue;   // planks only where the safe path runs straight
      const lane = safe[r];
      for (let q = r; q < r + len; q++) { safe[q] = lane; gem[q] = q % 2 ? lane : -1; for (let x = 0; x < LANES; x++) { floor[q][x] = x === lane; block[q][x] = false; } plankRows.add(q); }
      for (const q of [r - 2, r - 1, r + len, r + len + 1]) { floor[q][lane] = true; block[q][lane] = false; }
      features.push({ kind: 'plank', from: r, to: r + len - 1, lane });
      break;
    }
  }
  // treasure crates on the safe path: roll into one to smash it open
  const crates = [];
  for (let r0 = 11; r0 < rows - 9; r0 += 10 + Math.floor(Math.random() * 5)) {
    let at = -1;
    for (let d = 0; d < 7 && at < 0; d++) { const q = r0 + d; if (q < rows - 9 && !busy(q - 1, q + 1) && !nearJump(q) && floor[q][safe[q]] && !block[q][safe[q]]) at = q; }
    if (at >= 0) { crates.push({ r: at, lane: safe[at] }); gem[at] = -1; if (gem[at + 1] >= 0) gem[at + 1] = -1; }
  }
  // the whole track winds from side to side; straight stretches hold it still around bridges and planks
  const raw = (z) => Math.sin(z * 0.075) * T.bend[i] + Math.sin(z * 0.031 + 1.3) * T.bend[i] * 0.7;
  const ease = (z) => Math.min(1, Math.max(0, Math.min(z - 6, rows - 8 - z) / 12));
  const off = Array.from({ length: rows + 12 }, (_, r) => raw(r) * ease(r));
  for (const f of features.filter((x) => x.kind === 'plank')) {
    const a = f.from - 2, b = f.to + 2, v = off[Math.max(0, a)];
    for (let q = Math.max(0, a - 8); q <= Math.min(rows + 11, b + 8); q++) {
      const w = q < a ? 1 - (a - q) / 8 : q > b ? 1 - (q - b) / 8 : 1, e = w * w * (3 - 2 * w);
      off[q] = off[q] + (v - off[q]) * e;
    }
  }
  // every ramp swings the track one way as you climb it and back the other way after the jump (left, then right, then left…)
  features.filter((x) => x.kind !== 'plank').forEach((f, fi) => {
    const sgn = fi % 2 ? 1 : -1, A = 2.1 * sgn, c = f.ramp + 5;
    for (let q = Math.max(0, f.ramp - 18); q <= Math.min(rows + 11, f.ramp + 28); q++) off[q] += A * Math.exp(-((q - c) ** 2) / 72);
  });
  const offAt = (z) => { const z0 = Math.max(0, Math.min(rows + 10, Math.floor(z))), f = z - z0; return off[z0] + (off[Math.min(rows + 11, z0 + 1)] - off[z0]) * f; };
  // gate walls stand on full tiles
  for (const g of gates) for (let x = 0; x < LANES; x++) { floor[g.r][x] = true; block[g.r][x] = false; gem[g.r] = -1; }
  return { rows, floor, block, gem, safe, movers, jumpRows, ramps, features, plankRows, airGems, gates, off, offAt, crates };
}

export function start() {
  const lv = GL('ball');
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Steer to the finish! 🏁<small>Drag left & right · tap to jump · tap twice for a double jump · flick up for a super jump · drag forward to speed up</small></div>
    <div class="b3-wrap"><canvas class="game-cv b3-cv"></canvas>
      <div class="b3-hud"><div class="b3-bar"><i></i></div><span class="b3-gems">⭐ 0  🍬 0</span></div>
      <div class="b3-msg" hidden></div></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="tilt">📱 Tilt to steer</button><button class="big-btn alt small" data-a="maze">🟫 Ball Maze</button></div>`;
  say(lv >= 3 ? ['Steer the ball!', 'Tap to jump over gaps!'] : 'Steer the ball!');

  const cv = $('.b3-cv', area);
  const wrap = $('.b3-wrap', area);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const skyTex = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#5fb6ff'); g.addColorStop(0.55, '#bfe6ff'); g.addColorStop(1, '#fff1d6'); x.fillStyle = g; x.fillRect(0, 0, 8, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  scene.background = skyTex;
  scene.fog = new THREE.Fog('#d6efff', 16, 40);
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
  // lane-space (x = -2…2 across the path, z = row) → world, because the whole track winds
  const slope = (z) => (track.offAt(z + 0.5) - track.offAt(z - 0.5));
  const W3 = (lx, z) => { const a = Math.atan(slope(z)), o = track.offAt(z); return [o + lx * Math.cos(a), z - lx * Math.sin(a), a]; };
  const put = (mesh, lx, y, z) => { const [wx, wz, a] = W3(lx, z); mesh.position.set(wx, y, wz); mesh.rotation.y = a; return mesh; };
  const water = [];   // flowing-water textures to animate
  const tileColors = ['#ff8fab', '#ffd166', '#8ce99a', '#74c0fc', '#b197fc'];
  // floor tiles (instanced for speed)
  const featAt = (r) => track.features.find((f) => r >= f.from && r <= f.to);
  let nTiles = 0; track.floor.forEach((r) => r.forEach((v) => v && nTiles++));
  const tileGeo = (() => { const h = 0.47, r = 0.13, sh = new THREE.Shape();
    sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.quadraticCurveTo(h, -h, h, -h + r); sh.lineTo(h, h - r); sh.quadraticCurveTo(h, h, h - r, h);
    sh.lineTo(-h + r, h); sh.quadraticCurveTo(-h, h, -h, h - r); sh.lineTo(-h, -h + r); sh.quadraticCurveTo(-h, -h, -h + r, -h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 5 });
    g.rotateX(-Math.PI / 2); g.translate(0, -0.14, 0); return g; })();
  const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }), nTiles);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  let k = 0;
  track.floor.forEach((row, r) => row.forEach((on, x) => {
    if (!on) return;
    const feat = featAt(r);
    const [wx, wz, wa] = W3(x - 2, r);
    dummy.position.set(wx, track.plankRows.has(r) ? -0.12 : -0.15, wz); dummy.rotation.set(0, wa, 0);
    if (track.plankRows.has(r)) dummy.scale.set(0.62, 0.7, 0.96); else dummy.scale.set(1, 1, 1);
    dummy.updateMatrix(); tiles.setMatrixAt(k, dummy.matrix);
    col.set(track.plankRows.has(r) || (feat && feat.kind === 'bridge') ? (r % 2 ? '#a9743f' : '#c08552')
      : feat && feat.kind === 'falls' ? (r % 2 ? '#adb5bd' : '#ced4da')
      : r % CHECK === 0 && r > 0 ? '#ffffff' : tileColors[(x + Math.floor(r / 4)) % tileColors.length]);
    tiles.setColorAt(k++, col);
  }));
  scene.add(tiles);
  // blocks
  const candyTex = (c1, c2) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = c1; x.fillRect(0, 0, 64, 64); x.fillStyle = c2;
    for (let i = -64; i < 128; i += 32) { x.beginPath(); x.moveTo(i, 64); x.lineTo(i + 16, 64); x.lineTo(i + 80, 0); x.lineTo(i + 64, 0); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  // gift boxes: glossy box, crossed ribbon, big bow
  const giftBox = new THREE.BoxGeometry(0.78, 0.7, 0.78), lidGeo = new THREE.BoxGeometry(0.84, 0.16, 0.84);
  const ribA = new THREE.BoxGeometry(0.17, 0.72, 0.8), ribB = new THREE.BoxGeometry(0.8, 0.72, 0.17), ribLid = new THREE.BoxGeometry(0.17, 0.18, 0.86), ribLid2 = new THREE.BoxGeometry(0.86, 0.18, 0.17);
  const loopGeo = new THREE.TorusGeometry(0.13, 0.04, 8, 14), knotGeo = new THREE.SphereGeometry(0.07, 10, 8);
  const giftSets = [['#ff6b6b', '#ffd43b'], ['#4dabf7', '#ffffff'], ['#69db7c', '#ff8fab'], ['#b197fc', '#ffd43b']].map(([bx, rb]) => ({
    box: new THREE.MeshStandardMaterial({ color: bx, roughness: 0.35, metalness: 0.1 }), rib: new THREE.MeshStandardMaterial({ color: rb, roughness: 0.3 }) }));
  const makeGift = (n) => {
    const m = giftSets[n % giftSets.length], g = new THREE.Group();
    const box = new THREE.Mesh(giftBox, m.box); box.position.y = 0.35;
    const lid = new THREE.Mesh(lidGeo, m.box); lid.position.y = 0.74;
    const a = new THREE.Mesh(ribA, m.rib); a.position.y = 0.36; const b = new THREE.Mesh(ribB, m.rib); b.position.y = 0.36;
    const a2 = new THREE.Mesh(ribLid, m.rib); a2.position.y = 0.76; const b2 = new THREE.Mesh(ribLid2, m.rib); b2.position.y = 0.76;
    g.add(box, lid, a, b, a2, b2);
    for (const sgn of [-1, 1]) { const lp = new THREE.Mesh(loopGeo, m.rib); lp.position.set(sgn * 0.13, 0.95, 0); lp.rotation.set(0, 0, sgn * 0.5); lp.scale.set(1, 1.25, 1); g.add(lp); }
    const kn = new THREE.Mesh(knotGeo, m.rib); kn.position.y = 0.88; g.add(kn);
    return g;
  };
  const blocks = [];
  track.block.forEach((row, r) => row.forEach((on, x) => {
    if (!on) return;
    const b = makeGift(x + r); put(b, x - 2, 0, r); scene.add(b); blocks.push({ mesh: b, x: x - 2, r });
  }));
  // gate walls: tall striped candy pillars with a round top and a single opening
  const pillarGeo = new THREE.CylinderGeometry(0.42, 0.46, 2.1, 14), capGeo = new THREE.SphereGeometry(0.5, 14, 10);
  const pillarMats = [candyTex('#ff4d8d', '#fff'), candyTex('#3bc9db', '#fff'), candyTex('#ffa94d', '#fff')].map((map) => { map.repeat.set(1, 2); return new THREE.MeshStandardMaterial({ map, roughness: 0.45 }); });
  const pillarBase = new THREE.CylinderGeometry(0.62, 0.7, 0.14, 16), pillarRing = new THREE.TorusGeometry(0.46, 0.05, 8, 18), finialGeo = new THREE.ConeGeometry(0.14, 0.42, 10);
  const baseMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }), starMatP = new THREE.MeshStandardMaterial({ color: '#ffd43b', emissive: '#a66f00', emissiveIntensity: 0.5, roughness: 0.3 });
  track.gates.forEach((g, gi) => {
    for (let x = 0; x < LANES; x++) {
      if (x === g.open) continue;
      const grp = new THREE.Group(), body = new THREE.Mesh(pillarGeo, pillarMats[(x + gi) % 3]), cap = new THREE.Mesh(capGeo, pillarMats[(x + gi + 1) % 3]);
      body.position.y = 1.05; cap.position.y = 2.15;
      const base = new THREE.Mesh(pillarBase, baseMat), fin = new THREE.Mesh(finialGeo, starMatP), ring = new THREE.Mesh(pillarRing, baseMat);
      base.position.y = 0.07; ring.position.y = 1.75; ring.rotation.x = Math.PI / 2; fin.position.y = 2.72;
      grp.add(body, cap, base, ring, fin); put(grp, x - 2, 0, g.r); scene.add(grp);
      blocks.push({ mesh: grp, x: x - 2, r: g.r, tall: true });
    }
    // a ring of little arrows points at the opening
    for (let d = 1; d <= 3; d++) { const a = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 3), new THREE.MeshBasicMaterial({ color: '#ffffff' })); a.rotation.x = Math.PI / 2; put(a, g.open - 2, 0.03, g.r - d * 1.4); a.rotation.y = 0; scene.add(a); }
  });
  const moverMat = new THREE.MeshStandardMaterial({ map: candyTex('#845ef7', '#e5dbff'), roughness: 0.5 });
  const gumGeo = new THREE.SphereGeometry(0.46, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), gumBase = new THREE.CylinderGeometry(0.46, 0.5, 0.14, 20);
  const eyeW = new THREE.SphereGeometry(0.12, 12, 10), eyeP = new THREE.SphereGeometry(0.06, 10, 8), horn = new THREE.ConeGeometry(0.07, 0.2, 8);
  const gumMat = new THREE.MeshStandardMaterial({ color: '#845ef7', roughness: 0.25, metalness: 0.05 }), gumDark = new THREE.MeshStandardMaterial({ color: '#5f3dc4', roughness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }), blackM = new THREE.MeshBasicMaterial({ color: '#1b1230' });
  const makeGum = () => { const g = new THREE.Group(), dome = new THREE.Mesh(gumGeo, gumMat), base = new THREE.Mesh(gumBase, gumDark); dome.position.y = 0.1; base.position.y = 0.07; g.add(dome, base);
    for (const sx of [-0.17, 0.17]) { const e = new THREE.Mesh(eyeW, white), p = new THREE.Mesh(eyeP, blackM); e.position.set(sx, 0.4, -0.3); p.position.set(sx, 0.4, -0.4); g.add(e, p);
      const h = new THREE.Mesh(horn, gumDark); h.position.set(sx * 1.7, 0.66, 0); h.rotation.z = -sx * 1.6; g.add(h); }
    return g; };
  const movers = track.movers.map((m) => { const b = makeGum(); put(b, 0, 0, m.r); scene.add(b); return { ...m, mesh: b, x: 0 }; });
  // hovering stars and wrapped candies
  const starShape = (() => { const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 0.11 : 0.27, an = Math.PI / 2 + (k * Math.PI) / 5; k ? sh.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : sh.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); } sh.closePath(); return sh; })();
  const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); starGeo.translate(0, 0, -0.05);
  const starMat = new THREE.MeshStandardMaterial({ color: '#ffd43b', emissive: '#a66f00', emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2 });
  const candyColors = ['#ff4d8d', '#3bc9db', '#9775fa', '#ff922b'];
  const candyMats = candyColors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35 })), wrapMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 });
  const candyBall = new THREE.SphereGeometry(0.15, 14, 10), candyTwist = new THREE.ConeGeometry(0.11, 0.18, 8);
  const makeCollectible = (n) => {
    if (n % 2 === 0) return { mesh: new THREE.Mesh(starGeo, starMat), kind: 'star' };
    const g = new THREE.Group(); g.add(new THREE.Mesh(candyBall, candyMats[n % 4]));
    for (const sgn of [-1, 1]) { const c = new THREE.Mesh(candyTwist, wrapMat); c.rotation.z = sgn * -Math.PI / 2; c.position.x = sgn * 0.22; g.add(c); }
    return { mesh: g, kind: 'candy' };
  };
  const gems = [];
  const addGem = (lx, y, r) => { const c = makeCollectible(gems.length); scene.add(c.mesh); put(c.mesh, lx, y, r); gems.push({ ...c, x: lx, r, y, got: false }); };
  track.gem.forEach((x, r) => { if (x >= 0) addGem(x - 2, 0.62, r); });
  track.airGems.forEach(([x, y, z]) => addGem(x, y, z));
  // an arc of hovering treats floats above each gate opening
  track.gates.forEach((g) => { for (let d = -2; d <= 2; d++) addGem(g.open - 2, 1.0 + (2 - Math.abs(d)) * 0.18, g.r + d * 0.9); });
  const flyers = [], bits = [];
  const hudPoint = () => { const a = $('.b3-gems', area).getBoundingClientRect(), c = cv.getBoundingClientRect();
    return new THREE.Vector3(((a.left + a.width / 2 - c.left) / c.width) * 2 - 1, -(((a.top + a.height / 2 - c.top) / c.height) * 2 - 1), 0.5).unproject(camera); };
  function fly(mesh) { mesh.visible = true; flyers.push({ mesh, t: 0, from: mesh.position.clone(), s0: mesh.scale.x }); }
  const bumpHud = () => { const h = $('.b3-gems', area); h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); };
  // treasure crates: smash them to make candy and stars burst out and fly to your score
  const crateWood = new THREE.MeshStandardMaterial({ color: '#e0a65e', roughness: 0.7 }), crateDark = new THREE.MeshStandardMaterial({ color: '#8d5a2b', roughness: 0.7 });
  const crateBody = new THREE.BoxGeometry(0.86, 0.8, 0.86), crateBand = new THREE.BoxGeometry(0.92, 0.12, 0.92), cratePost = new THREE.BoxGeometry(0.1, 0.84, 0.1), shardGeo = new THREE.BoxGeometry(0.2, 0.08, 0.2);
  const crates = track.crates.map((c) => {
    const g = new THREE.Group(), b = new THREE.Mesh(crateBody, crateWood); b.position.y = 0.42; g.add(b);
    for (const y of [0.12, 0.72]) { const bd = new THREE.Mesh(crateBand, crateDark); bd.position.y = y; g.add(bd); }
    for (const [px, pz] of [[-0.43, -0.43], [0.43, -0.43], [-0.43, 0.43], [0.43, 0.43]]) { const p = new THREE.Mesh(cratePost, crateDark); p.position.set(px, 0.42, pz); g.add(p); }
    const st = new THREE.Mesh(starGeo, starMat); st.position.y = 1.15; st.scale.setScalar(0.75); g.add(st);
    put(g, c.lane - 2, 0, c.r); scene.add(g); return { mesh: g, star: st, x: c.lane - 2, r: c.r, hit: false };
  });
  function smash(c) {
    c.hit = true; scene.remove(c.mesh);
    const [wx, wz] = W3(c.x, c.r);
    tone([196, 147, 262, 330], { dur: 0.05, gap: 0.04, vol: 0.12, type: 'square' });
    for (let k = 0; k < 12; k++) { const m = new THREE.Mesh(shardGeo, k % 2 ? crateWood : crateDark); m.position.set(wx, 0.5, wz); scene.add(m);
      bits.push({ m, shard: true, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3, vz: 1 + Math.random() * 3, rx: Math.random() * 9, rz: Math.random() * 9, age: 0 }); }
    const n = 6 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) { const it = makeCollectible(k); it.mesh.position.set(wx, 0.6, wz); it.mesh.scale.setScalar(1.15); scene.add(it.mesh);
      bits.push({ m: it.mesh, kind: it.kind, vx: (Math.random() - 0.5) * 3.2, vy: 3.2 + Math.random() * 2.4, vz: 0.5 + Math.random() * 2.2, rx: 0, rz: 0, age: 0, treat: true });
      S.gems++; S[it.kind === 'star' ? 'stars' : 'candies']++; }
    $('.b3-gems', area).textContent = `⭐ ${S.stars}  🍬 ${S.candies}`;
    flash(`Smash! +${n} 🍬`);
  }
  const bursts = [];    // little sparkles when something is collected
  const burstGeo = new THREE.SphereGeometry(0.05, 6, 5);
  function burst(x, y, z, color) {
    for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(burstGeo, new THREE.MeshBasicMaterial({ color, transparent: true })); m.position.set(x, y, z); scene.add(m);
      bursts.push({ m, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2.5, vz: (Math.random() - 0.3) * 2.5, life: 0.6 }); }
  }
  buildFeatures();
  // jump arrows before each gap
  const arrowMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  [...track.jumpRows].filter((r) => !track.jumpRows.has(r - 1)).forEach((r) => {
    for (let x = 0; x < LANES; x++) {
      const a = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 3), arrowMat);
      a.rotation.x = Math.PI / 2; put(a, x - 2, 0.02, r - 2); a.rotation.y = 0; scene.add(a);
    }
  });
  // finish arch
  const archZ = track.rows - 2;
  const postMat = new THREE.MeshStandardMaterial({ map: candyTex('#ff4d8d', '#fff'), roughness: 0.4 });
  postMat.map.repeat.set(1, 3);
  const banner = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 128);
    for (let i = 0; i < 32; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0 && (j === 0 || j === 7 || i < 2 || i > 29)) { x.fillStyle = '#222'; x.fillRect(i * 16, j * 16, 16, 16); }
    x.fillStyle = '#e8590c'; x.font = 'bold 64px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('FINISH', 256, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  for (const px of [-2.75, 2.75]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.9, 14), postMat); post.position.set(px, 1.45, archZ); scene.add(post);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), starMatP); top.position.set(px, 3.05, archZ); scene.add(top);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), new THREE.MeshBasicMaterial({ color: px < 0 ? '#ff4d8d' : '#3bc9db', side: THREE.DoubleSide })); flag.position.set(px + (px < 0 ? 0.4 : -0.4), 3.55, archZ); scene.add(flag);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), baseMat); pole.position.set(px, 3.4, archZ); scene.add(pole);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.1), new THREE.MeshBasicMaterial({ map: banner, side: THREE.DoubleSide })); sign.position.set(0, 2.55, archZ); scene.add(sign);
  for (let x = 0; x < 10; x++) {   // checkered finish line
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.02, 0.47), new THREE.MeshBasicMaterial({ color: x % 2 ? '#222' : '#fff' }));
    m.position.set(-2.25 + x * 0.5, 0.01, archZ); scene.add(m);
  }
  // clouds, floating islands and hovering treats for depth
  const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  const floaters = [];
  for (let c = 0; c < track.rows / 6; c++) {
    const g = new THREE.Group();
    for (let p = 0; p < 3; p++) { const sph = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.5, 10, 8), cloudMat); sph.position.set(p * 0.8, Math.random() * 0.3, 0); g.add(sph); }
    const z = c * 6 + Math.random() * 4; g.position.set(track.offAt(z) + (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 5), -2 - Math.random() * 3, z);
    scene.add(g);
  }
  const grassMat = new THREE.MeshLambertMaterial({ color: '#6fcf5a' }), dirtMat = new THREE.MeshLambertMaterial({ color: '#a9743f' });
  const treeMat = new THREE.MeshLambertMaterial({ color: '#3fae4a' }), caneMats = [new THREE.MeshLambertMaterial({ color: '#ff4d6d' }), new THREE.MeshLambertMaterial({ color: '#ffffff' })];
  for (let k = 0; k < track.rows / 7; k++) {            // little islands that bob in the sky beside the track
    const g = new THREE.Group(), r = 0.9 + Math.random() * 0.9;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 0.25, 14), grassMat), under = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, r * 1.4, 14), dirtMat); under.rotation.x = Math.PI; under.position.y = -0.8;
    g.add(top, under);
    if (k % 3 === 0) { const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.5, 6), dirtMat); trunk.position.y = 0.38; const crown = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), treeMat); crown.position.y = 0.85; g.add(trunk, crown); }
    else if (k % 3 === 1) { for (let q = 0; q < 6; q++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.17, 8), caneMats[q % 2]); seg.position.y = 0.2 + q * 0.16; g.add(seg); } }
    else { const lol = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshLambertMaterial({ color: ['#ff6b9d', '#74c0fc', '#ffd43b'][k % 3] })); lol.position.y = 0.62; const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), wrapMat); stick.position.y = 0.3; g.add(stick, lol); }
    const z = k * 7 + Math.random() * 5, side = k % 2 ? 1 : -1, base = 0.2 + Math.random() * 3.2;
    g.position.set(track.offAt(z) + side * (3.8 + Math.random() * 3.5), base, z); scene.add(g); floaters.push({ g, base, ph: Math.random() * 6, sp: 0.8 + Math.random() * 0.8 });
  }
  // the ball
  const ballTex = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#339af0'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(16 + i * 32, 32, 9, 0, 7); x.fill(); }
    return new THREE.CanvasTexture(c);
  })();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 28, 20), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.28, metalness: 0.15 }));
  scene.add(ball);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.33, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.22 }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

  // ---- scenery for ramps, broken bridges, waterfalls and plank bridges
  function buildFeatures() {
    const wood = new THREE.MeshLambertMaterial({ color: '#8d5a2b' }), rope = new THREE.MeshLambertMaterial({ color: '#e9c46a' });
    const rock = new THREE.MeshLambertMaterial({ color: '#868e96' });
    const stripes = (c1, c2, n) => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d');
      for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? c1 : c2; x.fillRect(0, (64 / n) * i, 64, 64 / n); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const rampTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
      x.fillStyle = '#ff922b'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(8 + i * 32, 52); x.lineTo(24 + i * 32, 12); x.lineTo(40 + i * 32, 52); x.lineTo(32 + i * 32, 52); x.lineTo(24 + i * 32, 30); x.lineTo(16 + i * 32, 52); x.fill(); }
      return new THREE.CanvasTexture(c); })();
    let holder = scene;
    const box = (w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); holder.add(m); return m; };
    const cyl = (r, h, mat, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); holder.add(m); return m; };
    for (const f of track.features) {
      holder = new THREE.Group(); holder.position.x = track.off[Math.max(0, f.from - 2)]; scene.add(holder);
      if (f.kind === 'plank') {      // rope rails on little posts along the plank
        const x = f.lane - 2;
        for (let r = f.from; r <= f.to; r += 2) { cyl(0.04, 0.5, wood, x - 0.55, 0.1, r); cyl(0.04, 0.5, wood, x + 0.55, 0.1, r); }
        const len = f.to - f.from + 1, mid = (f.from + f.to) / 2;
        cyl(0.025, len, rope, x - 0.55, 0.32, mid, Math.PI / 2); cyl(0.025, len, rope, x + 0.55, 0.32, mid, Math.PI / 2);
        continue;
      }
      // the ramp: an orange wedge with arrows across all lanes
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, RAMP_LEN + 0.15), [rock, rock, new THREE.MeshLambertMaterial({ map: rampTex }), rock, rock, rock]);
      ramp.position.set(0, RAMP_H / 2 - 0.02, f.ramp - RAMP_LEN / 2); ramp.rotation.x = -Math.atan(RAMP_H / RAMP_LEN); holder.add(ramp);
      const g0 = f.gs - 0.5, g1 = f.ge + 0.5, gl = g1 - g0;
      if (f.kind === 'bridge') {
        // posts at both broken ends, snapped ropes and planks hanging into the gap
        for (const z of [g0, g1]) for (const x of [-2.6, 2.6]) cyl(0.08, 1.2, wood, x, 0.3, z);
        cyl(0.03, f.ramp - f.from + 1.5, rope, -2.6, 0.75, (f.from + g0) / 2, Math.PI / 2); cyl(0.03, f.ramp - f.from + 1.5, rope, 2.6, 0.75, (f.from + g0) / 2, Math.PI / 2);
        cyl(0.03, f.to - g1 + 0.5, rope, -2.6, 0.75, (g1 + f.to) / 2, Math.PI / 2); cyl(0.03, f.to - g1 + 0.5, rope, 2.6, 0.75, (g1 + f.to) / 2, Math.PI / 2);
        cyl(0.03, 1.6, rope, -2.6, 0.0, g0 + 0.45, 0.9); cyl(0.03, 1.6, rope, 2.6, -0.1, g1 - 0.45, -0.9);
        [[-1.6, -0.5, g0 + 0.25, 1.1], [0.4, -0.7, g0 + 0.2, 1.3], [1.8, -0.4, g0 + 0.3, 0.9], [-0.8, -0.6, g1 - 0.25, -1.2], [1.2, -0.5, g1 - 0.2, -1.0]]
          .forEach(([x, y, z, rx]) => box(0.9, 0.08, 0.7, wood, x, y, z, rx, 0, (Math.random() - 0.5) * 0.4));
        const sign = box(1.2, 0.5, 0.06, new THREE.MeshLambertMaterial({ color: '#ffd43b' }), 3.4, 0.9, f.ramp - 2, 0, -0.4);
        void sign;
      } else {
        // waterfall canyon: the river pours down the far cliff in front of you, with mist and a rainbow
        const cliff = new THREE.MeshLambertMaterial({ color: '#7c6a5a' });
        const near = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), cliff); near.position.set(0, -4.7, g0); holder.add(near);
        const fallTex = stripes('#ffffff', '#4dabf7', 10); fallTex.repeat.set(4, 2); fallTex.userData = { speed: 1.8 }; water.push(fallTex);
        const fall = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: fallTex }));
        fall.position.set(0, -4.6, g1 - 0.02); fall.rotation.y = Math.PI; holder.add(fall);
        for (const x of [-7, 7]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(5, 9), cliff); side.position.set(x, -4.6, g1 - 0.03); side.rotation.y = Math.PI; holder.add(side); }
        const riverTex = stripes('#4dabf7', '#74c0fc', 6); riverTex.repeat.set(2, 2); riverTex.userData = { speed: 0.9 }; water.push(riverTex);
        for (const x of [-3.6, 3.6]) {           // two streams beside the track feed the waterfall
          const river = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 7), new THREE.MeshBasicMaterial({ map: riverTex }));
          river.rotation.x = -Math.PI / 2; river.position.set(x, -0.02, g1 + 3.4); holder.add(river);
        }
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(20, gl + 2), new THREE.MeshBasicMaterial({ color: '#339af0' }));
        pool.rotation.x = -Math.PI / 2; pool.position.set(0, -9, (g0 + g1) / 2); holder.add(pool);
        const mist = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 });
        for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 10, 8), mist); m.position.set(-4 + Math.random() * 8, -8.6, g1 - 0.8 - Math.random()); holder.add(m); }
        ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'].forEach((c, k) => {
          const arc = new THREE.Mesh(new THREE.TorusGeometry(5.4 - k * 0.2, 0.09, 6, 48, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7 }));
          arc.position.set(0, -4.8, (g0 + g1) / 2 + 0.6); holder.add(arc);
        });
      }
    }
  }

  // state
  // height of the ground under the ball: flat, except on the run-up of a ramp
  const gy = (z) => { for (const f of track.features) if (f.ramp != null && z > f.ramp - RAMP_LEN && z <= f.ramp + 0.2) return 0.35 + RAMP_H * Math.min(1, (z - (f.ramp - RAMP_LEN)) / RAMP_LEN); return 0.35; };
  const S = { x: track.safe[0] - 2, tx: track.safe[0] - 2, y: 0.35, vy: 0, z: 0, falling: false, dead: 0, gems: 0, stars: 0, candies: 0, tries: 0, done: false, check: 0, coyote: 0, buffer: 0, air2: false, boost: 0 };
  const speed0 = T.speed[lv - 1];
  window.__b3 = { S, track };   // used by automated tests
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
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = { x0: e.clientX, y0: e.clientY, t0: S.tx, time: e.timeStamp, moved: 0, act: null }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0; drag.moved = Math.max(drag.moved, Math.abs(dx), Math.abs(dy));
    if (!drag.act && dy < -55) {                       // a sudden flick up = big jump; a longer drag forward = speed boost
      if (e.timeStamp - drag.time < 300) { drag.act = 'jump'; bigJump(); } else { drag.act = 'boost'; speedBoost(); }
    }
    S.tx = Math.max(-2.2, Math.min(2.2, drag.t0 - dx / (w / 5.5)));   // camera faces +z: screen-right is lane -x
  });
  const up = (e) => {
    if (drag && !drag.act && drag.moved < 12 && e.timeStamp - drag.time < 300) jump();
    drag = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => (drag = null));
  function jump() {
    if (S.done) return;
    // on the ground, or only just off an edge (a little grace so a late tap still counts)
    const can = (S.y <= gy(S.z) + 0.01 && !S.falling) || (S.coyote > 0 && S.vy <= 0 && S.y > -0.4);
    if (!can) {
      if (!S.air2 && !S.falling && S.y > 0.6) { S.air2 = true; S.vy = 6.6; flash('Double jump! 🦘'); tone([587, 880, 1175], { dur: 0.05, gap: 0.04, vol: 0.09 }); return; }   // a second tap in the air lifts higher
      S.buffer = 0.18; return;                      // too early: remember the tap for the landing
    }
    S.falling = false; S.coyote = 0; S.buffer = 0; S.vy = 6.4;
    tone([440, 660], { dur: 0.05, gap: 0.05, vol: 0.08 });
  }
  function bigJump() {
    if (S.done) return;
    const can = (S.y <= gy(S.z) + 0.01 && !S.falling) || (S.coyote > 0 && S.vy <= 0 && S.y > -0.4);
    if (can) { S.falling = false; S.coyote = 0; S.buffer = 0; S.vy = 9.2; }
    else if (!S.air2 && !S.falling) { S.air2 = true; S.vy = Math.max(S.vy, 0) + 7.4; }
    else return;
    flash('Super jump! 🚀'); tone([392, 587, 880, 1175], { dur: 0.05, gap: 0.04, vol: 0.1, type: 'triangle' });
  }
  function speedBoost() { if (S.done) return; S.boost = 1.8; flash('Speed boost! 💨'); tone([220, 330, 494, 659], { dur: 0.05, gap: 0.03, vol: 0.09, type: 'sawtooth' }); }
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
    let r = Math.max(0, Math.floor(S.z / CHECK) * CHECK);
    while (r > 0 && (!track.floor[r][track.safe[r]] || featAt(r))) r--;   // never restart inside a gap or on a ramp run
    S.z = r; S.x = S.tx = track.safe[r] - 2; S.y = 0.35; S.vy = 0; S.falling = false; S.dead = 1.2; S.launched = false;   // 1.2 s safe time
    flash('Try again! 💪');
  }

  let raf = 0, last = 0, alive = true, t = 0;
  function frame(now) {
    if (!alive) return;
    const dt = last ? Math.min(0.04, (now - last) / 1000) : 0; last = now; t += dt;
    if (!S.done) {
      S.boost = Math.max(0, S.boost - dt);
      const v = speed0 * (1 + Math.min(0.25, S.z / track.rows * 0.25)) * (S.boost > 0 ? 1.7 : 1);    // speeds up a bit along the track (and a lot while boosting)
      if (tilt != null && !drag) S.tx = Math.max(-2.2, Math.min(2.2, S.tx - tilt * 5 * dt));
      S.x += (S.tx - S.x) * Math.min(1, dt * 12);
      if (!S.falling) S.z += v * dt;
      // vertical
      S.coyote = Math.max(0, S.coyote - dt); S.buffer = Math.max(0, S.buffer - dt);
      S.vy -= 15 * dt; S.y += S.vy * dt;
      const ground = floorAt(S.x, S.z);
      if (!S.falling && S.y <= gy(S.z)) {
        if (ground) {
          S.y = gy(S.z); S.vy = 0; S.coyote = 0.14; S.air2 = false;
          if (S.buffer > 0) jump();
          if (track.ramps.has(Math.round(S.z)) && !S.launched) { S.vy = LAUNCH; S.launched = true; tone([330, 494, 660, 880], { dur: 0.06, gap: 0.05, vol: 0.1, type: 'triangle' }); flash('Wheee! 🚀'); }
          if (!track.ramps.has(Math.round(S.z))) S.launched = false;
        }
        else if (S.y < 0.2) { S.falling = true; sfx.no(); }
      }
      if (S.falling && S.y < -4) respawn();
      if (S.dead > 0) S.dead -= dt;
      // blocks
      if (S.dead <= 0 && !S.falling) {
        const hitBlock = (bx, bz, tall) => Math.abs(bx - S.x) < 0.62 && Math.abs(bz - S.z) < 0.6 && S.y < (tall ? 2.2 : 0.95);
        if (blocks.some((b) => hitBlock(b.x, b.r, b.tall)) || movers.some((m) => hitBlock(m.x, m.r))) { tone([160, 120], { dur: 0.08, gap: 0.08, vol: 0.12 }); respawn(); }
      }
      if (S.dead <= 0) for (const c of crates) if (!c.hit && Math.abs(c.x - S.x) < 0.72 && Math.abs(c.r - S.z) < 0.7 && S.y < 1.5) smash(c);
      for (const g of gems) if (!g.got && Math.abs(g.x - S.x) < 0.55 && Math.abs(g.r - S.z) < 0.55 && Math.abs(g.y - S.y) < 0.75) {
        g.got = true; fly(g.mesh); S.gems++; S[g.kind === 'star' ? 'stars' : 'candies']++;
        $('.b3-gems', area).textContent = `⭐ ${S.stars}  🍬 ${S.candies}`;
        const [bx, bz] = W3(g.x, g.r); burst(bx, g.y, bz, g.kind === 'star' ? '#ffe066' : '#ff8fab');
        tone(g.kind === 'star' ? [988, 1319] : [784, 1047, 1319], { dur: 0.05, gap: 0.05, vol: 0.09 });
      }
      if (Math.floor(S.z / CHECK) > S.check) { S.check = Math.floor(S.z / CHECK); flash('✔ Checkpoint!'); }
      $('.b3-bar i', area).style.width = `${Math.min(100, (S.z / archZ) * 100)}%`;
      if (S.z >= archZ) finish();
    }
    // animate
    for (const m of movers) { m.x = Math.sin(t * m.speed + m.phase) * 2; put(m.mesh, m.x, Math.abs(Math.sin(t * 4 + m.phase)) * 0.12, m.r); m.mesh.scale.set(1 + Math.sin(t * 8 + m.phase) * 0.04, 1 - Math.sin(t * 8 + m.phase) * 0.05, 1); }
    for (const g of gems) if (!g.got) { put(g.mesh, g.x, g.y + Math.sin(t * 3 + g.r) * 0.1, g.r); g.mesh.rotation.y = t * 2.4 + g.r; }
    for (const f of floaters) { f.g.position.y = f.base + Math.sin(t * f.sp + f.ph) * 0.35; f.g.rotation.y += dt * 0.25; }
    for (const c of crates) if (!c.hit) c.star.rotation.y = t * 2.4;
    for (let k = bits.length - 1; k >= 0; k--) { const b = bits[k]; b.age += dt;
      if (b.shard) { b.vy -= 12 * dt; b.m.position.x += b.vx * dt; b.m.position.y = Math.max(0.1, b.m.position.y + b.vy * dt); b.m.position.z += b.vz * dt; b.m.rotation.x += b.rx * dt; b.m.rotation.z += b.rz * dt;
        if (b.age > 1.1) { scene.remove(b.m); bits.splice(k, 1); } continue; }
      // candy and stars pop out, bounce on the track, then fly up to the score
      b.vy -= 11 * dt; b.m.position.x += b.vx * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt; b.m.rotation.y += dt * 6;
      if (b.m.position.y < 0.3) { b.m.position.y = 0.3; b.vy = Math.abs(b.vy) * 0.5; b.vx *= 0.7; b.vz *= 0.7; }
      if (b.age > 0.65) { bits.splice(k, 1); fly(b.m); } }
    for (const w of water) w.offset.y = (w.offset.y - dt * w.userData.speed) % 1;
    for (let k = bursts.length - 1; k >= 0; k--) { const bb = bursts[k]; bb.life -= dt; bb.vy -= 6 * dt; bb.m.position.x += bb.vx * dt; bb.m.position.y += bb.vy * dt; bb.m.position.z += bb.vz * dt; bb.m.material.opacity = Math.max(0, bb.life / 0.6);
      if (bb.life <= 0) { scene.remove(bb.m); bb.m.material.dispose(); bursts.splice(k, 1); } }
    const [bwx, bwz, bwa] = W3(S.x, S.z);
    ball.position.set(bwx, S.y, bwz);
    ball.rotation.x += (S.done ? 0 : speed0 * dt) / 0.35;
    ball.visible = !(S.dead > 0 && Math.floor(t * 10) % 2);
    shadow.position.set(bwx, 0.011, bwz); shadow.visible = !S.falling && floorAt(S.x, S.z);
    shadow.scale.setScalar(Math.max(0.4, 1 - (S.y - 0.35) * 0.4));
    if (!S.done && !S.falling && (t * 14) % 1 < dt * 14) { const sp = new THREE.Mesh(burstGeo, new THREE.MeshBasicMaterial({ color: ['#fff', '#ffe066', '#a5d8ff'][Math.floor(t * 14) % 3], transparent: true })); sp.position.set(bwx, S.y - 0.1, bwz - 0.3); scene.add(sp); bursts.push({ m: sp, vx: (Math.random() - 0.5) * 0.8, vy: 0.3, vz: -0.5, life: 0.45 }); }
    const [cx, cz] = W3(S.x * 0.6, S.z - 5.2), [lx, lz] = W3(S.x * 0.75, S.z + 4.5);
    const roll = Math.max(-0.07, Math.min(0.07, (slope(S.z + 3) - slope(S.z)) * 1.2));
    camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.position.set(cx, 3.1, cz); camera.lookAt(lx, 0, lz);
    const wantFov = S.boost > 0 ? 72 : 60; if (Math.abs(camera.fov - wantFov) > 0.1) { camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
    if (flyers.length) { const tp = hudPoint();
      for (let k = flyers.length - 1; k >= 0; k--) { const f = flyers[k]; f.t += dt / 0.55; const e = Math.min(1, f.t); const q = e * e * (3 - 2 * e);
        f.mesh.position.lerpVectors(f.from, tp, q); f.mesh.scale.setScalar(f.s0 * (1 - 0.75 * q)); f.mesh.rotation.y += dt * 9;
        if (f.t >= 1) { scene.remove(f.mesh); flyers.splice(k, 1); bumpHud(); } } }
    if (S.boost > 0 && !S.falling && (t * 30) % 1 < dt * 30) burst(bwx, S.y + 0.1, bwz - 0.3, '#a5d8ff');
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function finish() {
    S.done = true;
    const lvUp = gameLevelUp('ball', 1);
    gameWin(pick(['You did it!', 'Awesome job!', 'Fantastic!']));
    later(() => {
      endPanel(`You reached the finish!<br><small>⭐ ${S.stars} stars · 🍬 ${S.candies} candies · ${S.tries === 0 ? 'no falls!' : `${S.tries} restart${S.tries > 1 ? 's' : ''}`}</small>`, '🏁', start, lvUp);
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
