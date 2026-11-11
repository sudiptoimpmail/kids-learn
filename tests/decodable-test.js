// Reading words use only spelling patterns taught at their level (data/lessons.json "decodable").
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const res = await p.evaluate(() => {
      // the classifier on known words
      const expect = { cat: 'short', ant: 'short', six: 'short', fish: 'digraphs', frog: 'digraphs', cake: 'magicE', kite: 'magicE', rain: 'teams', car: 'teams', fly: 'teams', ball: 'teams', two: 'any', bear: 'any' };
      const wrongStage = Object.entries(expect).filter(([w, s]) => Decodable.wordStage(w) !== s).map(([w, s]) => `${w}: ${Decodable.wordStage(w)} not ${s}`);
      // every card at every grade × level shows only taught patterns, for reading, listening and spelling
      const bad = [], counts = {};
      for (const grade of ['prek', 'k', 'g1', 'g2', 'g3']) {
        state.grade = grade;
        for (const kind of ['cvc', 'w4', 'spell']) {
          const range = openRange(kind); if (!range) continue;
          const cat = CATEGORIES.find((c) => c.id === kind);
          for (let lv = range[0]; lv <= range[1]; lv++) {
            const stage = Decodable.decodableAt(kind, lv); if (!stage) continue;
            for (let i = 0; i < 120; i++) {
              const q = cat.gen(lv); counts[kind] = (counts[kind] || 0) + 1;
              const words = [q.spell && q.spell.word, ...(q.options || []).map((o) => o.v)].concat(q.key.match(/-(read|pic|find|miss|scr)-([a-z]+)$/) ? [q.key.split('-').pop()] : []);
              for (const w of words) if (typeof w === 'string' && /^[a-z]{2,}$/.test(w) && !Decodable.allowed(w, stage)) bad.push(`${grade} ${kind}:${lv} (${stage}) ${q.key}: ${w} is ${Decodable.wordStage(w)}`);
            }
          }
        }
      }
      return { wrongStage, bad: [...new Set(bad)], counts };
    });
    assert.deepEqual(res.wrongStage, []);
    assert.deepEqual(res.bad.slice(0, 20), [], `${res.bad.length} cards use untaught patterns`);
    assert.ok(res.counts.cvc > 100 && res.counts.w4 > 100 && res.counts.spell > 100);
    assert.deepEqual(errors, []);
    console.log('PASS decodable: Little Words, Big Words and Spell It use only taught spelling patterns at every grade and level');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
