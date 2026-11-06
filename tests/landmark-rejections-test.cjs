'use strict';
// Pictures rejected on sight (wrong landmark, a painting, unrecognisable) can never reach a child.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {plan}=require('../scripts/import-landmark-photo.cjs');
const rej=JSON.parse(fs.readFileSync('docs/landmark-rejections.json','utf8')).rejected;
const review=JSON.parse(fs.readFileSync('docs/landmark-candidate-review.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('data/landmark-photos.json','utf8')).datasets;
const landmarks=JSON.parse(fs.readFileSync('data/landmarks.json','utf8')).datasets;
const sw=fs.readFileSync('sw.js','utf8');
const CATS=new Set(['wrong-subject','not-a-photo','unrecognizable']);
// the review's known mismatches are all recorded
for(const id of ['christ','sagrada','towerbridge','fuji','colosseum','sphinx','niagara','chichen','hagia'])
  assert.ok(rej.some(r=>r.id===id),'missing rejection: '+id);
const ids=new Set(landmarks.LANDMARKS.map(x=>x[0]));
for(const r of rej){
  assert.ok(ids.has(r.id),'unknown landmark '+r.id);
  assert.ok(CATS.has(r.category)&&r.reason.length>10&&/^\d{4}-\d{2}-\d{2}$/.test(r.checkedOn),'incomplete rejection '+r.id);
  assert.ok(/^https:\/\//.test(r.sourceUrl)&&/^[0-9a-f]{64}$/.test(r.sourceSha256),'rejection needs source and hash '+r.id);
  // not offered for review, not enabled, not cached
  assert.ok(!review.candidates.some(c=>c.sourceUrl===r.sourceUrl||c.sourceSha256===r.sourceSha256),'rejected source still a candidate: '+r.id);
  assert.ok(!fs.existsSync('assets/landmark-candidates/'+r.id+'.webp')||review.candidates.some(c=>c.id===r.id),'rejected file left behind: '+r.id);
  assert.ok(!manifest.ids.includes(r.id)||manifest.records[r.id].sourceUrl!==r.sourceUrl,'rejected photo enabled: '+r.id);
  // the importer refuses it even with otherwise perfect review metadata
  const record={sourceUrl:r.sourceUrl,sourceSha256:r.sourceSha256,creator:'x',license:manifest.acceptedLicense[0],attribution:'x',reviewedBy:'x',reviewedOn:'2026-11-06',altReviewed:'yes'};
  assert.throws(()=>plan({id:r.id,file:'/dev/null',record,manifest,landmarks,sw,rejected:rej}),/Rejected source/);
}
// every remaining candidate carries a visual check and still waits for a human
for(const c of review.candidates){
  assert.ok(c.visualCheck&&/still needs human/.test(c.visualCheck.verdict),'candidate without visual check: '+c.id);
  assert.match(c.reviewStatus,/PENDING HUMAN REVIEW/);
}
assert.equal(review.candidateCount,review.candidates.length);
assert.equal(review.rejectedCount,rej.length);
console.log('PASS '+rej.length+' rejected landmark pictures blocked from review, import and the app; '+review.candidates.length+' plausible candidates await human sign-off');
