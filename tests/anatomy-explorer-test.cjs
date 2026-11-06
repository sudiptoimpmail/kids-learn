'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  for(const width of [320,390,768,1024]){
   const page=await browser.newPage({viewport:{width,height:800},hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://localhost:8765/index.html');
   await page.locator('#startBtn').click();
   await page.evaluate(()=>clipsReady);
   const result=await page.evaluate(()=>{
    const q={key:'ana-tap-brain',text:'Tap the brain',main:organSVG(),mainClass:'body-main',tap:true,options:[],answer:'brain'};
    const holder=document.createElement('div');holder.innerHTML=q.main+organExplorer();document.body.append(holder);
    const panel=holder.querySelector('.organ-explorer');
    const buttons=[...panel.querySelectorAll('[data-organ-explore]')];
    const failures=[];
    if(buttons.length!==8)failures.push('Expected 8 organ choices');
    for(const button of buttons){
      button.click();
      const selected=buttons.filter(b=>b.getAttribute('aria-pressed')==='true');
      if(selected.length!==1||selected[0]!==button)failures.push('Selection failed '+button.dataset.organExplore);
      if(!panel.querySelector('output').textContent||panel.querySelector('output').textContent.includes('Select an organ'))failures.push('Fact missing '+button.dataset.organExplore);
      const highlighted=holder.querySelectorAll('.organ-fig .explore-hl');
      if(highlighted.length<1||[...highlighted].some(el=>el.dataset.val!==button.dataset.organExplore))failures.push('Highlight failed '+button.dataset.organExplore);
    }
    panel.querySelector('.organ-explorer-clear').click();
    if(buttons.some(b=>b.getAttribute('aria-pressed')==='true')||holder.querySelectorAll('.explore-hl').length)failures.push('Reset failed');
    if(holder.scrollWidth>innerWidth+2)failures.push('Horizontal overflow');
    holder.remove();return failures;
   });
   assert.deepEqual(result,[],width+': '+result.join('; '));
   assert.deepEqual(errors,[],width+': '+errors.join('; '));
   await page.close();
  }
  console.log('PASS organ explorer: 8 organs, live facts, selection, highlights, reset, four viewport sizes');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
