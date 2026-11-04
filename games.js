/* =========================================================
   Play Zone — reward games, unlocked by finishing learning rounds
   Tic-Tac-Toe · Memory Match · Pop the Balloons · Coloring Book · Connect Four
   ========================================================= */

/* ---------- unlock rules ---------- */
// Two rules a parent can pick in Settings:
//  'rounds' (default): every N finished learning rounds earns a play break of M minutes
//  'hourly': free play for up to K minutes in each clock hour (e.g. 15 min per hour)
const roundsPerPlay = () => state.roundsPerPlay || 2;
const playMinutes = () => state.playMinutes || 3;
const hourlyMode = () => state.playMode === 'hourly';
const perHour = () => state.playPerHour || 15;
const hourKey = () => { const d = new Date(); return `${d.toDateString()} ${d.getHours()}`; };
const usedThisHour = () => (state.playUsed && state.playUsed.h === hourKey() ? state.playUsed.ms : 0);
const hourLeftMs = () => Math.max(0, perHour() * 60000 - usedThisHour());
const playOpen = () => !!state.playAlways || !!state.testMode || (hourlyMode() ? hourLeftMs() > 0 : (state.playUntil || 0) > Date.now());

// called from finish() in app.js; returns true when a new play break was earned
function earnPlay() {
  if (hourlyMode()) return false;
  state.roundsSincePlay = (state.roundsSincePlay || 0) + 1;
  if (state.roundsSincePlay >= roundsPerPlay()) {
    state.roundsSincePlay = 0;
    state.playPasses = (state.playPasses || 0) + 1;
    save();
    return true;
  }
  save();
  return false;
}

const nextHourLabel = () => { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
function playStatus() {
  if (state.playAlways) return { open: true, text: 'Always open' };
  if (hourlyMode()) {
    return hourLeftMs() > 0 ? { open: true, text: `${fmtLeft()} of play left this hour` } : { open: false, text: `Play again at ${nextHourLabel()}` };
  }
  if (playOpen()) return { open: true, text: `${fmtLeft()} left` };
  if (state.playPasses > 0) return { open: true, ready: true, text: `Ready! ${playMinutes()} min of play` };
  const left = roundsPerPlay() - (state.roundsSincePlay || 0);
  return { open: false, text: `Finish ${left} more round${left === 1 ? '' : 's'} to play` };
}
const fmtLeft = () => {
  const ms = hourlyMode() ? hourLeftMs() : (state.playUntil || 0) - Date.now();
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function renderPlayBanner() {
  const st = playStatus();
  const dots = hourlyMode() ? '<span class="pb-wait">⏳</span>'
    : Array.from({ length: roundsPerPlay() }, (_, i) => `<i class="${i < (state.roundsSincePlay || 0) ? 'on' : ''}"></i>`).join('');
  $('#playBanner').className = 'play-banner' + (st.open ? ' open' : '');
  $('#playBanner').innerHTML = `<span class="pb-icon">${st.open ? '🎮' : '🔒'}</span>
    <span class="pb-txt"><b>Play Zone</b><small>${st.text}</small></span>
    ${st.open ? '<span class="pb-go">Play ▶</span>' : `<span class="pb-dots">${dots}</span>`}`;
}

function openPlayZone() {
  if (!playOpen()) {
    if (!hourlyMode() && state.playPasses > 0) {
      state.playPasses--;
      state.playUntil = Date.now() + playMinutes() * 60000;
      save();
      say('You earned play time!');
    } else {
      sfx.no();
      if (hourlyMode()) say('Play time is all used up for now. Let us learn!');
      else say(`Finish ${roundsPerPlay() - (state.roundsSincePlay || 0)} more round${roundsPerPlay() - (state.roundsSincePlay || 0) === 1 ? '' : 's'} to play.`);
      return;
    }
  }
  brainMode = false;
  renderPZ();
  $('#pzTitle').textContent = '🎮 Play Zone';
  $('#playzone .play-clock, #game .play-clock').forEach((x) => (x.hidden = false));
  document.body.style.setProperty('--theme', '#ff6bb5');
  show('playzone');
  startPlayTimer();
}

/* ---------- play timer ---------- */
let playTimer = 0, lastTick = 0;
function startPlayTimer() {
  clearInterval(playTimer);
  lastTick = Date.now();
  const tick = () => {
    const inPlay = ['playzone', 'game'].some((id) => $('#' + id).classList.contains('active'));
    const now = Date.now();
    // hourly mode: count only time actually spent in the Play Zone
    if (hourlyMode() && inPlay && !document.hidden) {
      const h = hourKey();
      if (!state.playUsed || state.playUsed.h !== h) state.playUsed = { h, ms: 0 };
      state.playUsed.ms += Math.min(now - lastTick, 5000);
      save();
    }
    lastTick = now;
    const txt = state.playAlways ? '∞' : fmtLeft();
    $$('.play-clock').forEach((el) => (el.textContent = `⏱ ${txt}`));
    if (!inPlay) { clearInterval(playTimer); return; }
    if (!playOpen()) { clearInterval(playTimer); timeUp(); }
  };
  tick();
  playTimer = setInterval(tick, 1000);
}
function timeUp() {
  stopGame();
  $('#timeUp').hidden = false;
  $('#timeUp p').textContent = hourlyMode() ? `More play time at ${nextHourLabel()}. Let's learn some more!` : "Let's learn some more — then play again!";
  sfx.win();
  say("Time's up! Let's learn some more!");
}
$('#timeUpBtn').onclick = () => { $('#timeUp').hidden = true; renderHome(); show('home'); };

/* ---------- Play Zone screen ---------- */
const BALL_ICON = `<svg viewBox="0 0 64 64" class="ic3d"><defs><radialGradient id="bi" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#e7f5ff"/><stop offset=".35" stop-color="#4dabf7"/><stop offset="1" stop-color="#1864ab"/></radialGradient></defs>
  <path d="M10 62 L24 20 H40 L54 62 Z" fill="#ffd166"/><path d="M17.5 40 H46.5 M14 51 H50 M21 29 H43" stroke="#ff8fab" stroke-width="3"/><path d="M10 62 L24 20 M54 62 L40 20" stroke="#e8590c" stroke-width="2"/>
  <ellipse cx="32" cy="50" rx="11" ry="3.5" fill="#0003"/><circle cx="32" cy="36" r="13" fill="url(#bi)"/><path d="M22 31 a11 11 0 0 1 6 -6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
  <path d="M48 12 l2 4 4 .5 -3 2.8 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -2.8 4 -.5z" fill="#fcc419"/></svg>`;
const GAMES = [
  { id: 'ttt', title: 'Tic-Tac-Toe', icon: '⭕', color: '#ff6b6b', start: startTTT },
  { id: 'memory', title: 'Memory Match', icon: '🃏', color: '#4dabf7', start: startMemory },
  { id: 'pop', title: 'Pop the Balloons', icon: '🎈', color: '#f783ac', start: startPop },
  { id: 'color', title: 'Coloring Book', icon: '🖍️', color: '#ffa94d', start: startColorPicker },
  { id: 'c4', title: 'Connect Four', icon: '🔴', color: '#845ef7', start: startC4 },
  { id: 'sudoku', title: 'Sudoku', icon: '🔢', color: '#20c997', start: startSudokuMenu },
  { id: 'puzzle', title: 'Picture Puzzle', icon: '🧩', color: '#fab005', start: startPuzzleMenu },
  { id: 'ball', title: 'Rolling Ball 3D', icon: BALL_ICON, color: '#339af0', start: startBall },
  { id: 'pinball', title: '3D Pinball', icon: '🎯', color: '#7048e8', start: startPinball },
  { id: 'maze', title: 'Ball Maze', icon: '🟫', color: '#c0874f', start: startBallMaze },
  { id: 'whack', title: 'Whack-a-Mole', icon: '🐹', color: '#a9734a', start: startWhack, max: 5 },
  { id: 'draw', title: 'Draw & Copy', icon: '✏️', color: '#e8590c', start: startDraw },
  { id: 'moves', title: 'Silly Moves', icon: '🤸', color: '#12b886', start: startMoves },
];
// level per game; winning moves you up (needWins wins per level)
const GAME_MAX = { pinball: 5, draw: 4, ttt: 3, memory: 5, pop: 5, c4: 3, puzzle: 5, ball: 8, maze: 8, whack: 5 };
// Thinking games are educational: never require earned arcade time.
const BRAIN_GAME_IDS = new Set(['ttt', 'memory', 'c4', 'sudoku', 'puzzle', 'maze']);
const BRAIN_MIN_GRADE = { ttt: 'prek', memory: 'prek', puzzle: 'prek', sudoku: 'k', maze: 'k', c4: 'g1' };
const BRAIN_GRADE_ORDER = ['prek', 'k', 'g1', 'g2', 'g3'];
let brainMode = false;
function brainVisible(g) {
  return BRAIN_GAME_IDS.has(g.id) && (!!state.showAll || BRAIN_GRADE_ORDER.indexOf(state.grade || 'k') >= BRAIN_GRADE_ORDER.indexOf(BRAIN_MIN_GRADE[g.id]));
}
function openBrainGames() {
  brainMode = true;
  clearInterval(playTimer);
  renderPZ();
  $('#pzTitle').textContent = '🧠 Brain Games';
  $('#playzone .play-clock, #game .play-clock').forEach((x) => (x.hidden = true));
  document.body.style.setProperty('--theme', '#7950f2');
  show('playzone');
}
function GL(id) {
  if (id === 'maze' && state.gameLv && state.gameLv.maze == null && state.gameLv.ball > 1 && !state.ball3d) { state.gameLv.maze = state.gameLv.ball; state.gameLv.ball = 1; state.ball3d = true; }
  if (id === 'sudoku') return sdkLevel();
  if (id === 'color') return colorLevel();
  return (state.gameLv && state.gameLv[id]) || 1;
}
function gameLevelUp(id, needWins = 1) {
  state.gameLv = state.gameLv || {}; state.gameWins = state.gameWins || {};
  state.gameWins[id] = (state.gameWins[id] || 0) + 1;
  const lv = GL(id);
  let up = false;
  if (lv < (GAME_MAX[id] || 1) && state.gameWins[id] % needWins === 0) { state.gameLv[id] = lv + 1; up = true; }
  save(); renderPZ();
  return up;
}
const lvBadge = (id) => (GAME_MAX[id] || id === 'sudoku' ? `<span class="lv">Lv ${GL(id)}</span>` : '');
function renderPZ() {
  $('#pzGrid').innerHTML = GAMES.filter((g) => brainMode ? brainVisible(g) : !BRAIN_GAME_IDS.has(g.id)).map((g) =>
    `<button class="tile pz-tile" data-game="${g.id}" style="--c:${g.color}">${lvBadge(g.id)}<span class="ti">${g.icon}</span><span class="tt">${g.title}</span></button>`).join('');
}

$('#pzGrid').addEventListener('click', (e) => {
  const t = e.target.closest('[data-game]'); if (!t) return;
  sfx.tap(); openGame(t.dataset.game);
});
$('#pzHome').onclick = () => { sayToken++; stopClip(); renderHome(); show('home'); };
$('#gameBack').onclick = () => { stopGame(); renderPZ(); show('playzone'); if (!brainMode) startPlayTimer(); };

let curGame = null, gameCleanup = null, gameCleanupPanel = null;
function openGame(id) {
  stopGame();                      // never two games running at once
  const g = GAMES.find((x) => x.id === id);
  if (!g || (brainMode && !brainVisible(g))) return;
  curGame = g;
  document.body.style.setProperty('--theme', g.color);
  $('#gameTitle').innerHTML = `${g.icon === BALL_ICON ? '🔵' : g.icon} ${g.title}${GAME_MAX[id] || id === 'sudoku' ? ` <small class="g-lv">Lv ${GL(id)}</small>` : ''}`;
  $('#gameArea').innerHTML = '';
  $('#gameArea').className = 'game-area g-' + id;
  show('game');
  if (!brainMode) startPlayTimer();
  gameStart = brainMode ? 0 : Date.now();
  g.start();
}
function stopGame() { gameSession++; if (gameStart) { playActive += Date.now() - gameStart; gameStart = 0; } if (playActive) { logPlay(playActive / 1000); playActive = 0; } if (gameCleanup) { const c = gameCleanup; gameCleanup = null; c(); } }
let gameStart = 0, playActive = 0;   // play time for the grown-ups' numbers: only while the app is on screen
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameStart) { playActive += Date.now() - gameStart; gameStart = 0; }
  else if (!document.hidden && !brainMode && curGame && $('#game').classList.contains('active') && !gameStart) gameStart = Date.now();
});
// a timer that is dropped if the child has left the game (so no old "You win!" panel pops up later)
let gameSession = 0;
function later(fn, ms) { const s = gameSession; return setTimeout(() => { if (s === gameSession) fn(); }, ms); }

