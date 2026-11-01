/* =========================================================
   Learn & Play — app logic (screens, voice, rewards, progress)
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ROUND = 10;
const KEY = 'learnplay.v1';

/* ---------- saved progress ---------- */
const state = Object.assign(
  { name: '', voice: true, stars: 0, stickers: [], levels: {}, best: {} },
  (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })()
);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
const levelOf = (id) => state.levels[id] || 1;

/* ---------- voice ---------- */
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => /Samantha|Ava|Allison|Karen/i.test(v.name) && v.lang.startsWith('en'))
    || vs.find((v) => v.lang === 'en-US') || vs.find((v) => v.lang.startsWith('en')) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

function say(text, { rate = 0.92, pitch = 1.15 } = {}) {
  return new Promise((res) => {
    if (!text || !state.voice || !('speechSynthesis' in window)) return res();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = 'en-US'; u.rate = rate; u.pitch = pitch;
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    u.onend = fin; u.onerror = fin;
    u.onboundary = (ev) => u._onWord && u._onWord(ev);
    setTimeout(() => speechSynthesis.speak(u), 60);
    setTimeout(fin, 9000);
    say.current = u;
  });
}

/* ---------- little sound effects (no files needed) ---------- */
let actx;
function tone(freqs, { dur = 0.12, type = 'sine', gap = 0.09, vol = 0.18 } = {}) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
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

/* ---------- screens ---------- */
function show(id) {
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  scrollTo(0, 0);
}

function renderHome() {
  $('#hello').textContent = state.name ? `Hi, ${state.name}!` : 'Hi there!';
  $('#starCount').textContent = state.stars;
  $('#stickerCount').textContent = state.stickers.length;
  $('#grid').innerHTML = CATEGORIES.map((c) => {
    const best = state.best[c.id] || 0;
    const lv = c.id === 'mix' ? '' : `<span class="lv">Lv ${levelOf(c.id)}</span>`;
    return `<button class="tile" data-cat="${c.id}" style="--c:${c.color}">
      ${lv}<span class="ti">${c.icon}</span><span class="tt">${c.title}</span><span class="ts">${c.sub}</span>
      <span class="tb">${'★'.repeat(best)}${'☆'.repeat(3 - best)}</span></button>`;
  }).join('');
}

/* ---------- a round ---------- */
let R = null; // current round

function startRound(catId) {
  const cat = CATEGORIES.find((c) => c.id === catId);
  const real = CATEGORIES.filter((c) => c.gen);
  const qs = [], seen = new Set();
  let guard = 0;
  while (qs.length < ROUND && guard++ < 400) {
    const c = cat.gen ? cat : real[Math.floor(Math.random() * real.length)];
    const q = c.gen(levelOf(c.id));
    if (seen.has(q.key) && guard < 300) continue;
    seen.add(q.key); q.cat = c; qs.push(q);
  }
  R = { cat, qs, i: 0, firstTry: 0, mistakes: 0, streak: 0, best: 0 };
  $('#playTitle').textContent = `${cat.icon} ${cat.title}`;
  document.body.style.setProperty('--theme', cat.color);
  show('play');
  renderQ();
}

function renderProgress() {
  $('#progress').innerHTML = R.qs.map((q, i) =>
    `<span class="dot ${i < R.i ? (q.ok ? 'ok' : 'meh') : i === R.i ? 'now' : ''}">${i < R.i ? (q.ok ? '⭐' : '✔︎') : ''}</span>`).join('');
}

