// Adventure games inside rounds: a treasure map with spoken clues, a shop, and paying the shopkeeper on the next card.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    // ---- the levels are data; every line they can say is recorded; they appear in the right sections and grades
    const set = await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.voice = true; state.testMode = false; state.country = 'us';
      const all = [...QuestionBank.questions({ section: 'add' }), ...QuestionBank.questions({ section: 'maps' }), ...QuestionBank.questions({ section: 'pattern' })].filter((q) => /^games\./.test(q.id)), bad = [];
      for (const q of all) { const c = BankCards.card(q); if (!CoreVoice.canSay(c.say) || !CoreVoice.canSay(c.hint.say)) bad.push(q.id); }
      const lines = ['north', 'south', 'east', 'west'].map((d) => `Go ${d}.`).concat(Object.values(AdventurePlay.MAPS).flatMap((m) => Object.keys(m.places).map((x) => `Go to the ${x}.`)), ['Check your list.', 'Pay the shopkeeper!', 'That is not enough yet.', 'That is too much.', 'Add coins until you have the right amount.']);
      const seen = {}; for (const [g, id, lv] of [['prek', 'pattern', 1], ['prek', 'add', 1], ['k', 'maps', 1], ['g1', 'add', 3], ['g2', 'maps', 2], ['g3', 'add', 7]]) { state.grade = g; const c = CATEGORIES.find((x) => x.id === id), kinds = new Set();
        for (let i = 0; i < 200; i++) { const q = c.gen(lv); if (q.activity) kinds.add(q.activity.kind + (q.activity.clues ? ':' + q.activity.clues : '') + (q.activity.pay ? ':pay' : '')); } seen[g + ' ' + id] = [...kinds].join(); }
      return { n: all.length, bad, unrecorded: [...new Set(lines)].filter((t) => !CoreVoice.canSay(t)), seen }; });
    assert.equal(set.n, 27); assert.deepEqual(set.bad, []); assert.deepEqual(set.unrecorded, []);
    assert.deepEqual(set.seen, { 'prek pattern': 'treasure-map:places', 'prek add': 'shop', 'k maps': 'treasure-map:places', 'g1 add': 'shop:pay', 'g2 maps': 'treasure-map:compass', 'g3 add': 'shop:pay' });
    const ask = (id, grade, sec) => p.evaluate(([id, grade, sec]) => { state.grade = grade; TeachFirst.run++; startRound(sec, 5, true); const q = BankCards.card(QuestionBank.question(id)); q.tries = 0; q.cat = R.cat; q.level = 1; q.grades = [grade]; R.qs[R.i] = q; R.locked = false; renderQ(); return R.qs.length; }, [id, grade, sec]);
    // ---- treasure map: a wrong place is a try, each right place walks on to the next clue, the last one opens the chest
    for (const [id, grade, sec, mode, steps] of [['games.treasure.park.pattern1.prek', 'prek', 'pattern', 'places', 2], ['games.treasure.island.maps3.g2-g3', 'g3', 'maps', 'compass', 5]]) {
      await ask(id, grade, sec); await p.waitForSelector('.adv-map');
      const t = await p.evaluate(() => { const g = window.__adventure, q = R.qs[R.i], out = { mode: g.mode, steps: g.steps.length, clues: [], results: [] };
        const wrong = g.places.find((x) => x !== g.start && x !== g.steps[0].to); out.wrong = g.go(wrong); out.tries = q.tries; out.stayed = g.at() === g.start; out.self = g.go(g.start);
        for (const s of g.steps) { out.clues.push(g.clue()); out.results.push(g.go(s.to)); }
        out.compassOk = g.mode !== 'compass' || g.steps.every((s, i) => g.next[i ? g.steps[i - 1].to : g.start][s.dir] === s.to);
        return { ...out, end: g.at() === g.steps.at(-1).to, done: g.done(), chest: !document.querySelector('.adv-chest').hidden, rose: !!document.querySelector('.adv-rose') }; });
      assert.equal(t.mode, mode); assert.equal(t.steps, steps); assert.deepEqual([t.wrong, t.tries, t.stayed, t.self], ['wrong', 1, true, 'here']);
      assert.deepEqual(t.results, [...Array(steps - 1).fill('step'), 'treasure']); assert.ok(t.clues.every((c) => (mode === 'compass' ? /^Go (north|south|east|west)\.$/ : /^Go to the \w+\.$/).test(c)), t.clues.join(' | '));
      assert.ok(t.compassOk && t.end && t.done && t.chest); assert.equal(t.rose, mode === 'compass');
      await p.waitForFunction(() => R.locked, null, { timeout: 4000 });
    }
    // a real tap on the map walks the explorer
    await ask('games.treasure.farm.maps1.k', 'k', 'maps'); await p.waitForSelector('.adv-map');
    await p.click(`.adv-place[data-place="${await p.evaluate(() => window.__adventure.steps[0].to)}"]`);
    assert.equal(await p.evaluate(() => window.__adventure.at() === window.__adventure.steps[0].to), true);
    // ---- the shop (no prices): the basket must match the list exactly
    await ask('games.shop.add1.k', 'k', 'add'); await p.waitForSelector('.shop-shelf');
    const s1 = await p.evaluate(() => { const g = window.__adventure, q = R.qs[R.i], n0 = R.qs.length, items = Object.keys(g.list), extra = g.shelf.find((x) => !g.list[x]);
      g.add(extra); const r1 = g.checkout(), tries = q.tries, flagged = document.querySelectorAll('.shop-row.off').length; g.take(extra);
      for (const it of items) for (let k = 0; k < g.list[it]; k++) g.add(it);
      const ticks = document.querySelectorAll('.shop-row.ok').length, r2 = g.checkout();
      return { kinds: items.length, max: Math.max(...Object.values(g.list)), prices: document.querySelectorAll('.shop-item small').length, r1, tries, flagged, ticks, r2, locked: R.locked, added: R.qs.length - n0 }; });
    assert.equal(s1.kinds, 2); assert.ok(s1.max <= 3); assert.equal(s1.prices, 0);
    assert.deepEqual({ r1: s1.r1, tries: s1.tries, flagged: s1.flagged, ticks: s1.ticks, r2: s1.r2, locked: s1.locked, added: s1.added }, { r1: 'wrong', tries: 1, flagged: 2, ticks: 2, r2: 'done', locked: true, added: 0 });
    // ---- with prices, the next card is the till: pay the total in her own country's coins
    for (const [country, coin] of [['us', /\d+¢/], ['in', /₹\d+/], ['uk', /\d+p/]]) {
      await p.evaluate((c) => { state.country = c; }, country);
      await ask('games.shop.add3.g1', 'g1', 'add'); await p.waitForSelector('.shop-shelf');
      const shop = await p.evaluate(() => { const g = window.__adventure, n0 = R.qs.length; for (const it of Object.keys(g.list)) for (let k = 0; k < g.list[it]; k++) g.add(it);
        return { tags: [...document.querySelectorAll('.shop-item small')].map((x) => x.textContent), r: g.checkout(), added: R.qs.length - n0, next: R.qs[R.i + 1] && R.qs[R.i + 1].activity.kind, total: g.total }; });
      assert.ok(shop.tags.length >= 3 && shop.tags.every((t) => coin.test(t)), country + ' price tags: ' + shop.tags); assert.deepEqual([shop.r, shop.added, shop.next], ['pay next', 1, 'shop-pay']);
      await p.waitForSelector('.adv-pay', { timeout: 15000 });
      const pay = await p.evaluate(() => { const g = window.__adventure, q = R.qs[R.i], out = { total: g.total, text: document.getElementById('qText').textContent, bill: document.querySelector('.pay-total').textContent, coins: document.querySelectorAll('.pay-purse .pay-coin img').length };
        out.short = g.payNow(); g.give(g.purse[0]); for (let k = 0; k < 13; k++) g.give(g.purse.at(-1)); out.over = g.sum() > g.total ? g.payNow() : 'over'; while (g.sum()) g.back(0);
        let left = g.total; for (const v of g.purse.slice().reverse()) while (left >= v) { g.give(v); left -= v; }
        out.sum = g.sum(); out.shown = document.querySelector('.pay-sum').textContent; out.paid = g.payNow(); out.tries = q.tries; out.locked = R.locked; return out; });
      assert.equal(pay.total, shop.total); assert.match(pay.text, /Pay the shopkeeper/); assert.ok(coin.test(pay.bill) && coin.test(pay.shown), country + ': ' + pay.bill + ' / ' + pay.shown); assert.ok(pay.coins >= 1);
      assert.deepEqual({ short: pay.short, over: pay.over, sum: pay.sum, paid: pay.paid, tries: pay.tries, locked: pay.locked }, { short: 'short', over: 'over', sum: pay.total, paid: 'paid', tries: 2, locked: true });
    }
    assert.deepEqual(errors, []);
    console.log('PASS adventure games: 27 levels as data, treasure map with place and compass clues, shop with an exact basket, then paying the shopkeeper in US, Indian and UK coins on the next card');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
