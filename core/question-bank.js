/* kids-core question banks: one common format for written questions, lessons and tagged pictures
   (format "kids-core/question-bank", schema 2; described in QUESTION-FORMAT.md).

   A bank (a "learning set") is data only: questions, the lessons taught before them, the pictures they use (with
   named parts a child can tap), and optionally its own recordings. The same file is what an app bundles, what
   Studio edits, what a database stores row by row (QuestionBank.rows) and what a family downloads.
   Field names follow 1EdTech QTI 3 (item identifier, interaction, choices, correct response, feedback) so a bank can
   be exported to it; curriculum standards are named by code and, when known, by their CASE GUID.

     QuestionBank.check(bank)            → a list of problems (empty when the bank is good)
     QuestionBank.add(bank)              → checks it and makes it available (throws on a bad bank)
     QuestionBank.questions({ section, step, grade, country })
     QuestionBank.lesson(section, step, grade)      QuestionBank.stepTitle(section, step)
     QuestionBank.picture('helpers/firefighter#fire-hose')  → { picture, tag, light }
     QuestionBank.spoken(bank)           → every sentence that needs a recording
     QuestionBank.rows(bank)             → the bank as flat tables, for a database

   Core checks and stores banks. Drawing a question on screen is the app's job (its own card styles). */
