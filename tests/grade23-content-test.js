// Deterministic regression for new Grade 2–3 data banks. Runs with Node offline.
const assert = require('node:assert/strict'), fs=require('node:fs');
const get = name => JSON.parse(fs.readFileSync('data/'+name+'.json','utf8')).datasets;
const ext=get('grade23-extension'),science=get('science'),core=get('content'),
  stories=get('stories'),upper=get('upper-grade-stories'),thinking=get('thinking');
assert.equal(Object.keys(ext).sort().join(','),'GK,SCIENCE,STORIES,THINKING_ODD,THINKING_SEQUENCES');
const sizes={SCIENCE:40,GK:20,THINKING_ODD:20,THINKING_SEQUENCES:20,STORIES:15};
for(const [kind,count] of Object.entries(sizes))assert.equal(ext[kind].length,count,kind+' row count');
for(const kind of ['GK','SCIENCE']){
 const prior = new Set((kind==='GK'?core.GK:science.SCIENCE).map(r=>r[1].trim().toLowerCase()));
 const seen = new Set();
 for(const [i,r] of ext[kind].entries()){
  assert.ok([3,4].includes(r[0]),kind+' level '+i);
  assert.equal(r.length,6,kind+' options '+i);
  const prompt=r[1].trim().toLowerCase();
  assert.ok(!prior.has(prompt)&&!seen.has(prompt),kind+' repeated prompt '+i);
  seen.add(prompt);
  assert.equal(new Set(r.slice(2).map(s=>s.trim().toLowerCase())).size,4,kind+' duplicate answer '+i);
 }
}
const storySet=new Set([...stories.STORIES,...upper.STORIES].map(r=>r[1].trim().toLowerCase()));
for(const [i,row] of ext.STORIES.entries()){
 const [level,p,questions]=row;
 assert.ok([4,5,6].includes(level),'story level '+i);
 assert.ok(p.split(/\s+/).length>=40,'passage too short '+i);
 assert.ok(!storySet.has(p.trim().toLowerCase()),'story duplicated '+i);
 assert.equal(questions.length,3,'three independent questions '+i);
 for(const [q,opts] of questions){
  assert.ok(q&&opts.length===3&&new Set(opts).size===3,'invalid story answer choices '+i);
 }
}
for(const [kind,existing] of [['THINKING_ODD',thinking.THINKING_ODD],['THINKING_SEQUENCES',thinking.THINKING_SEQUENCES]]){
 const keys=new Set(existing.map(r=>r[0]+'|'+r[1].join(',')));
 for(const [i,r] of ext[kind].entries()){
  assert.ok([2,3].includes(r[0]),kind+' invalid level '+i);
  const key=r[0]+'|'+r[1].join(',');
  assert.ok(!keys.has(key),kind+' repeated scenario '+i);
  keys.add(key);
  if(kind==='THINKING_ODD')assert.ok(r[1].length===3&&r[2]&&!r[1].includes(r[2])&&r[3]);
  else assert.ok(r[1].length===4&&new Set(r[1]).size===4&&r[2]);
 }
}
const total=Object.values(ext).reduce((sum,rows)=>sum+rows.length,0);
assert.equal(total,115);
console.log('PASS 115 new Grade 2–3 learning items, 45 comprehension questions, no duplicate choices or existing scenario IDs');
