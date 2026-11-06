// Explorer missions must honor the active grade's authored eligibility,
// even when different school grades share the same difficulty level.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(()=>!!window.KidsLearnReady);
    await page.evaluate(()=>window.KidsLearnReady);
    const result=await page.evaluate(()=>{
      const failures=[],samples={},grades=ContentData.get('curriculum-map','GRADES');
      const banks={
        story:new Map(ContentData.get('explorer-math','questions').map(q=>['explorer-math-'+q.id,q])),
        sci:new Map(ContentData.get('explorer-science','questions').map(q=>['explorer-science-'+q.id,q]))
      };
      for(const grade of Object.keys(grades)) {
        state.grade=grade;
        state.showAll=false;
        for(const section of Object.keys(banks)) {
          const range=gradeRange(grade,section);
          if(!range)continue;
          const category=CATEGORIES.find(c=>c.id===section);
          for(let level=range[0];level<=range[1];level++) {
            let shown=0;
            for(let n=0;n<220;n++) {
              const q=category.gen(level);
              if(!q.explorer)continue;
              shown++;
              const row=banks[section].get(q.key);
              if(!row || !row.grades.includes(grade) || row.level>level || row.level<level-1) {
                failures.push(grade+'/'+section+'/'+level+' leaked '+q.key);
              }
            }
            samples[grade+'/'+section+'/'+level]=shown;
          }
        }
      }
      for(const [grade,section,level] of [
        ['g2','story',5], ['g3','story',5], ['g2','sci',3], ['g3','sci',4]
      ]) if(!(samples[grade+'/'+section+'/'+level]>5))
        failures.push('Eligible Explorer pool missing at '+grade+'/'+section+'/'+level);
      for(const grade of ['prek','k','g1']) {
        for(const [key,shown] of Object.entries(samples)) {
          if(key.startsWith(grade+'/')&&shown)failures.push('Explorer leaked into '+key);
        }
      }
      return {failures:failures.slice(0,30),count:failures.length,samples};
    });
    assert.equal(result.count,0,JSON.stringify(result.failures,null,2));
    assert.deepEqual(errors,[]);
    console.log('PASS grade-specific Explorer routing across curriculum levels: '+JSON.stringify(result.samples));
  } finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
