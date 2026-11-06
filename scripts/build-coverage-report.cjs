#!/usr/bin/env node
'use strict';
// Builds docs/coverage/index.html from docs/coverage/coverage.json (made by tests/coverage-audit.js).
// One page: a scorecard per grade, then grade × section × level cells, then games per grade.
const fs = require('node:fs');
const d = JSON.parse(fs.readFileSync('docs/coverage/coverage.json', 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TARGET = 12;  // distinct cards a child should meet at one level before repeats (editorial target)
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const status = (l) => (!l.cards || l.badCount || l.unfitCount ? 'bad' : l.distinct >= TARGET ? 'ok' : l.distinct >= 6 ? 'thin' : 'bad');
const ORDER = ['prek', 'k', 'g1', 'g2', 'g3'];
// release gates per grade (2 automated, 5 signed by a person) from docs/release-signoff.json
let GATES = {};
try { const sign = JSON.parse(fs.readFileSync('docs/release-signoff.json', 'utf8'));
  const { signed } = require('./release-readiness.cjs');
  for (const [g, row] of Object.entries(sign.grades || {})) {
    const human = Object.values(row).filter((v) => v && typeof v === 'object' && 'verified' in v);
    const auto = Object.keys(row.automated || {}).length;
    GATES[g] = [auto + human.filter(signed).length, auto + human.length];
  } } catch { GATES = {}; }

const summary = ORDER.map((g) => {
  const G = d.grades[g]; let cells = 0, ok = 0, multi = 0, pics = 0, cards = 0, issues = 0;
  for (const s of Object.values(G.sections)) for (const l of Object.values(s.levels)) {
    cells++; if (status(l) === 'ok') ok++; if (Object.keys(l.kinds).length > 1) multi++;
    pics += l.pics; cards += l.cards; issues += l.badCount + l.unfitCount + (l.cards ? 0 : 1);
  }
  return { g, label: G.label, sections: Object.keys(G.sections).length, cells, ok, multi, picPct: pct(pics, cards), issues };
});

const gradeBlock = (g) => {
  const G = d.grades[g];
  const maxLv = Math.max(...Object.values(G.sections).map((s) => s.range[1]));
  const rows = Object.entries(G.sections).map(([id, s]) => {
    const cells = [];
    for (let lv = 1; lv <= maxLv; lv++) {
      const l = s.levels[lv];
      if (!l) { cells.push('<td class="na"></td>'); continue; }
      const kinds = Object.entries(l.kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + n).join(', ');
      const tip = `${l.distinct} distinct of ${l.cards} cards · ${l.repeats} repeats · ${l.families} card types · formats: ${kinds} · pictures ${pct(l.pics, l.cards)}% · hints ${pct(l.hints, l.cards)}%`
        + (l.badCount ? ` · broken answers: ${l.badAnswers.join(', ')}` : '') + (l.unfitCount ? ` · grade-fit failures: ${l.unfit.join(', ')}` : '');
      const one = Object.keys(l.kinds).length === 1;
      cells.push(`<td class="c ${status(l)}" title="${esc(tip)}"><b>${l.distinct}</b><span class="f${one ? ' one' : ''}">${Object.keys(l.kinds).length}×</span></td>`);
    }
    return `<tr><th scope="row">${esc(d.sectionTitles[id] || id)}</th>${cells.join('')}</tr>`;
  }).join('\n');
  const head = Array.from({ length: maxLv }, (_, i) => `<th scope="col">L${i + 1}</th>`).join('');
  const games = (d.games[g] || []).filter((x) => x.visible).map((x) => `<li><span>${esc(x.title)}</span><span class="band">${x.band ? 'levels ' + x.band.join('–') : 'one level'}</span></li>`).join('');
  return `<section id="${g}" class="grade"><h2>${esc(G.label)}</h2>
<div class="scroll"><table class="grid"><thead><tr><th scope="col">Section</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
<h3>Games this grade sees</h3><ul class="games">${games || '<li>None</li>'}</ul></section>`;
};

const html = `<meta charset="utf-8">
<title>Learn &amp; Play Coverage</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@500;700&display=swap">
<style>
/* Layout: a school report card — grade scorecards on top, then one level grid per grade, read left to right as levels climb */
:root {
  --paper: #f6f7f4; --ink: #1d2a2a; --muted: #5c6b69; --rule: #d6dcd8; --card: #ffffff;
  --accent: #1f6f78;
  --ok: #2f7d4f; --ok-bg: #e2f1e7; --thin: #9a6a00; --thin-bg: #fbf0d4; --bad: #b3362d; --bad-bg: #f8e0dd; --na: #eceeea;
  --body: "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif; --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --paper: #131a1a; --ink: #e5ece9; --muted: #9aaba7; --rule: #2c3837; --card: #1a2323; --accent: #6cc3cc;
  --ok: #7fd39c; --ok-bg: #173323; --thin: #f0c35a; --thin-bg: #3a2f12; --bad: #f2948b; --bad-bg: #3d1d1a; --na: #1f2928; color-scheme: dark } }
:root[data-theme="dark"] {
  --paper: #131a1a; --ink: #e5ece9; --muted: #9aaba7; --rule: #2c3837; --card: #1a2323; --accent: #6cc3cc;
  --ok: #7fd39c; --ok-bg: #173323; --thin: #f0c35a; --thin-bg: #3a2f12; --bad: #f2948b; --bad-bg: #3d1d1a; --na: #1f2928; color-scheme: dark }
body { background: var(--paper); color: var(--ink); font: 16px/1.5 var(--body); }
main { max-width: 1080px; margin: 0 auto; padding-block: 28px 56px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 36px; }
h1 { font-size: 1.9rem; line-height: 1.15; margin: 0; text-wrap: balance; }
h2 { font-size: 1.35rem; margin: 0 0 12px; text-wrap: balance; }
h3 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 20px 0 8px; }
p { margin: 0; max-width: 68ch; color: var(--muted); }
.meta { font: 500 .8rem var(--mono); color: var(--muted); margin-top: 6px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
.card { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; padding: 14px 16px; display: grid; gap: 6px; text-decoration: none; color: inherit; }
.card:hover, .card:focus-visible { border-color: var(--accent); outline: none; }
.card .name { font-weight: 700; }
.card .big { font: 700 1.6rem var(--mono); font-variant-numeric: tabular-nums; }
.card .big small { font-size: 1rem; color: var(--muted); font-weight: 500; }
.card .sub { font-size: .8rem; color: var(--muted); margin-top: -6px; }
.card dl { margin: 0; display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; font-size: .85rem; color: var(--muted); }
.card dd { margin: 0; font-family: var(--mono); font-variant-numeric: tabular-nums; color: var(--ink); }
.pill { justify-self: start; font-size: .75rem; padding: 2px 8px; border-radius: 99px; background: var(--ok-bg); color: var(--ok); }
.pill.warn { background: var(--bad-bg); color: var(--bad); }
.legend { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: .85rem; color: var(--muted); }
.legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -1px; margin-right: 6px; }
.scroll { overflow-x: auto; border: 1px solid var(--rule); border-radius: 10px; background: var(--card); }
table.grid { border-collapse: collapse; width: 100%; font-size: .9rem; }
.grid th, .grid td { border-bottom: 1px solid var(--rule); padding: 6px 8px; }
.grid thead th { font: 500 .75rem var(--mono); color: var(--muted); text-align: center; position: sticky; top: 0; background: var(--card); }
.grid thead th:first-child, .grid tbody th { text-align: left; font-weight: 400; white-space: nowrap; }
.grid tbody th { position: sticky; left: 0; background: var(--card); }
.c { text-align: center; font-family: var(--mono); font-variant-numeric: tabular-nums; min-width: 64px; }
.c b { display: block; font-size: .95rem; }
.c .f { font-size: .7rem; color: var(--muted); }
.c .f.one { opacity: .7; }
.ok { background: var(--ok-bg); color: var(--ok); } .thin { background: var(--thin-bg); color: var(--thin); } .bad { background: var(--bad-bg); color: var(--bad); }
.na { background: var(--na); }
.games { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 6px 16px; }
.games li { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px dotted var(--rule); padding: 3px 0; }
.band { font: 500 .78rem var(--mono); color: var(--muted); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
<main>
<header>
<h1>Learn &amp; Play Coverage</h1>
<p>What a child actually gets in every section, at every level of their grade. Each cell plays ${d.rounds} real rounds with a fixed seed, so the same code always gives the same numbers.</p>
<div class="meta">seed ${d.seed} · ${esc(d.generated.slice(0, 10))} · target ${TARGET} distinct cards per level</div>
</header>
<nav class="cards" aria-label="Grade scorecards">
${summary.map((s) => `<a class="card" href="#${s.g}"><span class="name">${esc(s.label)}</span>
<span class="big">${s.ok}<small>/${s.cells}</small></span><span class="sub">levels with ${TARGET}+ distinct cards</span>
<dl>${GATES[s.g] ? `<dt>Release gates</dt><dd>${GATES[s.g][0]}/${GATES[s.g][1]}</dd>` : ''}<dt>Sections</dt><dd>${s.sections}</dd><dt>More than one format</dt><dd>${s.multi}/${s.cells}</dd><dt>Cards with pictures</dt><dd>${s.picPct}%</dd></dl>
<span class="pill${s.issues ? ' warn' : ''}">${s.issues ? s.issues + ' correctness issues' : 'No broken answers or grade misfits'}</span></a>`).join('\n')}
</nav>
<div class="legend"><span><i class="ok"></i>${TARGET}+ distinct cards</span><span><i class="thin"></i>6–${TARGET - 1}</span><span><i class="bad"></i>under 6, a broken answer, or a grade misfit</span><span><i class="na"></i>not in this grade</span><span>Small number: question formats at that level. Hover a cell for details.</span></div>
${ORDER.map(gradeBlock).join('\n')}
</main>`;
fs.writeFileSync('docs/coverage/index.html', html + '\n');
console.log('Wrote docs/coverage/index.html for ' + summary.map((s) => s.label + ' ' + s.ok + '/' + s.cells).join(', '));
