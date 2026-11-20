/* =========================================================
   Library: picture books read aloud (Pre-K and K)
   - A bookshelf, then a reader: one painted picture and a few large lines per page.
   - "Read to me" plays each sentence's recording and lights up each word as it is read.
   - Tap any word to hear it on its own. Swipe or use the arrows to turn pages.
   - At the end, three picture questions (no reading needed), then "Read it again?".
   Books live in library/<id>/book.json with their pictures beside them.
   ========================================================= */
const LIBRARY_CATALOG = ContentData.get('curriculum-map','learningFramework').books;
const LIBRARY = LIBRARY_CATALOG.map(b=>b.id);
const availableBooks = grade => LIBRARY_CATALOG.filter(b=>b.grades.includes(grade)).map(b=>b.id);
const LB = { book: null, page: -1, reading: false, auto: true, t0: 0, q: 0, readTimer: 0, quizTimer: 0, request: 0, finished: false };
// Gentle non-musical sounds add suspense without replacing the recorded story.
const LIB_SCENE_SYMBOLS = { wolf: '🌲', hurry: '🐾', knock: '🚪', disguise: '🌙', suspense: '👀', brave: '❤️', rescue: '☀️', safe: '🏡' };
const LIB_SCENE_SOUNDS = {
  rustle: [310, 245], footsteps: [195, 165], knock: [180, 180, 160],
  sneak: [190, 155], heartbeat: [150, 130], rescue: [330, 465], celebrate: [470, 630]
};
function storySceneSound(kind) {
  if (!state.voice || !LIB_SCENE_SOUNDS[kind]) return;
  tone(LIB_SCENE_SOUNDS[kind], { type: 'sine', dur: 0.08, gap: 0.18, vol: 0.045 });
}
const libPath = (id, f) => `library/${id}/${f}`;
const libBooks = new Map();
async function loadBook(id) {
  if (!libBooks.has(id)) libBooks.set(id, await (await fetch(libPath(id, 'book.json'))).json());
  return bookForGrade(libBooks.get(id));
}
// One story, told at each grade's reading level: a book can carry "versions" keyed by grade
// (its own title, pages and questions over the shared pictures). Other grades read the base text.
function bookForGrade(b, grade = state.grade) {
  const v = b && b.versions && b.versions[grade];
  return v ? { ...b, ...v, versions: undefined, level: grade } : b;
}

// screen shell, made once
(() => {
  const s = document.createElement('section');
  s.id = 'library'; s.className = 'screen';
  s.innerHTML = `<header class="play-top lib-top">
      <button id="libHome" class="icon-btn" aria-label="Back home">🏠</button>
      <div id="libTitle" class="lib-title">Story Time</div>
      <button id="libRead" class="icon-btn" aria-label="Read to me">🔊</button>
    </header>
    <div id="libBody" class="lib-body"></div>`;
  document.body.insertBefore(s, document.getElementById('play'));
})();

function stopReading() { clearTimeout(LB.quizTimer); LB.quizTimer = 0; clearTimeout(LB.readTimer); LB.readTimer = 0; LB.reading = false; sayToken++; stopClip(); $$('#libBody .w.on').forEach((w) => w.classList.remove('on')); }

async function openLibrary() {
  stopReading(); const request=++LB.request; LB.book = null;
  show('library');
  $('#libTitle').textContent = 'Story Time';
  $('#libRead').hidden = true;
  const books = await Promise.all(availableBooks(state.grade).map((id) => loadBook(id).catch(() => null)));
  if(request!==LB.request || !$('#library').classList.contains('active'))return;
  const drawCard = drawStoriesFor().length ? `<button class="lib-book lib-draw" data-draw="1"><span class="lib-draw-art" aria-hidden="true"><i>📖</i><i>✏️</i></span><b>Draw the Story</b><small>listen, then draw</small></button>` : '';
  $('#libBody').innerHTML = `<div class="lib-shelf">${drawCard}${books.filter(Boolean).map((b) => `
    <button class="lib-book" data-id="${b.id}"><img src="${libPath(b.id, b.cover)}" alt="" draggable="false"><b>${b.title}</b>
      ${(state.booksRead || {})[b.id] ? `<small>✓ read ${state.booksRead[b.id]} time${state.booksRead[b.id] === 1 ? '' : 's'}</small>` : '<small>New!</small>'}</button>`).join('')}
    </div>`;
  $$('#libBody .lib-book').forEach((b) => (b.onclick = () => { sfx.tap(); if (b.dataset.draw) openDrawStory(); else openBook(b.dataset.id); }));
  say('Story time! Pick a book.');
}

