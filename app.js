/* =========================================================
   Learn & Play — app logic (screens, voice, rewards, progress)
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ROUND_POLICY = ContentData.get('curriculum-map', 'policy').learningRounds;
const ROUND = ROUND_POLICY.defaultQuestions;
function roundQuestionCount(cat, count) {
  if (count) return count; // explicit assessment, quest and preview lengths
  return Math.min(cat.roundLen || ROUND, GRADES[state.grade]?.roundQuestions || ROUND);
}
const KEY = 'learnplay.v1';

/* ---------- saved progress ---------- */
const state = Object.assign({ name: '', voice: true, stars: 0, stickers: [], levels: {}, best: {} }, Store.load());
// Missing or unavailable premium packs must never block the bundled, free curriculum.
void ContentPacks.load();   // device settings + the active child
const save = () => Store.save(state);
// if progress can't be saved (storage full), tell the grown-ups once instead of losing stars quietly
Store.onError = () => { if (Store.warned) return; Store.warned = true; setTimeout(() => { const n = document.createElement('div'); n.className = 'save-warn'; n.textContent = '⚠️ Progress could not be saved on this device (storage may be full). Grown-ups: ⚙️ → Save a backup.'; n.onclick = () => n.remove(); document.body.appendChild(n); }, 0); };   // storage.js decides where it goes (web now, native app later)
// a game never played yet starts in the middle of the child's grade range
const levelOf = (id) => {
  const r = state.grade && gradeRange(state.grade, id);
  const saved = state.levels[id] || (r ? r[0] : 1);
  // The badge, generator and mastery feedback must agree even after a child
  // changes grade or an older saved profile contains a higher/lower step.
  const o = r && openRange(id);
  return o ? Math.max(o[0], Math.min(o[1], saved)) : saved;
};
const maxLevelOf = (id) => (CATEGORIES.find((c) => c.id === id) || {}).maxLevel || 3;
const gameMax = maxLevelOf;
const OPTIONAL = { anatomy: 'optAnatomy' };  // off unless a parent turns it on in Settings
// telling time is core 1st–3rd grade math, so it is on unless a grown-up hides it
const sectionOff = (id) => (id === 'clock' ? !!state.hideClock : OPTIONAL[id] && !state[OPTIONAL[id]]);
// a child who reads and spells well doesn't need syllable clapping any more
const strongReader = () => levelOf('spell') >= 4 || levelOf('sent') >= 3 || (levelOf('spell') >= 3 && (state.best.spell || 0) >= 3);
// test mode keeps the child's grade; "Show all games" opens everything
// "Show all games" unlocks harder sections only: a section that ends before the child's grade
// (Tracing, Little Words, Clap It, Body Parts, Jobs …) never comes back for an older child.
const GRADE_ORDER = ['prek', 'k', 'g1', 'g2', 'g3'];
const belowGrade = (id) => {
  if (!state.grade || id === 'mix' || gradeRange(state.grade, id)) return false;
  const gi = GRADE_ORDER.indexOf(state.grade);
  return GRADE_ORDER.some((g, i) => i < gi && gradeRange(g, id)) && !GRADE_ORDER.some((g, i) => i > gi && gradeRange(g, id));
};
// with Show all games, levels keep the grade's start and may go ONE step above the grade's top;
// Pre-K (pre-readers) always stays inside its own band
const liftTop = (id) => { const r = gradeRange(state.grade, id); return state.grade === 'prek' ? r[1] : Math.min(gameMax(id), r[1] + 1); };
const openRange = (id) => { const r = state.grade && gradeRange(state.grade, id); return r ? (state.showAll ? [r[0], Math.max(r[1], liftTop(id))] : r) : null; };
const visibleGames = () => isTestMode() && (state.showAll || !state.grade) ? CATEGORIES.filter((c) => c.id !== 'placement' && !belowGrade(c.id)) : CATEGORIES.filter((c) => c.id !== 'cmp' && c.id !== 'placement' && !belowGrade(c.id) // comparisons are mixed into math, not shown as a separate game
  && !sectionOff(c.id)
  && !(c.id === 'home' && typeof myCountry === 'function' && !myCountry())
  && !(c.id === 'region' && typeof myRegion === 'function' && !myRegion())
  && !(c.id === 'check' && !(typeof checkFor === 'function' && checkFor()))
  && !(c.id === 'syl' && !state.showAll && strongReader())
  // the grade decides the sections; Show harder levels only lifts the level cap inside them
  && (!state.grade || c.id === 'mix' || gradeRange(state.grade, c.id)));
// auto level-up stops at the top of the child's grade (unless all games are shown)
const levelCap = (id) => { const r = state.grade && openRange(id); return r ? r[1] : gameMax(id); };

/* ---------- voice ---------- */
// 1) Pre-recorded natural voice clips (audio/*.mp3, listed in audio/clips.json), sentence by sentence.
// 2) Fallback: the best voice installed on the device (Premium/Enhanced first).
const clipKey = (t) => t.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const splitSentences = (t) => (t.match(/[^.!?]+[.!?]*/g) || []).map((x) => x.trim()).filter((x) => clipKey(x));
let CLIPS = {};
const clipsReady = fetch('audio/clips.json').then((r) => r.json()).then((j) => (CLIPS = j)).catch(() => {});
let sayToken = 0, actx, curSrc = null;
// text that came from a person (names) is escaped before it goes into HTML
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// a delayed step that only runs if this card is still on screen (the child may have gone home meanwhile)
const onCard = (q, fn) => { const token = R && R.navToken; return () => { if (R && R.navToken === token && R.qs[R.i] === q && $('#play').classList.contains('active')) fn(); }; };
// let sound play even when the iPhone's silent switch is on (Safari 16.4+)
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
function ctx() {
  actx = actx || new (window.AudioContext || window.webkitAudioContext)();
  // iOS can leave the context 'suspended' OR 'interrupted' (app switch, call, system speech)
  if (actx.state !== 'running') actx.resume().catch(() => {});
  return actx;
}

// Backup player: a plain <audio> element, unlocked on the first touch.
const htmlPlayer = new Audio();
htmlPlayer.preload = 'auto';
let htmlUnlocked = false;

// Every touch re-wakes audio (iPhone only allows this inside a tap).
function unlockAudio() {
  try {
    const c = ctx();
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start(0);
  } catch {}
  if (!htmlUnlocked) {
    htmlPlayer.src = 'audio/silence.mp3';
    const p = htmlPlayer.play();
    if (p && p.then) p.then(() => { htmlUnlocked = true; }).catch(() => {});
  }
}
['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach((ev) =>
  addEventListener(ev, unlockAudio, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden && actx) actx.resume().catch(() => {}); });

// decoded voice clips, newest last; only the most recent ones are kept so memory stays small on iPads
const bufs = new Map(), BUF_MAX = 80;
function getBuf(file) {
  if (bufs.has(file)) { const p = bufs.get(file); bufs.delete(file); bufs.set(file, p); return p; }
  while (bufs.size >= BUF_MAX) bufs.delete(bufs.keys().next().value);
  const p = fetch('audio/' + file).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then((ab) => new Promise((ok, bad) => ctx().decodeAudioData(ab, ok, bad)));
  bufs.set(file, p); p.catch(() => bufs.delete(file));
  return p;
}
// numbers above 110 are said in pieces from recorded clips: 347 → "three hundred", "47"
const HUNDREDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const spokenNumber = (p) => {
  const m = /^(\d{3})(\??)$/.exec(String(p).trim()); const n = m ? +m[1] : 0;
  if (!m || n <= 110) return [p];
  const h = Math.floor(n / 100), r = n % 100;
  return r ? [`${HUNDREDS[h]} hundred`, r + m[2]] : [`${HUNDREDS[h]} hundred${m[2]}`];
};
const sayParts = (text) => (Array.isArray(text) ? text.map(String) : splitSentences(text)).flatMap(spokenNumber).map((p) => (typeof localSpoken === 'function' ? localSpoken(p) : p));
function prefetch(text) { if (text) sayParts(text).forEach((p) => { const f = CLIPS[clipKey(p)]; if (f) getBuf(f).catch(() => {}); }); }
function stopClip() { try { curSrc && curSrc.stop(); } catch {} curSrc = null; try { htmlPlayer.pause(); htmlPlayer.removeAttribute('src'); htmlPlayer.load(); } catch {} }

function htmlPlay(file, token = sayToken, rate = 1) {
  if (token !== sayToken) return Promise.resolve();
  return new Promise((res) => {
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    htmlPlayer.onended = fin; htmlPlayer.onerror = fin;
    htmlPlayer.src = 'audio/' + file;
    htmlPlayer.playbackRate = rate; htmlPlayer.preservesPitch = true;
    const p = htmlPlayer.play(); if (p && p.then) p.then(() => { if (token !== sayToken) { htmlPlayer.pause(); fin(); } }).catch(fin);
    setTimeout(fin, 30000 / rate);
  });
}
const lastAudio = { path: '', err: '' };
async function playClip(file, token = sayToken, rate = 1) {
  if (token !== sayToken) return;
  if (rate !== 1) { lastAudio.path = 'html'; return htmlPlay(file, token, rate); }
  const c = ctx();
  if (c.state !== 'running') { await Promise.race([c.resume().catch(() => {}), sleep(300)]); }
  if (token !== sayToken) return;
  if (c.state !== 'running') { lastAudio.path = 'html'; return htmlPlay(file, token); }
  let buf;
  try { buf = await getBuf(file); } catch (e) { if (token !== sayToken) return; lastAudio.path = 'html'; lastAudio.err = String(e); return htmlPlay(file, token); }
  if (token !== sayToken) return;
  return new Promise((res) => {
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    try {
      if (token !== sayToken) return fin();
      const src = c.createBufferSource(); src.buffer = buf; src.connect(c.destination);
      src.onended = fin; curSrc = src; src.start();
      lastAudio.path = 'webaudio';
      setTimeout(fin, buf.duration * 1000 + 400);
    } catch (e) { if (token !== sayToken) return fin(); lastAudio.err = String(e); htmlPlay(file, token).then(fin); }
  });
}

// All narration comes from the application's existing high-quality recorded clips.
// Never select a browser/system TTS voice: mechanical voices are not allowed.

async function say(text, opts = {}) {
  const my = ++sayToken;
  stopClip();
  if (!text || !state.voice) return;
  // only touch system speech if it is actually talking (cancelling it can pause iPhone audio)
  // No system speech synthesis; only prerecorded clips are played.
  stopClip();
  if (!Object.keys(CLIPS).length) await Promise.race([clipsReady, sleep(4000)]);
  if (my !== sayToken) return;
  const parts = sayParts(text);
  if (Array.isArray(text)) text = text.join(' ');
  const files = parts.map((p) => CLIPS[clipKey(p)]);
  if (parts.length && files.every(Boolean)) {
    say.current = null;
    for (const f of files) { if (my !== sayToken) return; await playClip(f, my); }
    return;
  }
  return deviceSay(text, opts, my);
}

function deviceSay(text) {
  // Non-robotic fallback: the question and options are still visible.
  // This hook is intentionally retained for voiceaudit.js to report missing clips.
  if (testFeatureAvailable()) console.warn('Missing natural recording:', text);
  return Promise.resolve();
}

/* ---------- little sound effects (no files needed) ---------- */
function tone(freqs, { dur = 0.12, type = 'sine', gap = 0.09, vol = 0.18 } = {}) {
  try {
    ctx();
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      const t = actx.currentTime + i * gap;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.2);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.25);
    });
  } catch {}
}
const sfx = {
  tap: () => tone([660], { dur: 0.04, vol: 0.08 }),
  yes: () => tone([523, 659, 784, 1047], { type: 'triangle' }),
  no: () => tone([300, 240], { type: 'sine', gap: 0.12, vol: 0.12 }),
  win: () => tone([523, 659, 784, 1047, 784, 1047, 1319], { type: 'triangle', gap: 0.11, dur: 0.16 }),
};

/* ---------- confetti ---------- */
const cv = $('#confetti'), cx = cv.getContext('2d');
let parts = [], raf = 0;
function sizeCanvas() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
addEventListener('resize', sizeCanvas); sizeCanvas();
function confetti(n = 90, originY = 0.45) {
  const colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#cc5de8', '#ff922b', '#f783ac'];
  const W = cv.width, H = cv.height;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (4 + Math.random() * 9) * devicePixelRatio;
    parts.push({ x: W / 2, y: H * originY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6 * devicePixelRatio,
      s: (5 + Math.random() * 7) * devicePixelRatio, r: Math.random() * 6, vr: Math.random() * 0.3 - 0.15,
      c: colors[i % colors.length], life: 1, circle: Math.random() < 0.3 });
  }
  if (!raf) raf = requestAnimationFrame(step);
}
function step() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts.forEach((p) => {
    p.vy += 0.35 * devicePixelRatio; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.008;
    cx.save(); cx.globalAlpha = Math.max(0, p.life); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
    if (p.circle) { cx.beginPath(); cx.arc(0, 0, p.s / 2, 0, 7); cx.fill(); } else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    cx.restore();
  });
  parts = parts.filter((p) => p.life > 0 && p.y < cv.height + 50);
  raf = parts.length ? requestAnimationFrame(step) : (cx.clearRect(0, 0, cv.width, cv.height), 0);
}

