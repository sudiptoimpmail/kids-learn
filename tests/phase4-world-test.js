// Phase 4: Our Community, My State/Province/Nation/Region, science units, India EVS names.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const bad = [], kinds = new Set(), titles = {};
    const check = (q, tag) => {
      kinds.add(q.key.split('-').slice(0, 2).join('-'));
      const vals = q.options.map((o) => String(o.v));
      if (!vals.includes(String(q.answer))) bad.push(tag + ' no answer ' + q.key);
      if (new Set(vals).size !== vals.length) bad.push(tag + ' duplicate ' + q.key + ' ' + vals);
      if (vals.length < 2) bad.push(tag + ' too few ' + q.key);
      if (/undefined|NaN|null/.test(q.text + q.main + vals)) bad.push(tag + ' undefined ' + q.key);
    };
    for (const cc of ['us', 'ca', 'uk', 'au', 'nz', 'in', 'ie']) {
      state.country = cc;
      for (const reg of COUNTRIES[cc].regions.map((x) => x[0])) { state.region = reg;
        for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 25; i++) check(genRegion(lv), cc + ' region ' + reg); }
      for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 120; i++) check(genCommunity(lv), cc + ' community');
      state.grade = 'g3'; state.testMode = false; state.showAll = false; renderHome();
      titles[cc] = [...document.querySelectorAll('#grid .tile[data-cat]')].filter((t) => ['region', 'community', 'sci'].includes(t.dataset.cat)).map((t) => t.querySelector('.tt').textContent);
    }
    for (let lv = 2; lv <= 4; lv++) for (let i = 0; i < 150; i++) check(genSciencePlus(lv), 'sci');
    state.country = 'us'; state.region = 'Michigan';
    const mi = Array.from({ length: 200 }, () => genRegion(3).text).filter((t) => /Michigan|Mackinac|Detroit|Soo/.test(t)).length;
    // the region picker follows the country
    openSettings(); const usOpts = $('#regionSel').options.length;
    $('#countrySel').value = 'ca'; $('#countrySel').dispatchEvent(new Event('change', { bubbles: true }));
    const caOpts = $('#regionSel').options.length, caLabel = $('#regionLabel').textContent;
    $('#countrySel').value = 'us'; $('#countrySel').dispatchEvent(new Event('change', { bubbles: true }));
    return { bad: bad.slice(0, 12), n: bad.length, kinds: [...kinds].sort(), titles, mi, usOpts, caOpts, caLabel };
  });
  assert.equal(r.n, 0, r.bad.join('\n'));
  for (const k of ['com-dir', 'com-key', 'com-time', 'com-gov', 'reg-Michigan', 'reg-cap', 'reg-ocap', 'reg-is', 'sci23-What', 'reg-Ontario', 'reg-Scotland'])
    assert.ok(r.kinds.some((x) => x.startsWith(k)), 'card type never appeared: ' + k);
  assert.ok(r.mi > 60, 'Michigan pack questions appear for Michigan');
  assert.deepEqual(r.titles.us.sort(), ['My State', 'Our Community', 'Science'].sort());
  assert.ok(r.titles.ca.includes('My Province') && r.titles.uk.includes('My Nation') && r.titles.nz.includes('My Region'));
  assert.ok(r.titles.in.includes('EVS · Science') && r.titles.in.includes('EVS · Our World'));
  assert.ok(r.usOpts === 50 && r.caOpts === 13 && r.caLabel === 'Province', JSON.stringify(r));
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS Our Community, region packs for 7 countries (Michigan and Ontario deep), science units and India EVS names');
})().catch((e) => { console.error(e); process.exit(1); });
