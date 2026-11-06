// Phase 4A: grade-configured spaced review must use explicit authored
// objectives and never bypass grade or same-round/recent-card integrity.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage({viewport:{width:820,height:1180}});
    const errors = [];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(()=>!!window.KidsLearnReady);
    await page.evaluate(()=>window.KidsLearnReady);
    await page.locator('#startBtn').click();
    const result = await page.evaluate(() => {
      const errors = [], check = (ok,message) => {if(!ok)errors.push(message)};
      state.voice=false;state.testMode=false;state.showAll=false;
      state.grade='g2';state.recent={};state.recentContent={};
      state.stats={days:{},skills:{},objectives:{}};
      const today=dayKey();
      const before = (days) => {const d = new Date();
        d.setDate(d.getDate()-days);return dayKey(d)};
      const put = (grade,cat,objective,status,daysAgo) => {
        const rule=GRADES[grade].objectiveEvidence;
        const n=rule.minCards;
        const recent=status==='mastered'?'1'.repeat(n):
          status==='learning'?'0'.repeat(n):
          status==='new'?'1'.repeat(Math.max(1,n-1)):
          '1'.repeat(Math.ceil(n*.7))+'0'.repeat(n-Math.ceil(n*.7));
        const row={grade,cat,objective,n:recent.length,
          ok:[...recent].filter(x=>x==='1').length,recent,
          last:before(daysAgo),days:[before(daysAgo+1),before(daysAgo)]};
        state.stats.objectives[objectiveKey(grade,cat,objective)]=row;
        return row;
      };
      // All five grade policies define strictly later review for mastered work.
      for (const [grade,profile] of Object.entries(GRADES)) {
        const policy=profile.reviewSchedule;
        check(policy.maxReviewCards>=1 && policy.maxReviewCards<=3,
          grade+': invalid review cap');
        check(policy.intervalDays.mastered > policy.intervalDays.learning,
          grade+': mastered work reviewed too frequently');
        check(policy.intervalDays.practicing>=policy.intervalDays.learning,
          grade+': practice scheduling ignores difficulty');
        check(reviewAgeDays(before(5),today)===5,
          'Review date calculation is not calendar-day accurate');
      }
      check(reviewAgeDays('not-a-date',today)===-1 &&
        reviewAgeDays('2026-02-30',today)===-1,
        'Bad saved dates were accepted');
      const objective='observe-and-compare',cat='sci',level=3;
      state.levels.sci=level;
      const intervals=GRADES.g2.reviewSchedule.intervalDays;
      put('g2',cat,objective,'mastered',intervals.mastered-1);
      check(!dueObjectiveReviews(cat,today).some(x=>x.objective===objective),
        'Mastered science objective selected before review date');
      check(authoredReviewQuestions(cat,level,null,today).length===0,
        'Mastered work appeared in an early review pool');
      put('g2',cat,objective,'mastered',intervals.mastered);
      check(dueObjectiveReviews(cat,today)[0]?.status==='mastered',
        'Mature mastered objective did not become due');
      put('g2',cat,objective,'learning',intervals.learning);
      const due=dueObjectiveReviews(cat,today);
      check(due[0]?.status==='learning','Struggling objective not prioritized');
      const authored=authoredReviewQuestions(cat,level,null,today);
      check(authored.length>0 &&
        authored.every(q=>q.curriculumSkill===objective && q.grades.includes('g2')),
        'Review pool lost grade-specific authored objective metadata');
      const beforeKeys = authored.map(q=>q.key);
      // Different content banks must be targetable, not just science.
      const bankCases=[
        ['story','Data',4],['gk','everyday-evidence',3],
        ['sent','text-details-and-reasoning',4],
        ['odd','properties-and-categories',3],
        ['sequence','sequencing-life-events',3]
      ];
      for(const [section,skill,lv] of bankCases) {
        put('g2',section,skill,'learning',1);
        const choices=authoredReviewQuestions(section,lv,null,today);
        check(choices.length>0,section+': has no targeted authored questions');
        check(choices.every(q=>q.curriculumSkill===skill),
          section+': selected cards carry a different objective');
      }
      // Scheduled questions follow the existing recent history guard.
      state.recent.sci=beforeKeys.slice();
      startRound('sci',7,false,level);
      check(R.qs.every(q=>!q.reviewScheduled || !beforeKeys.includes(q.key)),
        'Recent cards were forcibly repeated by spaced review');
      // With history cleared, a real round can include due-review cards, but
      // must still include ordinary grade-appropriate questions as well.
      state.recent={};state.recentContent={};
      startRound('sci',10,false,level);
      const review=R.qs.filter(q=>q.reviewScheduled);
      check(review.length>=1 && review.length<=GRADES.g2.reviewSchedule.maxReviewCards,
        'Scheduled review was missing or over the configured cap');
      check(review.every(q=>q.curriculumSkill===objective && q.grades.includes('g2')),
        'Scheduled science review leaked the wrong skill or grade');
      check(new Set(R.qs.map(q=>q.key)).size===R.qs.length,
        'Same question appeared twice in one round');
      // Grade changes cannot pull evidence from the previous grade.
      state.grade='g1';state.levels={};state.recent={};state.recentContent={};
      check(!dueObjectiveReviews('sci',today).length &&
        !authoredReviewQuestions('sci',2,null,today).length,
        'Grade 2 science review leaked into Grade 1');
      // Manual parent practice may request an objective on the same day, while
      // the scheduled auto-review still respects its interval.
      state.grade='g2';state.levels.sci=level;state.recent={};state.recentContent={};
      put('g2',cat,objective,'learning',0);
      check(!dueObjectiveReviews(cat,today).length,
        'Automatic review ignored the minimum spacing');
      check(dueObjectiveReviews(cat,today,objective).length===1,
        'Manual parent review did not authorize an explicit objective');
      renderDashboard();
      const parentButton=[...document.querySelectorAll('#dashNext [data-practice]')]
        .find(el=>el.dataset.practice===cat);
      check(parentButton?.dataset.focus===objective,
        'Parent practice did not identify the weak science objective');
      if(parentButton){
        parentButton.click();
        check(R.qs.some(q=>q.reviewScheduled&&q.curriculumSkill===objective),
          'Clicking parent practice did not deliver an authored review card');
      }
      // Today's Quest includes a due weak objective, not just a broad category.
      put('g2',cat,objective,'learning',1);
      state.quest=null;state.recent={};state.recentContent={};
      const quest=questFor();
      const qstep=quest.steps.find(s=>s.cat==='sci' && s.why==='practice');
      check(qstep?.objective===objective,
        'Daily Quest did not choose a due objective that needs practice');
      if(qstep){
        startQuestStep(quest.steps.indexOf(qstep));
        check(R.qs.some(q=>q.reviewScheduled&&q.curriculumSkill===objective),
          'Quest did not deliver targeted review items');
      }
      // A new child has no review history and cannot inherit due objective work.
      Store.save(state);
      const original=Store.activeId();
      const child=Store.addKid({grade:'g2',name:'Other child'},state);
      check(child && dueObjectiveReviews('sci',today).length===0,
        'New child inherited another child review queue');
      if(child){Store.switchTo(original,state);Store.removeKid(child,state);}
      return {errors,reviewCount:review.length,checkedBanks:bankCases.length+1,
        policies:Object.keys(GRADES).length};
    });
    assert.deepEqual(result.errors,[],JSON.stringify(result.errors,null,2));
    assert.deepEqual(errors,[],'Uncaught app error');
    console.log('PASS '+result.policies+' grade review schedules, '+result.checkedBanks+
      ' targeted authored banks, recent dedup, parent/quest practice and child isolation');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
