'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {plan}=require('../scripts/import-landmark-photo.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'landmark-import-'));
try{
 const file=path.join(dir,'image.webp');
 // VP8X header only: dimension parsing test, not an image to ship.
 const bytes=Buffer.alloc(30);bytes.write('RIFF',0);bytes.write('WEBP',8);bytes.write('VP8X',12);
 bytes.writeUIntLE(639,24,3);bytes.writeUIntLE(479,27,3);fs.writeFileSync(file,bytes);
 const wrapper=JSON.parse(fs.readFileSync('data/landmark-photos.json','utf8'));
 const landmarks=JSON.parse(fs.readFileSync('data/landmarks.json','utf8')).datasets;
 const sw=fs.readFileSync('sw.js','utf8');
 const record={sourceUrl:'https://commons.wikimedia.org/wiki/File:Example.webp',creator:'Curator verified',license:'CC0',reviewedBy:'Human reviewer',reviewedOn:'2026-11-06',altReviewed:'yes'};
 const args={id:'liberty',file,record,manifest:wrapper.datasets,landmarks,sw};
 const result=plan(args);
 assert.equal(result.destination,'assets/landmark-photos/liberty.webp');
 assert.ok(result.sw.includes('"assets/landmark-photos/liberty.webp"'));
 assert.ok(result.manifest.ids.includes('liberty'));
 assert.equal(wrapper.datasets.ids.length,0,'Planning must not mutate manifest');
 assert.throws(()=>plan({...args,id:'../../evil'}),/Unknown\/unsafe/);
 assert.throws(()=>plan({...args,record:{...record,license:'All rights reserved'}}),/Unapproved/);
 assert.throws(()=>plan({...args,record:{...record,reviewedBy:''}}),/Missing reviewed/);
 assert.throws(()=>plan({...args,record:{...record,altReviewed:'no'}}),/Invalid review/);
 assert.throws(()=>plan({...args,record:{...record,license:'CC BY 4.0 (with attribution)'}}),/Attribution required/);
 assert.throws(()=>plan({...args,manifest:{...wrapper.datasets,ids:['liberty']}}),/already enabled/);
 const small=Buffer.from(bytes);small.writeUIntLE(119,24,3);fs.writeFileSync(file,small);
 assert.throws(()=>plan(args),/too small/);
 console.log('PASS curated landmark importer validation, provenance, duplicate protection and cache wiring');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
