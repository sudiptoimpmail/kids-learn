/* =========================================================
   First run: "Who's learning today?" — name and grade in one step, then an offer of the
   2-minute placement check. Until a grade is picked, the home screen would show every
   section for every age, so the app asks before anything else.
   Picking the grade here needs no PIN (there is nothing to protect yet); changing it
   later stays behind the grown-up PIN in Settings.
   Automated browsers skip this sheet unless the page is opened with ?welcome=1.
   ========================================================= */
(() => {
  const AGES = { prek: 'age 4–5', k: 'age 5–6', g1: 'age 6–7', g2: 'age 7–8', g3: 'age 8–9' };
  const skipForAutomation = () => navigator.webdriver && !/[?&]welcome=1\b/.test(location.search);
  const close = (d) => { d.remove(); renderHome(); };

  function chooseGrade(g) {
    state.grade = g; state.levels = {}; state.progressionStreaks = {};
    Object.entries(GRADES[g].g).forEach(([id, r]) => (state.levels[id] = gradeStart(r)));
    state.welcomed = true; state.quest = null;
    save();
  }

  function openWelcome() {
    if (document.getElementById('welcomeSheet')) return;
    const d = document.createElement('div');
    d.id = 'welcomeSheet'; d.className = 'time-up welcome';
    d.innerHTML = `<div class="tu-box welcome-box">
      <h2>Who's learning today?</h2>
      <label class="wel-name">Name <input id="welName" type="text" maxlength="16" autocomplete="off" placeholder="Optional" value="${(state.name || '').replace(/"/g, '&quot;')}"></label>
      <p class="wel-ask">Pick their grade</p>
      <div class="wel-grades">${Object.keys(GRADES).map((g) => `<button class="wel-grade" data-g="${g}"><b>${gradeName(g)}</b><small>${AGES[g] || ''}</small></button>`).join('')}</div>
      <small class="note">You can change this later in ⚙️ Settings.</small></div>`;
    document.body.appendChild(d);
    say("Who's learning today?");
    d.querySelectorAll('.wel-grade').forEach((b) => (b.onclick = () => {
      sfx.tap();
      const name = d.querySelector('#welName').value.trim();
      if (name) state.name = name;
      chooseGrade(b.dataset.g);
      renderHome();
      offerCheck(d);
    }));
  }

  // step 2: a short check finds the right step inside the grade (optional)
  function offerCheck(d) {
    const box = d.querySelector('.tu-box');
    box.innerHTML = `<h2>${state.name ? `Hi, ${state.name.replace(/</g, '&lt;')}!` : 'All set!'}</h2>
      <p>Want a quick check to find the right starting step? It takes about 2 minutes: 8 cards across reading and math.</p>
      <div class="res-btns wel-btns"><button class="big-btn" data-a="check">🎯 Quick check</button>
      <button class="big-btn alt" data-a="start">Start at the beginning</button></div>`;
    box.querySelector('[data-a="check"]').onclick = () => { sfx.tap(); d.remove(); try { startPlacement(); } catch (e) { renderHome(); } };
    box.querySelector('[data-a="start"]').onclick = () => { sfx.tap(); close(d); say("Let's play!"); };
  }

  function maybeWelcome() {
    if (state.grade || state.welcomed || skipForAutomation()) return;
    openWelcome();
  }
  window.openWelcome = openWelcome;

  // with no grade yet, the grade chip opens this sheet (no PIN needed); afterwards it opens Settings
  const chip = document.getElementById('gradeChip');
  if (chip) chip.onclick = () => (state.grade ? $('#settingsBtn').onclick() : openWelcome());
  const start = document.getElementById('startBtn');
  if (start) start.addEventListener('click', () => setTimeout(maybeWelcome, 250));
  // the splash can already be gone (reload after an update)
  if (document.getElementById('splash')?.classList.contains('gone')) setTimeout(maybeWelcome, 250);
})();
