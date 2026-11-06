'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const book=JSON.parse(fs.readFileSync('library/red-riding-hood/book.json','utf8'));
const clips=JSON.parse(fs.readFileSync('audio/clips.json','utf8'));
const key=t=>t.toLowerCase().replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
assert.equal(book.pages.length,11);
assert.ok(book.pages.filter(p=>p.sound).length>=7,'suspense beats missing');
assert.ok(book.pages.every(p=>p.scene),'page moods not authored');
assert.ok(book.pages.some(p=>p.scene==='suspense'));
assert.ok(book.pages.some(p=>p.scene==='safe'));
assert.ok(book.pages[8].text.includes('"You are not my Grandma!" cried a scared Little Red.'));
assert.ok(book.pages[8].text.includes('"Help!" she screamed.'));
assert.match(book.pages[10].text.join(' '),/shared bread and apples/);
assert.ok(!/was eaten|ate Grandma|eaten by/i.test(book.pages.map(p=>p.text.join(' ')).join(' ')),'ending must stay gentle');
for (const [page,p] of book.pages.entries())
  for (const sentence of p.text)
    assert.ok(clips[key(sentence)],'Dramatic punctuation must retain a natural recording: page '+(page+1)+' '+sentence);
const reader=fs.readFileSync('library.js','utf8');
assert.match(reader,/storySceneSound\(p\.sound\)/);
assert.match(reader,/clearTimeout\(LB\.readTimer\)/,'page-turn suspense timer must cancel');
assert.match(reader,/data-scene/);
console.log('PASS Little Red Riding Hood: dramatic scenes, gentle ending, all natural narration intact');