async function openBook(id) {
  stopReading(); const request=++LB.request, book=await loadBook(id);
  if(request!==LB.request || !$('#library').classList.contains('active'))return;
  LB.book=book; LB.finished=false; LB.page = -1; LB.t0 = Date.now(); LB.q = 0;
  $('#libTitle').textContent = LB.book.title;
  $('#libRead').hidden = false;
  renderCover();
}

function renderCover() {
  stopReading();
  const b = LB.book;
  $('#libBody').innerHTML = `<div class="lib-page lib-cover">
      <div class="lib-art"><img src="${libPath(b.id, b.cover)}" alt="${b.title}" draggable="false"></div>
      <h2 class="lib-cover-title">${b.title}</h2>
      <div class="lib-start"><button class="big-btn" data-a="listen">🔊 Read to me</button><button class="big-btn alt" data-a="self">📖 I'll read</button></div>
    </div>`;
  $('[data-a="listen"]').onclick = () => { sfx.tap(); LB.auto = true; goPage(0); };
  $('[data-a="self"]').onclick = () => { sfx.tap(); LB.auto = false; goPage(0); };
  say(b.title);
}

// a sentence as tappable words; each word keeps its own key for "tap to hear"
const wordsHTML = (t, si) => t.split(/\s+/).map((w, wi) => `<span class="w" data-s="${si}" data-i="${wi}" data-k="${clipKey(w)}">${w}</span>`).join(' ');

