/* =========================================================
   🍕 Fractions · 📏 Measure & Graphs · extra Grade 2–3 math
   Shared skill bank for US (Common Core), Canada (Ontario), England,
   Australia (AC v9), New Zealand and India (NCERT). The country layer picks
   units (inches for the US, centimetres everywhere), money and words
   ("fourth" vs "quarter", "liters" vs "litres").
   Fractions  1 equal parts, halves/thirds/fourths · 2 fractions of a shape, pick the picture
              3 fractions on a number line, compare unit fractions · 4 equivalent, wholes, part of a set
   Measure    1 read a ruler · 2 ruler not at zero, how much longer, picture graph with a key
              3 area by squares, perimeter, bar graph, making change · 4 scaled bar graph, area = l × w, units of mass and capacity
   ========================================================= */
const M23_CC = () => (typeof countryCode === 'function' ? countryCode() : 'us');
const M23_QUARTER = () => !['us', 'ca', 'other'].includes(M23_CC());   // UK, AU, NZ, IE, IN say "quarter"
const M23_METRIC_ONLY = () => M23_CC() !== 'us';
const fracWord = (a, b) => {
  const den = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: M23_QUARTER() ? ['quarter', 'quarters'] : ['fourth', 'fourths'] }[b];
  const num = ['zero', 'one', 'two', 'three'][a];
  return den ? `${num} ${a === 1 ? den[0] : den[1]}` : `${a}/${b}`;
};
// a bar split into parts; unequal = parts of different widths
function m23Bar(parts, shaded, unequal = false, col = '#4dabf7') {
  let widths = Array.from({ length: parts }, () => 1);
  if (unequal) { widths = widths.map((_, i) => (i === 0 ? 2.2 : 1)); }
  const total = widths.reduce((s, w) => s + w, 0), W = 240;
  let x = 2;
  const rects = widths.map((w, i) => { const ww = (w / total) * (W - 4); const r = `<rect x="${x.toFixed(1)}" y="2" width="${ww.toFixed(1)}" height="56" fill="${i < shaded ? col : '#fff'}" stroke="#495057" stroke-width="2.5"/>`; x += ww; return r; });
  return `<svg viewBox="0 0 ${W} 60" class="m23-bar" role="img" aria-label="A bar cut into ${parts} ${unequal ? 'unequal' : 'equal'} parts">${rects.join('')}</svg>`;
}
// number line 0..1 (or 0..2) with b equal steps and a dot at a/b
function m23Line(a, b, wholes = 1) {
  const W = 300, x0 = 20, x1 = W - 20, steps = b * wholes, dx = (x1 - x0) / steps;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => `<line x1="${x0 + i * dx}" y1="${i % b ? 34 : 28}" x2="${x0 + i * dx}" y2="${i % b ? 50 : 56}" stroke="#343a40" stroke-width="${i % b ? 2 : 3}"/>`).join('');
  const labels = Array.from({ length: wholes + 1 }, (_, w) => `<text x="${x0 + w * b * dx}" y="76" text-anchor="middle" font-size="18" font-weight="800" fill="#343a40">${w}</text>`).join('');
  return `<svg viewBox="0 0 ${W} 84" class="m23-line" role="img" aria-label="A number line from 0 to ${wholes} cut into ${b} equal parts">
    <line x1="${x0}" y1="42" x2="${x1}" y2="42" stroke="#343a40" stroke-width="3"/>${ticks}${labels}
    <circle cx="${x0 + a * dx}" cy="42" r="9" fill="#e64980" stroke="#fff" stroke-width="3"/></svg>`;
}
// Equivalent fractions are the SAME answer, even when they have different
// numerators and denominators (for example 1/2 and 2/4).
const m23FractionValue = value => {
  const m = /^([0-9]+)\/([1-9][0-9]*)$/.exec(String(value).trim());
  return m ? Number(m[1]) / Number(m[2]) : null;
};
const m23DifferentFraction = (a, b) => {
  const x = m23FractionValue(a), y = m23FractionValue(b);
  return x == null || y == null ? String(a) !== String(b) : Math.abs(x - y) > 1e-10;
};
const m23Q = (key, text, say, main, answer, wrong, level, optClass = 'opt-text') => {
  const n = level >= 2 ? 3 : 2;
  const candidates = [...new Set(wrong.map(String))].filter(x => m23DifferentFraction(x, answer));
  const distinct = [];
  for (const candidate of shuffle(candidates)) {
    if (distinct.every(x => m23DifferentFraction(x, candidate))) distinct.push(candidate);
  }
  // A numeric-fraction exercise can always generate enough distinct wrong
  // answers without offering a second equivalent correct fraction.
  if (m23FractionValue(answer) != null) {
    const [numerator, denominator] = String(answer).split('/').map(Number);
    for (let k = 1; distinct.length < n && k < 30; k++) {
      const extra = frac(numerator + k, denominator);
      if (m23DifferentFraction(extra, answer) && distinct.every(x => m23DifferentFraction(x, extra))) distinct.push(extra);
    }
  }
  const opts = shuffle([String(answer), ...distinct.slice(0, n)]);
  return { key, text, say, main, mainClass: 'ph-main', answer: String(answer), optClass,
    options: opts.map((o) => ({ v: o, html: /^\d+\/\d+$/.test(o) ? fracHTML(...o.split('/')) : o })),
    hint: { html: '', say: 'Think about it!', remove: true } };
};

