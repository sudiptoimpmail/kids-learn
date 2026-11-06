// Connect Four can be played without the mouse: focusable drop buttons, arrow keys, Enter, and live announcements.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  await p.evaluate(() => { state.grade = 'g2'; brainMode = true; openGame('c4'); });
  await p.waitForSelector('.c4-drop');
  assert.equal(await p.locator('.c4-drop').count(), 7);
  await p.locator('.c4-drop').first().focus();
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  assert.equal(await p.evaluate(() => document.activeElement.dataset.c), '3', 'arrow keys did not move between columns');
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  const r = await p.evaluate(() => ({ mine: document.querySelectorAll('.c4-cell.me').length, bot: document.querySelectorAll('.c4-cell.bot').length, live: document.querySelector('#c4Live').textContent }));
  assert.equal(r.mine, 1); assert.equal(r.bot, 1); assert.match(r.live, /Robot dropped in column \d\. Your turn\./);
  assert.deepEqual(errs, []);
  console.log('PASS Connect Four plays by keyboard with spoken moves');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
