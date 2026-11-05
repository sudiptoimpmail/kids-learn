const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.locator('#startBtn').click();
    await page.evaluate(()=>{
      state.testMode=true;state.voice=false;state.grade='k';applyTheme();renderHome();
      startRound('phonics',4);
    });
    assert.equal(await page.locator('#skipBtn').isVisible(),true,'Next button available in QA');
    assert.match(await page.locator('#skipBtn').innerText(),/next/i);
    assert.equal(await page.locator('#qaPosition').innerText(),'1 / 4');
    const before=await page.evaluate(()=>({stars:state.stars,first:R.firstTry,attempts:JSON.stringify(state.stats||{}),qOk:R.qs[0].ok}));
    await page.locator('#skipBtn').click();
    assert.equal(await page.evaluate(()=>R.i),1,'Next moves without answering');
    assert.equal(await page.locator('#qaPosition').innerText(),'2 / 4');
    const after=await page.evaluate(()=>({stars:state.stars,first:R.firstTry,attempts:JSON.stringify(state.stats||{}),qOk:R.qs[0].ok}));
    assert.deepEqual(after,before,'QA Next cannot grant progress or credit');
    await page.locator('#prevBtn').click();
    assert.equal(await page.evaluate(()=>R.i),0,'Previous works only in QA');
    assert.equal(await page.locator('#prevBtn').isDisabled(),true,'Previous disabled on first card');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>R.i),1,'Keyboard forward navigation');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(()=>R.i),0,'Keyboard back navigation');
    await page.locator('#endBtn').click();
    assert.equal(await page.locator('#home').isVisible(),true,'End preview without forced answers');
    assert.equal(await page.evaluate(()=>state.stars),before.stars);
    // The QA question browser must be able to show illustrated variants too.
    const illustrates=await page.evaluate(()=>{
      state.grade='k';state.testMode=true;applyTheme();startRound('shape2',12,true,2);
      return R.qs.filter(q=>q.illustrated).map(q=>q.illustrated.mode);
    });
    assert.ok(illustrates.length,'QA previews must include illustrated activities');
    assert.ok(illustrates.every(x=>x==='shapes'||x==='squares'),'Illustration stays in Shapes category');
    await page.locator('#endBtn').click();
    await page.evaluate(()=>{state.testMode=false;applyTheme();renderHome();startRound('phonics',2);});
    assert.equal(await page.locator('#skipBtn').isVisible(),false,'Next hidden for child profile');
    const index=await page.evaluate(()=>R.i);
    await page.locator('#skipBtn').evaluate(el=>el.click());
    assert.equal(await page.evaluate(()=>R.i),index,'Hidden QA button cannot bypass child round');
    assert.deepEqual(errors,[],errors.join('\n'));
    console.log('PASS QA next/previous/end, keyboard controls, illustrated preview and no scoring');
  } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});