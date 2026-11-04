const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const ctx = await b.newContext(); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  const r = await p.evaluate(async () => {
    // pretend another app on the same site has a cache
    await (await caches.open('palabritas-v3')).put('/palabritas/x', new Response('hi'));
    const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
    const t0 = Date.now(); reg.active.postMessage({ type: 'fill-audio' });
    let n = 0; for (let i = 0; i < 120; i++) { await new Promise(r => setTimeout(r, 1000)); n = (await (await caches.open('kids-learn-audio')).keys()).length; if (n >= 4464) break; }
    return { caches: await caches.keys(), audio: n, secs: Math.round((Date.now() - t0) / 1000), other: !!(await (await caches.open('palabritas-v3')).match('/palabritas/x')) };
  });
  console.log(JSON.stringify(r));
  // offline: app files and a voice clip come from the caches
  await p.reload(); await ctx.setOffline(true);
  const off = await p.evaluate(async () => { const a = await fetch('app.js'); const clips = await (await fetch('audio/clips.json')).json(); const c = await fetch('audio/' + Object.values(clips)[100]); return [a.ok, c.ok]; });
  console.log('offline ok', JSON.stringify(off));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
