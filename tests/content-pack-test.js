const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN || '/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:8765/index.html');
    const result = await page.evaluate(async () => {
      const sample = {
        schema: 1, id:'grade-k-garden', entitlement:'kidslearn.garden.k',
        version:1, title:'Garden Math',
        questions:[{id:'count-01', category:'add', level:1, grades:['k'],
          prompt:'How many flowers?', image:'assets/illustrations/flower.svg',
          choices:['2','3','4'],answer:'3',explanation:'Count the flowers.'}]
      };
      const invalid = structuredClone(sample);
      invalid.questions[0].choices = ['3','3','4'];
      let rejected = false;
      try { ContentPacks.validate(invalid); } catch { rejected=true; }
      const dangerous = structuredClone(sample);
      dangerous.questions[0].image = 'https://example.com/script.js';
      let rejectedImage = false;
      try { ContentPacks.validate(dangerous); } catch { rejectedImage=true; }
      await ContentPacks.installVerified(sample);
      const picked = ContentPacks.choose('k','add',1);
      const wrongGrade = ContentPacks.choose('g1','add',1);
      const wrongLevel = ContentPacks.choose('k','add',2);
      let rejectedDowngrade = false;
      try { await ContentPacks.installVerified({...sample,version:0}); } catch { rejectedDowngrade=true; }
      return {rejected,rejectedImage,rejectedDowngrade,
        picked,wrongGrade,wrongLevel,summary:ContentPacks.summary(),
        bridgeHidden:document.querySelector('#contentPacksSync').hidden,
        noChildUpsell:!document.querySelector('#home [data-purchase], #play [data-purchase]')};
    });
    assert.equal(result.rejected,true,'Must reject duplicate answers');
    assert.equal(result.rejectedImage,true,'Must reject external media URLs');
    assert.equal(result.rejectedDowngrade,true,'Must reject downgrades');
    assert.equal(result.picked.key,'pack:grade-k-garden:count-01');
    assert.equal(result.picked.answer,'3');
    assert.equal(result.picked.options.filter(x=>x.v==='3').length,1);
    assert.equal(result.wrongGrade,null,'No leaking questions to another grade');
    assert.equal(result.wrongLevel,null,'No leaking questions across level boundaries');
    assert.equal(result.summary[0].questions,1);
    assert.equal(result.bridgeHidden,true,'No native purchase adapter means no download button');
    assert.equal(result.noChildUpsell,true,'Child screens must never have purchasing links');
    await page.reload();
    const retained = await page.evaluate(async () => {
      await ContentPacks.load();
      return ContentPacks.choose('k','add',1)?.key;
    });
    assert.equal(retained,'pack:grade-k-garden:count-01','Downloaded packs must survive reload offline');
    const sw = fs.readFileSync('sw.js','utf8');
    assert.ok(sw.includes("'content-packs.js'"),'Pack runtime not pre-cached for offline');
    console.log('PASS offline premium question-pack schema, persistence, grade gating and no child upsells');
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;});
