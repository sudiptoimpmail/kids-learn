/* Thinking Skills: curriculum activities, never part of time-gated Play Zone.
   Loaded after content.js, before app.js; uses the existing question format and grade picker. */
const THINKING_PATTERN_SETS = [
  ['🔴', '🔵', '🟢', '🟡'], ['🐱', '🐶', '🐸', '🐻'],
  ['🍎', '🍌', '🍇', '🍊'], ['⭐', '🌙', '☀️', '🌈'],
  ['🚗', '🚀', '🚲', '🚂'], ['🔺', '🔵', '🟨', '💜'],
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
function genPattern(level) {
  if (level >= 4 && Math.random() < 0.65) {
    const step = pick(level >= 5 ? [2, 3, 4, 5, 10] : [1, 2, 5]);
    const start = level >= 5 ? 1 + rand(8) : 1 + rand(5);
    const nums = Array.from({ length: 4 }, (_, i) => start + i * step);
    const answer = String(start + 4 * step);
    const wrong = [String(+answer - step), String(+answer + step), String(+answer + 1), String(+answer - 1)]
      .filter((x) => x !== answer);
    return thinkingQuestion(`pattern-number-${start}-${step}`, 'Which number comes next?',
      `<div class="think-pattern">${nums.map((n) => `<span>${n}</span>`).join('')}<span class="think-missing">?</span></div>`,
      [answer, ...[...new Set(wrong)].slice(0, 3)], answer, `Count forward by ${step} each time.`, 'opt-num');
  }
  const kind = level <= 1 ? 0 : level === 2 ? rand(3) : rand(THINKING_PATTERNS.length);
  const shape = THINKING_PATTERNS[kind], symbols = pick(THINKING_PATTERN_SETS);
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
  const choices = level === 1 ? [similar[0], similar[1], different] : [...similar, different];
  return thinkingQuestion(`odd-${difficulty}-${similar.join('')}-${different}`,
    'Which one does NOT belong?', '<div class="think-symbol">🔍</div>', choices, different, reason);
}
const THINKING_SEQUENCES = [
  [1, ['🌱', '💧', '🌻'], 'First plant a seed, then water it, then it grows.'],
  [1, ['🥚', '🐣', '🐥'], 'A chick hatches from an egg and grows.'],
  [1, ['🌧️', '💧', '🌈'], 'Rain comes first. A rainbow can appear after rain.'],
  [1, ['🪥', '🦷', '😁'], 'Brush your teeth to keep them clean.'],
  [2, ['🍞', '🧀', '🥪'], 'Put the ingredients together to make a sandwich.'],
  [2, ['🧊', '☀️', '💧'], 'Warmth melts ice into water.'],
  [2, ['📖', '🧠', '✅'], 'Read, think, and then answer.'],
  [2, ['🧺', '🫧', '👕'], 'Wash your clothes before they are clean.'],
  [3, ['📝', '📮', '✉️'], 'Write a letter, mail it, and it arrives.'],
  [3, ['🌰', '🌱', '🌳'], 'A seed sprouts and becomes a tree.'],
  [3, ['☁️', '🌧️', '🌱'], 'Clouds can bring rain, and rain helps plants grow.'],
];
function genSequence(level) {
  const pool = THINKING_SEQUENCES.filter((x) => x[0] <= level);
  const [difficulty, steps, reason] = pick(pool);
  const answer = steps[2];
  const others = [...new Set(THINKING_SEQUENCES.flatMap((x) => x[1]))]
    .filter((x) => x !== answer && !steps.includes(x));
  const options = [answer, ...sample(others, level >= 2 ? 3 : 2)];
  return thinkingQuestion(`sequence-${difficulty}-${steps.join('')}`,
    'What happens next?',
    `<div class="think-pattern"><span>${steps[0]}</span><span>➜</span><span>${steps[1]}</span><span>➜</span><span class="think-missing">?</span></div>`,
    options, answer, reason);
}
CATEGORIES.push(
  { id: 'pattern', title: 'Pattern Detective', sub: 'patterns & number sequences', icon: '🧩', color: '#7048e8', gen: genPattern, maxLevel: 5 },
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
