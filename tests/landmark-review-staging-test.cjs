'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const workflow=fs.readFileSync('.github/workflows/stage-all-landmark-review.yml','utf8');
const script=fs.readFileSync('scripts/stage-landmark-review.py','utf8');
assert.match(workflow,/contents: write/);
assert.match(workflow,/assets\/landmark-candidates/);
assert.match(workflow,/docs\/landmark-candidate-review\.json/);
assert.doesNotMatch(workflow,/git add .*assets\/landmark-photos|git add .*sw\.js/);
assert.match(script,/PENDING HUMAN REVIEW/);
assert.match(script,/assets\/landmark-candidates/);
assert.doesNotMatch(script,/assets\/landmark-photos|import-landmark-photo|sw\.js/);
const sw=fs.readFileSync('sw.js','utf8');
assert.doesNotMatch(sw,/assets\/landmark-candidates/);
const manifest=JSON.parse(fs.readFileSync('data/landmark-photos.json','utf8')).datasets;
// Candidates are enabled only through a record whose licence and author came from the
// official Wikimedia Commons API (scripts/fetch-commons-photos.py), after a visual check.
for(const id of manifest.ids){const r=manifest.records[id];
  assert.ok(r&&(r.licenseSource==='commons-api'||['liberty','eiffel'].includes(id)),'Photo enabled without verified Commons licence: '+id);}
console.log('PASS batch candidates cannot bypass photo review, manifest, or offline cache');
