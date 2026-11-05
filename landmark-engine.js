/* Landmark facts and media are external, offline JSON and SVG files. */
const LANDMARKS = ContentData.get('landmarks','LANDMARKS');
const WORLD_ANIMALS = ContentData.get('landmarks','WORLD_ANIMALS');
const LM_NO_THE = new Set(ContentData.get('landmarks','LM_NO_THE'));
const LM_PLURAL = new Set(ContentData.get('landmarks','LM_PLURAL'));
const LM_ALSO = ContentData.get('landmarks','LM_ALSO');
const lmWhere = (id, name) =>
  `Where ${LM_PLURAL.has(id) ? 'are' : 'is'} ${LM_NO_THE.has(id) ? '' : 'the '}${name}?`;
function landmarkArt(id, cls = '') {
  const place = LANDMARKS.find(item => item[0] === id);
  if (!place) return '';
  const safeName = String(place[1]).replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeClass = String(cls).replace(/[^a-z0-9 _-]/gi,'');
  return `<span class="lm-box"><img class="lm-art ${safeClass}" src="assets/landmarks/${id}.svg" alt="${safeName}" loading="lazy" decoding="async"></span>`;
}
