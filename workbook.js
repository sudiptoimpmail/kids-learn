/* Illustrated variations within existing educational categories.
   Original self-contained SVG scenes, predictable hotspots, no external assets. */
const IllustratedActivities = (() => {
  'use strict';
  const div = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = (x,y,s,body) => '<g transform="translate('+x+' '+y+') scale('+(s||1)+')">'+body+'</g>';
  const tree = (x,y,s=1) => el(x,y,s,
    '<ellipse cx="0" cy="5" rx="105" ry="19" fill="#416d38" opacity=".18"/>'+
    '<path d="M-22 0 L-30 -160 L-67 -208 L-50 -220 L-5 -185 L15 -258 L39 -253 L20 -180 L72 -211 L85 -195 L27 -146 L22 0Z" fill="#a36c46" stroke="#795039" stroke-width="7" stroke-linejoin="round"/>'+
    '<path d="M-8 -50 L-15 -143 M16 -132 L30 -172" stroke="#ce9668" stroke-width="6" fill="none"/>'+
    '<g fill="#4ba569" stroke="#397d50" stroke-width="6"><circle cx="-65" cy="-204" r="72"/><circle cx="12" cy="-258" r="86"/><circle cx="95" cy="-205" r="70"/><circle cx="5" cy="-172" r="80"/></g>'+
    '<path d="M-90 -229 q30 -34 57 -25 M30 -290 q25 -23 47 -6" stroke="#99de86" stroke-width="12" fill="none" opacity=".8"/>');
  const cloud=(x,y,s=1)=>el(x,y,s,'<path d="M-58 18 Q-77 -4 -52 -26 Q-29 -42 -12 -21 Q1 -66 43 -46 Q61 -40 62 -14 Q95 -9 88 23 Q83 39 54 37 L-43 37 Q-65 35 -58 18Z" fill="#fff" stroke="#d9edf7" stroke-width="4"/>');
  const bloom=(x,y,color='#fcf6b8',s=1)=>el(x,y,s,'<path d="M0 0 Q10 24 0 57" stroke="#458e58" stroke-width="6" fill="none"/>'+[0,60,120,180,240,300].map(a=>'<ellipse cx="0" cy="-17" rx="10" ry="18" fill="'+color+'" stroke="#e6b67b" stroke-width="1.5" transform="rotate('+a+')"/>').join('')+'<circle r="12" fill="#e5a94a" stroke="#ac7545" stroke-width="3"/>');
  const fox=(x,y,s=1)=>el(x,y,s,'<ellipse cy="8" rx="85" ry="13" fill="#507b48" opacity=".17"/>'+
    '<path d="M-26 -48 Q-137 -112 -123 -40 Q-119 -4 -74 -15 L-31 -24Z" fill="#e49252" stroke="#a95f40" stroke-width="6"/>'+
    '<path d="M-110 -49 Q-126 -12 -72 -15 Q-54 -21 -55 -29" fill="#fff3d7"/>'+
    '<ellipse cx="6" cy="-53" rx="57" ry="44" fill="#ed9d57" stroke="#a65c3d" stroke-width="6"/>'+
    '<path d="M-26 -24 l-5 32 M31 -21 l10 29" fill="none" stroke="#be6e48" stroke-width="15"/>'+
    '<path d="M32 -87 L50 -148 L78 -108 L110 -148 L134 -86" fill="#e98d46" stroke="#a65c3d" stroke-width="6"/>'+
    '<ellipse cx="83" cy="-88" rx="50" ry="40" fill="#ed9955" stroke="#a65c3d" stroke-width="6"/>'+
    '<path d="M46 -74 Q83 -33 123 -73 L110 -44 L57 -44Z" fill="#fff5df"/>'+
    '<circle cx="66" cy="-96" r="6" fill="#28313a"/><circle cx="101" cy="-96" r="6" fill="#28313a"/>'+
    '<ellipse cx="84" cy="-72" rx="9" ry="7" fill="#503a3f"/>');
  const zebra=(x,y,s=1)=>el(x,y,s,
    '<ellipse cy="8" rx="77" ry="12" fill="#678350" opacity=".25"/>'+
    '<path d="M-64 -80 Q-27 -108 57 -94 Q81 -86 66 -45 Q39 -21 -61 -36Z" fill="#fff9ed" stroke="#414c53" stroke-width="6"/>'+
    '<path d="M41 -79 Q58 -134 86 -155 L112 -141 Q105 -99 69 -53" fill="#fffaf0" stroke="#414c53" stroke-width="6"/>'+
    '<path d="M-50 -40 l-2 47 M-12 -37 l-2 44 M43 -37 l2 44 M67 -44 l2 50" stroke="#414c53" stroke-width="15"/>'+
    '<path d="M-50 -40 l-2 42 M-12 -37 l-2 39 M43 -37 l2 39 M67 -44 l2 44" stroke="#fffaf0" stroke-width="8"/>'+
    '<path d="M-57 -93 l27 46 M-20 -101 l30 59 M16 -100 l32 60 M50 -94 l14 44 M78 -148 l12 30 M98 -142 l-5 31" stroke="#414c53" stroke-width="12"/>'+
    '<path d="M88 -151 Q83 -187 105 -185 L117 -158 M111 -149 Q132 -180 142 -159" fill="#f7cfbc" stroke="#414c53" stroke-width="5"/>'+
    '<ellipse cx="117" cy="-141" rx="28" ry="23" fill="#fff9ef" stroke="#414c53" stroke-width="6"/>'+
    '<ellipse cx="133" cy="-134" rx="16" ry="11" fill="#b8bfc0"/><circle cx="110" cy="-152" r="5" fill="#26323a"/>'+
    '<path d="M-67 -82 Q-90 -98 -99 -132" fill="none" stroke="#414c53" stroke-width="7"/>');
  const bird=(x,y,s=1)=>el(x,y,s,
    '<path d="M-30 -5 Q-71 -41 -49 -55 Q-17 -55 -1 -22" fill="#689dc4" stroke="#385b8a" stroke-width="5"/>'+
    '<ellipse rx="39" ry="30" fill="#74a7d6" stroke="#385b8a" stroke-width="5"/>'+
    '<circle cx="24" cy="-16" r="26" fill="#9bc4e6" stroke="#385b8a" stroke-width="5"/>'+
    '<path d="M46 -14 l25 10 -25 11" fill="#f0ac50" stroke="#b97a3c" stroke-width="3"/>'+
    '<circle cx="28" cy="-23" r="5" fill="#27323e"/><path d="M-13 3 q24 -38 43 -4 q-25 22 -43 4" fill="#c4dded"/>'+
    '<path d="M-8 22 l-4 25 M11 25 l2 22" fill="none" stroke="#c58e4e" stroke-width="5"/>');
  const ant=(x,y,s=1)=>el(x,y,s,
    '<g fill="#3e4756" stroke="#2d3748" stroke-width="4"><ellipse cx="-34" rx="26" ry="20"/><ellipse cx="0" cy="-5" rx="18" ry="17"/>'+
    '<circle cx="31" cy="-14" r="19"/><path d="M-38 8 l-23 26 M-37 -9 l-25 -27 M-4 10 l-14 27 M5 12 l15 28 M8 -15 l12 -22 M-11 -15 l-13 -23 M32 -30 q2 -24 17 -22 M22 -26 q-13 -20 -26 -15" fill="none"/>'+
    '<circle cx="38" cy="-18" r="5" fill="#fff"/></g>');
  const base=(green=true)=>'<rect width="800" height="480" fill="#b8e5f8"/>'+
    '<path d="M0 297 Q140 210 305 296 T610 274 T800 284 V480 H0Z" fill="'+(green?'#c5e7a2':'#d0d596')+'"/>'+
    '<path d="M0 354 Q240 274 425 352 T800 327 V480 H0Z" fill="'+(green?'url(#iaGrass)':'#abbc7c')+'"/>'+
    '<circle cx="692" cy="77" r="42" fill="#ffdb75" stroke="#edb45b" stroke-width="6"/>'+cloud(122,66,.85)+cloud(476,95,.58);
  const defs='<defs><linearGradient id="iaGrass" x2="0" y2="1"><stop stop-color="#9ed582"/><stop offset="1" stop-color="#51a56c"/></linearGradient>'+
    '<linearGradient id="iaLake" x2="0" y2="1"><stop stop-color="#77d2e5"/><stop offset="1" stop-color="#c3f4f6"/></linearGradient>'+
    '<pattern id="iaTexture" width="29" height="24" patternUnits="userSpaceOnUse"><circle cx="6" cy="10" r="2" fill="#fff" opacity=".25"/><circle cx="21" cy="19" r="2" fill="#397b4c" opacity=".16"/></pattern></defs>';
  const wrap=(inner,label)=>'<svg class="ia-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-label="'+div(label)+'" preserveAspectRatio="xMidYMid meet">'+defs+inner+'</svg>';
  function illustration(theme){
    if(theme==='savanna') return wrap(base(false)+tree(82,367,.48)+tree(734,362,.52)+
      zebra(106,459,.53)+zebra(712,450,.76)+bloom(60,409,'#ffe2af',.7)+bloom(751,387,'#fff0af',.7),
      'Baby zebra and parent on a sunny savanna with winding paths');
    if(theme==='garden')return wrap(base()+tree(327,341,1.05)+tree(746,337,.54)+
      '<path d="M0 424 Q300 380 800 423 V480 H0Z" fill="#7ac173"/>'+
      el(292,168,1,'<path d="M0 15 Q-46 -44 0 -50 Q50 -50 37 17 Q12 48 -16 36Z" fill="#e95458" stroke="#a94146" stroke-width="6"/>'+
        '<path d="M12 -39 Q16 -72 39 -69 Q31 -43 12 -39" fill="#78b25d" stroke="#397d4b" stroke-width="4"/>')+
      ant(389,402,.86)+
      el(614,251,1,'<path d="M-35 -3 Q-25 -36 6 -37 Q36 -20 32 6 Q4 26 -35 -3Z" fill="#a97145" stroke="#724c3c" stroke-width="5"/><path d="M-35 -6 Q0 -27 32 -8" fill="none" stroke="#6f4b36" stroke-width="13"/><path d="M-20 -13 l-10 -15 M-5 -22 l-3 -17 M12 -19 l10 -13" stroke="#d7ac76" stroke-width="5"/>')+
      el(580,104,.82,'<path d="M-75 5 L13 -3 L78 10 L13 16 L-75 5 M-4 -12 L19 -63 L38 -61 L26 -4 M6 14 L-5 58 L14 57 L28 11" fill="#fbfcff" stroke="#5276ab" stroke-width="5"/><rect x="-51" y="1" width="32" height="8" rx="3" fill="#729cc7"/>')+
      el(117,145,.85,'<ellipse rx="31" ry="19" fill="#ffca55" stroke="#aa8547" stroke-width="5"/><path d="M-16 -16 L3 -16 M-16 -2 L3 -2" stroke="#6b5550" stroke-width="7"/><ellipse cx="-8" cy="-25" rx="22" ry="13" fill="#f6ffff" stroke="#95c5c8" stroke-width="3"/><circle cx="22" cy="-5" r="4"/>')+
      el(150,389,.9,'<ellipse cx="0" cy="-23" rx="43" ry="34" fill="#c49a72" stroke="#82634e" stroke-width="6"/>'+
        '<circle cx="-30" cy="-52" r="18" fill="#a88060" stroke="#82634e" stroke-width="5"/><circle cx="30" cy="-52" r="18" fill="#a88060" stroke="#82634e" stroke-width="5"/>'+
        '<circle cx="-13" cy="-22" r="4"/><circle cx="13" cy="-22" r="4"/><ellipse cy="-8" rx="13" ry="9" fill="#4b4849"/>')+
      // Four additional clearly drawn A-objects form a genuine hidden-picture hunt.
      el(112,265,.82,'<path d="M-48 19 L24 -20 L7 -41 L67 -42 L49 19 L39 -3 L-27 44Z" fill="#f3b14d" stroke="#9e6a38" stroke-width="6" stroke-linejoin="round"/>')+
      el(432,300,.85,'<path d="M-30 56 L14 -53" stroke="#946a4a" stroke-width="16" stroke-linecap="round"/><path d="M4 -53 L43 -65 Q62 -20 31 -4 L-2 -16Z" fill="#d3e2e6" stroke="#667a83" stroke-width="7"/>')+
      el(612,393,.8,'<path d="M-71 8 Q-55 -33 23 -29 Q77 -37 88 -11 L56 2 Q37 36 -19 31 L-60 18Z" fill="#66b85a" stroke="#397c50" stroke-width="7"/><path d="M-50 -15 Q-82 -13 -93 -34 M28 19 l8 19 M-14 21 l-8 21" fill="none" stroke="#397c50" stroke-width="10" stroke-linecap="round"/><circle cx="48" cy="-22" r="8" fill="#fff"/><circle cx="49" cy="-22" r="3"/><path d="M48 -4 l32 0 -12 10 -7 -7 -6 8Z" fill="#fff0db"/>')+
      el(423,177,.9,'<path d="M-41 35 L39 -55" stroke="#b98c64" stroke-width="13" stroke-linecap="round"/><path d="M35 -52 L59 -76 Q74 -86 74 -57 Q72 -37 50 -34Z" fill="#cf6684" stroke="#963e65" stroke-width="6"/><path d="M-19 8 l13 13" stroke="#697b90" stroke-width="7"/>')+
      bloom(68,427,'#fff4ad',.8)+bloom(687,414,'#f9c2d2',.77),
      'Illustrated garden with eight hidden A objects and two distractors');
    if(theme==='room')return wrap(
      '<rect width="800" height="480" fill="#fff5df"/><rect y="330" width="800" height="150" fill="#e8c49f"/>'+
      '<path d="M0 330 H800" stroke="#ba8d71" stroke-width="13"/>'+
      '<rect x="288" y="60" width="193" height="176" rx="10" fill="#94d2ea" stroke="#8b705d" stroke-width="14"/>'+
      '<path d="M382 65 V235 M291 147 H476" stroke="#8b705d" stroke-width="9"/>'+
      '<path d="M298 126 Q351 93 377 121" fill="none" stroke="#fff" stroke-width="8" opacity=".6"/>'+
      '<rect x="660" y="119" width="99" height="242" rx="8" fill="#c18a63" stroke="#8e614d" stroke-width="10"/>'+
      '<circle cx="734" cy="244" r="9" fill="#ffe39c"/>'+
      '<circle cx="191" cy="128" r="61" fill="#fffdfa" stroke="#ad7657" stroke-width="9"/>'+
      '<path d="M191 128 V82 M191 128 l33 19" fill="none" stroke="#596875" stroke-width="8" stroke-linecap="round"/>'+
      '<circle cx="191" cy="128" r="8" fill="#596875"/>'+
      '<ellipse cx="586" cy="143" rx="81" ry="36" fill="#fff8f4" stroke="#bb845e" stroke-width="10"/>'+
      '<ellipse cx="586" cy="139" rx="57" ry="19" fill="#aad8ad"/>'+
      '<circle cx="209" cy="354" r="68" fill="#fff" stroke="#43566e" stroke-width="10"/>'+
      '<path d="M209 286 l36 45 -20 54 -54 -10 -24 -41 M177 312 l60 54 M209 354 l-18 41" stroke="#40536a" stroke-width="9" fill="none"/>'+
      '<circle cx="588" cy="365" r="64" fill="#ef9e4b" stroke="#9e6c43" stroke-width="9"/>'+
      '<path d="M588 302 Q620 328 588 365 T588 427 M522 365 H653" stroke="#f6dfad" stroke-width="7" fill="none"/>'+
      '<rect x="364" y="370" width="120" height="75" rx="8" fill="#718db5" stroke="#536d91" stroke-width="8"/>'+
      '<path d="M374 378 l95 59 M472 378 l-95 59" stroke="#e2eaf6" stroke-width="7"/>',
      'Bright playroom with circular clock, plate, wheel and ball, plus rectangular door and book');
    if(theme==='square-room')return wrap(
      '<rect width="800" height="480" fill="#fcf2dc"/><path d="M0 319 H800 V480 H0Z" fill="#eac19c"/>'+
      '<path d="M0 318 H800" stroke="#b48961" stroke-width="12"/>'+
      '<rect x="102" y="60" width="155" height="155" rx="3" fill="#b1e4f1" stroke="#9c7858" stroke-width="13"/>'+
      '<path d="M179 67 V210 M111 139 H252" stroke="#9c7858" stroke-width="9"/>'+
      '<rect x="495" y="66" width="132" height="132" fill="#fefbf4" stroke="#bd895c" stroke-width="16"/>'+
      '<rect x="510" y="81" width="101" height="101" fill="#a7dfa7"/>'+
      '<path d="M524 160 q27 -65 71 -5" stroke="#5e9f71" stroke-width="12" fill="none"/>'+
      '<circle cx="443" cy="146" r="53" fill="#fffbf6" stroke="#aa8062" stroke-width="9"/>'+
      '<path d="M443 146 V113 M443 146 L464 162" stroke="#516476" stroke-width="8" fill="none"/>'+
      '<rect x="233" y="321" width="113" height="113" rx="3" fill="#e8b75e" stroke="#a97d48" stroke-width="9"/>'+
      '<path d="M233 356 H346 M289 321 V434" stroke="#fce5a3" stroke-width="13"/>'+
      '<rect x="589" y="323" width="111" height="111" rx="7" fill="#82bfe2" stroke="#4a8dad" stroke-width="9"/>'+
      '<path d="M612 354 l65 59 M677 354 l-65 59" stroke="#d6f0f5" stroke-width="8"/>'+
      '<circle cx="104" cy="383" r="48" fill="#f4a84e" stroke="#aa7547" stroke-width="9"/>'+
      '<path d="M66 383 H142 M104 336 Q130 384 104 431" stroke="#fbe0a1" stroke-width="7" fill="none"/>',
      'Illustrated classroom with square window, picture frame, gift and cushion, plus circular distractors');
    if(theme==='forest')return wrap(base()+tree(175,396,.88)+tree(752,396,.65)+
      '<path d="M503 346 Q634 362 568 420 Q536 441 599 480 H756 Q669 431 722 409 Q760 363 653 340Z" fill="url(#iaLake)" stroke="#69bfd6" stroke-width="6"/>'+
      '<path d="M557 403 q34 15 56 -2 M609 438 q23 5 43 -10" stroke="#eeffff" stroke-width="7" fill="none"/>'+
      bird(640,164,.8)+fox(175,431,.65).replace(/#e49252|#ed9d57|#e98d46|#ed9955/g,'#7d8e9f')+
      // Recognizable action clues: wind, squirrel climbing, frog jumping, child catching.
      el(392,63,1,'<path d="M-63 0 Q-8 -40 47 -4 Q75 15 38 31 M-49 29 Q5 1 41 30 M-4 -31 Q24 -58 68 -42" fill="none" stroke="#f5fff1" stroke-width="12" stroke-linecap="round"/>')+
      el(141,224,.73,'<path d="M-16 2 Q-81 -31 -44 -73 Q-8 -84 7 -44" fill="#b7895d" stroke="#856245" stroke-width="8"/><ellipse cy="-16" rx="26" ry="33" fill="#c99c70" stroke="#856245" stroke-width="6"/><circle cx="5" cy="-48" r="22" fill="#d1a678" stroke="#856245" stroke-width="6"/><circle cx="12" cy="-53" r="4" fill="#342b2a"/><path d="M-17 12 l-21 18 M12 10 l22 -14" stroke="#856245" stroke-width="9" fill="none"/>')+
      el(429,326,.83,'<ellipse cy="20" rx="43" ry="9" fill="#4b8b70" opacity=".18"/><ellipse cy="-24" rx="39" ry="23" fill="#7dc473" stroke="#3f8557" stroke-width="6"/><circle cx="25" cy="-39" r="24" fill="#87d27c" stroke="#3f8557" stroke-width="5"/><circle cx="33" cy="-47" r="5" fill="#243c34"/><path d="M-30 -15 l-33 35 M-7 1 l22 32" stroke="#3f8557" stroke-width="10" fill="none"/>')+
      el(546,262,.69,'<circle cy="-76" r="28" fill="#d7a37e" stroke="#9b6f5b" stroke-width="5"/><path d="M-17 -50 L-29 37 L30 37 L17 -50Z" fill="#f5b45c" stroke="#a87552" stroke-width="6"/><path d="M-15 -43 l-52 -38 M18 -40 l52 -43 M-18 35 l-20 48 M20 35 l19 48" fill="none" stroke="#ae775d" stroke-width="13" stroke-linecap="round"/><circle cx="70" cy="-99" r="16" fill="#ef7e62" stroke="#a75a47" stroke-width="5"/><circle cx="11" cy="-79" r="3" fill="#3c3230"/>')+
      el(344,172,1,'<path d="M0 0 Q-30 -57 17 -66 Q70 -51 0 0Z" fill="#8bc879" stroke="#397d52" stroke-width="7"/><path d="M0 0 L25 -49" stroke="#367c4e" stroke-width="4"/>')+
      bloom(370,423,'#fff4b2',.68)+bloom(443,432,'#ffe1ed',.7),
      'Green woodland with leaf, bird, forest animal and winding stream');
    if(theme==='park')return wrap(base()+tree(680,370,.67)+fox(198,423,.82)+
      el(458,348,1,'<ellipse cy="33" rx="34" ry="11" fill="#568a3f" opacity=".2"/>'+
      '<path d="M-6 -8 l2 48" stroke="#786044" stroke-width="8"/><path d="M-28 -12 Q-31 -57 11 -47 Q37 -22 8 6 Q-10 12 -28 -12Z" fill="#e64b58" stroke="#ab3544" stroke-width="6"/>'+
      '<path d="M4 -43 q3 -18 18 -15" fill="none" stroke="#4d8e46" stroke-width="5"/>')+
      bloom(70,409,'#ffe8a9',.8)+bloom(581,398,'#fff',.83),
      'Little fox beside an apple tree in a sunny park');
    if(theme==='cafe')return wrap(
      '<rect width="800" height="480" fill="#b7e5e9"/><path d="M0 290 H800 V480 H0Z" fill="#e6b56b"/>'+
      '<path d="M0 287 H800" stroke="#ac7958" stroke-width="11"/>'+
      '<rect x="0" y="350" width="800" height="130" fill="#e3aa65"/>'+
      '<path d="M0 382 H800 M0 434 H800" stroke="#eec790" stroke-width="5"/>'+
      '<circle cx="212" cy="114" r="57" fill="#e8b18b" stroke="#a37662" stroke-width="8"/>'+
      '<path d="M155 107 Q151 35 205 37 Q272 38 268 100" fill="#8a6649" stroke="#704935" stroke-width="8"/>'+
      '<circle cx="195" cy="115" r="5" fill="#40312c"/><circle cx="230" cy="115" r="5" fill="#40312c"/>'+
      '<path d="M202 139 Q213 152 224 139" fill="none" stroke="#945f51" stroke-width="5"/>'+
      '<path d="M167 187 Q213 164 255 187 L272 296 H156Z" fill="#8cb4dc" stroke="#5f81aa" stroke-width="8"/>'+
      '<circle cx="600" cy="114" r="56" fill="#ba8069" stroke="#82594e" stroke-width="8"/>'+
      '<path d="M550 89 Q571 22 649 72 L648 106 Q599 63 554 112" fill="#303f54"/>'+
      '<circle cx="583" cy="116" r="5" fill="#35343b"/><circle cx="615" cy="116" r="5" fill="#35343b"/>'+
      '<path d="M585 138 Q599 151 617 138" fill="none" stroke="#794e4b" stroke-width="5"/>'+
      '<path d="M563 188 Q601 161 643 188 L656 296 H544Z" fill="#e6a66c" stroke="#a87651" stroke-width="8"/>'+
      '<path d="M95 318 L260 318 L245 447 Q168 480 111 444Z" fill="#c2e3ca" stroke="#5b9480" stroke-width="9"/>'+
      '<path d="M115 355 Q167 336 243 355" stroke="#80bba0" stroke-width="15" fill="none"/>'+
      '<path d="M532 315 L699 315 L679 451 Q609 478 550 451Z" fill="#b594d4" stroke="#7b63a2" stroke-width="9"/>'+
      '<path d="M550 355 Q622 332 677 355" stroke="#d8b7e9" stroke-width="14" fill="none"/>'+
      '<ellipse cx="177" cy="318" rx="66" ry="28" fill="#f4efe0" stroke="#e5d1bd" stroke-width="6"/>'+
      '<ellipse cx="611" cy="316" rx="69" ry="28" fill="#f6e7ee" stroke="#e6c4d4" stroke-width="6"/>',
      'Two smiling children drinking smoothies through tracing paths');
    if(theme==='sports')return wrap(base()+
      el(103,375,.82,'<circle cy="-89" r="43" fill="#c18d6c" stroke="#885e51" stroke-width="6"/>'+
      '<path d="M-39 -110 Q-30 -151 20 -141 L50 -120 L-30 -114" fill="#f0614f" stroke="#af4b42" stroke-width="6"/>'+
      '<path d="M-24 -45 Q-59 24 -18 78 L34 77 Q54 11 22 -45Z" fill="#f9cd67" stroke="#a97854" stroke-width="6"/>'+
      '<path d="M-24 -25 L-70 10 M30 -22 L83 -52 M-7 80 L-27 124 M27 79 L50 124" fill="none" stroke="#805c4a" stroke-width="17"/>'+
      '<circle cx="18" cy="-94" r="4"/><path d="M10 -75 Q19 -66 29 -76" fill="none" stroke="#714a42" stroke-width="4"/>')+
      el(693,376,.79,'<circle cy="-89" r="43" fill="#b68065" stroke="#885e51" stroke-width="6"/>'+
      '<path d="M-36 -111 Q-10 -149 36 -111" fill="none" stroke="#405d9c" stroke-width="18"/>'+
      '<path d="M-22 -45 Q-59 24 -18 78 L34 77 Q54 11 22 -45Z" fill="#91badc" stroke="#456e90" stroke-width="6"/>'+
      '<path d="M-24 -25 L-73 -55 M30 -22 L79 -20 M-7 80 L-27 124 M27 79 L50 124" fill="none" stroke="#805c4a" stroke-width="17"/>')+
      '<circle cx="535" cy="103" r="27" fill="#f9b553" stroke="#b07541" stroke-width="7"/>'+
      '<path d="M510 101 q29 -25 50 0 M532 77 q-18 34 0 53" fill="none" stroke="#ce894c" stroke-width="5"/>',
      'Two children playing ball on a grassy field');
    return wrap(base(),'Sunny illustrated learning scene');
  }
  const scenes={
    sounds:{theme:'garden',items:[
      ['apple',36,35],['ant',49,83],['acorn',77,53],['airplane',72,21],
      ['arrow',14,55],['axe',54,62],['alligator',77,82],['artist brush',53,37],
      ['bee',15,29],['dog',19,82]
    ],correct:['apple','ant','acorn','airplane','arrow','axe','alligator','artist brush']},
    shapes:{theme:'room',items:[
      ['clock',24,27],['plate',73,30],['wheel',26,74],['ball',74,76],['door',89,51],['book',53,84]
    ],correct:['clock','plate','wheel','ball']},
    squares:{theme:'square-room',items:[['window',22,28],['picture frame',70,28],['gift',36,79],['cushion',80,79],['clock',55,28],['ball',14,78]],correct:['window','picture frame','gift','cushion']},
    forest:{theme:'forest',items:[
      ['wind',49,13],['leaf',43,36],['climb',17,46],['bird',80,34],
      ['jump',53,67],['catch',68,54],['wolf',22,83],['water',78,83]
    ]}
  };
  const HIDDEN_CVC_WORDS=Object.freeze(['cub','fan','can','map','wig','bat','cap','cat','ham','bag']);
  const HIDDEN_CVC_DISTRACTORS=Object.freeze(['sun','dog','ship']);
  const longA=['gate','name','date','hot','rope','fish','rain','mail','kite','pet','page','paid','lake','wave','net','cake','name','rain','bake','sun','make','plane','cane','rain','tail'];
  const zebraLetters=['Z','Z','Z','F','X','S','Z','Z','X','F','Z','Z','Z','Z','S','Z','Z','S','Z','X','Z','Z','Z','Z','Z'];
  const route=[0,1,2,7,12,11,10,15,20,21,22,23,24];
  const branches=[[1,6],[6,11],[7,8],[12,13],[13,18],[15,16],[16,17],[17,18],[18,23],[3,8],[8,9]];
  const edges=[...route.slice(1).map((v,i)=>[route[i],v]),...branches];
  function available(grade,cat,level){
    return (grade==='k'&&['phonics','shape2'].includes(cat))||
      (grade==='g1' && (cat==='phonics'||cat==='match'||cat==='sent'||cat==='cvc'));
  }
  function make(grade,cat,level){
    if(!available(grade,cat,level))return null;
    let mode;
    if(grade==='k')mode=cat==='shape2'?(Math.random()<.5?'shapes':'squares'):(Math.random()<.55?'letters':'sounds');
    else mode=cat==='phonics'?'longa':cat==='match'?'forest':cat==='cvc'?'wordhunt':(Math.random()<.55?'sentence':'sequence');
    let text='', hint='Look at the picture!',theme='forest', answer='complete';
    if(mode==='letters'){text='Help the baby zebra! Follow the Z letters.';theme='savanna';}
    if(mode==='longa'){text='Follow the long A words to reach TAIL.';theme='forest';}
    if(mode==='sounds'){text='Find the eight pictures whose names start with the letter A.';theme='garden';}
    if(mode==='shapes'){text='Trace a circle, then find the four round things.';theme='room';}
    if(mode==='squares'){text='Trace a square, then find four square things.';theme='square-room';}
    if(mode==='wordhunt'){text='Find the ten hidden words in the garden.';theme='garden';}
    if(mode==='forest'){const words=['wind','leaf','climb','bird','jump','catch','wolf','water'];answer=words[Math.floor(Math.random()*words.length)];text='Find: '+answer.toUpperCase();theme='forest';}
    if(mode==='sentence'){const sentences=[
      ['The fox can ____.','jump','run','swim','fly','park'],
      ['The bird can ____.','fly','run','bark','dig','forest'],
      ['The fox is by the ____.','tree','milk','chair','rain','park'],
      ['The bird is in the ____.','tree','lake','chair','bag','forest']
    ];const s=sentences[Math.floor(Math.random()*sentences.length)];return {
      key:'ill-sentence-'+s[0],text:s[0].replace('____','_____'),say:'Which word fits?',main:'<div class="ia-stage ia-static-scene">'+illustration(s[5])+'</div>',mainClass:'ia-picture',
      options:[s[1],s[2],s[3],s[4]].sort(()=>Math.random()-.5).map(w=>({v:w,html:w})),answer:s[1],
      optClass:'opt-text',hint:{html:'Read the sentence and look at the picture.',say:'Look at the picture!'}
    };}
    if(mode==='sequence'){text='Read the fox story. Tap the four pictures in story order.';theme='park';}
    const voice = mode==='letters' ? ['Help the baby zebra reach its family.','Follow only the letter Z.'] :
      mode==='longa' ? 'Follow only words with the long A sound to reach TAIL.' :
      mode==='sounds' ? ['Tap all the pictures that start with','A'] :
      mode==='shapes' ? 'Tap all the circles you see.' :
      mode==='squares' ? 'Look at the picture!' :
      mode==='forest' ? ['Find the word.', answer] : mode==='wordhunt' ? 'Find the word.' : ['Read the story.','What happened first?'];
    return {key:'ill-'+mode+(mode==='forest'?'-'+answer:''),text,say:voice,
      parts: ['shapes','squares','sounds','sequence','wordhunt'].includes(mode) ? 4 : 1,
      main:'',options:[],answer,illustrated:{mode,theme},mainClass:'ia-picture',hint:{html:'Look at the picture and try again.',say:hint}};
  }
  function setFeedback(host,message){
    const out=host.querySelector('.ia-feedback'); if(out)out.textContent=message;
  }
  // Guided trace-then-find: a workbook shape is physically traced in sequence
  // before picture hotspots unlock. Samples are checked in stroke order so a
  // scribble, a single tap, or tracing a small fragment cannot complete the step.
  function mountShapeTrace(host,stage,kind,q,onComplete){
    const isSquare=kind==='squares';
    const path=isSquare?'M40 19 L120 19 L120 99 L40 99 L40 19':
      'M80 18 C121 18 122 98 80 98 C38 98 39 18 80 18';
    const box=document.createElement('div');
    box.className='ia-shape-step';
    box.innerHTML='<div class="ia-trace-heading"><b>1. Trace the '+(isSquare?'square':'circle')+'</b>'+
      '<small>Start at the green dot. Follow the dots with your finger.</small></div>'+
      '<svg class="ia-trace-shape" viewBox="0 0 160 120" role="img" aria-label="Trace the '+(isSquare?'square':'circle')+' from the green starting dot" tabindex="0">'+
      '<path class="ia-trace-guide" d="'+path+'" fill="none" stroke="#9ca9bc" stroke-width="8" stroke-dasharray="3 11" stroke-linecap="round"/>'+
      '<path class="ia-trace-ink" d="'+path+'" fill="none" stroke="#2fa86a" stroke-width="9" stroke-linecap="round"/>'+
      '<circle cx="'+(isSquare?'40':'80')+'" cy="'+(isSquare?'19':'18')+'" r="9" fill="#45bb79" stroke="#fff" stroke-width="3"/>'+
      '</svg>'+
      '<button type="button" class="ia-trace-assist" aria-label="Use a hint and continue to shape finding">Need tracing help? Continue with a hint</button>';
    host.insertBefore(box,stage);
    stage.classList.add('ia-shape-locked');
    const svg=box.querySelector('svg');
    const target=box.querySelector('.ia-trace-guide');
    const ink=box.querySelector('.ia-trace-ink');
    const length=target.getTotalLength();
    const samples=Array.from({length:64},(_,i)=>target.getPointAtLength(length*i/63));
    ink.style.strokeDasharray=String(length);
    ink.style.strokeDashoffset=String(length);
    let last=-1,active=false,finished=false;
    const location=e=>{
      const m=svg.getScreenCTM();if(!m)return null;
      const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
      return p.matrixTransform(m.inverse());
    };
    const finish=()=>{
      if(finished)return;
      finished=true;active=false;
      ink.style.strokeDashoffset='0';
      svg.classList.add('ia-trace-complete');
      box.querySelector('.ia-trace-assist').hidden=true;
      box.querySelector('.ia-trace-heading b').textContent='✓ Shape traced!';
      stage.classList.remove('ia-shape-locked');
      onComplete();
    };
    const move=e=>{
      if(!active||finished)return;
      const p=location(e);if(!p)return;
      if(last===-1){
        if(Math.hypot(p.x-samples[0].x,p.y-samples[0].y)>16)return;
        last=0;
      }
      let best=last,bestDistance=Infinity;
      // Only look forward a few samples; nearby segments on a corner cannot
      // allow skipping the entire outline.
      for(let i=last;i<=Math.min(last+7,samples.length-1);i++){
        const d=Math.hypot(p.x-samples[i].x,p.y-samples[i].y);
        if(d<bestDistance){bestDistance=d;best=i;}
      }
      if(bestDistance>17)return;
      last=best;
      ink.style.strokeDashoffset=String(length*(1-last/63));
      if(last>=61)finish();
    };
    svg.addEventListener('pointerdown',e=>{
      if(finished)return;
      active=true;
      try{svg.setPointerCapture(e.pointerId);}catch{}
      move(e);
    });
    svg.addEventListener('pointermove',move);
    svg.addEventListener('pointerup',()=>active=false);
    svg.addEventListener('pointercancel',()=>active=false);
    box.querySelector('.ia-trace-assist').addEventListener('click',()=>{
      // A motor-skill accommodation is a hint, never an unassisted success.
      q.hintShown=true;finish();
    });
  }
  function mount(q,host,actions){
    const mode=q.illustrated.mode;
    const info=scenes[mode];
    const stage=document.createElement('div');
    stage.className='ia-stage ia-'+mode;
    stage.innerHTML=illustration(q.illustrated.theme);
    host.append(stage);
    const note=document.createElement('p');note.className='ia-feedback';note.setAttribute('role','status');note.setAttribute('aria-live','polite');
    host.append(note);
    const progress=new Set();
    const correctAnswer=(button)=>actions.choose(q.answer,button);
    const good=msg=>{setFeedback(host,msg);if(typeof sfx!=='undefined')sfx.tap();};
    if(info){
      const required=mode==='forest'?[q.answer]:info.correct;
      const shapeTask=mode==='shapes'||mode==='squares';
      let traceReady=!shapeTask;
      info.items.forEach(([id,x,y])=>{
        const btn=document.createElement('button');
        btn.type='button';btn.className='ia-hotspot';btn.style.left=x+'%';btn.style.top=y+'%';
        btn.dataset.object=id;btn.setAttribute('aria-label','Select '+id);
        btn.innerHTML='<span class="ia-hotspot-ring" aria-hidden="true"></span>';
        if(shapeTask)btn.disabled=true;
        btn.addEventListener('click',()=>{
          if(btn.disabled)return;
          if(!required.includes(id)){actions.mistake();setFeedback(host,'Look closely. Try another picture.');return;}
          btn.disabled=true;btn.classList.add('ia-found');progress.add(id);
          if(progress.size===required.length)correctAnswer(btn);
          else good('You found '+progress.size+' of '+required.length+'. Keep looking!');
        });
        stage.append(btn);
      });
      if(shapeTask){
        mountShapeTrace(host,stage,mode,q,()=>{
          traceReady=true;
          stage.querySelectorAll('.ia-hotspot').forEach(button=>button.disabled=false);
          setFeedback(host,'Now find the '+info.correct.length+' matching shapes in the picture.');
        });
      }
      note.textContent=mode==='forest'?'Find the '+q.answer+'.':
        shapeTask?'Step 1: Trace the shape. Step 2: Find all four matching objects.':
        'Tap pictures to find all '+info.correct.length+'.';
    }else if(mode==='wordhunt'){
      const words=HIDDEN_CVC_WORDS.slice();
      const all=words.concat(HIDDEN_CVC_DISTRACTORS);
      const locations=[
        [15,26],[37,24],[60,24],[83,25],
        [15,52],[38,52],[61,52],[84,52],
        [27,80],[72,80],[49,79],[7,74],[93,76]
      ];
      const bank=document.createElement('div');
      bank.className='ia-wordhunt-bank';
      bank.innerHTML='<strong>Find and circle all ten:</strong> '+words.map(w=>'<span data-target="'+div(w)+'">'+div(w)+'</span>').join(' ');
      host.insertBefore(bank,stage);
      const found=document.createElement('div');
      found.className='ia-found-words';
      found.setAttribute('aria-live','polite');
      found.textContent='Found: 0 / 10';
      host.append(found);
      all.forEach((word,i)=>{
        const [x,y]=locations[i];
        const button=document.createElement('button');button.type='button';
        button.className='ia-hidden-word';button.dataset.word=word;
        button.textContent=word;button.setAttribute('aria-label','Find word '+word);
        button.style.left=x+'%';button.style.top=y+'%';
        button.addEventListener('click',()=>{
          if(button.disabled)return;
          if(!words.includes(word)){
            actions.mistake();setFeedback(host,'That word is not in the word bank. Try another.');return;
          }
          button.disabled=true;button.classList.add('ia-found');progress.add(word);
          bank.querySelectorAll('[data-target]').forEach(b=>{if(b.dataset.target===word)b.classList.add('ia-found');});
          found.textContent='Found: '+progress.size+' / '+words.length;
          if(progress.size===words.length)correctAnswer(button);
          else good('You found '+word+'! Look for the next word.');
        });
        stage.append(button);
      });
      note.textContent='Look carefully. Tap the small words hidden around the garden.';
    }else if(mode==='letters'||mode==='longa'){
      const labels=mode==='letters'?zebraLetters:longA;
      const valid=v=>mode==='letters'?v==='Z':/^(gate|name|date|rain|mail|paid|page|lake|cake|make|tail|wave|bake|plane|cane)$/.test(v);
      const linkSet=new Set(edges.flatMap(([a,b])=>[a+'-'+b,b+'-'+a]));
      const point=i=>[19+(i%5)*15.5,19+Math.floor(i/5)*15.1];
      const connections='<svg class="ia-connections" viewBox="0 0 800 480" preserveAspectRatio="none" aria-hidden="true">'+edges.map(([a,b])=>{
        const A=point(a),B=point(b);return '<line x1="'+(A[0]*8)+'" y1="'+(A[1]*4.8)+'" x2="'+(B[0]*8)+'" y2="'+(B[1]*4.8)+'" stroke="#ac764e" stroke-width="31" stroke-linecap="round"/>'+
        '<line x1="'+(A[0]*8)+'" y1="'+(A[1]*4.8)+'" x2="'+(B[0]*8)+'" y2="'+(B[1]*4.8)+'" stroke="#ead09b" stroke-width="23" stroke-linecap="round"/>';
      }).join('')+'</svg>';
      stage.insertAdjacentHTML('beforeend',connections);
      let trail=[];
      labels.forEach((label,i)=>{
        const [x,y]=point(i),button=document.createElement('button');
        button.type='button';button.className='ia-stone';button.style.left=x+'%';button.style.top=y+'%';
        button.textContent=label;button.dataset.cell=String(i);
        button.setAttribute('aria-label',(i===0?'Start, ':'')+label+(i===24?', finish':''));
        if(i===0)button.classList.add('ia-start');
        if(i===24)button.classList.add('ia-finish');
        button.addEventListener('click',()=>{
          const last=trail[trail.length-1];
          if(!trail.length && i!==0){setFeedback(host,'Start on the yellow stone.');return;}
          if(trail.length>1 && i===trail[trail.length-2]){
            const removed=trail.pop();stage.querySelector('[data-cell="'+removed+'"]').classList.remove('ia-visited');
            setFeedback(host,'Try another path.');return;
          }
          if(last===i)return;
          if(trail.length && (!linkSet.has(last+'-'+i)||trail.includes(i))){setFeedback(host,'Choose a connected stone, or go back one step.');return;}
          if(!valid(label)){actions.mistake();setFeedback(host,'Not the right '+(mode==='letters'?'letter':'vowel sound')+'. Try again.');return;}
          trail.push(i);button.classList.add('ia-visited');
          if(i===24){correctAnswer(button);return;}
          good('Good! '+trail.length+' stones. Keep going.');
        });
        stage.append(button);
      });
      note.textContent='Start at the yellow stone. You can go back to try a different path.';
      q.illHint=()=>setFeedback(host,'Follow connected '+(mode==='letters'?'Z letters':'long A words')+'. Backtrack at a dead end.');
    } else if(mode==='sequence'){
      const story=document.createElement('div');
      story.className='ia-story';
      story.innerHTML='<p>A fox saw an apple. The fox ran to the tree. It jumped. The apple fell down.</p>';
      host.insertBefore(story,stage);
      const cards=[
        {id:2,label:'Fox jumps',mark:'↗',desc:'The fox jumps.'},
        {id:0,label:'Fox sees apple',mark:'?',desc:'The fox sees an apple.'},
        {id:3,label:'Apple falls',mark:'↓',desc:'The apple falls.'},
        {id:1,label:'Fox runs',mark:'→',desc:'The fox runs to the tree.'}
      ];
      const tray=document.createElement('div');tray.className='ia-story-cards';
      cards.forEach(card=>{
        const b=document.createElement('button');b.type='button';b.className='ia-story-card';b.dataset.step=card.id;
        const x=card.id===0?45:card.id===1?82:card.id===2?85:51;
        const y=card.id===2?76:110;
        const motion=card.id===1?'<path d="M9 60 h30 M7 74 h23 M21 89 h24" stroke="#d49a56" stroke-width="5" stroke-linecap="round"/>':
          card.id===2?'<path d="M23 70 Q52 18 89 38" fill="none" stroke="#c47f55" stroke-width="5" stroke-dasharray="6 7"/>':
          card.id===3?'<path d="M140 44 V86 M132 73 l8 13 8 -13" stroke="#af5447" stroke-width="5" fill="none"/>':'';
        const appleY=card.id===3?80:24;
        b.innerHTML='<span class="ia-story-art"><svg viewBox="0 0 180 115" aria-hidden="true">'+
          '<rect width="180" height="115" rx="13" fill="#d9f2ca"/>'+
          '<path d="M0 83 Q70 62 180 86 V115 H0Z" fill="#8ac079"/>'+
          (card.id===0||card.id===1?'<path d="M140 90 V38" stroke="#8e6947" stroke-width="8"/>'+
            '<circle cx="140" cy="28" r="31" fill="#71af6b"/>':'')+
          '<circle cx="140" cy="'+appleY+'" r="17" fill="#e65350" stroke="#a94141" stroke-width="4"/>'+
          '<path d="M139 '+(appleY-16)+' q5 -11 17 -9" stroke="#427e3d" stroke-width="5" fill="none"/>'+
          fox(x,y,card.id===2?.29:.36)+motion+
          '</svg></span><b class="ia-event-number" aria-hidden="true">?</b>';
        b.setAttribute('aria-label',card.desc);
        b.addEventListener('click',()=>{
          if(b.disabled)return;
          const k=progress.size;if(card.id!==k){actions.mistake();setFeedback(host,'Read what happened next. Try again.');return;}
          b.disabled=true;b.classList.add('ia-found');b.querySelector('b').textContent=String(k+1);progress.add(card.id);
          if(progress.size===4)correctAnswer(b);
          else good('Good! What happens next?');
        });
        tray.append(b);
      });
      host.append(tray);
      note.textContent='Tap the picture for event 1, then 2, 3 and 4.';
      stage.classList.add('ia-small-scene');
      q.illHint=()=>setFeedback(host,'Read the story from the beginning. Start with what the fox saw.');
    }
    return stage;
  }
  const traceScene=(mode)=>illustration(['sports','garden','cafe','forest'].includes(mode)?mode:'park');
  const coverage=()=>({hiddenWords:HIDDEN_CVC_WORDS.slice(), a:scenes.sounds.correct.slice(), circles:scenes.shapes.correct.slice(), squares:scenes.squares.correct.slice(), forest:scenes.forest.items.map(x=>x[0])});
  return {available,make,mount,illustration,traceScene,coverage};
})();
