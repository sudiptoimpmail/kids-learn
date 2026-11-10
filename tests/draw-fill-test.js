// Draw & Copy: pick a template first; the paint bucket fills inside the child's own drawing, not the template's lines.
const { chromium } = require('playwright');
const fail = (m) => { console.error('FAIL ' + m); process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  await p.evaluate(() => { Object.assign(state, { grade: 'k', playAlways: true }); openGame('draw'); });
  await p.waitForSelector('.pic-pick'); const n = await p.locator('.pic-pick').count();
  if (n < 6) fail('template picker shows too few pictures: ' + n);
  await p.locator('.pic-pick').nth(2).click(); await p.waitForSelector('.dr-cv');
  const icon = await p.locator('[data-t=bucket] svg.bk-ico').count(); if (!icon) fail('paint bucket icon is not the drawn bucket');
  const cv = p.locator('.dr-cv'), bb = await cv.boundingBox();
  const filled = () => p.evaluate(() => { const f = document.querySelector('.dr-fill'); const d = f.getContext('2d').getImageData(0, 0, f.width, f.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n / (f.width * f.height); });
  const px = (fx, fy) => p.evaluate(([fx, fy]) => { const f = document.querySelector('.dr-fill'); return f.getContext('2d').getImageData(Math.floor(fx * f.width), Math.floor(fy * f.height), 1, 1).data[3]; }, [fx, fy]);
  // 1) pouring on an empty page must NOT flood it (the template's own lines don't count)
  await p.locator('[data-a=drtool]').click(); await p.locator('[data-t=bucket]').click(); await p.mouse.click(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5); await p.waitForTimeout(200);
  if ((await filled()) > 0.01) fail('paint flooded a page with no drawing in it');
  // 2) draw a closed square, then pour inside it
  await p.locator('[data-a=drtool]').click(); await p.locator('.dr-size').first().click();
  const x0 = bb.x + bb.width * 0.3, y0 = bb.y + bb.height * 0.3, x1 = bb.x + bb.width * 0.7, y1 = bb.y + bb.height * 0.7;
  await p.mouse.move(x0, y0); await p.mouse.down(); for (const [x, y] of [[x1, y0], [x1, y1], [x0, y1], [x0, y0 - 2]]) await p.mouse.move(x, y, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(200);
  await p.locator('[data-a=drtool]').click(); await p.locator('[data-t=bucket]').click(); await p.mouse.click(bb.x + bb.width * 0.5, bb.y + bb.height * 0.5); await p.waitForTimeout(300);
  const fr = await filled();
  if (fr < 0.1 || fr > 0.3) fail('fill covers ' + fr.toFixed(2) + ' of the page; expected about the square (0.16)');
  if ((await px(0.5, 0.5)) === 0) fail('inside the child\'s square is not painted');
  if ((await px(0.05, 0.05)) !== 0) fail('paint leaked outside the child\'s square');
  // undo takes the paint away
  await p.locator('[data-t=undo]').click(); await p.waitForTimeout(150); if ((await filled()) > 0.01) fail('undo did not remove the paint');
  if (errs.length) fail('page errors ' + errs.slice(0, 2));
  console.log(process.exitCode ? 'draw-fill FAILED' : 'PASS draw: template picker, bucket icon, paint stays inside the child\'s own drawing, no flood on an empty page, undo');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
