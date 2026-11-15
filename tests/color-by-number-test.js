// Color by Number, drawings and coloring that save themselves, and a maze with real wrong turns.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording|hook for/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/?lazy=1'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = 'k'; state.playAlways = true; state.voice = true; state.testMode = false; state.cbn = {}; state.colored = []; state.art = {}; state.drawings = []; openGame('color'); });
    await p.waitForSelector('.pic-pick[data-n]', { timeout: 20000 });
    // ---- the pages and the sums each grade gets
    const r = await p.evaluate(() => {
      const out = { bad: [], pages: CBN_PAGES.map((x) => x.id) };
      out.firstGroup = document.querySelector('.pic-group').textContent.replace(/[^A-Za-z ]/g, '').trim();
      const value = (s) => { const m = /^(\d+)([+−×÷])(\d+)$/.exec(s); if (!m) return /^\d+$/.test(s) ? { v: +s, op: '', a: +s, b: 0 } : null; const a = +m[1], c = +m[3]; return { v: m[2] === '+' ? a + c : m[2] === '−' ? a - c : m[2] === '×' ? a * c : a / c, op: m[2], a, b: c }; };
      for (const pg of CBN_PAGES) {
        const regions = (pg.svg.match(/class="r"/g) || []).length;
        if (regions !== pg.paint.length || regions < 30) out.bad.push(`${pg.id}: ${regions} segments, ${pg.paint.length} colours listed (30 or more wanted)`);
        if (pg.colors.length > 8 || pg.paint.some((c) => !pg.colors[c])) out.bad.push(pg.id + ': colours');
        if (/transform|<script|href|<image/.test(pg.svg)) out.bad.push(pg.id + ': must be plain self-contained shapes');
        for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) {
          const plan = cbnPlan(pg, g), again = cbnPlan(pg, g), rule = CBN_RULES[g];
          if (JSON.stringify(plan) !== JSON.stringify(again)) out.bad.push(`${pg.id} ${g}: the sums change between visits`);
          if (new Set(plan.values).size !== pg.colors.length || !plan.values.every((v) => rule.values.includes(v))) out.bad.push(`${pg.id} ${g}: each colour needs its own answer`);
          plan.sums.forEach((s, i) => { const x = value(s), want = plan.values[pg.paint[i]];
            if (!x || x.v !== want) out.bad.push(`${pg.id} ${g}: ${s} is not ${want}`);
            else if (g === 'prek' && x.op) out.bad.push(`${pg.id} prek: ${s} should be a plain number`);
            else if ((g === 'k' || g === 'g1') && (!/[+−]/.test(x.op) || x.a > rule.max || x.b > rule.max || x.b < 1)) out.bad.push(`${pg.id} ${g}: ${s} is outside the grade`);
            else if (g === 'g3' && !/[×÷]/.test(x.op)) out.bad.push(`${pg.id} g3: ${s} should multiply or divide`); });
          for (const [i, v] of plan.values.entries()) if (!CoreVoice.canSay([`${v}`, 'is', `${pg.colors[i][1]}.`])) out.bad.push(`${pg.id} ${g}: "${v} is ${pg.colors[i][1]}" is not recorded`);
        }
      }
      for (const t of ['Color by number! Work out each one, then paint it with its color.', 'Pick another color!', 'Oops, a dead end! Go back and try another way.', 'Beautiful picture!']) if (!CoreVoice.canSay(t)) out.bad.push('not recorded: ' + t);
      return out;
    });
    assert.equal(r.firstGroup, 'Color by Number'); assert.equal(r.pages.length, 6); assert.deepEqual([...new Set(r.bad)].slice(0, 10), []);
    // ---- every segment has room for its sum, clear of the drawn details
    for (const id of r.pages) {
      const room = await p.evaluate((id) => { startColorPicker(); document.querySelector(`.pic-pick[data-n="${id}"]`).click(); const c = window.__cbn;
        return { n: c.spots.length, labels: document.querySelectorAll('.cbn-labels text').length, tight: c.spots.map((s, i) => [i, +s.r.toFixed(1)]).filter((x) => x[1] < 5.5) }; }, id);
      assert.deepEqual(room.tight, [], id + ': segments with too little room for a sum'); assert.equal(room.labels, room.n, id + ': a sum in every segment');
    }
    // ---- play: the wrong colour does nothing, the right colour fills and is saved
    await p.evaluate(() => { startColorPicker(); document.querySelector('.pic-pick[data-n="cbn-rocket"]').click(); });
    assert.equal(await p.locator('.cb-done').count(), 0, 'no done button');
    const first = await p.evaluate(() => { const c = window.__cbn, right = c.page.paint[0], wrong = (right + 1) % c.page.colors.length;
      document.querySelector(`.cbn-sw[data-c="${wrong}"]`).click(); document.querySelector('.color-wrap .r[data-k="0"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const afterWrong = { saved: Object.keys(state.cbn['cbn-rocket']).length, fill: document.querySelector('.color-wrap .r[data-k="0"]').style.fill };
      document.querySelector(`.cbn-sw[data-c="${right}"]`).click(); document.querySelector('.color-wrap .r[data-k="0"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return { afterWrong, saved: state.cbn['cbn-rocket'][0], labelHidden: document.querySelector('.cbn-labels text[data-k="0"]').hasAttribute('hidden'), count: document.querySelector('.cbn-count').textContent, stored: JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; });
    assert.equal(first.afterWrong.saved, 0); assert.match(first.afterWrong.fill, /255, 255, 255|#fff/i);
    assert.equal(first.saved, 1); assert.ok(first.labelHidden); assert.equal(first.count, '1 / 32');
    assert.match(JSON.stringify(first.stored), /cbn-rocket/, 'saved without pressing anything');
    const finish = await p.evaluate(() => { startColorPicker(); document.querySelector('.pic-pick[data-n="cbn-rocket"]').click(); const c = window.__cbn;
      const kept = document.querySelector('.color-wrap .r[data-k="0"]').style.fill !== 'rgb(255, 255, 255)';
      c.page.paint.forEach((col, i) => { document.querySelector(`.cbn-sw[data-c="${col}"]`).click(); document.querySelector(`.color-wrap .r[data-k="${i}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      return { kept, colored: state.colored.includes('cbn-rocket'), count: document.querySelector('.cbn-count').textContent, labelsLeft: document.querySelectorAll('.cbn-labels text:not([hidden])').length }; });
    assert.deepEqual(finish, { kept: true, colored: true, count: '32 / 32', labelsLeft: 0 });
    // ---- free coloring: no done button, a finished picture is marked by itself
    const free = await p.evaluate(() => { const pic = ALL_PICS.find((x) => x.id === 'flag-ca'); startColoring(pic);
      const done = document.querySelectorAll('.cb-done, [data-a="done"]').length;
      document.querySelectorAll('.color-wrap .r').forEach((reg) => reg.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      return { done, colored: state.colored.includes('flag-ca'), parts: Object.keys(state.art['flag-ca']).length }; });
    assert.deepEqual(free, { done: 0, colored: true, parts: 5 });
    // ---- drawings save themselves
    await p.evaluate(() => { openGame('draw'); document.querySelector('#gameArea [data-a="surprise"]').click(); });
    await p.waitForFunction(() => !!window.__draw);
    assert.equal(await p.locator('#gameArea .cb-done, #gameArea [data-a="done"]').count(), 0, 'no save button on the drawing pad');
    const wins = await p.evaluate(() => { const w = (state.gameWins || {}).draw || 0; window.__draw.add([[40, 40], [120, 90], [200, 60]]); return w; });
    await p.waitForFunction(() => (state.drawings || []).some((d) => d.id === window.__draw.entryId), null, { timeout: 5000 });
    await p.evaluate(() => { for (let i = 0; i < 4; i++) window.__draw.add([[30 + i * 20, 200], [80 + i * 20, 240]]); window.__draw.saveNow(); window.__draw.add([[10, 10], [20, 20]]); window.__draw.saveNow(); });
    const drawn = await p.evaluate((wins) => ({ entries: state.drawings.filter((d) => d.id === window.__draw.entryId).length, isImage: /^data:image\/jpeg/.test(state.drawings[0].img), counted: (state.gameWins.draw || 0) - wins }), wins);
    assert.deepEqual(drawn, { entries: 1, isImage: true, counted: 1 }, 'one drawing, saved as a picture, counted once');
    await p.evaluate(() => { document.querySelector('#gameArea [data-t="clear"]').click(); window.__draw.saveNow(); });
    assert.equal(await p.evaluate(() => state.drawings.filter((d) => d.id === window.__draw.entryId).length), 0, 'an emptied pad leaves nothing behind');
    // ---- the finger maze: one way through, real wrong turns, and the way back
    for (const lv of [1, 3, 6]) {
      const maze = await p.evaluate((lv) => { state.gameLv = { ...(state.gameLv || {}), path: lv }; openGame('path'); const m = window.__pathMaze, W = m.walls(), route = m.route(), on = new Set(route.map((x) => x.join()));
        const D = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] }; let side = null;
        // walk off the route at the first fork, to the end of that side path
        for (const [c, rr] of route) { for (const [d, [dx, dy]] of Object.entries(D)) if (!W[rr][c][d] && !on.has([c + dx, rr + dy].join())) { side = [[c, rr], [c + dx, rr + dy]]; break; } if (side) break; }
        const upTo = route.slice(0, route.findIndex((x) => x.join() === side[0].join()) + 1);
        let at = side[1]; const seen = new Set([side[0].join(), at.join()]), trail = [at];
        for (;;) { const next = Object.entries(D).map(([d, [dx, dy]]) => (!W[at[1]][at[0]][d] ? [at[0] + dx, at[1] + dy] : null)).filter((x) => x && !seen.has(x.join()))[0]; if (!next) break; seen.add(next.join()); trail.push(next); at = next; }
        m.go([...upTo.slice(1), ...trail]);
        const lost = { done: m.done(), head: m.path().pop().join(), end: at.join() };
        m.go(route);                                           // back along her own path, then the right way
        return { turns: m.wrongTurns(), cells: W.length * W[0].length, route: route.length, lost, done: m.done() }; }, lv);
      assert.ok(maze.turns.filter((n) => n >= 2).length >= 2, `level ${lv}: needs at least two real wrong turns, got ${maze.turns}`);
      assert.ok(maze.route < maze.cells * 0.75, `level ${lv}: the way through should not fill the maze`);
      assert.equal(maze.lost.done, false); assert.equal(maze.lost.head, maze.lost.end, 'she can walk to the end of a wrong path');
      assert.equal(maze.done, true, 'and still find the way back');
    }
    const circ = await p.evaluate(() => { openGame('path'); startCircularMaze(9); const m = window.__pathMaze; return { circular: !!m.circular, turns: m.wrongTurns ? m.wrongTurns() : null }; });
    assert.ok(circ.circular && circ.turns >= 2, 'the circular maze has wrong turns too: ' + JSON.stringify(circ));
    assert.deepEqual(errors, []);
    console.log('PASS color by number: 6 pages, right sums for 5 grades, room for every sum, saves by itself; drawings and coloring need no button; mazes have real wrong turns');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
