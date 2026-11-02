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
const playOpen = () => !!state.playAlways || (hourlyMode() ? hourLeftMs() > 0 : (state.playUntil || 0) > Date.now());

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
const GAMES = [
  { id: 'ttt', title: 'Tic-Tac-Toe', icon: '⭕', color: '#ff6b6b', start: startTTT },
  { id: 'memory', title: 'Memory Match', icon: '🃏', color: '#4dabf7', start: startMemory },
  { id: 'pop', title: 'Pop the Balloons', icon: '🎈', color: '#f783ac', start: startPop },
  { id: 'color', title: 'Coloring Book', icon: '🖍️', color: '#ffa94d', start: startColorPicker },
  { id: 'c4', title: 'Connect Four', icon: '🔴', color: '#845ef7', start: startC4 },
  { id: 'sudoku', title: 'Sudoku', icon: '🔢', color: '#20c997', start: startSudokuMenu },
  { id: 'puzzle', title: 'Picture Puzzle', icon: '🧩', color: '#fab005', start: startPuzzleMenu },
  { id: 'moves', title: 'Silly Moves', icon: '🤸', color: '#12b886', start: startMoves },
];
$('#pzGrid').innerHTML = GAMES.map((g) =>
  `<button class="tile pz-tile" data-game="${g.id}" style="--c:${g.color}"><span class="ti">${g.icon}</span><span class="tt">${g.title}</span></button>`).join('');
$('#pzGrid').addEventListener('click', (e) => {
  const t = e.target.closest('[data-game]'); if (!t) return;
  sfx.tap(); openGame(t.dataset.game);
});
$('#pzHome').onclick = () => { sayToken++; stopClip(); renderHome(); show('home'); };
$('#gameBack').onclick = () => { stopGame(); show('playzone'); startPlayTimer(); };

let curGame = null, gameCleanup = null, gameCleanupPanel = null;
function openGame(id) {
  const g = GAMES.find((x) => x.id === id);
  curGame = g;
  document.body.style.setProperty('--theme', g.color);
  $('#gameTitle').textContent = `${g.icon} ${g.title}`;
  $('#gameArea').innerHTML = '';
  $('#gameArea').className = 'game-area ' + id;
  show('game');
  startPlayTimer();
  g.start();
}
function stopGame() { if (gameCleanup) { gameCleanup(); gameCleanup = null; } }

function gameWin(text = 'You win!') {
  sfx.win(); confetti(140, 0.35); setTimeout(() => confetti(90, 0.5), 500);
  say(text);
}
function endPanel(title, emoji, again) {
  const d = document.createElement('div');
  d.className = 'end-panel';
  d.innerHTML = `<div class="ep-card"><div class="ep-emoji">${emoji}</div><div class="ep-title">${title}</div>
    <div class="ep-btns"><button class="big-btn" data-a="again">🔁 Again</button><button class="big-btn alt" data-a="menu">🎮 Games</button></div></div>`;
  d.querySelector('[data-a="again"]').onclick = () => { sfx.tap(); if (playOpen()) again(); else timeUp(); };
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
      if (b[w[0]] === ME) { gameWin('You win!'); setTimeout(() => endPanel('You win!', '🏆', startTTT), 1300); }
      else { say('Good game! Try again!'); setTimeout(() => endPanel('Robot wins this time!', '🤖', startTTT), 1300); }
      return true;
    }
    if (b.every(Boolean)) { over = true; say("It's a tie!"); setTimeout(() => endPanel("It's a tie!", '🤝', startTTT), 900); return true; }
    return false;
  }
  function botMove() {
    const free = b.map((v, i) => (v ? null : i)).filter((v) => v != null);
    const findLine = (who) => { for (const l of LINES3) { const vals = l.map((i) => b[i]); if (vals.filter((v) => v === who).length === 2 && vals.includes(null)) return l[vals.indexOf(null)]; } return null; };
    // friendly robot: always takes a win, blocks most of the time, otherwise plays loosely
    let m = findLine(BOT);
    if (m == null && Math.random() < 0.7) m = findLine(ME);
    if (m == null && b[4] == null && Math.random() < 0.5) m = 4;
    if (m == null) m = free[Math.floor(Math.random() * free.length)];
    put(m, BOT); sfx.tap();
  }
  cells.forEach((c, i) => (c.onclick = () => {
    if (busy || over || b[i]) return;
    put(i, ME); sfx.tap();
    if (check()) return;
    busy = true;
    setTimeout(() => { botMove(); busy = false; check(); }, 550);
  }));
}

