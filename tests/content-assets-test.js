/* Release gate: every question/media dataset must be separate from executable JS
   and every bundled offline asset must be available on disk. */
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const read = p => fs.readFileSync(p,'utf8');
const appConfig = JSON.parse(read('app.config.json'));   // kids-core: data and scripts are listed in the config
const serviceWorker = read('sw.js');
const names = appConfig.data.namespaces;
const scripts = appConfig.scripts;
const swList = serviceWorker.match(/const FILES = (\[[\s\S]*?\]);/)[1];
const files = Function('return '+swList)();
const precache = new Set(files);
assert.equal(precache.size, files.length, 'Duplicated offline cached files');
assert.ok(!/\b(?:stories|scenes|art|landmarks)\.js\b/.test(files.join('|')), 'Removed inlined-media scripts remain precached');
assert.ok(/type="module" src="core\/boot\.js"/.test(read('index.html')), 'App does not bootstrap external learning data');
const payloads = new Map();
for (const name of names) {
  const path='data/'+name+'.json';
  assert.ok(fs.existsSync(path), 'Missing external content data '+path);
  assert.ok(precache.has(path), 'Offline cache omitted '+path);
  const data=JSON.parse(read(path));
  assert.equal(data.schema,1,'Unexpected schema '+path);
  assert.equal(data.namespace,name,'Wrong namespace '+path);
  assert.ok(data.datasets && typeof data.datasets === 'object' && !Array.isArray(data.datasets),'Invalid dataset '+path);
  assert.ok(Object.keys(data.datasets).length>0,'Empty dataset '+path);
  payloads.set(name,data.datasets);
}
for (const script of scripts) {
  assert.ok(fs.existsSync(script), 'Missing learning engine '+script);
  assert.ok(precache.has(script), 'Script not cached offline '+script);
}
for (const file of files.filter(file=>file!=='./')) assert.ok(fs.existsSync(file), 'Precache references missing file: '+file);
const checks = [
 ['data/content.json','gk','GK'],['data/stories.json','read','STORIES'],
 ['data/science.json','sci','SCIENCE'],['data/thinking.json','thinking','THINKING_ODD'],
 ['data/grammar.json','grammar','GR_NOUNS'],
 ['data/grade1.json','grade1','G1_ORDER'],['data/trace.json','trace','TRACE_WORDS']
];
for (const [path,,bank] of checks) {
  const data=JSON.parse(read(path));
  assert.ok(Array.isArray(data.datasets[bank]) && data.datasets[bank].length>0,'Missing '+bank);
}
assert.equal(payloads.get('stories').STORIES.length,73);
assert.equal(payloads.get('reading-patterns').PATTERN_SENTENCES.length,130);
assert.equal(payloads.get('visuals').PHOTO_PUZZLE_NAMES.length,12);
assert.equal(Object.values(payloads.get('visuals').PHOTO_GROUPS).flat().length,16);
assert.equal(Object.values(payloads.get('visuals').ILLUSTRATION_GROUPS).flat().length,84);
assert.equal(payloads.get('landmarks').LANDMARKS.length,39);
assert.equal(payloads.get('scenes').SCENE_PAGES.length,14);
const pictures=[];
for (const [country,entry] of Object.entries(payloads.get('country').COUNTRIES)) {
  assert.ok(entry.coins.length>=4, 'Not enough coins for '+country);
  assert.ok(entry.notes.length>=4, 'Not enough banknotes for '+country);
  for (const [value] of entry.coins) pictures.push('assets/currencies/'+country+'-'+value+'.svg');
  for (const [value] of entry.notes) pictures.push('assets/currencies/'+country+'-note-'+value+'.svg');
}
for (const name of ['mole','mouse','hedgehog','flower','meadow']) pictures.push('assets/games/'+name+'.svg');
for (const name of ['duckling','child','bone','bee','cheese','parking']) pictures.push('assets/maze/'+name+'.svg');
for (const name of ['savanna','garden','room','square-room','forest','sports','park','cafe']) pictures.push('assets/workbook/'+name+'.svg');
for (const place of payloads.get('landmarks').LANDMARKS) pictures.push('assets/landmarks/'+place[0]+'.svg');
assert.equal(new Set(pictures).size,pictures.length,'Duplicate media destination');
for (const path of pictures) {
  assert.ok(precache.has(path), 'Media not available offline: '+path);
  const svg=read(path);
  assert.ok(svg.includes('<svg') && svg.includes('</svg>') && svg.includes('viewBox'),'Malformed image: '+path);
  assert.ok(!/<script\b|\bonload=|\bonerror=/i.test(svg),'Unsafe image markup: '+path);
}
assert.ok(!read('content.js').includes("const GK = ["),'GK questions still embedded in JS');
assert.ok(!read('story-engine.js').includes("Pam has a pet fish"),'Stories still embedded in JS');
assert.ok(!read('art-engine.js').includes('<path class="r"'), 'Coloring art still embedded in JS');
assert.ok(!read('workbook.js').includes('Baby zebra and parent on a sunny savanna'), 'Workbook illustrations still embedded in JS');
assert.ok(!read('geo.js').includes('"countries":[{'), 'Map geometry still embedded in JS');
console.log('PASS '+names.length+' offline JSON modules, '+scripts.length+' game scripts, '+pictures.length+' new standalone media images, '+files.length+' precache entries');
