/* =========================================================
   Grade fit: what a child of each age can actually do on a card
   One policy for every section, applied when a round is built, so a card that slips
   into the wrong grade (from any generator or data pack) is skipped, not shown.
   Pre-K  — pre-reader: no spelling, no word or sentence reading, no word-only answers;
            pictures, letters, numbers to 20 and spoken prompts only.
   K      — emergent reader: short decodable words (up to 4 letters) and simple sentences;
            longer word answers need a picture.
   1st+   — readers: every card type, within each section's grade range.
   ========================================================= */
const FIT_PIC = /<img|<svg|class="m-pic"|class="m-objs"|\p{Extended_Pictographic}/u;
const fitText = (html) => String(html == null ? '' : html)
  .replace(/<(svg|style|script)[\s\S]*?<\/\1>/gi, ' ').replace(/<img[^>]*>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ').replace(/\p{Extended_Pictographic}|️|‍/gu, ' ');
const fitWords = (html) => fitText(html).match(/[A-Za-z][A-Za-z'’-]+/g) || [];
const fitNums = (html) => (fitText(html).match(/\d+/g) || []).map(Number);
// an answer choice a child must read: real words and no picture beside them
function readOnlyChoice(o, maxLetters) {
  const html = o && (o.html != null ? o.html : o.v);
  if (FIT_PIC.test(String(html))) return false;
  const ws = fitWords(html);
  if (!ws.length) return false;                    // numbers, signs, single letters
  return ws.length > 1 && maxLetters < 99 ? true : ws.some((w) => w.length > maxLetters);
}
// Card types that a section keeps producing at higher levels but that belong to certain grades only.
const TYPE_BANDS = [
  [/^cmpp-/, ['g1']],                                                     // count pictures, then pick < > = : 1st grade
  [/^ns-(blocks|measure)-/, ['g1']],                                       // tens and ones blocks, measuring with blocks
  [/^ns-(data|eo|skip|ba|val2)-/, ['g1', 'g2']],                           // picture graphs, even/odd, skip counting, before/after
  [/^ns-r(10|100)-/, ['g3']],                                              // rounding is a 3rd grade standard
  [/^gr-(noun|verb|pl|opp)-/, ['g1', 'g2']],                               // naming and action words, plurals, opposites
  [/^visual-/, ['prek', 'k']],                                             // find the matching picture
  [/^s2-find-(circle|square|triangle|star|heart|oval|rectangle|diamond)/, ['prek', 'k', 'g1']],
  [/^sci23-/, ['g2', 'g3']],                                               // 2nd–3rd grade science units
];
const trivialFact = (key) => { const m = /^(mul|div)-(\d+)-(\d+)$/.exec(key || ''); return !!m && (+m[2] === 1 || +m[3] === 1 || (m[1] === 'div' && m[2] === m[3])); };
// pictures that are the same on every choice (🌍 Africa, 🌍 Asia…) don't help a pre-reader
const sharedDecoration = (opts) => {
  const pics = opts.map((o) => (String(o.html != null ? o.html : o.v).match(/\p{Extended_Pictographic}/gu) || []).join(''));
  return opts.length > 1 && pics[0] && pics.every((p) => p === pics[0]);
};
// Kindergarten reads short words only in its reading sections; elsewhere answers need pictures
const K_READING = new Set(['cvc', 'sight', 'spell', 'sent', 'phonics', 'match', 'syl']);
const K_MATH = new Set(['add', 'sub', 'story', 'match', 'cmp', 'numsense']);
function gradeFits(q, grade, catId) {
  if (!q || !grade) return true;
  const key = String(q.key || '').replace(/^chk-/, '');
  for (const [re, grades] of TYPE_BANDS) if (re.test(key) && !grades.includes(grade)) return false;
  if (grade === 'g3' && trivialFact(key)) return false;                     // no × 1 or ÷ 1 drills in 3rd grade
  if ((grade === 'prek' || grade === 'k') && q.options && sharedDecoration(q.options)
      && q.options.some((o) => fitWords(o.html != null ? o.html : o.v).length)) return false;
  // × and ÷ are 2nd–3rd grade ideas: never on a Pre-K or K card, not even inside Match It
  if ((grade === 'prek' || grade === 'k') && /[×÷]/.test(fitText(q.main) + fitText(q.text) + JSON.stringify(q.match || '') + (q.options || []).map((o) => fitText(o.html != null ? o.html : o.v)).join(' '))) return false;
  if (grade === 'prek') {
    if (q.spell || q.fillIn || q.passageFill || q.puzzle) return false;
    if (q.order && (q.order.pics || []).some((x) => fitWords(x).length)) return false;   // picture order is fine, word order is not
    if (q.letterPath && q.letterPath.words) return false;
    if (q.match && JSON.stringify(q.match).includes('m-word')) return false;
    if ((q.options || []).some((o) => readOnlyChoice(o, 1))) return false;
    if (/^(cmpp|cmp-)/.test(q.key || '')) return false;            // < > = signs are a 1st grade idea
    const ns = fitNums(q.main).concat(fitNums(q.text), ...(q.options || []).map((o) => fitNums(o.html != null ? o.html : o.v)));
    if (ns.length && Math.max(...ns) > 20) return false;
    return true;
  }
  if (grade === 'k') {
    if (q.passageFill) return false;
    if (q.order && (q.order.pics || []).some((x) => fitWords(x).length > 0 && !K_READING.has(catId))) return false;
    if (q.match && !K_READING.has(catId) && JSON.stringify(q.match).includes('m-word')) return false;
    // Kindergarten math works within 20 (phone numbers like 911 in other sections are fine)
    if (K_MATH.has(catId)) {
      const ns = fitNums(q.main).concat(fitNums(q.text), ...(q.options || []).map((o) => fitNums(o.html != null ? o.html : o.v)));
      if (ns.length && Math.max(...ns) > 20) return false;
    }
    if (q.spell && String(q.spell.word || q.answer || '').replace(/[^a-z]/gi, '').length > 4) return false;
    if ((q.options || []).some((o) => readOnlyChoice(o, K_READING.has(catId) ? 4 : 1))) return false;
    return true;
  }
  return true;
}

// The small line under a tile says what THIS child will do there, not the section's whole range.
const GRADE_SUBS = {
  trace: { prek: 'trace A–Z · 1–10', k: 'trace A–Z · a–z · 1–20' },
  phonics: { prek: 'first sounds · rhymes', k: 'first sounds · rhymes · blends' },
  match: { prek: 'number ↔ picture', k: 'word ↔ picture · 3 ↔ 🍎🍎🍎' },
  add: { prek: 'count and add · 🍎 + 🍎🍎', k: 'add within 10 · 4 + 3', g1: 'add within 100 · 23 + 5', g2: 'add within 1000 · 347 + 286', g3: 'add within 1000 · 347 + 286' },
  sub: { prek: 'take away · 🍎🍎🍎 − 🍎', k: 'take away within 10 · 7 − 2', g1: 'subtract within 100 · 45 − 3', g2: 'subtract within 1000 · 642 − 358', g3: 'subtract within 1000 · 642 − 358' },
  shape2: { prek: 'circle · square · triangle', k: 'flat & solid shapes' },
  vocab: { prek: 'look and listen' },
  gk: { prek: 'picture quiz' },
  jobs: { prek: 'who helps us? (pictures)' },
  syl: { prek: 'clap the beats' },
  sent: { k: 'read a short sentence' },
  spell: { k: 'drag the letters · cat · sun' },
};
const gradeSub = (id, sub) => ((typeof state !== 'undefined' && state.grade && GRADE_SUBS[id] && GRADE_SUBS[id][state.grade]) || sub);
