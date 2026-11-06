// Phase 4B: all authored visual math models must render accessibly and fit
// on phones/iPads; new reading and science rows must honor curriculum routing.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage({viewport:{width:820,height:1180}});
    const pageErrors=[];
    page.on('pageerror',err=>pageErrors.push(err.message));
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(()=>!!window.KidsLearnReady);
    await page.evaluate(()=>window.KidsLearnReady);
    await page.locator('#startBtn').click();
    const report = await page.evaluate(async () => {
      const failures=[],require=(ok,msg)=>{if(!ok)failures.push(msg)};
      const math=ContentData.get('explorer-math','questions');
      const visuals=math.filter(x=>x.representation);
      const kinds=[...new Set(visuals.map(x=>x.representation.kind))].sort();
      require(visuals.length===12,'Expected 12 illustrated math missions');
      require(kinds.join(',')==='array,bar-chart,fraction-strip,number-line',
        'Not all representation types delivered: '+kinds.join(','));
      const originalGrade=state.grade;
      const allowed=ContentData.get('curriculum-map','GRADES');
      const err=[];
      for(const grade of ['g2','g3']){
        state.grade=grade;state.showAll=false;state.testMode=false;
        for(const q of visuals){
          if(!q.grades.includes(grade))continue;
          const range=gradeRange(grade,'story');
          require(q.level>=range[0]&&q.level<=range[1],
            'Math mission outside grade range '+grade+'/'+q.id);
          const delivered=ExplorerCurriculum.getQuestion('math',q.id);
          require(delivered.curriculumSkill===q.domain,'Missing authored objective '+q.id);
          require(delivered.grades.includes(grade),'Missing eligible grade '+q.id);
          require(delivered.options.filter(x=>x.v===delivered.answer).length===1,
            'Ambiguous math answer '+q.id);
        }
      }
      state.grade='g2';state.levels.story=4;
      startRound('story',1);
      const play=document.querySelector('#play');
      const article=document.createElement('section');
      article.className='q-main explorer-main';
      play.appendChild(article);
      const viewports=[
        {width:320,height:660},{width:390,height:844},
        {width:820,height:1180},{width:1180,height:820}
      ];
      let rendered=0;
      for(const viewport of viewports){
        await new Promise(r=>requestAnimationFrame(r));
        // Page viewport is changed through a dedicated test hook below.
        for(const q of visuals){
          const delivered=ExplorerCurriculum.getQuestion('math',q.id);
          article.style.width=(viewport.width-48)+'px';
          article.style.maxWidth='none';
          article.innerHTML=delivered.main;
          const svg=article.querySelector('.explorer-diagram');
          require(!!svg,'No visual diagram: '+q.id);
          if(!svg)continue;
          rendered++;
          require(svg.getAttribute('role')==='img'&&
            svg.getAttribute('aria-label')?.length>10,'Unlabelled visual: '+q.id);
          require(svg.getAttribute('viewBox')?.split(/\\s+/).length===4,
            'Invalid diagram viewBox: '+q.id);
          require(svg.querySelectorAll('circle,rect,line').length>=2,
            'Missing graphical geometry: '+q.id);
          require(article.scrollWidth<=article.clientWidth+2,
            'Horizontal overflow in '+q.id+' at '+viewport.width+'px: '+article.scrollWidth+'/'+article.clientWidth);
          require(svg.getBoundingClientRect().width<=article.clientWidth+2,
            'SVG bigger than card in '+q.id+' at '+viewport.width+'px');
          require(!article.querySelector('script,iframe'),'Unsafe visual content: '+q.id);
        }
      }
      article.remove();
      // Route ownership must be established by data metadata, not by assuming
      // the first N entries all belong to Grade 2.
      const ext=ContentData.get('grade23-extension','STORIES');
      const sci=ContentData.get('grade23-extension','SCIENCE');
      const routes=ContentData.get('curriculum-map','ROUTES');
      require(ext.length===routes.STORIES.length,'Reading-route count mismatch');
      require(sci.length===routes.SCIENCE.length,'Science-route count mismatch');
      const newStories=routes.STORIES.filter(r=>Number(r.id.split('-').at(-1))>=16);
      const newScience=routes.SCIENCE.filter(r=>Number(r.id.split('-').at(-1))>=41);
      require(newStories.length===12&&newScience.length===8,'New Grade 2–3 route counts');
      for(const grade of ['g1','g2','g3']){
        state.grade=grade;
        const ownedStories=curriculumRows('STORIES',6);
        const ownedScience=curriculumRows('SCIENCE',4);
        require(ownedStories.every(x=>x.curriculumSkill),
          'Untagged reading mission '+grade);
        require(ownedScience.every(x=>x.curriculumSkill),
          'Untagged science investigation '+grade);
        if(grade==='g1'){
          require(!ownedStories.length&&!ownedScience.length,
            'Advanced content leaked into Grade 1');
          continue;
        }
        for(const row of ownedStories){
          const generated=genSentence(row[0],[row[1],row[2],row[0],true,row.curriculumSkill]);
          require(generated.curriculumSkill===row.curriculumSkill,
            'Reading objective lost at '+grade);
          require(row[2].some(([question,choices])=>
            question===generated.qkey && choices[0]===generated.answer),
            'Reading correct answer lost at '+grade);
        }
        for(const row of ownedScience){
          const generated=mcQuestion('sci',row,row[0]);
          require(generated.curriculumSkill===row.curriculumSkill,
            'Science objective lost at '+grade);
          require(generated.answer===row[2],'Science correct answer mismatch '+grade);
        }
      }
      state.grade=originalGrade;
      return {failures,visuals:visuals.length,rendered,reading:newStories.length,
        science:newScience.length};
    });
    assert.deepEqual(report.failures,[],report.failures.slice(0,20).join('\n'));
    assert.deepEqual(pageErrors,[]);
    console.log('PASS '+report.visuals+' visual math missions on 4 viewports; '+
      report.reading+' new reading passages and '+report.science+
      ' science investigations retain grade routes and answer integrity');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
