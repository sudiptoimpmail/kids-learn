#!/usr/bin/env node
/* Build-time generator for assets/currencies/*.svg  (run: node scripts/generate-currency-assets.js)
   Coins look like the real ones a child handles: true metal colour, true relative size
   (every coin is drawn at its real diameter on the same 240-unit canvas), true shape
   (7-sided, 11-sided, 12-sided, two-tone) and the words / numbers the real coin shows.
   Banknotes use each note's real main colour. Pictures are simplified learning art —
   no portraits of real people and no copy of a real design. */
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'currencies');
const xml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

const METAL = {
  copper: ['#ffe2c6', '#d98b57', '#a85a2c', '#6e3517'],
  bronze: ['#ffe7cc', '#c98e5c', '#97602f', '#5e3a19'],
  silver: ['#ffffff', '#e3e7ec', '#aab3bd', '#5d6873'],
  steel:  ['#ffffff', '#dfe3e8', '#a3acb6', '#55606c'],
  gold:   ['#fff6c8', '#ecc65a', '#b88b1c', '#6f5208'],
};
const LARGEST_MM = 32;            // a 32 mm coin fills the canvas
const CENTER = 120, MAXR = 106;

/* ---- small motifs, drawn in a 100×100 box, centred at 50,50 ---- */
const MOTIF = {
  shield: c => `<path d="M22 22H78V52Q78 76 50 88Q22 76 22 52Z" fill="none" stroke="${c}" stroke-width="5"/><path d="M22 34H78" stroke="${c}" stroke-width="5"/>${[32,41,50,59,68].map(x=>`<path d="M${x} 34V${x<40||x>60?70:80}" stroke="${c}" stroke-width="3"/>`).join('')}`,
  building: c => `<path d="M30 40Q50 18 70 40Z" fill="${c}"/><rect x="18" y="40" width="64" height="6" fill="${c}"/>${[24,36,48,60,72].map(x=>`<rect x="${x}" y="48" width="4" height="26" fill="${c}"/>`).join('')}<rect x="14" y="74" width="72" height="7" fill="${c}"/>`,
  torch: c => `<path d="M50 14Q60 28 50 38Q40 28 50 14Z" fill="${c}"/><path d="M42 38H58L54 86H46Z" fill="${c}"/><path d="M30 46Q20 64 34 84M70 46Q80 64 66 84" fill="none" stroke="${c}" stroke-width="4"/><path d="M27 58l-6 -3M25 70l-7 -1M73 58l6 -3M75 70l7 -1" stroke="${c}" stroke-width="4"/>`,
  eagle: c => `<path d="M50 30Q58 30 58 40V58L50 70L42 58V40Q42 30 50 30Z" fill="${c}"/><path d="M42 44Q22 30 8 36Q20 44 22 50Q30 48 42 54ZM58 44Q78 30 92 36Q80 44 78 50Q70 48 58 54Z" fill="${c}"/><path d="M44 70L50 86L56 70Z" fill="${c}"/><circle cx="50" cy="26" r="7" fill="${c}"/>`,
  crown: c => `<path d="M18 70L22 34L36 54L50 26L64 54L78 34L82 70Z" fill="${c}"/><rect x="18" y="72" width="64" height="8" rx="2" fill="${c}"/><circle cx="22" cy="32" r="4" fill="${c}"/><circle cx="50" cy="23" r="4" fill="${c}"/><circle cx="78" cy="32" r="4" fill="${c}"/>`,
  maple: c => `<path d="M50 12L56 28L66 22L64 40L80 34L74 48L86 52L68 62L72 70L54 66L52 88H48L46 66L28 70L32 62L14 52L26 48L20 34L36 40L34 22L44 28Z" fill="${c}"/>`,
  boat: c => `<path d="M14 66H86L78 78H24Z" fill="${c}"/><path d="M38 64V16M62 64V20" stroke="${c}" stroke-width="3"/><path d="M38 20L22 60H38ZM62 24L46 60H62ZM62 24L80 60H64Z" fill="${c}"/><path d="M10 86Q20 80 30 86T50 86T70 86T90 86" fill="none" stroke="${c}" stroke-width="3"/>`,
  beaver: c => `<ellipse cx="52" cy="58" rx="24" ry="16" fill="${c}"/><circle cx="76" cy="48" r="10" fill="${c}"/><ellipse cx="20" cy="66" rx="14" ry="7" fill="${c}"/><path d="M8 82H92" stroke="${c}" stroke-width="4"/><path d="M40 72v10M64 72v10" stroke="${c}" stroke-width="5"/>`,
  caribou: c => `<path d="M42 40Q46 66 50 84Q54 66 58 40Z" fill="${c}"/><ellipse cx="50" cy="44" rx="10" ry="8" fill="${c}"/><path d="M44 38Q30 30 28 14M30 26L20 22M34 32L24 34M56 38Q70 30 72 14M70 26L80 22M66 32L76 34" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  loon: c => `<path d="M18 62Q22 48 46 50Q60 50 66 40Q70 30 80 32Q88 34 92 38L82 40Q76 44 76 54Q74 68 50 70Q26 72 18 62Z" fill="${c}"/><path d="M6 80Q18 74 30 80T54 80T78 80T98 80" fill="none" stroke="${c}" stroke-width="3"/>`,
  bear: c => `<path d="M14 66Q16 46 40 44Q60 42 72 46Q82 42 88 48Q92 54 86 58L80 58Q80 66 74 74H66L66 66Q54 68 44 66L42 74H34L32 66Q24 68 22 74H14Z" fill="${c}"/><path d="M4 82H96" stroke="${c}" stroke-width="3"/>`,
  harp: c => `<path d="M30 86V22Q34 14 44 18Q62 26 74 60Q76 70 70 76Z" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>${[38,46,54,62].map((x,i)=>`<path d="M${x} ${24+i*6}V${82-i*3}" stroke="${c}" stroke-width="2.5"/>`).join('')}`,
  kangaroo: c => `<path d="M62 18Q70 16 72 24L70 30Q78 34 74 40L66 38Q62 44 64 56Q66 68 76 84H64Q56 74 50 70Q42 76 18 84Q30 72 40 66Q34 56 40 46Q48 36 60 34Z" fill="${c}"/>`,
  kiwi: c => `<ellipse cx="46" cy="56" rx="28" ry="20" fill="${c}"/><circle cx="72" cy="42" r="9" fill="${c}"/><path d="M78 44Q92 56 96 70" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M38 74V88M54 74V88" stroke="${c}" stroke-width="4"/>`,
  fern: c => `<path d="M50 88Q48 50 60 16" fill="none" stroke="${c}" stroke-width="4"/>${Array.from({length:7},(_,i)=>{const y=80-i*9, x=49+i*1.4;return `<path d="M${x} ${y}Q${x-18} ${y-6} ${x-24+i*2} ${y-14}M${x} ${y}Q${x+18} ${y-6} ${x+24-i*2} ${y-14}" fill="none" stroke="${c}" stroke-width="3"/>`}).join('')}`,
  stars: c => [[50,22,9],[30,50,8],[70,48,8],[50,74,9],[60,60,4]].map(([x,y,r])=>`<path d="${star(x,y,r)}" fill="${c}"/>`).join(''),
  rupee: c => `<text x="50" y="66" text-anchor="middle" font-family="system-ui,sans-serif" font-size="48" font-weight="800" fill="${c}">₹</text>`,
};
function star(cx, cy, r) {
  return Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*0.45:r;return (i?'L':'M')+(cx+rr*Math.cos(a)).toFixed(1)+' '+(cy+rr*Math.sin(a)).toFixed(1)}).join('')+'Z';
}

