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
const PATH_SIZES = [[3, 4], [4, 5], [5, 6], [6, 7], [7, 9], [8, 10], [9, 12]];   // columns × rows per level
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
function startPathMaze() {
  const lv = GL('path'), [cols, rows] = PATH_SIZES[Math.min(lv, PATH_SIZES.length) - 1];
  const [hero, goalE, line] = pick(PATH_THEMES);
  const W = makeMaze(cols, rows), start = [0, 0], goal = [cols - 1, rows - 1];
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">${hero} → ${goalE} ${line}<small>Put your finger on ${hero} and draw the way.</small></div>
    <div class="cv-wrap"><canvas class="game-cv pm-cv"></canvas></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="hint">💡 Show me</button><button class="big-btn alt small" data-a="new">🔄 New maze</button></div>`;
  say([line, 'Draw the way with your finger!']);
  const cv = $('.pm-cv', area);
  const fit = fitCanvas(cv, 360), c = fit.c, w = fit.w;
  const cell = Math.floor(Math.min((w - 16) / cols, (fit.h - 16) / rows));
  // shrink the canvas to the maze, so no empty strip is left under it
  const h = cell * rows + 16, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.style.height = h + 'px'; cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ox = (w - cell * cols) / 2, oy = (h - cell * rows) / 2;
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
  const cellAt = (e) => { const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left - ox) / cell), y = Math.floor((e.clientY - r.top - oy) / cell); return x >= 0 && y >= 0 && x < cols && y < rows ? [x, y] : null; };
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
    e.preventDefault(); if (done) return;
    const t = cellAt(e); if (!t) return;
    // start from the hero (or anywhere already on the path: the path goes back to there)
    const i = path.findIndex((p) => same(p, t));
    if (i < 0) { if (Math.abs(t[0] - path[path.length - 1][0]) + Math.abs(t[1] - path[path.length - 1][1]) > 1) { sfx.no(); return; } }
    else path = path.slice(0, i + 1);
    drawing = true; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); moveTo(t);
  });
  cv.addEventListener('pointermove', (e) => { if (!drawing || done) return; for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) { const t = cellAt(ev); if (t) moveTo(t); } });
  const lift = () => (drawing = false); cv.addEventListener('pointerup', lift); cv.addEventListener('pointercancel', lift);
  area.querySelector('[data-a="hint"]').onclick = () => { sfx.tap(); hint = mazeRoute(W, start, goal); draw(); say('Follow the yellow dots!'); later(() => { hint = null; draw(); }, 2500); };
  area.querySelector('[data-a="new"]').onclick = () => { sfx.tap(); gameSession++; startPathMaze(); };
  draw();
  // for automated tests
  if (state.testMode || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__pathMaze = { route: () => mazeRoute(W, start, goal), go: (cells) => { for (const t of cells) moveTo(t); }, done: () => done, session };
}