/* Browser pinch on Home/Settings can accidentally enlarge navigation.
   Keep OS accessibility zoom available; allow native pinch on question/game screens. */
const isNavigationScreen = () => ['home', 'settings'].some((id) => $('#' + id).classList.contains('active'));
document.addEventListener('touchmove', (e) => {
  if (isNavigationScreen() && e.touches.length >= 2) e.preventDefault();
}, { passive: false });
for (const type of ['gesturestart', 'gesturechange']) {
  document.addEventListener(type, (e) => { if (isNavigationScreen()) e.preventDefault(); }, { passive: false });
}
document.addEventListener('wheel', (e) => {
  if (isNavigationScreen() && e.ctrlKey) e.preventDefault();
}, { passive: false });

let questionZoom = 1, questionBaseWidth = 0;
function setQuestionZoom(value = 1) {
  const inner = $('#qZoomInner'), space = $('#qZoomSpace'), view = $('.q-zoom-view');
  if (!inner || !space || !view) return;
  questionZoom = Math.max(1, Math.min(4, value));
  if (questionZoom <= 1) {
    inner.style.transform = ''; inner.style.width = '';
    space.style.width = ''; space.style.height = '';
    questionBaseWidth = 0; view.scrollTo(0, 0);
    return;
  }
  if (!questionBaseWidth) questionBaseWidth = inner.offsetWidth;
  inner.style.width = questionBaseWidth + 'px';
  inner.style.transform = `scale(${questionZoom})`;
  space.style.width = Math.round(questionBaseWidth * questionZoom) + 'px';
  space.style.height = Math.round(inner.offsetHeight * questionZoom) + 'px';
}
$('#qZoomIn').onclick = () => setQuestionZoom(questionZoom * 1.4);
$('#qZoomOut').onclick = () => setQuestionZoom(questionZoom / 1.4);
$('#qZoomReset').onclick = () => setQuestionZoom(1);

/* ---------- screens ---------- */
let homeScrollY = 0, navigationEpoch = 0;
function show(id) {
  const previous = $('.screen.active');
  if (previous && previous.id !== id) {
    navigationEpoch++;
    sayToken++; stopClip();
    if (previous.id === 'game' && typeof stopGame === 'function') stopGame();
  }
  if ($('#home').classList.contains('active') && id !== 'home') homeScrollY = window.scrollY;
  if (id !== 'play') { const pop = $('#pop'); pop.classList.remove('show'); pop.replaceChildren(); }
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  requestAnimationFrame(() => window.scrollTo(0, id === 'home' ? homeScrollY : 0));
}

function renderHome() {
  $('#kidAvatar').textContent = state.avatar || '🦄';
  $('#kidBtn').classList.toggle('many', Store.kids().length > 1);
  $('#hello').textContent = state.name ? `Hi, ${state.name}!` : 'Hi there!' + ' ' + ((THEMES[state.theme] || THEMES.rainbow).mascot);
  $('#starCount').textContent = state.stars;
  $('#stickerCount').textContent = state.stickers.length;
  $('#stickerLabel').textContent = state.stickers.length === 1 ? 'sticker' : 'stickers';
  $('#gradeLabel').textContent = state.grade ? gradeName(state.grade) : 'Pick grade';
  $('#gradeChip').classList.toggle('pulse', !state.grade);
  if (typeof renderPlayBanner === 'function') renderPlayBanner();
  if (typeof renderToday === 'function') renderToday();
  if (typeof renderQuest === 'function') renderQuest();
  const groups = [
    ['📝 Practice', ['check']],
    ['📖 Reading & Words', ['library', 'trace', 'phonics', 'cvc', 'w4', 'sight', 'spell', 'vocab', 'sent', 'words', 'gp', 'match', 'syl']],
    ['🔢 Math', ['add', 'sub', 'story', 'cmp', 'numsense', 'frac', 'measure', 'mul', 'div', 'clock', 'shape2']],
    ['🧩 Brain Teasers', ['pattern', 'odd', 'sequence'], 'brain'],
    ['🌍 Science & World', ['sci', 'home', 'region', 'community', 'body', 'gk', 'anatomy', 'jobs', 'flags', 'animals', 'places', 'maps', 'mix']]
  ];
  const visible = visibleGames();
  const makeTile = (c) => {
    const best = Math.min(3, state.best[c.id] || 0);
    const lv = c.id === 'mix' || c.trace ? '' : stepDots(c.id);
    const icon = c.id === 'home' && typeof myCountry === 'function' && myCountry() ? myCountry().flag : c.icon;
    return `<button class="tile" data-cat="${c.id}" style="--c:${c.color}">
      ${lv}<span class="ti">${icon}</span><span class="tt">${typeof editionTitle === 'function' ? editionTitle(c.id, localTileTitle(c.id, c.title)) : c.title}</span><span class="ts">${typeof editionSub === 'function' ? editionSub(c.id, gradeSub(c.id, c.sub)) : gradeSub(c.id, c.sub)}</span>
      <span class="tb">${'★'.repeat(best)}${'☆'.repeat(3 - best)}</span></button>`;
  };
  // brain games (memory, puzzles, mazes …) sit right inside Brain Teasers: a tap opens the game
  const gameTile = (g) => `<button class="tile" data-game="${g.id}" style="--c:${g.color}">${lvBadge(g.id)}<span class="ti">${g.icon}</span><span class="tt">${g.title}</span><span class="ts">puzzle game</span></button>`;
  const catalog = groups.map(([title, ids, brain]) => {
    const cats = visible.filter((c) => ids.includes(c.id));
    const games = brain === 'brain' && typeof brainGames === 'function' ? brainGames() : [];
    return cats.length || games.length ? `<section class="catalog-section"><h2>${title}</h2><div class="grid">${cats.map(makeTile).join('')}${games.map(gameTile).join('')}</div></section>` : '';
  }).join('');
  // 1st–3rd grade see 28–35 activities: show a short recommended row first and fold the rest behind "Explore"
  const fold = ['g1', 'g2', 'g3'].includes(state.grade) && !isTestMode();
  if (!fold) { $('#grid').innerHTML = locHTML(catalog); return; }
  const ok = new Set(visible.map((c) => c.id));
  const quest = typeof questFor === 'function' ? questFor().steps.filter((x) => !x.done).map((x) => x.cat) : [];
  const recIds = [...new Set([...quest, ...(GRADES[state.grade].practiceFocus || [])])].filter((id) => ok.has(id) && id !== 'mix').slice(0, 6);
  const rec = recIds.map((id) => visible.find((c) => c.id === id)).filter(Boolean);
  const total = visible.filter((c) => c.id !== 'mix').length;
  // automated test browsers keep the catalog open unless they ask for the folded view (?explore=closed)
  const open = state.exploreOpen != null ? state.exploreOpen : (navigator.webdriver && !/[?&]explore=closed\b/.test(location.search));
  $('#grid').innerHTML = locHTML(`${rec.length ? `<section class="catalog-section rec-section"><h2>⭐ Recommended for you</h2><div class="grid">${rec.map(makeTile).join('')}</div></section>` : ''}
    <details class="explore"${open ? ' open' : ''}><summary>🧭 Explore all ${total} activities</summary>${catalog}</details>`);
  const d = $('#grid .explore');
  d.addEventListener('toggle', () => { state.exploreOpen = d.open; save(); });
}

/* ---------- a round ---------- */
let R = null; // current round

function startRound(catId, count, browse = false, atLevel = null, focusObjective = null) {
  sayToken++; stopClip(); $('#pop').classList.remove('show'); $('#pop').replaceChildren();
  const cat = CATEGORIES.find((c) => c.id === catId);
  const real = visibleGames().filter((c) => c.gen);
  const qs = [], seen = new Set(), seenContent = new Set();
  let guard = 0, drop = 0, misses = 0;
  const N = roundQuestionCount(cat, count);
  // Schedule a small number of explicit authored-objective review cards without
  // displacing the full grade-level mix. The grade's JSON policy owns the cap.
  const reviewPolicy = state.grade && GRADES[state.grade]?.reviewSchedule;
  const focusEnabled = !browse && !isTestMode() && !!cat.gen && !!reviewPolicy &&
    typeof authoredReviewQuestions === 'function';
  const requestedFocusLevel = atLevel || levelOf(cat.id);
  const focusRange = focusEnabled ? openRange(cat.id) : null;
  const focusLevel = focusRange
    ? Math.min(focusRange[1], Math.max(focusRange[0], requestedFocusLevel))
    : requestedFocusLevel;
  const focusedPool = focusEnabled
    ? authoredReviewQuestions(cat.id, focusLevel, focusObjective) : [];
  const reviewCap = focusEnabled ? Math.min(N, reviewPolicy.maxReviewCards) : 0;
  const reviewSpacing = reviewCap ? Math.max(1, Math.floor(N / reviewCap)) : 1;
  let reviewed = 0;
  // questions seen in the last few rounds are skipped while there are fresh ones to ask
  state.recent = state.recent || {};
  const recent = new Set(state.recent[cat.id] || []);
  state.recentContent = state.recentContent || {};
  const recentContent = new Set(state.recentContent[cat.id] || []);
  const fingerprint = (q) => {
    // cards that keep their content outside main (Match It pairs, spelling, ordering, paths) are told apart by it
    const body = q.match || q.order || q.fillIn || q.passageFill || q.letterPath || q.spell || '';
    const raw = String(q.text || '') + '|' + String(q.answer) + '|' + String(q.main || '') + '|' + (body ? JSON.stringify(body).slice(0, 600) : '');
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) hash = Math.imul(hash ^ raw.charCodeAt(i), 16777619);
    return String(hash >>> 0);
  };
  while (qs.length < N && guard++ < 600) {
    const c = cat.gen ? cat : real[Math.floor(Math.random() * real.length)];
    // Grade limits apply to individual questions, not only category tiles.
    // Adaptive progress can be above a grade's range from an older profile; clamp
    // ordinary child rounds, but preserve unrestricted explicit QA previews.
    const range = !browse ? openRange(c.id) : null;   // the test browser previews any level
    const requestedLevel = atLevel || levelOf(c.id);
    const lvTop = range ? Math.min(range[1], Math.max(range[0], requestedLevel)) : requestedLevel;
    // if this level keeps producing cards the child can't do, step down instead of ending with an empty round
    const lv = Math.max(1, lvTop - drop);
    const chooseReview = focusedPool.length && reviewed < reviewCap &&
      qs.length % reviewSpacing === 0;
    const reviewedQuestion = chooseReview ? focusedPool.shift() : null;
    // Illustrated activities appear as variations in existing question rounds.
    const illustrated = !reviewedQuestion && typeof IllustratedActivities !== 'undefined' &&
      IllustratedActivities.available(state.grade, c.id, lv) && (qs.length % 4 === 1 || (qs.length === 0 && Math.random() < 0.45));
    const added = !reviewedQuestion && !illustrated && Math.random() < 0.35 &&
      ContentPacks.choose(state.grade, c.id, lv, [...seen, ...(!browse && guard < 350 ? recent : [])]);
    let q = reviewedQuestion || (illustrated && IllustratedActivities.make(state.grade, c.id, lv)) || added || c.gen(lv);
    // Keep a single occurrence of each illustrated exercise per round.
    if (q.illustrated && seen.has(q.key)) q = c.gen(lv);
    const contentId = fingerprint(q);
    // Never repeat an identical question in one round, even after exhausting
    // retries. Return a shorter round rather than teaching the same card twice.
    if (seen.has(q.key) || seenContent.has(contentId)) continue;
    // A scheduled review never overrides recent-question protection, even when
    // the ordinary random generator has exhausted its retry budget.
    if (!browse && catId !== 'placement' &&
        (reviewedQuestion || guard < 350) &&
        (recent.has(q.key) || recentContent.has(contentId))) continue;
    // Every delivered question carries its permitted grade set. Explicit per-item
    // restrictions may narrow it further; never surface an older-grade card in Pre-K.
    const eligibleGrades = Object.keys(GRADES).filter(grade => {
      const allowed = gradeRange(grade, c.id);
      return allowed && lv >= allowed[0] && lv <= allowed[1];
    });
    q.grades = Array.isArray(q.grades) ? q.grades.filter(g => eligibleGrades.includes(g)) : eligibleGrades;
    const tooHard = (!browse && state.grade && !state.showAll && !q.grades.includes(state.grade)) ||
      (!browse && state.grade && c.id !== 'placement' && typeof gradeFits === 'function' && !gradeFits(q, state.grade, c.id));
    if (tooHard) { if (++misses >= 40 && lv > 1) { drop++; misses = 0; } continue; }
    misses = 0; seen.add(q.key); seenContent.add(contentId); q.cat = c; q.level = lv; qs.push(q);
    if (reviewedQuestion === q) { reviewed++; q.reviewScheduled = true; }
  }
  if (!browse && !isTestMode() && catId !== 'placement') {
    state.recent[cat.id] = [...(state.recent[cat.id] || []), ...qs.map((q) => q.key)].slice(-60);
    state.recentContent[cat.id] = [...(state.recentContent[cat.id] || []), ...qs.map(fingerprint)].slice(-60);
    save();
  }
  if (!qs.length) { renderHome(); show('home'); return; }   // nothing for this grade (e.g. a stale link)
  R = { sessionLevel: levelOf(cat.id), cat, qs, i: 0, firstTry: 0, mistakes: 0, streak: 0, best: 0, browse, atLevel };
  $('#playTitle').textContent = `${cat.icon} ${typeof editionTitle === 'function' ? editionTitle(cat.id, localTileTitle(cat.id, cat.title)) : cat.title}`;
  document.body.style.setProperty('--theme', cat.color);
  show('play');
  renderQ();
}

