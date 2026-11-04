/* =========================================================
   Reading games in the style of a phonics workbook (untimed, shown with Reading & Words):
   🔎 Word Search — find the hidden picture words: drag a finger across the letters
   📰 Picture Crossword — two or three little words cross; fill the boxes from the letter tiles
   Words are three-letter words with a clear picture (W3 in content.js).
   ========================================================= */
const WG_WORDS = () => W3.filter(([w]) => /^[a-z]{3}$/.test(w) && !(typeof PHON_SKIP !== 'undefined' && PHON_SKIP.has(w)));

/* ---------- 🔎 Word Search ---------- */
const WS_SIZES = [[5, 3, false], [6, 4, true], [7, 5, true], [8, 6, true]];   // grid size, words, also downward
function makeWordSearch(size, count, down) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const placed = [];
    for (const [w, e] of shuffle(WG_WORDS())) {
      if (placed.length >= count) break;
      if (placed.some((p) => p.w === w)) continue;
      for (let t = 0; t < 40; t++) {
        const dir = down && Math.random() < 0.45 ? [0, 1] : [1, 0];
        const x = rand(size - (dir[0] ? w.length - 1 : 0)), y = rand(size - (dir[1] ? w.length - 1 : 0));
        const cells = w.split('').map((_, i) => [x + dir[0] * i, y + dir[1] * i]);
        if (cells.every(([cx, cy], i) => !grid[cy][cx] || grid[cy][cx] === w[i])) {
          cells.forEach(([cx, cy], i) => (grid[cy][cx] = w[i]));
          placed.push({ w, e, cells });
          break;
        }
      }
    }
    if (placed.length < count) continue;
    // fill the rest with random letters, but never by chance spelling another hidden word
    const abc = 'abcdefghijklmnoprstuvwy';
    for (const row of grid) for (let i = 0; i < size; i++) if (!row[i]) row[i] = abc[rand(abc.length)];
    const text = (cells) => cells.map(([x, y]) => grid[y][x]).join('');
    let dup = false;
    for (const p of placed) {
      let n = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const cells = [0, 1, 2].map((i) => [x + dx * i, y + dy * i]);
        if (cells.every(([cx, cy]) => cx < size && cy < size) && text(cells) === p.w) n++;
      }
      if (n !== 1) dup = true;
    }
    if (!dup) return { grid, placed };
  }
  return null;
}
function startWordSearch() {
  const lv = GL('wsearch'), [size, count, down] = WS_SIZES[Math.min(lv, WS_SIZES.length) - 1];
  const puzzle = makeWordSearch(size, count, down);
  if (!puzzle) return startWordSearch();
  const { grid, placed } = puzzle;
  const area = $('#gameArea');
  area.innerHTML = `<div class="g-msg">Find the hidden words! 🔎<small>Drag your finger across the letters.</small></div>
    <div class="ws-clues">${placed.map((p, i) => `<button class="ws-clue" data-i="${i}" data-speak="${p.w}"><span>${p.e}</span><b>${p.w}</b></button>`).join('')}</div>
    <div class="ws-grid" style="--n:${size}">${grid.map((row, y) => row.map((c, x) => `<div class="ws-cell" data-x="${x}" data-y="${y}">${c}</div>`).join('')).join('')}</div>`;
  say(['Find the hidden words!', 'Drag your finger across the letters.']);
  const board = $('.ws-grid', area), cellEl = (x, y) => board.children[y * size + x];
  let start = null, sel = [], found = 0;
  const colors = ['#ffd43b', '#8ce99a', '#74c0fc', '#ffa8a8', '#d0bfff', '#ffc078'];
  const at = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.classList.contains('ws-cell') && board.contains(el) ? [+el.dataset.x, +el.dataset.y] : null; };
  const line = (a, b) => {
    // a straight line across or down from the first letter (forward only, like the book)
    if (!a || !b) return [];
    if (a[1] === b[1] && b[0] >= a[0]) return Array.from({ length: b[0] - a[0] + 1 }, (_, i) => [a[0] + i, a[1]]);
    if (a[0] === b[0] && b[1] >= a[1]) return Array.from({ length: b[1] - a[1] + 1 }, (_, i) => [a[0], a[1] + i]);
    return [a];
  };
  const paintSel = () => { $$('.ws-cell.sel', board).forEach((c) => c.classList.remove('sel')); sel.forEach(([x, y]) => cellEl(x, y).classList.add('sel')); };
  board.addEventListener('pointerdown', (e) => { e.preventDefault(); const c = at(e); if (!c) return; start = c; sel = [c]; board.setPointerCapture && board.setPointerCapture(e.pointerId); paintSel(); sfx.tap(); });
  board.addEventListener('pointermove', (e) => { if (!start) return; const c = at(e); if (!c) return; const s2 = line(start, c); if (s2.length !== sel.length) { sel = s2; paintSel(); } });
  const finish = () => {
    if (!start) return;
    const word = sel.map(([x, y]) => grid[y][x]).join('');
    const hit = placed.findIndex((p) => !p.got && p.cells.length === sel.length && p.cells.every(([x, y], i) => x === sel[i][0] && y === sel[i][1]));
    start = null;
    if (hit >= 0) {
      const p = placed[hit]; p.got = true; found++;
      p.cells.forEach(([x, y]) => { const el = cellEl(x, y); el.classList.add('got'); el.style.background = colors[hit % colors.length]; });
      $(`.ws-clue[data-i="${hit}"]`, area).classList.add('got');
      sfx.yes(); say([p.w]);
      if (found === placed.length) {
        const up = gameLevelUp('wsearch', 2);
        later(() => { gameWin(pick(['You found them all!', 'Great job!', 'Awesome job!'])); }, 700);
        later(() => endPanel(up ? 'You found them all! Next: a bigger puzzle' : 'You found them all!', '🔎', null, up), 2000);
      }
    } else if (sel.length >= 3 && word.length) sfx.no();
    sel = []; paintSel();
  };
  board.addEventListener('pointerup', finish); board.addEventListener('pointercancel', finish);
  $$('.ws-clue', area).forEach((b) => (b.onclick = () => { sfx.tap(); say([b.dataset.speak]); }));
  if (state.testMode || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__wordSearch = { placed, find: (i) => { sel = placed[i].cells.slice(); start = sel[0]; finish(); } };
}

