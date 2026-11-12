// Pre-K and Kindergarten: Big & Small (bigger, smallest, taller, longer, heavier), Liquid or Solid?, and a picture on every card.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording|hook for/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const r = await p.evaluate(() => {
      document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.voice = true; state.testMode = false; state.country = 'us';
      const out = { ranges: {}, bad: [], rounds: {}, bare: [], kinds: {} };
      const M = ContentData.get('early', 'matter'), isLiquid = new Set(M.liquid.map((x) => x[0])), plain = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const said = (s) => [].concat(s).every((t) => CoreVoice.canSay(t));
      const num = (html, re) => +(re.exec(html) || [])[1];
      for (const g of ['prek', 'k', 'g1']) { state.grade = g; out.ranges[g] = { size: gradeRange(g, 'size') || null, matter: gradeRange(g, 'matter') || null }; }
      for (const g of ['prek', 'k']) for (const id of ['size', 'matter']) { state.grade = g; const cat = CATEGORIES.find((c) => c.id === id), range = gradeRange(g, id);
        for (let lv = range[0]; lv <= range[1]; lv++) { const seen = new Set();
          for (let i = 0; i < 300; i++) { const q = cat.gen(lv), where = `${g} ${id}:${lv} ${q.key}`; seen.add(q.key);
            if (q.options.filter((o) => o.v === q.answer).length !== 1 || new Set(q.options.map((o) => o.v)).size !== q.options.length) out.bad.push(where + ' options');
            if (!gradeFits(q, g, id)) out.bad.push(where + ' does not fit the grade');
            if (!said(q.say) || !said(q.hint.say)) out.bad.push(where + ' not recorded');
            if (!EarlyPictures.has(q)) out.bad.push(where + ' has no picture');
            const right = q.options.find((o) => o.v === q.answer), others = q.options.filter((o) => o !== right), want = plain(q.text);
            if (id === 'size' && !/heav|light/.test(want)) { const re = /--sz:([\d.]+)/.test(right.html) ? /--sz:([\d.]+)/ : /--w:(\d+)%/, a = num(right.html, re);
              const big = /bigg|tall|long/.test(want); if (!others.every((o) => (big ? a > num(o.html, re) * 1.25 : a * 1.25 < num(o.html, re)))) out.bad.push(where + ' wrong or unclear size'); }
            if (id === 'size' && /heav|light/.test(want)) { const m = /^size-heavy-(.+?)-(.+?)-(heavier|lighter)$/.exec(q.key); if (!right.html.includes(m[3] === 'heavier' ? m[1] : m[2])) out.bad.push(where + ' wrong weight'); }
            if (/^matter-sort-/.test(q.key) && (q.answer === 'liquid') !== isLiquid.has(q.key.slice(12))) out.bad.push(where + ' wrong kind');
            if (/^matter-find-/.test(q.key) && (/-find-liquid-/.test(q.key)) !== isLiquid.has(q.answer)) out.bad.push(where + ' wrong pick');
          }
          out.kinds[`${g} ${id}:${lv}`] = seen.size;
          state.levels = { [id]: lv }; state.recent = {}; state.recentContent = {}; startRound(id, 5, false, lv); out.rounds[`${g} ${id}:${lv}`] = R.qs.filter((q) => q.level === lv).length; document.querySelector('#quitBtn').click(); } }
      // every Pre-K and Kindergarten card, in every section, has a picture once the round builder has seen it
      let total = 0, added = 0;
      for (const g of ['prek', 'k']) { state.grade = g;
        for (const c of CATEGORIES.filter((x) => x.gen && !['mix', 'placement', 'check'].includes(x.id))) { const range = gradeRange(g, c.id); if (!range) continue;
          for (let lv = range[0]; lv <= range[1]; lv++) for (let i = 0, n = 0; i < 500 && n < 120; i++) { let q; try { q = c.gen(lv); } catch { continue; } if (!q || !gradeFits(q, g, c.id)) continue; n++; total++;
            EarlyPictures.add(q); if (q.earlyPic) added++;
            if (!EarlyPictures.has(q)) out.bare.push(`${g} ${c.id}:${lv} ${plain(q.text)} | ${plain(q.main)}`);
            const pic = /class="ep-pic">([^<]+)</.exec(q.main || '');
            if (pic && (q.options || []).some((o) => String(o.html).includes(pic[1]))) out.bad.push(q.key + ' picture repeats a choice'); } } }
      out.total = total; out.added = added;
      // a real round carries the pictures
      state.grade = 'k'; state.levels = { sub: 2 }; state.recent = {}; state.recentContent = {}; startRound('sub', 5, false, 2);
      out.roundBare = R.qs.filter((q) => !EarlyPictures.has(q)).map((q) => q.key); document.querySelector('#quitBtn').click();
      // 1st grade cards are left alone
      state.grade = 'g1'; const q1 = { key: 'add-4-5', main: '<div class="equation">4 + 5</div>', options: [] }; if (EarlyPictures.forGrade('g1')) out.bad.push('1st grade should not be illustrated');
      out.games = GAMES.map((x) => x.title);
      return out;
    });
    assert.deepEqual(r.ranges, { prek: { size: [1, 2], matter: [1, 1] }, k: { size: [2, 3], matter: [1, 2] }, g1: { size: null, matter: null } });
    assert.deepEqual(r.bad.slice(0, 8), []);
    for (const [k, n] of Object.entries(r.rounds)) assert.equal(n, 5, k + ' gives a full round of its own cards');
    for (const [k, n] of Object.entries(r.kinds)) assert.ok(n >= 25, k + ' has only ' + n + ' different cards');
    assert.deepEqual(r.bare.slice(0, 8), [], 'cards without a picture');
    assert.deepEqual(r.roundBare, []);
    assert.ok(r.added > 300, 'pictures were added to cards that had none: ' + r.added);
    assert.ok(!r.games.some((t) => /Connect Four|Connect 4|Whack-a-Mole/i.test(t)), 'game names that are trademarks: ' + r.games);
    assert.deepEqual(errors, []);
    console.log(`PASS early pictures: Big & Small and Liquid or Solid? fit Pre-K and K, are fully recorded, and all ${r.total} sampled Pre-K and K cards have a picture (${r.added} added)`);
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