function gameWin(text = 'You win!') {
  sfx.win(); confetti(140, 0.35); later(() => confetti(90, 0.5), 500);
  say(text);
}
function endPanel(title, emoji, again, levelUp = false) {
  if (levelUp) title += `<div class="ep-up">⬆️ Level up! Now level ${GL(curGame.id)}</div>`;
  const d = document.createElement('div');
  d.className = 'end-panel';
  d.innerHTML = `<div class="ep-card"><div class="ep-emoji">${emoji}</div><div class="ep-title">${title}</div>
    <div class="ep-btns"><button class="big-btn" data-a="again">🔁 Again</button><button class="big-btn alt" data-a="menu">🎮 Games</button></div></div>`;
  d.querySelector('[data-a="again"]').onclick = () => { sfx.tap(); if (brainMode || playOpen()) { openGame(curGame.id); } else timeUp(); };
  d.querySelector('[data-a="menu"]').onclick = () => { sfx.tap(); $('#gameBack').onclick(); };
  $('#gameArea').appendChild(d);
  gameCleanupPanel = d;
}

/* ======================= TIC-TAC-TOE ======================= */
const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function startTTT() {
  const ME = '🦄', BOT = '🤖';
  const b = Array(9).fill(null);
  let busy = false, over = false;
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">You are ${ME} · Get three in a row!</div><div class="ttt-board">${b.map((_, i) => `<button class="ttt-cell" data-i="${i}"></button>`).join('')}</div>`;
  say('Get three in a row!');
  const cells = $$('.ttt-cell', area);
  const winner = () => { for (const l of LINES3) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return l; return null; };
  const put = (i, who) => { b[i] = who; cells[i].textContent = who; cells[i].classList.add('placed'); };
  function check() {
    const w = winner();
    if (w) {
      over = true; w.forEach((i) => cells[i].classList.add('win'));
      if (b[w[0]] === ME) { const up = gameLevelUp('ttt', 2); gameWin('You win!'); later(() => endPanel('You win!', '🏆', startTTT, up), 1300); }
      else { say('Good game! Try again!'); later(() => endPanel('Robot wins this time!', '🤖', startTTT), 1300); }
      return true;
    }
    if (b.every(Boolean)) { over = true; say("It's a tie!"); later(() => endPanel("It's a tie!", '🤝', startTTT), 900); return true; }
    return false;
  }
  function botMove() {
    const free = b.map((v, i) => (v ? null : i)).filter((v) => v != null);
    const findLine = (who) => { for (const l of LINES3) { const vals = l.map((i) => b[i]); if (vals.filter((v) => v === who).length === 2 && vals.includes(null)) return l[vals.indexOf(null)]; } return null; };
    // friendly robot: always takes a win, blocks most of the time, otherwise plays loosely
    const lv = GL('ttt');   // 1: playful robot · 2: blocks sometimes · 3: careful robot
    let m = Math.random() < [0.5, 0.9, 1][lv - 1] ? findLine(BOT) : null;
    if (m == null && Math.random() < [0.15, 0.6, 0.95][lv - 1]) m = findLine(ME);
    if (m == null && b[4] == null && Math.random() < [0.2, 0.5, 0.9][lv - 1]) m = 4;
    if (m == null && lv === 3) { const corners = [0, 2, 6, 8].filter((i) => !b[i]); if (corners.length) m = pick(corners); }
    if (m == null) m = free[Math.floor(Math.random() * free.length)];
    put(m, BOT); sfx.tap();
  }
  cells.forEach((c, i) => (c.onclick = () => {
    if (busy || over || b[i]) return;
    put(i, ME); sfx.tap();
    if (check()) return;
    busy = true;
    later(() => { botMove(); busy = false; check(); }, 550);
  }));
}

/* ======================= MEMORY MATCH ======================= */
const MEM_FACES = ['🐶', '🐱', '🦊', '🐸', '🐼', '🦁', '🐵', '🐰', '🐙', '🦋', '🍓', '🍩', '🚀', '🌈', '⭐', '🎈'];
function startMemory() {
  const pairs = [3, 4, 6, 8, 10][GL('memory') - 1];
  const faces = shuffle(MEM_FACES).slice(0, pairs);
  const deck = shuffle(faces.concat(faces));
  let open = [], found = 0, moves = 0, lock = false;
  const area = $('#gameArea');
  const cols = deck.length <= 6 ? 3 : deck.length === 20 ? 5 : 4;
  area.innerHTML = `<div class="g-msg">Find the matching pairs! <span class="mem-moves"></span></div>
    <div class="mem-board" style="grid-template-columns:repeat(${cols},1fr)">${deck.map((f, i) =>
      `<button class="mem-card" data-i="${i}"><span class="back">❓</span><span class="front">${f}</span></button>`).join('')}</div>`;
  say('Find the matching pairs!');
  const cards = $$('.mem-card', area);
  cards.forEach((c, i) => (c.onclick = () => {
    if (lock || c.classList.contains('flip') || c.classList.contains('done')) return;
    c.classList.add('flip'); sfx.tap(); open.push(i);
    if (open.length < 2) return;
    moves++; $('.mem-moves').textContent = `· ${moves} tries`;
    const [a, b] = open; open = [];
    if (deck[a] === deck[b]) {
      later(() => {
        cards[a].classList.add('done'); cards[b].classList.add('done'); sfx.yes(); found++;
        if (found === pairs) {
          const up = gameLevelUp('memory', 1);
          gameWin(pick(['Awesome job!', 'You did it!', 'Amazing!']));
          later(() => endPanel(`All pairs in ${moves} tries!`, '🧠', startMemory, up), 1300);
        }
      }, 350);
    } else {
      lock = true;
      later(() => { cards[a].classList.remove('flip'); cards[b].classList.remove('flip'); lock = false; }, 900);
    }
  }));
}

/* ======================= POP THE BALLOONS ======================= */
// Canvas game: one touch handler on the canvas, hit-test by position.
// Level 1 slow & big … level 5 fast & smaller. Reach the target to level up.
function fitCanvas(cv, minH = 360) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = cv.parentElement.clientWidth;
  const top = cv.getBoundingClientRect().top;
  const h = Math.max(minH, Math.min(innerHeight - top - 20, w * 1.6));
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, w, h };
}
function startPop() {
  const lv = GL('pop');
  const target = [8, 12, 15, 18, 22][lv - 1];
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Pop ${target} balloons! <b class="pop-score">0</b> 🎈 · <span class="pop-time">30</span>s <small class="pop-speed">Speed 🐢</small></div><div class="cv-wrap"><canvas class="game-cv pop-cv"></canvas></div>`;
  say('Pop the balloons!');
  const cv = $('.pop-cv', area);
  let { c, w, h } = fitCanvas(cv);
  const colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#cc5de8', '#ff922b', '#f783ac', '#20c997'];
  const balloons = [], bits = [];
  let score = 0, alive = true, raf = 0, last = 0, elapsed = 0, spawnIn = 0;
  function spawn() {
    const r = (lv <= 2 ? 40 : lv <= 4 ? 34 : 30) + Math.random() * 10;
    const star = Math.random() < 0.1;
    balloons.push({ x: r + Math.random() * (w - 2 * r), y: h + r, r, color: star ? '#fcc419' : pick(colors),
      vy: (55 + lv * 20) * (0.85 + Math.random() * 0.4) * Math.min(2.6, 1 + score * 0.06) + elapsed * 1.5, wob: Math.random() * 6, star });
  }
  function draw() {
    c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a5d8ff'); g.addColorStop(1, '#e7f5ff');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (const b of balloons) {
      const x = b.x + Math.sin(b.wob) * 8;
      c.strokeStyle = '#8889'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, b.y + b.r * 1.15); c.quadraticCurveTo(x - 6, b.y + b.r * 1.6, x + 2, b.y + b.r * 2.1); c.stroke();
      c.fillStyle = b.color; c.beginPath(); c.ellipse(x, b.y, b.r, b.r * 1.15, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x - 5, b.y + b.r * 1.15 + 5); c.lineTo(x + 5, b.y + b.r * 1.15 + 5); c.lineTo(x, b.y + b.r * 1.1); c.fill();
      c.fillStyle = '#ffffff88'; c.beginPath(); c.ellipse(x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.18, b.r * 0.3, -0.5, 0, Math.PI * 2); c.fill();
      if (b.star) { c.font = `${b.r}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⭐', x, b.y + 2); }
    }
    for (const p of bits) { c.globalAlpha = Math.max(0, p.life); c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, 4, 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }
  function frame(t) {
    if (!alive) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
    elapsed += dt;
    const left = Math.max(0, 30 - elapsed);
    $('.pop-time', area).textContent = Math.ceil(left);
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.22, (1.0 - lv * 0.1) - elapsed * 0.01 - score * 0.015); }
    for (const b of balloons) { b.y -= b.vy * dt; b.wob += dt * 2; }
    for (let k = balloons.length - 1; k >= 0; k--) if (balloons[k].y < -balloons[k].r * 3) balloons.splice(k, 1);
    for (const p of bits) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt * 2; }
    for (let k = bits.length - 1; k >= 0; k--) if (bits[k].life <= 0) bits.splice(k, 1);
    draw();
    if (left <= 0) return finish();
    raf = requestAnimationFrame(frame);
  }
  function hit(e) {
    e.preventDefault();
    if (!alive) return;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    for (let k = balloons.length - 1; k >= 0; k--) {
      const b = balloons[k], bx = b.x + Math.sin(b.wob) * 8;
      if (Math.hypot((x - bx) / 1.0, (y - b.y) / 1.15) < b.r * 1.25) {     // generous for little fingers
        balloons.splice(k, 1);
        score += b.star ? 3 : 1; $('.pop-score', area).textContent = score;
        $('.pop-speed', area).textContent = 'Speed ' + (score < 6 ? '🐢' : score < 12 ? '🐇' : score < 20 ? '🐆' : '🚀');
        for (let n = 0; n < 12; n++) { const a = Math.random() * 6.3; bits.push({ x: bx, y: b.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, life: 1, color: b.color }); }
        tone([b.star ? 1200 : 650 + Math.random() * 350, 280], { dur: 0.05, type: 'square', gap: 0.04, vol: 0.12 });
        return;
      }
    }
  }
  cv.addEventListener('pointerdown', hit);
  const onResize = () => { ({ c, w, h } = fitCanvas(cv)); };
  addEventListener('resize', onResize);
  function finish() {
    alive = false; cancelAnimationFrame(raf);
    state.popBest = Math.max(state.popBest || 0, score);
    const won = score >= target;
    const up = won ? gameLevelUp('pop', 1) : (save(), false);
    gameWin(won ? 'Amazing!' : 'Great job!');
    endPanel(`You popped ${score} balloons!${won ? '' : `<br><small>Pop ${target} to reach the next level</small>`}<br><small>Best: ${state.popBest}</small>`, '🎈', startPop, up);
  }
  raf = requestAnimationFrame(frame);
  gameCleanup = () => { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', onResize); };
}

