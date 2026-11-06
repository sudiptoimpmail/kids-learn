/* =========================================================
   Build it: the child makes the answer instead of picking it.
     Ten frame (Pre-K, K adding)   — tap squares to put that many counters on a ten frame
     Place value (Number Sense)    — tap hundreds, tens and ones blocks to build a number
     Array (Multiply)              — add rows and columns to make "3 rows of 4"
     Fraction (Fractions)          — tap parts of a shape to colour 3/4
     Clock (Clock)                 — move the hands to show a time
   A share of each section's cards becomes a build card; "Check" counts as a try, and the
   same first-try, hint and mastery rules apply as every other card.
   ========================================================= */
(() => {
  const card = (key, text, say, build, hint) => ({ key, text, say, main: `<div class="bld-target">${build.show}</div>`, options: [], answer: 'built', optClass: 'spell-tray', build, hint: { html: '', say: hint } });

  const tenFrame = (level) => {
    const n = level <= 1 ? 1 + rand(5) : 1 + rand(10);
    return card(`bld-tf-${n}`, 'Put this many on the ten frame!', ['Put this many on the ten frame!', String(n)],
      { kind: 'tenframe', target: n, show: `<span class="bld-num">${n}</span>` }, 'Count as you tap!');
  };
  const placeValue = (level) => {
    const big = state.grade === 'g2' || state.grade === 'g3' ? level >= 2 : level >= 4;
    const n = big ? 100 + rand(800) : 11 + rand(88);
    // numbers up to 110 are recorded; bigger ones are shown, not read
    return card(`bld-pv-${n}`, 'Build this number!', n <= 110 ? ['Build this number!', String(n)] : 'Build this number!',
      { kind: 'place', target: n, hundreds: n >= 100, show: `<span class="bld-num">${n}</span>` }, n >= 100 ? 'Hundreds first, then tens, then ones!' : 'Tens first, then ones!');
  };
  const array = (level) => {
    const r = 2 + rand(level <= 2 ? 3 : 4), c = 2 + rand(level <= 2 ? 4 : 6);
    return card(`bld-ar-${r}x${c}`, 'Build the array!', 'Build the array!',
      { kind: 'array', rows: r, cols: c, show: `<span class="bld-num">${r} rows of ${c}</span>` }, 'Make the rows first, then put the right number in each row!');
  };
  const fraction = (level) => {
    const b = pick(level <= 2 ? [2, 3, 4] : [3, 4, 5, 6, 8]), a = 1 + rand(b - 1);
    return card(`bld-fr-${a}-${b}`, 'Color the fraction!', 'Color the fraction!',
      { kind: 'fraction', a, b, shape: Math.random() < 0.5 ? 'bar' : 'pie', show: `<span class="bld-num">${fracHTML(a, b)}</span>` }, 'The bottom number is how many parts. Color the top number of parts!');
  };
  const clock = (level) => {
    if (level > 5) return null;
    const [h, m] = randTime(Math.min(level, 4));
    return card(`bld-ck-${h}-${m}`, 'Set the clock!', 'Set the clock!',
      { kind: 'clock', h, m, step: level <= 1 ? 60 : level === 2 ? 30 : level === 3 ? 15 : 5, show: `<span class="bld-num">${timeStr(h, m)}</span>` }, 'The short hand shows the hour. The long hand shows the minutes!');
  };

  const PLAN = { add: [0.15, (lv) => (['prek', 'k'].includes(state.grade) && lv <= 2 ? tenFrame(lv) : null)],
    numsense: [0.2, placeValue], mul: [0.15, array], frac: [0.18, fraction], clock: [0.2, clock] };
  for (const [id, [share, make]] of Object.entries(PLAN)) {
    const c = CATEGORIES.find((x) => x.id === id);
    if (!c || !c.gen) continue;
    const base = c.gen;
    c.baseGen = c.baseGen || base;   // the plain pick-one-answer generator stays reachable for placement and tests
    c.gen = (level) => (Math.random() < share && (() => { try { return make(level); } catch { return null; } })()) || base(level);
  }
})();

