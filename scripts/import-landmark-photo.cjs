#!/usr/bin/env node
'use strict';
// A curator supplies a locally reviewed WebP and provenance JSON. Never scrape
// a third-party image or infer rights from a filename.
const fs=require('node:fs');
const path=require('node:path');
const {dimensions}=require('./landmark-webp.cjs');
function plan({id,file,record,manifest,landmarks,sw,rejected=[]}){
 if(!/^[a-z0-9-]+$/.test(id)||!landmarks.LANDMARKS.some(row=>row[0]===id))throw Error('Unknown/unsafe landmark ID');
 const r=record;
 for(const key of ['sourceUrl','creator','license','reviewedBy','reviewedOn','altReviewed'])
  if(typeof r[key]!=='string'||!r[key].trim())throw Error('Missing reviewed '+key);
 if(!/^https:\/\//.test(r.sourceUrl))throw Error('Source URL must use HTTPS');
 // a picture rejected on sight (wrong landmark, a painting, unrecognisable) can never be imported
 const hit=rejected.find(x=>x.sourceUrl===r.sourceUrl||(r.sourceSha256&&x.sourceSha256===r.sourceSha256));
 if(hit)throw Error('Rejected source for '+hit.landmark+': '+hit.reason);
 if(manifest.ids.includes(id)||manifest.records[id])throw Error('Landmark already enabled: '+id);
 if(!manifest.acceptedLicense.includes(r.license))throw Error('Unapproved license');
 if(r.altReviewed!=='yes'||!/^\d{4}-\d{2}-\d{2}$/.test(r.reviewedOn))throw Error('Invalid review metadata');
 if(/CC BY/.test(r.license)&&!r.attribution?.trim())throw Error('Attribution required');
 const [width,height]=dimensions(fs.readFileSync(file));
 if(width<manifest.minimumWidth||height<manifest.minimumHeight)throw Error('WebP too small');
 const destination='assets/landmark-photos/'+id+'.webp';
 if(fs.existsSync(destination))throw Error('Refusing to overwrite existing photo');
 if(sw.includes('"'+destination+'"'))throw Error('Already precached');
 if(!sw.includes('"data/landmark-photos.json",'))throw Error('Missing offline photo manifest anchor');
 const updated=structuredClone(manifest);
 updated.ids.push(id);updated.ids.sort();updated.records[id]=r;
 updated.status=updated.ids.length===landmarks.LANDMARKS.length?'complete':'partially-curated-photographs';
 const nextSW=sw.replace('"data/landmark-photos.json",','"data/landmark-photos.json",\n  "'+destination+'",');
 return {destination,manifest:updated,sw:nextSW,width,height};
}
function main(){
 const [id,file,recordFile]=process.argv.slice(2);
 if(!id||!file||!recordFile)throw Error('Usage: node scripts/import-landmark-photo.cjs <landmark-id> <reviewed.webp> <review.json>');
 const manifestPath='data/landmark-photos.json';
 const wrapper=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const landmarks=JSON.parse(fs.readFileSync('data/landmarks.json','utf8')).datasets;
 const sw=fs.readFileSync('sw.js','utf8');
 const record=JSON.parse(fs.readFileSync(recordFile,'utf8'));
 const rejected=JSON.parse(fs.readFileSync('docs/landmark-rejections.json','utf8')).rejected;
 const result=plan({id,file,record,manifest:wrapper.datasets,landmarks,sw,rejected});
 // All checks finish before any write. The caller must commit the three files.
 fs.mkdirSync(path.dirname(result.destination),{recursive:true});
 fs.copyFileSync(file,result.destination,fs.constants.COPYFILE_EXCL);
 wrapper.datasets=result.manifest;
 fs.writeFileSync(manifestPath,JSON.stringify(wrapper,null,2)+'\n');
 fs.writeFileSync('sw.js',result.sw.replace(/(const VERSION = PREFIX \+ 'v)(\d+)(')/,(_,a,v,b)=>a+(Number(v)+1)+b));
 console.log('Imported '+id+' ('+result.width+'x'+result.height+'). Run npm run audit:media and CI.');
}
if(require.main===module){try{main()}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={plan};
