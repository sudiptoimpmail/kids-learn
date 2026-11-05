const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.stack.split('\n').slice(0,3).join(' | ')));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.evaluate(() => { localStorage.setItem('learnplay.v1', JSON.stringify({ optAnatomy: true, optClock: true, testMode: true, voice: true, name: 'Shivika' })); });
  await p.reload(); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.evaluate(() => document.getElementById('startBtn').click());
  await p.waitForTimeout(1500);
  const misses = await p.evaluate(async () => {
    const miss = new Map();
    const orig = window.deviceSay;
    // record every phrase that has no recording, without playing anything
    window.__miss = miss;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    deviceSay = (t) => { miss.set(t, (miss.get(t) || 0) + 1); return Promise.resolve(); };
    playClip = () => Promise.resolve();
    await say('xyzzy blorp test'); miss.set('state.voice=' + state.voice + ' clips=' + Object.keys(CLIPS).length, 1);
    const cats = CATEGORIES.filter(c => c.gen).map(c => c.id).filter(id => id !== 'vocab'); for (const set of ['big','small','num']) for (const it of traceItems(set)) { const parts = it[2].split('. ').map((x, k, a) => (k < a.length - 1 ? x + '.' : x)); if (!parts.every(x => CLIPS[clipKey(x)])) miss.set('trace: ' + it[2], 1); }
    for (const id of cats) for (let lv = 1; lv <= (CATEGORIES.find(c => c.id === id).maxLevel || 3); lv++) {
      state.levels = state.levels || {}; state.levels[id] = lv;
      try { startRound(id); } catch (e) { miss.set('ERR start ' + id + ' ' + e.message, 1); continue; }
      for (let k = 0; k < 12 && document.getElementById('play').classList.contains('active'); k++) {
        const q = R.qs[R.i]; if (!q) break;
        try { if (q.hint) showHint(q); } catch {}
        await sleep(5);
        try { if (k % 3 === 0 && q.options && q.options.length) { const w = q.options.find(o => String(o.v) !== String(q.answer)); if (w) choose(q, w.v, document.createElement('i')); } } catch {}
        await sleep(5);
        try { R.locked = false; choose(q, q.answer, document.createElement('i')); } catch (e) { }
        await sleep(5);
        if (R.qs[R.i] === q) { try { next(); } catch {} }
        await sleep(5);
      }
      if (document.getElementById('play').classList.contains('active')) { try { finish(); } catch {} }
      await sleep(10);
    }
    return [...miss.entries()].sort((a, b) => b[1] - a[1]);
  });
  // One deliberately nonsensical phrase and the voice-status line are diagnostic,
  // not missing curriculum recordings. Fail CI on all actual regressions.
  const unexpected = misses.filter(([t]) => t !== 'xyzzy blorp test' && !t.startsWith('state.voice='));
  console.log(unexpected.length + ' unexpected missing phrases');
  for (const [t, n] of unexpected.slice(0, 80)) console.log(n, JSON.stringify(t));
  console.log('errors', JSON.stringify(errs.slice(0, 5)));
  if (unexpected.length || errs.length) process.exitCode = 1;
  await b.close();
})();
