/* Landmark facts and media are external, offline JSON and SVG files. */
const LANDMARKS = ContentData.get('landmarks','LANDMARKS');
const WORLD_ANIMALS = ContentData.get('landmarks','WORLD_ANIMALS');
const LM_NO_THE = new Set(ContentData.get('landmarks','LM_NO_THE'));
const LM_PLURAL = new Set(ContentData.get('landmarks','LM_PLURAL'));
const LM_ALSO = ContentData.get('landmarks','LM_ALSO');
const lmWhere = (id, name) =>
  `Where ${LM_PLURAL.has(id) ? 'are' : 'is'} ${LM_NO_THE.has(id) ? '' : 'the '}${name}?`;
const LANDMARK_DESCRIPTIONS = ContentData.get('landmarks','MEDIA_DESCRIPTIONS');
const LANDMARK_PHOTO_IDS = new Set(ContentData.get('landmark-photos','ids'));
const LANDMARK_ONLINE_PREVIEWS = ContentData.get('landmark-online-previews','records');
// Never use a rough cartoon as an exact photographic-recognition exercise.
// Add only reviewed, locally bundled real photographs to this allowlist.
const landmarkHasPhoto = id => LANDMARK_PHOTO_IDS.has(id);
function landmarkArt(id, cls = '') {
  const place = LANDMARKS.find(item => item[0] === id);
  if (!place) return '';
  // Screen-reader labels describe visual evidence without stating the
  // answer. Photo identification should not be solved by listening to alt text.
  const description = LANDMARK_DESCRIPTIONS[id];
  if (typeof description !== 'string' || !description.trim()) return '';
  const safeDescription = description.replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeClass = String(cls).replace(/[^a-z0-9 _-]/gi,'');
  const photo = landmarkHasPhoto(id);
  const src = photo ? `assets/landmark-photos/${id}.webp` : `assets/landmarks/${id}.svg`;
  const alt = (photo ? 'Photograph showing ' : 'Illustration showing ') + safeDescription;
  const preview = !photo && LANDMARK_ONLINE_PREVIEWS[id];
  // Answer options are themselves buttons: never nest an interactive photo
  // button inside them or let a preview tap submit an answer.
  const onlineControl = !safeClass.split(/\s+/).includes('small') &&
    preview && preview.mode === 'online-only' &&
    /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(preview.sourceUrl) &&
    /^[a-zA-Z0-9 ,()._-]+\.jpe?g$/i.test(preview.file)
    ? `<button type="button" class="lm-online-preview" data-landmark-id="${id}">View real photo (internet required)</button>` : '';
  return `<span class="lm-box ${photo ? 'lm-real-photo' : 'lm-illustration'}"><img class="lm-art ${safeClass}" src="${src}" alt="${alt}" loading="lazy" decoding="async">${photo ? '' : '<small class="lm-art-note">Illustration</small>'}${onlineControl}</span>`;
}

// Explicit opt-in avoids external requests during offline games or without consent.
document.addEventListener('click', event => {
  const button=event.target.closest?.('.lm-online-preview');
  if(!button) return;
  const id=button.dataset.landmarkId;
  const preview=LANDMARK_ONLINE_PREVIEWS[id];
  if(!preview || preview.mode!=='online-only' || !navigator.onLine) {
    button.textContent='Photo needs an internet connection';return;
  }
  const box=button.closest('.lm-box');
  const image=box?.querySelector('img.lm-art');
  if(!image) return;
  const local=image.getAttribute('src');
  // Repeated taps while loading must not start concurrent remote requests.
  button.disabled=true;
  const remote='https://commons.wikimedia.org/wiki/Special:FilePath/' +
    encodeURIComponent(preview.file) + '?width=640';
  image.onerror=()=>{
    image.onerror=null;image.src=local;
    button.textContent='Photo unavailable; illustration restored';
    button.disabled=false;
  };
  image.onload=()=>{
    image.alt='Photograph showing '+(LANDMARK_DESCRIPTIONS[id]||'a landmark');
    box.classList.remove('lm-illustration');box.classList.add('lm-real-photo');
    box.querySelector('.lm-art-note')?.remove();
    button.textContent='Photo loaded (online)';button.disabled=true;
    // Display attribution and a verifiable source link alongside the image.
    if (!box.querySelector('.lm-photo-credit')) {
      const credit=document.createElement('small');
      credit.className='lm-photo-credit';
      const link=document.createElement('a');
      link.href=preview.sourceUrl;
      link.target='_blank';link.rel='noopener noreferrer';
      link.textContent='Photo source and license';
      credit.append(document.createTextNode('Photo: '+preview.creator+' · '+preview.license+' · '),link);
      box.append(credit);
    }
  };
  image.src=remote;
  button.textContent='Loading photograph…';
});
