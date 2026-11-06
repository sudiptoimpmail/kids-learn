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
  // Shared diagram grammar. All instructional values are authored in JSON;
  // no grade-dependent visual rules or answer data are embedded in rendering.
  const visualValid = v => {
    if (!v) return true;
    const integer = (x,lo,hi) => Number.isInteger(x) && x >= lo && x <= hi;
    if (v.kind === 'array') return integer(v.rows,1,10) && integer(v.columns,1,10);
    if (v.kind === 'fraction-strip') return integer(v.parts,2,10) &&
      integer(v.shaded,1,v.parts);
    if (v.kind === 'number-line') return integer(v.start,0,100) &&
      integer(v.end,v.start+1,100) && integer(v.step,1,20) &&
      (v.end-v.start)%v.step===0 && (v.mark-v.start)%v.step===0 &&
      integer(v.mark,v.start,v.end) && (v.end-v.start)/v.step<=20;
    if (v.kind === 'bar-graph') return Array.isArray(v.labels) &&
      v.labels.length>=2 && v.labels.length<=5 &&
      v.labels.every(x=>typeof x==='string' && /^[a-zA-Z0-9 ]{1,12}$/.test(x)) &&
      new Set(v.labels).size===v.labels.length &&
      Array.isArray(v.values) && v.values.length===v.labels.length &&
      v.values.every(x=>integer(x,1,100)) &&
      Array.isArray(v.compare) && v.compare.length===2 &&
      v.compare.every(i=>integer(i,0,v.values.length-1)) &&
      v.compare[0]!==v.compare[1];
    return false;
  };
  const renderVisual = v => {
    if (!v) return '';
    let content='', label='', height=175;
    if (v.kind==='array') {
      const cell = Math.min(30, 270/v.columns, 144/v.rows);
      const width=v.columns*cell, top=Math.max(10,(175-v.rows*cell)/2);
      content = Array.from({length:v.rows*v.columns},(_,i)=>{
        const cx=170-width/2+((i%v.columns)+.5)*cell;
        const cy=top+(Math.floor(i/v.columns)+.5)*cell;
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(cell*.28).toFixed(1)}" fill="#145e9b" stroke="#11355b" stroke-width="1.5"/>`;
      }).join('');
      label=`An array of ${v.rows} rows, ${v.columns} dots per row`;
    } else if(v.kind==='fraction-strip') {
      const width=300/v.parts;
      content=Array.from({length:v.parts},(_,i)=>
        `<rect x="${20+i*width}" y="38" width="${width}" height="82" fill="${i<v.shaded?'#145e9b':'#ffffff'}" stroke="#24344b" stroke-width="2"/>`).join('');
      label=`A fraction strip with ${v.parts} equal parts, ${v.shaded} filled blue`;
    } else if(v.kind==='number-line') {
      height=116;
      const n=(v.end-v.start)/v.step, dx=298/n;
      content='<path d="M 20 55 H 318" stroke="#24344b" stroke-width="3"/>';
      content+=Array.from({length:n+1},(_,i)=>{
        const x=20+dx*i,value=v.start+v.step*i;
        return `<path d="M ${x} 45 V 65" stroke="#24344b" stroke-width="2"/><text x="${x}" y="87" font-size="12" text-anchor="middle" fill="#24344b">${value}</text>`;
      }).join('');
      const x=20+dx*((v.mark-v.start)/v.step);
      content+=`<circle cx="${x}" cy="55" r="8" fill="#dd335a" stroke="#ffffff" stroke-width="2"/>`;
      label=`Number line from ${v.start} to ${v.end} in steps of ${v.step}, with a blue point at ${v.mark}`;
    } else if(v.kind==='bar-graph') {
      height=198;const max=Math.max(...v.values), width=245/v.values.length;
      content='<path d="M 36 159 H 318" stroke="#24344b" stroke-width="3"/>';
      content+=v.values.map((count,i)=>{
        const x=40+i*width+8, barH=count/max*113, y=158-barH;
        return `<rect x="${x}" y="${y}" width="${Math.min(54,width-16)}" height="${barH}" fill="#145e9b" stroke="#11355b"/><text x="${x+Math.min(54,width-16)/2}" y="${y-7}" text-anchor="middle" font-size="15" fill="#24344b">${count}</text><text x="${x+Math.min(54,width-16)/2}" y="181" text-anchor="middle" font-size="13" fill="#24344b">${esc(v.labels[i])}</text>`;
      }).join('');
      label='Bar graph: '+v.labels.map((x,i)=>x+' '+v.values[i]).join(', ');
    }
    return `<div class="explorer-visual"><svg viewBox="0 0 340 ${height}" role="img" aria-label="${esc(label)}" focusable="false" xmlns="http://www.w3.org/2000/svg">${content}</svg></div>`;
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
          (q.asset && !validAsset(q.asset)) || !visualValid(q.visual)) {
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
        <div class="explorer-body">${image}${renderVisual(row.visual)}<p>${esc(row.context)}</p></div>
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
