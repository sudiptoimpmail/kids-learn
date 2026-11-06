'use strict';
// Illustrations for "Little Red Riding Hood" (library/red-riding-hood/book.json), one SVG per page.
// Every page is an action moment: characters face each other, stride, bend, leap and reach.
const P = require('./paint.cjs');
const F = require('./figures.cjs');
const { shelf, page, portrait, g, sky, hills, ground, tree, pine, flowers, grass, path, bird, sun, cloud, cottage, room, windowPane, bed, closet, table, basket, wash, blob, ink } = P;
const { red, mother, grandma, grandmaFace, woodcutter, wolf, wolfHead } = F;

const forest = (seed) => sky('#b9d8e8', '#f3ecd6') + sun(1010, 120) + cloud(260, 120, 1) + cloud(760, 90, 0.8) + hills(440) +
  pine(80, 520, 1.1, '#3f6b52') + pine(1140, 540, 1.2, '#406f55') + tree(230, 560, 1, 0) + tree(980, 570, 1.05, 1) + ground(560) + path() + grass(0, 600, 1200, 70, seed);
// foreground leaves framing a forest page, painted soft and dark
const frameLeaves = (seed) => blob(-30, 760, 170, 110, '#3f6b40', 0.55, 'soft') + blob(1230, 770, 180, 120, '#3f6b40', 0.5, 'soft') + grass(0, 720, 220, 30, seed + 40) + grass(980, 720, 220, 30, seed + 41);
const sleeper = (o) => g(24, -40, o.teeth ? 0.95 : 0.82, wolfHead(o));

