// Typography follows the child's grade policy, not a hard-coded global size.
// Verify grade switching, readable passage hierarchy and horizontal fit on phones/iPads.
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

    const layouts = [
      {name: 'short passage', className: 'q-main', selector: '.sentence.long'},
      {name: 'long passage', className: 'q-main', selector: '.sentence.passage'},
      {name: 'Grade 1 story', className: 'q-main g1-main', selector: '.g1-passage p'},
      {name: 'Grade 2–3 passage', className: 'q-main g1-main', selector: '.g1-passage.p23 p'},
      {name: 'Explorer lesson', className: 'q-main explorer-main', selector: '.explorer-body p'}
    ];
    for (const viewport of [
      {width: 320, height: 700}, {width: 390, height: 844},
      {width: 820, height: 1180}, {width: 1180, height: 820}
    ]) {
      await page.setViewportSize(viewport);
      const result = await page.evaluate(layouts => {
        const sample = 'A bright blue bird landed on a fence. The children watched it closely. Then it flew toward a tree.';
        const grades = ContentData.get('curriculum-map', 'GRADES');
        const entries = [];
        const font = el => parseFloat(getComputedStyle(el).fontSize);
        for (const grade of Object.keys(grades)) {
          state.voice = false;
          state.grade = grade;
          state.showAll = false;
          state.recent = {};
          state.recentContent = {};
          startRound('gk', 1);
          const play = document.querySelector('#play');
          const qText = document.querySelector('#qText');
          const qMain = document.querySelector('#qMain');
          const policy = grades[grade].presentation;
          const appliedScale = parseFloat(getComputedStyle(play).getPropertyValue('--grade-reading-scale'));
          const appliedLineHeight = parseFloat(getComputedStyle(play).getPropertyValue('--grade-reading-line-height'));
          qText.textContent = 'Read the story. Then answer the question!';
          for (const layout of layouts) {
            qMain.className = layout.className;
            if (layout.name === 'short passage')
              qMain.innerHTML = '<div class="sentence long">' + sample + '</div><div class="question-line">Where did the bird go?</div>';
            else if (layout.name === 'long passage')
              qMain.innerHTML = '<div class="sentence passage">' + sample + ' ' + sample + '</div><div class="question-line">What happened?</div>';
            else if (layout.name === 'Grade 1 story')
              qMain.innerHTML = '<div class="g1-passage"><p>' + sample + '</p><p>' + sample + '</p></div>';
            else if (layout.name === 'Grade 2–3 passage')
              qMain.innerHTML = '<div class="g1-passage p23"><p>' + sample + '</p><p>' + sample + '</p></div>';
            else
              qMain.innerHTML = '<div class="explorer-card"><div class="explorer-body"><p>' + sample + '</p></div><div class="explorer-question">How many birds were on the fence?</div></div>';
            const reading = qMain.querySelector(layout.selector);
            const prompt = qMain.querySelector('.question-line, .explorer-question');
            const main = reading.closest('.g1-passage') || reading;
            entries.push({
              grade, name: layout.name, scale: policy.readingScale,
              configuredLineHeight: policy.readingLineHeight,
              appliedScale, appliedLineHeight, instruction: font(qText),
              reading: font(reading),
              lineHeight: parseFloat(getComputedStyle(reading).lineHeight),
              question: prompt ? font(prompt) : null,
              overflow: main.scrollWidth > main.clientWidth + 3 || qMain.scrollWidth > qMain.clientWidth + 3
            });
          }
        }
        return entries;
      }, layouts);
      for (const entry of result) {
        const where = viewport.width + 'px / ' + entry.grade + ' / ' + entry.name;
        assert.ok(Math.abs(entry.scale - entry.appliedScale) < 1e-4, 'Grade scale not applied: ' + where);
        assert.ok(Math.abs(entry.configuredLineHeight - entry.appliedLineHeight) < 1e-4,
          'Grade line height not applied: ' + where);
        assert.ok(Math.abs(entry.reading - entry.instruction * entry.scale) < 1.1,
          'Passage size ignores grade policy: ' + where + ' ' + JSON.stringify(entry));
        assert.ok(Math.abs(entry.lineHeight - entry.reading * entry.configuredLineHeight) < 1.2,
          'Passage line spacing ignores grade policy: ' + where);
        assert.ok(entry.reading >= entry.instruction + 2,
          'Passage smaller than instruction: ' + where + ' ' + JSON.stringify(entry));
        if (entry.question != null) assert.ok(entry.reading >= entry.question,
          'Passage smaller than its question: ' + where + ' ' + JSON.stringify(entry));
        assert.equal(entry.overflow, false,
          'Horizontal overflow: ' + where + ' ' + JSON.stringify(entry));
      }
      // For the same screen and reading layout, younger grades use larger
      // letter sizes; grade changes must update the style without a reload.
      const firstLayout = layouts[0].name;
      const byGrade = result.filter(x => x.name === firstLayout);
      for (let i = 1; i < byGrade.length; i++)
        assert.ok(byGrade[i - 1].reading > byGrade[i].reading,
          'Grade-based scale did not decrease between '+byGrade[i - 1].grade+' and '+byGrade[i].grade);
    }
    assert.deepEqual(errors, []);
    console.log('PASS 5 grade reading policies × 5 layouts × 4 phone/iPad viewports');
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode = 1;});
