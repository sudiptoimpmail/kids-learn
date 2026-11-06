'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=name=>JSON.parse(fs.readFileSync('data/'+name+'.json','utf8')).datasets;
const photos=read('landmark-photos');
const previews=read('landmark-online-previews').records;
const landmarks=new Set(read('landmarks').LANDMARKS.map(x=>x[0]));
const sw=fs.readFileSync('sw.js','utf8');
const loader=fs.readFileSync('content-loader.js','utf8');
const engine=fs.readFileSync('landmark-engine.js','utf8');
assert.ok(sw.includes('data/landmark-online-previews.json'),'Missing offline preview metadata');
assert.ok(loader.includes("'landmark-online-previews'"),'Preview metadata not loaded');
assert.ok(engine.includes('lm-online-preview'),'No photo preview control');
assert.ok(engine.includes('image.onerror'),'Missing illustration fallback');
assert.ok(Array.isArray(photos.ids),'Offline photo allowlist must exist');
for(const id of photos.ids)assert.ok(fs.existsSync('assets/landmark-photos/'+id+'.webp'),
  'Offline photograph missing: '+id);
for(const [id,p] of Object.entries(previews)){
 assert.ok(landmarks.has(id),'Unknown landmark '+id);
 assert.ok(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.sourceUrl));
 assert.match(p.file,/^[a-zA-Z0-9 ,()._-]+\.jpe?g$/i);
 assert.equal(p.mode,'online-only');assert.equal(p.license,'CC0');
 assert.ok(p.creator&&p.creator.trim());
}
assert.equal(Object.keys(previews).length,2);
console.log('PASS 2 opt-in Commons photo previews, provenance and offline fallback wiring');
