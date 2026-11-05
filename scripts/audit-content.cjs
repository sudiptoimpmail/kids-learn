#!/usr/bin/env node
'use strict';
// Offline deterministic audit: NO network required, no account, no telemetry.
// Structural assurance only; human reviewers must still check pedagogical accuracy,
// factual ambiguity and whether each picture looks like its real-world subject.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => {
  const p=path.join(root,'data',name+'.json');
  const obj=JSON.parse(fs.readFileSync(p,'utf8'));
  assert.equal(obj.schema,1, name+': schema');
  assert.equal(obj.namespace,name, name+': namespace');
  assert.ok(obj.datasets && typeof obj.datasets==='object',name+': datasets');
  return obj.datasets;
};
const content=read('content'), science=read('science'), country=read('country'),
  stories=read('stories'), upperStories=read('upper-grade-stories'), reading=read('reading-patterns'),
  thinking=read('thinking'), grade1=read('grade1'), landmarks=read('landmarks'),
  explorerMath=read('explorer-math'), explorerScience=read('explorer-science');
const faults=[], concerns=[], stats={};
const error=(bank,key,why)=>faults.push(bank+'/'+key+': '+why);
const choices=(bank,key,question,answers,level)=>{
  if(typeof question!=='string'||!question.trim())error(bank,key,'missing question');
  if(!Number.isInteger(level)||level<1||level>6)error(bank,key,'invalid level '+level);
  if(!Array.isArray(answers)||answers.length<3||answers.length>6)error(bank,key,'expected correct answer and 2+ distractors');
  else{
    const normalized=answers.map(v=>String(v).normalize('NFKC').trim().toLowerCase());
    if(normalized.some(s=>!s))error(bank,key,'blank option');
    if(new Set(normalized).size!==normalized.length)error(bank,key,'duplicate or ambiguous answer options');
  }
};
const mc=(name,rows,maxLevel=6)=>{
  const seen=new Set();
  rows.forEach((r,i)=>{
    if(!Array.isArray(r)||r.length<5){error(name,i,'bad MC row');return}
    const [level,q,...opts]=r;
    choices(name,i,q,opts,level);
    if(level>maxLevel)error(name,i,'grade level too high');
    const key=level+'|'+String(q).toLowerCase();
    if(seen.has(key))concerns.push(name+'/'+i+': repeated prompt');
    seen.add(key);
  });
  stats[name]=rows.length;
};
mc('general-knowledge',content.GK,4);
mc('science-facts',science.SCIENCE,4);
for(const [id,C] of Object.entries(country.COUNTRIES))mc('country-'+id,C.rows,4);
for(const [i,r] of content.SENTENCES.entries()){
  if(!Array.isArray(r)||r.length<3){error('reading',i,'invalid row');continue}
  const level=Number.isInteger(r[3])?r[3]:1;
  choices('reading',i,r[1],r[2],level);
  if(typeof r[0]!=='string'||r[0].length<5)error('reading',i,'missing passage');
}
for(const [i,r] of reading.PATTERN_SENTENCES.entries()){
  const [passage,q,opts,level]=r;
  choices('reading-patterns',i,q,opts,level);
  if(!passage)error('reading-patterns',i,'missing passage');
}
for(const [i,r] of stories.STORIES.concat(upperStories.STORIES).entries()){
  const [level,passage,qs]=r;
  if(typeof passage!=='string'||passage.length<45)error('stories',i,'short or missing story');
  if(!Array.isArray(qs)||!qs.length)error('stories',i,'missing comprehension questions');
  else for(let j=0;j<qs.length;j++)choices('stories',i+'.'+j,qs[j][0],qs[j][1],level);
}
for(const [i,r] of content.SYL.entries()){
  const [word,split,picture]=r;
  const strip=s=>String(s).toLowerCase().replace(/[^a-z]/g,'');
  if(strip(word)!==strip(split))error('syllables',i,'split changes the word: '+word+' => '+split);
  if(split.split('-').length>4)error('syllables',i,'exceeds answer choice count');
  if(!picture)error('syllables',i,'missing visual');
}
for(const [i,r] of content.FILL.entries()){
  if(typeof r[0]!=='string'||r[0].split('___').length!==2)error('sight-fill',i,'must contain exactly one blank');
  if(!r[1])error('sight-fill',i,'blank answer');
}
for(const [i,r] of thinking.THINKING_ODD.entries()){
  if(!Array.isArray(r[1])||new Set([...r[1],r[2]]).size!==r[1].length+1)error('odd-one-out',i,'repeated or missing choices');
}
for(const [i,r] of thinking.THINKING_SEQUENCES.entries()){
  if(!Array.isArray(r[1])||r[1].length<3||new Set(r[1]).size!==r[1].length)concerns.push('sequencing/'+i+': repeated or unclear events need editorial review');
}
// Verify every landmark has an offline media file, and distinguish a real
// recognizability photo from a simplistic cartoon (they are not equivalent).
let landmarkIllustrations=0,landmarkPhotos=0;
for(const r of landmarks.LANDMARKS){
  const [id,name,countryName,city,lv]=r;
  if(!/^[a-z0-9]+$/.test(id)||!name||!countryName||!city||![1,2,3].includes(lv))error('landmarks',id,'invalid metadata');
  const illustration=path.join(root,'assets','landmarks',id+'.svg');
  const photo=path.join(root,'assets','landmark-photos',id+'.webp');
  if(fs.existsSync(illustration))landmarkIllustrations++;
  if(fs.existsSync(photo))landmarkPhotos++;
  if(!fs.existsSync(illustration)&&!fs.existsSync(photo))error('landmarks',id,'missing offline media');
}
stats.landmarks=landmarks.LANDMARKS.length; stats.landmarkIllustrations=landmarkIllustrations;stats.landmarkPhotos=landmarkPhotos;
if(landmarkPhotos<stats.landmarks)concerns.push('Famous Places: '+(stats.landmarks-landmarkPhotos)+' places lack locally bundled real photographs; illustration-only image recognition is not release-ready');
stats.syllables=content.SYL.length;stats.sightFill=content.FILL.length;stats.readingPassages=stories.STORIES.length+upperStories.STORIES.length;stats.science=science.SCIENCE.length;
stats.grade1Passages=grade1.G1_PASSAGES.length;
stats.oddOneOut=thinking.THINKING_ODD.length;
stats.sequencing=thinking.THINKING_SEQUENCES.length;
stats.grade2Sections=Object.keys(content.GRADES.g2.g).length+3;
stats.grade3Sections=Object.keys(content.GRADES.g3.g).length+3;
const byLevel={};for(const [level] of stories.STORIES.concat(upperStories.STORIES))byLevel[level]=(byLevel[level]||0)+1;stats.storiesByLevel=byLevel;
if((byLevel[6]||0)<20)concerns.push('Grade 3 level 6 reading has only '+(byLevel[6]||0)+' passages; target at least 20 editorially reviewed texts');
for(const g of ['g2','g3']){
  const ranges=content.GRADES[g].g;
  if(ranges.flags==='3-3'&&ranges.maps==='3-3')concerns.push(g+': map and flag questions do not progress beyond level 3');
}
// Grade 2–3 mission books are JSON-only: validate every answer and media path.
for(const [subject,book,levels] of [
  ['math',explorerMath.questions,[4,5]],['science',explorerScience.questions,[3,4]]
]){
  if(!Array.isArray(book)||book.length<25)error('explorer-'+subject,'all','less than 25 authored missions');
  const ids=new Set();
  for(const q of book){
    if(!q||!q.id||ids.has(q.id))error('explorer-'+subject,q?.id,'duplicate or missing id');
    ids.add(q?.id);
    if(!levels.includes(q.level)||!q.domain||!q.context||!q.prompt||!q.explanation)
      error('explorer-'+subject,q.id,'invalid grade-level fields');
    if(!Array.isArray(q.choices)||q.choices.length<3||q.choices.length>5||
      !q.choices.includes(q.answer)||
      new Set(q.choices.map(x=>String(x).trim().toLowerCase())).size!==q.choices.length)
      error('explorer-'+subject,q.id,'invalid answer/distractors');
    if(q.asset && (!new RegExp('^assets/(?:photos|illustrations)/[a-z0-9_-]+[.](?:svg|jpg)
        !fs.existsSync(path.join(root,q.asset))))
      error('explorer-'+subject,q.id,'missing or disallowed offline media '+q.asset);
  }
  stats['explorer-'+subject]=book.length;
  stats['explorer-'+subject+'-byLevel']=Object.fromEntries(levels.map(l=>[l,book.filter(q=>q.level===l).length]));
}
let scienceSortItems=0;
for(const [level,prompt,groups,items] of science.SCI_SORT){
  if(![1,2,3,4].includes(level)||!prompt||!Array.isArray(groups)||new Set(groups).size!==groups.length)
    error('science-sort',prompt,'invalid group names');
  for(const [name,picture,index] of items){
    if(!name||!picture||!Number.isInteger(index)||index<0||index>=groups.length)
      error('science-sort',prompt,'invalid group for '+name);
    scienceSortItems++;
  }
}
stats.scienceSortBanks=science.SCI_SORT.length;
stats.scienceSortExamples=scienceSortItems;
console.log(JSON.stringify({stats,structuralErrors:faults,editorialConcerns:concerns},null,2));
if(faults.length)process.exitCode=1;
).test(q.asset)||
        !fs.existsSync(path.join(root,q.asset))))
      error('explorer-'+subject,q.id,'missing or disallowed offline media '+q.asset);
  }
  stats['explorer-'+subject]=book.length;
  stats['explorer-'+subject+'-byLevel']=Object.fromEntries(levels.map(l=>[l,book.filter(q=>q.level===l).length]));
}
let scienceSortItems=0;
for(const [level,prompt,groups,items] of science.SCI_SORT){
  if(![1,2,3,4].includes(level)||!prompt||!Array.isArray(groups)||new Set(groups).size!==groups.length)
    error('science-sort',prompt,'invalid group names');
  for(const [name,picture,index] of items){
    if(!name||!picture||!Number.isInteger(index)||index<0||index>=groups.length)
      error('science-sort',prompt,'invalid group for '+name);
    scienceSortItems++;
  }
}
stats.scienceSortBanks=science.SCI_SORT.length;
stats.scienceSortExamples=scienceSortItems;
console.log(JSON.stringify({stats,structuralErrors:faults,editorialConcerns:concerns},null,2));
if(faults.length)process.exitCode=1;
