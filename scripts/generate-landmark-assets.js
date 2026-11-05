/* Build-only conversion of existing licensed and original landmark art to standalone SVG.
   Runtime reads these assets as files instead of embedding their paths inside JS. */
function buildLandmarkSvg(place, drawings, openmoji) {
  const [id,name,, , ,kind,emoji,bg] = place;
  const esc = text => String(text).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  if (kind === 'draw') {
    if (!drawings[id]) throw Error('Missing original art '+id);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"><title>${esc(name)}</title>${drawings[id]}</svg>`;
  }
  if (kind === 'om') {
    if (!openmoji[id]) throw Error('Missing OpenMoji artwork '+id);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" role="img"><title>${esc(name)}</title><rect width="72" height="72" fill="#dff2ff"/>${openmoji[id]}</svg>`;
  }
  // For landmarks without licensed drawings, a calm illustrated geography card.
  // Emoji is a graphic clue, not an official photograph of the landmark.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"><title>${esc(name)}</title><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#e4f6ff"/><stop offset="1" stop-color="${esc(bg||'#c3e9ff')}"/></linearGradient></defs><rect width="120" height="120" rx="12" fill="url(#sky)"/><circle cx="103" cy="21" r="11" fill="#ffe18a"/><path d="M0 90Q27 65 50 85Q82 61 120 82V120H0Z" fill="#91cfa0" opacity=".7"/><path d="M0 105Q36 91 67 104Q93 89 120 103V120H0Z" fill="#6caeb2" opacity=".7"/><text x="60" y="68" font-size="53" text-anchor="middle" dominant-baseline="middle">${esc(emoji||'🌍')}</text></svg>`;
}
