const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(() => localStorage.setItem('learnplay.v1', JSON.stringify({ voice: false, grade: 'k', name: 'T' })));
  await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(300);
  const r = await p.evaluate(async () => {
    const out = [];
    // 1. every grade, with and without a weak skill and a strong skill: discovery always there; little ones trace
    for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) for (const withSkills of [false, true]) {
      state.grade = g; state.quest = null;
      state.stats = { days: {}, skills: withSkills ? { 'add:1': { n: 12, ok: 4, recent: '010010001100', days: ['a', 'b'] }, 'sight:1': { n: 12, ok: 12, recent: '111111111111', days: ['a', 'b'] } } : {} };
      const q = questFor(), whys = q.steps.map((s) => s.why + (s.level ? '@' + s.level : ''));
      const okPlan = whys.includes('discover') && (['prek', 'k'].includes(g) ? whys.includes('tracing') : true) && q.steps.length <= 5;
      out.push(`${g}${withSkills ? '+skills' : ''}: ${q.steps.map((s) => s.cat).join(',')} [${whys.join(',')}] ${okPlan ? 'OK' : 'BAD'}`);
    }
    // 2. five-card round with 2 mistakes: not 3 stars, no level up
    state.grade = 'k'; state.levels.add = 2;
    startRound('add', 5);
    for (let k = 0; k < 5; k++) { const q = R.qs[R.i]; if (k < 2) { const w = q.options.find((o) => String(o.v) !== String(q.answer)); choose(q, w.v, document.createElement('i')); } R.locked = false; choose(q, q.answer, document.createElement('i')); await new Promise((r) => setTimeout(r, 5)); if (R.qs[R.i] === q) next(); }
    out.push(`5 cards, 2 mistakes → stars=${document.querySelectorAll('#resStars .rs.on').length} level=${state.levels.add}`);
    // 3. a hint before a right answer does not count toward mastery
    state.stats = { days: {}, skills: {} }; state.levels.sub = 1;
    startRound('sub', 5);
    for (let k = 0; k < 5; k++) { const q = R.qs[R.i]; showHint(q); R.locked = false; choose(q, q.answer, document.createElement('i')); await new Promise((r) => setTimeout(r, 5)); if (R.qs[R.i] === q) next(); }
    const sk = state.stats.skills['sub:1'];
    out.push(`hint every card → recent=${sk.recent} alone-count=${sk.ok}`);
    // 4. answers are saved within a second (app closed after the 3rd answer)
    state.stats = { days: {}, skills: {} };
    startRound('add', 10);
    for (let k = 0; k < 3; k++) { const q = R.qs[R.i]; R.locked = false; choose(q, q.answer, document.createElement('i')); await new Promise((r) => setTimeout(r, 5)); if (R.qs[R.i] === q) next(); }
    await new Promise((r) => setTimeout(r, 1200));
    const saved = JSON.parse(localStorage.getItem('learnplay.v1')); const day = Object.values(saved.profiles[saved.active].stats.days)[0];
    out.push(`after 3 answers, saved answers today = ${day && day.q}`);
    // 5. weak-skill quest step plays at the weak level and doesn't change her level
    state.levels.add = 3; state.quest = null; state.stats = { days: {}, skills: { 'add:1': { n: 12, ok: 4, recent: '010010001100', days: ['a', 'b'] } } };
    const qq = questFor(); const i = qq.steps.findIndex((s) => s.why === 'practice');
    startQuestStep(i); const lv = R.qs[0].level;
    for (let k = 0; k < 5; k++) { const q = R.qs[R.i]; R.locked = false; choose(q, q.answer, document.createElement('i')); await new Promise((r) => setTimeout(r, 5)); if (R.qs[R.i] === q) next(); }
    out.push(`practice step: played level ${lv}, her level stays ${state.levels.add}`);
    // 6. hourly play mode: the gift doesn't promise play time
    state.playMode = 'hourly'; state.quest.steps.forEach((s) => (s.done = true)); state.quest.gift = false; const passes = state.playPasses || 0;
    openQuestGift(); const box = document.querySelector('.quest-gift');
    out.push(`hourly mode gift: play pass added=${(state.playPasses || 0) > passes}, shows play time=${box.textContent.includes('Play time')}`);
    box.remove();
    return out;
  });
  console.log(r.join('\n'));
  // 7. a bad backup with broken stats
  await p.evaluate(() => { Store.importJSON(JSON.stringify({ schema: 3, active: 'p1', order: ['p1'], device: {}, profiles: { p1: { name: 'X', stats: { days: 5, skills: [] }, quest: { steps: 'x' }, levels: { add: 'big', sub: 2 } } } })); });
  await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(300);
  console.log('bad backup →', JSON.stringify(await p.evaluate(() => { openDashboard(); return { stats: state.stats, quest: questFor().steps.length, levels: state.levels }; })));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
