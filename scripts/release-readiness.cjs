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
// A manual check counts only when a person recorded it: verified=true, a name and an ISO date.
const signed=e=>!!(e&&e.verified===true&&typeof e.by==='string'&&e.by.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(e.on||''));
function evaluate({missing,bodyModel,signoff}){
  const media=signed(signoff.manualMediaReview), device=signed(signoff.manualDeviceAcceptance);
  const blockers=[];
  if(missing.length)blockers.push(missing.length+' landmark photo(s) not enabled');
  if(!bodyModel)blockers.push('accurate 3D anatomy model not bundled');
  if(!media)blockers.push('manual media review not recorded');
  if(!device)blockers.push('physical-device acceptance not recorded');
  // per grade: 2 automated gates (green CI) + 5 human gates, each signed with a name and a date
  const grades={};
  for(const [g,row] of Object.entries(signoff.grades||{})){
    const human=Object.entries(row).filter(([k,v])=>v&&typeof v==='object'&&'verified' in v);
    const done=human.filter(([,v])=>signed(v)).length;
    grades[g]={label:row.label,gates:(Object.keys(row.automated||{}).length)+done+'/'+(Object.keys(row.automated||{}).length+human.length),
      pending:human.filter(([,v])=>!signed(v)).map(([k])=>k)};
    if(done<human.length)blockers.push((row.label||g)+': '+(human.length-done)+' human gate(s) not signed');
  }
  return {manualDeviceAcceptanceVerified:device,manualMediaReviewVerified:media,grades,readyForFinalSignoff:blockers.length===0,blockers};
}
const signoff=fs.existsSync('docs/release-signoff.json')?JSON.parse(fs.readFileSync('docs/release-signoff.json','utf8')):{};
const result={
  landmarkTotal:landmarks.length,realOfflinePhotos:seen.size,
  remainingLandmarkIds:missing,
  accurate3DAnatomyModelBundled:bodyModel,
  ...evaluate({missing,bodyModel,signoff})
};
if(require.main===module){
  console.log(JSON.stringify(result,null,2));
  if(process.argv.includes('--require-complete')&&!result.readyForFinalSignoff){
    console.error('Release incomplete: '+result.blockers.join('; '));
    process.exitCode=1;
  }
}
module.exports={evaluate,signed};
