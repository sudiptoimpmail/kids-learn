/* Real photographs from Wikimedia Commons (CC0 / public domain / CC BY / CC BY-SA), bundled locally.
   Licence and author of each picture: data/photo-credits.json and credits.html.
   Shared by reading, Pre-K recognition, and the short picture puzzles.
   A single stable path per picture lets the offline service worker precache every asset. */
const PHOTO_GROUPS = Object.freeze(ContentData.get('visuals', 'PHOTO_GROUPS'));
const PHOTO_NAMES = Object.freeze(Object.values(PHOTO_GROUPS).flat());
const PHOTO_SET = new Set(PHOTO_NAMES);
const PHOTO_PUZZLE = Object.freeze(ContentData.get('visuals','PHOTO_PUZZLE_NAMES').map(name => ({
  id: 'photo-' + name,
  name: name[0].toUpperCase() + name.slice(1),
  photo: name,
  vb: 200
})));
function photoImage(name, cls = 'learning-photo') {
  if (!PHOTO_SET.has(name)) return '';
  return '<img class="' + cls + '" src="assets/photos/' + name + '.jpg" alt="' + name + '" loading="lazy" decoding="async">';
}
function photoGroup(name) {
  return Object.values(PHOTO_GROUPS).find(group => group.includes(name)) || null;
}