function genFractions(level) {
  const t = Math.random();
  if (level === 1) {
    if (t < 0.35) {
      const parts = pick([2, 3, 4]), unequal = Math.random() < 0.5;
      return m23Q(`frac-equal-${parts}-${unequal}`, 'Are the parts equal?', 'Are the parts equal?',
        m23Bar(parts, 0, unequal), unequal ? 'not equal' : 'equal', [unequal ? 'equal' : 'not equal'], 1, 'opt-text two');
    }
    const b = pick([2, 3, 4]), a = b === 2 ? 1 : 1 + rand(b - 1), pie = Math.random() < 0.5;
    const ans = fracWord(a, b);
    const wrong = [fracWord(1, 2), fracWord(1, 3), fracWord(1, 4), fracWord(Math.min(a + 1, b - 1) || 1, b), fracWord(b - a, b)];
    return m23Q(`frac-word-${a}-${b}-${pie}`, 'What fraction is colored?', 'What fraction is colored?',
      pie ? nsPie(b, a) : m23Bar(b, a), ans, wrong, 2);
  }
  if (level === 2) {
    const b = pick([2, 3, 4, 6, 8]), a = 1 + rand(b - 1);
    if (t < 0.5) {
      return m23Q(`frac-name-${a}-${b}`, 'What fraction is colored?', 'What fraction is colored?',
        Math.random() < 0.5 ? nsPie(b, a) : m23Bar(b, a), frac(a, b),
        [frac(b - a, b), frac(a, b + 1), frac(b, a), frac(a + 1, b)].filter((x) => !/^0\//.test(x)), level, 'opt-num');
    }
    const pool = [[b - a, b], [a, b + 2], [Math.max(1, a - 1), b], [a, Math.max(2, b - 1)], [Math.min(b - 1, a + 1), b], [1, b + 1]]
      .filter(([x, y]) => x > 0 && x < y && x * b !== a * y)
      .filter(([x, y], i, all) => all.findIndex(([u, v]) => u === x && v === y) === i);
    const others = sample(pool, 3);
    const cands = shuffle([[a, b], ...others]);
    return { key: `frac-pick-${a}-${b}`, text: `Which picture shows ${fracHTML(a, b)}?`, say: 'Which picture shows this fraction?',
      main: `<div class="ns-big">${fracHTML(a, b)}</div>`, mainClass: 'ph-main', answer: frac(a, b), optClass: 'opt-svg',
      options: cands.map(([x, y]) => ({ v: frac(x, y), html: m23Bar(y, x) })), hint: { html: `<div class="hint-note">Count the parts: ${b}.<br>Colour ${a} of them.</div>`, say: 'Think about it!' } };
  }
  if (level === 3) {
    if (t < 0.55) {
      const b = pick([2, 3, 4, 6, 8]), wholes = Math.random() < 0.25 ? 2 : 1, a = 1 + rand(b * wholes - 1);
      return m23Q(`frac-line-${a}-${b}-${wholes}`, 'What fraction is at the dot?', 'What fraction is at the dot?',
        m23Line(a, b, wholes), frac(a, b), [frac(a + 1, b), frac(Math.max(1, a - 1), b), frac(a, b + 1), frac(b, a)], level, 'opt-num');
    }
    const [x, y] = sample([2, 3, 4, 6, 8], 2);
    const sign = 1 / x > 1 / y ? '>' : '<';
    return { key: `frac-cmp-${x}-${y}`, text: 'Which sign makes it true?', say: 'Which sign makes it true?',
      main: `<div class="m23-cmp"><div>${m23Bar(x, 1, false, '#ff922b')}<div class="ns-big">${fracHTML(1, x)}</div></div><span class="ns-gap">?</span><div>${m23Bar(y, 1, false, '#ff922b')}<div class="ns-big">${fracHTML(1, y)}</div></div></div>`,
      mainClass: 'ph-main', answer: sign, optClass: 'opt-num', options: ['>', '<', '='].map((v) => ({ v, html: v })),
      hint: { html: '<div class="hint-note">More parts means each part is smaller.</div>', say: 'Think about it!' } };
  }
  // level 4
  if (t < 0.4) {
    const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]), m = pick([2, 3, 4].filter((k) => b * k <= 12));
    return { key: `frac-eq-${a}-${b}-${m}`, text: `Which fraction is the same as ${fracHTML(a, b)}?`, say: 'Which fraction is the same?',
      main: `<div class="m23-eq">${m23Bar(b, a, false, '#51cf66')}<div class="ns-big">${fracHTML(a, b)} = ?</div>${m23Bar(b * m, a * m, false, '#51cf66')}</div>`, mainClass: 'ph-main',
      answer: frac(a * m, b * m), optClass: 'opt-num',
      options: shuffle([frac(a * m, b * m), frac(a + m, b + m), frac(a * m, b), frac(a, b * m)]).map((v) => ({ v, html: fracHTML(...v.split('/')) })),
      hint: { html: '<div class="hint-note">The same amount is coloured in both bars.</div>', say: 'Think about it!' } };
  }
  if (t < 0.7) {
    const b = pick([2, 3, 4, 6, 8]), w = pick([1, 1, 2, 3]);
    return m23Q(`frac-whole-${w}-${b}`, `${fracHTML(w * b, b)} = ?`, 'Find the answer!', `<div class="ns-big">${fracHTML(w * b, b)} = ?</div>`,
      w, [w * b, b, w + 1, 0, w * 2].filter((x) => x !== w), level, 'opt-num');
  }
  const d = pick([2, 3, 4]), each = 2 + rand(4), whole = d * each, [e, things] = pick(THINGS);
  return m23Q(`frac-set-${d}-${whole}`, `What is ${fracHTML(1, d)} of ${whole} ${things}?`, 'Find the answer!',
    `<div class="groups">${Array.from({ length: d }, () => `<div class="grp">${objects(e, each)}</div>`).join('')}</div>`, each,
    [each + 1, each - 1, whole, d, each * 2].filter((x) => x > 0 && x !== each), level, 'opt-num');
}

