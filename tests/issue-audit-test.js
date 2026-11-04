const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args:['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport:{width:390,height:844} });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.locator('#startBtn').click();
    const r = await page.evaluate(async () => {
      const problems = [];
      const check = (ok, msg) => { if (!ok) problems.push(msg); };
      check(APP_FEATURES.testMode === false, 'Production file flag must default OFF');
      check(testFeatureAvailable(), 'Local CI should be permitted to use QA');
      check(EARLY_WORD_INVENTORY.length === 116 && new Set(EARLY_WORD_INVENTORY).size === 116, 'Required words missing or duplicated');
      check(EARLY_WORD_SPECIALS.editorialReview.includes('mo'), 'Unresolved word needs editorial review');
      const clips = await (await fetch('audio/clips.json')).json();
      for (const [word] of EARLY_READY_PICTURE_WORDS) {
        check(!!clips[word], 'New reading/spelling word lacks natural audio: '+word);
        check(W3.some(([w]) => w === word), 'New word absent from reading: '+word);
        check(SPELL3.includes(word), 'New word absent from spelling: '+word);
      }
      for (let i = 0; i < 500; i++) {
        const q = genWords(W3, 1, 'cvc');
        check(isSimpleCVC(q.answer), 'Pre-K Little Words not genuine CVC: '+q.answer);
        for (const option of q.options || [])
          if (/^cvc-(read|find|pic)/.test(q.key))
            check(isSimpleCVC(option.v), 'Advanced word in Pre-K distractors: '+option.v);
        const spelling = genSpell(1);
        check(isSimpleCVC(spelling.answer), 'Pre-K spelling includes irregular word: '+spelling.answer);
        const gr = genGrammar(1);
        check(gr.main.includes('The ') && !!GR_SIMPLE_SENTENCES.length, 'Grammar sentence missing');
      }
      const mazeSummaries = [];
      for (const [rings, sectors] of [[6,14],[8,20]]) {
        const lens = [];
        for (let i=0;i<60;i++) {
          const m = makeRadialMaze(rings,sectors);
          const N = rings*sectors;
          check(m.links.length === N && m.route[0] === m.start && m.route.at(-1) === m.goal, 'Radial route invalid');
          let edges = 0;
          for (let v=0;v<N;v++) for (const w of m.links[v]) {
            check(m.links[w].has(v) && radialNeighbors(v,rings,sectors).includes(w), 'Radial edge invalid');
            edges++;
          }
          check(edges === 2*(N-1), 'Radial maze is not a single connected tree');
          check(m.route.length >= Math.round(N*0.2), 'Radial maze too easy');
          lens.push(m.route.length);
        }
        mazeSummaries.push({rings,sectors,min:Math.min(...lens)});
      }
      state.grade='g3'; state.gameLv={}; state.voice=false;
      check(GL('path') === 9, 'Grade 3 should start with circular maze');
      openBrainGame('path');
      check(!!window.__pathMaze?.circular, 'Circular maze did not mount');
      check(!!document.querySelector('.pm-view .pm-cv'), 'Circular maze viewport not rendered');
      const route = window.__pathMaze.route();
      window.__pathMaze.go(route);
      check(window.__pathMaze.done(), 'Simulated circular solution did not win');
      document.querySelector('#gameBack').click();
      state.grade='g1';
      const old = {stars:23, levels:JSON.stringify(state.levels), recent:JSON.stringify(state.recent)};
      state.stars=23; state.testMode=true; applyTheme();
      check(isTestMode(), 'QA mode not available in local browser');
      openSettings();
      check(!document.querySelector('#testSection').hidden, 'QA toggle not shown in Settings on local test');
      startRound('add',4);
      for(let i=0;i<4;i++){
        if(!document.querySelector('#play').classList.contains('active'))break;
        document.querySelector('#skipBtn').click();
      }
      check(state.stars===23,'QA skip awarded stars');
      check(document.querySelector('#home').classList.contains('active'), 'QA end did not return Home');
      state.testMode=false; applyTheme();
      startRound('add',3);
      document.querySelector('#qZoomIn').click();
      check(document.querySelector('#qZoomInner').style.transform.includes('scale'), 'Question zoom failed');
      document.querySelector('#qZoomReset').click();
      check(!document.querySelector('#qZoomInner').style.transform, 'Question zoom reset failed');
      return {problems:problems.slice(0,15), problemsTotal:problems.length, mazeSummaries, grammarSentences:GR_SIMPLE_SENTENCES.length};
    });
    assert.equal(r.problemsTotal,0,JSON.stringify(r,null,2));
    assert.deepEqual(errors,[],errors.join('\n'));
    console.log('PASS release flags, natural-word gating, early phonics, radial mazes, QA and question zoom',r);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
