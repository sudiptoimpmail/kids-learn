const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args:['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport:{width:390,height:844}, hasTouch:true });
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.locator('#startBtn').click();
    const prepare = async (grade,cat,random=0.1) => page.evaluate(({grade,cat,random})=>{
      state.voice=false;state.grade=grade;renderHome();
      const original=Math.random;Math.random=()=>random;
      let q;
      try {q=IllustratedActivities.make(grade,cat,2);}finally{Math.random=original;}
      if(!q)throw Error('Illustrated question not available: '+cat);
      q.cat=CATEGORIES.find(x=>x.id===cat);q.level=2;
      R={cat:q.cat,qs:[q],i:0,firstTry:0,mistakes:0,streak:0,best:0,browse:true};
      show('play');renderQ();
      return {mode:q.illustrated?.mode||'sentence',key:q.key};
    },{grade,cat,random});
    await page.evaluate(()=>{state.grade='k';renderHome();});
    assert.equal(await page.locator('#workbookLaunch').count(),0,'No separate workbook tile');
    assert.equal(await page.locator('#workbook').count(),0,'No separate workbook screen');
    assert.equal(await page.locator('[data-cat="phonics"]').count(),1,'Phonics remains in original section');
    assert.equal((await prepare('k','phonics',0.1)).mode,'letters');
    assert.equal(await page.locator('.ia-stone').count(),25);
    await page.screenshot({path:'tests/out/illustrated-k-letter-maze.png',fullPage:true});
    await page.locator('.ia-stone').nth(0).click();
    await page.locator('.ia-stone').nth(1).click();
    // Side branch with a valid Z is legal; backtracking is supported.
    await page.locator('.ia-stone').nth(6).click();
    await page.locator('.ia-stone').nth(1).click();
    for(const k of [2,7,12,11,10,15,20,21,22,23,24]) await page.locator('.ia-stone').nth(k).click();
    assert.equal(await page.evaluate(()=>R.qs[0].ok),true,'Zebra maze should complete');
    assert.equal((await prepare('k','phonics',0.9)).mode,'sounds');
    await page.screenshot({path:'tests/out/illustrated-k-sound-garden.png',fullPage:true});
    await page.locator('[data-object="bee"]').click();
    assert.equal(await page.evaluate(()=>R.mistakes),1,'Wrong picture should count');
    for(const id of ['apple','ant','acorn','airplane','arrow','axe','alligator','artist brush']) await page.locator('[data-object="'+id+'"]').click();
    assert.equal(await page.evaluate(()=>R.locked),true,'A picture hunt should complete');
    assert.equal((await prepare('k','shape2',0.1)).mode,'shapes');
    await page.screenshot({path:'tests/out/illustrated-k-shape-room.png',fullPage:true});
    assert.equal(await page.locator('[data-object="clock"]').isDisabled(),true,'Shape hunt waits until tracing');
    await page.locator('.ia-trace-assist').click();
    assert.equal(await page.evaluate(()=>R.qs[0].hintShown),true,'Tracing accommodation is treated as a hint');
    await page.locator('[data-object="door"]').click();
    for(const id of ['clock','plate','wheel','ball'])await page.locator('[data-object="'+id+'"]').click();
    assert.equal(await page.evaluate(()=>R.locked),true,'Round-picture hunt should complete');
    assert.equal((await prepare('k','shape2',0.9)).mode,'squares');
    // Simulate a continuous ordered pointer trace around the real SVG square.
    await page.locator('.ia-trace-shape').scrollIntoViewIfNeeded();
    await page.evaluate(()=>{
      const svg=document.querySelector('.ia-trace-shape'),path=svg.querySelector('.ia-trace-guide');
      const length=path.getTotalLength(),matrix=svg.getScreenCTM();
      for(let i=0;i<70;i++){
        const p=path.getPointAtLength(length*i/69).matrixTransform(matrix);
        const ev=new PointerEvent(i===0?'pointerdown':i===69?'pointerup':'pointermove',{
          bubbles:true,pointerId:7,pointerType:'pen',clientX:p.x,clientY:p.y
        });
        svg.dispatchEvent(ev);
      }
    });
    assert.equal(await page.locator('.ia-shape-locked').count(),0,'Trace should unlock the picture hunt');
    assert.equal(await page.evaluate(()=>R.qs[0].hintShown),false,'Real tracing should not use a hint');
    await page.screenshot({path:'tests/out/illustrated-k-square-room.png',fullPage:true});
    for(const id of ['window','picture frame','gift','cushion'])await page.locator('[data-object="'+id+'"]').click();
    assert.equal(await page.evaluate(()=>R.locked),true,'Square tracing and shape finding complete');
    assert.equal((await prepare('g1','phonics')).mode,'longa');
    await page.screenshot({path:'tests/out/illustrated-g1-vowel-maze.png',fullPage:true});
    for(const k of [0,1,2,7,12,11,10,15,20,21,22,23,24]) await page.locator('.ia-stone').nth(k).click();
    assert.equal(await page.evaluate(()=>R.qs[0].ok),true,'Long-A route must be solvable');
    assert.equal((await prepare('g1','match')).mode,'forest');
    await page.screenshot({path:'tests/out/illustrated-g1-forest-match.png',fullPage:true});
    const target=await page.evaluate(()=>R.qs[0].answer);
    await page.locator('[data-object="'+target+'"]').click();
    assert.equal(await page.evaluate(()=>R.locked),true,'Forest recognition completes');
    assert.equal((await prepare('g1','sent',0.1)).mode,'sentence');
    const correct=await page.evaluate(()=>R.qs[0].answer);
    await page.locator('#options .opt').filter({hasText:correct}).first().click();
    assert.equal(await page.evaluate(()=>R.locked),true,'Illustrated sentence completes');
    assert.equal((await prepare('g1','sent',0.9)).mode,'sequence');
    await page.screenshot({path:'tests/out/illustrated-g1-story-order.png',fullPage:true});
    for(let k=0;k<4;k++)await page.locator('.ia-story-card[data-step="'+k+'"]').click();
    assert.equal(await page.evaluate(()=>R.locked),true,'Four-step sequencing completes');
    // The original handwriting category retains its engine, with illustrated scenes behind paths.
    await page.evaluate(()=>{TR.set='lines';TR.i=1;openTrace();});
    assert.equal(await page.locator('#trPad .ia-trace-scene').count(),1,'Illustration behind existing tracing canvas');
    await page.evaluate(()=>{state.grade='g1';TR.set='words';TR.i=0;renderTrace(false);});
    assert.equal(await page.locator('#trace .tr-tab[data-set="words"]').isVisible(),true);
    assert.equal(await page.locator('#trPic .tr-word').innerText(),'fish');
    assert.equal(await page.locator('#trPad .ia-trace-scene').count(),1);
    assert.deepEqual(errors,[],errors.join('\n'));
    console.log('PASS integrated illustrated K/G1 activities and paths');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