/* ======================= MEMORY MATCH ======================= */
const MEM_FACES = ['🐶', '🐱', '🦊', '🐸', '🐼', '🦁', '🐵', '🐰', '🐙', '🦋', '🍓', '🍩', '🚀', '🌈', '⭐', '🎈'];
function startMemory() {
  const plays = state.memPlays || 0;
  const pairs = plays < 2 ? 3 : plays < 5 ? 4 : plays < 9 ? 6 : 8;
  const faces = shuffle(MEM_FACES).slice(0, pairs);
  const deck = shuffle(faces.concat(faces));
  let open = [], found = 0, moves = 0, lock = false;
  const area = $('#gameArea');
  const cols = deck.length <= 6 ? 3 : 4;
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
      setTimeout(() => {
        cards[a].classList.add('done'); cards[b].classList.add('done'); sfx.yes(); found++;
        if (found === pairs) {
          state.memPlays = plays + 1; save();
          gameWin(pick(['Awesome job!', 'You did it!', 'Amazing!']));
          setTimeout(() => endPanel(`All pairs in ${moves} tries!`, '🧠', startMemory), 1300);
        }
      }, 350);
    } else {
      lock = true;
      setTimeout(() => { cards[a].classList.remove('flip'); cards[b].classList.remove('flip'); lock = false; }, 900);
    }
  }));
}

