const { chromium } = require('playwright');
const S = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome' }); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');
  // an old (schema 2) save from before profiles
  await p.evaluate(() => localStorage.setItem('learnplay.v1', JSON.stringify({ schema: 2, name: 'Shivika', voice: false, grade: 'k', stars: 42, levels: { add: 2 }, pinHash: 'h', playMode: 'hourly', stickers: ['🦄'], theme: 'unicorn' })));
  await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(300);
  const log = (x) => console.log(JSON.stringify(x));
  log(await p.evaluate(() => ({ migrated: { name: state.name, stars: state.stars, grade: state.grade, pin: state.pinHash, mode: state.playMode }, kids: Store.kids().map(k => k.name), saved: Object.keys(JSON.parse(localStorage.getItem('learnplay.v1'))) })));
  // add a second child through Settings
  await p.evaluate(() => { openSettings(); document.querySelector('#kidChips [data-add]').click(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => { document.getElementById('nameInput').value = 'Arjun'; document.querySelector('#gradeBtns [data-g="g2"]').click(); document.querySelector('#avatarRow [data-a="🦖"]').click(); document.getElementById('settingsDone').click(); });
  log(await p.evaluate(() => ({ now: state.name, grade: state.grade, stars: state.stars, add: state.levels.add, avatar: state.avatar, pin: state.pinHash, mode: state.playMode, kids: Store.kids().map(k => k.name + k.avatar) })));
  // play a bit as Arjun, then switch back
  await p.evaluate(() => { state.stars = 5; save(); });
  await p.evaluate(() => document.getElementById('kidBtn').click()); await p.waitForTimeout(200);
  await p.screenshot({ path: S + 'kid_who.png' });
  await p.evaluate(() => document.querySelector('#whoGrid [data-id="p1"]').click());
  log(await p.evaluate(() => ({ back: state.name, stars: state.stars, grade: state.grade, add: state.levels.add, theme: state.theme })));
  // persists after a reload, and the start screen asks who is playing
  await p.reload(); await p.evaluate(() => document.getElementById('startBtn').click()); await p.waitForTimeout(200);
  log(await p.evaluate(() => ({ whoShown: !document.getElementById('whoSheet').hidden, active: state.name, kids: Store.kids().map(k => `${k.name}:${k.stars}`) })));
  await p.evaluate(() => document.querySelector('#whoGrid [data-id="p2"]').click());
  await p.screenshot({ path: S + 'kid_home.png' });
  await p.evaluate(() => { openSettings(); }); await p.waitForTimeout(200);
  await p.screenshot({ path: S + 'kid_settings.png', fullPage: false });
  // remove Arjun
  await p.evaluate(() => { window.confirm = () => true; document.getElementById('kidRemove').click(); });
  log(await p.evaluate(() => ({ afterRemove: state.name, kids: Store.kids().map(k => k.name), stars: state.stars })));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
