const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN || '/usr/bin/google-chrome'});
  try {
    const context = await browser.newContext({locale:'en-US',hasTouch:true});
    const page = await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.stack || e.message));
    await page.addInitScript(() => {
      if (!localStorage.getItem('learnplay.v1')) localStorage.setItem('learnplay.v1',JSON.stringify({name:'Ava',grade:'g2',voice:false,stickers:['⭐']}));
    });
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(()=>!!window.KidsLearnReady); await page.evaluate(()=>window.KidsLearnReady);
    await page.evaluate(()=>document.getElementById('startBtn').click());
    assert.equal(await page.evaluate(()=>countryCode()),'us');
    assert.equal(await page.locator('#stickerLabel').innerText(),'sticker');
    await page.evaluate(()=>openSettings());
    assert.match(await page.locator('#levels select[data-id="add"] option:checked').innerText(), /^Step \d+ of \d+$/);
    assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('#levels select')).map(s=>s.dataset.id)),await page.evaluate(()=>visibleGames().filter(c=>c.gen&&c.id!=='placement').map(c=>c.id)));
    await page.evaluate(()=>{state.playRemainingMs=180000;state.playPasses=0;state.voice=false;openPlayZone();});
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(()=>playBalance()),180000,'Play Zone menu must be free');
    await page.evaluate(()=>openGame('ttt'));
    await page.waitForTimeout(1200);
    assert.ok(await page.evaluate(()=>playBalance()<180000&&playBalance()>176000),'active play must spend time');
    await page.evaluate(()=>show('settings')); await page.waitForTimeout(1100);
    const balance=await page.evaluate(()=>playBalance());
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(()=>playBalance()),balance,'Settings must pause earned time');
    await page.reload(); await page.waitForFunction(()=>!!window.KidsLearnReady); await page.evaluate(()=>window.KidsLearnReady);
    assert.equal(await page.evaluate(()=>playBalance()),balance,'reload must preserve earned time');
    for (const [width,height] of [[390,844],[844,390],[820,1180],[1180,820]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>{state.grade='k';openTrace();});
      await page.waitForTimeout(400);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`page overflow at ${width}x${height}`);
      await page.evaluate(()=>{const s=document.getElementById('trStrip');s.scrollLeft=s.scrollWidth;});
      assert.ok(await page.evaluate(()=>{const s=document.getElementById('trStrip').getBoundingClientRect(),z=document.querySelector('#trStrip button:last-child').getBoundingClientRect();return z.right<=s.right+1&&z.left>=s.left;}),`Z inaccessible at ${width}x${height}`);
    }
    assert.deepEqual(errors,[]);
    console.log('PASS locale, sticker grammar, catalog/steps, paused persistent rewards, four device layouts and Z reachability');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
