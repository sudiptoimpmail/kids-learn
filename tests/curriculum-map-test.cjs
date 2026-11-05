#!/usr/bin/env node
'use strict';
/* Deterministic, dependency-free grade, section, skill and question routing audit. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=name=>{
  const o=JSON.parse(fs.readFileSync('data/'+name+'.json','utf8'));
  assert.equal(o.schema,1);
  assert.equal(o.namespace,name);
  return o.datasets;
};
const map=read('curriculum-map');
const core=read('content'), ext=read('grade23-extension');
const names=['prek','k','g1','g2','g3'], sections=new Set(), ids=new Set();
assert.equal(core.GRADES,undefined,'No second source of truth for grade ranges');
const fallbackPresentation = map.policy.presentation;
assert.ok(fallbackPresentation && fallbackPresentation.readingScale > 1, 'Missing default reading presentation');
let previousScale = Infinity;
for(const name of names){
  assert.ok(map.GRADES[name]&&map.PROFILES[name],name+' must have a profile');
  const presentation = map.GRADES[name].presentation;
  assert.ok(presentation && Number.isFinite(presentation.readingScale) && presentation.readingScale > 1 && presentation.readingScale <= 1.6,
    name+' must define a child-readable scale');
  assert.ok(Number.isFinite(presentation.readingLineHeight) && presentation.readingLineHeight >= 1.4 && presentation.readingLineHeight <= 1.7,
    name+' must define readable line spacing');
  assert.ok(presentation.readingScale < previousScale, name+' should use a progressively denser reading scale');
  previousScale = presentation.readingScale;
  for(const [section,r] of Object.entries(map.GRADES[name].g)){
    const profile=map.PROFILES[name].sections[section];
    assert.ok(profile,name+'/'+section+' missing curriculum skill profile');
    assert.ok(Array.isArray(profile.skills)&&profile.skills.length>0,'Missing skills '+name+'/'+section);
    const range=r.split('-').map(Number);
    assert.deepEqual(profile.levels,range,'Range mismatch '+name+'/'+section);
    assert.ok(range[0]>=1&&range[1]>=range[0]&&range[1]<=8,'Invalid range '+name+'/'+section);
    sections.add(section);
  }
  assert.deepEqual(Object.keys(map.PROFILES[name].sections).sort(),
    Object.keys(map.GRADES[name].g).sort(),'Unmatched grade sections '+name);
}
for(const [bank,rows] of Object.entries(ext)){
  const routes=map.ROUTES[bank];
  assert.ok(Array.isArray(routes),'No routes for '+bank);
  assert.equal(routes.length,rows.length,'Unmapped new questions '+bank);
  for(const [i,route] of routes.entries()){
    assert.ok(!ids.has(route.id),'Duplicate curriculum id '+route.id);
    ids.add(route.id);
    const profile=map.PROFILES[route.grade]?.sections[route.section];
    assert.ok(profile,'Question with no grade or section '+route.id);
    assert.ok(route.level>=profile.levels[0]&&route.level<=profile.levels[1],'Misgraded level '+route.id);
    assert.ok(route.skill,'No learning objective '+route.id);
    assert.equal(route.source,'grade23-extension');
    if(bank==='SCIENCE')assert.equal(route.section,'sci');
    if(bank==='GK')assert.equal(route.section,'gk');
    if(bank==='STORIES')assert.equal(route.section,'sent');
    if(bank==='THINKING_ODD')assert.equal(route.section,'odd');
    if(bank==='THINKING_SEQUENCES')assert.equal(route.section,'sequence');
  }
}
assert.equal(ids.size,115);
for(const grade of ['g2','g3']){
  assert.ok(map.PROFILES[grade].sections.sent.skills.length>=3,'Thin reading skills '+grade);
  assert.ok(map.PROFILES[grade].sections.sci.skills.length>=3,'Thin science skills '+grade);
  assert.ok(map.PROFILES[grade].sections.numsense.skills.length>=3,'Thin number-sense skills '+grade);
}
const gradeCount=Object.fromEntries(names.map(g=>[g,Object.keys(map.GRADES[g].g).length]));
const split=Object.fromEntries(Object.entries(map.ROUTES).map(([bank,rows])=>[bank,
  Object.fromEntries(['g2','g3'].map(g=>[g,rows.filter(r=>r.grade===g).length]))]));
console.log('PASS',ids.size,'grade-routed learning items,',sections.size,'total section types,',JSON.stringify(gradeCount),'grade scopes',JSON.stringify(split));
