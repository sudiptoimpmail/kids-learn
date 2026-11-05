// Phase 5: one 3D picture style (Fluent Emoji, MIT) swaps in for emoji; Whack-a-Mole uses 3D critters.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { chromium } = require('playwright');
const man = JSON.parse(fs.readFileSync('assets/fluent/manifest.json', 'utf8'));
assert.ok(Object.keys(man).length > 600, 'Fluent picture manifest');
for (const f of Object.values(man)) assert.ok(fs.existsSync('assets/fluent/' + f), 'missing ' + f);
assert.ok(fs.readFileSync('assets/fluent/LICENSE-fluentui-emoji.txt', 'utf8').includes('MIT License'));
const sw = fs.readFileSync('sw.js', 'utf8');
for (const f of Object.values(man)) assert.ok(sw.includes('assets/fluent/' + f), 'not cached offline: ' + f);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(1200);
  const r = await p.evaluate(async () => {
    state.grade = 'k'; renderHome(); await new Promise((res) => setTimeout(res, 300));
    const tileImgs = document.querySelectorAll('#grid .tile .ti img.fx').length;
    startRound('animals', 3); await new Promise((res) => setTimeout(res, 300));
    const cardImgs = document.querySelectorAll('#play img.fx').length;
    const broken = [...document.querySelectorAll('img.fx')].filter((i) => i.complete && i.naturalWidth === 0).length;
    $('#quitBtn').click(); state.playAlways = true; openGame('whack'); await new Promise((res) => setTimeout(res, 2500));
    const critters = [...document.querySelectorAll('.wm-character')].map((i) => i.getAttribute('src'));
    return { tileImgs, cardImgs, broken, critters };
  });
  assert.ok(r.tileImgs > 10, 'home tiles use 3D pictures: ' + r.tileImgs);
  assert.ok(r.cardImgs > 0, 'question cards use 3D pictures');
  assert.equal(r.broken, 0);
  assert.ok(r.critters.length && r.critters.every((s) => s.startsWith('assets/fluent/')), 'Whack-a-Mole uses 3D critters ' + r.critters);
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS ' + Object.keys(man).length + ' offline 3D pictures (MIT) on tiles, cards and Whack-a-Mole');
})().catch((e) => { console.error(e); process.exit(1); });