function goPage(n) {
  const b = LB.book;
  if (n < 0) return renderCover();
  if (n >= b.pages.length) return startQuestions();
  stopReading(); LB.page = n;
  const p = b.pages[n];
  $('#libBody').innerHTML = `<div class="lib-page" data-scene="${esc(p.scene || '')}">
      <div class="lib-art"><img src="${libPath(b.id, p.art)}" alt="${esc(p.alt || '')}" draggable="false">${LIB_SCENE_SYMBOLS[p.scene] ? `<span class="lib-scene-symbol" aria-hidden="true">${LIB_SCENE_SYMBOLS[p.scene]}</span>` : ''}</div>
      <div class="lib-text">${p.text.map((t, si) => `<p class="${/^["“]/.test(t) ? 'lib-dialogue' : /^The End/.test(t) ? 'lib-the-end' : ''}">${wordsHTML(t, si)}</p>`).join('')}</div>
      <div class="lib-nav">
        <button class="nav-btn" data-a="prev" aria-label="Previous page">◀</button>
        <span class="lib-count">${n + 1} / ${b.pages.length}</span>
        <button class="nav-btn" data-a="again" aria-label="Read this page again">🔁</button>
        <button class="nav-btn lib-next" data-a="next" aria-label="Next page">▶</button>
      </div></div>`;
  $('[data-a="prev"]').onclick = () => { sfx.tap(); goPage(n - 1); };
  $('[data-a="next"]').onclick = () => { sfx.tap(); goPage(n + 1); };
  $('[data-a="again"]').onclick = () => { sfx.tap(); readPage(); };
  $$('#libBody .w').forEach((w) => { w.title=CLIPS[w.dataset.k]?'Hear this word':'Hear this word in its sentence'; w.onclick = (e) => { e.stopPropagation(); stopReading(); w.classList.add('on'); const word=w.textContent.replace(/[^A-Za-z']/g, ''); say(CLIPS[clipKey(word)] ? word : p.text[Number(w.dataset.s)]); setTimeout(() => w.classList.remove('on'), 900); }; });
  swipe($('#libBody .lib-page'), () => goPage(n + 1), () => goPage(n - 1));
  storySceneSound(p.sound);
  // A short suspense beat before the recorded voice, cancelled on every page turn.
  if (LB.auto) LB.readTimer = setTimeout(() => {
    if (LB.book === b && LB.page === n && document.querySelector('#library.active')) readPage();
  }, p.sound ? 1050 : 500);
}

// read the page aloud: one recording per sentence, words lit in time with it
async function readPage() {
  stopReading();
  const my = ++sayToken; LB.reading = true;
  const page = LB.page, sents = LB.book.pages[page].text;
  for (let si = 0; si < sents.length; si++) {
    if (my !== sayToken || LB.page !== page) return;
    const file = CLIPS[clipKey(sents[si])];
    const spans = $$(`#libBody .w[data-s="${si}"]`);
    if (!file || !state.voice) { spans.forEach((w) => w.classList.add('read')); continue; }
    const rate = typeof familyStoryRate === 'function' ? familyStoryRate() : 1;
    let dur = 2;
    try { dur = (await getBuf(file)).duration / rate; } catch {}
    if (my !== sayToken) return;
    // time for each word ~ its letters (+ a beat for punctuation), spread over the recording
    const weight = spans.map((w) => w.textContent.replace(/[^A-Za-z]/g, '').length + 1.5 + (/[,.!?]$/.test(w.textContent) ? 2 : 0));
    const total = weight.reduce((a, b) => a + b, 0), start = performance.now() + 60;
    let raf;
    const tick = () => {
      if (my !== sayToken) return;
      const t = ((performance.now() - start) / 1000) / dur * total;
      let acc = 0, k = 0; while (k < weight.length - 1 && acc + weight[k] < t) acc += weight[k++];
      spans.forEach((w, i) => { w.classList.toggle('on', i === k); if (i < k) w.classList.add('read'); });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    await playClip(file, my, rate);
    cancelAnimationFrame(raf);
    if (my !== sayToken || !LB.book) return;                // she left the page or the book while this line was playing
    spans.forEach((w) => { w.classList.remove('on'); w.classList.add('read'); });
    // Let children absorb each line; suspense and a change of speaker get a longer beat.
    const next = sents[si + 1] || '';
    const dramatic = ['wolf', 'suspense', 'brave', 'knock', 'disguise'].includes(LB.book.pages[page].scene);
    const speakerChange = /^["“]/.test(next);
    if (si < sents.length - 1) await sleep(dramatic || speakerChange ? 850 : 550);
  }
  if (my === sayToken) { LB.reading = false; $('#libBody .lib-next')?.classList.add('pulse'); }
}

/* ---------- after the story: three picture questions ---------- */
function startQuestions() { stopReading(); LB.page=-1; $('#libRead').hidden=true; LB.q = 0; askQuestion(); }
function askQuestion() {
  const b = LB.book, q = b.questions[LB.q];
  if (!q) return finishBook();
  let answered=false; const request=LB.request;
  const opts = shuffle(q.options.slice());
  $('#libBody').innerHTML = `<div class="lib-page lib-quiz">
      <p class="lib-ask">${q.ask}</p>
      <div class="lib-opts">${opts.map(([v, img]) => `<button class="lib-opt" data-v="${v}"><img src="${libPath(b.id, img)}" alt="${v}" draggable="false"></button>`).join('')}</div>
      <div class="lib-nav"><button class="nav-btn" data-a="hear" aria-label="Hear the question">🔊</button><span class="lib-count">${LB.q + 1} / ${b.questions.length}</span></div></div>`;
  say(q.ask);
  $('[data-a="hear"]').onclick = () => say(q.ask);
  $$('#libBody .lib-opt').forEach((o) => (o.onclick = () => {
    if(answered)return;
    if (o.dataset.v === q.answer) {
      answered=true; $$('#libBody .lib-opt').forEach(button=>button.disabled=true);
      o.classList.add('right'); sfx.yes(); say(pick(['Great job!', 'You remembered!', 'Wonderful!']));
      LB.quizTimer=setTimeout(() => { LB.quizTimer=0; if(request!==LB.request || LB.book!==b || !$('#library').classList.contains('active'))return; LB.q++; askQuestion(); }, 1400);
    } else { o.classList.add('wrong'); sfx.no(); say('Try again!'); setTimeout(() => o.classList.remove('wrong'), 700); }
  }));
}
function finishBook() {
  if(LB.finished)return; LB.finished=true;
  const b = LB.book;
  state.booksRead = state.booksRead || {}; state.booksRead[b.id] = (state.booksRead[b.id] || 0) + 1;
  if (typeof statsDay === 'function') { const d = statsDay(); d.books = (d.books || 0) + 1; d.secs += Math.min(1200, Math.round((Date.now() - LB.t0) / 1000)); }
  state.stars += 3; save();
  confetti(160, 0.3); sfx.win();
  $('#libBody').innerHTML = `<div class="lib-page lib-done"><div class="lib-art"><img src="${libPath(b.id, b.pages[b.pages.length - 1].art)}" alt="" draggable="false"></div>
      <h2>You read ${b.title}! 📚</h2><p>⭐ +3</p>
      <div class="lib-start"><button class="big-btn" data-a="again">🔁 Read it again</button><button class="big-btn alt" data-a="shelf">📚 Library</button></div></div>`;
  say(['You did it!', 'Read it again?']);
  $('[data-a="again"]').onclick = () => { sfx.tap(); openBook(b.id); };
  $('[data-a="shelf"]').onclick = () => { sfx.tap(); openLibrary(); };
}

