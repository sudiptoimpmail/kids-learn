/* =========================================================
   Clear levels for children and grown-ups
   - Grade names in the family's own school system (Grade 3, Year 4, Class 3, 3rd Class …)
   - Children see steps inside their grade (●●○), never raw level numbers
   - Grown-ups see, per section, which part of their own curriculum it practises
   ========================================================= */
const GRADE_NAMES = {
  us: { prek: 'Pre-K', k: 'Kindergarten', g1: '1st Grade', g2: '2nd Grade', g3: '3rd Grade' },
  ca: { prek: 'Pre-K (JK)', k: 'Kindergarten', g1: 'Grade 1', g2: 'Grade 2', g3: 'Grade 3' },
  uk: { prek: 'Reception', k: 'Year 1', g1: 'Year 2', g2: 'Year 3', g3: 'Year 4' },
  au: { prek: 'Pre-school', k: 'Foundation', g1: 'Year 1', g2: 'Year 2', g3: 'Year 3' },
  nz: { prek: 'Early years', k: 'Year 1', g1: 'Year 2', g2: 'Year 3', g3: 'Year 4' },
  in: { prek: 'LKG', k: 'UKG', g1: 'Class 1', g2: 'Class 2', g3: 'Class 3' },
  ie: { prek: 'Junior Infants', k: 'Senior Infants', g1: '1st Class', g2: '2nd Class', g3: '3rd Class' },
};
const levelsCC = () => (typeof countryCode === 'function' && GRADE_NAMES[countryCode()] ? countryCode() : 'us');
function gradeName(g) { return (GRADE_NAMES[levelsCC()] || GRADE_NAMES.us)[g] || (GRADES[g] && GRADES[g].label) || ''; }

// where the child is inside their grade: [step, steps]
function gradeStep(id, lv = levelOf(id)) {
  const r = state.grade && gradeRange(state.grade, id);
  if (!r) { const max = maxLevelOf(id); return [Math.max(1, Math.ceil((lv / max) * 3)), 3]; }
  const steps = r[1] - r[0] + 1;
  return [Math.min(steps, Math.max(1, lv - r[0] + 1)), steps];
}
function stepDots(id, lv) {
  const [s, n] = gradeStep(id, lv);
  return `<span class="lv steps" aria-label="Step ${s} of ${n}">${'●'.repeat(s)}${'○'.repeat(Math.max(0, n - s))}</span>`;
}
// a game's own level (mazes, puzzles…) shown as three dots
function gameDots(lv, max) {
  const s = Math.max(1, Math.min(3, Math.ceil((lv / (max || 3)) * 3)));
  return `<span class="lv steps" aria-label="Step ${s} of 3">${'●'.repeat(s)}${'○'.repeat(3 - s)}</span>`;
}

