const assert=require('node:assert/strict');
const fs=require('node:fs');
const { chromium }=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:8765/index.html');await page.locator('#startBtn').click();
  const result=await page.evaluate(()=>{
   const fails=[],check=(p,m)=>{if(!p)fails.push(m)};
   check(document.querySelector('#hintBox').parentElement.id==='play','Hint should be outside question card');
   check(document.querySelector('#options').nextElementSibling.id==='hintBox','Hint should be beneath answers');
   state.showAll=false;state.testMode=false;state.voice=false;state.grade='prek';
   state.levels.add=5;state.levels.gk=4;state.levels.phonics=5;
   for(const id of ['add','gk','phonics','cmp']){
     startRound(id,12);
     for(const q of R.qs){
       check(q.grades.includes('prek'), 'PreK saw non-PreK question: '+q.key);
       check(q.level<=(gradeRange('prek',id)||[1,1])[1], 'PreK saw above-grade level: '+q.key);
     }
   }
   state.grade='g1';state.levels.add=5;state.levels.gk=4;startRound('gk',12);
   for(const q of R.qs)check(q.grades.includes('g1'),'Grade1 question lacks grade marking');
   state.grade='prek';renderHome();
   check(visibleGames().some(c=>c.id==='cmp'),'Grade-eligible Compare should be discoverable');
   check(!!document.querySelector('#grid [data-cat="cmp"]'),'Compare needs a home tile');
   // Comparison is still usable in math and in the QA browser.
   check(typeof genCompare==='function','Compare generator must be preserved');
   state.grade='g1';startRound('add',40);
   check(R.qs.every(q=>q.grades.includes('g1')),'Math includes wrong-grade question');
   return fails.slice(0,30);
  });
  assert.deepEqual(result,[],result.join('\n'));
  assert.deepEqual(errors,[],errors.join('\n'));
  const pin=fs.readFileSync('pinball3d.js','utf8');
  assert.ok(!pin.includes('data-f="L"')&&!pin.includes('data-f="R"'),'Separate left/right buttons remain');
  assert.ok(pin.includes('pb-plunger-handle')&&pin.includes('pointermove'),'Plunger drag input missing');
  assert.ok(pin.includes("base: ['#651d58', '#391341']"),'Candy pink contrast not fixed');
  console.log('PASS grade-locked question tagging, math compare, hints, touch flippers and pull plunger');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
