const { chromium } = require('playwright');
const S = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' }); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(() => localStorage.setItem('learnplay.v1', JSON.stringify({ voice: false, grade: 'prek' })));
  await p.reload(); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => {
    const out = [];
    const W = () => document.getElementById('trGuide').clientWidth;
    const won = (set) => !!(state.traced && state.traced[set + window.__trace.it[0]]);
    // centerline points sorted into a rough path (nearest-neighbour), split where the jump is big
    const pathStrokes = (pts) => { const left = pts.slice(), strokes = []; let cur = [left.shift()]; strokes.push(cur);
      while (left.length) { const l = cur[cur.length - 1]; let bi = 0, bd = 1e9; left.forEach((q, i) => { const d = Math.hypot(q[0] - l[0], q[1] - l[1]); if (d < bd) { bd = d; bi = i; } }); const q = left.splice(bi, 1)[0]; if (bd > W() * 0.06) { cur = [q]; strokes.push(cur); } else cur.push(q); } return strokes; };
    for (const [set, k] of [['big', 0], ['big', 4], ['big', 1], ['small', 0], ['small', 6], ['num', 3], ['num', 9]]) {
      state.traced = {}; TR.set = set; TR.i = k; openTrace(); await new Promise(r => setTimeout(r, 150));
      const sk = window.__trace.skelPts(), ch = window.__trace.it[0];
      // 1) trace only the left 60% of the letter → must NOT finish
      window.__trace.strokesSet(pathStrokes(sk.filter(([x]) => x < W() * 0.5)));
      const partial = won(set);
      // 2) everything except one stroke (skip the bottom 25%) → must NOT finish
      const ys = sk.map(q => q[1]), cut = Math.min(...ys) + 0.78 * (Math.max(...ys) - Math.min(...ys)); state.traced = {}; window.__trace.strokesSet(pathStrokes(sk.filter(([, y]) => y < cut)));
      const skipBottom = won(set);
      // 3) the whole middle line, a bit wobbly → must finish
      state.traced = {}; window.__trace.strokesSet(pathStrokes(sk.map(([x, y], i) => [x + Math.sin(i) * 3, y + Math.cos(i * 1.3) * 3])));
      const full = won(set);
      out.push(`${set}:${ch} left-half=${partial} skip-bottom=${skipBottom} full=${full} (skeleton ${sk.length} pts)`);
    }
    return out;
  });
  console.log(r.join('\n'));
  // picture of the "still to trace" dots after half a letter
  await p.evaluate(async () => { state.traced = {}; TR.set = 'big'; TR.i = 0; openTrace(); await new Promise(r => setTimeout(r, 150)); const W = document.getElementById('trGuide').clientWidth; const sk = window.__trace.skelPts().filter(([x]) => x < W * 0.5).sort((a, b) => a[1] - b[1]); window.__trace.strokesSet([sk]); });
  await p.waitForTimeout(300); await p.screenshot({ path: S + 'trace_missing.png' });
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
