// Coloring Book: flags (US, Canada, India, UK, Australia) and Christmas, Thanksgiving and Halloween pages.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/?lazy=1'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = 'k'; state.playAlways = true; state.voice = false; state.art = {}; openGame('color'); });
    await p.waitForSelector('.pic-pick[data-p="flag-us"]', { timeout: 20000 });
    const r = await p.evaluate(() => {
      const out = { bad: [] };
      out.groups = [...document.querySelectorAll('.pic-group')].slice(0, 4).map((g) => [g.textContent.replace(/[^A-Za-z ]/g, '').trim(), [...g.nextElementSibling.querySelectorAll('.pic-pick')].map((x) => x.dataset.p)]);
      const ids = ALL_PICS.map((x) => x.id); if (new Set(ids).size !== ids.length) out.bad.push('two pages share an id');
      for (const t of THEME_PAGES) {
        const page = ALL_PICS.find((x) => x.id === t.id), regions = (t.svg.match(/class="r( bg)?"/g) || []);
        if (!page) { out.bad.push(t.id + ' is not in the book'); continue; }
        if (regions[0] !== 'class="r bg"' || regions.filter((x) => x.includes('bg')).length !== 1) out.bad.push(t.id + ' must start with one background');
        if (t.orig.length !== regions.length - 1 || !t.orig.every((c) => /^#[0-9a-f]{6}$/.test(c))) out.bad.push(t.id + ' needs one real colour for each shape');
        if (/https?:|href=|<image|<script|url\((?!#)/.test(t.svg)) out.bad.push(t.id + ' must be self-contained');
        if (regions.length < 4) out.bad.push(t.id + ' has too little to colour');
      }
      const count = (id, re) => (THEME_PAGES.find((t) => t.id === id).svg.match(re) || []).length, orig = (id) => THEME_PAGES.find((t) => t.id === id).orig;
      out.us = { shapes: orig('flag-us').length, red: orig('flag-us').filter((c) => c === '#b22234').length, stars: count('flag-us', /<polygon points/g) };
      out.india = orig('flag-in'); out.canada = orig('flag-ca'); out.uk = orig('flag-uk').length; out.australiaStars = count("flag-au", /<polygon class="r" points/g);
      return out;
    });
    assert.deepEqual(r.bad, []);
    assert.deepEqual(r.groups.map((g) => g[0]), ['Flags', 'Christmas', 'Thanksgiving', 'Halloween']);
    assert.deepEqual(r.groups[0][1], ['flag-us', 'flag-ca', 'flag-in', 'flag-uk', 'flag-au']);
    assert.ok(r.groups[1][1].length >= 5 && r.groups[1][1].includes('sc-xmas'), 'Christmas pages, with the Christmas tree');
    assert.ok(r.groups[2][1].length >= 4, 'Thanksgiving pages');
    assert.ok(r.groups[3][1].length >= 5 && r.groups[3][1].includes('sc-pumpkin'), 'Halloween pages, with Pumpkin Night');
    assert.deepEqual(r.us, { shapes: 14, red: 7, stars: 50 }, '13 stripes (7 red), a blue corner and 50 stars');
    assert.deepEqual(r.india, ['#ff9933', '#ffffff', '#138808']); assert.deepEqual(r.canada, ['#d52b1e', '#ffffff', '#d52b1e', '#d52b1e']);
    assert.equal(r.uk, 9); assert.equal(r.australiaStars, 6);
    // colour one part of Canada's flag, then peek at the real colours
    await p.click('.pic-pick[data-p="flag-ca"]'); await p.waitForSelector('.color-wrap .r');
    await p.locator('.color-wrap .r').nth(1).click({ position: { x: 20, y: 20 }, force: true });
    assert.ok(await p.evaluate(() => !!(state.art['flag-ca'] && state.art['flag-ca'][1])), 'her colour is saved');
    await p.click('[data-a="peek"]');
    const peek = await p.evaluate(() => [...document.querySelectorAll('.color-wrap .r:not(.bg)')].map((x) => getComputedStyle(x).fill));
    assert.deepEqual(peek, ['rgb(213, 43, 30)', 'rgb(255, 255, 255)', 'rgb(213, 43, 30)', 'rgb(213, 43, 30)'], 'the peek shows the real flag');
    assert.deepEqual(errors, []);
    console.log('PASS coloring themes: 5 flags with their real colours, Christmas, Thanksgiving and Halloween pages, peek and saving work');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
