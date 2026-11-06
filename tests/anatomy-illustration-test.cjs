'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const svg=fs.readFileSync('assets/body/organ-diagram.svg','utf8');
const content=fs.readFileSync('content.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.match(svg,/viewBox="0 0 200 300"/);
assert.match(svg,/data-origin="kids-learn-original-anatomy"/);
assert.match(svg,/Bronchial branches inside both lungs/);
assert.match(svg,/Brain folds/);
assert.match(content,/Illustrated human body showing internal organs/);
for(const name of ['brain','lungs','heart','liver','stomach','kidneys','spine','intestines']){
 assert.match(content,new RegExp("\\['"+name+"',"),'Missing interactive organ '+name);
}
assert.match(sw,/assets\/body\/organ-diagram\.svg/);
console.log('PASS offline anatomy diagram and 8 organ hotspot mappings');
