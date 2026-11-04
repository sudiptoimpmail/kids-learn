/* Circular Finger Mazes for upper grades. Uses the same recorded narration and
   scoring/session lifecycle as the existing rectangular Finger Maze.
   Each concentric ring is split into equal sectors; logical edges, rather than
   screen pixels, decide whether crossing a wall is legal. */
function radialNeighbors(id, rings, sectors) {
  const r = Math.floor(id / sectors), s = id % sectors, out = [
    r * sectors + (s + 1) % sectors,
    r * sectors + (s + sectors - 1) % sectors
  ];
  if (r > 0) out.push((r - 1) * sectors + s);
  if (r < rings - 1) out.push((r + 1) * sectors + s);
  return out;
}
function radialRoute(links, start, goal) {
  const previous = new Map([[start, -1]]), queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (node === goal) break;
    for (const next of links[node]) {
      if (!previous.has(next)) { previous.set(next, node); queue.push(next); }
    }
  }
  if (!previous.has(goal)) return [];
  const result = [];
  for (let i = goal; i !== -1; i = previous.get(i)) result.push(i);
  return result.reverse();
}
function makeRadialMaze(rings, sectors) {
  const start = (rings - 1) * sectors, goal = Math.floor(sectors / 2), count = rings * sectors;
  let best = null, longest = 0;
  // Generate several perfect mazes and select the one with the most challenging
  // start-to-goal route, so older children do not receive a trivial shortcut.
  for (let attempt = 0; attempt < 14; attempt++) {
    const links = Array.from({ length: count }, () => new Set());
    const visited = new Set([start]), stack = [start];
    while (stack.length) {
      const from = stack[stack.length - 1];
      const possible = radialNeighbors(from, rings, sectors).filter((n) => !visited.has(n));
      if (!possible.length) { stack.pop(); continue; }
      const to = possible[Math.floor(Math.random() * possible.length)];
      links[from].add(to); links[to].add(from);
      visited.add(to); stack.push(to);
    }
    const route = radialRoute(links, start, goal);
    if (route.length > longest) { longest = route.length; best = { rings, sectors, start, goal, links, route }; }
    if (route.length >= count * 0.45) break;
  }
  return best;
}
function startCircularMaze(level = GL('path')) {
  const rings = level >= 11 ? 8 : 6, sectors = level >= 11 ? 20 : 14;
  const model = makeRadialMaze(rings, sectors);
  const { links, start, goal, route } = model;
  const [hero, goalE, line] = pick(PATH_THEMES);
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">${hero} → ${goalE} ${line}<small>Follow the curved paths. Use two fingers to zoom or move the maze.</small></div>
    <div class="cv-wrap pm-view"><canvas class="game-cv pm-cv"></canvas></div>
    <div class="color-btns">
      <button class="big-btn alt small" data-a="hint">💡 Show me</button>
      <button class="big-btn alt small" data-a="new">🔄 New maze</button>
      <button class="big-btn alt small" data-a="zoom-in" aria-label="Zoom in">＋</button>
      <button class="big-btn alt small" data-a="zoom-out" aria-label="Zoom out">－</button>
    </div>`;
  say([line, 'Draw the way with your finger!']);
  const cv = $('.pm-cv', area), fit = fitCanvas(cv, 360), c = fit.c, w = fit.w;
  const h = w, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.style.height = h + 'px'; cv.height = Math.round(h * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const view = $('.pm-view', area);
  view.style.height = h + 'px';
  const zoom = zoomable(view, cv, { oneFingerPan: false });
  area.querySelector('[data-a="zoom-in"]').onclick = () => zoom.by(1.4);
  area.querySelector('[data-a="zoom-out"]').onclick = () => zoom.by(1 / 1.4);
  const cx = w / 2, cy = h / 2, inner = Math.max(27, w * 0.10), outer = w / 2 - 10;
  const dr = (outer - inner) / rings, da = Math.PI * 2 / sectors;
  const angle = (sector) => -Math.PI / 2 + sector * da;
  const polar = (radius, t) => [cx + radius * Math.cos(t), cy + radius * Math.sin(t)];
  const mid = (id) => {
    const r = Math.floor(id / sectors), s = id % sectors;
    return polar(inner + (r + 0.5) * dr, angle(s + 0.5));
  };
  const contains = (a, b) => links[a].has(b);
  let path = [start], drawing = false, done = false, hint = false;
  const session = gameSession;
  function draw() {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#fff9db'; c.beginPath(); c.arc(cx, cy, outer + 4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#4dabf7'; c.lineWidth = Math.max(5, dr * 0.38); c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); path.forEach((id, i) => {
      const [x, y] = mid(id);
      if (!i) { c.moveTo(x, y); return; }
      const from = path[i - 1], r0 = Math.floor(from / sectors), r1 = Math.floor(id / sectors);
      if (r0 === r1) {
        const a = angle((from % sectors) + 0.5), target = angle((id % sectors) + 0.5);
        const delta = ((target - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
        c.arc(cx, cy, inner + (r0 + 0.5) * dr, a, a + delta, delta < 0);
      } else c.lineTo(x, y);
    }); c.stroke();
    if (hint) {
      c.fillStyle = '#ffd43b';
      route.forEach((id) => {
        const [x, y] = mid(id);
        c.beginPath(); c.arc(x, y, Math.max(3, dr * 0.17), 0, Math.PI * 2); c.fill();
      });
    }
    // An arc is a wall separating two rings; a radial line separates sectors.
    c.beginPath(); c.strokeStyle = '#795548'; c.lineWidth = Math.max(3, dr * 0.16);
    for (let r = 0; r < rings; r++) for (let s = 0; s < sectors; s++) {
      const id = r * sectors + s, a = angle(s), b = angle(s + 1);
      const ri = inner + r * dr, ro = ri + dr;
      if (r === 0 || !contains(id, id - sectors)) {
        c.moveTo(...polar(ri, a)); c.arc(cx, cy, ri, a, b);
      }
      if (r === rings - 1) {
        c.moveTo(...polar(ro, a)); c.arc(cx, cy, ro, a, b);
      }
      const next = r * sectors + (s + 1) % sectors;
      if (!contains(id, next)) {
        c.moveTo(...polar(ri, b)); c.lineTo(...polar(ro, b));
      }
    }
    c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `${Math.max(13, dr * 0.72)}px system-ui, "Apple Color Emoji", "Noto Color Emoji"`;
    const [gx, gy] = mid(goal), [hx, hy] = mid(path[path.length - 1]);
    c.fillText(goalE, gx, gy); c.fillText(hero, hx, hy);
  }
  function cellAt(e) {
    const bounds = cv.getBoundingClientRect();
    const x = (e.clientX - bounds.left) * w / bounds.width - cx;
    const y = (e.clientY - bounds.top) * h / bounds.height - cy;
    const d = Math.hypot(x, y), ring = Math.floor((d - inner) / dr);
    if (ring < 0 || ring >= rings) return null;
    const theta = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    return ring * sectors + Math.min(sectors - 1, Math.floor(theta / da));
  }
  function moveTo(id) {
    if (done || id == null) return;
    const head = path[path.length - 1]; if (head === id) return;
    const old = path.indexOf(id);
    if (old >= 0) path = path.slice(0, old + 1);
    else if (contains(head, id)) path.push(id);
    else return; // an unconnected cell cannot be reached, even by jumping
    draw();
    if (path[path.length - 1] === goal && !done) {
      done = true; drawing = false;
      const up = gameLevelUp('path', 2);
      gameWin('You did it!');
      later(() => endPanel(up ? 'You did it! A harder maze awaits.' : 'You did it!', goalE, null, up), 1300);
    }
  }
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (done || !e.isPrimary || zoom.busy()) { drawing = false; return; }
    const cell = cellAt(e);
    if (cell == null || (cell !== path[path.length - 1] && !path.includes(cell) && !contains(path[path.length - 1], cell))) return;
    drawing = true;
    try { cv.setPointerCapture(e.pointerId); } catch {}
    moveTo(cell);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing || done || zoom.busy()) return;
    for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) moveTo(cellAt(ev));
  });
  cv.addEventListener('pointerup', () => { drawing = false; });
  cv.addEventListener('pointercancel', () => { drawing = false; });
  area.querySelector('[data-a="hint"]').onclick = () => {
    hint = true; draw(); say('Follow the yellow dots!');
    later(() => { hint = false; draw(); }, 2500);
  };
  area.querySelector('[data-a="new"]').onclick = () => { gameSession++; startCircularMaze(level); };
  draw();
  if (testFeatureAvailable()) window.__pathMaze = {
    circular: true, route: () => route.map((n) => n),
    go: (cells) => { for (const id of cells) moveTo(id); },
    done: () => done, session, model
  };
}
