// Phase 6: children see steps in their grade, not level numbers; local grade names; grade-scoped skill summaries for grown-ups.
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
    const summaryUS = $('#gradeSummary').textContent;
    const goalsUS = [...document.querySelectorAll('#gradeSummary .grade-goal b')].map(e => e.textContent);
    const expectedGoals = gradeGoals('g3').map(g => g.label);
    const statuses = gradeGoalRows().map(r => r.status);
    state.country = 'uk'; renderDashboard(); const dashUK = $('#dashSubjects').textContent; const summaryUK = $('#gradeSummary').textContent; state.country = 'us';
    state.grade = 'k'; renderDashboard();
    const kindergartenGoals = [...document.querySelectorAll('#gradeSummary .grade-goal b')].map(e => e.textContent);
    const expectedKindergartenGoals = gradeGoals('k').map(g => g.label);
    return { names, lvInTiles: /\bLv \d/.test(tileText), dots, diff, dash, dashUK, summaryUS, summaryUK, goalsUS, expectedGoals, statuses, kindergartenGoals, expectedKindergartenGoals };
  });
  assert.deepEqual(r.names, { us: '3rd Grade', ca: 'Grade 3', uk: 'Year 4', au: 'Year 3', nz: 'Year 4', in: 'Class 3', ie: '3rd Class' });
  assert.equal(r.lvInTiles, false, 'tiles show no raw level numbers');
  assert.ok(r.dots > 15, 'tiles show step dots');
  assert.match(r.diff, /^Step \d of \d$/);
  assert.ok(r.dash.includes('Common Core'), 'US activity details retain the local curriculum name');
  assert.equal(/\bNBT\b/.test(r.dash), false, 'activity levels must not imply grade-specific standards mastery');
  assert.match(r.summaryUS, /Grade skill summary.*3rd Grade/);
  assert.match(r.summaryUK, /Grade skill summary.*Year 4/);
  assert.deepEqual(r.goalsUS, r.expectedGoals, 'summary uses configured goals for the current grade');
  assert.ok(r.statuses.length > 0 && r.statuses.every(s => s === 'Not assessed'), 'an activity level alone is not grade-skill evidence');
  assert.deepEqual(r.kindergartenGoals, r.expectedKindergartenGoals, 'changing grade refreshes the skill goals');
  assert.notDeepEqual(r.kindergartenGoals, r.goalsUS);
  assert.ok(r.dashUK.includes('National Curriculum'), 'UK progress shows the English National Curriculum');
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS local grade names in 7 countries, step dots instead of levels, grade-scoped skill summaries and no inferred mastery from activity levels');
})().catch((e) => { console.error(e); process.exit(1); });
