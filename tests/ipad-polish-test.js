const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args:['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport:{width:820,height:1180}, hasTouch:true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.locator('#startBtn').click();
    await page.evaluate(() => clipsReady);
    const result = await page.evaluate(() => {
      state.voice = false; state.grade = 'k'; state.playRemainingMs = 180000;
      state.gameLv = state.gameLv || {};
      const failures = [];
      const check = (ok, why) => { if(!ok) failures.push(why); };
      // The QA unlock is available even inside a saved home-screen web app.
      localStorage.removeItem(QA_KEY);
      openSettings();
      const title = document.querySelector('#settingsTitle');
      for(let i=0;i<5;i++) title.click();
      check(localStorage.getItem(QA_KEY)==='1', 'Five-tap QA unlock missing');
      check(!document.querySelector('#testSection').hidden, 'QA switch not visible after unlock');
      state.testMode = false;
      // Number tracing already exists for the youngest children.
      check(traceItems('num').length===20, 'Number tracing 1-20 missing');
      // Every photograph ships locally, and picture questions offer only real photos from the same group.
      check(PHOTO_NAMES.length === 16, 'Photographic vocabulary has fewer than sixteen subjects');
      let photographed = 0;
      for (let i = 0; i < 180; i++) {
        const q = genGK(1);
        if (q.text.startsWith('Which picture shows') && PHOTO_SET.has(q.answer)) {
          photographed++;
          check(q.options.length >= 3, 'Photo recognition requires multiple photo answers');
          check(q.options.every(o => o.html.includes('<img') && PHOTO_SET.has(o.v)), 'Photo question has non-photographic answer');
          check(q.options.filter(o => o.v === q.answer).length === 1, 'Photo quiz answer missing');
          check(new Set(q.options.map(o => o.v)).size === q.options.length, 'Photo quiz choices duplicated');
        }
      }
      check(photographed >= 10, 'PreK photo recognition questions are not generated');
      let illustrated = false;
      for (let i = 0; i < 120; i++) {
        const q = genSentence(2);
        if (q.main.includes('reading-photo')) { illustrated = true; break; }
      }
      check(illustrated, 'Photographs absent from reading comprehension questions');
      // New age-graded questions must never ask for unrecorded audio.
      for(let lv=1;lv<=4;lv++) for(let i=0;i<150;i++){
        const q=genGK(lv);
        for(const p of (Array.isArray(q.say)?q.say:[q.say]))
          check(!!CLIPS[clipKey(p)], 'Missing GK audio: '+p);
      }
      for(let i=0;i<150;i++){
        const q=genPattern(4);
        check(q.options.filter(o=>String(o.v)===String(q.answer)).length===1, 'Pattern answer missing');
        for(const p of (Array.isArray(q.say)?q.say:[q.say]))
          check(!!CLIPS[clipKey(p)], 'Missing pattern audio: '+p);
        for(const p of (Array.isArray(q.hint.say)?q.hint.say:[q.hint.say]))
          check(!!CLIPS[clipKey(p)], 'Missing pattern hint audio: '+p);
      }
      // Dynamic middle-vowel hints must be assembled from recorded clips.
      let middleVowelCases = 0;
      for (let i = 0; i < 400; i++) {
        const card = genPhonics(4);
        if (!card.key.startsWith('ph-mid-')) continue;
        middleVowelCases++;
        for (const phrase of card.hint.say)
          check(!!CLIPS[clipKey(phrase)], 'Unrecorded middle-vowel hint: ' + phrase);
      }
      check(middleVowelCases > 5, 'Could not exercise middle-vowel phonics audio');
      state.gameLv.draw = 2;
      openGame('draw'); document.querySelector('#gameArea [data-a="surprise"]')?.click();
      const area=document.querySelector('#gameArea');
      check(area.querySelectorAll('.dr-size').length===4, 'Four pencil/brush sizes missing');
      check(area.querySelectorAll('.dr-ink').length===10, 'Drawing palette changed unexpectedly');
      state.gameLv.puzzle=3;
      openGame('puzzle');
      startPuzzle(ALL_PICS[0]);
      const tiles=area.querySelectorAll('.jigsaw-piece');
      check(tiles.length===puzzleSize()**2, 'Grade-appropriate jigsaw count missing');
      const beforeAngle = tiles[0].querySelector('.jigsaw-art').style.transform;
      tiles[0].click(); area.querySelector('.jigsaw-piece').click();
      check(!!area.querySelector('.jigsaw-art'), 'Puzzle rotation artwork missing');
      check(area.querySelector('.jigsaw-piece .jigsaw-art').style.transform !== beforeAngle,
        'Tap-twice should rotate a selected piece by 90 degrees');
      check(area.querySelectorAll('.jigsaw-outline').length === puzzleSize()**2,
        'Every puzzle piece must have a real interlocking silhouette');
      startPuzzle(PHOTO_PUZZLE[0]);
      check(area.querySelectorAll('.jigsaw-svg image').length===puzzleSize()**2, 'Photographic jigsaw pieces missing image fragments');
      check(area.querySelectorAll('.jigsaw-outline').length===puzzleSize()**2, 'Real puzzle silhouettes are missing');
      check([...area.querySelectorAll('.jigsaw-outline')].some(el => /C/.test(el.getAttribute('d'))), 'Interlocking puzzle curves are missing');
      check(!!area.querySelector('.pz-photo-peek'), 'Photo preview is missing from puzzle');

      return failures.slice(0,20);
    });
    assert.deepEqual(result,[],result.join('\n'));
    assert.deepEqual(errors,[],errors.join('\n'));
    // Landscape iPad: drawing controls must be reachable; the canvas should shrink
    // instead of permanently losing the bottom toolbar behind the home indicator.
    await page.setViewportSize({width:1180,height:820});
    const landscape = await page.evaluate(() => {
      state.gameLv.draw = 2;
      openGame('draw'); document.querySelector('#gameArea [data-a="surprise"]')?.click();
      const pad = document.querySelector('.dr-pad').getBoundingClientRect();
      const done = document.querySelector('.g-draw [data-a="done"]');
      done.scrollIntoView({block:'end'});
      return {padWidth:pad.width,doneBottom:done.getBoundingClientRect().bottom,
        viewport:innerHeight,documentHeight:document.documentElement.scrollHeight};
    });
    assert.ok(landscape.padWidth > 90 && landscape.padWidth <= 520,
      'Landscape iPad canvas should be compact: ' + JSON.stringify(landscape));
    assert.ok(landscape.doneBottom <= landscape.viewport + 4,
      'Landscape iPad toolbar not reachable: ' + JSON.stringify(landscape));
    for(const name of ['cat','dog','rabbit','duck','elephant','tiger','butterfly','horse','sunflower','rose','tulip','daisy','car','airplane','helicopter','truck']) {
      const path = 'assets/photos/' + name + '.jpg';
      assert.ok(fs.existsSync(path) && fs.statSync(path).size > 6000, 'Missing photographed asset: ' + path);
      assert.ok(fs.readFileSync('sw.js','utf8').includes(path), 'Missing offline pre-cache: ' + path);
    }
    const pin=fs.readFileSync('pinball3d.js','utf8');
    assert.ok(!pin.includes('data-a="skin"'), 'Manual pinball table change must be removed');
    assert.ok(pin.includes('Math.floor(Math.random() * 3)'), 'Pinball should choose one of three tables');
    const whack=fs.readFileSync('games.js','utf8');
    assert.ok(whack.includes('speedAt()'), 'Whack-a-mole speed must increase');
    assert.ok(whack.includes('wm-final-score'), 'Whack-a-mole score must center on result screen');
    console.log('PASS iPad game controls, QA unlock, recorded curriculum, rotating puzzles and drawing zoom');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
