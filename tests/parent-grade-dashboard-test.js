'use strict';
const assert=require('node:assert/strict');
const { chromium }=require('playwright');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    const p=await b.newPage({viewport:{width:390,height:844}});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://localhost:8765/index.html');
    await p.waitForFunction(()=>!!window.KidsLearnReady);await p.evaluate(()=>window.KidsLearnReady);
    await p.locator('#startBtn').click();
    const result=await p.evaluate(()=>{
      const issues=[],check=(ok,msg)=>{if(!ok)issues.push(msg)};
      state.name='Sam';state.voice=false;state.showAll=false;state.testMode=false;
      state.stats={days:{},skills:{},objectives:{}};
      for(const grade of ['prek','k','g1','g2','g3']){
        state.grade=grade;state.levels={};renderHome();renderDashboard();
        check(document.querySelector('#dashGrade h2')?.textContent.includes(gradeName(grade)),grade+' grade title missing');
        check(document.querySelectorAll('#dashGrade .dash-grade-item').length===5,grade+' does not show five expected skills');
        check([...document.querySelectorAll('#dashGrade .dash-grade-status')].every(x=>x.textContent==='Not observed yet'),grade+' invented initial performance');
        check(document.querySelector('#dashGrade')?.textContent.includes('not a list of app games'),grade+' expected skills not explained');
        check(!document.querySelector('#dashWeekDetails').open,grade+' weekly charts open by default');
        check(!document.querySelector('#dashEvidenceDetails').open,grade+' technical data open by default');
        check(!document.querySelector('#dashPracticeDetails').open,grade+' practice details open by default');
        check(document.querySelectorAll('#dashSubjects details').length===2,grade+' learning/brain groups not separate');
        check([...document.querySelectorAll('#dashSubjects details')].every(x=>!x.open),grade+' challenge details open by default');
        check(/Overall difficulty [1-5]\/5/.test(document.querySelector('#dashSubjects')?.textContent||''),grade+' overall challenge missing');
        const brain=document.querySelector('#dashSubjects details:nth-of-type(2)')?.textContent||'';
        check(brain.includes('Memory Match') && brain.includes('Finger Maze'),grade+' Brain Games missing');
        check(!/Whack-a-Mole|Pop the Balloons|3D Pinball|Rolling Ball 3D/.test(brain),grade+' arcade levels mixed into Brain Games');
      }
      // Grade-specific app evidence, without falsely reporting school-grade mastery.
      state.grade='prek';state.stats.skills={'phonics:1':{n:11,ok:10,recent:'11111111101',days:['2026-11-03','2026-11-04']}};
      renderDashboard();
      check(document.querySelectorAll('#dashGrade .dash-grade-status.strong').length>=1,'positive independent practice not recognized');
      check(!/completed grade|grade mastered/i.test(document.querySelector('#dashGrade').textContent),'practice labeled as grade certification');
      state.grade='g2';renderDashboard();
      check([...document.querySelectorAll('#dashGrade .dash-grade-status')].every(x=>x.textContent==='Not observed yet'),'out-of-grade practice counted as grade 2');
      // Grown-up settings are collapsed and show only learning and puzzle levels.
      state.grade='g2';state.levels={};renderHome();openSettings();
      check(!document.querySelector('#settingsLearningLevels').open,'academic settings not collapsed');
      check(!document.querySelector('#settingsBrainLevels').open,'brain settings not collapsed');
      check(document.querySelectorAll('#levels select').length>10,'learning levels missing');
      const brainSelects=[...document.querySelectorAll('#brainLevels select')];
      check(brainSelects.length>=4,'brain-level controls missing');
      check(!brainSelects.some(x=>/pinball|whack|ball|pop|ttt/.test(x.dataset.brainId)),'arcade-level controls mixed with brain');
      const memory=document.querySelector('#brainLevels select[data-brain-id="memory"]');
      const before=GL('memory'),range=gameRange('memory'),changed=before===range[1]?range[0]:range[1];
      memory.value=String(changed);collectSettings();
      check(GL('memory')===changed,'brain level not persisted');
      const sudoku=document.querySelector('#brainLevels select[data-brain-id="sudoku"]');
      if(sudoku){const range=gameRange('sudoku'),target=range[1];sudoku.value=String(target);collectSettings();
        check(GL('sudoku')===target,'Sudoku level not persisted in its dedicated setting');}
      openSettings();
      check(GL('memory')===changed,'brain game level lost when reopening Settings');
      return {issues,expectations:5,grades:5};
    });
    assert.deepEqual(result.issues,[],JSON.stringify(result.issues,null,2));
    assert.deepEqual(errs,[]);
    console.log('PASS five grade-expected skill summaries, honest evidence, collapsed history and separate learning/brain difficulty');
    await p.close();
  } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