// simple horizontal swipe for page turns
function swipe(el, next, prev) {
  if (!el) return; let x0 = null;
  el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) (dx < 0 ? next : prev)(); }, { passive: true });
}

$('#libHome').onclick = () => { sfx.tap(); stopReading(); if (LB.book || DS.story) { LB.book = null; DS.story = null; openLibrary(); } else { renderHome(); show('home'); } };
$('#libRead').onclick = () => { sfx.tap(); if (DS.story && DS.view === 'story') { readDrawStory(); return; } if (LB.page >= 0) { LB.auto = true; readPage(); } };

// Invalidate pending loads and feedback whenever any navigation leaves the reader.
CoreHooks.before('show',(id)=>{if(id!=='library' && $('#library').classList.contains('active')){LB.request++;stopReading();}});

/* ---------- Draw the Story ----------
   A new story is told with no pictures. Then one part of it (picked at random) is drawn on a blank page, with hints
   if she wants them. Afterwards she taps the story details she put in her picture, and older children get a
   question to talk about. Stories, scenes and hints are written for each grade (data/draw-stories.json):
   Pre-K draws one thing they heard; 2nd and 3rd grade draw feelings, clues, or what might happen next. */
const DRAW_STORIES = ContentData.get('draw-stories', 'STORIES'), DRAW_UI = ContentData.get('draw-stories', 'UI');
const drawStoriesFor = (grade = state.grade) => DRAW_STORIES[grade] || [];
const DS = { story: null, scene: -1, hint: 0, view: '', lastScene: {} };
const youngDraw = () => ['prek', 'k'].includes(state.grade);
// a list of lines, each split into sentences (each sentence has its own recording)
const sayLines = (lines) => say(lines.filter(Boolean).flatMap((t) => splitSentences(t)));
function openDrawStory(id) {
  stopReading(); LB.request++; LB.book = null;
  const list = drawStoriesFor(), done = state.storyDrawn || {};
  // a story she has drawn least, so each visit brings a new one
  const fewest = Math.min(...list.map((s) => done[s.id] || 0));
  DS.story = id ? list.find((s) => s.id === id) : pick(list.filter((s) => (done[s.id] || 0) === fewest && s.id !== DS.lastStory) .concat(list.length === 1 ? list : []));
  if (!DS.story) DS.story = list[0];
  DS.lastStory = DS.story.id; DS.t0 = Date.now();
  show('library'); renderDrawStory(true);
}
function renderDrawStory(read) {
  const s = DS.story; DS.view = 'story';
  $('#libTitle').textContent = s.title; $('#libRead').hidden = false;
  $('#libBody').innerHTML = `<div class="lib-page ds-story ds-${esc(state.grade)}">
      <div class="ds-ear" aria-hidden="true">👂</div>
      <h2 class="lib-cover-title">${esc(s.title)}</h2>
      <div class="lib-text ds-text">${s.text.map((t, si) => `<p class="${/["“]/.test(t) ? 'lib-dialogue' : ''}" data-s="${si}">${wordsHTML(t, si)}</p>`).join('')}</div>
      <div class="lib-start"><button class="big-btn" data-a="draw">✏️ Draw a part</button><button class="big-btn alt" data-a="again">🔁 Hear it again</button></div>
    </div>`;
  $('[data-a="draw"]').onclick = () => { sfx.tap(); chooseDrawScene(); };
  $('[data-a="again"]').onclick = () => { sfx.tap(); readDrawStory(); };
  $$('#libBody .w').forEach((w) => { w.onclick = (e) => { e.stopPropagation(); const word = w.textContent.replace(/[^A-Za-z']/g, ''); if (CLIPS[clipKey(word)]) say(word); }; });
  if (read) say(DRAW_UI.intro).then(() => { if (DS.view === 'story' && $('#library').classList.contains('active')) readDrawStory(); });
}
// read the story one sentence at a time, lighting each line as it is read
async function readDrawStory() {
  stopReading(); const my = ++sayToken, s = DS.story; LB.reading = true;
  for (let i = 0; i < s.text.length; i++) {
    if (my !== sayToken || DS.story !== s || DS.view !== 'story') return;
    $$('#libBody .ds-text p').forEach((p, k) => { p.classList.toggle('ds-now', k === i); if (k < i) p.classList.add('ds-read'); });
    for (const part of splitSentences(s.text[i])) {         // a line can hold two sentences ("Jay waved. "Good night, owl!"")
      const file = CLIPS[clipKey(part)];
      if (file && state.voice) await playClip(file, my); else await sleep(1200);
      if (my !== sayToken) return;
    }
    if (my !== sayToken) return;
    await sleep(350);
  }
  if (my === sayToken) { LB.reading = false; $$('#libBody .ds-text p').forEach((p) => { p.classList.remove('ds-now'); p.classList.add('ds-read'); }); $('#libBody [data-a="draw"]')?.classList.add('pulse'); }
}
// pick one part of the story to draw: Pre-K always starts with the first; after that a different one each time
function chooseDrawScene(next) {
  stopReading();
  const s = DS.story, n = s.scenes.length, last = DS.lastScene[s.id];
  let k = state.grade === 'prek' && last == null ? 0 : Math.floor(Math.random() * n);
  if (n > 1 && (k === last || next)) k = (last == null ? k : last + 1 + Math.floor(Math.random() * (n - 1))) % n;
  DS.scene = k; DS.lastScene[s.id] = k; DS.hint = 0; DS.view = 'scene';
  renderScene(true);
}
function renderScene(speak) {
  const s = DS.story, c = s.scenes[DS.scene], young = youngDraw();
  $('#libTitle').textContent = s.title; $('#libRead').hidden = true;
  // the youngest see the hints and picture clues straight away; older children ask for them one at a time
  const shown = young ? c.hints.length : DS.hint;
  $('#libBody').innerHTML = `<div class="lib-page ds-scene">
      <div class="ds-paper" aria-hidden="true">🖍️</div>
      <p class="lib-ask ds-ask">${esc(c.ask)}</p>
      ${young ? `<div class="ds-clues">${c.check.map((x) => `<span class="ds-clue"><b>${x.icon}</b>${esc(x.label)}</span>`).join('')}</div>` : ''}
      <ul class="ds-hints">${c.hints.slice(0, shown).map((h) => `<li>💡 ${esc(h)}</li>`).join('')}</ul>
      <div class="lib-start"><button class="big-btn" data-a="start">🖍️ Start drawing</button>${!young && DS.hint < c.hints.length ? '<button class="big-btn alt" data-a="hint">💡 Need a hint?</button>' : ''}</div>
      <div class="lib-nav"><button class="nav-btn" data-a="story" aria-label="Hear the story again">📖</button><button class="nav-btn" data-a="hear" aria-label="Hear it again">🔊</button></div>
    </div>`;
  $('[data-a="start"]').onclick = () => { sfx.tap(); startSceneDrawing(); };
  $('[data-a="hint"]')?.addEventListener('click', () => { sfx.tap(); DS.hint++; renderScene(false); say(c.hints[DS.hint - 1]); });
  $('[data-a="hear"]').onclick = () => { sfx.tap(); sayLines(young ? [c.ask, ...c.hints] : [c.ask]); };
  $('[data-a="story"]').onclick = () => { sfx.tap(); renderDrawStory(false); readDrawStory(); };
  if (speak) sayLines(young ? [DRAW_UI.go, c.ask, ...c.hints] : [DRAW_UI.go, c.ask]);
}
function startSceneDrawing() {
  const s = DS.story, c = s.scenes[DS.scene]; DS.view = 'draw';
  let h = 0;
  openStoryDraw({
    name: s.title, ask: c.ask,
    onHint: () => { const t = c.hints[h++ % c.hints.length]; const box = document.querySelector('.sd-ask span'); if (box) box.innerHTML = `${esc(c.ask)}<small>💡 ${esc(t)}</small>`; say(t); },
    onDone: (img) => { show('library'); checkDrawing(img); },
    back: () => { show('library'); renderScene(false); },
  });
}
// after drawing: tap the story details that are in the picture
function checkDrawing(img) {
  const s = DS.story, c = s.scenes[DS.scene]; DS.view = 'check';
  $('#libTitle').textContent = s.title; $('#libRead').hidden = true;
  const picked = new Set();
  $('#libBody').innerHTML = `<div class="lib-page ds-check">
      ${img ? `<img class="ds-mine" src="${img}" alt="My drawing">` : ''}
      <p class="lib-ask">${esc(DRAW_UI.check)}</p>
      <div class="ds-clues ds-pick">${c.check.map((x, i) => `<button class="ds-clue" data-i="${i}" aria-pressed="false"><b>${x.icon}</b>${esc(x.label)}</button>`).join('')}</div>
      <div class="lib-start"><button class="big-btn" data-a="finish">⭐ I'm finished</button></div>
    </div>`;
  $$('#libBody .ds-pick .ds-clue').forEach((b) => (b.onclick = () => { const i = +b.dataset.i; if (picked.has(i)) picked.delete(i); else { picked.add(i); say(c.check[i].label); sfx.tap(); } b.classList.toggle('on', picked.has(i)); b.setAttribute('aria-pressed', String(picked.has(i))); }));
  $('[data-a="finish"]').onclick = () => { sfx.tap(); finishDrawing(picked.size, img); };
  say(DRAW_UI.check);
}
function finishDrawing(found, img) {
  const s = DS.story, c = s.scenes[DS.scene]; DS.view = 'done'; $('#libRead').hidden = true;
  state.storyDrawn = state.storyDrawn || {}; state.storyDrawn[s.id] = (state.storyDrawn[s.id] || 0) + 1;
  const stars = 1 + Math.min(2, found); state.stars += stars;
  if (typeof statsDay === 'function') { const d = statsDay(); d.books = (d.books || 0) + 1; d.secs += Math.min(1200, Math.round((Date.now() - DS.t0) / 1000)); }
  save(); confetti(120, 0.3); sfx.win();
  const talk = c.talk || (youngDraw() ? null : DRAW_UI.talk);
  $('#libBody').innerHTML = `<div class="lib-page lib-done ds-done">
      ${img ? `<img class="ds-mine" src="${img}" alt="My drawing">` : ''}
      <h2>${esc(DRAW_UI.done)} 🎨</h2><p>⭐ +${stars}</p>
      ${talk ? `<p class="ds-talk">💬 ${esc(talk)}</p>` : `<p class="ds-talk">💬 ${esc(DRAW_UI.talk)}</p>`}
      <div class="lib-start">${s.scenes.length > 1 ? '<button class="big-btn" data-a="part">✏️ Draw another part</button>' : ''}<button class="big-btn alt" data-a="story">📖 Another story</button><button class="big-btn alt" data-a="shelf">📚 Library</button></div>
    </div>`;
  $('[data-a="part"]')?.addEventListener('click', () => { sfx.tap(); chooseDrawScene(true); });
  $('[data-a="story"]').onclick = () => { sfx.tap(); openDrawStory(); };
  $('[data-a="shelf"]').onclick = () => { sfx.tap(); DS.story = null; openLibrary(); };
  sayLines([DRAW_UI.done, talk || DRAW_UI.talk]);
}