/* ======================= WHACK-A-MOLE ======================= */
// Moles pop up; tap them before they hide. Faster each level; from level 3, don't tap the 🌸.
function startWhack() {
  const lv = GL('whack');
  const target = [8, 11, 14, 16, 18][lv - 1];
  const upMs = [1800, 1450, 1200, 1000, 850][lv - 1];
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Tap ${target} moles! <b class="wm-score">0</b> 🐹 · <span class="wm-time">30</span>s${lv >= 3 ? '<small>Don\'t tap the 🌸!</small>' : ''}</div>
    <div class="wm-field">${Array.from({ length: 9 }, (_, i) => `<button class="wm-hole" data-i="${i}"><span class="wm-pop"></span></button>`).join('')}</div>`;
  say('Tap the moles!');
  const holes = $$('.wm-hole', area);
  let score = 0, alive = true, t0 = Date.now(), tick = 0;
  const up = new Map();
  function popUp() {
    const free = holes.map((_, i) => i).filter((i) => !up.has(i));
    if (!free.length) return;
    const i = pick(free);
    const flower = lv >= 3 && Math.random() < 0.2;
    const el = holes[i].querySelector('.wm-pop');
    el.textContent = flower ? '🌸' : pick(['🐹', '🐹', '🐹', '🦔', '🐭']);
    holes[i].classList.add('up');
    const timer = later(() => { holes[i].classList.remove('up'); up.delete(i); }, upMs * (0.8 + Math.random() * 0.4));
    up.set(i, { timer, flower });
  }
  holes.forEach((h, i) => h.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const m = up.get(i); if (!m || !alive) return;
    clearTimeout(m.timer); up.delete(i);
    h.classList.remove('up'); h.classList.add(m.flower ? 'oops' : 'bonk');
    later(() => h.classList.remove('bonk', 'oops'), 300);
    if (m.flower) { score = Math.max(0, score - 1); sfx.no(); } else { score++; tone([520, 780], { dur: 0.05, gap: 0.05, vol: 0.12, type: 'square' }); }
    $('.wm-score', area).textContent = score;
  }));
  tick = setInterval(() => {
    const left = Math.max(0, 30 - Math.floor((Date.now() - t0) / 1000));
    $('.wm-time', area).textContent = left;
    if (left <= 0) return finish();
    if (Math.random() < 0.75) popUp();
    if (lv >= 4 && Math.random() < 0.35) popUp();
  }, Math.round(upMs * 0.55));
  function finish() {
    alive = false; clearInterval(tick); up.forEach((m) => clearTimeout(m.timer)); up.clear();
    holes.forEach((h) => h.classList.remove('up'));
    const won = score >= target;
    const lvUp = won ? gameLevelUp('whack', 1) : false;
    gameWin(won ? 'Awesome job!' : 'Great job!');
    endPanel(`You got ${score} moles!${won ? '' : `<br><small>Get ${target} to reach the next level</small>`}`, '🐹', startWhack, lvUp);
  }
  gameCleanup = () => { alive = false; clearInterval(tick); up.forEach((m) => clearTimeout(m.timer)); };
}

/* ======================= ROLLING BALL 3D (loads ball3d.js + three.js only when opened) ======================= */
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
async function startBall() {
  const area = $('#gameArea'), session = gameSession;
  const current = () => session === gameSession && curGame && curGame.id === 'ball' && $('#game').classList.contains('active');
  if (!webglOK()) return current() && startBallMaze();
  area.innerHTML = '<div class="g-msg">Getting the ball ready… 🔵</div>';
  try { const m = await import('./ball3d.js'); if (current()) m.start(); }
  catch (e) { console.warn(e); if (current()) startBallMaze(); }
}

async function startPinball() {
  const area = $('#gameArea'), session = gameSession;
  const current = () => session === gameSession && curGame && curGame.id === 'pinball' && $('#game').classList.contains('active');
  if (!webglOK()) { area.innerHTML = '<div class="g-msg">Pinball needs 3D graphics, which this device does not have.</div>'; return; }
  area.innerHTML = '<div class="g-msg">Setting up the table… 🎯</div>';
  try { const m = await import('./pinball3d.js'); if (current()) m.start(); }
  catch (e) { console.warn(e); if (current()) area.innerHTML = '<div class="g-msg">Oops, pinball could not start.</div>'; }
}

/* ======================= BALL MAZE (2D) ======================= */
// Steer the ball to the flag. Drag your finger (the ball rolls toward it) or tilt the phone.
// Board is 10 × 14 units. Walls are [x, y, w, h]; holes send you back to the start.
const MAZES = [
  { start: [5, 12], goal: [5, 2], walls: [], holes: [], stars: [[3, 7], [7, 7]] },
  { start: [5, 12], goal: [5, 2], walls: [[0, 6.8, 7, 0.6]], holes: [], stars: [[8.5, 7.1]] },
  { start: [1.6, 12.4], goal: [8.4, 1.6], walls: [[3, 4.4, 7, 0.6], [0, 9, 7, 0.6]], holes: [], stars: [[8.5, 11], [1.5, 6.7]] },
  { start: [1.6, 12.4], goal: [8.4, 1.6], walls: [[3, 4.4, 7, 0.6], [0, 9, 7, 0.6]], holes: [[5, 6.8], [4.5, 11.3]], stars: [[8.5, 7], [1.5, 2.5]] },
  { start: [1.5, 12.8], goal: [1.5, 1.4], walls: [[0, 3.4, 7.6, 0.6], [2.4, 6.9, 7.6, 0.6], [0, 10.4, 7.6, 0.6]], holes: [[8.6, 5.2], [1.2, 8.7], [5, 12.4]], stars: [[8.6, 12.5], [8.6, 1.5]] },
  { start: [1.2, 12.8], goal: [8.8, 1.3], walls: [[2.4, 0, 0.6, 10], [4.9, 4, 0.6, 10], [7.4, 0, 0.6, 10]], holes: [[3.7, 6], [6.2, 3], [1.2, 5]], stars: [[3.7, 1.5], [6.2, 12.5]] },
  { start: [1.2, 12.8], goal: [8.8, 1.3], walls: [[2.4, 0, 0.6, 10.4], [4.9, 3.6, 0.6, 10.4], [7.4, 0, 0.6, 10.4]], holes: [[3.7, 5], [3.7, 9], [6.2, 2.5], [6.2, 7], [8.8, 8]], stars: [[3.7, 12.6], [6.2, 1.3]] },
  { start: [1, 13], goal: [1, 1.3], walls: [[0, 2.6, 8, 0.6], [2, 5.2, 8, 0.6], [0, 7.8, 8, 0.6], [2, 10.4, 8, 0.6]],
    holes: [[5, 1.3], [5, 6.5], [3, 9.1], [6, 12.2], [9, 4]], stars: [[9, 9.1], [1, 6.5], [9, 1.3]] },
];
function startBallMaze() {
  const lv = GL('maze'), M = MAZES[lv - 1];
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Roll the ball to the flag! 🚩<small>Drag your finger — the ball follows. ${M.holes.length ? 'Watch out for holes!' : ''}</small></div>
    <div class="cv-wrap"><canvas class="game-cv ball-cv"></canvas></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="tilt">📱 Tilt to play</button></div>`;
  say(M.holes.length ? ['Roll the ball to the flag!', 'Watch out for holes!'] : 'Roll the ball to the flag!');
  const cv = $('.ball-cv', area);
  let { c, w, h } = fitCanvas(cv, 380);
  let u = Math.min(w / 10, h / 14);        // pixels per unit
  let ox = (w - u * 10) / 2, oy = (h - u * 14) / 2;
  const R = 0.42;                           // ball radius (units)
  const ball = { x: M.start[0], y: M.start[1], vx: 0, vy: 0, s: 1 };
  const stars = M.stars.map((p) => ({ x: p[0], y: p[1], got: false }));
  let finger = null, tilt = null, alive = true, raf = 0, last = 0, falling = 0, won = false;
  const toUnits = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / u, y: (e.clientY - r.top - oy) / u }; };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); finger = toUnits(e); });
  cv.addEventListener('pointermove', (e) => { if (finger) finger = toUnits(e); });
  const lift = () => (finger = null);
  cv.addEventListener('pointerup', lift); cv.addEventListener('pointercancel', lift);
  const onTilt = (e) => { tilt = { x: Math.max(-30, Math.min(30, e.gamma || 0)) / 30, y: Math.max(-30, Math.min(30, (e.beta || 0) - 20)) / 30 }; };
  area.querySelector('[data-a="tilt"]').onclick = async (ev) => {
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return;
      }
      addEventListener('deviceorientation', onTilt);
      ev.target.textContent = '📱 Tilting on!'; ev.target.disabled = true;
    } catch { }
  };
  const walls = M.walls.concat([[-1, -1, 12, 1], [-1, 14, 12, 1], [-1, -1, 1, 16], [10, -1, 1, 16]]);
  function collide() {
    for (const [x, y, ww, hh] of walls) {
      const cx = Math.max(x, Math.min(ball.x, x + ww)), cy = Math.max(y, Math.min(ball.y, y + hh));
      const dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
      if (d < R) {
        const nx = d ? dx / d : 0, ny = d ? dy / d : -1;
        ball.x = cx + nx * R; ball.y = cy + ny * R;
        const vn = ball.vx * nx + ball.vy * ny;
        if (vn < 0) { ball.vx -= 1.4 * vn * nx; ball.vy -= 1.4 * vn * ny; if (vn < -3) tone([180], { dur: 0.03, vol: 0.06 }); }
      }
    }
  }
  function step(dt) {
    if (won) return;
    if (falling) {
      ball.s -= dt * 2.5;
      if (ball.s <= 0) { falling = 0; ball.x = M.start[0]; ball.y = M.start[1]; ball.vx = ball.vy = 0; ball.s = 1; }
      return;
    }
    let ax = 0, ay = 0;
    if (finger) { ax = (finger.x - ball.x) * 9; ay = (finger.y - ball.y) * 9; }
    else if (tilt) { ax = tilt.x * 22; ay = tilt.y * 22; }
    const amax = 30, am = Math.hypot(ax, ay); if (am > amax) { ax *= amax / am; ay *= amax / am; }
    ball.vx = (ball.vx + ax * dt) * (1 - 2.2 * dt); ball.vy = (ball.vy + ay * dt) * (1 - 2.2 * dt);
    const vmax = 9, vm = Math.hypot(ball.vx, ball.vy); if (vm > vmax) { ball.vx *= vmax / vm; ball.vy *= vmax / vm; }
    // small sub-steps so the ball never slips through a thin wall
    const n = Math.ceil(vm * dt / 0.15) || 1;
    for (let k = 0; k < n; k++) { ball.x += ball.vx * dt / n; ball.y += ball.vy * dt / n; collide(); }
    for (const s of stars) if (!s.got && Math.hypot(s.x - ball.x, s.y - ball.y) < 0.75) { s.got = true; tone([880, 1320], { dur: 0.06, gap: 0.06, vol: 0.1 }); }
    for (const [hx, hy] of M.holes) if (Math.hypot(hx - ball.x, hy - ball.y) < 0.45) { falling = 1; sfx.no(); say('Oops! Try again.'); }
    if (Math.hypot(M.goal[0] - ball.x, M.goal[1] - ball.y) < 0.6) win();
  }
  function draw() {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#f3d9b1'; c.fillRect(ox, oy, u * 10, u * 14);
    c.strokeStyle = '#e0bd8a'; c.lineWidth = 1;
    for (let k = 1; k < 14; k++) { c.beginPath(); c.moveTo(ox, oy + k * u); c.lineTo(ox + u * 10, oy + k * u); c.stroke(); }
    c.fillStyle = '#8d5a2b';
    for (const [x, y, ww, hh] of M.walls) { c.beginPath(); c.roundRect ? c.roundRect(ox + x * u, oy + y * u, ww * u, hh * u, 4) : c.rect(ox + x * u, oy + y * u, ww * u, hh * u); c.fill(); }
    for (const [hx, hy] of M.holes) { c.fillStyle = '#2b2140'; c.beginPath(); c.arc(ox + hx * u, oy + hy * u, u * 0.5, 0, 7); c.fill(); c.strokeStyle = '#5c4033'; c.lineWidth = 3; c.stroke(); }
    // goal
    const gx = ox + M.goal[0] * u, gy = oy + M.goal[1] * u;
    c.fillStyle = '#69db7c'; c.beginPath(); c.arc(gx, gy, u * 0.62, 0, 7); c.fill();
    c.strokeStyle = '#2f9e44'; c.lineWidth = 3; c.stroke();
    c.font = `${u * 0.9}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🚩', gx + u * 0.15, gy - u * 0.15);
    for (const s of stars) if (!s.got) c.fillText('⭐', ox + s.x * u, oy + s.y * u);
    if (finger) { c.fillStyle = '#ffffff66'; c.beginPath(); c.arc(ox + finger.x * u, oy + finger.y * u, u * 0.45, 0, 7); c.fill(); }
    // ball
    const bx = ox + ball.x * u, by = oy + ball.y * u, br = R * u * ball.s;
    if (br > 0) {
      const g = c.createRadialGradient(bx - br * 0.35, by - br * 0.35, br * 0.1, bx, by, br);
      g.addColorStop(0, '#d0ebff'); g.addColorStop(0.4, '#4dabf7'); g.addColorStop(1, '#1864ab');
      c.fillStyle = '#0003'; c.beginPath(); c.ellipse(bx + 3, by + 4, br, br * 0.9, 0, 0, 7); c.fill();
      c.fillStyle = g; c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill();
    }
  }
  function frame(t) {
    if (!alive) return;
    const dt = last ? Math.min(0.033, (t - last) / 1000) : 0; last = t;
    step(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  function win() {
    won = true;
    const got = stars.filter((s) => s.got).length;
    const up = gameLevelUp('maze', 1);
    gameWin(pick(['You did it!', 'Awesome job!', 'Fantastic!']));
    later(() => { alive = false; endPanel(`You reached the flag!<br><small>⭐ ${got} of ${stars.length} stars</small>`, '🟫', startBallMaze, up); }, 900);
  }
  const onResize = () => { ({ c, w, h } = fitCanvas(cv, 380)); u = Math.min(w / 10, h / 14); ox = (w - u * 10) / 2; oy = (h - u * 14) / 2; };
  addEventListener('resize', onResize);
  raf = requestAnimationFrame(frame);
  gameCleanup = () => { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', onResize); removeEventListener('deviceorientation', onTilt); };
}

/* ======================= CONNECT FOUR ======================= */
function startC4() {
  const R6 = 6, C7 = 7, ME = 1, BOT = 2;
  const g = Array.from({ length: R6 }, () => Array(C7).fill(0));
  let busy = false, over = false;
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">You are 🔴 · Get four in a row!</div><div class="c4-board">${
    Array.from({ length: R6 * C7 }, (_, k) => `<div class="c4-cell" data-r="${Math.floor(k / C7)}" data-c="${k % C7}"><i></i></div>`).join('')}</div>`;
  say('Get four in a row!');
  const cell = (r, c) => $(`.c4-cell[data-r="${r}"][data-c="${c}"]`, area);
  const dropRow = (c) => { for (let r = R6 - 1; r >= 0; r--) if (!g[r][c]) return r; return -1; };
  const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
  function lineAt(r, c, who) {
    for (const [dr, dc] of DIRS) {
      const pts = [[r, c]];
      for (const s of [1, -1]) { let rr = r + dr * s, cc = c + dc * s; while (rr >= 0 && rr < R6 && cc >= 0 && cc < C7 && g[rr][cc] === who) { pts.push([rr, cc]); rr += dr * s; cc += dc * s; } }
      if (pts.length >= 4) return pts;
    }
    return null;
  }
  function place(c, who) {
    const r = dropRow(c); if (r < 0) return null;
    g[r][c] = who;
    const el = cell(r, c);
    el.classList.add(who === ME ? 'me' : 'bot', 'drop');
    el.style.setProperty('--fall', `${-(r + 1) * 100}%`);
    tone([who === ME ? 520 : 380], { dur: 0.06, vol: 0.1 });
    return r;
  }
  function after(r, c, who) {
    const line = lineAt(r, c, who);
    if (line) {
      over = true; line.forEach(([rr, cc]) => cell(rr, cc).classList.add('win'));
      if (who === ME) { const up = gameLevelUp('c4', 2); gameWin('You win!'); later(() => endPanel('Four in a row! You win!', '🏆', startC4, up), 1400); }
      else { say('Good game! Try again!'); later(() => endPanel('Robot got four this time!', '🤖', startC4), 1400); }
      return true;
    }
    if (g[0].every(Boolean)) { over = true; say("It's a tie!"); later(() => endPanel("It's a tie!", '🤝', startC4), 800); return true; }
    return false;
  }
  function botCol() {
    const cols = [...Array(C7).keys()].filter((c) => dropRow(c) >= 0);
    const tryWin = (who) => cols.find((c) => { const r = dropRow(c); g[r][c] = who; const w = lineAt(r, c, who); g[r][c] = 0; return w; });
    const lv = GL('c4');   // 1: playful robot · 2: blocks often · 3: careful robot
    let c = Math.random() < [0.6, 0.95, 1][lv - 1] ? tryWin(BOT) : null;
    if (c == null && Math.random() < [0.35, 0.75, 0.95][lv - 1]) c = tryWin(ME);
    if (c == null) {
      // avoid giving the child an easy setup only half the time; prefer the middle
      const weights = cols.map((cc) => 4 - Math.abs(3 - cc) + Math.random() * 3);
      c = cols[weights.indexOf(Math.max(...weights))];
    }
    return c;
  }
  area.querySelector('.c4-board').addEventListener('click', (e) => {
    const t = e.target.closest('.c4-cell'); if (!t || busy || over) return;
    const c = +t.dataset.c; const r = place(c, ME); if (r == null) return;
    if (after(r, c, ME)) return;
    busy = true;
    later(() => { const bc = botCol(); const br = place(bc, BOT); busy = false; after(br, bc, BOT); }, 650);
  });
}

