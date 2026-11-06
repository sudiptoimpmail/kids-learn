/* =========================================================
   📊 Progress: what each child practiced, learned and still needs
   - Every answered card is recorded per child: day, game, level (= skill), right on the
     first try or not, hint used, seconds spent. Play Zone minutes are recorded too.
   - Home screen: today's goal (cards answered today) and the day streak.
   - Grown-ups (behind the PIN): last 7 days, accuracy, skills doing well / needing practice,
     each subject's level, and a short summary in plain words.
   Everything stays on the device.
   ========================================================= */
// what each game level practices (shown to grown-ups)
const SKILLS = {
  trace: ['Trace capital letters', 'Trace small letters', 'Trace numbers 1–20'],
  phonics: ['First letter of a word', 'Rhyming words', 'Ending letters and blending', 'Short vowel (middle) sounds', 'Blends and digraphs (sh, ch, tr…)'],
  cvc: ['Read 3-letter words', 'Hear and find 3-letter words', 'Missing vowels'],
  w4: ['Read 4-letter words', '4-letter words', '4-letter words (harder)', 'Read 5-letter words', 'Read long words'],
  sight: ['First sight words', 'Sight words', 'Sight words in sentences', 'Opposites'],
  spell: ['Missing letters', 'Spell 3-letter words', 'Spell 4-letter words', 'Spell 5-letter words and sight words', 'Spell long words'],
  vocab: ['Everyday words', 'Feelings and action words', 'Science and community words', '2nd–3rd grade words'],
  sent: ['Read short sentences', 'Read longer sentences', '1st-grade stories', '2nd-grade stories', '3rd-grade passages', 'Long passages'],
  match: ['Match words and pictures', 'Match numbers and amounts', 'Match problems and answers', 'Match (harder)', 'Match ×/÷ and long words'],
  syl: ['Clap syllables (1–3)', 'Clap syllables (up to 4)', 'Clap syllables (long words)'],
  add: ['Add within 5', 'Add within 10', 'Add within 20', 'Add 2-digit + 1-digit', 'Add with regrouping'],
  sub: ['Take away within 5', 'Take away within 10', 'Take away within 20', 'Subtract 2-digit − 1-digit', 'Subtract with regrouping'],
  story: ['Word problems within 10', 'Word problems within 20', 'Two-digit word problems', '"How many more?" problems', 'Two-step word problems'],
  cmp: ['More / fewer with pictures', 'Compare numbers to 10', 'Compare numbers to 20', 'Compare 2-digit numbers', 'Compare sums and differences'],
  mul: ['Equal groups', 'Times 2, 5 and 10', 'Times tables to 5', 'Times tables to 10', 'Missing factors and stories'],
  div: ['Share equally', 'Divide by 2, 5 and 10', 'Divide within 25', 'Divide within 100', 'Division stories'],
  clock: ["O'clock", 'Half past', 'Quarter past and to', 'Five minutes'],
  shape2: ['Name flat shapes', 'Flat and 3D shapes', 'Sides and solids', '3D shapes in real life'],
  words: ['Nouns and verbs', 'Plurals and opposites', 'Past tense and compound words', 'Contractions and synonyms', 'Prefixes, suffixes and sound-alikes'],
  numsense: ['Even, odd and tens', 'Place value and rounding', 'Hundreds and money', 'Fractions', 'Fractions of numbers and money'],
  sci: ['Living things and seasons', 'Animals, materials and magnets', 'Matter, space and food chains', 'Forces, rocks and energy'],
  home: ['Money, symbols and help', 'Capital, flag and holidays', 'States and neighbours', 'Rivers, mountains and capitals'],
  body: ['Big body parts', 'More body parts and what is inside', 'Small body parts'],
  gk: ['Animals and colors', 'Seasons, days, safety', 'Planets, plants, months', 'Continents, magnets, water'],
  anatomy: ['Main organs', 'More organs and big bones', 'Bones, kidneys, blood vessels', 'All bones and science facts'],
  jobs: ['Who does what', 'Jobs and tools', 'More jobs'],
  flags: ['Big countries\' flags', 'More flags', 'Flags of the world'],
  animals: ['Where animals live', 'Animals by country', 'Animals of the world (harder)'],
  places: ['Famous places', 'More famous places', 'Famous places of the world'],
  maps: ['Continents', 'Countries on the map', 'Countries and capitals'],
  pattern: ['AB patterns', 'AAB and ABB patterns', 'Three-symbol patterns', 'Number patterns', 'Growing number patterns'],
  odd: ['Recognize categories', 'Categorize by traits', 'Group by function and features'],
  sequence: ['Everyday order', 'Cause and effect', 'Multi-step sequences'],
};
const skillName = (cat, lv) => (SKILLS[cat] && SKILLS[cat][lv - 1]) || `${(CATEGORIES.find((c) => c.id === cat) || {}).title || cat} · level ${lv}`;
const SUBJECT = (cat) => (['pattern', 'odd', 'sequence'].includes(cat) ? 'Brain teasers'
  : ['add', 'sub', 'story', 'cmp', 'mul', 'div', 'clock', 'shape2', 'numsense', 'match'].includes(cat) ? 'Math'
  : ['phonics', 'cvc', 'w4', 'sight', 'spell', 'vocab', 'sent', 'syl', 'trace', 'words'].includes(cat) ? 'Reading & words' : 'Science & world');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAILY_GOAL = () => state.dailyGoal || 20;

