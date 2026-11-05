const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.locator('#startBtn').click();
    const first = await page.evaluate(async()=>{
      state.voice=false; state.grade='prek';state.playAlways=true;state.gameLv={};save();
      const asset=await fetch('assets/prek-atlas.svg');
      const svg=await asset.text();
      if(!asset.ok || !svg.includes('data:image/webp;base64,'))throw Error('Generated photo atlas not available offline');
      if(traceItems('num').length!==10)throw Error('Pre-K number tracing not limited to 1–10');
      const photo=genPrekPhoto();
      if(photo.options.length!==4 || !photo.options.every(o=>o.html.includes('pk-photo')))throw Error('Pre-K photo choices missing');
      if(!Array.isArray(photo.say)||photo.say.length<2)throw Error('Pre-K voice question missing');
      const reading=learningPicture('dog','🐶');
      if(!reading.includes('read-photo'))throw Error('Real picture not shown in reading');
      state.grade='g1';
      if(traceItems('num').length!==20)throw Error('Number tracing should extend to 20 for Grade 1');
      const sequences=Array.from({length:50},()=>genSequence(3));
      if(!sequences.some(q=>(q.main.match(/think-pattern/g)||[]).length>0&&
          (q.main.match(/<span/g)||[]).length>=7))throw Error('Grade 1 sequence lacks four-step reasoning');
      openGame('puzzle');startPuzzle(PHOTO_PUZZLES[0]);
      if(document.querySelectorAll('.pzl-piece').length!==4)throw Error('Jigsaw piece count is not age appropriate');
      const firstPiece=document.querySelector('.pzl-piece'); firstPiece.click();firstPiece.click();
      if(!window.__jigsaw.rotations().some(Boolean))throw Error('Jigsaw did not rotate');
      return {atlasSize:svg.length,pieceCount:document.querySelectorAll('.pzl-piece').length};
    });
    await page.evaluate(()=>openGame('draw'));
    await page.locator('.dr-layer').waitFor();
    assert.equal(await page.locator('.dr-pencils button').count(),4,'Four pencil/brush sizes');
    assert.equal(await page.locator('.dr-colors .dr-ink').count(),10,'Compact existing palette retained');
    const before=await page.locator('.dr-layer').getAttribute('style')||'';
    await page.locator('[data-t="in"]').click();
    const after=await page.locator('.dr-layer').getAttribute('style')||'';
    assert.notEqual(before,after,'Zoom in should change drawing canvas transform');
    await page.locator('[data-t="reset"]').click();
    assert.match(await page.locator('.dr-layer').getAttribute('style'),/scale\\(1\\)/);
    await page.evaluate(()=>openGame('whack'));
    assert.equal(await page.locator('.wm-hole').count(),9);
    assert.equal(await page.locator('.wm-time').isVisible(),true);
    await page.evaluate(()=>{openSettings();document.querySelector('#qaUnlock').hidden=false;document.querySelector('#qaUnlock').click();});
    assert.equal(await page.evaluate(()=>isTestMode()),true,'QA unlocked from settings without URL');
    await page.evaluate(()=>startRound('gk',3));
    assert.equal(await page.locator('#skipBtn').isVisible(),true);
    const old=await page.evaluate(()=>R.i);
    await page.locator('#skipBtn').click();
    assert.equal(await page.evaluate(()=>R.i),old+1,'QA next question without answering');
    assert.deepEqual(errors,[],'Unexpected browser errors');
    console.log('PASS iPad controls, photo atlas, jigsaw, drawing zoom, whack and QA',first);
  } finally { await browser.close(); }
})().catch(e=>{ console.error(e); process.exitCode=1; });