function renderProgress() {
  $('#diffLv').textContent = R.cat.id === 'mix' ? '' : (([s, n]) => `Step ${s} of ${n}`)(gradeStep(R.cat.id, R.sessionLevel));
  $('#diffBtn').hidden = R.cat.id === 'mix';
  $('#qaPosition').textContent = (R.i + 1) + ' / ' + R.qs.length;
  $('#prevBtn').disabled = R.i === 0;
  $('#progress').innerHTML = R.qs.map((q, i) =>
    `<span class="dot ${i < R.i ? (q.ok ? 'ok' : 'meh') : i === R.i ? 'now' : ''}">${i < R.i ? (q.ok ? '⭐' : '✔︎') : ''}</span>`).join('');
}

/* ---------- original 2D anatomy fallback; no external licensed model ---------- */
function dropBody3D() {}
function releaseBody3D() {}
function mountBody3D(q) {
  // Keep old QA/backups compatible if a legacy 3D question is requested.
  // No dynamic code import, network access, or external anatomy mesh.
  const spec=q.body3d;
  $('#qMain').innerHTML = spec.layer === 'skin'
    ? bodySVG(spec.highlight || null) : organSVG(spec.highlight || null);
  q.tap=!!spec.tap;
}

const READING_PRESENTATION_POLICY = ContentData.get('curriculum-map', 'policy').presentation;
function applyReadingPresentation() {
  const presentation = (state.grade && GRADES[state.grade]?.presentation) || READING_PRESENTATION_POLICY;
  // Grade policy owns typography; renderers just expose its values to CSS.
  const play = $('#play');
  play.style.setProperty('--grade-reading-scale', String(presentation.readingScale));
  play.style.setProperty('--grade-reading-line-height', String(presentation.readingLineHeight));
}

function renderQ() {
  // Increment the navigation epoch so delayed feedback cannot advance a card revisited in QA.
  R.navToken = (R.navToken || 0) + 1;
  setQuestionZoom(1);
  // A prior answer's recording or feedback must never appear on an unanswered card.
  sayToken++; stopClip(); $('#pop').classList.remove('show'); $('#pop').replaceChildren();
  dropBody3D();
  const q = R.qs[R.i];
  applyReadingPresentation();
  q.t0 = Date.now();
  q.tries = 0; q.hintShown = false; R.locked = false;
  renderProgress();
  $('#qText').innerHTML = locHTML(q.text);
  $('#qMain').className = 'q-main ' + (q.mainClass || '');
  $('#qMain').innerHTML = locHTML(q.main);
  $('#hintBox').innerHTML = ''; $('#hintBox').hidden = true;
  $('#hintBtn').hidden = !q.hint;
  $('#hintBtn').classList.remove('glow');
  const opts = $('#options');
  opts.className = 'options ' + (q.optClass || '') + (q.options.length === 4 ? ' four' : '') + (q.options.length === 2 ? ' two' : '');
  opts.innerHTML = q.options.map((o) => `<button class="opt" data-v="${String(o.v).replace(/"/g, '&quot;')}">${locHTML(String(o.html))}</button>`).join('');
  [...opts.children].forEach((b, k) => { b.style.animationDelay = `${k * 60}ms`; b.onclick = () => choose(q, q.options[k].v, b); if (isTestMode() && String(q.options[k].v) === String(q.answer)) b.dataset.ok = '1'; });
  if (isTestMode()) $('#qText').insertAdjacentHTML('beforeend', `<div class="test-ans">🧪 ${String(q.answer)}</div>`);
  if (q.spell) renderSpell(q);
  if (q.body3d) mountBody3D(q);
  if (q.key?.startsWith('ana-') && $('#qMain .organ-fig') && typeof organExplorer === 'function')
    $('#qMain').insertAdjacentHTML('beforeend',organExplorer());
  if (q.illustrated && typeof IllustratedActivities !== 'undefined') {
    IllustratedActivities.mount(q, $('#qMain'), {
      choose: (value, element) => choose(q, value, element),
      mistake: () => {
        if (R.locked || R.qs[R.i] !== q) return;
        q.tries++; R.mistakes++; R.streak = 0; sfx.no();
        say('Try again.');
        if (q.tries === 1 && q.hint && !q.hintShown) showHint(q, true);
      }
    });
  }
  if (q.match) renderMatch(q);
  if (q.puzzle) renderPuzzle(q);
  if (q.multi) renderMulti(q);
  if (q.letterPath) renderLetterPath(q);
  if (q.fillIn) renderFillIn(q);
  if (q.passageFill) renderPassageFill(q);
  if (q.order) renderOrder(q);
  if (q.build && typeof renderBuild === 'function') renderBuild(q);
  if (q.blend && typeof wireBlend === 'function') wireBlend(q);
  if (q.letterSound && typeof wireLetter === 'function') wireLetter(q);
  if (q.tap) $$('#qMain [data-val]').forEach((g) => {
    if (!g.dataset.val) return;
    // Tap areas overlap (the eyes sit inside the head, a wrist on the hand). A tap is right
    // when the finger lands anywhere inside the asked part, even if a smaller part is on top.
    g.onclick = (e) => {
      let val = g.dataset.val, el = g;
      if (e && e.clientX != null && document.elementsFromPoint) {
        const hit = document.elementsFromPoint(e.clientX, e.clientY).map((x) => x.closest && x.closest('#qMain [data-val]')).find((x) => x && String(x.dataset.val) === String(q.answer));
        if (hit) { val = hit.dataset.val; el = hit; }
      }
      choose(q, val, el);
    };
    g.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.click(); }
    };
  });
  $$('[data-speak]', $('#qMain')).forEach((b) => (b.onclick = () => { sfx.tap(); say(b.dataset.speak, { rate: 0.8 }); }));
  // nudge the hint after a while, but never show the picture by itself
  clearTimeout(R.nudge);
  R.nudge = setTimeout(onCard(q, () => { if (!q.hintShown) $('#hintBtn').classList.add('glow'); }), 12000);
  setTimeout(onCard(q, () => { if(!$('#lessonSheet'))say(q.say || ''); }), 250);
  const nq = R.qs[R.i + 1]; if (nq) { prefetch(nq.say); nq.hint && prefetch(nq.hint.say); }
  q.hint && prefetch(q.hint.say);
}

function removeOneWrong(q) {
  const wrong = [...$('#options').children].filter((b) => !b.disabled && String(b.dataset.v) !== String(q.answer));
  if (wrong.length > 1) { const b = pick(wrong); b.classList.add('wrong'); b.disabled = true; }
}
function showHint(q, auto = false) {
  if (q.hint && q.hint.glow && B3D.view) { B3D.view.highlight(q.answer); q.hintShown = true; $('#hintBtn').classList.remove('glow'); speakHint(q); return; }
  if (q.illustrated && q.illHint) { q.hintShown = true; q.illHint(); $('#hintBtn').classList.remove('glow'); if (!auto) speakHint(q); return; }
  if (q.match) { matchHint(q); $('#hintBtn').classList.remove('glow'); return; }
  if (q.puzzle) { if (!R.locked && q.puzzleCtl) q.puzzleCtl.hint(); q.hintShown = true; $('#hintBtn').classList.remove('glow'); return; }
  if (q.fillIn || q.passageFill || q.order) { if (!R.locked && q.partHint) q.partHint(); q.hintShown = true; $('#hintBtn').classList.remove('glow'); speakHint(q); return; }
  if (q.letterPath) { if (!R.locked && q.pathHint) q.pathHint(); q.hintShown = true; $('#hintBtn').classList.remove('glow'); speakHint(q); return; }
  if (q.spell) { spellHint(q); $('#hintBtn').classList.remove('glow'); if (!auto) speakHint(q); return; }
  if (q.hint && q.hint.remove) { if (!q.hintShown || auto === false) removeOneWrong(q); q.hintShown = true; $('#hintBtn').classList.remove('glow'); if (!auto) speakHint(q); return; }
  if (!q.hint || q.hintShown) { if (q.hint) speakHint(q); return; }
  q.hintShown = true;
  if (q.hint.mark) $$('#qMain .sw').forEach((w, i) => w.classList.toggle('mark', q.hint.mark.includes(i)));
  const box = $('#hintBox');
  box.innerHTML = locHTML(q.hint.html || '');
  box.hidden = !q.hint.html;
  box.classList.remove('hint-in'); void box.offsetWidth; box.classList.add('hint-in');
  $('#hintBtn').classList.remove('glow');
  if (!auto) speakHint(q);
}

function speakHint(q) {
  const h = q.hint;
  if (h.karaoke) return karaoke(h.say);
  say(h.say, { rate: h.slow ? 0.7 : 0.9, slow: h.slow });
}

// read a sentence aloud, lighting up each word
async function karaoke(text) {
  const spans = $$('.sw');
  const light = (k) => spans.forEach((s, j) => s.classList.toggle('lit', j === k));
  let i = 0, gotBoundary = false;
  const p = say(text, { rate: 0.75, slow: true });
  const u = say.current;
  if (u) u._onWord = (ev) => { if (ev.name && ev.name !== 'word') return; gotBoundary = true; light(i++); };
  // fallback: step through words on a timer if the voice gives no word events
  let k = 0;
  const timer = setTimeout(function tick() {
    if (gotBoundary || k >= spans.length) return;
    light(k);
    const len = spans[k].textContent.length;
    k++;
    tick.t = setTimeout(tick, 330 + len * 55);
    karaoke.t = tick.t;
  }, 450);
  await p; clearTimeout(timer); clearTimeout(karaoke.t);
  setTimeout(() => light(-1), 400);
}

/* ---------- spelling: drag or tap letters into the blanks ---------- */
function renderSpell(q) {
  const { word, blanks, tiles } = q.spell;
  q.slots = {};                       // blank index -> tile id
  const row = document.createElement('div');
  row.className = 'spell-row';
  row.style.setProperty('--n', word.length);
  row.innerHTML = word.split('').map((c, i) => blanks.includes(i)
    ? `<div class="slot" data-i="${i}"></div>`
    : `<div class="slot fixed">${c}</div>`).join('');
  $('#qMain').appendChild(row);
  const tray = $('#options');
  tray.innerHTML = tiles.map((l, k) => `<button class="tile-l" data-id="${k}" data-l="${l}" style="animation-delay:${k * 50}ms">${l}</button>`).join('');
  $$('.tile-l', tray).forEach((t) => t.addEventListener('pointerdown', (e) => dragStart(e, q, t)));
  // a filled box can be picked up again: drop it in another box, back on the tray, or just tap it
  $$('.slot[data-i]', row).forEach((sl) => sl.addEventListener('pointerdown', (e) => {
    if (R.locked || sl.classList.contains('given')) return;
    const id = q.slots[sl.dataset.i]; if (id == null) return;
    dragStart(e, q, tileEl(id), sl);
  }));
}
const tileEl = (id) => $(`.tile-l[data-id="${id}"]`);
const slotEl = (i) => $(`.slot[data-i="${i}"]`);
function place(q, i, id) {
  const old = q.slots[i]; if (old != null) unplace(q, i);
  const t = tileEl(id), sl0 = slotEl(i); if (!t || !sl0 || R.qs[R.i] !== q) return;   // the card may have changed meanwhile
  q.slots[i] = id; t.classList.add('used');
  const sl = slotEl(i); sl.textContent = t.dataset.l; sl.classList.add('full'); sl.classList.remove('bad');
  sl.classList.remove('drop-in'); void sl.offsetWidth; sl.classList.add('drop-in');
  checkSpell(q);
}
function unplace(q, i) {
  const id = q.slots[i]; if (id == null) return;
  delete q.slots[i];
  const t = tileEl(id); if (t) t.classList.remove('used');
  const sl = slotEl(i); sl.textContent = ''; sl.classList.remove('full', 'bad', 'given');
}
const firstEmpty = (q) => q.spell.blanks.find((i) => q.slots[i] == null);

