/* Adventure games drawn for question-bank records (banks/learn-play.games.json). They run inside a round as cards.
   Two activity kinds (QUESTION-FORMAT.md, "activity"):
     treasure-map  { map, steps, clues: 'places' | 'compass' }   follow spoken clues from place to place, then the chest opens
     shop          { kinds, max, pay }                            fill the basket from a shopping list; with pay, the next card is the till
     shop-pay      (made by the shop card)                        pay the shopkeeper the total in the child's own country's coins
   The level only names the settings; the route and the list are made fresh each time, so a level never plays the same twice.
   A wrong place or a wrong basket is a try; finishing the game answers the card. */
const AdventurePlay = (() => {
  const INK = '#2b2140';
  /* ---------- Treasure map ---------- */
  // places sit on a 4 × 3 grid (column, row); paths join neighbours, so "north" always means the place straight above
  const ICON = {
    tree: '<rect x="-4" y="6" width="8" height="16" fill="#8b5a2b"/><circle cy="-4" r="17" fill="#40c057"/>',
    pond: '<ellipse rx="22" ry="13" fill="#74c0fc"/><path d="M-10 -2 q5 -5 10 0 M2 4 q5 -5 10 0" fill="none" stroke="#fff" stroke-width="2.5"/>',
    bridge: '<path d="M-22 8 Q0 -22 22 8 Z" fill="#c68642"/><path d="M-22 8 H22 M-11 8 V-4 M0 8 V-8 M11 8 V-4" stroke="#8b5a2b" stroke-width="3" fill="none"/>',
    house: '<rect x="-15" y="-4" width="30" height="24" fill="#ffd43b"/><path d="M-20 -4 L0 -22 L20 -4 Z" fill="#e03131"/><rect x="-4" y="6" width="8" height="14" fill="#8b5a2b"/>',
    rock: '<path d="M-20 14 L-14 -6 L0 -14 L16 -8 L22 14 Z" fill="#adb5bd"/><path d="M-6 -4 L0 6" stroke="#868e96" stroke-width="2.5"/>',
    flowers: '<g stroke="#2f9e44" stroke-width="3"><path d="M-12 18 V2 M0 18 V-4 M12 18 V2"/></g><circle cx="-12" cy="0" r="7" fill="#f783ac"/><circle cy="-7" r="7" fill="#ffd43b"/><circle cx="12" cy="0" r="7" fill="#da77f2"/>',
    cave: '<path d="M-24 18 Q-22 -20 0 -20 Q22 -20 24 18 Z" fill="#868e96"/><path d="M-10 18 Q-10 -4 0 -4 Q10 -4 10 18 Z" fill="#343a40"/>',
    boat: '<path d="M-22 6 H22 L14 18 H-14 Z" fill="#1c7ed6"/><path d="M0 6 V-20 L16 2 Z" fill="#fff" stroke-width="2.5"/>',
    barn: '<path d="M-18 20 V-4 L0 -20 L18 -4 V20 Z" fill="#e03131"/><rect x="-7" y="4" width="14" height="16" fill="#fff"/><path d="M-7 4 L7 20 M7 4 L-7 20" stroke="#e03131" stroke-width="2"/>',
    tent: '<path d="M-22 18 L0 -18 L22 18 Z" fill="#ff922b"/><path d="M0 -18 L-6 18 H6 Z" fill="#fff4e6"/>',
  };
  const MAPS = {
    park: { ground: '#d3f9d8', places: { flowers: [0, 0], bridge: [1, 0], house: [3, 0], tree: [0, 1], pond: [1, 1], rock: [2, 1], tent: [3, 1], cave: [1, 2], boat: [2, 2] } },
    island: { ground: '#fff3bf', places: { cave: [0, 0], rock: [1, 0], tree: [2, 0], tent: [0, 1], pond: [1, 1], flowers: [2, 1], house: [3, 1], boat: [0, 2], bridge: [2, 2] } },
    farm: { ground: '#e6fcf5', places: { barn: [0, 0], tree: [1, 0], pond: [2, 0], house: [0, 1], flowers: [1, 1], rock: [3, 1], tent: [1, 2], bridge: [2, 2], cave: [3, 2] } },
  };
  const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  const XY = ([c, r]) => [56 + c * 84, 50 + r * 82];          // the right edge is kept clear for the compass
  function mapGraph(name) {
    const m = MAPS[name]; if (!m) throw new Error('No treasure map called ' + name);
    const ids = Object.keys(m.places), at = (c, r) => ids.find((id) => m.places[id][0] === c && m.places[id][1] === r);
    const next = Object.fromEntries(ids.map((id) => [id, Object.fromEntries(Object.entries(DIRS).map(([d, [dc, dr]]) => [d, at(m.places[id][0] + dc, m.places[id][1] + dr)]).filter(([, to]) => to))]));
    return { m, ids, next };
  }
  // a walk of n steps that never turns straight back, ending somewhere other than the start
  function route(G, n) {
    for (let tries = 0; tries < 200; tries++) {
      let cur = pick(G.ids), prev = null; const start = cur, steps = [];
      for (let k = 0; k < n; k++) { const moves = Object.entries(G.next[cur]).filter(([, to]) => to !== prev); if (!moves.length) break; const [dir, to] = pick(moves); steps.push({ dir, to }); prev = cur; cur = to; }
      if (steps.length === n && cur !== start && new Set(steps.map((s) => s.to)).size === n) return { start, steps };
    }
    throw new Error('No route of ' + n + ' steps on this map');
  }
  const clueText = (s, mode) => (mode === 'compass' ? `Go ${s.dir}.` : `Go to the ${s.to}.`);
  function treasure(q) {
    const a = q.activity, G = mapGraph(a.map), mode = a.clues === 'compass' ? 'compass' : 'places', R0 = route(G, Math.max(2, Math.min(6, a.steps || 3)));
    const wrap = document.createElement('div'); wrap.className = 'adv adv-treasure'; $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
    const edges = []; for (const id of G.ids) for (const to of Object.values(G.next[id])) if (id < to) edges.push([id, to]);
    wrap.innerHTML = `<div class="adv-clue" role="status"><button class="adv-say" aria-label="Hear the clue again">🔊</button><b class="adv-clue-n"></b> <span class="adv-clue-t"></span></div>
      <svg class="adv-map" viewBox="0 0 400 260" role="group" aria-label="A treasure map">
        <rect x="4" y="4" width="392" height="252" rx="18" fill="${G.m.ground}" stroke="#c9a66b" stroke-width="5"/>
        <g class="adv-paths">${edges.map(([x, y]) => { const [x1, y1] = XY(G.m.places[x]), [x2, y2] = XY(G.m.places[y]); return `<path d="M${x1} ${y1} L${x2} ${y2}"/>`; }).join('')}</g>
        <g class="adv-trail"></g>
        ${mode === 'compass' ? `<g class="adv-rose" transform="translate(364 44)"><circle r="24" fill="#fff" stroke="${INK}" stroke-width="2.5"/><path d="M0 -17 L5 0 L0 17 L-5 0 Z" fill="#e03131"/><text y="-27" text-anchor="middle">N</text><text y="37" text-anchor="middle">S</text><text x="31" y="5" text-anchor="middle">E</text><text x="-31" y="5" text-anchor="middle">W</text></g>` : ''}
        ${G.ids.map((id) => { const [x, y] = XY(G.m.places[id]); return `<g class="adv-place" data-place="${id}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${id}"><circle class="adv-spot" r="31"/><g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">${ICON[id]}</g>${mode === 'places' ? '' : `<text class="adv-name" y="38" text-anchor="middle">${id}</text>`}</g>`; }).join('')}
        <g class="adv-chest" hidden><rect x="-16" y="-6" width="32" height="20" rx="3" fill="#c68642" stroke="${INK}" stroke-width="2.5"/><path class="adv-lid" d="M-16 -6 Q0 -22 16 -6 Z" fill="#e8a54b" stroke="${INK}" stroke-width="2.5"/><circle cy="3" r="3.5" fill="#ffd43b"/>${[-12, -4, 5, 13].map((x, i) => `<circle class="adv-coin" cx="${x}" cy="-10" r="4.5" fill="#ffd43b" stroke="#e67700" stroke-width="1.5" style="--i:${i}"/>`).join('')}</g>
        <g class="adv-hero"><circle r="13" fill="#ffd8a8" stroke="${INK}" stroke-width="2.5"/><path d="M-14 -5 H14 L9 -16 H-9 Z" fill="#8b5a2b" stroke="${INK}" stroke-width="2"/><circle cx="-4.5" cy="1" r="1.8"/><circle cx="4.5" cy="1" r="1.8"/><path d="M-4 6 Q0 9 4 6" fill="none" stroke="${INK}" stroke-width="1.8"/></g></svg>`;
    const hero = $('.adv-hero', wrap), trail = $('.adv-trail', wrap), place = (id) => $(`.adv-place[data-place="${id}"]`, wrap);
    let here = R0.start, i = 0, done = false;
    const stand = (id) => { const [x, y] = XY(G.m.places[id]); hero.style.transform = `translate(${x - 24}px, ${y - 26}px) scale(.8)`; };
    const speak = () => { const s = R0.steps[i]; if (s) say(clueText(s, mode)); };
    function showClue() {
      const s = R0.steps[i];
      $('.adv-clue-n', wrap).textContent = `Clue ${i + 1} of ${R0.steps.length}:`; $('.adv-clue-t', wrap).textContent = clueText(s, mode);
      $$('.adv-place', wrap).forEach((p) => p.classList.toggle('here', p.dataset.place === here));
    }
    function go(id) {
      if (done || R.locked) return 'locked';
      const s = R0.steps[i];
      if (id === here) return 'here';
      if (id !== s.to) { q.tries++; R.mistakes++; R.streak = 0; sfx.no(); const el = place(id); if (el) { el.classList.add('no'); setTimeout(() => el.classList.remove('no'), 450); } if (q.tries === 2) speak(); return 'wrong'; }
      const [x1, y1] = XY(G.m.places[here]), [x2, y2] = XY(G.m.places[id]);
      trail.insertAdjacentHTML('beforeend', `<path d="M${x1} ${y1} L${x2} ${y2}"/>`);
      here = id; stand(id); sfx.yes(); i++;
      if (i < R0.steps.length) { showClue(); setTimeout(speak, 650); return 'step'; }
      // the last place: the chest comes up and opens
      done = true; $$('.adv-place', wrap).forEach((p) => p.classList.remove('here'));
      const chest = $('.adv-chest', wrap); chest.setAttribute('transform', `translate(${x2} ${y2 + 6})`); chest.hidden = false; wrap.classList.add('found');
      $('.adv-clue-n', wrap).textContent = '⭐'; $('.adv-clue-t', wrap).textContent = 'You found the treasure!';
      setTimeout(() => matchDone(q), 900);
      return 'treasure';
    }
    $$('.adv-place', wrap).forEach((p) => { p.onclick = () => go(p.dataset.place); p.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(p.dataset.place); } }; });
    $('.adv-say', wrap).onclick = () => { sfx.tap(); speak(); };
    q.activityHint = () => { const el = !done && place(R0.steps[i].to); if (el) { el.classList.add('glow'); setTimeout(() => el.classList.remove('glow'), 2600); } };
    hero.style.transition = 'none'; stand(here); requestAnimationFrame(() => (hero.style.transition = ''));
    showClue(); setTimeout(speak, 1400);
    window.__adventure = { kind: 'treasure-map', mode, start: R0.start, steps: R0.steps.map((s) => ({ ...s })), at: () => here, clue: () => $('.adv-clue-t', wrap).textContent, go, done: () => done, places: G.ids.slice(), next: G.next };
  }

  /* ---------- Shop, then paying the shopkeeper on the next card ---------- */
  // [picture, one, many, price in steps of the country's small coin]
  const GOODS = { apple: ['🍎', 'apple', 'apples', 1], banana: ['🍌', 'banana', 'bananas', 1], carrot: ['🥕', 'carrot', 'carrots', 2], egg: ['🥚', 'egg', 'eggs', 2], cookie: ['🍪', 'cookie', 'cookies', 2], bread: ['🍞', 'loaf of bread', 'loaves of bread', 3], milk: ['🥛', 'glass of milk', 'glasses of milk', 3], cheese: ['🧀', 'piece of cheese', 'pieces of cheese', 4] };
  // The child's own money (country.json): prices go in steps of one small coin (5¢, 5p, ₹1 …) so any total can be paid in coins.
  function money() {
    const C = (typeof myCountry === 'function' && myCountry()) || COUNTRIES.us, coins = C.coins.slice().sort((x, y) => x[0] - y[0]);
    const step = (coins.find((c) => c[0] === 5) || coins[0]), per = parseFloat(step[1].replace(/[^\d.]/g, '')) / step[0];
    const show = (amount) => step[1].replace(/[\d.]+/, String(Math.round(amount * per * 100) / 100));
    return { C, coins, step: step[0], show, picture: (v) => { const c = coins.find((x) => x[0] === v); return nsCoinPicture(v, c[1], C.label || C.name); }, label: (v) => coins.find((x) => x[0] === v)[1] };
  }
  function shop(q) {
    const a = q.activity, kinds = Math.max(1, Math.min(4, a.kinds || 2)), max = Math.max(1, Math.min(6, a.max || 3)), pay = !!a.pay, M = money();
    const names = shuffle(Object.keys(GOODS)), wanted = names.slice(0, kinds), shelf = shuffle(names.slice(0, Math.min(names.length, kinds + 2 + (kinds > 2 ? 1 : 0))));
    const list = Object.fromEntries(wanted.map((n) => [n, 1 + rand(max)])), basket = {}, price = (n) => GOODS[n][3] * M.step, total = wanted.reduce((t, n) => t + list[n] * price(n), 0);
    const wrap = document.createElement('div'); wrap.className = 'adv adv-shop'; $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
    wrap.innerHTML = `<div class="shop-top"><div class="shop-list"><b>🧾 Shopping list</b>${wanted.map((n) => `<div class="shop-row" data-item="${n}"><span class="shop-n">${list[n]}</span> ${GOODS[n][0]} <span class="shop-word">${list[n] === 1 ? GOODS[n][1] : GOODS[n][2]}</span></div>`).join('')}</div>
        <div class="shop-basket" aria-label="Your basket"><b>🧺 Basket</b><div class="shop-in" role="status"></div></div></div>
      <div class="shop-shelf" role="group" aria-label="The shop shelf">${shelf.map((n) => `<button class="shop-item" data-item="${n}" aria-label="Add one ${GOODS[n][1]}">${GOODS[n][0]}${pay ? `<small>${M.show(price(n))}</small>` : ''}</button>`).join('')}</div>
      <button class="big-btn shop-done">✔ Done shopping</button><p class="shop-msg" role="status"></p>`;
    const inBasket = $('.shop-in', wrap), msg = $('.shop-msg', wrap);
    let stage = 'fill';
    function paint() {
      inBasket.innerHTML = Object.keys(basket).filter((n) => basket[n] > 0).map((n) => `<button class="shop-chip" data-item="${n}" aria-label="Take one ${GOODS[n][1]} out">${GOODS[n][0]}<b>× ${basket[n]}</b></button>`).join('') || '<small>Tap the things on the shelf to put them in.</small>';
      $$('.shop-chip', wrap).forEach((b) => (b.onclick = () => take(b.dataset.item)));
      $$('.shop-row', wrap).forEach((r) => { r.classList.toggle('ok', (basket[r.dataset.item] || 0) === list[r.dataset.item]); r.classList.remove('off'); });
    }
    const add = (n) => { if (stage !== 'fill' || R.locked) return; basket[n] = Math.min(9, (basket[n] || 0) + 1); sfx.tap(); msg.textContent = ''; paint(); const chip = $(`.shop-chip[data-item="${n}"]`, wrap); if (chip) chip.classList.add('pop'); };
    const take = (n) => { if (stage !== 'fill' || R.locked) return; basket[n] = Math.max(0, (basket[n] || 0) - 1); sfx.tap(); msg.textContent = ''; paint(); };
    const right = () => Object.keys({ ...list, ...basket }).every((n) => (basket[n] || 0) === (list[n] || 0));
    function checkout() {
      if (stage !== 'fill' || R.locked) return 'locked';
      if (!right()) {                                        // show which lines do not match yet
        q.tries++; R.mistakes++; R.streak = 0; sfx.no(); msg.textContent = 'Check your list.'; if (q.tries <= 2) say('Check your list.');
        $$('.shop-row', wrap).forEach((r) => r.classList.toggle('off', (basket[r.dataset.item] || 0) !== list[r.dataset.item]));
        $$('.shop-chip', wrap).forEach((c) => c.classList.toggle('off', !list[c.dataset.item]));
        return 'wrong';
      }
      stage = 'done'; wrap.classList.add('paid'); $('.shop-done', wrap).hidden = true; $$('.shop-item', wrap).forEach((b) => (b.disabled = true));
      // with prices, the very next card is the till: pay the shopkeeper for this basket
      if (pay && !R.qs[R.i + 1]?.shopPay) R.qs.splice(R.i + 1, 0, payCard(q, wanted.map((n) => ({ item: n, count: list[n], price: price(n) })), total));
      matchDone(q);
      return pay ? 'pay next' : 'done';
    }
    $$('.shop-item', wrap).forEach((b) => (b.onclick = () => add(b.dataset.item)));
    $('.shop-done', wrap).onclick = checkout;
    q.activityHint = () => { const off = wanted.find((n) => (basket[n] || 0) !== list[n]), el = off ? $(`.shop-item[data-item="${off}"]`, wrap) : $('.shop-done', wrap); if (el) { el.classList.add('glow'); setTimeout(() => el.classList.remove('glow'), 2600); } };
    paint();
    window.__adventure = { kind: 'shop', pay, list: { ...list }, shelf: shelf.slice(), basket: () => ({ ...basket }), total, add, take, checkout, stage: () => stage };
  }
  // the card that follows a shop with prices: the same basket, now at the till
  function payCard(from, lines, total) {
    return { key: `shop-pay-${total}-${lines.map((l) => l.item + l.count).join('-')}`, bank: true, shopPay: true, text: 'Pay the <b>shopkeeper</b>!', say: 'Pay the shopkeeper!', main: '', mainClass: 'sp-main', options: [], answer: 'done', optClass: '',
      hint: { html: '', say: 'Add coins until you have the right amount.' }, activity: { kind: 'shop-pay', lines, total }, cat: from.cat, level: from.level, grades: from.grades, tries: 0 };
  }
  function shopPay(q) {
    const a = q.activity, M = money(), purse = M.coins.map((c) => c[0]).filter((v) => v <= a.total && v % M.step === 0 || v === M.step).filter((v, i, all) => all.indexOf(v) === i).slice(-5), given = [];
    const wrap = document.createElement('div'); wrap.className = 'adv adv-pay'; $('#qMain').appendChild(wrap); $('#options').innerHTML = '';
    wrap.innerHTML = `<div class="pay-bill"><div class="pay-keeper" aria-hidden="true">🧑‍🍳</div><div class="pay-lines">${a.lines.map((l) => `<div>${l.count} × ${GOODS[l.item][0]} <small>${M.show(l.price)} each</small></div>`).join('')}<b class="pay-total">To pay: ${M.show(a.total)}</b></div></div>
      <div class="pay-counter" aria-label="Coins on the counter"><b>On the counter: <span class="pay-sum">${M.show(0)}</span></b><div class="pay-given" role="status"></div></div>
      <div class="pay-purse" role="group" aria-label="Your coins">${purse.map((v) => `<button class="pay-coin" data-v="${v}" aria-label="Give ${M.label(v)}">${M.picture(v)}<b>${M.label(v)}</b></button>`).join('')}</div>
      <button class="big-btn pay-go">💰 Pay</button><p class="shop-msg" role="status"></p>`;
    const msg = $('.shop-msg', wrap), sum = () => given.reduce((t, v) => t + v, 0);
    let done = false;
    function paint() { $('.pay-sum', wrap).textContent = M.show(sum());
      $('.pay-given', wrap).innerHTML = given.map((v, i) => `<button class="pay-coin sm" data-i="${i}" aria-label="Take back ${M.label(v)}">${M.picture(v)}</button>`).join('') || '<small>Tap your coins to put them on the counter.</small>';
      $$('.pay-given .pay-coin', wrap).forEach((b) => (b.onclick = () => back(+b.dataset.i))); }
    const give = (v) => { if (done || R.locked || given.length >= 14) return; given.push(v); sfx.tap(); msg.textContent = ''; paint(); };
    const back = (i) => { if (done || R.locked) return; given.splice(i, 1); sfx.tap(); msg.textContent = ''; paint(); };
    function payNow() {
      if (done || R.locked) return 'locked';
      const s = sum();
      if (s !== a.total) { q.tries++; R.mistakes++; R.streak = 0; sfx.no(); const t = s < a.total ? 'That is not enough yet.' : 'That is too much.'; msg.textContent = t; if (q.tries <= 2) say(t); return s < a.total ? 'short' : 'over'; }
      done = true; wrap.classList.add('paid'); msg.textContent = 'Thank you!'; $('.pay-go', wrap).hidden = true; matchDone(q); return 'paid';
    }
    $$('.pay-purse .pay-coin', wrap).forEach((b) => (b.onclick = () => give(+b.dataset.v)));
    $('.pay-go', wrap).onclick = payNow;
    q.activityHint = () => { const left = a.total - sum(), v = left > 0 ? purse.filter((x) => x <= left).pop() : null, el = v ? $(`.pay-purse .pay-coin[data-v="${v}"]`, wrap) : left < 0 ? $('.pay-given .pay-coin', wrap) : $('.pay-go', wrap); if (el) { el.classList.add('glow'); setTimeout(() => el.classList.remove('glow'), 2600); } };
    paint();
    window.__adventure = { kind: 'shop-pay', total: a.total, purse, show: M.show, sum, give, back, payNow, done: () => done };
  }
  return Object.freeze({ treasure, shop, shopPay, money, MAPS, GOODS, clueText });
})();
BankCards.activities['treasure-map'] = AdventurePlay.treasure;
BankCards.activities.shop = AdventurePlay.shop;
BankCards.activities['shop-pay'] = AdventurePlay.shopPay;

/* ---------- where the games show up: as cards inside these sections' rounds ---------- */
(() => {
  const mixIn = (id, share) => { const c = CATEGORIES.find((x) => x.id === id); if (!c) return; const base = c.gen, G = BankCards.serve(id);
    c.baseGen = c.baseGen || base;
    c.gen = (level) => { if (Math.random() < share) { try { return G.gen(level); } catch { /* no game for this step and grade */ } } return base(level); }; };
  mixIn('add', 0.15);        // the shop: counting things out, then adding up coins
  mixIn('maps', 0.3);        // the treasure map: compass clues
  mixIn('pattern', 0.15);    // the treasure map for the youngest: go to the tree, then the pond
})();
