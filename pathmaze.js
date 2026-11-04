/* ======================= FINGER MAZE (Brain Teasers) =======================
   Trace a path with your finger: take the duckling to mama duck, the kid home …
   The maze is made fresh each time (a "perfect" maze: exactly one way through).
   Level 1 is a tiny 3×4 maze; each level adds rows and columns. */
const PATH_THEMES = [
  ['🐥', '🦆', 'Take the duckling to mama duck!'],
  ['🧒', '🏠', 'Help the kid get home!'],
  ['🐶', '🦴', 'Take the puppy to its bone!'],
  ['🐝', '🌻', 'Help the bee find the flower!'],
  ['🐰', '🥕', 'Take the bunny to the carrot!'],
  ['🐭', '🧀', 'Help the mouse find the cheese!'],
  ['🚗', '🅿️', 'Drive the car to the parking spot!'],
  ['🐵', '🍌', 'Take the monkey to the banana!'],
];
const PATH_SIZES = [[3, 4], [4, 5], [5, 6], [6, 7], [7, 9], [8, 10], [9, 12], [11, 14], [13, 17], [15, 19], [17, 21], [19, 23]];   // columns × rows per level
function makeMaze(cols, rows) {
  // walls[r][c] = { n, e, s, w } — true means a wall
  const W = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ n: true, e: true, s: true, w: true })));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack = [[0, 0]]; seen[0][0] = true;
  const D = { n: [0, -1, 's'], e: [1, 0, 'w'], s: [0, 1, 'n'], w: [-1, 0, 'e'] };
  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const next = Object.entries(D).filter(([, [dx, dy]]) => { const x = c + dx, y = r + dy; return x >= 0 && y >= 0 && x < cols && y < rows && !seen[y][x]; });
    if (!next.length) { stack.pop(); continue; }
    const [d, [dx, dy, back]] = next[Math.floor(Math.random() * next.length)];
    W[r][c][d] = false; W[r + dy][c + dx][back] = false; seen[r + dy][c + dx] = true; stack.push([c + dx, r + dy]);
  }
  return W;
}
// the one way from start to goal (used for the hint)
function mazeRoute(W, from, to) {
  const rows = W.length, cols = W[0].length, prev = new Map([[from.join(), null]]), q = [from];
  const D = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
  while (q.length) {
    const [c, r] = q.shift(); if (c === to[0] && r === to[1]) break;
    for (const [d, [dx, dy]] of Object.entries(D)) { if (W[r][c][d]) continue; const k = [c + dx, r + dy].join(); if (!prev.has(k)) { prev.set(k, [c, r]); q.push([c + dx, r + dy]); } }
  }
  const out = []; let k = to; while (k) { out.unshift(k); k = prev.get(k.join()); } return out;
}

/* Circular maze: concentric rings of sectors with real curved walls and radial
   passages. Graph connectivity, not canvas appearance, determines legal moves. */