/* ======================= POP THE BALLOONS ======================= */
function startPop() {
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Pop the balloons! <b class="pop-score">0</b> 🎈 · <span class="pop-time">30</span>s</div><div class="pop-sky"></div>`;
  say('Pop the balloons!');
  const sky = $('.pop-sky', area);
  const colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#cc5de8', '#ff922b', '#f783ac', '#20c997'];
  let score = 0, t0 = performance.now(), raf = 0, spawnT = 0, alive = true;
  const balloons = [];
  function spawn(now) {
    const el = document.createElement('button');
    el.className = 'balloon';
    const c = colors[Math.floor(Math.random() * colors.length)];
    const size = 64 + Math.random() * 30;
    el.style.setProperty('--b', c); el.style.width = size + 'px'; el.style.height = size * 1.2 + 'px';
    const W = sky.clientWidth;
    const x = Math.random() * (W - size);
    const elapsed = (now - t0) / 1000;
    const speed = 55 + Math.random() * 40 + elapsed * 3.5; // px/sec, a bit faster over time
    const star = Math.random() < 0.12;
    if (star) el.innerHTML = '<span>⭐</span>';
    sky.appendChild(el);
    const o = { el, x, y: sky.clientHeight + 10, speed, wob: Math.random() * 6, star };
    el.style.transform = `translate(${x}px, ${o.y}px)`;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (el.classList.contains('popped')) return;
      el.classList.add('popped');
      score += star ? 3 : 1; $('.pop-score').textContent = score;
      tone([star ? 1200 : 700 + Math.random() * 300, 300], { dur: 0.05, type: 'square', gap: 0.04, vol: 0.12 });
      if (star) confetti(30, (o.y + 40) / innerHeight);
      setTimeout(() => el.remove(), 250);
    });
    balloons.push(o);
  }
  function frame(now) {
    if (!alive) return;
    const left = Math.max(0, 30 - (now - t0) / 1000);
    $('.pop-time').textContent = Math.ceil(left);
    if (now - spawnT > Math.max(380, 900 - (now - t0) / 40)) { spawn(now); spawnT = now; }
    const dt = 1 / 60;
    for (const o of balloons) {
      o.y -= o.speed * dt; o.wob += dt * 2;
      o.el.style.transform = `translate(${o.x + Math.sin(o.wob) * 10}px, ${o.y}px)`;
      if (o.y < -150) o.el.remove();
    }
    if (left <= 0) return finishPop();
    raf = requestAnimationFrame(frame);
  }
  function finishPop() {
    alive = false; cancelAnimationFrame(raf);
    sky.innerHTML = '';
    state.popBest = Math.max(state.popBest || 0, score); save();
    gameWin(score >= 15 ? 'Amazing!' : 'Great job!');
    endPanel(`You popped ${score} balloons!<br><small>Best: ${state.popBest}</small>`, '🎈', startPop);
  }
  raf = requestAnimationFrame(frame);
  gameCleanup = () => { alive = false; cancelAnimationFrame(raf); };
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
      if (who === ME) { gameWin('You win!'); setTimeout(() => endPanel('Four in a row! You win!', '🏆', startC4), 1400); }
      else { say('Good game! Try again!'); setTimeout(() => endPanel('Robot got four this time!', '🤖', startC4), 1400); }
      return true;
    }
    if (g[0].every(Boolean)) { over = true; say("It's a tie!"); setTimeout(() => endPanel("It's a tie!", '🤝', startC4), 800); return true; }
    return false;
  }
  function botCol() {
    const cols = [...Array(C7).keys()].filter((c) => dropRow(c) >= 0);
    const tryWin = (who) => cols.find((c) => { const r = dropRow(c); g[r][c] = who; const w = lineAt(r, c, who); g[r][c] = 0; return w; });
    let c = tryWin(BOT);
    if (c == null && Math.random() < 0.75) c = tryWin(ME);   // usually blocks, sometimes misses (it's a kid's game)
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
    setTimeout(() => { const bc = botCol(); const br = place(bc, BOT); busy = false; after(br, bc, BOT); }, 650);
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
const PALETTE_C = ['#ff6b6b', '#ff922b', '#ffd43b', '#94d82d', '#40c057', '#20c997', '#4dabf7', '#4c6ef5', '#9775fa', '#f783ac', '#a0522d', '#868e96', '#2b2140', '#ffffff'];
const colorLevel = () => { const n = (state.colored || []).length; return n < 3 ? 1 : n < 7 ? 2 : 3; };

function picSVG(p, fills = {}, cls = '') {
  let k = 0;
  const body = p.svg().replace(/class="r"/g, () => `class="r" data-k="${k}" style="fill:${fills[k++] || '#fff'}"`);
  return `<svg viewBox="0 0 200 200" class="pic ${cls}">${body}</svg>`;
}

function startColorPicker() {
  const lv = colorLevel();
  const done = state.colored || [];
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Pick a picture to color!</div><div class="pic-grid">${PICS.map((p) => {
    const locked = p.level > lv;
    return `<button class="pic-pick ${locked ? 'locked' : ''}" data-p="${p.id}">${picSVG(p, (state.art || {})[p.id])}
      <span>${locked ? '🔒' : done.includes(p.id) ? '⭐ ' : ''}${p.name}</span></button>`;
  }).join('')}</div><div class="note small">Color more pictures to unlock harder ones!</div>`;
  say('Pick a picture to color!');
  $$('.pic-pick', area).forEach((b) => (b.onclick = () => {
    if (b.classList.contains('locked')) { sfx.no(); say('Color more pictures to unlock this one!'); return; }
    sfx.tap(); startColoring(PICS.find((p) => p.id === b.dataset.p));
  }));
}

