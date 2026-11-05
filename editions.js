/* =========================================================
   Country editions
   - Voice: outside the US and Canada the letter Z is said "zed"
   - Practice for each country's own checks, kept low-pressure (no scores sent anywhere):
       US 3rd grade state tests · Ontario EQAO (Grade 3) · England phonics check (Year 1) and
       multiplication tables check (Year 4) · NAPLAN (Year 3) · NZ reading and maths ·
       India NIPUN Bharat (Classes 1–3) · Ireland standardised tests
   - Word packs: te reo Māori (New Zealand) and Hindi (India). These are read, not spoken:
     the app's voice is English, so the words wait for native-speaker recordings.
   ========================================================= */
const ED = (k) => ContentData.get('editions', k);
const edCC = () => (typeof countryCode === 'function' ? countryCode() : 'us');
const ZED_COUNTRIES = new Set(['uk', 'au', 'nz', 'in', 'ie']);
const ZED = { 'z': 'zed', 'z says': 'zed says', 'z is for zebra': 'zed is for zebra', 'little z': 'little zed', 'z is for zoo': 'zed is for zoo' };
// used by say(): swap a recorded phrase for its local version when one exists
function localSpoken(part) {
  if (!ZED_COUNTRIES.has(edCC())) return part;
  const k = clipKey(String(part));
  return ZED[k] && CLIPS[ZED[k]] ? ZED[k] : part;
}

/* ---------- national check practice ---------- */
const CHECKS = {
  us: { g3: ['State Test Practice', 'reading · math · grammar'] },
  ca: { g3: ['Grade 3 Test Practice', 'reading · writing · math'] },
  uk: { k: ['Phonics Check', 'real and alien words'], g3: ['Times Tables Check', '12 × 12 in 6 seconds'] },
  au: { g3: ['NAPLAN Practice', 'reading · numeracy · language'] },
  nz: { g2: ['Reading & Maths Check', 'reading · maths'], g3: ['Reading & Maths Check', 'reading · maths'] },
  in: { g1: ['NIPUN Check', 'reading · numbers'], g2: ['NIPUN Check', 'reading · numbers'], g3: ['NIPUN Check', 'reading with understanding · maths'] },
  ie: { g2: ['Standardised Test Practice', 'reading · maths'], g3: ['Standardised Test Practice', 'reading · maths'] },
};
function checkFor(grade = state.grade) {
  const c = CHECKS[edCC()];
  const row = c && c[grade];
  if (!row) return null;
  if (edCC() === 'ca' && typeof myRegion === 'function' && myRegion() && myRegion()[0] === 'Ontario') return ['EQAO Practice', row[1]];
  return row;
}
const topOf = (id) => { const r = state.grade && gradeRange(state.grade, id); return r ? r[1] : Math.min(3, maxLevelOf(id)); };
const fromCat = (id, lv) => { const c = CATEGORIES.find((x) => x.id === id); const q = c.gen(lv || topOf(id)); q.key = 'chk-' + q.key; return q; };
function timesTableCheck() {
  const a = 2 + rand(11), b = 2 + rand(11), c = a * b;
  return { key: `chk-mtc-${a}-${b}`, text: 'Times tables check — answer within 6 seconds!', say: ['What is', `${a}`, 'times', `${b}?`],
    main: `<div class="equation">${a} × ${b} = <span class="qmark">?</span></div><div class="ed-timer" style="--secs:6s" aria-hidden="true"><i></i></div>`,
    options: numberOptions(c, 6), answer: c, optClass: 'opt-num', hint: { html: `<div class="hint-note big">${a} × ${b} = ${a} groups of ${b}</div>`, say: 'Count by groups!' } };
}
function genCheck() {
  const cc = edCC(), g = state.grade, t = Math.random();
  if (cc === 'uk' && g === 'g3') return timesTableCheck();
  if (cc === 'uk' && g === 'k') { const q = genPhonicsPlus(3); return q.key.startsWith('ph-alien') || t < 0.5 ? q : fromCat('phonics', 3); }
  const reading = () => (g && gradeRange(g, 'sent') && gradeRange(g, 'sent')[1] >= 4 && typeof genPassage23 === 'function' && Math.random() < 0.5 ? (() => { const q = genPassage23(gradeRange(g, 'sent')[1]); q.key = 'chk-' + q.key; return q; })() : fromCat('sent'));
  const inGrade = (ids) => { const ok = ids.filter((id) => g && gradeRange(g, id)); return ok.length ? ok : ids.slice(0, 2); };
  const math = () => fromCat(pick(inGrade(['add', 'sub', 'mul', 'frac', 'measure', 'numsense', 'story'])));
  const language = () => fromCat(pick(inGrade(['spell', 'gp', 'words'])));
  if (cc === 'in') return t < 0.55 ? reading() : math();
  if (t < 0.4) return reading();
  if (t < 0.8 || !['gp', 'spell', 'words'].some((id) => g && gradeRange(g, id))) return math();
  return language();
}

/* ---------- word packs: te reo Māori and Hindi ---------- */
function langPack() { return edCC() === 'nz' ? 'maori' : edCC() === 'in' ? 'hindi' : null; }
function genLangWords(level) {
  const pack = langPack(), rows = pack === 'hindi' ? ED('HINDI').map(([w, r, en, k]) => [`${w} <small>(${r})</small>`, en, k, w]) : ED('MAORI').map(([w, en, k]) => [w, en, k, w]);
  const kinds = level <= 1 ? ['number', 'colour'] : ['number', 'colour', 'word'];
  const pool = rows.filter((r) => kinds.includes(r[2])), [word, en, kind, raw] = pick(pool);
  const same = pool.filter((r) => r[2] === kind && r[1] !== en);
  const name = pack === 'hindi' ? 'Hindi' : 'te reo Māori';
  if (Math.random() < 0.5) {
    const opts = shuffle([en, ...sample(same.map((r) => r[1]), level <= 1 ? 2 : 3)]);
    return { key: `lang-${pack}-mean-${raw}`, text: `What does this ${name} word mean?`, say: 'What does this word mean?', main: `<div class="gr-word ed-word no-fx">${word}</div>`, mainClass: 'ph-main',
      options: opts.map((v) => ({ v, html: v })), answer: en, optClass: 'opt-text', hint: { html: '', say: 'Think about it!', remove: true } };
  }
  const others = sample(same, level <= 1 ? 2 : 3);
  return { key: `lang-${pack}-pick-${raw}`, text: `Which is the ${name} word for <b>${en}</b>?`, say: 'Find the answer!', main: '', mainClass: 'empty',
    options: shuffle([[word, raw], ...others.map((r) => [r[0], r[3]])]).map(([html, v]) => ({ v, html: `<span class="no-fx">${html}</span>` })), answer: raw, optClass: 'opt-text', hint: { html: '', say: 'Think about it!', remove: true } };
}
function editionTitle(id, title) {
  if (id === 'check') { const c = checkFor(); return c ? c[0] : title; }
  if (id === 'lang') return langPack() === 'hindi' ? 'Hindi Words' : 'Te Reo Māori';
  return title;
}
function editionSub(id, sub) {
  if (id === 'check') { const c = checkFor(); return c ? c[1] : sub; }
  if (id === 'lang') return langPack() === 'hindi' ? 'नमस्ते · numbers · colours' : 'kia ora · numbers · colours';
  return sub;
}
