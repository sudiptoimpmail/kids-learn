/* Draws kids-core question bank records (banks/<id>.json, QUESTION-FORMAT.md) as this app's cards.
   QuestionBank (core) checks and stores the banks; this file turns one question into a card the round engine can ask:
   picture or text choices, tap a named part of a picture, match pairs, and the lesson taught before the quiz.
     BankCards.card(question)            → a card
     BankCards.intro(lesson)             → the lesson card ("Watch me"), with its "together" question
     BankCards.serve('jobs', options)    → { gen(level), teach(level), baseGen(level) } for a section served from banks
     BankCards.pic('helpers/firefighter#fire-hose')  → the picture as HTML */
const BankCards = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const attr = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const parsed = new Map(), drawn = new Map();
  // the drawing as elements (once per picture): its named groups can then be lit, numbered or shown alone
  function parts(p) {
    if (!parsed.has(p.id)) { const box = document.createElementNS(SVG, 'svg'); box.innerHTML = p.svg || ''; parsed.set(p.id, box); }
    return parsed.get(p.id);
  }
  const groupsOf = (root, name) => [...root.querySelectorAll('[data-val]')].filter((g) => g.dataset.val === name);
  const keep = (key, make) => { if (!drawn.has(key)) drawn.set(key, make()); return drawn.get(key); };
  // the whole picture; light = a tag to make glow; tap = its parts can be tapped; rows = { group name: lesson row }
  function whole(p, { light = null, tap = false, cls = '', rows = null } = {}) {
    if (!p.svg) return `<img class="bk-img ${cls}" src="${attr(p.file)}" alt="${attr(p.alt)}">`;
    return keep(`${p.id}|${light ? light.id : ''}|${tap}|${cls}|${rows ? JSON.stringify(rows) : ''}`, () => {
      const root = parts(p).cloneNode(true);
      for (const g of root.querySelectorAll('[data-val]')) {
        g.classList.add('hw-part'); g.removeAttribute('data-row');
        if (!tap) { g.removeAttribute('role'); g.removeAttribute('tabindex'); } else { g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0'); g.setAttribute('aria-label', g.dataset.val); }
        if (light && light.area.group === g.dataset.val) g.classList.add('hl');
        if (rows && rows[g.dataset.val]) g.setAttribute('data-row', rows[g.dataset.val]);
      }
      return `<svg viewBox="${p.viewBox}" class="hw-fig ${cls}${light ? ' has-hl' : ''}" role="${tap ? 'group' : 'img'}" aria-label="${attr(p.alt)}">${root.innerHTML}</svg>`;
    });
  }
  // one named part on its own, in its own frame
  function partOnly(p, tag, cls = '') {
    return keep(`${p.id}#${tag.id}|${cls}`, () => {
      const root = parts(p), shell = root.firstElementChild ? root.firstElementChild.cloneNode(false) : document.createElementNS(SVG, 'g');
      for (const g of groupsOf(root, tag.area.group)) { const c = g.cloneNode(true); c.removeAttribute('role'); c.removeAttribute('tabindex'); c.removeAttribute('data-row'); shell.appendChild(c); }
      const holder = document.createElementNS(SVG, 'svg'); holder.appendChild(shell);
      return `<svg viewBox="${(tag.box || p.viewBox.split(' ')).join(' ')}" class="hw-icon ${cls}" role="img" aria-label="${attr(tag.label)}">${holder.innerHTML}</svg>`;
    });
  }
  // any picture reference as HTML ('' when it cannot be found)
  function pic(ref, opts = {}) {
    const r = QuestionBank.picture(ref); if (!r) return '';
    if (r.emoji) return `<span class="bk-emoji">${r.emoji}</span>`;
    return r.tag ? partOnly(r.picture, r.tag, opts.cls) : whole(r.picture, { ...opts, light: r.light });
  }
  const isEmoji = (ref) => /^emoji\//.test(ref || '');

  function hintOf(q) {
    const h = q.hint; if (!h) return { html: '', say: 'Think about it!', remove: true };
    const picture = !h.picture ? '' : isEmoji(h.picture) ? `<div class="hint-pic">${h.picture.slice(6)}</div>` : `<div class="hw-hint">${pic(h.picture, { cls: 'mini' })}</div>`;
    return { html: picture + (h.text ? `<div class="hint-note">${QuestionBank.html(h.text)}</div>` : ''), say: h.say != null ? h.say : h.text || 'Think about it!' };
  }
  function card(q) {
    const base = { key: q.id, bank: true, text: QuestionBank.html(q.prompt.text), say: q.prompt.say != null ? q.prompt.say : QuestionBank.plain(q.prompt.text),
      hint: hintOf(q), ...(q.explain ? { explain: q.explain } : {}) };
    if (q.interaction === 'tap') {
      const r = QuestionBank.picture(q.picture), tag = r.picture.tags.find((t) => t.id === q.answer[0]);
      return { ...base, main: whole(r.picture, { tap: true }), mainClass: 'hw-main', tap: true, options: [], answer: tag.area.group, optClass: '' };
    }
    if (q.interaction === 'match') {
      const side = (s) => (s.picture ? `<span class="m-pic">${isEmoji(s.picture) ? s.picture.slice(6) : pic(s.picture)}</span>` : `<span class="m-word">${QuestionBank.html(s.text)}</span>`);
      const chosen = sample(q.pairs.map((p, i) => ({ p, i })), q.show || Math.min(4, q.pairs.length));
      return { ...base, key: `${q.id}~${chosen.map((x) => x.i).sort((a, b) => a - b).join('.')}`, main: '', mainClass: 'empty', options: [], answer: 'all', optClass: 'match-area',
        match: { left: shuffle(chosen.map((x, i) => ({ id: i, html: side(x.p.left) }))), right: shuffle(chosen.map((x, i) => ({ id: i, html: side(x.p.right) }))), kind: 'math' } };
    }
    if (q.interaction !== 'choice') throw new Error('This app cannot draw a "' + q.interaction + '" question yet: ' + q.id);
    const both = q.choices.some((c) => c.picture && c.text), pictures = q.choices.every((c) => c.picture && !c.text), drawings = q.choices.some((c) => c.picture && !isEmoji(c.picture));
    const optHtml = (c) => (c.picture && c.text ? `<span class="oe">${isEmoji(c.picture) ? c.picture.slice(6) : pic(c.picture)}</span><span class="ot">${QuestionBank.html(c.text)}</span>`
      : c.picture ? (isEmoji(c.picture) ? c.picture.slice(6) : pic(c.picture, { cls: 'opt' })) : QuestionBank.html(c.text));
    const opts = q.choices.map((c) => ({ v: c.id, html: optHtml(c) }));
    const main = !q.picture ? '' : isEmoji(q.picture) ? `<div class="big-emoji${q.picture === 'emoji/❓' ? ' muted' : ''}">${q.picture.slice(6)}</div>`
      : QuestionBank.picture(q.picture).tag ? `<div class="hw-ask">${pic(q.picture)}</div>` : pic(q.picture);
    return { ...base, main, ...(main ? {} : { mainClass: 'empty' }), options: q.shuffle === false ? opts : shuffle(opts), answer: q.answer[0],
      optClass: both ? 'opt-card' : pictures ? (drawings ? 'opt-emoji hw-opts' : 'opt-emoji') : q.choices.some((c) => c.text.length > 14) ? 'opt-text' : 'opt-text four-ok' };
  }
  // the lesson: its picture, a label for each part it names, and one spoken line at a time
  function intro(lesson) {
    const r = lesson.picture ? QuestionBank.picture(lesson.picture) : null, p = r && r.picture;
    const lit = [...new Set(lesson.lines.map((l) => l.light).filter(Boolean))], tagOf = (id) => p.tags.find((t) => t.id === id);
    const rows = Object.fromEntries(lit.map((id, i) => [tagOf(id).area.group, i + 1]));
    const together = lesson.together && QuestionBank.question(lesson.together);
    return {
      key: lesson.id, bank: true, text: QuestionBank.html(lesson.title), options: [], answer: null,
      main: `<div class="hw-teach">${p ? whole(p, { rows }) : ''}${lit.length ? `<div class="hw-labels">${lit.map((id, i) => `<span class="hw-label" data-row="${i + 1}">${attr(tagOf(id).label)}</span>`).join('')}</div>` : ''}</div>`,
      steps: lesson.lines.map((l) => (l.light ? { row: lit.indexOf(l.light) + 1, say: l.say, slow: true } : { say: l.say })),
      ...(together ? { guided: card(together) } : {}),
    };
  }

  /* A section whose cards come from question banks.
     review: { share, from, to }  → on steps after `from` (up to `to`), this share of cards comes from an earlier step
     matchShare                   → how often a matching card is asked, on steps that have one */
  function serve(section, { review = null, matchShare = 0.2 } = {}) {
    const where = () => ({ section, grade: (typeof state !== 'undefined' && state.grade) || undefined, country: typeof countryCode === 'function' ? countryCode() : undefined });
    const at = (step, grade = where().grade) => QuestionBank.questions({ ...where(), grade, step });
    function gen(level, { noMatch = false } = {}) {
      let step = level;
      if (review && level > review.from && level <= review.to && Math.random() < review.share) step = review.from + rand(level - review.from);
      let pool = at(step);
      if (!pool.length && step !== level) pool = at(level);
      if (!pool.length) pool = at(level, undefined);            // a grade outside the bank's own grades (grown-up preview) still sees the step
      if (!pool.length) throw new Error(`No questions for ${section} step ${level}`);
      const matches = pool.filter((q) => q.interaction === 'match'), rest = pool.filter((q) => q.interaction !== 'match');
      return card(pick(matches.length && (!rest.length || (!noMatch && Math.random() < matchShare)) ? matches : rest.length ? rest : matches));
    }
    const teach = (level) => { const l = QuestionBank.lesson(section, level, where().grade); return l ? intro(l) : null; };
    return { gen, teach, baseGen: (level) => gen(level, { noMatch: true }) };
  }
  // the names of a section's steps, in order
  const stepTitles = (section) => { const out = []; for (let s = 1, t; (t = QuestionBank.stepTitle(section, s)); s++) out.push(t); return out; };
  return Object.freeze({ card, intro, serve, pic, stepTitles });
})();

/* ---------- sections served from banks ---------- */
// Jobs (banks/learn-play.jobs.json): step 1 who helps us?, then one worker a step (with review of earlier workers), then all the jobs
const JobsBank = BankCards.serve('jobs', { review: { share: 0.3, from: 2, to: 9 } });
Object.assign(CATEGORIES.find((c) => c.id === 'jobs'), {
  sub: 'who helps us? · helmet, fire hose', gen: JobsBank.gen, baseGen: JobsBank.baseGen, teach: JobsBank.teach, maxLevel: BankCards.stepTitles('jobs').length,
});
