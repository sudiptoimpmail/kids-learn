// Crossword: drag a letter from the tray into a box (and between boxes); tapping still works.
const { chromium } = require('playwright');
const fail = (m) => { console.error('FAIL ' + m); process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  const ok = await p.evaluate(() => {
    Object.assign(state, { grade: 'g1', playAlways: true, testMode: false });
    for (const id of visibleGames().filter((c) => c.gen).map((c) => c.id)) for (let lv = 1; lv <= 5; lv++) {
      state.levels = { [id]: lv };
      for (let t = 0; t < 14; t++) { try { document.querySelector('#quitBtn').click(); } catch {} R = null; try { startRound(id, 10); } catch { continue; } if (!R) continue;
        for (let i = 0; i < R.qs.length; i++) { if (R.qs[i].puzzle && R.qs[i].puzzle.kind !== 'wsearch') { R.i = i; renderQ(); return true; } } }
    }
    return false;
  });
  if (!ok) { fail('no crossword card found'); await b.close(); return; }
  await p.waitForSelector('.xw-cell:not(.given)');
  const cw = await p.evaluate(() => { const c = window.__crossword; const k = [...document.querySelectorAll('.xw-cell:not(.given)')][0].dataset.k; return { k, l: c.cells.get(k) }; });
  const cell = p.locator(`.xw-cell[data-k="${cw.k}"]`), key = p.locator(`.xw-key[data-l="${cw.l}"]`).first();
  const kb = await key.boundingBox(), cb = await cell.boundingBox();
  await p.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2); await p.mouse.down(); await p.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(300);
  if ((await cell.textContent()).trim() !== cw.l) fail('dragging the letter did not fill the box (got "' + (await cell.textContent()) + '")');
  // tap still works on another open box
  const k2 = await p.evaluate((k0) => { const e = [...document.querySelectorAll('.xw-cell:not(.given):not(.ok)')].find((x) => x.dataset.k !== k0 && !x.textContent.trim()); return e ? { k: e.dataset.k, l: window.__crossword.cells.get(e.dataset.k) } : null; }, cw.k);
  if (k2) { await p.locator(`.xw-cell[data-k="${k2.k}"]`).click(); await p.locator(`.xw-key[data-l="${k2.l}"]`).first().click(); await p.waitForTimeout(200);
    if ((await p.locator(`.xw-cell[data-k="${k2.k}"]`).textContent()).trim() !== k2.l) fail('tap-to-type no longer works'); }
  if (errs.length) fail('page errors ' + errs.slice(0, 2));
  console.log(process.exitCode ? 'crossword-drag FAILED' : 'PASS crossword: drag letter into a box, tap still works');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
