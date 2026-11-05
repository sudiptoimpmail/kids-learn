/* =========================================================
   ✍️ Letters & Numbers — trace A–Z, a–z and 1–20 with a finger
   The voice says "A is for apple" and shows the picture. Trace over the
   gray letter; when most of it is covered, a star is earned and the next
   letter comes. "Write" mode hides the guide for a bigger challenge.
   ========================================================= */
// how each letter name is spoken (the voice reads single letters oddly on their own)
const LETTER_SAY = { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', H: 'H', I: 'I', J: 'J', K: 'K', L: 'L', M: 'M',
  N: 'N', O: 'O', P: 'P', Q: 'Q', R: 'R', S: 'S', T: 'T', U: 'U', V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Z' };   // capital letters say their names (the voice fixes 'A is for…')
const ABC_BIG = [['apple', '🍎'], ['bear', '🐻'], ['cat', '🐱'], ['dog', '🐶'], ['egg', '🥚'], ['fish', '🐟'], ['grapes', '🍇'], ['hat', '🎩'], ['ice cream', '🍦'],
  ['juice', '🧃'], ['kite', '🪁'], ['lion', '🦁'], ['moon', '🌙'], ['nest', '🪺'], ['octopus', '🐙'], ['pig', '🐷'], ['queen', '👸'], ['rainbow', '🌈'], ['sun', '☀️'],
  ['tiger', '🐯'], ['umbrella', '☂️'], ['violin', '🎻'], ['whale', '🐳'], ['fox', '🦊'], ['yo-yo', '🪀'], ['zebra', '🦓']];
const ABC_SMALL = [['ant', '🐜'], ['bee', '🐝'], ['car', '🚗'], ['duck', '🦆'], ['elephant', '🐘'], ['frog', '🐸'], ['goat', '🐐'], ['horse', '🐴'], ['igloo', '🛖'],
  ['jet', '✈️'], ['key', '🔑'], ['leaf', '🍃'], ['monkey', '🐵'], ['nose', '👃'], ['owl', '🦉'], ['panda', '🐼'], ['quilt', '🛏️'], ['rabbit', '🐰'], ['snake', '🐍'],
  ['turtle', '🐢'], ['up', '⬆️'], ['van', '🚐'], ['watermelon', '🍉'], ['box', '📦'], ['yarn', '🧶'], ['zoo', '🦒']];
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const NUM_THINGS = [['apples', '🍎'], ['stars', '⭐'], ['balloons', '🎈'], ['ducks', '🦆'], ['cars', '🚗']];
const capWord = (s) => s[0].toUpperCase() + s.slice(1);

// pre-writing lines and shapes (fine motor): paths in a 0–1 box, from the first point to the last
const wave = (f, n = 80) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
const TRACE_LINES = [
  ['📏', 'Straight line', 'Straight line. Go from the top down.', '🧒', '🍦', wave((t) => [0.5, 0.12 + 0.76 * t], 20)],
  ['〰️', 'Wavy line', 'Wavy line. A wavy line goes up and down.', '⚾', '🧤', wave((t) => [0.1 + 0.8 * t, 0.5 - 0.16 * Math.sin(t * Math.PI * 4)])],
  ['⚡', 'Zigzag line', 'Zigzag line. Up, down, up, down.', '🐝', '🌻', [[0.1, 0.6], [0.26, 0.34], [0.42, 0.66], [0.58, 0.34], [0.74, 0.66], [0.9, 0.4]]],
  ['🌈', 'Bumpy line', 'Bumpy line. Hop, hop, hop!', '🐸', '🪷', wave((t) => [0.1 + 0.8 * t, 0.62 - 0.26 * Math.abs(Math.sin(t * Math.PI * 3))])],
  ['➰', 'Loopy line', 'Loopy line. Go round and round.', '🐌', '🍃', wave((t) => [0.14 + 0.62 * t + 0.1 * Math.sin(t * Math.PI * 6), 0.5 - 0.14 * Math.cos(t * Math.PI * 6)], 120)],
  ['⭕', 'Circle', 'Circle. A circle is round.', '', '', wave((t) => [0.5 + 0.34 * Math.sin(t * Math.PI * 2), 0.52 - 0.34 * Math.cos(t * Math.PI * 2)])],
  ['🟥', 'Square', 'Square. A square has 4 sides that are the same.', '', '', [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8], [0.2, 0.2]]],
  ['🔺', 'Triangle', 'Triangle. A triangle has 3 sides.', '', '', [[0.5, 0.15], [0.86, 0.82], [0.14, 0.82], [0.5, 0.15]]],
  ['▭', 'Rectangle', 'Rectangle. A rectangle has 2 long sides and 2 short sides.', '', '', [[0.1, 0.3], [0.9, 0.3], [0.9, 0.74], [0.1, 0.74], [0.1, 0.3]]],
  ['🥤', 'Straw path', 'Wavy line. A wavy line goes up and down.', '🧒', '🥤', wave((t) => [0.5 + 0.15 * Math.sin(t * Math.PI * 4), 0.14 + 0.73 * t], 80)],
];
// Grade 1 handwriting combines spelling patterns and fine-motor formation in the existing trace engine.
const TRACE_WORDS = [
  // Grade 1 vocabulary and consonant combinations from the illustrated
  // references, with natural prerecorded audio for every word below.
  ['fish','🐟'],['wash','🫧'],['bench','🪑'],['lunch','🥪'],['rock','🪨'],['sand','🏖️'],
  ['sick','🤒'],['rain','🌧️'],['cake','🍰'],['ship','⛵'],['chair','🪑'],['leaf','🍃'],
  ['wind','🌬️'],['jump','🐸'],['catch','🧤'],['bird','🐦'],['climb','🌳'],['water','💧'],
  ['wolf','🐺'],['thin','✏️'],['wheel','🛞'],['sheep','🐑'],['frog','🐸'],['brick','🧱'],
  ['grass','🌱'],['hand','✋'],['cat','🐱'],['dog','🐶'],['apple','🍎']
];
// [shown character, sentence on screen, what the voice says, picture, count, path (lines only), start and end pictures]
function traceItems(set) {
  if (set === 'words') return TRACE_WORDS.map(([word, picture]) => [word, word, word, picture, 0]);
  if (set === 'lines') return TRACE_LINES.map(([chip, name, spoken, a, b, path]) => [chip, name, spoken, a && b ? `${a} ➜ ${b}` : chip, 0, path, a, b]);
  if (set === 'num') return Array.from({ length: 20 }, (_, i) => {
    const n = i + 1, [things, e] = NUM_THINGS[i % NUM_THINGS.length];
    const w = n === 1 ? things.replace(/s$/, '') : things;
    return [String(n), `${n} ${w}`, `${capWord(NUM_WORDS[n])}. ${capWord(NUM_WORDS[n])} ${w}.`, e.repeat(n), n];
  });
  const list = set === 'big' ? ABC_BIG : ABC_SMALL;
  return list.map(([word, e], i) => {
    const L = String.fromCharCode(65 + i), ch = set === 'big' ? L : L.toLowerCase();
    const inWord = L === 'X';
    const shown = inWord ? `${ch} is in ${word}` : `${ch} is for ${word}`;
    const spoken = `${set === 'big' ? '' : 'Little '}${LETTER_SAY[L]}. ${LETTER_SAY[L]} ${inWord ? 'is in' : 'is for'} ${word}.`;
    return [ch, shown, spoken, e, 0];
  });
}

