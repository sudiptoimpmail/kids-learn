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
    const result = await page.evaluate(() => {
      state.voice = false; state.grade = 'k';
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
      state.gameLv.draw = 2;
      openGame('draw');
      const area=document.querySelector('#gameArea');
      check(area.querySelectorAll('.dr-size').length===4, 'Four pencil/brush sizes missing');
      check(area.querySelectorAll('.dr-ink').length===10, 'Drawing palette changed unexpectedly');
      const cv=area.querySelector('.dr-cv');
      area.querySelector('[data-dz="in"]').click();
      check(cv.style.transform.includes('scale(1.35)'), 'Draw zoom button failed');
      area.querySelector('[data-dz="reset"]').click();
      check(cv.style.transform.includes('scale(1)'), 'Draw zoom reset failed');
      state.gameLv.puzzle=3;
      openGame('puzzle');
      startPuzzle(ALL_PICS[0]);
      const tiles=area.querySelectorAll('.jigsaw-piece');
      check(tiles.length===9, 'Grade-appropriate jigsaw count missing');
      tiles[0].click();tiles[0].click();
      check(!!area.querySelector('.jigsaw-art'), 'Puzzle rotation artwork missing');
      return failures.slice(0,20);
    });
    assert.deepEqual(result,[],result.join('\n'));
    assert.deepEqual(errors,[],errors.join('\n'));
    const pin=fs.readFileSync('pinball3d.js','utf8');
    assert.ok(!pin.includes('data-a="skin"'), 'Manual pinball table change must be removed');
    assert.ok(pin.includes('Math.floor(Math.random() * 3)'), 'Pinball should choose one of three tables');
    const whack=fs.readFileSync('games.js','utf8');
    assert.ok(whack.includes('speedAt()'), 'Whack-a-mole speed must increase');
    assert.ok(whack.includes('wm-final-score'), 'Whack-a-mole score must center on result screen');
    console.log('PASS iPad game controls, QA unlock, recorded curriculum, rotating puzzles and drawing zoom');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
