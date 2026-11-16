// Wording of generated questions: counts agree with their nouns, and known slips stay fixed.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage(); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const r = await p.evaluate(async () => {
      document.getElementById('splash').style.display = 'none'; state.voice = false;
      const d = await QAQuestions.collect({ maxRounds: 4, patience: 2, noBooks: true }), bad = [], seen = new Set();
      const rules = [
        [/\b1 (?!times|plus|minus|is|was|less|has|equals|tens|ones|hundreds|across|more|bus\b)[a-z]+[^s\W]s\b(?! of)/, 'a count of 1 with a plural name'],
        [/\bcan not\b/, '"can not" (write cannot)'], [/\b(colou?r(ed|s)?\b.*){0}colour|travelled|neighbour|favourite/, 'British spelling in the US edition'],
        [/\b(the|a|an|is|are|to|of) \1\b/i, 'a doubled word'], [/\s[,.!?;](\s|$)/, 'a space before punctuation'],
        [/\ban? (?:[aeio][a-z]+ |[b-df-hj-np-tv-z][a-z]+ ){0}(?:a [aeio][a-z]{2,}|an [b-df-gj-np-tv-z][a-z]{2,})\b/, 'a or an does not fit the next word'],
        [/is which direction|Find the picture of (?!the )|alligator mouth|like a dice|Which is strongest/, 'an old wording'],
        [/undefined|NaN|\[object/, 'code leaking into the text'],
      ];
      // spoken parts are separate clips, so they are checked one by one; pictures and bare sums are not sentences
      const texts = (q) => [q.prompt, q.hint, ...(q.options || []).map((o) => o.text)].filter((t) => t && /[a-z]{3}/.test(t) && !/^[^A-Za-z]*$/.test(t));
      for (const q of d.questions) for (const t of texts(q)) {
        const clean = t.replace(/\[image:[^\]]*\]|\[drawing[^\]]*\]/g, ' ').replace(/\s+([=+−×÷<>?·→])/g, '$1').replace(/([=+−×÷<>·→])\s+\?/g, '$1?');
        if (/[=+−×÷]\s*\?|^\S+( \S+)?$/.test(clean) && !/[a-z]{3} [a-z]{2}/.test(clean)) continue;
        for (const [re, why] of rules) if (re.test(clean)) { const k = why + '|' + q.section + '|' + clean.replace(/\d+/g, '#').slice(0, 40); if (!seen.has(k)) { seen.add(k); bad.push(`${q.grade}/${q.section}: ${why}: ${clean.slice(0, 110)}`); } }
      }
      // the reworded sentences are recorded
      const said = ["The alligator's mouth opens to the bigger number!", "The alligator's mouth opens to the bigger group!", ['Find the picture of the', 'mouth'], ['1', 'group of', '1.', 'How many in all?'], 'What do fish use to breathe?', 'Who is a good citizen?',
        'Whisper means to talk very quietly.', 'Which word means able to hurt you?', 'Evaporate means to turn from water into a gas in the air.'];
      return { n: d.count, bad, unrecorded: said.filter((s) => !CoreVoice.canSay(s)).map(String) };
    });
    assert.ok(r.n > 5000, 'collected ' + r.n);
    assert.deepEqual(r.bad.slice(0, 15), []); assert.deepEqual(r.unrecorded, []);
    assert.deepEqual(errors, []);
    console.log(`PASS question wording: ${r.n} generated questions checked for count agreement, articles, spelling, spacing and old slips`);
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
