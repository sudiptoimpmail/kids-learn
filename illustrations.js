/* Offline learning illustrations: 84 licensed CC BY 4.0 Twemoji SVGs.
   16 original photographs remain separately available from photos.js.
   https://github.com/twitter/twemoji/blob/master/LICENSE-GRAPHICS */
const ILLUSTRATION_GROUPS = Object.freeze({
  animals: Object.freeze(["lion","giraffe","zebra","panda","koala","fox","bear","monkey","frog","turtle","owl","penguin"]),
  nature: Object.freeze(["tree","cactus","mushroom","rainbow","cloud","sun","moon","star","leaf","snowflake","volcano","ocean"]),
  transport: Object.freeze(["bicycle","bus","train","rocket","taxi","sailboat","ship","fire_engine","police_car","tractor","scooter","ambulance"]),
  food: Object.freeze(["apple","banana","grapes","orange","strawberry","pineapple","watermelon","cherries","peach","lemon","pear","carrot"]),
  objects: Object.freeze(["books","pencil","scissors","backpack","clock","key","umbrella","balloon","kite","gift","toothbrush","soccer_ball"]),
  places: Object.freeze(["mountain","tent","house","school","hospital","slide","bridge","castle","globe","map","compass","camera"]),
  science: Object.freeze(["microscope","telescope","magnet","robot","lightbulb","battery","gear","test_tube","dna","atom","satellite","comet"])
});
const ILLUSTRATION_NAMES = Object.freeze(Object.values(ILLUSTRATION_GROUPS).flat());
const ILLUSTRATION_SET = new Set(ILLUSTRATION_NAMES);
const VISUAL_NAMES = Object.freeze([...PHOTO_NAMES, ...ILLUSTRATION_NAMES]);
function visualPath(name) {
  if (PHOTO_SET.has(name)) return 'assets/photos/' + name + '.jpg';
  if (ILLUSTRATION_SET.has(name)) return 'assets/illustrations/' + name + '.svg';
  return '';
}
function visualImage(name, cls = 'learning-visual') {
  const path = visualPath(name);
  if (!path) return '';
  return '<img class="' + cls + '" src="' + path + '" alt="' +
    name.replace(/_/g,' ') + '" loading="lazy" decoding="async">';
}
function illustrationGroup(name) {
  return Object.values(ILLUSTRATION_GROUPS).find(group => group.includes(name)) || null;
}
function visualGroup(name) {
  return PHOTO_SET.has(name) ? photoGroup(name) : illustrationGroup(name);
}
const ILLUSTRATION_PUZZLE = Object.freeze(ILLUSTRATION_NAMES.map(name => ({
  id: 'illustration-' + name, name: name.replace(/_/g, ' ').replace(/\b\w/g, c=>c.toUpperCase()),
  art: name, vb: 200
})));
