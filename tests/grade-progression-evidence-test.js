// Adaptation uses grade-authored evidence thresholds and stable child-specific
// streaks. A single perfect round or difficult round cannot shift difficulty.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({
    executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
    args:['--no-sandbox']
  });
  try {
    const page=await browser.newPage({viewport:{width:820,height:1180}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(()=>!!window.KidsLearnReady);
    await page.evaluate(()=>window.KidsLearnReady);
    await page.locator('#startBtn').click();
    const test=await page.evaluate(()=>{
      const failures=[];
      const check=(condition,message)=>{if(!condition)failures.push(message)};
      state.testMode=false;state.voice=false;state.showAll=false;
      const results={};
      for(const [grade,g] of Object.entries(GRADES)){
        const rule=g.progression;
        const entry=Object.keys(g.g).find(id=>{
          const r=gradeRange(grade,id);
          return r && r[0]<r[1] && CATEGORIES.some(c=>c.id===id&&c.gen);
        });
        check(!!entry,'No grade with two-step section '+grade);
        if(!entry)continue;
        const range=gradeRange(grade,entry),n=Math.max(rule.minQuestions,10);
        const mastered={total:n,firstTry:n,mistakes:0};
        const struggling={total:n,firstTry:0,mistakes:n};
        const neutral={total:n,firstTry:Math.ceil(n*.6),mistakes:Math.ceil(n*.3)};
        let out={counts:{mastery:0,support:0},level:range[0]};
        // Strong evidence should accumulate, without jumping on one round.
        for(let i=1;i<=rule.promote.rounds;i++){
          out=progressionOutcome(rule,range,range[0],mastered,out.counts);
          check(out.level === range[0]+(i===rule.promote.rounds?1:0),
            grade+': promoted after wrong number of good rounds '+i);
        }
        check(out.status==='promoted',grade+': no promotion status');
        // One missed / neutral round should break consecutive mastery.
        let partial=progressionOutcome(rule,range,range[0],mastered,{});
        partial=progressionOutcome(rule,range,range[0],neutral,partial.counts);
        check(partial.counts.mastery===0&&partial.counts.support===0,
          grade+': mixed result did not break evidence streak');
        // A too-short perfect question set cannot count as full-round mastery.
        const short=progressionOutcome(rule,range,range[0],
          {total:rule.minQuestions-1,firstTry:rule.minQuestions-1,mistakes:0},
          {mastery:0,support:0});
        check(short.status==='insufficient'&&short.level===range[0]&&short.counts.mastery===0,
          grade+': short round caused progression');
        // Support is gradual; never drop a grade step after one hard round.
        let practice={counts:{mastery:0,support:0}};
        for(let i=1;i<=rule.support.rounds;i++){
          practice=progressionOutcome(rule,range,range[1],struggling,practice.counts);
          check(practice.level===range[1]-(i===rule.support.rounds?1:0),
            grade+': lowered after wrong number of difficult rounds '+i);
        }
        check(practice.status==='supported',grade+': no support status');
        let floor={counts:{mastery:0,support:0}};
        for(let i=0;i<rule.support.rounds;i++)
          floor=progressionOutcome(rule,range,range[0],struggling,floor.counts);
        check(floor.level===range[0]&&floor.status==='floor',
          grade+': level went below selected grade floor');
        let top={counts:{mastery:0,support:0}};
        for(let i=0;i<rule.promote.rounds;i++)
          top=progressionOutcome(rule,range,range[1],mastered,top.counts);
        check(top.level===range[1]&&top.status==='top',
          grade+': level went above selected grade cap');
        // An old grade/level's record cannot provide evidence for the new one.
        state.grade=grade;state.progressionStreaks={
          [entry]:{grade:'old-grade',level:range[0],mastery:99,support:0}
        };
        state.levels={[entry]:range[0]};
        let change=applyRoundProgression(entry,range[0],mastered);
        check(change==='building'&&state.levels[entry]===range[0]&&
          state.progressionStreaks[entry].mastery===1,
          grade+': stale grade evidence accelerated promotion');
        // Placement replaces a level, invalidating its former mastery record.
        state.progressionStreaks[entry]={grade,level:range[0],mastery:1,support:0};
        applyPlacement([{placeSection:entry,ok:true},{placeSection:entry,ok:true}]);
        check(!state.progressionStreaks[entry]&&state.levels[entry]===range[1],
          grade+': placement retained outdated progression history');
        results[grade]={section:entry,range,
          promoteRounds:rule.promote.rounds,supportRounds:rule.support.rounds};
      }

      // Exercise the actual finish() integration in a Grade 2 math section.
      state.grade='g2';state.showAll=false;state.testMode=false;
      state.progressionStreaks={};state.levels={};
      const id='add',r=gradeRange(state.grade,id),rule=GRADES[state.grade].progression;
      state.levels[id]=r[0];
      for(let i=0;i<rule.promote.rounds;i++){
        startRound(id,10);
        const n=R.qs.length;
        check(n>=rule.minQuestions,'Integration round too short to assess');
        R.firstTry=n;R.mistakes=0;
        finish();
        check(state.levels[id]===r[0]+(i===rule.promote.rounds-1?1:0),
          'finish() advanced a Grade 2 learner after wrong number of rounds');
      }
      results.integration={newLevel:state.levels[id],
        stored:state.progressionStreaks[id]};
      return {failures,results};
    });
    assert.deepEqual(test.failures,[],JSON.stringify(test.failures,null,2));
    assert.deepEqual(errors,[],'Uncaught app error during progression tests');
    console.log('PASS configurable multi-round grade progression, level bounds, placement reset and real finish() integration',JSON.stringify(test.results));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