function startColoring(p) {
  state.art = state.art || {};
  const fills = state.art[p.id] = state.art[p.id] || {};
  let cur = PALETTE_C[0];
  const area = $('#gameArea');
  area.innerHTML = `<div class="color-wrap">${picSVG(p, fills, 'big')}</div>
    <div class="palette">${PALETTE_C.map((c, i) => `<button class="sw-c ${i === 0 ? 'on' : ''}" data-c="${c}" style="--sw:${c}" aria-label="color">${c === '#ffffff' ? '🧽' : ''}</button>`).join('')}</div>
    <div class="color-btns"><button class="big-btn alt small" data-a="pics">🖼️ Pictures</button><button class="big-btn small" data-a="done">✅ I'm done!</button></div>`;
  say('Pick a color, then tap the picture.');
  $$('.sw-c', area).forEach((b) => (b.onclick = () => {
    $$('.sw-c', area).forEach((x) => x.classList.remove('on')); b.classList.add('on'); cur = b.dataset.c; sfx.tap();
  }));
  $$('.r', area).forEach((r) => (r.onclick = () => {
    r.style.fill = cur; fills[r.dataset.k] = cur; save();
    r.classList.remove('splash'); void r.getBoundingClientRect(); r.classList.add('splash');
    tone([500 + Math.random() * 400], { dur: 0.05, vol: 0.08 });
  }));
  area.querySelector('[data-a="pics"]').onclick = () => { sfx.tap(); startColorPicker(); };
  area.querySelector('[data-a="done"]').onclick = () => {
    const before = colorLevel();
    state.colored = state.colored || [];
    if (!state.colored.includes(p.id)) state.colored.push(p.id);
    save();
    gameWin('Beautiful picture!');
    const unlocked = colorLevel() > before;
    endPanel(unlocked ? 'Beautiful! New pictures unlocked! 🔓' : 'Beautiful picture!', '🎨', startColorPicker);
  };
}


/* ======================= SUDOKU ======================= */
// Levels: 1 4×4 few blanks · 2 4×4 · 3 4×4 many blanks · 4 6×6 · 5 6×6 many blanks
const SDK_PICS4 = [['🍎', '🍌', '🍇', '🍓'], ['🐶', '🐱', '🐸', '🐵'], ['🚗', '🚀', '⛵', '🚲'], ['⭐', '🌙', '☀️', '🌈']];
const SDK_PICS6 = [['🍎', '🍌', '🍇', '🍓', '🍊', '🥝'], ['🐶', '🐱', '🐸', '🐵', '🐼', '🦊']];
const distinct = (w) => new Set(w).size === w.length;
const SDK_WORDS4 = W4.map((x) => x[0]).filter((w) => /^[a-z]{4}$/.test(w) && distinct(w));
const SDK_WORDS6 = SPELLL.filter((w) => w.length === 6 && distinct(w));
const sdkLevel = () => state.sdkLevel || (state.grade === 'g2' ? 3 : state.grade === 'g1' ? 2 : 1);

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
  let sel = null;
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
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (cur[r][c] !== sol[r][c]) return;
    sel = null; paint();
    $$('.sdk-cell', area).forEach((el, k) => { el.style.animationDelay = `${k * 30}ms`; el.classList.add('win'); });
    const up = lv < 5;
    state.sdkWins = (state.sdkWins || 0) + 1;
    if (up && state.sdkWins % 2 === 0) state.sdkLevel = lv + 1;   // every 2 wins → harder
    save();
    gameWin(pick(['Awesome job!', 'Excellent!', 'You did it!']));
    setTimeout(() => endPanel(state.sdkLevel > lv ? `Solved! Next puzzles are harder (level ${state.sdkLevel})` : 'Solved!', '🧩', () => startSudoku(mode)), 1300);
  }
  area.querySelector('.sdk-board').addEventListener('click', (e) => {
    const t = e.target.closest('.sdk-cell'); if (!t) return;
    const r = +t.dataset.r, c = +t.dataset.c;
    if (given[r][c]) return;
    sel = [r, c]; sfx.tap(); paint();
  });
  $$('.sdk-key', area).forEach((k) => (k.onclick = () => {
    if (!sel) { const f = firstEmpty(); if (!f) return; sel = f; }
    const [r, c] = sel;
    cur[r][c] = k.dataset.v === 'x' ? null : +k.dataset.v;
    tone([600], { dur: 0.04, vol: 0.08 });
    if (cur[r][c] != null && conflicts(r, c)) sfx.no();
    paint(); checkWin();
  }));
  const firstEmpty = () => { for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!given[r][c] && cur[r][c] !== sol[r][c]) return [r, c]; return null; };
  area.querySelector('[data-a="hint"]').onclick = () => {
    const f = firstEmpty(); if (!f) return;
    const [r, c] = f; cur[r][c] = sol[r][c]; given[r][c] = true;
    const el = cellEl(r, c); el.classList.add('given', 'hinted');
    sfx.yes(); paint(); checkWin();
  };
  area.querySelector('[data-a="menu"]').onclick = () => { sfx.tap(); startSudokuMenu(); };
  paint();
}