const pages = {
  // Little Red skips down the path; far away, a wolf watches from behind a tree
  cover: page(forest(1) + tree(120, 640, 1.3, 2) + flowers(80, 650, 1040, 28, 2) + g(1010, 430, 0.42, wolfHead({ look: 'back' }), true) + tree(1070, 640, 1.3, 0) +
    g(560, 760, 1.55, red('skip', { basket: true })) + bird(420, 200) + bird(470, 230, 0.8) + frameLeaves(1), 3),
  // she runs out of her cottage, waving goodbye
  p01: page(sky('#c3dcea', '#f5eedb') + sun(160, 120) + cloud(900, 110) + hills(420) + pine(1000, 500, 1.3) + pine(1120, 520, 1.5, '#365e47') + pine(880, 520, 1.1) + tree(760, 540, 1, 1) +
    ground(520) + cottage(330, 600, 1.1, { smoke: true }) + grass(0, 620, 1200, 60, 2) + flowers(560, 640, 500, 16, 5) + g(700, 770, 1.3, red('wave'), true), 4),
  // Mother leans down and hands her the basket
  p02: page(room('#f2dcc0', '#c69a6b', { rugX: 640 }) + windowPane(860, 140, 240, 190) + shelf(80, 300) + table(250, 660, 0.95) +
    g(520, 770, 1.2, mother('give')) + g(790, 770, 1.25, red('reach'), true) + g(690, 560, 0.8, basket(0, 0, 1)), 5),
  // skipping along the forest path, birds flying overhead
  p03: page(forest(3) + flowers(60, 640, 1080, 30, 6) + g(600, 770, 1.45, red('skip', { basket: true })) + bird(360, 210) + bird(410, 250, 0.8) + bird(860, 180, 0.9) + frameLeaves(3), 6),
  // the wolf leans in to talk; Little Red stops and answers
  p04: page(forest(4) + tree(110, 670, 1.25, 1) + flowers(60, 660, 400, 12, 7) + g(380, 770, 1.35, red('talk', { basket: true })) + g(820, 760, 1.05, wolf('lean'), true) + frameLeaves(4), 7),
  // she bends to pick flowers while the wolf gallops off ahead
  p05: page(sky('#c0dbe9', '#f4eddb') + sun(1050, 110) + hills(430, '#b4cf9f', '#97bd84') + pine(1100, 500, 1) + tree(960, 520, 0.9, 1) + ground(520, '#a7c985') +
    flowers(60, 560, 1080, 60, 8) + flowers(100, 660, 900, 30, 9) + g(360, 770, 1.35, red('bend', { pick: true }), true) + g(900, 600, 0.6, wolf('run')) + grass(0, 600, 1200, 50, 8) + frameLeaves(5), 8),
  // up on his hind legs, the wolf knocks; Grandma sees him from the window
  p06: page(sky('#bdd7e6', '#f4ecd8') + hills(420) + pine(140, 520, 1.2) + pine(1080, 520, 1.2) + ground(540) + cottage(640, 650, 1.3, { face: true }) + g(545, 690, 0.95, wolf('up')) + grass(0, 640, 1200, 60, 9), 9),
  // nightcap on, the wolf leaps for the bed; Grandma peeks from the closet
  p07: page(room('#ead6bd', '#c69a6b', { picture: 470 }) + windowPane(120, 140, 200, 170) + closet(1040, 600, 1, true) + bed(600, 650, 1.1, '#7da3c9') + g(330, 520, 0.85, wolf('leap', { nightcap: true })), 10),
  // Little Red walks in with flowers; the wolf in bed turns his big ears to her
  p08: page(room('#ead6bd', '#c69a6b', { picture: 440 }) + windowPane(120, 140, 200, 170) + closet(1080, 600, 0.9, true) + bed(460, 650, 1.1, '#7da3c9', sleeper({ nightcap: true, bigEars: true })) + g(860, 770, 1.35, red('walk', { flowers: true }), true), 11),
  // big teeth! Little Red steps back with her hands up
  p09: page(room('#ead6bd', '#c69a6b', { picture: 440 }) + bed(470, 650, 1.15, '#7da3c9', sleeper({ nightcap: true, teeth: true })) + g(880, 770, 1.35, red('back'), true), 12),
  // the woodcutter strides in; the wolf leaps out of the window
  p10: page(room('#ead6bd', '#c69a6b', { rugX: 450 }) + windowPane(800, 120, 280, 240) + g(960, 330, 0.5, wolf('leap')) + bed(1000, 660, 0.7, '#7da3c9') + g(170, 780, 1.2, red('back')) + g(470, 780, 1.25, woodcutter('stride')), 13),
  // Grandma hugs Little Red; the woodcutter shares the bread
  p11: page(room('#f2dcc0', '#c69a6b', { picture: 160 }) + windowPane(500, 120, 220, 170) + shelf(900, 300) + table(640, 640, 1.2) + blob(600, 160, 220, 90, '#f7d98a', 0.25, 'soft') +
    g(330, 780, 1.2, grandma('hug')) + g(540, 780, 1.25, red('hug'), true) + g(940, 780, 1.15, woodcutter('eat'), true), 14),
};
const questions = {
  'q-red': portrait(g(200, 390, 1.15, red('stand'))),
  'q-blue': portrait(g(200, 390, 1.15, red('stand').replace(/#c62f2a/g, '#3f6fb5').replace(/#7d1714/g, '#24467a').replace(/#ef7d66|#f07a64/g, '#9cc0ee'))),
  'q-yellow': portrait(g(200, 390, 1.15, red('stand').replace(/#c62f2a/g, '#e9b72f').replace(/#7d1714/g, '#a87a12').replace(/#ef7d66|#f07a64/g, '#f7dc8a'))),
  'q-wolf': portrait(g(196, 330, 0.66, wolf('stand')), '#d6dbe2'),
  'q-grandma': portrait(g(200, 390, 1.0, grandma('stand')), '#e2d4ea'),
  'q-woodcutter': portrait(g(200, 392, 0.92, woodcutter('stand')), '#efd2c8'),
  'q-mother': portrait(g(200, 392, 1.0, mother('stand')), '#d5e6d6'),
};
module.exports = { pages, questions };