/* [value, label, diameter mm, sides (0 = round), outer metal, inner metal|null, rim words, centre big text, motif] */
const COINS = {
  us: [
    [1,  '1¢',  19.05, 0, 'copper', null, 'UNITED STATES OF AMERICA', 'ONE CENT', 'shield'],
    [5,  '5¢',  21.21, 0, 'silver', null, 'UNITED STATES OF AMERICA', 'FIVE CENTS', 'building'],
    [10, '10¢', 17.91, 0, 'silver', null, 'UNITED STATES OF AMERICA', 'ONE DIME', 'torch'],
    [25, '25¢', 24.26, 0, 'silver', null, 'UNITED STATES OF AMERICA', 'QUARTER DOLLAR', 'eagle'],
  ],
  uk: [
    [1,   '1p',  20.3, 0, 'copper', null, 'ONE PENNY', '1', 'crown'],
    [2,   '2p',  25.9, 0, 'copper', null, 'TWO PENCE', '2', 'crown'],
    [5,   '5p',  18.0, 0, 'silver', null, 'FIVE PENCE', '5', 'crown'],
    [10,  '10p', 24.5, 0, 'silver', null, 'TEN PENCE', '10', 'crown'],
    [20,  '20p', 21.4, 7, 'silver', null, 'TWENTY PENCE', '20', 'crown'],
    [50,  '50p', 27.3, 7, 'silver', null, 'FIFTY PENCE', '50', 'shield'],
    [100, '£1',  23.43, 12, 'gold', 'silver', 'ONE POUND', '£1', null],
    [200, '£2',  28.4, 0, 'gold', 'silver', 'TWO POUNDS', '£2', null],
  ],
  ca: [
    [5,   '5¢',  21.2, 0, 'silver', null, 'CANADA', '5 CENTS', 'beaver'],
    [10,  '10¢', 18.03, 0, 'silver', null, 'CANADA', '10 CENTS', 'boat'],
    [25,  '25¢', 23.88, 0, 'silver', null, 'CANADA', '25 CENTS', 'caribou'],
    [100, '$1',  26.5, 11, 'gold', null, 'CANADA', 'DOLLAR', 'loon'],
    [200, '$2',  28.0, 0, 'silver', 'gold', 'CANADA', '2 DOLLARS', 'bear'],
  ],
  au: [
    [5,   '5c',  19.41, 0, 'silver', null, 'AUSTRALIA', '5', 'stars'],
    [10,  '10c', 23.6, 0, 'silver', null, 'AUSTRALIA', '10', 'stars'],
    [20,  '20c', 28.65, 0, 'silver', null, 'AUSTRALIA', '20', 'stars'],
    [50,  '50c', 31.65, 12, 'silver', null, 'AUSTRALIA', '50', 'kangaroo'],
    [100, '$1',  25.0, 0, 'gold', null, 'AUSTRALIA', '1 DOLLAR', 'kangaroo'],
    [200, '$2',  20.5, 0, 'gold', null, 'AUSTRALIA', '2', 'stars'],
  ],
  nz: [
    [10,  '10c', 20.5, 0, 'bronze', null, 'NEW ZEALAND', '10', 'fern'],
    [20,  '20c', 21.75, 0, 'silver', null, 'NEW ZEALAND', '20', 'fern'],
    [50,  '50c', 24.75, 0, 'silver', null, 'NEW ZEALAND', '50', 'boat'],
    [100, '$1',  23.0, 0, 'gold', null, 'NEW ZEALAND', '1', 'kiwi'],
    [200, '$2',  26.5, 0, 'gold', null, 'NEW ZEALAND', '2', 'fern'],
  ],
  ie: [
    [1,   '1c',  16.25, 0, 'copper', null, 'EURO CENT', '1', null],
    [2,   '2c',  18.75, 0, 'copper', null, 'EURO CENT', '2', null],
    [5,   '5c',  21.25, 0, 'copper', null, 'EURO CENT', '5', null],
    [10,  '10c', 19.75, 0, 'gold', null, 'EURO CENT', '10', null],
    [20,  '20c', 22.25, 0, 'gold', null, 'EURO CENT', '20', null],
    [50,  '50c', 24.25, 0, 'gold', null, 'EURO CENT', '50', null],
    [100, '€1',  23.25, 0, 'gold', 'silver', 'EURO', '1', null],
    [200, '€2',  25.75, 0, 'silver', 'gold', 'EURO', '2', null],
  ],
  in: [
    [100,  '₹1',  20, 0, 'steel', null, 'भारत  INDIA', '1', 'rupee'],
    [200,  '₹2',  23, 0, 'steel', null, 'भारत  INDIA', '2', 'rupee'],
    [500,  '₹5',  25, 0, 'steel', null, 'भारत  INDIA', '5', 'rupee'],
    [1000, '₹10', 27, 0, 'gold', 'silver', 'भारत  INDIA', '10', 'rupee'],
    [2000, '₹20', 27, 12, 'gold', 'silver', 'भारत  INDIA', '20', 'rupee'],
  ],
};
const NAMES = { us:'United States', uk:'United Kingdom', ca:'Canada', au:'Australia', nz:'New Zealand', ie:'Ireland', in:'India' };