function statsDay(day = dayKey()) {
  state.stats = state.stats || { days: {}, skills: {} }; state.stats.days = state.stats.days || {}; state.stats.skills = state.stats.skills || {};
  return state.stats.days[day] || (state.stats.days[day] = { q: 0, first: 0, hints: 0, secs: 0, play: 0, cats: {} });
}
// one answered card
function logAttempt(q, cat, level) {
  if (!q || q.logged || q.skipped || !cat) return;
  q.logged = true;
  const d = statsDay(), first = !!q.ok, alone = first && !q.hintShown;   // "alone" = right first time, no hint
  const secs = Math.min(60, Math.max(1, ((Date.now() - (q.t0 || Date.now())) / 1000)));
  // a screen with several little questions (a word box with 4 blanks) counts as that many answers
  const n = Math.max(1, Math.min(6, q.parts || 1));
  d.q += n; if (first) d.first += n; if (alone) d.alone = (d.alone || 0) + n; if (q.hintShown) d.hints++; d.secs += secs;
  const c = d.cats[cat] || (d.cats[cat] = [0, 0, 0]); c[0] += n; if (first) c[1] += n; if (alone) c[2] = (c[2] || 0) + n;
  const k = `${cat}:${level}`, sk = state.stats.skills[k] || (state.stats.skills[k] = { n: 0, ok: 0, recent: '', last: '', days: [] });
  // mastery uses only answers done alone; hinted answers count as "with help"
  sk.n++; if (alone) sk.ok++; sk.recent = (sk.recent + (alone ? '1' : first ? 'h' : '0')).slice(-12); sk.last = dayKey();
  sk.days = [...new Set([...(sk.days || []), dayKey()])].slice(-5);   // on which days it was practiced
  logObjectiveAttempt(q, cat, first, alone);
  if(typeof logPortfolioWord === 'function') logPortfolioWord(q,alone);
  if(typeof logGradeEvidence === 'function') logGradeEvidence(q,cat,level,alone);
  // keep 120 days of daily numbers
  const days = Object.keys(state.stats.days).sort(); while (days.length > 120) delete state.stats.days[days.shift()];
  if (d.q >= DAILY_GOAL() && d.q - n < DAILY_GOAL()) dailyGoalReached();
  saveSoon();
}
/* ---------- authored learning objectives (per child, grade and section) ----------
   Only questions with explicit metadata contribute to objective mastery.
   The ordinary per-game/level stats above remain available for all generators. */
const OBJECTIVE_EVIDENCE_FALLBACK = ContentData.get('curriculum-map', 'policy').objectiveEvidence;
const objectiveRule = grade => (GRADES[grade]?.objectiveEvidence || OBJECTIVE_EVIDENCE_FALLBACK);
const objectiveKey = (grade, category, objective) => JSON.stringify([grade, category, objective]);
function objectiveState(record, rule = objectiveRule(record.grade)) {
  const recent = typeof record.recent === 'string' ? record.recent.slice(-rule.window) : '';
  const n = recent.length;
  const acc = n ? [...recent].filter(x => x === '1').length / n : 0;
  if (n < rule.minCards) return { s: 'new', acc, recentCards: n };
  if (acc >= rule.masteryRate && (record.days || []).length >= rule.minDays)
    return { s: 'mastered', acc, recentCards: n };
  return { s: acc < rule.practiceRate ? 'learning' : 'practicing', acc, recentCards: n };
}
function logObjectiveAttempt(q, cat, first, alone) {
  const grade = state.grade, objective = q.curriculumSkill;
  if (!GRADES[grade] || !gradeRange(grade, cat) ||
      typeof objective !== 'string' || !objective.trim() || objective.length > 100 ||
      (Array.isArray(q.grades) && !q.grades.includes(grade))) return;
  state.stats.objectives = state.stats.objectives || {};
  const label = objective.trim();
  const key = objectiveKey(grade, cat, label);
  const row = state.stats.objectives[key] || (state.stats.objectives[key] = {
    grade, cat, objective: label, n: 0, ok: 0, recent: '', last: '', days: []
  });
  row.n++; if (alone) row.ok++;
  const rule = objectiveRule(grade);
  row.recent = (row.recent + (alone ? '1' : first ? 'h' : '0')).slice(-rule.window);
  row.last = dayKey();
  row.days = [...new Set([...(row.days || []), row.last])].slice(-rule.window);
}

/* ---------- grade-configured spaced review for authored objectives ----------
   Only metadata-backed content can be targeted. Do not infer skill tags from
   generated questions, and never bypass the main round's duplicate/grade guards. */
const reviewRule = grade => GRADES[grade]?.reviewSchedule ||
  ContentData.get('curriculum-map', 'policy').reviewSchedule;
function reviewAgeDays(last, today = dayKey()) {
  const parse = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, date] = value.split('-').map(Number);
    const t = Date.UTC(year, month - 1, date);
    return new Date(t).toISOString().slice(0,10) === value ? t : null;
  };
  const a = parse(last), b = parse(today);
  return a === null || b === null ? -1 : Math.floor((b - a) / 86400000);
}
// Authored coverage is the set of grade-eligible objectives actually present
// in offline question banks, not an invented checklist of generic games.
function authoredObjectiveCatalog(grade) {
  if (!GRADES[grade]) return [];
  const found = new Map();
  const add = (cat, objective, level) => {
    if (!gradeRange(grade,cat) || typeof objective !== 'string' ||
        !objective.trim() || !Number.isInteger(level)) return;
    const key = objectiveKey(grade,cat,objective);
    const prior = found.get(key);
    if (prior) prior.level = Math.min(prior.level,level);
    else found.set(key,{key,grade,cat,objective,level});
  };
  for (const routes of Object.values(ContentData.get('curriculum-map','ROUTES'))) {
    if (!Array.isArray(routes)) continue;
    for (const route of routes) {
      if (route.grade===grade) add(route.section,route.skill,route.level);
    }
  }
  for (const [book,cat] of [['explorer-math','story'],['explorer-science','sci']]) {
    const rows=ContentData.get(book,'questions');
    for (const item of rows) {
      if (Array.isArray(item.grades) && item.grades.includes(grade))
        add(cat,item.domain,item.level);
    }
  }
  return [...found.values()];
}

