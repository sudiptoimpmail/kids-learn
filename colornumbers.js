/* ======================= COLOR BY NUMBER (Coloring Book) =======================
   A picture cut into many segments. Each segment shows a short sum; the legend says which answer is which colour
   ("7 is pink"). The child works out the sum, picks that colour and taps the segment. The right colour fills it;
   a wrong one wobbles and nothing is lost. Every tap is saved; a finished picture celebrates once.
   Sums follow the child's grade (data/coloring-numbers.json "rules"): Pre-K reads the number itself, Kindergarten
   adds and takes away within 10, 1st grade within 20, 2nd grade with two-digit numbers, 3rd grade multiplies and divides.
   The same child always gets the same sums on a page, so a half-coloured picture makes sense when she comes back. */
const CBN_PAGES = ContentData.get('coloring-numbers', 'PAGES'), CBN_RULES = ContentData.get('coloring-numbers', 'rules');
// a small repeatable random number maker: the same page and grade always give the same sums
function cbnRandom(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) { h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
// every short sum whose answer is v, for one kind of rule
function cbnSums(v, rule) {
  const out = [];
  if (rule.kind === 'number') return [String(v)];
  if (rule.kind === 'addsub') {
    for (let a = 1; a < v; a++) out.push(`${a}+${v - a}`);
    for (let a = v + 1; a <= rule.max; a++) out.push(`${a}−${a - v}`);
  } else if (rule.kind === 'muldiv') {
    for (let a = 2; a <= rule.max; a++) if (v % a === 0 && v / a >= 2 && v / a <= rule.max) out.push(`${a}×${v / a}`);
    for (let k = 2; k <= rule.max; k++) if (v * k <= 100) out.push(`${v * k}÷${k}`);
  }
  return out.length ? out : [String(v)];
}
// which answer goes with which colour on this page, and the sum written in each segment
function cbnPlan(p, grade) {
  const rule = CBN_RULES[grade] || CBN_RULES.g3, rnd = cbnRandom(p.id + '|' + grade);
  const pool = rule.values.slice(), values = [];
  for (let i = 0; i < p.colors.length; i++) values.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  const used = values.map(() => []);
  const sums = p.paint.map((c) => {
    const all = cbnSums(values[c], rule), fresh = all.filter((s) => !used[c].includes(s)), pickFrom = fresh.length ? fresh : all;
    const s = pickFrom[Math.floor(rnd() * pickFrom.length)]; used[c].push(s); return s;
  });
  return { values, sums };
}
/* Where a sum can sit inside each segment: the middle of the largest clear circle in the part of the segment that
   is not covered by a later one (found by trying a grid of points). Returns [{ x, y, r }] per segment; r is 0 when
   a segment has no room at all. Worked out once per page. */
const cbnSpots = new Map();
function cbnLabelSpots(svg, p) {
  if (cbnSpots.has(p.id)) return cbnSpots.get(p.id);
  const regs = [...svg.querySelectorAll('.r')], boxes = regs.map((r) => r.getBBox()), pt = svg.createSVGPoint(), N = 22;
  // drawn details (eyes, smiles, sparkles) are kept clear too
  const marks = [...svg.querySelectorAll('.ln > *')].map((m) => m.getBBox()).map((b) => [b.x - 1.5, b.y - 1.5, b.x + b.width + 1.5, b.y + b.height + 1.5]);
  const marked = (x, y) => marks.some((m) => x > m[0] && y > m[1] && x < m[2] && y < m[3]);
  const inside = (i, x, y) => { const b = boxes[i]; if (x < b.x || y < b.y || x > b.x + b.width || y > b.y + b.height) return false; pt.x = x; pt.y = y; return regs[i].isPointInFill(pt); };
  const spots = regs.map((reg, i) => {
    const b = boxes[i], x0 = Math.max(0, b.x), y0 = Math.max(0, b.y), x1 = Math.min(p.vb, b.x + b.width), y1 = Math.min(p.vb, b.y + b.height);
    const sx = (x1 - x0) / N, sy = (y1 - y0) / N, grid = [];
    if (sx <= 0 || sy <= 0) return { x: 0, y: 0, r: 0 };
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
      const x = x0 + (gx + 0.5) * sx, y = y0 + (gy + 0.5) * sy;
      let ok = inside(i, x, y) && !marked(x, y);
      for (let j = i + 1; ok && j < regs.length; j++) if (inside(j, x, y)) ok = false;
      grid.push(ok);
    }
    // distance from each clear point to the nearest point that is not clear (or the edge of the frame)
    let best = { x: 0, y: 0, r: 0 };
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
      if (!grid[gy * N + gx]) continue;
      let d = Math.min((gx + 0.5) * sx, (N - gx - 0.5) * sx, (gy + 0.5) * sy, (N - gy - 0.5) * sy);
      for (let qy = 0; qy < N && d > best.r; qy++) for (let qx = 0; qx < N; qx++) {
        if (grid[qy * N + qx]) continue;
        const dd = Math.hypot((qx - gx) * sx, (qy - gy) * sy) - Math.max(sx, sy) / 2; if (dd < d) d = dd;
      }
      if (d > best.r) best = { x: x0 + (gx + 0.5) * sx, y: y0 + (gy + 0.5) * sy, r: d };
    }
    return best;
  });
  cbnSpots.set(p.id, spots);
  return spots;
}
const cbnInk = (hex) => { const n = parseInt(hex.slice(1), 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)); return l > 150 ? '#2b2140' : '#ffffff'; };
// the page as a picture: finished segments in their colour, the rest white (used by the picker too)
function cbnSVG(p, done = {}, cls = '') {
  let k = 0;
  const body = p.svg.replace(/class="r"/g, () => { const i = k++; return `class="r" data-k="${i}" style="fill:${done[i] ? p.colors[p.paint[i]][0] : '#ffffff'}"`; });
  return `<svg viewBox="0 0 ${p.vb} ${p.vb}" class="pic cbn-pic ${cls}">${body}<g class="cbn-labels"></g></svg>`;
}
function startColorByNumber(p) {
  state.cbn = state.cbn || {};
  const done = state.cbn[p.id] = state.cbn[p.id] || {};
  const grade = state.grade || 'k', plan = cbnPlan(p, grade), area = $('#gameArea');
  let cur = 0;
  const sw = (i) => `<button class="cbn-sw" data-c="${i}" style="--c:${p.colors[i][0]};--ink:${cbnInk(p.colors[i][0])}" aria-label="${plan.values[i]} is ${p.colors[i][1]}"><b>${plan.values[i]}</b></button>`;
  const order = p.colors.map((_, i) => i).sort((a, b) => plan.values[a] - plan.values[b]);
  area.innerHTML = `<div class="cb cbn">
    <div class="cb-pic"><div class="color-wrap cz-view"><div class="cz-inner">${cbnSVG(p, done, 'big')}</div></div></div>
    <div class="cb-rail" role="toolbar" aria-label="Colours for each answer">
      <button class="cb-btn" data-a="pics" aria-label="Pictures">🖼️</button>
      <div class="cbn-legend">${order.map(sw).join('')}</div>
      <div class="cb-row"><button class="cb-btn" data-a="hint" aria-label="Show me where this colour goes">💡</button><span class="cbn-count" aria-live="polite"></span></div>
    </div>
  </div>`;
  const svg = $('.color-wrap svg', area), regs = $$('.color-wrap .r', area), labels = svg.querySelector('.cbn-labels');
  const spots = cbnLabelSpots(svg, p);
  labels.innerHTML = regs.map((r, i) => {
    const s = spots[i], text = plan.sums[i]; if (!s.r) return '';
    const size = Math.max(4.5, Math.min(13, (2 * s.r * 0.98) / Math.hypot(text.length * 0.58, 1)));
    return `<text data-k="${i}" x="${s.x.toFixed(1)}" y="${s.y.toFixed(1)}" font-size="${size.toFixed(1)}"${done[i] ? ' hidden' : ''}>${text}</text>`;
  }).join('');
  const total = regs.length, count = area.querySelector('.cbn-count');
  const refresh = () => {
    $$('.cbn-sw', area).forEach((b) => b.classList.toggle('on', +b.dataset.c === cur));
    count.textContent = `${Object.keys(done).length} / ${total}`;
  };
  const tell = () => say([`${plan.values[cur]}`, 'is', `${p.colors[cur][1]}.`]);
  $$('.cbn-sw', area).forEach((b) => (b.onclick = () => { cur = +b.dataset.c; refresh(); sfx.tap(); tell(); }));
  const zoom = zoomable($('.cz-view', area), $('.cz-inner', area));
  const finished = () => {
    if (Object.keys(done).length < total) return;
    state.colored = state.colored || [];
    if (!state.colored.includes(p.id)) { state.colored.push(p.id); save(); gameLevelUp('color', 1); }
    gameWin('Beautiful picture!');
  };
  regs.forEach((r, i) => (r.onclick = () => {
    if (zoom.busy() || done[i]) return;
    if (p.paint[i] !== cur) {                                         // not this colour: wobble, and she checks the sum again
      sfx.no(); r.classList.remove('cbn-no'); void r.getBoundingClientRect(); r.classList.add('cbn-no');
      const t = labels.querySelector(`[data-k="${i}"]`); if (t) { t.classList.remove('cbn-look'); void t.getBoundingClientRect(); t.classList.add('cbn-look'); }
      return;
    }
    done[i] = 1; save();
    r.style.fill = p.colors[cur][0];
    const t = labels.querySelector(`[data-k="${i}"]`); if (t) t.setAttribute('hidden', '');
    r.classList.remove('splash'); void r.getBoundingClientRect(); r.classList.add('splash');
    paintRipple(r, p.colors[cur][0]);
    tone([500 + Math.random() * 400], { dur: 0.05, vol: 0.08 });
    refresh(); finished();
  }));
  // hint: the segments still waiting for the chosen colour glow for a moment
  area.querySelector('[data-a="hint"]').onclick = () => {
    sfx.tap();
    const left = regs.filter((r, i) => !done[i] && p.paint[i] === cur);
    if (!left.length) { say('Pick another color!'); return; }
    left.forEach((r) => { r.classList.remove('cbn-glow'); void r.getBoundingClientRect(); r.classList.add('cbn-glow'); });
    tell();
  };
  area.querySelector('[data-a="pics"]').onclick = () => { sfx.tap(); startColorPicker(); };
  cur = order.find((c) => regs.some((r, i) => !done[i] && p.paint[i] === c)) ?? order[0];
  refresh();
  say('Color by number! Work out each one, then paint it with its color.');
  if (testFeatureAvailable()) window.__cbn = { page: p, plan, spots, done, pick: (c) => { cur = c; refresh(); }, cur: () => cur };
}
