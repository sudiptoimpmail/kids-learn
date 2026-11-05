/* =========================================================
   🧮 Number Sense (1st–3rd grade)
   Level 1: even or odd, tens and ones (blocks), skip counting
   Level 2: value of a digit, before / after, rounding to 10
   Level 3: hundreds, rounding to 100, counting money (the child's own coins — see country.js)
   Level 4: fractions of a shape, comparing fractions
   Level 5: a fraction of a number, equal fractions, bigger money totals
   The voice says a short instruction; the numbers are on the screen.
   ========================================================= */
const NS_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#b197fc', '#ff922b'];
function nsBlocks(n) {
  // Base-ten manipulatives, not dozens of individual counters. A rod is ten,
  // a flat is one hundred, and only the remaining 0–9 ones are separate cubes.
  const hundreds = Math.floor(n / 100), tens = Math.floor(n / 10) % 10, ones = n % 10;
  const group = (name, count, cls) => count ? `<div class="ns-block-row ${name}" aria-hidden="true">${Array.from({ length: count }, () => `<span class="${cls}"></span>`).join('')}</div>` : '';
  return `<div class="ns-blocks" role="img" aria-label="Base-ten counting blocks: blue flats are hundreds, orange rods are tens and green cubes are ones.">
    ${group('ns-hundreds', hundreds, 'ns-flat')}
    ${group('ns-tens', tens, 'ns-rod')}
    ${group('ns-ones', ones, 'ns-cube')}
    <small class="ns-block-key">Blue flat = 100 · Orange stick = 10 · Green cube = 1</small>
  </div>`;
}
function nsPie(parts, shaded, bar) {
  const col = pick(NS_COLORS);
  if (bar) return `<svg viewBox="0 0 ${parts * 20} 24" class="ns-frac bar">${Array.from({ length: parts }, (_, i) => `<rect x="${i * 20 + 1}" y="1" width="18" height="22" rx="2" fill="${i < shaded ? col : '#fff'}" stroke="#495057" stroke-width="1.5"/>`).join('')}</svg>`;
  const R = 40, seg = (i) => { const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
    return `<path d="M50 50L${50 + R * Math.cos(a0)} ${50 + R * Math.sin(a0)}A${R} ${R} 0 ${parts === 1 ? 1 : 0} 1 ${50 + R * Math.cos(a1)} ${50 + R * Math.sin(a1)}Z" fill="${i < shaded ? col : '#fff'}" stroke="#495057" stroke-width="2"/>`; };
  return `<svg viewBox="0 0 100 100" class="ns-frac">${Array.from({ length: parts }, (_, i) => seg(i)).join('')}</svg>`;
}
const frac = (a, b) => `${a}/${b}`;
const fracHTML = (a, b) => `<span class="ns-f"><b>${a}</b><i>${b}</i></span>`;
// All currency artwork is a separate, bundled SVG asset (no inline SVG media).
// These educational images show denomination clearly without imitating legal tender.
function nsMoneyImage(kind, value, label, countryName) {
  const country = Object.keys(COUNTRIES).find(code =>
    COUNTRIES[code].label === countryName || COUNTRIES[code].name === countryName) ||
    (typeof countryCode === 'function' && countryCode() !== 'other' ? countryCode() : 'us');
  const safe = String(label).replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const title = String(countryName || country).replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const path = 'assets/currencies/' + country + '-' + (kind === 'note' ? 'note-' : '') + Number(value) + '.svg';
  const cls = kind === 'note' ? 'ns-currency-picture ns-banknote-picture' : 'ns-currency-picture';
  return `<img class="${cls}" src="${path}" alt="${title} ${safe} ${kind === 'note' ? 'banknote' : 'coin'} — illustrated" decoding="async">`;
}
function nsCoinPicture(value, label, countryName) {
  return nsMoneyImage('coin', value, label, countryName);
}
function nsBanknotePicture(value, label, countryName) {
  return nsMoneyImage('note', value, label, countryName);
}

function nsCoins(total, C) {
  const coins = C.coins.map((c) => c[0]).sort((a, b) => b - a);
  let out, left = 1;
  for (let tries = 0; tries < 6 && left; tries++) {
    out = []; left = total;
    for (const c of coins) while (left >= c && out.length < 12 && (tries > 3 || Math.random() < 0.85 || c === coins[coins.length - 1])) { out.push(c); left -= c; }
  }
  if (left) return null;
  const label = (v) => C.coins.find((c) => c[0] === v)[1];
  return `<div class="ns-coins" aria-label="Count the coins">${out.map((v) => `<span class="ns-coin c${coins.indexOf(v)%4}">${nsCoinPicture(v,label(v),C.label || C.name)}</span>`).join('')}</div>`;
}

