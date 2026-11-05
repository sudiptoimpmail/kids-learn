/* Grade 2–3 Explorer problems. All authored prompts, choices, hints, and
   source media live in schema-versioned JSON, not executable JavaScript.
   This file contains only the reusable lesson renderer and integration. */
(() => {
  'use strict';
  const math = ContentData.get('explorer-math', 'questions');
  const science = ContentData.get('explorer-science', 'questions');
  const esc = value => String(value).replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validAsset = path => typeof path === 'string' &&
    /^assets\/(?:illustrations\/[a-z0-9_-]+\.svg|photos\/[a-z0-9_-]+\.jpg)$/.test(path);
  const check = (rows, name, allowed) => {
    const ids = new Set();
    if (!Array.isArray(rows) || rows.length < 20) throw Error('Explorer bank is too small: ' + name);
    for (const q of rows) {
      if (!q || !/^[a-z0-9-]{6,80}$/.test(q.id) || ids.has(q.id) ||
          !allowed.includes(q.level) || !q.domain || !q.context || !q.prompt ||
          !q.explanation || !Array.isArray(q.choices) || q.choices.length < 3 ||
          q.choices.length > 5 || !q.choices.includes(q.answer) ||
          new Set(q.choices.map(x => String(x).trim().toLowerCase())).size !== q.choices.length ||
          (q.asset && !validAsset(q.asset))) {
        throw Error('Invalid Explorer question in ' + name + ': ' + (q?.id || '(missing id)'));
      }
      ids.add(q.id);
    }
    return rows;
  };
  check(math, 'math', [4,5]);
  check(science, 'science', [3,4]);
  const draw = (bank, row) => {
    const image = row.asset
      ? `<img class="explorer-asset" src="${esc(row.asset)}" alt="" loading="lazy" decoding="async">`
      : '';
    const choices = shuffle(row.choices).map(answer => ({v:answer,html:esc(answer)}));
    return {
      key: `explorer-${bank}-${row.id}`,
      text: bank === 'math' ? 'Read the problem. Then solve it!' : 'Read the evidence. What do you think?',
      say: 'Find the answer!',
      main: `<article class="explorer-card">
        <div class="explorer-overline"><span aria-hidden="true">${bank === 'math' ? '🧮' : '🔬'}</span> ${esc(row.domain)}</div>
        <div class="explorer-body">${image}<p>${esc(row.context)}</p></div>
        <div class="explorer-question">${esc(row.prompt)}</div>
      </article>`,
      mainClass:'explorer-main',
      options:choices, answer:row.answer, optClass:'opt-text explorer-choices',
      hint:{html:'<div class="explorer-hint">Look back at the evidence. Try the steps one at a time.</div>',
        say:'Think about it!', remove:false},
      explanation:row.explanation, explorer:true
    };
  };
  const choose = (bank, level) => {
    const exact = bank.filter(q => q.level === level);
    const previous = bank.filter(q => q.level === level - 1);
    const pool = exact.length && (Math.random() < .88 || !previous.length)
      ? exact : previous.length ? previous : exact;
    return pool.length ? pick(pool) : null;
  };
  const wordProblems = CATEGORIES.find(x => x.id === 'story');
  const scienceGames = CATEGORIES.find(x => x.id === 'sci');
  if (!wordProblems || !scienceGames) throw Error('Explorer integration categories are missing');
  const originalMath = wordProblems.gen;
  const originalScience = scienceGames.gen;
  wordProblems.gen = level => level >= 4 && Math.random() < .46
    ? draw('math', choose(math, level) || pick(math.filter(q=>q.level===5)))
    : originalMath(level);
  scienceGames.gen = level => level >= 3 && Math.random() < .38
    ? draw('science', choose(science, level) || pick(science.filter(q=>q.level===4)))
    : originalScience(level);
  window.ExplorerCurriculum = Object.freeze({
    summary:()=>({
      math:math.length, science:science.length,
      mathLevel4:math.filter(x=>x.level===4).length,
      mathLevel5:math.filter(x=>x.level===5).length,
      scienceLevel3:science.filter(x=>x.level===3).length,
      scienceLevel4:science.filter(x=>x.level===4).length
    }),
    // Used by offline/content audit. Does not expose purchase controls.
    getQuestion:(kind,id)=>{
      const bank=kind==='math'?math:kind==='science'?science:[];
      const q=bank.find(x=>x.id===id);
      return q ? draw(kind,q) : null;
    }
  });
})();
