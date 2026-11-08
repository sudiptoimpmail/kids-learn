// Spelling letters can be dragged between boxes and back to the tray; onboarding asks country and state first.
//   node tests/drag-test.js
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?welcome=1'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForSelector('#welCountry', { timeout: 3000 }).catch(() => {});
  const ob = await p.evaluate(() => ({ c: !!document.querySelector('#welCountry'), r: !!document.querySelector('#welRegion') }));
  assert.deepEqual(ob, { c: true, r: true }, 'onboarding should ask country and state');
  await p.selectOption('#welCountry', 'uk'); await p.waitForTimeout(100);
  assert.ok(await p.evaluate(() => document.querySelector('#welRegion').options.length > 1), 'region list follows country');
  await p.fill('#welName', 'Ava'); await p.locator('.wel-grade[data-g="k"]').click(); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => state.country), 'uk');
  await p.evaluate(() => { const d = document.getElementById('welcomeSheet'); d && d.remove(); document.getElementById('home').inert = false; });
  // spelling: place by drag, move to another box, drag back to the tray
  await p.evaluate(() => { Object.assign(state, { grade: 'k', voice: false }); for (let i = 0; i < 60; i++) { startRound('spell', 10); const k = R.qs.findIndex((q) => q.spell && q.spell.blanks.length >= 2); if (k >= 0) { R.i = k; renderQ(); return; } document.querySelector('#quitBtn').click(); } });
  const mid = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const drag = async (from, to) => { const [x, y] = await mid(from); await p.mouse.move(x, y); await p.mouse.down(); const [tx, ty] = to; await p.mouse.move((x + tx) / 2, (y + ty) / 2, { steps: 4 }); await p.mouse.move(tx, ty, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(150); };
  const blanks = await p.evaluate(() => R.qs[R.i].spell.blanks.slice(0, 2));
  const wrongTile = await p.evaluate((b0) => { const q = R.qs[R.i]; return [...document.querySelectorAll('.tile-l')].find((t) => t.dataset.l !== q.spell.word[b0] && t.dataset.l !== q.spell.word[q.spell.blanks[1]]).dataset.id; }, blanks[0]);
  await drag(`.tile-l[data-id="${wrongTile}"]`, await mid(`.slot[data-i="${blanks[0]}"]`));
  assert.equal(await p.evaluate((i) => R.qs[R.i].slots[i], blanks[0]), +wrongTile, 'drag from tray to a box');
  await drag(`.slot[data-i="${blanks[0]}"]`, await mid(`.slot[data-i="${blanks[1]}"]`));
  assert.deepEqual(await p.evaluate(([a, c]) => [R.qs[R.i].slots[a] ?? null, R.qs[R.i].slots[c] ?? null], blanks), [null, +wrongTile], 'drag a letter to another box');
  await drag(`.slot[data-i="${blanks[1]}"]`, await mid('#options'));
  assert.equal(await p.evaluate((i) => R.qs[R.i].slots[i], blanks[1]), undefined, 'drag a letter back to the tray');
  // Match It: arrows can start on either side, by drag or by tapping one then the other
  await p.evaluate(() => { Object.assign(state, { grade: 'g1', voice: false }); document.querySelector('#quitBtn')?.click(); for (let i = 0; i < 80; i++) { startRound('add', 10); const k = R.qs.findIndex((q) => q.match); if (k >= 0) { R.i = k; renderQ(); return; } document.querySelector('#quitBtn').click(); } });
  assert.ok(await p.locator('.m-item.R').count() >= 2, 'no match card found');
  const ids = await p.evaluate(() => R.qs[R.i].match.left.map((x) => x.id));
  const mid2 = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  // drag from the right-hand item to its partner on the left
  { const [x, y] = await mid2(`.m-item.R[data-id="${ids[0]}"]`), [tx, ty] = await mid2(`.m-item.L[data-id="${ids[0]}"]`);
    await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move((x + tx) / 2, (y + ty) / 2, { steps: 4 });
    assert.equal(await p.locator('.m-lines line.rubber[marker-end]').count(), 1, 'the drag line should be an arrow');
    await p.mouse.move(tx, ty, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(150); }
  assert.equal(await p.locator(`.m-item.L[data-id="${ids[0]}"].ok`).count(), 1, 'dragging right to left should match');
  assert.equal(await p.locator('.m-lines line.ok[marker-end]').count(), 1, 'the finished line should be an arrow');
  // tap the right item first, then the left one
  if (ids.length > 1) { await p.locator(`.m-item.R[data-id="${ids[1]}"]`).click(); await p.locator(`.m-item.L[data-id="${ids[1]}"]`).click(); await p.waitForTimeout(150);
    assert.equal(await p.locator(`.m-item.R[data-id="${ids[1]}"].ok`).count(), 1, 'tapping right then left should match'); }
  assert.deepEqual(errs, []);
  console.log('PASS onboarding asks country/state; spelling letters drag between boxes and back');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
