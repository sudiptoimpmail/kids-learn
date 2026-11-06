const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
  for(const name of ['explorer-math','explorer-science']){
    const data=JSON.parse(fs.readFileSync('data/'+name+'.json','utf8'));
    assert.equal(data.schema,1);
    assert.equal(data.namespace,name);
    assert.ok(data.datasets.questions.length>=30);
    for(const question of data.datasets.questions){
      assert.equal(new Set(question.choices).size,question.choices.length,'Duplicate options: '+question.id);
      assert.equal(question.choices.filter(v=>v===question.answer).length,1,'Answer issue: '+question.id);
      assert.ok(question.explanation && question.context && question.prompt,'Missing learning evidence: '+question.id);
      if(question.asset)assert.ok(fs.existsSync(question.asset),'Missing image '+question.asset);
    }
  }
  const manifest=fs.readFileSync('sw.js','utf8');
  for(const file of ['data/explorer-math.json','data/explorer-science.json','explorer-engine.js']){
    assert.ok(manifest.includes('"'+file+'"'),'Missing offline precache '+file);
  }
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:320,height:660}});
    await page.goto('http://localhost:8765/index.html');
    await page.evaluate(()=>window.KidsLearnReady);
    const inspected=await page.evaluate(()=>{
      const errors=[],out=window.ExplorerCurriculum.summary();
      for(const kind of ['math','science']){
        const bank=ContentData.get('explorer-'+kind,'questions');
        for(const row of bank){
          const q=ExplorerCurriculum.getQuestion(kind,row.id);
          if(!q||!q.explorer||q.answer!==row.answer||q.explanation!==row.explanation)
            errors.push('Incorrect question '+row.id);
          if(q.options.filter(o=>o.v===q.answer).length!==1)
            errors.push('Answer missing '+row.id);
          const html=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
          if(!q.main.includes(html(row.prompt))||!q.main.includes(html(row.context)))
            errors.push('Question text missing '+row.id);
          if(q.hint.html.includes(row.answer))errors.push('Hint reveals answer '+row.id);
        }
      }
      for(const [category,level] of [['story',4],['story',5],['sci',3],['sci',4]]){
        const cat=CATEGORIES.find(c=>c.id===category);
        const kind=category==='story'?'math':'science';
        const row=ContentData.get('explorer-'+kind,'questions').find(q=>q.level===level);
        if(!row || !row.grades.length){errors.push('No grade route for '+category+'/'+level);continue}
        // Test within a grade explicitly allowed by the authored curriculum.
        // A missing grade is no longer permission to show any Explorer content.
        state.grade=row.grades[0];state.showAll=false;
        let variants=0;
        for(let n=0;n<160;n++){const q=cat.gen(level);if(q?.explorer)variants++}
        if(!variants)errors.push('No Explorer questions appear in '+category+'/'+level);
      }
      const q=ExplorerCurriculum.getQuestion('science','g3-ramp-friction');
      const panel=document.createElement('section');panel.className='q-main explorer-main';
      panel.style.width='calc(100vw - 28px)';panel.innerHTML=q.main;
      document.body.append(panel);
      const overflow=panel.scrollWidth-panel.clientWidth;
      panel.remove();
      if(overflow>1)errors.push('Explorer card overflows 320px by '+overflow+'px');
      return {errors,out};
    });
    assert.deepEqual(inspected.errors,[],inspected.errors.join('\n'));
    assert.equal(inspected.out.math,74);
    assert.equal(inspected.out.science,36);
    console.log('PASS 110 Grade 2–3 inquiry questions with checked answers, media, offline manifests and 320px layout');
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
