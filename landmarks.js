/* =========================================================
   Famous places of the world — pictures + where they are
   OpenMoji art (CC BY-SA 4.0) where it exists, hand-drawn SVG for the rest.
   To use a real photo instead: put it in img/landmarks/<id>.jpg (it is shown when present).
   ========================================================= */
const LM_SKY = '<rect x="0" y="0" width="120" height="120" fill="#cfe9ff"/>';
const LMO = 'stroke="#2b2140" stroke-width="1.6" stroke-linejoin="round"';
const LM_DRAW = {
  cntower: `${LM_SKY}<rect x="0" y="96" width="120" height="24" fill="#8ce99a"/>
    ${[[8, 80, 14, 16], [24, 70, 12, 26], [80, 74, 14, 22], [96, 84, 16, 12], [36, 86, 10, 10], [70, 82, 9, 14]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#adb5bd" ${LMO}/>`).join('')}
    <path d="M56 98 L58.5 44 L61.5 44 L64 98 Z" fill="#dee2e6" ${LMO}/>
    <ellipse cx="60" cy="46" rx="11" ry="4" fill="#868e96" ${LMO}/><rect x="51" y="38" width="18" height="8" rx="3" fill="#ced4da" ${LMO}/>
    <rect x="56" y="28" width="8" height="6" rx="2" fill="#ced4da" ${LMO}/><path d="M58.5 38 L59 28 M61.5 38 L61 28" ${LMO}/>
    <path d="M60 28 V6" stroke="#2b2140" stroke-width="2" stroke-linecap="round"/>`,
  tajmahal: `${LM_SKY}<rect x="0" y="92" width="120" height="28" fill="#74c0fc"/><rect x="50" y="94" width="20" height="26" fill="#a5d8ff"/>
    <rect x="16" y="46" width="7" height="46" fill="#fff" ${LMO}/><rect x="97" y="46" width="7" height="46" fill="#fff" ${LMO}/>
    <path d="M14.5 46 q5 -10 10 0z M95.5 46 q5 -10 10 0z" fill="#fff" ${LMO}/>
    <rect x="30" y="62" width="60" height="30" fill="#fff" ${LMO}/>
    <path d="M38 62 q5 -10 10 0z M72 62 q5 -10 10 0z" fill="#fff" ${LMO}/>
    <path d="M44 62 C40 44 52 32 60 26 C68 32 80 44 76 62 Z" fill="#fff" ${LMO}/><path d="M60 26 V17" stroke="#2b2140" stroke-width="1.8"/>
    <path d="M53 92 V76 q7 -10 14 0 V92" fill="#e9ecef" ${LMO}/>
    <path d="M35 92 V80 q4 -6 8 0 V92 M77 92 V80 q4 -6 8 0 V92" fill="#e9ecef" ${LMO}/>`,
  machupicchu: `${LM_SKY}<path d="M0 120 V70 L18 58 L30 66 L50 30 L58 22 L66 34 L74 46 L120 64 V120 Z" fill="#51cf66" ${LMO}/>
    <path d="M50 30 L58 22 L66 34 Z" fill="#2f9e44"/>
    ${[78, 86, 94, 102].map((y, i) => `<path d="M${6 + i * 3} ${y} H${114 - i * 3}" stroke="#2f9e44" stroke-width="3"/>`).join('')}
    ${[[22, 80], [34, 80], [46, 80], [66, 80], [78, 80], [90, 80], [30, 92], [44, 92], [58, 92], [74, 92], [86, 92]].map(([x, y]) => `<rect x="${x}" y="${y}" width="9" height="7" fill="#ced4da" ${LMO}/>`).join('')}
    <path d="M24 80 l4.5 -5 l4.5 5 M68 80 l4.5 -5 l4.5 5" fill="#ced4da" ${LMO}/>
    <path d="M96 54 q6 -6 14 -2 q2 4 -4 6z" fill="#fff" opacity=".9"/>`,
  greatwall: `${LM_SKY}<path d="M0 120 V80 Q30 60 60 76 T120 66 V120 Z" fill="#69db7c" ${LMO}/>
    <path d="M-2 94 Q20 80 40 86 Q62 92 80 76 Q98 62 122 70 L122 80 Q98 72 82 86 Q62 102 40 96 Q20 90 -2 104 Z" fill="#e9c46a" ${LMO}/>
    ${[[8, 84], [38, 78], [74, 70], [106, 60]].map(([x, y]) => `<rect x="${x}" y="${y}" width="12" height="16" fill="#d4a373" ${LMO}/><path d="M${x} ${y} h3 v-3 h3 v3 h3 v-3 h3 v3" fill="#d4a373" ${LMO}/>`).join('')}`,
  bigben: `${LM_SKY}<rect x="0" y="100" width="120" height="20" fill="#74c0fc"/>
    <rect x="60" y="72" width="60" height="28" fill="#e9c46a" ${LMO}/>${[66, 76, 86, 96, 106].map((x) => `<rect x="${x}" y="80" width="5" height="10" fill="#b5838d"/>`).join('')}
    <rect x="34" y="34" width="22" height="66" fill="#e9c46a" ${LMO}/>
    <rect x="31" y="30" width="28" height="22" fill="#d4a373" ${LMO}/>
    <circle cx="45" cy="41" r="8" fill="#fff" ${LMO}/><path d="M45 41 V36 M45 41 H49" stroke="#2b2140" stroke-width="1.4"/>
    <path d="M31 30 L45 6 L59 30 Z" fill="#495057" ${LMO}/><path d="M45 6 V1" stroke="#2b2140" stroke-width="1.6"/>
    ${[60, 72, 84].map((y) => `<rect x="39" y="${y}" width="12" height="6" fill="#b5838d"/>`).join('')}`,
  colosseum: `${LM_SKY}<rect x="0" y="96" width="120" height="24" fill="#c0eb75"/>
    <path d="M8 96 V40 Q60 22 112 40 V70 L100 66 L96 54 L86 50 V96 Z" fill="#f4d58d" ${LMO}/>
    ${[48, 64, 80].map((y) => [14, 24, 34, 44, 54, 64, 74].map((x) => `<path d="M${x} ${y + 12} v-7 q3 -5 6 0 v7z" fill="#a47148"/>`).join('')).join('')}
    <path d="M8 56 H86 M8 72 H86 M8 88 H86" stroke="#a47148" stroke-width="1.2"/>`,
  pisa: `${LM_SKY}<rect x="0" y="100" width="120" height="20" fill="#8ce99a"/>
    <g transform="rotate(8 60 100)">
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="44" y="${88 - i * 13}" width="32" height="13" fill="#fff" ${LMO}/>${[48, 56, 64, 72].map((x) => `<path d="M${x} ${99 - i * 13} v-6 q2 -4 4 0 v6" fill="#dee2e6" stroke="#868e96" stroke-width=".8"/>`).join('')}`).join('')}
      <rect x="48" y="12" width="24" height="10" fill="#fff" ${LMO}/><path d="M48 12 q12 -8 24 0" fill="#e9ecef" ${LMO}/>
    </g>`,
  opera: `${LM_SKY}<rect x="0" y="90" width="120" height="30" fill="#4dabf7"/>
    <rect x="10" y="82" width="100" height="10" fill="#e9c46a" ${LMO}/>
    <path d="M18 82 Q24 44 50 40 Q40 60 44 82 Z" fill="#fff" ${LMO}/>
    <path d="M40 82 Q48 36 78 32 Q64 56 68 82 Z" fill="#fff" ${LMO}/>
    <path d="M64 82 Q74 46 100 46 Q88 64 92 82 Z" fill="#fff" ${LMO}/>
    <path d="M86 82 Q94 62 108 60 Q100 70 104 82 Z" fill="#fff" ${LMO}/>
    <path d="M30 70 L42 52 M54 66 L70 44 M78 70 L94 54" stroke="#ced4da" stroke-width="1.2"/>`,
  christ: `${LM_SKY}<path d="M0 120 V92 Q30 70 60 64 Q90 70 120 92 V120 Z" fill="#51cf66" ${LMO}/>
    <rect x="54" y="56" width="12" height="10" fill="#dee2e6" ${LMO}/>
    <path d="M56 56 L57 30 H63 L64 56 Z" fill="#f1f3f5" ${LMO}/>
    <path d="M28 32 H92 V37 H63 V32 H57 V37 H28 Z" fill="#f1f3f5" ${LMO}/>
    <circle cx="60" cy="25" r="5" fill="#f1f3f5" ${LMO}/>
    <path d="M100 30 q8 -6 16 0 q-8 4 -16 0z M6 44 q8 -6 14 -1 q-7 4 -14 1z" fill="#fff"/>`,
  goldengate: `${LM_SKY}<rect x="0" y="86" width="120" height="34" fill="#4dabf7"/>
    <path d="M0 74 H120" stroke="#e8590c" stroke-width="5"/>
    <rect x="28" y="18" width="7" height="72" fill="#e8590c" ${LMO}/><rect x="84" y="18" width="7" height="72" fill="#e8590c" ${LMO}/>
    <path d="M28 26 h7 M28 44 h7 M84 26 h7 M84 44 h7" stroke="#2b2140" stroke-width="1.4"/>
    <path d="M0 40 Q15 70 31 20 Q60 70 88 20 Q104 70 120 40" fill="none" stroke="#e8590c" stroke-width="2.2"/>
    ${[8, 16, 40, 48, 56, 64, 72, 80, 96, 104, 112].map((x) => `<path d="M${x} 74 V${x < 31 ? 50 + (31 - x) * 0.6 : x > 88 ? 50 + (x - 88) * 0.6 : 60}" stroke="#e8590c" stroke-width=".8"/>`).join('')}`,
  stbasil: `${LM_SKY}<rect x="0" y="100" width="120" height="20" fill="#adb5bd"/>
    <rect x="20" y="62" width="80" height="38" fill="#e03131" ${LMO}/>
    ${[[30, 62, 14, '#40c057'], [90, 62, 14, '#1c7ed6'], [44, 52, 16, '#fab005'], [76, 52, 16, '#7048e8'], [60, 40, 20, '#e64980']].map(([x, y, w, c]) => `
      <rect x="${x - w / 2 + 2}" y="${y}" width="${w - 4}" height="${100 - y}" fill="#fff4e6" ${LMO}/>
      <path d="M${x - w / 2} ${y} C${x - w / 2} ${y - w * 0.7} ${x} ${y - w * 0.9} ${x} ${y - w * 1.25} C${x} ${y - w * 0.9} ${x + w / 2} ${y - w * 0.7} ${x + w / 2} ${y} Z" fill="${c}" ${LMO}/>
      <path d="M${x - w / 4} ${y - 2} Q${x} ${y - w * 0.6} ${x + w / 4} ${y - 2}" fill="none" stroke="#fff" stroke-width="1.4"/>`).join('')}
    <path d="M52 100 v-12 q8 -8 16 0 v12" fill="#862e9c" ${LMO}/>`,
  brandenburg: `${LM_SKY}<rect x="0" y="98" width="120" height="22" fill="#ced4da"/>
    <rect x="14" y="42" width="92" height="12" fill="#e9c46a" ${LMO}/><rect x="40" y="32" width="40" height="10" fill="#e9c46a" ${LMO}/>
    <path d="M52 32 l4 -8 h8 l4 8 M58 24 l-3 -6 M62 24 l3 -6" fill="#495057" ${LMO}/>
    ${[18, 32, 46, 60, 74, 88].map((x) => `<rect x="${x}" y="54" width="6" height="44" fill="#f4d58d" ${LMO}/>`).join('')}
    <rect x="12" y="94" width="96" height="5" fill="#e9c46a" ${LMO}/>`,
  niagara: `${LM_SKY}<path d="M0 50 H120 V58 H0 Z" fill="#74c0fc" ${LMO}/>
    <path d="M0 58 H120 V96 H0 Z" fill="#a5d8ff"/>
    ${Array.from({ length: 16 }, (_, i) => `<path d="M${4 + i * 7.5} 58 V94" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`).join('')}
    <path d="M0 40 H22 V58 H0 Z M98 36 H120 V58 H98 Z" fill="#69db7c" ${LMO}/>
    <path d="M0 94 H120 V120 H0 Z" fill="#4dabf7"/>
    ${[[14, 96], [40, 98], [70, 95], [100, 97]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#fff" opacity=".85"/>`).join('')}
    <path d="M50 108 h22 l-4 5 h-14 z" fill="#1c7ed6" ${LMO}/><path d="M56 108 v-4 h8 v4" fill="#fff" ${LMO}/>`,
};
// [id, name, country (must be a GEO famous country), city/place, level, art source]
const LANDMARKS = [
  ['liberty', 'Statue of Liberty', 'United States', 'New York City', 1, 'om'],
  ['eiffel', 'Eiffel Tower', 'France', 'Paris', 1, 'om'],
  ['pyramid', 'Great Pyramid of Giza', 'Egypt', 'Giza, near Cairo', 1, 'om'],
  ['tajmahal', 'Taj Mahal', 'India', 'Agra', 1, 'draw'],
  ['cntower', 'CN Tower', 'Canada', 'Toronto', 1, 'draw'],
  ['niagara', 'Niagara Falls', 'Canada', 'between Canada and the United States', 1, 'draw'],
  ['greatwall', 'Great Wall of China', 'China', 'northern China', 1, 'draw'],
  ['bigben', 'Big Ben', 'United Kingdom', 'London', 2, 'draw'],
  ['opera', 'Sydney Opera House', 'Australia', 'Sydney', 2, 'draw'],
  ['fuji', 'Mount Fuji', 'Japan', 'near Tokyo', 2, 'om'],
  ['colosseum', 'Colosseum', 'Italy', 'Rome', 2, 'draw'],
  ['christ', 'Christ the Redeemer', 'Brazil', 'Rio de Janeiro', 2, 'draw'],
  ['goldengate', 'Golden Gate Bridge', 'United States', 'San Francisco', 2, 'draw'],
  ['machupicchu', 'Machu Picchu', 'Peru', 'the Andes mountains', 3, 'draw'],
  ['pisa', 'Leaning Tower of Pisa', 'Italy', 'Pisa', 3, 'draw'],
  ['stbasil', "Saint Basil's Cathedral", 'Russia', 'Moscow', 3, 'draw'],
  ['brandenburg', 'Brandenburg Gate', 'Germany', 'Berlin', 3, 'draw'],
  ['tokyo', 'Tokyo Tower', 'Japan', 'Tokyo', 3, 'om'],
];
function landmarkArt(id, cls = '') {
  const L = LANDMARKS.find((x) => x[0] === id);
  const svg = L[5] === 'om'
    ? `<svg viewBox="0 0 72 72" class="lm-art ${cls}"><rect x="0" y="0" width="72" height="72" fill="#cfe9ff"/>${OM_LAND[id]}</svg>`
    : `<svg viewBox="0 0 120 120" class="lm-art ${cls}">${LM_DRAW[id]}</svg>`;
  // a real photo, if one has been added to img/landmarks/, replaces the drawing
  return `<span class="lm-box">${svg}<img class="lm-photo" src="img/landmarks/${id}.jpg" alt="" onload="this.previousElementSibling.style.display='none';this.style.display='block'" onerror="this.remove()"></span>`;
}

// Animals of the world: [animal, emoji, answer, answer type, level]
//   type 'country' → choices are countries · 'continent' → choices are continents
const WORLD_ANIMALS = [
  ['panda', '🐼', 'China', 'country', 1], ['kangaroo', '🦘', 'Australia', 'country', 1], ['koala', '🐨', 'Australia', 'country', 1],
  ['lion', '🦁', 'Africa', 'continent', 1], ['giraffe', '🦒', 'Africa', 'continent', 1], ['zebra', '🦓', 'Africa', 'continent', 1],
  ['polar bear', '🐻‍❄️', 'Canada', 'country', 1], ['penguin', '🐧', 'Antarctica', 'continent', 1], ['tiger', '🐯', 'India', 'country', 1],
  ['bald eagle', '🦅', 'United States', 'country', 2], ['anaconda', '🐍', 'Brazil', 'country', 2], ['sloth', '🦥', 'South America', 'continent', 2],
  ['camel', '🐪', 'Egypt', 'country', 2], ['gorilla', '🦍', 'Africa', 'continent', 2], ['hippo', '🦛', 'Africa', 'continent', 2],
  ['moose', '🫎', 'Canada', 'country', 2], ['African elephant', '🐘', 'Africa', 'continent', 2],
  ['llama', '🦙', 'Peru', 'country', 3], ['macaw parrot', '🦜', 'Brazil', 'country', 3], ['orangutan', '🦧', 'Indonesia', 'country', 3],
  ['Komodo dragon', '🦎', 'Indonesia', 'country', 3], ['bison', '🦬', 'United States', 'country', 3], ['beaver', '🦫', 'Canada', 'country', 3],
];
