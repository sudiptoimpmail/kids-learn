/* Offline learning illustrations: 84 licensed CC BY 4.0 Twemoji SVGs.
   16 original photographs remain separately available from photos.js.
   https://github.com/twitter/twemoji/blob/master/LICENSE-GRAPHICS */
const ILLUSTRATION_GROUPS = Object.freeze(ContentData.get('visuals', 'ILLUSTRATION_GROUPS'));
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
