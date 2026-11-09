/* =========================================================
   Format variants: a second way to practise the same skill, built from the section's own content.
   A share of cards in these sections switch from "pick one answer" to another format:
     Adding, Subtraction, Multiply, Divide → match each problem to its answer (Pre-K: pictures)
     What Comes Next?                      → tap the pictures in order
     Clock                                 → match each clock to its time
     Flags (1st grade and up)              → match each flag to its country
     Jobs                                  → match each helper to their tools (pictures only)
     Fractions                             → match each picture to its fraction
   Every variant keeps the section's level rules, so a grade gets the same difficulty in a new form.
   ========================================================= */
(() => {
  const matchCard = (key, pairs, text, say) => {
    const left = pairs.map((p, i) => ({ id: i, html: p[0] }));
    const right = shuffle(pairs.map((p, i) => ({ id: i, html: p[1] })));
    return { key, text, say, main: '', mainClass: 'empty', options: [], answer: 'all', optClass: 'match-area',
      match: { left: shuffle(left), right, kind: 'math' }, hint: { html: '', say: 'Look carefully, and try again!' } };
  };
  // a short, stable key from what the card shows (pairs from uniqPairs carry only their two halves)
  const pairsKey = (pairs) => { let h = 2166136261; const raw = pairs.map((p) => p[0] + '|' + p[1]).sort().join('#');
    for (let i = 0; i < raw.length; i++) h = Math.imul(h ^ raw.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
  const n = (level) => (level <= 1 ? 3 : 4);

  const addMatch = (level) => {
    const [e] = pick(THINGS);
    const pairs = uniqPairs(() => {
      let [a, b] = addPair(level);
      for (let t = 0; level === 1 && (!a || !b) && t < 50; t++) [a, b] = addPair(level);   // Pre-K: two real groups, never 0
      const left = level === 1 ? `<span class="m-sum"><span>${objects(e, a)}</span><b>+</b><span>${objects(e, b)}</span></span>` : `<span class="m-eq">${a} + ${b}</span>`;
      return [left, `<span class="m-num">${a + b}</span>`, `${a}+${b}`, a + b];
    }, n(level));
    return pairs.length >= 3 ? matchCard('vadd-' + pairsKey(pairs), pairs, 'Match each problem to its answer!', 'Match each problem to its answer!') : null;
  };
  const subMatch = (level) => {
    const [e] = pick(THINGS);
    const pairs = uniqPairs(() => {
      let [a, b] = subPair(level);
      for (let t = 0; level === 1 && (!b || a === b) && t < 50; t++) [a, b] = subPair(level);   // something is taken, something is left
      const left = level === 1 ? `<span class="m-sum">${Array.from({ length: a }, (_, i) => `<span class="${i >= a - b ? 'gone' : ''}">${e}</span>`).join('')}</span>` : `<span class="m-eq">${a} − ${b}</span>`;
      return [left, `<span class="m-num">${a - b}</span>`, `${a}-${b}`, a - b];
    }, n(level));
    return pairs.length >= 3 ? matchCard('vsub-' + pairsKey(pairs), pairs, 'Match each problem to its answer!', 'Match each problem to its answer!') : null;
  };
  // times tables by level: 2s, 5s and 10s first, then up to 5, then the full table (never × 1 from level 3)
  const mulFact = (level) => {
    const a = level <= 1 ? pick([2, 5, 10]) : level === 2 ? 2 + rand(4) : 2 + rand(9);
    const b = level <= 2 ? 1 + rand(level === 1 ? 5 : 10) : 2 + rand(9);
    return [a, b];
  };
  const mulMatch = (level) => {
    const pairs = uniqPairs(() => { const [a, b] = mulFact(level); return [`<span class="m-eq">${a} × ${b}</span>`, `<span class="m-num">${a * b}</span>`, `${a}x${b}`, a * b]; }, 4);
    return pairs.length >= 3 ? matchCard('vmul-' + pairsKey(pairs), pairs, 'Match each problem to its answer!', 'Match each problem to its answer!') : null;
  };
  const divMatch = (level) => {
    const pairs = uniqPairs(() => {
      const b = level <= 1 ? pick([2, 5, 10]) : level === 2 ? 2 + rand(4) : 2 + rand(9);
      const v = level <= 2 ? 1 + rand(level === 1 ? 5 : 10) : 2 + rand(9);
      return [`<span class="m-eq">${b * v} ÷ ${b}</span>`, `<span class="m-num">${v}</span>`, `${b * v}d${b}`, v];
    }, 4);
    return pairs.length >= 3 ? matchCard('vdiv-' + pairsKey(pairs), pairs, 'Match each problem to its answer!', 'Match each problem to its answer!') : null;
  };
  const clockMatch = (level) => {
    if (level > 5) return null;
    const pairs = uniqPairs(() => { const [h, m] = randTime(level); const t = timeStr(h, m); return [`<span class="m-pic">${clockSVG(h, m, 'clock small')}</span>`, `<span class="m-num">${t}</span>`, t, t]; }, 3);
    return pairs.length === 3 ? matchCard('vclock-' + pairsKey(pairs), pairs, 'Match each clock to its time!', 'Match each clock to its time!') : null;
  };
  const flagMatch = (level) => {
    if (!state.grade || ['prek', 'k'].includes(state.grade)) return null;     // country names need reading
    const pool = FLAGS.filter((f) => f[4] <= level);
    if (pool.length < 4) return null;
    const pairs = sample(pool, 4).map((f) => [`<span class="m-pic big-flag">${f[1]}</span>`, `<span class="m-word">${f[0]}</span>`, f[0], f[0]]);
    return matchCard('vflag-' + pairsKey(pairs), pairs, 'Match each flag to its country!', 'Match each flag to its country!');
  };
  const sequenceOrder = (level) => {
    if (level >= 2) {     // Grade 1-3: put the captioned steps of a process in order
      const pool2 = SEQ_STEPS.filter((x) => x[0] <= level), exact2 = pool2.filter((x) => x[0] === level);
      const [, steps2, reason2] = pick(exact2.length ? exact2 : pool2);
      return { key: `vseq2-${steps2.map((x) => x[1]).join('|')}`, text: 'Tap the steps in order!', say: 'Tap the pictures in order!',
        main: '', mainClass: 'empty', options: [], answer: 'done', optClass: 'spell-tray',
        order: { pics: steps2.map(seqTile), shown: shuffle(steps2.map((_, i) => i)), given: 1 }, explain: reason2,
        hint: { html: `<div class="hint-note">${reason2}</div>`, say: 'What happened first?' } };
    }
    const pool = THINKING_SEQUENCES.concat(curriculumRows('THINKING_SEQUENCES', level)).filter((x) => x[0] <= level && x[1].length >= 3);
    const exact = pool.filter((x) => x[0] === level);
    const row = pick(exact.length ? exact : pool);
    if (!row) return null;
    const [, steps, reason] = row;
    // the first picture is placed for the child, so cycles (seasons, chicken and egg) have one right answer
    return { key: `vseq-${steps.join('')}`, text: 'Tap the pictures in order!', say: 'Tap the pictures in order!',
      main: '', mainClass: 'empty', options: [], answer: 'done', optClass: 'spell-tray',
      order: { pics: steps, shown: shuffle(steps.map((_, i) => i)), given: 1 }, explain: reason,
      hint: { html: '', say: 'What happened first?' } };
  };

  // community helpers and their tools: pictures on both sides, so pre-readers can play
  const jobMatch = (level) => {
    const pool = level === 1 ? JOBS.slice(0, 12) : JOBS;
    const pairs = sample(pool, level === 1 ? 3 : 4).map((j) => [`<span class="m-pic">${j[1]}</span>`, `<span class="m-pic">${j[3]}</span>`, j[0], j[3]]);
    return matchCard('vjob-' + pairsKey(pairs), pairs, 'Match each helper to their tools!', 'Match each helper to their tools!');
  };
  // fraction pictures and fraction numbers; never two equal fractions (1/2 and 2/4) in one card
  const fracMatch = (level) => {
    if (level < 2) return null;
    const dens = level === 2 ? [2, 3, 4] : [2, 3, 4, 6, 8];
    const g = (a, b) => (b ? g(b, a % b) : a);
    const pairs = uniqPairs(() => {
      const b = pick(dens), a = 1 + rand(b - 1), d = g(a, b);
      return [`<span class="m-pic">${Math.random() < 0.5 ? nsPie(b, a) : m23Bar(b, a)}</span>`, `<span class="m-num">${fracHTML(a, b)}</span>`, `${a}/${b}`, `${a / d}/${b / d}`];
    }, 3);
    return pairs.length === 3 ? matchCard('vfrac-' + pairsKey(pairs), pairs, 'Match each picture to its fraction!', 'Match each picture to its fraction!') : null;
  };

  const VARIANTS = { jobs: [0.2, jobMatch], frac: [0.2, fracMatch], add: [0.18, addMatch], sub: [0.18, subMatch], mul: [0.2, mulMatch], div: [0.2, divMatch],
    clock: [0.2, clockMatch], flags: [0.2, flagMatch], sequence: [0.35, sequenceOrder] };
  for (const [id, [share, make]] of Object.entries(VARIANTS)) {
    const c = CATEGORIES.find((x) => x.id === id);
    if (!c || !c.gen) continue;
    const base = c.gen;
    c.baseGen = base;   // the plain pick-one-answer generator (placement and choice-integrity tests use it)
    c.gen = (level) => (Math.random() < share && (() => { try { return make(level); } catch { return null; } })()) || base(level);
  }
})();
