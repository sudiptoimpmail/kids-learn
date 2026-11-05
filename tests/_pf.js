const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:820,height:1180}});await p.goto('http://localhost:8765/index.html');await p.locator('#startBtn').click();
const r=await p.evaluate(()=>{state.grade='g2';state.testMode=true;state.showAll=true;const fails=[];
for(let n=0;n<60;n++){startRound('sent',3);const q=genPassageFill();R.qs[R.i]=q;renderQ();
 q.passageFill.forEach((pp,i)=>{const el=document.querySelector(`.g1-q[data-i="${i}"] .g1-chip[data-o="${pp.answer}"]`); if(!el) fails.push(['nochip',pp.answer]); else el.click();});
 if(!R.locked||q.tries) fails.push([q.key,q.tries,R.locked,JSON.stringify(q.passageFill.map(x=>[x.answer,x.options]))]);}
return fails.slice(0,5);});
console.log(JSON.stringify(r,null,1));await b.close();})();
