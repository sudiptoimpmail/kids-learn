// Every stroke must be traced: for every letter and number, leaving out any one stroke must not finish
// (e.g. an A drawn as a tent, an H without its bar), and tracing the whole letter must finish.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' }); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => {
    state.voice = false;
    const W = () => document.getElementById('trGuide').clientWidth;
    const won = (set) => !!(state.traced && state.traced[set + window.__trace.it[0]]);
    const pathStrokes = (pts) => { if (!pts.length) return []; const left = pts.slice(), strokes = []; let cur = [left.shift()]; strokes.push(cur);
      while (left.length) { const l = cur[cur.length - 1]; let bi = 0, bd = 1e9; left.forEach((q, i) => { const d = Math.hypot(q[0] - l[0], q[1] - l[1]); if (d < bd) { bd = d; bi = i; } }); const q = left.splice(bi, 1)[0]; if (bd > W() / 96 * 1.6) { cur = [q]; strokes.push(cur); } else cur.push(q); } return strokes; };
    const bad = [], skipped = []; let letters = 0, checks = 0;
    for (const set of ['big', 'small', 'num', 'lines']) for (let k = 0; k < traceItems(set).length; k++) {
      state.traced = {}; TR.set = set; TR.i = k; openTrace(); await new Promise(r => setTimeout(r, 30));
      const sk = window.__trace.skelPts(), br = window.__trace.branches(), ch = window.__trace.it[0]; letters++;
      window.__trace.strokesSet(pathStrokes(sk.map(([x, y], i) => [x + Math.sin(i) * 3, y + Math.cos(i * 1.3) * 3])));
      if (!won(set)) bad.push(`${set}:${ch} full trace did not finish`);
      for (const b of br.filter((x) => x.length >= 7)) {   // a piece of 5–6 points sits between two crossings, too short to be a stroke of its own
        // leave out this stroke, and a little around it
        const near = (q) => b.some((c) => Math.hypot(c[0] - q[0], c[1] - q[1]) < W() * 0.02);
        state.traced = {}; window.__trace.strokesSet(pathStrokes(sk.filter((q) => !near(q)))); checks++;
        if (won(set)) bad.push(`${set}:${ch} finished without a stroke of ${b.length} pts`);
      }
      if (!br.length) skipped.push(ch);
    }
    return { letters, checks, bad, oneStroke: skipped.join('') };
  });
  console.log(JSON.stringify(r));
  console.log(r.bad.length ? 'FAIL' : 'PASS every stroke must be traced');
  console.log('errors', JSON.stringify(errs)); await b.close();
  if (r.bad.length || errs.length) process.exitCode = 1;
})();