const QuestionBank = (() => {
  const FORMAT = 'kids-core/question-bank', SCHEMA = 2;
  const INTERACTIONS = ['choice', 'multi', 'tap', 'match', 'order', 'spell'];
  const STATUSES = ['draft', 'review', 'published', 'retired'];
  const banks = new Map();

  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const isId = (v) => typeof v === 'string' && /^[a-z0-9][a-z0-9._-]{0,95}$/.test(v);
  const isPicId = (v) => typeof v === 'string' && /^[a-z0-9][a-z0-9._/-]{0,95}$/.test(v) && !v.includes('..') && !v.includes('//');
  const isText = (v, max = 350) => typeof v === 'string' && !!v.trim() && v.length <= max;
  const isFile = (v, ext) => typeof v === 'string' && new RegExp(`^[a-z0-9][a-z0-9._/-]{0,150}\\.(?:${ext})$`, 'i').test(v) && !v.includes('..') && !v.includes('//');
  const nums = (v, n, exact = true) => Array.isArray(v) && (exact ? v.length === n : v.length >= n && v.length % 2 === 0) && v.every((x) => typeof x === 'number' && Number.isFinite(x));
  // drawings are shown inside the app's own page, so they may hold shapes only: nothing that runs or loads
  const UNSAFE_SVG = /<\s*(script|foreignObject|iframe|object|embed|image|use|a|style|link|meta|animate|set)\b|\son[a-z]+\s*=|javascript:|data:|https?:|url\(\s*(?!#)/i;
  const EMOJI = /^emoji\/(?=.*\p{Extended_Pictographic}|.*\p{Regional_Indicator})[^\s<>"'&]{1,24}$/u;

  // "helpers/firefighter", "helpers/firefighter#fire-hose" (that part alone), "helpers/firefighter?light=fire-hose"
  // (the whole picture with that part lit), or "emoji/🚒"
  function parseRef(ref) {
    if (typeof ref !== 'string') return null;
    if (EMOJI.test(ref)) return { emoji: ref.slice(6) };
    const m = /^([^#?]+)(?:#([a-z0-9._-]+)|\?light=([a-z0-9._-]+))?$/.exec(ref);
    return m && isPicId(m[1]) ? { id: m[1], tag: m[2] || null, light: m[3] || null } : null;
  }
  const sayList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
  // prompt text may mark the key word with **bold**; nothing else
  const plain = (t) => String(t == null ? '' : t).replace(/\*\*/g, '');
  const html = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  /* ---------- the checker ---------- */
  function check(bank, opts = {}) {
    const out = [], bad = (msg) => { if (out.length < 200) out.push(msg); };
    if (!isObj(bank)) return ['the bank must be a JSON object'];
    if (bank.format !== FORMAT) bad(`format must be "${FORMAT}"`);
    if (bank.schema !== SCHEMA) bad(`schema must be ${SCHEMA}`);
    if (!isId(bank.id)) bad('id must be a short lower-case name (letters, digits, . _ -)');
    if (!isText(bank.title, 80)) bad('title is required (up to 80 letters)');
    if (!Number.isSafeInteger(bank.version) || bank.version < 1) bad('version must be a whole number, 1 or more');
    if (typeof bank.language !== 'string' || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(bank.language)) bad('language must be a language tag such as en-US');
    if (bank.entitlement != null && !isId(bank.entitlement)) bad('entitlement must be a short lower-case name');
    const grades = opts.grades || null;
    const gradesOk = (g, where) => {
      if (!Array.isArray(g) || !g.length || !g.every(isId) || new Set(g).size !== g.length) bad(`${where}: grades must list at least one grade`);
      else if (grades && !g.every((x) => grades.includes(x))) bad(`${where}: grades may only be ${grades.join(', ')}`);
    };
    const placeOk = (x, where) => {
      if (!isId(x.section)) bad(`${where}: section is required`);
      if (!Number.isSafeInteger(x.step) || x.step < 1 || x.step > 60) bad(`${where}: step must be a whole number from 1 to 60`);
      gradesOk(x.grades, where);
      if (x.countries != null && !(Array.isArray(x.countries) && x.countries.length && x.countries.every((c) => c === '*' || /^[a-z]{2}$/.test(c)))) bad(`${where}: countries must be "*" or two-letter codes`);
    };

    // pictures and their named parts
    const pics = new Map();
    for (const [i, p] of (Array.isArray(bank.pictures) ? bank.pictures : bank.pictures == null ? [] : [null]).entries()) {
      const where = `picture ${isObj(p) && p.id ? p.id : i + 1}`;
      if (!isObj(p) || !isPicId(p.id)) { bad(`${where}: id is required`); continue; }
      if (pics.has(p.id)) bad(`${where}: this id is used twice`);
      if (!isText(p.alt, 120)) bad(`${where}: alt (what the picture shows) is required`);
      const inline = typeof p.svg === 'string';
      if (inline === (p.file != null)) bad(`${where}: give either file or svg, not both`);
      if (p.file != null && !isFile(p.file, 'svg|webp|png|jpg|jpeg')) bad(`${where}: file must be a picture inside the set`);
      if (inline) {
        if (!p.svg.trim() || p.svg.length > 80000) bad(`${where}: svg must be 1 to 80,000 characters`);
        if (UNSAFE_SVG.test(p.svg)) bad(`${where}: svg may hold shapes only (no scripts, links, images or styles)`);
        if (typeof p.viewBox !== 'string' || !/^-?\d+(\.\d+)? -?\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/.test(p.viewBox)) bad(`${where}: viewBox is required with svg`);
      }
      const tags = new Map();
      for (const [j, t] of (Array.isArray(p.tags) ? p.tags : p.tags == null ? [] : [null]).entries()) {
        const tw = `${where} tag ${isObj(t) && t.id ? t.id : j + 1}`;
        if (!isObj(t) || !isId(t.id)) { bad(`${tw}: id is required`); continue; }
        if (tags.has(t.id)) bad(`${tw}: this id is used twice`);
        if (!isText(t.label, 60)) bad(`${tw}: label (the spoken name) is required`);
        const a = isObj(t.area) ? t.area : {}, kinds = ['group', 'ellipse', 'rect', 'polygon'].filter((k) => a[k] != null);
        if (kinds.length !== 1) bad(`${tw}: area needs exactly one of group, ellipse, rect or polygon`);
        else if (kinds[0] === 'group') {
          if (!isText(a.group, 60) || /["<>&]/.test(a.group)) bad(`${tw}: area.group must be the name of a group in the drawing`);
          else if (inline && !p.svg.includes(`data-val="${a.group}"`)) bad(`${tw}: the drawing has no group named "${a.group}"`);
        } else if (kinds[0] === 'polygon' ? !nums(a.polygon, 6, false) : !nums(a[kinds[0]], 4)) bad(`${tw}: area.${kinds[0]} needs numbers`);
        if (t.box != null && !(nums(t.box, 4) && t.box[2] > 0 && t.box[3] > 0)) bad(`${tw}: box must be [x, y, width, height]`);
        tags.set(t.id, t);
      }
      pics.set(p.id, tags);
    }
    const refOk = (ref, where, { plainOnly = false } = {}) => {
      const r = parseRef(ref);
      if (!r) return bad(`${where}: "${ref}" is not a picture`), null;
      if (r.emoji) return plainOnly ? (bad(`${where}: needs a picture from this set`), null) : r;
      if (!pics.has(r.id)) return bad(`${where}: there is no picture "${r.id}"`), null;
      const tag = r.tag || r.light;
      if (tag && !pics.get(r.id).has(tag)) return bad(`${where}: picture "${r.id}" has no part "${tag}"`), null;
      if (plainOnly && tag) return bad(`${where}: needs the whole picture`), null;
      return r;
    };
    const sayOk = (v, where) => { if (v != null && !(sayList(v).length && sayList(v).every((s) => isText(s, 350)))) bad(`${where}: say must be a sentence, or a list of sentences`); };
    const sideOk = (s, where) => {      // one side of a pair, an item to order, or a choice
      if (!isObj(s)) return bad(`${where}: must be an object`);
      if (s.text == null && s.picture == null) bad(`${where}: needs text or a picture`);
      if (s.text != null && !isText(s.text, 120)) bad(`${where}: text must be up to 120 letters`);
      if (s.picture != null) refOk(s.picture, where);
      if (s.text == null && !isText(s.label, 60)) bad(`${where}: a picture needs a label (its spoken name)`);
      if (s.label != null && !isText(s.label, 60)) bad(`${where}: label must be up to 60 letters`);
    };

    // questions
    const qIds = new Set();
    if (!Array.isArray(bank.questions) || bank.questions.length < 1 || bank.questions.length > 6000) bad('questions must list 1 to 6,000 questions');
    for (const [i, q] of (Array.isArray(bank.questions) ? bank.questions : []).entries()) {
      const where = `question ${isObj(q) && q.id ? q.id : i + 1}`;
      if (!isObj(q) || !isId(q.id)) { bad(`${where}: id is required`); continue; }
      if (qIds.has(q.id)) bad(`${where}: this id is used twice`);
      qIds.add(q.id);
      placeOk(q, where);
      if (!INTERACTIONS.includes(q.interaction)) { bad(`${where}: interaction must be one of ${INTERACTIONS.join(', ')}`); continue; }
      if (!isObj(q.prompt) || !isText(q.prompt.text, 350)) bad(`${where}: prompt.text is required`);
      else sayOk(q.prompt.say, `${where} prompt`);
      if (q.picture != null) refOk(q.picture, where);
      if (q.status != null && !STATUSES.includes(q.status)) bad(`${where}: status must be one of ${STATUSES.join(', ')}`);
      if (q.updated != null && !/^\d{4}-\d{2}-\d{2}$/.test(q.updated)) bad(`${where}: updated must be a date like 2026-11-12`);
      if (q.shuffle != null && typeof q.shuffle !== 'boolean') bad(`${where}: shuffle must be true or false`);
      if (q.explain != null && !isText(q.explain, 400)) bad(`${where}: explain must be up to 400 letters`);
      if (q.hint != null) {
        if (!isObj(q.hint) || (q.hint.text == null && q.hint.say == null && q.hint.picture == null)) bad(`${where}: hint needs text, say or a picture`);
        else { if (q.hint.text != null && !isText(q.hint.text, 300)) bad(`${where}: hint.text must be up to 300 letters`); sayOk(q.hint.say, `${where} hint`); if (q.hint.picture != null) refOk(q.hint.picture, `${where} hint`); }
      }
      for (const a of q.alignment == null ? [] : Array.isArray(q.alignment) ? q.alignment : [null]) {
        if (!isObj(a) || !isText(a.framework, 40) || !isText(a.code, 60) || (a.caseGuid != null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.caseGuid))) bad(`${where}: each alignment needs a framework, a code and (if known) a CASE GUID`);
      }
      const answer = Array.isArray(q.answer) ? q.answer : null;
      if (q.interaction === 'choice' || q.interaction === 'multi') {
        const ch = Array.isArray(q.choices) ? q.choices : [];
        if (ch.length < 2 || ch.length > 6) bad(`${where}: needs 2 to 6 choices`);
        const ids = new Set(), seen = new Set();
        for (const [j, c] of ch.entries()) {
          const cw = `${where} choice ${j + 1}`;
          sideOk(c, cw);
          if (!isObj(c)) continue;
          if (!isId(c.id) || ids.has(c.id)) bad(`${cw}: needs its own id`);
          ids.add(c.id);
          const same = `${c.text || ''}|${c.picture || ''}`;
          if (seen.has(same)) bad(`${cw}: is the same as another choice`);
          seen.add(same);
        }
        if (!answer || !answer.length || !answer.every((a) => ids.has(a)) || new Set(answer).size !== answer.length) bad(`${where}: answer must list the id of each right choice`);
        else if (q.interaction === 'choice' && answer.length !== 1) bad(`${where}: a choice question has exactly one right answer`);
        else if (answer.length === ch.length) bad(`${where}: not every choice can be right`);
      } else if (q.interaction === 'tap') {
        const r = q.picture == null ? (bad(`${where}: a tap question needs a picture`), null) : refOk(q.picture, where, { plainOnly: true });
        const tags = r && pics.get(r.id);
        if (tags && tags.size < 2) bad(`${where}: the picture needs at least two named parts`);
        if (!answer || answer.length !== 1 || (tags && !tags.has(answer[0]))) bad(`${where}: answer must be one named part of the picture`);
      } else if (q.interaction === 'match') {
        const pairs = Array.isArray(q.pairs) ? q.pairs : [];
        if (pairs.length < 2 || pairs.length > 60) bad(`${where}: needs 2 to 60 pairs`);
        for (const [j, p] of pairs.entries()) { if (!isObj(p)) { bad(`${where} pair ${j + 1}: needs left and right`); continue; } sideOk(p.left, `${where} pair ${j + 1} left`); sideOk(p.right, `${where} pair ${j + 1} right`); }
        if (q.show != null && !(Number.isSafeInteger(q.show) && q.show >= 2 && q.show <= Math.min(6, pairs.length))) bad(`${where}: show must be from 2 to the number of pairs (6 at most)`);
        if (q.answer != null) bad(`${where}: a match question has no answer field (the pairs are the answer)`);
      } else if (q.interaction === 'order') {
        const items = Array.isArray(q.items) ? q.items : [];
        if (items.length < 2 || items.length > 8) bad(`${where}: needs 2 to 8 items, listed in the right order`);
        items.forEach((it, j) => sideOk(it, `${where} item ${j + 1}`));
      } else if (q.interaction === 'spell') {
        if (!answer || answer.length !== 1 || !isText(answer[0], 40)) bad(`${where}: answer must be the one word to spell`);
      }
    }

    // lessons: taught before the quiz, never scored
    const lIds = new Set(), spots = new Set();
    for (const [i, l] of (Array.isArray(bank.lessons) ? bank.lessons : bank.lessons == null ? [] : [null]).entries()) {
      const where = `lesson ${isObj(l) && l.id ? l.id : i + 1}`;
      if (!isObj(l) || !isId(l.id)) { bad(`${where}: id is required`); continue; }
      if (lIds.has(l.id)) bad(`${where}: this id is used twice`);
      lIds.add(l.id);
      placeOk(l, where);
      if (!isText(l.title, 80)) bad(`${where}: title is required`);
      for (const g of Array.isArray(l.grades) ? l.grades : []) { const k = `${l.section}|${l.step}|${g}`; if (spots.has(k)) bad(`${where}: another lesson already teaches ${l.section} step ${l.step} for ${g}`); spots.add(k); }
      const r = l.picture == null ? null : refOk(l.picture, where, { plainOnly: true });
      const tags = r && r.id ? pics.get(r.id) : null;
      if (!Array.isArray(l.lines) || l.lines.length < 1 || l.lines.length > 40) bad(`${where}: needs 1 to 40 lines`);
      for (const [j, line] of (Array.isArray(l.lines) ? l.lines : []).entries()) {
        if (!isObj(line) || !isText(line.say, 350)) { bad(`${where} line ${j + 1}: say is required`); continue; }
        if (line.light != null && !(tags && tags.has(line.light))) bad(`${where} line ${j + 1}: the lesson picture has no part "${line.light}"`);
      }
      if (l.together != null && !qIds.has(l.together)) bad(`${where}: together must be the id of a question in this set`);
    }

    // the names of the steps (shown to grown-ups in progress, and to Studio)
    const stepIds = new Set();
    for (const [i, s] of (Array.isArray(bank.steps) ? bank.steps : bank.steps == null ? [] : [null]).entries()) {
      if (!isObj(s) || !isId(s.section) || !Number.isSafeInteger(s.step) || s.step < 1 || s.step > 60 || !isText(s.title, 80)) { bad(`step name ${i + 1}: needs a section, a step number and a title`); continue; }
      if (stepIds.has(`${s.section}|${s.step}`)) bad(`step name ${i + 1}: ${s.section} step ${s.step} is named twice`);
      stepIds.add(`${s.section}|${s.step}`);
    }

    // the set's own recordings: sentence → file
    if (bank.audio != null) {
      if (!isObj(bank.audio)) bad('audio must map each sentence to its recording');
      else for (const [k, f] of Object.entries(bank.audio)) if (!isText(k, 400) || !isFile(f, 'mp3|m4a|ogg')) { bad(`audio "${k.slice(0, 40)}": needs a recording file`); break; }
    }
    return out;
  }
  function validate(bank, opts) {
    const problems = check(bank, opts);
    if (problems.length) throw new Error(`Invalid question bank ${isObj(bank) && bank.id ? bank.id : ''}: ${problems[0]}${problems.length > 1 ? ` (and ${problems.length - 1} more)` : ''}`);
    return bank;
  }

  /* ---------- the registry ---------- */
  const freeze = (v) => { if (v && typeof v === 'object' && !Object.isFrozen(v)) { Object.freeze(v); Object.values(v).forEach(freeze); } return v; };
  function add(bank, opts) {
    validate(bank, opts);
    const old = banks.get(bank.id);
    if (old && old.version > bank.version) throw new Error(`Question bank ${bank.id}: version ${bank.version} is older than the one in use (${old.version})`);
    banks.set(bank.id, freeze(bank));
    return bank;
  }
  const fits = (x, { section, step, grade, country }) => (section == null || x.section === section) && (step == null || x.step === step) &&
    (grade == null || x.grades.includes(grade)) && (country == null || !x.countries || x.countries.includes('*') || x.countries.includes(country));
  function questions(where = {}) {
    const status = where.status || 'published', out = [];
    for (const b of banks.values()) if (where.bank == null || b.id === where.bank) for (const q of b.questions) if ((q.status || 'published') === status && fits(q, where)) out.push(q);
    return out;
  }
  function lesson(section, step, grade) {
    for (const b of banks.values()) for (const l of b.lessons || []) if (fits(l, { section, step, grade })) return l;
    return null;
  }
  function picture(ref) {
    const r = parseRef(ref); if (!r) return null;
    if (r.emoji) return { emoji: r.emoji };
    for (const b of banks.values()) for (const p of b.pictures || []) if (p.id === r.id) {
      const tag = (id) => (id ? (p.tags || []).find((t) => t.id === id) || null : null);
      return { picture: p, tag: tag(r.tag), light: tag(r.light) };
    }
    return null;
  }
  const stepTitle = (section, step) => { for (const b of banks.values()) { const s = (b.steps || []).find((x) => x.section === section && x.step === step); if (s) return s.title; } return null; };
  const question = (id) => { for (const b of banks.values()) { const q = b.questions.find((x) => x.id === id); if (q) return q; } return null; };

  /* ---------- what needs a recording ---------- */
  function spoken(bank) {
    const out = new Set(), add1 = (v) => sayList(v).forEach((s) => { if (typeof s === 'string' && s.trim()) out.add(s); });
    for (const q of bank.questions || []) {
      add1(q.prompt && (q.prompt.say != null ? q.prompt.say : plain(q.prompt.text)));
      if (q.hint) add1(q.hint.say != null ? q.hint.say : q.hint.text);
      add1(q.explain);
    }
    for (const l of bank.lessons || []) for (const line of l.lines || []) add1(line.say);
    return [...out];
  }

  /* ---------- the same bank as flat tables (one row per thing, joined by id) ---------- */
  function rows(bank) {
    const t = { sets: [], steps: [], questions: [], choices: [], pairs: [], items: [], alignments: [], lessons: [], lessonLines: [], pictures: [], tags: [], media: [] };
    const join = (v) => (v == null ? null : Array.isArray(v) ? v.join('|') : v);
    t.sets.push({ id: bank.id, title: bank.title, version: bank.version, language: bank.language, entitlement: bank.entitlement || 'free' });
    for (const s of bank.steps || []) t.steps.push({ set: bank.id, section: s.section, step: s.step, title: s.title });
    for (const q of bank.questions || []) {
      t.questions.push({ set: bank.id, id: q.id, section: q.section, step: q.step, grades: join(q.grades), countries: join(q.countries || ['*']), interaction: q.interaction,
        promptText: q.prompt.text, promptSay: join(q.prompt.say), picture: q.picture || null, answer: join(q.answer), show: q.show || null, shuffle: q.shuffle !== false,
        hintText: (q.hint && q.hint.text) || null, hintSay: join(q.hint && q.hint.say), hintPicture: (q.hint && q.hint.picture) || null, explain: q.explain || null,
        status: q.status || 'published', updated: q.updated || null });
      (q.choices || []).forEach((c, i) => t.choices.push({ question: q.id, position: i + 1, id: c.id, text: c.text || null, picture: c.picture || null, label: c.label || null }));
      (q.pairs || []).forEach((p, i) => t.pairs.push({ question: q.id, position: i + 1, leftText: p.left.text || null, leftPicture: p.left.picture || null, leftLabel: p.left.label || null,
        rightText: p.right.text || null, rightPicture: p.right.picture || null, rightLabel: p.right.label || null }));
      (q.items || []).forEach((it, i) => t.items.push({ question: q.id, position: i + 1, text: it.text || null, picture: it.picture || null, label: it.label || null }));
      (q.alignment || []).forEach((a) => t.alignments.push({ question: q.id, framework: a.framework, code: a.code, caseGuid: a.caseGuid || null }));
    }
    for (const l of bank.lessons || []) {
      t.lessons.push({ set: bank.id, id: l.id, section: l.section, step: l.step, grades: join(l.grades), countries: join(l.countries || ['*']), title: l.title, picture: l.picture || null, together: l.together || null });
      l.lines.forEach((line, i) => t.lessonLines.push({ lesson: l.id, position: i + 1, say: line.say, light: line.light || null }));
    }
    for (const p of bank.pictures || []) {
      t.pictures.push({ set: bank.id, id: p.id, alt: p.alt, file: p.file || null, svg: p.svg || null, viewBox: p.viewBox || null });
      (p.tags || []).forEach((g, i) => t.tags.push({ picture: p.id, position: i + 1, id: g.id, label: g.label, area: JSON.stringify(g.area), box: g.box ? g.box.join(' ') : null }));
    }
    for (const [sentence, file] of Object.entries(bank.audio || {})) t.media.push({ set: bank.id, kind: 'audio', sentence, file });
    return t;
  }

  return Object.freeze({
    FORMAT, SCHEMA, INTERACTIONS, check, validate, add, questions, question, lesson, stepTitle, picture, parseRef, spoken, rows, plain, html,
    get: (id) => banks.get(id) || null, all: () => [...banks.values()],
    remove: (id) => banks.delete(id),
  });
})();
