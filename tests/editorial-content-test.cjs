#!/usr/bin/env node
'use strict';
// Offline editorial regression: content is grade-configured JSON, not JS logic.
// Source-backed review fixtures catch regressions in previously ambiguous facts;
// cross-bank checks catch inconsistent answers to region-capital questions.
// This does not claim automatic verification of every scientific statement.
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(name) {
  const json=JSON.parse(fs.readFileSync('data/'+name+'.json','utf8'));
  assert.equal(json.schema,1,'Wrong data schema '+name);
  assert.equal(json.namespace,name,'Wrong namespace '+name);
  return json.datasets;
}
const science=read('science'),world=read('world23'),country=read('country');
const storyBanks=Object.fromEntries(['stories','upper-grade-stories','grade23-extension']
  .map(name=>[name,read(name).STORIES]));
const fixture=JSON.parse(fs.readFileSync('tests/editorial-reviewed.json','utf8'));
assert.equal(fixture.schema,1);
assert.ok(Array.isArray(fixture.reviews)&&fixture.reviews.length>=10);

const normalize=x=>String(x).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const banks={
  science:science.SCIENCE.map(row=>({question:row[1],choices:row.slice(2),passage:''})),
  'world23-science':world.SCIENCE23.map(row=>({question:row[1],choices:row.slice(2),passage:''})),
  'country:uk':country.COUNTRIES.uk.rows.map(row=>({question:row[1],choices:row.slice(2),passage:''})),
  stories:storyBanks.stories.flatMap((row)=>row[2].map(([question,choices])=>({question,choices,passage:row[1]})))
};
let checked=0;
const reviewed=new Set();
for(const review of fixture.reviews){
  assert.ok(/^https:\/\//.test(review.source),'Review needs verifiable source: '+review.question);
  assert.ok(review.reason,'Review needs rationale: '+review.question);
  const key=review.bank+'|'+review.question;
  assert.ok(!reviewed.has(key),'Duplicate review: '+key);reviewed.add(key);
  const entries=banks[review.bank];
  assert.ok(entries,'Unsupported review bank: '+review.bank);
  const matches=entries.filter(row=>row.question===review.question &&
    (!review.passageContains||row.passage.includes(review.passageContains)));
  assert.equal(matches.length,1,'Missing or ambiguous reviewed question: '+key);
  const row=matches[0];
  assert.equal(row.choices[0],review.answer,'Wrong reviewed answer: '+key);
  assert.equal(row.choices.filter(x=>normalize(x)===normalize(review.answer)).length,1,
    'Multiple copies of reviewed answer: '+key);
  if(review.evidence)assert.ok(row.passage.includes(review.evidence),'Missing supporting passage text: '+key);
  for(const rejected of review.excludedChoices||[])
    assert.ok(!row.choices.some(x=>normalize(x)===normalize(rejected)),
      'Known ambiguous distractor returned: '+key+' / '+rejected);
  for(const rejected of review.forbiddenPassage||[])
    assert.ok(!row.passage.includes(rejected),'Old misleading passage returned: '+key);
  checked++;
}

let readingQuestions=0,readingPassages=0;
for(const [bank,stories] of Object.entries(storyBanks)){
  for(const [index,story] of stories.entries()){
    const [level,passage,qs]=story;
    assert.ok(Number.isInteger(level)&&level>0,'Invalid level: '+bank+'/'+index);
    assert.ok(typeof passage==='string'&&passage.length>30,'Blank passage: '+bank+'/'+index);
    assert.ok(Array.isArray(qs)&&qs.length>0,'No comprehension questions: '+bank+'/'+index);
    const prompts=new Set();
    for(const [prompt,choices] of qs){
      assert.ok(typeof prompt==='string'&&prompt.trim(),'Blank question: '+bank+'/'+index);
      assert.ok(!prompts.has(normalize(prompt)),'Duplicate question in passage: '+bank+'/'+index);
      prompts.add(normalize(prompt));
      assert.ok(Array.isArray(choices)&&choices.length>=3,'Not enough choices: '+bank+'/'+index);
      const vals=choices.map(normalize);
      assert.ok(vals.every(Boolean),'Blank choice: '+bank+'/'+index);
      assert.equal(new Set(vals).size,vals.length,'Repeated reading choices: '+bank+'/'+index);
      readingQuestions++;
    }
    readingPassages++;
  }
}

// Compare capital-city answers in the regional GK bank with the independently
// maintained region/capital catalogue in the corresponding country edition.
const regionToCapital=new Map();
for(const [countryCode,edition] of Object.entries(country.COUNTRIES)){
  for(const [name,capital] of edition.regions||[]){
    assert.ok(!regionToCapital.has(name),'Duplicate region name needs disambiguation: '+name);
    regionToCapital.set(name,{capital,countryCode});
  }
}
let capitals=0;
for(const [region,rows] of Object.entries(world.REGION_FACTS)){
  const facts=rows.filter(row=>row[1]===('What is the capital of '+region+'?'));
  const expected=regionToCapital.get(region);
  assert.ok(expected,'Region missing from country catalogue: '+region);
  assert.equal(facts.length,1,'Region must have exactly one capital question: '+region);
  assert.equal(facts[0][2],expected.capital,'Inconsistent capital: '+region);
  assert.ok(!facts[0].slice(3).includes(expected.capital),'Capital listed as distractor: '+region);
  capitals++;
}
assert.equal(capitals,Object.keys(world.REGION_FACTS).length,'Incomplete region-capital validation');
console.log('PASS '+checked+' source-reviewed editorial regressions, '+readingQuestions+
  ' reading questions in '+readingPassages+' passages, '+capitals+' region-capital consistency checks');
