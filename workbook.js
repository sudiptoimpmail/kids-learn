/* Illustrated variations within existing educational categories.
   Scene artwork is external SVG; hotspots and learning banks are external JSON.
   This file contains only the interactive learning engine and drawing controls. */
const IllustratedActivities = (() => {
  'use strict';
  const div = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // All eight authored workbook illustrations are separate local SVG media.
  // The wrapper remains an accessible SVG for legacy tracing and layout tests.
  const workbookArt = new Set(['savanna','garden','room','square-room','forest','sports','park','cafe']);
  function illustration(theme) {
    if (!workbookArt.has(theme)) throw Error('Unknown workbook picture ' + theme);
    const label = theme.replace('-', ' ') + ' illustrated learning scene';
    return '<svg class="ia-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-label="' + div(label) + '">' +
      '<image href="assets/workbook/' + theme + '.svg" x="0" y="0" width="800" height="480" preserveAspectRatio="xMidYMid meet"/></svg>';
  }
  const scenes = ContentData.get('workbook','scenes');
  const HIDDEN_CVC_WORDS = Object.freeze(ContentData.get('workbook','HIDDEN_CVC_WORDS'));
  const HIDDEN_CVC_DISTRACTORS = Object.freeze(ContentData.get('workbook','HIDDEN_CVC_DISTRACTORS'));
  const longA = ContentData.get('workbook','longA');
  const zebraLetters = ContentData.get('workbook','zebraLetters');
  const route = ContentData.get('workbook','route');
  const branches = ContentData.get('workbook','branches');
  const edges=[...route.slice(1).map((v,i)=>[route[i],v]),...branches];
  function available(grade,cat,level){
    return (grade==='k'&&['phonics','shape2'].includes(cat))||
      (grade==='g1' && (cat==='phonics'||cat==='match'||cat==='sent'||cat==='cvc'));
  }
  function make(grade,cat,level){
    if(!available(grade,cat,level))return null;
    let mode;
    if(grade==='k')mode=cat==='shape2'?(Math.random()<.5?'shapes':'squares'):(Math.random()<.55?'letters':'sounds');
    else mode=cat==='phonics'?'longa':cat==='match'?'forest':cat==='cvc'?'wordhunt':(Math.random()<.55?'sentence':'sequence');
    let text='', hint='Look at the picture!',theme='forest', answer='complete';
    if(mode==='letters'){text='Help the baby zebra! Follow the Z letters.';theme='savanna';}
    if(mode==='longa'){text='Follow the long A words to reach TAIL.';theme='forest';}
    if(mode==='sounds'){text='Find the eight pictures whose names start with the letter A.';theme='garden';}
    if(mode==='shapes'){text='Trace a circle, then find the four round things.';theme='room';}
    if(mode==='squares'){text='Trace a square, then find four square things.';theme='square-room';}
    if(mode==='wordhunt'){text='Find the ten hidden words in the garden.';theme='garden';}
    if(mode==='forest'){const words=['wind','leaf','climb','bird','jump','catch','wolf','water'];answer=words[Math.floor(Math.random()*words.length)];text='Find: '+answer.toUpperCase();theme='forest';}
    if(mode==='sentence'){const sentences=[
      ['The fox can ____.','jump','run','swim','fly','park'],
      ['The bird can ____.','fly','run','bark','dig','forest'],
      ['The fox is by the ____.','tree','milk','chair','rain','park'],
      ['The bird is in the ____.','tree','lake','chair','bag','forest']
    ];const s=sentences[Math.floor(Math.random()*sentences.length)];return {
      key:'ill-sentence-'+s[0],text:s[0].replace('____','_____'),say:'Which word fits?',main:'<div class="ia-stage ia-static-scene">'+illustration(s[5])+'</div>',mainClass:'ia-picture',
      options:[s[1],s[2],s[3],s[4]].sort(()=>Math.random()-.5).map(w=>({v:w,html:w})),answer:s[1],
      optClass:'opt-text',hint:{html:'Read the sentence and look at the picture.',say:'Look at the picture!'}
    };}
    if(mode==='sequence'){text='<span class="read-note">📖 Read the story. Then tap the pictures in story order.</span>';theme='park';}
    const voice = mode==='letters' ? ['Help the baby zebra reach its family.','Follow only the letter Z.'] :
      mode==='longa' ? 'Follow only words with the long A sound to reach TAIL.' :
      mode==='sounds' ? ['Tap all the pictures that start with','A'] :
      mode==='shapes' ? 'Tap all the circles you see.' :
      mode==='squares' ? 'Look at the picture!' :
      mode==='forest' ? ['Find the word.', answer] : mode==='wordhunt' ? 'Find the word.' : ['Read the story.','What happened first?'];
    return {key:'ill-'+mode+(mode==='forest'?'-'+answer:''),text,say:voice,
      parts: ['shapes','squares','sounds','sequence','wordhunt'].includes(mode) ? 4 : 1,
      main:'',options:[],answer,illustrated:{mode,theme},mainClass:'ia-picture',hint:{html:'Look at the picture and try again.',say:hint}};
  }
  function setFeedback(host,message){
    const out=host.querySelector('.ia-feedback'); if(out)out.textContent=message;
  }
  // Guided trace-then-find: a workbook shape is physically traced in sequence
  // before picture hotspots unlock. Samples are checked in stroke order so a
  // scribble, a single tap, or tracing a small fragment cannot complete the step.
  function mountShapeTrace(host,stage,kind,q,onComplete){
    const isSquare=kind==='squares';
    const path=isSquare?'M40 19 L120 19 L120 99 L40 99 L40 19':
      'M80 18 C121 18 122 98 80 98 C38 98 39 18 80 18';
    const box=document.createElement('div');
    box.className='ia-shape-step';
    box.innerHTML='<div class="ia-trace-heading"><b>1. Trace the '+(isSquare?'square':'circle')+'</b>'+
      '<small>Start at the green dot. Follow the dots with your finger.</small></div>'+
      '<svg class="ia-trace-shape" viewBox="0 0 160 120" role="img" aria-label="Trace the '+(isSquare?'square':'circle')+' from the green starting dot" tabindex="0">'+
      '<path class="ia-trace-guide" d="'+path+'" fill="none" stroke="#9ca9bc" stroke-width="8" stroke-dasharray="3 11" stroke-linecap="round"/>'+
      '<path class="ia-trace-ink" d="'+path+'" fill="none" stroke="#2fa86a" stroke-width="9" stroke-linecap="round"/>'+
      '<circle cx="'+(isSquare?'40':'80')+'" cy="'+(isSquare?'19':'18')+'" r="9" fill="#45bb79" stroke="#fff" stroke-width="3"/>'+
      '</svg>'+
      '<button type="button" class="ia-trace-assist" aria-label="Use a hint and continue to shape finding">Need tracing help? Continue with a hint</button>';
    host.insertBefore(box,stage);
    stage.classList.add('ia-shape-locked');
    const svg=box.querySelector('svg');
    const target=box.querySelector('.ia-trace-guide');
    const ink=box.querySelector('.ia-trace-ink');
    const length=target.getTotalLength();
    const samples=Array.from({length:64},(_,i)=>target.getPointAtLength(length*i/63));
    ink.style.strokeDasharray=String(length);
    ink.style.strokeDashoffset=String(length);
    let last=-1,active=false,finished=false;
    const location=e=>{
      const m=svg.getScreenCTM();if(!m)return null;
      const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
      return p.matrixTransform(m.inverse());
    };
    const finish=()=>{
      if(finished)return;
      finished=true;active=false;
      ink.style.strokeDashoffset='0';
      svg.classList.add('ia-trace-complete');
      box.querySelector('.ia-trace-assist').hidden=true;
      box.querySelector('.ia-trace-heading b').textContent='✓ Shape traced!';
      stage.classList.remove('ia-shape-locked');
      onComplete();
    };
    const move=e=>{
      if(!active||finished)return;
      const p=location(e);if(!p)return;
      if(last===-1){
        if(Math.hypot(p.x-samples[0].x,p.y-samples[0].y)>16)return;
        last=0;
      }
      let best=last,bestDistance=Infinity;
      // Only look forward a few samples; nearby segments on a corner cannot
      // allow skipping the entire outline.
      for(let i=last;i<=Math.min(last+7,samples.length-1);i++){
        const d=Math.hypot(p.x-samples[i].x,p.y-samples[i].y);
        if(d<bestDistance){bestDistance=d;best=i;}
      }
      if(bestDistance>17)return;
      last=best;
      ink.style.strokeDashoffset=String(length*(1-last/63));
      if(last>=61)finish();
    };
    svg.addEventListener('pointerdown',e=>{
      if(finished)return;
      active=true;
      try{svg.setPointerCapture(e.pointerId);}catch{}
      move(e);
    });
    svg.addEventListener('pointermove',move);
    svg.addEventListener('pointerup',()=>active=false);
    svg.addEventListener('pointercancel',()=>active=false);
    box.querySelector('.ia-trace-assist').addEventListener('click',()=>{
      // A motor-skill accommodation is a hint, never an unassisted success.
      q.hintShown=true;finish();
    });
  }
  function mount(q,host,actions){
    const mode=q.illustrated.mode;
    const info=scenes[mode];
    const stage=document.createElement('div');
    stage.className='ia-stage ia-'+mode;
    stage.innerHTML=illustration(q.illustrated.theme);
    host.append(stage);
    const note=document.createElement('p');note.className='ia-feedback';note.setAttribute('role','status');note.setAttribute('aria-live','polite');
    host.append(note);
    const progress=new Set();
    const correctAnswer=(button)=>actions.choose(q.answer,button);
    const good=msg=>{setFeedback(host,msg);if(typeof sfx!=='undefined')sfx.tap();};
    if(info){
      const required=mode==='forest'?[q.answer]:info.correct;
      const shapeTask=mode==='shapes'||mode==='squares';
      let traceReady=!shapeTask;
      info.items.forEach(([id,x,y])=>{
        const btn=document.createElement('button');
        btn.type='button';btn.className='ia-hotspot';btn.style.left=x+'%';btn.style.top=y+'%';
        btn.dataset.object=id;btn.setAttribute('aria-label','Select '+id);
        btn.innerHTML='<span class="ia-hotspot-ring" aria-hidden="true"></span>';
        if(shapeTask)btn.disabled=true;
        btn.addEventListener('click',()=>{
          if(btn.disabled)return;
          if(!required.includes(id)){actions.mistake();setFeedback(host,'Look closely. Try another picture.');return;}
          btn.disabled=true;btn.classList.add('ia-found');progress.add(id);
          if(progress.size===required.length)correctAnswer(btn);
          else good('You found '+progress.size+' of '+required.length+'. Keep looking!');
        });
        stage.append(btn);
      });
      if(shapeTask){
        mountShapeTrace(host,stage,mode,q,()=>{
          traceReady=true;
          stage.querySelectorAll('.ia-hotspot').forEach(button=>button.disabled=false);
          setFeedback(host,'Now find the '+info.correct.length+' matching shapes in the picture.');
        });
      }
      note.textContent=mode==='forest'?'Find the '+q.answer+'.':
        shapeTask?'Step 1: Trace the shape. Step 2: Find all four matching objects.':
        'Tap pictures to find all '+info.correct.length+'.';
    }else if(mode==='wordhunt'){
      const words=HIDDEN_CVC_WORDS.slice();
      const all=words.concat(HIDDEN_CVC_DISTRACTORS);
      const locations=[
        [15,26],[37,24],[60,24],[83,25],
        [15,52],[38,52],[61,52],[84,52],
        [27,80],[72,80],[49,79],[7,74],[93,76]
      ];
      const bank=document.createElement('div');
      bank.className='ia-wordhunt-bank';
      bank.innerHTML='<strong>Find and circle all ten:</strong> '+words.map(w=>'<span data-target="'+div(w)+'">'+div(w)+'</span>').join(' ');
      host.insertBefore(bank,stage);
      const found=document.createElement('div');
      found.className='ia-found-words';
      found.setAttribute('aria-live','polite');
      found.textContent='Found: 0 / 10';
      host.append(found);
      all.forEach((word,i)=>{
        const [x,y]=locations[i];
        const button=document.createElement('button');button.type='button';
        button.className='ia-hidden-word';button.dataset.word=word;
        button.textContent=word;button.setAttribute('aria-label','Find word '+word);
        button.style.left=x+'%';button.style.top=y+'%';
        button.addEventListener('click',()=>{
          if(button.disabled)return;
          if(!words.includes(word)){
            actions.mistake();setFeedback(host,'That word is not in the word bank. Try another.');return;
          }
          button.disabled=true;button.classList.add('ia-found');progress.add(word);
          bank.querySelectorAll('[data-target]').forEach(b=>{if(b.dataset.target===word)b.classList.add('ia-found');});
          found.textContent='Found: '+progress.size+' / '+words.length;
          if(progress.size===words.length)correctAnswer(button);
          else good('You found '+word+'! Look for the next word.');
        });
        stage.append(button);
      });
      note.textContent='Look carefully. Tap the small words hidden around the garden.';
    }else if(mode==='letters'||mode==='longa'){
      const labels=mode==='letters'?zebraLetters:longA;
      const valid=v=>mode==='letters'?v==='Z':/^(gate|name|date|rain|mail|paid|page|lake|cake|make|tail|wave|bake|plane|cane)$/.test(v);
      const linkSet=new Set(edges.flatMap(([a,b])=>[a+'-'+b,b+'-'+a]));
      const point=i=>[19+(i%5)*15.5,19+Math.floor(i/5)*15.1];
      const connections='<svg class="ia-connections" viewBox="0 0 800 480" preserveAspectRatio="none" aria-hidden="true">'+edges.map(([a,b])=>{
        const A=point(a),B=point(b);return '<line x1="'+(A[0]*8)+'" y1="'+(A[1]*4.8)+'" x2="'+(B[0]*8)+'" y2="'+(B[1]*4.8)+'" stroke="#ac764e" stroke-width="31" stroke-linecap="round"/>'+
        '<line x1="'+(A[0]*8)+'" y1="'+(A[1]*4.8)+'" x2="'+(B[0]*8)+'" y2="'+(B[1]*4.8)+'" stroke="#ead09b" stroke-width="23" stroke-linecap="round"/>';
      }).join('')+'</svg>';
      stage.insertAdjacentHTML('beforeend',connections);
      let trail=[];
      labels.forEach((label,i)=>{
        const [x,y]=point(i),button=document.createElement('button');
        button.type='button';button.className='ia-stone';button.style.left=x+'%';button.style.top=y+'%';
        button.textContent=label;button.dataset.cell=String(i);
        button.setAttribute('aria-label',(i===0?'Start, ':'')+label+(i===24?', finish':''));
        if(i===0)button.classList.add('ia-start');
        if(i===24)button.classList.add('ia-finish');
        button.addEventListener('click',()=>{
          const last=trail[trail.length-1];
          if(!trail.length && i!==0){setFeedback(host,'Start on the yellow stone.');return;}
          if(trail.length>1 && i===trail[trail.length-2]){
            const removed=trail.pop();stage.querySelector('[data-cell="'+removed+'"]').classList.remove('ia-visited');
            setFeedback(host,'Try another path.');return;
          }
          if(last===i)return;
          if(trail.length && (!linkSet.has(last+'-'+i)||trail.includes(i))){setFeedback(host,'Choose a connected stone, or go back one step.');return;}
          if(!valid(label)){actions.mistake();setFeedback(host,'Not the right '+(mode==='letters'?'letter':'vowel sound')+'. Try again.');return;}
          trail.push(i);button.classList.add('ia-visited');
          if(i===24){correctAnswer(button);return;}
          good('Good! '+trail.length+' stones. Keep going.');
        });
        stage.append(button);
      });
      note.textContent='Start at the yellow stone. You can go back to try a different path.';
      q.illHint=()=>setFeedback(host,'Follow connected '+(mode==='letters'?'Z letters':'long A words')+'. Backtrack at a dead end.');
    } else if(mode==='sequence'){
      const story=document.createElement('div');
      story.className='ia-story';
      story.innerHTML='<p>A fox saw an apple. The fox ran to the tree. It jumped. The apple fell down.</p>';
      host.insertBefore(story,stage);
      host.classList.add('ia-seq');   // the story is the focus: big text, pictures beside it on wide screens
      const cards=[
        {id:2,label:'Fox jumps',mark:'↗',desc:'The fox jumps.'},
        {id:0,label:'Fox sees apple',mark:'?',desc:'The fox sees an apple.'},
        {id:3,label:'Apple falls',mark:'↓',desc:'The apple falls.'},
        {id:1,label:'Fox runs',mark:'→',desc:'The fox runs to the tree.'}
      ];
      const tray=document.createElement('div');tray.className='ia-story-cards';
      cards.forEach(card=>{
        const b=document.createElement('button');b.type='button';b.className='ia-story-card';b.dataset.step=card.id;
        const x=card.id===0?45:card.id===1?82:card.id===2?85:51;
        const y=card.id===2?76:110;
        const motion=card.id===1?'<path d="M9 60 h30 M7 74 h23 M21 89 h24" stroke="#d49a56" stroke-width="5" stroke-linecap="round"/>':
          card.id===2?'<path d="M23 70 Q52 18 89 38" fill="none" stroke="#c47f55" stroke-width="5" stroke-dasharray="6 7"/>':
          card.id===3?'<path d="M140 44 V86 M132 73 l8 13 8 -13" stroke="#af5447" stroke-width="5" fill="none"/>':'';
        const appleY=card.id===3?80:24;
        b.innerHTML='<span class="ia-story-art"><svg viewBox="0 0 180 115" aria-hidden="true">'+
          '<rect width="180" height="115" rx="13" fill="#d9f2ca"/>'+
          '<path d="M0 83 Q70 62 180 86 V115 H0Z" fill="#8ac079"/>'+
          (card.id===0||card.id===1?'<path d="M140 90 V38" stroke="#8e6947" stroke-width="8"/>'+
            '<circle cx="140" cy="28" r="31" fill="#71af6b"/>':'')+
          '<circle cx="140" cy="'+appleY+'" r="17" fill="#e65350" stroke="#a94141" stroke-width="4"/>'+
          '<path d="M139 '+(appleY-16)+' q5 -11 17 -9" stroke="#427e3d" stroke-width="5" fill="none"/>'+
          '<image href="assets/illustrations/fox.svg" x="'+(x-33)+'" y="'+(y-63)+'" width="68" height="75"/>'+motion+
          '</svg></span><b class="ia-event-number" aria-hidden="true">?</b>';
        b.setAttribute('aria-label',card.desc);
        b.addEventListener('click',()=>{
          if(b.disabled)return;
          const k=progress.size;if(card.id!==k){actions.mistake();setFeedback(host,'Read what happened next. Try again.');return;}
          b.disabled=true;b.classList.add('ia-found');b.querySelector('b').textContent=String(k+1);progress.add(card.id);
          if(progress.size===4)correctAnswer(b);
          else good('Good! What happens next?');
        });
        tray.append(b);
      });
      host.append(tray);
      note.textContent='Tap the picture for event 1, then 2, 3 and 4.';
      stage.classList.add('ia-small-scene','ia-seq-scene');   // the cards are the pictures; no extra scene competing with the text
      q.illHint=()=>setFeedback(host,'Read the story from the beginning. Start with what the fox saw.');
    }
    return stage;
  }
  const traceScene=(mode)=>illustration(['sports','garden','cafe','forest'].includes(mode)?mode:'park');
  const coverage=()=>({hiddenWords:HIDDEN_CVC_WORDS.slice(), a:scenes.sounds.correct.slice(), circles:scenes.shapes.correct.slice(), squares:scenes.squares.correct.slice(), forest:scenes.forest.items.map(x=>x[0])});
  return {available,make,mount,illustration,traceScene,coverage};
})();