/* ======================= PICTURE PUZZLE ======================= */
// Tap two tiles to swap them. 2×2 → 3×3 → 4×4 as she solves more.
const AUTO_FILL = ['#d0ebff', '#ffd43b', '#ff8787', '#69db7c', '#4dabf7', '#ffa94d', '#da77f2', '#f783ac', '#20c997', '#ffe066', '#a5d8ff', '#ff6b6b', '#8ce99a', '#b197fc', '#ffc078', '#63e6be', '#e599f7', '#74c0fc'];
function puzzleFills(p) {
  const mine = (state.art || {})[p.id];
  if (mine && Object.keys(mine).length > 2) return mine;
  const f = {}; for (let k = 0; k < 40; k++) f[k] = AUTO_FILL[k % AUTO_FILL.length]; return f;
}
const puzzleSize = () => { const n = state.puzzleWins || 0; return n < 3 ? 2 : n < 7 ? 3 : 4; };

function startPuzzleMenu() {
  const area = $('#gameArea');
  const size = puzzleSize();
  area.innerHTML = `<div class="g-msg">Pick a picture · ${size}×${size} puzzle</div><div class="pic-grid">${PICS.map((p) =>
    `<button class="pic-pick" data-p="${p.id}">${picSVG(p, puzzleFills(p))}<span>${p.name}</span></button>`).join('')}</div>`;
  say('Pick a picture!');
  $$('.pic-pick', area).forEach((b) => (b.onclick = () => { sfx.tap(); startPuzzle(PICS.find((p) => p.id === b.dataset.p)); }));
}

function startPuzzle(p) {
  const n = puzzleSize(), N = n * n, part = 200 / n;
  const fills = puzzleFills(p);
  let k = 0;
  const body = p.svg().replace(/class="r"/g, () => `class="r" style="fill:${fills[k++] || '#fff'}"`);
  let order;
  do { order = shuffle([...Array(N).keys()]); } while (order.every((v, i) => v === i));
  let pickA = null;
  const area = $('#gameArea');
  const tileSVG = (t) => `<svg viewBox="${(t % n) * part} ${Math.floor(t / n) * part} ${part} ${part}" class="pic">${body}</svg>`;
  area.innerHTML = `<div class="g-msg">Put the picture back together!</div>
    <div class="pz-wrap"><div class="pz-board" style="grid-template-columns:repeat(${n},1fr)"></div>
    <div class="pz-peek"><svg viewBox="0 0 200 200" class="pic">${body}</svg><small>Look!</small></div></div>`;
  say('Put the picture back together!');
  const board = $('.pz-board', area);
  function draw() {
    board.innerHTML = order.map((t, i) => `<button class="pzl-tile ${t === i ? 'ok' : ''} ${pickA === i ? 'picked' : ''}" data-i="${i}">${tileSVG(t)}</button>`).join('');
  }
  board.addEventListener('click', (e) => {
    const b = e.target.closest('.pzl-tile'); if (!b) return;
    const i = +b.dataset.i;
    if (pickA == null) { pickA = i; sfx.tap(); draw(); return; }
    if (pickA !== i) {
      [order[pickA], order[i]] = [order[i], order[pickA]];
      tone([order[i] === i || order[pickA] === pickA ? 880 : 520], { dur: 0.06, vol: 0.1 });
    }
    pickA = null; draw();
    if (order.every((v, j) => v === j)) {
      board.classList.add('solved');
      const before = n;
      state.puzzleWins = (state.puzzleWins || 0) + 1; save();
      gameWin(pick(['Awesome job!', 'You did it!', 'Fantastic!']));
      setTimeout(() => endPanel(puzzleSize() > before ? `You did it! Next: ${puzzleSize()}×${puzzleSize()} puzzles` : 'You did it!', '🧩', startPuzzleMenu), 1300);
    }
  });
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
    setTimeout(() => {
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

$('#playBanner').onclick = () => { sfx.tap(); openPlayZone(); };
$('#playEarned').onclick = () => { sfx.tap(); openPlayZone(); };
renderPlayBanner();
