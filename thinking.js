/* Thinking Skills: curriculum activities, never part of time-gated Play Zone.
   Loaded after content.js, before app.js; uses the existing question format and grade picker. */
const THINKING_PATTERN_SETS = ContentData.get('thinking','THINKING_PATTERN_SETS');
const THINKING_PATTERNS = ContentData.get('thinking','THINKING_PATTERNS');
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
const THINKING_ODD = ContentData.get('thinking','THINKING_ODD');
function genOdd(level) {
  const pool = THINKING_ODD.concat(curriculumRows('THINKING_ODD',level)).filter(x=>x[0] <= level);
  const [difficulty, similar, different, reason] = pick(pool);
  const chosen = level === 1 ? sample(similar, 2) : similar;
  const choices = [...chosen, different];
  const q = thinkingQuestion(`odd-${difficulty}-${chosen.join('')}-${different}`,
    'Which one does NOT belong?', '<div class="think-symbol">🔍</div>', choices, different, reason);
  // The written explanation remains visible. This generic spoken hint already
  // exists in the bundled recordings, including for newly authored prompts.
  q.hint.say = 'Think about it!';
  return q;
}
const THINKING_SEQUENCES = ContentData.get('thinking','THINKING_SEQUENCES');
function genSequence(level) {
  const pool = THINKING_SEQUENCES.concat(curriculumRows('THINKING_SEQUENCES',level)).filter(x=>x[0] <= level);
  const exact = pool.filter(row => row[0] === level);
  const review = pool.filter(row => row[0] === level-1);
  const [difficulty, steps, reason] = pick(exact.length && (Math.random() < 0.82 || !review.length) ? exact :
    review.length ? review : pool);
  // Show either the missing middle event or the final event; older children can also
  // work backward from the last two events. This triples useful variations.
  const missingAt = level <= 1 ? pick([1, steps.length-1]) : rand(steps.length);
  const answer = steps[missingAt];
  // never offer a picture from a related sequence (seed → tree, egg → chicken): it could also be right
  const related = pool.filter(x=>x[1].some(e=>steps.includes(e))).flatMap(x=>x[1]);
  const others = [...new Set(pool.flatMap(x=>x[1]))]
    .filter((x) => x !== answer && !related.includes(x));
  const options = [answer, ...sample(others, level >= 2 ? 3 : 2)];
  const q = thinkingQuestion(`sequence-${difficulty}-${steps.join('')}-${missingAt}`,
    missingAt === steps.length-1 ? 'What happens next?' : 'What happens in the missing spot?',
    `<div class="think-pattern think-sequence">${steps.map((step, i) => `<span class="${i === missingAt ? 'think-missing' : ''}">${i === missingAt ? '?' : step}</span>`).join('<span>➜</span>')}</div>`,
    options, answer, reason);
  q.say = missingAt === steps.length-1 ? 'What happens next?' : 'What happens in the missing spot?';
  q.hint.say = 'Think about it!'; // detailed reasoning remains visible, with a real recorded hint
  return q;
}
CATEGORIES.push(
  { id: 'pattern', title: 'Pattern Puzzle', sub: 'patterns & number sequences', icon: '🧩', color: '#7048e8', gen: genPattern, maxLevel: 5 },
  { id: 'odd', title: 'Odd One Out', sub: 'sort, group & explain', icon: '🔍', color: '#e8590c', gen: genOdd, maxLevel: 3 },
  { id: 'sequence', title: 'What Comes Next?', sub: 'order & cause and effect', icon: '🪴', color: '#0b7285', gen: genSequence, maxLevel: 3 },
);
// Grade visibility and level ranges are now defined in data/curriculum-map.json.
