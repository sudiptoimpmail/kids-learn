// Grade 1 word coverage and generator integrity. No browser or TTS required.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const shuffle = a => {
  const b = a.slice();
  for (let i = b.length-1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [b[i],b[j]] = [b[j],b[i]];
  }
  return b;
};
const pick = a => a[Math.floor(Math.random()*a.length)];
const sample = (a,n) => shuffle(a).slice(0,n);
const ctx = vm.createContext({Math,Set,Object,Error,pick,shuffle,sample});
vm.runInContext(fs.readFileSync('grade1.js','utf8') +
  '\nthis.testAPI = {G1_WORDS,G1_ACTIVE_WORDS,G1_EDITORIAL,G1_SHORT_WORDS,G1_BLEND_WORDS,G1_LONG_WORDS,G1_PICTURE_WORDS,genGrade1Read};',ctx);
const g = ctx.testAPI;
assert.equal(g.G1_WORDS.length,243,'expected 243 unique requested tokens');
assert.equal(new Set(g.G1_WORDS).size,g.G1_WORDS.length,'duplicate words');
assert.equal(g.G1_ACTIVE_WORDS.length,241,'two editorial terms held out');
assert.deepEqual(Array.from(g.G1_EDITORIAL),['mo','shwip']);
for (const w of ['cat','bat','dad','pete','climb','flag','block','shark','ship','what','wheel','moot','sheet','coat','glue','read','lead','bow','wind','short','old']) {
  assert.ok(g.G1_WORDS.includes(w),'missing user word '+w);
}
const clips = JSON.parse(fs.readFileSync('audio/clips.json','utf8'));
for (const key of ['find the word','which word fits','sound it out','think about it','fill in the missing letters','look at the picture']) {
  assert.ok(clips[key], 'new activities require a natural recorded clip for '+key);
}
const inspect = q => {
  const vals = q.options.map(o=>o.v);
  assert.equal(vals.length,4,'not 4 choices for '+q.key);
  assert.equal(new Set(vals).size,4,'duplicate choices '+q.key);
  assert.equal(vals.filter(x=>x===q.answer).length,1,'missing/duplicate answer '+q.key);
  assert.ok(q.key && q.text && q.main && q.hint && q.hint.say,'missing prompt/hint '+q.key);
  // The question and hint must use existing recordings, never unrecorded-word TTS.
  const clipKey = s => s.toLowerCase().replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
  assert.ok(clips[clipKey(q.say)], 'unrecorded instruction for '+q.key);
  assert.ok(clips[clipKey(q.hint.say)],'unrecorded hint for '+q.key);
};
for (const level of [1,2,3,4,5]) {
  for (let n=0;n<3500;n++) inspect(g.genGrade1Read(level));
}
for (const word of g.G1_ACTIVE_WORDS) {
  const q = g.genGrade1Read(4,word);
  inspect(q);
  assert.equal(q.answer,word,'not reachable as correct answer '+word);
}
for (const word of g.G1_PICTURE_WORDS) assert.ok(g.G1_WORDS.includes(word),'spelling picture not requested '+word);
assert.ok(g.G1_SHORT_WORDS.length>100 && g.G1_BLEND_WORDS.length>50 && g.G1_LONG_WORDS.length>55);
const source=fs.readFileSync('content.js','utf8');
assert.match(source,/id: 'g1read'/);
assert.match(source,/g1read: '1-5'/);
assert.match(source,/g1read: '2-5'/);
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.indexOf('src="grade1.js"') < html.indexOf('src="content.js"'),'grade1 bank must load first');
assert.match(fs.readFileSync('app.js','utf8'),/\['trace', 'phonics', 'g1read'/);
console.log('PASS Grade 1 reading: '+g.G1_WORDS.length+' requested words, '+g.G1_ACTIVE_WORDS.length+' active, 5 levels, 17,500 randomized questions, '+g.G1_ACTIVE_WORDS.length+' forced-target cases');
