// "Minutes every hour" play rule: kids earn first. The hour's minutes open after a finished learning round in that hour.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const r = await p.evaluate(() => {
      Object.assign(state, { grade: 'k', name: 'Maya', playMode: 'hourly', playPerHour: 15, playAlways: false, testMode: false, playUsed: null, playHourEarned: null, playHourCredit: null });
      const out = { start: [playOpen(), playStatus().text] };
      const units = ROUND_POLICY.creditUnitsPerRound;
      out.half = [earnPlay(units / 2), playOpen(), playStatus().text];
      out.full = [earnPlay(units / 2), playOpen(), playStatus().text];
      out.again = earnPlay(units);
      state.playHourEarned = 'an earlier hour';
      out.nextHour = [playOpen(), playStatus().text];
      state.playMode = 'rounds'; state.playRemainingMs = 0; state.roundsSincePlay = 0; state.learningPlayCredit = 0;
      out.rounds = [playOpen(), playStatus().text];
      return out;
    });
    assert.deepEqual(r.start, [false, 'Finish 1 round to play']);
    assert.deepEqual(r.half, [false, false, 'Progress saved · Keep learning to play']);
    assert.equal(r.full[0], true); assert.equal(r.full[1], true); assert.match(r.full[2], /15:00 of play left this hour/);
    assert.equal(r.again, false, 'one round per hour opens it; more rounds do not add minutes');
    assert.deepEqual(r.nextHour, [false, 'Finish 1 round to play']);
    assert.deepEqual(r.rounds, [false, 'Finish 1 more round to play'], 'the default rule also starts locked');
    assert.deepEqual(errors, []);
    console.log('PASS play time: both rules start locked; the hourly minutes open after a round in that hour');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
