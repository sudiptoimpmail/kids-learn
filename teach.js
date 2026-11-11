/* Teach first (I do · we do · you do).
   The first time a child starts a skill step, Professor Hoot opens the round with two lesson cards:
     1. Watch me  — he works one card out loud, step by step, and taps the answer (the child only watches).
     2. Together  — the child answers one card with help: the clue is shown, fewer choices, the answer glows if needed.
   Then "Your turn!" and the normal round begins. Lesson cards never count as evidence, stars or Play Zone time.
   A step is taught again after a step down, or when it has not been practised for a while (data/lessons.json policy).
   Scripts per skill are data (data/lessons.json); the actions they name are below. Recorded voice only. */
const TeachFirst = (() => {
  const L = {
    policy: ContentData.get('lessons', 'policy'),
    phrases: ContentData.get('lessons', 'phrases'),
    labels: ContentData.get('lessons', 'labels'),
    scripts: ContentData.get('lessons', 'scripts'),
  };
  const P = (id) => L.phrases[id] || id;
  const GENERIC = new Set(L.policy.genericHints);
  const INTERACTIVE = ['match', 'puzzle', 'multi', 'letterPath', 'fillIn', 'passageFill', 'order', 'build', 'spell', 'tap', 'illustrated', 'body3d', 'reveal'];
  const keyOf = (catId, level) => `${catId}:${level}`;
  const today = () => dayKey();
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const plain = (t) => String(t == null ? '' : t).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const hasClip = (t) => !!CLIPS[clipKey(String(t))];

  /* ---------- when to teach ---------- */
  // Older browser tests expect a round to start with its quiz; they skip lessons unless they ask (?teach=1), as with onboarding.
  const automatedSkip = () => navigator.webdriver && !/[?&]teach=1\b/.test(location.search);
  function needsTeaching(catId, level) {
    if (L.policy.skipCategories.includes(catId) || automatedSkip()) return false;
    const seen = (state.taught || {})[keyOf(catId, level)];
    if (!seen) return true;
    return daysBetween(seen, today()) >= L.policy.reteachAfterDays;
  }
  function markSeen(catId, level) {
    state.taught = state.taught || {};
    state.taught[keyOf(catId, level)] = today();
  }

  /* ---------- which cards can be taught ---------- */
  const teachable = (q) => !!q && Array.isArray(q.options) && q.options.length >= 2 && !INTERACTIVE.some((k) => q[k]);
  function lessonCards(cat, level, taken) {
    const out = [];
    for (let tries = 0; tries < 80 && out.length < 2; tries++) {
      let q;
      try { q = cat.gen(level); } catch { continue; }
      if (!teachable(q) || taken.has(q.key) || out.some((o) => o.key === q.key)) continue;
      if (state.grade && typeof gradeFits === 'function' && !gradeFits(q, state.grade, cat.id)) continue;
      q.cat = cat; q.level = level; q.grades = [state.grade].filter(Boolean);
      out.push(q);
    }
    return out.length === 2 ? out : null;
  }

  /* ---------- the round: insert the two lesson cards ---------- */
  CoreHooks.after('startRound', (result, catId, count, browse) => {
    if (!R || browse || isTestMode() || !R.cat || R.cat.id !== catId || !R.cat.gen) return;
    const level = R.sessionLevel;
    if (!needsTeaching(catId, level)) { markSeen(catId, level); return; }
    const cards = lessonCards(R.cat, level, new Set(R.qs.map((q) => q.key)));
    if (!cards) return;                                   // a skill with no tap-to-answer cards keeps its normal round
    cards[0].lesson = 'model'; cards[1].lesson = 'guided';
    R.lesson = { catId, level, quiz: R.qs.length, showMe: !!$('#showMeBtn') && !$('#showMeBtn').hidden };
    R.qs = [...cards, ...R.qs];
    R.i = 0;
    renderQ();
  }, { priority: 50 });

  // lesson cards are not evidence: no attempt log, no Play Zone credit
  CoreHooks.before('logAttempt', (q) => (q && q.lesson ? false : undefined));
  CoreHooks.before('creditLearningQuestion', (q) => (q && q.lesson ? false : undefined));

  // leaving the guided card: the lesson cards go, the quiz starts fresh at card 1
  CoreHooks.before('next', () => {
    const q = R && R.qs[R.i];
    if (!q || q.lesson !== 'guided') return;
    $('#pop').classList.remove('show');
    markSeen(R.lesson.catId, R.lesson.level); save();
    R.qs = R.qs.filter((x) => !x.lesson);
    Object.assign(R, { i: 0, firstTry: 0, mistakes: 0, streak: 0, best: 0, turnIntro: true });
    renderQ();
    return false;
  });

  // a step down means the child needs the model again at the easier step
  CoreHooks.after('applyRoundProgression', (status, id) => {
    if (status === 'supported' && L.policy.reteachAfterStepDown && state.taught) delete state.taught[keyOf(id, levelOf(id))];
  });

  /* ---------- on screen ---------- */
  function bar(kind) {
    let el = $('#teachBar');
    if (!el) {
      el = document.createElement('div'); el.id = 'teachBar'; el.className = 'teach-bar';
      el.setAttribute('role', 'status');
      $('#qText').before(el);
    }
    const pic = window.CoreMascot ? `<img src="${esc(CoreMascot.image)}" alt="" class="teach-owl">` : '<span class="teach-owl">🦉</span>';
    const icon = { model: '👀', guided: '🤝', turn: '⭐' }[kind];
    el.innerHTML = `${pic}<b>${icon} ${esc(L.labels[kind])}</b>`;
    el.hidden = false; el.dataset.kind = kind;
    el.classList.remove('teach-in'); void el.offsetWidth; el.classList.add('teach-in');
  }
  const hideBar = () => { const el = $('#teachBar'); if (el) el.hidden = true; };
  const optFor = (q, v) => [...$('#options').children].find((b) => String(b.dataset.v) === String(v));
  const rightOpt = (q) => optFor(q, q.answer);
  function lessonProgress() {
    $('#progress').innerHTML = `<span class="dot now teach-dot">🦉</span>`;
  }

  CoreHooks.after('renderQ', () => {
    const q = R && R.qs[R.i];
    $('#play').classList.toggle('teaching', !!(q && q.lesson));
    if (R && R.lesson && $('#showMeBtn')) $('#showMeBtn').hidden = !!(q && q.lesson) || !R.lesson.showMe;
    clearTimeout(TeachFirst.glowTimer);
    if (!q) return;
    if (q.lesson === 'model') { bar('model'); lessonProgress(); runModel(q); return; }
    if (q.lesson === 'guided') { bar('guided'); lessonProgress(); runGuided(q); return; }
    if (R.turnIntro) {
      R.turnIntro = false; bar('turn');
      // "Your turn!" before this card's own question (same recorded voice, one call)
      setTimeout(() => { if (R.qs[R.i] === q) say([P('turn'), ...(q.say ? sayParts(q.say) : [])]); }, 260);
      setTimeout(() => { if (R.qs[R.i] === q) hideBar(); }, 2500);
      return;
    }
    hideBar();
  });

  /* ---------- 1. Watch me ---------- */
  async function runModel(q) {
    const opts = $('#options');
    opts.classList.add('teach-lock'); opts.setAttribute('aria-disabled', 'true');
    $('#hintBtn').hidden = true;
    const token = ++TeachFirst.run;
    const alive = () => token === TeachFirst.run && R && R.qs[R.i] === q && $('#play').classList.contains('active');
    await sleep(320);                                       // after renderQ's own question audio starts, replace it
    const script = L.scripts[q.cat.id] || L.scripts.default;
    for (const step of script) {
      if (!alive()) return;
      await ACTIONS[step.startsWith('say:') ? 'say' : step](q, step.slice(4), alive);
      if (alive()) await sleep(180);
    }
    if (!alive()) return;
    const right = rightOpt(q); right && right.classList.add('right');
    sfx.yes();
    showModelButtons(q);
  }
  function showModelButtons(q) {
    let box = $('#teachNext');
    if (!box) { box = document.createElement('div'); box.id = 'teachNext'; box.className = 'teach-next'; $('#play .card').appendChild(box); }   // under the question card
    box.innerHTML = `<button class="big-btn alt small" data-a="again">🔁 ${esc(L.labels.again)}</button><button class="big-btn" data-a="go">▶ ${esc(L.labels.go)}</button>`;
    box.hidden = false;
    box.querySelector('[data-a="again"]').onclick = () => { sfx.tap(); box.hidden = true; clearMarks(); runModel(q); };
    box.querySelector('[data-a="go"]').onclick = () => { sfx.tap(); box.hidden = true; R.locked = true; next(); };
    box.querySelector('[data-a="go"]').focus({ preventScroll: true });
  }
  function clearMarks() {
    $$('#options .opt').forEach((b) => b.classList.remove('right', 'teach-point', 'teach-read'));
    $('#teachHand')?.remove();
    $$('#qMain .teach-count, #hintBox .teach-count').forEach((e) => { e.classList.remove('teach-count'); e.removeAttribute('data-n'); });
  }
  CoreHooks.before('renderQ', () => { const box = $('#teachNext'); if (box) box.hidden = true; $('#teachHand')?.remove(); $('#options')?.classList.remove('teach-lock'); $('#options')?.removeAttribute('aria-disabled'); });

  /* ---------- 2. Together ---------- */
  function runGuided(q) {
    const keep = L.policy.guidedChoices;
    const wrong = [...$('#options').children].filter((b) => String(b.dataset.v) !== String(q.answer));
    wrong.sort(() => Math.random() - 0.5).slice(0, Math.max(0, wrong.length - (keep - 1)))
      .forEach((b) => { b.disabled = true; b.classList.add('teach-off'); });
    if (q.hint && q.hint.html) setTimeout(() => { if (R.qs[R.i] === q && !q.hintShown) showHint(q, true); }, 300);
    setTimeout(() => { if (R.qs[R.i] === q) say([P('together'), ...(q.say ? sayParts(q.say) : [])]); }, 300);
    TeachFirst.glowTimer = setTimeout(() => {
      if (R.qs[R.i] !== q || R.locked) return;
      rightOpt(q)?.classList.add('teach-point'); say(P('tapGlow'));
    }, L.policy.guidedGlowAfterMs);
  }
  // a wrong tap on the guided card: show where to look instead of a plain "try again"
  CoreHooks.after('choose', (r, q, v) => {
    if (!q || q.lesson !== 'guided' || String(v) === String(q.answer)) return;
    clearTimeout(TeachFirst.glowTimer);
    rightOpt(q)?.classList.add('teach-point');
  });

  /* ---------- the actions a script can name ---------- */
  const hintWords = (q) => (q.hint ? (Array.isArray(q.hint.say) ? q.hint.say.join(' ') : String(q.hint.say || '')) : '');
  const usefulHint = (q) => !!q.hint && !!hintWords(q) && !GENERIC.has(clipKey(hintWords(q)));
  async function point(q) {
    const el = rightOpt(q); if (!el) return;
    el.classList.add('teach-point');
    const hand = document.createElement('div'); hand.id = 'teachHand'; hand.className = 'teach-hand'; hand.textContent = '👆';
    el.appendChild(hand);
    await sleep(700);
  }
  async function countIn(root, alive) {
    const items = $$('.obj', root).filter((e) => e.offsetParent !== null && !e.classList.contains('gone') && !e.classList.contains('crossed'));
    for (let i = 0; i < items.length && alive(); i++) {
      items[i].classList.add('teach-count'); items[i].dataset.n = String(i + 1);
      await say(String(i + 1));
    }
  }
  const ACTIONS = {
    say: (q, id) => say(P(id)),
    watch: () => say(P('watch')),
    q: (q) => (q.say ? say(q.say) : null),
    answer: async (q) => { const a = String(q.answer); return say(hasClip(a) ? a : P('thisOne')); },
    point: (q) => point(q),
    hint: async (q) => { if (!usefulHint(q)) return; showHint(q, true); await (q.hint.karaoke ? karaoke(q.hint.say) : say(q.hint.say, { rate: q.hint.slow ? 0.8 : 1 })); },
    // read each picture or word choice aloud, lighting it up
    each: async (q, _, alive) => {
      for (const o of q.options) {
        if (!alive()) return;
        if (!hasClip(o.v)) continue;
        const el = optFor(q, o.v); el && el.classList.add('teach-read');
        await say(String(o.v));
        el && el.classList.remove('teach-read');
      }
    },
    firstSound: async (q) => {
      if (q.letterSound && CLIPS[clipKey('sound ' + q.letterSound)]) { await say(P('firstSound')); await say('sound ' + q.letterSound); }
      else if (usefulHint(q)) await ACTIONS.hint(q);
    },
    // sound out a word by its sound units (f · i · sh), then blend it. A missing-letter card sounds out the whole word.
    // Only words of single sounds and digraphs are sounded out; a word with a vowel team or silent e gets its clue instead.
    sounds: async (q, _, alive) => {
      const a = String(q.answer).toLowerCase();
      const w = /^[a-z]$/.test(a) && /^[a-z]{2,6}$/.test(String(q.speak || '')) ? String(q.speak).toLowerCase() : a;
      const simple = /^[a-z]{2,6}$/.test(w) && ['short', 'digraphs'].includes(Decodable.wordStage(w));
      const SAME = { ck: 'k', ll: 'l', ss: 's', ff: 'f', zz: 'z', tch: 'ch', ph: 'f' };   // two letters, the sound already recorded
      const parts = simple ? Decodable.graphemes(w).map((g) => 'sound ' + (SAME[g] || g)) : null;
      if (!parts || !parts.every((p) => CLIPS[clipKey(p)])) return ACTIONS.hint(q);
      await say(P('eachSound'));
      for (const p of parts) { if (!alive()) return; await say(p); await sleep(120); }
      await say(P('blend'));
      await say(w, { rate: 0.8 }); await say(w);
    },
    firstLetter: async (q) => {
      const c = String(q.answer)[0];
      if (q.hint && q.hint.html) showHint(q, true);
      if (c && hasClip(c.toLowerCase())) { await say(P('firstLetter')); await say(c.toLowerCase()); }
    },
    claps: async (q, _, alive) => {
      showHint(q, true);
      const parts = $$('#hintBox .hint-claps span');
      for (let i = 0; i < parts.length && alive(); i++) {
        parts[i].classList.add('teach-count'); parts[i].dataset.n = String(i + 1);
        sfx.tap(); await say(String(i + 1));
      }
    },
    count: (q, _, alive) => countIn($('#qMain'), alive),
    countHint: (q, _, alive) => countIn($('#hintBox'), alive),
  };

  return { run: 0, glowTimer: 0, needsTeaching, teachable, actions: Object.keys(ACTIONS), scripts: L.scripts, phrases: L.phrases };
})();
