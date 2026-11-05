/* Curriculum accuracy, breadth, age-banding and interaction regression.
 * Uses the real running app to catch dynamically generated wrong answers. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.locator('#startBtn').click();
    await page.evaluate(()=>clipsReady);
    const result = await page.evaluate(()=>{
      const problems=[],check=(condition,message)=>{if(!condition)problems.push(message)};
      check(GK.length>=125,'General knowledge bank too small');
      check(SCIENCE.length>=110,'Science facts bank too small');
      check(G1_PASSAGES.length>=22,'Multi-question reading bank too small');
      check(G1_ORDER.length>=19,'Story ordering bank too small');
      check(PHOTO_NAMES.length===16,'Expected offline photo manifest');
      check(PHOTO_PUZZLE.length>=12,'Too few picture-puzzle themes');
      for(const [name,rows] of [['GK',GK],['SCIENCE',SCIENCE]]){
        const prompts=new Set();
        for(const [level,prompt,correct,...wrong] of rows){
          check(level>=1&&level<=4,name+' bad grade level: '+prompt);
          check(!prompts.has(prompt),name+' repeated question: '+prompt);prompts.add(prompt);
          check(wrong.length>=2,name+' insufficient distractors: '+prompt);
          check(new Set([correct,...wrong].map(String)).size===wrong.length+1,name+' duplicate answer: '+prompt);
        }
      }
      check(!OPPOSITES.some(([a,b])=>['he','she','boy','girl','mother','father','sister','brother'].includes(a)||['he','she','boy','girl','mother','father','sister','brother'].includes(b)),'Non-antonym gender pair found');
      check(!SCI_SORT.some(row=>row[3].some(item=>item[0]==='smoke'&&item[2]===2)),'Smoke incorrectly classified as a gas');
      const fails=[];
      const valid=q=>{
        if(!q||!q.key||!q.text) return false;
        if(q.options?.length && !q.multi && q.answer!=='done' && !q.spell && !q.match) {
          if(q.options.filter(o=>String(o.v)===String(q.answer)).length!==1) return false;
          if(new Set(q.options.map(o=>String(o.v))).size!==q.options.length)return false;
        }
        return true;
      };
      for(let level=1;level<=5;level++){
        let measures=0;let kinds=new Set();
        for(let i=0;i<350;i++){
          const q=genNumSense(level); check(valid(q),'Invalid Number Sense question: '+q?.key);
          if(q.key.startsWith('ns-measure-')||q.key.startsWith('ns-data-'))measures++;
          const parts=q.key.split('-');
          if(parts[0]==='ns'&&parts[1]==='measure'&&['area','perimeter'].includes(parts[2])){
            const w=Number(parts[3]),h=Number(parts[4]);
            check(Number(q.answer)===(parts[2]==='area'?w*h:2*(w+h)),'Wrong geometry answer: '+q.key);
          }
          if(parts[0]==='ns'&&parts[1]==='measure'&&parts[2]==='longer'){
            check(q.answer===(Number(parts[3])>Number(parts[4])?'A':'B'),'Wrong length comparison: '+q.key);
          }
          if(parts[0]==='ns'&&parts[1]==='data'&&['most','difference'].includes(parts[2])){
            const values=parts.slice(3).map(Number);
            const expected=parts[2]==='difference'?String(Math.max(...values)-Math.min(...values)):
              ['apples','bananas','grapes'][values.indexOf(Math.max(...values))];
            check(String(q.answer)===expected,'Wrong graph answer: '+q.key);
          }
          kinds.add(q.key.split('-').slice(0,3).join('-'));
          const pattern=genPattern(level);
          check(valid(pattern),'Invalid pattern answer: '+pattern?.key);
        }
        check(measures>=45,'Measurement and data insufficiently mixed at level '+level+': '+measures);
        check(kinds.size>=4,'Too few Number Sense formats at level '+level+': '+kinds.size);
      }
      // K never gets Grade 1's longer word-box, passage or ordering cards.
      for(let i=0;i<500;i++) {
        const q=genSentence(2);
        check(!/^(sent-box|sent-pass|sent-order)-/.test(q.key),'Grade 1 reading variation leaked into Kindergarten: '+q.key);
      }
      for(let level=1;level<=4;level++)for(let i=0;i<90;i++){
        const q=genScience(level);
        check(valid(q),'Malformed science question: '+q?.key);
        const spoken=Array.isArray(q.say)?q.say:[q.say];
        for(const p of spoken)check(!p||!!CLIPS[clipKey(p)],'Science question has no prerecorded voice: '+p);
      }
      for(const grade of ['prek','k','g1','g2','g3']){
        state.grade=grade; state.showAll=false; state.testMode=false;
        const ids=['phonics','gk','add','sub','shape2','pattern','odd','sequence','sent','numsense','sci'];
        for(const id of ids){
          const allowed=gradeRange(grade,id);
          if(!allowed)continue;
          state.levels[id]=99; // Simulate a stale saved level from another grade.
          startRound(id,5);
          for(const q of R.qs){
            check(q.grades.includes(grade),'Grade leak: '+grade+'/'+id+'/'+q.key);
            check(q.level<=allowed[1],'Unclamped level: '+grade+'/'+id+'/'+q.key);
            check(valid(q),'Invalid child question: '+grade+'/'+id+'/'+q.key);
          }
        }
      }
      check(document.querySelector('#hintBox').parentElement.id==='play','Hints must be outside question card');
      return {problems:problems.slice(0,40),count:problems.length,passages:G1_PASSAGES.length,orders:G1_ORDER.length,
        science:SCIENCE.length,gk:GK.length,photos:PHOTO_NAMES.length};
    });
    assert.equal(result.count,0,JSON.stringify(result,null,2));
    const sw=fs.readFileSync('sw.js','utf8');
    const photos=fs.readFileSync('photos.js','utf8');
    for(const name of ['cat','dog','rabbit','duck','elephant','tiger','butterfly','horse','sunflower','rose','tulip','daisy','car','airplane','helicopter','truck'])
      assert.ok(sw.includes('assets/photos/'+name+'.jpg'),'Missing offline image: '+name);
    assert.ok(photos.includes('photoImage'),'Picture library renderer missing');
    assert.deepEqual(errors,[],errors.join('\n'));
    console.log('PASS deep curriculum audit',result);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
