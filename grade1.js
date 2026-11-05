/* =========================================================
   1st-grade workbook-style reading cards (original content), mixed into existing rounds:
   Letter Sounds (levels 4–5): word endings (-sh -ch -ck -nd -ng), vowel-sound word paths
   Read & Answer (levels 2–4): word box (several blanks on one screen), read & fill the passage, put the story in order
   Cards with several small questions count as that many answers for the daily numbers (q.parts).
   ========================================================= */
const G1_ENDINGS = ContentData.get('grade1','G1_ENDINGS');
function genEnding() {
  const end = pick(Object.keys(G1_ENDINGS)), [w, e] = pick(G1_ENDINGS[end]);
  const stem = w.slice(0, -end.length);
  return {
    key: `ph-end2-${w}`, text: 'Which ending finishes the word?', say: ['Which ending finishes the word?'], speak: w,
    main: `<div class="spell-pic">${e}</div><div class="word">${stem}<span class="blank">__</span></div><button class="mini-speaker" data-speak="${w}" aria-label="Hear the word">🔊</button>`,
    mainClass: 'ph-main', options: shuffle([end, ...sample(Object.keys(G1_ENDINGS).filter((x) => x !== end), 3)]).map((x) => ({ v: x, html: `-${x}` })),
    answer: end, optClass: 'opt-word', hint: { html: '', say: [w], slow: true },
  };
}
// words by vowel sound (long sounds are the path; the rest are dead ends)
const G1_VOWELS = ContentData.get('grade1','G1_VOWELS');
const G1_SHORT = ContentData.get('grade1','G1_SHORT');
function genVowelPath() {
  const sound = pick(Object.keys(G1_VOWELS)), cols = 4, rows = 5, route = [[0, 0]];
  while (route.length < cols + rows - 1) { const [x, y] = route[route.length - 1]; route.push(x === cols - 1 ? [x, y + 1] : y === rows - 1 ? [x + 1, y] : Math.random() < 0.5 ? [x + 1, y] : [x, y + 1]); }
  const on = new Set(route.map((c) => c.join()));
  const good = shuffle(G1_VOWELS[sound].slice()), bad = shuffle([...G1_SHORT, ...Object.entries(G1_VOWELS).filter(([k]) => k !== sound).flatMap(([, v]) => v)]);
  let gi = 0, bi = 0; const grid = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid.push(on.has(`${x},${y}`) ? good[gi++ % good.length] : bad[bi++ % bad.length]);
  const example = G1_VOWELS[sound].slice(0, 2).join(' and ');
  return {
    key: `ph-vpath-${sound}-${rand(1e5)}`, text: `Follow only the words with the <b>${sound}</b> sound, like ${example}!`,
    say: [`Follow the words with the ${sound} sound!`], main: '', mainClass: 'ph-main',
    options: [], answer: 'done', optClass: 'spell-tray', parts: 3,
    letterPath: { words: true, cols, rows, grid, route, hero: '➡️', home: '⭐' }, hint: { html: '', say: [`${sound}.`, ...G1_VOWELS[sound].slice(0, 2)] },
  };
}

// little phrases for the word box: [word, picture, phrase with ___]
const G1_PHRASES = ContentData.get('grade1','G1_PHRASES');
function genWordBox(level) {
  const n = level >= 3 ? 4 : 3, rows = sample(G1_PHRASES, n), extra = level >= 3 ? sample(G1_PHRASES.filter((r) => !rows.includes(r)), 1) : [];
  return {
    key: `sent-box-${rows.map((r) => r[0]).join('-')}`, text: 'Finish each phrase with a word from the box!', say: ['Finish each phrase with a word from the box.', 'Use the pictures to help.'],
    main: '', mainClass: 'empty', options: [], answer: 'done', optClass: 'spell-tray', parts: n,
    fillIn: { words: shuffle([...rows, ...extra].map((r) => r[0])), lines: rows.map(([w, e, p]) => ({ answer: w, pic: e, text: p })) },
    hint: { html: '', say: 'Look at the picture next to each line!' },
  };
}
// short passages and sentences to finish from them: [passage lines, [sentence with ___, right, wrong, wrong]…, picture]
const G1_PASSAGES = ContentData.get('grade1','G1_PASSAGES'); 
function genPassageFill(level = 3) {
  const candidates = G1_PASSAGES.filter(row => (row[3] || 3) <= level);
  const exact = candidates.filter(row => (row[3] || 3) === level);
  const [lines, qs, pic] = pick(exact.length && Math.random() < 0.75 ? exact : candidates);
  return {
    key: `sent-pass-${lines[0]}`, text: 'Read the story. Then finish each sentence!', say: ['Read the story.', 'Then finish each sentence.'],
    main: `<div class="g1-passage"><span class="g1-pic">${pic}</span>${lines.map((l) => `<p>${l}</p>`).join('')}</div>`, mainClass: 'g1-main',
    options: [], answer: 'done', optClass: 'spell-tray', parts: qs.length,
    passageFill: qs.map(([s, ...o]) => ({ s, answer: o[0], options: shuffle(o.slice()) })),
    hint: { html: '', say: 'Look back at the story!' },
  };
}
// put the story in order: [sentences in order, a picture for each]
const G1_ORDER = ContentData.get('grade1','G1_ORDER'); 
function genStoryOrder(level = 3) {
  const candidates = G1_ORDER.filter(row => (row[2] || 3) <= level);
  const exact = candidates.filter(row => (row[2] || 3) === level);
  const [lines, pics] = pick(exact.length && Math.random() < 0.75 ? exact : candidates);
  return {
    key: `sent-order-${lines[0]}`, text: 'Read the story. Tap the pictures in the same order!', say: ['Read the story.', 'Tap the pictures in the same order.'],
    main: `<div class="g1-passage">${lines.map((l) => `<p>${l}</p>`).join('')}</div>`, mainClass: 'g1-main',
    options: [], answer: 'done', optClass: 'spell-tray', parts: 2,
    order: { pics, shown: shuffle(pics.map((p, i) => i)) },
    hint: { html: '', say: 'What happened first?' },
  };
}
// hooks used by the round generators
function genGrade1Reading(level) { const r = Math.random(); return r < 0.4 ? genWordBox(level) : r < 0.75 ? genPassageFill(level) : genStoryOrder(level); }
function genGrade1Phonics() { return Math.random() < 0.55 ? genEnding() : genVowelPath(); }