let drag = null;
function dragStart(e, q, t, fromSlot = null) {
  if (R.locked || !t || (!fromSlot && t.classList.contains('used'))) return;
  e.preventDefault();
  const r = (fromSlot || t).getBoundingClientRect();
  const ghost = t.cloneNode(true);
  ghost.className = 'tile-l ghost';
  Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.appendChild(ghost);
  drag = { q, t, ghost, from: fromSlot ? +fromSlot.dataset.i : null, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, id: e.pointerId };
  if (!fromSlot) t.classList.add('lifting'); else fromSlot.classList.add('lifting');
  sfx.tap();
}
addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.moved = true;
  drag.ghost.style.left = e.clientX - drag.dx + 'px';
  drag.ghost.style.top = e.clientY - drag.dy + 'px';
  $$('.slot.over').forEach((s) => s.classList.remove('over'));
  const over = slotUnder(e.clientX, e.clientY); if (over) over.classList.add('over');
}, { passive: true });
function slotUnder(x, y) {
  // generous target: nearest blank within 70px of the finger
  let best = null, bd = 70;
  $$('.slot[data-i]').forEach((s) => {
    const r = s.getBoundingClientRect();
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (d < bd) { bd = d; best = s; }
  });
  return best;
}
function dragEnd(e) {
  if (!drag || (e.pointerId != null && e.pointerId !== drag.id)) return;
  const { q, t, ghost, moved, from } = drag; drag = null;
  ghost.remove(); t.classList.remove('lifting'); $$('.slot.lifting').forEach((s) => s.classList.remove('lifting'));
  $$('.slot.over').forEach((s) => s.classList.remove('over'));
  if (R.locked) return;
  const id = +t.dataset.id;
  if (from != null) {                                         // moving a letter that is already in a box
    if (R.qs[R.i] !== q || q.slots[from] !== id) return;
    const sl = moved ? slotUnder(e.clientX, e.clientY) : null, to = sl ? +sl.dataset.i : null;
    if (!moved || to === from) { if (!moved) { sfx.tap(); unplace(q, from); } return; }
    if (to == null) { sfx.tap(); unplace(q, from); return; }  // dropped on the tray: back it goes
    const other = q.slots[to]; unplace(q, from);
    if (other != null && slotEl(to).classList.contains('given')) { place(q, from, id); return; }
    place(q, to, id); if (other != null) place(q, from, other);
    return;
  }
  if (!moved) { const i = firstEmpty(q); if (i != null) place(q, i, id); return; }   // a tap fills the next blank
  const sl = slotUnder(e.clientX, e.clientY);
  if (sl) place(q, +sl.dataset.i, id);
}
addEventListener('pointerup', dragEnd);
addEventListener('pointercancel', dragEnd);

function checkSpell(q) {
  const { word, blanks } = q.spell;
  if (blanks.some((i) => q.slots[i] == null)) return;
  R.locked = true;
  const wrong = blanks.filter((i) => tileEl(q.slots[i]).dataset.l !== word[i]);
  setTimeout(onCard(q, () => {
    if (!wrong.length) {
      clearTimeout(R.nudge);
      const first = q.tries === 0;
      q.ok = first;
      creditLearningQuestion(q);
      if (first) { R.firstTry++; R.streak++; R.best = Math.max(R.best, R.streak); } else R.streak = 0;
      $$('.slot').forEach((s, k) => { s.classList.add('win'); s.style.animationDelay = `${k * 90}ms`; });
      celebrate(first);
      setTimeout(onCard(q, next), first ? 2000 : 1700);
      return;
    }
    q.tries++; R.mistakes++; R.streak = 0;
    wrong.forEach((i) => { const el = slotEl(i); if (el) el.classList.add('bad'); });
    sfx.no();
    const oops = ['Oops! Try again.', 'Almost! Try again.', 'Not quite. You can do it!'][Math.min(q.tries - 1, 2)];
    setTimeout(() => {
      wrong.forEach((i) => unplace(q, i));
      R.locked = false;
      if (q.tries === 1) spellHint(q);         // first miss: one correct letter is given
      say(oops).then(() => say(q.spell.word));
    }, 800);
  }), 250);
}
function spellHint(q) {
  if (R.locked) return;
  q.hintShown = true;
  const { word } = q.spell;
  const i = firstEmpty(q); if (i == null) return;
  const t = $$('.tile-l').find((x) => !x.classList.contains('used') && x.dataset.l === word[i]);
  if (!t) return;
  t.classList.add('glow-l'); setTimeout(() => t.classList.remove('glow-l'), 900);
  setTimeout(() => { place(q, i, +t.dataset.id); const sl = slotEl(i); sl && sl.classList.add('given'); }, 500);
}

