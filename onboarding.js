/* Parent-led first run. A child needs a name and grade before reaching Home.
   Existing profiles retain their progress; the parent may add siblings during setup. */
(() => {
  'use strict';
  const ages = { prek: 'Ages 3–5', k: 'Ages 5–6', g1: 'Ages 6–7', g2: 'Ages 7–8', g3: 'Ages 8–9' };
  const escapeHTML = value => String(value || '').replace(/[&<>"']/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  // Existing Playwright tests deliberately bypass the sheet; ?welcome=1 exercises real setup.
  // Human visitors never bypass the grade requirement.
  const automatedTest = () => navigator.webdriver && !/[?&]welcome=1\b/.test(location.search);
  const needsSetup = () => !(state.grade && Object.prototype.hasOwnProperty.call(GRADES, state.grade));
  const availableSlots = () => Math.max(0, MAX_KIDS - Store.kids().length);

  function finish(d) {
    d.remove();
    document.getElementById('home').inert = false;
    renderHome();
    show('home');
    say("Let's play!");
  }
  function chooseGrade(g, d) {
    const input = d.querySelector('#welName');
    const name = input.value.trim().replace(/[<>&"']/g, '').slice(0, 20);
    if (!name) {
      d.querySelector('#welError').textContent = 'Please enter a name so each child has their own progress.';
      input.focus();
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(GRADES, g)) return;
    state.name = name;
    const cs = d.querySelector('#welCountry'), rs = d.querySelector('#welRegion');
    if (cs) { state.country = cs.value; state.region = cs.value !== 'other' && rs && !rs.closest('label').hidden ? rs.value : ''; }
    state.grade = g;
    state.levels = {};
    state.progressionStreaks = {};
    Object.entries(GRADES[g].g).forEach(([id, range]) => { state.levels[id] = gradeStart(range); });
    state.welcomed = true;
    state.quest = null;
    save();
    renderHome();
    offerCheck(d);
  }

  function openWelcome() {
    // Keep unconfigured Home completely unfocusable beneath the parent dialog.
    document.getElementById('home').inert = true;
    let d = document.getElementById('welcomeSheet');
    if (!d) {
      d = document.createElement('div');
      d.id = 'welcomeSheet';
      d.className = 'time-up welcome';
      d.setAttribute('role', 'dialog');
      d.setAttribute('aria-modal', 'true');
      d.setAttribute('aria-labelledby', 'welTitle');
      document.body.appendChild(d);
    }
    const kids = Store.kids().filter(k => !!k.grade);
    d.innerHTML = '<div class="tu-box welcome-box">' +
      '<div class="wel-kicker">A little adventure for every learner</div>' +
      '<h2 id="welTitle">Who is learning today?</h2>' +
      '<p class="wel-lead">Give each child their own name, grade, stories and stars.</p>' +
      '<label class="wel-name" for="welName">Child’s name<input id="welName" name="child-name" type="text" maxlength="20" autocomplete="off" required placeholder="First name" value="' + escapeHTML(state.name) + '"></label>' +
      '<div class="wel-place"><label for="welCountry">Country<select id="welCountry">' +
        COUNTRY_ORDER.map(k => '<option value="' + k + '">' + COUNTRIES[k].flag + ' ' + COUNTRIES[k].label + '</option>').join('') + '<option value="other">🌍 Somewhere else</option></select></label>' +
        '<label for="welRegion" id="welRegionRow"><span id="welRegionLabel">State</span><select id="welRegion"></select></label></div>' +
      '<p class="wel-ask">Pick their grade to begin</p>' +
      '<div class="wel-grades">' + Object.keys(GRADES).map(g =>
        '<button type="button" class="wel-grade" data-g="' + g + '"><b>' + escapeHTML(gradeName(g)) + '</b><small>' + ages[g] + '</small></button>').join('') + '</div>' +
      '<p id="welError" class="wel-error" role="alert" aria-live="polite"></p>' +
      '<div class="wel-siblings"><b>More than one child?</b><span>You can add up to ' + MAX_KIDS +
      ' children during setup or later in Grown-up Settings. Each child keeps separate progress.</span>' +
      (kids.length ? '<small>Already set up: ' + kids.map(k => escapeHTML(k.name)).join(', ') + '</small>' : '') + '</div>' +
      (Store.kids().length > 1 && needsSetup() ?
        '<button type="button" class="wel-cancel" id="welCancel">Cancel adding this child</button>' : '') +
      '</div>';
    const input = d.querySelector('#welName');
    input.addEventListener('input', () => { d.querySelector('#welError').textContent = ''; });
    d.querySelectorAll('.wel-grade').forEach(b => b.onclick = () => { sfx.tap(); chooseGrade(b.dataset.g, d); });
    const cancel = d.querySelector('#welCancel');
    if (cancel) cancel.onclick = () => {
      Store.removeKid(Store.activeId(), state);
      finish(d);
    };
    const cSel = d.querySelector('#welCountry'), rSel = d.querySelector('#welRegion'), rRow = d.querySelector('#welRegionRow');
    cSel.value = countryCode();
    const fill = () => {
      const C = cSel.value !== 'other' && COUNTRIES[cSel.value];
      if (!C || !C.regions || !C.regions.length) { rRow.hidden = true; rSel.innerHTML = ''; return; }
      rRow.hidden = false;
      d.querySelector('#welRegionLabel').textContent = REGION_WORD[cSel.value] || 'State';
      rSel.innerHTML = C.regions.map(r => '<option value="' + escapeHTML(r[0]) + '">' + escapeHTML(r[0].replace(/^the /, '')) + '</option>').join('');
      const mine = cSel.value === countryCode() && typeof myRegion === 'function' && myRegion();
      rSel.value = mine ? mine[0] : C.regions[0][0];
    };
    cSel.onchange = fill; fill();
    input.focus();
  }

  function offerCheck(d) {
    const name = escapeHTML(state.name);
    const canAdd = availableSlots() > 0;
    d.querySelector('.tu-box').innerHTML =
      '<div class="wel-kicker">Ready for the next chapter</div>' +
      '<h2 id="welTitle">' + name + '’s adventure is ready!</h2>' +
      '<p>One child, one learning journey. Their stars, books and progress stay separate.</p>' +
      '<p>Would you like a quick 2-minute check? Eight reading and math cards help choose a starting step.</p>' +
      '<div class="wel-actions"><button class="big-btn" type="button" data-a="start">▶ Start learning</button>' +
      '<button class="big-btn alt" type="button" data-a="check">🎯 Quick level check</button>' +
      (canAdd ? '<button class="big-btn alt wel-add" type="button" data-a="add">＋ Set up another child</button>' : '') +
      '</div><p class="wel-sibling-note">You can switch children by tapping their picture on Home. Add or edit profiles later in Grown-up Settings.</p>';
    d.querySelector('[data-a="start"]').onclick = () => { sfx.tap(); finish(d); };
    d.querySelector('[data-a="check"]').onclick = () => {
      sfx.tap();
      d.remove();
      document.getElementById('home').inert = false;
      try { startPlacement(); } catch (e) { renderHome(); show('home'); }
    };
    const add = d.querySelector('[data-a="add"]');
    if (add) add.onclick = () => {
      sfx.tap();
      if (Store.addKid({ name: '', grade: null, welcomed: false }, state)) {
        renderHome();
        openWelcome();
      }
    };
  }

  function welcomeIfNeeded() {
    if (automatedTest() || !needsSetup()) return false;
    openWelcome();
    return true;
  }
  window.welcomeIfNeeded = welcomeIfNeeded;
  window.openWelcome = openWelcome;
  const chip = document.getElementById('gradeChip');
  if (chip) chip.onclick = () =>
    needsSetup() ? openWelcome() : document.getElementById('settingsBtn').click();
  // When a tab was already started, never flash Home before asking for the child.
  if (document.getElementById('splash')?.classList.contains('gone')) welcomeIfNeeded();
})();
