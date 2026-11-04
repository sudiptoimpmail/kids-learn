const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' }); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('DIALOG ' + d.message()); d.dismiss(); });
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(() => localStorage.setItem('learnplay.v1', JSON.stringify({ schema: 3, active: 'p1', order: ['p1', 'x9', 'p2', 'p2'], device: { voice: false, evil: 1 },
    profiles: { p1: { name: '<img src=x onerror=alert(1)>', avatar: '<b>x</b>', stars: 'lots', levels: [1], stickers: 'no' }, x9: { name: 'bad id' }, p2: 'oops' } })));
  await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(300);
  console.log(JSON.stringify(await p.evaluate(() => { openWho(); return { kids: Store.kids().map(k => [k.id, k.name, k.avatar]), stars: state.stars, imgs: document.querySelectorAll('#whoGrid img').length, device: Object.keys(Store.root.device) }; })));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
