'use strict';
/* A small watercolor-and-ink painting kit for storybook pages (SVG, rendered once to WebP).
   Washes: wobbly edges (turbulence displacement), darker pigment at the edges, paper grain.
   Ink: thin sepia lines with a slight hand tremor. Everything is original artwork. */

const defs = (seed = 3) => `
<defs>
  <filter id="wc" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.9" result="b"/>
    <feMorphology in="b" operator="erode" radius="3" result="er"/>
    <feComposite in="b" in2="er" operator="out" result="edge"/>
    <feColorMatrix in="edge" type="matrix" values="0.55 0 0 0 0  0 0.55 0 0 0  0 0 0.55 0 0  0 0 0 0.7 0" result="edgeD"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="${seed + 5}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 -1.1 0.78" result="g2"/>
    <feComposite in="g2" in2="b" operator="in" result="gr"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="gr"/><feMergeNode in="edgeD"/></feMerge>
  </filter>
  <filter id="skin" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.6" result="b"/>
    <feMorphology in="b" operator="erode" radius="1.6" result="er"/>
    <feComposite in="b" in2="er" operator="out" result="edge"/>
    <feColorMatrix in="edge" type="matrix" values="0.8 0 0 0 0  0 0.7 0 0 0  0 0 0.65 0 0  0 0 0 0.45 0" result="edgeD"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="edgeD"/></feMerge>
  </filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="${seed + 2}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="3"/>
  </filter>
  <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${seed + 9}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="21" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.36  0 0 0 -1.2 0.75"/>
  </filter>
  <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
</defs>`;

