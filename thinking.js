/* Thinking Skills: curriculum activities, never part of time-gated Play Zone.
   Loaded after content.js, before app.js; uses the existing question format and grade picker. */
const THINKING_PATTERN_SETS = [
  ['🔴', '🔵', '🟢', '🟡'], ['🐱', '🐶', '🐸', '🐻'],
  ['🍎', '🍌', '🍇', '🍊'], ['⭐', '🌙', '☀️', '🌈'],
  ['🚗', '🚀', '🚲', '🚂'], ['🔺', '🔵', '🟨', '💜'],
  ['🍕', '🍩', '🍋', '🥕'], ['🐢', '🦋', '🐳', '🦉'],
  ['🟥', '🟦', '🟩', '🟨'], ['🎈', '🎁', '🏆', '🎲'],
  ['🌵', '🌳', '🌷', '🍀'], ['⚽', '🏀', '🏈', '🎾'],
];
const THINKING_PATTERNS = [
  [0, 1, 0, 1, 0, 1, 0],    // AB
  [0, 0, 1, 0, 0, 1, 0],    // AAB
  [0, 1, 1, 0, 1, 1, 0],    // ABB
  [0, 1, 2, 0, 1, 2, 0],    // ABC
  [0, 0, 1, 1, 0, 0, 1],    // AABB
];
function thinkingQuestion(key, text, main, choices, answer, reason, optsClass = 'opt-emoji') {
  const opts = shuffle(choices.map((x) => ({ v: x, html: x })));
  return { key, text, say: [text.replace(/<[^>]+>/g, '')], main, options: opts,
    answer, optClass: optsClass,
    hint: { html: `<div class="hint-note">${reason}</div>`, say: [reason] } };
}

// More challenging reasoning at older levels: extend a growing pattern,
// detect multiplication, and infer the changing difference.
function genAdvancedPattern(level) {
  const kind = rand(level >= 5 ? 4 : 2);
  let nums, answer, reason;
  if (kind === 0) {
    const first = 1 + rand(5), initial = 1 + rand(3);
    nums = [first]; let step = initial;
    for (let i = 0; i < 4; i++) { nums.push(nums.at(-1) + step); step += level >= 5 ? 2 : 1; }
    answer = nums.at(-1) + step;
    reason = 'Look at how much the number increases each time.';
  } else if (kind === 1) {
    const factor = level >= 5 ? pick([2, 3, 4]) : 2, first = 1 + rand(3);
    nums = Array.from({ length: 5 }, (_, i) => first * factor ** i);
    answer = first * factor ** 5;
    reason = 'Multiply by the same number each time.';
  } else if (kind === 2) {
    const step = 2 + rand(4), base = 3 * step + 1 + rand(6);
    nums = Array.from({ length: 5 }, (_, i) => base + (i % 2 === 0 ? i / 2 : -((i + 1) / 2) * step));
    answer = base - 3 * step;
    reason = 'Two number patterns take turns.';
  } else {
    const first = 2 + rand(3);
    nums = Array.from({ length: 5 }, (_, i) => first + i * i);
    answer = first + 25;
    reason = 'The jumps grow by two each time.';
  }
  const correct = String(answer);
  const wrong = [...new Set([answer + 1, answer + 2, answer + 3, answer - 1, answer - 2, answer + 4, answer * 2])]
    .filter(n => n >= 0 && n !== answer).map(String).slice(0, 3);
  const q = thinkingQuestion('advanced-pattern-' + kind + '-' + nums.join('-'), 'What number should come next?',
    '<div class="think-pattern">' + nums.map(n => '<span>' + n + '</span>').join('') + '<span class="think-missing">?</span></div>',
    [correct, ...wrong], correct, reason, 'opt-num');
  q.say = 'Which number comes next?'; // existing, prerecorded spoken prompt
  q.hint.say = 'Think about it!'; // display the detailed reasoning without requesting an absent recording
  return q;
}

