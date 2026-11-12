/* =========================================================
   Play Zone — reward games, unlocked by finishing learning rounds.
   This file: play time rules, the Play Zone screen and the game list (needed by Home).
   The games themselves are in games-play.js, pathmaze.js and radialmaze.js, loaded the first time a game opens
   (app.config.json "lazy": "games").
   ========================================================= */

/* ---------- unlock rules ---------- */
// Two rules a parent can pick in Settings:
//  'rounds' (default): every N finished learning rounds earns a play break of M minutes
//  'hourly': up to K minutes of play in each clock hour (e.g. 15 min per hour), opened by finishing a learning round in that hour
const roundsPerPlay = () => state.roundsPerPlay || 1;
function gamePlayPolicy(id) { return GRADES[state.grade]?.playPolicy?.[id] || {}; }
const playMinutes = () => state.playMinutes || 3;
const hourlyMode = () => state.playMode === 'hourly';
const perHour = () => state.playPerHour || 15;
const hourKey = () => { const d = new Date(); return `${d.toDateString()} ${d.getHours()}`; };
const usedThisHour = () => (state.playUsed && state.playUsed.h === hourKey() ? state.playUsed.ms : 0);
const hourLeftMs = () => Math.max(0, perHour() * 60000 - usedThisHour());
// kids earn first: this hour's play opens only after a finished learning round in this hour
const hourEarned = () => state.playHourEarned === hourKey();
// Migrate the former wall-clock deadline once; remaining time belongs to this child.
function playBalance() {
  if (state.playRemainingMs == null) {
    state.playRemainingMs = Math.max(0, (state.playUntil || 0) - Date.now());
    delete state.playUntil;
  }
  return Math.max(0, state.playRemainingMs || 0);
}
const playOpen = () => !!state.playAlways || isTestMode() || (hourlyMode() ? hourEarned() && hourLeftMs() > 0 : playBalance() > 0);

// Question activities deposit a fraction on each completed card. The default
// argument preserves compatibility with full-round reward callers.
function earnPlay(credit = ROUND_POLICY.creditUnitsPerRound) {
  const units = ROUND_POLICY.creditUnitsPerRound;
  const total = (state.learningPlayCredit || 0) + credit;
  if (hourlyMode()) {
    // a whole round's worth of cards in this hour opens the hour's play minutes
    if (hourEarned()) return false;
    const hour = state.playHourCredit && state.playHourCredit.h === hourKey() ? state.playHourCredit.units : 0;
    const now = hour + credit;
    if (now < units) { state.playHourCredit = { h: hourKey(), units: now }; save(); return false; }
    state.playHourEarned = hourKey(); delete state.playHourCredit; save();
    return true;
  }
  state.learningPlayCredit = total % units;
  state.roundsSincePlay = (state.roundsSincePlay || 0) + Math.floor(total / units);
  const passes = Math.floor(state.roundsSincePlay / roundsPerPlay());
  state.roundsSincePlay %= roundsPerPlay();
  if (passes) state.playRemainingMs = playBalance() + passes * playMinutes() * 60000;
  save(); // persist before feedback/navigation so an interruption loses no credit
  return passes > 0;
}

