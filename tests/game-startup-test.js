const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome'});
 try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('learnplay.v1',JSON.stringify({name:'Ava',grade:'k',voice:false})));
  await page.goto('http://localhost:8765');await page.waitForFunction(()=>!!window.KidsLearnReady);await page.evaluate(()=>window.KidsLearnReady);
  await page.evaluate(()=>document.getElementById('startBtn').click());
  const balances=await page.evaluate(()=>{
   let clock=100;Object.defineProperty(performance,'now',{configurable:true,value:()=>++clock});
   const results=[];
   try {
    for(const mode of ['hourly','rounds']){
     state.playMode=mode;state.playUsed={h:hourKey(),ms:0};state.playRemainingMs=180000;
     openPlayZone();clearInterval(playTimer);
     openGame('color');clearInterval(playTimer);
     tickPlayTimer(lastTick+5000);
     results.push({mode,used:state.playUsed.ms,remaining:playBalance()});
     stopGame();show('home');
    }
   }finally{delete performance.now;}
   return results;
  });
  for(const result of balances){assert.equal(result.used,0,result.mode+' picker must never charge, including startup');assert.equal(result.remaining,180000);}
  const firstCritter=await page.evaluate(()=>{
   const random=Math.random;
   try {Math.random=()=>0.99;state.playAlways=true;openGame('whack');return !!document.querySelector('.wm-hole.up .wm-character');}
   finally{Math.random=random;}
  });
  assert.equal(firstCritter,true,'first critter must appear immediately, even when subsequent random spawn rolls miss');
  assert.deepEqual(errors,[]);console.log('PASS free picker startup with an advancing clock and immediate Whack-a-Mole first target');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
