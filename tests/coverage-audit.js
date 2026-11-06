// Phase A coverage audit: every grade × section × level, played through the real round pipeline
// with a fixed random seed, so two runs of the same code give the same numbers.
// Writes docs/coverage/coverage.json; scripts/build-coverage-report.cjs turns it into docs/coverage/index.html.
//   node tests/coverage-audit.js [--rounds 5] [--seed 20261106] [--check] [--out docs/coverage/coverage.json]
// --check fails when any card has a broken answer key, fails grade fit, or a section level yields no cards.
const fs = require('node:fs');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const ROUNDS = +arg('--rounds', 5), SEED = +arg('--seed', 20261106), CHECK = process.argv.includes('--check');
const OUT = arg('--out', 'tests/out/coverage.json');   // docs/coverage/coverage.json when refreshing the published report
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  // seeded Math.random before any app script runs
  await p.addInitScript((seed) => {
    let a = seed >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }, SEED);
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(400);
  const data = await p.evaluate((ROUNDS) => {
    const PIC = /<img|<svg|class="m-pic"|class="m-objs"|\p{Extended_Pictographic}/u;
    const kind = (q) => q.spell ? 'spell' : q.passageFill ? 'passage' : q.fillIn ? 'fill-in' : q.puzzle ? 'puzzle' : q.match ? 'match' : q.multi ? 'pick-all'
      : q.letterPath ? 'letter-path' : q.order ? 'order' : q.illustrated ? 'scene' : q.tap ? 'tap' : q.trace ? 'trace' : q.body3d ? 'body' : q.options ? 'choice' : 'other';
    const family = (k) => String(k || '').replace(/^(chk|place-[\d-]+)-/, '').split('-').slice(0, 2).join('-').replace(/\d+/g, '#');
    const fp = (q) => { const body = q.match || q.order || q.fillIn || q.passageFill || q.letterPath || q.spell || ''; return String(q.text || '') + '|' + String(q.answer) + '|' + String(q.main || '') + '|' + (body ? JSON.stringify(body).slice(0, 600) : ''); };
    const answerOk = (q) => {
      if (kind(q) !== 'choice' || q.answer == null || typeof q.answer === 'object') return null;
      const hits = q.options.filter((o) => String(o.v) === String(q.answer)).length;
      const dup = new Set(q.options.map((o) => String(o.v))).size !== q.options.length;
      return hits === 1 && !dup;
    };
    const out = { generated: new Date().toISOString(), rounds: ROUNDS, grades: {}, games: {}, sectionTitles: {} };
    for (const c of CATEGORIES) out.sectionTitles[c.id] = c.title;
    for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) {
      Object.assign(state, { grade: g, testMode: false, showAll: false, country: 'us', region: 'Michigan', optAnatomy: true, levels: {}, recent: {}, recentContent: {} });
      const sections = visibleGames().filter((c) => c.gen && !['mix', 'placement', 'check'].includes(c.id));
      out.grades[g] = { label: GRADES[g].label, sections: {} };
      for (const c of sections) {
        const [lo, hi] = gradeRange(g, c.id) || [1, 1];
        const levels = {};
        for (let lv = lo; lv <= hi; lv++) {
          state.levels[c.id] = lv; state.recent[c.id] = []; state.recentContent[c.id] = [];
          const keys = [], fps = new Set(), kinds = {}, fams = new Set(), bad = [], unfit = [];
          let n = 0, hints = 0, spoken = 0, pics = 0, empty = 0, below = 0, repeats = 0;
          const seenBefore = new Set();
          for (let r = 0; r < ROUNDS; r++) {
            R = null;
            try { startRound(c.id, 10); } catch (e) { bad.push('ERROR ' + e.message); continue; }
            if (!R || R.cat.id !== c.id) { empty++; continue; }
            for (const q of R.qs) {
              n++; keys.push(q.key);
              if (seenBefore.has(fp(q))) repeats++;
              fps.add(fp(q));
              const k = kind(q); kinds[k] = (kinds[k] || 0) + 1; fams.add(family(q.key));
              if (q.hint && (q.hint.html || q.hint.say)) hints++;
              if (q.say && String(Array.isArray(q.say) ? q.say.join('') : q.say).trim()) spoken++;
              if (PIC.test(String(q.main || '')) || (q.options || []).some((o) => PIC.test(String(o.html != null ? o.html : o.v)))) pics++;
              if (q.level < lv) below++;
              const ok = answerOk(q); if (ok === false) bad.push(q.key);
              if (typeof gradeFits === 'function' && !gradeFits(q, g, c.id)) unfit.push(q.key);
            }
            R.qs.forEach((q) => seenBefore.add(fp(q)));
            try { document.querySelector('#quitBtn').click(); } catch {}
          }
          levels[lv] = { cards: n, distinct: fps.size, repeats, kinds, families: fams.size, hints, spoken, pics, below, emptyRounds: empty,
            badAnswers: bad.slice(0, 5), badCount: bad.length, unfit: unfit.slice(0, 5), unfitCount: unfit.length, sample: keys.slice(0, 4) };
        }
        out.grades[g].sections[c.id] = { range: [lo, hi], levels };
      }
      // games and brain games this grade sees, with their level band
      out.games[g] = (typeof GAMES !== 'undefined' ? GAMES : []).map((x) => ({ id: x.id, title: x.title || x.id,
        brain: typeof BRAIN_GAME_IDS !== 'undefined' && BRAIN_GAME_IDS.has(x.id),
        visible: typeof BRAIN_GAME_IDS !== 'undefined' && BRAIN_GAME_IDS.has(x.id) ? brainVisible(x) : true,
        band: typeof GAME_GRADES !== 'undefined' && GAME_GRADES[x.id] ? GAME_GRADES[x.id][g] || null : null }));
    }
    return out;
  }, ROUNDS);
  data.seed = SEED; data.pageErrors = errs.slice(0, 10);
  fs.mkdirSync(require('node:path').dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data, null, 1) + '\n');
  let cells = 0, bad = 0, unfit = 0, empty = 0;
  for (const g of Object.values(data.grades)) for (const s of Object.values(g.sections)) for (const l of Object.values(s.levels)) {
    cells++; bad += l.badCount; unfit += l.unfitCount; if (!l.cards) empty++;
  }
  console.log(`coverage: ${cells} grade×section×level cells, ${bad} broken answer keys, ${unfit} grade-fit failures, ${empty} empty cells, ${errs.length} page errors`);
  await b.close();
  if (CHECK && (bad || unfit || empty || errs.length)) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
