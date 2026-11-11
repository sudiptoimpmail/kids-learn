const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN }); const p = await b.newPage({ viewport: { width: 1080, height: 810 } });
  const errs = []; const bad = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('response', (r) => { if (r.status() >= 400) bad.push(r.url()); });
  await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = 'k'; state.pinHash = pinHash('1234'); save(); renderHome(); show('home'); });
  const tryPin = async (pin) => { await p.evaluate(() => askPin(() => { window.__ok = (window.__ok || 0) + 1; })); for (const d of pin) await p.click(`#pinPad [data-k="${d}"]`); await p.waitForTimeout(300); };
  for (let i = 0; i < 3; i++) await tryPin('9999');
  assert.match(await p.textContent('#pinNote'), /Wait 30 seconds/);
  await p.reload(); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; });
  await tryPin('1234');
  assert.equal(await p.evaluate(() => window.__ok || 0), 0, 'still locked after reopening');
  await p.evaluate(() => { const k = AppConfig.storage.key + '.pinlock'; const v = JSON.parse(localStorage.getItem(k)); v.until = 0; localStorage.setItem(k, JSON.stringify(v)); });
  await tryPin('1234'); assert.equal(await p.evaluate(() => window.__ok), 1);
  assert.equal(await p.evaluate(() => localStorage.getItem(AppConfig.storage.key + '.pinlock')), null);
  // Back button sits above the title
  await p.evaluate(() => askPin(() => {}));
  const [bb, tt] = await p.evaluate(() => ['#pinBack', '#pinTitle'].map((s) => document.querySelector(s).getBoundingClientRect().toJSON()));
  assert.ok(bb.bottom <= tt.top + 2, `back ${bb.bottom} title ${tt.top}`);
  assert.deepEqual(bad, []); assert.deepEqual(errs, []);
  console.log('PASS pin lock kept, back button clear, no failed requests');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