/* ---------- curriculum areas each section practises, in the family's own curriculum ---------- */
const CURRICULUM_AREAS = {
  us: { name: 'Common Core / NGSS', add: '2.NBT · 3.NBT add within 1000', sub: '2.NBT · 3.NBT subtract within 1000', story: '2.OA · 3.OA word problems', numsense: '2.NBT · 3.NBT place value, rounding', frac: '2.G.3 · 3.NF fractions', measure: '2.MD · 3.MD measurement, data, money', clock: '2.MD.7 · 3.MD.1 time', mul: '3.OA · 3.NBT.3 multiplication', div: '3.OA division', shape2: '2.G · 3.G shapes', cmp: '1.NBT · 2.NBT compare numbers', phonics: 'RF.K–2 phonics', cvc: 'RF.K–1 decoding', sight: 'RF.1 high-frequency words', spell: 'L.2.2 · L.3.2 spelling', sent: 'RL · RI reading comprehension', words: 'L.2.4 · L.3.4 word meaning', gp: 'L.2.1–2 · L.3.1–2 grammar and punctuation', vocab: 'L.2.5 · L.3.5 vocabulary', sci: 'NGSS 2-PS1 · 2-LS2 · 2-ESS · 3-PS2 · 3-LS · 3-ESS', community: 'Social studies: civics, economics, geography', region: 'Social studies: state studies', home: 'Social studies: our country' },
  ca: { name: 'Ontario curriculum', add: 'Math B2 Operations', sub: 'Math B2 Operations', story: 'Math B2 Operations (problems)', numsense: 'Math B1 Number Sense', frac: 'Math B1 Fractions', measure: 'Math D1 Data · E2 Measurement · F1 Money', clock: 'Math E2 Measurement (time)', mul: 'Math B2 Multiplication', div: 'Math B2 Division', shape2: 'Math E1 Geometric Reasoning', cmp: 'Math B1 Number Sense', phonics: 'Language B Foundations (phonics)', cvc: 'Language B Foundations (decoding)', sight: 'Language B Foundations (word reading)', spell: 'Language B Foundations (spelling)', sent: 'Language C Comprehension', words: 'Language B Foundations (vocabulary, morphology)', gp: 'Language D Composition (grammar, punctuation)', vocab: 'Language B Foundations (vocabulary)', sci: 'Science & Technology strands B–E', community: 'Social Studies A Heritage and Identity · B People and Environments', region: 'Social Studies: living and working in your province', home: 'Social Studies: Canada' },
  uk: { name: 'National Curriculum (England)', add: 'Maths: addition and subtraction', sub: 'Maths: addition and subtraction', story: 'Maths: solving problems', numsense: 'Maths: number and place value', frac: 'Maths: fractions', measure: 'Maths: measurement and statistics', clock: 'Maths: measurement (time, 24-hour clock)', mul: 'Maths: multiplication and division (tables to 12 × 12)', div: 'Maths: multiplication and division', shape2: 'Maths: geometry', cmp: 'Maths: number and place value', phonics: 'English: word reading (phonics)', cvc: 'English: word reading', sight: 'English: common exception words', spell: 'English: spelling', sent: 'English: reading comprehension', words: 'English: vocabulary (prefixes, suffixes)', gp: 'English: vocabulary, grammar and punctuation', vocab: 'English: vocabulary', sci: 'Science (Years 2–4)', community: 'Geography and history; citizenship', region: 'Geography: the four nations of the UK', home: 'Geography: the United Kingdom' },
  au: { name: 'Australian Curriculum v9', add: 'Mathematics: Number', sub: 'Mathematics: Number', story: 'Mathematics: Number (problems)', numsense: 'Mathematics: Number (place value)', frac: 'Mathematics: Number (fractions)', measure: 'Mathematics: Measurement · Statistics', clock: 'Mathematics: Measurement (time)', mul: 'Mathematics: Number (multiplication)', div: 'Mathematics: Number (division)', shape2: 'Mathematics: Space', cmp: 'Mathematics: Number', phonics: 'English: Literacy (phonics and word knowledge)', cvc: 'English: Literacy (phonics)', sight: 'English: Literacy (word knowledge)', spell: 'English: Literacy (spelling)', sent: 'English: Literacy (comprehension)', words: 'English: Language (vocabulary)', gp: 'English: Language (grammar and punctuation)', vocab: 'English: Language (vocabulary)', sci: 'Science: Biological, Chemical, Earth and Physical sciences', community: 'HASS: Civics and Citizenship · Geography · History', region: 'HASS: states and territories', home: 'HASS: Australia' },
  nz: { name: 'New Zealand Curriculum', add: 'Maths: Number', sub: 'Maths: Number', story: 'Maths: Number (problems)', numsense: 'Maths: Number (place value)', frac: 'Maths: Number (fractions)', measure: 'Maths: Measurement · Statistics', clock: 'Maths: Measurement (time)', mul: 'Maths: Number (multiplication)', div: 'Maths: Number (division)', shape2: 'Maths: Geometry', cmp: 'Maths: Number', phonics: 'English: structured literacy (phonics)', cvc: 'English: decoding', sight: 'English: word reading', spell: 'English: spelling', sent: 'English: reading comprehension', words: 'English: vocabulary and morphology', gp: 'English: grammar and punctuation', vocab: 'English: vocabulary', sci: 'Science', community: 'Social Sciences', region: 'Social Sciences: regions of Aotearoa', home: 'Social Sciences: Aotearoa New Zealand' },
  in: { name: 'NCERT (CBSE)', add: 'Maths Mela / Joyful Mathematics: addition', sub: 'Maths Mela / Joyful Mathematics: subtraction', story: 'Maths Mela: word problems', numsense: 'Maths Mela: numbers and place value', frac: 'Maths Mela: parts and wholes', measure: 'Maths Mela: measurement, data and money', clock: 'Maths Mela: time', mul: 'Maths Mela: multiplication', div: 'Maths Mela: sharing and division', shape2: 'Maths Mela: shapes', cmp: 'Joyful Mathematics: comparing numbers', phonics: 'Mridang: sounds and letters', cvc: 'Mridang: reading words', sight: 'Mridang: word reading', spell: 'Santoor: spelling', sent: 'Santoor: reading with understanding (NIPUN)', words: 'Santoor: word study', gp: 'Santoor: grammar and punctuation', vocab: 'Santoor: vocabulary', sci: 'EVS — Our Wondrous World', community: 'EVS — Our Wondrous World (family, community)', region: 'EVS: my state', home: 'EVS: India' },
};
CURRICULUM_AREAS.ie = { ...CURRICULUM_AREAS.uk, name: 'Primary Curriculum (Ireland)', region: 'SESE Geography: my province', home: 'SESE Geography: Ireland', community: 'SESE · SPHE: my community' };
// show a standard only for the child's own grade: a Pre-K child's Adding is not "2.NBT · 3.NBT add within 1000"
function curriculumArea(id) {
  const c = CURRICULUM_AREAS[levelsCC()] || CURRICULUM_AREAS.us, s = c[id] || '';
  if (!/\b[K1-3]\.[A-Z]/.test(s)) return s;                     // plain curriculum names fit every grade
  const tag = { k: 'K', g1: '1', g2: '2', g3: '3' }[state.grade];
  return tag && new RegExp('\\b' + tag + '\\.[A-Z]').test(s) ? s : '';
}

