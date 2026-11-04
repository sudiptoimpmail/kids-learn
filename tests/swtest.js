const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' });
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto('http://localhost:8765/index.html');
    const result = await page.evaluate(async () => {
      // Never remove caches belonging to another web app on the same origin.
      await (await caches.open('palabritas-v3')).put('/palabritas/x', new Response('hi'));
      const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
      const clips = await (await fetch('audio/clips.json')).json();
      const core = 'audio/' + clips.excellent;
      reg.active.postMessage({ type: 'fill-audio' });
      let found = false;
      for (let i = 0; i < 100; i++) {
        if (await (await caches.open('kids-learn-audio')).match(core)) { found = true; break; }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      const count = (await (await caches.open('kids-learn-audio')).keys()).length;
      return {count, found, core, unrelated:!!(await (await caches.open('palabritas-v3')).match('/palabritas/x'))};
    });
    assert.equal(result.found, true, 'Common encouragement should be available offline');
    assert.equal(result.unrelated, true, 'Worker deleted an unrelated cache');
    assert.ok(result.count < 200, 'Unexpectedly preloaded entire voice library: '+result.count);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await ctx.setOffline(true);
    const offline = await page.evaluate(async (core) => {
      const a = await fetch('app.js'), b = await fetch(core), c = await fetch('audio/clips.json'),
          d = await fetch('workbook.js'), e = await fetch('workbook.css');
      return {app:a.ok,core:b.ok,manifest:c.ok,illustrations:d.ok,styles:e.ok};
    }, result.core);
    assert.deepEqual(offline, {app:true,core:true,manifest:true,illustrations:true,styles:true});
    assert.deepEqual(errors, []);
    console.log('PASS offline app, starter audio and cache isolation', result, offline);
  } finally {
    await page.close(); await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
