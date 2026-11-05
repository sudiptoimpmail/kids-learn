// Phase 6: children see steps in their grade, not level numbers; local grade names; curriculum areas for grown-ups.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const names = {};
    for (const cc of ['us', 'ca', 'uk', 'au', 'nz', 'in', 'ie']) { state.country = cc; state.grade = 'g3'; renderHome(); names[cc] = $('#gradeLabel').textContent; }
    state.country = 'us'; renderHome();
    const tileText = [...document.querySelectorAll('#grid .tile')].map((t) => t.textContent).join(' ');
    const dots = document.querySelectorAll('#grid .tile .lv.steps').length;
    startRound('add', 3); const diff = $('#diffLv').textContent; $('#quitBtn').click();
    state.stats = { days: {}, skills: {} }; state.levels.add = 7; renderDashboard();
    const dash = $('#dashSubjects').textContent;
    state.country = 'uk'; renderDashboard(); const dashUK = $('#dashSubjects').textContent; state.country = 'us';
    return { names, lvInTiles: /\bLv \d/.test(tileText), dots, diff, dash, dashUK };
  });
  assert.deepEqual(r.names, { us: '3rd Grade', ca: 'Grade 3', uk: 'Year 4', au: 'Year 3', nz: 'Year 4', in: 'Class 3', ie: '3rd Class' });
  assert.equal(r.lvInTiles, false, 'tiles show no raw level numbers');
  assert.ok(r.dots > 15, 'tiles show step dots');
  assert.match(r.diff, /^Step \d of \d$/);
  assert.ok(r.dash.includes('Common Core') && r.dash.includes('NBT'), 'US progress shows Common Core areas');
  assert.ok(r.dashUK.includes('National Curriculum'), 'UK progress shows the English National Curriculum');
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS local grade names in 7 countries, step dots instead of levels, curriculum areas in Progress');
})().catch((e) => { console.error(e); process.exit(1); });
