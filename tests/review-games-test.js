// Game fixes from the Pre-K review: number balloons, number blocks in Ball Maze, Tap the Mole ends at its target,
// a gentle Four in a Row robot, small first puzzles, and a parent's gift of play time.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = 'prek'; state.playAlways = true; state.testMode = false; state.voice = true; state.gameLv = {}; state.gameWins = {}; openGame('pop'); });
    // ---- balloons carry numbers; only the asked number pops (with treats), any other bounces and costs nothing
    await p.waitForFunction(() => window.__pop && window.__pop.balloons().some((x) => x.n === window.__pop.ask() && x.y < 700) && window.__pop.balloons().some((x) => x.n !== window.__pop.ask() && x.y < 700), null, { timeout: 30000 });
    const pop = await p.evaluate(() => { const g = window.__pop, ask = g.ask(), all = g.balloons(), other = all.find((x) => x.n !== ask), right = all.find((x) => x.n === ask);
      const r1 = g.tapAt(other.x, other.y), s1 = g.score(), n1 = g.balloons().length, r2 = g.tapAt(right.x + right.r * 1.1, right.y), r3 = g.tapAt(-500, -500);
      return { ask, max: Math.max(...all.map((x) => x.n)), r1, s1, kept: n1 === all.length, r2, score: g.score(), treats: g.treats(), r3, head: document.querySelector('.g-msg').textContent, said: CoreVoice.canSay(['Pop the number', String(ask)]) }; });
    assert.ok(pop.ask >= 1 && pop.ask <= 5 && pop.max <= 5, 'Pre-K numbers are 1 to 5');
    assert.deepEqual({ r1: pop.r1, s1: pop.s1, kept: pop.kept }, { r1: 'bounce', s1: 0, kept: true }, 'a wrong balloon bounces and stays');
    assert.equal(pop.r2, 'pop', 'a tap near the edge of the right balloon still pops it'); assert.equal(pop.score, 1); assert.ok(pop.treats >= 5, 'treats burst out'); assert.equal(pop.r3, 'miss');
    assert.match(pop.head, /Pop the number \d/); assert.ok(pop.said);
    // a real tap on the canvas pops a balloon
    const at = await p.evaluate(() => { const g = window.__pop, bl = g.balloons().find((x) => x.n === g.ask() && x.y > 80 && x.y < 600), r = document.querySelector('.pop-cv').getBoundingClientRect(); return bl && { x: r.left + bl.x, y: r.top + bl.y - 4, s: g.score() }; });
    if (at) { await p.mouse.click(at.x, at.y); assert.equal(await p.evaluate(() => window.__pop.score()), at.s + 1, 'a finger tap pops it'); }
    // ---- Ball Maze: number blocks; the asked ones crush, the others bounce, and the flag waits for them
    await p.evaluate(() => openGame('maze')); await p.waitForFunction(() => !!window.__ballMaze);
    const mz = await p.evaluate(async () => { const m = window.__ballMaze, wait = (ms) => new Promise((r) => setTimeout(r, ms)), mine = m.blocks.filter((x) => x.n === m.ask), other = m.blocks.find((x) => x.n !== m.ask);
      const out = { blocks: m.blocks.length, mine: mine.length, left0: m.left(), walls: MAZES[0].walls.length };
      m.ball.x = other.x; m.ball.y = other.y + 0.9; m.ball.vx = 0; m.ball.vy = -3; await wait(500); out.otherStays = !other.gone; out.bounced = m.ball.y > other.y + 0.9;
      for (const bl of mine) { m.ball.x = bl.x; m.ball.y = bl.y + 0.9; m.ball.vx = 0; m.ball.vy = -3; await wait(450); }
      out.left = m.left(); out.head = document.querySelector('.mz-ask').className; out.said = CoreVoice.canSay(['Crush the number', String(m.ask), 'Then roll the ball to the flag!']); return out; });
    assert.ok(mz.blocks >= 5 && mz.mine >= 3 && mz.left0 === mz.mine); assert.ok(mz.walls >= 2, 'the first maze has walls');
    assert.ok(mz.otherStays && mz.bounced, 'another number bounces the ball back'); assert.equal(mz.left, 0); assert.match(mz.head, /done/); assert.ok(mz.said);
    // ---- Tap the Mole: reaching the target ends the round with a cheer
    await p.evaluate(() => openGame('whack')); await p.waitForSelector('.wm-score');
    const target = await p.evaluate(() => +document.querySelector('.wm-hud').textContent.match(/\/\s*(\d+)/)[1]);
    for (let n = 0; n < target; n++) { await p.waitForSelector('.wm-hole.up:not(.flower), .hole.up', { timeout: 15000 }); await p.evaluate(() => (document.querySelector('.wm-hole.up:not(.flower)') || document.querySelector('.hole.up')).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await p.waitForTimeout(250); }
    await p.waitForSelector('.wm-final', { timeout: 5000 });
    assert.match(await p.textContent('.wm-final h2'), /caught them all/);
    // ---- Four in a Row, Pre-K level 1: the robot never finishes four while it has another move, and does not block
    await p.evaluate(() => openGame('c4')); await p.waitForSelector('.c4-drop');
    const c4 = await p.evaluate(async () => { const d = [...document.querySelectorAll('.c4-drop')], wait = (ms) => new Promise((r) => setTimeout(r, ms));
      // stack one column; if the robot happens to land on it, start another
      const mine = (c) => { let n = 0; for (let r = 0; r < 6; r++) { const el = document.querySelector(`.c4-cell[data-r="${r}"][data-c="${c}"]`); if (el.classList.contains('me')) n++; else if (el.classList.contains('bot')) return -1; else n = n; } return n; };
      const topIsMine = (c) => { for (let r = 0; r < 6; r++) { const el = document.querySelector(`.c4-cell[data-r="${r}"][data-c="${c}"]`); if (el.classList.contains('me')) return true; if (el.classList.contains('bot')) return false; } return true; };
      for (let k = 0; k < 20 && !document.querySelector('.c4-cell.win'); k++) { const c = [0, 1, 2, 3, 4, 5, 6].filter(topIsMine).sort((a, b2) => mine(b2) - mine(a))[0]; d[c].click(); await wait(1700); }
      return { winMine: Math.min(4, document.querySelectorAll('.c4-cell.win.me').length), robotWon: document.querySelectorAll('.c4-cell.win.bot').length }; });
    assert.deepEqual(c4, { winMine: 4, robotWon: 0 }, 'the child gets four: the playmate robot does not block or win');
    // ---- Picture Puzzle: Pre-K starts with 4 pieces, then 9
    // the puzzle grows two wins at a time, and turned pieces arrive one by one only after the full size is mastered
    assert.deepEqual(await p.evaluate(() => { const at = (g, w) => { state.grade = g; state.puzzleSolved = w; return [puzzleSize(), puzzleTurned()]; };
      const out = [at('prek', 0), at('prek', 2), at('prek', 40), at('k', 0), at('k', 1), at('k', 2), at('k', 3), at('k', 4), at('k', 6), at('k', 40), at('g3', 0), at('g3', 6), at('g3', 8), at('g3', 60)];
      state.grade = 'k'; state.puzzleSolved = 6; state.playAlways = true; openGame('puzzle'); startPuzzle(ALL_PICS[0]); const turned = document.querySelectorAll('#gameArea .pzl-tile [style*="rotate("]').length;
      state.grade = 'prek'; state.puzzleSolved = 0; state.gameWins = {}; return JSON.stringify(out); }), JSON.stringify([[2, 0], [3, 0], [3, 0], [3, 0], [3, 0], [4, 0], [4, 0], [4, 1], [4, 2], [4, 5], [3, 0], [6, 0], [6, 1], [6, 11]]));
    // ---- parent mode: a gift of play time
    const gift = await p.evaluate(() => { state.playAlways = false; state.playMode = 'earn'; state.playRemainingMs = 0; const closed = !playOpen(); openParentPlay(); document.querySelector('[data-gift="10"]').click();
      const out = { closed, ms: state.playRemainingMs, open: playOpen(), text: document.querySelector('.pz-gift-now').textContent, logged: state.playGifts.at(-1).minutes };
      state.playMode = 'hourly'; state.playHourEarned = null; state.playUsed = null; const hClosed = !playOpen(); giftPlay(5); out.hourly = { hClosed, open: playOpen(), left: Math.round(hourLeftMs() / 60000) - perHour() }; state.playMode = 'earn'; return out; });
    assert.deepEqual(gift, { closed: true, ms: 600000, open: true, text: 'Added 10 minutes. Now: 10:00', logged: 10, hourly: { hClosed: true, open: true, left: 5 } });
    assert.deepEqual(errors, []);
    console.log('PASS review games: number balloons with treats, number blocks in Ball Maze, Tap the Mole ends at its target, playmate robot, small Pre-K puzzles, gift of play time');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
