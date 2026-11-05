/* Colorable SVG artwork is data, not executable JavaScript.
   Original OpenMoji-derived art remains licensed CC BY-SA 4.0.
   All seven content chunks are bundled and cached offline. */
const OM_PAGES = Array.from({length:6}, (_,i) => ContentData.get('coloring-'+i, 'OM_PAGES')).flat();
const OM_LAND = ContentData.get('coloring-landmarks','OM_LAND');
