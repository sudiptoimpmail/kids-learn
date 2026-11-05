/* Landmark facts and media are external, offline JSON and SVG files. */
const LANDMARKS = ContentData.get('landmarks','LANDMARKS');
const WORLD_ANIMALS = ContentData.get('landmarks','WORLD_ANIMALS');
const LM_NO_THE = new Set(ContentData.get('landmarks','LM_NO_THE'));
const LM_PLURAL = new Set(ContentData.get('landmarks','LM_PLURAL'));
const LM_ALSO = ContentData.get('landmarks','LM_ALSO');
const lmWhere = (id, name) =>
  `Where ${LM_PLURAL.has(id) ? 'are' : 'is'} ${LM_NO_THE.has(id) ? '' : 'the '}${name}?`;
const LANDMARK_PHOTO_IDS = new Set(ContentData.get('landmark-photos','ids'));
// Never use a rough cartoon as an exact photographic-recognition exercise.
// Add only reviewed, locally bundled real photographs to this allowlist.
const landmarkHasPhoto = id => LANDMARK_PHOTO_IDS.has(id);
function landmarkArt(id, cls = '') {
  const place = LANDMARKS.find(item => item[0] === id);
  if (!place) return '';
  const safeName = String(place[1]).replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeClass = String(cls).replace(/[^a-z0-9 _-]/gi,'');
  const photo = landmarkHasPhoto(id);
  const src = photo ? `assets/landmark-photos/${id}.webp` : `assets/landmarks/${id}.svg`;
  const alt = photo ? safeName + ' in a real photograph' : 'An artist illustration of ' + safeName;
  return `<span class="lm-box ${photo ? 'lm-real-photo' : 'lm-illustration'}"><img class="lm-art ${safeClass}" src="${src}" alt="${alt}" loading="lazy" decoding="async">${photo ? '' : '<small class="lm-art-note">Illustration</small>'}</span>`;
}
