const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
   const page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://localhost:8765/index.html');
   await page.locator('#startBtn').click();
   await page.evaluate(()=>clipsReady);
   const result=await page.evaluate(()=>{
     const errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg)};
     check(PHOTO_NAMES.length===16,'Expected original 16 photo assets');
     check(ILLUSTRATION_NAMES.length===84,'Missing 84 new illustrated subjects');
     check(VISUAL_NAMES.length===100,'100-asset total not met');
     check(new Set(VISUAL_NAMES).size===100,'Asset subjects are not unique');
     check(ILLUSTRATION_PUZZLE.length===84,'Missing illustrated puzzle themes');
     const categories=Object.keys(ILLUSTRATION_GROUPS);
     check(categories.length===7,'Expected seven illustrated learning groups');
     check(Object.values(ILLUSTRATION_GROUPS).every(a=>a.length===12),'Group should contain 12 assets');
     for(const name of VISUAL_NAMES){
       const path=visualPath(name),img=visualImage(name);
       check(!!path&&!!img.includes(path)&&!!img.includes('alt='),'Missing image: '+name);
     }
     for(const lv of [1,2]){
       for(let i=0;i<600;i++){
         const q=genGK(lv);
         if(!q.key.startsWith('visual-'))continue;
         check(q.options.length===numOpts(lv),'Wrong image option count: '+q.key);
         check(q.options.filter(x=>x.v===q.answer).length===1,'Ambiguous visual answer: '+q.key);
         check(new Set(q.options.map(x=>x.v)).size===q.options.length,'Repeated visual choice: '+q.key);
         check(q.options.every(x=>x.html.includes('assets/illustrations/')),'External/emoji visual answer: '+q.key);
         const clips=Array.isArray(q.say)?q.say:[q.say];
         for(const clip of clips)check(!!CLIPS[clipKey(clip)],'Missing spoken visual clip: '+clip);
       }
     }
     for(const grade of ['prek','k','g1','g2','g3']){
       state.grade=grade;state.testMode=false;state.showAll=false;
       openDashboard('home');
       const rec=[...document.querySelectorAll('#dashNext [data-practice]')];
       check(rec.length>0&&rec.length<=3,'Missing practice cards for '+grade);
       for(const btn of rec)check(!!gradeRange(grade,btn.dataset.practice),'Above-grade recommendation: '+grade+'/'+btn.dataset.practice);
     }
     state.grade='prek';renderDashboard();
     const button=document.querySelector('#dashNext [data-practice]');
     if(button){button.click();check(document.querySelector('#play').classList.contains('active'),'Practice recommendation failed to open learning round');}
     startPuzzleMenu();
     const choices=[...document.querySelectorAll('#gameArea .pic-pick')];
     check(choices.some(x=>x.dataset.p.startsWith('illustration-')),'Puzzle gallery has no illustration choices');
     check(choices.some(x=>x.dataset.p.startsWith('photo-')),'Photo puzzles were removed');
     return errors.slice(0,40);
   });
   assert.deepEqual(result,[],result.join('\n'));
   const visuals=JSON.parse(fs.readFileSync('data/visuals.json','utf8')).datasets;
   assert.equal(Object.values(visuals.ILLUSTRATION_GROUPS).flat().length,84,'Illustration data manifest incomplete');
   const manifest=fs.readFileSync('sw.js','utf8');
   const visualFiles=[...manifest.matchAll(/["']assets\/illustrations\/([a-z_]+\.svg)["']/g)].map(m=>m[1]);
   assert.equal(visualFiles.length,84,'Offline service worker must precache exactly 84 illustrations');
   assert.equal(new Set(visualFiles).size,84,'Duplicate service-worker art file');
   for(const file of visualFiles){
     const path='assets/illustrations/'+file;
     assert.ok(fs.existsSync(path),'Missing committed art file: '+path);
     const svg=fs.readFileSync(path,'utf8');
     assert.ok(svg.includes('<svg')&&svg.includes('viewBox'),'Invalid SVG: '+path);
     assert.ok(!/https?:\/\//.test(svg.replace(/xmlns="[^"]*"/g,'')),'External asset dependency in '+path);
   }
   assert.ok(fs.existsSync('assets/illustrations/ATTRIBUTION.md'),'Missing required CC BY 4.0 attribution');
   assert.deepEqual(errors,[],errors.join('\n'));
   console.log('PASS 100 locally stored assets, offline manifest, child-level visual questions, puzzles and parent practice cards');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});