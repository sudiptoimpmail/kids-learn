/* Data-only curriculum contracts and pure evidence operations; no DOM or grade names. */
(function(root){
  const key=(grade,skill)=>JSON.stringify([grade,skill]);
  function validate(config){
    if(config.schema!==1||!config.grades||!config.banks)throw Error('Invalid learning framework configuration');
    const rule=config.evidence;
    if(!rule||!Number.isInteger(rule.window)||!Number.isInteger(rule.minCards)||rule.minCards<1||rule.window<rule.minCards||!Number.isInteger(rule.minDays)||rule.minDays<1||rule.minDays>rule.window||!(rule.practiceRate>=0&&rule.practiceRate<=rule.masteryRate&&rule.masteryRate<=1))throw Error('Invalid evidence policy');
    for(const bank of Object.values(config.banks))if(!bank.mapping||Object.values(bank.mapping).some(v=>!Array.isArray(v)||v.some(s=>typeof s!=='string')))throw Error('Invalid bank mapping');
    for(const [grade,goals]of Object.entries(config.grades)){
      const ids=new Set();for(const goal of goals){
        if(!goal.id||ids.has(goal.id)||!goal.label||!Array.isArray(goal.requirements)||new Set(goal.requirements).size!==goal.requirements.length)throw Error('Invalid or duplicate goal in '+grade);
        ids.add(goal.id);
      }
    }
    for(const [source,demo] of Object.entries(config.demonstrations||{})){
      const validText=s=>typeof s==='string'&&s.trim().length>0;
      const q=demo.try;
      if(!validText(demo.id)||!validText(demo.title)||!Array.isArray(demo.steps)||!demo.steps.length||demo.steps.some(s=>!validText(s.text)||!validText(s.visual)||(s.audio!==undefined&&(!Array.isArray(s.audio)||!s.audio.length||s.audio.some(a=>!validText(a)))))||!q||!validText(q.question)||!validText(q.explanation)||!Array.isArray(q.options)||q.options.length<2||q.options.some(o=>!validText(o))||new Set(q.options).size!==q.options.length||!q.options.includes(q.answer))throw Error('Invalid demonstration: '+source);
    }
    return config;
  }
  function record(config,profile,event){
    const bank=config.banks[event.bank];
    if(!bank||!config.grades[event.grade]||event.preview||!event.date)return false;
    const skills=bank.mapping[event.source]||[];
    const allowed=new Set(config.grades[event.grade].flatMap(g=>g.requirements));
    const rows=profile.skillEvidence||(profile.skillEvidence={});let changed=false;
    for(const skill of skills){if(!allowed.has(skill))continue;
      const id=key(event.grade,skill),r=rows[id]||(rows[id]={grade:event.grade,skill,n:0,recent:'',days:[],banks:[]});
      r.n++;r.recent=(r.recent+(event.correct&&event.independent?'1':'0')).slice(-config.evidence.window);
      r.days=[...new Set([...r.days,event.date])].slice(-config.evidence.window);
      r.banks=[...new Set([...r.banks,event.bank])];changed=true;
    }return changed;
  }
  function assess(config,profile,grade){
    const rule=config.evidence;
    return(config.grades[grade]||[]).map(goal=>{
      const records=goal.requirements.map(skill=>profile.skillEvidence?.[key(grade,skill)]);
      const n=records.reduce((sum,r)=>sum+(r?.n||0),0);
      const secure=r=>!!r&&r.recent.length>=rule.minCards&&r.days.length>=rule.minDays&&[...r.recent].filter(x=>x==='1').length/r.recent.length>=rule.masteryRate;
      const mastered=records.length>0&&records.every(secure);
      const practising=records.some(r=>r&&r.recent.length>=rule.minCards&&[...r.recent].filter(x=>x==='1').length/r.recent.length>=rule.practiceRate);
      return{...goal,n,status:!n?'Not assessed':mastered?'Secure':practising?'Practising':'Developing'};
    });
  }
  const api={validate,record,assess};root.LearningFramework=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
