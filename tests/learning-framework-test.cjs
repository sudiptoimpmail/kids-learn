const assert=require('node:assert/strict'),F=require('../learning-framework');
const c=F.validate({schema:1,evidence:{window:8,minCards:4,minDays:2,masteryRate:.8,practiceRate:.6},grades:{custom:[{id:'goal',label:'Custom skill',requirements:['a','b']}],other:[{id:'goal',label:'Other grade',requirements:['a']}]},banks:{newBank:{mapping:{questionA:['a'],questionB:['b']}}}});
const p={};const log=(source,day,independent=true)=>F.record(c,p,{grade:'custom',bank:'newBank',source,correct:true,independent,date:day});
assert.equal(F.assess(c,p,'custom')[0].status,'Not assessed');
for(let i=0;i<4;i++)log('questionA','2026-01-01');assert.notEqual(F.assess(c,p,'custom')[0].status,'Secure');
for(let i=0;i<4;i++){log('questionA','2026-01-02');log('questionB','2026-01-01');log('questionB','2026-01-02');}
assert.equal(F.assess(c,p,'custom')[0].status,'Secure');assert.equal(F.assess(c,p,'other')[0].status,'Not assessed');assert.equal(F.assess(c,{},'custom')[0].status,'Not assessed');
const before=JSON.stringify(p);assert.equal(F.record(c,p,{grade:'custom',bank:'unknown',source:'questionA',date:'2026-01-03'}),false);assert.equal(JSON.stringify(p),before);
for(let i=0;i<8;i++)log('questionA','2026-01-03',false);assert.notEqual(F.assess(c,p,'custom')[0].status,'Secure');
console.log('PASS extensible bank/grade mapping, complete-goal evidence, independent answers, multi-day mastery and profile isolation');
