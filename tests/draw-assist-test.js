// Drawing helper: more help for younger children; lines are tidied, shapes close, brush paint stays inside.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const open = async (grade, assist) => { await p.evaluate(([grade, assist]) => { document.getElementById('splash').style.display = 'none'; state.playAlways = true; state.testMode = false; state.grade = grade; if (assist == null) delete state.drawAssist; else state.drawAssist = assist; state.drawings = []; openGame('draw'); }, [grade, assist]);
      await p.waitForSelector('#gameArea [data-a="surprise"]'); await p.click('#gameArea [data-a="surprise"]'); await p.waitForFunction(() => !!window.__draw && window.__draw.guideReady()); };
    const levels = {};
    for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) levels[g] = await p.evaluate((g) => { state.grade = g; delete state.drawAssist; return drawAssist(); }, g);
    assert.ok(levels.prek > levels.k && levels.k > levels.g1 && levels.g1 > levels.g2 && levels.g2 > levels.g3 && levels.prek <= 1 && levels.g3 > 0, 'younger children get more help: ' + JSON.stringify(levels));
    const shapes = () => p.evaluate(() => { const d = window.__draw, W = d.W, wob = [], ring = [];
      for (let i = 0; i <= 40; i++) wob.push([W * 0.2 + i * W * 0.012, W * 0.5 + Math.sin(i * 0.5) * W * 0.012]);                       // a shaky straight line
      for (let i = 0; i <= 58; i++) { const a = i / 60 * Math.PI * 2, r = W * 0.2 + ((i * 7) % 5 - 2) * W * 0.006; ring.push([W * 0.5 + Math.cos(a) * r, W * 0.5 + Math.sin(a) * r]); }   // a bumpy ring, not quite closed
      const bend = (q) => { let t = 0; for (let i = 1; i < q.length - 1; i++) { const a = Math.atan2(q[i][1] - q[i - 1][1], q[i][0] - q[i - 1][0]), c = Math.atan2(q[i + 1][1] - q[i][1], q[i + 1][0] - q[i][0]); t += Math.abs(Math.atan2(Math.sin(c - a), Math.cos(c - a))); } return t; };
      const line = d.tidy(wob.map((q) => q.slice())), loop = d.tidy(ring.map((q) => q.slice()));
      return { assist: d.assist, line: line.length, bendBefore: +bend(ring).toFixed(1), bendAfter: +bend(loop).toFixed(1), gap: Math.hypot(loop[0][0] - loop.at(-1)[0], loop[0][1] - loop.at(-1)[1]) / W, start: Math.hypot(loop[0][0] - ring[0][0], loop[0][1] - ring[0][1]) }; });
    const paintTest = () => p.evaluate(() => { const d = window.__draw, W = d.W, f = (x, y) => [W * x, W * y];
      // her own closed box in a corner of the page, then a brush stroke from inside it far out to the side
      d.add([f(0.04, 0.04), f(0.2, 0.04), f(0.2, 0.2), f(0.04, 0.2), f(0.04, 0.04)]);
      const held = d.brush([f(0.12, 0.12), f(0.16, 0.12), f(0.5, 0.12)], 26);
      return { held, inside: d.inkAt(W * 0.15, W * 0.12) > 0, outside: d.inkAt(W * 0.36, W * 0.12) > 0 }; });
    // ---- Pre-K: lots of help
    await open('prek');
    const hi = await shapes();
    assert.equal(hi.assist, levels.prek); assert.equal(hi.line, 2, 'a shaky line becomes straight');
    assert.ok(hi.bendAfter < hi.bendBefore * 0.5, `a bumpy ring becomes a smooth curve: ${hi.bendBefore} -> ${hi.bendAfter}`);
    assert.ok(hi.gap < 0.001, 'a shape that nearly closes is closed'); assert.ok(hi.start < 0.01, 'the line still starts where she started');
    assert.deepEqual(await paintTest(), { held: true, inside: true, outside: false }, 'brush paint stays in the shape');
    // ---- helper off: her lines are left exactly as drawn
    await open('prek', 0);
    const off = await shapes();
    assert.equal(off.assist, 0); assert.equal(off.line, 41); assert.equal(off.bendAfter, off.bendBefore);
    assert.deepEqual(await paintTest(), { held: false, inside: true, outside: true });
    // ---- 3rd grade: only a light touch
    await open('g3');
    const lo = await shapes();
    assert.ok(lo.bendAfter < lo.bendBefore && lo.bendAfter > hi.bendAfter, 'less smoothing for older children');
    // ---- the grown-up setting
    const set = await p.evaluate(() => { openSettings(); const s = document.getElementById('drawAssist'); const auto = s.value; s.value = '0.25'; document.getElementById('saveSettings')?.click(); return { auto, options: s.options.length }; });
    assert.deepEqual(set, { auto: '', options: 6 });
    assert.deepEqual(errors, []);
    console.log('PASS drawing helper: more help for younger grades, straight lines, smooth closed curves, brush stays inside, off leaves lines alone', JSON.stringify(levels));
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
