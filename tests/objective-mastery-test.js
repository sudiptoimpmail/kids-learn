// Authored learning-objective evidence follows the actual question into the
// active child's offline progress, independently of game-level statistics.
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
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(() => !!window.KidsLearnReady);
    await page.evaluate(() => window.KidsLearnReady);
    await page.locator('#startBtn').click();
    const result = await page.evaluate(() => {
      const failures = [], check = (ok, message) => { if (!ok) failures.push(message); };
      state.voice = false; state.testMode = false; state.showAll = false;
      state.grade = 'g2';
      state.stats = {days:{},skills:{},objectives:{}};
      const routes = ContentData.get('curriculum-map','ROUTES');
      const routeBankToSection = {
        SCIENCE:'sci', GK:'gk', THINKING_ODD:'odd',
        THINKING_SEQUENCES:'sequence', STORIES:'sent'
      };
      let checkedSources = 0;
      for (const [bank, section] of Object.entries(routeBankToSection)) {
        const rows = curriculumRows(bank, 6);
        const expected = routes[bank].find(r=>r.grade === 'g2');
        check(rows.length > 0 && !!rows[0]?.curriculumSkill, bank+': missing explicit objective in grade 2 data');
        check(rows.some(row=>row.curriculumSkill === expected.skill),
          bank+': source objective not carried to question row');
        checkedSources++;
        if (bank === 'SCIENCE' || bank === 'GK') {
          const item = mcQuestion(section, rows[0], rows[0][0]);
          check(item.curriculumSkill === rows[0].curriculumSkill,
            bank+': multiple-choice generator lost authored objective');
        }
      }
      state.grade = 'g1';
      for (const bank of Object.keys(routeBankToSection))
        check(curriculumRows(bank,6).length===0,
          bank+': advanced objectives leaked into Grade 1');
      state.grade = 'g2';
      const extRead = READING().filter(row=>!!row[4]);
      check(extRead.length===9 && extRead.every(row=>row[4]==='text-details-and-reasoning'),
        'Grade 2 reading objectives are not routed from authored story metadata');
      let readingTagged=false, oddTagged=false, sequenceTagged=false;
      for(let i=0;i<180;i++) {
        if(!readingTagged) readingTagged=!!genSentence(4).curriculumSkill;
        if(!oddTagged) oddTagged=!!genOdd(3).curriculumSkill;
        if(!sequenceTagged) sequenceTagged=!!genSequence(3).curriculumSkill;
        if(readingTagged&&oddTagged&&sequenceTagged)break;
      }
      check(readingTagged,'Rendered reading questions lose their learning objective');
      check(oddTagged,'Rendered classification questions lose their learning objective');
      check(sequenceTagged,'Rendered sequence questions lose their learning objective');
      const explorer = ExplorerCurriculum.getQuestion('math','g2-library-books');
      check(explorer.curriculumSkill === 'Data' && explorer.grades.includes('g2'),
        'Explorer math did not preserve domain and grade metadata');

      const objective = 'observe-and-compare';
      const makeCard = (ok, hinted=false) => ({
        key:'test-objective-'+Math.random(), ok, hintShown:hinted,
        t0:Date.now(), curriculumSkill:objective, grades:['g2']
      });
      const k2=objectiveKey('g2','sci',objective);
      const firstCard=makeCard(true);
      logAttempt(firstCard,'sci',3);
      logAttempt(firstCard,'sci',3);
      check(state.stats.objectives[k2].n===1,'Duplicate attempt counted twice');
      logAttempt(makeCard(true,true),'sci',3);
      logAttempt(makeCard(false),'sci',3);
      let row=state.stats.objectives[k2];
      check(row.n===3 && row.ok===1 && row.recent==='1h0',
        'Hinted/incorrect cards incorrectly treated as independent mastery');
      check(state.stats.skills['sci:3']?.n===3,
        'Existing per-level statistics changed unexpectedly');
      const policy=GRADES.g2.objectiveEvidence;
      check(objectiveState(row).s==='new',
        'Too few cards were assessed as mastered');

      for(const [grade,g] of Object.entries(GRADES)) {
        const rule=g.objectiveEvidence, base={grade,n:rule.minCards,
          recent:'1'.repeat(rule.minCards), days:['2026-01-01','2026-01-02']};
        check(objectiveState(base).s==='mastered',
          grade+': mastery thresholds did not use the grade policy');
        check(objectiveState({...base,days:['2026-01-02']}).s==='practicing',
          grade+': one day was sufficient for objective mastery');
        check(objectiveState({...base,recent:'0'.repeat(rule.minCards)}).s==='learning',
          grade+': repeated difficulty was not identified');
        check(objectiveState({...base,recent:'1'.repeat(rule.minCards-1)}).s==='new',
          grade+': fewer than minCards was treated as evidence');
      }

      // Explicit Grade 3 objectives must not affect Grade 2 results or display.
      const g3tag='grade-three-only-objective';
      state.grade='g3';
      logAttempt({ok:false,hintShown:false,t0:Date.now(),
        curriculumSkill:g3tag,grades:['g3']},'sci',4);
      const k3=objectiveKey('g3','sci',g3tag);
      check(!!state.stats.objectives[k3] && state.stats.objectives[k2].n===3,
        'Objective history mixed grades or modified existing records');
      state.grade='g2';
      renderDashboard();
      const dash = document.querySelector('#dashSkills').textContent;
      check(dash.includes('Observe and compare') && !dash.includes('Grade three only objective'),
        'Parent dashboard exposed a different grade objective');

      // Each child gets a separate objective map and the original is restored.
      const original=Store.activeId();
      Store.save(state);
      const second=Store.addKid({name:'Practice child',grade:'g2'},state);
      check(second && Object.keys(state.stats?.objectives||{}).length===0,
        'A new child inherited another child’s learning objectives');
      Store.switchTo(original,state);
      check(state.stats?.objectives?.[k2]?.n===3 &&
        state.stats?.objectives?.[k3]?.n===1,
        'Returning to the original child lost objective history');
      if(second)Store.removeKid(second,state);

      // The live next() pathway must log the correct tagged authored question.
      state.grade='g2';state.stats={days:{},skills:{},objectives:{}};
      startRound('sci',4);
      const q=mcQuestion('sci',curriculumRows('SCIENCE',3)[0],3);
      q.cat=CATEGORIES.find(c=>c.id==='sci');q.level=3;q.ok=true;
      q.grades=['g2'];
      R.qs[R.i]=q;
      next();
      check(state.stats.objectives[objectiveKey('g2','sci',q.curriculumSkill)]?.n===1,
        'Live question completion did not log the actual authored objective');
      const recorded=Object.keys(state.stats.objectives||{}).length;
      return {failures,checkedSources,objectiveRecords:recorded,
        gradeRules:Object.keys(GRADES).length};
    });
    assert.deepEqual(result.failures,[],JSON.stringify(result.failures,null,2));
    assert.deepEqual(errors,[],'Uncaught app errors during objective progress test');
    console.log('PASS authored objectives across '+result.checkedSources+
      ' question banks, '+result.gradeRules+
      ' grade policies, hint handling, dashboard isolation, child profiles and live next() logging');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
