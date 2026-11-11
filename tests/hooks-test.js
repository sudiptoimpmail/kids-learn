// Add-on scripts change app functions only through CoreHooks; nothing replaces another script's function.
const assert = require('node:assert/strict'), fs = require('fs'), { chromium } = require('playwright');
const cfg = JSON.parse(fs.readFileSync('app.config.json', 'utf8'));
// 1. static: no script assigns to a hookable function or wraps globals by name
const names = cfg.hooks;
for (const f of [...cfg.scripts, ...Object.values(cfg.lazy || {}).flatMap((g) => g.scripts)]) {
  const src = fs.readFileSync(f, 'utf8');
  for (const n of names) assert.doesNotMatch(src, new RegExp(`(^|[;\\n}])\\s*(window\\.|globalThis\\.)?${n}\\s*=(?!=)`), `${f} reassigns ${n}; use CoreHooks.before/after`);
  assert.doesNotMatch(src, /globalThis\[[^\]]+\]\s*=(?!=)/, `${f} assigns globals by name`);
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const list = await p.evaluate(() => CoreHooks.list());
    for (const n of names) {
      const h = list.find((x) => x.name === n);
      assert.ok(h && (h.installed || (await p.evaluate((n) => !!CoreLazy.owner(n), n))), 'not hooked: ' + n);
    }
    // the family break guard runs before the round starts, whatever order the scripts loaded in
    const blocked = await p.evaluate(() => {
      document.getElementById('splash').style.display = 'none'; state.grade = 'k'; state.name = 'T';
      state.familySettings = { quietEnabled: true, quietStart: '00:00', quietEnd: '23:59' };
      const before = document.querySelector('.screen.active')?.id; startRound('cvc');
      const after = document.querySelector('.screen.active')?.id; state.familySettings = {}; return [before, after, !!document.querySelector('.family-break, #familyBreak')];
    });
    assert.notEqual(blocked[1], 'play', 'round started during quiet hours: ' + blocked);
    assert.deepEqual(errors, []);
    console.log('PASS hooks: no function replaced by another script; family guard runs first');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
