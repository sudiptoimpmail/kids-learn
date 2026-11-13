// Format variants (variants.js) are correct cards: every match pairs distinct values with one right partner,
// fractions never pair two equal values, Pre-K picture sums never use 0, ordering cards are picture-only with
// the first picture placed, and keys change with content so rounds don't collapse to one card.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  const r = await p.evaluate(() => {
    const bad = [], seen = {}, txt = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.trim(); };
    const cases = [['prek', 'add', 1], ['k', 'add', 2], ['g3', 'add', 8], ['prek', 'sub', 1], ['g2', 'sub', 7], ['g2', 'mul', 1], ['g3', 'mul', 6],
      ['g2', 'div', 1], ['g3', 'div', 5], ['g1', 'clock', 2], ['g3', 'clock', 5], ['g1', 'flags', 2], ['k', 'flags', 1],
      ['g2', 'frac', 2], ['g3', 'frac', 4], ['prek', 'sequence', 1], ['g3', 'sequence', 3]];
    for (const [g, id, lv] of cases) {
      state.grade = g;
      const c = CATEGORIES.find((x) => x.id === id);
      let n = 0;
      for (let i = 0; i < 400; i++) {
        const q = c.gen(lv);
        if (!/^v[a-z]+-/.test(q.key)) continue;
        n++; (seen[id] = seen[id] || new Set()).add(q.key);
        if (q.match) {
          const L = q.match.left, R = q.match.right;
          if (L.length < 3 || L.length !== R.length) bad.push(`${q.key}: ${L.length} pairs`);
          const rv = R.map((x) => txt(x.html)), lvv = L.map((x) => x.html);
          if (new Set(rv).size !== rv.length) bad.push(`${q.key}: two answers look the same ${rv}`);
          if (new Set(lvv).size !== lvv.length) bad.push(`${q.key}: two problems look the same`);
          if (id === 'frac') { const vals = R.map((x) => { const t = txt(x.html); return +t[0] / +t.slice(1); }); if (new Set(vals.map((v) => v.toFixed(6))).size !== vals.length) bad.push(`${q.key}: equal fractions ${rv}`); }
          if (id === 'add' || id === 'sub') for (const x of L) { const m = /(\d+)\s*([+−])\s*(\d+)/.exec(txt(x.html)); const y = R.find((r) => r.id === x.id); if (m && +txt(y.html) !== (m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3])) bad.push(`${q.key}: wrong partner ${txt(x.html)} → ${txt(y.html)}`); }
          if (id === 'mul' || id === 'div') for (const x of L) { const m = /(\d+)\s*([×÷])\s*(\d+)/.exec(txt(x.html)); const y = R.find((r) => r.id === x.id); const want = m[2] === '×' ? +m[1] * +m[3] : +m[1] / +m[3]; if (+txt(y.html) !== want) bad.push(`${q.key}: wrong partner ${m[0]} → ${txt(y.html)}`); if (g === 'g3' && /\b1\b/.test(m[3]) && m[2] === '×') bad.push(`${q.key}: × 1 in 3rd grade`); }
          if (g === 'prek' && id === 'add' && L.some((x) => !/class="m-sum"/.test(x.html))) bad.push(`${q.key}: Pre-K sum without pictures`);
          if (!gradeFits(q, g, id)) bad.push(`${q.key}: does not fit ${g}`);
        } else if (q.order) {
          if (q.order.given !== 1) bad.push(`${q.key}: first picture not placed`);
          if (!q.key.startsWith('vseqw-') && q.order.pics.some((x) => /[A-Za-z]{2}/.test(x))) bad.push(`${q.key}: words in a picture order`);   // Grade 1-3 steps carry their word on purpose
          if (q.key.startsWith('vseqw-') && g === 'prek') bad.push(`${q.key}: captioned steps for Pre-K`);
          if (!gradeFits(q, g, id)) bad.push(`${q.key}: does not fit ${g}`);
        } else bad.push(`${q.key}: unknown variant`);
      }
      if (!(id === 'flags' && g === 'k') && n < 20) bad.push(`${g} ${id} ${lv}: only ${n} variant cards in 400`);
      if (id === 'flags' && g === 'k' && n) bad.push('K got a flag-name match card');
    }
    return { bad: bad.slice(0, 12), n: bad.length, keys: Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.size])) };
  });
  assert.deepEqual(errs, []);
  assert.equal(r.n, 0, r.bad.join('\n'));
  for (const [id, n] of Object.entries(r.keys)) assert.ok(n >= 10, `${id}: only ${n} different variant cards`);
  console.log('PASS format variants are correct, grade-fit and varied', JSON.stringify(r.keys));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