/* ---------- quick placement check: 8 cards at the top of the grade ----------
   Two cards from each of four core sections. Both right first time → that section starts
   at the top of the grade; one right → the middle; none → the start of the grade. */
const PLACE_POOL = ['add', 'sub', 'mul', 'frac', 'numsense', 'sent', 'spell', 'words', 'phonics', 'cvc', 'syl'];
let placePlan = [];
let placementRunning = false;
function startPlacement() {
  const ids = PLACE_POOL.filter((id) => state.grade && gradeRange(state.grade, id));
  const math = ids.filter((id) => ['add', 'sub', 'mul', 'frac', 'numsense'].includes(id)), read = ids.filter((id) => !math.includes(id));
  const chosen = [...sample(math, Math.min(2, math.length)), ...sample(read, Math.min(2, read.length))];
  // Generate the entire assessment BEFORE startRound. A rejected duplicate must
  // never consume a plan slot and silently introduce a fifth fallback section.
  const used = new Set();
  placePlan = chosen.flatMap((id) => {
    const lv = gradeRange(state.grade, id)[1], cat = CATEGORIES.find((c) => c.id === id), gen = cat.baseGen || cat.gen;
    return Array.from({length: 2}, () => {
      let q, identity;
      for (let tries = 0; tries < 100; tries++) {
        q = gen(lv);
        identity = id + '|' + q.text + '|' + String(q.answer) + '|' + String(q.main || '');
        // the same grade-fit rule as every round: a card this child can't do is not a fair test
        if (typeof gradeFits === 'function' && !gradeFits(q, state.grade, id)) { identity = null; continue; }
        if (!used.has(identity)) break;
      }
      if (!identity || used.has(identity)) throw new Error('Not enough distinct placement cards for ' + id);
      used.add(identity);
      q.placeSection = id;
      q.assessedLevel = lv;
      q.key = 'place-' + placePlan.length + '-' + used.size + '-' + q.key;
      return q;
    });
  });
  placementRunning = true;
  try { startRound('placement', placePlan.length); }
  finally { placementRunning = false; placePlan = []; }
}
function genPlacement() {
  if (placePlan.length) return placePlan.shift();
  // Standalone curriculum/voice audits sample category generators without
  // launching an assessment; those previews must not mutate an active plan.
  if (placementRunning) throw new Error('Placement plan exhausted during an assessment');
  const id = PLACE_POOL.find((section) => state.grade && gradeRange(state.grade, section)) || 'add';
  const lv = state.grade && gradeRange(state.grade, id) ? gradeRange(state.grade, id)[1] : 1;
  const cat = CATEGORIES.find((c) => c.id === id), q = (cat.baseGen || cat.gen)(lv);
  q.placeSection = id; q.assessedLevel = lv; q.key = 'place-preview-' + q.key;
  return q;
}
function applyPlacement(qs) {
  const by = {};
  for (const q of qs) { const s = by[q.placeSection] || (by[q.placeSection] = [0, 0]); s[0]++; if (q.ok) s[1]++; }
  for (const [id, [n, ok]] of Object.entries(by)) {
    const r = gradeRange(state.grade, id); if (!r) continue;
    state.levels[id] = ok >= n ? r[1] : ok > 0 ? gradeStart(r.join('-')) : r[0];
    // Placement reassigns the section's level; previous round evidence belongs
    // to the old placement and must never trigger an immediate auto-level.
    if (state.progressionStreaks) delete state.progressionStreaks[id];
  }
  return Object.keys(by).length;
}
