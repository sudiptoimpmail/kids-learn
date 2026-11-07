const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome'});
 try{
  const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>localStorage.setItem('learnplay.v1',JSON.stringify({name:'Ava',grade:'prek',voice:false})));
  await p.goto('http://localhost:8765');await p.waitForFunction(()=>!!window.KidsLearnReady);await p.evaluate(()=>window.KidsLearnReady);await p.evaluate(()=>clipsReady);
  await p.evaluate(()=>$('#startBtn').click());
  const failures=await p.evaluate(()=>{
   const failures=[],check=(v,m)=>{if(!v)failures.push(m);};
   for(const grade of ['prek','k']){
    state.grade=grade;state.testMode=false;state.showAll=false;
    const allowed=new Set(activityPolicy('vocab').words);
    const learn=vocabLearnList(gradeRange(grade,'vocab')[0]);
    check(learn.length>=20,grade+' sufficient learn words');
    check(!learn.some(v=>v[0]==='enormous'||v[0]==='exhausted'),grade+' starts with everyday vocabulary');
    check(learn.every(v=>allowed.has(v[0])),grade+' learn list matches policy');
    for(let i=0;i<150;i++){
     const v=genVocab(1),s=genSyllable(1);
     check(allowed.has(v.answer),grade+' vocabulary answer');
     check(v.options.every(o=>allowed.has(o.v)),grade+' vocabulary distractors');
     check(v.options.length>=3&&new Set(v.options.map(o=>o.v)).size===v.options.length,grade+' distinct choices');
     check(gradeFits(v,grade,'vocab'),grade+' readable vocabulary');
     check(s.answer<=2&&!s.key.includes('dinosaur'),grade+' starting syllables');
     check(s.main.includes('big-emoji'),grade+' picture cue');
     for(const q of [v,s])check(sayParts(q.say).every(t=>CLIPS[clipKey(t)]),grade+' existing recorded prompt '+q.key);
    }
    for(let n=0;n<8;n++){
     startPlacement();
     check(R.qs.length===8,grade+' complete assessment');
     check(R.qs.every(q=>q.assessedLevel===gradeRange(grade,q.placeSection)[0]),grade+' starting assessment level');
     if(grade==='prek')check(R.qs.every(q=>q.placeSection!=='sub'&&!/[−×÷]/.test(fitText(q.main))),grade+' no subtraction or advanced math');
     R.qs.forEach(q=>q.ok=true);applyPlacement(R.qs);
     check(R.qs.every(q=>levelOf(q.placeSection)<=q.assessedLevel),grade+' no promotion beyond assessed skills');
    }
    for(const id of ['vocab','syl']){state.recent={};state.recentContent={};startRound(id);check(R.qs.length===5,grade+' full valid round '+id);}
   }
   state.grade='g3';check(vocabPool(3).some(v=>v[0]==='enormous'),'older vocabulary retained');
   const seen=new Set();for(let i=0;i<150;i++)seen.add(genSyllable(2).answer);check(seen.has(4),'older four-syllable words retained');
   // A new grade policy can reuse the same generator without a code branch.
   const rule=GRADES.g3.activityPolicy;GRADES.g3.activityPolicy={syl:{maxSyllablesByLevel:[1]}};
   check(Array.from({length:20},()=>genSyllable(2)).every(q=>q.answer===1),'data-driven rule reuse');
   GRADES.g3.activityPolicy=rule;
   return failures;
  });
  assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);console.log('PASS early vocabulary, picture choices, recorded prompts, syllable limits, assessment scope and reusable grade policy');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
