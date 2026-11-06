/* =========================================================
   Library: picture books read aloud (Pre-K and K)
   - A bookshelf, then a reader: one painted picture and a few large lines per page.
   - "Read to me" plays each sentence's recording and lights up each word as it is read.
   - Tap any word to hear it on its own. Swipe or use the arrows to turn pages.
   - At the end, three picture questions (no reading needed), then "Read it again?".
   Books live in library/<id>/book.json with their pictures beside them.
   ========================================================= */
const LIBRARY = ['red-riding-hood', 'three-little-pigs'];
const LB = { book: null, page: -1, reading: false, auto: true, t0: 0, q: 0, readTimer: 0 };
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
  if (libBooks.has(id)) return libBooks.get(id);
  const b = await (await fetch(libPath(id, 'book.json'))).json();
  libBooks.set(id, b); return b;
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

function stopReading() { clearTimeout(LB.readTimer); LB.readTimer = 0; LB.reading = false; sayToken++; stopClip(); $$('#libBody .w.on').forEach((w) => w.classList.remove('on')); }

async function openLibrary() {
  stopReading(); LB.book = null;
  show('library');
  $('#libTitle').textContent = 'Story Time';
  $('#libRead').hidden = true;
  const books = await Promise.all(LIBRARY.map((id) => loadBook(id).catch(() => null)));
  $('#libBody').innerHTML = `<div class="lib-shelf">${books.filter(Boolean).map((b) => `
    <button class="lib-book" data-id="${b.id}"><img src="${libPath(b.id, b.cover)}" alt="" draggable="false"><b>${b.title}</b>
      ${(state.booksRead || {})[b.id] ? `<small>✓ read ${state.booksRead[b.id]} time${state.booksRead[b.id] === 1 ? '' : 's'}</small>` : '<small>New!</small>'}</button>`).join('')}
    <div class="lib-soon"><span>📚</span><small>More books coming soon</small></div></div>`;
  $$('#libBody .lib-book').forEach((b) => (b.onclick = () => { sfx.tap(); openBook(b.dataset.id); }));
  say('Story time! Pick a book.');
}

async function openBook(id) {
  LB.book = await loadBook(id); LB.page = -1; LB.t0 = Date.now(); LB.q = 0;
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
      <div class="lib-art"><img src="${libPath(b.id, p.art)}" alt="" draggable="false">${LIB_SCENE_SYMBOLS[p.scene] ? `<span class="lib-scene-symbol" aria-hidden="true">${LIB_SCENE_SYMBOLS[p.scene]}</span>` : ''}</div>
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
  $$('#libBody .w').forEach((w) => (w.onclick = (e) => { e.stopPropagation(); stopReading(); w.classList.add('on'); say(w.textContent.replace(/[^A-Za-z']/g, '')); setTimeout(() => w.classList.remove('on'), 900); }));
  swipe($('#libBody .lib-page'), () => goPage(n + 1), () => goPage(n - 1));
  storySceneSound(p.sound);
  // A short suspense beat before the recorded voice, cancelled on every page turn.
  if (LB.auto) LB.readTimer = setTimeout(() => {
    if (LB.book === b && LB.page === n && document.querySelector('#library.active')) readPage();
  }, p.sound ? 850 : 350);
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
    let dur = 2;
    try { dur = (await getBuf(file)).duration; } catch {}
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
    await playClip(file, my);
    cancelAnimationFrame(raf);
    spans.forEach((w) => { w.classList.remove('on'); w.classList.add('read'); });
    await sleep(250);
  }
  if (my === sayToken) { LB.reading = false; $('#libBody .lib-next')?.classList.add('pulse'); }
}

/* ---------- after the story: three picture questions ---------- */
function startQuestions() { stopReading(); LB.q = 0; askQuestion(); }
function askQuestion() {
  const b = LB.book, q = b.questions[LB.q];
  if (!q) return finishBook();
  const opts = shuffle(q.options.slice());
  $('#libBody').innerHTML = `<div class="lib-page lib-quiz">
      <p class="lib-ask">${q.ask}</p>
      <div class="lib-opts">${opts.map(([v, img]) => `<button class="lib-opt" data-v="${v}"><img src="${libPath(b.id, img)}" alt="${v}" draggable="false"></button>`).join('')}</div>
      <div class="lib-nav"><button class="nav-btn" data-a="hear" aria-label="Hear the question">🔊</button><span class="lib-count">${LB.q + 1} / ${b.questions.length}</span></div></div>`;
  say(q.ask);
  $('[data-a="hear"]').onclick = () => say(q.ask);
  $$('#libBody .lib-opt').forEach((o) => (o.onclick = () => {
    if (o.dataset.v === q.answer) {
      o.classList.add('right'); sfx.yes(); say(pick(['Great job!', 'You remembered!', 'Wonderful!']));
      setTimeout(() => { LB.q++; askQuestion(); }, 1400);
    } else { o.classList.add('wrong'); sfx.no(); say('Try again!'); setTimeout(() => o.classList.remove('wrong'), 700); }
  }));
}
function finishBook() {
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

$('#libHome').onclick = () => { sfx.tap(); stopReading(); if (LB.book) { LB.book = null; openLibrary(); } else { renderHome(); show('home'); } };
$('#libRead').onclick = () => { sfx.tap(); if (LB.page >= 0) { LB.auto = true; readPage(); } };
