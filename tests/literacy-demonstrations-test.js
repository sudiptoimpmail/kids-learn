const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright'),F=require('../learning-framework');
const config=JSON.parse(fs.readFileSync('data/curriculum-map.json')).datasets.learningFramework;
const clips=JSON.parse(fs.readFileSync('audio/clips.json'));
F.validate(config);
for(const demo of Object.values(config.demonstrations))for(const step of demo.steps)for(const key of step.audio||[])assert.ok(clips[key],`Missing recording: ${key}`);
const bad=structuredClone(config);bad.demonstrations['phonics:1'].try.answer='not an option';assert.throws(()=>F.validate(bad),/Invalid demonstration/);
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_BIN});try{
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:8765');await p.waitForFunction(()=>!!window.KidsLearnReady);await p.evaluate(()=>window.KidsLearnReady);
 await p.evaluate(()=>{document.getElementById('splash').classList.add('gone');state.name='Ava';state.grade='g1';state.voice=false;show('home');});
 const before=await p.evaluate(()=>JSON.stringify({evidence:state.skillEvidence,stars:state.stars}));
 for(const source of ['phonics:1','phonics:2','phonics:3','phonics:4','phonics:5','sent:1','cvc:1']){
  const demo=config.demonstrations[source];
  await p.evaluate(source=>openDemonstration(learningConfig.demonstrations[source]),source);
  for(const step of demo.steps){assert.equal(await p.locator('[data-replay]').count(),1);await p.locator('[data-replay]').click();await p.locator('[data-next]').click();}
  await p.locator('[data-answer]').filter({hasText:demo.try.options.find(o=>o!==demo.try.answer)}).click();
  assert.match(await p.locator('#lessonFeedback').innerText(),/Let us look together/);
  await p.locator('[data-answer]').filter({hasText:demo.try.answer}).click();
  assert.match(await p.locator('#lessonFeedback').innerText(),/Yes!/);
  await p.locator('[data-done]').click();assert.equal(await p.locator('#lessonSheet').count(),0);
 }
 assert.equal(await p.evaluate(()=>JSON.stringify({evidence:state.skillEvidence,stars:state.stars})),before,'guided practice must not award independent evidence');
 await p.evaluate(()=>startRound('phonics',5,false,3));assert.ok(await p.locator('#showMeBtn').isVisible());await p.locator('#showMeBtn').click();await p.locator('[data-skip]').click();assert.ok(await p.locator('#play').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS seven recorded literacy demonstrations, replay, feedback, exit, activity entry and evidence isolation');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
