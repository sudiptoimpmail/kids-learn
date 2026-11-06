// Deterministic arithmetic audit for every authored Explorer math mission.
// The test calculates its own result from question-owned solution metadata.
// No eval() / Function() and no network; educational meaning still needs review.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const questionBank = JSON.parse(fs.readFileSync('data/explorer-math.json','utf8')).datasets.questions;
const curriculum = JSON.parse(fs.readFileSync('data/curriculum-map.json','utf8')).datasets.GRADES;

// Tiny expression parser: + - * / parentheses, integer/decimal numbers, floor().
function evaluate(expression) {
  assert.equal(typeof expression,'string');
  const compact=expression.replace(/\s+/g,'');
  const tokens=compact.match(/floor|\d+(?:\.\d+)?|[()+*/-]/g)||[];
  assert.equal(tokens.join(''),compact,'Unsupported calculation '+expression);
  let pos=0;
  function atom() {
    const token=tokens[pos++];
    if (token==='-') return -atom();
    if (token==='floor') {
      assert.equal(tokens[pos++],'(');
      const value=expr();
      assert.equal(tokens[pos++],')');
      return Math.floor(value);
    }
    if (token==='(') {
      const value=expr();
      assert.equal(tokens[pos++],')');
      return value;
    }
    assert.ok(token!=null && /^\d/.test(token),'Expected operand in '+expression);
    return Number(token);
  }
  function term() {
    let result=atom();
    while (tokens[pos]==='*'||tokens[pos]==='/') {
      const op=tokens[pos++],right=atom();
      assert.ok(op!=='/'||right!==0,'Division by zero');
      result=op==='*'?result*right:result/right;
    }
    return result;
  }
  function expr() {
    let result=term();
    while (tokens[pos]==='+'||tokens[pos]==='-') {
      const op=tokens[pos++],right=term();
      result=op==='+'?result+right:result-right;
    }
    return result;
  }
  const result=expr();
  assert.equal(pos,tokens.length,'Unparsed expression '+expression);
  assert.ok(Number.isFinite(result),'Invalid calculation '+expression);
  return result;
}
function valueOf(text) {
  const match=String(text).match(/(\d[\d,]*)(?:\s*\/\s*(\d[\d,]*))?/);
  assert.ok(match,'No numeric answer in '+text);
  const numerator=Number(match[1].replaceAll(',',''));
  return match[2]?numerator/Number(match[2].replaceAll(',','')):numerator;
}
function clockToMinutes(text) {
  const m=/^(1[0-2]|[1-9]):([0-5]\d) (AM|PM)$/.exec(text);
  assert.ok(m,'Invalid 12-hour clock: '+text);
  return ((+m[1]%12)+(m[3]==='PM'?12:0))*60+Number(m[2]);
}
function formatClock(minutes) {
  const n=((minutes%1440)+1440)%1440;
  const hour=Math.floor(n/60);
  return String(hour%12||12)+':'+String(n%60).padStart(2,'0')+(hour>=12?' PM':' AM');
}
function compute(meta) {
  switch (meta.kind) {
    case 'arithmetic': return {kind:'number',value:evaluate(meta.expression)};
    case 'time-add': return {kind:'text',value:formatClock(clockToMinutes(meta.start)+meta.minutes)};
    case 'time-elapsed': return {kind:'number',value:(clockToMinutes(meta.end)-clockToMinutes(meta.start)+1440)%1440};
    case 'largest': {
      const entries=Object.entries(meta.values);
      assert.ok(entries.length>=2,'Largest comparison needs 2+ items');
      const scored=entries.map(([label,value])=>[label,typeof value==='number'?value:valueOf(value)]);
      const max=Math.max(...scored.map(x=>x[1]));
      assert.equal(scored.filter(x=>x[1]===max).length,1,'Largest comparison has a tie');
      return {kind:'text',value:scored.find(x=>x[1]===max)[0]};
    }
    case 'budget': {
      const remaining=meta.budget-meta.costs.reduce((a,b)=>a+b,0);
      assert.ok(Number.isInteger(remaining));
      return {kind:'text',value:(remaining>=meta.minimumRemaining?'yes, $':'no, $')+remaining+' left'};
    }
    case 'equal-areas': {
      assert.equal(meta.rectangles.length,2);
      const a=meta.rectangles.map(([w,h])=>w*h);
      assert.equal(a[0],a[1],'Not equal area');
      return {kind:'text',value:'both have an area of '+a[0]+' square units'};
    }
    case 'rounded-product': {
      const nearest=meta.nearest;
      assert.ok(nearest>0);
      return {kind:'text',value:'about '+meta.values.reduce((p,v)=>p*Math.round(v/nearest)*nearest,1)};
    }
    case 'multiplication-check': {
      assert.equal(meta.dividend/meta.divisor,meta.quotient);
      return {kind:'text',value:meta.divisor+' × '+meta.quotient+' = '+meta.dividend};
    }
    case 'shorter-route': {
      const routes=Object.entries(meta.routes).map(([label,parts])=>[label,parts.reduce((a,b)=>a+b,0)]);
      assert.equal(routes.length,2);
      assert.notEqual(routes[0][1],routes[1][1]);
      routes.sort((a,b)=>a[1]-b[1]);
      const diff=routes[1][1]-routes[0][1];
      return {kind:'text',value:routes[0][0]+' by '+diff+' mile'+(diff===1?'':'s')};
    }
    case 'coordinate':
      return {kind:'text',value:'('+(meta.start[0]+meta.delta[0])+','+(meta.start[1]+meta.delta[1])+')'};
    default: throw Error('Unknown solution type '+meta.kind);
  }
}
// Recompute the visual meaning independently from the authored solution
// expression; this catches inconsistent arrays, points, bars, and fraction strips.
function visualValue(rep) {
  const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  assert.ok(rep && typeof rep==='object');
  if(rep.kind==='array') {
    assert.ok(integer(rep.rows,1,10)&&integer(rep.columns,1,10)&&
      rep.rows*rep.columns<=80,'Invalid tile array');
    assert.ok(['count','perimeter'].includes(rep.answerRule),'Invalid array answer rule');
    return rep.answerRule==='count'?rep.rows*rep.columns:2*(rep.rows+rep.columns);
  }
  if(rep.kind==='number-line') {
    assert.ok(integer(rep.steps,2,16)&&Number.isFinite(rep.start)&&
      Number.isFinite(rep.end)&&Number.isFinite(rep.point) &&
      rep.end>rep.start && rep.point>=rep.start && rep.point<=rep.end &&
      rep.answerRule==='point','Invalid number-line geometry');
    const idx=(rep.point-rep.start)*rep.steps/(rep.end-rep.start);
    assert.ok(Math.abs(idx-Math.round(idx))<1e-8,'Point not aligned to a tick');
    return rep.point;
  }
  if(rep.kind==='bar-chart') {
    assert.ok(Array.isArray(rep.labels)&&Array.isArray(rep.values)&&
      rep.labels.length===rep.values.length &&
      integer(rep.labels.length,2,5)&&rep.values.every(v=>integer(v,1,40)),
      'Invalid chart dimensions');
    if(rep.answerRule==='total')return rep.values.reduce((a,b)=>a+b,0);
    assert.equal(rep.answerRule,'difference');
    assert.ok(Array.isArray(rep.compare)&&rep.compare.length===2 &&
      rep.compare.every(i=>integer(i,0,rep.values.length-1)) &&
      rep.compare[0]!==rep.compare[1],'Invalid chart comparison');
    return rep.values[rep.compare[0]]-rep.values[rep.compare[1]];
  }
  if(rep.kind==='fraction-strip') {
    assert.ok(integer(rep.parts,2,12)&&integer(rep.shaded,1,rep.parts-1)&&
      rep.answerRule==='fraction','Invalid fraction strip');
    return rep.shaded/rep.parts;
  }
  throw Error('Unsupported visual model '+rep.kind);
}
const seen=new Set(),counts={};
for (const q of questionBank) {
  assert.ok(q.id && !seen.has(q.id),'Duplicate math mission id '+q.id);
  seen.add(q.id);
  assert.ok(q.verification && q.verification.kind,'Missing mathematical verification '+q.id);
  assert.ok(Array.isArray(q.grades)&&q.grades.length,'Missing eligible grades '+q.id);
  for (const grade of q.grades) {
    const range=curriculum[grade]?.g?.story?.split('-').map(Number);
    assert.ok(range&&q.level>=range[0]&&q.level<=range[1],q.id+' invalid curriculum eligibility '+grade);
  }
  const result=compute(q.verification);
  if(q.representation) {
    assert.equal(result.kind,'number','Diagrams require a numeric verified answer: '+q.id);
    const drawn=visualValue(q.representation);
    assert.ok(Math.abs(drawn-result.value)<1e-9,
      q.id+': rendered diagram means '+drawn+', calculation means '+result.value);
  }
  const actual=result.kind==='number'?valueOf(q.answer):q.answer;
  if (result.kind==='number') assert.ok(Math.abs(result.value-actual)<1e-9,
    q.id+': expected '+result.value+', got '+q.answer);
  else assert.equal(actual,result.value,q.id+' incorrect authored answer');
  assert.ok(q.choices.includes(q.answer),q.id+' answer is not a choice');
  const normalized=q.choices.map(x=>String(x).trim().toLowerCase());
  assert.equal(new Set(normalized).size,normalized.length,q.id+' repeated choices');
  if(result.kind==='number') {
    const numeric=q.choices.filter(x=>/(\d)/.test(String(x))).map(x=>valueOf(x));
    assert.equal(numeric.filter(x=>Math.abs(x-result.value)<1e-9).length,1,
      q.id+' multiple mathematically correct numeric choices');
  }
  counts[result.kind]=(counts[result.kind]||0)+1;
}
assert.equal(questionBank.length,86,'Every authored math mission must have a solution');
assert.equal(questionBank.filter(q=>q.representation).length,24,'Twenty-four visual missions required');
console.log('PASS '+questionBank.length+' Explorer math missions independently evaluated; '+JSON.stringify(counts));
