// Related sections share one tile: a tap opens the list of its parts, and each part keeps its own step and stars.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const r = await p.evaluate(() => {
      document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.testMode = false; state.country = 'us';
      const out = { bad: [] }, all = COMBINED.flatMap((k) => k.parts);
      if (new Set(all).size !== all.length) out.bad.push('a section is in two combined tiles');
      for (const id of all) if (!CATEGORIES.some((c) => c.id === id)) out.bad.push('unknown section ' + id);
      out.combined = COMBINED.map((k) => k.parts.join('+'));
      for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) { state.grade = g; state.exploreOpen = true; renderHome(); show('home');
        const visible = visibleGames().map((c) => c.id), main = '#grid .catalog-section:not(.rec-section) ';
        const shown = [...document.querySelectorAll(main + '.tile[data-cat]')].map((t) => t.dataset.cat), combos = [...document.querySelectorAll(main + '.tile.combo')].map((t) => t.dataset.combo);
        for (const k of COMBINED) { const parts = k.parts.filter((id) => visible.includes(id));
          if (parts.length >= 2) { if (!combos.includes(k.id)) out.bad.push(`${g}: ${k.id} should be one tile`); for (const id of parts) if (shown.includes(id)) out.bad.push(`${g}: ${id} still has its own tile`); }
          else { if (combos.includes(k.id)) out.bad.push(`${g}: ${k.id} has one part and should not be combined`); for (const id of parts) if (!shown.includes(id)) out.bad.push(`${g}: ${id} lost its tile`); } }
        // every section a grade can see is reachable: its own tile, or inside a combined tile
        const inCombos = combos.flatMap((id) => COMBINED.find((k) => k.id === id).parts);
        for (const id of visible) if (!['mix', 'placement', 'check', 'vocab', 'cmp'].includes(id) && !shown.includes(id) && !inCombos.includes(id) && document.querySelector(`#grid [data-cat="${id}"]`) === null && CATEGORIES.find((c) => c.id === id).gen) out.bad.push(`${g}: ${id} cannot be reached`);
        out[g] = combos; }
      return out;
    });
    assert.deepEqual(r.bad, []);
    assert.deepEqual(r.combined, ['cvc+w4', 'pattern+odd+sequence', 'matter+sci+gk', 'jobs+community', 'flags+maps+places']);
    assert.deepEqual(r.k, ['thinking', 'science', 'world']); assert.deepEqual(r.g1, ['words', 'thinking', 'science', 'people', 'world']);
    // open a combined tile: its parts are listed with their own step; choosing one starts that section
    await p.evaluate(() => { state.grade = 'g1'; state.best = { flags: 3, maps: 1, places: 2 }; renderHome(); show('home'); });
    assert.equal(await p.textContent('#grid .tile.combo[data-combo="world"] .tb'), '★☆☆', 'the tile shows the stars of the part that needs most practice');
    await p.click('#grid .tile.combo[data-combo="world"]');
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#comboSheet .tile')].map((t) => t.dataset.cat)), ['flags', 'maps', 'places']);
    await p.keyboard.press('Escape'); assert.equal(await p.locator('#comboSheet').count(), 0, 'Escape closes the list');
    await p.click('#grid .tile.combo[data-combo="world"]'); await p.click('#comboSheet .combo-close'); assert.equal(await p.locator('#comboSheet').count(), 0);
    await p.click('#grid .tile.combo[data-combo="world"]'); await p.click('#comboSheet .tile[data-cat="maps"]');
    assert.deepEqual(await p.evaluate(() => ({ round: R.cat.id, sheet: !!document.querySelector('#comboSheet'), playing: document.querySelector('#play').classList.contains('active') })), { round: 'maps', sheet: false, playing: true });
    assert.deepEqual(errors, []);
    console.log('PASS combined sections: 5 groups share a tile where a grade has two or more parts; the list opens, closes and starts the chosen part');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