/* ======================= COLORING BOOK ======================= */
// Pictures are SVG regions (class "r") that can be filled; lines (class "ln") sit on top.
const st = (cx, cy, R, r, n = 5, rot = -90) => Array.from({ length: n * 2 }, (_, i) => {
  const a = ((rot + (180 / n) * i) * Math.PI) / 180, rr = i % 2 ? r : R;
  return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
}).join(' ');
const band = (cx, cy, r1, r2) => `M${cx - r1} ${cy}A${r1} ${r1} 0 0 1 ${cx + r1} ${cy}L${cx + r2} ${cy}A${r2} ${r2} 0 0 0 ${cx - r2} ${cy}Z`;
const cloud = (x, y, s = 1) => `M${x} ${y}c${-18 * s} 0 ${-18 * s} ${-22 * s} 0 ${-22 * s}c${2 * s} ${-14 * s} ${24 * s} ${-16 * s} ${30 * s} ${-4 * s}c${10 * s} ${-12 * s} ${32 * s} ${-4 * s} ${28 * s} ${10 * s}c${14 * s} ${2 * s} ${12 * s} ${18 * s} ${-2 * s} ${16 * s}Z`;

const PICS = [
  // ---- level 1: a few big shapes ----
  { id: 'sun', name: 'Sunny Sun', level: 1, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <polygon class="r" points="${st(100, 100, 92, 58, 12)}"/>
    <circle class="r" cx="100" cy="100" r="50"/>
    <g class="ln"><circle cx="82" cy="92" r="5" fill="#2b2140"/><circle cx="118" cy="92" r="5" fill="#2b2140"/><path d="M78 112q22 22 44 0" fill="none"/></g>` },
  { id: 'balloon', name: 'Balloon', level: 1, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <ellipse class="r" cx="100" cy="82" rx="58" ry="68"/>
    <polygon class="r" points="92,150 108,150 100,160"/>
    <g class="ln"><path d="M100 160q-12 18 4 34" fill="none"/></g>` },
  { id: 'house1', name: 'Little House', level: 1, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <rect class="r" x="0" y="160" width="200" height="40"/>
    <rect class="r" x="48" y="92" width="104" height="68"/>
    <polygon class="r" points="36,96 100,36 164,96"/>
    <rect class="r" x="86" y="118" width="28" height="42"/>` },
  { id: 'apple', name: 'Apple', level: 1, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <path class="r" d="M100 62c-30-22-72-6-72 42c0 48 34 80 54 80c8 0 12-4 18-4s10 4 18 4c20 0 54-32 54-80c0-48-42-64-72-42z"/>
    <path class="r" d="M104 58c4-20 22-34 44-32c-4 20-22 32-44 32z"/>
    <rect class="r" x="96" y="34" width="8" height="28" rx="3"/>` },
  // ---- level 2: more parts ----
  { id: 'fish', name: 'Happy Fish', level: 2, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <path class="r" d="M0 178q30-10 60 0t60 0t80 0V200H0z"/>
    <path class="r" d="M30 180c-8-30 10-50 0-80c16 24 8 52 14 80z"/>
    <path class="r" d="M170 182c6-26-10-42 0-66c-14 20-6 44-12 66z"/>
    <polygon class="r" points="140,92 186,62 178,92 186,122"/>
    <path class="r" d="M70 60q30-30 60 6z"/>
    <ellipse class="r" cx="92" cy="92" rx="56" ry="36"/>
    <path class="r" d="M90 100q14 20 28 4q-12-4-28-4z"/>
    <circle class="r" cx="62" cy="84" r="10"/>
    <circle class="r" cx="40" cy="40" r="8"/><circle class="r" cx="54" cy="22" r="5"/><circle class="r" cx="30" cy="16" r="4"/>
    <g class="ln"><circle cx="63" cy="85" r="4" fill="#2b2140"/><path d="M44 102q8 4 14 0" fill="none"/></g>` },
  { id: 'house2', name: 'Sunny House', level: 2, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <circle class="r" cx="168" cy="30" r="18"/>
    <path class="r" d="${cloud(40, 44, 0.9)}"/>
    <rect class="r" x="0" y="158" width="200" height="42"/>
    <polygon class="r" points="88,200 112,200 108,160 92,160"/>
    <rect class="r" x="120" y="44" width="16" height="34"/>
    <rect class="r" x="40" y="92" width="120" height="68"/>
    <polygon class="r" points="28,96 100,40 172,96"/>
    <rect class="r" x="88" y="118" width="24" height="42"/>
    <rect class="r" x="52" y="106" width="26" height="22"/>
    <rect class="r" x="122" y="106" width="26" height="22"/>
    <g class="ln"><path d="M65 106v22M52 117h26M135 106v22M122 117h26" fill="none"/><circle cx="107" cy="140" r="2" fill="#2b2140"/></g>` },
  { id: 'flower', name: 'Flower Pot', level: 2, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <rect class="r" x="96" y="88" width="8" height="74"/>
    <path class="r" d="M100 140c-24-4-40-20-44-36c22 0 40 14 44 36z"/>
    <path class="r" d="M100 128c24-4 40-20 44-36c-22 0-40 14-44 36z"/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse class="r" cx="${100 + 30 * Math.cos(a * Math.PI / 180)}" cy="${62 + 30 * Math.sin(a * Math.PI / 180)}" rx="20" ry="14" transform="rotate(${a} ${100 + 30 * Math.cos(a * Math.PI / 180)} ${62 + 30 * Math.sin(a * Math.PI / 180)})"/>`).join('')}
    <circle class="r" cx="100" cy="62" r="18"/>
    <polygon class="r" points="64,162 136,162 128,196 72,196"/>
    <rect class="r" x="58" y="154" width="84" height="14" rx="4"/>` },
  { id: 'car', name: 'Car', level: 2, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <path class="r" d="${cloud(150, 50, 0.8)}"/>
    <rect class="r" x="0" y="150" width="200" height="50"/>
    <path class="r" d="M58 104l20-34h56l26 34z"/>
    <path class="r" d="M20 104h168q8 0 8 10v22q0 8-8 8H20q-8 0-8-8v-22q0-10 8-10z"/>
    <path class="r" d="M84 76h22v26H68z"/>
    <path class="r" d="M114 76h18l20 26h-38z"/>
    <circle class="r" cx="56" cy="146" r="20"/><circle class="r" cx="152" cy="146" r="20"/>
    <circle class="r" cx="56" cy="146" r="8"/><circle class="r" cx="152" cy="146" r="8"/>
    <rect class="r" x="180" y="112" width="12" height="10" rx="3"/>
    <g class="ln"><path d="M20 176h30M84 176h30M150 176h30" fill="none"/></g>` },
  // ---- level 3: lots of little parts ----
  { id: 'rocket', name: 'Space Rocket', level: 3, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <circle class="r" cx="156" cy="150" r="30"/>
    <path class="r" d="M114 150a42 12 0 0 0 84 0a42 12 0 0 0-84 0zm8 0a34 7 0 0 1 68 0a34 7 0 0 1-68 0z" fill-rule="evenodd"/>
    <path class="r" d="M40 30a18 18 0 1 0 18 24a14 14 0 1 1-18-24z"/>
    ${[[20, 120], [70, 180], [170, 30], [140, 80], [30, 70]].map(([x, y]) => `<polygon class="r" points="${st(x, y, 9, 4)}"/>`).join('')}
    <path class="r" d="M80 150l-18 26l22-6z"/>
    <path class="r" d="M120 150l18 26l-22-6z"/>
    <path class="r" d="M84 168q16 40 32 0z"/>
    <path class="r" d="M92 168q8 22 16 0z"/>
    <path class="r" d="M80 70q20-52 40 0v86q0 12-20 12t-20-12z"/>
    <path class="r" d="M80 70q20-52 40 0z"/>
    <circle class="r" cx="100" cy="98" r="14"/>
    <circle class="r" cx="100" cy="98" r="8"/>
    <rect class="r" x="86" y="128" width="28" height="8" rx="3"/>` },
  { id: 'butterfly', name: 'Butterfly', level: 3, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <rect class="r" x="0" y="168" width="200" height="32"/>
    <circle class="r" cx="30" cy="156" r="10"/><circle class="r" cx="30" cy="156" r="4"/>
    <circle class="r" cx="172" cy="152" r="12"/><circle class="r" cx="172" cy="152" r="5"/>
    <path class="r" d="M96 80C70 30 20 30 24 70c4 30 40 34 72 22z"/>
    <path class="r" d="M104 80C130 30 180 30 176 70c-4 30-40 34-72 22z"/>
    <path class="r" d="M96 100c-30 0-56 20-46 42c10 18 36 6 46-26z"/>
    <path class="r" d="M104 100c30 0 56 20 46 42c-10 18-36 6-46-26z"/>
    <circle class="r" cx="58" cy="64" r="12"/><circle class="r" cx="142" cy="64" r="12"/>
    <circle class="r" cx="70" cy="124" r="8"/><circle class="r" cx="130" cy="124" r="8"/>
    <ellipse class="r" cx="100" cy="104" rx="7" ry="36"/>
    <circle class="r" cx="100" cy="64" r="9"/>
    <g class="ln"><path d="M96 58q-10-22-22-26M104 58q10-22 22-26" fill="none"/><circle cx="74" cy="32" r="3" fill="#2b2140"/><circle cx="126" cy="32" r="3" fill="#2b2140"/></g>` },
  { id: 'rainbow', name: 'Rainbow Land', level: 3, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <circle class="r" cx="170" cy="28" r="16"/>
    ${[96, 86, 76, 66, 56, 46].map((r) => `<path class="r" d="${band(100, 130, r, r - 10)}"/>`).join('')}
    <path class="r" d="${cloud(22, 132, 0.8)}"/>
    <path class="r" d="${cloud(160, 132, 0.8)}"/>
    <path class="r" d="M0 150q60-34 120 0V200H0z"/>
    <path class="r" d="M80 160q60-36 120-6V200H80z"/>
    <rect class="r" x="150" y="128" width="10" height="34"/>
    <circle class="r" cx="155" cy="114" r="22"/>
    <circle class="r" cx="146" cy="108" r="4"/><circle class="r" cx="162" cy="104" r="4"/><circle class="r" cx="158" cy="122" r="4"/>` },
  { id: 'cat', name: 'Cat & Yarn', level: 3, svg: () => `
    <rect class="r" x="0" y="0" width="200" height="200"/>
    <rect class="r" x="0" y="150" width="200" height="50"/>
    <ellipse class="r" cx="100" cy="176" rx="84" ry="16"/>
    <path class="r" d="M136 160q40-4 36-44q-2-14 10-14q10 2 4 18q-6 46-50 48z"/>
    <ellipse class="r" cx="100" cy="140" rx="42" ry="32"/>
    <polygon class="r" points="62,62 70,24 92,48"/><polygon class="r" points="138,62 130,24 108,48"/>
    <polygon class="r" points="68,54 72,34 84,48"/><polygon class="r" points="132,54 128,34 116,48"/>
    <circle class="r" cx="100" cy="76" r="38"/>
    <ellipse class="r" cx="86" cy="72" rx="7" ry="9"/><ellipse class="r" cx="114" cy="72" rx="7" ry="9"/>
    <polygon class="r" points="94,88 106,88 100,95"/>
    <circle class="r" cx="40" cy="160" r="16"/>
    <g class="ln"><circle cx="86" cy="73" r="3" fill="#2b2140"/><circle cx="114" cy="73" r="3" fill="#2b2140"/>
      <path d="M100 95q-6 8-12 4M100 95q6 8 12 4M70 92h-22M70 98l-20 6M130 92h22M130 98l20 6M28 152q12 4 24 16M30 166q10-12 22-14M56 160q12 0 14-14" fill="none"/></g>` },
];
const PALETTE_C = ['#ff6b6b', '#ff922b', '#ffd43b', '#94d82d', '#40c057', '#20c997', '#4dabf7', '#4c6ef5', '#9775fa', '#f783ac', '#ffc9de', '#a0522d', '#868e96', '#2b2140', '#ffffff'];