const W = 1200, H = 800;
const wash = (d, fill, o = 0.85, f = 'wc') => `<path d="${d}" fill="${fill}" fill-opacity="${o}" filter="url(#${f})"/>`;
const blob = (cx, cy, rx, ry, fill, o = 0.8, f = 'wc') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" fill-opacity="${o}" filter="url(#${f})"/>`;
const ink = (d, w = 2.4, c = '#4a3426', o = 0.85) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${o}" filter="url(#ink)"/>`;
const dot = (cx, cy, r, c = '#3a2a20') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
const g = (x, y, s, body, flip = false) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">${body}</g>`;
// deterministic random, so every render is identical
let _s = 7; const rnd = () => ((_s = (_s * 16807) % 2147483647) / 2147483647); const seedRnd = (s) => (_s = s);

const paper = () => `<rect width="${W}" height="${H}" fill="#fbf5e9"/><rect width="${W}" height="${H}" filter="url(#paper)" opacity="0.8"/>`;
function blooms(seed = 1, cols = ['#f3c7a8', '#b9d4e6', '#d8e6b8', '#f0d8e6']) {
  seedRnd(seed * 17 + 3); let out = '';
  for (let i = 0; i < 9; i++) out += blob(rnd() * W, rnd() * H, 120 + rnd() * 180, 80 + rnd() * 140, cols[i % cols.length], 0.07, 'soft');
  return out;
}
const vignette = () => `<radialGradient id="vg" cx="50%" cy="48%" r="70%"><stop offset="62%" stop-color="#fbf5e9" stop-opacity="0"/><stop offset="100%" stop-color="#e9dcc3" stop-opacity="0.9"/></radialGradient><rect width="${W}" height="${H}" fill="url(#vg)"/>`;

/* ---------- landscape pieces ---------- */
const sky = (top = '#bcd9ec', bottom = '#f6efd9') => `<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>${wash(`M-20 -20H${W + 20}V520H-20Z`, 'url(#sk)', 0.75, 'soft')}`;
const hills = (y = 470, c1 = '#a9c79a', c2 = '#87b07d') =>
  wash(`M-30 ${y}C200 ${y - 70} 380 ${y - 40} 560 ${y - 20}S900 ${y - 90} 1230 ${y - 30}V${H + 30}H-30Z`, c1, 0.6, 'soft') +
  wash(`M-30 ${y + 50}C260 ${y} 520 ${y + 40} 760 ${y + 20}S1060 ${y - 10} 1230 ${y + 30}V${H + 30}H-30Z`, c2, 0.7);
const ground = (y = 560, c = '#9cc27f') => wash(`M-30 ${y}C300 ${y - 25} 800 ${y + 20} 1230 ${y - 10}V${H + 30}H-30Z`, c, 0.85);
function tree(x, y, s = 1, tone = 0) {
  const greens = [['#3f7a43', '#5e9a52', '#8fbf6c', '#c3dc8e'], ['#356b4c', '#4f8d5e', '#7fb27c', '#b6d6a0'], ['#4f8236', '#6ea347', '#9cc664', '#cfe39a']][tone % 3];
  seedRnd(Math.round(x * 7 + y));
  let crown = '';
  for (let i = 0; i < 9; i++) crown += blob((rnd() - 0.5) * 170, -250 - rnd() * 150, 60 + rnd() * 45, 50 + rnd() * 35, greens[1], 0.5 + rnd() * 0.2);
  for (let i = 0; i < 6; i++) crown += blob((rnd() - 0.5) * 160, -230 - rnd() * 60, 50 + rnd() * 30, 30 + rnd() * 18, greens[0], 0.45);
  for (let i = 0; i < 10; i++) crown += blob((rnd() - 0.6) * 140, -330 - rnd() * 90, 18 + rnd() * 20, 12 + rnd() * 10, greens[2 + (i % 2)], 0.6);
  let dabs = '';
  for (let i = 0; i < 14; i++) { const lx = (rnd() - 0.5) * 190, ly = -220 - rnd() * 190; dabs += ink(`M${lx} ${ly}q6 -6 12 0`, 2, greens[0], 0.45); }
  const body = wash('M-20 0C-14 -80 -18 -160 -8 -250L10 -250C14 -160 18 -80 26 0Z', '#7a5536', 0.92) +
    wash('M2 0C6 -80 8 -160 6 -250L10 -250C14 -160 18 -80 26 0Z', '#5a3c26', 0.5) +
    ink('M-8 -40q4 -20 0 -40M8 -120q-4 -20 0 -40', 1.4, '#4a3020', 0.5) + crown + dabs +
    blob(0, 4, 70, 12, '#3e5a2e', 0.25, 'soft');
  return g(x, y, s, body);
}
function pine(x, y, s = 1, c = '#3d6b4f') {
  let tiers = '';
  for (let i = 0; i < 4; i++) { const ty = -90 - i * 70, w = 100 - i * 20; tiers += wash(`M0 ${ty - 120}L${-w} ${ty}Q0 ${ty + 16} ${w} ${ty}Z`, i % 2 ? '#4f8063' : c, 0.72); }
  const body = wash('M-10 0V-80H10V0Z', '#6b4a33', 0.9) + tiers + wash('M0 -400L20 -330L6 -100Z', '#2f5440', 0.35) + blob(0, 4, 60, 10, '#3e5a2e', 0.22, 'soft');
  return g(x, y, s, body);
}
function flowers(x0, y0, w, n = 14, seed = 3) {
  seedRnd(seed * 99 + 1); const cols = ['#e86b6b', '#f2b84b', '#f5f0f0', '#c98bd6', '#ef8fb1'];
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * 60, c = cols[Math.floor(rnd() * cols.length)];
    out += ink(`M${x} ${y}q-3 18 2 34`, 1.6, '#4c7a3c', 0.7) + blob(x, y, 9, 8, c, 0.9) + dot(x, y, 2.6, '#f7d35b');
  }
  return out;
}
function grass(x0, y0, w, n = 40, seed = 5) {
  seedRnd(seed * 31 + 7); let out = '';
  for (let i = 0; i < n; i++) { const x = x0 + rnd() * w, y = y0 + rnd() * 40, h = 14 + rnd() * 22; out += ink(`M${x} ${y}q${(rnd() - 0.5) * 10} ${-h / 2} ${(rnd() - 0.5) * 14} ${-h}`, 1.8, ['#4f7f3c', '#6a9b4a', '#3e6b35'][i % 3], 0.6); }
  return out;
}
const path = (c = '#e3c48f') => wash('M520 820C560 700 640 640 700 590S760 520 740 470L800 470C830 520 820 560 780 610S700 720 720 820Z', c, 0.75);
function bird(x, y, s = 1) { return g(x, y, s, ink('M-16 0q8 -10 16 0q8 -10 16 0', 2.4, '#4a3a33', 0.8)); }
function sun(x, y) { return blob(x, y, 70, 70, '#f7d77a', 0.55, 'soft') + blob(x, y, 42, 42, '#f5c95a', 0.7); }
function cloud(x, y, s = 1) { return g(x, y, s, blob(0, 0, 70, 26, '#ffffff', 0.85, 'soft') + blob(-40, 6, 44, 20, '#ffffff', 0.8, 'soft') + blob(42, 8, 50, 20, '#ffffff', 0.8, 'soft')); }

/* ---------- buildings and rooms ---------- */
function cottage(x, y, s = 1, opts = {}) {
  const body = wash('M-150 0V-170H150V0Z', '#f0dfbf', 0.95) +
    wash('M-180 -165L0 -300L180 -165Z', '#c0603f', 0.85) + wash('M-180 -165L0 -300L20 -290L-150 -168Z', '#a44b31', 0.4) +
    wash('M80 -250V-320H120V-220Z', '#9a6a52', 0.9) +
    (opts.smoke ? blob(110, -350, 24, 16, '#d8d4cc', 0.6, 'soft') + blob(126, -385, 30, 18, '#e2ded7', 0.5, 'soft') : '') +
    wash('M-40 0V-110Q-40 -135 -12 -135H12Q40 -135 40 -110V0Z', opts.doorOpen ? '#3d2a20' : '#8a5a3a', 0.95) +
    (opts.doorOpen ? '' : dot(24, -55, 4, '#e9c46a')) +
    wash('M-130 -130H-70V-70H-130Z', opts.lit ? '#f7dd8f' : '#bcd6e6', 0.95) + wash('M70 -130H130V-70H70Z', opts.lit ? '#f7dd8f' : '#bcd6e6', 0.95) +
    (opts.face ? g(100, -96, 0.42, grandmaHead()) : '') +
    ink('M-150 0V-170H150V0M-180 -165L0 -300L180 -165M-40 0V-110Q-40 -135 -12 -135H12Q40 -135 40 -110V0M-130 -130H-70V-70H-130ZM-100 -130V-70M-130 -100H-70M70 -130H130V-70H70ZM100 -130V-70M70 -100H130', 2.2) +
    flowers(-150, -10, 90, 5, x) + flowers(70, -10, 80, 5, x + 1);
  return g(x, y, s, body);
}
function room(wall = '#f1dcc0', floor = '#c69a6b', o = {}) {
  let wallTex = '';
  seedRnd(11); for (let i = 0; i < 26; i++) { const x = rnd() * 1200, y = 40 + rnd() * 440; wallTex += ink(`M${x} ${y}q10 -4 20 0`, 1.2, '#b89a76', 0.25); }
  return wash(`M-20 -20H${W + 20}V600H-20Z`, wall, 0.9, 'soft') + wash(`M-20 430H${W + 20}V600H-20Z`, '#d9b98f', 0.45) + ink('M0 430H1200', 2, '#8a6343', 0.4) + wallTex +
    wash(`M-20 590H${W + 20}V${H + 20}H-20Z`, floor, 0.85) +
    ink('M0 600H1200M0 650H1200M0 710H1200M0 780H1200', 1.4, '#8a6343', 0.35) +
    ink('M120 600V650M420 650V710M760 600V650M980 710V780M260 710V780M620 650V710', 1.4, '#8a6343', 0.35) +
    (o.rug === false ? '' : blob(o.rugX || 620, 712, 300, 46, o.rugC || '#b5584a', 0.55) + blob(o.rugX || 620, 712, 250, 32, '#e7c07a', 0.35)) +
    (o.picture ? wash(`M${o.picture} 150h120v90h-120z`, '#9fc39a', 0.85) + blob(o.picture + 40, 200, 26, 18, '#f2d17a', 0.8) + ink(`M${o.picture} 150h120v90h-120z`, 5, '#8a5a3a', 0.85) : '');
}
function shelf(x, y) {
  return wash(`M${x} ${y}h220v14h-220z`, '#8a5c3b', 0.95) + blob(x + 30, y - 26, 18, 26, '#7fb0c9', 0.85) + blob(x + 80, y - 22, 16, 22, '#e3a35a', 0.85) + blob(x + 130, y - 30, 20, 30, '#c9806b', 0.85) + apple(x + 180, y - 12) + apple(x + 200, y - 14, 10);
}
function windowPane(x, y, w = 220, h = 180, night = false) {
  return wash(`M${x} ${y}h${w}v${h}h${-w}z`, night ? '#4f6a8f' : '#cfe6f2', 0.9) + wash(`M${x - 14} ${y - 10}h${w * 0.3}v${h + 30}h${-w * 0.3}z`, '#d9655a', 0.7) +
    wash(`M${x + w - w * 0.3 + 14} ${y - 10}h${w * 0.3}v${h + 30}h${-w * 0.3}z`, '#d9655a', 0.7) +
    ink(`M${x} ${y}h${w}v${h}h${-w}zM${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}`, 2.2);
}
// a bed; `sleeper` is drawn on the pillow, under the quilt (so a head rests in the bed, not above it)
function bed(x, y, s = 1, quilt = '#7da3c9', sleeper = '') {
  const body = wash('M-260 0V-130H-230V-20H230V-160H260V0Z', '#9a6a45', 0.95) + wash('M236 -160H260V0H236Z', '#6e4a2e', 0.5) +
    wash('M-232 -40V-118Q0 -140 232 -118V-40Z', '#f4efe6', 0.95) +
    wash('M-226 -112Q-160 -150 -96 -118Q-100 -84 -160 -78Q-220 -80 -226 -112Z', '#ffffff', 0.95) +
    (sleeper ? g(-150, -96, 1, sleeper) : '') +
    wash('M-140 -60Q0 -132 232 -104V-20H-150Q-170 -40 -140 -60Z', quilt, 0.92) + wash('M-140 -60Q0 -132 232 -104V-90Q0 -116 -130 -50Z', '#ffffff', 0.35) +
    ink('M-100 -80l30 50M-40 -96l34 66M24 -104l36 74M90 -106l36 76M156 -104l34 74', 1.5, '#ffffff', 0.5) +
    ink('M-260 0V-130H-230V-20H230V-160H260V0', 2.2) + blob(0, 6, 240, 12, '#5a4030', 0.18, 'soft');
  return g(x, y, s, body);
}
function closet(x, y, s = 1, peek = false) {
  const body = wash('M-90 0V-330H90V0Z', '#b07c52', 0.95) + wash(peek ? 'M0 -320V-10H70V-320Z' : 'M-80 -320V-10H80V-320Z', '#c48d5f', 0.9) +
    (peek ? wash('M-80 -320V-10H0V-320Z', '#3a281e', 0.9) + g(-34, -210, 0.5, grandmaHead(true)) : '') +
    dot(peek ? 12 : 60, -170, 5, '#e9c46a') + ink('M-90 0V-330H90V0' + (peek ? 'M0 -320V-10' : ''), 2.2);
  return g(x, y, s, body);
}
function table(x, y, s = 1, food = true) {
  const body = wash('M-200 -150H200V-130H-200Z', '#9a6a45', 0.95) + wash('M-180 -130V0H-160V-130ZM160 -130V0H180V-130Z', '#8a5c3b', 0.95) +
    wash('M-210 -160Q0 -175 210 -160V-140H-210Z', '#f0e3cc', 0.8) +
    (food ? basket(-60, -160, 0.8) + bread(70, -165, 1) + apple(120, -168) + apple(150, -164) : '');
  return g(x, y, s, body);
}
const apple = (x, y, r = 12) => blob(x, y, r, r, '#d64a3b', 0.95) + ink(`M${x} ${y - r}q2 -8 8 -10`, 2, '#5a3a20') + blob(x + 5, y - r - 4, 5, 3, '#6aa04c', 0.9);
const bread = (x, y, s = 1) => g(x, y, s, wash('M-36 0Q-38 -26 0 -28Q38 -26 36 0Z', '#d9a35b', 0.95) + ink('M-16 -20q4 6 0 12M0 -24q4 6 0 12M16 -20q4 6 0 12', 1.6, '#8a5a2a', 0.7));
function basket(x, y, s = 1) {
  return g(x, y, s, ink('M-40 -10Q0 -80 40 -10', 4, '#7a5534', 0.9) + bread(-8, -12, 0.7) + apple(16, -16, 11) + apple(-24, -12, 10) +
    wash('M-46 -12H46L36 30H-36Z', '#b88a55', 0.95) + ink('M-44 0H44M-40 14H40M-20 -10L-16 30M0 -10V30M20 -10L16 30', 1.6, '#7a5534', 0.7) + wash('M-50 -14H50V-4H-50Z', '#e9e1d2', 0.8));
}

/* ---------- characters ---------- */
const shadow = (w = 70) => blob(0, 2, w, 11, '#3e4a30', 0.25, 'soft');
const skin = '#f5cfb0', cheek = '#ef9a8a';
const face = (o = {}) => blob(0, 0, 40, 42, skin, 0.97) + blob(-20, 12, 9, 6, cheek, 0.55) + blob(20, 12, 9, 6, cheek, 0.55) +
  (o.surprised ? dot(-13, -2, 4.5) + dot(13, -2, 4.5) + ink('M-6 20q6 8 12 0q-6 -6 -12 0', 2.2) : dot(-13, 0, 4) + dot(13, 0, 4) + ink('M-10 18q10 9 20 0', 2.2)) +
  ink('M-19 -10q6 -4 11 -1M8 -11q6 -3 11 1', 1.6, '#5a3b2a', 0.7);
// Little Red: pose 'walk' | 'stand' | 'pick' | 'wave' | 'scared' | 'happy'
function red(pose = 'stand', o = {}) {
  const walk = pose === 'walk', pick = pose === 'pick';
  const CAPE = '#c8322d', CAPE_D = '#8f1f1d', SLEEVE = '#55759f', DRESS = '#5c7fb4';
  const drop = pick ? 70 : 0;                       // crouching lowers the whole upper body
  const legs = pick ? wash('M-30 -6Q-40 -46 -6 -56L8 -44Q-14 -36 -12 -6Z', '#3a3a52', 0.95) + wash('M8 -6Q30 -10 40 -40L24 -50Q16 -26 4 -20Z', '#3a3a52', 0.95) + wash('M-40 0Q-38 -12 -20 -10H-8V0ZM8 2L14 -10Q30 -12 38 0Z', '#3b2a22', 0.95)
    : walk ? wash('M-24 -10L-34 -80H-14L-6 -10Z', '#3a3a52', 0.95) + wash('M8 -10L18 -80H34L28 -10Z', '#3a3a52', 0.95) + wash('M-46 0Q-42 -14 -24 -12L-6 -8V0Z', '#3b2a22', 0.95) + wash('M6 0V-10L28 -12Q42 -10 42 0Z', '#3b2a22', 0.95)
    : wash('M-22 -10V-80H-8V-10ZM8 -10V-80H22V-10Z', '#3a3a52', 0.95) + wash('M-32 0Q-32 -14 -14 -12H-6V0ZM6 0V-12H16Q34 -12 32 0Z', '#3b2a22', 0.95);
  const up = (body) => g(0, drop, 1, body);
  const capeBack = wash('M-34 -214Q-90 -150 -86 -70Q-60 -60 -40 -84Q-44 -150 -22 -204ZM34 -214Q90 -150 86 -70Q60 -60 40 -84Q44 -150 22 -204Z', CAPE, 0.94) +
    wash('M34 -214Q90 -150 86 -70Q74 -64 62 -68Q70 -140 30 -206Z', CAPE_D, 0.45);
  const dress = wash('M-52 -80L-30 -204H30L52 -80Q0 -70 -52 -80Z', DRESS, 0.92) + wash('M-28 -86L-18 -196H18L28 -86Q0 -80 -28 -86Z', '#f6f0e4', 0.96) +
    ink('M-28 -86q5 6 10 0q5 6 10 0q5 6 10 0q5 6 10 0q5 6 10 0q4 5 8 0', 1.4, '#9a8a7a', 0.6) + wash('M-30 -200H30L26 -186H-26Z', '#3f5f8f', 0.6);
  const hand = (x, y) => blob(x, y, 10, 10, skin, 0.97) + ink(`M${x - 6} ${y - 4}q4 -4 8 0`, 1.2, '#b07a60', 0.5);
  const arm = (d, hx, hy) => ink(d, 13, SLEEVE, 0.95) + ink(d, 4, '#3f5f8f', 0.35) + hand(hx, hy);
  const armL = pick ? arm('M-30 -186Q-70 -150 -84 -96', -86, -88)
    : pose === 'wave' ? arm('M-30 -190Q-76 -224 -74 -270', -74, -278)
    : pose === 'scared' ? arm('M-30 -190Q-82 -216 -66 -262', -64, -270)
    : arm('M-30 -186Q-58 -150 -52 -112', -52, -106);
  const armR = pose === 'scared' ? arm('M30 -190Q82 -216 66 -262', 64, -270)
    : pose === 'happy' ? arm('M30 -190Q76 -224 74 -270', 74, -278)
    : arm('M30 -186Q60 -150 56 -112', 56, -106);
  const hood = wash('M-58 34Q-70 -44 -32 -66Q0 -82 32 -66Q70 -44 58 34L44 22Q50 -38 22 -52Q0 -62 -22 -52Q-50 -38 -44 22Z', CAPE, 0.96) +
    wash('M30 -60Q66 -40 58 34L46 24Q50 -30 24 -50Z', CAPE_D, 0.45) + wash('M-44 22Q-50 -38 -22 -52Q0 -62 22 -52Q50 -38 44 22Q40 -30 0 -46Q-40 -30 -44 22Z', '#7a1a19', 0.5);
  const head = g(0, -250, 1, hood + wash('M-40 -10Q-44 -52 0 -56Q44 -52 40 -10Z', '#7a4a2c', 0.95) + face({ surprised: pose === 'scared' }) +
    wash('M-38 -18Q-30 -46 0 -48Q30 -46 38 -18Q24 -32 0 -30Q-24 -32 -38 -18Z', '#6a3d24', 0.92) + ink('M-24 -40q8 10 4 22M0 -46q4 12 0 20M24 -40q-8 10 -4 22', 1.4, '#4a2a18', 0.55) +
    ink('M-44 34Q-20 46 0 44Q20 46 44 34', 3, CAPE_D, 0.7) + blob(0, 42, 10, 7, '#e8c25a', 0.9));
  const extra = (o.basket ? g(pick ? 64 : 62, pick ? -40 : -106, 0.72, basket(0, 0, 1)) : '') +
    (o.flowers ? g(-60, -96, 1, flowers(-14, -36, 26, 6, 9)) : '') + (pick ? g(-88, -90, 1, flowers(-10, -10, 20, 3, 4)) : '');
  return shadow(pick ? 90 : 64) + legs + up(capeBack + dress + armL + armR + head +
    ink('M-34 -214Q-90 -150 -86 -70M34 -214Q90 -150 86 -70', 1.8, '#5a1a18', 0.55)) + extra;
}
function mother() {
  return wash('M-26 0V-14H-6V0ZM6 0V-14H26V0Z', '#3b2a22', 0.95) +
    wash('M-62 -14L-40 -250H40L62 -14Z', '#5f8f6a', 0.92) + wash('M-36 -20L-24 -210H24L36 -20Z', '#f6f0e4', 0.95) +
    ink('M-36 -240Q-70 -190 -40 -150', 12, '#5f8f6a', 0.95) + ink('M36 -240Q74 -200 70 -160', 12, '#5f8f6a', 0.95) + blob(-38, -146, 10, 10, skin, 0.97) + blob(70, -154, 10, 10, skin, 0.97) +
    g(0, -292, 1, blob(0, -46, 26, 22, '#6b4a2e', 0.95) + wash('M-42 -6Q-46 -48 0 -52Q46 -48 42 -6Q30 -30 0 -30Q-30 -30 -42 -6Z', '#6b4a2e', 0.95) + face()) +
    ink('M-62 -14L-40 -250H40L62 -14', 1.8, '#2e4a33', 0.5);
}
function grandmaHead(peek = false) {
  return blob(0, -44, 24, 20, '#e6e3de', 0.95) + wash('M-44 0Q-48 -48 0 -52Q48 -48 44 0Q36 -32 0 -34Q-36 -32 -44 0Z', '#e9e6e1', 0.95) + face({ surprised: peek }) +
    ink('M-26 -2a12 12 0 1 0 24 0a12 12 0 1 0 -24 0M2 -2a12 12 0 1 0 24 0a12 12 0 1 0 -24 0M-2 -2h4', 2, '#6a5a4a', 0.85);
}
function grandma() {
  return wash('M-24 0V-14H-6V0ZM6 0V-14H24V0Z', '#3b2a22', 0.95) + wash('M-58 -14L-40 -230H40L58 -14Z', '#8a6aa8', 0.9) + wash('M-30 -20L-22 -190H22L30 -20Z', '#f6f0e4', 0.9) +
    wash('M-60 -240Q0 -200 60 -240L50 -180Q0 -150 -50 -180Z', '#c27aa0', 0.9) + blob(-46, -150, 10, 10, skin, 0.97) + blob(46, -150, 10, 10, skin, 0.97) +
    g(0, -276, 1, grandmaHead());
}
function woodcutter() {
  const plaid = '#b8402f';
  return wash('M-34 0V-16H-6V0ZM6 0V-16H34V0Z', '#3b2a22', 0.95) + wash('M-34 -16V-120H-6V-16ZM6 -16V-120H34V-16Z', '#5a4a3a', 0.95) +
    wash('M-64 -120L-56 -270H56L64 -120Z', plaid, 0.92) + ink('M-60 -150H60M-58 -190H58M-56 -230H56M-30 -270V-120M10 -270V-120', 3, '#4a1e18', 0.45) +
    ink('M-56 -260Q-92 -200 -80 -140', 15, plaid, 0.95) + ink('M56 -260Q92 -200 80 -140', 15, plaid, 0.95) + blob(-80, -134, 12, 12, skin, 0.97) + blob(80, -134, 12, 12, skin, 0.97) +
    g(0, -312, 1.05, face() + wash('M-40 6Q-42 60 0 64Q42 60 40 6Q30 24 0 26Q-30 24 -40 6Z', '#7a4a2a', 0.95) + wash('M-46 -20Q-44 -66 0 -68Q44 -66 46 -20Z', '#4f7a4a', 0.95) + wash('M-60 -22H60V-12H-60Z', '#3f6a3a', 0.95));
}
// the wolf on four legs, facing right; o.teeth shows a big grin, o.run stretches the legs
function wolf(o = {}) {
  const fur = '#7f8794', light = '#c9ced6';
  const legs = o.run ? wash('M-110 -40L-170 -10L-160 0L-96 -30ZM-70 -40L-60 0H-44L-50 -40ZM70 -40L130 -6L140 -16L86 -46ZM100 -50L150 -40L148 -28L96 -38Z', fur, 0.95)
    : wash('M-100 -40V0H-80V-40ZM-60 -40V0H-40V-40ZM60 -40V0H80V-40ZM96 -40V0H116V-40Z', fur, 0.95);
  const body = wash('M-140 -60Q-150 -140 -40 -150Q90 -160 130 -110Q150 -60 110 -40Q0 -20 -110 -36Q-140 -40 -140 -60Z', fur, 0.92) +
    wash('M-80 -50Q0 -36 90 -56Q60 -90 -60 -80Z', light, 0.7) +
    wash('M-136 -90Q-230 -110 -250 -190Q-200 -150 -150 -130Z', fur, 0.9) + wash('M-230 -168Q-246 -186 -250 -190Q-232 -170 -214 -164Z', light, 0.8);
  const head = g(150, -150, 1, wash('M-40 20Q-60 -40 -10 -60Q30 -70 50 -40L120 -12Q132 0 120 12Q80 30 30 34Q-20 40 -40 20Z', fur, 0.95) +
    wash('M-30 -50L-34 -110L4 -62ZM10 -62L30 -118L40 -52Z', fur, 0.95) + wash('M-24 -60L-26 -96L-4 -64ZM16 -62L28 -100L32 -56Z', '#e7b3a8', 0.8) +
    (o.bigEars ? wash('M-36 -50L-60 -140L8 -62ZM8 -62L40 -150L48 -48Z', fur, 0.95) + wash('M-30 -60L-48 -122L-2 -64ZM14 -62L38 -132L40 -56Z', '#e7b3a8', 0.8) : '') +
    wash('M30 10Q80 22 118 10Q100 30 40 30Z', light, 0.85) + dot(122, 0, 9, '#26201c') +
    blob(14, -26, 10, 9, '#ffffff', 0.95) + dot(17, -25, 5, '#2a1f18') +
    (o.teeth ? wash('M40 6Q82 30 118 14Q100 46 50 38Z', '#7a2a2a', 0.95) + wash('M48 10L54 22L60 12L66 24L72 14L78 26L84 15L90 26L96 15L102 25L108 14Z', '#ffffff', 0.98) : ink('M40 14Q70 26 104 18', 2.2)) +
    ink('M-40 20Q-60 -40 -10 -60Q30 -70 50 -40L120 -12', 2, '#3a3f48', 0.5));
  const cap = o.nightcap ? g(150, -150, 1, wash('M-50 -50Q-10 -120 60 -60Q90 -80 110 -50Q60 -40 -50 -36Z', '#f7f3ea', 0.97) + blob(112, -52, 14, 14, '#f7f3ea', 0.97) + wash('M-56 -44Q0 -30 66 -50L64 -36Q0 -18 -54 -30Z', '#e0a0b0', 0.9)) : '';
  const fur2 = ink('M-90 -120q10 -8 20 0M-40 -130q10 -8 20 0M10 -132q10 -8 20 0M60 -126q10 -8 20 0M-60 -100q10 -6 20 0M30 -104q10 -6 20 0', 1.6, '#4a515c', 0.5) +
    wash('M-120 -50Q0 -30 110 -46Q120 -60 100 -60Q0 -44 -120 -62Z', '#5c636e', 0.35) + wash('M-246 -186Q-252 -196 -236 -194Q-226 -178 -240 -176Z', '#f2f2f2', 0.9);
  return (o.headOnly ? '' : shadow(150) + legs + body + fur2) + head + cap;
}

/* ---------- page assembly ---------- */
const page = (body, seed = 3) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs(seed)}${paper()}${body}${blooms(seed)}<rect width="${W}" height="${H}" filter="url(#paper)" opacity="0.35"/>${vignette()}</svg>`;
const portrait = (body, bg = '#efe4cf') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${defs(5)}<rect width="400" height="400" fill="#fbf5e9"/><rect width="400" height="400" filter="url(#paper)" opacity="0.5"/>${blob(200, 210, 150, 150, bg, 0.6, 'soft')}${body}</svg>`;

module.exports = { shelf, W, H, defs, wash, blob, ink, dot, g, paper, page, portrait, sky, hills, ground, tree, pine, flowers, grass, path, bird, sun, cloud, cottage, room, windowPane, bed, closet, table, apple, bread, basket, red, mother, grandma, grandmaHead, woodcutter, wolf, seedRnd };
