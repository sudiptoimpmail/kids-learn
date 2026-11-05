// Phase 1 regressions: Body Parts overlapping taps, real-looking coins, grade fit in test mode,
// telling time on by default, Grade 2–3 adding and subtraction with bigger numbers.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { chromium } = require('playwright');
// coins: true metal and true relative size
const radius = (f) => +/<circle cx="120" cy="120" r="([\d.]+)"/.exec(fs.readFileSync('assets/currencies/' + f, 'utf8'))[1];
const svg = (f) => fs.readFileSync('assets/currencies/' + f, 'utf8');
assert.ok(svg('us-1.svg').includes('#d98b57'), 'US penny should be copper');
assert.ok(svg('us-10.svg').includes('ONE DIME') && svg('us-25.svg').includes('QUARTER DOLLAR'), 'US coins carry their real words');
assert.ok(radius('us-10.svg') < radius('us-1.svg') && radius('us-1.svg') < radius('us-5.svg') && radius('us-5.svg') < radius('us-25.svg'), 'US coin sizes: dime < penny < nickel < quarter');
assert.ok(svg('ca-100.svg').includes('#ecc65a') && /<path d="M/.test(svg('ca-100.svg')), 'loonie is gold and many-sided');
assert.ok(svg('uk-100.svg').includes('id="i"'), '£1 is two-tone');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').tap(); await p.waitForTimeout(600);
  const tap = async (asked, at) => {
    await p.evaluate(([asked]) => { state.grade = 'k'; startRound('body', 3); const q = R.qs[R.i];
      Object.assign(q, { tap: true, answer: asked, main: bodySVG(), mainClass: 'body-main', options: [], text: 'Tap the ' + asked }); renderQ(); }, [asked]);
    await p.waitForTimeout(300);
    const pt = await p.evaluate((at) => { const r = document.querySelector(`#qMain [data-val="${at}"] ellipse`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, at);
    await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(500);
    return p.evaluate(() => R.qs[R.i].ok);
  };
  assert.equal(await tap('head', 'eyes'), true, 'tapping the eyes counts for "head"');
  assert.equal(await tap('head', 'nose'), true, 'tapping the nose counts for "head"');
  assert.equal(await tap('hands', 'hands'), true, 'tapping the middle of a hand counts for "hands"');
  assert.notEqual(await tap('ears', 'nose'), true, 'the nose is not the ears');
  // every read-and-answer passage card can be finished, including question-style lines with no ___
  const stuck = await p.evaluate(() => { state.grade = 'g2'; state.showAll = true; const bad = [];
    for (let n = 0; n < 40; n++) { startRound('sent', 3); const q = genPassageFill(); R.qs[R.i] = q; renderQ();
      q.passageFill.forEach((pp, i) => document.querySelector(`.g1-q[data-i="${i}"] .g1-chip[data-o="${pp.answer}"]`).click());
      if (!R.locked) bad.push(q.key); }
    state.showAll = false; return bad; });
  assert.deepEqual(stuck, [], 'passage cards that could not be finished');
  const r = await p.evaluate(() => {
    state.testMode = true; state.showAll = false; state.grade = 'g3'; state.hideClock = false; renderHome();
    const tiles = [...document.querySelectorAll('#grid .tile[data-cat]')].map((t) => t.dataset.cat);
    state.grade = 'g1'; renderHome();
    const g1 = [...document.querySelectorAll('#grid .tile[data-cat]')].map((t) => t.dataset.cat);
    state.testMode = false;
    const only = (f, pre) => Array.from({ length: 80 }, f).filter((q) => q.key.startsWith(pre));
    const sums = only(() => genAdd(8), 'add-'), diffs = only(() => genSub(8), 'sub-'), two = only(() => genAdd(6), 'add-');
    state.country = 'us'; const coinQs = Array.from({ length: 400 }, () => genCountry(1 + (Math.random() * 4 | 0)));
    const naming = coinQs.filter((q) => /(which|this) (coin|banknote|note)|coin called|coin is worth/i.test(q.text || '') && !/most/i.test(q.text || '')).map((q) => q.text);
    const counted = nsCoins(41, COUNTRIES.us) || '';
    return { tiles, g1, naming, labelled: counted.includes('ns-coin-val'), big: sums.every((q) => q.answer >= 200 && q.answer <= 999 && q.main.includes('col-sum')),
      sub: diffs.every((q) => q.answer > 0 && q.answer < 900), two: two.every((q) => q.answer <= 99 && /col-sum/.test(q.main)),
      speak: sayParts(['What is', 347, 'plus', '286?']) };
  });
  assert.ok(!r.tiles.includes('trace') && !r.tiles.includes('cvc') && !r.tiles.includes('syl'), 'test mode keeps 3rd grade tiles: ' + r.tiles);
  assert.deepEqual(r.naming, [], 'no "which coin / which note is this" questions');
  assert.ok(r.labelled, 'counting coins shows each value');
  assert.ok(r.g1.includes('clock'), 'telling time shows for 1st grade by default');
  assert.ok(r.big && r.sub && r.two, 'Grade 2–3 adding and subtraction use bigger numbers in columns');
  assert.deepEqual(r.speak, ['What is', 'three hundred', '47', 'plus', 'two hundred', '86?']);
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS body taps, real coins, grade fit in test mode, telling time, bigger sums');
})().catch((e) => { console.error(e); process.exit(1); });
