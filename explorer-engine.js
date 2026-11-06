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
  // Diagrams are structured JSON, never arbitrary HTML or executable content.
  // Limit dimensions to keep SVG rendering fast even on older offline iPads.
  const validDiagram = model => {
    if (!model || typeof model !== 'object' || Array.isArray(model)) return false;
    const int = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
    if (model.kind === 'array')
      return int(model.rows, 1, 10) && int(model.columns, 1, 10) &&
        model.rows * model.columns <= 80 && ['count','perimeter'].includes(model.answerRule);
    if (model.kind === 'number-line')
      return Number.isFinite(model.start) && Number.isFinite(model.end) &&
        Number.isFinite(model.point) && model.end > model.start &&
        int(model.steps, 2, 16) && model.point >= model.start &&
        model.point <= model.end && model.answerRule === 'point' &&
        Math.abs((model.point-model.start)*model.steps/(model.end-model.start) -
          Math.round((model.point-model.start)*model.steps/(model.end-model.start))) < 1e-8;
    if (model.kind === 'bar-chart')
      return Array.isArray(model.labels) && Array.isArray(model.values) &&
        model.labels.length === model.values.length &&
        int(model.labels.length, 2, 5) &&
        model.labels.every(x => typeof x === 'string' && x.length >= 1 && x.length <= 18) &&
        model.values.every(x => int(x, 1, 40)) &&
        (model.answerRule === 'total' ||
          (model.answerRule === 'difference' && Array.isArray(model.compare) &&
            model.compare.length === 2 &&
            model.compare.every(x => int(x, 0, model.values.length-1)) &&
            model.compare[0] !== model.compare[1] &&
            model.values[model.compare[0]] > model.values[model.compare[1]]));
    if (model.kind === 'fraction-strip')
      return int(model.parts, 2, 12) && int(model.shaded, 1, model.parts-1) &&
        model.answerRule === 'fraction';
    return false;
  };
  const renderDiagram = m => {
    const svg = (body, label, width, height) =>
      `<svg class="explorer-diagram" viewBox="0 0 ${width} ${height}" role="img"
        aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
    if (m.kind === 'array') {
      const step=32, w=m.columns*step+24, h=m.rows*step+24;
      const dots=Array.from({length:m.rows},(_,r)=>
        Array.from({length:m.columns},(_,c)=>
          `<circle cx="${28+c*step}" cy="${28+r*step}" r="11" fill="#1971c2" stroke="#0b4a87" stroke-width="1.5"/>`).join('')).join('');
      return svg(dots,`${m.rows} rows of ${m.columns} equal tiles`,w,h);
    }
    if (m.kind === 'number-line') {
      const x0=30,x1=410,y=64,dx=(x1-x0)/m.steps;
      const tick=Array.from({length:m.steps+1},(_,i)=>{
        const x=x0+i*dx,major=i===0||i===m.steps||m.steps<=10||i%2===0;
        const value=m.start+(m.end-m.start)*i/m.steps;
        const label=major?`<text x="${x}" y="99" text-anchor="middle" font-size="16" fill="#343a40">${Number(value.toFixed(3))}</text>`:'';
        return `<line x1="${x}" y1="52" x2="${x}" y2="77" stroke="#343a40" stroke-width="2.5"/>${label}`;
      }).join('');
      const x=x0+(m.point-m.start)/(m.end-m.start)*(x1-x0);
      return svg(`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#343a40" stroke-width="3"/>${tick}
        <circle cx="${x}" cy="${y}" r="10" fill="#e64980" stroke="#fff" stroke-width="3"/>`,
        `Number line from ${m.start} to ${m.end} in ${m.steps} equal steps, with a marked point at ${m.point}`,440,116);
    }
    if (m.kind === 'bar-chart') {
      const width=440,base=208,max=Math.max(...m.values),gap=width/(m.values.length+1);
      const bars=m.values.map((value,i)=>{
        const x=(i+1)*gap-26,h=value/max*150,y=base-h;
        return `<rect x="${x}" y="${y}" width="52" height="${h}" rx="4" fill="#1971c2"/>
          <text x="${x+26}" y="${y-7}" font-size="18" font-weight="700" text-anchor="middle" fill="#343a40">${value}</text>
          <text x="${x+26}" y="236" font-size="13" font-weight="700" text-anchor="middle" fill="#343a40">${esc(m.labels[i])}</text>`;
      }).join('');
      return svg(`<line x1="16" y1="${base}" x2="426" y2="${base}" stroke="#343a40" stroke-width="2"/>${bars}`,
        'Bar chart: '+m.labels.map((x,i)=>x+' '+m.values[i]).join(', '),440,255);
    }
    // All strips represent equal parts; do not alter their widths.
    const width=440,x0=16,each=408/m.parts;
    const cells=Array.from({length:m.parts},(_,i)=>
      `<rect x="${x0+i*each}" y="18" width="${each}" height="65" fill="${i<m.shaded?'#1971c2':'#fff'}" stroke="#343a40" stroke-width="2"/>`).join('');
    return svg(cells,`Fraction strip: ${m.shaded} of ${m.parts} equal parts shaded`,440,104);
  };
  const check = (rows, name, section) => {
    const ids = new Set();
    if (!Array.isArray(rows) || rows.length < 20) throw Error('Explorer bank is too small: ' + name);
    for (const q of rows) {
      if (!q || !/^[a-z0-9-]{6,80}$/.test(q.id) || ids.has(q.id) ||
          !Array.isArray(q.grades) || !q.grades.length ||
          new Set(q.grades).size !== q.grades.length ||
          !q.grades.every(grade => {
            const range = gradeRange(grade, section);
            return range && q.level >= range[0] && q.level <= range[1];
          }) || !q.domain || !q.context || !q.prompt ||
          !q.explanation || !Array.isArray(q.choices) || q.choices.length < 3 ||
          q.choices.length > 5 || !q.choices.includes(q.answer) ||
          new Set(q.choices.map(x => String(x).trim().toLowerCase())).size !== q.choices.length ||
          (q.asset && !validAsset(q.asset)) ||
          (q.representation && !validDiagram(q.representation)) ||
          (q.reasoningSteps && (!Array.isArray(q.reasoningSteps) ||
            q.reasoningSteps.length !== 3 || q.reasoningSteps.some(step =>
              typeof step !== 'string' || !step.trim() || step.length > 180)))) {
        throw Error('Invalid Explorer question in ' + name + ': ' + (q?.id || '(missing id)'));
      }
      ids.add(q.id);
    }
    return rows;
  };
  check(math, 'math', 'story');
  check(science, 'science', 'sci');
  const draw = (bank, row) => {
    const image = row.asset
      ? `<img class="explorer-asset" src="${esc(row.asset)}" alt="" loading="lazy" decoding="async">`
      : '';
    const diagram = row.representation ? renderDiagram(row.representation) : '';
    const reasoning = Array.isArray(row.reasoningSteps) && row.reasoningSteps.length === 3
      ? `<details class="explorer-reasoning"><summary>Show solving steps</summary><ol>${row.reasoningSteps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></details>` : '';
    const choices = shuffle(row.choices).map(answer => ({v:answer,html:esc(answer)}));
    return {
      key: `explorer-${bank}-${row.id}`,
      // Domain is an explicit authored learning objective, not guessed
      // from the grade or the question's difficulty number.
      curriculumSkill: row.domain, grades: row.grades.slice(),
      text: bank === 'math' ? 'Read the problem. Then solve it!' : 'Read the evidence. What do you think?',
      say: 'Find the answer!',
      main: `<article class="explorer-card">
        <div class="explorer-overline"><span aria-hidden="true">${bank === 'math' ? '🧮' : '🔬'}</span> ${esc(row.domain)}</div>
        <div class="explorer-body">${image}<p>${esc(row.context)}</p>${diagram}${reasoning}</div>
        <div class="explorer-question">${esc(row.prompt)}</div>
      </article>`,
      mainClass:'explorer-main',
      options:choices, answer:row.answer, optClass:'opt-text explorer-choices',
      hint:{html:'<div class="explorer-hint">Look back at the evidence. Try the steps one at a time.</div>',
        say:'Think about it!', remove:false},
      explanation:row.explanation, explorer:true
    };
  };
  // Eligibility belongs to each authored question's curriculum metadata,
  // not a level-to-grade assumption in the JavaScript generator.
  const choose = (bank, level, section) => {
    const grade = state.grade;
    if (!grade || !gradeRange(grade, section)) return null;
    const eligible = bank.filter(q => q.grades.includes(grade));
    const exact = eligible.filter(q => q.level === level);
    const previous = eligible.filter(q => q.level === level - 1);
    const pool = exact.length && (Math.random() < .88 || !previous.length)
      ? exact : previous.length ? previous : exact;
    return pool.length ? pick(pool) : null;
  };
  const wordProblems = CATEGORIES.find(x => x.id === 'story');
  const scienceGames = CATEGORIES.find(x => x.id === 'sci');
  if (!wordProblems || !scienceGames) throw Error('Explorer integration categories are missing');
  const originalMath = wordProblems.gen;
  const originalScience = scienceGames.gen;
  const withExplorer = (original, bank, kind, section, level, frequency) => {
    const candidate = choose(bank, level, section);
    return candidate && Math.random() < frequency ? draw(kind, candidate) : original(level);
  };
  wordProblems.gen = level => withExplorer(originalMath, math, 'math', 'story', level, .46);
  scienceGames.gen = level => withExplorer(originalScience, science, 'science', 'sci', level, .38);
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
