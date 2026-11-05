/* =========================================================
   1st-grade workbook-style reading cards (original content), mixed into existing rounds:
   Letter Sounds (levels 4–5): word endings (-sh -ch -ck -nd -ng), vowel-sound word paths
   Read & Answer (levels 2–4): word box (several blanks on one screen), read & fill the passage, put the story in order
   Cards with several small questions count as that many answers for the daily numbers (q.parts).
   ========================================================= */
const G1_ENDINGS = { sh: [['fish', '🐟'], ['dish', '🍽️'], ['brush', '🪥'], ['trash', '🗑️'], ['splash', '💦']],
  ch: [['lunch', '🍱'], ['peach', '🍑'], ['watch', '⌚'], ['bench', '🪑'], ['couch', '🛋️']],
  ck: [['duck', '🦆'], ['sock', '🧦'], ['clock', '🕰️'], ['truck', '🚚'], ['rock', '🪨'], ['lock', '🔒'], ['chick', '🐤']],
  nd: [['hand', '✋'], ['wind', '🌬️'], ['pond', '🏞️'], ['band', '🎺']],
  ng: [['ring', '💍'], ['king', '🤴'], ['wing', '🪽'], ['swing', '🛝']] };
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
const G1_VOWELS = {
  'long A': ['cake', 'rain', 'play', 'gate', 'snail', 'tape', 'mail', 'wave', 'plane', 'lake', 'game', 'rake', 'day', 'hay', 'train', 'skate'],
  'long E': ['bee', 'tree', 'seed', 'leaf', 'sea', 'feet', 'team', 'green', 'sleep', 'beach', 'meat', 'queen', 'jeep', 'cheese'],
  'long I': ['kite', 'bike', 'pie', 'five', 'ride', 'time', 'hide', 'nine', 'light', 'night', 'smile', 'line', 'fly', 'slide'],
  'long O': ['rope', 'boat', 'nose', 'home', 'snow', 'road', 'goat', 'bone', 'coat', 'toe', 'rose', 'soap', 'note', 'globe'],
};
const G1_SHORT = ['cat', 'hat', 'man', 'jam', 'pan', 'bag', 'hot', 'pot', 'dog', 'net', 'bed', 'pet', 'sit', 'pig', 'fin', 'cup', 'bus', 'sun', 'mud', 'hen', 'rib', 'log'];
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
const G1_PHRASES = [
  ['frog', '🐸', 'a green ___ on a log'], ['crab', '🦀', 'a red ___ on the sand'], ['drum', '🥁', 'bang on the ___'], ['bell', '🔔', 'ring the ___'],
  ['ship', '🚢', 'a big ___ at sea'], ['cake', '🍰', 'a ___ with candles'], ['kite', '🪁', 'fly a ___ in the wind'], ['moon', '🌙', 'the ___ at night'],
  ['sock', '🧦', 'a ___ on my foot'], ['duck', '🦆', 'the ___ can swim'], ['nest', '🪺', 'three eggs in a ___'], ['bus', '🚌', 'ride the ___ to school'],
  ['hat', '🎩', 'a ___ on his head'], ['star', '⭐', 'a ___ in the sky'], ['lamp', '💡', 'turn on the ___'], ['bread', '🍞', 'jam on the ___'],
  ['chair', '🪑', 'sit on a ___'], ['sheep', '🐑', 'a ___ on the farm'], ['wheel', '🛞', 'a ___ on the car'], ['shell', '🐚', 'a ___ by the sea'],
  ['thin', '✏️', 'a ___ pencil'], ['brick', '🧱', 'one red ___'], ['crib', '🛏️', 'a baby in a ___'], ['grass', '🌱', 'green ___ in the yard'],
  ['mane', '🐴', 'the horse has a ___'], ['frog', '🐸', 'a ___ by the pond'],
  ['clock', '🕰️', 'the ___ says it is time'], ['brush', '🪥', 'a ___ for my teeth'], ['snail', '🐌', 'a slow ___ on a leaf'], ['train', '🚆', 'the ___ on the track'],
];
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
const G1_PASSAGES = [
  [['I am Nia.', 'My bike is blue.', 'I have a cat.', 'The cat is small.', 'We play in the yard.'], [['Nia has a ___ bike.', 'blue', 'red', 'green'], ['The cat is ___.', 'small', 'big', 'sad'], ['Nia and the cat play in the ___.', 'yard', 'pond', 'bus']], '🚲🐱'],
  [['This is Sam.', 'Sam has a red kite.', 'The wind is strong.', 'The kite goes up high.'], [['Sam has a ___ kite.', 'red', 'blue', 'big'], ['The wind is ___.', 'strong', 'cold', 'soft'], ['The kite goes up ___.', 'high', 'down', 'slow']], '🧒🪁'],
  [['Ben has a pet fish.', 'The fish is gold.', 'It lives in a tank.', 'Ben feeds it every day.'], [['Ben has a pet ___.', 'fish', 'dog', 'bird'], ['The fish is ___.', 'gold', 'green', 'black'], ['Ben feeds it every ___.', 'day', 'week', 'hour']], '🐠'],
  [['It is a hot day.', 'Lily goes to the beach.', 'She digs in the sand.', 'She eats a cold ice pop.'], [['It is a ___ day.', 'hot', 'cold', 'wet'], ['Lily digs in the ___.', 'sand', 'mud', 'snow'], ['She eats a cold ___.', 'ice pop', 'soup', 'cake']], '🏖️🍦'],
  [['Max is a big brown dog.', 'He has a red ball.', 'He likes to run and jump.', 'At night he sleeps in his bed.'], [['Max is a ___ dog.', 'brown', 'white', 'little'], ['Max has a ___ ball.', 'red', 'blue', 'big'], ['At night Max ___ in his bed.', 'sleeps', 'eats', 'runs']], '🐕⚽'],
  [['Mom and I bake a cake.', 'We add eggs and milk.', 'The cake is in the oven.', 'Now it smells good!'], [['Mom and I bake a ___.', 'cake', 'pie', 'pizza'], ['We add eggs and ___.', 'milk', 'jam', 'salt'], ['The cake is in the ___.', 'oven', 'box', 'sink']], '👩🍰'],
  [['The farm has a red barn.', 'Six hens live in the barn.', 'The hens lay eggs.', 'Ana picks up the eggs.'], [['The barn is ___.', 'red', 'blue', 'small'], ['___ hens live in the barn.', 'Six', 'Two', 'Ten'], ['Ana picks up the ___.', 'eggs', 'hens', 'apples']], '🐔🥚'],
  [['Leo has new boots.', 'His boots are green.', 'It rains all day.', 'Leo jumps in the puddles.'], [['Leo has new ___.', 'boots', 'socks', 'hats'], ['His boots are ___.', 'green', 'red', 'old'], ['Leo jumps in the ___.', 'puddles', 'bed', 'snow']], '🥾🌧️'],
  [['Nora has a dog named Pip.', 'Pip has one black spot.', 'They run together in the park.', 'Pip is a happy dog.'], [['Pip has one ___ spot.', 'black', 'brown', 'white'], ['Nora and Pip run in the ___.', 'park', 'house', 'sea'], ['Pip is a ___ dog.', 'happy', 'sad', 'big']], '🐕🌳'],
  [['A fox found grapes on a tall vine.', 'The fox jumped but did not reach them.', 'The grapes were too high.', 'The fox walked away.'], [['The fox found ___.', 'grapes', 'apples', 'pears'], ['The grapes were too ___.', 'high', 'low', 'soft'], ['The fox ___ away.', 'walked', 'swam', 'flew']], '🦊🍇'],
];
function genPassageFill() {
  const [lines, qs, pic] = pick(G1_PASSAGES);
  return {
    key: `sent-pass-${lines[0]}`, text: 'Read the story. Then finish each sentence!', say: ['Read the story.', 'Then finish each sentence.'],
    main: `<div class="g1-passage"><span class="g1-pic">${pic}</span>${lines.map((l) => `<p>${l}</p>`).join('')}</div>`, mainClass: 'g1-main',
    options: [], answer: 'done', optClass: 'spell-tray', parts: qs.length,
    passageFill: qs.map(([s, ...o]) => ({ s, answer: o[0], options: shuffle(o.slice()) })),
    hint: { html: '', say: 'Look back at the story!' },
  };
}
// put the story in order: [sentences in order, a picture for each]
const G1_ORDER = [
  [['The hen sat on her egg.', 'The egg cracked.', 'A chick came out.', 'The chick ate some seeds.'], ['🐔', '🥚', '🐣', '🌾']],
  [['Kim planted a seed.', 'She watered it.', 'A little sprout came up.', 'Then a flower grew.'], ['🫘', '💧', '🌱', '🌻']],
  [['Dad got the bread.', 'He put on cheese.', 'He cut the sandwich.', 'We ate lunch.'], ['🍞', '🧀', '🔪', '😋']],
  [['The sky got dark.', 'Rain fell down.', 'The sun came back.', 'We saw a rainbow.'], ['☁️', '🌧️', '☀️', '🌈']],
  [['Jay put on his socks.', 'He put on his shoes.', 'He tied the laces.', 'He ran outside.'], ['🧦', '👟', '🎀', '🏃']],
  [['The caterpillar ate leaves.', 'It made a chrysalis.', 'It slept a long time.', 'A butterfly flew away.'], ['🐛', '🫛', '💤', '🦋']],
  [['We made a snowball.', 'We rolled it big.', 'We put on a hat.', 'Our snowman was done!'], ['❄️', '⚪', '🎩', '⛄']],
  [['Ava got her toothbrush.', 'She put on toothpaste.', 'She brushed her teeth.', 'She smiled big.'], ['🪥', '🧴', '🦷', '😁']],
  [['A fox saw grapes hanging on a vine.', 'The fox tried to reach them.', 'It could not reach the grapes.', 'The fox walked away.'], ['🦊🍇', '🦊⬆️', '🍇', '🦊🚶']],
];
function genStoryOrder() {
  const [lines, pics] = pick(G1_ORDER);
  return {
    key: `sent-order-${lines[0]}`, text: 'Read the story. Tap the pictures in the same order!', say: ['Read the story.', 'Tap the pictures in the same order.'],
    main: `<div class="g1-passage">${lines.map((l) => `<p>${l}</p>`).join('')}</div>`, mainClass: 'g1-main',
    options: [], answer: 'done', optClass: 'spell-tray', parts: 2,
    order: { pics, shown: shuffle(pics.map((p, i) => i)) },
    hint: { html: '', say: 'What happened first?' },
  };
}
// hooks used by the round generators
function genGrade1Reading(level) { const r = Math.random(); return r < 0.4 ? genWordBox(level) : r < 0.75 ? genPassageFill() : genStoryOrder(); }
function genGrade1Phonics() { return Math.random() < 0.55 ? genEnding() : genVowelPath(); }