function radialMaze(rings, sectors) {
  const W = Array.from({ length: rings }, () => Array.from({ length: sectors },
    () => ({ inside: true, outside: true, cw: true, ccw: true })));
  const next = ([r, q]) => [
    [r, (q + 1) % sectors, 'cw', 'ccw'],
    [r, (q - 1 + sectors) % sectors, 'ccw', 'cw'],
    ...(r + 1 < rings ? [[r + 1, q, 'outside', 'inside']] : []),
    ...(r > 0 ? [[r - 1, q, 'inside', 'outside']] : []),
  ];
  const seen = new Set(['0,0']), stack = [[0, 0]];
  while (stack.length) {
    const head = stack[stack.length - 1];
    const choices = next(head).filter(([r, q]) => !seen.has(r + ',' + q));
    if (!choices.length) { stack.pop(); continue; }
    const [r, q, out, back] = pick(choices);
    W[head[0]][head[1]][out] = false; W[r][q][back] = false;
    seen.add(r + ',' + q); stack.push([r, q]);
  }
  return W;
}
function radialRoute(W, from, to) {
  const rings = W.length, sectors = W[0].length;
  const steps = ([r, q]) => [
    [r, (q + 1) % sectors, 'cw'], [r, (q - 1 + sectors) % sectors, 'ccw'],
    [r + 1, q, 'outside'], [r - 1, q, 'inside'],
  ].filter(([nr, nq, d]) => nr >= 0 && nr < rings && !W[r][q][d]);
  const key = ([r, q]) => r + ',' + q, prev = new Map([[key(from), null]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i]; if (key(at) === key(to)) break;
    for (const [r, q] of steps(at)) {
      const k = key([r, q]); if (!prev.has(k)) { prev.set(k, at); queue.push([r, q]); }
    }
  }
  if (!prev.has(key(to))) return [];
  const route = []; for (let p = to; p; p = prev.get(key(p))) route.unshift(p);
  return route;
}
function startRadialMaze(lv) {
  const rings = lv <= 9 ? 5 : lv <= 11 ? 6 : 7;
  const sectors = lv <= 9 ? 12 : lv <= 11 ? 16 : 18;
  const start = [0, 0], goal = [rings - 1, Math.floor(sectors / 2)];
  let W = radialMaze(rings, sectors), route = radialRoute(W, start, goal);
  for (let n = 0; n < 24; n++) {
    const candidate = radialMaze(rings, sectors);
    const path = radialRoute(candidate, start, goal);
    if (path.length > route.length) { W = candidate; route = path; }
  }
  const [hero, prize, line] = pick(PATH_THEMES);
  const area = $('#gameArea'), session = gameSession;
  area.innerHTML = `<div class="g-msg">🌀 Round maze · ${line}<small>Follow the curving paths from ${hero} to ${prize}.</small></div>
    <div class="cv-wrap pm-view"><div class="pm-inner"><canvas class="game-cv pm-cv"></canvas></div></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="hint">💡 Show me</button>
      <button class="big-btn alt small" data-a="new">🔄 New maze</button>
      <button class="big-btn alt small" data-z="in" aria-label="Zoom in">＋</button>
      <button class="big-btn alt small" data-z="out" aria-label="Zoom out">－</button>
      <button class="big-btn alt small" data-z="reset">Reset view</button></div>`;
  say([line, 'Draw the way with your finger!']);
  const cv = $('.pm-cv', area), fit = fitCanvas(cv, 360), c = fit.c, w = fit.w;
  const dpr = Math.min(devicePixelRatio || 1, 2), h = w;
  cv.style.height = h + 'px'; cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = w / 2, cy = h / 2, r0 = Math.max(30, w * 0.11), outside = w / 2 - 13;
  const dr = (outside - r0) / rings, da = Math.PI * 2 / sectors;
  const mid = ([r, q]) => { const a = -Math.PI / 2 + (q + 0.5) * da, rad = r0 + (r + 0.5) * dr;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]; };
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  const stepsFrom = ([r, q]) => [
    [r, (q + 1) % sectors, 'cw'], [r, (q - 1 + sectors) % sectors, 'ccw'],
    [r + 1, q, 'outside'], [r - 1, q, 'inside'],
  ].filter(([nr, nq, d]) => nr >= 0 && nr < rings && !W[r][q][d]);
  let path = [start], drawing = false, done = false, hint = null;
  const zoom = zoomable($('.pm-view', area), $('.pm-inner', area), { oneFingerPan: false });
  $('[data-z]', area).forEach((b) => (b.onclick = () => b.dataset.z === 'reset' ? zoom.reset() : zoom.by(b.dataset.z === 'in' ? 1.5 : 1 / 1.5)));
  function draw() {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#fff9db'; c.beginPath(); c.arc(cx, cy, outside + 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, cy, r0 - 2, 0, Math.PI * 2); c.fill();
    if (hint) { c.fillStyle = '#ffd43b'; for (const p of hint) {
      const [x, y] = mid(p); c.beginPath(); c.arc(x, y, Math.max(3, dr * 0.14), 0, 7); c.fill();
    } }
    c.lineCap = c.lineJoin = 'round'; c.strokeStyle = '#4dabf7';
    c.lineWidth = Math.max(5, Math.min(dr * 0.54, 15)); c.beginPath();
    path.forEach((p, i) => { const [x, y] = mid(p); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke();
    c.strokeStyle = '#7c4a1e'; c.lineWidth = Math.max(2.5, dr * 0.13); c.beginPath();
    for (let r = 0; r < rings; r++) for (let q = 0; q < sectors; q++) {
      const cell = W[r][q], a0 = -Math.PI / 2 + q * da, a1 = a0 + da;
      if (cell.inside) { c.moveTo(cx + Math.cos(a0) * (r0 + r * dr), cy + Math.sin(a0) * (r0 + r * dr));
        c.arc(cx, cy, r0 + r * dr, a0, a1); }
      if (r === rings - 1 && cell.outside) { c.moveTo(cx + Math.cos(a0) * outside, cy + Math.sin(a0) * outside);
        c.arc(cx, cy, outside, a0, a1); }
      if (cell.cw) {
        c.moveTo(cx + Math.cos(a1) * (r0 + r * dr), cy + Math.sin(a1) * (r0 + r * dr));
        c.lineTo(cx + Math.cos(a1) * (r0 + (r + 1) * dr), cy + Math.sin(a1) * (r0 + (r + 1) * dr));
      }
    }
    c.stroke();
    const size = Math.max(11, Math.min(21, dr * 0.9));
    c.font = size + 'px system-ui, "Apple Color Emoji", "Noto Color Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const [gx, gy] = mid(goal), [px, py] = mid(path[path.length - 1]);
    c.fillText(prize, gx, gy); c.fillText(hero, px, py);
  }
  const cellAt = (e) => {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) * w / rect.width - cx;
    const y = (e.clientY - rect.top) * h / rect.height - cy;
    const rad = Math.hypot(x, y), ring = Math.floor((rad - r0) / dr);
    if (ring < 0 || ring >= rings) return null;
    const sector = Math.floor(((Math.atan2(y, x) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)) / da);
    return [ring, Math.min(sectors - 1, sector)];
  };
  function moveTo(t) {
    if (!t || done || gameSession !== session) return;
    const at = path[path.length - 1]; if (same(at, t)) return;
    const old = path.findIndex((p) => same(p, t));
    if (old >= 0) path = path.slice(0, old + 1);
    else if (stepsFrom(at).some(([r, q]) => same([r, q], t))) path.push(t);
    else return; // Never skip across a closed radial/curved wall.
    draw();
    if (!done && same(path[path.length - 1], goal)) {
      done = true; drawing = false;
      const up = gameLevelUp('path', 2); gameWin('You did it!');
      later(() => endPanel(up ? 'You did it! Next: a harder maze' : 'You did it!', prize, null, up), 1300);
    }
  }
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); if (done || !e.isPrimary || zoom.busy()) return;
    const p = cellAt(e); if (!p || !path.some((x) => same(x, p)) && !stepsFrom(path[path.length - 1]).some(([r, q]) => same([r, q], p))) return;
    drawing = true; try { cv.setPointerCapture(e.pointerId); } catch {} moveTo(p);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing || done || zoom.busy()) { if (zoom.busy()) drawing = false; return; }
    for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) moveTo(cellAt(ev));
  });
  const up = () => (drawing = false);
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  area.querySelector('[data-a="hint"]').onclick = () => {
    hint = radialRoute(W, start, goal); draw(); say('Follow the yellow dots!');
    later(() => { hint = null; draw(); }, 2600);
  };
  area.querySelector('[data-a="new"]').onclick = () => { gameSession++; startPathMaze(); };
  draw();
  if (isQAMode() || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))
    window.__pathMaze = { route: () => radialRoute(W, start, goal), go: (cells) => { for (const p of cells) moveTo(p); }, done: () => done, session, type: 'radial', rings, sectors };
}

