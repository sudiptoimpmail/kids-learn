// Grade 2–3 visual math and evidence-reading integration regression.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox']
 });
 try{
  const page=await browser.newPage();
  const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));
  await page.goto('http://localhost:8765/index.html');
  await page.waitForFunction(()=>!!window.KidsLearnReady);
  await page.evaluate(()=>window.KidsLearnReady);
  const widths=[320,390,768,1024];
  for(const width of widths){
   await page.setViewportSize({width,height:820});
   const report=await page.evaluate(()=>{
    const failures=[],check=(x,msg)=>{if(!x)failures.push(msg)};
    const rows=ContentData.get('explorer-math','questions').filter(q=>q.visual);
    const kinds=new Set(rows.map(q=>q.visual.kind));
    check(rows.length===16,'Missing authored diagram models');
    check(kinds.size===4,'Missing representation type');
    const panel=document.createElement('section');
    panel.className='q-main explorer-main';
    panel.style.width='calc(100vw - 28px)';
    panel.style.boxSizing='border-box';
    document.body.appendChild(panel);
    for(const row of rows){
      const item=ExplorerCurriculum.getQuestion('math',row.id);
      check(!!item&&item.answer===row.answer,'Answer integrity: '+row.id);
      check(item.curriculumSkill===row.domain,'Objective loss: '+row.id);
      check(item.grades.join(',')===row.grades.join(','),'Eligibility loss: '+row.id);
      panel.innerHTML=item.main;
      const svg=panel.querySelector('.explorer-visual svg');
      check(!!svg,'Missing visual: '+row.id);if(!svg)continue;
      check(svg.getAttribute('role')==='img' &&
        (svg.getAttribute('aria-label')||'').length>15,
        'No screen-reader visual description: '+row.id);
      check(svg.getBoundingClientRect().width>30,'Invisible diagram: '+row.id);
      const v=row.visual;
      if(v.kind==='array')
        check(svg.querySelectorAll('circle').length===v.rows*v.columns,
          'Wrong dots: '+row.id);
      if(v.kind==='fraction-strip')
        check(svg.querySelectorAll('rect').length===v.parts,
          'Wrong equal parts: '+row.id);
      if(v.kind==='number-line')
        check(svg.querySelectorAll('circle').length===1,
          'Missing number-line point: '+row.id);
      if(v.kind==='bar-graph')
        check(svg.querySelectorAll('rect').length===v.values.length,
          'Wrong number of graph bars: '+row.id);
      const wrap=panel.querySelector('.explorer-visual');
      check(wrap.scrollWidth<=wrap.clientWidth+3 &&
        panel.scrollWidth<=panel.clientWidth+3,
        'Horizontal overflow: '+row.id+' / '+innerWidth+'px');
    }
    panel.remove();
    const extension=ContentData.get('grade23-extension','STORIES');
    const routes=ContentData.get('curriculum-map','ROUTES').STORIES;
    check(extension.length===routes.length && extension.length===27,
      'Unmatched authored story routes');
    for(const grade of ['g2','g3']){
      state.grade=grade;
      const selected=curriculumRows('STORIES',6);
      const expected=routes.filter(r=>r.grade===grade);
      check(selected.length===expected.length,'Wrong grade story count: '+grade);
      const other=routes.filter(r=>r.grade!==grade).map(r=>r.id);
      check(selected.every(r=>!other.includes(r.curriculumRouteId)),
        'Cross-grade reading leakage: '+grade);
      for(const row of selected){
        const q=genSentence(row[0],[row[1],row[2],row[0],true,row.curriculumSkill]);
        check(q.curriculumSkill===row.curriculumSkill,
          'No authored reading objective: '+row.curriculumRouteId);
        check(q.options.filter(x=>x.v===q.answer).length===1,
          'Invalid reading answer: '+row.curriculumRouteId);
      }
    }
    return {failures,diagrams:rows.length,stories:extension.length};
   });
   assert.deepEqual(report.failures,[],width+'px: '+JSON.stringify(report.failures));
  }
  assert.deepEqual(jsErrors,[]);
  console.log('PASS 16 accessible visual math models × 4 viewport widths and 27 grade-scoped reading passages');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
