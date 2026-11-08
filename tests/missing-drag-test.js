// Missing number / pattern cards: drag an answer onto the "?" or just tap it.
const { chromium } = require('playwright');
const fail = (m) => { console.error('FAIL ' + m); process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 }, hasTouch: false });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  const found = await p.evaluate(() => {
    Object.assign(state, { grade: 'g1', playAlways: true, testMode: false });
    for (const id of visibleGames().filter((c) => c.gen).map((c) => c.id)) for (let lv = 1; lv <= 5; lv++) {
      state.levels = { [id]: lv };
      for (let t = 0; t < 12; t++) { R = null; try { startRound(id, 10); } catch { continue; } if (!R) continue;
        const i = R.qs.findIndex((q) => /think-missing/.test(String(q.main)) && /^\d+$/.test(String(q.answer)) && !q.spell && !q.match);
        if (i >= 0) return { id, lv, i };
        try { document.querySelector('#quitBtn').click(); } catch {} }
    }
    return null;
  });
  if (!found) { fail('no missing-number card found'); await b.close(); return; }
  const goTo = async () => { await p.evaluate((f) => { Object.assign(state, { levels: { [f.id]: f.lv } }); for (let t = 0; t < 40; t++) { try { document.querySelector('#quitBtn').click(); } catch {} R = null; startRound(f.id, 10); let guard = 0; while (R && !/think-missing/.test(String(R.qs[R.i].main)) && guard++ < 12) { R.i++; if (R.i >= R.qs.length) break; renderQ(); } if (R && /think-missing/.test(String(R.qs[R.i]?.main))) return; } }, found); };
  // find a card on screen
  await goTo(); await p.waitForTimeout(400);
  if (!(await p.locator('#qMain .think-missing').count())) { fail('missing slot not on screen'); await b.close(); return; }
  const slot = p.locator('#qMain .think-missing').first();
  if (!(await slot.evaluate((e) => e.classList.contains('drop-ready')))) fail('slot is not a drop target');
  const ans = await p.evaluate(() => String(R.qs[R.i].answer));
  const right = p.locator('#options .opt', { hasText: new RegExp('^\\s*' + ans + '\\s*$') }).first();
  const wrong = p.locator('#options .opt').filter({ hasNotText: new RegExp('^\\s*' + ans + '\\s*$') }).first();
  const sb = await slot.boundingBox();
  // wrong answer dragged on: counts as a mistake, slot stays open
  const wb = await wrong.boundingBox();
  await p.mouse.move(wb.x + wb.width / 2, wb.y + wb.height / 2); await p.mouse.down(); await p.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(300);
  if (await slot.evaluate((e) => e.classList.contains('filled'))) fail('wrong answer filled the slot');
  if (!(await p.evaluate(() => R.qs[R.i].tries >= 1 || R.mistakes >= 1))) fail('wrong drop was not counted');
  // right answer dragged on
  const rb = await right.boundingBox();
  await p.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2); await p.mouse.down(); await p.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(400);
  if (!(await slot.evaluate((e) => e.classList.contains('filled')))) fail('dropping the right answer did not fill the slot');
  if ((await slot.textContent()).trim() !== ans) fail('slot shows ' + (await slot.textContent()) + ' not ' + ans);
  // tapping still works on the next card
  await p.waitForTimeout(1600);
  await goTo(); await p.waitForTimeout(400);
  const ans2 = await p.evaluate(() => String(R.qs[R.i].answer));
  await p.locator('#options .opt', { hasText: new RegExp('^\\s*' + ans2 + '\\s*$') }).first().click(); await p.waitForTimeout(400);
  if (!(await p.locator('#qMain .think-missing.filled').count())) fail('tapping the right answer did not fill the slot');
  if (errs.length) fail('page errors ' + errs.slice(0, 2));
  console.log(process.exitCode ? 'missing-drag FAILED' : 'PASS missing number: drag onto ?, wrong drop counted, tap still works');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
