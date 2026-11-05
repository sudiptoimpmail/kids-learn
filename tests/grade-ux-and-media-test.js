const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    for (const width of [320, 360, 390, 768]) {
      const page=await browser.newPage({viewport:{width,height:680},deviceScaleFactor:1});
      await page.goto('http://localhost:8765/index.html');
      await page.evaluate(()=>window.KidsLearnReady);
      const measurements=await page.evaluate(()=>{
        const words=ContentData.get('content','SYL').map(r=>r[0]);
        const sample=['caterpillar','television','helicopter','watermelon',...words];
        const root=document.createElement('section');
        root.style.width='calc(100vw - 32px)';
        root.style.margin='16px auto';root.className='card';
        root.innerHTML='<div class="q-main syl-main"></div><div class="options syl-choices"></div>';
        document.body.appendChild(root);
        const main=root.querySelector('.q-main'),opt=root.querySelector('.options');
        let largestOverhang=0;
        for(const word of sample){
          const q=genSyllable(2);
          main.innerHTML='<div class="word syl-word" style="--syl-font:'+Math.min(18,140/word.length).toFixed(2)+'vw">'+word+'</div>';
          opt.innerHTML=q.options.map(o=>'<button class="opt">'+o.html+'</button>').join('');
          const el=main.querySelector('.syl-word');
          largestOverhang=Math.max(largestOverhang,el.scrollWidth-el.clientWidth,root.scrollWidth-root.clientWidth,Math.max(0,opt.scrollWidth-opt.clientWidth));
        }
        root.remove();
        return {largestOverhang,body:document.body.scrollWidth,viewport:window.innerWidth};
      });
      assert.ok(measurements.largestOverhang<=1,`Clap It overflows at ${width}px: ${JSON.stringify(measurements)}`);
      assert.ok(measurements.body<=width+1,`Document overflows at ${width}px`);
      await page.close();
    }
    // Tap zones must remain data-val interactive controls, artwork is a separate offline file.
    const page=await browser.newPage();
    await page.goto('http://localhost:8765/index.html');
    await page.evaluate(()=>window.KidsLearnReady);
    const body=await page.evaluate(()=>bodySVG('nose'));
    assert.ok(body.includes('assets/body/child-front.webp'));
    assert.ok(body.includes('data-val="nose"'));
    assert.ok(!body.includes('<path'), 'Legacy art should not live in question-generation code');
    const prompt=await page.evaluate(()=>genSight(2));
    assert.ok(prompt, 'Sight-word generator should remain functional');
    console.log('PASS responsive Clap It, external child art and lesson generator smoke checks');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
