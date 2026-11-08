// Picture puzzle: grid size by grade, drag to swap, hold ~2 s shows turn icons.
const { chromium } = require('playwright');
const fail = (m) => { console.error('FAIL ' + m); process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  for (const [g, n] of [['prek', 4], ['k', 5], ['g1', 5], ['g2', 6], ['g3', 6]]) {
    const got = await p.evaluate((g) => { state.grade = g; state.playAlways = true; openGame('puzzle'); startPuzzle(ALL_PICS[0]); return document.querySelectorAll('.pzl-tile').length; }, g);
    if (got !== n * n) fail(`${g}: expected ${n * n} pieces, got ${got}`);
  }
  await p.evaluate(() => { state.grade = 'prek'; openGame('puzzle'); startPuzzle(ALL_PICS[0]); });
  const order = () => p.evaluate(() => [...document.querySelectorAll('.pzl-tile')].map((e) => e.dataset.piece).join(','));
  const before = await order();
  const t0 = await p.locator('.pzl-tile').nth(0).boundingBox(), t5 = await p.locator('.pzl-tile').nth(5).boundingBox();
  await p.mouse.move(t0.x + t0.width / 2, t0.y + t0.height / 2); await p.mouse.down();
  await p.mouse.move(t5.x + t5.width / 2, t5.y + t5.height / 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200);
  const after = (await order()).split(','), was = before.split(',');
  if (!(after[0] === was[5] && after[5] === was[0])) fail('dragging a piece onto another did not swap them');
  // hold ~2 s: icons appear, then turning
  const t2 = await p.locator('.pzl-tile').nth(2).boundingBox();
  await p.mouse.move(t2.x + t2.width / 2, t2.y + t2.height / 2); await p.mouse.down(); await p.waitForTimeout(1500);
  if (await p.locator('.rot-ring').count()) fail('turn icons appeared before 2 seconds');
  await p.waitForTimeout(800); await p.mouse.up();
  if (!(await p.locator('.rot-ring').count())) fail('turn icons did not appear after holding');
  const ang = () => p.locator('.pzl-tile').nth(2).locator('.jigsaw-art').evaluate((e) => e.style.transform);
  const a0 = await ang();
  const ib = await p.locator('.rot-ico[data-d="1"]').boundingBox();
  await p.mouse.click(ib.x + ib.width / 2, ib.y + ib.height / 2); await p.waitForTimeout(200);
  if ((await ang()) === a0) fail('turn icon did not rotate the piece');
  if (errs.length) fail('page errors ' + errs.slice(0, 2));
  console.log(process.exitCode ? 'puzzle-drag FAILED' : 'PASS puzzle: grade grids, drag swap, hold-to-turn');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
