// Light/dark background choice, coloring book fills and peek, and story problems shown once.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }), errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Ava'; state.grade = 'k'; state.voice = false; state.playAlways = true; });
    // light by default, a grown-up can pick dark; the choice survives a reload
    assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), 'light');
    const bg = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const light = await bg();
    await p.evaluate(() => { openSettings(); show('settings'); });
    assert.equal(await p.locator('#schemeBtns .grade-btn').count(), 3);
    await p.locator('#schemeBtns [data-s="dark"]').click();
    assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), 'dark');
    assert.notEqual(await bg(), light, 'dark background should change the page');
    await p.reload(); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), 'dark');
    await p.evaluate(() => CoreScheme.set('auto'));
    assert.equal(await p.evaluate(() => document.documentElement.hasAttribute('data-theme')), false);
    await p.evaluate(() => CoreScheme.set('light'));
    // coloring: every textured fill points at a pattern that exists before it is used; peek never eats her colours
    await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.playAlways = true; openGame('color'); });
    await p.waitForSelector('.pic-pick'); await p.locator('.pic-pick').nth(2).click(); await p.waitForSelector('.cb');
    const r = await p.evaluate(async () => {
      const tap = (x) => x.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const area = document.getElementById('gameArea'), regs = [...area.querySelectorAll('.color-wrap .r')], seen = [];
      const obs = new MutationObserver((ms) => ms.forEach((m) => { const id = (m.target.style.fill.match(/#(cbp\d+)/) || [])[1]; if (id && !document.getElementById(id)) seen.push(id); }));
      regs.forEach((x) => obs.observe(x, { attributes: true, attributeFilter: ['style'] }));
      for (let i = 0; i < 30; i++) { area.querySelector(`.cb-t[data-t="${CB_TOOLS[i % CB_TOOLS.length]}"]`).click(); tap(regs[i % regs.length]); }
      await new Promise((res) => setTimeout(res, 50)); obs.disconnect();
      const missing = regs.filter((x) => { const m = getComputedStyle(x).fill.match(/#(cbp\d+)/); return getComputedStyle(x).fill === 'none' || (m && !document.getElementById(m[1])); }).length;
      const peek = area.querySelector('[data-a="peek"]'); let kept = true;
      if (peek) {
        area.querySelector('.cb-t[data-t="fill"]').click(); area.querySelector('.cb-c').click();
        const target = regs.find((x) => !x.classList.contains('bg')) || regs[0];
        peek.click(); peek.click(); tap(target);   // two peek taps, then she paints while peeking
        const want = area.querySelector('.cb-c').dataset.c;
        await new Promise((res) => setTimeout(res, 2300));
        const tmp = document.createElement('div'); tmp.style.color = want; document.body.appendChild(tmp); kept = getComputedStyle(target).fill === getComputedStyle(tmp).color; tmp.remove();
      }
      return { seen: seen.length, missing, kept };
    });
    assert.equal(r.seen, 0, 'a fill pointed at a pattern before it existed');
    assert.equal(r.missing, 0, 'a region lost its fill');
    assert.ok(r.kept, 'painting during peek must keep the new colour');
    // story problems: the story is in the card once, not in the prompt too
    const dup = await p.evaluate(() => { let n = 0; for (const id of ['add', 'sub']) { const c = CATEGORIES.find((x) => x.id === id); for (let i = 0; i < 200; i++) { const q = c.gen(2 + (i % 2)); if (/You have/.test(q.text)) n++; } } return n; });
    assert.equal(dup, 0, 'story problem text repeated in the prompt');
    assert.deepEqual(errors, []);
    console.log('PASS dark/light choice, coloring fills and peek, story problems shown once');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