/* ---------- the build workspace ---------- */
function renderBuild(q) {
  const B = q.build, wrap = document.createElement('div'); wrap.className = 'bld bld-' + B.kind;
  $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
  const st = { n: 0, h: 0, t: 0, o: 0, r: 1, c: 1, parts: new Set(), ch: 12, cm: 0 };
  const btn = (a, label, cls = '') => `<button class="bld-btn ${cls}" data-a="${a}">${label}</button>`;
  function draw() {
    if (B.kind === 'tenframe') wrap.innerHTML = `<div class="bld-tf">${Array.from({ length: 10 }, (_, i) => `<button class="tf-cell${i < st.n ? ' on' : ''}" data-i="${i}" aria-label="square ${i + 1}">${i < st.n ? '🔴' : ''}</button>`).join('')}</div>`;
    if (B.kind === 'place') wrap.innerHTML = `<div class="bld-blocks">${B.hundreds ? `<div class="pv-row">${'<i class="pv-h"></i>'.repeat(st.h)}</div>` : ''}<div class="pv-row">${'<i class="pv-t"></i>'.repeat(st.t)}</div><div class="pv-row">${'<i class="pv-o"></i>'.repeat(st.o)}</div></div>
      <div class="bld-ctrls">${B.hundreds ? `<span class="bld-pair">${btn('h-', '−')}<b>100</b>${btn('h+', '+')}</span>` : ''}<span class="bld-pair">${btn('t-', '−')}<b>10</b>${btn('t+', '+')}</span><span class="bld-pair">${btn('o-', '−')}<b>1</b>${btn('o+', '+')}</span></div>`;
    if (B.kind === 'array') wrap.innerHTML = `<div class="bld-array" style="--cols:${st.c}">${'<i></i>'.repeat(st.r * st.c)}</div>
      <div class="bld-ctrls"><span class="bld-pair">${btn('r-', '−')}<b>rows ${st.r}</b>${btn('r+', '+')}</span><span class="bld-pair">${btn('c-', '−')}<b>in each row ${st.c}</b>${btn('c+', '+')}</span></div>`;
    if (B.kind === 'fraction') wrap.innerHTML = B.shape === 'bar'
      ? `<div class="bld-bar">${Array.from({ length: B.b }, (_, i) => `<button class="fr-part${st.parts.has(i) ? ' on' : ''}" data-i="${i}" aria-label="part ${i + 1}"></button>`).join('')}</div>`
      : `<svg class="bld-pie" viewBox="-110 -110 220 220">${Array.from({ length: B.b }, (_, i) => { const a0 = (i / B.b) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / B.b) * 2 * Math.PI - Math.PI / 2;
          return `<path class="fr-part${st.parts.has(i) ? ' on' : ''}" data-i="${i}" d="M0 0L${100 * Math.cos(a0)} ${100 * Math.sin(a0)}A100 100 0 ${B.b === 1 ? 1 : 0} 1 ${100 * Math.cos(a1)} ${100 * Math.sin(a1)}Z"/>`; }).join('')}</svg>`;
    if (B.kind === 'clock') wrap.innerHTML = `${clockSVG(st.ch, st.cm, 'clock bld-clock')}
      <div class="bld-ctrls"><span class="bld-pair">${btn('ch-', '−')}<b>hour hand</b>${btn('ch+', '+')}</span>${B.step < 60 ? `<span class="bld-pair">${btn('cm-', '−')}<b>minute hand</b>${btn('cm+', '+')}</span>` : ''}</div>`;
    wrap.insertAdjacentHTML('beforeend', `<button class="big-btn bld-check" data-a="check">✓ Check</button>`);
  }
  const right = () => ({ tenframe: st.n === B.target, place: st.h * 100 + st.t * 10 + st.o === B.target && (B.hundreds || !st.h),
    array: st.r === B.rows && st.c === B.cols, fraction: st.parts.size === B.a, clock: st.ch === B.h && st.cm === B.m })[B.kind];
  wrap.addEventListener('click', (e) => {
    if (!live(q)) return;
    const el = e.target.closest('[data-a], [data-i]'); if (!el) return;
    const a = el.dataset.a;
    if (a === 'check') { if (right()) { sfx.yes(); matchDone(q); } else { partMiss(q, el); say('Not yet. Try again!'); if (q.tries >= 2 && !q.hintShown) showHint(q, true); } return; }
    sfx.tap();
    if (B.kind === 'tenframe' && el.dataset.i != null) { const i = +el.dataset.i; st.n = i < st.n ? i : i + 1; }
    if (B.kind === 'fraction' && el.dataset.i != null) { const i = +el.dataset.i; st.parts.has(i) ? st.parts.delete(i) : st.parts.add(i); }
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if (a === 'h+') st.h = clamp(st.h + 1, 0, 9); if (a === 'h-') st.h = clamp(st.h - 1, 0, 9);
    if (a === 't+') st.t = clamp(st.t + 1, 0, 9); if (a === 't-') st.t = clamp(st.t - 1, 0, 9);
    if (a === 'o+') st.o = clamp(st.o + 1, 0, 9); if (a === 'o-') st.o = clamp(st.o - 1, 0, 9);
    if (a === 'r+') st.r = clamp(st.r + 1, 1, 9); if (a === 'r-') st.r = clamp(st.r - 1, 1, 9);
    if (a === 'c+') st.c = clamp(st.c + 1, 1, 10); if (a === 'c-') st.c = clamp(st.c - 1, 1, 10);
    if (a === 'ch+') st.ch = st.ch % 12 + 1; if (a === 'ch-') st.ch = (st.ch + 10) % 12 + 1;
    if (a === 'cm+') st.cm = (st.cm + B.step) % 60; if (a === 'cm-') st.cm = (st.cm + 60 - B.step) % 60;
    draw();
  });
  q.partHint = () => wrap.querySelector('.bld-check')?.classList.add('glow-l');
  draw();
}
