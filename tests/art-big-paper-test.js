// Art screens: the drawing paper takes 80–90% of the screen, colouring pictures are as large as the shorter side
// allows, ink lands under the finger on the wide paper, and the quiet music can be turned off.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const errors = [];
    for (const [name, w, h] of [['iPad landscape', 1180, 820], ['iPad portrait', 820, 1180], ['iPad mini landscape', 1024, 768], ['iPhone', 390, 844], ['iPhone landscape', 844, 390]]) {
      const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true }); p.on('pageerror', (e) => errors.push(e.message));
      await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
      await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = 'k'; state.playAlways = true; state.testMode = false; state.voice = false; state.drawings = []; state.artMusic = true; openGame('draw'); });
      await p.click('#gameArea [data-a="surprise"]'); await p.waitForFunction(() => !!window.__draw && window.__draw.guideReady());
      const box = (sel) => p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, share: r.width * r.height / (innerWidth * innerHeight), right: r.right, bottom: r.bottom }; }, sel);
      const pad = await box('.dr-pad'), rail = await box('.cb-rail');
      assert.ok(pad.share >= 0.8 && pad.share <= 0.9, `${name}: the drawing paper takes ${pad.share.toFixed(2)} of the screen`);
      assert.ok(rail.right <= w + 1 && rail.bottom <= h + 1 && (rail.x >= pad.right - 1 || rail.y >= pad.bottom - 1), `${name}: the tools sit beside the paper, on screen`);
      assert.equal(await p.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2), true, `${name}: nothing to scroll`);
      // the canvas is the paper's shape, the guide sits in the middle, and ink lands under the finger at the far edge
      const d = await p.evaluate(() => { const d = window.__draw, cv = document.querySelector('.dr-cv'), g = document.querySelector('.dr-guide svg').getBoundingClientRect(), pr = document.querySelector('.dr-pad').getBoundingClientRect();
        return { W: d.W, H: d.H, ratio: cv.width / cv.height, guide: [g.x - pr.x, g.y - pr.y, g.width], want: [d.GX + d.S * 0.06, d.GY + d.S * 0.06, d.S * 0.88] }; });
      assert.ok(Math.abs(d.W - pad.w) < 1 && Math.abs(d.H - pad.h) < 1 && Math.abs(d.ratio - pad.w / pad.h) < 0.01, `${name}: the canvas matches the paper`);
      d.guide.forEach((v, i) => assert.ok(Math.abs(v - d.want[i]) < 1.5, `${name}: guide picture where the pad expects it`));
      const fx = pad.x + pad.w * (w > h ? 0.94 : 0.5), fy = pad.y + pad.h * (w > h ? 0.5 : 0.94);
      await p.mouse.move(fx, fy); await p.mouse.down(); await p.mouse.move(fx - 30, fy - 30, { steps: 5 }); await p.mouse.up();
      assert.ok(await p.evaluate(([x, y]) => window.__draw.inkAt(x, y) > 0, [fx - pad.x - 15, fy - pad.y - 15]), `${name}: ink under the finger near the far edge`);
      await p.evaluate(() => window.__draw.saveNow());
      assert.equal(await p.evaluate(() => state.drawings.length === 1 && state.drawings[0].img.startsWith('data:image/jpeg')), true, `${name}: saved to My drawings`);
      // colouring pictures: square, as large as the shorter side of their space, fully on screen
      for (const open of ['startColoring(ALL_PICS[0])', 'startColorByNumber(CBN_PAGES[0])']) {
        await p.evaluate((open) => { openGame('color'); (0, eval)(open); }, open); await p.waitForSelector('.color-wrap svg');
        const pic = await box('.color-wrap'), cell = await box('.cb-pic'), r2 = await box('.cb-rail');
        assert.ok(Math.abs(pic.w - pic.h) < 1 && Math.abs(pic.w - Math.min(cell.w, cell.h)) < 2, `${name}: ${open} fills the shorter side`);
        assert.ok(Math.min(pic.w / w, pic.h / h) >= 0.42 && Math.max(pic.w / w, pic.h / h) >= 0.9, `${name}: ${open} uses at least 90% of the shorter side`);
        assert.ok(pic.x >= 0 && pic.y >= 0 && pic.right <= w + 1 && pic.bottom <= h + 1 && r2.right <= w + 1 && r2.bottom <= h + 1, `${name}: ${open} on screen`);
        assert.equal(await p.evaluate(() => !!document.querySelector('.cb-rail [data-a="music"]')), true);
      }
      // the title is out of the way but Back still works
      assert.equal(await p.evaluate(() => getComputedStyle(document.getElementById('gameTitle')).visibility), 'hidden');
      if (name === 'iPad landscape') {
        // music: plays on the art screens, the button turns it off and on, and it stops when she leaves
        const m = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const out = { on: ArtMusic.playing(), bars: ArtMusic.bars() > 0 };
          const btn = document.querySelector('.cb-rail [data-a="music"]'); btn.click(); out.off = [ArtMusic.playing(), state.artMusic, btn.classList.contains('off')];
          btn.click(); out.again = [ArtMusic.playing(), state.artMusic, btn.classList.contains('off')];
          document.getElementById('gameBack').click(); await wait(700); out.left = ArtMusic.playing(); out.picker = !document.querySelector('#game.active #gameArea .cb'); return out; });
        assert.deepEqual(m, { on: true, bars: true, off: [false, false, true], again: [true, true, false], left: false, picker: true });
      } else { await p.click('#gameBack'); assert.equal(await p.evaluate(() => !document.querySelector('#game.active #gameArea .cb')), true, `${name}: Back leaves the page`); }
      await p.close();
    }
    assert.deepEqual(errors, []);
    console.log('PASS art screens: drawing paper 80–90% of the screen on 5 sizes, colouring fills the shorter side, ink under the finger, quiet music with an off switch');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
