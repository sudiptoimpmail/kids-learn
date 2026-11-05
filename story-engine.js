/* =========================================================
   Reading: more sentences and stories for "Read & Answer"
   Level 1 – 2: short sentences made from simple word patterns (lots of them)
   Level 3: 1st grade, 2 – 3 sentences
   Level 4: 2nd grade, 3 – 4 sentences
   Level 5: 3rd grade, 5 sentences
   Level 6: 3rd grade challenge, 6 – 8 sentences
   Each story has two or three questions, so the same story can be asked a new way.
   ========================================================= */

// [sentence, question, [right answer, wrong, wrong], level]
const PATTERN_SENTENCES = (() => {
  const out = [];
  // a fixed random order, so the same sentences exist on every device (each one has a recorded voice)
  let seed = 20261103; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const COLORS = [['red', '🔴'], ['blue', '🔵'], ['green', '🟢'], ['pink', '🩷'], ['black', '⚫'], ['yellow', '🟡']];
  // shuffle with our own fixed random numbers (sort() with random order is different in each browser)
  const mix = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const others = (list, right, k = 2) => mix(list.filter((x) => x !== right)).slice(0, k);
  const pickN = (list, k) => mix(list).slice(0, k);
  // the hat is red → what color?
  for (const [thing, e] of [['hat', '🎩'], ['cup', '🥤'], ['bag', '👜'], ['van', '🚐'], ['bed', '🛏️'], ['box', '📦'], ['pen', '🖊️'], ['mug', '☕']])
    for (const [c] of pickN(COLORS, 3)) {
      const em = Object.fromEntries(COLORS);
      out.push([`The ${thing} is ${c}.`, `What color is the ${thing}?`, [c, ...others(COLORS.map((x) => x[0]), c)].map((x) => `${x} ${em[x]}`), 1]);
    }
  // I see six cats → how many?
  const NUM = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  for (const [a, e] of [['cats', '🐱'], ['dogs', '🐶'], ['hens', '🐔'], ['pigs', '🐷'], ['bugs', '🐛'], ['ducks', '🦆'], ['frogs', '🐸'], ['fish', '🐟']])
    for (const n of pickN(NUM, 3)) {
      const v = NUM.indexOf(n) + 2;
      out.push([`I see ${n} ${a}.`, `How many ${a}?`, [String(v), ...others([2, 3, 4, 5, 6, 7, 8, 9, 10].map(String), String(v))], 1]);
    }
  // the cat is in the box → where?
  const PLACES = [['in the box', '📦'], ['on the bed', '🛏️'], ['in the van', '🚐'], ['on the mat', '🟫'], ['in the tub', '🛁'], ['on the rug', '🧶'], ['in the pen', '🪵'], ['on the log', '🪵']];
  for (const a of ['cat', 'dog', 'pig', 'hen', 'fox', 'bug', 'rat', 'kid'])
    for (const [p] of pickN(PLACES, 2)) out.push([`The ${a} is ${p}.`, `Where is the ${a}?`, [p, ...others(PLACES.map((x) => x[0]), p)], 1]);
  // Sam has a kite → what does Sam have?
  const THINGS = [['a kite', '🪁'], ['a ball', '⚽'], ['a drum', '🥁'], ['a map', '🗺️'], ['a key', '🔑'], ['a bun', '🥯'], ['a doll', '🪆'], ['a fan', '🪭'], ['a ring', '💍'], ['a jet', '✈️']];
  for (const name of ['Sam', 'Pam', 'Tom', 'Ben', 'Meg', 'Jim', 'Kim', 'Dan', 'Liz', 'Max'])
    for (const [t] of pickN(THINGS, 2)) {
      const em = Object.fromEntries(THINGS);
      out.push([`${name} has ${t}.`, `What does ${name} have?`, [t, ...others(THINGS.map((x) => x[0]), t)].map((x) => `${x} ${em[x]}`), 1]);
    }
  // the frog can jump → what can it do?
  const CAN = [['frog', 'jump'], ['frog', 'swim'], ['bird', 'fly'], ['bird', 'sing'], ['fish', 'swim'], ['dog', 'dig'], ['dog', 'run'], ['cat', 'nap'], ['duck', 'swim'], ['bee', 'buzz'], ['baby', 'clap'], ['horse', 'trot']];
  const VERBS = ['jump', 'swim', 'fly', 'sing', 'dig', 'run', 'nap', 'buzz', 'clap', 'trot', 'read', 'cook'];
  for (const [a, v] of CAN) out.push([`The ${a} can ${v}.`, `What can the ${a} do?`, [v, ...others(VERBS, v)], 1]);
  // ---- level 2: longer sentences (6 – 8 words)
  const ANIMALS = [['little red hen', 'hen', '🐔'], ['big brown dog', 'dog', '🐶'], ['fat pink pig', 'pig', '🐷'], ['small gray mouse', 'mouse', '🐭'], ['happy green frog', 'frog', '🐸'], ['sleepy black cat', 'cat', '🐱']];
  const SPOTS = ['under the tree', 'next to the barn', 'on top of the hill', 'by the pond', 'in the garden', 'behind the house'];
  for (const [long, a, e] of ANIMALS)
    for (const s of pickN(SPOTS, 3)) {
      out.push([`The ${long} sat ${s}.`, `Where did the ${a} sit?`, [s, ...others(SPOTS, s)], 2]);
    }
  const FOODS = [['an apple', '🍎'], ['a banana', '🍌'], ['some grapes', '🍇'], ['a carrot', '🥕'], ['a sandwich', '🥪'], ['some soup', '🍲'], ['a muffin', '🧁'], ['a pear', '🍐']];
  const TIMES = ['for lunch', 'after school', 'at the park', 'in the car', 'before bed'];
  for (const name of ['Lily', 'Omar', 'Rosa', 'Jack', 'Nina', 'Leo', 'Ava', 'Raj'])
    for (const [f] of pickN(FOODS, 2)) {
      const em = Object.fromEntries(FOODS), t = TIMES[Math.floor(rnd() * TIMES.length)];
      out.push([`${name} ate ${f} ${t}.`, `What did ${name} eat?`, [f, ...others(FOODS.map((x) => x[0]), f)].map((x) => `${x} ${em[x]}`), 2]);
    }
  return out;
})();

// [level, story, [[question, [right, wrong, wrong]], ...]]
const STORIES = ContentData.get('stories','STORIES');
