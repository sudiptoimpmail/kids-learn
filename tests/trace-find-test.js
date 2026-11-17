// Trace a shape, then find the matching things: both steps are shown and said, every target is a true circle or square,
// and finding the last one finishes the card.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 430, height: 900 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    for (const mode of ['shapes', 'squares']) {
      const card = await p.evaluate((mode) => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = 'k'; state.voice = true; state.testMode = false; TeachFirst.run++; startRound('shape2', 5, true);
        let q; for (let i = 0; i < 400 && !q; i++) { const c = IllustratedActivities.make('k', 'shape2', 1); if (c && c.illustrated && c.illustrated.mode === mode) q = c; }
        q.tries = 0; q.cat = R.cat; q.level = 1; R.qs[R.i] = q; R.locked = false; renderQ();
        return { say: q.say, recorded: CoreVoice.canSay(q.say) && CoreVoice.canSay(mode === 'shapes' ? 'Tap all the circles you see.' : 'Tap all the squares you see.'), step1: document.querySelector('.ia-trace-heading').textContent, locked: [...document.querySelectorAll('.ia-hotspot')].every((h) => h.disabled) }; }, mode);
      assert.match(card.say[0], /^Trace the (circle|square) with your finger\.$/); assert.match(card.say[1], /^Then tap all the (circles|squares) you see\.$/); assert.ok(card.recorded, 'both steps are recorded');
      assert.match(card.step1, /1\. Trace the (circle|square).*green dot/); assert.ok(card.locked, 'the picture waits for the tracing');
      // trace it with a finger, all the way around
      const pts = await p.evaluate(() => { const path = document.querySelector('.ia-trace-guide'), svg = path.ownerSVGElement, m = svg.getScreenCTM(), L = path.getTotalLength(), out = [];
        svg.scrollIntoView({ block: 'center' }); const m2 = svg.getScreenCTM();
        for (let i = 0; i <= 60; i++) { const q = path.getPointAtLength(L * i / 60); out.push([q.x * m2.a + m2.e, q.y * m2.d + m2.f]); } return out; });
      await p.mouse.move(...pts[0]); await p.mouse.down(); for (const q of pts.slice(1)) await p.mouse.move(...q, { steps: 2 }); await p.mouse.up();
      await p.waitForFunction(() => /Shape traced/.test(document.querySelector('.ia-trace-heading b').textContent), null, { timeout: 5000 });
      const step2 = await p.evaluate(() => ({ text: document.querySelector('.ia-trace-heading small').textContent, open: [...document.querySelectorAll('.ia-hotspot')].every((h) => !h.disabled) }));
      assert.match(step2.text, /2\. Now tap all the (circles|squares)/); assert.ok(step2.open);
      // a wrong thing is a try; the four right ones finish the card
      const done = await p.evaluate((mode) => { const info = ContentData.get('workbook', 'scenes')[mode], q = R.qs[R.i], wrong = info.items.find(([id]) => !info.correct.includes(id))[0];
        document.querySelector(`.ia-hotspot[data-object="${wrong}"]`).click(); const tries = q.tries;
        for (const id of info.correct) document.querySelector(`.ia-hotspot[data-object="${id}"]`).click();
        return { tries, found: document.querySelectorAll('.ia-hotspot.ia-found').length, locked: R.locked, need: info.correct.length }; }, mode);
      assert.deepEqual(done, { tries: 1, found: 4, locked: true, need: 4 }, mode + ': finding all four finishes the card');
      await p.waitForFunction(() => !R.locked || document.getElementById('result').classList.contains('active') || R.i > 0, null, { timeout: 8000 });   // it moves on by itself
    }
    // the round things in the room really are round, and the traced circle is a circle
    const art = await p.evaluate(async () => { const svg = await (await fetch('assets/workbook/room.svg')).text(); const wb = await (await fetch('workbook.js')).text();
      return { ellipses: (svg.match(/<ellipse/g) || []).length, circlePath: /A40 40 0 0 1 80 98 A40 40 0 0 1 80 18/.test(wb) }; });
    assert.deepEqual(art, { ellipses: 0, circlePath: true });
    assert.deepEqual(errors, []);
    console.log('PASS trace and find: both steps shown and said, true circles, the last find finishes the card (circles and squares)');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
