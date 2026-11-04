const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args:['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport:{width:390,height:844}, hasTouch:true });
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.locator('#startBtn').click();
    await page.evaluate(()=>{state.voice=false;state.grade='k';renderHome();});
    assert.equal(await page.locator('#workbookLaunch').count(),1);
    await page.locator('#workbookLaunch').click();
    assert.equal(await page.locator('.wb-activity').count(),4);
    await page.locator('[data-page="letters"]').click();
    for(const index of [0,1,2,7,12,11,10,15,20,21,22,23,24]) await page.locator('.wb-maze-cell').nth(index).click();
    assert.match(await page.locator('#workbookStatus').innerText(),/brought the zebra home/i);
    await page.locator('#wbMenu').click();
    await page.locator('[data-page="sounds"]').click();
    for(const name of ['apple','ant','acorn','airplane']) await page.locator('[data-object="'+name+'"]').click();
    assert.match(await page.locator('#workbookStatus').innerText(),/every A picture/i);
    await page.locator('#wbMenu').click();
    await page.locator('[data-page="shapes"]').click();
    assert.equal(await page.locator('#wbShapeObjects').isVisible(),false);
    await page.locator('#wbMenu').click();
    await page.locator('#workbookBack').click();
    await page.evaluate(()=>{state.grade='g1';renderHome();});
    await page.locator('#workbookLaunch').click();
    assert.equal(await page.locator('.wb-activity').count(),4);
    await page.locator('[data-page="bank"]').click();
    for(const [word,index] of [['dog',0],['cat',1],['fish',2],['snake',3],['ant',4]]) {
      await page.locator('[data-word="'+word+'"]').click();
      await page.locator('[data-blank="'+index+'"]').click();
    }
    assert.match(await page.locator('#workbookStatus').innerText(),/five sentences are correct/i);
    await page.locator('#wbMenu').click();
    await page.locator('[data-page="phonics"]').click();
    for(const index of [0,1,6,11,12,13,18,23,22,21,20]) await page.locator('.wb-maze-cell').nth(index).click();
    assert.match(await page.locator('#workbookStatus').innerText(),/solved the long A maze/i);
    await page.locator('#wbMenu').click();
    await page.locator('[data-page="sequence"]').click();
    for(let index=0;index<5;index++) await page.locator('[data-step="'+index+'"]').click();
    assert.match(await page.locator('#workbookStatus').innerText(),/right order/i);
    await page.locator('#wbMenu').click();
    await page.locator('[data-page="vocab"]').click();
    for(const name of ['leaf','bird','wolf','water']) await page.locator('[data-object="'+name+'"]').click();
    assert.match(await page.locator('#workbookStatus').innerText(),/every forest word/i);
    assert.deepEqual(errors,[],errors.join('\n'));
    console.log('PASS interactive workbook K/G1');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
