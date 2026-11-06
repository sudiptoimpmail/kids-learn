'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  for(const width of [320,390,820,1180]){
   const page=await browser.newPage({viewport:{width,height:780}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://localhost:8765/index.html');
   await page.locator('#startBtn').click();
   await page.evaluate(()=>clipsReady);
   const result=await page.evaluate(()=>{
    const failures=[];
    for(const id of ['liberty','eiffel']){
      const main=document.createElement('div');main.innerHTML=landmarkArt(id);
      if(main.querySelectorAll('.lm-online-preview').length!==1)failures.push('Missing main preview '+id);
      const option=document.createElement('button');option.innerHTML=landmarkArt(id,'small');
      if(option.querySelector('.lm-online-preview'))failures.push('Nested preview button in answer '+id);
      if(option.querySelectorAll('button').length)failures.push('Nested interactive button '+id);
      if(!option.querySelector('img.lm-art'))failures.push('Missing local illustration '+id);
    }
    for(const id of ['tajmahal','cntower','fuji']){
      const main=document.createElement('div');main.innerHTML=landmarkArt(id);
      if(main.querySelector('.lm-online-preview'))failures.push('Unverified preview enabled '+id);
    }
    return failures;
   });
   assert.deepEqual(result,[],width+': '+result.join('; '));
   assert.deepEqual(errors,[],width+': '+errors.join('; '));
   await page.close();
  }
  console.log('PASS landmark photo previews stay out of quiz answer buttons at 4 viewports');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
