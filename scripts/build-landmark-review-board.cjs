#!/usr/bin/env node
'use strict';
/** Offline visual review board for real landmark candidates.
 * Runs locally; never publishes images or fabricates curator sign-off.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=path.resolve(__dirname,'..');
const report=JSON.parse(fs.readFileSync(path.join(root,'docs/landmark-candidate-review.json'),'utf8'));
const rows=report.candidates.map(r=>{
 const file=path.join(root,'assets/landmark-candidates',r.file);
 if(!fs.existsSync(file))return '<article><h2>'+esc(r.landmark)+'</h2><p>Image missing: '+esc(r.file)+'</p></article>';
 const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const matches=actual===r.webpSha256;
 return '<article><img loading="lazy" src="../assets/landmark-candidates/'+encodeURIComponent(r.file)+'" alt="Unverified candidate for '+esc(r.landmark)+'"><h2>'+esc(r.landmark)+'</h2><p><strong>Image identity and rights NOT VERIFIED</strong></p><p>'+esc(r.sourceFileTitle)+'</p><p>Claimed license: '+esc(r.licenseClaim)+'</p><p>Claimed creator: '+esc(r.creatorClaim)+'</p><p>Integrity: '+(matches?'SHA-256 matches':'SHA-256 MISMATCH')+'</p><a target="_blank" rel="noopener noreferrer" href="'+esc(r.sourceUrl)+'">Open source and inspect rights</a><p><label><input type="checkbox"> Visually checked subject</label></p><p><label><input type="checkbox"> Checked license on source</label></p><p><label><input type="checkbox"> Verified creator and attribution</label></p><p><label><input type="checkbox"> Approved child-safe composition and alt text</label></p></article>';
}).join('\n');
const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Landmark media review — NOT PUBLISHED</title><style>body{font:16px system-ui;margin:2rem;background:#f7f7f7;color:#171717}header{max-width:65rem;margin:auto}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:1.2rem;max-width:110rem;margin:auto}article{background:white;padding:1rem;border:1px solid #bbb;border-radius:12px}img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#eee}h2{font-size:1.2rem}label{display:block}a{overflow-wrap:anywhere}</style><header><h1>Landmark photo candidate review</h1><p><strong>These '+report.candidateCount+' candidates are NOT approved or published.</strong> Check each photo and its source manually. Checkboxes are temporary visual aids, not saved proof of review.</p></header><main>'+rows+'</main></html>';
const out=path.join(root,'docs/landmark-photo-review.html');
fs.writeFileSync(out,html);
console.log('Created '+out+' with '+report.candidateCount+' review candidates.');
