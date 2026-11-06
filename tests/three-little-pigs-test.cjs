const assert=require('node:assert/strict'),fs=require('node:fs');
const root='library/three-little-pigs/',b=JSON.parse(fs.readFileSync(root+'book.json')),c=JSON.parse(fs.readFileSync('audio/clips.json'));
const key=t=>t.toLowerCase().replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
for(const t of [b.title,...b.pages.flatMap(p=>p.text),...b.questions.map(q=>q.ask)]){assert.ok(c[key(t)],'Missing sentence: '+t);assert.ok(fs.existsSync('audio/'+c[key(t)]));}
for(const p of b.pages){assert.ok(fs.existsSync(root+p.art));for(const t of p.text)for(const w of t.split(/\s+/))assert.ok(c[key(w)],'Missing word: '+w);}
for(const q of b.questions){assert.equal(q.options.filter(o=>o[0]===q.answer).length,1);for(const o of q.options)assert.ok(fs.existsSync(root+o[1]));}
assert.match(fs.readFileSync('library.js','utf8'),/'three-little-pigs'/);
for(const f of fs.readdirSync(root))assert.ok(fs.readFileSync('sw.js','utf8').includes(root+f),'Not precached: '+f);
console.log('PASS Three Little Pigs: full narration, tappable words, artwork, answers and offline cache');
