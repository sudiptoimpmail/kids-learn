#!/usr/bin/env node
'use strict';
// A deterministic, honest release gate: no inferred human review or device sign-off.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')).datasets;
const landmarks=read('data/landmarks.json').LANDMARKS;
const manifest=read('data/landmark-photos.json');
const sw=fs.readFileSync('sw.js','utf8');
const ids=new Set(landmarks.map(x=>x[0]));
const seen=new Set();
const missing=[];
for(const id of manifest.ids){
 assert.ok(ids.has(id),'Unknown photographed landmark: '+id);
 assert.ok(!seen.has(id),'Duplicate photo ID: '+id);seen.add(id);
 assert.ok(fs.existsSync(path.join('assets/landmark-photos',id+'.webp')),'Missing WebP: '+id);
 assert.ok(sw.includes('assets/landmark-photos/'+id+'.webp'),'Photo not offline cached: '+id);
 const r=manifest.records[id];
 assert.ok(r&&r.sourceUrl&&r.creator&&r.license&&r.reviewedBy&&r.reviewedOn,
   'Incomplete photo provenance: '+id);
}
for(const [id] of landmarks)if(!seen.has(id))missing.push(id);
const bodyModel=fs.existsSync('vendor/body.glb');
const result={
  landmarkTotal:landmarks.length,realOfflinePhotos:seen.size,
  remainingLandmarkIds:missing,
  accurate3DAnatomyModelBundled:bodyModel,
  manualDeviceAcceptanceVerified:false,
  manualMediaReviewVerified:false,
  readyForFinalSignoff:missing.length===0&&bodyModel
};
console.log(JSON.stringify(result,null,2));
if(process.argv.includes('--require-complete')&&!result.readyForFinalSignoff){
 console.error('Release incomplete: photos or 3D anatomy model missing');
 process.exitCode=1;
}
