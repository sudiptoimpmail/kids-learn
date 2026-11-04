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
function nsCoins(total, C) {
  // pick coins that add up to the total, biggest first with a little variety
  const coins = C.coins.map((c) => c[0]).sort((a, b) => b - a);
  let out, left = 1;
  for (let tries = 0; tries < 6 && left; tries++) {
    out = []; left = total;
    for (const c of coins) while (left >= c && out.length < 12 && (tries > 3 || Math.random() < 0.85 || c === coins[coins.length - 1])) { out.push(c); left -= c; }
  }
  if (left) return null;
  const label = (v) => C.coins.find((c) => c[0] === v)[1];
  return `<div class="ns-coins">${out.map((v) => `<span class="ns-coin c${coins.indexOf(v) % 4}">${label(v)}</span>`).join('')}</div>`;
}
function nsQ(key, text, sayQ, main, answer, wrong, n, optClass = 'opt-num') {
  const opts = shuffle([String(answer), ...sample([...new Set(wrong.map(String))].filter((x) => x !== String(answer)), n)]);
  return { key: `ns-${key}`, text, say: sayQ, main, mainClass: 'ph-main', options: opts.map((o) => ({ v: o, html: o.includes('/') ? fracHTML(...o.split('/')) : o })), answer: String(answer),
    optClass, hint: { html: '', say: 'Think about it!', remove: true } };
}
function genNumSense(level) {
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
    if (k < 0.3) { const v = 100 + rand(300); return nsQ(`blocks3-${v}`, 'Count hundreds, tens and ones.', ['Count hundreds, tens and ones.'], nsBlocks(v), v, [v + 10, v - 10, v + 100, v - 100, v + 1].filter((x) => x > 0), n); }
    if (k < 0.55) { const v = 101 + rand(898), r = Math.round(v / 100) * 100; return nsQ(`r100-${v}`, `Round <b>${v}</b> to the nearest hundred.`, ['Round to the nearest hundred.'], `<div class="ns-big">${v}</div>`, r, [r + 100, r - 100, Math.round(v / 10) * 10, Math.floor(v / 100) * 100 === r ? r + 100 : Math.floor(v / 100) * 100].filter((x) => x >= 0), n); }
    if (k < 0.75) {
      const v = 100 + rand(900), s = String(v), i = pick([0, 1, 2].filter((j) => s[j] !== '0')), val = +s[i] * [100, 10, 1][i];
      return nsQ(`val3-${v}-${i}`, 'What is the value of the blue digit?', ['What is the value of the blue digit?'], `<div class="ns-big">${s.split('').map((c, j) => (j === i ? `<span class="ns-hl">${c}</span>` : c)).join('')}</div>`, val, [+s[i], +s[i] * 10, +s[i] * 100, +s[i] * 1000].filter((x) => x !== val), n);
    }
    const unit = C.coins[0][0], total = unit >= 100 ? 100 * (3 + rand(30)) : unit * (3 + rand(Math.floor(95 / unit))), main = nsCoins(total, C);
    if (main) return nsQ(`money-${total}`, 'How much money?', ['How much money?'], main, C.fmt(total), [C.fmt(total + unit), C.fmt(Math.max(unit, total - unit)), C.fmt(total + 5 * unit), C.fmt(total * 2)], n, 'opt-text');
  }
  if (level >= 2 && t < 0.8) {
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
  if (level >= 3) {
    const v = 101 + rand(299);
    return nsQ(`blocks3-${v}`, 'Count hundreds, tens and ones.', ['Count hundreds, tens and ones.'],
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
  if (k < 0.7) { const v = 10 + rand(30); return nsQ(`blocks-${v}`, 'Count the tens and ones.', ['Count the tens and ones.'], nsBlocks(v), v, [v + 10, v - 10, v + 1, v - 1, +String(v).split('').reverse().join('')].filter((x) => x > 0), n); }
  const step = pick([2, 5, 10]), start = step * rand(6), seq = Array.from({ length: 5 }, (_, i) => start + i * step), miss = 1 + rand(3);
  return nsQ(`skip-${step}-${start}-${miss}`, `Count by ${step}s. What number is missing?`, ['What number is missing?'],
    `<div class="think-pattern">${seq.map((x, i) => `<span${i === miss ? ' class="think-missing"' : ''}>${i === miss ? '?' : x}</span>`).join('')}</div>`, seq[miss], [seq[miss] + 1, seq[miss] - 1, seq[miss] + step, seq[miss] - step].filter((x) => x >= 0), n);
}
