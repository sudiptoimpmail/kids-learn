// Draw the Story: a new story told with no pictures for each grade, one scene to draw on a blank page with hints,
// then the child taps the story details she drew. Younger grades: short stories, hints shown at once; older grades:
// longer stories, hints on request, and a question to talk about. Every spoken line has a recording.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 }, hasTouch: true }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    // ---- content: every grade has stories, they grow with the grade, and every line can be read aloud
    const shape = await p.evaluate(() => { const out = {}; for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) { const ss = DRAW_STORIES[g] || [];
      const words = ss.map((s) => s.text.join(' ').split(/\s+/).length), lines = [];
      for (const s of ss) { lines.push(s.title, ...s.text); for (const c of s.scenes) { lines.push(c.ask, ...c.hints, ...c.check.map((x) => x.label)); if (c.talk) lines.push(c.talk); } }
      const unsaid = lines.filter((l) => !splitSentences(l).every((x) => CoreVoice.canSay(x)));
      out[g] = { n: ss.length, avgWords: Math.round(words.reduce((a, x) => a + x, 0) / ss.length), scenes: ss.every((s) => s.scenes.length >= 1 && s.scenes.every((c) => c.hints.length >= 2 && c.check.length >= 2)), talk: ss.some((s) => s.scenes.some((c) => c.talk)), unsaid: unsaid.slice(0, 3), ids: new Set(ss.map((s) => s.id)).size === ss.length }; }
      return out; });
    for (const g of Object.keys(shape)) assert.ok(shape[g].n >= 4 && shape[g].scenes && shape[g].ids && !shape[g].unsaid.length, `${g}: ${JSON.stringify(shape[g])}`);
    assert.ok(shape.prek.avgWords < shape.k.avgWords && shape.k.avgWords < shape.g1.avgWords && shape.g1.avgWords < shape.g3.avgWords, 'stories get longer with the grade: ' + JSON.stringify(Object.fromEntries(Object.entries(shape).map(([g, x]) => [g, x.avgWords]))));
    assert.ok(shape.prek.avgWords <= 25 && !shape.prek.talk && shape.g2.talk && shape.g3.talk, 'Pre-K stories are short; 2nd and 3rd grade get questions to talk about');
    // ---- the shelf card, then the story read aloud with no pictures
    const run = async (grade) => {
      await p.evaluate((g) => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = g; state.voice = true; state.stars = 0; state.storyDrawn = {}; state.drawings = []; state.playAlways = false; state.playMinutes = 0; openLibrary(); }, grade);
      await p.waitForSelector('#libBody .lib-draw'); await p.click('#libBody .lib-draw');
      await p.waitForSelector('#libBody .ds-story');
      const story = await p.evaluate(() => ({ id: DS.story.id, lines: document.querySelectorAll('#libBody .ds-text p').length, imgs: document.querySelectorAll('#libBody .ds-story .lib-art').length, grade: DRAW_STORIES[state.grade].some((s) => s.id === DS.story.id) }));
      assert.ok(story.lines >= 3 && story.imgs === 0 && story.grade, `${grade}: a story for this grade, told without pictures ${JSON.stringify(story)}`);
      await p.click('#libBody [data-a="draw"]'); await p.waitForSelector('#libBody .ds-scene');
      const scene = await p.evaluate(() => ({ hints: document.querySelectorAll('#libBody .ds-hints li').length, clues: document.querySelectorAll('#libBody .ds-scene .ds-clue').length, hintBtn: !!document.querySelector('#libBody [data-a="hint"]'), all: DS.story.scenes[DS.scene].hints.length }));
      if (grade === 'prek') assert.deepEqual([scene.hints === scene.all, scene.clues > 0, scene.hintBtn], [true, true, false], 'Pre-K sees hints and picture clues at once');
      else { assert.deepEqual([scene.hints, scene.clues, scene.hintBtn], [0, 0, true], 'older children ask for hints');
        await p.click('#libBody [data-a="hint"]'); assert.equal(await p.evaluate(() => document.querySelectorAll('#libBody .ds-hints li').length), 1, 'one hint at a time'); }
      // ---- the blank page: no picture to copy, the question on top, Back returns to the scene
      await p.click('#libBody [data-a="start"]'); await p.waitForSelector('#game.active .dr-pad');
      const pad = await p.evaluate(() => ({ guide: !!document.querySelector('#gameArea .dr-guide'), ask: document.querySelector('#gameArea .sd-ask span').textContent, want: DS.story.scenes[DS.scene].ask, share: (() => { const r = document.querySelector('.dr-pad').getBoundingClientRect(); return r.width * r.height / (innerWidth * innerHeight); })() }));
      assert.deepEqual([pad.guide, pad.ask, pad.share > 0.75], [false, pad.want, true], `${grade}: a blank, big page with the question`);
      await p.click('#gameArea [data-a="done"]'); assert.equal(await p.evaluate(() => document.querySelector('#game.active') !== null), true, 'an empty page is not finished');
      await p.click('#gameArea [data-a="hint"]'); assert.ok(await p.evaluate(() => !!document.querySelector('.sd-ask small')), 'a hint appears on the page');
      await p.click('#gameBack'); await p.waitForSelector('#library.active #libBody .ds-scene');
      await p.click('#libBody [data-a="start"]'); await p.waitForSelector('#game.active .dr-pad');
      const r = await p.locator('.dr-pad').boundingBox();
      await p.mouse.move(r.x + r.width * 0.3, r.y + r.height * 0.4); await p.mouse.down(); await p.mouse.move(r.x + r.width * 0.6, r.y + r.height * 0.6, { steps: 8 }); await p.mouse.up();
      await p.click('#gameArea [data-a="done"]'); await p.waitForSelector('#library.active #libBody .ds-check');
      // ---- tap the details she drew, then finish
      const check = await p.evaluate(() => ({ img: (document.querySelector('#libBody .ds-mine') || {}).src || '', n: document.querySelectorAll('#libBody .ds-pick .ds-clue').length, saved: state.drawings[0] && state.drawings[0].name, title: DS.story.title }));
      assert.ok(check.img.startsWith('data:image/jpeg') && check.n >= 2 && check.saved === check.title, `${grade}: her drawing is shown and kept in My drawings`);
      await p.click('#libBody .ds-pick .ds-clue >> nth=0'); await p.click('#libBody .ds-pick .ds-clue >> nth=1');
      await p.click('#libBody [data-a="finish"]'); await p.waitForSelector('#libBody .ds-done');
      const done = await p.evaluate(() => ({ stars: state.stars, drawn: state.storyDrawn[DS.story.id], talk: document.querySelector('#libBody .ds-talk').textContent, again: !!document.querySelector('#libBody [data-a="story"]') }));
      assert.deepEqual([done.stars, done.drawn, done.again, done.talk.length > 10], [3, 1, true, true], `${grade}: stars, counted, and something to talk about`);
      // the next story is a different one
      await p.click('#libBody [data-a="story"]'); await p.waitForSelector('#libBody .ds-story');
      assert.notEqual(await p.evaluate(() => DS.story.id), story.id, 'Another story brings a new one');
    };
    for (const g of ['prek', 'g3']) await run(g);
    assert.equal(await p.evaluate(() => { openLibrary(); return new Promise((r) => setTimeout(() => r(document.querySelectorAll('#libBody .lib-draw').length), 400)); }), 1);
    assert.deepEqual(errors, []);
    console.log('PASS Draw the Story: grade stories without pictures, a blank page with hints, details to tap, talk questions for older grades', JSON.stringify(Object.fromEntries(Object.entries(shape).map(([g, x]) => [g, x.n + ' stories, ~' + x.avgWords + ' words']))));
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
