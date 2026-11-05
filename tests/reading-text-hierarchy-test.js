// Reading should be the largest text in a reading-comprehension card.
// Exercise all passage styles on phones and portrait/landscape iPads.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage({viewport: {width: 820, height: 1180}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(() => !!window.KidsLearnReady);
    await page.evaluate(() => window.KidsLearnReady);
    await page.locator('#startBtn').click();
    for (const viewport of [
      {width: 320, height: 700}, {width: 390, height: 844},
      {width: 820, height: 1180}, {width: 1180, height: 820}
    ]) {
      await page.setViewportSize(viewport);
      const sizes = await page.evaluate(() => {
        state.voice = false;
        state.grade = 'g2';
        startRound('sent', 1);
        const qText = document.querySelector('#qText');
        const qMain = document.querySelector('#qMain');
        qText.textContent = 'Read the story. Then answer the question!';
        const sample = 'A bright blue bird landed on a fence. The children watched it closely. Then it flew toward a tree.';
        const layouts = [
          {name: 'short passage', className: 'q-main', html: '<div class="sentence long">' + sample + '</div><div class="question-line">Where did the bird go?</div>', selector: '.sentence.long'},
          {name: 'long passage', className: 'q-main', html: '<div class="sentence passage">' + sample + ' ' + sample + '</div><div class="question-line">What happened?</div>', selector: '.sentence.passage'},
          {name: 'Grade 1 story', className: 'q-main g1-main', html: '<div class="g1-passage"><p>' + sample + '</p><p>' + sample + '</p></div>', selector: '.g1-passage p'},
          {name: 'Grade 2-3 passage', className: 'q-main g1-main', html: '<div class="g1-passage p23"><p>' + sample + '</p><p>' + sample + '</p></div>', selector: '.g1-passage.p23 p'},
          {name: 'Explorer lesson', className: 'q-main explorer-main', html: '<div class="explorer-card"><div class="explorer-body"><p>' + sample + '</p></div><div class="explorer-question">How many birds were on the fence?</div></div>', selector: '.explorer-body p'}
        ];
        const output = [];
        for (const layout of layouts) {
          qMain.className = layout.className;
          qMain.innerHTML = layout.html;
          const reading = document.querySelector(layout.selector);
          const prompt = document.querySelector('.question-line, .explorer-question');
          const font = el => parseFloat(getComputedStyle(el).fontSize);
          const main = reading.closest('.g1-passage') || reading;
          output.push({
            name: layout.name, reading: font(reading), instruction: font(qText),
            question: prompt ? font(prompt) : null,
            overflow: main.scrollWidth > main.clientWidth + 3 || qMain.scrollWidth > qMain.clientWidth + 3
          });
        }
        return output;
      });
      for (const entry of sizes) {
        assert.ok(entry.reading >= entry.instruction + 2,
          'Passage should be visibly larger than instructions at ' + viewport.width + ': ' + JSON.stringify(entry));
        if (entry.question != null) assert.ok(entry.reading >= entry.question,
          'Passage smaller than its question at ' + viewport.width + ': ' + JSON.stringify(entry));
        assert.equal(entry.overflow, false, 'Reading overflows horizontally at ' + viewport.width + ': ' + JSON.stringify(entry));
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS reading text hierarchy and horizontal fit across phone and iPad viewports');
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode = 1;});