function poly(sides, r, curved) {
  const pts = Array.from({length:sides},(_,i)=>{const a=-Math.PI/2+i*2*Math.PI/sides;return [CENTER+r*Math.cos(a), CENTER+r*Math.sin(a)]});
  if (!curved) return 'M' + pts.map(p=>p.map(v=>v.toFixed(1)).join(' ')).join('L') + 'Z';
  // Reuleaux-style: each edge is an arc centred on the opposite corner (UK 20p / 50p)
  const R = 2 * r * Math.cos(Math.PI / (2 * sides));
  return 'M' + pts[0].map(v=>v.toFixed(1)).join(' ') + pts.slice(1).concat([pts[0]]).map(p=>`A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + 'Z';
}
function grad(id, m) {
  const c = METAL[m];
  return `<radialGradient id="${id}" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="${c[0]}"/><stop offset=".35" stop-color="${c[1]}"/><stop offset=".85" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3]}"/></radialGradient>`;
}
function coinSVG(code, [value, label, mm, sides, outer, inner, rim, big, motif]) {
  const r = MAXR * mm / LARGEST_MM, ink = METAL[inner && !['ie'].includes(code) ? inner : outer][3];
  const shape = d => sides ? `<path d="${poly(sides, d, code === 'uk' && sides === 7)}"` : `<circle cx="${CENTER}" cy="${CENTER}" r="${d}"`;
  const innerR = inner ? r * 0.66 : 0;
  const rimR = r * 0.8, bigInk = METAL[inner || outer][3];
  const fs = Math.max(6, Math.min(r * 0.14, 15, (Math.PI * rimR * 0.92) / (rim.length * 0.72 + 1)));
  const hasMotif = motif && MOTIF[motif];
  const room = inner ? innerR : r;
  let bigSize = big.length <= 2 ? room * 0.62 : big.length <= 4 ? room * 0.4 : Math.min(room * 0.24, room * 2.3 / big.length);
  if (hasMotif) bigSize = Math.min(bigSize, big.length <= 2 ? room * 0.36 : room * 0.2);
  const motifSize = room * (hasMotif && inner ? 0.9 : 0.78);
  const motifY = CENTER - room * 0.66;            // top of the motif box
  const bigY = hasMotif ? CENTER + room * 0.22 + bigSize * 0.72 : CENTER + bigSize * 0.36;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-labelledby="t"><title id="t">${xml(NAMES[code])} ${xml(label)} coin</title>
<defs>${grad('m', outer)}${inner ? grad('i', inner) : ''}<path id="rim" d="M${CENTER - rimR} ${CENTER}A${rimR} ${rimR} 0 1 1 ${CENTER + rimR} ${CENTER}"/><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter></defs>
<ellipse cx="${CENTER + 2}" cy="${CENTER + r + 6}" rx="${r * 0.86}" ry="${Math.max(3, r * 0.07)}" fill="#1d2733" opacity=".18" filter="url(#s)"/>
${shape(r)} fill="url(#m)" stroke="${METAL[outer][3]}" stroke-width="${Math.max(2, r * 0.035)}"/>
${shape(r * 0.93)} fill="none" stroke="${METAL[outer][3]}" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="1.5 2.5"/>
${inner ? `<circle cx="${CENTER}" cy="${CENTER}" r="${innerR}" fill="url(#i)" stroke="${METAL[inner][3]}" stroke-width="2"/>` : ''}
${!inner ? `<text font-family="system-ui,-apple-system,sans-serif" font-size="${fs.toFixed(1)}" font-weight="700" letter-spacing="1" fill="${ink}" fill-opacity=".85"><textPath href="#rim" startOffset="50%" text-anchor="middle">${xml(rim)}</textPath></text>` :
  `<text x="${CENTER}" y="${CENTER - innerR - (r - innerR) * 0.28}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.min(fs, (r - innerR) * 0.55).toFixed(1)}" font-weight="700" fill="${METAL[outer][3]}">${xml(rim)}</text>`}
${hasMotif ? `<g transform="translate(${CENTER - motifSize / 2} ${motifY}) scale(${(motifSize / 100).toFixed(3)})" opacity=".8">${MOTIF[motif](bigInk)}</g>` : ''}
<text x="${CENTER}" y="${bigY.toFixed(1)}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="${bigSize.toFixed(1)}" fill="${bigInk}">${xml(big)}</text>
<path d="M${CENTER - r * 0.6} ${CENTER - r * 0.45}Q${CENTER} ${CENTER - r * 1.02} ${CENTER + r * 0.6} ${CENTER - r * 0.45}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="${(r * 0.06).toFixed(1)}" stroke-linecap="round"/>
</svg>
`;
}

/* banknotes: [value, label, words, main colour, light colour] */
const NOTES = {
  us: [[100,'$1','ONE DOLLAR','#4f6b52','#e7eedc'],[500,'$5','FIVE DOLLARS','#6a5a86','#ece6f1'],[1000,'$10','TEN DOLLARS','#b4683a','#f7e5d6'],[2000,'$20','TWENTY DOLLARS','#3f7a5e','#e2efe1']],
  uk: [[500,'£5','FIVE POUNDS','#2f7f7a','#dff1ee'],[1000,'£10','TEN POUNDS','#c4642a','#fbe6d6'],[2000,'£20','TWENTY POUNDS','#6b3f8f','#eee2f6'],[5000,'£50','FIFTY POUNDS','#b23a3a','#f8dfdc']],
  ca: [[500,'$5','FIVE DOLLARS','#2d6fb6','#dde9f7'],[1000,'$10','TEN DOLLARS','#7a3e94','#efe1f5'],[2000,'$20','TWENTY DOLLARS','#3a8a4a','#e0f1e2'],[5000,'$50','FIFTY DOLLARS','#c03a3a','#f9e0dd']],
  au: [[500,'$5','FIVE DOLLARS','#b05596','#f6e1ef'],[1000,'$10','TEN DOLLARS','#2b7bbd','#dceaf6'],[2000,'$20','TWENTY DOLLARS','#c2492f','#f8e0d8'],[5000,'$50','FIFTY DOLLARS','#c9a21c','#fbf1cf']],
  nz: [[500,'$5','FIVE DOLLARS','#d0782a','#fbe9d6'],[1000,'$10','TEN DOLLARS','#2f6fb5','#dde8f6'],[2000,'$20','TWENTY DOLLARS','#3e8a4e','#e0f0e2'],[5000,'$50','FIFTY DOLLARS','#7c4a9a','#efe2f6']],
  ie: [[500,'€5','EURO','#7d8288','#eceef0'],[1000,'€10','EURO','#c0473f','#f8e0dc'],[2000,'€20','EURO','#3c66b0','#dfe7f6'],[5000,'€50','EURO','#d9822b','#fbebd8']],
  in: [[1000,'₹10','TEN RUPEES','#7a4a2a','#f0e2d4'],[2000,'₹20','TWENTY RUPEES','#9aa82c','#f2f4d8'],[5000,'₹50','FIFTY RUPEES','#2aa3b8','#d9f2f5'],[10000,'₹100','ONE HUNDRED RUPEES','#7f6bb5','#ebe6f6']],
};
function noteSVG(code, [value, label, words, c, light]) {
  const big = label.length > 3 ? 46 : 54;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" role="img" aria-labelledby="t"><title id="t">${xml(NAMES[code])} ${xml(label)} banknote</title>
<defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="${light}"/></linearGradient>
<pattern id="g" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 5H10" stroke="${c}" stroke-opacity=".12" stroke-width="1"/></pattern></defs>
<rect x="6" y="9" width="350" height="166" rx="10" fill="#1d2733" opacity=".14"/>
<rect x="4" y="4" width="350" height="166" rx="10" fill="url(#p)" stroke="${c}" stroke-width="3"/>
<rect x="4" y="4" width="350" height="166" rx="10" fill="url(#g)"/>
<rect x="16" y="16" width="326" height="142" rx="6" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="2"/>
<rect x="16" y="16" width="120" height="142" rx="6" fill="${c}" fill-opacity=".85"/>
<ellipse cx="76" cy="84" rx="40" ry="50" fill="#fff" fill-opacity=".22"/>
<circle cx="76" cy="70" r="17" fill="#fff" fill-opacity=".55"/><path d="M46 124Q50 96 76 94Q102 96 106 124Z" fill="#fff" fill-opacity=".55"/>
<text x="330" y="${big + 14}" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="${big}" fill="${c}">${xml(label)}</text>
<text x="330" y="${big + 36}" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="12" letter-spacing="1" fill="${c}">${xml(NAMES[code].toUpperCase())}</text>
<text x="330" y="146" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="15" letter-spacing="1" fill="${c}">${xml(words)}</text>
<circle cx="200" cy="104" r="22" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-opacity=".4" stroke-width="2"/>
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [code, coins] of Object.entries(COINS)) for (const c of coins) { fs.writeFileSync(path.join(OUT, `${code}-${c[0]}.svg`), coinSVG(code, c)); n++; }
for (const [code, notes] of Object.entries(NOTES)) for (const t of notes) { fs.writeFileSync(path.join(OUT, `${code}-note-${t[0]}.svg`), noteSVG(code, t)); n++; }
console.log(`wrote ${n} currency pictures`);
