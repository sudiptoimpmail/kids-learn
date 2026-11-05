// Phase 3: Grammar, Word Study, longer passages, 3rd-grade reading row, UK alien words.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const bad = [], kinds = new Set();
    const check = (q, tag) => {
      kinds.add(q.key.split('-').slice(0, 2).join('-'));
      if (q.passageFill) { q.passageFill.forEach((x) => { if (!x.options.includes(x.answer) || new Set(x.options).size !== x.options.length) bad.push(tag + ' passage ' + q.key); }); return; }
      const vals = q.options.map((o) => String(o.v));
      if (!vals.includes(String(q.answer))) bad.push(tag + ' no answer ' + q.key);
      if (new Set(vals).size !== vals.length) bad.push(tag + ' duplicate ' + q.key + ' ' + vals);
      if (vals.length < 2) bad.push(tag + ' too few ' + q.key);
      if (/undefined|NaN/.test(q.text + q.main + vals)) bad.push(tag + ' undefined ' + q.key);
    };
    for (const cc of ['us', 'uk']) { state.country = cc;
      for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 200; i++) check(genGrammarPunct(lv), 'gp' + lv);
      for (let lv = 3; lv <= 5; lv++) for (let i = 0; i < 200; i++) check(genWordStudy(lv), 'ws' + lv);
      for (let lv = 4; lv <= 6; lv++) for (let i = 0; i < 80; i++) check(genPassage23(lv), 'p' + lv);
      for (let i = 0; i < 300; i++) check(genPhonicsPlus(3), 'ph');
    }
    // every passage can be finished on screen
    const stuck = []; state.grade = 'g3';
    for (let n = 0; n < 30; n++) { startRound('sent', 3); const q = genPassage23(6); R.qs[R.i] = q; renderQ();
      q.passageFill.forEach((pp, i) => document.querySelector(`.g1-q[data-i="${i}"] .g1-chip[data-o="${CSS.escape(pp.answer)}"]`).click());
      if (!R.locked) stuck.push(q.key); }
    $('#quitBtn').click();
    state.country = 'us'; state.testMode = false; state.showAll = false; renderHome();
    const g3 = [...document.querySelectorAll('#grid .tile[data-cat]')].map((t) => t.dataset.cat);
    state.grade = 'g2'; renderHome();
    const g2 = [...document.querySelectorAll('#grid .tile[data-cat]')].map((t) => t.dataset.cat);
    return { bad: bad.slice(0, 12), n: bad.length, kinds: [...kinds].sort(), g3, g2, stuck };
  });
  assert.equal(r.n, 0, r.bad.join('\n'));
  assert.deepEqual(r.stuck, []);
  assert.ok(r.g3.includes('gp') && r.g2.includes('gp'), 'Grammar shows for 2nd and 3rd grade');
  assert.ok(!r.g3.includes('sight') && !r.g3.includes('w4'), '3rd grade has no Sight Words or Big Words tiles');
  for (const k of ['gp-cap', 'gp-end', 'gp-pos', 'gp-list', 'gp-coll', 'gp-refl', 'gp-irr', 'gp-adv', 'gp-cmp', 'gp-agr', 'gp-conj', 'gp-q', 'ws-mean', 'ws-root', 'ws-pre', 'ws-suf', 'ws-abc', 'ws-idiom', 'ws-sim', 'sent-p23', 'ph-alien'])
    assert.ok(r.kinds.includes(k), 'card type never appeared: ' + k);
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS Grade 2–3 grammar and punctuation, word study, longer passages, 3rd-grade reading row and UK alien words');
})().catch((e) => { console.error(e); process.exit(1); });