// ---- generated mandalas & patterns: the "expert" pages (20 – 70 parts)
function mandalaSVG(rings, petals, seed) {
  let out = '<rect class="r" x="0" y="0" width="200" height="200"/>';
  const cx = 100, cy = 100;
  for (let i = rings; i >= 1; i--) {
    const R = 12 + i * (84 / rings), r0 = 12 + (i - 1) * (84 / rings);
    const n = petals + (i % 2 ? 0 : seed % 3 ? petals : 0);
    const off = i % 2 ? 0 : 180 / n;
    if ((i + seed) % 3 === 0) {          // ring of round beads
      out += `<circle class="r" cx="${cx}" cy="${cy}" r="${R}"/>`;
      for (let k = 0; k < n; k++) { const a = ((360 / n) * k + off) * Math.PI / 180, m = (R + r0) / 2; out += `<circle class="r" cx="${(cx + m * Math.cos(a)).toFixed(1)}" cy="${(cy + m * Math.sin(a)).toFixed(1)}" r="${((R - r0) * 0.38).toFixed(1)}"/>`; }
    } else {                              // ring of pointed petals
      for (let k = 0; k < n; k++) {
        const a = ((360 / n) * k + off) * Math.PI / 180, w = Math.PI / n * (seed % 2 ? 0.95 : 0.8);
        const p = (ang, rad) => `${(cx + rad * Math.cos(ang)).toFixed(1)} ${(cy + rad * Math.sin(ang)).toFixed(1)}`;
        out += `<path class="r" d="M${p(a - w, r0)} Q${p(a - w, R)} ${p(a, R)} Q${p(a + w, R)} ${p(a + w, r0)} Z"/>`;
      }
    }
  }
  out += `<circle class="r" cx="${cx}" cy="${cy}" r="12"/><circle class="r" cx="${cx}" cy="${cy}" r="5"/>`;
  return out;
}
function scalesSVG(rows) {               // fish-scale pattern
  let out = '<rect class="r" x="0" y="0" width="200" height="200"/>';
  const s = 200 / rows;
  for (let r = rows; r >= -1; r--) for (let c = -1; c <= rows; c++) {
    const x = c * s + (r % 2 ? s / 2 : 0), y = r * s * 0.75;
    out += `<path class="r" d="M${x.toFixed(1)} ${y.toFixed(1)}a${(s / 2).toFixed(1)} ${(s / 2).toFixed(1)} 0 0 0 ${s.toFixed(1)} 0z"/>`;
  }
  return out;
}
const GEN_PAGES = [
  { id: 'mand1', name: 'Flower Mandala', svg: () => mandalaSVG(3, 6, 1) },
  { id: 'mand2', name: 'Sun Mandala', svg: () => mandalaSVG(4, 8, 2) },
  { id: 'scale1', name: 'Fish Scales', svg: () => scalesSVG(6) },
  { id: 'mand3', name: 'Star Mandala', svg: () => mandalaSVG(5, 8, 3) },
  { id: 'mand4', name: 'Snowflake Mandala', svg: () => mandalaSVG(5, 12, 4) },
  { id: 'scale2', name: 'Dragon Scales', svg: () => scalesSVG(8) },
  { id: 'mand5', name: 'Magic Mandala', svg: () => mandalaSVG(6, 10, 5) },
  { id: 'mand6', name: 'Royal Mandala', svg: () => mandalaSVG(7, 12, 7) },
];
// every coloring page in one list, simplest first (no locks — she can pick any)
const countParts = (svg) => (svg.match(/class="r"/g) || []).length;
const ALL_PICS = [
  ...PICS.map((p) => ({ ...p, vb: 200 })),
  ...OM_PAGES.map((p) => ({ id: p.id, name: p.name, vb: 72, om: true, orig: p.o,
    svg: () => `<rect class="r bg" x="-4" y="-4" width="80" height="80"/>${p.c}<g class="oml">${p.l}</g>` })),
  ...GEN_PAGES.map((p) => ({ ...p, vb: 200 })),
  ...SCENE_PAGES.map((p) => ({ ...p, vb: 200, scene: true })),
].map((p) => ({ ...p, n: countParts(p.svg()) })).sort((a, b) => a.n - b.n);
const COLOR_GROUPS = [['⭐ Easy', 0, 5], ['⭐⭐ Medium', 6, 10], ['⭐⭐⭐ Tricky', 11, 19], ['🏆 Expert', 20, 999]];
const colorLevel = () => 1;

