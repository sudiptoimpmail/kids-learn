#!/usr/bin/env node
'use strict';
// Objective-depth audit: report authored route depth by configured grade,
// section and skill. This is evidence inventory, not a curriculum certification.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const data=name=>JSON.parse(fs.readFileSync('data/'+name+'.json','utf8')).datasets;
const map=data('curriculum-map');
const bank=data('grade23-extension');
const groups=new Map(),seen=new Set();
let total=0;
for(const [kind,routes] of Object.entries(map.ROUTES)){
  assert.ok(Array.isArray(bank[kind]),'Missing authored bank '+kind);
  assert.ok(Array.isArray(routes),'Missing route list '+kind);
  for(const route of routes){
    assert.ok(map.GRADES[route.grade],'Unknown grade '+route.grade);
    assert.ok(map.GRADES[route.grade].g[route.section],
      'Section not configured for grade: '+route.grade+'/'+route.section);
    assert.ok(typeof route.skill==='string'&&route.skill.trim(),'Missing authored skill');
    assert.ok(Number.isInteger(route.level),'Invalid level for '+route.id);
    const [lo,hi]=map.GRADES[route.grade].g[route.section].split('-').map(Number);
    assert.ok(route.level>=lo&&route.level<=hi,
      'Route outside grade level range: '+route.id);
    const id=kind+':'+route.id;
    assert.ok(!seen.has(id),'Duplicate authored route '+id);
    seen.add(id);
    const key=[route.grade,route.section,route.skill].join('|');
    const g=groups.get(key)||{grade:route.grade,section:route.section,skill:route.skill,
      authoredRoutes:0,levels:new Set(),sources:new Set()};
    g.authoredRoutes++;
    g.levels.add(route.level);
    g.sources.add(route.source);
    groups.set(key,g);
    total++;
  }
}
const rows=[...groups.values()].map(g=>({
  grade:g.grade,section:g.section,skill:g.skill,
  authoredRoutes:g.authoredRoutes,
  authoredLevels:[...g.levels].sort((a,b)=>a-b),
  sources:[...g.sources].sort(),
  depthFlag:g.authoredRoutes<12?'below-12-authored-routes':'12-or-more-authored-routes'
})).sort((a,b)=>a.grade.localeCompare(b.grade)||a.section.localeCompare(b.section)||
  a.skill.localeCompare(b.skill));
assert.ok(total>0,'No curriculum routes found');
const report={note:'Counts authored curriculum routes only. Not standards coverage, unique prompts, interaction variety or grade completion.',
  authoredRoutes:total,objectives:rows.length,rows};
if(process.argv.includes('--json')) console.log(JSON.stringify(report,null,2));
else {
  console.log('Authored curriculum routes: '+total+'; grade/section/skill groups: '+rows.length);
  for(const r of rows)console.log([r.grade,r.section,r.skill,r.authoredRoutes,
    r.authoredLevels.join(','),r.depthFlag].join(' | '));
}
