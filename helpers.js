/* Jobs: illustrated workers and the things they wear and use (data/helpers.json, built by scripts/make-helpers.py).
   Step 1            who helps us?  (Pre-K: find the firefighter, who puts out fires?)
   Steps 2 to 9      one worker each: firefighter, doctor, police officer, soldier, builder, chef, farmer, astronaut.
                     The lesson shows the worker; Professor Hoot names each thing (helmet, fire hose ...) and says what
                     it is for while it lights up. Then the quiz: tap the fire hose, which one is the stethoscope,
                     who uses this? 1st grade is also asked what each thing is for.
   Last step         all the jobs, mixed (what does a pilot do?)
   Every answer is a picture; every word is spoken. */
const Helpers = (() => {
  const W = ContentData.get('helpers', 'WORKERS'), Q = ContentData.get('helpers', 'quiz'), LEVELS = ContentData.get('helpers', 'levels');
  const LAST = LEVELS.length;
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const attr = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const still = (svg) => svg.replace(/ role="button" tabindex="0"/g, '');          // a picture that is not for tapping
  const light = (svg, on) => svg.split(`data-val="${on}"`).map((s, i) => (i ? s.replace('class="hw-part"', 'class="hw-part hl"') : s)).join(`data-val="${on}"`);
  // the whole worker; `on` lights one thing up; `tap` keeps the things tappable
  const fig = (w, { on = '', tap = false, cls = '' } = {}) =>
    `<svg viewBox="${w.viewBox}" class="hw-fig ${cls}${on ? ' has-hl' : ''}" role="${tap ? 'group' : 'img'}" aria-label="${attr(w.name)}">${on ? light(tap ? w.svg : still(w.svg), on) : tap ? w.svg : still(w.svg)}</svg>`;
  // one thing on its own
  const icon = (p, cls = '') => `<svg viewBox="${p.box.join(' ')}" class="hw-icon ${cls}" role="img" aria-label="${attr(p.name)}">${p.svg}</svg>`;
  const plural = (p) => /s$/.test(p.name) && !/(camouflage|radio)$/.test(p.name);
  const tell = (p) => `The ${p.name} ${p.use}.`;
  const workerAt = (level) => W[level - 2];
  const things = (ws) => ws.flatMap((w) => w.parts.map((p) => ({ w, p })));
  const partOpt = ({ w, p }) => ({ v: `${w.id}:${p.id}`, html: icon(p) });
  const workerOpt = (w) => ({ v: w.id, html: fig(w, { cls: 'opt' }) });
  const youngest = () => (typeof state !== 'undefined' && state.grade) || 'k';

  // step 1: find the worker among three pictures (the first six workers are the ones a Pre-K child meets)
  function findCard() {
    const pool = W.slice(0, youngest() === 'prek' ? 6 : W.length), w = pick(pool);
    return {
      key: `job-find-${w.id}`, text: `Find the <b>${w.name}</b>!`, say: ['Find the', `${w.name}!`],
      main: '', mainClass: 'empty', options: shuffle([w, ...sample(pool, 2, [w])].map(workerOpt)), answer: w.id, optClass: 'opt-emoji hw-opts',
      hint: { html: `<div class="hw-hint">${fig(w, { cls: 'mini' })}</div>`, say: `This person ${w.does}.` },
    };
  }
  function workerCard(level) {
    const known = W.slice(0, level - 1);                                            // this worker and the ones before
    const w = level > 2 && Math.random() < Q.reviewShare ? pick(known.slice(0, -1)) : workerAt(level);
    const p = pick(w.parts), me = { w, p }, r = Math.random();
    const hintFig = `<div class="hw-hint">${fig(w, { on: p.id, cls: 'mini' })}</div>`;
    if (r < Q.tapShare) return {
      key: `job-tap-${w.id}-${p.id}`, text: `Tap the <b>${p.name}</b>!`, say: ['Tap the', `${p.name}!`],
      main: fig(w, { tap: true }), mainClass: 'hw-main', tap: true, options: [], answer: p.id, optClass: '',
      hint: { html: hintFig, say: 'Look for the part that is glowing!' },
    };
    if (r < Q.tapShare + Q.whoShare) {
      const others = sample(W.filter((x) => x !== w && !x.parts.some((y) => y.name === p.name)), 2);
      return {
        key: `job-whose-${w.id}-${p.id}`, text: 'Who uses this?', say: 'Who uses this?',
        main: `<div class="hw-ask">${icon(p)}</div>`, options: shuffle([w, ...others].map(workerOpt)), answer: w.id, optClass: 'opt-emoji hw-opts',
        hint: { html: hintFig, say: `This person ${w.does}.` },
      };
    }
    // picture choices: this worker's other things first, then things from workers already met
    const useQ = Q.useGrades.includes(youngest()) && Math.random() < Q.useShare / (1 - Q.tapShare - Q.whoShare);
    const kind = (n) => n.split(' ').pop();                                       // boots and moon boots, helmet and space helmet are the same kind of thing
    const fits = (x) => kind(x.p.name) !== kind(p.name) && (!useQ || x.p.use !== p.use);
    const own = things([w]).filter(fits), rest = things(known.length > 1 ? known.filter((x) => x !== w) : W.filter((x) => x !== w)).filter(fits);
    // "what is it for" is asked among this worker's own things, so only one answer can be right
    const wrong = [];                                                               // no two choices of the same kind (two pairs of boots)
    for (const x of useQ ? shuffle(own) : [...sample(own, 2), ...shuffle(rest)]) { if (wrong.length < 3 && !wrong.some((y) => kind(y.p.name) === kind(x.p.name))) wrong.push(x); }
    const ask = useQ ? p.ask : plural(p) ? `Which ones are the ${p.name}?` : `Which one is the ${p.name}?`;
    return {
      key: `job-${useQ ? 'use' : 'pick'}-${w.id}-${p.id}`, text: useQ ? ask : ask.replace(p.name, `<b>${p.name}</b>`),
      say: useQ ? ask : [plural(p) ? 'Which ones are the' : 'Which one is the', `${p.name}?`],
      main: '', mainClass: 'empty', options: shuffle([me, ...wrong].map(partOpt)), answer: `${w.id}:${p.id}`, optClass: 'opt-emoji hw-opts',
      explain: tell(p), hint: { html: hintFig, say: tell(p) },
    };
  }
  function gen(level) {
    if (level <= 1) return Math.random() < 0.5 ? findCard() : genJobs(1);
    if (level >= LAST) return genJobs(3);
    return workerCard(level);
  }
  // the lesson: the worker, then each thing by name and what it is for, lit up one at a time
  function teach(level) {
    const w = workerAt(level);
    if (level <= 1 || level >= LAST || !w) return null;
    return {
      key: `job-intro-${w.id}`, text: cap(w.name),
      main: `<div class="hw-teach">${fig(w)}<div class="hw-labels">${w.parts.map((p, i) => `<span class="hw-label" data-row="${i + 1}">${p.name}</span>`).join('')}</div></div>`,
      options: [], answer: null,
      steps: [{ say: `This is ${w.article} ${w.name}.` }, { say: `${cap(w.article)} ${w.name} ${w.does}.` },
        ...w.parts.flatMap((p, i) => [{ row: i + 1, say: p.name, slow: true }, { row: i + 1, say: tell(p), slow: true }])],
    };
  }
  // every sentence this section can say (for the recording script and the tests)
  const spoken = () => ['Find the', 'Tap the', 'Who uses this?', 'Which one is the', 'Which ones are the',
    ...W.flatMap((w) => [w.name, `This is ${w.article} ${w.name}.`, `${cap(w.article)} ${w.name} ${w.does}.`, `This person ${w.does}.`,
      ...w.parts.flatMap((p) => [p.name, tell(p), p.ask])])];
  return Object.freeze({ gen, teach, fig, icon, spoken, workers: W, levels: LEVELS });
})();
// Jobs keeps its place and its saved progress; its cards now come from here
Object.assign(CATEGORIES.find((c) => c.id === 'jobs'), {
  sub: 'who helps us? · helmet, fire hose', gen: (l) => Helpers.gen(l), teach: (l) => Helpers.teach(l), maxLevel: Helpers.levels.length,
});
