// First run asks who's playing and their grade (no PIN), offers the placement check, and the home
// screen then shows only that grade's sections with one obvious "Start today's 10 minutes" button.
// Also: the progress page has no developer notes and no other grade's standards.
//   node tests/onboarding-test.js [--shots dir]
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : ''; };
const SHOTS = arg('--shots');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  // 1. automated browsers are not stopped by the sheet unless they ask for it
  let p = await b.newPage({ viewport: { width: 820, height: 1180 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(500);
  assert.equal(await p.locator('#welcomeSheet').count(), 0, 'welcome sheet blocked an automated run');
  await p.close();
  // 2. a real first run
  p = await b.newPage({ viewport: { width: 820, height: 1180 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?welcome=1'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(600);
  assert.equal(await p.locator('#welcomeSheet').count(), 1, 'first run did not ask who is playing');
  assert.equal(await p.locator('#pinSheet').isVisible(), false, 'picking a grade asked for a PIN');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/1-welcome.png' });
  await p.fill('#welName', 'Shivika');
  await p.locator('.wel-grade[data-g="prek"]').click(); await p.waitForTimeout(400);
  if (SHOTS) await p.screenshot({ path: SHOTS + '/2-offer.png' });
  assert.ok(await p.locator('[data-a="check"]').isVisible(), 'placement check not offered');
  await p.locator('[data-a="start"]').click(); await p.waitForTimeout(500);
  const home = await p.evaluate(() => ({ grade: state.grade, name: state.name, welcomed: state.welcomed, hello: document.querySelector('#hello').textContent,
    tiles: document.querySelectorAll('#grid .tile').length, go: document.querySelector('#questGo')?.textContent.trim(), sheet: !!document.querySelector('#welcomeSheet') }));
  if (SHOTS) await p.screenshot({ path: SHOTS + '/3-home.png' });
  assert.equal(home.grade, 'prek'); assert.equal(home.name, 'Shivika'); assert.ok(home.welcomed); assert.ok(!home.sheet);
  assert.match(home.hello, /Shivika/);
  assert.ok(home.tiles < 25, `Pre-K home shows ${home.tiles} tiles`);
  assert.match(home.go, /Start today's 10 minutes/);
  // 3. the start button begins the first quest step
  await p.locator('#questGo').click(); await p.waitForTimeout(700);
  const started = await p.evaluate(() => (document.querySelector('#play').classList.contains('active') ? 'round' : document.querySelector('#trace.active, .screen.active')?.id));
  assert.ok(started, 'Start today did nothing');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/4-first-step.png' });
  // 4. a reload does not ask again
  await p.reload(); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady); await p.waitForTimeout(500);
  assert.equal(await p.locator('#welcomeSheet').count(), 0, 'asked again after a reload');
  // 5. a finished quest says All done for today and names what was practised
  const done = await p.evaluate(() => { const q = questFor(); q.steps.forEach((s) => (s.done = true)); q.gift = true; save(); renderHome(); return document.querySelector('.quest-done')?.textContent || ''; });
  assert.match(done, /All done for today!/); assert.match(done, /You practised/);
  // 6. zero is a picture, not ∅; the progress page has no developer notes or other grades' standards
  const r = await p.evaluate(() => {
    let zero = '';
    for (let i = 0; i < 400 && !zero; i++) { const q = genAdd(1); if (/none-pic/.test(q.main)) zero = q.main; if (/∅/.test(q.main)) return { sym: true }; }
    state.levels.add = 1; renderDashboard();
    const t = document.querySelector('#dash').innerText;
    return { sym: false, zero: !!zero, dev: /locally authored|tagged objectives|Authored objective/.test(t), std: /2\.NBT|3\.NBT/.test(t) };
  });
  assert.equal(r.sym, false, '∅ still shown'); assert.ok(r.zero, 'no zero picture found');
  assert.equal(r.dev, false, 'developer notes on the progress page'); assert.equal(r.std, false, 'a 2nd–3rd grade standard on a Pre-K progress page');
  // 7. with no grade, the grade chip opens the sheet, not the PIN
  await p.evaluate(() => { state.grade = null; state.welcomed = false; save(); renderHome(); document.querySelector('#gradeChip').click(); });
  await p.waitForTimeout(300);
  assert.equal(await p.locator('#welcomeSheet').count(), 1, 'grade chip did not open the sheet');
  assert.deepEqual(errs, []);
  console.log('PASS first run asks who is playing, offers the check, starts today in one tap; progress page is parent-ready');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
