#!/usr/bin/env node
'use strict';
// Guard against reintroducing third-party stock, Creative Commons derivative art,
// and network-hosted media in the child-facing free offline release.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(p,'utf8');
const get=n=>JSON.parse(read('data/'+n+'.json')).datasets;
const all=get('visuals'),landmarks=get('landmarks').LANDMARKS;
const icons=Object.values(all.ILLUSTRATION_GROUPS).flat();
assert.equal(icons.length,84,'84 learning picture subjects required');
assert.equal(new Set(icons).size,84,'unique learning icons');
assert.ok(!fs.existsSync('vendor/body.glb'),'Third-party CC BY anatomical GLB is still bundled');
assert.ok(!fs.existsSync('body3d.js'),'Deprecated CC BY anatomical renderer still bundled');
assert.ok(!read('app.js').includes("import('./body3d.js')"),'Dead runtime import for removed anatomy renderer');
assert.ok(!fs.existsSync('assets/illustrations/ATTRIBUTION.md'),'Obsolete third-party SVG attribution/source still bundled');
for(const name of icons){
 const f='assets/illustrations/'+name+'.svg',svg=read(f);
 assert.ok(svg.includes('data-origin="kids-learn-self-authored-icon"'),'Not a new locally authored icon: '+f);
 assert.ok(svg.includes('<title')&&svg.includes('<svg')&&svg.includes('viewBox'),f);
 assert.ok(!/xlink:href|<image\b|<foreignObject|<script\b|<style\b|url\(https?:/i.test(svg),'External dependency in '+f);
}
let pages=0;
for(let k=0;k<6;k++){
 const rows=get('coloring-'+k).OM_PAGES;
 for(const p of rows){
  pages++;
  assert.ok(p.c&&p.c.includes('class="r"')&&p.l!=null,'Original paintable shapes missing: '+p.name);
  assert.ok(!/openmoji|creativecommons|data:image|href="https?:/i.test(p.c+p.l),'Third-party coloring data: '+p.name);
 }
}
assert.equal(pages,47,'Do not silently remove coloring variety');
assert.deepEqual(get('coloring-landmarks').OM_LAND,{},'Legacy third-party landmark coloring paths remain');
assert.equal(landmarks.length,39);
for(const [id] of landmarks){
 const svg=read('assets/landmarks/'+id+'.svg');
 assert.ok(svg.includes('data-origin="kids-learn-original-landmark-schematic"'),'Non-original landmark art '+id);
 assert.ok(!/xlink:href|<image\b|<script\b|url\(https?:/i.test(svg),'External landmark dependency '+id);
}
assert.ok(read('assets/body/organ-diagram.svg').includes('data-origin="kids-learn-original-anatomy"'));
const sw=read('sw.js');
for(const f of ['assets/body/organ-diagram.svg','data/curriculum-map.json','assets/illustrations/apple.svg','assets/landmarks/eiffel.svg'])
 assert.ok(sw.includes('"'+f+'"'),'Offline asset not precached: '+f);
for(const f of ['vendor/body.glb','body3d.js','assets/illustrations/ATTRIBUTION.md'])
 assert.ok(!sw.includes('"'+f+'"'),'Obsolete licensed file still precached: '+f);
for(const p of ['index.html','art-engine.js'])
 assert.ok(!/OpenMoji|Twemoji|BodyParts3D|HuBMAP/i.test(read(p)),'Outdated third-party art acknowledgement in '+p);
console.log('PASS offline media: 84 self-authored SVG frames with OS glyphs, 47 original paintable pages, 39 new landmark schematics, original anatomy, no CC BY mesh or remote art');
