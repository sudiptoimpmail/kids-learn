// Every free story on every grade's shelf, in that grade's own retelling: it opens from the grade's Home, every
// picture loads, every sentence and word has a recording, and the picture questions can be answered.
//   node tests/free-stories-test.js
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 1366 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const bad = []; p.on('response', (r) => { if (r.status() >= 400 && /library\//.test(r.url())) bad.push(r.url()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  const SHELVES = { prek: ['red-riding-hood', 'three-little-pigs', 'lion-and-mouse'], k: ['red-riding-hood', 'three-little-pigs', 'lion-and-mouse'],
    g1: ['max-kite', 'little-seed', 'lion-and-mouse', 'peter-rabbit'], g2: ['little-red-hen', 'peter-rabbit'], g3: ['oz-1', 'oz-2', 'oz-3', 'oz-4'] };
  const seenText = {};
  for (const [g, ids] of Object.entries(SHELVES)) for (const id of ids) {
    const shelf = await p.evaluate((g) => { state.grade = g; state.showAll = false; renderHome(); return { tile: !!document.querySelector('#grid .tile[data-cat="library"]'), books: availableBooks(g) }; }, g);
    assert.ok(shelf.tile, `${g}: no Story Time tile`); assert.deepEqual(shelf.books, ids);
    await p.evaluate(() => openLibrary()); await p.waitForSelector('#library.active'); await p.evaluate((id) => { openBook(id); }, id); await p.waitForFunction((id) => LB.book && LB.book.id === id, id);
    const pages = await p.evaluate(() => LB.book.pages.length);
    const first = await p.evaluate(() => LB.book.pages[0].text.join(' ')); (seenText[id] = seenText[id] || new Set()).add(first);
    for (let n = 0; n < pages; n++) {
      await p.evaluate((n) => { LB.auto = false; goPage(n); }, n);
      await p.waitForFunction(() => { const i = document.querySelector('.lib-art img'); return i && i.complete && i.naturalWidth > 0; });
      const chk = await p.evaluate(() => ({ missing: LB.book.pages[LB.page].text.filter((t) => !CLIPS[clipKey(t)]), words: [...document.querySelectorAll('.lib-text .w')].filter((w) => !CLIPS[w.dataset.k]).map((w) => w.textContent) }));
      assert.deepEqual(chk, { missing: [], words: [] }, `${id} page ${n + 1}`);
    }
    await p.evaluate(() => startQuestions()); await p.waitForSelector('.lib-opt');
    const nq = await p.evaluate(() => LB.book.questions.length);
    for (let q = 0; q < nq; q++) {
      const ans = await p.evaluate(() => LB.book.questions[LB.q].answer);
      await p.locator(`.lib-opt[data-v="${ans}"]`).click(); await p.waitForTimeout(1700);
    }
    await p.waitForSelector('.lib-done');
  }
  // one story, told differently for each grade that reads it
  assert.equal(seenText['lion-and-mouse'].size, 3, 'The Lion and the Mouse needs its own Pre-K, K and Grade 1 text');
  assert.equal(seenText['peter-rabbit'].size, 2, 'Peter Rabbit needs its own Grade 1 and Grade 2 text');
  assert.deepEqual(bad, [], 'library files failed to load'); assert.deepEqual(errs, []);
  console.log('PASS free stories: every grade shelf opens its grade-level retellings, reads with recorded voice, and finishes');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
