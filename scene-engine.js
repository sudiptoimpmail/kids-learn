/* Scene geometry is versioned offline JSON, not JavaScript source.
   Keep the original synchronous coloring-page API for game renderers. */
const SCENE_PAGES = ContentData.get('scenes','SCENE_PAGES').map(
  scene => ({id:scene.id,name:scene.name,svg:() => scene.svg})
);