/* ---------- 📰 Picture Crossword ---------- */
// level 1: two words cross (a + or an L) · level 2: three words · level 3: three words, fewer letters given
function makeCrossword(nWords) {
  const words = WG_WORDS();
  for (let attempt = 0; attempt < 200; attempt++) {
    const first = pick(words), list = [{ w: first[0], e: first[1], x: 0, y: 0, dx: 1, dy: 0 }];
    const cell = new Map([['0,0', first[0][0]], ['1,0', first[0][1]], ['2,0', first[0][2]]]);
    let ok = true;
    while (list.length < nWords && ok) {
      ok = false;
      const base = list[list.length - 1];
      for (const [w, e] of shuffle(words.slice())) {
        if (list.some((p) => p.w === w)) continue;
        // cross the last word at one of its letters, going the other way
        const spots = [];
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (base.w[i] === w[j]) spots.push([i, j]);
        for (const [i, j] of shuffle(spots)) {
          const dx = base.dy, dy = base.dx;                                  // perpendicular
          const cx = base.x + base.dx * i, cy = base.y + base.dy * i;
          const x = cx - dx * j, y = cy - dy * j;
          const cells = [0, 1, 2].map((k) => [x + dx * k, y + dy * k]);
          // fits: same letter where it crosses, empty elsewhere, and no letter touching the new word's sides
          const fits = cells.every(([px, py], k) => {
            const have = cell.get(px + ',' + py);
            if (k === j) return have === w[k];
            if (have) return false;
            const side = dx ? [[px, py - 1], [px, py + 1]] : [[px - 1, py], [px + 1, py]];
            return side.every(([sx, sy]) => !cell.has(sx + ',' + sy));
          }) && !cell.has((x - dx) + ',' + (y - dy)) && !cell.has((x + dx * 3) + ',' + (y + dy * 3));
          if (!fits) continue;
          cells.forEach(([px, py], k) => cell.set(px + ',' + py, w[k]));
          list.push({ w, e, x, y, dx, dy });
          ok = true; break;
        }
        if (ok) break;
      }
    }
    if (list.length < nWords) continue;
    const xs = [...cell.keys()].map((k) => +k.split(',')[0]), ys = [...cell.keys()].map((k) => +k.split(',')[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    // leave a column/row of room for the picture clues
    const shift = (p) => ({ ...p, x: p.x - minX + 1, y: p.y - minY + 1 });
    const cells = new Map([...cell].map(([k, v]) => { const [a, b] = k.split(',').map(Number); return [`${a - minX + 1},${b - minY + 1}`, v]; }));
    return { words: list.map(shift), cells, w: Math.max(...xs) - minX + 2, h: Math.max(...ys) - minY + 2 };
  }
  return null;
}
function startCrossword() {
  const lv = GL('xword'), puzzle = makeCrossword(lv >= 2 ? 3 : 2);
  if (!puzzle) return startCrossword();
  const { words, cells, w: W, h: H } = puzzle;
  // given letters: where words cross (like the book), plus one more at level 1
  const crossing = [...cells.keys()].filter((k) => words.filter((p) => [0, 1, 2].some((i) => `${p.x + p.dx * i},${p.y + p.dy * i}` === k)).length > 1);
  const given = new Set(lv >= 3 ? crossing.slice(0, 1) : crossing);
  if (lv <= 1) { const extra = shuffle([...cells.keys()].filter((k) => !given.has(k)))[0]; if (extra) given.add(extra); }
  const typed = new Map();
  const area = $('#gameArea');
  const clueAt = new Map(words.map((p, i) => [`${p.x - p.dx},${p.y - p.dy}`, i]));
  let html = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = `${x},${y}`;
    if (cells.has(k)) html += `<button class="xw-cell ${given.has(k) ? 'given' : ''}" data-k="${k}">${given.has(k) ? cells.get(k) : ''}</button>`;
    else if (clueAt.has(k)) { const p = words[clueAt.get(k)]; html += `<button class="xw-clue" data-speak="${p.w}">${p.e}<i>${p.dx ? '→' : '↓'}</i></button>`; }
    else html += '<span></span>';
  }
  const need = [...cells.keys()].filter((k) => !given.has(k)).map((k) => cells.get(k));
  const extras = sample('abcdefghijklmnoprstuvwy'.split('').filter((c) => !need.includes(c)), lv >= 2 ? 3 : 2);
  area.innerHTML = `<div class="g-msg">Fill in the crossword! 📰<small>Tap a box, then tap a letter. The pictures are the clues.</small></div>
    <div class="xw-grid" style="--w:${W};--h:${H}">${html}</div>
    <div class="xw-keys">${shuffle([...new Set(need), ...extras]).map((c) => `<button class="xw-key" data-l="${c}">${c}</button>`).join('')}<button class="xw-key del" data-l="">⌫</button></div>`;
  say(['Fill in the crossword!', 'Tap a box, then tap a letter.']);
  const grid = $('.xw-grid', area), cellEl = (k) => $(`.xw-cell[data-k="${k}"]`, grid);
  const open = [...cells.keys()].filter((k) => !given.has(k));
  let selK = open[0], done = false;
  const wordCells = (p) => [0, 1, 2].map((i) => `${p.x + p.dx * i},${p.y + p.dy * i}`);
  const letter = (k) => (given.has(k) ? cells.get(k) : typed.get(k) || '');
  const paint = () => $$('.xw-cell', grid).forEach((el) => el.classList.toggle('sel', el.dataset.k === selK && !done));
  function checkWords() {
    for (const p of words) {
      const ks = wordCells(p);
      if (p.ok || !ks.every((k) => letter(k))) continue;
      if (ks.map(letter).join('') === p.w) { p.ok = true; ks.forEach((k) => cellEl(k).classList.add('ok')); sfx.yes(); say([p.w]); }
      else { ks.filter((k) => !given.has(k) && typed.get(k) !== cells.get(k)).forEach((k) => { typed.delete(k); const el = cellEl(k); el.textContent = ''; el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); }); sfx.no(); }
    }
    if (!done && words.every((p) => p.ok)) {
      done = true; paint();
      const up = gameLevelUp('xword', 2);
      later(() => gameWin(pick(['You did it!', 'Great job!', 'Super speller!'])), 700);
      later(() => endPanel(up ? 'You did it! Next: a bigger crossword' : 'You did it!', '📰', null, up), 2000);
    }
  }
  grid.addEventListener('click', (e) => {
    const c = e.target.closest('.xw-cell'), clue = e.target.closest('.xw-clue');
    if (clue) { sfx.tap(); say([clue.dataset.speak]); return; }
    if (!c || done || given.has(c.dataset.k)) return;
    sfx.tap(); selK = c.dataset.k; paint();
  });
  $$('.xw-key', area).forEach((b) => (b.onclick = () => {
    if (done || !selK) return;
    sfx.tap();
    const l = b.dataset.l, el = cellEl(selK);
    if (!l) { typed.delete(selK); el.textContent = ''; return; }
    typed.set(selK, l); el.textContent = l;
    checkWords();
    // next empty box (in reading order)
    const next = open.find((k) => !typed.get(k) && !words.some((p) => p.ok && wordCells(p).includes(k)));
    if (next) selK = next;
    paint();
  }));
  paint();
  if (state.testMode || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__crossword = { words, cells, given, type: (k, l) => { selK = k; $(`.xw-key[data-l="${l}"]`, area).click(); } };
}