function renderQ() {
  const q = R.qs[R.i];
  q.tries = 0; q.hintShown = false; R.locked = false;
  renderProgress();
  $('#qText').innerHTML = q.text;
  $('#qMain').className = 'q-main ' + (q.mainClass || '');
  $('#qMain').innerHTML = q.main;
  $('#hintBox').innerHTML = ''; $('#hintBox').hidden = true;
  $('#hintBtn').hidden = !q.hint;
  $('#hintBtn').classList.remove('glow');
  const opts = $('#options');
  opts.className = 'options ' + (q.optClass || '') + (q.options.length === 4 ? ' four' : '') + (q.options.length === 2 ? ' two' : '');
  opts.innerHTML = q.options.map((o) => `<button class="opt" data-v="${String(o.v).replace(/"/g, '&quot;')}">${o.html}</button>`).join('');
  [...opts.children].forEach((b, k) => { b.style.animationDelay = `${k * 60}ms`; b.onclick = () => choose(q, q.options[k].v, b); });
  if (q.tap) $$('#qMain [data-val]').forEach((g) => { if (g.dataset.val) g.onclick = () => choose(q, g.dataset.val, g); });
  $$('[data-speak]', $('#qMain')).forEach((b) => (b.onclick = () => { sfx.tap(); say(b.dataset.speak, { rate: 0.8 }); }));
  // nudge the hint after a while, but never show the picture by itself
  clearTimeout(R.nudge);
  R.nudge = setTimeout(() => !q.hintShown && $('#hintBtn').classList.add('glow'), 12000);
  setTimeout(() => say(q.say || ''), 250);
}

function showHint(q, auto = false) {
  if (!q.hint || q.hintShown) { if (q.hint) speakHint(q); return; }
  q.hintShown = true;
  const box = $('#hintBox');
  box.innerHTML = q.hint.html || '';
  box.hidden = !q.hint.html;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  $('#hintBtn').classList.remove('glow');
  if (!auto) speakHint(q);
}

function speakHint(q) {
  const h = q.hint;
  if (h.karaoke) return karaoke(h.say);
  say(h.say, { rate: h.slow ? 0.7 : 0.9 });
}

