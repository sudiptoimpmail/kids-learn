const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' }); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(() => localStorage.setItem('learnplay.v1', JSON.stringify({ voice: false, grade: 'prek' })));
  await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => {
    const out = [];
    for (const [set, k] of [['big', 0], ['big', 1], ['small', 6], ['num', 7], ['num', 11]]) {
      TR.set = set; TR.i = k; openTrace(); await new Promise(r => setTimeout(r, 200));
      const g = document.getElementById('trGuide'), W = g.clientWidth, ctx = g.getContext('2d'), sc = g.width / W;
      // scribble outside the letter: should not count
      window.__trace.strokesSet([[[5, 5], [W - 5, 8]], [[5, W - 5], [W - 5, W - 8]]]);
      const scribble = state.traced && state.traced[set + window.__trace.it[0]];
      // trace along the dark guide pixels (rows through the letter)
      const d = ctx.getImageData(0, 0, g.width, g.height).data, strokes = [];
      for (let y = 0; y < W; y += 6) { let run = null; for (let x = 0; x < W; x += 3) { const a = d[((Math.round(y * sc)) * g.width + Math.round(x * sc)) * 4 + 3]; const inL = a > 40 && a < 120; if (inL) { if (!run) { run = [[x, y]]; strokes.push(run); } else run.push([x, y]); } else run = null; } }
      window.__trace.strokesSet(strokes);
      out.push(`${set}:${window.__trace.it[0]} scribble=${!!scribble} traced=${!!(state.traced && state.traced[set + window.__trace.it[0]])} meter=${document.getElementById('trMeter').style.width}`);
    }
    return out;
  });
  console.log(r.join('\n')); console.log('errors', JSON.stringify(errs)); await b.close();
})();
