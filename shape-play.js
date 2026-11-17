/* Shape games and the solid-to-flat lesson, drawn for question-bank records (banks/learn-play.geometry.json).
   Three activity kinds (QUESTION-FORMAT.md, "activity"):
     shape-match   { shapes: [...] }                       drag each shape onto its matching outline
     shape-build   { picture, guide: 'parts' | 'whole' }   put shapes together to make a house, car, rocket…
     shape-puzzle  { picture, guide }                      the pieces start turned: tap to turn, then drag into place
   One lesson animation kind:
     solid-to-flat { solids: [...] }                       a solid, then the flat shape seen from the side or from below
   A wrong drop is a try (the piece goes back); finishing the board answers the card. */
const ShapePlay = (() => {
  const INK = '#2b2140';
  /* ---- the flat shapes, each drawn around (0, 0) in a box w wide and h high ---- */
  const poly = (pts) => `<polygon points="${pts.map((p) => p.map((n) => +n.toFixed(1)).join(',')).join(' ')}"/>`;
  const ring = (n, w, h, turn = -90) => Array.from({ length: n }, (_, i) => { const a = (turn + i * 360 / n) * Math.PI / 180; return [Math.cos(a) * w / 2, Math.sin(a) * h / 2]; });
  const DRAW = {
    circle: (w, h) => `<ellipse rx="${w / 2}" ry="${h / 2}"/>`, oval: (w, h) => `<ellipse rx="${w / 2}" ry="${h / 2}"/>`,
    square: (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2"/>`, rectangle: (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2"/>`,
    triangle: (w, h) => poly([[0, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]),
    rtriangle: (w, h) => poly([[-w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]),        // the square corner is bottom left
    ltriangle: (w, h) => poly([[w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]),         // the square corner is bottom right
    diamond: (w, h) => poly([[0, -h / 2], [w / 2, 0], [0, h / 2], [-w / 2, 0]]),
    trapezoid: (w, h) => poly([[-w * 0.3, -h / 2], [w * 0.3, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]),
    semicircle: (w, h) => `<path d="M${-w / 2} ${h / 2} A${w / 2} ${h} 0 0 1 ${w / 2} ${h / 2} Z"/>`,
    pentagon: (w, h) => poly(ring(5, w, h)), hexagon: (w, h) => poly(ring(6, w, h, 0)),
    star: (w, h) => poly(Array.from({ length: 10 }, (_, i) => { const a = (-90 + i * 36) * Math.PI / 180, r = i % 2 ? 0.42 : 1; return [Math.cos(a) * r * w / 2, Math.sin(a) * r * h / 2]; })),
    heart: (w, h) => `<path d="M0 ${h * 0.5} C${-w * 0.75} ${h * 0.05} ${-w * 0.45} ${-h * 0.62} 0 ${-h * 0.22} C${w * 0.45} ${-h * 0.62} ${w * 0.75} ${h * 0.05} 0 ${h * 0.5} Z"/>`,
  };
  // how far a shape must be turned before it looks the same again (the puzzle turns by quarter turns)
  const sameEvery = (shape, w, h) => (shape === 'circle' || ((shape === 'square' || shape === 'oval' || shape === 'diamond') && w === h) ? 90
    : ['rectangle', 'square', 'oval', 'diamond', 'hexagon'].includes(shape) ? 180 : 360);
  const MATCH_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#da77f2', '#ffa94d'];
  const MATCH_SIZE = { rectangle: [84, 52], oval: [84, 56], semicircle: [80, 44], trapezoid: [84, 54], diamond: [58, 80], rtriangle: [70, 70] };

  /* ---- pictures made of shapes: [shape, x, y, w, h, turn, colour], listed back to front, on a 230 × 230 board ---- */
  const P = (shape, x, y, w, h, color, turn = 0) => ({ shape, x, y, w, h, turn, color });
  const PICTURES = {
    house: [P('square', 115, 158, 104, 96, '#ffd43b'), P('triangle', 115, 76, 136, 66, '#e03131'), P('rectangle', 115, 180, 28, 52, '#8b5a2b'), P('square', 84, 142, 24, 24, '#74c0fc'), P('square', 146, 142, 24, 24, '#74c0fc')],
    tree: [P('rectangle', 115, 176, 26, 76, '#8b5a2b'), P('circle', 115, 92, 108, 108, '#40c057'), P('circle', 92, 80, 18, 18, '#e03131'), P('circle', 136, 104, 18, 18, '#e03131')],
    boat: [P('circle', 42, 46, 38, 38, '#ffd43b'), P('trapezoid', 115, 180, 160, 42, '#1c7ed6', 180), P('rectangle', 112, 108, 8, 102, '#8b5a2b'), P('rtriangle', 152, 104, 64, 86, '#ffe8cc'), P('ltriangle', 82, 114, 44, 64, '#ffc9c9')],
    car: [P('rectangle', 115, 150, 176, 42, '#e03131'), P('trapezoid', 115, 110, 110, 38, '#ff8787'), P('square', 96, 111, 24, 24, '#a5d8ff'), P('square', 134, 111, 24, 24, '#a5d8ff'), P('circle', 68, 178, 38, 38, '#343a40'), P('circle', 162, 178, 38, 38, '#343a40')],
    train: [P('rectangle', 92, 150, 116, 52, '#e03131'), P('rectangle', 178, 128, 58, 96, '#1c7ed6'), P('square', 178, 106, 30, 30, '#a5d8ff'), P('rectangle', 62, 104, 20, 42, '#343a40'), P('circle', 56, 188, 32, 32, '#343a40'), P('circle', 104, 188, 32, 32, '#343a40'), P('circle', 178, 186, 38, 38, '#343a40')],
    rocket: [P('rectangle', 115, 126, 58, 112, '#dee2e6'), P('triangle', 115, 46, 58, 48, '#e03131'), P('circle', 115, 104, 30, 30, '#74c0fc'), P('ltriangle', 72, 162, 28, 40, '#e03131'), P('rtriangle', 158, 162, 28, 40, '#e03131'), P('triangle', 115, 200, 38, 36, '#ff922b', 180)],
    robot: [P('rectangle', 115, 128, 92, 82, '#74c0fc'), P('square', 115, 54, 58, 58, '#adb5bd'), P('circle', 102, 50, 14, 14, '#1c7ed6'), P('circle', 128, 50, 14, 14, '#1c7ed6'), P('rectangle', 56, 124, 18, 62, '#adb5bd'), P('rectangle', 174, 124, 18, 62, '#adb5bd'),
      P('rectangle', 94, 194, 24, 46, '#495057'), P('rectangle', 136, 194, 24, 46, '#495057')],
    butterfly: [P('oval', 66, 84, 78, 64, '#f783ac'), P('oval', 164, 84, 78, 64, '#f783ac'), P('circle', 78, 152, 54, 54, '#da77f2'), P('circle', 152, 152, 54, 54, '#da77f2'), P('oval', 115, 122, 20, 112, '#495057'), P('circle', 115, 56, 24, 24, '#495057')],
    castle: [P('rectangle', 115, 160, 132, 84, '#ced4da'), P('rectangle', 44, 140, 38, 124, '#adb5bd'), P('rectangle', 186, 140, 38, 124, '#adb5bd'), P('triangle', 44, 58, 48, 40, '#e03131'), P('triangle', 186, 58, 48, 40, '#e03131'),
      P('semicircle', 115, 178, 42, 48, '#8b5a2b'), P('square', 82, 108, 20, 20, '#ced4da'), P('square', 115, 108, 20, 20, '#ced4da'), P('square', 148, 108, 20, 20, '#ced4da')],
  };

  /* ---- the board: where every piece belongs (slots) and where it waits (home) ---- */
  function layout(a) {
    if (a.kind === 'shape-match') {
      const n = a.shapes.length, gap = 400 / n, colors = shuffle(MATCH_COLORS.slice());
      const slots = a.shapes.map((shape, i) => { const [w, h] = MATCH_SIZE[shape] || [70, 70]; return { shape, x: gap * (i + 0.5), y: 62, w: Math.min(w, gap - 12), h, turn: 0, color: colors[i % colors.length] }; });
      const order = shuffle(slots.map((_, i) => i));
      // never start with every shape right under its own outline
      if (order.every((v, i) => v === i)) order.push(order.shift());
      return { view: [400, 230], slots, homes: order.map((slot, i) => ({ slot, x: gap * (i + 0.5), y: 172, scale: 1, turn: 0 })), guide: 'parts' };
    }
    const parts = PICTURES[a.picture]; if (!parts) throw new Error('No shape picture called ' + a.picture);
    const turning = a.kind === 'shape-puzzle', n = parts.length, rows = Math.ceil(n / 2), cellH = Math.min(52, 214 / rows);
    const order = shuffle(parts.map((_, i) => i));
    const homes = order.map((slot, i) => { const p = parts[slot], every = sameEvery(p.shape, p.w, p.h), col = i % 2, row = (i - col) / 2;
      // a puzzle piece starts turned, unless it looks the same however it is turned
      const turn = turning && every > 90 ? p.turn + (every === 180 ? 90 : pick([90, 180, 270])) : p.turn;
      const longest = Math.max(p.w, p.h);
      // in the tray every piece is a comfortable size to grab: small ones a little bigger, big ones smaller
      const shown = Math.min(64, cellH - 6, Math.max(30, longest));
      return { slot, x: 258 + col * 74 + 34, y: (230 - rows * cellH) / 2 + row * cellH + cellH / 2, scale: shown / longest, turn }; });
    return { view: [410, 230], slots: parts, homes, guide: a.guide === 'whole' ? 'whole' : 'parts', turning };
  }
  const shapeAt = (s, cls, extra = '') => `<g class="${cls}" transform="translate(${s.x} ${s.y}) rotate(${s.turn})" ${extra}>${DRAW[s.shape](s.w, s.h)}</g>`;

  function render(q) {
    const a = q.activity, L = layout(a), [VW, VH] = L.view;
    const wrap = document.createElement('div'); wrap.className = `sp sp-${a.kind}`; $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
    wrap.innerHTML = `<svg class="sp-board" viewBox="0 0 ${VW} ${VH}" role="group" aria-label="${a.kind === 'shape-match' ? 'Shapes and their outlines' : 'A picture to build from shapes'}">
      ${a.kind === 'shape-match' ? '' : `<rect class="sp-mat" x="4" y="4" width="238" height="222" rx="16"/><rect class="sp-tray" x="250" y="4" width="156" height="222" rx="16"/>`}
      <g class="sp-slots ${L.guide}">${L.slots.map((s, i) => shapeAt(s, 'sp-slot', `data-i="${i}"`)).join('')}</g>
      <g class="sp-placed"></g><g class="sp-loose"></g></svg>
      <p class="sp-status" role="status"></p>${L.turning ? '<p class="sp-tip">👆 Tap a shape to turn it</p>' : ''}`;
    const svg = $('.sp-board', wrap), loose = $('.sp-loose', wrap), placed = $('.sp-placed', wrap), status = $('.sp-status', wrap);
    const filled = new Set();
    const pieces = L.homes.map((h, i) => { const s = L.slots[h.slot], el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      el.setAttribute('class', 'sp-piece'); el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', s.shape); el.style.setProperty('--c', s.color);
      el.innerHTML = DRAW[s.shape](s.w, s.h); loose.appendChild(el);
      return { i, el, shape: s.shape, w: s.w, h: s.h, home: h, x: h.x, y: h.y, turn: h.turn, scale: h.scale, slot: null }; });
    const place = (p) => p.el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.turn}) scale(${p.scale})`);
    const goHome = (p) => { p.x = p.home.x; p.y = p.home.y; p.scale = p.home.scale; p.el.classList.remove('drag'); place(p); };
    pieces.forEach(place);
    const paint = () => { status.textContent = `${filled.size} of ${L.slots.length} in place`; }; paint();
    const sameShape = (p, s) => p.shape === s.shape && p.w === s.w && p.h === s.h;
    const turnFits = (p, s) => ((((p.turn - s.turn) % 360) + 360) % 360) % sameEvery(s.shape, s.w, s.h) === 0;
    const near = (x, y) => L.slots.map((s, i) => ({ s, i, d: Math.hypot(x - s.x, y - s.y) })).filter((c) => !filled.has(c.i) && c.d < Math.max(30, Math.max(c.s.w, c.s.h) * 0.5)).sort((m, n) => m.d - n.d);
    function settle(p, i) {
      const s = L.slots[i]; filled.add(i); p.slot = i; p.x = s.x; p.y = s.y; p.turn = s.turn; p.scale = 1; p.el.classList.remove('drag'); p.el.classList.add('set'); p.el.removeAttribute('tabindex'); place(p);
      // keep the picture's own order, back to front
      const after = [...placed.children].find((c) => +c.dataset.slot > i); p.el.dataset.slot = i; placed.insertBefore(p.el, after || null);
      $(`.sp-slot[data-i="${i}"]`, wrap).classList.add('filled'); sfx.yes(); paint();
      if (filled.size === L.slots.length) { wrap.classList.add('done'); matchDone(q); }
    }
    let toldTurn = false;
    // where a dropped piece lands: its own outline, a wrong one (a try), or nowhere (it just goes back)
    function drop(p, x, y) {
      if (R.locked || p.slot != null) return 'locked';
      const close = near(x, y), fit = close.find((c) => sameShape(p, c.s) && turnFits(p, c.s));
      if (fit) { settle(p, fit.i); return 'placed'; }
      const turned = close.find((c) => sameShape(p, c.s));
      goHome(p);
      if (turned) { p.el.classList.add('wobble'); setTimeout(() => p.el.classList.remove('wobble'), 450); sfx.tap(); if (!toldTurn) { toldTurn = true; say('Tap a shape to turn it.'); } return 'turn'; }
      if (!close.length) return 'back';
      q.tries++; R.mistakes++; R.streak = 0; sfx.no(); p.el.classList.add('wobble'); setTimeout(() => p.el.classList.remove('wobble'), 450);
      if (q.tries === 2) say('Look carefully, and try again!');
      return 'wrong';
    }
    const turn = (p) => { if (!L.turning || p.slot != null || R.locked) return; p.turn = (p.turn + 90) % 360; place(p); sfx.tap(); };
    const point = (e) => { const m = svg.getScreenCTM(); return m ? { x: (e.clientX - m.e) / m.a, y: (e.clientY - m.f) / m.d } : { x: 0, y: 0 }; };
    pieces.forEach((p) => {
      let start = null, moved = false;
      p.el.addEventListener('pointerdown', (e) => { if (R.locked || p.slot != null) return; e.preventDefault(); loose.appendChild(p.el);      // on top first: moving an element lets go of a captured finger
        try { p.el.setPointerCapture(e.pointerId); } catch { /* no capture */ }
        const at = point(e); start = { dx: p.x - at.x, dy: p.y - at.y, x: at.x, y: at.y }; moved = false; });
      p.el.addEventListener('pointermove', (e) => { if (!start) return; const at = point(e);
        if (!moved && Math.hypot(at.x - start.x, at.y - start.y) < 5) return;
        if (!moved) { moved = true; p.scale = 1; p.el.classList.add('drag'); start.dx = 0; start.dy = 0; }      // picked up: full size, under the finger
        p.x = at.x + start.dx; p.y = at.y + start.dy; place(p); });
      const end = (e) => { if (!start) return; start = null; if (!moved) { if (e.type === 'pointerup') turn(p); return; } drop(p, p.x, p.y); };
      p.el.addEventListener('pointerup', end); p.el.addEventListener('pointercancel', end);
      p.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (L.turning && !e.shiftKey && !turnFits(p, L.slots[p.home.slot])) turn(p); else { const s = L.slots[p.home.slot]; drop(p, s.x, s.y); } } });
    });
    // the hint lights one waiting piece and the outline it belongs to
    q.activityHint = () => { const p = pieces.find((x) => x.slot == null); if (!p) return;
      const i = L.slots.findIndex((s, k) => !filled.has(k) && sameShape(p, s)), slot = $(`.sp-slot[data-i="${i}"]`, wrap);
      for (const el of [p.el, slot]) if (el) { el.classList.add('glow'); setTimeout(() => el.classList.remove('glow'), 2600); } };
    if (typeof isTestMode === 'function' && isTestMode()) wrap.dataset.ok = '1';
    window.__shapePlay = { kind: a.kind, turning: !!L.turning, guide: L.guide, slots: L.slots.map((s) => ({ ...s })), filled: () => filled.size,
      pieces: () => pieces.map((p) => ({ i: p.i, shape: p.shape, slot: p.slot, home: p.home.slot, turn: p.turn, x: p.x, y: p.y, fits: turnFits(p, L.slots[p.home.slot]) })),
      drop: (i, slot) => drop(pieces[i], L.slots[slot].x, L.slots[slot].y), dropAt: (i, x, y) => drop(pieces[i], x, y), turn: (i) => turn(pieces[i]),
      solve: () => { for (const p of pieces) { if (p.slot != null) continue; let n = 0; while (!turnFits(p, L.slots[p.home.slot]) && n++ < 4) turn(p); drop(p, L.slots[p.home.slot].x, L.slots[p.home.slot].y); } } };
  }

  /* ---- the lesson animation: a solid, then the flat shape you see when you look at it from one side ---- */
  const FLAT_OF = { cone: { side: 'triangle', below: 'circle' }, cylinder: { side: 'rectangle', top: 'circle' }, cube: { side: 'square' }, sphere: { side: 'circle' }, pyramid: { side: 'triangle', below: 'square' } };
  const SOLID_NAME = { cone: 'cone', cylinder: 'cylinder', cube: 'cube', sphere: 'ball', pyramid: 'pyramid' };
  const LOOK = { side: ['👀', 'from the side'], below: ['👀', 'from below'], top: ['👀', 'from the top'] };
  function scene(show, solids) {
    const fig = (ref, cls) => `<div class="s2f-fig ${cls}">${BankCards.pic(ref)}</div>`;
    if (show === 'all') return `<div class="s2f-all">${solids.map((s) => `<div class="s2f-pair">${fig('solids/' + s, 's2f-sm')}<span class="s2f-arrow">➜</span>${Object.values(FLAT_OF[s]).filter((f, i, all) => all.indexOf(f) === i).map((f) => fig('flats/' + f, 's2f-sm s2f-flat')).join('')}</div>`).join('')}</div>`;
    if (show === 'sphere-halves' || show === 'sphere-join') return halves(show === 'sphere-join');
    const [solid, view] = show.split('-');
    if (!FLAT_OF[solid]) return '';
    if (!view) return `<div class="s2f-one">${fig('solids/' + solid, 's2f-spin')}<span class="s2f-name">${SOLID_NAME[solid]}</span></div>`;
    const flat = FLAT_OF[solid][view]; if (!flat) return '';
    return `<div class="s2f-turn"><div class="s2f-col">${fig('solids/' + solid, 's2f-look-' + view)}<span class="s2f-name">${SOLID_NAME[solid]}</span></div>
      <div class="s2f-eye"><span>${LOOK[view][0]}</span><small>${LOOK[view][1]}</small><span class="s2f-arrow">➜</span></div>
      <div class="s2f-col">${fig('flats/' + flat, 's2f-flat s2f-pop')}<span class="s2f-name s2f-pop">${flat}</span></div></div>`;
  }
  // A ball cut in half. Each half first shows its cut side, a circle, facing you. With `join` the halves then turn
  // (the circle narrows as the round back comes into view), slide together, and the cut closes: a ball again.
  // Drawn shapes moved by CSS (style.css, .s2f-cut), so it is a few hundred letters, sharp at any size, and works offline.
  function halves(join) {
    const half = (side) => { const cx = side === 'l' ? 84 : 216, sweep = side === 'l' ? 0 : 1;
      return `<g class="s2f-half ${side}"><path class="s2f-dome" d="M${cx} 22 A48 48 0 0 ${sweep} ${cx} 118"/><ellipse class="s2f-face" cx="${cx}" cy="70" rx="48" ry="48"/></g>`; };
    return `<div class="s2f-cut${join ? ' join' : ''}"><svg viewBox="0 0 300 140" role="img" aria-label="${join ? 'Two halves of a ball turn and join into a ball' : 'A ball cut in half: each cut side is a circle'}">
      ${half('l')}${half('r')}<path class="s2f-shine" d="M126 44 A32 32 0 0 1 150 32"/></svg>
      <span class="s2f-name">${join ? 'two halves make a ball' : 'the cut side is a circle'}</span></div>`;
  }
  // one scene per spoken line: the lesson card lights them one at a time, with the article underneath
  function lessonHTML(lesson) {
    const solids = (lesson.animation && lesson.animation.solids) || [];
    return `<div class="s2f">${lesson.lines.map((l, i) => `<div class="s2f-scene${i === lesson.lines.length - 1 ? ' s2f-keep' : ''}" data-row="${i + 1}">${scene(l.show || 'all', solids)}</div>`).join('')}</div>`;
  }
  return Object.freeze({ render, lessonHTML, PICTURES, DRAW, sameEvery });
})();
BankCards.activities['shape-match'] = BankCards.activities['shape-build'] = BankCards.activities['shape-puzzle'] = ShapePlay.render;
BankCards.animations['solid-to-flat'] = ShapePlay.lessonHTML;

/* ---------- Shapes: lessons, line matching, tap-all and the shape games come from the geometry bank ---------- */
(() => {
  const c = CATEGORIES.find((x) => x.id === 'shape2'), base = c.gen, Geo = BankCards.serve('shape2', { matchShare: 0.25 });
  const SHARE = 0.5;                      // about half the cards are the bank's (games, matching, views of solids), the rest the picture cards
  c.baseGen = base;
  c.gen = (level) => { if (Math.random() < SHARE) { try { return Geo.gen(level); } catch { /* no bank cards for this step and grade */ } } return base(level); };
  c.teach = Geo.teach;
  c.sub = 'flat & 3D shapes · build with shapes';
})();
