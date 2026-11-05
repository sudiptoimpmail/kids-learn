// Level ↔ grade ↔ section mapping: every section and every game climbs grade by grade.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { chromium } = require('playwright');
const ORDER = ['prek', 'k', 'g1', 'g2', 'g3'];
const ladder = (name, rows, max) => {
  // rows: [[grade, lo, hi]] in grade order
  const used = new Set();
  rows.forEach(([g, lo, hi], i) => {
    assert.ok(lo >= 1 && hi >= lo && hi <= max, `${name} ${g}: ${lo}-${hi} outside 1-${max}`);
    for (let l = lo; l <= hi; l++) used.add(l);
    if (!i) return;
    const [pg, plo, phi] = rows[i - 1];
    assert.ok(lo >= plo && hi >= phi, `${name}: ${g} (${lo}-${hi}) is easier than ${pg} (${plo}-${phi})`);
    assert.ok(!(lo === plo && hi === phi) || hi === max, `${name}: ${pg} and ${g} are identical (${lo}-${hi}) but harder levels exist`);
    assert.ok(lo <= phi + 1, `${name}: gap between ${pg} and ${g}`);
  });
  return used;
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  const r = await p.evaluate(() => ({
    sections: Object.fromEntries(CATEGORIES.filter((c) => c.gen && !c.trace && !['placement', 'check', 'mix', 'trace'].includes(c.id)).map((c) => [c.id, { max: maxLevelOf(c.id), rows: Object.keys(GRADES).filter((g) => gradeRange(g, c.id)).map((g) => [g, ...gradeRange(g, c.id)]) }])),
    games: Object.fromEntries(Object.entries(GAME_GRADES).map(([id, m]) => [id, { max: id === 'sudoku' ? 5 : GAME_MAX[id], rows: Object.keys(GRADES).filter((g) => m[g]).map((g) => [g, ...m[g]]) }])),
    tiers: DRAW_TIERS.map((t) => t.length),
    starts: (() => { const out = {}; for (const g of ['prek', 'g3']) { state.grade = g; state.gameLv = {}; state.sdkLevel = 0; out[g] = Object.fromEntries(Object.keys(GAME_GRADES).map((id) => [id, GL(id)])); } return out; })(),
    capped: (() => { state.grade = 'k'; state.gameLv = { memory: 5 }; return GL('memory'); })(),
  }));
  for (const [id, { max, rows }] of Object.entries(r.sections)) {
    rows.sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
    const used = ladder('section ' + id, rows, max);
    assert.ok(used.has(max) || max <= 3 && rows.length < 3, `section ${id}: level ${max} is never used by any grade`);
  }
  for (const [id, { max, rows }] of Object.entries(r.games)) {
    rows.sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
    const used = ladder('game ' + id, rows, max);
    assert.ok(used.has(max), `game ${id}: top level ${max} is never reached`);
  }
  for (const id of Object.keys(r.games)) assert.ok(r.starts.g3[id] > r.starts.prek[id] || r.games[id].rows[0][0] !== 'prek', `game ${id}: 3rd grade starts no higher than Pre-K`);
  assert.equal(r.capped, 3, 'a Kindergarten child is kept inside the Kindergarten range of a game');
  assert.deepEqual(r.tiers, [12, 12, 12, 12], 'four tiers of drawing templates');
  await b.close();
  console.log(`PASS ${Object.keys(r.sections).length} sections and ${Object.keys(r.games).length} games climb grade by grade; 48 drawing templates in 4 age tiers`);
})().catch((e) => { console.error(e); process.exit(1); });