function nsQ(key, text, sayQ, main, answer, wrong, n, optClass = 'opt-num') {
  const opts = shuffle([String(answer), ...sample([...new Set(wrong.map(String))].filter((x) => x !== String(answer)), n)]);
  return { key: `ns-${key}`, text, say: sayQ, main, mainClass: 'ph-main', options: opts.map((o) => ({ v: o, html: o.includes('/') ? fracHTML(...o.split('/')) : o })), answer: String(answer),
    optClass, hint: { html: '', say: 'Think about it!', remove: true } };
}

/* Measurement and data: real K–3 mathematical thinking, mixed into Number Sense.
   Levels 1–2 use nonstandard units and simple picture graphs; levels 3–5
   add comparisons, perimeter and area. Every picture is locally rendered. */
function genMeasureData(level) {
  const modes = level === 1 ? ['units', 'longer', 'graph'] :
    level === 2 ? ['units', 'longer', 'graph', 'graph'] :
    level === 3 ? ['units', 'graph', 'difference'] :
    ['graph', 'difference', 'perimeter', 'area'];
  const mode = pick(modes);
  if (mode === 'units') {
    const n = 3 + rand(level >= 2 ? 11 : 6);
    const blocks = '<div class="md-unit-row" role="img" aria-label="' + n +
      ' equal blocks in one row">' + Array.from({length:n}, () => '<span class="md-unit"></span>').join('') + '</div>';
    return nsQ('measure-units-' + n, 'Count the blocks. How long is the line?',
      'How many?', blocks, n, [n-2,n-1,n+1,n+2].filter(v=>v>0), level>=2?3:2);
  }
  if (mode === 'longer') {
    const a = 3 + rand(5), b = 3 + rand(5);
    if (a === b) return genMeasureData(level);
    const rows = '<div class="md-ribbons"><div><b>A</b><span class="md-ribbon" style="width:'+(a*9)+'%"></span></div>'+
      '<div><b>B</b><span class="md-ribbon md-blue" style="width:'+(b*9)+'%"></span></div></div>';
    return nsQ('measure-longer-'+a+'-'+b, 'Which ribbon is longer?', 'Find the answer!',
      rows, a>b?'A':'B', [a>b?'B':'A'], 1, 'opt-text two');
  }
  if (mode === 'perimeter' || mode === 'area') {
    const w = 2 + rand(6), h = 2 + rand(5), answer = mode === 'area' ? w*h : 2*(w+h);
    const diagram = '<div class="md-rectangle"><span class="md-width">'+w+' units</span><span class="md-grid" style="grid-template-columns:repeat('+w+',18px)">'+
      '<i></i>'.repeat(w*h)+'</span><span class="md-height">'+h+' units</span></div>';
    return nsQ('measure-'+mode+'-'+w+'-'+h,
      mode === 'area' ? 'How many square units cover the rectangle?' : 'What is the distance all around this rectangle?',
      'Find the answer!', diagram, answer,
      [answer+2,answer-2,mode==='area'?2*(w+h):w*h,answer+w,answer+h].filter(v=>v>0&&v!==answer),3);
  }
  const labels=['apples','bananas','grapes'];
  let values;
  do {values = [2+rand(6),2+rand(6),2+rand(6)];} while(new Set(values).size!==3);
  const hi = values.indexOf(Math.max(...values)), lo=values.indexOf(Math.min(...values));
  const chart='<div class="md-graph" role="img" aria-label="Picture graph: '+
    labels.map((name,i)=>name+' '+values[i]).join(', ')+'">'+labels.map((name,i)=>
      '<div class="md-graph-row"><span>'+name+'</span><div class="md-graph-bar">'+
      '<i style="width:'+(values[i]*12)+'%"></i></div><b>'+values[i]+'</b></div>').join('')+'</div>';
  if(mode==='difference') {
    const answer=values[hi]-values[lo];
    return nsQ('data-difference-'+values.join('-'),'How many more votes did the most popular fruit get than the least popular?',
      'Find the answer!',chart,answer,[answer-1,answer+1,answer+2,values[hi]].filter(v=>v>=0),3);
  }
  return nsQ('data-most-'+values.join('-'),'Which fruit got the most votes?',
    'Find the answer!',chart,labels[hi],labels.filter(x=>x!==labels[hi]),2,'opt-text');
}

