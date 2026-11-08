// Export every question in the app for human or AI review.
//   node tests/export-questions.js [--grades prek,k] [--out tests/out/questions] [--check] [--base http://localhost:8765]
// Writes <out>.json (structured, with the reviewer rubric) and <out>.md (readable), then prints the counts.
// --check exits 1 when a card has an automatic issue (answer key mismatch, no prompt, generator error) or a page error.
const fs = require('node:fs');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg('--out', 'tests/out/questions'), BASE = arg('--base', 'http://localhost:8765'), GRADES = arg('--grades', ''), CHECK = process.argv.includes('--check');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + '/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(400);
  const { data, md } = await p.evaluate(async (g) => {
    const data = await QAQuestions.collect(g ? { grades: g.split(',') } : {});
    window.__d = data; return { data, md: QAQuestions.toMarkdown(data) };
  }, GRADES);
  fs.mkdirSync(require('node:path').dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT + '.json', JSON.stringify(data, null, 1) + '\n'); fs.writeFileSync(OUT + '.md', md + '\n');
  for (const g of [...new Set(data.questions.map((q) => q.grade))]) fs.writeFileSync(`${OUT}-${g}.md`, (await p.evaluate(([gg]) => QAQuestions.toMarkdown(window.__d, window.__d.questions.filter((q) => q.grade === gg)), [g])) + '\n');
  const by = {}; let flagged = 0, nofit = 0;
  for (const q of data.questions) { const k = `${q.grade}`; by[k] = (by[k] || 0) + 1; if (q.autoIssues && q.autoIssues.length) flagged++; if (q.gradeFit === false) nofit++; }
  console.log(`questions: ${data.count} (${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(', ')}) · auto-flagged ${flagged} · grade-fit warnings ${nofit} · page errors ${errs.length}`);
  console.log(`wrote ${OUT}.json and ${OUT}.md`);
  await b.close();
  if (CHECK && (flagged || errs.length)) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
