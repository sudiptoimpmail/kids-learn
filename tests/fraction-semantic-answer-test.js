// Semantic fraction-answer audit: different fraction strings may represent the same value.
// A question must never present two mathematically correct choices.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args:['--no-sandbox']});
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(() => !!window.KidsLearnReady);
    const outcome = await page.evaluate(() => {
      const problems = [], counts = {};
      const ratio = (v) => {
        const match = new RegExp('^([0-9]+)/([0-9]+)$').exec(String(v).trim());
        if (match && +match[2] > 0) return +match[1] / +match[2];
        const word = /^(one|two|three) (half|halves|third|thirds|fourth|fourths|quarter|quarters)$/.exec(String(v).trim().toLowerCase());
        if (!word) return null;
        const num = {one:1,two:2,three:3}[word[1]];
        const den = /^half/.test(word[2]) ? 2 : /^third/.test(word[2]) ? 3 : 4;
        return num / den;
      };
      for (const country of ['us','ca','uk','au','nz','in','ie']) {
        state.country = country;
        for (const [name,gen,levels] of [
          ['fractions',genFractions,[1,2,3,4]],
          ['number-sense',genNumSense,[4,5]]
        ]) for (const level of levels) {
          const id = country+'/'+name+'/'+level;
          let checked = 0;
          for (let i=0; i<250; i++) {
            const q = gen(level);
            const correct = ratio(q.answer);
            if (correct == null || !Array.isArray(q.options)) continue;
            checked++;
            const matches = q.options.filter(o => {
              const v = ratio(o.v);
              return v != null && Math.abs(v-correct)<1e-10;
            });
            if (matches.length !== 1) problems.push(id+' '+q.key+' multiple equivalent answers: '+q.options.map(o=>o.v).join(', '));
          }
          counts[id] = checked;
        }
      }
      return {total:problems.length,examples:problems.slice(0,30),counts};
    });
    assert.equal(outcome.total,0,JSON.stringify(outcome.examples,null,2));
    for (const country of ['us','ca','uk','au','nz','in','ie']) {
      assert.ok(outcome.counts[country+'/fractions/1'] > 100, 'worded-fraction sample too small for '+country);
      assert.ok(outcome.counts[country+'/fractions/2'] > 100, 'numeric-fraction sample too small for '+country);
    }
    console.log('PASS fraction questions have exactly one mathematically correct choice across seven countries');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
).exec(String(v).trim());
        return match && +match[2] > 0 ? +match[1] / +match[2] : null;
      };
      for (const country of ['us','ca','uk','au','nz','in','ie']) {
        state.country = country;
        for (const [name,gen,levels] of [
          ['fractions',genFractions,[1,2,3,4]],
          ['number-sense',genNumSense,[4,5]]
        ]) for (const level of levels) {
          const id = country+'/'+name+'/'+level;
          let checked = 0;
          for (let i=0; i<250; i++) {
            const q = gen(level);
            const correct = ratio(q.answer);
            if (correct == null || !Array.isArray(q.options)) continue;
            checked++;
            const matches = q.options.filter(o => {
              const v = ratio(o.v);
              return v != null && Math.abs(v-correct)<1e-10;
            });
            if (matches.length !== 1) problems.push(id+' '+q.key+' multiple equivalent answers: '+q.options.map(o=>o.v).join(', '));
          }
          counts[id] = checked;
        }
      }
      return {total:problems.length,examples:problems.slice(0,30),counts};
    });
    assert.equal(outcome.total,0,JSON.stringify(outcome.examples,null,2));
    console.log('PASS fraction questions have exactly one mathematically correct choice across seven countries');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
