/* Colorable SVG artwork is data, not executable JavaScript.
   Self-authored coloring artwork is locally bundled without third-party art files.
   All seven content chunks are bundled and cached offline. */
const OM_PAGES = Array.from({length:6}, (_,i) => ContentData.get('coloring-'+i, 'OM_PAGES')).flat();
const OM_LAND = ContentData.get('coloring-landmarks','OM_LAND');
