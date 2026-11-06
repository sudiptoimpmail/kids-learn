// Parent dashboard distinguishes authored objective coverage from mastery.
// Untried objective actions must use real grade-routed questions, never guesses.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox']
 });
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:8765/index.html');
  await page.waitForFunction(()=>!!window.KidsLearnReady);
  await page.evaluate(()=>window.KidsLearnReady);
  await page.locator('#startBtn').click();
  const report=await page.evaluate(()=>{
   const failures=[],check=(ok,msg)=>{if(!ok)failures.push(msg)};
   state.voice=false;state.testMode=false;state.showAll=false;
   state.grade='g2';state.levels={};state.recent={};state.recentContent={};
   state.stats={days:{},skills:{},objectives:{}};
   const g2=authoredObjectiveCatalog('g2'),g3=authoredObjectiveCatalog('g3');
   check(g2.length>=6 && g3.length>=6,'Too few explicitly authored objective groups');
   check(g2.every(x=>x.grade==='g2') && g3.every(x=>x.grade==='g3'),
     'Cross-grade catalog entries');
   check(new Set(g2.map(x=>x.key)).size===g2.length,'Repeated objective catalog key');
   check(g2.every(x=>!!gradeRange('g2',x.cat)),'Out-of-grade authored objective');
   check(authoredObjectiveCatalog('prek').length===0 &&
     authoredObjectiveCatalog('g1').length===0,
     'A generic, untagged curriculum was mislabeled as an authored objective');
   check(dueObjectiveReviews('sci',dayKey(),'made-up-skill').length===0,
     'Manual focus can introduce an objective that is not authored');
   renderDashboard();
   const skills=document.querySelector('#dashSkills');
   check(skills.textContent.includes('0 of '+g2.length),
     'Empty history did not show zero objective coverage');
   check(skills.textContent.includes('not grade completion'),
     'Coverage was presented as a mastery or completion score');
   const explore=document.querySelector('#dashExploreObjective');
   check(!!explore,'Parent cannot find untried, in-level objectives');
   let focus='',cat='';
   if(explore){
    focus=explore.dataset.objective;cat=explore.dataset.category;
    check(g2.some(x=>x.cat===cat&&x.objective===focus&&x.level<=levelOf(cat)),
      'Unrouted or too-hard objective offered to child');
    check(dueObjectiveReviews(cat,dayKey(),focus).some(x=>x.manual),
      'Previously unseen authored objective cannot be targeted manually');
    explore.click();
    check(R.qs.some(q=>q.reviewScheduled&&q.curriculumSkill===focus),
      'Explore button did not deliver a focus-matched authored review card');
    const answered=R.qs.find(q=>q.curriculumSkill===focus);
    if(answered){
      answered.ok=true;answered.hintShown=false;answered.t0=Date.now();
      logAttempt(answered,cat,answered.level);
      check(state.stats.objectives[objectiveKey('g2',cat,focus)]?.n===1,
        'First attempt not recorded at the objective level');
    }
    renderDashboard();
    check(document.querySelector('#dashSkills').textContent.includes('1 of '+g2.length),
      'Coverage did not update after authentic practice');
   }
   state.grade='g3';state.levels={};renderDashboard();
   check(document.querySelector('#dashSkills').textContent.includes('0 of '+g3.length),
     'Grade 2 attempts counted toward Grade 3 coverage');
   state.grade='prek';state.levels={};renderDashboard();
   check(!document.querySelector('#dashExploreObjective') &&
     document.querySelector('#dashSkills').textContent.includes('game-level progress'),
     'Untitled Pre-K questions were presented as authored objectives');
   return {failures,grade2Catalog:g2.length,grade3Catalog:g3.length,focus,cat};
  });
  assert.deepEqual(report.failures,[],JSON.stringify(report.failures,null,2));
  assert.deepEqual(errors,[]);
  console.log('PASS authored objective discovery and coverage, grade isolation, manual practice and 390px dashboard');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
