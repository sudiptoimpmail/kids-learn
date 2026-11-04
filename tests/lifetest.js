const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(() => localStorage.setItem('learnplay.v1', JSON.stringify({ voice: false, grade: 'g1', optAnatomy: true, playAlways: true, pinHash: 'x', stars: 9, good: 3, traced: { bigA: 1 }, recent: { sent: ['a'] }, pinBest: 500, art: { a: {} }, gameLv: { ttt: 2 } })));
  await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(300);
  // 1. body 3D: open, leave, open again
  const r1 = [];
  for (let k = 0; k < 3; k++) {
    await p.evaluate(() => { state.levels.anatomy = 3; startRound('anatomy'); });
    for (let i = 0; i < 6; i++) { await p.waitForTimeout(700); if (await p.evaluate(() => !!document.querySelector('.b3d-cv'))) break; await p.evaluate(() => document.getElementById('skipBtn') && R && (R.locked = false, R.qs[R.i].ok = true, next())); }
    r1.push(await p.evaluate(() => !!document.querySelector('.b3d-cv')));
    await p.evaluate(() => document.getElementById('quitBtn').click()); await p.waitForTimeout(300);
    r1.push(await p.evaluate(() => document.querySelectorAll('canvas.b3d-cv').length));
  }
  console.log('3D shown / canvases left after quit:', r1.join(','));
  // 2. stale timer: answer right, then go home before the next card
  const stale = await p.evaluate(async () => { state.levels.add = 1; startRound('add'); const q = R.qs[R.i]; choose(q, q.answer, document.createElement('i')); document.getElementById('quitBtn').click(); await new Promise(r => setTimeout(r, 2600)); return document.getElementById('home').classList.contains('active') ? 'stayed home' : 'JUMPED BACK TO PLAY'; });
  console.log('leave during celebration:', stale);
  // 3. game switching: pinball ends, child opens another game right away
  const sw = await p.evaluate(async () => { openGame('pinball'); await new Promise(r => setTimeout(r, 1500)); window.__pb.sim(900); openGame('ttt'); await new Promise(r => setTimeout(r, 1500)); return { area: document.getElementById('gameArea').className, stalePanel: !!document.querySelector('#gameArea .end-panel') }; });
  console.log('game switch:', JSON.stringify(sw));
  // 4. reset keeps grown-up settings, clears progress
  const rs = await p.evaluate(() => { window.confirm = () => true; document.getElementById('resetBtn').click(); return { grade: state.grade, pin: state.pinHash, stars: state.stars, good: state.good, traced: state.traced, recent: state.recent, pinBest: state.pinBest, gameLv: state.gameLv, level: state.levels.add }; });
  console.log('after reset:', JSON.stringify(rs));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