function dueObjectiveReviews(cat, today = dayKey(), forcedObjective = null) {
  const grade = state.grade;
  if (!GRADES[grade] || !gradeRange(grade, cat)) return [];
  const rule = reviewRule(grade);
  const rank = { learning: 0, practicing: 1, new: 2, mastered: 3 };
  const rows = Object.values(state.stats?.objectives || {}).filter(row =>
    row && row.grade === grade && row.cat === cat &&
    typeof row.objective === 'string' && row.objective.trim() &&
    typeof row.recent === 'string');
  const due = rows.map(row => {
    const status = objectiveState(row).s;
    const age = reviewAgeDays(row.last, today);
    const scheduled = age >= rule.intervalDays[status];
    const manual = forcedObjective !== null && row.objective === forcedObjective;
    return { objective: row.objective, status, age, due: scheduled || manual,
      priority: rank[status], manual };
  }).filter(item => item.due && item.age >= 0 &&
    (forcedObjective === null || item.manual));
  // A parent's explicit request may also introduce a previously unseen,
  // *authored* objective. Never create a synthetic performance record.
  if (forcedObjective !== null && !rows.some(row=>row.objective===forcedObjective) &&
      authoredObjectiveCatalog(grade).some(row=>row.cat===cat &&
        row.objective===forcedObjective)) {
    due.push({ objective:forcedObjective,status:'new',age:0,due:true,
      priority:rank.new,manual:true });
  }
  return due.sort((a,b)=>a.priority-b.priority || b.age-a.age);
}
function authoredReviewQuestions(cat, level, forcedObjective = null, today = dayKey()) {
  const grade = state.grade;
  if (!GRADES[grade] || !gradeRange(grade, cat)) return [];
  const targets = dueObjectiveReviews(cat, today, forcedObjective);
  if (!targets.length) return [];
  const shuffled = [], seen = new Set();
  const add = q => {
    if (!q || !q.key || !q.curriculumSkill || seen.has(q.key+'|'+(q.qkey||''))) return;
    seen.add(q.key+'|'+(q.qkey||'')); shuffled.push(q);
  };
  // Every eligibility condition is read from the authored route metadata.
  const routes = ContentData.get('curriculum-map', 'ROUTES');
  for (const target of targets) {
    const choices = [];
    for (const [bank, rows] of Object.entries(routes)) {
      if (!Array.isArray(rows)) continue;
      const original = ContentData.get('grade23-extension', bank);
      for (let i = 0; i < rows.length; i++) {
        const route = rows[i];
        if (route.grade !== grade || route.section !== cat ||
            route.skill !== target.objective || route.level > level) continue;
        const row = Object.assign([route.level, ...original[i].slice(1)],
          { curriculumSkill: route.skill });
        let q;
        if (bank === 'SCIENCE' || bank === 'GK') {
          q = mcQuestion(cat, row, level);
          if (!CLIPS[clipKey(q.say)]) q.say = 'Find the answer!';
          choices.push(q);
        } else if (bank === 'STORIES') {
          for (const pair of row[2]) {
            const passage = [row[1], [pair], row[0], true, row.curriculumSkill];
            q = genSentence(level, passage);
            choices.push(q);
          }
        } else if (bank === 'THINKING_ODD') {
          choices.push(genOdd(level, row));
        } else if (bank === 'THINKING_SEQUENCES') {
          choices.push(genSequence(level, row));
        }
      }
    }
    // Explorer domains are authored objective labels too; grade eligibility is
    // explicit in the lesson JSON, and the renderer already validates answers.
    const explorer = cat === 'story' ? 'math' : cat === 'sci' ? 'science' : null;
    if (explorer && window.ExplorerCurriculum) {
      const rows = ContentData.get('explorer-'+explorer,'questions');
      for (const q of rows) {
        if (!q.grades.includes(grade) || q.level > level ||
            q.domain !== target.objective) continue;
        choices.push(window.ExplorerCurriculum.getQuestion(explorer,q.id));
      }
    }
    for (const q of shuffle(choices)) {
      if (!q?.curriculumSkill) continue;
      // A grade-routed question belongs to the grade that authored it;
      // Explorer questions retain their own explicitly declared eligible grades.
      if (!q.grades) q.grades = [grade];
      add(q);
    }
  }
  return shuffled;
}

