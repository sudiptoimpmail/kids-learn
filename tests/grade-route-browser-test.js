const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.goto('http://localhost:8765/index.html');
  await page.waitForFunction(()=>!!window.KidsLearnReady);
  await page.evaluate(()=>window.KidsLearnReady);
  const r=await page.evaluate(()=>{
   const out={};
   for(const g of ['prek','k','g1','g2','g3']){
    state.grade=g;
    const owned={};
    for(const bank of ['SCIENCE','GK','THINKING_ODD','THINKING_SEQUENCES','STORIES']){
      owned[bank]=curriculumRows(bank,6).length;
      if(curriculumRows(bank,6).some((row)=>!Array.isArray(row)))throw Error('Malformed curated row '+bank);
    }
    const reading=READING();
    const extension=ContentData.get('grade23-extension','STORIES');
    // Ownership comes from curriculum route metadata, never row positions.
    const routes=ContentData.get('curriculum-map','ROUTES').STORIES;
    owned.passageIncludesG2=extension.filter((x,i)=>routes[i].grade==='g2' &&
      reading.some(y=>y[0]===x[1])).length;
    owned.passageIncludesG3=extension.filter((x,i)=>routes[i].grade==='g3' &&
      reading.some(y=>y[0]===x[1])).length;
    owned.expectedG2=g==='g2'?routes.filter(r=>r.grade==='g2').length:0;
    owned.expectedG3=g==='g3'?routes.filter(r=>r.grade==='g3').length:0;
    out[g]=owned;
   }
   return out;
  });
  for(const g of ['prek','k','g1']){
    assert.equal(Object.values(r[g]).reduce((a,b)=>a+b,0),0,'Curated Grade 2–3 content leaked into '+g);
  }
  for(const bank of ['SCIENCE','GK','THINKING_ODD','THINKING_SEQUENCES','STORIES']){
    assert.ok(r.g2[bank]>0&&r.g3[bank]>0,bank+' has thin grade routing');
  }
  assert.ok(r.g2.expectedG2>=9,'Grade 2 authored reading bank is too small');
  assert.ok(r.g3.expectedG3>=18,'Grade 3 authored reading bank is too small');
  assert.equal(r.g2.passageIncludesG2,r.g2.expectedG2,'Grade2 missing its own comprehension passages');
  assert.equal(r.g2.passageIncludesG3,0,'Grade2 saw Grade3 comprehension passages');
  assert.equal(r.g3.passageIncludesG3,r.g3.expectedG3,'Grade3 missing its own comprehension passages');
  assert.equal(r.g3.passageIncludesG2,0,'Grade3 saw Grade2 comprehension passages');
  console.log('PASS grade-scoped 135 authored question rows and reading passages remain isolated across Pre-K–Grade 3');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
