// Samples every grade/category/allowed level and checks generated question and
// referenced image integrity. This is a runtime smoke audit, NOT an assertion
// that every randomized question is pedagogically unambiguous.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.goto('http://localhost:8765/index.html');
  await page.evaluate(()=>window.KidsLearnReady);
  const result=await page.evaluate(()=>{
    const errors=[],samples={},assets=new Set();
    for(const grade of ['prek','k','g1','g2','g3']){
      state.grade=grade;
      for(const category of CATEGORIES.filter(c=>typeof c.gen==='function')){
        const range=gradeRange(grade,category.id);
        if(!range)continue;
        for(let level=range[0];level<=range[1];level++){
          const key=grade+'/'+category.id+'/'+level, seen=new Set();
          let checked=0;
          for(let i=0;i<40;i++){
            let q;try{q=category.gen(level)}catch(err){errors.push(key+' generator exception '+String(err).slice(0,100));break}
            if(!q||!q.key||!q.text||q.answer==null){errors.push(key+' invalid question object');continue}
            checked++;seen.add(String(q.key));
            if(!Array.isArray(q.options)){errors.push(key+' missing answer options array');continue}
            const special=!!(q.spell||q.puzzle||q.order||q.match||q.tap||q.body3d||q.fillIn||q.passageFill||q.multi||q.letterPath||q.illustrated);
            if(q.options.length&&!special){
              const vals=q.options.map(o=>String(o.v));
              if(vals.filter(v=>v===String(q.answer)).length!==1)errors.push(key+' answer missing or duplicated: '+q.key);
              if(new Set(vals).size!==vals.length)errors.push(key+' duplicate choice: '+q.key);
            }
            const div=document.createElement('template');
            div.innerHTML=String(q.main||'')+String(q.hint?.html||'')+q.options.map(o=>String(o.html||'')).join('');
            for(const img of div.content.querySelectorAll('img[src]')){
              const src=img.getAttribute('src');
              if(src&&!/^(https?:|data:|blob:)/i.test(src))assets.add(src.split('?')[0]);
              if(/^https?:/i.test(src))errors.push(key+' image requires network: '+src);
            }
          }
          samples[key]={checked,unique:seen.size};
          if(checked===0)errors.push(key+' zero generated questions');
        }
      }
    }
    return {errors:errors.slice(0,100),totalErrors:errors.length,samples,assets:[...assets]};
  });
  const missing=[];
  for(const p of result.assets){
    try{const resp=await page.request.get('http://localhost:8765/'+p);if(!resp.ok())missing.push(p+': HTTP '+resp.status())}
    catch(err){missing.push(p+': '+err.message)}
  }
  assert.equal(result.totalErrors,0,JSON.stringify(result.errors.slice(0,25),null,2));
  assert.equal(missing.length,0,'Missing/failed image assets: '+missing.join(', '));
  console.log('PASS '+Object.keys(result.samples).length+' grade×section×level combinations; '+result.assets.length+' locally referenced image assets verified');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