// answers are saved a moment later (and right away if the app goes to the background)
function saveSoon() { clearTimeout(saveSoon.t); saveSoon.t = setTimeout(save, 800); }
addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(saveSoon.t); save(); } });
addEventListener('pagehide', () => { clearTimeout(saveSoon.t); save(); });
// tracing is a "did it" activity, not a right/wrong answer: counted separately
function logTrace(secs) { const d = statsDay(); d.traced = (d.traced || 0) + 1; d.secs += Math.min(120, Math.max(1, secs)); saveSoon(); }
function logPlay(secs) { if (secs > 2) { statsDay().play += Math.min(secs, 3600); save(); } }
// Brain Games are educational puzzles: count completed challenges, not as arcade minutes.
function logBrainWin(gameId) {
  const d = statsDay();
  d.brain = (d.brain || 0) + 1;
  d.brainByGame = d.brainByGame || {};
  d.brainByGame[gameId] = (d.brainByGame[gameId] || 0) + 1;
  saveSoon();
}
// a skill's state from its last 12 answers
function skillState(sk) {
  const r = sk.recent, n = r.length, acc = n ? [...r].filter((x) => x === '1').length / n : 0;
  if (n < 5) return { s: 'new', acc };
  // mastered: 85%+ done alone over 8+ recent cards, practiced on at least 2 different days
  if (acc >= 0.85 && n >= 8 && (sk.days || []).length >= 2) return { s: 'mastered', acc };
  if (acc >= 0.85 && n >= 8) return { s: 'practicing', acc };
  if (acc >= 0.7) return { s: 'practicing', acc };
  return { s: 'learning', acc };
}
const isLearningDay = (d) => !!d && ((d.q || 0) > 0 || (d.brain || 0) > 0 || (d.traced || 0) > 0 || (d.books || 0) > 0);
function dayStreak() {
  const days = (state.stats && state.stats.days) || {};
  let n = 0; const d = new Date();
  if (!isLearningDay(days[dayKey(d)])) d.setDate(d.getDate() - 1);   // today not started yet: count up to yesterday
  while (isLearningDay(days[dayKey(d)])) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- home: today's goal and streak ---------- */
function renderToday() {
  const el = $('#todayChip'); if (!el) return;
  const d = (state.stats && state.stats.days[dayKey()]) || { q: 0 }, goal = DAILY_GOAL(), pct = Math.min(1, d.q / goal), streak = dayStreak();
  el.innerHTML = `<span class="ring" style="--p:${Math.round(pct * 100)}"><i>${pct >= 1 ? '✅' : '🎯'}</i></span><span><b>${Math.min(d.q, goal)}/${goal}</b> today</span>${streak > 1 ? `<span class="streak">🔥 ${streak} days</span>` : ''}${d.brain ? `<span class="streak">🧠 ${d.brain} solved</span>` : ''}`;
  el.classList.toggle('done', pct >= 1);
}
function dailyGoalReached() {
  setTimeout(() => { confetti(200, 0.3); say("You finished today's goal! Super star!"); renderToday(); }, 2200);
}

/* ---------- grown-ups: progress dashboard ---------- */
let dashFrom = 'settings';   // where ‹ goes back to
function openDashboard(from = 'settings') {
  dashFrom = from;
  renderDashboard();
  show('dash');
}
function renderDashboard() {
  const kids = Store.kids();
  $('#dashKids').innerHTML = kids.length > 1 ? kids.map((k) => `<button class="kid-chip ${k.id === Store.activeId() ? 'on' : ''}" data-id="${k.id}"><span>${esc(k.avatar || '🦄')}</span>${esc(k.name || 'Player')}</button>`).join('') : '';
  $$('#dashKids .kid-chip').forEach((b) => (b.onclick = () => { sfx.tap(); switchKid(b.dataset.id); renderDashboard(); }));
  const st = state.stats || { days: {}, skills: {} };
  const name = esc(state.name || 'Your child');
  // last 7 days
  const week = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dayKey(d); week.push([d, st.days[k] || { q: 0, first: 0, secs: 0, play: 0, hints: 0, cats: {} }]); }
  const sum = (f) => week.reduce((a, [, x]) => a + f(x), 0);
  const q7 = sum((x) => x.q), f7 = sum((x) => (x.alone != null ? x.alone : x.first)), traced7 = sum((x) => x.traced || 0), books7 = sum((x) => x.books || 0), learnSecs = sum((x) => x.secs), learnMin = Math.round(learnSecs / 60), learnShow = learnSecs > 0 && learnSecs < 60 ? '<1' : learnMin, playMin = Math.round(sum((x) => x.play) / 60), days7 = week.filter(([, x]) => isLearningDay(x)).length, hints7 = sum((x) => x.hints), brain7 = sum((x) => x.brain || 0);
  const maxQ = Math.max(10, ...week.map(([, x]) => x.q));
  const goal = DAILY_GOAL();
  $('#dashTop').innerHTML = `
    <div class="dash-cards">
      <div class="dc"><b>${q7}</b><small>cards answered</small></div>
      <div class="dc"><b>${q7 ? Math.round(f7 / q7 * 100) : 0}%</b><small>right on their own (no hint)</small></div>
      <div class="dc"><b>${days7}<small>/7</small></b><small>learning days${traced7 ? ` · ${traced7} letters traced` : ''}${books7 ? ` · ${books7} book${books7 === 1 ? '' : 's'} read` : ''}</small></div>
      <div class="dc"><b>${learnShow}<small> min</small></b><small>learning · ${playMin} min play</small></div>
       <div class="dc"><b>${brain7}</b><small>brain puzzles solved</small></div>
    </div>
    <div class="dash-week">${week.map(([d, x]) => `<div class="bar-col"><div class="bar" style="height:${Math.round(x.q / maxQ * 100)}%"><span class="bar-ok" style="height:${x.q ? Math.round((x.alone != null ? x.alone : x.first) / x.q * 100) : 0}%"></span></div>
      ${x.q >= goal ? '<i class="goal">✅</i>' : ''}<small>${x.q || ''}</small><em>${d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}</em></div>`).join('')}</div>
    <div class="dash-legend"><span class="lg ok"></span> right on their own <span class="lg all"></span> all cards · ✅ daily goal (${goal}) reached · 🔥 streak: ${dayStreak()} day${dayStreak() === 1 ? '' : 's'}</div>`;
  // Display verified learning objectives separately from generic game levels.
  // Old profiles need no migration: they simply have no objective records yet.
  const objectiveRows = Object.values(st.objectives || {})
    .filter(row => row && row.grade === state.grade &&
      row.cat && gradeRange(state.grade, row.cat) &&
      typeof row.objective === 'string' && row.objective.trim())
    .map(row => ({ ...row, ...objectiveState(row) }));
  const objectiveGood = objectiveRows.filter(row => row.s === 'mastered')
    .sort((a,b) => b.acc-a.acc);
  const objectiveWeak = objectiveRows.filter(row => row.s === 'learning')
    .sort((a,b) => a.acc-b.acc);
  const objectiveDeveloping = objectiveRows.filter(row => row.s === 'practicing')
    .sort((a,b) => a.acc-b.acc);
  const objectiveNew = objectiveRows.filter(row => row.s === 'new')
    .sort((a,b) => b.n-a.n);
  const objectiveLabel = value => String(value).replaceAll('-', ' ').replace(/^./, x => x.toUpperCase());
  // Coverage measures which *authored, tagged* objectives have been attempted,
  // never a child's overall grade completion or an inferred achievement score.
  const authoredCatalog = authoredObjectiveCatalog(state.grade);
  const attempted = authoredCatalog.filter(item =>
    Number.isInteger(st.objectives?.[item.key]?.n) && st.objectives[item.key].n > 0);
  const notYet = authoredCatalog.filter(item =>
    !Number.isInteger(st.objectives?.[item.key]?.n) || st.objectives[item.key].n <= 0);
  const nextNew = notYet.find(item => item.level <= levelOf(item.cat) &&
    CATEGORIES.some(cat => cat.id===item.cat && !!cat.gen));
  const coveredPct = authoredCatalog.length
    ? Math.round(attempted.length/authoredCatalog.length*100) : 0;
  const coverageHTML = authoredCatalog.length
    ? `<div class="ds"><h3>Practice goals tried</h3>
      <p><b>${attempted.length} of ${authoredCatalog.length}</b> of this grade's practice goals tried (${coveredPct}%).</p>
      <p class="note">This shows what your child has tried, not grade completion.</p>
      ${notYet.length ? `<p class="note">${notYet.length} still to try.</p>` : ''}
      ${nextNew ? `<button class="big-btn small" id="dashExploreObjective"
        data-category="${esc(nextNew.cat)}" data-objective="${esc(nextNew.objective)}"
        aria-label="Explore ${esc(objectiveLabel(nextNew.objective))}">
        Explore new objective: ${esc(objectiveLabel(nextNew.objective))}
      </button>` : ''}</div>`
    : '';
  const objectiveItem = row => {
    const category = CATEGORIES.find(c => c.id === row.cat);
    const cards = Number.isInteger(row.n) && row.n >= 0 ? row.n : row.recentCards;
    return `<li><span>${esc(objectiveLabel(row.objective))}<small>${esc(category?.title || row.cat)}</small></span><small>${Math.round(row.acc*100)}% · ${cards} cards</small></li>`;
  };
  const objectivesHTML = objectiveRows.length
    ? `<div class="ds"><h3>Learning objectives · ${esc(gradeName(state.grade))}</h3>
       <p class="note">Based on the specific skills practised in this grade.</p>
       ${objectiveGood.length ? `<h4>Mastered</h4><ul>${objectiveGood.slice(0,6).map(objectiveItem).join('')}</ul>` : ''}
       ${objectiveWeak.length ? `<h4>Needs practice</h4><ul>${objectiveWeak.slice(0,6).map(objectiveItem).join('')}</ul>` : ''}
       ${objectiveDeveloping.length ? `<h4>Developing</h4><ul>${objectiveDeveloping.slice(0,6).map(objectiveItem).join('')}</ul>` : ''}
       ${objectiveNew.length ? `<h4>Just starting</h4><ul>${objectiveNew.slice(0,6).map(objectiveItem).join('')}</ul>
         <p class="note">More practice over multiple days is needed before these objectives can be assessed.</p>` : ''}
       </div>`
    : '';
  // Existing game-level summaries are kept for the large untagged question banks.
  const skills = Object.entries(st.skills).map(([k, sk]) => { const [cat, lv] = k.split(':'); return { cat, lv: +lv, name: skillName(cat, +lv), ...skillState(sk), n: sk.n, last: sk.last }; });
  const good = skills.filter((s) => s.s === 'mastered').sort((a, b) => b.acc - a.acc);
  const weak = skills.filter((s) => s.s === 'learning').sort((a, b) => a.acc - b.acc);
  const going = skills.filter((s) => s.s === 'practicing');
  const row = (s) => `<li><span>${s.name}</span><small>${(CATEGORIES.find((c) => c.id === s.cat) || {}).icon || ''} ${Math.round(s.acc * 100)}%</small></li>`;
  $('#dashSkills').innerHTML = coverageHTML + objectivesHTML + `
    <div class="ds good"><h3>🌟 Doing well</h3>${good.length ? `<ul>${good.slice(0, 8).map(row).join('')}</ul>` : '<p class="note">Skills show here after 8 or more cards with mostly right answers.</p>'}</div>
    <div class="ds weak"><h3>🧩 Needs practice</h3>${weak.length ? `<ul>${weak.slice(0, 8).map(row).join('')}</ul>` : '<p class="note">Nothing stuck right now. 👍</p>'}</div>
    ${going.length ? `<div class="ds"><h3>📈 Getting there</h3><ul>${going.slice(0, 8).map(row).join('')}</ul></div>` : ''}`;
  const explore = $('#dashExploreObjective');
  if (explore) explore.onclick = () => {
    sfx.tap();
    startRound(explore.dataset.category,5,false,null,explore.dataset.objective);
  };
  // Give parents a small, practical next step rather than only performance charts.
  // Recommendations are derived locally from the child's saved skill results.
  const priority = [...objectiveWeak,...objectiveDeveloping,...weak,...going]
    .filter(x=>gradeRange(state.grade,x.cat)).map(x=>x.cat);
  const gradeFocus = GRADES[state.grade]?.practiceFocus || [];
  const candidates = [...new Set([...priority,...gradeFocus])]
    .filter(id=>gradeRange(state.grade,id)).slice(0,3);
  const practiceTips = {
    gk:'Name the pictures together. Ask what makes the answer special.',
    phonics:'Say each sound slowly, then blend it into a word.',
    shape2:'Find the same shape in your home and describe it.',
    sent:'Read together and ask which sentence supports the answer.',
    add:'Use toys or counters; explain how the groups combine.',
    numsense:'Count, measure or compare real objects before tapping.',
    sci:'Ask for a prediction and one observation that supports it.',
    mul:'Use equal groups of small objects before writing a fact.'
  };
  $('#dashNext').innerHTML = candidates.map((id,i)=>{
    const cat=CATEGORIES.find(x=>x.id===id);
    if(!cat)return '';
    const tip=practiceTips[id]||'Ask your child to explain how they decided.';
    const objective = [...objectiveWeak,...objectiveDeveloping].find(row=>row.cat===id);
    const focus = objective?.objective || '';
    const purpose = focus ? `<p class="note">Focus: ${esc(objectiveLabel(focus))}</p>` : '';
    return `<div class="dash-recommend"><div class="dash-recommend-head"><span class="dash-recommend-no">${i+1}</span><b>${cat.icon} ${cat.title}</b><small>5-minute practice</small></div><p>${tip}</p>${purpose}<button class="big-btn small" data-practice="${id}" data-focus="${esc(focus)}" aria-label="Practice ${esc(cat.title)}">Start practice</button></div>`;
  }).join('') + '<p class="note small">Practice is based on recent answers and the selected grade, not a standardized assessment. Talk, read, draw and explore together too.</p>';
  $$('#dashNext [data-practice]').forEach(button=>button.onclick=()=>{
    sfx.tap();
    startRound(button.dataset.practice,5,false,null,button.dataset.focus || null);
  });
  // subjects: level now and this week's accuracy
  const catWeek = {};
  for (const [, x] of week) for (const [c, v] of Object.entries(x.cats)) { const a = catWeek[c] || (catWeek[c] = [0, 0]); a[0] += v[0]; a[1] += v[2] != null ? v[2] : v[1]; }
  const shown = CATEGORIES.filter((c) => c.gen && c.id !== 'mix' && (catWeek[c.id] || state.levels[c.id]));
  $('#dashSubjects').innerHTML = `${typeof CURRICULUM_AREAS !== 'undefined' ? `<p class="curr-name">Matched to: <b>${(CURRICULUM_AREAS[levelsCC()] || CURRICULUM_AREAS.us).name}</b></p>` : ''}<table><tr><th>Game</th><th>Level</th><th>This week</th></tr>${shown.map((c) => {
    const w = catWeek[c.id];
    const area = '';
    return `<tr><td>${c.icon} ${typeof localTileTitle === 'function' ? localTileTitle(c.id, c.title) : c.title}<small>${skillName(c.id, levelOf(c.id))}</small>${area ? `<small class="curr-area">📘 ${area}</small>` : ''}</td><td>${levelOf(c.id)}<small>/${maxLevelOf(c.id)}</small></td><td>${w ? `${w[0]} cards · ${Math.round(w[1] / w[0] * 100)}%` : '—'}</td></tr>`;
  }).join('')}</table>`;
  // summary in plain words
  const bySubject = {};
  for (const [c, [n, ok]] of Object.entries(catWeek)) { const s = SUBJECT(c); const a = bySubject[s] || (bySubject[s] = [0, 0]); a[0] += n; a[1] += ok; }
  const topSub = Object.entries(bySubject).sort((a, b) => b[1][0] - a[1][0])[0];
  const lines = [];
  if (!q7 && !brain7 && !traced7) lines.push(`${name} hasn't practiced in the last 7 days. A few minutes a day helps a lot!`);
  else if (!q7) lines.push(`${name} practiced on ${days7} day${days7 === 1 ? '' : 's'} with ${brain7} brain puzzle${brain7 === 1 ? '' : 's'} and ${traced7} traced character${traced7 === 1 ? '' : 's'}.`);
  else {
    lines.push(`This week ${name} learned on ${days7} day${days7 === 1 ? '' : 's'} and answered ${q7} cards (${Math.round(f7 / q7 * 100)}% right on their own, without a hint).`);
    if (topSub) lines.push(`Most practice: ${topSub[0].toLowerCase()} (${topSub[1][0]} cards).`);
    if (brain7) lines.push(`Solved ${brain7} brain puzzle${brain7 === 1 ? '' : 's'} this week.`);
    if (good[0]) lines.push(`Doing well: ${good.slice(0, 2).map((s) => s.name.toLowerCase()).join(' and ')}.`);
    if (weak[0]) lines.push(`Needs more practice: ${weak.slice(0, 2).map((s) => s.name.toLowerCase()).join(' and ')}. Try a round of ${(CATEGORIES.find((c) => c.id === weak[0].cat) || {}).title} together.`);
    if (hints7 > q7 * 0.4) lines.push('Hints were used a lot — that\'s fine while learning; the levels will adjust.');
    if (playMin > learnMin * 1.5 && playMin > 10) lines.push('Play time was higher than learning time this week. You can change the Play Zone rule in ⚙️.');
  }
  $('#dashSummary').innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
  $('#dashGoal').value = String(goal);
}
$('#dashBack').onclick = () => { sfx.tap(); if (dashFrom === 'home') { renderHome(); show('home'); } else openSettings(); };
// straight from the home screen, behind the grown-up PIN like Settings
$('#homeDashBtn').onclick = () => { sfx.tap(); askPin(() => openDashboard('home')); };
$('#dashGoal').onchange = () => { state.dailyGoal = +$('#dashGoal').value; save(); renderDashboard(); };
$('#dashBtn').onclick = () => { sfx.tap(); openDashboard('settings'); };

