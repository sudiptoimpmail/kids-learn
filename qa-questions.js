/* QA: "All questions" collector + viewer.
   Walks every grade × section × level through the real round pipeline, repeats until no new cards appear,
   and records every distinct question with its answer, hint, level and grade-fit — so a person or an AI
   reviewer can check accuracy, quality and difficulty. Also covers the free story-book comprehension questions.
   Only reachable from the grown-ups' 🧪 Test mode box (or tests); nothing here runs in normal play. */
(() => {
  'use strict';
  const GRADE_IDS = ['prek', 'k', 'g1', 'g2', 'g3'];
  const SKIP = ['mix', 'placement', 'check'];
  // what an AI reviewer is asked to judge
  const RUBRIC = [
    'You are reviewing questions from a children\'s learning app (Pre-K to 3rd grade, US Common Core-style expectations unless the country edition says otherwise).',
    'For EVERY question return one JSON object: {"id", "accuracy", "quality", "difficulty", "notes", "fix"}.',
    '- accuracy: "ok" | "wrong" | "ambiguous". Check the marked correct answer is really correct, that exactly one option is correct (unless it is a pick-all card), and that no distractor is also defensible.',
    '- quality: "ok" | "poor". Flag unclear wording, grammar or spelling errors, unfair tricks, cultural bias, text that depends on a picture or audio you cannot see ([image: …] marks pictures), and age-inappropriate content.',
    '- difficulty: "too-easy" | "on-level" | "too-hard", judged against the stated grade and level (levels run from 1 = easiest). Say which skill is being tested in notes.',
    '- fix: a corrected version when accuracy or quality is not "ok", otherwise "".',
    'Be strict about arithmetic, spelling, facts, and answer keys. Do not invent problems: say "ok" when the card is fine.'
  ].join('\n');

  const plain = (html) => {
    if (html == null) return '';
    if (typeof html !== 'string') html = String(html);
    if (!/[<&]/.test(html)) return html.trim();
    const d = document.createElement('div'); d.innerHTML = html;
    d.querySelectorAll('img').forEach((im) => im.replaceWith(`[image: ${im.getAttribute('alt') || im.getAttribute('aria-label') || im.getAttribute('src') || 'picture'}]`));
    d.querySelectorAll('svg').forEach((sv) => sv.replaceWith(`[drawing${sv.getAttribute('aria-label') ? ': ' + sv.getAttribute('aria-label') : ''}]`));
    d.querySelectorAll('br,p,div').forEach((n) => n.append(' '));
    return d.textContent.replace(/\s+/g, ' ').trim();
  };
  const kindOf = (q) => q.build ? 'build' : q.spell ? 'spell' : q.passageFill ? 'passage-fill' : q.fillIn ? 'fill-in' : q.puzzle ? 'puzzle' : q.match ? 'match'
    : q.multi ? 'pick-all' : q.letterPath ? 'letter-path' : q.order ? 'order' : q.illustrated ? 'scene' : q.tap ? 'tap' : q.trace ? 'trace' : q.body3d ? 'body' : q.options ? 'choice' : 'other';
  const safe = (v) => { try { return JSON.parse(JSON.stringify(v, (k, x) => (typeof x === 'function' ? undefined : x))); } catch { return String(v); } };
  const bodyOf = (q) => { const b = q.match || q.order || q.fillIn || q.passageFill || q.letterPath || q.spell || q.build || q.tap || q.puzzle; return b == null ? undefined : safe(b); };
  const fingerprint = (q) => [plain(q.text), plain(q.main), String(q.answer), JSON.stringify(bodyOf(q) || '').slice(0, 200), (q.options || []).map((o) => plain(o.html != null ? o.html : o.v)).join('/')].join('|');

  function describe(q, ctx) {
    const kind = kindOf(q), multi = Array.isArray(q.multi) ? q.multi.map(String) : null;
    const options = (q.options || []).map((o) => {
      const text = plain(o.html != null ? o.html : o.v);
      const correct = multi ? multi.includes(String(o.v)) : q.answer != null && typeof q.answer !== 'object' && String(o.v) === String(q.answer);
      return { text, correct };
    });
    const hint = q.hint ? plain(q.hint.html || q.hint.say || '') : '';
    let fit = null;
    try { if (typeof gradeFits === 'function') fit = !!gradeFits(q, ctx.grade, ctx.section); } catch {}
    const issues = [];
    if (kind === 'choice') {
      const right = options.filter((o) => o.correct).length;
      if (right !== 1) issues.push(right === 0 ? 'no option matches the answer key' : 'more than one option matches the answer key');
      if (new Set(options.map((o) => o.text)).size !== options.length) issues.push('duplicate option text');
    }
    if (kind !== 'trace' && !plain(q.text) && !plain(q.main) && !bodyOf(q)) issues.push('no visible prompt');
    return {
      id: `${ctx.grade}/${ctx.section}/L${ctx.level}/${ctx.n}`,
      key: q.key || '', grade: ctx.grade, section: ctx.section, sectionTitle: ctx.title, level: ctx.level, kind,
      prompt: plain(q.text), main: plain(q.main), options,
      answer: q.answer == null ? (multi ? multi.join(', ') : '') : typeof q.answer === 'object' ? safe(q.answer) : String(q.answer),
      hint, spoken: plain(Array.isArray(q.say) ? q.say.join(' ') : q.say), detail: bodyOf(q),
      gradeFit: fit, autoIssues: issues
    };
  }

  const tick = () => new Promise((r) => setTimeout(r, 0));

  async function collect(opts = {}) {
    const grades = opts.grades || GRADE_IDS, maxRounds = opts.maxRounds || 40, patience = opts.patience || 4;
    const onProgress = opts.onProgress || (() => {});
    const keep = {};   // restore the child's real state afterwards
    for (const k of ['grade', 'testMode', 'showAll', 'country', 'region', 'optAnatomy', 'levels', 'recent', 'recentContent']) keep[k] = typeof structuredClone === 'function' ? structuredClone(state[k]) : JSON.parse(JSON.stringify(state[k] === undefined ? null : state[k]));
    const keepR = typeof R !== 'undefined' ? R : null;
    const out = [];
    try {
      for (const g of grades) {
        Object.assign(state, { grade: g, testMode: false, showAll: false, country: 'us', region: 'Michigan', optAnatomy: true, levels: {}, recent: {}, recentContent: {} });
        const sections = visibleGames().filter((c) => c.gen && !SKIP.includes(c.id));
        for (const c of sections) {
          const [lo, hi] = gradeRange(g, c.id) || [1, 1];
          for (let lv = lo; lv <= hi; lv++) {
            state.levels[c.id] = lv;
            const seen = new Set(); let dry = 0, n = 0;
            for (let r = 0; r < maxRounds && dry < patience; r++) {
              state.recent[c.id] = []; state.recentContent[c.id] = [];
              R = null;
              try { startRound(c.id, 10); } catch (e) { out.push({ id: `${g}/${c.id}/L${lv}/error`, grade: g, section: c.id, level: lv, kind: 'error', prompt: String(e.message), options: [], autoIssues: ['generator threw: ' + e.message] }); break; }
              if (!R || R.cat.id !== c.id) { dry++; continue; }
              let fresh = 0;
              for (const q of R.qs) {
                const fp = fingerprint(q); if (seen.has(fp)) continue;
                seen.add(fp); fresh++; n++;
                out.push(describe(q, { grade: g, section: c.id, title: c.title, level: lv, n }));
              }
              dry = fresh ? 0 : dry + 1;
              try { document.querySelector('#quitBtn').click(); } catch {}
            }
            onProgress({ grade: g, section: c.id, level: lv, total: out.length });
            await tick();
          }
        }
      }
      // free story-book comprehension questions
      if (!opts.noBooks && typeof availableBooks === 'function' && typeof loadBook === 'function') {
        for (const g of grades) {
          for (const b of availableBooks(g) || []) {
            try {
              const book = await loadBook(b.id || b);
              (book.questions || []).forEach((q, i) => out.push({
                id: `${g}/library/${b.id || b}/${i + 1}`, key: `book-${b.id || b}-${i}`, grade: g, section: 'library', sectionTitle: 'Story library', level: 0, kind: 'choice',
                prompt: plain(q.ask), main: `Story: ${book.title || b.id || b}`, options: (q.options || []).map((o) => ({ text: plain(Array.isArray(o) ? o[0] : o.v), correct: String(Array.isArray(o) ? o[0] : o.v) === String(q.answer) })),
                answer: String(q.answer), hint: '', spoken: '', gradeFit: null,
                autoIssues: (q.options || []).filter((o) => String(Array.isArray(o) ? o[0] : o.v) === String(q.answer)).length === 1 ? [] : ['answer key does not match exactly one option'] }));
            } catch (e) { out.push({ id: `${g}/library/${b.id || b}/error`, grade: g, section: 'library', level: 0, kind: 'error', prompt: String(e.message), options: [], autoIssues: ['book failed to load'] }); }
          }
        }
      }
    } finally {
      Object.assign(state, keep); R = keepR;
      try { document.querySelector('#quitBtn').click(); } catch {}
    }
    return { generated: new Date().toISOString(), count: out.length, rubric: RUBRIC, questions: out };
  }

  function toMarkdown(data, only) {
    const qs = only || data.questions, L = [`# Learn & Play — all questions (${qs.length})`, '', '## Reviewer instructions', '', data.rubric, ''];
    let head = '';
    for (const q of qs) {
      const h = `${q.grade} · ${q.sectionTitle || q.section} · level ${q.level}`;
      if (h !== head) { head = h; L.push('', `## ${h}`, ''); }
      L.push(`### ${q.id}  (${q.kind})`);
      if (q.main) L.push(q.main);
      if (q.prompt) L.push(`**Q:** ${q.prompt}`);
      if (q.options.length) q.options.forEach((o) => L.push(`- ${o.correct ? '✅' : '⬜'} ${o.text}`));
      else if (q.answer !== '') L.push(`**Answer:** ${typeof q.answer === 'object' ? JSON.stringify(q.answer) : q.answer}`);
      if (q.detail !== undefined) L.push('```json', JSON.stringify(q.detail).slice(0, 600), '```');
      if (q.hint) L.push(`_Hint:_ ${q.hint}`);
      if (q.autoIssues && q.autoIssues.length) L.push(`⚠️ ${q.autoIssues.join('; ')}`);
      L.push('');
    }
    return L.join('\n');
  }

  const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function open() {
    document.getElementById('qaAll')?.remove();
    const ov = document.createElement('div'); ov.id = 'qaAll'; ov.className = 'qa-all'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'All questions');
    ov.innerHTML = `<div class="qa-bar"><b>📋 All questions</b><button class="big-btn alt small" data-a="close">✕ Close</button></div>
      <div class="qa-mode"><p class="qa-status">How many questions?</p>
        <button class="big-btn" data-m="quick">⚡ Quick sample (about 7,000 questions, under a minute)</button>
        <button class="big-btn alt" data-m="all">📚 Everything (slow: can take several minutes)</button></div>
      <p class="qa-status" role="status" hidden></p>
      <div class="qa-tools" hidden>
        <select data-f="grade"><option value="">All grades</option></select><select data-f="section"><option value="">All sections</option></select>
        <select data-f="level"><option value="">All levels</option></select><select data-f="kind"><option value="">All types</option></select>
        <label><input type="checkbox" data-f="issues"> Only flagged</label><input type="search" data-f="q" placeholder="Search text…">
        <button class="big-btn small" data-a="json">⬇ JSON</button><button class="big-btn small" data-a="md">⬇ Markdown</button><button class="big-btn alt small" data-a="copy">📋 Copy review prompt</button>
      </div><div class="qa-list"></div>`;
    document.body.appendChild(ov);
    ov.querySelector('[data-a=close]').onclick = () => ov.remove();
    const mode = await new Promise((res) => ov.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => res(b.dataset.m))));
    ov.querySelector('.qa-mode').remove();
    const status = ov.querySelector('.qa-status'); status.hidden = false; status.textContent = 'Collecting…';
    const data = await collect({ ...(mode === 'quick' ? { maxRounds: 3, patience: 2 } : {}), onProgress: (p) => { status.textContent = `Collecting… ${p.grade} · ${p.section} · level ${p.level} (${p.total} so far)`; } });
    window.__qaQuestions = data;
    status.textContent = `${data.count} questions collected${mode === 'quick' ? ' (quick sample)' : ''}.`;
    const tools = ov.querySelector('.qa-tools'); tools.hidden = false;
    const uniq = (f) => [...new Set(data.questions.map(f))].filter((x) => x !== undefined && x !== '');
    const fill = (name, vals) => { const s = tools.querySelector(`[data-f=${name}]`); vals.forEach((v) => s.insertAdjacentHTML('beforeend', `<option>${esc(v)}</option>`)); };
    fill('grade', uniq((q) => q.grade)); fill('section', uniq((q) => q.section)); fill('level', uniq((q) => q.level).sort((a, b) => a - b)); fill('kind', uniq((q) => q.kind));
    const list = ov.querySelector('.qa-list'); let shown = 0, current = [];
    const val = (n) => tools.querySelector(`[data-f=${n}]`);
    const filtered = () => { const f = { grade: val('grade').value, section: val('section').value, level: val('level').value, kind: val('kind').value, issues: val('issues').checked, q: val('q').value.toLowerCase() };
      return data.questions.filter((q) => (!f.grade || q.grade === f.grade) && (!f.section || q.section === f.section) && (!f.level || String(q.level) === f.level) && (!f.kind || q.kind === f.kind)
        && (!f.issues || (q.autoIssues && q.autoIssues.length) || q.gradeFit === false) && (!f.q || JSON.stringify(q).toLowerCase().includes(f.q))); };
    const card = (q) => `<article class="qa-card${q.autoIssues && q.autoIssues.length ? ' flag' : ''}"><small>${esc(q.id)} · ${esc(q.kind)}${q.gradeFit === false ? ' · ⚠ grade-fit' : ''}</small>
      ${q.main ? `<div>${esc(q.main)}</div>` : ''}<b>${esc(q.prompt)}</b>
      ${q.options.length ? `<ul>${q.options.map((o) => `<li class="${o.correct ? 'ok' : ''}">${o.correct ? '✅' : '⬜'} ${esc(o.text)}</li>`).join('')}</ul>` : (q.answer !== '' ? `<div>Answer: <b>${esc(typeof q.answer === 'object' ? JSON.stringify(q.answer) : q.answer)}</b></div>` : '')}
      ${q.hint ? `<small>Hint: ${esc(q.hint)}</small>` : ''}${q.autoIssues && q.autoIssues.length ? `<div class="qa-issue">⚠️ ${esc(q.autoIssues.join('; '))}</div>` : ''}</article>`;
    const render = (more) => { if (!more) { current = filtered(); shown = 0; list.innerHTML = `<p class="qa-status">${current.length} shown</p>`; }
      const next = current.slice(shown, shown + 150); shown += next.length; list.querySelector('.qa-more')?.remove();
      list.insertAdjacentHTML('beforeend', next.map(card).join('') + (shown < current.length ? '<button class="big-btn alt small qa-more">Show more</button>' : ''));
      list.querySelector('.qa-more')?.addEventListener('click', () => render(true)); };
    tools.addEventListener('input', () => render(false)); render(false);
    ov.querySelector('[data-a=json]').onclick = () => download('learn-play-questions.json', JSON.stringify({ ...data, questions: filtered() }, null, 1), 'application/json');
    ov.querySelector('[data-a=md]').onclick = () => download('learn-play-questions.md', toMarkdown(data, filtered()), 'text/markdown');
    ov.querySelector('[data-a=copy]').onclick = async (e) => { try { await navigator.clipboard.writeText(RUBRIC); e.target.textContent = '✅ Copied'; } catch { e.target.textContent = 'Copy failed'; } };
    return data;
  }

  window.QAQuestions = { collect, toMarkdown, open, RUBRIC };
})();
