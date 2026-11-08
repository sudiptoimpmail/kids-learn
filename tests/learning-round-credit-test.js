const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome'});
 try {
  const page=await browser.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(!localStorage.getItem('learnplay.v1'))localStorage.setItem('learnplay.v1',JSON.stringify({name:'Ava',grade:'prek',voice:false,roundsPerPlay:2}));});
  const ready=async()=>{await page.waitForFunction(()=>!!window.KidsLearnReady);await page.evaluate(()=>window.KidsLearnReady);};
  await page.goto('http://localhost:8765');await ready();
  await page.evaluate(()=>$('#startBtn').click());
  for(const [grade,n] of [['prek',5],['k',5],['g1',8],['g2',10],['g3',10]]){
   const actual=await page.evaluate(g=>{state.grade=g;state.recent={};state.recentContent={};startRound('add');return R.qs.length;},grade);
   assert.equal(actual,n,grade+' configured length');
  }
  await page.evaluate(()=>{state.grade='prek';state.recent={};state.recentContent={};startRound('add');const q=R.qs[0];choose(q,q.answer,document.createElement('button'));creditLearningQuestion(q);$('#quitBtn').click();});
  assert.equal(await page.evaluate(()=>state.learningPlayCredit),24,'one of five cards earns one fifth, once');
  assert.match(await page.evaluate(()=>playStatus().text),/Progress saved/);
  await page.reload();await ready();
  assert.equal(await page.evaluate(()=>state.learningPlayCredit),24,'credit survives quitting during feedback and reloading');
  await page.evaluate(()=>{const old=Store.root.active;Store.addKid({name:'Bo',grade:'k'},state);window.firstChild=old;});
  assert.equal(await page.evaluate(()=>state.learningPlayCredit||0),0,'credit belongs to one child');
  await page.evaluate(()=>Store.switchTo(window.firstChild,state));
  assert.equal(await page.evaluate(()=>state.learningPlayCredit),24);
  // Four completed cards from another interrupted round complete the first credit.
  await page.evaluate(()=>{state.recent={};state.recentContent={};startRound('add');for(let i=0;i<4;i++){const q=R.qs[R.i];choose(q,q.answer,document.createElement('button'));next();}$('#quitBtn').click();});
  assert.equal(await page.evaluate(()=>state.roundsSincePlay),1);
  assert.equal(await page.evaluate(()=>state.learningPlayCredit),0);
  assert.equal(await page.evaluate(()=>state.playPasses||0),0);
  // A full second round earns exactly one pass, with no extra award at finish.
  await page.evaluate(()=>{state.recent={};state.recentContent={};startRound('add');while(R.i<R.qs.length){const q=R.qs[R.i];choose(q,q.answer,document.createElement('button'));next();}});
  assert.equal(await page.evaluate(()=>state.playRemainingMs),180000);
  assert.equal(await page.evaluate(()=>state.playPasses||0),0);
  assert.equal(await page.evaluate(()=>state.roundsSincePlay),0);
  assert.equal(await page.locator('#result').isVisible(),true);
  assert.equal(await page.locator('#playEarned').isVisible(),true);
  await page.evaluate(()=>{startRound('add',3,true);R.qs[0].ok=true;creditLearningQuestion(R.qs[0]);});
  assert.equal(await page.evaluate(()=>R.qs.length),3,'explicit preview count remains supported');
  assert.equal(await page.evaluate(()=>state.learningPlayCredit),0,'preview earns no credit');
  await page.evaluate(()=>{startRound('add',7);R.qs.forEach(q=>{q.ok=false;creditLearningQuestion(q);creditLearningQuestion(q);});});
  assert.equal(await page.evaluate(()=>state.roundsSincePlay),1,'non-divisible lengths total exactly one round even after corrections');
  assert.equal(await page.evaluate(()=>state.learningPlayCredit),0);
  assert.deepEqual(errors,[]);console.log('PASS grade-configured rounds, interrupted credit, reload, profile isolation, duplicate protection and exact full-round rewards');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