function startPathMaze() {
  const lv = GL('path');
  // Later levels include real concentric-ring puzzles, not just rectangular skins.
  if (lv >= 8 && (lv >= 11 || Math.random() < 0.55)) return startRadialMaze(lv);
  const [cols, rows] = PATH_SIZES[Math.min(lv, PATH_SIZES.length) - 1];
  const [hero, goalE, line] = pick(PATH_THEMES);
  const start = [0, 0], goal = [cols - 1, rows - 1];
  let W = makeMaze(cols, rows);
  if (lv >= 5) {
    // Avoid large-but-trivially-short routes; keep the hardest solvable candidate.
    let best = mazeRoute(W, start, goal).length;
    for (let i = 0; i < 15; i++) {
      const candidate = makeMaze(cols, rows), length = mazeRoute(candidate, start, goal).length;
      if (length > best) { W = candidate; best = length; }
    }
  }
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">${hero} → ${goalE} ${line}<small>Put your finger on ${hero} and draw the way.</small></div>
    <div class="cv-wrap pm-view"><div class="pm-inner"><canvas class="game-cv pm-cv"></canvas></div></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="hint">💡 Show me</button><button class="big-btn alt small" data-a="new">🔄 New maze</button>
    ${lv >= 5 ? '<button class="big-btn alt small" data-z="in" aria-label="Zoom in">＋</button><button class="big-btn alt small" data-z="out" aria-label="Zoom out">－</button><button class="big-btn alt small" data-z="reset">Reset view</button>' : ''}</div>`;
  say([line, 'Draw the way with your finger!']);
  const cv = $('.pm-cv', area);
  const fit = fitCanvas(cv, 360), c = fit.c, w = fit.w;
  const cell = Math.floor(Math.min((w - 16) / cols, (fit.h - 16) / rows));
  // shrink the canvas to the maze, so no empty strip is left under it
  const h = cell * rows + 16, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.style.height = h + 'px'; cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ox = (w - cell * cols) / 2, oy = (h - cell * rows) / 2;
  const zoom = zoomable($('.pm-view', area), $('.pm-inner', area), { oneFingerPan: false });
  $('[data-z]', area).forEach((b) => (b.onclick = () => b.dataset.z === 'reset' ? zoom.reset() : zoom.by(b.dataset.z === 'in' ? 1.5 : 1 / 1.5)));
  const mid = ([x, y]) => [ox + (x + 0.5) * cell, oy + (y + 0.5) * cell];
  let path = [start], drawing = false, done = false, hint = null;
  const session = gameSession;
  function draw() {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#fff9db'; c.fillRect(ox - 6, oy - 6, cell * cols + 12, cell * rows + 12);
    // hint: soft dots along the way
    if (hint) { c.fillStyle = '#ffd43b'; for (const p of hint) { const [x, y] = mid(p); c.beginPath(); c.arc(x, y, cell * 0.12, 0, 7); c.fill(); } }
    // the child's path
    c.lineCap = c.lineJoin = 'round'; c.strokeStyle = '#4dabf7'; c.lineWidth = cell * 0.42;
    c.beginPath(); path.forEach((p, i) => { const [x, y] = mid(p); i ? c.lineTo(x, y) : c.moveTo(x, y); }); if (path.length === 1) { const [x, y] = mid(path[0]); c.lineTo(x + 0.01, y); } c.stroke();
    // walls
    c.strokeStyle = '#7c4a1e'; c.lineWidth = Math.max(4, cell * 0.12);
    c.beginPath();
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = ox + q * cell, y = oy + r * cell, k = W[r][q];
      if (k.n) { c.moveTo(x, y); c.lineTo(x + cell, y); }
      if (k.w) { c.moveTo(x, y); c.lineTo(x, y + cell); }
      if (r === rows - 1 && k.s) { c.moveTo(x, y + cell); c.lineTo(x + cell, y + cell); }
      if (q === cols - 1 && k.e) { c.moveTo(x + cell, y); c.lineTo(x + cell, y + cell); }
    }
    c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${cell * 0.62}px system-ui, "Apple Color Emoji", "Noto Color Emoji"`;
    const [gx, gy] = mid(goal); c.fillText(goalE, gx, gy + 2);
    const [hx, hy] = mid(path[path.length - 1]); c.fillText(hero, hx, hy + 2);
  }
  const cellAt = (e) => { const r = cv.getBoundingClientRect(); const x = Math.floor(((e.clientX - r.left) * w / r.width - ox) / cell), y = Math.floor(((e.clientY - r.top) * h / r.height - oy) / cell); return x >= 0 && y >= 0 && x < cols && y < rows ? [x, y] : null; };
  const open = ([c1, r1], [c2, r2]) => { const k = W[r1][c1]; return c2 === c1 + 1 && r2 === r1 ? !k.e : c2 === c1 - 1 && r2 === r1 ? !k.w : r2 === r1 + 1 && c2 === c1 ? !k.s : r2 === r1 - 1 && c2 === c1 ? !k.n : false; };
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  function moveTo(t) {
    // step toward the finger one open cell at a time (a fast finger can skip over cells); never through a wall
    for (let steps = 0; steps < 4; steps++) {
      const head = path[path.length - 1];
      if (same(head, t)) break;
      const i = path.findIndex((p) => same(p, t));
      if (i >= 0) { path = path.slice(0, i + 1); sfx.tap(); break; }          // finger went back along the path
      const best = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [head[0] + dx, head[1] + dy])
        .filter((n) => open(head, n) && !path.some((p) => same(p, n)) && dist(n, t) < dist(head, t))
        .sort((a, b) => dist(a, t) - dist(b, t))[0];
      if (!best) break;                                                        // a wall is in the way
      path.push(best); tone([520 + Math.min(path.length, 40) * 12], { dur: 0.04, vol: 0.05 });
    }
    draw();
    if (same(path[path.length - 1], goal) && !done) win();
  }
  function win() {
    done = true; drawing = false;
    const up = gameLevelUp('path', 2);
    gameWin(pick(['You did it!', 'Great job!', 'Awesome job!']));
    later(() => endPanel(up ? 'You did it! Next: a bigger maze' : 'You did it!', goalE, null, up), 1300);
  }
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); if (done || !e.isPrimary || zoom.busy()) return;
    const t = cellAt(e); if (!t) return;
    // start from the hero (or anywhere already on the path: the path goes back to there)
    const i = path.findIndex((p) => same(p, t));
    if (i < 0) { if (Math.abs(t[0] - path[path.length - 1][0]) + Math.abs(t[1] - path[path.length - 1][1]) > 1) { sfx.no(); return; } }
    else path = path.slice(0, i + 1);
    drawing = true; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); moveTo(t);
  });
  cv.addEventListener('pointermove', (e) => { if (!drawing || done || zoom.busy()) { if (zoom.busy()) drawing = false; return; } for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) { const t = cellAt(ev); if (t) moveTo(t); } });
  const lift = () => (drawing = false); cv.addEventListener('pointerup', lift); cv.addEventListener('pointercancel', lift);
  area.querySelector('[data-a="hint"]').onclick = () => { sfx.tap(); hint = mazeRoute(W, start, goal); draw(); say('Follow the yellow dots!'); later(() => { hint = null; draw(); }, 2500); };
  area.querySelector('[data-a="new"]').onclick = () => { sfx.tap(); gameSession++; startPathMaze(); };
  draw();
  // for automated tests
  if (isQAMode() || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__pathMaze = { route: () => mazeRoute(W, start, goal), go: (cells) => { for (const t of cells) moveTo(t); }, done: () => done, session, type: 'rect', cols, rows };
}