// read a sentence aloud, lighting up each word
async function karaoke(text) {
  const spans = $$('.sw');
  const light = (k) => spans.forEach((s, j) => s.classList.toggle('lit', j === k));
  let i = 0, gotBoundary = false;
  const p = say(text, { rate: 0.75 });
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

const PRAISE = ['Excellent!', 'Awesome job!', 'Great work!', 'You did it!', 'Super star!', 'Fantastic!', 'Way to go!', 'Amazing!', 'Wonderful!', 'Brilliant!'];
const POPS = ['🌟', '🎉', '🦄', '🌈', '🥳', '💖', '🚀', '👏', '🏆', '😻'];

function choose(q, v, el) {
  if (R.locked) return;
  if (String(v) === String(q.answer)) {
    R.locked = true; clearTimeout(R.nudge);
    const first = q.tries === 0;
    q.ok = first;
    if (first) { R.firstTry++; R.streak++; R.best = Math.max(R.best, R.streak); } else R.streak = 0;
    el.classList.add('right');
    if (q.fill) { const b = $('.blank'); if (b) { b.textContent = q.answer; b.classList.add('filled'); } }
    $$('.qmark').forEach((m) => { m.textContent = q.answer; m.classList.add('filled'); });
    celebrate(first);
    setTimeout(next, first ? 1900 : 1600);
  } else {
    q.tries++; R.mistakes++; R.streak = 0;
    el.classList.add('wrong'); el.disabled = true;
    if (el.tagName === 'g') el.setAttribute('opacity', '.35');
    sfx.no();
    const oops = ['Oops! Try again.', 'Almost! Try again.', 'Not quite. You can do it!'][Math.min(q.tries - 1, 2)];
    const needHint = q.tries === 1 && q.hint && !q.hintShown;
    if (needHint) showHint(q, true); // picture/clue appears only after a miss
    say(oops).then(() => { if (needHint && !R.locked) speakHint(q); });
  }
}

function celebrate(first) {
  sfx.yes();
  const phrase = PRAISE[Math.floor(Math.random() * PRAISE.length)];
  const withName = state.name && Math.random() < 0.35 ? `${phrase.replace('!', '')}, ${state.name}!` : phrase;
  const pop = $('#pop');
  pop.innerHTML = `<div class="pop-emoji">${POPS[Math.floor(Math.random() * POPS.length)]}</div><div class="pop-text">${withName}</div>` +
    (R.streak >= 3 ? `<div class="pop-streak">🔥 ${R.streak} in a row!</div>` : '');
  pop.classList.remove('show'); void pop.offsetWidth; pop.classList.add('show');
  confetti(first ? 110 : 50);
  say(R.streak >= 3 && R.streak % 3 === 0 ? `${withName} ${R.streak} in a row!` : withName, { pitch: 1.3, rate: 1 });
}

function next() {
  $('#pop').classList.remove('show');
  R.i++;
  if (R.i >= R.qs.length) return finish();
  renderQ();
}

function finish() {
  renderProgress();
  const m = R.mistakes;
  const stars = m <= 2 ? 3 : m <= 5 ? 2 : 1;
  const id = R.cat.id;
  state.stars += R.firstTry;
  state.best[id] = Math.max(state.best[id] || 0, stars);
  // adapt difficulty
  let levelMsg = '';
  if (id !== 'mix') {
    const lv = levelOf(id);
    if (m <= 1 && lv < 3) { state.levels[id] = lv + 1; levelMsg = `⬆️ Level up! Now level ${lv + 1}`; }
    else if (m >= 8 && lv > 1) { state.levels[id] = lv - 1; }
  }
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
  show('result');
  sfx.win(); confetti(160, 0.3); setTimeout(() => confetti(120, 0.5), 600);
  const nm = state.name ? `, ${state.name}` : '';
  say(`${stars === 3 ? 'Wow! Awesome job' : stars === 2 ? 'Great job' : 'Good try'}${nm}! You got ${R.firstTry} stars.${levelMsg ? ' Level up!' : ''}${sticker ? ' And a new sticker!' : ''}`);
}

function renderStickers() {
  $('#stickerGrid').innerHTML = STICKERS.map((s) =>
    `<div class="stk ${state.stickers.includes(s) ? 'have' : ''}">${state.stickers.includes(s) ? s : '❔'}</div>`).join('');
  $('#stickerNote').textContent = `${state.stickers.length} of ${STICKERS.length} — finish a game to win a new one!`;
}

/* ---------- wire up ---------- */
$('#grid').addEventListener('click', (e) => {
  const t = e.target.closest('.tile'); if (!t) return;
  sfx.tap(); startRound(t.dataset.cat);
});
$('#hintBtn').onclick = () => { sfx.tap(); showHint(R.qs[R.i]); };
$('#sayBtn').onclick = () => { sfx.tap(); const q = R.qs[R.i]; say(q.say || q.readQ || q.text.replace(/<[^>]+>/g, '')); };
$('#quitBtn').onclick = () => { window.speechSynthesis && speechSynthesis.cancel(); clearTimeout(R && R.nudge); renderHome(); show('home'); };
$('#againBtn').onclick = () => startRound(R.cat.id);
$('#homeBtn').onclick = () => { renderHome(); show('home'); };
$('#stickersBtn').onclick = () => { sfx.tap(); renderStickers(); show('stickers'); };
$('#stickersBack').onclick = () => show('home');
$('#settingsBtn').onclick = () => {
  $('#nameInput').value = state.name; $('#voiceToggle').checked = state.voice;
  $('#levels').innerHTML = CATEGORIES.filter((c) => c.gen).map((c) =>
    `<label class="lvrow">${c.icon} ${c.title}<select data-id="${c.id}">${[1, 2, 3].map((l) => `<option ${levelOf(c.id) === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('');
  show('settings');
};
$('#settingsDone').onclick = () => {
  state.name = $('#nameInput').value.trim().slice(0, 20);
  state.voice = $('#voiceToggle').checked;
  $$('#levels select').forEach((s) => (state.levels[s.dataset.id] = +s.value));
  save(); renderHome(); show('home');
  if (state.name) say(`Hi, ${state.name}! Let's play!`);
};
$('#resetBtn').onclick = () => {
  if (!confirm('Reset all stars, stickers and levels?')) return;
  Object.assign(state, { stars: 0, stickers: [], levels: {}, best: {} }); save(); renderHome(); show('home');
};
$('#startBtn').onclick = () => {
  // first tap unlocks audio on iPhone
  tone([1, 1], { vol: 0.001 }); say(state.name ? `Hi, ${state.name}! Pick a game!` : 'Hi! Pick a game!');
  $('#splash').classList.add('gone');
};

renderHome();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
