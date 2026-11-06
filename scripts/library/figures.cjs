'use strict';
/* Posable storybook figures, drawn in profile (facing right; flip a group to face left).
   Each figure is a small skeleton (hips, knees, shoulders, elbows, neck) so pages can show
   action: striding, skipping, bending, reaching, leaning, leaping. Painted with layered
   glazes: a base wash, a shadow glaze on the side away from the light (upper left), and a
   lifted highlight. */
const { wash, blob, ink, dot, g, flowers, basket, apple, bread } = require('./paint.cjs');

let uid = 0;
const R = Math.PI / 180;
const at = (p, len, deg) => [p[0] + Math.sin(deg * R) * len, p[1] + Math.cos(deg * R) * len];   // 0° = straight down, + = forward
const pt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
// a glazed shape: base colour, shadow glaze shifted away from the light, a soft highlight
function glaze(d, base, shadowC, o = {}) {
  const id = 'c' + (++uid);
  const sx = o.sx == null ? 7 : o.sx, sy = o.sy == null ? 8 : o.sy;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>` + wash(d, base, o.a || 0.95) +
    `<g clip-path="url(#${id})"><g transform="translate(${sx} ${sy})">${wash(d, 'none', 0)}</g>` +
    `<path d="${d}" transform="translate(${-sx * 2.2} ${-sy * 2.2})" fill="none" stroke="${shadowC}" stroke-width="${o.sw || 26}" stroke-opacity="0.4" filter="url(#wc)"/>` +
    (o.hi ? `<path d="${d}" transform="translate(${sx * 1.6} ${sy * 1.6})" fill="none" stroke="${o.hi}" stroke-width="${(o.sw || 26) * 0.6}" stroke-opacity="0.35" filter="url(#soft)"/>` : '') + '</g>';
}
// a limb: two segments as a soft painted stroke, darker underside
const limb = (a, b, c, w, col, shade) =>
  ink(`M${pt(a)}L${pt(b)}L${pt(c)}`, w, col, 0.97) + ink(`M${pt([a[0] + w * 0.18, a[1]])}L${pt([b[0] + w * 0.18, b[1]])}L${pt([c[0] + w * 0.18, c[1]])}`, w * 0.35, shade, 0.35);

/* ---------- a person ---------- */
// spec: { leg:[thigh, shin], torso, arm:[upper, fore], headR, legs:{near:[hip,knee], far:[hip,knee]}, arms:{near:[sh,el], far:[sh,el]},
//         lean, headTilt, colors, skirt, draw:{ head(pos, tilt), cape(neck, hip, flutter), hold(handNear, handFar) } }
function person(s) {
  const [th, sh] = s.leg, [ua, fa] = s.arm, lean = s.lean || 0;
  const hip = [0, 0];
  const legPts = (hk) => { const k = at(hip, th, hk[0]); const f = at(k, sh, hk[0] - hk[1]); return [hip, k, f]; };
  const ln = legPts(s.legs.near), lf = legPts(s.legs.far);
  const neck = at(hip, -s.torso, -lean);          // up the torso, tilted forward by lean
  const shoulder = at(neck, 12, -lean);
  const armPts = (se) => { const e = at(shoulder, ua, se[0]); const h = at(e, fa, se[0] + se[1]); return [shoulder, e, h]; };
  const an = armPts(s.arms.near), af = armPts(s.arms.far);
  const head = at(neck, -s.headR * 0.95, -lean - (s.headTilt || 0) * 0.3);
  const C = s.colors;
  const footY = Math.max(ln[2][1], lf[2][1]) + 8;
  const shoe = (f, hk) => { const ang = -(hk[0] - hk[1]) * 0.3; return `<g transform="translate(${pt(f)}) rotate(${ang})">${wash('M-8 -6Q-10 6 2 7H20Q24 0 14 -6Z', C.shoe, 0.95)}</g>`; };
  let out = '';
  out += blob(0, footY - 2, 60, 9, '#3e4a30', 0.22, 'soft').replace(`cx="0" cy="${footY - 2}"`, `cx="${(ln[2][0] + lf[2][0]) / 2}" cy="${footY - 2}"`);
  // far side first
  out += limb(...af, s.arm[0] * 0.42, C.sleeveFar || C.sleeve, C.shade) + blob(af[2][0], af[2][1], s.handR || 8, s.handR || 8, C.skinD || '#e8b896', 0.95, 'skin');
  out += limb(...lf, s.legW || 14, C.legsFar || C.legs, C.shade) + shoe(lf[2], s.legs.far);
  if (s.draw.cape) out += s.draw.cape(neck, hip, s);
  // torso
  const tw = s.torsoW || 26;
  const n2 = at(neck, tw, lean + 90), n1 = at(neck, tw, lean - 90), h2 = at(hip, tw + 4, lean + 90), h1 = at(hip, tw + 4, lean - 90);
  out += glaze(`M${pt(n1)}Q${pt(at(neck, -6, lean))} ${pt(n2)}L${pt(h2)}L${pt(h1)}Z`, C.top, C.topD, { sx: -5, sy: 4, sw: 18, hi: '#ffffff' });
  out += limb(...ln, s.legW || 14, C.legs, C.shade) + shoe(ln[2], s.legs.near);
  if (s.skirt) out += s.skirt(hip, ln, lf, s);
  if (s.draw.apron) out += s.draw.apron(neck, hip, s);
  out += s.draw.head(head, s.headTilt || 0, s);
  out += limb(...an, s.arm[0] * 0.46, C.sleeve, C.shade) + blob(an[2][0], an[2][1], s.handR || 8.5, s.handR || 8.5, C.skin, 0.97, 'skin');
  if (s.draw.hold) out += s.draw.hold(an[2], af[2], s);
  return `<g transform="translate(0 ${(-footY).toFixed(1)})">${out}</g>`;
}

/* ---------- heads in profile (facing right) ---------- */
const SKIN = '#f6d1b2', SKIN_D = '#e2ab8c', CHEEK = '#ee8f80';
function profileFace(r, o = {}) {
  const mouth = o.open ? `${wash(`M${r * 0.55} ${r * 0.38}q8 6 14 -2q-6 -6 -14 2z`, '#a8443e', 0.95)}` : ink(`M${r * 0.48} ${r * 0.36}q8 5 15 -1`, 2, '#6a3a2a', 0.85);
  // a round face turned to the right: solid skin, a soft shadow on the far side, a small nose and chin
  return blob(0, 0, r, r * 1.02, SKIN, 0.98, 'skin') + wash(`M${-r * 0.2} ${-r}A${r} ${r * 1.02} 0 0 0 ${-r * 0.2} ${r}Q${-r * 0.75} 0 ${-r * 0.2} ${-r}Z`, SKIN_D, 0.4, 'skin') +
    blob(r * 0.98, r * 0.02, r * 0.16, r * 0.14, SKIN, 0.98, 'skin') + ink(`M${r * 1.0} ${r * 0.1}q${r * 0.12} 0 ${r * 0.08} -${r * 0.14}`, 1.4, '#c58a6e', 0.6) +
    blob(r * 0.42, r * 0.28, r * 0.24, r * 0.16, CHEEK, 0.45, 'skin') +
    (o.wide ? blob(r * 0.5, -r * 0.12, 5.5, 6.5, '#ffffff', 0.95) + dot(r * 0.54, -r * 0.1, 3.4) : dot(r * 0.5, -r * 0.12, 3.6) + ink(`M${r * 0.38} ${-r * 0.32}q7 -4 13 0`, 1.6, '#5a3a2a', 0.7)) + mouth +
    '';
}
// Little Red's head with hood (o.hoodDown not used: she keeps her hood up)
function redHead(p, tilt, s) {
  const r = 34;
  const hood = glaze(`M${-r * 1.35} ${r * 1.1}Q${-r * 1.6} ${-r * 0.6} ${-r * 0.4} ${-r * 1.38}Q${r * 0.7} ${-r * 1.55} ${r * 1.05} ${-r * 0.5}Q${r * 0.7} ${-r * 1.0} ${-r * 0.1} ${-r * 1.0}Q${-r * 1.0} ${-r * 0.8} ${-r * 0.9} ${r * 0.4}Q${-r * 0.6} ${r * 0.9} ${-r * 0.2} ${r * 1.05}Q${-r * 0.8} ${r * 1.3} ${-r * 1.35} ${r * 1.1}Z`, '#c62f2a', '#7d1714', { sx: -6, sy: 5, sw: 22, hi: '#f07a64' });
  const hair = wash(`M${-r * 0.95} ${r * 0.2}Q${-r * 1.05} ${-r * 0.75} ${-r * 0.1} ${-r * 0.98}Q${r * 0.7} ${-r * 0.95} ${r * 0.85} ${-r * 0.35}Q${r * 0.4} ${-r * 0.55} ${-r * 0.1} ${-r * 0.45}Q${-r * 0.55} ${-r * 0.2} ${-r * 0.5} ${r * 0.4}Z`, '#6e3f22', 0.96) +
    ink(`M${-r * 0.6} ${-r * 0.6}q10 6 8 22M${-r * 0.2} ${-r * 0.8}q8 8 4 20`, 1.4, '#3f2212', 0.5);
  return `<g transform="translate(${pt(p)}) rotate(${tilt})">${hood}${profileFace(r, s.face || {})}${hair}${blob(-r * 0.15, r * 1.05, 9, 6, '#e8c25a', 0.9)}</g>`;
}
function redCape(neck, hip, s) {
  const f = s.flutter || 0;                        // 0 = hanging, 1 = flying out behind
  const hem = at(hip, 70, -(s.lean || 0) - 10);
  const back = [neck[0] - 30 - f * 70, neck[1] + 40 - f * 30], backHem = [hip[0] - 46 - f * 110, hip[1] + 60 - f * 50];
  const d = `M${pt([neck[0] + 4, neck[1] - 6])}C${pt(back)} ${pt([backHem[0] + 10, backHem[1] - 50])} ${pt(backHem)}` +
    `Q${pt([backHem[0] + 30 + f * 20, backHem[1] + 18 - f * 10])} ${pt([hem[0] - 20, hem[1] + 8])}Q${pt([hem[0] + 4, hem[1] - 20])} ${pt([hip[0] + 18, hip[1] - 20])}L${pt([neck[0] + 16, neck[1] + 4])}Z`;
  return glaze(d, '#c62f2a', '#7d1714', { sx: -8, sy: 6, sw: 30, hi: '#ef7d66' }) +
    ink(`M${pt([backHem[0] + 20, backHem[1] - 30])}q${20 + f * 20} -10 ${40 + f * 30} 6`, 1.6, '#6a1210', 0.4);
}
function redSkirt(hip, ln, lf, s) {
  const spread = Math.abs(ln[1][0] - lf[1][0]);
  const d = `M${hip[0] - 22} ${hip[1] - 26}L${hip[0] + 22} ${hip[1] - 26}L${hip[0] + 34 + spread * 0.35} ${hip[1] + 42}Q${hip[0]} ${hip[1] + 50} ${hip[0] - 34 - spread * 0.35} ${hip[1] + 42}Z`;
  return glaze(d, '#4f74ab', '#2e4a78', { sx: -5, sy: 4, sw: 18, hi: '#a8c2e6' });
}
function redApron(neck, hip, s) {
  const a = at(neck, 18, (s.lean || 0) + 180), b = at(hip, -6, s.lean || 0);
  return wash(`M${pt([a[0] + 2, a[1] + 6])}L${pt([a[0] + 20, a[1] + 8])}L${pt([b[0] + 30, b[1] + 38])}Q${pt([b[0] + 12, b[1] + 44])} ${pt([b[0] - 4, b[1] + 38])}Z`, '#eee3cf', 0.8, 'soft') +
    ink(`M${pt([b[0] - 4, b[1] + 38])}q5 5 10 0q5 5 10 0q5 5 10 0`, 1.3, '#9a8a7a', 0.6);
}
// poses for Little Red; every pose faces right
const RED_POSES = {
  stand: { legs: { near: [4, 0], far: [-4, 0] }, arms: { near: [10, -20], far: [-10, -10] }, lean: 0, flutter: 0.1 },
  walk: { legs: { near: [22, 10], far: [-20, 18] }, arms: { near: [-26, -24], far: [30, -30] }, lean: 6, flutter: 0.45 },
  skip: { legs: { near: [44, 70], far: [-24, 10] }, arms: { near: [-40, -60], far: [70, -40] }, lean: 8, flutter: 0.85, lift: 22 },
  wave: { legs: { near: [10, 4], far: [-10, 6] }, arms: { near: [160, 30], far: [-10, -10] }, lean: 0, flutter: 0.2 },
  bend: { legs: { near: [80, 85], far: [5, 95] }, arms: { near: [35, 15], far: [60, -40] }, lean: 26, flutter: 0.2, headTilt: 10 },   // kneeling, reaching for a flower
  reach: { legs: { near: [10, 4], far: [-12, 8] }, arms: { near: [80, -10], far: [70, -14] }, lean: 6, flutter: 0.15 },
  talk: { legs: { near: [6, 2], far: [-6, 4] }, arms: { near: [20, -60], far: [-10, -10] }, lean: 2, flutter: 0.1, headTilt: -4 },
  back: { legs: { near: [-16, 4], far: [14, 6] }, arms: { near: [140, 40], far: [150, 30] }, lean: -14, flutter: 0.4, face: { open: true, wide: true } },
  hug: { legs: { near: [8, 2], far: [-6, 4] }, arms: { near: [86, 40], far: [80, 46] }, lean: 10, flutter: 0.1, headTilt: 6 },
};
function red(pose = 'stand', o = {}) {
  const P = RED_POSES[pose];
  const fig = person({
    leg: [46, 44], torso: 92, arm: [38, 34], headR: 34, torsoW: 22, legW: 13, handR: 8,
    legs: P.legs, arms: P.arms, lean: P.lean, headTilt: P.headTilt || 0, flutter: P.flutter, face: o.face || P.face,
    colors: { top: '#4f74ab', topD: '#2e4a78', sleeve: '#4a6ea4', sleeveFar: '#3d5d8f', legs: '#34344c', legsFar: '#26263a', shoe: '#3b2a22', skin: SKIN, skinD: SKIN_D, shade: '#1e2a40' },
    skirt: redSkirt,
    draw: {
      head: redHead, cape: redCape, apron: redApron,
      hold: (hn, hf) => (o.basket ? g(hn[0] + 4, hn[1] + 30, 0.62, basket(0, 0, 1)) : '') + (o.flowers ? g(hn[0] - 4, hn[1] - 6, 1, flowers(-12, -34, 22, 6, 9)) : '') + (o.pick ? g(hn[0] + 6, hn[1] + 30, 1, flowers(-14, -10, 30, 4, 4)) : ''),
    },
  });
  return P.lift ? g(0, -P.lift, 1, fig) : fig;
}

/* ---------- grown-ups ---------- */
function bigHead(r, o) {
  return (o.back || '') + profileFace(r, o.face || {}) + (o.front || '');
}
function mother(pose = 'give') {
  const P = { give: { legs: { near: [10, 6], far: [-8, 6] }, arms: { near: [62, -6], far: [48, -14] }, lean: 12 }, stand: { legs: { near: [4, 0], far: [-4, 0] }, arms: { near: [10, -16], far: [-8, -10] }, lean: 0 } }[pose];
  return person({ leg: [58, 56], torso: 118, arm: [48, 44], headR: 36, torsoW: 28, legW: 14, handR: 9, legs: P.legs, arms: P.arms, lean: P.lean,
    colors: { top: '#5f8f6a', topD: '#355c40', sleeve: '#5a8a64', sleeveFar: '#456f50', legs: '#3b2a22', shoe: '#3b2a22', skin: SKIN, skinD: SKIN_D, shade: '#22382a' },
    skirt: (hip, ln, lf) => glaze(`M${hip[0] - 26} ${hip[1] - 30}H${hip[0] + 26}L${hip[0] + 44} ${hip[1] + 96}Q${hip[0]} ${hip[1] + 104} ${hip[0] - 44} ${hip[1] + 96}Z`, '#5f8f6a', '#355c40', { sx: -5, sy: 4, sw: 20, hi: '#a9cdb0' }) +
      wash(`M${hip[0] + 4} ${hip[1] - 26}H${hip[0] + 30}L${hip[0] + 42} ${hip[1] + 88}H${hip[0] + 8}Z`, '#f6f0e4', 0.95),
    draw: { head: (p, t) => `<g transform="translate(${pt(p)}) rotate(${t})">${bigHead(36, { back: blob(-26, -26, 22, 20, '#6b4a2e', 0.96) + wash('M-38 10Q-44 -40 0 -40Q34 -40 34 -20Q10 -26 -14 -14Q-26 0 -24 20Z', '#6b4a2e', 0.96) })}</g>` } });
}
function grandma(pose = 'hug') {
  const P = { hug: { legs: { near: [6, 2], far: [-6, 2] }, arms: { near: [84, 44], far: [76, 50] }, lean: 14 }, stand: { legs: { near: [4, 0], far: [-4, 0] }, arms: { near: [10, -16], far: [-8, -10] }, lean: 4 } }[pose];
  return person({ leg: [50, 50], torso: 108, arm: [44, 40], headR: 36, torsoW: 30, legW: 14, handR: 9, legs: P.legs, arms: P.arms, lean: P.lean,
    colors: { top: '#8a6aa8', topD: '#5a4278', sleeve: '#86679f', sleeveFar: '#6c5384', legs: '#3b2a22', shoe: '#3b2a22', skin: SKIN, skinD: SKIN_D, shade: '#2e2240' },
    skirt: (hip) => glaze(`M${hip[0] - 28} ${hip[1] - 30}H${hip[0] + 28}L${hip[0] + 42} ${hip[1] + 92}Q${hip[0]} ${hip[1] + 100} ${hip[0] - 42} ${hip[1] + 92}Z`, '#8a6aa8', '#5a4278', { sx: -5, sy: 4, sw: 20, hi: '#c8b2dc' }),
    draw: { head: (p, t) => `<g transform="translate(${pt(p)}) rotate(${t})">${grandmaFace(36)}</g>`,
      apron: (neck, hip) => wash(`M${neck[0] - 24} ${neck[1] + 6}Q${neck[0] + 4} ${neck[1] + 30} ${neck[0] + 30} ${neck[1] + 8}L${neck[0] + 26} ${neck[1] + 34}Q${neck[0]} ${neck[1] + 50} ${neck[0] - 26} ${neck[1] + 34}Z`, '#c27aa0', 0.9) } });
}
function grandmaFace(r, o = {}) {
  return blob(-r * 0.7, -r * 0.8, r * 0.5, r * 0.42, '#e9e6e1', 0.97) + wash(`M${-r * 1.05} ${r * 0.3}Q${-r * 1.15} ${-r * 0.9} 0 ${-r * 1.0}Q${r * 0.8} ${-r * 0.95} ${r * 0.85} ${-r * 0.3}Q${r * 0.3} ${-r * 0.6} ${-r * 0.4} ${-r * 0.4}Q${-r * 0.7} 0 ${-r * 0.6} ${r * 0.5}Z`, '#ebe8e3', 0.96) +
    profileFace(r, o) + ink(`M${r * 0.3} ${-r * 0.14}a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M${r * 0.3} ${-r * 0.14}h-26`, 1.8, '#6a5a4a', 0.85);
}
function woodcutter(pose = 'stride') {
  const P = { stride: { legs: { near: [28, 12], far: [-26, 20] }, arms: { near: [88, 4], far: [-30, -30] }, lean: 12 }, stand: { legs: { near: [6, 0], far: [-6, 2] }, arms: { near: [30, -70], far: [-10, -10] }, lean: 2 }, eat: { legs: { near: [6, 0], far: [-6, 2] }, arms: { near: [40, -120], far: [10, -20] }, lean: 0 } }[pose];
  return person({ leg: [64, 62], torso: 126, arm: [54, 48], headR: 38, torsoW: 36, legW: 18, handR: 11, legs: P.legs, arms: P.arms, lean: P.lean,
    colors: { top: '#b8402f', topD: '#6e1f15', sleeve: '#b33c2c', sleeveFar: '#8a2e22', legs: '#5a4a3a', legsFar: '#43372b', shoe: '#2f241c', skin: SKIN, skinD: SKIN_D, shade: '#2a1a14' },
    draw: {
      head: (p, t) => `<g transform="translate(${pt(p)}) rotate(${t})">${profileFace(38)}${wash('M-30 4Q-30 52 14 52Q40 46 36 20Q20 30 -4 22Q-20 14 -30 4Z', '#7a4a2a', 0.96)}${glaze('M-44 -18Q-42 -62 4 -64Q42 -60 44 -20Z', '#4f7a4a', '#2e4a2a', { sx: -4, sy: 4, sw: 14 })}${wash('M-58 -22H54V-10H-58Z', '#3f6a3a', 0.96)}</g>`,
      apron: (neck, hip, s) => ink(`M${pt([neck[0] - 20, neck[1] + 40])}L${pt([hip[0] + 30, hip[1] - 30])}M${pt([neck[0] - 26, neck[1] + 80])}L${pt([hip[0] + 30, hip[1] - 4])}M${pt([neck[0] + 4, neck[1] + 6])}L${pt([hip[0] + 6, hip[1] - 4])}`, 3, '#4a1e18', 0.4),
      hold: (hn) => (pose === 'eat' ? bread(hn[0] + 6, hn[1] + 4, 0.8) : '') } });
}

/* ---------- the wolf (side view, facing right) ---------- */
const FUR = '#7c8592', FUR_D = '#4c5360', FUR_L = '#c6ccd4';
function wolfHead(o = {}) {
  const ear = (dx, big) => glaze(`M${dx - 12} -30L${dx + (big ? -6 : 0)} ${big ? -110 : -74}L${dx + 22} -34Z`, FUR, FUR_D, { sx: -3, sy: 3, sw: 10 }) + wash(`M${dx - 4} -34L${dx + (big ? -2 : 2)} ${big ? -92 : -62}L${dx + 14} -36Z`, '#e3aba0', 0.8);
  const jaw = o.teeth ? wash('M30 18Q74 46 118 22Q100 60 46 50Z', '#7a2a2a', 0.96) + wash('M44 22L50 34L56 24L62 36L68 26L74 38L80 27L86 38L92 27L98 36L104 25L110 33L114 24Z', '#ffffff', 0.98) + wash('M58 42L64 32L70 42L76 32L82 42L88 32L94 40Z', '#ffffff', 0.9)
    : ink('M40 22Q76 34 110 22', 2.2, '#2e3138', 0.8);
  return ear(-20, o.bigEars) + ear(6, o.bigEars) +
    glaze('M-46 20Q-62 -36 -10 -52Q34 -60 56 -30L128 -6Q140 8 126 20Q86 36 34 40Q-22 44 -46 20Z', FUR, FUR_D, { sx: -5, sy: 5, sw: 20, hi: '#dfe3e8' }) +
    wash('M30 14Q84 28 124 16Q108 36 44 38Z', FUR_L, 0.85) + dot(128, 6, 9, '#211c19') + jaw +
    blob(20, -20, 11, 10, '#ffffff', 0.96) + dot(o.look === 'back' ? 16 : 24, -19, 5.4, '#26201a') + ink('M8 -34q12 -6 26 0', 2, '#2e3138', 0.6) +
    ink('M-30 -40q8 -4 14 2M-36 -24q8 -4 14 2', 1.4, FUR_D, 0.5) +
    (o.nightcap ? wash('M-56 -36Q-10 -126 64 -56Q96 -80 118 -48Q60 -36 -56 -28Z', '#f7f3ea', 0.97) + blob(120, -50, 15, 15, '#f7f3ea', 0.97) + wash('M-60 -32Q0 -18 70 -40L68 -26Q0 -6 -58 -18Z', '#e0a0b0', 0.92) : '');
}
// pose: 'stand' | 'lean' | 'run' | 'up' (on hind legs) | 'leap'
function wolf(pose = 'stand', o = {}) {
  const P = {
    stand: { tilt: 0, head: [150, -160, 0], legs: [[-90, 0, 0], [-62, 0, -4], [70, 0, 4], [100, 0, 0]], tail: -20 },
    lean: { tilt: -6, head: [168, -130, 14], legs: [[-90, 0, -6], [-62, 0, 0], [72, 0, 10], [104, 0, 14]], tail: -10 },
    run: { tilt: 0, head: [160, -150, -4], legs: [[-110, 0, -50], [-80, 0, -30], [80, 0, 50], [110, 0, 36]], tail: -50 },
    leap: { tilt: -18, head: [160, -150, -12], legs: [[-110, 0, -60], [-84, 0, -48], [86, 0, 62], [112, 0, 58]], tail: -60 },
  }[pose];
  if (pose === 'up') {
    // upright on hind legs, front paw raised to knock
    return g(0, 0, 1, blob(0, 0, 70, 10, '#3e4a30', 0.22, 'soft') +
      ink('M-20 -10L-24 -120M14 -10L10 -120', 22, FUR, 0.96) + wash('M-44 0Q-40 -12 -16 -10V0ZM-2 0V-10Q20 -12 26 0Z', FUR_D, 0.9) +
      glaze('M-50 -110Q-70 -240 -10 -280Q50 -290 56 -220Q60 -150 40 -110Q0 -90 -50 -110Z', FUR, FUR_D, { sx: -5, sy: 5, sw: 24, hi: '#dfe3e8' }) +
      wash('M-10 -120Q24 -200 30 -250Q50 -190 36 -120Z', FUR_L, 0.6) +
      glaze('M-60 -130Q-130 -150 -150 -230Q-110 -180 -60 -160Z', FUR, FUR_D, { sx: -3, sy: 3, sw: 12 }) +
      ink('M20 -250Q70 -270 96 -300', 18, FUR, 0.96) + blob(98, -304, 12, 11, FUR_D, 0.95) + ink('M-10 -250Q30 -220 50 -190', 16, FUR_D, 0.85) +
      g(10, -300, 0.92, wolfHead(o)));
  }
  const [hx, hy, hrot] = P.head;
  const leg = ([x, y, ang], far) => { const top = [x, -70], knee = at(top, 40, ang), foot = at(knee, 36, ang * 0.4);
    return ink(`M${pt(top)}L${pt(knee)}L${pt(foot)}`, 18, far ? FUR_D : FUR, 0.96) + blob(foot[0] + 6, foot[1] + 2, 12, 6, FUR_D, 0.9); };
  const body = glaze('M-150 -70Q-160 -150 -40 -160Q90 -172 136 -122Q156 -70 116 -48Q0 -30 -116 -44Q-148 -48 -150 -70Z', FUR, FUR_D, { sx: -6, sy: 8, sw: 30, hi: '#dfe3e8' }) +
    wash('M-90 -56Q0 -40 96 -60Q66 -96 -60 -88Z', FUR_L, 0.6) +
    ink('M-100 -128q10 -8 20 0M-50 -138q10 -8 20 0M0 -142q10 -8 20 0M50 -136q10 -8 20 0M-70 -108q10 -6 20 0M30 -112q10 -6 20 0', 1.6, FUR_D, 0.45);
  const tail = `<g transform="translate(-140 -100) rotate(${P.tail})">${glaze('M0 0Q-90 -10 -120 -80Q-60 -50 0 -26Z', FUR, FUR_D, { sx: -3, sy: 3, sw: 14 })}${wash('M-104 -66Q-122 -82 -120 -80Q-100 -64 -88 -60Z', '#f2f2f2', 0.9)}</g>`;
  const neck = glaze(`M90 -150Q${hx - 20} ${hy - 40} ${hx} ${hy - 10}L${hx + 10} ${hy + 30}Q110 -70 80 -60Z`, FUR, FUR_D, { sx: -4, sy: 4, sw: 18 });
  const inner = (o.headOnly ? '' : leg(P.legs[1], true) + leg(P.legs[3], true) + tail + body + neck + leg(P.legs[0]) + leg(P.legs[2])) +
    `<g transform="translate(${hx} ${hy}) rotate(${hrot})">${wolfHead(o)}</g>`;
  const sh = o.headOnly ? '' : blob(0, 2, 160, 12, '#3e4a30', pose === 'leap' ? 0.12 : 0.22, 'soft');
  return sh + `<g transform="rotate(${P.tilt})">${inner}</g>`;
}

module.exports = { person, red, mother, grandma, grandmaFace, woodcutter, wolf, wolfHead, glaze, RED_POSES, redHead };