function genPattern(level) {
  // Grade 1: skip-counting by twos and fives, not multiplication/geometric sequences.
  if (level === 3 && Math.random() < 0.4) {
    const step = pick([2, 5]), start = 1 + rand(step);
    const nums = Array.from({length:5}, (_,i)=>start + i*step);
    const answer = String(start + 5*step);
    const wrong = [...new Set([start+4*step,start+6*step,start+5*step+1,start+5*step-1])]
      .filter(x=>String(x)!==answer && x>=0).map(String).slice(0,3);
    const question = thinkingQuestion('pattern-skip-'+step+'-'+start,
      'Which number comes next?', '<div class="think-pattern">'+
      nums.map(n=>'<span>'+n+'</span>').join('')+'<span class="think-missing">?</span></div>',
      [answer,...wrong], answer, 'Count by the same number each time.', 'opt-num');
    question.say = 'Which number comes next?';
    question.hint.say = 'Think about it!';
    return question;
  }
  if (level >= 4 && Math.random() < 0.75) return genAdvancedPattern(level);
  if (level >= 4 && Math.random() < 0.65) {
    const step = pick(level >= 5 ? [2, 3, 4, 5, 10] : [1, 2, 5]);
    const start = level >= 5 ? 1 + rand(8) : 1 + rand(5);
    const nums = Array.from({ length: 4 }, (_, i) => start + i * step);
    const answer = String(start + 4 * step);
    const wrong = [String(+answer - step), String(+answer + step), String(+answer + 1), String(+answer - 1), String(+answer + 2), String(+answer - 2)]
      .filter((x) => x !== answer);
    return thinkingQuestion(`pattern-number-${start}-${step}`, 'Which number comes next?',
      `<div class="think-pattern">${nums.map((n) => `<span>${n}</span>`).join('')}<span class="think-missing">?</span></div>`,
      [answer, ...[...new Set(wrong)].slice(0, 3)], answer, `Count forward by ${step} each time.`, 'opt-num');
  }
  const kind = level <= 1 ? 0 : level === 2 ? rand(3) : rand(THINKING_PATTERNS.length);
  const shape = THINKING_PATTERNS[kind], symbols = shuffle([...pick(THINKING_PATTERN_SETS)]);
  const answer = symbols[shape[6]];
  const choices = [answer, ...symbols.filter((x) => x !== answer).slice(0, level >= 2 ? 3 : 2)];
  return thinkingQuestion(`pattern-${kind}-${symbols.join('')}`, 'What comes next?',
    `<div class="think-pattern">${shape.slice(0, 6).map((i) => `<span>${symbols[i]}</span>`).join('')}<span class="think-missing">?</span></div>`,
    choices, answer, 'Look for the group that repeats from the beginning.');
}
// Each row describes three items with the same property and one outlier.
// Levels: obvious categories -> habitats/objects -> properties & functions.
const THINKING_ODD = [
  [1, ['🐱', '🐶', '🐰'], '🚗', 'The others are animals.'],
  [1, ['🍎', '🍌', '🍓'], '🚲', 'The others are fruits.'],
  [1, ['🚗', '🚂', '🚲'], '🐼', 'The others are vehicles.'],
  [1, ['🌸', '🌻', '🌹'], '⚽', 'The others are flowers.'],
  [1, ['🐟', '🐬', '🦈'], '🐻', 'The others live in water.'],
  [1, ['🍰', '🍩', '🍪'], '🧦', 'The others are foods.'],
  [1, ['🥕', '🥦', '🌽'], '🚗', 'The others are vegetables.'],
  [1, ['👟', '👢', '🩴'], '🍎', 'The others are footwear.'],
  [1, ['🚀', '✈️', '🚁'], '🌼', 'The others are vehicles.'],
  [1, ['🖍️', '✏️', '🖊️'], '🍉', 'The others are writing or drawing tools.'],
  [1, ['🧸', '🪀', '🎲'], '🥔', 'The others are toys.'],
  [1, ['🎸', '🥁', '🎹'], '🧤', 'The others are musical instruments.'],
  [1, ['🦁', '🐘', '🦒'], '🍓', 'The others are animals.'],
  [1, ['🍞', '🧀', '🥚'], '👒', 'The others are foods.'],
  [1, ['🧤', '🧣', '🧥'], '🍕', 'The others are clothing.'],
  [1, ['🐥', '🐔', '🦆'], '🚲', 'The others are birds.'],
  [2, ['🦋', '🐝', '🐞'], '🐘', 'The others are insects.'],
  [2, ['🐶', '🐱', '🐰'], '🌳', 'The others are animals.'],
  [2, ['☀️', '🌙', '⭐'], '🧀', 'The others are things we see in the sky.'],
  [2, ['🥄', '🍴', '🥢'], '👟', 'The others are used for eating.'],
  [2, ['🚕', '🚌', '🚙'], '🚢', 'The others travel on roads.'],
  [2, ['👟', '🧦', '🥾'], '🧤', 'The others are worn on your feet.'],
  [3, ['🍎', '🍐', '🍊'], '🥦', 'The others are fruits.'],
  [3, ['🛏️', '🛋️', '🪑'], '🥪', 'The others are furniture.'],
  [3, ['🦅', '🦆', '🐧'], '🦎', 'The others are birds.'],
  [3, ['⚽', '🏀', '🏐'], '🎸', 'The others are balls used in games.'],
  [3, ['🖊️', '✏️', '🖍️'], '🪥', 'The others are used for writing or drawing.'],
  [3, ['🧥', '👕', '👖'], '🍕', 'The others are clothing.'],
];
function genOdd(level) {
  const pool = THINKING_ODD.filter((x) => x[0] <= level);
  const [difficulty, similar, different, reason] = pick(pool);
  const chosen = level === 1 ? sample(similar, 2) : similar;
  const choices = [...chosen, different];
  return thinkingQuestion(`odd-${difficulty}-${chosen.join('')}-${different}`,
    'Which one does NOT belong?', '<div class="think-symbol">🔍</div>', choices, different, reason);
}
const THINKING_SEQUENCES = [
  [1, ['🌱', '💧', '🌻'], 'First plant a seed, then water it, then it grows.'],
  [1, ['🥚', '🐣', '🐥'], 'A chick hatches from an egg and grows.'],
  [1, ['🌧️', '💧', '🌈'], 'Rain comes first. A rainbow can appear after rain.'],
  [1, ['🪥', '🦷', '😁'], 'Brush your teeth to keep them clean.'],
  [1, ['🥚', '🐛', '🦋'], 'A butterfly begins as an egg, then a caterpillar, then becomes a butterfly.'],
  [1, ['🧦', '👟', '🚶'], 'Put on socks, then shoes, then go for a walk.'],
  [1, ['🌅', '🌞', '🌇'], 'Morning comes before daytime and evening.'],
  [1, ['🌱', '🌿', '🌳'], 'A little plant can grow into a tree.'],
  [1, ['🐣', '🐥', '🐔'], 'A chick hatches and grows into a chicken.'],
  [1, ['🛏️', '😴', '🌅'], 'Go to bed, sleep, and wake in the morning.'],
  [1, ['🍞', '🧀', '🥪'], 'Use bread and cheese to make a sandwich.'],
  [1, ['🧊', '☀️', '💧'], 'The warmth from sunshine can melt ice into water.'],
  [1, ['✏️', '🖍️', '🖼️'], 'Draw, color, and finish your picture.'],
  [1, ['✉️', '📮', '📬'], 'Write a letter, mail it, and it arrives.'],
  [1, ['🛒', '🍎', '🏠'], 'Choose apples at the shop, then take them home.'],
  [1, ['📦', '🚚', '🏠'], 'A parcel goes on the delivery truck and arrives at home.'],
  [1, ['🧩', '🧠', '✅'], 'Look at a puzzle, think, and solve it.'],
  [1, ['🪵', '🪚', '🪑'], 'Wood can be cut and used to make a chair.'],
  [1, ['🐑', '🧶', '🧣'], 'Sheep give wool, and wool can be made into a scarf.'],
  [1, ['🥚', '🍳', '🍽️'], 'An egg is cooked and served for a meal.'],
  [1, ['🦷', '🪥', '✨'], 'Clean your teeth with a toothbrush to make them sparkle.'],
  [1, ['🧑‍🍳', '🥘', '🍽️'], 'A cook makes food, then serves the meal.'],
  [1, ['🧑‍🌾', '🌱', '🥕'], 'A farmer plants seeds, and vegetables grow.'],
  [1, ['🧱', '🏗️', '🏠'], 'Bricks are used at a building site to make a house.'],
  [1, ['🌙', '😴', '🌞'], 'Nighttime comes, we sleep, and then morning arrives.'],
  [1, ['👋', '🚌', '🏫'], 'Say goodbye, ride the bus, and arrive at school.'],
  [1, ['🐔', '🥚', '🐣'], 'A hen lays an egg and a chick hatches.'],
  [1, ['🐈', '🥣', '😺'], 'A cat eats from its bowl and feels happy.'],
  [1, ['🧸', '🛏️', '😴'], 'Get a teddy bear, climb into bed, and fall asleep.'],
  [1, ['🌼', '🐝', '🍯'], 'A bee visits flowers and makes honey.'],
  [1, ['⛅', '🌧️', '🌈'], 'Clouds bring rain, and a rainbow may appear afterward.'],
  [1, ['🍞', '🍯', '🥪'], 'Spread honey on bread and make a sandwich.'],
  [1, ['🦴', '🐶', '😋'], 'A puppy finds a bone and enjoys it.'],
  [1, ['🧶', '🪡', '🧣'], 'Use yarn and a needle to make a scarf.'],
  [1, ['🍂', '❄️', '🌷'], 'Autumn is followed by winter, then spring.'],
  [1, ['📚', '📖', '🧠'], 'Choose a book, read it, and learn something.'],
  [1, ['🌳', '🍂', '🌱'], 'Leaves fall from trees and new plants grow later.'],
  [1, ['🏀', '🏃', '🏆'], 'Get ready for a game, play, and celebrate a win.'],
  [1, ['🚦', '🚗', '🏠'], 'Wait at a traffic light, drive safely, and arrive home.'],
  [2, ['📖', '🧠', '✅'], 'Read, think, and then answer.'],
  [2, ['🧺', '🫧', '👕'], 'Put clothes in the basket, wash them, and then they are clean.'],
  [3, ['📝', '✉️', '📮'], 'Write a letter, put it in an envelope, and mail it.'],
  [3, ['🌰', '🌱', '🌳'], 'A seed sprouts and becomes a tree.'],
  [3, ['☁️', '🌧️', '🌱'], 'Clouds can bring rain, and rain helps plants grow.'],
];
function genSequence(level) {
  const pool = THINKING_SEQUENCES.filter((x) => x[0] <= level);
  const [difficulty, steps, reason] = pick(pool);
  // Show either the missing middle event or the final event; older children can also
  // work backward from the last two events. This triples useful variations.
  const missingAt = level <= 1 ? pick([1, 2]) : pick([0, 1, 2]);
  const answer = steps[missingAt];
  // never offer a picture from a related sequence (seed → tree, egg → chicken): it could also be right
  const related = THINKING_SEQUENCES.filter((x) => x[1].some((e) => steps.includes(e))).flatMap((x) => x[1]);
  const others = [...new Set(THINKING_SEQUENCES.flatMap((x) => x[1]))]
    .filter((x) => x !== answer && !related.includes(x));
  const options = [answer, ...sample(others, level >= 2 ? 3 : 2)];
  return thinkingQuestion(`sequence-${difficulty}-${steps.join('')}-${missingAt}`,
    missingAt === 2 ? 'What happens next?' : 'What happens in the missing spot?',
    `<div class="think-pattern">${steps.map((step, i) => `<span class="${i === missingAt ? 'think-missing' : ''}">${i === missingAt ? '?' : step}</span>`).join('<span>➜</span>')}</div>`,
    options, answer, reason);
}
CATEGORIES.push(
  { id: 'pattern', title: 'Pattern Puzzle', sub: 'patterns & number sequences', icon: '🧩', color: '#7048e8', gen: genPattern, maxLevel: 5 },
  { id: 'odd', title: 'Odd One Out', sub: 'sort, group & explain', icon: '🔍', color: '#e8590c', gen: genOdd, maxLevel: 3 },
  { id: 'sequence', title: 'What Comes Next?', sub: 'order & cause and effect', icon: '🪴', color: '#0b7285', gen: genSequence, maxLevel: 3 },
);
for (const [grade, levels] of Object.entries({
  prek: { pattern: '1-1', odd: '1-1', sequence: '1-1' },
  k: { pattern: '1-2', odd: '1-2', sequence: '1-2' },
  g1: { pattern: '2-3', odd: '2-3', sequence: '2-3' },
  g2: { pattern: '3-4', odd: '3-3', sequence: '3-3' },
  g3: { pattern: '4-5', odd: '3-3', sequence: '3-3' },
})) Object.assign(GRADES[grade].g, levels);
