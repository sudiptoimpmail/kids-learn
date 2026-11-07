// Library: Pre-K and K see Story Time; a book opens to its cover, reads aloud with words lit in turn,
// every page picture loads, words can be tapped, the three picture questions work, and finishing
// counts as a learning day with the book on the progress page.
//   node tests/library-test.js [--shots dir]
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const SHOTS = (() => { const i = process.argv.indexOf('--shots'); return i > 0 ? process.argv[i + 1] : ''; })();
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 1366 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const bad = []; p.on('response', (r) => { if (r.status() >= 400 && /library\//.test(r.url())) bad.push(r.url()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  // 1. who sees the Library
  const tiles = await p.evaluate(() => Object.fromEntries(['prek', 'k', 'g1', 'g3'].map((g) => { state.grade = g; state.showAll = false; renderHome(); return [g, !!document.querySelector('#grid .tile[data-cat="library"]')]; })));
  assert.deepEqual(tiles, { prek: true, k: true, g1: true, g3: false }, 'Story Time should be for Pre-K and K');
  await p.evaluate(() => { state.grade = 'prek'; state.voice = true; state.stats = { days: {}, skills: {} }; renderHome(); });
  // 2. shelf → cover
  await p.locator('#grid .tile[data-cat="library"]').click();
  try { await p.waitForSelector('.lib-book', { timeout: 8000 }); }
  catch (error) {
    const diag = await p.evaluate(async () => {
      let fetchResult;
      try { const response = await fetch('library/three-little-pigs/book.json'); const data = response.ok ? await response.json() : null;
        fetchResult = { status: response.status, pages: data?.pages?.length };
      } catch (e) { fetchResult = String(e); }
      return { grade: state.grade, activeScreens: [...document.querySelectorAll('.screen.active')].map(el=>el.id),
        welcome: !!document.querySelector('#welcomeSheet'), libraryHTML: document.querySelector('#libBody')?.innerHTML.slice(0,800),
        loading: document.querySelector('#loadStatus')?.textContent, fetchResult };
    });
    throw new Error('Story Time bookshelf did not become visible: '+JSON.stringify({diag,errors:errs,error:String(error)}));
  }
  if (SHOTS) await p.screenshot({ path: SHOTS + '/0-shelf.png' });
  await p.locator('.lib-book[data-id="three-little-pigs"]').click(); await p.waitForSelector('.lib-cover');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/1-cover.png' });
  // 3. read to me: words light up in turn on page 1
  await p.locator('[data-a="listen"]').click(); await p.waitForSelector('.lib-text .w');
  const lit = new Set();
  for (let i = 0; i < 40; i++) { const k = await p.evaluate(() => document.querySelector('.lib-text .w.on')?.dataset.i || ''); if (k) lit.add(k); await p.waitForTimeout(100); }
  if (SHOTS) await p.screenshot({ path: SHOTS + '/2-reading.png' });
  assert.ok(lit.size >= 3, `words were not lit in turn while reading (${lit.size})`);
  // 4. every page: picture loads, every sentence has a recording, words are tappable
  const pages = await p.evaluate(() => LB.book.pages.length);
  for (let n = 0; n < pages; n++) {
    await p.evaluate((n) => { LB.auto = false; goPage(n); }, n);
    await p.waitForFunction(() => { const i = document.querySelector('.lib-art img'); return i && i.complete && i.naturalWidth > 0; });
    const chk = await p.evaluate(() => ({ missing: LB.book.pages[LB.page].text.filter((t) => !CLIPS[clipKey(t)]), words: [...document.querySelectorAll('.lib-text .w')].filter((w) => !CLIPS[w.dataset.k]).map((w) => w.textContent), size: (() => { const i = document.querySelector('.lib-art img'); return [i.naturalWidth, i.naturalHeight]; })() }));
    assert.deepEqual(chk.missing, [], `page ${n + 1}: sentence without a recording`);
    assert.deepEqual(chk.words, [], `page ${n + 1}: words without a recording`);
    assert.deepEqual(chk.size, [1200, 800], `page ${n + 1}: picture size`);
    if (SHOTS && (n === 3 || n === 8)) await p.screenshot({ path: `${SHOTS}/3-page${n + 1}.png` });
  }
  await p.locator('.lib-text .w').first().click();
  // 5. questions with picture answers, then the finish screen
  await p.evaluate(() => startQuestions()); await p.waitForSelector('.lib-opt img');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/4-question.png' });
  for (let q = 0; q < 3; q++) {
    const ans = await p.evaluate(() => LB.book.questions[LB.q].answer);
    const wrong = await p.locator(`.lib-opt:not([data-v="${ans}"])`).first(); await wrong.click(); await p.waitForTimeout(150);
    assert.equal(await p.evaluate(() => LB.q), q, 'a wrong answer moved on');
    await p.locator(`.lib-opt[data-v="${ans}"]`).click(); await p.waitForTimeout(1600);
  }
  await p.waitForSelector('.lib-done');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/5-done.png' });
  const after = await p.evaluate(() => { const d = state.stats.days[dayKey()]; renderDashboard(); return { read: state.booksRead['three-little-pigs'], books: d.books, learning: isLearningDay(d), dash: document.querySelector('#dash').innerText.includes('1 book read') }; });
  assert.deepEqual(after, { read: 1, books: 1, learning: true, dash: true });
  assert.deepEqual(bad, [], 'library files failed to load');
  assert.deepEqual(errs, []);
  console.log(`PASS library: Story Time for Pre-K/K, read-aloud with lit words, ${pages} pictured pages, picture questions, counts as learning`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
