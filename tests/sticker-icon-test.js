// A sticker she earned can be her picture; in Settings, picture and colours are chosen in one place.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const pick = await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.avatar = '🦄'; state.stickers = STICKERS.filter((s) => !AVATARS.includes(s) && !CoreSkins.list().some((t) => t.mascot === s)).slice(0, 3); save(); renderHome();
      document.getElementById('stickersBtn').click(); return { earned: state.stickers, note: document.getElementById('stickerPick').textContent }; });
    assert.match(pick.note, /Tap a sticker to make it your picture/);
    // ---- the sticker book: an earned sticker becomes her picture with one tap, no PIN; a locked one does nothing
    assert.equal(await p.locator('#stickers .stk.have[data-s]').count(), 3);
    await p.locator('#stickers .stk:not(.have)').first().click();
    assert.equal(await p.evaluate(() => state.avatar), '🦄');
    await p.locator(`#stickers .stk.have[data-s="${pick.earned[1]}"]`).click();
    const after = await p.evaluate(() => ({ avatar: state.avatar, pin: document.getElementById('pinSheet').hidden, mine: [...document.querySelectorAll('#stickers .stk.mine')].map((x) => x.dataset.s), saved: JSON.stringify(Store.kids().find((k) => k.id === Store.activeId())) }));
    assert.equal(after.avatar, pick.earned[1]); assert.equal(after.pin, true, 'no grown-up needed'); assert.deepEqual(after.mine, [pick.earned[1]]); assert.ok(after.saved.includes(pick.earned[1]), 'kept for next time');
    await p.click('#stickersBack');
    assert.equal(await p.evaluate(() => document.getElementById('kidAvatar').getAttribute('data-emoji') || document.getElementById('kidAvatar').textContent || document.querySelector('#kidAvatar img')?.alt), pick.earned[1], 'her picture on the home page');
    // ---- Settings: one field for picture and colours
    const set = await p.evaluate(() => { openSettings(); const f = document.querySelector('.look-field');
      return { both: !!f.querySelector('#themeBtns') && !!f.querySelector('#avatarRow'), inKidEdit: !!document.querySelector('.kid-edit #avatarRow'), earned: [...document.querySelectorAll('#avatarRow .av.earned')].map((x) => x.dataset.a), on: document.querySelector('#avatarRow .av.on')?.dataset.a, looks: document.querySelectorAll('#themeBtns .grade-btn').length }; });
    assert.deepEqual({ both: set.both, inKidEdit: set.inKidEdit }, { both: true, inKidEdit: false });
    assert.deepEqual(set.earned.sort(), pick.earned.slice().sort(), 'earned stickers can be chosen here too'); assert.equal(set.on, pick.earned[1]);
    // a look sets colours and picture together
    const look = await p.evaluate(() => { document.querySelector('#themeBtns [data-t="dino"]').click(); return { theme: state.theme, avatar: state.avatar, on: document.querySelector('#avatarRow .av.on')?.dataset.a }; });
    assert.deepEqual(look, { theme: 'dino', avatar: '🦖', on: '🦖' });
    // then another picture keeps the colours
    const keep = await p.evaluate((s) => { document.querySelector(`#avatarRow [data-a="${s}"]`).click(); return { theme: state.theme, avatar: state.avatar }; }, pick.earned[0]);
    assert.deepEqual(keep, { theme: 'dino', avatar: pick.earned[0] });
    assert.deepEqual(errors, []);
    console.log('PASS sticker icon: earned stickers become her picture from the sticker book; Settings picks picture and colours together');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
