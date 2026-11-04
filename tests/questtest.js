const { chromium } = require('playwright');
const S = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' });
  const errs = [];
  for (const [name, vp, grade] of [['phone', { width: 390, height: 844 }, 'k'], ['ipad', { width: 820, height: 1180 }, 'g2']]) {
    const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/index.html');
    await p.evaluate((g) => localStorage.setItem('learnplay.v1', JSON.stringify({ name: 'Shivika', voice: false, grade: g })), grade);
    await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(400);
    console.log(name, 'plan:', await p.evaluate(() => questFor().steps.map(s => s.cat + '/' + s.why).join(', ')));
    await p.screenshot({ path: S + `quest_${name}.png` });
    // do every step
    const out = await p.evaluate(async () => {
      const log = [];
      for (let guard = 0; guard < 8; guard++) {
        const q = questFor(); const i = q.steps.findIndex(s => !s.done); if (i < 0) break;
        if (q.steps[i].cat === 'trace') { startQuestStep(i); for (let k = 0; k < 3; k++) { await new Promise(r => setTimeout(r, 300)); const g = document.getElementById('trGuide'); const W = g.clientWidth, sc = g.width / W, d = g.getContext('2d').getImageData(0, 0, g.width, g.height).data, st = []; for (let y = 0; y < W; y += 6) { let run = null; for (let x = 0; x < W; x += 3) { const a = d[((Math.round(y * sc)) * g.width + Math.round(x * sc)) * 4 + 3]; if (a > 40 && a < 120) { if (!run) { run = [[x, y]]; st.push(run); } else run.push([x, y]); } else run = null; } } window.__trace.strokesSet(st); await new Promise(r => setTimeout(r, 900)); if (TR.quest == null) break; TR.i = (TR.i + 1) % 26; renderTrace(false); } log.push('trace done=' + questFor().steps[i].done); continue; }
        startQuestStep(i);
        for (let k = 0; k < 12 && document.getElementById('play').classList.contains('active'); k++) { const c = R.qs[R.i]; R.locked = false; choose(c, c.answer, document.createElement('i')); await new Promise(r => setTimeout(r, 5)); if (R.qs[R.i] === c) next(); }
        log.push(q.steps[i].cat + ' cards=' + R.qs.length + ' done=' + questFor().steps[i].done + ' next=' + document.getElementById('questNext').textContent);
      }
      return log;
    });
    console.log(out.join('\n'));
    await p.evaluate(() => { renderHome(); show('home'); }); await p.waitForTimeout(300);
    await p.screenshot({ path: S + `quest_done_${name}.png` });
    await p.evaluate(() => openQuestGift()); await p.waitForTimeout(700);
    await p.screenshot({ path: S + `quest_gift_${name}.png` });
    console.log('gift:', await p.evaluate(() => ({ quests: state.quests, passes: state.playPasses, giftShown: !!document.querySelector('.quest-gift') })));
    await p.close();
  }
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