const nextHourLabel = () => { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
function playStatus() {
  if (state.playAlways) return { open: true, text: 'Always open' };
  if (hourlyMode()) {
    if (!hourEarned()) return { open: false, text: state.playHourCredit && state.playHourCredit.h === hourKey() ? 'Progress saved · Keep learning to play' : 'Finish 1 round to play' };
    return hourLeftMs() > 0 ? { open: true, text: `${fmtLeft()} of play left this hour` } : { open: false, text: `Play again at ${nextHourLabel()}` };
  }
  if (playOpen()) return { open: true, text: `${fmtLeft()} left` };
  if (state.playPasses > 0) return { open: true, ready: true, text: `Ready! ${playMinutes()} min of play` };
  const left = roundsPerPlay() - (state.roundsSincePlay || 0);
  return { open: false, text: state.learningPlayCredit ? 'Progress saved · Keep learning to play' : `Finish ${left} more round${left === 1 ? '' : 's'} to play` };
}
const fmtLeft = () => {
  const ms = hourlyMode() ? hourLeftMs() : playBalance();
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
  let earned = false;
  if (!playOpen()) {
    if (!hourlyMode() && state.playPasses > 0) {
      state.playPasses--;
      state.playRemainingMs = playMinutes() * 60000;
      save();
      earned = true;
    } else {
      sfx.no();
      if (hourlyMode()) say('Play time is all used up for now. Let us learn!');
      else say(`Finish ${roundsPerPlay() - (state.roundsSincePlay || 0)} more round${roundsPerPlay() - (state.roundsSincePlay || 0) === 1 ? '' : 's'} to play.`);
      return;
    }
  }
  brainMode = false;
  renderPZ();
  $$('#playzone .play-clock, #game .play-clock').forEach((x) => (x.hidden = false));
  document.body.style.setProperty('--theme', '#ff6bb5');
  show('playzone');
  if (earned) say('You earned play time!');
  startPlayTimer();
}

/* ---------- play timer ---------- */
// A round may finish after the budget expires, with a bounded grace period for
// open-ended activities. Menus, results, settings and hidden tabs cost nothing.
const PLAY_FINISH_GRACE_MS = 120000;
let playTimer = 0, lastTick = 0, lastPlaySave = 0, playGraceMs = 0;
function activeArcadeRound() {
  return !brainMode && !!curGame && $('#game').classList.contains('active') &&
    !$('#gameArea .end-panel, #gameArea .wm-final, #gameArea .pic-pick, #gameArea .sdk-mode') && $('#timeUp').hidden;
}
function tickPlayTimer(now = performance.now()) {
  const elapsed = Math.max(0, Math.min(now - lastTick, 5000));
  lastTick = now;
  const active = activeArcadeRound() && !document.hidden;
  if (active && !state.playAlways && !isTestMode()) {
    const remaining = hourlyMode() ? hourLeftMs() : playBalance();
    if (remaining > 0) {
      if (hourlyMode()) {
        const h = hourKey();
        if (!state.playUsed || state.playUsed.h !== h) state.playUsed = { h, ms: 0 };
        state.playUsed.ms += Math.min(remaining, elapsed);
      } else state.playRemainingMs = Math.max(0, remaining - elapsed);
      playGraceMs += Math.max(0, elapsed - remaining);
    } else playGraceMs += elapsed;
    if (now - lastPlaySave >= 10000 || !playOpen()) { save(); lastPlaySave = now; }
  }
  const remaining = hourlyMode() ? hourLeftMs() : playBalance();
  const finishing = activeArcadeRound() && !playOpen();
  $$('.play-clock').forEach(el => {
    el.textContent = finishing ? '🏁 Finish this round' : `${remaining > 0 && remaining <= 30000 && !state.playAlways ? '⌛' : '⏱'} ${state.playAlways ? '∞' : fmtLeft()}`;
    el.classList.toggle('time-warning', !state.playAlways && remaining > 0 && remaining <= 30000);
    el.setAttribute('aria-label', finishing ? 'Finish this round. Up to two extra minutes.' : remaining <= 30000 ? 'Less than 30 seconds of play time left' : el.textContent);
  });
  if (!['playzone', 'game'].some(id => $('#' + id).classList.contains('active'))) {
    save(); clearInterval(playTimer); return;
  }
  if (!playOpen() && !brainMode && (!finishing || playGraceMs >= PLAY_FINISH_GRACE_MS)) {
    clearInterval(playTimer); timeUp();
  }
}
function startPlayTimer() {
  clearInterval(playTimer);
  lastTick = performance.now(); lastPlaySave = lastTick;
  playTimer = setInterval(tickPlayTimer, 1000);
  tickPlayTimer();
}
// progress.js flushes state on pagehide/visibilitychange; never charge hidden time.
document.addEventListener('visibilitychange', () => { lastTick = performance.now(); });
function timeUp() {
  if (typeof stopGame === 'function') stopGame();   // games-play.js may not be loaded yet
  save(); // flush the final hourly-time balance before showing the end screen
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
// each start() is looked up when the game opens (the games load on demand, in games-play.js)
const GAMES = [
  { id: 'ttt', title: 'Tic-Tac-Toe', icon: '⭕', color: '#ff6b6b', start: (...a) => startTTT(...a) },
  { id: 'memory', title: 'Memory Match', icon: '🃏', color: '#4dabf7', start: (...a) => startMemory(...a) },
  { id: 'pop', title: 'Pop the Balloons', icon: '🎈', color: '#f783ac', start: (...a) => startPop(...a) },
  { id: 'color', title: 'Coloring Book', icon: '🖍️', color: '#ffa94d', start: (...a) => startColorPicker(...a) },
  { id: 'c4', title: 'Four in a Row', icon: '🔴', color: '#845ef7', start: (...a) => startC4(...a) },
  { id: 'sudoku', title: 'Sudoku', icon: '🔢', color: '#20c997', start: (...a) => startSudokuMenu(...a) },
  { id: 'puzzle', title: 'Picture Puzzle', icon: '🧩', color: '#fab005', start: (...a) => startPuzzleMenu(...a) },
  { id: 'ball', title: 'Rolling Ball 3D', icon: BALL_ICON, color: '#339af0', start: (...a) => startBall(...a) },
  { id: 'pinball', title: '3D Pinball', icon: '🎯', color: '#7048e8', start: (...a) => startPinball(...a) },
  { id: 'maze', title: 'Ball Maze', icon: '🟫', color: '#c0874f', start: (...a) => startBallMaze(...a) },
  { id: 'path', title: 'Finger Maze', icon: '🐥', color: '#f59f00', start: () => startPathMaze() },
  { id: 'whack', title: 'Tap the Mole', icon: '🐹', color: '#a9734a', start: (...a) => startWhack(...a), max: 5 },
  { id: 'draw', title: 'Draw & Copy', icon: '✏️', color: '#e8590c', start: (...a) => drawChooser(...a) },
  { id: 'moves', title: 'Silly Moves', icon: '🤸', color: '#12b886', start: (...a) => startMoves(...a) },
];
// level per game; winning moves you up (needWins wins per level)
const GAME_MAX = { path: 11, pinball: 5, draw: 4, ttt: 3, memory: 5, pop: 5, c4: 3, puzzle: 5, ball: 8, maze: 8, whack: 5 };
// Brain Teasers: puzzle games shown with the thinking lessons on the home screen.
// They are learning, so they never need earned play time (Tic-Tac-Toe and Ball Maze stay in the Play Zone).
const BRAIN_GAME_IDS = new Set(['memory', 'puzzle', 'sudoku']);   // Finger Maze and Four in a Row live with the regular games
const BRAIN_MIN_GRADE = { path: 'prek', memory: 'prek', puzzle: 'prek', sudoku: 'k', c4: 'g1' };
const BRAIN_GRADE_ORDER = ['prek', 'k', 'g1', 'g2', 'g3'];
let brainMode = false;
function brainVisible(g) {
  return BRAIN_GAME_IDS.has(g.id) && (!!state.testMode || BRAIN_GRADE_ORDER.indexOf(state.grade || 'k') >= BRAIN_GRADE_ORDER.indexOf(BRAIN_MIN_GRADE[g.id]));
}
const brainGames = () => GAMES.filter(brainVisible);
// Ball Maze is a little-kid game (Pre-K and K); "Show all games" and test mode lift the limit
const GAME_MAX_GRADE = { maze: 'k' };
const gameForGrade = (g) => !GAME_MAX_GRADE[g.id] || !!state.showAll || !!state.testMode || BRAIN_GRADE_ORDER.indexOf(state.grade || 'k') <= BRAIN_GRADE_ORDER.indexOf(GAME_MAX_GRADE[g.id]);
// open a brain game straight from its tile on the home screen (no play clock, back goes home)
function openBrainGame(id) {
  brainMode = true;
  clearInterval(playTimer);
  $$('#game .play-clock').forEach((x) => (x.hidden = true));
  openGame(id);
}
// Each game's levels per grade [first, last]: a child starts at the first level of their grade
// and levels up only to the last, so a 3rd grader never plays toddler mazes or pre-K memory boards.
// "Show all games" in Settings lifts the limits.
const GAME_GRADES = {
  path:    { prek: [1, 2], k: [2, 4], g1: [4, 6], g2: [6, 8], g3: [9, 11] },   // 3rd grade starts on the circular mazes
  memory:  { prek: [1, 2], k: [2, 3], g1: [3, 4], g2: [4, 5], g3: [5, 5] },
  puzzle:  { prek: [1, 2], k: [2, 3], g1: [3, 4], g2: [4, 5], g3: [5, 5] },
  sudoku:  { prek: [1, 1], k: [1, 2], g1: [2, 3], g2: [3, 4], g3: [4, 5] },
  c4:      { g1: [1, 2], g2: [2, 3], g3: [3, 3] },
  ttt:     { prek: [1, 1], k: [1, 2], g1: [2, 3], g2: [3, 3], g3: [3, 3] },
  pop:     { prek: [1, 2], k: [2, 3], g1: [3, 4], g2: [4, 5], g3: [5, 5] },
  whack:   { prek: [1, 2], k: [2, 3], g1: [3, 4], g2: [4, 5], g3: [5, 5] },
  ball:    { prek: [1, 2], k: [2, 3], g1: [3, 5], g2: [5, 7], g3: [6, 8] },
  maze:    { prek: [1, 2], k: [2, 3], g1: [3, 5], g2: [5, 7], g3: [6, 8] },
  pinball: { prek: [1, 1], k: [1, 2], g1: [2, 3], g2: [3, 4], g3: [4, 5] },
  draw:    { prek: [1, 1], k: [1, 2], g1: [2, 3], g2: [3, 4], g3: [4, 4] },
};
// Show all games lifts the top of the range but keeps the grade's starting level
const gameRange = (id) => { const r = state.grade && GAME_GRADES[id] && GAME_GRADES[id][state.grade]; return !r ? null : state.showAll ? [r[0], id === 'sudoku' ? 5 : GAME_MAX[id] || r[1]] : r; };
const clampGame = (id, lv) => { const r = gameRange(id); return r ? Math.min(r[1], Math.max(r[0], lv)) : lv; };
const gameCap = (id) => { const r = gameRange(id); return r ? r[1] : (id === 'sudoku' ? 5 : GAME_MAX[id] || 1); };
// levels shown on Home: kept here so the games file does not have to load first
const sdkLevel = () => clampGame('sudoku', state.sdkLevel || (gameRange('sudoku') || [1])[0]);
const colorLevel = () => 1;
function GL(id) {
  if (id === 'maze' && state.gameLv && state.gameLv.maze == null && state.gameLv.ball > 1 && !state.ball3d) { state.gameLv.maze = state.gameLv.ball; state.gameLv.ball = 1; state.ball3d = true; }
  if (id === 'sudoku') return sdkLevel();
  if (id === 'color') return colorLevel();
  const saved = state.gameLv && state.gameLv[id];
  const r = gameRange(id);
  return clampGame(id, saved || (r ? r[0] : 1));
}
function gameLevelUp(id, needWins = 1) {
  if (isTestMode()) return false; // QA runs do not mutate earned levels or rewards
  state.gameLv = state.gameLv || {}; state.gameWins = state.gameWins || {};
  state.gameWins[id] = (state.gameWins[id] || 0) + 1;
  if (brainMode && BRAIN_GAME_IDS.has(id) && typeof logBrainWin === 'function') logBrainWin(id);
  const lv = GL(id);
  let up = false;
  if (lv < gameCap(id) && state.gameWins[id] % needWins === 0) { state.gameLv[id] = lv + 1; up = true; }
  save(); renderPZ();
  return up;
}
// dots show the step inside the child's grade range for that game
const gameStepDots = (id) => { const r = gameRange(id), lv = GL(id); if (!r) return gameDots(lv, GAME_MAX[id] || 5); const n = r[1] - r[0] + 1, s = Math.min(n, lv - r[0] + 1); return `<span class="lv steps" aria-label="Step ${s} of ${n}">${'●'.repeat(s)}${'○'.repeat(n - s)}</span>`; };
const lvBadge = (id) => (GAME_MAX[id] || id === 'sudoku' ? gameStepDots(id) : '');
function renderPZ() {
  $('#pzGrid').innerHTML = GAMES.filter((g) => !BRAIN_GAME_IDS.has(g.id) && gameForGrade(g)).map((g) =>
    `<button class="tile pz-tile" data-game="${g.id}" style="--c:${g.color}">${lvBadge(g.id)}<span class="ti">${g.icon}</span><span class="tt">${g.title}</span></button>`).join('');
}

$('#pzGrid').addEventListener('click', (e) => {
  const t = e.target.closest('[data-game]'); if (!t) return;
  sfx.tap(); openGame(t.dataset.game);
});
$('#pzHome').onclick = () => { sayToken++; stopClip(); renderHome(); show('home'); };
// Full screen: the browser's own full screen where it exists (iPad, desktop); otherwise a roomier layout

// shared with games-play.js (loaded the first time a game opens): which game is running, and how to clean it up
let curGame = null, gameCleanup = null, gameCleanupPanel = null;
