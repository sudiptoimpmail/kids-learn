/* Times tables: taught first, then quizzed (data/lessons.json "tables").
   Ladder, in counting order, one table per step: × 1, × 2, × 3 ... × 10, then all tables mixed.
     Kindergarten  × 1 · × 2            (quizzed on answers up to 10, with picture cards among the facts)
     1st grade     × 1 to × 5
     2nd grade     × 2 to × 10
     3rd grade     × 3 to × 10, then all tables mixed (with turn-arounds and missing factors)
   Teaching: the first round of a step opens with the whole table on one card. Professor Hoot slowly says every
   line aloud ("1 times 1 is 1" ... "1 times 10 is 10") while it lights up and the dots build up beside it.
   Then one card together, then the quiz (teach.js runs the lesson; this file supplies the card through teach(level)). */
const TimesTables = (() => {
  const T = ContentData.get('lessons', 'tables');
  const P = ContentData.get('lessons', 'phrases');
  const LEVELS = T.levels, Q = T.quiz;
  const def = (level) => LEVELS[Math.max(1, Math.min(LEVELS.length, level)) - 1];
  const countBy = { 2: P.countBy2, 5: P.countBy5, 10: P.countBy10 };
  const strip = (by, n, blank = -1) => `<div class="tt-strip">${Array.from({ length: n }, (_, i) =>
    `<span data-row="${i + 1}" class="${i === blank ? 'q' : ''}">${i === blank ? '?' : by * (i + 1)}</span>`).join('')}</div>`;
  const dots = (rows, cols) => `<div class="arr tt-dots" style="grid-template-columns:repeat(${cols},1fr)">${'<i></i>'.repeat(rows * cols)}</div>`;
  // wrong answers a child really gives: one step too many or too few, or the neighbouring fact
  function choices(ans, steps, count) {
    const set = new Set([ans]);
    for (const d of shuffle(steps.flatMap((s) => [ans + s, ans - s]))) { if (set.size >= count) break; if (d > 0) set.add(d); }
    for (let g = 1; set.size < count && g < 30; g++) { const d = ans + (g % 2 ? g : -g); if (d > 0) set.add(d); }
    return shuffle([...set]).map((n) => ({ v: n, html: String(n) }));
  }
  const nOpts = (level) => (level <= 2 ? 3 : 4);

  /* ---------- quiz cards ---------- */
  const gradeNow = () => (typeof state !== 'undefined' && state.grade) || 'g3';
  // picture cards for table n: equal groups to count, or the next number when counting by n
  function pictureCard(n, kMax, level) {
    if (Math.random() < 0.5) {
      const [e] = pick(THINGS), g = Math.max(1, Math.min(kMax, n >= 5 ? 4 : 5, 1 + rand(5)));
      return {
        key: `tbl-grp-${n}-${g}`, text: `${g} ${g === 1 ? 'group' : 'groups'} of ${n}. How many in all?`, say: [`${g}`, 'groups of', `${n}.`, 'How many in all?'],
        main: groupsHTML(e, g, n), options: choices(g * n, [n, 1], nOpts(level)), answer: g * n, optClass: 'opt-num',
        hint: { html: `<div class="hint-note big">Count by ${n}s:</div>${strip(n, g)}`, say: 'Count by groups!' },
      };
    }
    const at = 2 + rand(Math.max(1, kMax - 1)), show = Math.min(4, at - 1);      // the term to find; up to 4 terms shown before it
    const ans = n * at, first = at - show;
    return {
      key: `tbl-next-${n}-${at}`, text: 'What comes next?', say: ['What comes next?'],
      main: `<div class="tt-strip">${Array.from({ length: show }, (_, i) => `<span>${n * (first + i)}</span>`).join('')}<span class="q">?</span></div>`,
      options: choices(ans, [n, 1], nOpts(level)), answer: ans, optClass: 'opt-num',
      hint: { html: `<div class="hint-note big">Count by ${n}s:</div>${strip(n, at, at - 1)}`, say: countBy[n] || 'Count by groups!' },
    };
  }
  function factCard(n, k, level, kind = 'fact') {
    const c = n * k;
    const hint = { html: `${c <= 50 ? dots(k, n) : ''}<div class="hint-note big">Count by ${n}s:</div>${strip(n, k)}`, say: 'Count by groups!' };
    if (kind === 'missing') return {
      key: `tbl-miss-${n}-${k}`, text: 'What number is missing?', say: ['What times', `${n}`, 'makes', `${c}?`],
      main: `<div class="equation">${n} × <span class="qmark">?</span> = ${c}</div>`,
      options: choices(k, [1, 2], 4), answer: k, optClass: 'opt-num', hint,
    };
    const [a, b] = kind === 'turn' ? [k, n] : [n, k];
    return {
      key: `tbl-${a}x${b}`, text: 'Multiply!', say: ['What is', `${a}`, 'times', `${b}?`],
      main: `<div class="equation">${a} × ${b} = <span class="qmark">?</span></div>`,
      options: choices(c, [n, k], nOpts(level)), answer: c, optClass: 'opt-num', hint,
    };
  }
  // tables already learned before this step (review)
  const earlier = (level) => LEVELS.slice(0, level - 1).filter((d) => d.kind === 'table').map((d) => d.n);
  function gen(level) {
    const d = def(level), g = gradeNow();
    const known = earlier(level);
    let n = d.n;
    if (d.kind === 'mixed') n = pick(known);
    else if (known.length && Math.random() < Q.reviewShare) n = pick(known);
    // Kindergarten is quizzed on answers up to 10; everyone else on the whole table
    const cap = (Q.maxProduct || {})[g], kMax = cap ? Math.max(1, Math.min(10, Math.floor(cap / n))) : 10;
    if (d.kind !== 'mixed' && Math.random() < ((Q.pictureShare || {})[g] || 0)) return pictureCard(n, kMax, level);
    const k = d.kind === 'mixed' ? 2 + rand(9) : 1 + rand(kMax);
    const r = Math.random(), plain = (Q.noMissingOrTurnaround || []).includes(g);
    const kind = plain ? 'fact' : level >= Q.missingFromLevel && r < Q.missingShare ? 'missing'
      : level >= Q.turnaroundFromLevel && r < Q.missingShare + Q.turnaroundShare ? 'turn' : 'fact';
    return factCard(n, k, level, kind);
  }

  /* ---------- the teaching card: the whole count or table, read aloud line by line ---------- */
  function teach(level) {
    const d = def(level);
    if (d.kind !== 'table') return null;                 // the mixed step has no new table to show
    const rows = Array.from({ length: 10 }, (_, i) => i + 1);
    return {
      key: `tbl-intro-${level}`, text: d.title,
      main: `<div class="tt-teach"><div class="tt-table">${rows.map((k) => `<div class="tt-row" data-row="${k}"><b>${d.n}</b> × <b>${k}</b> = <b>${d.n * k}</b></div>`).join('')}</div><div class="tt-arr"></div></div>`,
      options: [], answer: null,
      steps: [{ say: [P.tableIntro, `${d.n}`, P.tableName] }, ...rows.map((k) => ({ row: k, say: `${d.n} times ${k} is ${d.n * k}.`, slow: true, dots: d.n * k <= 60 ? [k, d.n] : null })), { say: P.sayWithMe }],
    };
  }
  return Object.freeze({ gen, teach, dots, practice: T.practice, levels: LEVELS, titleOf: (level) => def(level).title });
})();
