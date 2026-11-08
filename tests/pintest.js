const { chromium } = require('playwright');
const S = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' }); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(() => localStorage.setItem('learnplay.v1', JSON.stringify({ voice: false, grade: 'g1', stars: 5 })));
  await p.reload(); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(300);
  const key = (k) => p.evaluate((k) => document.querySelector(`#pinPad [data-k="${k}"]`).click(), k);
  const typeP = async (s) => { for (const c of s) { await key(c); await p.waitForTimeout(40); } await p.waitForTimeout(250); };
  await p.evaluate(() => document.getElementById('settingsBtn').click()); await p.waitForTimeout(200);
  await p.screenshot({ path: S + 'pin1.png' });
  await p.evaluate(()=>{Object.defineProperty(navigator.credentials,'create',{configurable:true,value:async()=>({type:'public-key',response:{getAuthenticatorData:()=>{const a=new Uint8Array(37);a[32]=4;return a.buffer;}}})});});
  await p.locator('#pinVerifyBtn').click();
  await typeP('1234'); await typeP('1234'); await typeP('1234');
  console.log('after set:', await p.evaluate(() => ({ settings: document.getElementById('settings').classList.contains('active'), hash: !!state.pinHash, schema: JSON.parse(localStorage.getItem('learnplay.v1')).schema })));
  await p.evaluate(() => { show('home'); document.getElementById('settingsBtn').click(); }); await p.waitForTimeout(200);
  await typeP('9999');
  console.log('wrong pin opens settings?', await p.evaluate(() => document.getElementById('settings').classList.contains('active')));
  await typeP('1234');
  console.log('right pin opens settings?', await p.evaluate(() => document.getElementById('settings').classList.contains('active')));
  // test browser
  await p.evaluate(() => { state.testMode = true; renderTestBrowser(); document.getElementById('tbGame').value = 'sent'; document.getElementById('tbGame').onchange(); document.getElementById('tbLevel').value = '6'; document.getElementById('tbGo').click(); });
  await p.waitForTimeout(400);
  const seen = [];
  for (let i = 0; i < 4; i++) { seen.push(await p.evaluate(() => R.i + ':' + R.qs.length + ':' + R.qs[R.i].key.slice(0, 40))); await p.evaluate(() => document.getElementById('skipBtn').click()); await p.waitForTimeout(150); }
  await p.evaluate(() => document.getElementById('prevBtn').click()); await p.waitForTimeout(150);
  seen.push('back→' + await p.evaluate(() => R.i));
  await p.screenshot({ path: S + 'pin2.png' });
  console.log(seen.join('\n'));
  // reading: no repeats across 3 rounds at level 3
  const keys = await p.evaluate(() => { state.testMode = false; state.levels.sent = 3; const all = []; for (let r = 0; r < 3; r++) { startRound('sent'); all.push(...R.qs.map(q => q.key)); } return all; });
  console.log('reading keys', keys.length, 'distinct', new Set(keys).size);
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
