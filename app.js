/* =========================================================
   Learn & Play — app logic (screens, voice, rewards, progress)
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ROUND = 10;
const KEY = 'learnplay.v1';

/* ---------- saved progress ---------- */
const state = Object.assign({ name: '', voice: true, stars: 0, stickers: [], levels: {}, best: {} }, Store.load());   // device settings + the active child
const QA_AVAILABLE = typeof APP_FEATURES !== 'undefined' && APP_FEATURES.qaTools === true;
const isQAMode = () => QA_AVAILABLE && state.testMode === true;
if (!QA_AVAILABLE) state.testMode = false; // Ignore stale tester settings in production.
const save = () => Store.save(state);
// if progress can't be saved (storage full), tell the grown-ups once instead of losing stars quietly
Store.onError = () => { if (Store.warned) return; Store.warned = true; setTimeout(() => { const n = document.createElement('div'); n.className = 'save-warn'; n.textContent = '⚠️ Progress could not be saved on this device (storage may be full). Grown-ups: ⚙️ → Save a backup.'; n.onclick = () => n.remove(); document.body.appendChild(n); }, 0); };   // storage.js decides where it goes (web now, native app later)
// a game never played yet starts in the middle of the child's grade range
const levelOf = (id) => state.levels[id] || (state.grade && GRADES[state.grade] && GRADES[state.grade].g[id] ? gradeStart(GRADES[state.grade].g[id]) : 1);
const maxLevelOf = (id) => (CATEGORIES.find((c) => c.id === id) || {}).maxLevel || 3;
const gameMax = maxLevelOf;
const OPTIONAL = { clock: 'optClock', anatomy: 'optAnatomy' };  // off unless a parent turns them on in Settings
// a child who reads and spells well doesn't need syllable clapping any more
const strongReader = () => levelOf('spell') >= 4 || levelOf('sent') >= 3 || (levelOf('spell') >= 3 && (state.best.spell || 0) >= 3);
const visibleGames = () => isQAMode() ? CATEGORIES.slice() : CATEGORIES.filter((c) => !(OPTIONAL[c.id] && !state[OPTIONAL[c.id]])
  && !(c.id === 'home' && typeof myCountry === 'function' && !myCountry())
  && !(c.id === 'syl' && !state.showAll && strongReader())
  && (!state.grade || state.showAll || c.id === 'mix' || gradeRange(state.grade, c.id)));
// auto level-up stops at the top of the child's grade (unless all games are shown)
const levelCap = (id) => { const r = state.grade && !state.showAll && gradeRange(state.grade, id); return r ? r[1] : gameMax(id); };

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
const onCard = (q, fn) => () => { if (R && R.qs[R.i] === q && $('#play').classList.contains('active')) fn(); };
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
function prefetch(text) { if (text) (Array.isArray(text) ? text.map(String) : splitSentences(text)).forEach((p) => { const f = CLIPS[clipKey(p)]; if (f) getBuf(f).catch(() => {}); }); }
function stopClip() { try { curSrc && curSrc.stop(); } catch {} curSrc = null; try { htmlPlayer.pause(); } catch {} }

