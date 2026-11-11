// Mascot skins come from the kids-core theme pack: each child's mascot sets the whole app's colours, in Light, Medium and Night.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }), errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Leo'; state.grade = 'k'; state.voice = false; });
    const ids = await p.evaluate(() => CoreSkins.list().map((s) => s.id));
    assert.deepEqual(ids, ['rainbow', 'unicorn', 'dino', 'space', 'ocean', 'sports', 'cars', 'jungle']);
    await p.evaluate(() => { openSettings(); show('settings'); });
    assert.equal(await p.locator('#themeBtns .grade-btn').count(), ids.length);
    // colour buttons show a swatch, not a second animal; the app's own mascot is on the front page, whoever is playing
    assert.equal(await p.locator('#themeBtns .skin-dot').count(), ids.length);
    assert.doesNotMatch(await p.locator('#themeBtns').innerText(), /[🦖🦄🚀]/u);
    assert.equal(await p.evaluate(() => CoreMascot.name), 'Professor Hoot');
    assert.match(await p.locator('#splash [data-core-mascot] img.core-mascot').getAttribute('src'), /owl-teacher\.svg$/);
    const look = () => p.evaluate(() => {
      const css = getComputedStyle(document.body), btn = document.querySelector('#themeBtns .grade-btn.on');
      return { theme: css.getPropertyValue('--theme').trim(), bg: css.backgroundColor, on: getComputedStyle(btn).backgroundColor, cls: document.body.className };
    });
    const seen = {};
    for (const scheme of ['light', 'medium', 'dark']) {
      await p.evaluate((s) => CoreScheme.set(s), scheme);
      for (const id of ['unicorn', 'dino', 'space', 'cars']) {
        await p.locator(`#themeBtns [data-t="${id}"]`).click();
        const l = await look(); assert.match(l.cls, new RegExp('theme-' + id));
        seen[scheme + id] = l;
        const want = await p.evaluate(([i, s]) => CoreSkins.get(i)[s].colors.theme, [id, scheme]);
        assert.equal(l.theme, want, `${scheme} ${id} accent`);
      }
      // boys' skins never pick up the pink/purple accent
      for (const id of ['dino', 'space', 'cars']) assert.notEqual(seen[scheme + id].on, seen[scheme + 'unicorn'].on, `${scheme} ${id} button`);
      assert.notEqual(seen[scheme + 'dino'].bg, seen[scheme + 'space'].bg, scheme + ' page colour per mascot');
      if (process.env.SHOTS) { await p.evaluate(() => show('home')); await p.screenshot({ path: `${process.env.SHOTS}/${scheme}-cars.png` });
        await p.evaluate(() => { openSettings(); show('settings'); }); }
    }
    // the choice is the child's and survives a reload
    await p.reload(); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    assert.match(await p.evaluate(() => document.body.className), /theme-cars/);
    await p.evaluate(() => CoreScheme.set('light'));
    assert.deepEqual(errors, []);
    console.log('PASS mascot skins');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