const TR = { set: 'big', i: 0, write: false };
// Zhang–Suen thinning: turns the filled letter into a 1-pixel middle line
function thin(src, M) {
  const a = Uint8Array.from(src), at = (x, y) => (x >= 0 && y >= 0 && x < M && y < M ? a[y * M + x] : 0);
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const del = [];
      for (let y = 1; y < M - 1; y++) for (let x = 1; x < M - 1; x++) {
        if (!a[y * M + x]) continue;
        const n = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
        const b = n.reduce((s, v) => s + v, 0); if (b < 2 || b > 6) continue;
        let t = 0; for (let i = 0; i < 8; i++) if (!n[i] && n[(i + 1) % 8]) t++; if (t !== 1) continue;
        if (step === 0 ? (n[0] && n[2] && n[4]) || (n[2] && n[4] && n[6]) : (n[0] && n[2] && n[6]) || (n[0] && n[4] && n[6])) continue;
        del.push(y * M + x);
      }
      if (del.length) { changed = true; for (const p of del) a[p] = 0; }
    }
  }
  return a;
}
const TRACE_FONT = '"Chalkboard SE", "Comic Sans MS", "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif';
function openTrace() {
  if (TR.set === 'words' && state.grade !== 'g1' && !state.showAll) TR.set = 'big';
  stopClip && stopClip();
  show('trace');
  renderTrace(true);
}
function traceDone(set, ch) { return !!(state.traced && state.traced[set + ch]); }
function renderTrace(speak) {
  const items = traceItems(TR.set), it = items[TR.i];
  const [ch, shown, spoken, pic, n] = it;
  $$('#trace .tr-tab').forEach((b) => {
    if (b.dataset.set === 'words') b.hidden = state.grade !== 'g1' && !state.showAll;
    b.classList.toggle('on', b.dataset.set === TR.set);
  });
  $('#trWrite').classList.toggle('on', TR.write);
  $('#trStrip').innerHTML = items.map((x, k) => `<button class="tr-chip ${k === TR.i ? 'now' : ''} ${traceDone(TR.set, x[0]) ? 'done' : ''}" data-k="${k}">${x[0]}</button>`).join('');
  const now = $('#trStrip .now'); if (now) now.scrollIntoView({ block: 'nearest', inline: 'center' });
  $('#trPic').innerHTML = `<div class="tr-emoji ${n > 5 ? 'many' : ''}">${pic}</div><div class="tr-word">${shown}</div>`;
  const pad = $('#trPad'), cv = $('#trCv'), guide = $('#trGuide');
  // The existing stroke-validation engine stays in charge; an original scene sits
  // behind its canvas for pre-writing motion paths, not in a separate game.
  pad.querySelector('.ia-trace-scene')?.remove();
  if ((TR.set === 'words' || TR.set === 'lines') && typeof IllustratedActivities !== 'undefined' &&
      (TR.set === 'words' || ['Wavy line','Bumpy line','Zigzag line','Straight line','Straw path'].includes(it[1]))) {
    const scene = document.createElement('div'); scene.className = 'ia-trace-scene';
    scene.innerHTML = IllustratedActivities.traceScene(TR.set === 'words' ? 'forest' : it[1] === 'Straw path' ? 'cafe' : it[1] === 'Straight line' ? 'garden' : 'sports');
    pad.insertBefore(scene, guide);
  }
  const W = pad.clientWidth;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  for (const c of [cv, guide]) { c.width = c.height = Math.round(W * dpr); c.style.width = c.style.height = W + 'px'; }
  // the guide: a big gray letter with a dotted middle line to follow
  const g = guide.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, W);
  const fs = TR.set === 'words' ? W * (ch.length >= 6 ? 0.19 : ch.length >= 5 ? 0.22 : 0.29) : ch.length > 1 ? W * 0.62 : W * 0.86;
  g.font = `bold ${fs}px ${TRACE_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const path = it[5], stroke = (ctx, size, lw) => { ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.beginPath(); path.forEach(([x, y], k) => (k ? ctx.lineTo(x * size, y * size) : ctx.moveTo(x * size, y * size))); ctx.stroke(); };
  // the shape to follow: a letter, or a line/shape path (thick gray band with a dotted middle, start and end pictures)
  const drawShape = () => {
    if (!path) {
      g.globalAlpha = TR.write ? 0.07 : 0.22; g.fillStyle = '#495057'; g.fillText(ch, W / 2, cy); g.globalAlpha = 1;
      if (!TR.write) { g.setLineDash([3, 9]); g.lineCap = 'round'; g.lineWidth = 4; g.strokeStyle = '#868e96'; g.strokeText(ch, W / 2, cy); g.setLineDash([]); }
      return;
    }
    g.globalAlpha = TR.write ? 0.07 : 0.22; g.strokeStyle = '#495057'; stroke(g, W, W * 0.085); g.globalAlpha = 1;
    if (!TR.write) { g.setLineDash([3, 10]); g.strokeStyle = '#868e96'; stroke(g, W, 4); g.setLineDash([]); }
    g.fillStyle = '#2f9e44'; g.beginPath(); g.arc(path[0][0] * W, path[0][1] * W, W * 0.022, 0, 7); g.fill();   // green dot: start here
    g.font = `${W * 0.11}px system-ui`;
    if (it[6]) g.fillText(it[6], path[0][0] * W, path[0][1] * W - W * 0.09);
    if (it[7]) { const e = path[path.length - 1]; g.fillText(it[7], e[0] * W, e[1] * W + W * 0.1); }
    g.font = `bold ${fs}px ${TRACE_FONT}`;
  };
  // writing lines like a school notebook
  g.strokeStyle = '#a5d8ff'; g.lineWidth = 2;
  const cy = W * 0.54;
  const notebook = () => {
    if (path) return;
    g.strokeStyle = '#a5d8ff'; g.lineWidth = 2;
    for (const y of [0.2, 0.84]) { g.beginPath(); g.moveTo(8, W * y); g.lineTo(W - 8, W * y); g.stroke(); }
    g.setLineDash([10, 10]); g.beginPath(); g.moveTo(8, W * 0.52); g.lineTo(W - 8, W * 0.52); g.stroke(); g.setLineDash([]);
  };
  notebook(); drawShape();
  // a mask of the letter or line (small, for checking how much was traced)
  const M = 96, mk = document.createElement('canvas'); mk.width = mk.height = M; const mc = mk.getContext('2d');
  if (path) { mc.strokeStyle = '#000'; stroke(mc, M, 8); }
  else { mc.font = `bold ${fs * M / W}px ${TRACE_FONT}`; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText(ch, M / 2, cy * M / W); }
  const md = mc.getImageData(0, 0, M, M).data, mask = new Uint8Array(M * M); let mcount = 0;
  for (let p = 0; p < M * M; p++) if (md[p * 4 + 3] > 100) { mask[p] = 1; mcount++; }
  // the letter's middle line (skeleton): every part of it must be traced, so no stroke can be skipped
  const skel = thin(mask, M), skelPts = [];
  for (let p = 0; p < M * M; p++) if (skel[p]) skelPts.push(p);
  // split the middle line into its strokes (pieces between crossings). Every stroke must be traced on its own:
  // the overall share is not enough, e.g. an A drawn as a tent (no crossbar) still covers most of the line.
  const nbrs = (p) => { const x = p % M, y = (p / M) | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < M && Y < M && skel[Y * M + X]) out.push(Y * M + X); } return out; };
  // a crossing: going round the 8 neighbours, the line is entered 3 or more separate times
  // (counting plain neighbours would also flag every step of a slanted line)
  const RING = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const on = (x, y) => x >= 0 && y >= 0 && x < M && y < M && !!skel[y * M + x];
  const crossings = (p) => { const x = p % M, y = (p / M) | 0; let n = 0; for (let k = 0; k < 8; k++) { const [ax, ay] = RING[k], [bx, by] = RING[(k + 1) % 8]; if (!on(x + ax, y + ay) && on(x + bx, y + by)) n++; } return n; };
  const joints = skelPts.filter((p) => crossings(p) >= 3);
  const nearJoint = (p) => joints.some((j) => Math.hypot(j % M - p % M, ((j / M) | 0) - ((p / M) | 0)) <= 6);
  const branches = [], seen = new Set(joints);
  for (const p0 of skelPts) {
    if (seen.has(p0)) continue;
    const comp = [], todo = [p0]; seen.add(p0);
    while (todo.length) { const p = todo.pop(); comp.push(p); for (const q of nbrs(p)) if (!seen.has(q)) { seen.add(q); todo.push(q); } }
    // only the part away from the crossings: near a crossing, ink on the other stroke already touches it
    const own = comp.filter((p) => !nearJoint(p));
    if (own.length >= 5) branches.push(own);
  }
  const drawGuide = (missing) => {
    g.clearRect(0, 0, W, W);
    notebook(); drawShape();
    // parts still to trace: orange dots along the middle of the letter
    if (missing && missing.length) { g.fillStyle = '#ff922b'; for (let k = 0; k < missing.length; k += 3) { const p = missing[k]; g.beginPath(); g.arc((p % M + 0.5) * W / M, (((p / M) | 0) + 0.5) * W / M, Math.max(4, W * 0.014), 0, 7); g.fill(); } }
  };
  // drawing
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineCap = c.lineJoin = 'round';
  const ink = TR.set === 'num' ? '#1c7ed6' : TR.set === 'big' ? '#e64980' : TR.set === 'lines' ? '#f76707' : '#2f9e44';
  const width = Math.max(22, W * 0.085);
  let strokes = [], cur = null, finished = false; const started = Date.now();
  const redraw = () => {
    c.clearRect(0, 0, W, W); c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = width;
    for (const s of strokes) {
      c.beginPath(); c.moveTo(s[0][0], s[0][1]);
      if (s.length === 1) { c.arc(s[0][0], s[0][1], width / 2, 0, 7); c.fill(); continue; }
      for (const p of s) c.lineTo(p[0], p[1]); c.stroke();
    }
  };
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (W / r.height)]; };
  cv.onpointerdown = (e) => { e.preventDefault(); if (finished) return; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); cur = [pt(e)]; strokes.push(cur); redraw(); };
  cv.onpointermove = (e) => { if (!cur) return; for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) cur.push(pt(ev)); redraw(); };
  cv.onpointerup = cv.onpointercancel = () => { if (!cur) return; cur = null; check(); };
  function check() {
    // draw the strokes small, then compare with the letter mask
    const t = document.createElement('canvas'); t.width = t.height = M; const tc = t.getContext('2d');
    tc.drawImage(cv, 0, 0, M, M);
    const td = tc.getImageData(0, 0, M, M).data;
    let hit = 0, ink2 = 0, out = 0;
    for (let p = 0; p < M * M; p++) {
      if (td[p * 4 + 3] < 60) continue;
      ink2++;
      if (mask[p]) hit++; else {
        // near the letter still counts (within 2 pixels of the small mask)
        const x = p % M, y = (p / M) | 0; let near = false;
        for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const q = (y + dy) * M + x + dx; if (q >= 0 && q < M * M && mask[q]) { near = true; break; } }
        if (!near) out++;
      }
    }
    // how much of the letter's middle line has ink on it (or right next to it)
    const inkAt = (x, y) => x >= 0 && y >= 0 && x < M && y < M && td[(y * M + x) * 4 + 3] >= 60;
    const missing = skelPts.filter((p) => { const x = p % M, y = (p / M) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inkAt(x + dx, y + dy)) return false; return true; });
    const cover = skelPts.length ? 1 - missing.length / skelPts.length : hit / mcount, stray = ink2 ? out / ink2 : 0;
    $("#trMeter").style.width = `${Math.min(100, Math.round(cover / 0.92 * 100))}%`;
    const miss = new Set(missing);
    const allStrokes = branches.every((b) => b.filter((p) => !miss.has(p)).length >= 0.75 * b.length);
    if (cover >= 0.92 && allStrokes && stray < 0.45) { drawGuide(null); win(); }
    else if (stray > 0.6 && ink2 > 200) { say(path ? 'Try to stay on the gray line!' : 'Try to stay on the gray letter!'); }
    else if (cover >= 0.3) drawGuide(missing);          // show the parts that still need tracing
  }
  function win() {
    finished = true;
    state.traced = state.traced || {}; state.traced[TR.set + ch] = 1;
    if (typeof logTrace === 'function') logTrace((Date.now() - started) / 1000);   // real time spent on this letter
    // tracing as part of today's quest: 3 letters, then back home with a check mark
    if (TR.quest && --TR.quest.left <= 0 && typeof questStepDone === 'function') { const qi = TR.quest.i; TR.quest = null; questStepDone(qi); setTimeout(() => { renderHome(); show('home'); }, 2600); }
    save();
    sfx.yes(); confetti(70);
    $('#trPic').classList.remove('cheer'); void $('#trPic').offsetWidth; $('#trPic').classList.add('cheer');
    say([pick(['Great tracing!', 'Beautiful!', 'You did it!', 'Super writing!']), spoken.split('. ')[1] || spoken]).then(() => {
      setTimeout(() => { if ($('#trace').classList.contains('active') && items[TR.i] === it) { TR.i = (TR.i + 1) % items.length; renderTrace(true); } }, 500);
    });
    renderStripOnly();
  }
  function renderStripOnly() { const b = $(`#trStrip [data-k="${TR.i}"]`); if (b) b.classList.add('done'); }
  $('#trClear').onclick = () => { sfx.tap(); strokes = []; finished = false; redraw(); drawGuide(null); $('#trMeter').style.width = '0%'; };
  $('#trMeter').style.width = '0%';
  if (speak) say(spoken.split('. ').map((x, k, a) => (k < a.length - 1 ? x + '.' : x)));
  const toXY = (p) => [(p % M + 0.5) * W / M, (((p / M) | 0) + 0.5) * W / M];
  if (testFeatureAvailable()) window.__trace = { it, check, skelPts: () => skelPts.map(toXY), branches: () => branches.map((b) => b.map(toXY)), strokesSet: (s) => { strokes = s; redraw(); check(); } }; // browser tests only
}
$('#trHome').onclick = () => { sfx.tap(); stopClip(); TR.quest = null;   // leaving ends the quest's tracing session (unfinished)
  renderHome(); show('home'); };
$('#trHear').onclick = () => { sfx.tap(); const it = traceItems(TR.set)[TR.i]; say(it[2].split('. ').map((x, k, a) => (k < a.length - 1 ? x + '.' : x))); };
$('#trPrev').onclick = () => { sfx.tap(); const n = traceItems(TR.set).length; TR.i = (TR.i - 1 + n) % n; renderTrace(true); };
$('#trNext').onclick = () => { sfx.tap(); const n = traceItems(TR.set).length; TR.i = (TR.i + 1) % n; renderTrace(true); };
$('#trWrite').onclick = () => { sfx.tap(); TR.write = !TR.write; renderTrace(false); say(TR.write ? 'Now write it on your own!' : 'Trace the gray letter!'); };
$$('#trace .tr-tab').forEach((b) => (b.onclick = () => { sfx.tap(); TR.set = b.dataset.set; TR.i = 0; renderTrace(true); }));
$('#trStrip').onclick = (e) => { const b = e.target.closest('.tr-chip'); if (!b) return; sfx.tap(); TR.i = +b.dataset.k; renderTrace(true); };
