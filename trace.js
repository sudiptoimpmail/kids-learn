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

// [shown character, sentence on screen, what the voice says, picture]
function traceItems(set) {
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
const TRACE_FONT = '"Chalkboard SE", "Comic Sans MS", "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif';
function openTrace() {
  stopClip && stopClip();
  show('trace');
  renderTrace(true);
}
function traceDone(set, ch) { return !!(state.traced && state.traced[set + ch]); }
function renderTrace(speak) {
  const items = traceItems(TR.set), it = items[TR.i];
  const [ch, shown, spoken, pic, n] = it;
  $$('#trace .tr-tab').forEach((b) => b.classList.toggle('on', b.dataset.set === TR.set));
  $('#trWrite').classList.toggle('on', TR.write);
  $('#trStrip').innerHTML = items.map((x, k) => `<button class="tr-chip ${k === TR.i ? 'now' : ''} ${traceDone(TR.set, x[0]) ? 'done' : ''}" data-k="${k}">${x[0]}</button>`).join('');
  const now = $('#trStrip .now'); if (now) now.scrollIntoView({ block: 'nearest', inline: 'center' });
  $('#trPic').innerHTML = `<div class="tr-emoji ${n > 5 ? 'many' : ''}">${pic}</div><div class="tr-word">${shown}</div>`;
  const pad = $('#trPad'), cv = $('#trCv'), guide = $('#trGuide');
  const W = pad.clientWidth;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  for (const c of [cv, guide]) { c.width = c.height = Math.round(W * dpr); c.style.width = c.style.height = W + 'px'; }
  // the guide: a big gray letter with a dotted middle line to follow
  const g = guide.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, W);
  const fs = ch.length > 1 ? W * 0.62 : W * 0.86;
  g.font = `bold ${fs}px ${TRACE_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  // writing lines like a school notebook
  g.strokeStyle = '#a5d8ff'; g.lineWidth = 2;
  for (const y of [0.2, 0.84]) { g.beginPath(); g.moveTo(8, W * y); g.lineTo(W - 8, W * y); g.stroke(); }
  g.setLineDash([10, 10]); g.beginPath(); g.moveTo(8, W * 0.52); g.lineTo(W - 8, W * 0.52); g.stroke(); g.setLineDash([]);
  const cy = W * 0.54;
  g.globalAlpha = TR.write ? 0.07 : 0.22; g.fillStyle = '#495057'; g.fillText(ch, W / 2, cy); g.globalAlpha = 1;
  if (!TR.write) { g.setLineDash([3, 9]); g.lineCap = 'round'; g.lineWidth = 4; g.strokeStyle = '#868e96'; g.strokeText(ch, W / 2, cy); g.setLineDash([]); }
  // a mask of the letter (small, for checking how much was traced)
  const M = 96, mk = document.createElement('canvas'); mk.width = mk.height = M; const mc = mk.getContext('2d');
  mc.font = `bold ${fs * M / W}px ${TRACE_FONT}`; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText(ch, M / 2, cy * M / W);
  const md = mc.getImageData(0, 0, M, M).data, mask = new Uint8Array(M * M); let mcount = 0;
  for (let p = 0; p < M * M; p++) if (md[p * 4 + 3] > 100) { mask[p] = 1; mcount++; }
  // drawing
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineCap = c.lineJoin = 'round';
  const ink = TR.set === 'num' ? '#1c7ed6' : TR.set === 'big' ? '#e64980' : '#2f9e44';
  const width = Math.max(22, W * 0.085);
  let strokes = [], cur = null, finished = false;
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
    const cover = hit / mcount, stray = ink2 ? out / ink2 : 0;
    $("#trMeter").style.width = `${Math.min(100, Math.round(cover / 0.45 * 100))}%`;
    if (cover >= 0.45 && stray < 0.45) win();
    else if (stray > 0.6 && ink2 > 200) { say('Try to stay on the gray letter!'); }
  }
  function win() {
    finished = true;
    state.traced = state.traced || {}; state.traced[TR.set + ch] = 1;
    if (typeof logAttempt === 'function') logAttempt({ ok: true, t0: Date.now() - 20000 }, 'trace', TR.set === 'num' ? 3 : TR.set === 'small' ? 2 : 1);
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
  $('#trClear').onclick = () => { sfx.tap(); strokes = []; finished = false; redraw(); $('#trMeter').style.width = '0%'; };
  $('#trMeter').style.width = '0%';
  if (speak) say(spoken.split('. ').map((x, k, a) => (k < a.length - 1 ? x + '.' : x)));
  window.__trace = { it, check, strokesSet: (s) => { strokes = s; redraw(); check(); } };   // used by automated tests
}
$('#trHome').onclick = () => { sfx.tap(); stopClip(); renderHome(); show('home'); };
$('#trHear').onclick = () => { sfx.tap(); const it = traceItems(TR.set)[TR.i]; say(it[2].split('. ').map((x, k, a) => (k < a.length - 1 ? x + '.' : x))); };
$('#trPrev').onclick = () => { sfx.tap(); const n = traceItems(TR.set).length; TR.i = (TR.i - 1 + n) % n; renderTrace(true); };
$('#trNext').onclick = () => { sfx.tap(); const n = traceItems(TR.set).length; TR.i = (TR.i + 1) % n; renderTrace(true); };
$('#trWrite').onclick = () => { sfx.tap(); TR.write = !TR.write; renderTrace(false); say(TR.write ? 'Now write it on your own!' : 'Trace the gray letter!'); };
$$('#trace .tr-tab').forEach((b) => (b.onclick = () => { sfx.tap(); TR.set = b.dataset.set; TR.i = 0; renderTrace(true); }));
$('#trStrip').onclick = (e) => { const b = e.target.closest('.tr-chip'); if (!b) return; sfx.tap(); TR.i = +b.dataset.k; renderTrace(true); };
