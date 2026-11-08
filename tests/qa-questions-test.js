// QA "show all questions": the viewer opens from the Test box, collects, filters and exports.
const { chromium } = require('playwright');
const fail = (m) => { console.error('FAIL ' + m); process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  const before = await p.evaluate(() => JSON.stringify([state.grade, state.levels]));
  // the programmatic collector, one grade, quick settings
  const r = await p.evaluate(async () => { const d = await QAQuestions.collect({ grades: ['k'], maxRounds: 2, patience: 1 }); return { n: d.count, bad: d.questions.filter((q) => q.autoIssues && q.autoIssues.length).length, sample: d.questions[0], hasRubric: /accuracy/.test(d.rubric), md: QAQuestions.toMarkdown(d).length, books: d.questions.filter((q) => q.section === 'library').length }; });
  if (r.n < 100) fail('too few questions: ' + r.n);
  if (r.bad) fail('auto-flagged cards: ' + r.bad);
  if (!r.hasRubric || r.md < 1000) fail('rubric / markdown missing');
  if (!r.sample.options || !r.sample.prompt && !r.sample.main) fail('question not described');
  if (before !== await p.evaluate(() => JSON.stringify([state.grade, state.levels]))) fail('collector changed the child\'s grade/levels');
  // the viewer, from the Test box
  await p.evaluate(() => { state.testMode = true; document.getElementById('testSection').hidden = false; });
  await p.evaluate(() => { QAQuestions.open(); });
  await p.locator('#qaAll [data-m=quick]').click();
  await p.waitForSelector('#qaAll .qa-tools:not([hidden])', { timeout: 120000 });
  const cards = await p.locator('#qaAll .qa-card').count();
  if (cards < 50) fail('viewer shows too few cards: ' + cards);
  await p.selectOption('#qaAll [data-f=grade]', 'k');
  await p.fill('#qaAll [data-f=q]', 'zzzz-no-such-text');
  if (await p.locator('#qaAll .qa-card').count() !== 0) fail('search did not filter');
  const dl = p.waitForEvent('download'); await p.fill('#qaAll [data-f=q]', ''); await p.click('#qaAll [data-a=json]');
  const name = (await dl).suggestedFilename(); if (name !== 'learn-play-questions.json') fail('download name ' + name);
  await p.click('#qaAll [data-a=close]');
  if (errs.length) fail('page errors: ' + errs.slice(0, 2));
  console.log(process.exitCode ? 'qa-questions FAILED' : `PASS qa all-questions: ${r.n} cards for K (+${r.books} book questions), viewer, filter, JSON export`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
