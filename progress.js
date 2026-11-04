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
  shape2: ['Name flat shapes', 'Find shapes', 'Count sides'],
  shape3: ['Name 3D shapes', 'Flat or solid', '3D shapes in real life'],
  body: ['Big body parts', 'More body parts and what is inside', 'Small body parts'],
  gk: ['Animals and colors', 'Seasons, days, safety', 'Planets, plants, months', 'Continents, magnets, water'],
  anatomy: ['Main organs', 'More organs and big bones', 'Bones, kidneys, blood vessels', 'All bones and science facts'],
  jobs: ['Who does what', 'Jobs and tools', 'More jobs'],
  flags: ['Big countries\' flags', 'More flags', 'Flags of the world'],
  animals: ['Where animals live', 'Animals by country', 'Animals of the world (harder)'],
  places: ['Famous places', 'More famous places', 'Famous places of the world'],
  maps: ['Continents', 'Countries on the map', 'Countries and capitals'],
};
const skillName = (cat, lv) => (SKILLS[cat] && SKILLS[cat][lv - 1]) || `${(CATEGORIES.find((c) => c.id === cat) || {}).title || cat} · level ${lv}`;
const SUBJECT = (cat) => (['add', 'sub', 'story', 'cmp', 'mul', 'div', 'clock', 'shape2', 'shape3', 'match'].includes(cat) ? 'Math'
  : ['phonics', 'cvc', 'w4', 'sight', 'spell', 'vocab', 'sent', 'syl', 'trace'].includes(cat) ? 'Reading & words' : 'Science & world');
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
  d.q++; if (first) d.first++; if (alone) d.alone = (d.alone || 0) + 1; if (q.hintShown) d.hints++; d.secs += secs;
  const c = d.cats[cat] || (d.cats[cat] = [0, 0, 0]); c[0]++; if (first) c[1]++; if (alone) c[2] = (c[2] || 0) + 1;
  const k = `${cat}:${level}`, sk = state.stats.skills[k] || (state.stats.skills[k] = { n: 0, ok: 0, recent: '', last: '', days: [] });
  // mastery uses only answers done alone; hinted answers count as "with help"
  sk.n++; if (alone) sk.ok++; sk.recent = (sk.recent + (alone ? '1' : first ? 'h' : '0')).slice(-12); sk.last = dayKey();
  sk.days = [...new Set([...(sk.days || []), dayKey()])].slice(-5);   // on which days it was practiced
  // keep 120 days of daily numbers
  const days = Object.keys(state.stats.days).sort(); while (days.length > 120) delete state.stats.days[days.shift()];
  if (d.q === DAILY_GOAL()) dailyGoalReached();
  saveSoon();
}
// answers are saved a moment later (and right away if the app goes to the background)
function saveSoon() { clearTimeout(saveSoon.t); saveSoon.t = setTimeout(save, 800); }
addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(saveSoon.t); save(); } });
addEventListener('pagehide', () => { clearTimeout(saveSoon.t); save(); });
// tracing is a "did it" activity, not a right/wrong answer: counted separately
function logTrace(secs) { const d = statsDay(); d.traced = (d.traced || 0) + 1; d.secs += Math.min(120, Math.max(1, secs)); saveSoon(); }
function logPlay(secs) { if (secs > 2) { statsDay().play += Math.min(secs, 3600); save(); } }
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
function dayStreak() {
  const days = (state.stats && state.stats.days) || {};
  let n = 0; const d = new Date();
  if (!(days[dayKey(d)] && days[dayKey(d)].q)) d.setDate(d.getDate() - 1);   // today not started yet: count up to yesterday
  while (days[dayKey(d)] && days[dayKey(d)].q > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- home: today's goal and streak ---------- */
function renderToday() {
  const el = $('#todayChip'); if (!el) return;
  const d = (state.stats && state.stats.days[dayKey()]) || { q: 0 }, goal = DAILY_GOAL(), pct = Math.min(1, d.q / goal), streak = dayStreak();
  el.innerHTML = `<span class="ring" style="--p:${Math.round(pct * 100)}"><i>${pct >= 1 ? '✅' : '🎯'}</i></span><span><b>${Math.min(d.q, goal)}/${goal}</b> today</span>${streak > 1 ? `<span class="streak">🔥 ${streak} days</span>` : ''}`;
  el.classList.toggle('done', pct >= 1);
}
function dailyGoalReached() {
  setTimeout(() => { confetti(200, 0.3); say("You finished today's goal! Super star!"); renderToday(); }, 2200);
}

/* ---------- grown-ups: progress dashboard ---------- */
function openDashboard() {
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
  const q7 = sum((x) => x.q), f7 = sum((x) => (x.alone != null ? x.alone : x.first)), traced7 = sum((x) => x.traced || 0), learnMin = Math.round(sum((x) => x.secs) / 60), playMin = Math.round(sum((x) => x.play) / 60), days7 = week.filter(([, x]) => x.q > 0).length, hints7 = sum((x) => x.hints);
  const maxQ = Math.max(10, ...week.map(([, x]) => x.q));
  const goal = DAILY_GOAL();
  $('#dashTop').innerHTML = `
    <div class="dash-cards">
      <div class="dc"><b>${q7}</b><small>cards answered</small></div>
      <div class="dc"><b>${q7 ? Math.round(f7 / q7 * 100) : 0}%</b><small>right on their own (no hint)</small></div>
      <div class="dc"><b>${days7}<small>/7</small></b><small>learning days${traced7 ? ` · ${traced7} letters traced` : ''}</small></div>
      <div class="dc"><b>${learnMin}<small> min</small></b><small>learning · ${playMin} min play</small></div>
    </div>
    <div class="dash-week">${week.map(([d, x]) => `<div class="bar-col"><div class="bar" style="height:${Math.round(x.q / maxQ * 100)}%"><span class="bar-ok" style="height:${x.q ? Math.round((x.alone != null ? x.alone : x.first) / x.q * 100) : 0}%"></span></div>
      ${x.q >= goal ? '<i class="goal">✅</i>' : ''}<small>${x.q || ''}</small><em>${d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}</em></div>`).join('')}</div>
    <div class="dash-legend"><span class="lg ok"></span> right on their own <span class="lg all"></span> all cards · ✅ daily goal (${goal}) reached · 🔥 streak: ${dayStreak()} day${dayStreak() === 1 ? '' : 's'}</div>`;
  // skills
  const skills = Object.entries(st.skills).map(([k, sk]) => { const [cat, lv] = k.split(':'); return { cat, lv: +lv, name: skillName(cat, +lv), ...skillState(sk), n: sk.n, last: sk.last }; });
  const good = skills.filter((s) => s.s === 'mastered').sort((a, b) => b.acc - a.acc);
  const weak = skills.filter((s) => s.s === 'learning').sort((a, b) => a.acc - b.acc);
  const going = skills.filter((s) => s.s === 'practicing');
  const row = (s) => `<li><span>${s.name}</span><small>${(CATEGORIES.find((c) => c.id === s.cat) || {}).icon || ''} ${Math.round(s.acc * 100)}%</small></li>`;
  $('#dashSkills').innerHTML = `
    <div class="ds good"><h3>🌟 Doing well</h3>${good.length ? `<ul>${good.slice(0, 8).map(row).join('')}</ul>` : '<p class="note">Skills show here after 8 or more cards with mostly right answers.</p>'}</div>
    <div class="ds weak"><h3>🧩 Needs practice</h3>${weak.length ? `<ul>${weak.slice(0, 8).map(row).join('')}</ul>` : '<p class="note">Nothing stuck right now. 👍</p>'}</div>
    ${going.length ? `<div class="ds"><h3>📈 Getting there</h3><ul>${going.slice(0, 8).map(row).join('')}</ul></div>` : ''}`;
  // subjects: level now and this week's accuracy
  const catWeek = {};
  for (const [, x] of week) for (const [c, v] of Object.entries(x.cats)) { const a = catWeek[c] || (catWeek[c] = [0, 0]); a[0] += v[0]; a[1] += v[2] != null ? v[2] : v[1]; }
  const shown = CATEGORIES.filter((c) => c.gen && c.id !== 'mix' && (catWeek[c.id] || state.levels[c.id]));
  $('#dashSubjects').innerHTML = `<table><tr><th>Game</th><th>Level</th><th>This week</th></tr>${shown.map((c) => {
    const w = catWeek[c.id];
    return `<tr><td>${c.icon} ${c.title}<small>${skillName(c.id, levelOf(c.id))}</small></td><td>${levelOf(c.id)}<small>/${maxLevelOf(c.id)}</small></td><td>${w ? `${w[0]} cards · ${Math.round(w[1] / w[0] * 100)}%` : '—'}</td></tr>`;
  }).join('')}</table>`;
  // summary in plain words
  const bySubject = {};
  for (const [c, [n, ok]] of Object.entries(catWeek)) { const s = SUBJECT(c); const a = bySubject[s] || (bySubject[s] = [0, 0]); a[0] += n; a[1] += ok; }
  const topSub = Object.entries(bySubject).sort((a, b) => b[1][0] - a[1][0])[0];
  const lines = [];
  if (!q7) lines.push(`${name} hasn't practiced in the last 7 days. A few minutes a day helps a lot!`);
  else {
    lines.push(`This week ${name} learned on ${days7} day${days7 === 1 ? '' : 's'} and answered ${q7} cards (${Math.round(f7 / q7 * 100)}% right on their own, without a hint).`);
    if (topSub) lines.push(`Most practice: ${topSub[0].toLowerCase()} (${topSub[1][0]} cards).`);
    if (good[0]) lines.push(`Doing well: ${good.slice(0, 2).map((s) => s.name.toLowerCase()).join(' and ')}.`);
    if (weak[0]) lines.push(`Needs more practice: ${weak.slice(0, 2).map((s) => s.name.toLowerCase()).join(' and ')}. Try a round of ${(CATEGORIES.find((c) => c.id === weak[0].cat) || {}).title} together.`);
    if (hints7 > q7 * 0.4) lines.push('Hints were used a lot — that\'s fine while learning; the levels will adjust.');
    if (playMin > learnMin * 1.5 && playMin > 10) lines.push('Play time was higher than learning time this week. You can change the Play Zone rule in ⚙️.');
  }
  $('#dashSummary').innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
  $('#dashGoal').value = String(goal);
}
$('#dashBack').onclick = () => { sfx.tap(); openSettings(); };
$('#dashGoal').onchange = () => { state.dailyGoal = +$('#dashGoal').value; save(); renderDashboard(); };
$('#dashBtn').onclick = () => { sfx.tap(); openDashboard(); };

/* =========================================================
   🗺️ Today's Quest: a short, guided mix for each day (about 10–12 minutes)
   Built once a day per child from their grade, their weakest skill, and what they
   haven't practiced lately: a warm-up, a skill that needs practice, reading, a discovery
   topic (and tracing for Pre-K/K). Each step is 5 cards. All done → a gift.
   ========================================================= */
const QUEST_LEN = 5;
const QUEST_READING = { prek: ['phonics', 'cvc'], k: ['phonics', 'cvc', 'sight'], g1: ['sent', 'sight', 'phonics', 'spell'], g2: ['sent', 'spell', 'vocab'], g3: ['sent', 'vocab', 'spell'] };
const QUEST_MATH = { prek: ['add', 'cmp', 'shape2'], k: ['add', 'sub', 'cmp'], g1: ['add', 'sub', 'story'], g2: ['add', 'sub', 'mul', 'story'], g3: ['mul', 'div', 'story'] };
const QUEST_WORLD = ['animals', 'places', 'maps', 'body', 'gk', 'shape3', 'jobs', 'flags', 'anatomy'];
function questFor() {
  const today = dayKey(), grade = state.grade || 'k';
  if (state.quest && state.quest.date === today && state.quest.grade === grade) return state.quest;
  const visible = new Set(visibleGames().filter((c) => c.gen && c.id !== 'mix').map((c) => c.id));
  const ok = (id) => visible.has(id);
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
  const weak = skills.filter((s) => (s.s === 'learning' || s.s === 'practicing') && ok(s.cat) && !used.has(s.cat)).sort((a, b) => a.acc - b.acc)[0];
  addStep(weak ? weak.cat : freshest((QUEST_MATH[grade] || QUEST_MATH.k).filter((c) => !used.has(c))), weak ? 'practice' : 'math');
  if (weak && steps.length && steps[steps.length - 1].cat === weak.cat) steps[steps.length - 1].level = weak.lv;   // practice at the level that was hard
  // 3. reading (if not already in), 4. math (if not already in)
  addStep(freshest((QUEST_READING[grade] || QUEST_READING.k).filter((c) => !used.has(c))), 'reading');
  if (!steps.some((s) => (QUEST_MATH[grade] || []).includes(s.cat))) addStep(freshest((QUEST_MATH[grade] || QUEST_MATH.k).filter((c) => !used.has(c))), 'math');
  // 5. discovery: science and the world
  addStep(freshest(QUEST_WORLD.filter((c) => !used.has(c))), 'discover');
  // little ones also trace a few letters: make room by dropping an extra reading/math step, never discovery
  if (grade === 'prek' || grade === 'k') {
    while (steps.length > 4) { const drop = ['math', 'reading', 'warm-up'].map((w) => steps.findIndex((x) => x.why === w)).find((i) => i >= 0); steps.splice(drop, 1); }
    steps.splice(1, 0, { cat: 'trace', why: 'tracing', done: false });
  }
  state.quest = { date: today, grade, steps: steps.slice(0, 5), gift: false };
  save();
  return state.quest;
}
function renderQuest() {
  const box = $('#questBox'); if (!box) return;
  const q = questFor(), doneN = q.steps.filter((s) => s.done).length, all = doneN === q.steps.length;
  const nextI = q.steps.findIndex((s) => !s.done);
  box.innerHTML = `<div class="quest-head"><b>🗺️ Today's Quest</b><span class="quest-checks">${q.steps.map((s) => `<i class="${s.done ? 'on' : ''}">✓</i>`).join('')}<i class="gift ${all ? (q.gift ? 'opened' : 'ready') : ''}">🎁</i></span></div>
    <div class="quest-steps">${q.steps.map((s, i) => {
      const c = s.cat === 'trace' ? { icon: '✍️', title: 'Tracing', color: '#f76707' } : CATEGORIES.find((x) => x.id === s.cat) || { icon: '⭐', title: s.cat, color: '#8f6bff' };
      return `<button class="quest-step ${s.done ? 'done' : ''} ${i === nextI ? 'next' : ''}" data-i="${i}" style="--c:${c.color}"><span class="qs-ico">${c.icon}</span><span class="qs-t">${c.title}</span><span class="qs-why">${{ 'warm-up': 'Warm up', practice: 'Practice', math: 'Math', reading: 'Reading', discover: 'Discover', tracing: 'Write' }[s.why] || ''}</span>${s.done ? '<span class="qs-ok">✓</span>' : ''}</button>`;
    }).join('')}${all ? `<button class="quest-step gift-step ${q.gift ? 'done' : 'next'}" data-gift="1"><span class="qs-ico">🎁</span><span class="qs-t">${q.gift ? 'Gift opened!' : 'Open your gift!'}</span></button>` : ''}</div>`;
  $$('.quest-step', box).forEach((b) => (b.onclick = () => {
    sfx.tap();
    if (b.dataset.gift) return openQuestGift();
    startQuestStep(+b.dataset.i);
  }));
}
function startQuestStep(i) {
  const q = questFor(), s = q.steps[i]; if (!s) return;
  if (s.cat === 'trace') { TR.quest = { i, left: 3, date: q.date }; openTrace(); return; }
  startRound(s.cat, QUEST_LEN, false, s.level || null);
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
    <h2>Quest complete!</h2><p>${state.quests} quest${state.quests === 1 ? '' : 's'} finished so far</p>
    <div class="res-btns">${canPlay ? '<button class="big-btn" data-a="play">🎮 Play now</button>' : ''}<button class="big-btn alt" data-a="home">🏠 Home</button></div></div>`;
  document.body.appendChild(d);
  if (canPlay) d.querySelector('[data-a="play"]').onclick = () => { d.remove(); openPlayZone(); };
  d.querySelector('[data-a="home"]').onclick = () => { d.remove(); renderHome(); };
  renderHome();
}

// the home screen was first drawn before this file loaded: draw it again with today's goal and quest
renderHome();