function picSVG(p, fills = {}, cls = '') {
  let k = 0;
  const body = p.svg().replace(/class="r( bg)?"/g, (m, bg) => `class="r${bg || ''}" data-k="${k}" style="fill:${fills[k++] || '#fff'}"`);
  return `<svg viewBox="0 0 ${p.vb} ${p.vb}" class="pic ${p.om ? 'om' : ''} ${cls}">${body}</svg>`;
}

function startColorPicker() {
  const done = state.colored || [];
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Pick a picture to color! <small>${ALL_PICS.length} pictures · ⭐ = colored</small></div>` +
    [['🌟 Scenes, Seasons & Cartoons', -1, -1], ...COLOR_GROUPS].map(([label, lo, hi]) => {
      const list = lo < 0 ? ALL_PICS.filter((p) => p.scene) : ALL_PICS.filter((p) => !p.scene && p.n >= lo && p.n <= hi);
      return list.length ? `<div class="pic-group">${label}</div><div class="pic-grid">${list.map((p) =>
        `<button class="pic-pick" data-p="${p.id}">${picSVG(p, (state.art || {})[p.id])}<span>${done.includes(p.id) ? '⭐ ' : ''}${p.name}</span></button>`).join('')}</div>` : '';
    }).join('');
  say('Pick a picture to color!');
  $$('.pic-pick', area).forEach((b) => (b.onclick = () => { sfx.tap(); startColoring(ALL_PICS.find((p) => p.id === b.dataset.p)); }));
}

// pinch (two fingers) to zoom, drag with one finger when zoomed in; taps still go through
function zoomable(view, inner) {
  let s = 1, x = 0, y = 0, last = 0;
  const pts = new Map(); let start = null;
  const apply = () => {
    const w = view.clientWidth, h = view.clientHeight;
    x = Math.min(0, Math.max(w - w * s, x)); y = Math.min(0, Math.max(h - h * s, y));
    inner.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    view.classList.toggle('zoomed', s > 1.01);
  };
  const zoomAt = (ns, cx, cy) => { ns = Math.min(4, Math.max(1, ns)); x = cx - (cx - x) * ns / s; y = cy - (cy - y) * ns / s; s = ns; apply(); };
  const local = (e) => { const r = view.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  view.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, local(e));
    if (pts.size === 2) { const [a, b] = [...pts.values()]; start = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, x, y }; }
    else if (pts.size === 1) start = { px: local(e), x, y, moved: 0 };
  });
  view.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, local(e));
    if (pts.size >= 2 && start.d) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const ns = Math.min(4, Math.max(1, start.s * d / start.d));
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      x = mx - (start.mx - start.x) * ns / start.s; y = my - (start.my - start.y) * ns / start.s; s = ns; apply(); last = Date.now();
    } else if (pts.size === 1 && start.px && s > 1.01) {
      const p = local(e), dx = p[0] - start.px[0], dy = p[1] - start.px[1];
      if (Math.hypot(dx, dy) > 8) { x = start.x + dx; y = start.y + dy; apply(); last = Date.now(); }
    }
  });
  const up = (e) => { pts.delete(e.pointerId); if (pts.size === 1) { const p = [...pts.values()][0]; start = { px: p, x, y }; } else if (!pts.size) start = null; };
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  view.addEventListener('wheel', (e) => { e.preventDefault(); const [cx, cy] = local(e); zoomAt(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), cx, cy); }, { passive: false });
  return { by: (k) => zoomAt(s * k, view.clientWidth / 2, view.clientHeight / 2), busy: () => Date.now() - last < 250 || pts.size > 1 };
}
function startColoring(p) {
  state.art = state.art || {};
  const fills = state.art[p.id] = state.art[p.id] || {};
  let cur = PALETTE_C[0];
  const area = $('#gameArea');
  area.innerHTML = `<div class="color-stage"><div class="color-wrap cz-view"><div class="cz-inner">${picSVG(p, fills, 'big')}</div>
      <div class="cz-btns"><button data-z="in" aria-label="Zoom in">＋</button><button data-z="out" aria-label="Zoom out">－</button></div></div>
    <div class="palette">${PALETTE_C.map((c, i) => `<button class="sw-c ${i === 0 ? 'on' : ''}" data-c="${c}" style="--sw:${c}" aria-label="color">${c === '#ffffff' ? '🧽' : ''}</button>`).join('')}</div></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="pics">🖼️ Pictures</button>${p.orig ? '<button class="big-btn alt small" data-a="peek">👀 Peek</button>' : ''}<button class="big-btn small" data-a="done">✅ I'm done!</button></div>`;
  say('Pick a color, then tap the picture.');
  $$('.sw-c', area).forEach((b) => (b.onclick = () => {
    $$('.sw-c', area).forEach((x) => x.classList.remove('on')); b.classList.add('on'); cur = b.dataset.c; sfx.tap();
  }));
  const zoom = zoomable($('.cz-view', area), $('.cz-inner', area));
  $$('[data-z]', area).forEach((b) => (b.onclick = () => { sfx.tap(); zoom.by(b.dataset.z === 'in' ? 1.5 : 1 / 1.5); }));
  $$('.color-wrap .r', area).forEach((r) => (r.onclick = () => {
    if (zoom.busy()) return;          // that was a pinch or a drag, not a tap
    r.style.fill = cur; fills[r.dataset.k] = cur; save();
    r.classList.remove('splash'); void r.getBoundingClientRect(); r.classList.add('splash');
    tone([500 + Math.random() * 400], { dur: 0.05, vol: 0.08 });
  }));
  const peek = area.querySelector('[data-a="peek"]');
  if (peek) peek.onclick = () => {          // show the original colors for 2 seconds
    sfx.tap();
    const regs = $$('.color-wrap .r:not(.bg)', area);
    regs.forEach((r, i) => { r.dataset.was = r.style.fill; r.style.fill = p.orig[i] || '#fff'; });
    later(() => regs.forEach((r) => (r.style.fill = r.dataset.was)), 2000);
  };
  area.querySelector('[data-a="pics"]').onclick = () => { sfx.tap(); startColorPicker(); };
  area.querySelector('[data-a="done"]').onclick = () => {
    state.colored = state.colored || [];
    if (!state.colored.includes(p.id)) state.colored.push(p.id);
    save();
    gameWin('Beautiful picture!');
    endPanel('Beautiful picture!', '🎨', startColorPicker);
  };
}


/* ======================= SUDOKU ======================= */
// Levels: 1 4×4 few blanks · 2 4×4 · 3 4×4 many blanks · 4 6×6 · 5 6×6 many blanks
const SDK_PICS4 = [['🍎', '🍌', '🍇', '🍓'], ['🐶', '🐱', '🐸', '🐵'], ['🚗', '🚀', '⛵', '🚲'], ['⭐', '🌙', '☀️', '🌈']];
const SDK_PICS6 = [['🍎', '🍌', '🍇', '🍓', '🍊', '🥝'], ['🐶', '🐱', '🐸', '🐵', '🐼', '🦊']];
const distinct = (w) => new Set(w).size === w.length;
const SDK_WORDS4 = W4.map((x) => x[0]).filter((w) => /^[a-z]{4}$/.test(w) && distinct(w));
const SDK_WORDS6 = SPELLL.filter((w) => w.length === 6 && distinct(w));
const sdkLevel = () => state.sdkLevel || ({ prek: 1, k: 1, g1: 2, g2: 3, g3: 4 }[state.grade] || 1);

function sdkSolution(n) {
  // valid base grid, then shuffle rows/cols inside bands and stacks
  const br = 2, bc = n / 2;                       // box = 2 rows × (n/2) cols
  let g = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (bc * (r % br) + Math.floor(r / br) + c) % n));
  const perm = shuffle([...Array(n).keys()]);
  g = g.map((row) => row.map((v) => perm[v]));
  const bands = shuffle([...Array(n / br).keys()]);
  const rows = bands.flatMap((b) => shuffle([...Array(br).keys()]).map((k) => b * br + k));
  const stacks = shuffle([...Array(n / bc).keys()]);
  const cols = stacks.flatMap((s) => shuffle([...Array(bc).keys()]).map((k) => s * bc + k));
  return rows.map((r) => cols.map((c) => g[r][c]));
}
function sdkCount(grid, n, limit = 2) {
  const br = 2, bc = n / 2;
  let count = 0;
  const ok = (r, c, v) => {
    for (let i = 0; i < n; i++) if (grid[r][i] === v || grid[i][c] === v) return false;
    const r0 = r - (r % br), c0 = c - (c % bc);
    for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) if (grid[r0 + i][c0 + j] === v) return false;
    return true;
  };
  (function solve() {
    if (count >= limit) return;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] == null) {
      for (let v = 0; v < n; v++) if (ok(r, c, v)) { grid[r][c] = v; solve(); grid[r][c] = null; }
      return;
    }
    count++;
  })();
  return count;
}
function sdkPuzzle(level) {
  const n = level >= 4 ? 6 : 4;
  const holes = { 1: 4, 2: 7, 3: 10, 4: 14, 5: 20 }[level];
  const sol = sdkSolution(n);
  const puz = sol.map((r) => r.slice());
  let removed = 0;
  for (const k of shuffle([...Array(n * n).keys()])) {
    if (removed >= holes) break;
    const r = Math.floor(k / n), c = k % n, keep = puz[r][c];
    puz[r][c] = null;
    if (sdkCount(puz.map((x) => x.slice()), n) === 1) removed++; else puz[r][c] = keep;
  }
  return { n, sol, puz };
}