function genNumSense(level) {
  if (Math.random() < 0.27) return genMeasureData(level);
  const n = level >= 2 ? 3 : 2, t = Math.random();
  const C = (typeof myCountry === 'function' && myCountry()) || COUNTRIES.us;
  if (level >= 5 && t < 0.65) {
    const k = Math.random();
    if (k < 0.4) {
      const d = pick([2, 3, 4, 5, 10]), whole = d * (2 + rand(level >= 5 ? 9 : 5)), ans = whole / d;
      return nsQ(`of-${d}-${whole}`, `What is ${fracHTML(1, d)} of <b>${whole}</b>?`, ['Find the answer!'], `<div class="ns-big">${fracHTML(1, d)} of ${whole}</div>`, ans, [ans + 1, ans - 1, ans * 2, whole - ans, d].filter((x) => x > 0), n);
    }
    if (k < 0.7) {
      const [a, b] = pick([[1, 2], [1, 3], [1, 4], [2, 3], [3, 4]]), m = pick([2, 3]);
      return nsQ(`eq-${a}${b}${m}`, `Which fraction is the same as ${fracHTML(a, b)}?`, ['Which fraction is the same?'], `<div class="ns-big">${fracHTML(a, b)} = ?</div>`, frac(a * m, b * m), [frac(a + m, b + m), frac(a * m, b), frac(a, b * m), frac(b * m, a * m)], n);
    }
    const unit = C.coins[0][0], total = unit >= 100 ? 100 * (5 + rand(40)) : 100 + unit * rand(Math.floor(150 / unit)), main = nsCoins(total, C);
    if (main) return nsQ(`money-${total}`, 'How much money?', ['How much money?'], main, C.fmt(total), [C.fmt(total + unit), C.fmt(total - unit), C.fmt(total + 10 * unit), C.fmt(total - 10 * unit)], n, 'opt-text');
  }
  if (level >= 4 && t < 0.7) {
    if (Math.random() < 0.6) {
      const parts = pick([2, 3, 4, 4, 6, 8]), shaded = 1 + rand(parts - 1);
      return nsQ(`pie-${parts}-${shaded}`, 'What fraction is colored?', ['What fraction is colored?'], nsPie(parts, shaded, Math.random() < 0.4), frac(shaded, parts),
        [frac(parts - shaded, parts), frac(shaded, parts + 1), frac(parts, shaded), frac(shaded + 1, parts)].filter((x) => x !== frac(shaded, parts)), n);
    }
    const d = pick([3, 4, 5, 6, 8]), a = 1 + rand(d - 1), b = 1 + rand(d - 1), sign = a > b ? '>' : a < b ? '<' : '=';
    return nsQ(`cmp-${a}-${b}-${d}`, 'Which sign makes it true?', ['Which sign makes it true?'], `<div class="ns-big">${fracHTML(a, d)} <span class="ns-gap">?</span> ${fracHTML(b, d)}</div>`, sign, ['>', '<', '='], 2);
  }
  if (level >= 3 && t < 0.75) {
    const k = Math.random();
    if (k < 0.3) { const v = 100 + rand(300); return nsQ(`blocks3-${v}`, 'Count hundreds, tens and ones.', ['How many?'], nsBlocks(v), v, [v + 10, v - 10, v + 100, v - 100, v + 1].filter((x) => x > 0), n); }
    if (k < 0.55) { const v = 101 + rand(898), r = Math.round(v / 100) * 100; return nsQ(`r100-${v}`, `Round <b>${v}</b> to the nearest hundred.`, ['Round to the nearest hundred.'], `<div class="ns-big">${v}</div>`, r, [r + 100, r - 100, Math.round(v / 10) * 10, Math.floor(v / 100) * 100 === r ? r + 100 : Math.floor(v / 100) * 100].filter((x) => x >= 0), n); }
    if (k < 0.75) {
      const v = 100 + rand(900), s = String(v), i = pick([0, 1, 2].filter((j) => s[j] !== '0')), val = +s[i] * [100, 10, 1][i];
      return nsQ(`val3-${v}-${i}`, 'What is the value of the blue digit?', ['What is the value of the blue digit?'], `<div class="ns-big">${s.split('').map((c, j) => (j === i ? `<span class="ns-hl">${c}</span>` : c)).join('')}</div>`, val, [+s[i], +s[i] * 10, +s[i] * 100, +s[i] * 1000].filter((x) => x !== val), n);
    }
    const unit = C.coins[0][0], total = unit >= 100 ? 100 * (3 + rand(30)) : unit * (3 + rand(Math.floor(95 / unit))), main = nsCoins(total, C);
    if (main) return nsQ(`money-${total}`, 'How much money?', ['How much money?'], main, C.fmt(total), [C.fmt(total + unit), C.fmt(Math.max(unit, total - unit)), C.fmt(total + 5 * unit), C.fmt(total * 2)], n, 'opt-text');
  }
  if (level === 2 && t < 0.8) {
    const k = Math.random();
    if (k < 0.35) {
      const v = 10 + rand(90), s = String(v), i = pick([0, 1].filter((j) => s[j] !== '0')), val = +s[i] * (i ? 1 : 10);
      return nsQ(`val2-${v}-${i}`, 'What is the value of the blue digit?', ['What is the value of the blue digit?'], `<div class="ns-big">${s.split('').map((c, j) => (j === i ? `<span class="ns-hl">${c}</span>` : c)).join('')}</div>`, val, [+s[i], +s[i] * 10, +s[i] * 100, v].filter((x) => x !== val), n);
    }
    if (k < 0.65) { const v = 11 + rand(88), r = Math.round(v / 10) * 10; return nsQ(`r10-${v}`, `Round <b>${v}</b> to the nearest ten.`, ['Round to the nearest ten.'], `<div class="ns-big">${v}</div>`, r, [r + 10, r - 10, v, Math.floor(v / 10) * 10 === r ? r + 10 : Math.floor(v / 10) * 10].filter((x) => x >= 0), n); }
    const v = 2 + rand(97), kind = rand(3);
    const [txt, ans] = kind === 0 ? [`What comes just after <b>${v}</b>?`, v + 1] : kind === 1 ? [`What comes just before <b>${v}</b>?`, v - 1] : [`What number is between <b>${v - 1}</b> and <b>${v + 1}</b>?`, v];
    return nsQ(`ba-${kind}-${v}`, txt, [kind === 0 ? 'What comes just after?' : kind === 1 ? 'What comes just before?' : 'What number is between?'], `<div class="ns-big">${kind === 2 ? `${v - 1} , ? , ${v + 1}` : v}</div>`, ans, [ans + 1, ans - 1, ans + 10, ans - 10, ans + 2].filter((x) => x >= 0), n);
  }
  // Review within the child's current grade, not a surprise Level-1 counting card.
  // Previously roughly 20% of high-level questions fell through to the toddler pool.
  // higher levels fall back to the level below (a mix of its question types), never to plain counting only
  if (level >= 4) return genNumSense(level - 1);
  if (level >= 3) {
    const v = 101 + rand(299);
    return nsQ(`blocks3-${v}`, 'Count hundreds, tens and ones.', ['How many?'],
      nsBlocks(v), v, [v + 10, v - 10, v + 100, v - 100, v + 1].filter((x) => x > 0), n);
  }
  if (level >= 2) {
    const v = 11 + rand(88), rounded = Math.round(v / 10) * 10;
    return nsQ(`r10-${v}`, `Round <b>${v}</b> to the nearest ten.`, ['Round to the nearest ten.'],
      `<div class="ns-big">${v}</div>`, rounded, [rounded + 10, rounded - 10, v, Math.floor(v / 10) * 10].filter((x) => x >= 0), n);
  }
  // level 1
  const k = Math.random();
  if (k < 0.35) { const v = 1 + rand(30); return nsQ(`eo-${v}`, `Is <b>${v}</b> even or odd?`, ['Is it even or odd?'], `<div class="ns-big">${v}</div><div class="ns-dots">${'●'.repeat(Math.min(v, 30))}</div>`, v % 2 ? 'odd' : 'even', ['even', 'odd'], 1, 'opt-text'); }
  if (k < 0.7) { const v = 10 + rand(30); return nsQ(`blocks-${v}`, 'Count the tens and ones.', ['How many?'], nsBlocks(v), v, [v + 10, v - 10, v + 1, v - 1, +String(v).split('').reverse().join('')].filter((x) => x > 0), n); }
  const step = pick([2, 5, 10]), start = step * rand(6), seq = Array.from({ length: 5 }, (_, i) => start + i * step), miss = 1 + rand(3);
  return nsQ(`skip-${step}-${start}-${miss}`, `Count by ${step}s. What number is missing?`, ['What number is missing?'],
    `<div class="think-pattern">${seq.map((x, i) => `<span${i === miss ? ' class="think-missing"' : ''}>${i === miss ? '?' : x}</span>`).join('')}</div>`, seq[miss], [seq[miss] + 1, seq[miss] - 1, seq[miss] + step, seq[miss] - step].filter((x) => x >= 0), n);
}
