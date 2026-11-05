/* Original, locally bundled photo assets (AI-generated, no third-party image dependencies).
   Shared by reading, Pre-K recognition, and the short picture puzzles.
   A single stable path per picture lets the offline service worker precache every asset. */
const PHOTO_GROUPS = Object.freeze({
  animals: Object.freeze(['cat','dog','rabbit','duck','elephant','tiger','butterfly','horse']),
  flowers: Object.freeze(['sunflower','rose','tulip','daisy']),
  vehicles: Object.freeze(['car','airplane','helicopter','truck'])
});
const PHOTO_NAMES = Object.freeze(Object.values(PHOTO_GROUPS).flat());
const PHOTO_SET = new Set(PHOTO_NAMES);
const PHOTO_PUZZLE = Object.freeze(['cat','dog','rabbit','duck','butterfly','horse','sunflower','rose','tulip','car','airplane','helicopter'].map(name => ({
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
