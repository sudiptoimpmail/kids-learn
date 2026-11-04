/* Illustrated variations within existing educational categories.
   Original self-contained SVG scenes, predictable hotspots, no external assets. */
const IllustratedActivities = (() => {
  'use strict';
  const div = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = (x,y,s,body) => '<g transform="translate('+x+' '+y+') scale('+(s||1)+')">'+body+'</g>';
  const tree = (x,y,s=1) => el(x,y,s,
    '<ellipse cx="0" cy="5" rx="105" ry="19" fill="#416d38" opacity=".18"/>'+
    '<path d="M-22 0 L-30 -160 L-67 -208 L-50 -220 L-5 -185 L15 -258 L39 -253 L20 -180 L72 -211 L85 -195 L27 -146 L22 0Z" fill="#a36c46" stroke="#795039" stroke-width="7" stroke-linejoin="round"/>'+
    '<path d="M-8 -50 L-15 -143 M16 -132 L30 -172" stroke="#ce9668" stroke-width="6" fill="none"/>'+
    '<g fill="#4ba569" stroke="#397d50" stroke-width="6"><circle cx="-65" cy="-204" r="72"/><circle cx="12" cy="-258" r="86"/><circle cx="95" cy="-205" r="70"/><circle cx="5" cy="-172" r="80"/></g>'+
    '<path d="M-90 -229 q30 -34 57 -25 M30 -290 q25 -23 47 -6" stroke="#99de86" stroke-width="12" fill="none" opacity=".8"/>');
  const cloud=(x,y,s=1)=>el(x,y,s,'<path d="M-58 18 Q-77 -4 -52 -26 Q-29 -42 -12 -21 Q1 -66 43 -46 Q61 -40 62 -14 Q95 -9 88 23 Q83 39 54 37 L-43 37 Q-65 35 -58 18Z" fill="#fff" stroke="#d9edf7" stroke-width="4"/>');
  const bloom=(x,y,color='#fcf6b8',s=1)=>el(x,y,s,'<path d="M0 0 Q10 24 0 57" stroke="#458e58" stroke-width="6" fill="none"/>'+[0,60,120,180,240,300].map(a=>'<ellipse cx="0" cy="-17" rx="10" ry="18" fill="'+color+'" stroke="#e6b67b" stroke-width="1.5" transform="rotate('+a+')"/>').join('')+'<circle r="12" fill="#e5a94a" stroke="#ac7545" stroke-width="3"/>');
  const fox=(x,y,s=1)=>el(x,y,s,'<ellipse cy="8" rx="85" ry="13" fill="#507b48" opacity=".17"/>'+
    '<path d="M-26 -48 Q-137 -112 -123 -40 Q-119 -4 -74 -15 L-31 -24Z" fill="#e49252" stroke="#a95f40" stroke-width="6"/>'+
    '<path d="M-110 -49 Q-126 -12 -72 -15 Q-54 -21 -55 -29" fill="#fff3d7"/>'+
    '<ellipse cx="6" cy="-53" rx="57" ry="44" fill="#ed9d57" stroke="#a65c3d" stroke-width="6"/>'+
    '<path d="M-26 -24 l-5 32 M31 -21 l10 29" fill="none" stroke="#be6e48" stroke-width="15"/>'+
    '<path d="M32 -87 L50 -148 L78 -108 L110 -148 L134 -86" fill="#e98d46" stroke="#a65c3d" stroke-width="6"/>'+
    '<ellipse cx="83" cy="-88" rx="50" ry="40" fill="#ed9955" stroke="#a65c3d" stroke-width="6"/>'+
    '<path d="M46 -74 Q83 -33 123 -73 L110 -44 L57 -44Z" fill="#fff5df"/>'+
    '<circle cx="66" cy="-96" r="6" fill="#28313a"/><circle cx="101" cy="-96" r="6" fill="#28313a"/>'+
    '<ellipse cx="84" cy="-72" rx="9" ry="7" fill="#503a3f"/>');
  const zebra=(x,y,s=1)=>el(x,y,s,
    '<ellipse cy="8" rx="77" ry="12" fill="#678350" opacity=".25"/>'+
    '<path d="M-64 -80 Q-27 -108 57 -94 Q81 -86 66 -45 Q39 -21 -61 -36Z" fill="#fff9ed" stroke="#414c53" stroke-width="6"/>'+
    '<path d="M41 -79 Q58 -134 86 -155 L112 -141 Q105 -99 69 -53" fill="#fffaf0" stroke="#414c53" stroke-width="6"/>'+
    '<path d="M-50 -40 l-2 47 M-12 -37 l-2 44 M43 -37 l2 44 M67 -44 l2 50" stroke="#414c53" stroke-width="15"/>'+
    '<path d="M-50 -40 l-2 42 M-12 -37 l-2 39 M43 -37 l2 39 M67 -44 l2 44" stroke="#fffaf0" stroke-width="8"/>'+
    '<path d="M-57 -93 l27 46 M-20 -101 l30 59 M16 -100 l32 60 M50 -94 l14 44 M78 -148 l12 30 M98 -142 l-5 31" stroke="#414c53" stroke-width="12"/>'+
    '<path d="M88 -151 Q83 -187 105 -185 L117 -158 M111 -149 Q132 -180 142 -159" fill="#f7cfbc" stroke="#414c53" stroke-width="5"/>'+
    '<ellipse cx="117" cy="-141" rx="28" ry="23" fill="#fff9ef" stroke="#414c53" stroke-width="6"/>'+
    '<ellipse cx="133" cy="-134" rx="16" ry="11" fill="#b8bfc0"/><circle cx="110" cy="-152" r="5" fill="#26323a"/>'+
    '<path d="M-67 -82 Q-90 -98 -99 -132" fill="none" stroke="#414c53" stroke-width="7"/>');
  const bird=(x,y,s=1)=>el(x,y,s,
    '<path d="M-30 -5 Q-71 -41 -49 -55 Q-17 -55 -1 -22" fill="#689dc4" stroke="#385b8a" stroke-width="5"/>'+
    '<ellipse rx="39" ry="30" fill="#74a7d6" stroke="#385b8a" stroke-width="5"/>'+
    '<circle cx="24" cy="-16" r="26" fill="#9bc4e6" stroke="#385b8a" stroke-width="5"/>'+
    '<path d="M46 -14 l25 10 -25 11" fill="#f0ac50" stroke="#b97a3c" stroke-width="3"/>'+
    '<circle cx="28" cy="-23" r="5" fill="#27323e"/><path d="M-13 3 q24 -38 43 -4 q-25 22 -43 4" fill="#c4dded"/>'+
    '<path d="M-8 22 l-4 25 M11 25 l2 22" fill="none" stroke="#c58e4e" stroke-width="5"/>');
  const ant=(x,y,s=1)=>el(x,y,s,
    '<g fill="#3e4756" stroke="#2d3748" stroke-width="4"><ellipse cx="-34" rx="26" ry="20"/><ellipse cx="0" cy="-5" rx="18" ry="17"/>'+
    '<circle cx="31" cy="-14" r="19"/><path d="M-38 8 l-23 26 M-37 -9 l-25 -27 M-4 10 l-14 27 M5 12 l15 28 M8 -15 l12 -22 M-11 -15 l-13 -23 M32 -30 q2 -24 17 -22 M22 -26 q-13 -20 -26 -15" fill="none"/>'+
    '<circle cx="38" cy="-18" r="5" fill="#fff"/></g>');
  const base=(green=true)=>'<rect width="800" height="480" fill="#b8e5f8"/>'+
    '<path d="M0 297 Q140 210 305 296 T610 274 T800 284 V480 H0Z" fill="'+(green?'#c5e7a2':'#d0d596')+'"/>'+
    '<path d="M0 354 Q240 274 425 352 T800 327 V480 H0Z" fill="'+(green?'url(#iaGrass)':'#abbc7c')+'"/>'+
    '<circle cx="692" cy="77" r="42" fill="#ffdb75" stroke="#edb45b" stroke-width="6"/>'+cloud(122,66,.85)+cloud(476,95,.58);
  const defs='<defs><linearGradient id="iaGrass" x2="0" y2="1"><stop stop-color="#9ed582"/><stop offset="1" stop-color="#51a56c"/></linearGradient>'+
    '<linearGradient id="iaLake" x2="0" y2="1"><stop stop-color="#77d2e5"/><stop offset="1" stop-color="#c3f4f6"/></linearGradient>'+
    '<pattern id="iaTexture" width="29" height="24" patternUnits="userSpaceOnUse"><circle cx="6" cy="10" r="2" fill="#fff" opacity=".25"/><circle cx="21" cy="19" r="2" fill="#397b4c" opacity=".16"/></pattern></defs>';
  const wrap=(inner,label)=>'<svg class="ia-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-label="'+div(label)+'" preserveAspectRatio="xMidYMid meet">'+defs+inner+'</svg>';
  function illustration(theme){
    if(theme==='savanna') return wrap(base(false)+tree(82,367,.48)+tree(734,362,.52)+
      zebra(106,459,.53)+zebra(712,450,.76)+bloom(60,409,'#ffe2af',.7)+bloom(751,387,'#fff0af',.7),
      'Baby zebra and parent on a sunny savanna with winding paths');
    if(theme==='garden')return wrap(base()+tree(327,341,1.05)+tree(746,337,.54)+
      '<path d="M0 424 Q300 380 800 423 V480 H0Z" fill="#7ac173"/>'+
      el(292,168,1,'<path d="M0 15 Q-46 -44 0 -50 Q50 -50 37 17 Q12 48 -16 36Z" fill="#e95458" stroke="#a94146" stroke-width="6"/>'+
        '<path d="M12 -39 Q16 -72 39 -69 Q31 -43 12 -39" fill="#78b25d" stroke="#397d4b" stroke-width="4"/>')+
      ant(389,402,.86)+
      el(614,251,1,'<path d="M-35 -3 Q-25 -36 6 -37 Q36 -20 32 6 Q4 26 -35 -3Z" fill="#a97145" stroke="#724c3c" stroke-width="5"/><path d="M-35 -6 Q0 -27 32 -8" fill="none" stroke="#6f4b36" stroke-width="13"/><path d="M-20 -13 l-10 -15 M-5 -22 l-3 -17 M12 -19 l10 -13" stroke="#d7ac76" stroke-width="5"/>')+
      el(580,104,.82,'<path d="M-75 5 L13 -3 L78 10 L13 16 L-75 5 M-4 -12 L19 -63 L38 -61 L26 -4 M6 14 L-5 58 L14 57 L28 11" fill="#fbfcff" stroke="#5276ab" stroke-width="5"/><rect x="-51" y="1" width="32" height="8" rx="3" fill="#729cc7"/>')+
      el(117,145,.85,'<ellipse rx="31" ry="19" fill="#ffca55" stroke="#aa8547" stroke-width="5"/><path d="M-16 -16 L3 -16 M-16 -2 L3 -2" stroke="#6b5550" stroke-width="7"/><ellipse cx="-8" cy="-25" rx="22" ry="13" fill="#f6ffff" stroke="#95c5c8" stroke-width="3"/><circle cx="22" cy="-5" r="4"/>')+
      el(150,389,.9,'<ellipse cx="0" cy="-23" rx="43" ry="34" fill="#c49a72" stroke="#82634e" stroke-width="6"/>'+
        '<circle cx="-30" cy="-52" r="18" fill="#a88060" stroke="#82634e" stroke-width="5"/><circle cx="30" cy="-52" r="18" fill="#a88060" stroke="#82634e" stroke-width="5"/>'+
        '<circle cx="-13" cy="-22" r="4"/><circle cx="13" cy="-22" r="4"/><ellipse cy="-8" rx="13" ry="9" fill="#4b4849"/>')+
      bloom(68,427,'#fff4ad',.8)+bloom(687,414,'#f9c2d2',.77),
      'Illustrated garden with an apple, ant, acorn, airplane, bee and dog');
    if(theme==='room')return wrap(
      '<rect width="800" height="480" fill="#fff5df"/><rect y="330" width="800" height="150" fill="#e8c49f"/>'+
      '<path d="M0 330 H800" stroke="#ba8d71" stroke-width="13"/>'+
      '<rect x="288" y="60" width="193" height="176" rx="10" fill="#94d2ea" stroke="#8b705d" stroke-width="14"/>'+
      '<path d="M382 65 V235 M291 147 H476" stroke="#8b705d" stroke-width="9"/>'+
      '<path d="M298 126 Q351 93 377 121" fill="none" stroke="#fff" stroke-width="8" opacity=".6"/>'+
      '<rect x="660" y="119" width="99" height="242" rx="8" fill="#c18a63" stroke="#8e614d" stroke-width="10"/>'+
      '<circle cx="734" cy="244" r="9" fill="#ffe39c"/>'+
      '<circle cx="191" cy="128" r="61" fill="#fffdfa" stroke="#ad7657" stroke-width="9"/>'+
      '<path d="M191 128 V82 M191 128 l33 19" fill="none" stroke="#596875" stroke-width="8" stroke-linecap="round"/>'+
      '<circle cx="191" cy="128" r="8" fill="#596875"/>'+
      '<ellipse cx="586" cy="143" rx="81" ry="36" fill="#fff8f4" stroke="#bb845e" stroke-width="10"/>'+
      '<ellipse cx="586" cy="139" rx="57" ry="19" fill="#aad8ad"/>'+
      '<circle cx="209" cy="354" r="68" fill="#fff" stroke="#43566e" stroke-width="10"/>'+
      '<path d="M209 286 l36 45 -20 54 -54 -10 -24 -41 M177 312 l60 54 M209 354 l-18 41" stroke="#40536a" stroke-width="9" fill="none"/>'+
      '<circle cx="588" cy="365" r="64" fill="#ef9e4b" stroke="#9e6c43" stroke-width="9"/>'+
      '<path d="M588 302 Q620 328 588 365 T588 427 M522 365 H653" stroke="#f6dfad" stroke-width="7" fill="none"/>'+
      '<rect x="364" y="370" width="120" height="75" rx="8" fill="#718db5" stroke="#536d91" stroke-width="8"/>'+
      '<path d="M374 378 l95 59 M472 378 l-95 59" stroke="#e2eaf6" stroke-width="7"/>',
      'Bright playroom with circular clock, plate, wheel and ball, plus rectangular door and book');
    if(theme==='forest')return wrap(base()+tree(175,396,.88)+tree(752,396,.65)+
      '<path d="M503 346 Q634 362 568 420 Q536 441 599 480 H756 Q669 431 722 409 Q760 363 653 340Z" fill="url(#iaLake)" stroke="#69bfd6" stroke-width="6"/>'+
      '<path d="M557 403 q34 15 56 -2 M609 438 q23 5 43 -10" stroke="#eeffff" stroke-width="7" fill="none"/>'+
      bird(640,164,.8)+fox(175,431,.65).replace(/#e49252|#ed9d57|#e98d46|#ed9955/g,'#7d8e9f')+
      el(344,172,1,'<path d="M0 0 Q-30 -57 17 -66 Q70 -51 0 0Z" fill="#8bc879" stroke="#397d52" stroke-width="7"/><path d="M0 0 L25 -49" stroke="#367c4e" stroke-width="4"/>')+
      bloom(370,423,'#fff4b2',.68)+bloom(443,432,'#ffe1ed',.7),
      'Green woodland with leaf, bird, forest animal and winding stream');
    if(theme==='park')return wrap(base()+tree(680,370,.67)+fox(198,423,.82)+
      el(458,348,1,'<ellipse cy="33" rx="34" ry="11" fill="#568a3f" opacity=".2"/>'+
      '<path d="M-6 -8 l2 48" stroke="#786044" stroke-width="8"/><path d="M-28 -12 Q-31 -57 11 -47 Q37 -22 8 6 Q-10 12 -28 -12Z" fill="#e64b58" stroke="#ab3544" stroke-width="6"/>'+
      '<path d="M4 -43 q3 -18 18 -15" fill="none" stroke="#4d8e46" stroke-width="5"/>')+
      bloom(70,409,'#ffe8a9',.8)+bloom(581,398,'#fff',.83),
      'Little fox beside an apple tree in a sunny park');
    if(theme==='sports')return wrap(base()+
      el(103,375,.82,'<circle cy="-89" r="43" fill="#c18d6c" stroke="#885e51" stroke-width="6"/>'+
      '<path d="M-39 -110 Q-30 -151 20 -141 L50 -120 L-30 -114" fill="#f0614f" stroke="#af4b42" stroke-width="6"/>'+
      '<path d="M-24 -45 Q-59 24 -18 78 L34 77 Q54 11 22 -45Z" fill="#f9cd67" stroke="#a97854" stroke-width="6"/>'+
      '<path d="M-24 -25 L-70 10 M30 -22 L83 -52 M-7 80 L-27 124 M27 79 L50 124" fill="none" stroke="#805c4a" stroke-width="17"/>'+
      '<circle cx="18" cy="-94" r="4"/><path d="M10 -75 Q19 -66 29 -76" fill="none" stroke="#714a42" stroke-width="4"/>')+
      el(693,376,.79,'<circle cy="-89" r="43" fill="#b68065" stroke="#885e51" stroke-width="6"/>'+
      '<path d="M-36 -111 Q-10 -149 36 -111" fill="none" stroke="#405d9c" stroke-width="18"/>'+
      '<path d="M-22 -45 Q-59 24 -18 78 L34 77 Q54 11 22 -45Z" fill="#91badc" stroke="#456e90" stroke-width="6"/>'+
      '<path d="M-24 -25 L-73 -55 M30 -22 L79 -20 M-7 80 L-27 124 M27 79 L50 124" fill="none" stroke="#805c4a" stroke-width="17"/>')+
      '<circle cx="535" cy="103" r="27" fill="#f9b553" stroke="#b07541" stroke-width="7"/>'+
      '<path d="M510 101 q29 -25 50 0 M532 77 q-18 34 0 53" fill="none" stroke="#ce894c" stroke-width="5"/>',
      'Two children playing ball on a grassy field');
    return wrap(base(),'Sunny illustrated learning scene');
  }
  const scenes={
    sounds:{theme:'garden',items:[
      ['apple',34,35],['ant',49,83],['acorn',77,53],['airplane',72,21],['bee',15,29],['dog',19,82]
    ],correct:['apple','ant','acorn','airplane']},
    shapes:{theme:'room',items:[
      ['clock',24,27],['plate',73,30],['wheel',26,74],['ball',74,76],['door',89,51],['book',53,84]
    ],correct:['clock','plate','wheel','ball']},
    forest:{theme:'forest',items:[['leaf',43,36],['bird',80,34],['wolf',22,83],['water',78,83]]}
  };
  const longA=['gate','name','date','hot','rope','fish','rain','mail','kite','pet','page','paid','lake','wave','net','cake','name','rain','bake','sun','make','plane','cane','rain','tail'];
  const zebraLetters=['Z','Z','Z','F','X','S','Z','Z','X','F','Z','Z','Z','Z','S','Z','Z','S','Z','X','Z','Z','Z','Z','Z'];
  const route=[0,1,2,7,12,11,10,15,20,21,22,23,24];
  const branches=[[1,6],[6,11],[7,8],[12,13],[13,18],[15,16],[16,17],[17,18],[18,23],[3,8],[8,9]];
  const edges=[...route.slice(1).map((v,i)=>[route[i],v]),...branches];
  function available(grade,cat,level){
    return (grade==='k'&&['phonics','shape2'].includes(cat))||
      (grade==='g1' && (cat==='phonics'||cat==='match'||cat==='sent'));
  }
  function make(grade,cat,level){
    if(!available(grade,cat,level))return null;
    let mode;
    if(grade==='k')mode=cat==='shape2'?'shapes':(Math.random()<.55?'letters':'sounds');
    else mode=cat==='phonics'?'longa':cat==='match'?'forest':(Math.random()<.55?'sentence':'sequence');
    let text='', hint='Look at the picture!',theme='forest', answer='complete';
    if(mode==='letters'){text='Help the baby zebra! Follow the Z letters.';theme='savanna';}
    if(mode==='longa'){text='Follow the long A words to reach TAIL.';theme='forest';}
    if(mode==='sounds'){text='Find four things whose names begin with A.';theme='garden';}
    if(mode==='shapes'){text='Find all four round things in the room.';theme='room';}
    if(mode==='forest'){const words=['leaf','bird','wolf','water'];answer=words[Math.floor(Math.random()*words.length)];text='Find: '+answer.toUpperCase();theme='forest';}
    if(mode==='sentence'){const sentences=[
      ['The fox can ____.','jump','run','swim','fly','park'],
      ['The bird can ____.','fly','run','bark','dig','forest'],
      ['The fox is by the ____.','tree','milk','chair','rain','park'],
      ['The bird is in the ____.','tree','lake','chair','bag','forest']
    ];const s=sentences[Math.floor(Math.random()*sentences.length)];return {
      key:'ill-sentence-'+s[0],text:s[0].replace('____','_____'),say:'Which word fits?',main:illustration(s[5]),mainClass:'ia-picture',
      options:[s[1],s[2],s[3],s[4]].sort(()=>Math.random()-.5).map(w=>({v:w,html:w})),answer:s[1],
      optClass:'opt-text',hint:{html:'Read the sentence and look at the picture.',say:'Look at the picture!'}
    };}
    if(mode==='sequence'){text='Read the fox story. Tap the four pictures in story order.';theme='park';}
    return {key:'ill-'+mode+(mode==='forest'?'-'+answer:''),text,say:mode==='forest'?'Find the word.':'Look at the picture!',
      main:'',options:[],answer,illustrated:{mode,theme},mainClass:'ia-picture',hint:{html:'Look at the picture and try again.',say:hint}};
  }
  function setFeedback(host,message){
    const out=host.querySelector('.ia-feedback'); if(out)out.textContent=message;
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
    const good=msg=>{setFeedback(host,msg);if(typeof sfx!=='undefined')sfx.yes();};
    if(info){
      const required=mode==='forest'?[q.answer]:info.correct;
      info.items.forEach(([id,x,y])=>{
        const btn=document.createElement('button');
        btn.type='button';btn.className='ia-hotspot';btn.style.left=x+'%';btn.style.top=y+'%';
        btn.dataset.object=id;btn.setAttribute('aria-label','Select '+id);
        btn.innerHTML='<span class="ia-hotspot-ring" aria-hidden="true"></span>';
        btn.addEventListener('click',()=>{
          if(btn.disabled)return;
          if(!required.includes(id)){actions.mistake();setFeedback(host,'Look closely. Try another picture.');return;}
          btn.disabled=true;btn.classList.add('ia-found');progress.add(id);
          if(progress.size===required.length)correctAnswer(btn);
          else good('You found '+progress.size+' of '+required.length+'. Keep looking!');
        });
        stage.append(btn);
      });
      note.textContent=mode==='forest'?'Find the '+q.answer+'.':'Tap pictures to find all '+info.correct.length+'.';
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
      const cards=[
        {id:2,label:'Fox jumps',mark:'↗',desc:'The fox jumps.'},
        {id:0,label:'Fox sees apple',mark:'?',desc:'The fox sees an apple.'},
        {id:3,label:'Apple falls',mark:'↓',desc:'The apple falls.'},
        {id:1,label:'Fox runs',mark:'→',desc:'The fox runs to the tree.'}
      ];
      const tray=document.createElement('div');tray.className='ia-story-cards';
      cards.forEach(card=>{
        const b=document.createElement('button');b.type='button';b.className='ia-story-card';b.dataset.step=card.id;
        b.innerHTML='<span class="ia-story-art">'+
          '<svg viewBox="0 0 180 115" aria-hidden="true">'+
          '<rect width="180" height="115" rx="13" fill="#d9f2ca"/>'+
          '<path d="M0 83 Q70 62 180 86 V115 H0Z" fill="#8ac079"/>'+
          '<circle cx="140" cy="26" r="21" fill="#e65350" stroke="#a94141" stroke-width="4"/>'+
          '<path d="M140 10 q5 -11 17 -9" stroke="#427e3d" stroke-width="5" fill="none"/>'+
          fox(61,108,card.id===2?.36:.4)+
          (card.id===3?'<path d="M145 36 V82" stroke="#ae7244" stroke-width="4" stroke-dasharray="5 6"/>':'')+
          '</svg></span><small>'+div(card.label)+'</small><b></b>';
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
      stage.classList.add('ia-small-scene');
      q.illHint=()=>setFeedback(host,'Read the story from the beginning. Start with what the fox saw.');
    }
    return stage;
  }
  const traceScene=(mode)=>illustration(mode==='sports'?'sports':mode==='garden'?'garden':'park');
  return {available,make,mount,illustration,traceScene};
})();