function htmlPlay(file, token = sayToken) {
  if (token !== sayToken) return Promise.resolve();
  return new Promise((res) => {
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    htmlPlayer.onended = fin; htmlPlayer.onerror = fin;
    htmlPlayer.src = 'audio/' + file;
    const p = htmlPlayer.play(); if (p && p.catch) p.catch(fin);
    setTimeout(fin, 10000);
  });
}
const lastAudio = { path: '', err: '' };
async function playClip(file, token = sayToken) {
  if (token !== sayToken) return;
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

// A missing recording must never trigger a device/mechanical voice.
// The existing recorded audio pipeline remains the only narration source.
function deviceSay(text) {
  if (QA_AVAILABLE) console.warn('Missing natural voice clip:', text);
  return Promise.resolve();
}

async function say(text, opts = {}) {
  const my = ++sayToken;
  if (!text || !state.voice) return;
  stopClip();
  if (!Object.keys(CLIPS).length) await Promise.race([clipsReady, sleep(4000)]);
  if (my !== sayToken) return;
  const parts = Array.isArray(text) ? text.map(String) : splitSentences(text);
  const files = parts.map((p) => CLIPS[clipKey(p)]);
  if (parts.length) {
    say.current = null;
    // Play all recorded segments in order. An unavailable word is silent,
    // but does not silence a recorded instruction or use a robotic voice.
    for (let i = 0; i < parts.length; i++) {
      if (my !== sayToken) return;
      if (files[i]) await playClip(files[i], my);
      else await deviceSay(parts[i]);
    }
  }
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

/* Keep accidental page pinch/expansion off the navigation screens; preserve
   one-finger scrolling, system accessibility zoom and question-page zoom. */
const onNavigationScreen = () => ['home', 'settings'].some((id) => $('#' + id)?.classList.contains('active'));
document.addEventListener('gesturestart', (e) => { if (onNavigationScreen()) e.preventDefault(); }, { passive: false });
document.addEventListener('touchmove', (e) => { if (onNavigationScreen() && e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('wheel', (e) => { if (onNavigationScreen() && e.ctrlKey) e.preventDefault(); }, { passive: false });

/* ---------- screens ---------- */
let homeScrollY = 0;
function show(id) {
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
  $('#gradeLabel').textContent = state.grade ? GRADES[state.grade].label : 'Pick grade';
  $('#gradeChip').classList.toggle('pulse', !state.grade);
  if (typeof renderPlayBanner === 'function') renderPlayBanner();
  if (typeof renderToday === 'function') renderToday();
  if (typeof renderQuest === 'function') renderQuest();
  const groups = [
    ['📖 Reading & Words', ['trace', 'phonics', 'cvc', 'w4', 'sight', 'spell', 'vocab', 'sent', 'words', 'match', 'syl']],
    ['🔢 Math', ['add', 'sub', 'story', 'cmp', 'numsense', 'mul', 'div', 'clock', 'shape2']],
    ['🧩 Brain Teasers', ['pattern', 'odd', 'sequence'], 'brain'],
    ['🌍 Science & World', ['sci', 'home', 'body', 'gk', 'anatomy', 'jobs', 'flags', 'animals', 'places', 'maps', 'mix']]
  ];
  const visible = visibleGames();
  const makeTile = (c) => {
    const best = Math.min(3, state.best[c.id] || 0);
    const lv = c.id === 'mix' || c.trace ? '' : `<span class="lv">Lv ${levelOf(c.id)}</span>`;
    const icon = c.id === 'home' && typeof myCountry === 'function' && myCountry() ? myCountry().flag : c.icon;
    return `<button class="tile" data-cat="${c.id}" style="--c:${c.color}">
      ${lv}<span class="ti">${icon}</span><span class="tt">${c.title}</span><span class="ts">${c.sub}</span>
      <span class="tb">${'★'.repeat(best)}${'☆'.repeat(3 - best)}</span></button>`;
  };
  // brain games (memory, puzzles, mazes …) sit right inside Brain Teasers: a tap opens the game
  const gameTile = (g) => `<button class="tile" data-game="${g.id}" style="--c:${g.color}">${lvBadge(g.id)}<span class="ti">${g.icon}</span><span class="tt">${g.title}</span><span class="ts">puzzle game</span></button>`;
  $('#grid').innerHTML = locHTML(groups.map(([title, ids, brain]) => {
    const cats = visible.filter((c) => ids.includes(c.id));
    const games = brain === 'brain' && typeof brainGames === 'function' ? brainGames() : [];
    return cats.length || games.length ? `<section class="catalog-section"><h2>${title}</h2><div class="grid">${cats.map(makeTile).join('')}${games.map(gameTile).join('')}</div></section>` : '';
  }).join(''));
}

/* ---------- a round ---------- */
let R = null; // current round

function startRound(catId, count, browse = false, atLevel = null) {
  if (isQAMode()) browse = true; // QA never changes mastery, stars or play passes.
  sayToken++; stopClip(); $('#pop').classList.remove('show'); $('#pop').replaceChildren();
  const cat = CATEGORIES.find((c) => c.id === catId);
  const real = visibleGames().filter((c) => c.gen);
  const qs = [], seen = new Set();
  let guard = 0;
  const N = count || cat.roundLen || ROUND;
  // questions seen in the last few rounds are skipped while there are fresh ones to ask
  state.recent = state.recent || {};
  const recent = new Set(state.recent[cat.id] || []);
  while (qs.length < N && guard++ < 600) {
    const c = cat.gen ? cat : real[Math.floor(Math.random() * real.length)];
    const q = c.gen(atLevel || levelOf(c.id));
    if (seen.has(q.key) && guard < 500) continue;
    if (!browse && recent.has(q.key) && guard < 350) continue;
    seen.add(q.key); q.cat = c; q.level = atLevel || levelOf(c.id); qs.push(q);
  }
  if (!browse) { state.recent[cat.id] = [...(state.recent[cat.id] || []), ...qs.map((q) => q.key)].slice(-60); save(); }
  R = { cat, qs, i: 0, firstTry: 0, mistakes: 0, streak: 0, best: 0, browse, atLevel };
  $('#playTitle').textContent = `${cat.icon} ${cat.title}`;
  document.body.style.setProperty('--theme', cat.color);
  show('play');
  renderQ();
}

function renderProgress() {
  $('#diffLv').textContent = R.cat.id === 'mix' ? '' : `Lv ${levelOf(R.cat.id)}`;
  $('#diffBtn').hidden = R.cat.id === 'mix';
  $('#progress').innerHTML = R.qs.map((q, i) =>
    `<span class="dot ${i < R.i ? (q.ok ? 'ok' : 'meh') : i === R.i ? 'now' : ''}">${i < R.i ? (q.ok ? '⭐' : '✔︎') : ''}</span>`).join('');
}

/* ---------- 3D body view (loaded only when a body question appears) ---------- */
const B3D = { view: null, mod: null };
function dropBody3D() { if (B3D.view) { B3D.view.dispose(); B3D.view = null; } }
// leaving the game: free the 3D graphics memory too (the model itself stays loaded)
function releaseBody3D() { dropBody3D(); if (B3D.mod && B3D.mod.release) B3D.mod.release(); }
async function mountBody3D(q) {
  const host = document.createElement('div'); host.className = 'b3d-host'; host.innerHTML = '<div class="b3d-loading">🧍 Getting ready…</div>';
  $('#qMain').appendChild(host);
  try { B3D.mod = B3D.mod || await import('./body3d.js'); } catch (e) { host.innerHTML = '<div class="hint-note">3D is not available.</div>'; return; }
  if (R.qs[R.i] !== q) return;                     // moved on while loading
  dropBody3D();
  B3D.view = B3D.mod.mount(host, {
    layer: q.body3d.layer, highlight: q.body3d.highlight || null, focus: q.answer, tappable: q.body3d.tappable,
    onTap: q.body3d.tap ? (names) => { if (R.locked) return; const el = document.createElement('i'); choose(q, names.includes(q.answer) ? q.answer : names[0], el); } : null,
  });
}

let questionZoom = null;
function ensureQuestionZoom() {
  if (questionZoom || typeof zoomable !== 'function') return;
  questionZoom = zoomable($('#qZoomView'), $('#qZoomInner'));
  $('#qZoomIn').onclick = () => questionZoom.by(1.4);
  $('#qZoomOut').onclick = () => questionZoom.by(1 / 1.4);
  $('#qZoomReset').onclick = () => questionZoom.reset();
}
function renderQ() {
  ensureQuestionZoom();
  if (questionZoom) questionZoom.reset();
  // A prior answer's recording or feedback must never appear on an unanswered card.
  sayToken++; stopClip(); $('#pop').classList.remove('show'); $('#pop').replaceChildren();
  dropBody3D();
  const q = R.qs[R.i];
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
  [...opts.children].forEach((b, k) => { b.style.animationDelay = `${k * 60}ms`; b.onclick = () => choose(q, q.options[k].v, b); if (isQAMode() && String(q.options[k].v) === String(q.answer)) b.dataset.ok = '1'; });
  if (isQAMode()) $('#qText').insertAdjacentHTML('beforeend', `<div class="test-ans">🧪 ${String(q.answer)}</div>`);
  if (q.spell) renderSpell(q);
  if (q.body3d) mountBody3D(q);
  if (q.match) renderMatch(q);
  if (q.puzzle) renderPuzzle(q);
  if (q.multi) renderMulti(q);
  if (q.letterPath) renderLetterPath(q);
  if (q.fillIn) renderFillIn(q);
  if (q.passageFill) renderPassageFill(q);
  if (q.order) renderOrder(q);
  if (q.blend && typeof wireBlend === 'function') wireBlend(q);
  if (q.letterSound && typeof wireLetter === 'function') wireLetter(q);
  if (q.tap) $$('#qMain [data-val]').forEach((g) => { if (g.dataset.val) g.onclick = () => choose(q, g.dataset.val, g); });
  $$('[data-speak]', $('#qMain')).forEach((b) => (b.onclick = () => { sfx.tap(); say(b.dataset.speak, { rate: 0.8 }); }));
  // nudge the hint after a while, but never show the picture by itself
  clearTimeout(R.nudge);
  R.nudge = setTimeout(onCard(q, () => { if (!q.hintShown) $('#hintBtn').classList.add('glow'); }), 12000);
  setTimeout(onCard(q, () => say(q.say || '')), 250);
  const nq = R.qs[R.i + 1]; if (nq) { prefetch(nq.say); nq.hint && prefetch(nq.hint.say); }
  q.hint && prefetch(q.hint.say);
}

function removeOneWrong(q) {
  const wrong = [...$('#options').children].filter((b) => !b.disabled && String(b.dataset.v) !== String(q.answer));
  if (wrong.length > 1) { const b = pick(wrong); b.classList.add('wrong'); b.disabled = true; }
}
function showHint(q, auto = false) {
  if (q.hint && q.hint.glow && B3D.view) { B3D.view.highlight(q.answer); q.hintShown = true; $('#hintBtn').classList.remove('glow'); speakHint(q); return; }
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
  $$('.slot[data-i]', row).forEach((sl) => (sl.onclick = () => {
    if (R.locked) return;
    const id = q.slots[sl.dataset.i]; if (id == null) return;
    sfx.tap(); unplace(q, +sl.dataset.i);
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
function dragStart(e, q, t) {
  if (R.locked || t.classList.contains('used')) return;
  e.preventDefault();
  const r = t.getBoundingClientRect();
  const ghost = t.cloneNode(true);
  ghost.className = 'tile-l ghost';
  Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.appendChild(ghost);
  drag = { q, t, ghost, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, id: e.pointerId };
  t.classList.add('lifting');
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
  const { q, t, ghost, moved } = drag; drag = null;
  ghost.remove(); t.classList.remove('lifting');
  $$('.slot.over').forEach((s) => s.classList.remove('over'));
  if (R.locked) return;
  const id = +t.dataset.id;
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
  q.done = new Set(); q.selL = null;
  const box = $('#options');
  box.innerHTML = `<div class="m-cols"><div class="m-col">${left.map((x) => `<button class="m-item L" data-id="${x.id}">${x.html}</button>`).join('')}</div>
    <svg class="m-lines"></svg>
    <div class="m-col">${right.map((x) => `<button class="m-item R" data-id="${x.id}">${x.html}</button>`).join('')}</div></div>`;
  $$('.m-item.L', box).forEach((b) => (b.onclick = () => {
    if (R.locked || b.classList.contains('ok')) return;
    $$('.m-item.L', box).forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); q.selL = +b.dataset.id; sfx.tap();
  }));
  $$('.m-item.R', box).forEach((b) => (b.onclick = () => {
    if (R.locked || b.classList.contains('ok')) return;
    if (q.selL == null) { b.classList.add('nudge'); setTimeout(() => b.classList.remove('nudge'), 400); return; }
    const L = $(`.m-item.L[data-id="${q.selL}"]`, box);
    if (+b.dataset.id === q.selL) {
      L.classList.remove('sel'); L.classList.add('ok'); b.classList.add('ok'); drawLine(L, b, true);
      q.done.add(q.selL); q.selL = null; sfx.yes();
      if (q.done.size === left.length) matchDone(q);
    } else {
      q.tries++; R.mistakes++; R.streak = 0; sfx.no();
      b.classList.add('bad'); L.classList.add('bad');
      setTimeout(() => { b.classList.remove('bad'); L.classList.remove('bad'); }, 500);
      if (q.tries === 2) say('Look carefully, and try again!');
    }
  }));
}
function drawLine(a, b, ok) {
  const svg = $('.m-lines'); if (!svg) return;
  const s = svg.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
  const x1 = ra.right - s.left, y1 = ra.top + ra.height / 2 - s.top, x2 = rb.left - s.left, y2 = rb.top + rb.height / 2 - s.top;
  svg.insertAdjacentHTML('beforeend', `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${ok ? 'ok' : ''}"/>`);
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
  [...$('#options').children].forEach((b, k) => (b.onclick = () => {
    if (R.locked || R.qs[R.i] !== q) return;
    const v = String(q.options[k].v);
    if (got.has(v)) return;
    if (want.has(v)) { got.add(v); b.classList.add('right'); sfx.yes(); if (got.size === want.size) matchDone(q); }
    else { q.tries++; R.mistakes++; R.streak = 0; b.classList.add('wrong'); b.disabled = true; sfx.no(); if (q.tries === 1) say('Look carefully, and try again!'); }
  }));
  if (isQAMode()) [...$('#options').children].forEach((b, k) => { if (want.has(String(q.options[k].v))) b.dataset.ok = '1'; });
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
  if (state.testMode || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__letterPath = { idx, step };
}
// several small questions on one screen share these: a right answer locks in, a wrong one is a mistake
const partMiss = (q, el) => { q.tries++; R.mistakes++; R.streak = 0; sfx.no(); if (el) { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); } };
const live = (q) => !R.locked && R.qs[R.i] === q;
// word box: tap a blank, then a word from the box (the first open blank is picked for you)
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
  mark();
  q.partHint = () => { const c = $(`.g1-chip[data-w="${lines[sel].answer}"]`, wrap); if (c) { c.classList.remove('glow-l'); void c.offsetWidth; c.classList.add('glow-l'); } };
}
// read the story, then finish each sentence with one of its words
function renderPassageFill(q) {
  const wrap = document.createElement('div'); wrap.className = 'g1-fill';
  wrap.innerHTML = q.passageFill.map((p, i) => `<div class="g1-q" data-i="${i}"><div class="g1-sent">${p.s.replace('___', '<span class="g1-blank">&nbsp;</span>')}</div>
    <div class="g1-opts">${p.options.map((o) => `<button class="g1-chip" data-o="${o}">${o}</button>`).join('')}</div></div>`).join('');
  $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
  const done = new Set();
  $$('.g1-q', wrap).forEach((row) => {
    const i = +row.dataset.i, p = q.passageFill[i];
    $$('.g1-chip', row).forEach((c) => (c.onclick = () => {
      if (!live(q) || done.has(i) || c.disabled) return;
      if (c.dataset.o === p.answer) {
        done.add(i); const b = $('.g1-blank', row); b.textContent = p.answer; b.classList.add('ok'); row.classList.add('ok'); sfx.yes();
        if (done.size === q.passageFill.length) matchDone(q);
      } else { c.disabled = true; partMiss(q, c); }
    }));
  });
  q.partHint = () => { const i = q.passageFill.findIndex((_, k) => !done.has(k)); const row = $(`.g1-q[data-i="${i}"]`, wrap); if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
}
// tap the pictures in the order of the story
function renderOrder(q) {
  const { pics, shown } = q.order, wrap = document.createElement('div'); wrap.className = 'g1-order';
  wrap.innerHTML = shown.map((k) => `<button class="g1-pic-btn" data-k="${k}">${pics[k]}<i></i></button>`).join('');
  $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
  let next = 0;
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
    if (first) { R.firstTry++; R.streak++; R.best = Math.max(R.best, R.streak); } else R.streak = 0;
    el.classList.add('right');
    if (q.fill) { const b = $('.blank'); if (b) { b.textContent = q.answer; b.classList.add('filled'); } }
    $$('.qmark').forEach((m) => { m.textContent = q.answer; m.classList.add('filled'); });
    celebrate(first);
    if (q.reveal && B3D.view) {
      setTimeout(onCard(q, () => { if (B3D.view) { B3D.view.reveal(q.reveal); say(q.reveal.text); } }), 1200);
      setTimeout(onCard(q, next), 4600);
    } else setTimeout(onCard(q, next), first ? 1900 : 1600);
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

function next() {
  $('#pop').classList.remove('show');
  const done = R.qs[R.i];
  if (!R.browse && done && done.ok !== undefined && typeof logAttempt === 'function') logAttempt(done, done.cat.id, done.level);
  R.i++;
  if (R.i >= R.qs.length) return finish();
  renderQ();
}

function finish() {
  if (R.browse) { releaseBody3D(); renderHome(); show('home'); return; }   // the test browser does not change levels or stars
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
  if (id !== 'mix' && !R.atLevel) {          // practice at an older level (quest) doesn't move her level
    const lv = levelOf(id);
    // progress decides: great rounds move up (past her grade too, after two great rounds in a row),
    // hard rounds move back down — even below her grade's starting level
    state.good = state.good || {};
    if (rate <= 0.1) {
      state.good[id] = (state.good[id] || 0) + 1;
      if (lv < levelCap(id)) { state.levels[id] = lv + 1; state.good[id] = 0; levelMsg = `⬆️ Level up! Now level ${lv + 1}`; }
      else if (lv < gameMax(id) && state.good[id] >= 2) { state.levels[id] = lv + 1; state.good[id] = 0; levelMsg = `🚀 Super! Trying a harder level: ${lv + 1}`; }
      else if (lv < gameMax(id)) levelMsg = '⭐ One more great round unlocks a harder level!';
    } else {
      state.good[id] = 0;
      if (rate >= 0.5 && n >= 5 && lv > 1) { state.levels[id] = lv - 1; levelMsg = `🙂 Let's practice level ${lv - 1} a bit more`; }
    }
  }
  const earned = earnPlay();
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
    $('#questNext').textContent = nextI < 0 ? '🎁 Open your quest gift!' : '🗺️ Next quest step ▶';
    $('#questNext').onclick = () => { sfx.tap(); if (nextI < 0) { renderHome(); show('home'); openQuestGift(); } else startQuestStep(nextI); };
  }
  $('#againBtn').hidden = !!qn;
  show('result');
  sfx.win(); confetti(160, 0.3); setTimeout(() => confetti(120, 0.5), 600);
  say(`${stars === 3 ? 'Wow! Awesome job!' : stars === 2 ? 'Great job!' : 'Good try!'} You got ${R.firstTry} stars.${levelMsg ? ' Level up!' : ''}${sticker ? ' And a new sticker!' : ''}${earned ? ' You earned play time!' : ''}`);
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
  const my = L.i;
  for (const part of ['word', 'meaning', 'example']) {
    if (L.i !== my || !$('#learn').classList.contains('active')) return;
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
  const g = Object.entries(GRADES).filter(([k]) => { const r = gradeRange(k, id); return r && lv >= r[0] && lv <= r[1]; }).map(([, v]) => v.label);
  return g.length ? `Typical for: ${g.join(', ')}` : '';
}
function openDiff() {
  if (!R || R.cat.id === 'mix') return;
  const id = R.cat.id, max = gameMax(id);
  const sl = $('#diffRange');
  sl.max = max; sl.value = levelOf(id);
  const upd = () => { $('#diffVal').textContent = `Level ${sl.value} of ${max}`; $('#diffGrade').textContent = gradeHintFor(id, +sl.value); };
  sl.oninput = upd; upd();
  $('#diffName').textContent = `${R.cat.icon} ${R.cat.title}`;
  $('#diffSheet').hidden = false;
}
$('#diffApply').onclick = () => {
  const id = R.cat.id; state.levels[id] = +$('#diffRange').value; state.good && (state.good[id] = 0); save();
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
  document.body.classList.toggle('test-mode', isQAMode());
}
function renderThemes() {
  $('#themeBtns').innerHTML = Object.entries(THEMES).map(([k, t]) => `<button class="grade-btn ${(state.theme || 'rainbow') === k ? 'on' : ''}" data-t="${k}">${t.label}</button>`).join('');
  $$('#themeBtns .grade-btn').forEach((b) => (b.onclick = () => { sfx.tap(); state.theme = b.dataset.t; save(); applyTheme(); renderThemes(); }));
}

/* QA is a normal, PIN-protected Settings toggle only when enabled by app-config.js. */
function renderTestInfo() {
  const clips = Object.keys(CLIPS).length;
  const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  $('#testInfo').textContent = `Voice clips: ${clips} · 3D: ${gl ? 'yes' : 'no'} · Grade: ${state.grade || 'none'} · Screen: ${innerWidth}×${innerHeight}`;
}
$('#testMode').onchange = () => { if (!QA_AVAILABLE) return; state.testMode = $('#testMode').checked; save(); applyTheme(); $('#testSection .test-browse').hidden = !isQAMode(); if (isQAMode()) renderTestInfo(); };
// QA navigation is instant and NEVER awards learning credit.
$('#skipBtn').onclick = () => {
  if (!isQAMode() || !R || !R.qs[R.i]) return;
  R.browse = true; const q = R.qs[R.i]; q.skipped = true; q.ok = false;
  R.locked = true; clearTimeout(R.nudge); sayToken++; stopClip(); next();
};
$('#endBtn').onclick = () => {
  if (!isQAMode() || !R) return;
  R.browse = true; R.i = R.qs.length - 1; R.locked = true; next();
};
$('#qaRevealBtn').onclick = () => {
  if (!isQAMode() || !R) return;
  const q = R.qs[R.i]; $('#qText').insertAdjacentHTML('beforeend', `<div class="test-ans">🧪 Answer: ${esc(String(q.answer))}</div>`);
};
document.addEventListener('keydown', (e) => {
  if (!isQAMode() || !$('#play').classList.contains('active') || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '') || e.altKey || e.metaKey || e.ctrlKey) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); $('#skipBtn').click(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); $('#prevBtn').click(); }
});

/* ---------- wire up ---------- */
$('#grid').addEventListener('click', (e) => {
  const t = e.target.closest('.tile'); if (!t) return;
  sfx.tap();
  if (t.dataset.game) return openBrainGame(t.dataset.game);
  if (t.dataset.cat === 'vocab') return openLearn();
  if (t.dataset.cat === 'trace') { TR.quest = null; return openTrace(); }
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
    `<button class="grade-btn ${state.grade === k ? 'on' : ''}" data-g="${k}">${g.label}</button>`).join('');
  $$('#gradeBtns .grade-btn').forEach((b) => (b.onclick = () => {
    sfx.tap(); state.grade = b.dataset.g; state.levels = {}; Object.entries(GRADES[state.grade].g).forEach(([id, r]) => (state.levels[id] = gradeStart(r))); save();
    renderGrades();
    $$('#levels select').forEach((sel) => (sel.value = levelOf(sel.dataset.id)));
  }));
}
$('#gradeChip').onclick = () => $('#settingsBtn').onclick();
$('#settingsBtn').onclick = () => askPin(openSettings);
function openSettings() {
  renderKids();
  renderGrades(); renderThemes(); $('#testMode').checked = isQAMode(); $('#testSection').hidden = !QA_AVAILABLE; $('#testSection .test-browse').hidden = !isQAMode(); if (QA_AVAILABLE) renderTestInfo();
  $('#countrySel').innerHTML = COUNTRY_ORDER.map((k) => `<option value="${k}">${COUNTRIES[k].flag} ${COUNTRIES[k].label}</option>`).join('') + '<option value="other">🌍 Somewhere else</option>';
  $('#countrySel').value = countryCode();
  $('#nameInput').value = state.name; $('#showAll').checked = !!state.showAll; $('#optClock').checked = !!state.optClock; $('#roundsPerPlay').value = String(state.roundsPerPlay || 2); $('#playMinutes').value = String(state.playMinutes || 3); $('#playAlways').checked = !!state.playAlways; $('#optAnatomy').checked = !!state.optAnatomy; $('#playMode').value = state.playMode || 'rounds'; $('#playPerHour').value = String(state.playPerHour || 15); syncPlayMode(); $('#voiceToggle').checked = state.voice;
  $('#levels').innerHTML = CATEGORIES.filter((c) => c.gen).map((c) =>
    `<label class="lvrow">${c.icon} ${c.title}<select data-id="${c.id}">${Array.from({ length: maxLevelOf(c.id) }, (_, k) => k + 1).map((l) => `<option ${levelOf(c.id) === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('');
  renderTestBrowser();
  show('settings');
}

/* ---------- grown-up PIN (asked before Settings) ---------- */
const pinHash = (p) => { let h = 5381; for (const ch of 'lp:' + p) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h.toString(36); };
function askPin(onOk, change = false) {
  const sheet = $('#pinSheet'); let typed = '', first = null;
  const mode = () => (!state.pinHash || change ? (first ? 'confirm' : 'new') : 'check');
  const paint = () => {
    $('#pinTitle').textContent = mode() === 'check' ? '🔒 Grown-ups only' : mode() === 'new' ? '🔒 Make a grown-up PIN' : '🔒 Type it again';
    $('#pinNote').textContent = mode() === 'check' ? 'Type your 4-digit PIN.' : mode() === 'new' ? 'Pick 4 numbers. You will need them to open Settings.' : 'Type the same 4 numbers.';
    $$('#pinDots i').forEach((d, k) => d.classList.toggle('on', k < typed.length));
    $('#pinForgotBtn').hidden = mode() !== 'check'; $('#pinForgot').hidden = true;
  };
  const close = () => { sheet.hidden = true; $('#pinPad').onclick = null; sheet.onclick = null; };
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
      const m = mode();
      if (m === 'check') {
        if (Date.now() < (askPin.lockUntil || 0)) { typed = ''; shake(); $('#pinNote').textContent = 'Too many tries. Wait a little and try again.'; return; }
        if (pinHash(typed) === state.pinHash) { askPin.misses = 0; close(); onOk(); }
        else { typed = ''; shake(); paint(); kidNote(); askPin.misses = (askPin.misses || 0) + 1; if (askPin.misses >= 3) { askPin.lockUntil = Date.now() + 30000 * (askPin.misses - 2); $('#pinNote').textContent = 'Too many tries. Wait 30 seconds.'; } }
      }
      else if (m === 'new') { first = typed; typed = ''; paint(); }
      else if (typed === first) { state.pinHash = pinHash(typed); save(); close(); sfx.yes(); onOk(); }
      else { first = null; typed = ''; shake(); paint(); }
    }, 150);
  };
  // forgot: a grown-up math question resets the PIN
  $('#pinForgotBtn').onclick = () => {
    const a = 12 + Math.floor(Math.random() * 8), b = 6 + Math.floor(Math.random() * 4), ans = a * b;
    const opts = shuffle([ans, ans + a, ans - b, ans + 10]);
    $('#pinForgot').innerHTML = `<p>To make a new PIN, answer: <b>${a} × ${b} = ?</b></p><div class="pin-ans">${opts.map((o) => `<button data-v="${o}">${o}</button>`).join('')}</div>`;
    $('#pinForgot').hidden = false;
    $$('#pinForgot [data-v]').forEach((x) => (x.onclick = () => { if (+x.dataset.v === ans) { state.pinHash = ''; save(); typed = ''; first = null; paint(); } else { shake(); $('#pinForgot').hidden = true; } }));
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
  if (!isQAMode()) return;
  startRound($('#tbGame').value, 30, true, +$('#tbLevel').value);
};
$('#prevBtn').onclick = () => {
  if (!isQAMode() || !R || R.i === 0) return;
  R.browse = true; R.i--; R.locked = false; renderQ();
};
function collectSettings() {
  state.name = $('#nameInput').value.trim().slice(0, 20);
  state.voice = $('#voiceToggle').checked;
  state.country = $('#countrySel').value;
  state.showAll = $('#showAll').checked;
  state.optClock = $('#optClock').checked;
  state.roundsPerPlay = +$('#roundsPerPlay').value; state.playMinutes = +$('#playMinutes').value; state.playAlways = $('#playAlways').checked; state.optAnatomy = $('#optAnatomy').checked; state.playMode = $('#playMode').value; state.playPerHour = +$('#playPerHour').value;
  $$('#levels select').forEach((s) => (state.levels[s.dataset.id] = +s.value));
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
    <span class="who-av">${esc(k.avatar || '🦄')}</span><b>${esc(k.name || 'Player')}</b><small>${k.grade ? GRADES[k.grade].label : ''}</small></button>`).join('');
  $$('#whoGrid .who-kid').forEach((b) => (b.onclick = () => { sfx.tap(); switchKid(b.dataset.id); $('#whoSheet').hidden = true; say("Let's play!"); }));
  $('#whoSheet').hidden = false;
}
$('#kidBtn').onclick = () => { sfx.tap(); if (Store.kids().length > 1) openWho(); else askPin(() => { openSettings(); setTimeout(() => $('.kids-field').scrollIntoView({ block: 'center' }), 50); }); };
$('#whoSheet').onclick = (e) => { if (e.target.id === 'whoSheet') $('#whoSheet').hidden = true; };
function renderKids() {
  const kids = Store.kids();
  $('#kidChips').innerHTML = kids.map((k) => `<button class="kid-chip ${k.id === Store.activeId() ? 'on' : ''}" data-id="${k.id}"><span>${esc(k.avatar || '🦄')}</span>${esc(k.name || 'Player')}</button>`).join('')
    + (kids.length < MAX_KIDS ? '<button class="kid-chip add" data-add="1">＋ Add a child</button>' : '');
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
  out.textContent = 'Playing…';
  await say('Excellent! Awesome job!');
  out.textContent = `Recorded clips: ${Object.keys(CLIPS).length} · audio: ${actx ? actx.state : 'off'} · played via: ${lastAudio.path || '—'}${lastAudio.err ? ' · ' + lastAudio.err : ''}`;
};
$('#resetBtn').onclick = () => {
  if (!confirm('Reset all stars, stickers and levels?')) return;
  // keep the grown-up settings (name, grade, voice, PIN, play rules, look); clear everything the child earned
  const KEEP = ['name', 'avatar', 'grade', 'country', 'dailyGoal', 'voice', 'pinHash', 'theme', 'showAll', 'optClock', 'optAnatomy', 'playMode', 'playPerHour', 'roundsPerPlay', 'playMinutes', 'playAlways', 'testMode', 'schema'];
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
  if (Store.kids().length > 1) openWho(); else say('Hi! Pick a game!');
};

applyTheme();
renderHome();
// A service-worker upgrade can reload this tab; never ask the child to press Let's Play twice.
try { if (sessionStorage.getItem('learnplay.started') === '1') $('#splash').classList.add('gone'); } catch {}
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    // a new version waits until she is on the home screen (never mid-game), then the app reloads into it
    const tryUpdate = () => { if (reg.waiting && $('#splash').classList.contains('gone') && $('#home').classList.contains('active') && !document.querySelector('.time-up:not([hidden])')) reg.waiting.postMessage({ type: 'update-now' }); };
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => w.state === 'installed' && tryUpdate()); });
    setInterval(tryUpdate, 4000); tryUpdate();
    // fetch any voice clips this phone doesn't have yet (after start-up, so the app opens fast)
    setTimeout(() => reg.active && reg.active.postMessage({ type: state.offlineAudio === 'full' ? 'fill-audio-all' : 'fill-audio' }), 8000);
  }).catch(() => {});
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController) { hadController = true; return; } location.reload(); });
}
