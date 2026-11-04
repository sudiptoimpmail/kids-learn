/* Illustrated workbook activities: original vector scenes, no external assets. */
(() => {
  'use strict';
  const W = {
    k: [
      { id: 'letters', name: 'Letter Trail', icon: '🦓', detail: 'Follow the matching letters' },
      { id: 'shapes', name: 'Trace & Find', icon: '🔵', detail: 'Trace a circle and find circles' },
      { id: 'motion', name: 'Play Ball!', icon: '🏀', detail: 'Trace the bouncing path' },
      { id: 'sounds', name: 'Sound Garden', icon: '🌳', detail: 'Find pictures starting with A' }
    ],
    g1: [
      { id: 'vocab', name: 'Forest Words', icon: '🌲', detail: 'Read and match words in a scene' },
      { id: 'bank', name: 'Sentence Builder', icon: '📝', detail: 'Fill the blanks with words' },
      { id: 'sequence', name: 'Story Order', icon: '🦊', detail: 'Put story pictures in order' },
      { id: 'phonics', name: 'Long-A Maze', icon: '🧩', detail: 'Find a path using long-A words' }
    ]
  };
  let grade = 'k', page = null, correct = 0, total = 0, done = false, visited = [], marked = new Set();
  const root = document.querySelector('#workbookBody');
  const title = document.querySelector('#workbookTitle');
  const status = document.querySelector('#workbookStatus');
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function announce(message, positive = false) {
    status.textContent = message;
    status.classList.toggle('good', positive);
    status.setAttribute('role', 'status');
    if (positive && typeof sfx !== 'undefined' && sfx.good) sfx.good();
  }
  function speak(message) { if (typeof say === 'function') say(message); }
  function selectGrade() {
    const g = typeof state !== 'undefined' ? state.grade : '';
    grade = g === 'g1' || g === 'g2' ? 'g1' : 'k';
    return grade;
  }
  function open() {
    selectGrade();
    page = null;
    title.textContent = 'My Workbook';
    root.innerHTML = '<div class="wb-intro"><h2>Choose your adventure</h2><p>Touch, trace, read and solve!</p></div><div class="wb-menu">' +
      W[grade].map(item => '<button class="wb-activity" data-page="' + item.id + '"><span class="wb-big-icon">' + item.icon + '</span><strong>' + item.name + '</strong><small>' + item.detail + '</small></button>').join('') + '</div>';
    announce(grade === 'k' ? 'Kindergarten workbook' : 'Grade 1 workbook');
    show('workbook');
  }
  function draw(id) {
    const item = W[grade].find(x => x.id === id);
    if (!item) return;
    page = id; correct = 0; total = 0; done = false; visited = []; marked = new Set();
    title.textContent = item.name;
    root.replaceChildren();
    root.innerHTML = '<div class="wb-sheet"><h2>' + item.icon + ' ' + item.name + '</h2><p id="wbInstruction" class="wb-instruction"></p><div id="wbActivity"></div><div class="wb-actions"><button id="wbHear" class="wb-action">🔊 Hear</button><button id="wbReset" class="wb-action">↻ Try again</button><button id="wbMenu" class="wb-action">☰ Activities</button></div></div>';
    const task = root.querySelector('#wbActivity');
    const prompt = text => { root.querySelector('#wbInstruction').textContent = text; speak(text); };
    if (id === 'letters') letterMaze(task, prompt);
    if (id === 'shapes') shapeScene(task, prompt);
    if (id === 'motion') motionScene(task, prompt);
    if (id === 'sounds') soundScene(task, prompt);
    if (id === 'vocab') vocabulary(task, prompt);
    if (id === 'bank') wordBank(task, prompt);
    if (id === 'sequence') storyOrder(task, prompt);
    if (id === 'phonics') longAMaze(task, prompt);
    announce('Start the activity');
  }
  function complete(message) {
    if (done) return;
    done = true;
    announce('⭐ ' + message, true);
    speak(message);
  }
  function gridMaze(el, opts) {
    const { cells, route, prompt, finish } = opts;
    const grid = document.createElement('div');
    grid.className = 'wb-maze-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Letter or word path maze');
    el.append(grid);
    cells.forEach((word, index) => {
      const b = document.createElement('button');
      b.className = 'wb-maze-cell' + (index === route[0] ? ' start' : '') + (index === route[route.length - 1] ? ' finish' : '');
      b.type = 'button'; b.textContent = word;
      b.setAttribute('aria-label', (index === route[0] ? 'Start ' : '') + word + (index === route[route.length - 1] ? ' finish' : ''));
      b.addEventListener('click', () => {
        if (done) return;
        if (!visited.length && index !== route[0]) { announce('Start at the first green square.'); return; }
        if (visited.length && index === visited[visited.length - 1]) return;
        const expected = route[visited.length];
        if (index !== expected) { announce('Not that way. ' + prompt); return; }
        visited.push(index); b.classList.add('visited'); b.setAttribute('aria-pressed', 'true');
        if (visited.length === route.length) complete(finish);
        else announce(visited.length + ' of ' + route.length + ' steps');
      });
      grid.append(b);
    });
  }
  function letterMaze(el, prompt) {
    prompt('Help the baby zebra reach its family. Follow only the letter Z.');
    el.innerHTML = '<div class="wb-scene-banner">🦓 <span>Follow the Z trail!</span> 🌳 🦓</div>';
    const route = [0,1,2,7,12,11,10,15,20,21,22,23,24];
    const cells = ['Z','Z','Z','F','X','S','F','Z','X','F','Z','Z','Z','X','S','Z','F','S','X','X','Z','Z','Z','Z','Z'];
    gridMaze(el, {cells,route,prompt:'Find the next Z.',finish:'You brought the zebra home!'});
  }
  function originalScene(items) {
    return '<div class="wb-picture-scene" role="group" aria-label="Illustrated activity scene">' +
      '<span class="wb-sun">☀️</span><span class="wb-tree">🌳</span>' +
      items.map(({id,icon,label,x,y}) => '<button class="wb-object" data-object="' + id + '" style="left:' + x + '%;top:' + y + '%" aria-label="' + esc(label) + '"><span>' + icon + '</span><small>' + esc(label) + '</small></button>').join('') +
      '</div>';
  }
  function findTargets(el, items, targets, message) {
    total = targets.length;
    el.innerHTML = originalScene(items) + '<div class="wb-counter">Found: <b id="wbFound">0</b> / ' + total + '</div>';
    el.querySelectorAll('[data-object]').forEach(b => b.addEventListener('click', () => {
      if (done || marked.has(b.dataset.object)) return;
      const item = items.find(x => x.id === b.dataset.object);
      speak(item.label);
      if (!targets.includes(b.dataset.object)) { announce('Look again!'); return; }
      marked.add(b.dataset.object); b.classList.add('found'); b.setAttribute('aria-pressed', 'true');
      el.querySelector('#wbFound').textContent = marked.size;
      if (marked.size === total) complete(message);
      else announce('Great! Find ' + (total - marked.size) + ' more.', true);
    }));
  }
  function soundScene(el, prompt) {
    prompt('Find all four pictures that start with the A sound.');
    findTargets(el, [
      {id:'apple',icon:'🍎',label:'apple',x:12,y:17},
      {id:'bee',icon:'🐝',label:'bee',x:44,y:18},
      {id:'ant',icon:'🐜',label:'ant',x:75,y:19},
      {id:'dog',icon:'🐕',label:'dog',x:22,y:59},
      {id:'acorn',icon:'🌰',label:'acorn',x:51,y:52},
      {id:'airplane',icon:'✈️',label:'airplane',x:79,y:68}
    ], ['apple','ant','acorn','airplane'], 'You found every A picture!');
  }
  function vocabulary(el, prompt) {
    const items = [
      {id:'leaf',icon:'🍃',label:'leaf',x:22,y:20},
      {id:'bird',icon:'🐦',label:'bird',x:74,y:14},
      {id:'wolf',icon:'🐺',label:'wolf',x:19,y:70},
      {id:'water',icon:'💧',label:'water',x:76,y:73}
    ];
    const order = ['leaf','bird','wolf','water'];
    prompt('Read the word. Tap the matching object in the forest.');
    el.innerHTML = '<div class="wb-current-word" aria-live="polite">' + order[0] + '</div>' + originalScene(items);
    const current = el.querySelector('.wb-current-word');
    el.querySelectorAll('[data-object]').forEach(b => b.addEventListener('click', () => {
      if (done) return;
      if (b.dataset.object !== order[correct]) { announce('Try finding: ' + order[correct]); return; }
      b.classList.add('found'); b.disabled = true; correct++;
      if (correct === order.length) complete('You matched every forest word!');
      else { current.textContent = order[correct]; announce('Correct! Next: ' + order[correct], true); speak(order[correct]); }
    }));
  }
  function pointInSvg(svg, event) {
    const p = svg.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : null;
  }
  function tracePath(el, pathString, onComplete) {
    el.innerHTML = '<div class="wb-tracing"><svg viewBox="0 0 520 240" aria-label="Trace the dotted guide from the ball to the basket"><path d="' + pathString + '" fill="none" stroke="#a5afc4" stroke-width="19" stroke-linecap="round" stroke-dasharray="8 12"/><path id="wbTraceTarget" d="' + pathString + '" fill="none" stroke="transparent" stroke-width="28"/><polyline id="wbDrawnLine" points="" fill="none" stroke="#f97316" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg></div><p class="wb-progress-label" aria-live="polite">Trace the dashed line with your finger.</p>';
    const svg = el.querySelector('svg'), target = el.querySelector('#wbTraceTarget'), ink = el.querySelector('#wbDrawnLine');
    const length = target.getTotalLength(), hit = new Set();
    const samples = Array.from({length:48}, (_, i) => target.getPointAtLength(i * length / 47));
    let active = false, lastSample = -1;
    const coords = [];
    const move = event => {
      if (!active || done) return;
      const p = pointInSvg(svg, event); if (!p) return;
      let best = -1, distance = Infinity;
      samples.forEach((s,i) => { const d = Math.hypot(s.x-p.x,s.y-p.y); if (d < distance) {distance=d;best=i;} });
      if (distance > 29) return;
      if (lastSample >= 0 && Math.abs(best-lastSample) > 8) return;
      if (lastSample >= 0) {
        const min = Math.min(lastSample,best), max = Math.max(lastSample,best);
        for(let i=min;i<=max;i++) hit.add(i);
      } else hit.add(best);
      lastSample = best;
      coords.push(p.x.toFixed(1)+','+p.y.toFixed(1));
      ink.setAttribute('points', coords.join(' '));
      const percent = Math.round(hit.size/48*100);
      el.querySelector('.wb-progress-label').textContent = percent + '% traced';
      if (percent >= 76) { active = false; onComplete(); }
    };
    svg.addEventListener('pointerdown', event => { if (done) return; active=true; lastSample=-1; svg.setPointerCapture(event.pointerId); move(event); });
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', () => {active=false;lastSample=-1;});
    svg.addEventListener('pointercancel', () => {active=false;lastSample=-1;});
  }
  function motionScene(el, prompt) {
    prompt('Trace the bouncing ball into the basket.');
    el.innerHTML = '<div class="wb-scene-banner">🏀 <span>Follow the bounces!</span> 🏀</div><div id="wbTraceArea"></div><div class="wb-endpoints"><span>🏀 START</span><span>🏀 FINISH</span></div>';
    tracePath(el.querySelector('#wbTraceArea'),'M 30 95 Q 85 5 140 95 T 250 95 T 360 95 T 490 95', () => complete('Excellent ball tracing!'));
  }
  function shapeScene(el, prompt) {
    prompt('Trace the circle, then find all the round objects.');
    el.innerHTML = '<div class="wb-shape-area" id="wbShapeTrace"></div><div id="wbShapeObjects" hidden></div>';
    // Draw a circle in the same SVG coordinate system as motion tracing.
    const circle = 'M 360 120 A 100 100 0 1 1 160 120 A 100 100 0 1 1 360 120';
    tracePath(el.querySelector('#wbShapeTrace'),circle, () => {
      announce('Circle traced! Find the round pictures.',true);
      el.querySelector('#wbShapeObjects').hidden=false;
    });
    const items = [
      {id:'clock',icon:'🕒',label:'clock',x:16,y:19},{id:'wheel',icon:'🛞',label:'wheel',x:48,y:20},
      {id:'door',icon:'🚪',label:'door',x:80,y:19},{id:'ball',icon:'⚽',label:'ball',x:24,y:69},
      {id:'book',icon:'📕',label:'book',x:54,y:66},{id:'plate',icon:'🥏',label:'round plate',x:81,y:68}
    ];
    findTargets(el.querySelector('#wbShapeObjects'),items,['clock','wheel','ball','plate'],'You found all the circles!');
  }
  function wordBank(el, prompt) {
    const choices = ['dog','cat','fish','snake','ant'];
    const sentences = [
      ['My ___ likes to bark.','dog'],['The ___ drinks milk.','cat'],
      ['The ___ swims in water.','fish'],['The ___ has no legs.','snake'],['An ___ is a tiny insect.','ant']
    ];
    prompt('Read each sentence, then choose the missing word.');
    el.innerHTML = '<div class="wb-word-options">' + choices.map(w=>'<button class="wb-word" data-word="'+w+'">'+w+'</button>').join('') + '</div><div class="wb-sentences">'+
      sentences.map(([s],i)=>'<div class="wb-sentence" data-index="'+i+'"><span>'+ (i+1)+'. '+esc(s.split('___')[0])+'</span><button class="wb-blank" data-blank="'+i+'">_____</button><span>'+esc(s.split('___')[1])+'</span></div>').join('') + '</div>';
    let selected = null;
    el.querySelectorAll('[data-word]').forEach(b=>b.addEventListener('click',()=>{
      selected=b.dataset.word;el.querySelectorAll('[data-word]').forEach(x=>x.classList.toggle('selected',x===b));announce('Now tap the correct sentence blank.');
    }));
    el.querySelectorAll('[data-blank]').forEach(b=>b.addEventListener('click',()=>{
      if(done || b.disabled) return;
      if(!selected){announce('Choose a word first.');return;}
      const n=Number(b.dataset.blank);
      if(sentences[n][1]!==selected){announce('Read the sentence and try another word.');return;}
      b.textContent=selected;b.disabled=true;b.classList.add('filled');correct++;
      el.querySelector('[data-word="'+selected+'"]').disabled=true;
      selected=null;el.querySelectorAll('[data-word]').forEach(x=>x.classList.remove('selected'));
      if(correct===sentences.length)complete('All five sentences are correct!');
      else announce(correct+' of 5 sentences correct',true);
    }));
  }
  function storyOrder(el, prompt) {
    prompt('Read the story. Tap the pictures in the order they happened.');
    const story=['A little fox saw a red apple.','The fox ran to the tree.','The fox jumped up.','The apple fell down.','The fox ate the apple.'];
    const pictures=[
      {id:3,pic:'🍎⬇️',text:'The apple falls'},
      {id:0,pic:'🦊👀🍎',text:'Fox sees apple'},
      {id:4,pic:'🦊🍎',text:'Fox eats apple'},
      {id:2,pic:'🦊⬆️',text:'Fox jumps'},
      {id:1,pic:'🦊🏃🌳',text:'Fox runs'}
    ];
    el.innerHTML='<div class="wb-story">'+story.map(t=>'<p>'+esc(t)+'</p>').join('')+'</div><p>Tap picture 1, then 2, 3, 4 and 5.</p><div class="wb-story-grid">'+
      pictures.map(p=>'<button class="wb-story-card" data-step="'+p.id+'"><span>'+p.pic+'</span><small>'+p.text+'</small><b class="wb-step"></b></button>').join('')+'</div>';
    el.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{
      if(done || b.disabled) return;
      if(Number(b.dataset.step)!==correct){announce('Read what happened next. Try again.');return;}
      b.disabled=true;b.classList.add('found');b.querySelector('.wb-step').textContent=String(++correct);
      if(correct===5)complete('You put the story in the right order!');
      else announce('Great! What happened next?',true);
    }));
  }
  function longAMaze(el, prompt) {
    prompt('Start at GATE. Follow only words with the long A sound to reach TAIL.');
    el.innerHTML='<div class="wb-scene-banner">➡️ <span>Long A: gate, rain, cake</span> ⭐</div>';
    const cells=[
      'gate','name','hot','fish','rope',
      'kit','date','kite','man','pet',
      'dog','rain','mail','paid','net',
      'bat','jam','pan','page','sun',
      'tail','make','cake','lake','wave'
    ];
    // Every route step shares an edge with the next. All distractors interrupt the route.
    const route=[0,1,6,11,12,13,18,23,22,21,20];
    // Ensure every route word matches long-A; TAIL is the finish.
    gridMaze(el,{cells,route,prompt:'Choose a long A word next.',finish:'You solved the long A maze!'});
  }
  document.querySelector('#workbookBack').addEventListener('click',()=>{page?open():(renderHome(),show('home'));});
  root.addEventListener('click',event=>{
    const b=event.target.closest('[data-page],#wbHear,#wbReset,#wbMenu');
    if(!b)return;
    if(b.dataset.page)draw(b.dataset.page);
    else if(b.id==='wbMenu')open();
    else if(b.id==='wbReset')draw(page);
    else if(b.id==='wbHear')speak(root.querySelector('#wbInstruction')?.textContent||'My workbook');
  });
  document.addEventListener('click',event=>{
    const tile=event.target.closest('#workbookLaunch');
    if(tile)open();
  });
})();