/* ---------- Match It: tap left, then tap its partner on the right ---------- */
function renderMatch(q) {
  const { left, right } = q.match;
  q.done = new Set(); q.selL = null; q.selSide = null;
  const box = $('#options');
  box.innerHTML = `<div class="m-cols"><div class="m-col">${left.map((x) => `<button class="m-item L" data-id="${x.id}">${x.html}</button>`).join('')}</div>
    <svg class="m-lines"><defs>${['ok', 'rubber'].map((c) => `<marker id="mArrow-${c}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="m-arrow ${c}"/></marker>`).join('')}</defs></svg>
    <div class="m-col">${right.map((x) => `<button class="m-item R" data-id="${x.id}">${x.html}</button>`).join('')}</div></div>`;
  const svg = $('.m-lines', box), items = () => $$('.m-item', box);
  const side = (el) => (el.classList.contains('L') ? 'L' : 'R');
  const clearSel = () => items().forEach((x) => x.classList.remove('sel'));
  // a pair is one left and one right item, picked in either order or dragged from either side
  function pair(a, b) {
    if (R.locked || a === b || side(a) === side(b)) return;
    const L = side(a) === 'L' ? a : b, Rt = L === a ? b : a;
    if (L.classList.contains('ok') || Rt.classList.contains('ok')) return;
    clearSel(); q.selL = null; q.selSide = null;
    if (L.dataset.id === Rt.dataset.id) {
      L.classList.add('ok'); Rt.classList.add('ok'); drawLine(a, b, true);
      q.done.add(+L.dataset.id); sfx.yes();
      if (q.done.size === left.length) matchDone(q);
    } else {
      q.tries++; R.mistakes++; R.streak = 0; sfx.no();
      L.classList.add('bad'); Rt.classList.add('bad');
      setTimeout(() => { L.classList.remove('bad'); Rt.classList.remove('bad'); }, 500);
      if (q.tries === 2) say('Look carefully, and try again!');
    }
  }
  const picked = () => items().find((x) => x.classList.contains('sel'));
  items().forEach((b) => (b.onclick = () => {
    if (R.locked || b.classList.contains('ok')) return;
    const cur = picked();
    if (cur && side(cur) !== side(b)) return pair(cur, b);
    clearSel(); b.classList.add('sel'); sfx.tap();
  }));
  // drag an arrow from any item to its partner on the other side (tapping one then the other still works)
  items().forEach((b) => b.addEventListener('pointerdown', (e) => {
    if (R.locked || b.classList.contains('ok')) return;
    const s0 = svg.getBoundingClientRect(), r0 = b.getBoundingClientRect(), fromL = side(b) === 'L';
    const x1 = (fromL ? r0.right : r0.left) - s0.left, y1 = r0.top + r0.height / 2 - s0.top;
    svg.insertAdjacentHTML('beforeend', `<line class="rubber" x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1}" marker-end="url(#mArrow-rubber)"/>`);
    const line = svg.lastElementChild; let moved = false; const id = e.pointerId;
    const mv = (ev) => { if (ev.pointerId !== id) return; if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 10) moved = true;
      line.setAttribute('x2', ev.clientX - s0.left); line.setAttribute('y2', ev.clientY - s0.top); };
    const up = (ev) => { if (ev.pointerId !== id) return;
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); line.remove();
      if (!moved || ev.type === 'pointercancel') return;
      const hit = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.m-item');
      if (hit && hit !== b && side(hit) !== side(b) && !hit.classList.contains('ok')) { clearSel(); pair(b, hit); } };
    addEventListener('pointermove', mv, { passive: true }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }));
}
function drawLine(a, b, ok) {
  const svg = $('.m-lines'); if (!svg) return;
  const s = svg.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
  const fromL = a.classList.contains('L');   // the arrow points the way it was drawn
  const x1 = (fromL ? ra.right : ra.left) - s.left, y1 = ra.top + ra.height / 2 - s.top, x2 = (fromL ? rb.left : rb.right) - s.left, y2 = rb.top + rb.height / 2 - s.top;
  svg.insertAdjacentHTML('beforeend', `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${ok ? 'ok' : ''}" marker-end="url(#mArrow-ok)"/>`);
}
// a word search or crossword as one card in the round: mistakes count, finishing it answers the card
function renderPuzzle(q) {
  const box = document.createElement('div'); box.className = 'puzzle-card';
  $('#qMain').appendChild(box); $('#options').innerHTML = '';
  const cb = { miss: () => { if (R.qs[R.i] !== q || R.locked) return; q.tries++; R.mistakes++; R.streak = 0; },
    done: () => { if (R.qs[R.i] === q && !R.locked) matchDone(q); } };
  q.puzzleCtl = q.puzzle.kind === 'wsearch' ? mountWordSearch(box, q.puzzle.size, q.puzzle.count, q.puzzle.down, cb) : mountCrossword(box, q.puzzle.words, q.puzzle.lv, cb);
}
// tap ALL the right ones: each right tap stays lit; a wrong tap is a mistake; the last right one answers the card
function renderMulti(q) {
  const want = new Set(q.multi.map(String)), got = new Set();
  const status = document.createElement('p'); status.className='multi-status'; status.setAttribute('role','status'); $('#qMain').appendChild(status);
  const paint = () => { status.textContent = `${got.size} of ${want.size} found`; }; paint();
  [...$('#options').children].forEach((b, k) => (b.onclick = () => {
    if (R.locked || R.qs[R.i] !== q) return;
    const v = String(q.options[k].v);
    if (got.has(v)) return;
    if (want.has(v)) { got.add(v); paint(); b.classList.add('right'); sfx.yes(); if (got.size === want.size) matchDone(q); }
    else { q.tries++; R.mistakes++; R.streak = 0; b.classList.add('wrong'); b.disabled = true; sfx.no(); if (q.tries === 1) say('Look carefully, and try again!'); }
  }));
  if (isTestMode()) [...$('#options').children].forEach((b, k) => { if (want.has(String(q.options[k].v))) b.dataset.ok = '1'; });
}
// follow the letter from the baby to its mom: tap (or slide over) the next box on the path
function renderLetterPath(q) {
  const { cols, rows, grid, route, hero, home } = q.letterPath;
  const box = document.createElement('div'); box.className = 'lp-grid' + (q.letterPath.words ? ' words' : ''); box.style.setProperty('--c', cols);
  box.innerHTML = grid.map((l, k) => `<button class="lp-cell" data-k="${k}">${l}</button>`).join('');
  $('#qMain').appendChild(box); $('#options').innerHTML = '';
  const idx = route.map(([x, y]) => y * cols + x);
  const cell = (k) => box.children[k];
  if (q.letterPath.words) cell(idx[0]).insertAdjacentHTML('afterbegin', `<span class="lp-start">${hero}</span>`);
  else cell(idx[0]).innerHTML = `<span class="lp-pic">${hero}</span>`;
  cell(idx[0]).classList.add('on');
  cell(idx[idx.length - 1]).insertAdjacentHTML('beforeend', `<span class="lp-home">${home}</span>`);
  let at = 0;
  const step = (k) => {
    if (R.locked || R.qs[R.i] !== q) return;
    if (k === idx[at] || box.children[k].classList.contains('on')) return;
    if (k === idx[at + 1]) {
      at++; const c = cell(k); c.classList.add('on'); sfx.tap();
      if (at === idx.length - 1) { if (!q.letterPath.words) c.innerHTML = `<span class="lp-pic">${hero}</span><span class="lp-home">${home}</span>`; matchDone(q); }
      return;
    }
    // next to the path but the wrong letter (or not next to it): a mistake, once per box
    const c = cell(k); if (c.classList.contains('bad')) return;
    q.tries++; R.mistakes++; R.streak = 0; c.classList.add('bad'); sfx.no(); setTimeout(() => c.classList.remove('bad'), 600);
  };
  box.addEventListener('pointerdown', (e) => { const c = e.target.closest('.lp-cell'); if (c) { e.preventDefault(); box.setPointerCapture && box.setPointerCapture(e.pointerId); box.dragging = true; step(+c.dataset.k); } });
  box.addEventListener('pointermove', (e) => { if (!box.dragging) return; const el = document.elementFromPoint(e.clientX, e.clientY); const c = el && el.closest && el.closest('.lp-cell'); if (c && box.contains(c) && +c.dataset.k === idx[at + 1]) step(+c.dataset.k); });
  const up = () => (box.dragging = false); box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  q.pathHint = () => { const c = cell(idx[at + 1]); if (c) { c.classList.remove('glow-l'); void c.offsetWidth; c.classList.add('glow-l'); } };
  if (testFeatureAvailable()) window.__letterPath = { idx, step };
}
// several small questions on one screen share these: a right answer locks in, a wrong one is a mistake
const partMiss = (q, el) => { q.tries++; R.mistakes++; R.streak = 0; sfx.no(); if (el) { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); } };
const live = (q) => !R.locked && R.qs[R.i] === q;
// word box: tap a blank, then a word from the box (the first open blank is picked for you)
// drag a word chip onto a blank (tapping a chip still works); onDrop(blankEl) runs when it lands on one
function chipDrag(chip, blanksOf, onDrop) {
  chip.style.touchAction = 'none';
  chip.addEventListener('pointerdown', (e) => {
    if (chip.disabled) return;
    const r = chip.getBoundingClientRect(), id = e.pointerId; let ghost = null;
    const mv = (ev) => { if (ev.pointerId !== id) return;
      if (!ghost && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 8) { ghost = chip.cloneNode(true); ghost.classList.add('chip-ghost'); document.body.appendChild(ghost); chip.classList.add('lifting'); }
      if (ghost) { ghost.style.left = ev.clientX - r.width / 2 + 'px'; ghost.style.top = ev.clientY - r.height / 2 + 'px'; } };
    const up = (ev) => { if (ev.pointerId !== id) return;
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (!ghost) return; ghost.remove(); chip.classList.remove('lifting');
      if (ev.type === 'pointercancel') return;
      let best = null, bd = 60; blanksOf().forEach((b) => { const k = b.getBoundingClientRect(); const d = Math.hypot(ev.clientX - (k.left + k.width / 2), ev.clientY - (k.top + k.height / 2)); if (d < bd) { bd = d; best = b; } });
      if (best) { chip.dataset.dragged = '1'; onDrop(best); } };
    addEventListener('pointermove', mv, { passive: true }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
}
function renderFillIn(q) {
  const { words, lines } = q.fillIn, wrap = document.createElement('div'); wrap.className = 'g1-fill';
  wrap.innerHTML = `<div class="g1-box">${words.map((w) => `<button class="g1-chip" data-w="${w}">${w}</button>`).join('')}</div>` +
    lines.map((l, i) => `<div class="g1-line"><span class="g1-lpic">${l.pic}</span><span>${l.text.replace('___', `<button class="g1-blank" data-i="${i}">&nbsp;</button>`)}</span></div>`).join('');
  $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
  const done = new Set(); let sel = 0;
  const blank = (i) => $(`.g1-blank[data-i="${i}"]`, wrap);
  const mark = () => $$('.g1-blank', wrap).forEach((b) => b.classList.toggle('sel', +b.dataset.i === sel && !done.has(sel)));
  $$('.g1-blank', wrap).forEach((b) => (b.onclick = () => { if (!live(q) || done.has(+b.dataset.i)) return; sfx.tap(); sel = +b.dataset.i; mark(); }));
  $$('.g1-chip', wrap).forEach((c) => (c.onclick = () => {
    if (!live(q) || c.disabled) return;
    if (c.dataset.w === lines[sel].answer) {
      done.add(sel); const b = blank(sel); b.textContent = c.dataset.w; b.classList.add('ok'); c.disabled = true; sfx.yes();
      if (done.size === lines.length) return matchDone(q);
      sel = lines.findIndex((_, i) => !done.has(i)); mark();
    } else partMiss(q, blank(sel));
  }));
  $$('.g1-chip', wrap).forEach((c) => chipDrag(c, () => $$('.g1-blank', wrap).filter((b) => !done.has(+b.dataset.i)), (b) => { if (!live(q)) return; sel = +b.dataset.i; mark(); c.click(); }));
  mark();
  q.partHint = () => { const c = $(`.g1-chip[data-w="${lines[sel].answer}"]`, wrap); if (c) { c.classList.remove('glow-l'); void c.offsetWidth; c.classList.add('glow-l'); } };
}
// read the story, then finish each sentence with one of its words
function renderPassageFill(q) {
  const wrap = document.createElement('div'); wrap.className = 'g1-fill';
  wrap.innerHTML = q.passageFill.map((p, i) => `<div class="g1-q" data-i="${i}"><div class="g1-sent">${p.s.includes('___') ? p.s.replace('___', '<span class="g1-blank">&nbsp;</span>') : `${p.s} <span class="g1-blank">&nbsp;</span>`}</div>
    <div class="g1-opts">${p.options.map((o) => `<button class="g1-chip" data-o="${o}">${o}</button>`).join('')}</div></div>`).join('');
  $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
  const done = new Set();
  $$('.g1-q', wrap).forEach((row) => {
    const i = +row.dataset.i, p = q.passageFill[i];
    $$('.g1-chip', row).forEach((c) => (c.onclick = () => {
      if (!live(q) || done.has(i) || c.disabled) return;
      if (c.dataset.o === p.answer) {
        done.add(i); const b = $('.g1-blank', row); if (b) { b.textContent = p.answer; b.classList.add('ok'); } row.classList.add('ok'); sfx.yes();
        if (done.size === q.passageFill.length) matchDone(q);
      } else { c.disabled = true; partMiss(q, c); }
    }));
  });
  $$('.g1-q', wrap).forEach((row) => $$('.g1-chip', row).forEach((c) => chipDrag(c, () => $$('.g1-blank', wrap), (b) => { if (b.closest('.g1-q') === row) c.click(); else if (live(q)) partMiss(q, b); })));
  q.partHint = () => { const i = q.passageFill.findIndex((_, k) => !done.has(k)); const row = $(`.g1-q[data-i="${i}"]`, wrap); if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
}
// tap the pictures in the order of the story
function renderOrder(q) {
  const { pics, given = 0 } = q.order, wrap = document.createElement('div'); wrap.className = 'g1-order';
  // the first `given` pictures are already in place (a cycle like the seasons needs a starting point)
  const shown = [...Array(given).keys(), ...q.order.shown.filter((k) => k >= given)];
  wrap.innerHTML = shown.map((k) => `<button class="g1-pic-btn${k < given ? ' ok given' : ''}" data-k="${k}">${pics[k]}<i>${k < given ? k + 1 : ''}</i></button>`).join('');
  $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
  let next = given;
  $$('.g1-pic-btn', wrap).forEach((b) => (b.onclick = () => {
    if (!live(q) || b.classList.contains('ok')) return;
    if (+b.dataset.k === next) { b.classList.add('ok'); $('i', b).textContent = ++next; sfx.yes(); if (next === pics.length) matchDone(q); }
    else partMiss(q, b);
  }));
  q.partHint = () => { const b = $(`.g1-pic-btn[data-k="${next}"]`, wrap); if (b) { b.classList.remove('glow-l'); void b.offsetWidth; b.classList.add('glow-l'); } };
}
function matchDone(q) {
  R.locked = true; clearTimeout(R.nudge);
  const first = q.tries === 0;
  q.ok = first;
  creditLearningQuestion(q);
  if (first) { R.firstTry++; R.streak++; R.best = Math.max(R.best, R.streak); } else R.streak = 0;
  setTimeout(onCard(q, () => { celebrate(first); setTimeout(onCard(q, next), first ? 2000 : 1700); }), 300);
}
function matchHint(q) {
  if (R.locked) return;
  const id = q.match.left.map((x) => x.id).find((i) => !q.done.has(i)); if (id == null) return;
  const L = $(`.m-item.L[data-id="${id}"]`), Rr = $(`.m-item.R[data-id="${id}"]`);
  $$('.m-item.L').forEach((x) => x.classList.remove('sel')); L.classList.add('sel'); q.selL = id;
  Rr.classList.add('glow-l'); setTimeout(() => Rr.classList.remove('glow-l'), 1200);
  say('Look carefully, and try again!');
}

const PRAISE = ['Excellent!', 'Awesome job!', 'Great work!', 'You did it!', 'Super star!', 'Fantastic!', 'Way to go!', 'Amazing!', 'Wonderful!', 'Brilliant!'];
const POPS = ['🌟', '🎉', '🦄', '🌈', '🥳', '💖', '🚀', '👏', '🏆', '😻'];

function choose(q, v, el) {
  if (!R || R.locked || R.qs[R.i] !== q || !$('#play').classList.contains('active')) return;
  if (String(v) === String(q.answer)) {
    R.locked = true; clearTimeout(R.nudge);
    const first = q.tries === 0;
    q.ok = first;
    creditLearningQuestion(q);
    if (first) { R.firstTry++; R.streak++; R.best = Math.max(R.best, R.streak); } else R.streak = 0;
    el.classList.add('right');
    if (q.fill) { const b = $('.blank'); if (b) { b.textContent = q.answer; b.classList.add('filled'); } }
    $$('.qmark').forEach((m) => { m.textContent = q.answer; m.classList.add('filled'); });
    celebrate(first);
    if (q.explorer && q.explanation) {
      const why = document.createElement('div');
      why.className = 'explorer-explanation';
      why.setAttribute('role', 'status');
      why.textContent = q.explanation;
      $('#qMain').appendChild(why);
    }
    if (q.reveal && B3D.view) {
      setTimeout(onCard(q, () => { if (B3D.view) { B3D.view.reveal(q.reveal); say(q.reveal.text); } }), 1200);
      setTimeout(onCard(q, next), 4600);
    } else setTimeout(onCard(q, next), q.explorer ? 4300 : first ? 1900 : 1600);
  } else {
    q.tries++; R.mistakes++; R.streak = 0;
    el.classList.add('wrong'); el.disabled = true;
    if (el.tagName === 'g') el.setAttribute('opacity', '.35');
    sfx.no();
    const oops = ['Oops! Try again.', 'Almost! Try again.', 'Not quite. You can do it!'][Math.min(q.tries - 1, 2)];
    const needHint = q.tries === 1 && q.hint && !q.hintShown;
    if (needHint) showHint(q, true); // picture/clue appears only after a miss
    say(oops).then(() => { if (needHint && R && R.qs[R.i] === q && !R.locked && $('#play').classList.contains('active')) speakHint(q); });
  }
}

function celebrate(first) {
  if (!R || !R.locked || !$('#play').classList.contains('active')) return;
  sfx.yes();
  const phrase = PRAISE[Math.floor(Math.random() * PRAISE.length)];
  const withName = state.name && Math.random() < 0.35 ? `${phrase.replace('!', '')}, ${state.name}!` : phrase;
  const pop = $('#pop');
  pop.innerHTML = `<div class="pop-emoji">${POPS[Math.floor(Math.random() * POPS.length)]}</div><div class="pop-text">${esc(withName)}</div>` +
    (R.streak >= 3 ? `<div class="pop-streak">🔥 ${R.streak} in a row!</div>` : '');
  pop.classList.remove('show'); void pop.offsetWidth; pop.classList.add('show');
  confetti(first ? 110 : 50);
  // spoken praise uses the recorded voice; the name is shown on screen
  say(R.streak >= 3 && R.streak % 3 === 0 ? `${phrase} ${R.streak} in a row!` : phrase, { pitch: 1.3, rate: 1 });
}

function creditLearningQuestion(q) {
  if (!R || R.browse || isTestMode() || q.ok === undefined || q.playCredited) return;
  const i = R.qs.indexOf(q);
  if (i < 0) return;
  q.playCredited = true;
  const units = ROUND_POLICY.creditUnitsPerRound;
  // Integer partitions sum to exactly one round, including shortened banks.
  const credit = Math.floor((i + 1) * units / R.qs.length) - Math.floor(i * units / R.qs.length);
  R.playEarned = earnPlay(credit) || R.playEarned;
}

function next() {
  $('#pop').classList.remove('show');
  const done = R.qs[R.i];
  if (!R.browse && !isTestMode() && done && done.ok !== undefined && typeof logAttempt === 'function') logAttempt(done, done.cat.id, done.level);
  R.i++;
  if (R.i >= R.qs.length) return finish();
  renderQ();
}

/* ---------- grade-configured evidence-based progression ---------- */
// The algorithm stays independent of grade names. Curriculum JSON owns how
// many full rounds establish mastery or call for additional practice.
const DEFAULT_PROGRESSION = ContentData.get('curriculum-map', 'policy').adaptive;
function progressionOutcome(rule, range, currentLevel, round, previous = {}) {
  const counts = { mastery: previous.mastery || 0, support: previous.support || 0 };
  const base = { level: currentLevel, counts, status: 'steady' };
  if (!rule || !Array.isArray(range) || round.total < rule.minQuestions ||
      !Number.isFinite(round.firstTry) || !Number.isFinite(round.mistakes) ||
      round.firstTry < 0 || round.firstTry > round.total || round.mistakes < 0) {
    return { ...base, status: 'insufficient' };
  }
  const firstTryRate = round.firstTry / round.total;
  const mistakeRate = round.mistakes / round.total;
  if (firstTryRate >= rule.promote.minFirstTryRate &&
      mistakeRate <= rule.promote.maxMistakeRate) {
    counts.mastery++; counts.support = 0;
    if (counts.mastery >= rule.promote.rounds) {
      counts.mastery = 0;
      return currentLevel < range[1]
        ? { level: currentLevel + 1, counts, status: 'promoted' }
        : { level: currentLevel, counts, status: 'top' };
    }
    return { level: currentLevel, counts, status: 'building' };
  }
  if (firstTryRate <= rule.support.maxFirstTryRate &&
      mistakeRate >= rule.support.minMistakeRate) {
    counts.support++; counts.mastery = 0;
    if (counts.support >= rule.support.rounds) {
      counts.support = 0;
      return currentLevel > range[0]
        ? { level: currentLevel - 1, counts, status: 'supported' }
        : { level: currentLevel, counts, status: 'floor' };
    }
    return { level: currentLevel, counts, status: 'practicing' };
  }
  // A mixed result is not consecutive evidence of either mastery or struggle.
  return { level: currentLevel, counts: { mastery: 0, support: 0 }, status: 'steady' };
}
function applyRoundProgression(id, level, round) {
  const rule = (state.grade && GRADES[state.grade]?.progression) || DEFAULT_PROGRESSION;
  const range = openRange(id) || [1, levelCap(id)];
  state.progressionStreaks = state.progressionStreaks || {};
  const record = state.progressionStreaks[id];
  const previous = record && record.grade === state.grade && record.level === level
    ? record : {};
  const outcome = progressionOutcome(rule, range, level, round, previous);
  state.progressionStreaks[id] = {
    grade: state.grade || null, level: outcome.level,
    mastery: outcome.counts.mastery, support: outcome.counts.support
  };
  if (outcome.level !== level) state.levels[id] = outcome.level;
  return outcome.status;
}

function finish() {
  if (R.browse || isTestMode()) { releaseBody3D(); renderHome(); show('home'); return; }   // the test browser does not change levels or stars
  releaseBody3D();
  renderProgress();
  const m = R.mistakes, n = R.qs.length;
  // stars and levels go by the share of mistakes (the same rule for 5-card quest steps and 10-card rounds)
  const rate = m / n;
  const stars = rate <= 0.2 && R.firstTry / n >= 0.8 ? 3 : rate <= 0.5 ? 2 : 1;
  const id = R.cat.id;
  state.stars += R.firstTry;
  state.best[id] = Math.max(state.best[id] || 0, stars);
  // adapt difficulty
  let levelMsg = '';
  if (id === 'placement' && typeof applyPlacement === 'function') { applyPlacement(R.qs); levelMsg = '🎯 All set! Your games now start at the right step.'; }
  else if (id !== 'mix' && !R.atLevel) {          // practice at an older level (quest) doesn't move her level
    const lv = levelOf(id);
    // Consistent performance across enough questions changes a level; a
    // single lucky or difficult round does not. Thresholds live in grade JSON.
    const status = applyRoundProgression(id, lv, {
      total: n, firstTry: R.firstTry, mistakes: R.mistakes
    });
    if (status === 'promoted') levelMsg = '⬆️ Next step unlocked!';
    else if (status === 'supported') levelMsg = "🙂 Let's practice the step before a bit more";
    else if (status === 'top' && !state.showAll && state.grade)
      levelMsg = '⭐ Great work! Try another skill for your grade.';
  }
  const earned = !!R.playEarned;
  // part of today's quest?
  const questI = R.questStep;
  if (questI != null && typeof questStepDone === 'function') questStepDone(questI);
  // sticker
  const left = STICKERS.filter((s) => !state.stickers.includes(s));
  const sticker = left.length ? left[Math.floor(Math.random() * left.length)] : null;
  if (sticker) state.stickers.push(sticker);
  save();

  $('#resTitle').textContent = stars === 3 ? 'WOW! Superstar!' : stars === 2 ? 'Great job!' : 'Good try!';
  $('#resStars').innerHTML = [1, 2, 3].map((k) => `<span class="rs ${k <= stars ? 'on' : ''}" style="animation-delay:${k * 280}ms">★</span>`).join('');
  $('#resScore').textContent = `${R.firstTry} out of ${R.qs.length} right on the first try`;
  $('#resLevel').textContent = levelMsg;
  $('#resSticker').innerHTML = sticker ? `<div class="new-sticker">${sticker}</div><div>New sticker!</div>` : '<div>You have every sticker! 🏆</div>';
  $('#playEarned').hidden = !earned;
  const qn = questI != null && typeof questFor === 'function' ? questFor() : null;
  $('#questNext').hidden = !qn;
  if (qn) {
    const nextI = qn.steps.findIndex((x) => !x.done);
    $('#questNext').textContent = nextI < 0 ? '🎁 Open' : '🗺️ Next ▶';
    $('#questNext').onclick = () => { sfx.tap(); if (nextI < 0) { renderHome(); show('home'); openQuestGift(); } else startQuestStep(nextI); };
  }
  $('#againBtn').hidden = !!qn;
  show('result');
  sfx.win(); confetti(160, 0.3); setTimeout(() => confetti(120, 0.5), 600);
  say(`${stars === 3 ? 'Wow! Awesome job!' : stars === 2 ? 'Great job!' : 'Good try!'} You got ${R.firstTry} stars.${levelMsg.startsWith('⬆️') ? ' Level up!' : ''}${sticker ? ' And a new sticker!' : ''}${earned ? ' You earned play time!' : ''}`);
}

function renderStickers() {
  $('#stickerGrid').innerHTML = STICKERS.map((s) =>
    `<div class="stk ${state.stickers.includes(s) ? 'have' : ''}">${state.stickers.includes(s) ? s : '❔'}</div>`).join('');
  $('#stickerNote').textContent = `${state.stickers.length} of ${STICKERS.length} — finish a game to win a new one!`;
}

/* ---------- Word Wonders: learn cards ---------- */
const L = { list: [], i: 0 };
function openLearn() {
  L.list = vocabLearnList(levelOf('vocab'));
  if (L.i >= L.list.length) L.i = 0;
  document.body.style.setProperty('--theme', '#f59f00');
  show('learn');
  renderLearn(true);
}
function renderLearn(speak) {
  const v = L.list[L.i];
  const [word, pic, , example, talk] = v;
  state.vocabSeen = state.vocabSeen || {};
  const seen = state.vocabSeen[word];
  state.vocabSeen[word] = true; save();
  $('#learnPos').textContent = `${L.i + 1} of ${L.list.length}`;
  const ex = example.replace(new RegExp(`\\b(${word}\\w*)`, 'i'), '<b>$1</b>');
  $('#learnCard').innerHTML = `
    ${seen ? '<span class="seen">✓ seen</span>' : '<span class="seen new">✨ new word</span>'}
    <div class="learn-pic">${pic}</div>
    <button class="learn-word" data-part="word">${word}</button>
    <button class="learn-line meaning" data-part="meaning"><span class="lbl">🔊 What it means</span><span class="txt">${vocabMeaning(v)}</span></button>
    <button class="learn-line example" data-part="example"><span class="lbl">🔊 Example</span><span class="txt">${ex}</span></button>
    <button class="learn-line talk" data-part="talk"><span class="lbl">🗣️ Talk together</span><span class="txt">${talk}</span></button>`;
  const card = $('#learnCard');
  card.classList.remove('flip-in'); void card.offsetWidth; card.classList.add('flip-in');
  $$('[data-part]', card).forEach((b) => (b.onclick = () => { sfx.tap(); speakPart(v, b.dataset.part); }));
  [L.i + 1, L.i - 1].forEach((k) => { const n = L.list[k]; if (n) prefetch([n[0], vocabMeaning(n), n[3]]); });
  if (speak) setTimeout(() => readCard(v), 350);
}
function speakPart(v, part) {
  const t = { word: v[0], meaning: vocabMeaning(v), example: v[3], talk: v[4] }[part];
  lightPart(part); say([t]).then(() => lightPart(null));
}
function lightPart(part) { $$('#learnCard [data-part]').forEach((b) => b.classList.toggle('reading', b.dataset.part === part)); }
async function readCard(v) {
  const my = L.i, epoch=navigationEpoch;
  for (const part of ['word', 'meaning', 'example']) {
    if (epoch !== navigationEpoch || L.i !== my || !$('#learn').classList.contains('active')) return;
    lightPart(part);
    await say([{ word: v[0], meaning: vocabMeaning(v), example: v[3] }[part]]);
  }
  lightPart(null);
}
function learnGo(d) {
  const n = L.i + d; if (n < 0 || n >= L.list.length) { sfx.no(); return; }
  sfx.tap(); L.i = n; renderLearn(true);
}
$('#learnPrev').onclick = () => learnGo(-1);
$('#learnNext').onclick = () => learnGo(1);
$('#learnHear').onclick = () => { sfx.tap(); readCard(L.list[L.i]); };
$('#learnHome').onclick = () => { sayToken++; stopClip(); renderHome(); show('home'); };
$('#learnQuiz').onclick = $('#learnQuiz2').onclick = () => { sfx.tap(); startRound('vocab'); };
// swipe left / right on the card
(() => {
  let x0 = null, y0 = 0;
  const c = $('#learnCard');
  c.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  c.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) learnGo(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

/* ---------- grown-up difficulty slider (press and hold so little fingers don't change it) ---------- */
function gradeHintFor(id, lv) {
  const g = Object.entries(GRADES).filter(([k]) => { const r = gradeRange(k, id); return r && lv >= r[0] && lv <= r[1]; }).map(([k]) => gradeName(k));
  const focus=CURRICULUM_PROFILES[state.grade]?.sections[id]?.skills?.slice(0,3).map(v=>v.replaceAll('-',' ')).join(' · ');
  return [g.length?`Typical for: ${g.join(', ')}`:'',focus?`Skills: ${focus}`:''].filter(Boolean).join(' | ');
}
function openDiff() {
  if (!R || R.cat.id === 'mix') return;
  const round=R;
  askPin(()=>{if(R===round && $('#play').classList.contains('active'))showDifficulty();});
}
function showDifficulty() {
  if (!R || R.cat.id === 'mix') return;
  const id = R.cat.id, max = gameMax(id);
  const sl = $('#diffRange');
  const range=!isTestMode()?openRange(id):null;
  sl.min=range?range[0]:1; sl.max=range?range[1]:max;
  sl.value=Math.min(+sl.max,Math.max(+sl.min,levelOf(id)));
  const upd = () => { $('#diffVal').textContent = range ? `Step ${+sl.value-range[0]+1} of ${range[1]-range[0]+1}` : `Level ${sl.value} of ${max}`; $('#diffGrade').textContent = gradeHintFor(id, +sl.value); };
  sl.oninput = upd; upd();
  $('#diffName').textContent = `${R.cat.icon} ${R.cat.title}`;
  $('#diffSheet').hidden = false;
}
$('#diffApply').onclick = () => {
  const id = R.cat.id; state.levels[id] = +$('#diffRange').value;
  if (state.progressionStreaks) delete state.progressionStreaks[id];
  save();
  $('#diffSheet').hidden = true; startRound(id);
};
$('#diffCancel').onclick = () => ($('#diffSheet').hidden = true);
(() => {
  const b = $('#diffBtn'); let t = 0;
  const down = (e) => { e.preventDefault(); b.classList.add('holding'); t = setTimeout(() => { b.classList.remove('holding'); openDiff(); }, 800); };
  const up = () => { if (t) { clearTimeout(t); t = 0; } if (b.classList.contains('holding')) { b.classList.remove('holding'); b.classList.add('nudge'); setTimeout(() => b.classList.remove('nudge'), 500); } };
  b.addEventListener('pointerdown', down); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, up));
})();

/* ---------- looks: themes with a mascot (unicorn, dino, space, ocean, sports, rainbow) ---------- */
const THEMES = {
  rainbow: { label: '🌈 Rainbow', mascot: '🌈' }, unicorn: { label: '🦄 Unicorn', mascot: '🦄' }, dino: { label: '🦖 Dino', mascot: '🦖' },
  space: { label: '🚀 Space', mascot: '🚀' }, ocean: { label: '🐬 Ocean', mascot: '🐬' }, sports: { label: '⚽ Sports', mascot: '⚽' },
  cars: { label: '🏎️ Race Cars', mascot: '🏎️' }, jungle: { label: '🦁 Jungle', mascot: '🦁' },
};
function applyTheme() {
  const t = THEMES[state.theme] ? state.theme : 'rainbow';
  document.body.className = document.body.className.replace(/\btheme-\w+/g, '').trim() + ' theme-' + t;
  $('#mascot').textContent = THEMES[t].mascot;
  document.body.classList.toggle('test-mode', isTestMode());
}
function renderThemes() {
  $('#themeBtns').innerHTML = Object.entries(THEMES).map(([k, t]) => `<button class="grade-btn ${(state.theme || 'rainbow') === k ? 'on' : ''}" data-t="${k}">${t.label}</button>`).join('');
  $$('#themeBtns .grade-btn').forEach((b) => (b.onclick = () => { sfx.tap(); state.theme = b.dataset.t; save(); applyTheme(); renderThemes(); }));
}

/* ---------- hidden test mode: tap the Settings title 5 times ---------- */
(() => {
  let taps = 0, t = 0;
  $('#settingsTitle').addEventListener('click', () => {
    taps++; clearTimeout(t); t = setTimeout(() => (taps = 0), 1500);
    if (taps >= 5) { taps = 0; try { localStorage.setItem(QA_KEY, '1'); } catch {} $('#testSection').hidden = false; sfx.yes(); renderTestInfo(); }
  });
})();
function renderTestInfo() {
  const clips = Object.keys(CLIPS).length;
  const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  $('#testInfo').textContent = `Voice clips: ${clips} · 3D: ${gl ? 'yes' : 'no'} · Grade: ${state.grade || 'none'} · Screen: ${innerWidth}×${innerHeight}`;
}
// QA unlocked by the ?qa=1 link: a grown-up can lock it again here (same as opening ?qa=0)
$('#qaLock').onclick = () => { try { localStorage.removeItem(QA_KEY); } catch {} state.testMode = false; save(); applyTheme(); $('#testSection').hidden = !testFeatureAvailable(); };
$('#testMode').onchange = () => { state.testMode = testFeatureAvailable() && $('#testMode').checked; save(); applyTheme(); };
// Test navigation never treats a skipped card as correct or changes persistent progress.
function qaMove(step) {
  if (!isTestMode() || !R || !$('#play').classList.contains('active')) return;
  if (step < 0 && R.i === 0) return;
  sayToken++; stopClip(); clearTimeout(R.nudge);
  $('#pop').classList.remove('show');
  if (step > 0 && R.i === R.qs.length - 1) { finish(); return; }
  R.i += step;
  renderQ();
}
$('#skipBtn').onclick = () => qaMove(1);
$('#prevBtn').onclick = () => qaMove(-1);
$('#endBtn').onclick = () => {
  if (!isTestMode() || !R || !$('#play').classList.contains('active')) return;
  sayToken++; stopClip(); clearTimeout(R.nudge);
  finish();
};
document.addEventListener('keydown', e => {
  if (!isTestMode() || !$('#play').classList.contains('active') || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); qaMove(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); qaMove(-1); }
});

/* ---------- wire up ---------- */
$('#grid').addEventListener('click', (e) => {
  const t = e.target.closest('.tile'); if (!t) return;
  sfx.tap();
  if (t.dataset.game) return openBrainGame(t.dataset.game);
  if (!t.dataset.cat) return;
  if (t.dataset.cat === 'vocab') return openLearn();
  if (t.dataset.cat === 'trace') { TR.quest = null; return openTrace(); }
  if (t.dataset.cat === 'library') return openLibrary();
  startRound(t.dataset.cat);
});
$('#hintBtn').onclick = () => { sfx.tap(); showHint(R.qs[R.i]); };
$('#sayBtn').onclick = () => { sfx.tap(); const q = R.qs[R.i]; say((q.say && q.say.length) ? q.say : q.readQ || q.text.replace(/<[^>]+>/g, '')); };
$('#quitBtn').onclick = () => {
  releaseBody3D(); sayToken++; stopClip(); clearTimeout(R && R.nudge); save(); renderHome(); show('home'); };
$('#againBtn').onclick = () => startRound(R.cat.id);
$('#homeBtn').onclick = () => { renderHome(); show('home'); };
$('#stickersBtn').onclick = () => { sfx.tap(); renderStickers(); show('stickers'); };
$('#stickersBack').onclick = () => show('home');
function syncPlayMode() {
  const hourly = $('#playMode').value === 'hourly';
  $$('.hourly-only').forEach((x) => (x.hidden = !hourly));
  $$('.rounds-only').forEach((x) => (x.hidden = hourly));
}
$('#playMode').onchange = syncPlayMode;
function renderGrades() {
  $('#gradeBtns').innerHTML = Object.entries(GRADES).map(([k, g]) =>
    `<button class="grade-btn ${state.grade === k ? 'on' : ''}" data-g="${k}">${gradeName(k)}</button>`).join('');
  $$('#gradeBtns .grade-btn').forEach((b) => (b.onclick = () => {
    sfx.tap(); state.grade = b.dataset.g; state.levels = {}; state.progressionStreaks = {};
    Object.entries(GRADES[state.grade].g).forEach(([id, r]) => (state.levels[id] = gradeStart(r))); save();
    renderGrades();
    $$('#levels select').forEach((sel) => (sel.value = levelOf(sel.dataset.id)));
  }));
  $('#placeBtn').hidden = !state.grade;
}
$('#gradeChip').onclick = () => $('#settingsBtn').onclick();
$('#settingsBtn').onclick = () => askPin(openSettings);
function openSettings() {
  renderKids();
  renderGrades(); renderThemes(); $('#testMode').checked = isTestMode(); $('#testSection').hidden = !testFeatureAvailable();
  $('#countrySel').innerHTML = COUNTRY_ORDER.map((k) => `<option value="${k}">${COUNTRIES[k].flag} ${COUNTRIES[k].label}</option>`).join('') + '<option value="other">🌍 Somewhere else</option>';
  $('#countrySel').value = countryCode();
  fillRegions();
  $('#nameInput').value = state.name; $('#showAll').checked = !!state.showAll; $('#optClock').checked = !state.hideClock; $('#roundsPerPlay').value = String(state.roundsPerPlay || 1); $('#playMinutes').value = String(state.playMinutes || 3); $('#playAlways').checked = !!state.playAlways; $('#optAnatomy').checked = !!state.optAnatomy; $('#playMode').value = state.playMode || 'rounds'; $('#playPerHour').value = String(state.playPerHour || 15); syncPlayMode(); $('#voiceToggle').checked = state.voice;
  $('#levels').innerHTML = visibleGames().filter((c) => c.gen && c.id !== 'placement').map((c) =>
    `<label class="lvrow">${c.icon} ${c.title}<select data-id="${c.id}">${Array.from({ length: maxLevelOf(c.id) }, (_, k) => k + 1).map((l) => `<option value="${l}" ${levelOf(c.id) === l ? 'selected' : ''}>${((r) => r && l >= r[0] && l <= r[1] ? `Step ${l - r[0] + 1} of ${r[1] - r[0] + 1}` : `Library level ${l}`)(state.grade && gradeRange(state.grade, c.id))}</option>`).join('')}</select></label>`).join('');
  renderTestBrowser();
  // This section is accessible only after the parent PIN. No child-facing paywall.
  ContentPacks.load().then(() => {
    const packs = ContentPacks.summary(), box = $('#contentPacksStatus');
    if (box) box.textContent = packs.length
      ? packs.map(p => p.title + ' (v' + p.version + ', ' + p.questions + ' questions)').join(' · ') + ' — ready offline.'
      : 'Your included lessons are ready offline. No extra packs downloaded.';
  });
  const nativePacks = window.KidsLearnPurchases;
  const sync = $('#contentPacksSync');
  sync.hidden = !(nativePacks && typeof nativePacks.downloadOwnedPacks === 'function');
  if (!sync.hidden) sync.onclick = async () => {
    sync.disabled = true;
    const status = $('#contentPacksStatus');
    status.textContent = 'Checking purchased lesson updates…';
    try {
      // The native bridge MUST check Apple/Google entitlements and authorize
      // each data-only payload with the publisher service before returning it.
      const verified = await nativePacks.downloadOwnedPacks();
      if (!Array.isArray(verified)) throw new Error('Invalid download response');
      for (const pack of verified) await ContentPacks.installVerified(pack);
      status.textContent = verified.length
        ? 'Saved ' + verified.length + ' purchased learning pack(s). Ready offline.'
        : 'All your downloaded lessons are up to date.';
    } catch (error) {
      status.textContent = 'Could not check updates. The included and previously saved lessons still work offline.';
      console.warn('Learning pack update failed', error);
    } finally { sync.disabled = false; }
  };
  show('settings');
}

/* ---------- grown-up PIN (asked before Settings) ---------- */
const pinHash = (p) => { let h = 5381; for (const ch of 'lp:' + p) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h.toString(36); };
let parentVerificationEpoch=0;
function verifyParentDevice(onVerified) {
  const epoch=++parentVerificationEpoch;
  const sheet=$('#pinSheet'); sheet.hidden=false;
  $('#pinTitle').textContent='Grown-up setup';
  $('#pinNote').textContent='Use the device owner’s fingerprint, face or device passcode before creating a PIN.';
  $('#pinPad').hidden=true; $('#pinPad').onclick=null; $('#pinForgotBtn').hidden=true; $('#pinForgot').hidden=true;
  let cancelled=false;
  $('#pinVerifyBtn')?.remove();
  const button=document.createElement('button'); button.id='pinVerifyBtn';button.className='big-btn';button.textContent='Verify device owner';
  $('#pinPad').before(button);
  const close=()=>{cancelled=true;sheet.hidden=true;button.remove();$('#pinPad').hidden=false;};
  $('#pinBack').onclick=close;sheet.onclick=e=>{if(e.target===sheet)close();};
  button.onclick=async()=>{
    button.disabled=true;
    try {
      if(!window.isSecureContext || !navigator.credentials?.create || !window.PublicKeyCredential) throw Error('unsupported');
      const credential=await navigator.credentials.create({publicKey:{
        challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'Learn & Play parent setup'},
        user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'parent-'+Date.now(),displayName:'Learn & Play parent'},
        pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
        authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},
        timeout:60000,attestation:'none'
      }});
      if(cancelled || epoch!==parentVerificationEpoch)return;
      const authData=credential?.response?.getAuthenticatorData?.();
      if(!credential || credential.type!=='public-key' || !authData || !(new Uint8Array(authData)[32]&4))throw Error('not verified');
      close();onVerified();
    } catch(error) {
      if(cancelled || epoch!==parentVerificationEpoch)return;
      $('#pinNote').textContent='Device verification was not completed. Set up a device passcode or biometric unlock and try again in a supported browser. Parent controls stay locked.';
      button.disabled=false;
    }
  };
}
function askPin(onOk, change = false, verified = false) {
  parentVerificationEpoch++;
  if(change && state.pinHash && !verified)return askPin(()=>askPin(onOk,true,true));
  if (!state.pinHash && !verified) return verifyParentDevice(() => askPin(onOk, change, true));
  $('#pinPad').hidden=false;
  const sheet = $('#pinSheet'); let typed = '', first = null, closed=false;
  const request=askPin.request=(askPin.request||0)+1;
  const mode = () => (!state.pinHash || change ? (first ? 'confirm' : 'new') : 'check');
  const paint = () => {
    $('#pinTitle').textContent = mode() === 'check' ? '🔒 Grown-ups only' : mode() === 'new' ? '🔒 Make a grown-up PIN' : '🔒 Type it again';
    $('#pinNote').textContent = mode() === 'check' ? 'Type your 4-digit PIN.' : mode() === 'new' ? 'Pick 4 numbers. You will need them to open Settings.' : 'Type the same 4 numbers.';
    $$('#pinDots i').forEach((d, k) => d.classList.toggle('on', k < typed.length));
    $('#pinForgotBtn').hidden = mode() !== 'check'; $('#pinForgot').hidden = true;
  };
  const close = () => { closed=true; sheet.hidden = true; $('#pinPad').onclick = null; sheet.onclick = null; };
  // kids who land here by accident: a big way back, and the voice tells them where it is
  const goBack = () => { sfx.tap(); sayToken++; stopClip(); close(); };
  $('#pinBack').onclick = goBack;
  sheet.onclick = (e) => { if (e.target === sheet) goBack(); };   // tapping outside the box also goes back
  const kidNote = () => say(['This part is for grown-ups.', 'Tap the house to go back.']);
  const shake = () => { const b = $('.pin-box'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); sfx.no(); };
  $('#pinPad').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k; sfx.tap();
    if (k === '✕') return close();
    if (k === '⌫') { typed = typed.slice(0, -1); return paint(); }
    if (typed.length >= 4) return;
    typed += k; paint();
    if (typed.length < 4) return;
    setTimeout(() => {
      if(closed||request!==askPin.request)return;
      const m = mode();
      if (m === 'check') {
        if (Date.now() < (askPin.lockUntil || 0)) { typed = ''; shake(); $('#pinNote').textContent = 'Too many tries. Wait a little and try again.'; return; }
        if (pinHash(typed) === state.pinHash) { askPin.misses = 0; close(); onOk(); }
        else { typed = ''; shake(); paint(); kidNote(); askPin.misses = (askPin.misses || 0) + 1; if (askPin.misses >= 3) { askPin.lockUntil = Date.now() + 30000 * (askPin.misses - 2); $('#pinNote').textContent = 'Too many tries. Wait 30 seconds.'; } }
      }
      else if (m === 'new') { first = typed; typed = ''; paint(); }
      else if (typed === first) { state.pinHash = pinHash(typed); save(); close(); sfx.yes(); askPin(onOk); }
      else { first = null; typed = ''; shake(); paint(); }
    }, 150);
  };
  // A public puzzle cannot verify a parent. Never clear the PIN from this screen.
  $('#pinForgotBtn').onclick = () => {
    $('#pinForgot').textContent = 'Your PIN stays on this device and cannot be recovered here. Try your saved PIN. Resetting the app’s stored data through device or browser settings removes the PIN, but also deletes children and progress. There is no reset puzzle or shortcut in the child app.';
    $('#pinForgot').hidden = false;
  };
  typed = ''; paint(); sheet.hidden = false;
  if (mode() === 'check') kidNote();
}
$('#backupBtn').onclick = () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' }));
  a.download = `learn-and-play-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
$('#restoreFile').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { Store.importJSON(await f.text()); alertNote('Backup loaded!'); setTimeout(() => location.reload(), 600); } catch { alertNote('That file is not a Learn & Play backup.'); }
};
const alertNote = (t) => { $('#voiceStatus').textContent = t; };
$('#pinChange').onclick = () => { sfx.tap(); askPin(() => say('PIN saved!'), true); };

/* ---------- test mode: open any game at any level and step through its cards ---------- */
function renderTestBrowser() {
  const sel = $('#tbGame'); if (!sel) return;
  sel.innerHTML = CATEGORIES.filter((c) => c.gen).map((c) => `<option value="${c.id}">${c.icon} ${c.title}</option>`).join('');
  const lv = () => { $('#tbLevel').innerHTML = Array.from({ length: maxLevelOf(sel.value) }, (_, k) => `<option>${k + 1}</option>`).join(''); };
  sel.onchange = lv; lv();
}
$('#tbGo').onclick = () => {
  const id = $('#tbGame').value, lv = +$('#tbLevel').value;
  const keep = state.levels[id]; state.levels[id] = lv;
  startRound(id, 30, true);
  state.levels[id] = keep;
};

// the state / province / nation / region list follows the chosen country
function fillRegions() {
  const C = typeof myCountry === 'function' && myCountry(), row = $('#regionRow');
  if (!C || !C.regions || !C.regions.length) { row.hidden = true; return; }
  row.hidden = false;
  $('#regionLabel').textContent = REGION_WORD[countryCode()] || 'State';
  $('#regionSel').innerHTML = C.regions.map((r) => `<option value="${esc(r[0])}">${esc(r[0].replace(/^the /, ''))}</option>`).join('');
  $('#regionSel').value = (myRegion() || C.regions[0])[0];
  state.region = $('#regionSel').value;
}
function collectSettings() {
  const oldMinutes=playMinutes();
  const nextMinutes=+$('#playMinutes').value;
  if(nextMinutes>oldMinutes && playBalance()>0 && !hourlyMode()) state.playRemainingMs += (nextMinutes-oldMinutes)*60000;
  state.name = $('#nameInput').value.trim().slice(0, 20);
  state.voice = $('#voiceToggle').checked;
  const countryChanged = state.country !== $('#countrySel').value;
  state.country = $('#countrySel').value;
  if (countryChanged) { state.region = ''; fillRegions(); } else state.region = $('#regionSel').value;
  state.showAll = $('#showAll').checked;
  state.hideClock = !$('#optClock').checked;
  state.roundsPerPlay = +$('#roundsPerPlay').value; state.playMinutes = +$('#playMinutes').value; state.playAlways = $('#playAlways').checked; state.optAnatomy = $('#optAnatomy').checked; state.playMode = $('#playMode').value; state.playPerHour = +$('#playPerHour').value;
  $$('#levels select').forEach((s) => {
    const level = +s.value, id = s.dataset.id;
    if (state.levels[id] !== level && state.progressionStreaks)
      delete state.progressionStreaks[id];
    state.levels[id] = level;
  });
  save();
}
// every change saves right away (no Save button); typing the name saves a moment after the last key
$('#settings').addEventListener('change', (e) => { if (e.target.id !== 'restoreFile' && e.target.id !== 'testMode' && e.target.closest('label, select, input')) { collectSettings(); applyTheme(); } });
$('#nameInput').addEventListener('input', () => { clearTimeout(collectSettings.t); const kid = Store.activeId(); collectSettings.t = setTimeout(() => { if (kid === Store.activeId()) collectSettings(); }, 400); });
$('#settingsBack').onclick = () => {
  clearTimeout(collectSettings.t); collectSettings(); applyTheme(); renderHome(); show('home');
  say("Let's play!");
};

/* ---------- children (profiles): picker on the home screen, add / edit / remove in Settings ---------- */
function switchKid(id) {
  if (id === Store.activeId()) return;
  sayToken++; stopClip();
  Store.switchTo(id, state);
  applyTheme(); renderHome();
  if (typeof renderPlayBanner === 'function') renderPlayBanner();
}
function openWho() {
  const kids = Store.kids();
  $('#whoGrid').innerHTML = kids.map((k) => `<button class="who-kid ${k.id === Store.activeId() ? 'on' : ''}" data-id="${k.id}">
    <span class="who-av">${esc(k.avatar || '🦄')}</span><b>${esc(k.name || 'Player')}</b><small>${k.grade ? gradeName(k.grade) : ''}</small></button>`).join('')
    + (kids.length < MAX_KIDS ? '<button class="who-kid who-add" data-add="1" type="button"><span class="who-av">＋</span><b>Add another child</b><small>Grown-up PIN required</small></button>' : `<p class="who-limit">This device holds up to ${MAX_KIDS} children.</p>`);
  $$('#whoGrid .who-kid').forEach((b) => (b.onclick = () => {
    sfx.tap();
    if (b.dataset.add) {
      $('#whoSheet').hidden = true;
      askPin(() => { openSettings(); $('#kidChips [data-add]')?.click(); });
      return;
    }
    $('#whoSheet').hidden = true;
    if (b.dataset.id !== Store.activeId()) askPin(() => { switchKid(b.dataset.id); say("Let's play!"); });
  }));
  $('#whoSheet').hidden = false;
}
$('#kidBtn').onclick = () => { sfx.tap(); if (Store.kids().length > 1) openWho(); else askPin(() => { openSettings(); setTimeout(() => $('.kids-field').scrollIntoView({ block: 'center' }), 50); }); };
$('#whoSheet').onclick = (e) => { if (e.target.id === 'whoSheet') $('#whoSheet').hidden = true; };
function renderKids() {
  const kids = Store.kids();
  $('#kidChips').innerHTML = kids.map((k) => `<button class="kid-chip ${k.id === Store.activeId() ? 'on' : ''}" data-id="${k.id}"><span>${esc(k.avatar || '🦄')}</span>${esc(k.name || 'Player')}</button>`).join('')
    + (kids.length < MAX_KIDS ? '<button class="kid-chip add" data-add="1">＋ Add a child</button>' : `<span class="kid-chip-note">Up to ${MAX_KIDS} children on this device</span>`);
  $('#avatarRow').innerHTML = AVATARS.map((a) => `<button class="av ${state.avatar === a ? 'on' : ''}" data-a="${a}">${a}</button>`).join('');
  $('#kidRemove').hidden = kids.length <= 1;
  $('#kidRemove').textContent = `Remove ${state.name || 'this child'}`;
  $$('#kidChips .kid-chip').forEach((b) => (b.onclick = () => {
    sfx.tap(); collectSettings();
    if (b.dataset.add) Store.addKid({ grade: state.grade || null }, state); else Store.switchTo(b.dataset.id, state);
    applyTheme(); openSettings();
    if (b.dataset.add) setTimeout(() => $('#nameInput').focus(), 50);
  }));
  $$('#avatarRow .av').forEach((b) => (b.onclick = () => { sfx.tap(); state.avatar = b.dataset.a; save(); renderKids(); }));
}
$('#kidRemove').onclick = () => {
  if (!confirm(`Remove ${state.name || 'this child'} and all of their stars, levels and pictures?`)) return;
  Store.removeKid(Store.activeId(), state); applyTheme(); openSettings();
};
// Full-library downloads are opt-in to avoid silently downloading thousands of clips.
$('#offlineVoiceBtn').onclick = async () => {
  const status = $('#offlineVoiceStatus'), btn = $('#offlineVoiceBtn');
  if (!('serviceWorker' in navigator)) { status.textContent = 'Offline audio download is available in the installed app over HTTPS.'; return; }
  status.textContent = 'Preparing the offline voice library…'; btn.disabled = true;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) throw new Error('offline service unavailable');
    state.offlineAudio = 'full'; save();
    reg.active.postMessage({ type: 'fill-audio-all' });
  } catch { btn.disabled = false; status.textContent = 'Could not start the download. Check the connection and try again.'; }
};
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'audio-pack-progress' || e.data.mode !== 'fill-audio-all') return;
  const status = $('#offlineVoiceStatus'), btn = $('#offlineVoiceBtn');
  if (!status) return;
  const { done, total, saved = 0 } = e.data;
  status.textContent = total ? `Saved ${saved} of ${total} additional voice clips (checked ${done}).` : 'All requested voice clips are already saved.';
  if (done >= total) {
    btn.disabled = false;
    status.textContent = saved >= total ? 'Offline voice pack is ready.' : `Saved ${saved} of ${total} additional clips. Some could not be downloaded; try again when online.`;
  }
});
$('#testVoiceBtn').onclick = async () => {
  const out = $('#voiceStatus');
  if (!state.voice) { out.textContent = 'Turn on voice first, then test again.'; return; }
  out.textContent = 'Playing…';
  lastAudio.path = ''; lastAudio.err = '';
  unlockAudio();
  await Promise.race([say('Excellent!'), sleep(8000)]);
  out.textContent = `Recorded clips: ${Object.keys(CLIPS).length} · audio: ${actx ? actx.state : 'off'} · played via: ${lastAudio.path || '—'}${lastAudio.err ? ' · ' + lastAudio.err : ''}`;
};
$('#resetBtn').onclick = () => {
  if (!confirm('Reset all stars, stickers and levels?')) return;
  // keep the grown-up settings (name, grade, voice, PIN, play rules, look); clear everything the child earned
  const KEEP = ['name', 'avatar', 'grade', 'country', 'region', 'dailyGoal', 'voice', 'pinHash', 'theme', 'showAll', 'hideClock', 'optAnatomy', 'playMode', 'playPerHour', 'roundsPerPlay', 'playMinutes', 'playAlways', 'testMode', 'schema'];
  for (const k of Object.keys(state)) if (!KEEP.includes(k)) delete state[k];
  Object.assign(state, { stars: 0, stickers: [], levels: {}, best: {} });
  if (state.grade && GRADES[state.grade]) Object.entries(GRADES[state.grade].g).forEach(([id, r]) => (state.levels[id] = gradeStart(r)));
  save(); renderHome(); show('home');
};
$('#startBtn').onclick = () => {
  // first tap unlocks audio on iPhone
  tone([1, 1], { vol: 0.001 });
  try { sessionStorage.setItem('learnplay.started', '1'); } catch {}
  $('#splash').classList.add('gone');
  // First run must be parent-led. Never expose the ungraded catalog behind a delayed sheet.
  if (typeof window.welcomeIfNeeded === 'function' && window.welcomeIfNeeded()) return;
  if (Store.kids().length > 1) openWho(); else say('Hi! Pick a game!');
};

applyTheme();
renderHome();
// A service-worker upgrade can reload this tab; never ask the child to press Let's Play twice.
try { if (sessionStorage.getItem('learnplay.started') === '1') $('#splash').classList.add('gone'); } catch {}
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  let restartApproved = false;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    // Do not change the page underneath a child who just tapped Play or began onboarding.
    // The parent explicitly chooses when to activate an installed update.
    const offerUpdate = () => {
      if (!reg.waiting || document.getElementById('updateAvailable')) return;
      const btn = document.createElement('button');
      btn.id = 'updateAvailable'; btn.type = 'button'; btn.className = 'update-available';
      btn.textContent = 'A new version is ready. Tap to restart when you are finished.';
      btn.onclick = () => { restartApproved = true; btn.disabled = true; btn.textContent = 'Updating…'; reg.waiting.postMessage({ type: 'update-now' }); };
      document.getElementById('home').appendChild(btn);
    };
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if (worker) worker.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); });
    });
    offerUpdate();
    // fetch any voice clips this phone doesn't have yet (after start-up, so the app opens fast)
    setTimeout(() => reg.active && reg.active.postMessage({ type: state.offlineAudio === 'full' ? 'fill-audio-all' : 'fill-audio' }), 8000);
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // A newly claimed first controller must not reload Home; only an approved update may.
    if (restartApproved) location.reload();
  });
}

// quick placement check, started by a grown-up from Settings
$('#placeBtn').onclick = () => { sfx.tap(); collectSettings(); startPlacement(); };