/* ---------- Measure & Graphs ---------- */
function m23Unit() {
  // US children measure in inches and centimetres; everyone else in centimetres
  return !M23_METRIC_ONLY() && Math.random() < 0.6 ? { s: 'in', word: 'inches' } : { s: 'cm', word: 'centimeters' };
}
function m23Ruler(from, to, unit, max = 12, col = '#ff922b') {
  const W = 330, x0 = 15, dx = (W - 30) / max;
  const ticks = Array.from({ length: max + 1 }, (_, i) => `<line x1="${x0 + i * dx}" y1="56" x2="${x0 + i * dx}" y2="${i % 5 === 0 ? 76 : 70}" stroke="#495057" stroke-width="2"/><text x="${x0 + i * dx}" y="92" text-anchor="middle" font-size="13" font-weight="700" fill="#495057">${i}</text>`).join('');
  return `<svg viewBox="0 0 ${W} 104" class="m23-ruler" role="img" aria-label="An object above a ruler marked in ${unit.word}">
    <rect x="${x0 + from * dx}" y="18" width="${(to - from) * dx}" height="24" rx="12" fill="${col}"/>
    <rect x="${x0 + from * dx}" y="18" width="${Math.min(14, (to - from) * dx)}" height="24" rx="6" fill="#fff" fill-opacity=".45"/>
    <rect x="4" y="54" width="${W - 8}" height="46" rx="6" fill="#fff3bf" stroke="#e8b923" stroke-width="2"/>${ticks}
    <text x="${W - 12}" y="70" text-anchor="end" font-size="12" font-weight="800" fill="#868e96">${unit.s}</text></svg>`;
}
function m23BarGraph(labels, values, scale, horizontalKey = '') {
  const max = Math.max(...values), top = Math.ceil(max / scale) * scale, H = 150, W = 300, x0 = 40, bw = 44, gap = (W - x0 - labels.length * bw) / (labels.length + 1);
  const y = (v) => 10 + H - (v / top) * H;
  const grid = Array.from({ length: top / scale + 1 }, (_, i) => `<line x1="${x0}" y1="${y(i * scale)}" x2="${W}" y2="${y(i * scale)}" stroke="#dee2e6"/><text x="${x0 - 6}" y="${y(i * scale) + 4}" text-anchor="end" font-size="12" fill="#495057">${i * scale}</text>`).join('');
  const bars = labels.map((l, i) => { const x = x0 + gap + i * (bw + gap); return `<rect x="${x}" y="${y(values[i])}" width="${bw}" height="${10 + H - y(values[i])}" rx="4" fill="${NS_COLORS[i % NS_COLORS.length]}"/><text x="${x + bw / 2}" y="${H + 30}" text-anchor="middle" font-size="13" font-weight="700" fill="#343a40">${l}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H + 40}" class="m23-graph" role="img" aria-label="Bar graph: ${labels.map((l, i) => l + ' ' + values[i]).join(', ')}">${grid}${bars}</svg>${horizontalKey}`;
}
function m23Shape(cells) {
  const S = 26, maxX = Math.max(...cells.map((c) => c[0])) + 1, maxY = Math.max(...cells.map((c) => c[1])) + 1;
  return `<svg viewBox="-2 -2 ${maxX * S + 4} ${maxY * S + 4}" class="m23-area" role="img" aria-label="A shape made of ${cells.length} squares">${cells.map(([x, y]) => `<rect x="${x * S}" y="${y * S}" width="${S}" height="${S}" fill="#a5d8ff" stroke="#1c7ed6" stroke-width="2"/>`).join('')}</svg>`;
}
const m23Liters = () => (M23_CC() === 'us' ? ['liters', 'milliliters'] : ['litres', 'millilitres']);

function genMeasure(level) {
  const t = Math.random(), unit = m23Unit(), C = (typeof myCountry === 'function' && myCountry()) || COUNTRIES.us;
  const things = ['pencil', 'crayon', 'leaf', 'key', 'spoon', 'ribbon', 'worm', 'feather'];
  if (level === 1 || (level === 2 && t < 0.35)) {
    const from = level === 1 ? 0 : 1 + rand(4), len = 2 + rand(level === 1 ? 9 : 6), obj = pick(things);
    return m23Q(`ms-ruler-${from}-${len}-${unit.s}`, `How long is the ${obj}?`, 'How long is it?', m23Ruler(from, from + len, unit),
      `${len} ${unit.s}`, [`${from + len} ${unit.s}`, `${len + 1} ${unit.s}`, `${len - 1} ${unit.s}`, `${from} ${unit.s}`].filter((x) => !x.startsWith('0 ')), level, 'opt-num');
  }
  if (level === 2) {
    if (t < 0.65) {
      const a = 3 + rand(9), b = 1 + rand(a - 2);
      return m23Q(`ms-longer-${a}-${b}-${unit.s}`, 'How much longer is the orange ribbon than the blue one?', 'How much longer?',
        `${m23Ruler(0, a, unit)}${m23Ruler(0, b, unit, 12, '#4dabf7')}`, `${a - b} ${unit.s}`, [`${a} ${unit.s}`, `${b} ${unit.s}`, `${a + b} ${unit.s}`, `${a - b + 1} ${unit.s}`], level, 'opt-num');
    }
    const labels = sample(['🍎 apple', '🍌 banana', '🍇 grapes', '🍓 strawberry'], 3), per = 2;
    let pics; do { pics = labels.map(() => 1 + rand(5)); } while (new Set(pics).size < 3);
    const i = rand(3), ans = pics[i] * per;
    const graph = `<div class="m23-pict">${labels.map((l, k) => `<div><span>${l}</span><b>${'⭐'.repeat(pics[k])}</b></div>`).join('')}<small>Key: ⭐ = ${per} votes</small></div>`;
    return m23Q(`ms-pict-${pics.join('')}-${i}`, `How many votes did ${labels[i].split(' ')[1]} get?`, 'Find the answer!', graph, ans,
      [pics[i], ans + per, ans - per, ans + 1].filter((x) => x > 0), level, 'opt-num');
  }
  if (level === 3) {
    if (t < 0.3) {
      const w = 2 + rand(4), h = 2 + rand(3), cut = Math.random() < 0.6;
      let cells = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells.push([x, y]);
      if (cut) { const cw = 1 + rand(w - 1), ch = 1 + rand(h - 1); cells = cells.filter(([x, y]) => !(x >= w - cw && y < ch)); }
      return m23Q(`ms-area-${cells.length}-${w}-${h}`, 'How many square units cover this shape?', 'How many square units?', m23Shape(cells), cells.length,
        [cells.length + 1, cells.length - 1, cells.length + 2, w * h === cells.length ? 2 * (w + h) : w * h], level, 'opt-num');
    }
    if (t < 0.55) {
      const w = 2 + rand(9), h = 2 + rand(7), p = 2 * (w + h);
      return m23Q(`ms-per-${w}-${h}-${unit.s}`, `What is the perimeter of this rectangle?`, 'What is the perimeter?',
        `<div class="m23-rect" style="--w:${Math.min(240, 24 * w)}px;--h:${Math.min(150, 24 * h)}px"><span class="m23-top">${w} ${unit.s}</span><span class="m23-side">${h} ${unit.s}</span></div>`,
        `${p} ${unit.s}`, [`${w + h} ${unit.s}`, `${w * h} ${unit.s}`, `${p + 2} ${unit.s}`, `${p - 2} ${unit.s}`], level, 'opt-num');
    }
    if (t < 0.8) {
      const labels = sample(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 4).sort((a, b) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(a) - ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(b));
      let vals; do { vals = labels.map(() => 2 * (1 + rand(8))); } while (new Set(vals).size < 4);
      const i = rand(4), j = (i + 1 + rand(3)) % 4, more = Math.abs(vals[i] - vals[j]), hi = vals[i] > vals[j] ? i : j, lo = hi === i ? j : i;
      return m23Q(`ms-bar-${vals.join('-')}-${i}${j}`, `Books read in a week. How many more on ${labels[hi]} than on ${labels[lo]}?`, 'How many more?',
        m23BarGraph(labels, vals, 2), more, [vals[hi], vals[lo], more + 2, more - 2, vals[hi] + vals[lo]].filter((x) => x > 0), level, 'opt-num');
    }
    // making change, with each country's cash rounding
    const step = { us: 5, ca: 5, au: 5, nz: 10, uk: 5, ie: 5, in: 100 }[M23_CC()] || 5;
    const big = M23_CC() === 'in' ? pick([5000, 10000]) : 100, price = step * (1 + rand(big / step - 1)), change = big - price;
    const toy = pick(['a toy car', 'a ball', 'a book', 'a juice box', 'a yo-yo', 'a sticker book']);
    return m23Q(`ms-change-${M23_CC()}-${price}`, `${toy[0].toUpperCase() + toy.slice(1)} costs <b>${C.fmt(price)}</b>. You pay with <b>${C.fmt(big)}</b>. How much change do you get?`,
      'How much change?', `<div class="ns-big">${C.fmt(big)} − ${C.fmt(price)}</div>`, C.fmt(change),
      [C.fmt(price), C.fmt(change + step), C.fmt(Math.max(step, change - step)), C.fmt(big - change + step)], level, 'opt-num');
  }
  // level 4
  if (t < 0.35) {
    const scale = pick([5, 10]), labels = sample(['🐶 dogs', '🐱 cats', '🐟 fish', '🐰 rabbits'], 3).map((s) => s.split(' ')[1]);
    let vals; do { vals = labels.map(() => scale * (1 + rand(8))); } while (new Set(vals).size < 3);
    const total = vals.reduce((s, v) => s + v, 0);
    return Math.random() < 0.5
      ? m23Q(`ms-sbar-tot-${vals.join('-')}`, 'Pets owned by a class survey. How many pets in all?', 'How many in all?', m23BarGraph(labels, vals, scale), total,
        [total + scale, total - scale, Math.max(...vals), total + 1], level, 'opt-num')
      : m23Q(`ms-sbar-${vals.join('-')}`, `How many more ${labels[vals.indexOf(Math.max(...vals))]} than ${labels[vals.indexOf(Math.min(...vals))]}?`, 'How many more?',
        m23BarGraph(labels, vals, scale), Math.max(...vals) - Math.min(...vals), [Math.max(...vals), Math.min(...vals), Math.max(...vals) - Math.min(...vals) + scale, scale], level, 'opt-num');
  }
  if (t < 0.65) {
    const w = 3 + rand(7), h = 2 + rand(6), a = w * h, u = M23_METRIC_ONLY() ? pick(['cm', 'm']) : pick(['cm', 'm', 'ft', 'in']);
    return m23Q(`ms-arear-${w}-${h}-${u}`, `What is the area of the rectangle?`, 'What is the area?',
      `<div class="m23-rect" style="--w:${Math.min(240, 24 * w)}px;--h:${Math.min(150, 24 * h)}px"><span class="m23-top">${w} ${u}</span><span class="m23-side">${h} ${u}</span></div>`,
      `${a} sq ${u}`, [`${2 * (w + h)} sq ${u}`, `${w + h} sq ${u}`, `${a + w} sq ${u}`, `${a - h} sq ${u}`], level, 'opt-num');
  }
  const [L, mL] = m23Liters();
  const items = [['a bathtub of water', L, mL], ['a spoonful of medicine', mL, L], ['a big pot of soup', L, mL], ['a drop of rain', mL, L],
    ['a dog', 'kilograms', 'grams'], ['a paper clip', 'grams', 'kilograms'], ['a bag of potatoes', 'kilograms', 'grams'], ['a pencil', 'grams', 'kilograms']];
  const [thing, right, wrongU] = pick(items);
  return m23Q(`ms-units-${thing}`, `Which unit would you use to measure ${thing}?`, 'Find the answer!', '<div class="ns-big">⚖️ 🧪</div>', right, [wrongU], level, 'opt-text two');
}

/* ---------- Clock: to the minute, elapsed time, 24-hour time (UK, Ireland) ---------- */
function genClockPlus(level) {
  if (level < 6) return genClock(level);
  const t = Math.random();
  if (t < 0.3 && ['uk', 'ie'].includes(M23_CC())) {
    const h = 1 + rand(11), m = 5 * rand(12), pm = Math.random() < 0.7;
    const ans = `${String(pm ? h + 12 : h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return m23Q(`clk-24-${h}-${m}-${pm}`, `What is <b>${timeStr(h, m)} ${pm ? 'p.m.' : 'a.m.'}</b> in 24-hour time?`, 'What is the time in 24-hour time?',
      `<div class="digital">${timeStr(h, m)} ${pm ? 'pm' : 'am'}</div>`, ans,
      [`${String(pm ? h : h + 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, `${String((pm ? h + 12 : h) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`, `${String(pm ? h + 10 : h + 2).padStart(2, '0')}:${String(m).padStart(2, '0')}`], level, 'opt-num');
  }
  const h = 1 + rand(10), m = 5 * rand(12), dur = pick([15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const end = h * 60 + m + dur, eh = Math.floor(end / 60), em = end % 60;
  const ans = timeStr(((eh - 1) % 12) + 1, em);
  const what = pick(['The movie', 'Soccer practice', 'The art class', 'The bus ride', 'Story time']);
  return { key: `clk-el-${h}-${m}-${dur}`, text: `${what} starts at <b>${timeStr(h, m)}</b>. It lasts <b>${dur} minutes</b>. When does it end?`,
    say: 'When does it end?', main: clockSVG(h, m), mainClass: '', answer: ans, optClass: 'opt-num clock-opts',
    options: shuffle([ans, timeStr(h, Math.min(59, dur)), timeStr(((eh) % 12) + 1, em), timeStr(((eh - 1) % 12) + 1, (em + 10) % 60)].filter((v, i, a) => a.indexOf(v) === i)).map((v) => ({ v, html: v })),
    hint: { html: `<div class="hint-note">Start at ${timeStr(h, m)}. Count on ${dur} minutes.</div>`, say: 'Count on the minutes!' } };
}

/* ---------- Multiply level 6: × tens, 11–12 times tables (UK, AU, NZ, IE, IN), two steps ---------- */
function genMulPlus(level) {
  if (level < 6) return genMul(level);
  const t = Math.random(), twelve = !['us', 'ca'].includes(M23_CC());
  if (t < 0.35) {
    const a = 2 + rand(8), b = 10 * (2 + rand(8)), c = a * b;
    return { key: `mul6t-${a}-${b}`, text: 'Multiply!', say: ['What is', `${a}`, 'times', `${b}?`], main: `<div class="equation">${a} × ${b} = <span class="qmark">?</span></div>`,
      options: numberOptions(c, 6), answer: c, optClass: 'opt-num', hint: { html: `<div class="hint-note big">${a} × ${b / 10} = ${a * b / 10}<br>so ${a} × ${b} = ${c}</div>`, say: 'Multiply, then add a zero!' } };
  }
  if (t < 0.6 && twelve) {
    const a = pick([11, 12]), b = 2 + rand(11), c = a * b;
    return { key: `mul6x-${a}-${b}`, text: 'Multiply!', say: ['What is', `${b}`, 'times', `${a}?`], main: `<div class="equation">${b} × ${a} = <span class="qmark">?</span></div>`,
      options: numberOptions(c, 6), answer: c, optClass: 'opt-num', hint: { html: `<div class="hint-note big">${b} × 10 = ${b * 10}<br>${b} × ${a - 10} = ${b * (a - 10)}<br>${b * 10} + ${b * (a - 10)} = ${c}</div>`, say: 'Count by groups!' } };
  }
  const boxes = 3 + rand(6), each = 3 + rand(7), gone = 1 + rand(Math.min(9, boxes * each - 2)), ans = boxes * each - gone;
  const [e, things] = pick(THINGS);
  return { key: `mul6s-${boxes}-${each}-${gone}`, text: '📝 Read the story',
    say: 'Read the story, then find the answer!',
    main: `<div class="story">There are ${boxes} boxes with ${each} ${things} ${e} in each box.<br>${gone} ${things} get lost.<br>How many ${things} are left?</div>`,
    options: numberOptions(ans, 5), answer: ans, optClass: 'opt-num',
    hint: { html: `<div class="hint-note big">${boxes} × ${each} = ${boxes * each}<br>${boxes * each} − ${gone} = ${ans}</div>`, say: 'Multiply first, then take away!' } };
}

/* ---------- Roman numerals I–XII on clocks (England Year 3) mixed into Number Sense ---------- */
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
function genNumSensePlus(level) {
  if (level >= 3 && ['uk', 'ie'].includes(M23_CC()) && Math.random() < 0.15) {
    const n = 1 + rand(12);
    return m23Q(`ns-roman-${n}`, `What number is <b>${ROMAN[n]}</b>?`, 'What number is this?', `<div class="ns-big">${ROMAN[n]}</div>`, n,
      [n + 1, n - 1, n + 5, n === 4 ? 6 : n === 9 ? 11 : n + 2].filter((x) => x > 0 && x <= 15), level, 'opt-num');
  }
  return genNumSense(level);
}