/* =========================================================
   🗺️ Today's Quest: a short, guided mix for each day (about 10–12 minutes)
   Built once a day per child from their grade, their weakest skill, and what they
   haven't practiced lately: a warm-up, a skill that needs practice, reading, a discovery
   topic (and tracing for Pre-K/K). Each step is 5 cards. All done → a gift.
   ========================================================= */
const QUEST_LEN = 5;
const QUEST_READING = { prek: ['phonics', 'vocab', 'syl'], k: ['phonics', 'cvc', 'sight'], g1: ['sent', 'sight', 'phonics', 'spell', 'words'], g2: ['sent', 'spell', 'vocab', 'words'], g3: ['sent', 'vocab', 'spell', 'words'] };
const QUEST_MATH = { prek: ['add', 'sub', 'shape2'], k: ['add', 'sub', 'story'], g1: ['add', 'sub', 'story', 'numsense'], g2: ['add', 'sub', 'mul', 'story', 'numsense'], g3: ['mul', 'div', 'story', 'numsense'] };
const QUEST_WORLD = ['sci', 'home', 'animals', 'places', 'maps', 'body', 'gk', 'shape2', 'jobs', 'flags', 'anatomy'];
const QUEST_THINKING = ['pattern', 'odd', 'sequence'];
function questFor() {
  const today = dayKey(), grade = state.grade || 'k';
  const visible = new Set(visibleGames().filter((c) => c.gen && c.id !== 'mix').map((c) => c.id));
  const ok = (id) => visible.has(id);
  if (state.quest && state.quest.date === today && state.quest.grade === grade && state.quest.steps.every(s => ok(s.cat) || (s.cat === 'trace' && ['prek', 'k'].includes(grade)))) return state.quest;
  // how many days ago each game was played (from the last 7 days)
  const ago = {};
  for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); const x = state.stats && state.stats.days[dayKey(d)]; if (x) for (const c of Object.keys(x.cats)) if (ago[c] == null) ago[c] = i; }
  const freshest = (list) => list.filter(ok).sort((a, b) => (ago[b] ?? 99) - (ago[a] ?? 99))[0];
  const steps = [], used = new Set();
  const addStep = (cat, why) => { if (cat && !used.has(cat) && (ok(cat) || cat === 'trace')) { used.add(cat); steps.push({ cat, why, done: false }); } };
  // 1. warm-up: something she does well (a quick win), or reading basics
  const skills = Object.entries((state.stats && state.stats.skills) || {}).map(([k, sk]) => ({ cat: k.split(':')[0], lv: +k.split(':')[1] || 1, ...skillState(sk) }));
  const strong = skills.filter((s) => s.s === 'mastered' && ok(s.cat)).sort((a, b) => b.acc - a.acc)[0];
  addStep(strong ? strong.cat : freshest(QUEST_READING[grade] || QUEST_READING.k), 'warm-up');
  // 2. the skill that needs practice most, or core math
  const objectiveWeak = Object.values(state.stats?.objectives || {})
    .filter(row => row && row.grade === grade && ok(row.cat) && !used.has(row.cat))
    .map(row => ({ ...row, ...objectiveState(row), lv: levelOf(row.cat) }))
    .filter(row => (row.s === 'learning' || row.s === 'practicing') &&
      dueObjectiveReviews(row.cat,today).some(item => item.objective === row.objective))
    .sort((a,b) => a.acc-b.acc);
  const weak = objectiveWeak[0] || skills.filter((s) =>
    (s.s === 'learning' || s.s === 'practicing') && ok(s.cat) && !used.has(s.cat))
    .sort((a, b) => a.acc - b.acc)[0];
  addStep(weak ? weak.cat : freshest((QUEST_MATH[grade] || QUEST_MATH.k).filter((c) => !used.has(c))), weak ? 'practice' : 'math');
  if (weak && steps.length && steps[steps.length - 1].cat === weak.cat) {
    steps[steps.length - 1].level = weak.lv;
    if (weak.objective) steps[steps.length - 1].objective = weak.objective;
  }
  // 3. reading (if not already in), 4. math (if not already in)
  addStep(freshest((QUEST_READING[grade] || QUEST_READING.k).filter((c) => !used.has(c))), 'reading');
  if (!steps.some((s) => (QUEST_MATH[grade] || []).includes(s.cat))) addStep(freshest((QUEST_MATH[grade] || QUEST_MATH.k).filter((c) => !used.has(c))), 'math');
  // 5. discovery: science and the world
  addStep(freshest(QUEST_WORLD.filter((c) => !used.has(c))), 'discover');
  // Alternate a thinking lesson in the daily plan without dropping discovery.
  if (+today.slice(-2) % 2 === 0) addStep(freshest(QUEST_THINKING.filter((c) => !used.has(c))), 'thinking');
  while (steps.length > (grade === 'prek' || grade === 'k' ? 4 : 5)) {
    const drop = ['warm-up', 'reading', 'math'].map((w) => steps.findIndex((x) => x.why === w)).find((i) => i >= 0);
    if (drop == null) break;
    steps.splice(drop, 1);
  }
  // Little ones trace three characters; preserve thinking and discovery if included.
  if (grade === 'prek' || grade === 'k') {
    while (steps.length > 4) { const drop = ['math', 'reading', 'warm-up'].map((w) => steps.findIndex((x) => x.why === w)).find((i) => i >= 0); if (drop == null) break; steps.splice(drop, 1); }
    steps.splice(1, 0, { cat: 'trace', why: 'tracing', done: false });
  }
  state.quest = { date: today, grade, steps: steps.slice(0, 5), gift: false };
  save();
  return state.quest;
}
// names of what today's quest practised, for the All done line
const questNames = (q) => q.steps.map((s) => (s.cat === 'trace' ? 'Tracing' : (CATEGORIES.find((x) => x.id === s.cat) || { title: s.cat }).title));
// one obvious next step for the child: start, keep going, open the gift, or done for today
function questGoHTML(q, nextI, all) {
  if (all && q.gift) return `<div class="quest-done">✅ <b>All done for today!</b> <span>You practised ${questNames(q).join(', ')}.</span></div>`;
  if (all) return '<button id="questGo" class="quest-go">🎁 Open your gift!</button>';
  const started = q.steps.some((s) => s.done);
  return `<button id="questGo" class="quest-go">▶ ${started ? 'Keep going' : "Start today's 10 minutes"}</button>`;
}
function renderQuest() {
  const box = $('#questBox'); if (!box) return;
  const q = questFor(), doneN = q.steps.filter((s) => s.done).length, all = doneN === q.steps.length;
  const nextI = q.steps.findIndex((s) => !s.done);
  box.innerHTML = `<div class="quest-head"><b>🗺️ Today's Quest</b><span class="quest-checks">${q.steps.map((s) => `<i class="${s.done ? 'on' : ''}">✓</i>`).join('')}<i class="gift ${all ? (q.gift ? 'opened' : 'ready') : ''}">🎁</i></span></div>
    ${questGoHTML(q, nextI, all)}
    <div class="quest-steps">${q.steps.map((s, i) => {
      const c = s.cat === 'trace' ? { icon: '✍️', title: 'Tracing', color: '#f76707' } : CATEGORIES.find((x) => x.id === s.cat) || { icon: '⭐', title: s.cat, color: '#8f6bff' };
      return `<button class="quest-step ${s.done ? 'done' : ''} ${i === nextI ? 'next' : ''}" data-i="${i}" style="--c:${c.color}"><span class="qs-ico">${c.icon}</span><span class="qs-t">${c.title}</span><span class="qs-why">${{ 'warm-up': 'Warm up', practice: 'Practice', math: 'Math', reading: 'Reading', discover: 'Discover', thinking: 'Think', tracing: 'Write' }[s.why] || ''}</span>${s.done ? '<span class="qs-ok">✓</span>' : ''}</button>`;
    }).join('')}${all ? `<button class="quest-step gift-step ${q.gift ? 'done' : 'next'}" data-gift="1"><span class="qs-ico">🎁</span><span class="qs-t">${q.gift ? 'Gift opened!' : 'Open your gift!'}</span></button>` : ''}</div>`;
  const go = $('#questGo', box);
  if (go) go.onclick = () => { sfx.tap(); if (all) { if (!q.gift) openQuestGift(); } else startQuestStep(nextI); };
  $$('.quest-step', box).forEach((b) => (b.onclick = () => {
    sfx.tap();
    if (b.dataset.gift) return openQuestGift();
    startQuestStep(+b.dataset.i);
  }));
}
function startQuestStep(i) {
  const q = questFor(), s = q.steps[i]; if (!s) return;
  if (s.cat === 'trace') { TR.quest = { i, left: 3, date: q.date }; openTrace(); return; }
  startRound(s.cat, QUEST_LEN, false, s.level || null, s.objective || null);
  R.questStep = i;
}
function questStepDone(i) {
  const q = questFor(); if (!q.steps[i] || q.steps[i].done) return;
  if (TR.quest && TR.quest.date && TR.quest.date !== q.date) return;   // an old quest from yesterday
  q.steps[i].done = true; save();
  if (q.steps.every((s) => s.done)) setTimeout(() => say('You finished today\'s quest! Open your gift!'), 1800);
}
function openQuestGift() {
  const q = questFor(); if (q.gift) return;
  q.gift = true;
  state.quests = (state.quests || 0) + 1;
  state.stars += 5;
  // a free Play Zone break — only where the play rule uses breaks (in 'minutes every hour' mode, time is set by the hour)
  const givesPlay = !hourlyMode() && !state.playAlways;
  if (givesPlay) state.playPasses = (state.playPasses || 0) + 1;
  const left = STICKERS.filter((x) => !state.stickers.includes(x));
  const sticker = left.length ? left[Math.floor(Math.random() * left.length)] : '🏆';
  if (left.length) state.stickers.push(sticker);
  save();
  confetti(260, 0.25); setTimeout(() => confetti(200, 0.5), 500); sfx.win();
  const canPlay = givesPlay || playOpen();
  say(['Surprise!', givesPlay ? 'Five stars, a new sticker, and play time!' : 'Five stars and a new sticker!']);
  const d = document.createElement('div'); d.className = 'time-up quest-gift';
  d.innerHTML = `<div class="tu-box"><div class="gift-open">🎁</div><div class="gift-items"><span>⭐ +5</span><span class="gs">${sticker}</span>${givesPlay ? '<span>🎮 Play time</span>' : ''}</div>
    <h2>All done for today!</h2><p class="gift-learned">You practised ${questNames(q).join(', ')}.</p><p>${state.quests} quest${state.quests === 1 ? '' : 's'} finished so far</p>
    <div class="res-btns">${canPlay ? '<button class="big-btn ico" data-a="play" aria-label="Play now">🎮 Play</button>' : ''}<button class="big-btn alt ico" data-a="home" aria-label="Home">🏠 Home</button></div></div>`;
  document.body.appendChild(d);
  if (canPlay) d.querySelector('[data-a="play"]').onclick = () => { d.remove(); openPlayZone(); };
  d.querySelector('[data-a="home"]').onclick = () => { d.remove(); renderHome(); };
  renderHome();
}

// the home screen was first drawn before this file loaded: draw it again with today's goal and quest
renderHome();