function startSudokuMenu() {
  const lv = sdkLevel();
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Sudoku · Level ${lv} of 5</div>
    <div class="sdk-modes">
      <button class="sdk-mode" data-m="pics"><span>🍎🍌</span>Pictures</button>
      <button class="sdk-mode" data-m="nums"><span>1 2</span>Numbers</button>
      <button class="sdk-mode" data-m="word"><span>🔤</span>Word Sudoku</button>
    </div>
    <div class="note small">Every row, every column and every box gets one of each!</div>`;
  say('Every row, every column and every box gets one of each!');
  $$('.sdk-mode', area).forEach((b) => (b.onclick = () => { sfx.tap(); startSudoku(b.dataset.m); }));
}

function startSudoku(mode) {
  const lv = sdkLevel();
  const { n, sol, puz } = sdkPuzzle(lv);
  let syms, word = '';
  if (mode === 'pics') syms = shuffle(pick(n === 4 ? SDK_PICS4 : SDK_PICS6)).slice(0, n);
  else if (mode === 'nums') syms = Array.from({ length: n }, (_, i) => String(i + 1));
  else { word = pick(n === 4 ? SDK_WORDS4 : SDK_WORDS6); syms = word.split(''); }
  const cur = puz.map((r) => r.slice());
  const given = puz.map((r) => r.map((v) => v != null));
  let sel = null, solved = false;
  const area = $('#gameArea');
  const bc = n / 2;
  area.innerHTML = `${word ? `<div class="sdk-word">${syms.map((l) => `<b>${l}</b>`).join('')}<button class="mini-speaker" data-speak="${word}">🔊</button></div>` : ''}
    <div class="sdk-board n${n} ${mode}" style="grid-template-columns:repeat(${n},1fr)">${cur.flatMap((row, r) => row.map((v, c) =>
      `<button class="sdk-cell ${given[r][c] ? 'given' : ''} ${c % bc === bc - 1 && c < n - 1 ? 'br' : ''} ${r % 2 === 1 && r < n - 1 ? 'bb' : ''}" data-r="${r}" data-c="${c}">${v != null ? syms[v] : ''}</button>`)).join('')}</div>
    <div class="sdk-pad">${syms.map((sy, i) => `<button class="sdk-key" data-v="${i}">${sy}</button>`).join('')}<button class="sdk-key erase" data-v="x">⌫</button></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="hint">💡 Hint</button><button class="big-btn alt small" data-a="menu">🔄 New</button></div>`;
  say(word ? ['Each row and column gets every letter of', word] : 'Fill the empty boxes!');
  const cellEl = (r, c) => $(`.sdk-cell[data-r="${r}"][data-c="${c}"]`, area);
  $$('[data-speak]', area).forEach((b) => (b.onclick = () => say(b.dataset.speak)));
  function conflicts(r, c) {
    const v = cur[r][c]; if (v == null) return false;
    for (let i = 0; i < n; i++) { if (i !== c && cur[r][i] === v) return true; if (i !== r && cur[i][c] === v) return true; }
    const r0 = r - (r % 2), c0 = c - (c % bc);
    for (let i = 0; i < 2; i++) for (let j = 0; j < bc; j++) { const rr = r0 + i, cc = c0 + j; if ((rr !== r || cc !== c) && cur[rr][cc] === v) return true; }
    return false;
  }
  function paint() {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const el = cellEl(r, c);
      el.textContent = cur[r][c] != null ? syms[cur[r][c]] : '';
      el.classList.toggle('bad', !given[r][c] && conflicts(r, c));
      el.classList.toggle('sel', !!sel && sel[0] === r && sel[1] === c);
      el.classList.toggle('peer', !!sel && (sel[0] === r || sel[1] === c));
    }
  }
  function checkWin() {
    if (solved) return;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (cur[r][c] !== sol[r][c]) return;
    solved = true;
    sel = null; paint();
    $$('.sdk-cell', area).forEach((el, k) => { el.style.animationDelay = `${k * 30}ms`; el.classList.add('win'); });
    const up = lv < 5;
    state.sdkWins = (state.sdkWins || 0) + 1;
    if (up && state.sdkWins % 2 === 0) state.sdkLevel = lv + 1;   // every 2 wins → harder
    save();
    gameWin(pick(['Awesome job!', 'Excellent!', 'You did it!']));
    later(() => endPanel(state.sdkLevel > lv ? `Solved! Next puzzles are harder (level ${state.sdkLevel})` : 'Solved!', '🧩', () => startSudoku(mode)), 1300);
  }
  area.querySelector('.sdk-board').addEventListener('click', (e) => {
    const t = e.target.closest('.sdk-cell'); if (!t) return;
    const r = +t.dataset.r, c = +t.dataset.c;
    if (solved || given[r][c]) return;
    sel = [r, c]; sfx.tap(); paint();
  });
  $('.sdk-key', area).forEach((k) => (k.onclick = () => {
    if (solved) return;
    if (!sel) { const f = firstEmpty(); if (!f) return; sel = f; }
    const [r, c] = sel;
    cur[r][c] = k.dataset.v === 'x' ? null : +k.dataset.v;
    tone([600], { dur: 0.04, vol: 0.08 });
    if (cur[r][c] != null && conflicts(r, c)) sfx.no();
    paint(); checkWin();
  }));
  const firstEmpty = () => { for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!given[r][c] && cur[r][c] !== sol[r][c]) return [r, c]; return null; };
  area.querySelector('[data-a="hint"]').onclick = () => {
    if (solved) return;
    const f = firstEmpty(); if (!f) return;
    const [r, c] = f; cur[r][c] = sol[r][c]; given[r][c] = true;
    const el = cellEl(r, c); el.classList.add('given', 'hinted');
    sfx.yes(); paint(); checkWin();
  };
  area.querySelector('[data-a="menu"]').onclick = () => { sfx.tap(); gameSession++; startSudokuMenu(); };
  paint();
}

/* ======================= PICTURE PUZZLE ======================= */
// Tap two tiles to swap them. 2×2 → 3×3 → 4×4 as she solves more.
const AUTO_FILL = ['#d0ebff', '#ffd43b', '#ff8787', '#69db7c', '#4dabf7', '#ffa94d', '#da77f2', '#f783ac', '#20c997', '#ffe066', '#a5d8ff', '#ff6b6b', '#8ce99a', '#b197fc', '#ffc078', '#63e6be', '#e599f7', '#74c0fc'];
function puzzleFills(p) {
  const mine = (state.art || {})[p.id];
  if (mine && Object.keys(mine).length > 2) return mine;
  if (p.orig) { const f = { 0: '#d0ebff' }; p.orig.forEach((c, i) => (f[i + 1] = c)); return f; }
  const f = {}; for (let k = 0; k < 40; k++) f[k] = AUTO_FILL[k % AUTO_FILL.length]; return f;
}
const puzzleSize = () => GL('puzzle') + 1;   // level 1 = 2×2 … level 5 = 6×6

function startPuzzleMenu() {
  const area = $('#gameArea');
  const size = puzzleSize();
  const PUZ = ALL_PICS.filter((p) => p.orig || !p.om);
  area.innerHTML = `<div class="g-msg">Pick a picture · ${size}×${size} puzzle</div><div class="pic-grid">${PUZ.map((p) =>
    `<button class="pic-pick" data-p="${p.id}">${picSVG(p, puzzleFills(p))}<span>${p.name}</span></button>`).join('')}</div>`;
  say('Pick a picture!');
  $$('.pic-pick', area).forEach((b) => (b.onclick = () => { sfx.tap(); startPuzzle(ALL_PICS.find((p) => p.id === b.dataset.p)); }));
}

function startPuzzle(p) {
  const n = puzzleSize(), N = n * n, VB = p.vb || 200, part = VB / n;
  const fills = puzzleFills(p);
  let k = 0;
  const body = p.svg().replace(/class="r( bg)?"/g, () => `class="r" style="fill:${fills[k++] || '#fff'}"`);
  let order;
  do { order = shuffle([...Array(N).keys()]); } while (order.every((v, i) => v === i));
  let pickA = null, solved = false;
  const area = $('#gameArea');
  const tileSVG = (t) => `<svg viewBox="${(t % n) * part} ${Math.floor(t / n) * part} ${part} ${part}" class="pic ${p.om ? 'om' : ''}">${body}</svg>`;
  area.innerHTML = `<div class="g-msg">Put the picture back together!</div>
    <div class="pz-wrap"><div class="pz-board" style="grid-template-columns:repeat(${n},1fr)"></div>
    <div class="pz-peek"><svg viewBox="0 0 ${VB} ${VB}" class="pic ${p.om ? 'om' : ''}">${body}</svg><small>Look!</small></div></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="restart">🔄 Restart</button><button class="big-btn alt small" data-a="pictures">🖼️ Pictures</button></div>`;
  say('Put the picture back together!');
  const board = $('.pz-board', area);
  function draw() {
    board.innerHTML = order.map((t, i) => `<button class="pzl-tile ${t === i ? 'ok' : ''} ${pickA === i ? 'picked' : ''}" data-i="${i}">${tileSVG(t)}</button>`).join('');
  }
  board.addEventListener('click', (e) => {
    const b = e.target.closest('.pzl-tile'); if (!b || solved) return;
    const i = +b.dataset.i;
    if (pickA == null) { pickA = i; sfx.tap(); draw(); return; }
    if (pickA !== i) {
      [order[pickA], order[i]] = [order[i], order[pickA]];
      tone([order[i] === i || order[pickA] === pickA ? 880 : 520], { dur: 0.06, vol: 0.1 });
    }
    pickA = null; draw();
    if (order.every((v, j) => v === j)) {
      solved = true;
      board.classList.add('solved');
      const up = gameLevelUp('puzzle', 1);
      gameWin(pick(['Awesome job!', 'You did it!', 'Fantastic!']));
      later(() => endPanel(up ? `You did it! Next: ${puzzleSize()}×${puzzleSize()} puzzles` : 'You did it!', '🧩', startPuzzleMenu, up), 1300);
    }
  });
  area.querySelector('[data-a="restart"]').onclick = () => { gameSession++; startPuzzle(p); };
  area.querySelector('[data-a="pictures"]').onclick = () => { gameSession++; startPuzzleMenu(); };
  draw();
}


/* ======================= SILLY MOVES ======================= */
// Roll the dice → a move to act out for 10 seconds. Get up and wiggle!
const MOVES = [
  ['🐰', 'Hop like a bunny!'], ['🐸', 'Jump like a frog!'], ['🐧', 'Waddle like a penguin!'], ['🐘', 'Stomp like an elephant!'],
  ['🐍', 'Wiggle like a snake!'], ['🐦', 'Flap your wings like a bird!'], ['🦁', 'Roar like a lion!'], ['🐒', 'Swing your arms like a monkey!'],
  ['🐴', 'Gallop like a horse!'], ['🦀', 'Walk sideways like a crab!'], ['🐝', 'Buzz around like a bee!'], ['🦒', 'Stretch up tall like a giraffe!'],
  ['🐟', 'Swim like a fish!'], ['🦋', 'Flutter like a butterfly!'], ['🦩', 'Stand on one leg like a flamingo!'], ['🦘', 'Bounce like a kangaroo!'],
  ['🐢', 'Move super slow like a turtle!'], ['🐶', 'Wag your tail like a happy puppy!'],
  ['🤖', 'Walk like a robot!'], ['🦸', 'Fly like a superhero!'], ['🩰', 'Twirl like a ballerina!'], ['🧑‍🍳', 'Stir a giant pot like a chef!'],
  ['🏎️', 'Drive a race car!'], ['🥁', 'Play pretend drums!'], ['🗽', 'Freeze like a statue!'], ['🧑‍🚀', 'Bounce like an astronaut on the moon!'],
  ['🎤', 'Dance like a pop star!'], ['🧑‍🚒', 'Spray water like a firefighter!'], ['🎺', 'March in place like a band!'],
  ['🤪', 'Make your silliest face!'], ['🍮', 'Wiggle like jelly!'], ['🌀', 'Spin around slowly three times!'],
  ['🏴‍☠️', 'Laugh like a pirate!'], ['🌳', 'Sway like a tree in the wind!'], ['🐭', 'Tiptoe like a mouse!'], ['🫨', 'Shake your sillies out!'],
  ['🤗', 'Give yourself a big hug!'], ['🦶', 'Touch your toes!'], ['👏', 'Clap ten times!'], ['😂', 'Do your biggest laugh!'],
];
function startMoves() {
  const area = $('#gameArea');
  let timer = 0, spin = 0;
  const done = state.movesDone || 0;
  area.innerHTML = `<div class="g-msg">Roll the dice and do the move! <small class="mv-count">${done ? `⭐ ${done} moves done` : ''}</small></div>
    <div class="mv-card"><div class="mv-emoji">🎲</div><div class="mv-text">Tap Roll!</div><svg class="mv-ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54"/></svg></div>
    <button class="big-btn mv-roll">🎲 Roll!</button>`;
  say('Roll the dice!');
  const card = $('.mv-card', area), em = $('.mv-emoji', area), tx = $('.mv-text', area), btn = $('.mv-roll', area), ring = $('.mv-ring circle', area);
  const cleanup = () => { clearInterval(timer); clearInterval(spin); };
  gameCleanup = cleanup;
  btn.onclick = () => {
    if (btn.disabled) return;
    btn.disabled = true; sfx.tap();
    const m = pick(MOVES);
    let k = 0;
    card.classList.remove('go', 'done');
    tx.textContent = '…';
    spin = setInterval(() => { em.textContent = pick(MOVES)[0]; tone([300 + (k++ % 6) * 80], { dur: 0.03, vol: 0.06 }); }, 90);
    later(() => {
      clearInterval(spin);
      em.textContent = m[0]; tx.textContent = m[1];
      card.classList.add('go');
      say(m[1]);
      let left = 10;
      ring.style.strokeDashoffset = '0';
      const total = 10;
      timer = setInterval(() => {
        left--;
        ring.style.strokeDashoffset = String(339 * (1 - left / total));
        if (left > 0 && left <= 3) tone([660], { dur: 0.05, vol: 0.08 });
        if (left <= 0) {
          clearInterval(timer);
          card.classList.remove('go'); card.classList.add('done');
          state.movesDone = (state.movesDone || 0) + 1; save();
          $('.mv-count', area).textContent = `⭐ ${state.movesDone} moves done`;
          gameWin(pick(['Great moves!', 'Awesome job!', 'You are so silly!', 'Fantastic!']));
          btn.disabled = false; btn.textContent = '🎲 Roll again!';
        }
      }, 1000);
    }, 1300);
  };
}


/* ======================= DRAW & COPY ======================= */
// Level 1: trace a dark guide · 2: trace a faint guide · 3: copy simple pictures · 4: copy detailed pictures
const SIMPLE_REFS = [
  ['Sun', '<circle cx="100" cy="100" r="38"/><path d="M100 20v28M100 152v28M20 100h28M152 100h28M44 44l20 20M136 136l20 20M156 44l-20 20M64 136l-20 20"/>'],
  ['Heart', '<path d="M100 165C40 120 25 90 40 62c15-28 50-25 60 0c10-25 45-28 60 0c15 28 0 58-60 103z"/>'],
  ['Star', `<polygon points="${st(100, 105, 75, 32)}"/>`],
  ['House', '<path d="M45 95v75h110V95M30 100l70-60l70 60M88 170v-40h24v40"/>'],
  ['Smiley', '<circle cx="100" cy="100" r="70"/><circle cx="76" cy="84" r="7"/><circle cx="124" cy="84" r="7"/><path d="M68 118q32 32 64 0"/>'],
  ['Fish', '<path d="M40 100q50-55 100 0q-50 55-100 0zM140 100l35-28v56z"/><circle cx="65" cy="95" r="5"/>'],
  ['Flower', '<circle cx="100" cy="80" r="16"/><circle cx="100" cy="46" r="18"/><circle cx="134" cy="80" r="18"/><circle cx="100" cy="114" r="18"/><circle cx="66" cy="80" r="18"/><path d="M100 132v55M100 165q-25-15-35 0M100 160q25-15 35 0"/>'],
  ['Tree', '<path d="M88 180v-45h24v45M100 25L45 105h110z"/>'],
  ['Balloon', '<ellipse cx="100" cy="80" rx="45" ry="55"/><path d="M100 135q-12 25 5 50"/>'],
  ['Cloud', `<path d="${cloud(60, 130, 2.2)}"/>`],
  ['Boat', '<path d="M35 125h130l-20 35H55zM100 125V40l45 70h-45"/>'],
  ['Cat Face', '<circle cx="100" cy="105" r="55"/><path d="M58 75l-8-45l35 25M142 75l8-45l-35 25"/><circle cx="80" cy="100" r="6"/><circle cx="120" cy="100" r="6"/><path d="M92 120l8 6l8-6M60 115h-25M60 125h-25M140 115h25M140 125h25"/>'],
];
function drawRefs(lv) {
  if (lv === 1) return SIMPLE_REFS.map(([name, d]) => ({ name, svg: `<svg viewBox="0 0 200 200" class="ref-svg"><g fill="none" stroke="#2b2140" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${d}</g></svg>` }));
  const pool = lv === 2 ? OM_PAGES.filter((p) => p.n <= 6) : lv === 3 ? OM_PAGES.filter((p) => p.n >= 4 && p.n <= 10) : OM_PAGES.filter((p) => p.n >= 9);
  return pool.map((p) => ({ name: p.name, svg: `<svg viewBox="0 0 72 72" class="ref-svg om-ref">${p.l}</svg>` }));
}
const INK = ['#2b2140', '#ff6b6b', '#ff922b', '#fcc419', '#40c057', '#20c997', '#4dabf7', '#7950f2', '#f783ac', '#a0522d'];

function startDraw(refIndex) {
  const lv = GL('draw');
  const refs = drawRefs(lv);
  const ref = refs[refIndex != null ? refIndex % refs.length : Math.floor(Math.random() * refs.length)];
  const trace = lv <= 2;
  const area = $('#gameArea');
  area.innerHTML = `<div class="dr-top"><div class="dr-ref">${ref.svg}<small>${ref.name}</small></div>
      <div class="dr-say"><b>${trace ? 'Trace the' : 'Copy the'} ${ref.name}!</b><small>${trace ? 'Follow the gray lines with your finger.' : 'Look at the picture and draw your own!'}</small></div></div>
    <div class="dr-pad">${trace ? `<div class="dr-guide" style="opacity:${lv === 1 ? 0.32 : 0.14}">${ref.svg}</div>` : ''}<canvas class="dr-cv"></canvas></div>
    <div class="dr-tools">${INK.map((c, i) => `<button class="dr-ink ${i === 0 ? 'on' : ''}" data-c="${c}" style="--sw:${c}"></button>`).join('')}
      <button class="dr-size" data-s="6">•</button><button class="dr-size on" data-s="12">●</button><button class="dr-size" data-s="22">⬤</button>
      <button class="dr-tool" data-t="erase">🧽</button><button class="dr-tool" data-t="undo">↩️</button><button class="dr-tool" data-t="clear">🗑️</button></div>
    <div class="color-btns"><button class="big-btn alt small" data-a="new">🔄 New picture</button><button class="big-btn alt small" data-a="gallery">🖼️ My drawings</button><button class="big-btn small" data-a="done">✅ I'm done!</button></div>`;
  say(trace ? 'Trace the picture with your finger!' : 'Look at the picture, and draw your own!');
  const cv = $('.dr-cv', area), pad = $('.dr-pad', area);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = pad.clientWidth;
  cv.width = cv.height = Math.round(W * dpr); cv.style.width = cv.style.height = W + 'px';
  const c = cv.getContext('2d'); c.scale(dpr, dpr); c.lineCap = c.lineJoin = 'round';
  let color = INK[0], size = 12, erase = false, strokes = [], cur = null;
  const redraw = () => {
    c.clearRect(0, 0, W, W);
    for (const s of strokes) paint(s);
  };
  function paint(s) {
    c.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
    c.strokeStyle = s.color; c.fillStyle = s.color; c.lineWidth = s.size;
    const p = s.pts;
    if (p.length === 1) { c.beginPath(); c.arc(p[0][0], p[0][1], s.size / 2, 0, 7); c.fill(); }
    else {
      c.beginPath(); c.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; c.quadraticCurveTo(p[i][0], p[i][1], mx, my); }
      c.lineTo(p[p.length - 1][0], p[p.length - 1][1]); c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
  }
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (W / r.height)]; };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); cur = { color, size: erase ? size * 2 : size, erase, pts: [pt(e)] }; strokes.push(cur); paint(cur); });
  cv.addEventListener('pointermove', (e) => {
    if (!cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs) cur.pts.push(pt(ev));
    redrawLast();
  });
  const end = () => { cur = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  function redrawLast() { redraw(); }
  $$('.dr-ink', area).forEach((b) => (b.onclick = () => { $$('.dr-ink', area).forEach((x) => x.classList.remove('on')); b.classList.add('on'); color = b.dataset.c; erase = false; $('[data-t="erase"]', area).classList.remove('on'); sfx.tap(); }));
  $$('.dr-size', area).forEach((b) => (b.onclick = () => { $$('.dr-size', area).forEach((x) => x.classList.remove('on')); b.classList.add('on'); size = +b.dataset.s; sfx.tap(); }));
  $('[data-t="erase"]', area).onclick = (e) => { erase = !erase; e.currentTarget.classList.toggle('on', erase); sfx.tap(); };
  $('[data-t="undo"]', area).onclick = () => { strokes.pop(); redraw(); sfx.tap(); };
  $('[data-t="clear"]', area).onclick = () => { strokes = []; redraw(); sfx.tap(); };
  area.querySelector('[data-a="new"]').onclick = () => { sfx.tap(); startDraw(); };
  area.querySelector('[data-a="gallery"]').onclick = () => { sfx.tap(); drawGallery(); };
  area.querySelector('[data-a="done"]').onclick = () => {
    if (!strokes.length) { say('Draw something first!'); return; }
    // save a small copy on a white background
    const t = document.createElement('canvas'); t.width = t.height = 240;
    const tc = t.getContext('2d'); tc.fillStyle = '#fff'; tc.fillRect(0, 0, 240, 240); tc.drawImage(cv, 0, 0, 240, 240);
    state.drawings = [{ img: t.toDataURL('image/jpeg', 0.7), name: ref.name }, ...(state.drawings || [])].slice(0, 12);
    const up = gameLevelUp('draw', 3);
    gameWin(pick(['Beautiful drawing!', 'What a great drawing!', 'Awesome job!']));
    endPanel(`What a great ${ref.name}!${up ? '' : '<br><small>Saved in My drawings 🖼️</small>'}`, '🎨', () => startDraw(), up);
  };
}
function drawGallery() {
  const area = $('#gameArea');
  const list = state.drawings || [];
  area.innerHTML = `<div class="g-msg">🖼️ My drawings <small>${list.length ? 'Your last ' + list.length + ' drawings' : 'Finish a drawing to see it here!'}</small></div>
    <div class="dr-gal">${list.map((d) => `<figure><img src="${d.img}" alt=""><figcaption>${d.name}</figcaption></figure>`).join('')}</div>
    <div class="color-btns"><button class="big-btn small" data-a="back">✏️ Draw more</button></div>`;
  area.querySelector('[data-a="back"]').onclick = () => { sfx.tap(); startDraw(); };
}

$('#brainBanner').onclick = () => { sfx.tap(); openBrainGames(); };
$('#playBanner').onclick = () => { sfx.tap(); openPlayZone(); };
$('#playEarned').onclick = () => { sfx.tap(); openPlayZone(); };
renderPlayBanner();
renderPZ();
