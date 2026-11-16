// Parent mode: behind the PIN, every game opens with no clock, and a grown-up is the other player.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = 'prek'; state.playAlways = false; state.playRemainingMs = 0; state.playPasses = 0; state.testMode = false; state.pinHash = pinHash('2468'); state.gameLv = {}; state.gameWins = {}; save(); renderHome(); });
    // ---- the button asks for the PIN first
    await p.click('#parentPlayBtn');
    assert.equal(await p.evaluate(() => !document.getElementById('pinSheet').hidden && !document.getElementById('playzone').classList.contains('active')), true, 'PIN comes first');
    for (const d of '1111') await p.click(`#pinPad button[data-k="${d}"]`);
    await p.waitForTimeout(400);
    assert.equal(await p.evaluate(() => document.getElementById('playzone').classList.contains('active')), false, 'a wrong PIN opens nothing');
    for (const d of '2468') await p.click(`#pinPad button[data-k="${d}"]`);
    await p.waitForFunction(() => document.getElementById('playzone').classList.contains('active'));
    const list = await p.evaluate(() => ({ title: document.getElementById('pzTitle').textContent, duo: [...document.querySelectorAll('.pz-tile.duo')].map((t) => t.dataset.game), all: document.querySelectorAll('.pz-tile').length, games: GAMES.length,
      clock: [...document.querySelectorAll('#playzone .play-clock')].every((c) => c.hidden), heads: [...document.querySelectorAll('.pz-head')].map((h) => h.textContent) }));
    assert.match(list.title, /Play Together/); assert.deepEqual(list.duo, ['ttt', 'c4', 'memory']); assert.equal(list.all, list.games, 'every game, though play time is not earned and she is in Pre-K');
    assert.ok(list.clock); assert.deepEqual(list.heads, ['Play against each other', 'Open a game for Maya']);
    // ---- Tic-Tac-Toe: two people take turns, no robot
    await p.click('.pz-tile[data-game="ttt"]'); await p.waitForSelector('.ttt-cell'); await p.waitForTimeout(1200);
    const ttt = await p.evaluate(async () => { const c = [...document.querySelectorAll('.ttt-cell')], msg = () => document.querySelector('.g-msg').textContent, out = { start: msg() };
      c[0].click(); out.afterKid = msg(); out.first = c[0].className; await new Promise((r) => setTimeout(r, 2500)); out.robotMoved = c.filter((x) => x.classList.contains('placed')).length !== 1;
      c[3].click(); out.second = c[3].className; out.afterGrown = msg(); c[1].click(); c[4].click(); c[2].click(); out.win = c.filter((x) => x.classList.contains('win')).length;
      out.lv = JSON.stringify(state.gameLv) + JSON.stringify(state.gameWins); return out; });
    assert.match(ttt.start, /Maya goes first/); assert.match(ttt.first, /mine/); assert.equal(ttt.robotMoved, false, 'no robot move'); assert.match(ttt.second, /bots/);
    assert.match(ttt.afterKid, /Grown-up's turn/); assert.match(ttt.afterGrown, /Maya's turn/); assert.equal(ttt.win, 3); assert.equal(ttt.lv, '{}{}', 'beating a parent is not a level');
    await p.waitForSelector('.end-panel'); assert.match(await p.textContent('.ep-title'), /You win/);
    // the grown-up can win too
    await p.click('.end-panel [data-a="again"]'); await p.waitForSelector('.ttt-cell:not(.placed)');
    await p.evaluate(() => { const c = [...document.querySelectorAll('.ttt-cell')]; for (const i of [0, 3, 1, 4, 8, 5]) c[i].click(); });
    await p.waitForSelector('.end-panel'); assert.match(await p.textContent('.ep-title'), /Grown-up wins/);
    await p.click('.end-panel [data-a="menu"]'); await p.waitForFunction(() => document.getElementById('playzone').classList.contains('active'));
    assert.equal(await p.evaluate(() => !!document.querySelector('.pz-tile.duo') && document.getElementById('timeUp').hidden), true, 'back to the parent list, no time-up');
    // ---- Four in a Row: open in Pre-K too, discs alternate
    await p.click('.pz-tile[data-game="c4"]'); await p.waitForSelector('.c4-drop');
    const c4 = await p.evaluate(async () => { const d = [...document.querySelectorAll('.c4-drop')]; d[0].click(); await new Promise((r) => setTimeout(r, 1500)); const n1 = document.querySelectorAll('.c4-cell.me, .c4-cell.bot').length;
      d[1].click(); const bot = document.querySelectorAll('.c4-cell.bot').length; const msg = document.querySelector('.g-msg').textContent;
      for (const c of [0, 1, 0, 1, 0]) d[c].click(); return { n1, bot, msg, win: document.querySelectorAll('.c4-cell.win').length }; });
    assert.deepEqual({ n1: c4.n1, bot: c4.bot }, { n1: 1, bot: 1 }); assert.match(c4.msg, /Maya's turn/); assert.ok(c4.win >= 4);
    await p.waitForSelector('.end-panel'); await p.click('.end-panel [data-a="menu"]');
    // ---- Memory Match: a match scores and keeps the turn, a miss passes it
    await p.click('.pz-tile[data-game="memory"]'); await p.waitForSelector('.mem-card');
    const mem = await p.evaluate(async () => { const cards = [...document.querySelectorAll('.mem-card')], face = (c) => c.style.getPropertyValue('--hue'), wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const on = () => document.querySelector('.duo-p.on').textContent, out = { start: on() };
      const a = cards[0], pair = cards.find((c) => c !== a && face(c) === face(a)), other = cards.find((c) => face(c) !== face(a));
      a.click(); other.click(); await wait(1100); out.afterMiss = on();
      a.click(); pair.click(); await wait(600); out.afterMatch = on();
      for (const c of cards) { if (c.classList.contains('done')) continue; const m = cards.find((x) => x !== c && !x.classList.contains('done') && face(x) === face(c)); c.click(); m.click(); await wait(500); }
      return out; });
    assert.match(mem.start, /Maya 0/); assert.match(mem.afterMiss, /Grown-up 0/); assert.match(mem.afterMatch, /Grown-up 1/, 'a match keeps the turn');
    await p.waitForSelector('.end-panel'); assert.match(await p.textContent('.ep-title'), /Grown-up wins 6 to 0/);
    await p.click('.end-panel [data-a="menu"]');
    // ---- a one-player game opens for the child with no clock and uses no play time
    await p.click('.pz-tile[data-game="pop"]'); await p.waitForTimeout(1500);
    assert.deepEqual(await p.evaluate(() => ({ game: document.getElementById('game').classList.contains('active'), timeUp: document.getElementById('timeUp').hidden, clock: [...document.querySelectorAll('#game .play-clock')].every((c) => c.hidden), ms: state.playRemainingMs || 0 })), { game: true, timeUp: true, clock: true, ms: 0 });
    // ---- leaving parent mode puts the child's rules back
    await p.click('#gameBack'); await p.click('#pzHome');
    const after = await p.evaluate(() => { openPlayZone(); const locked = !document.getElementById('playzone').classList.contains('active'); state.playAlways = true; openPlayZone();
      return { locked, parentMode, duo: document.querySelectorAll('.pz-tile.duo, .pz-head').length, title: document.getElementById('pzTitle').textContent, c4: !!document.querySelector('.pz-tile[data-game="c4"]') }; });
    assert.deepEqual(after, { locked: true, parentMode: false, duo: 0, title: '🎮 Play Zone', c4: true });
    await p.evaluate(() => openGame('ttt')); await p.waitForSelector('.ttt-cell');
    assert.match(await p.textContent('.g-msg'), /You are/, 'the robot is back in the Play Zone');
    assert.deepEqual(errors, []);
    console.log('PASS parent mode: behind the PIN, all games with no clock, two-player Tic-Tac-Toe, Four in a Row and Memory Match, child rules restored after');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
