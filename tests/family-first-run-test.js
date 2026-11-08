// First-run parent experience: no unnamed learner, siblings in one setup, separate progress,
// optional level check and no accidental reload when Play is tapped.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [], navigations = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations.push(frame.url()); });
    await page.goto('http://localhost:8765/index.html?welcome=1');
    await page.waitForFunction(() => !!window.KidsLearnReady);
    await page.evaluate(() => window.KidsLearnReady);
    const initialNavigations = navigations.length;
    await page.locator('#startBtn').click();
    // No delay, return to splash, or exposed ungraded home before the modal.
    assert.equal(await page.locator('#welcomeSheet').count(), 1);
    assert.equal(await page.locator('#welcomeSheet[aria-modal="true"]').count(), 1);
    assert.match(await page.locator('.wel-siblings').innerText(), /add up to 6 children/i);
    assert.equal(await page.evaluate(() => state.grade || null), null);
    await page.locator('.wel-grade[data-g="prek"]').click();
    assert.match(await page.locator('#welError').innerText(), /enter a name/i);
    assert.equal(await page.evaluate(() => state.grade || null), null, 'a nameless profile cannot enter Home');
    await page.locator('#welName').fill('Ava');
    await page.locator('.wel-grade[data-g="k"]').click();
    assert.ok(await page.locator('[data-a="check"]').isVisible(), 'optional placement check absent');
    assert.ok(await page.locator('[data-a="add"]').isVisible(), 'sibling setup not discoverable');
    await page.locator('[data-a="add"]').click();
    assert.equal(await page.evaluate(() => Store.kids().length), 2);
    assert.match(await page.locator('.wel-siblings').innerText(), /Ava/);
    // A partially created sibling can be cancelled without trapping the parent.
    await page.locator('#welCancel').click();
    assert.deepEqual(await page.evaluate(() => Store.kids().map(k => k.name)), ['Ava']);
    // Create the sibling for real.
    await page.evaluate(() => { window.openWelcome(); });
    // The first saved child already has a grade; the optional check step can add again.
    await page.locator('#welName').fill('Ava');
    await page.locator('.wel-grade[data-g="k"]').click();
    await page.locator('[data-a="add"]').click();
    await page.locator('#welName').fill('Leo');
    await page.locator('.wel-grade[data-g="prek"]').click();
    await page.locator('[data-a="start"]').click();
    assert.deepEqual(await page.evaluate(() => Store.kids().map(k => ({name:k.name, grade:k.grade}))),
      [{name:'Ava',grade:'k'}, {name:'Leo',grade:'prek'}]);
    assert.equal(await page.evaluate(() => state.name), 'Leo');
    await page.evaluate(() => { state.stars = 17; save(); });
    await page.locator('#kidBtn').click();
    const whoDebug = await page.evaluate(() => ({
      active: Store.activeId(), kids: Store.kids().map(k => k.name),
      sheetHidden: document.getElementById('whoSheet').hidden,
      sheetDisplay: getComputedStyle(document.getElementById('whoSheet')).display,
      grid: document.getElementById('whoGrid').innerHTML.slice(0,900),
      welcome: !!document.getElementById('welcomeSheet'),
      homeInert: document.getElementById('home').inert
    }));
    // The picker animates from scale(0), so an immediate isVisible() probes a zero-sized element.
    await page.locator('#whoGrid [data-add="1"]').waitFor({ state: "visible", timeout: 3000 }).catch(err => {
      throw new Error("Add sibling button remained hidden: " + JSON.stringify(whoDebug) + " " + err.message);
    });
    await page.locator('#whoGrid [data-id="p1"]').click();
    await page.locator('#pinSheet').waitFor({state:'visible'});
    const enterPin = async () => {
      for (const k of '1234') await page.locator(`#pinPad [data-k="${k}"]`).click();
      await page.waitForTimeout(220);
    };
    await page.evaluate(()=>{Object.defineProperty(navigator.credentials,'create',{configurable:true,value:async()=>({type:'public-key',response:{getAuthenticatorData:()=>{const a=new Uint8Array(37);a[32]=4;return a.buffer;}}})});});
    await page.locator('#pinVerifyBtn').click();
    await enterPin(); await enterPin(); await enterPin();
    assert.deepEqual(await page.evaluate(() => ({name:state.name,grade:state.grade,stars:state.stars})),
      {name:'Ava',grade:'k',stars:0});
    await page.evaluate(() => { openWho(); });
    await page.locator('#whoGrid [data-id="p2"]').click();
    await page.locator('#pinSheet').waitFor({state:'visible'});
    assert.equal(await page.evaluate(() => state.name), 'Ava', 'previous unlock must not authorize another switch');
    await page.locator('#pinBack').click();
    await page.waitForTimeout(900);
    assert.equal(navigations.length, initialNavigations, 'Play triggered an unexpected navigation or reload');
    await page.reload(); await page.waitForFunction(() => !!window.KidsLearnReady);
    await page.evaluate(() => window.KidsLearnReady);
    assert.equal(await page.locator('#welcomeSheet').count(), 0, 'valid saved child must not be onboarded again');
    assert.deepEqual(await page.evaluate(() => Store.kids().map(k => ({name:k.name,grade:k.grade}))),
      [{name:'Ava',grade:'k'}, {name:'Leo',grade:'prek'}]);
    await page.evaluate(() => openWho());
    await page.locator('#whoGrid [data-id="p2"]').click();
    await page.locator('#pinSheet').waitFor({state:'visible'});
    assert.equal(await page.evaluate(() => state.name), 'Ava', 'reload must not authorize a switch');
    assert.deepEqual(errors, []);
    // Service-worker updates are chosen by a parent; never auto-skipWaiting or auto-reload on entry.
    const src = fs.readFileSync('app.js','utf8');
    assert.match(src, /restartApproved/);
    assert.match(src, /btn\.onclick = \(\) => \{ restartApproved = true/);
    assert.doesNotMatch(src, /setInterval\(tryUpdate/);
    console.log('PASS first-run named-child setup, sibling profiles, onboarding, no surprise reload');
    await page.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
