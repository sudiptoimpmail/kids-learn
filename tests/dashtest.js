const { chromium } = require('playwright');
const S = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' });
  const errs = [];
  for (const [name, vp] of [['phone', { width: 390, height: 844 }], ['ipad', { width: 820, height: 1180 }]]) {
  const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(() => localStorage.setItem('learnplay.v1', JSON.stringify({ name: 'Shivika', voice: false, grade: 'k', pinHash: '' })));
  await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(300);
  // play real rounds: adding (mostly right), letter sounds (some wrong), sight words
  const r = await p.evaluate(async () => {
    const playRound = async (cat, wrongEvery) => {
      startRound(cat);
      for (let k = 0; k < 40 && document.getElementById('play').classList.contains('active'); k++) {
        const q = R.qs[R.i];
        if (wrongEvery && k % wrongEvery === 0 && q.options.length) { const w = q.options.find(o => String(o.v) !== String(q.answer)); if (w) choose(q, w.v, document.createElement('i')); }
        R.locked = false; choose(q, q.answer, document.createElement('i'));
        await new Promise(r => setTimeout(r, 5)); if (R.qs[R.i] === q) next();
      }
    };
    await playRound('add', 0); await playRound('add', 0); await playRound('phonics', 2); await playRound('sight', 4);
    logPlay(300);
    // a few earlier days so the week chart has something (only for this check)
    const d = new Date();
    for (const [ago, q, f] of [[1, 25, 20], [2, 12, 9], [4, 30, 27]]) { const x = new Date(d); x.setDate(d.getDate() - ago); state.stats.days[dayKey(x)] = { q, first: f, hints: 3, secs: q * 9, play: 240, cats: { add: [q, f] } }; }
    save(); renderHome();
    return { today: state.stats.days[dayKey()].q, skills: Object.keys(state.stats.skills), streak: dayStreak() };
  });
  console.log(name, JSON.stringify(r));
  await p.waitForTimeout(4500); console.log('chip:', await p.evaluate(() => document.getElementById('todayChip').textContent)); await p.screenshot({ path: S + `dash_home_${name}.png` });
  await p.evaluate(() => openDashboard()); await p.waitForTimeout(300);
  await p.screenshot({ path: S + `dash_${name}.png`, fullPage: true });
  await p.close(); }
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
