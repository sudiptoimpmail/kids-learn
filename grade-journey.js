/* Shared child/parent view of grade skills. Evidence is isolated by child and grade.
   Broad goals are app practice indicators, not a comprehensive school assessment. */
const learningConfig=LearningFramework.validate(ContentData.get('curriculum-map','learningFramework'));
const gradeGoals=grade=>learningConfig.grades[grade]||[];
function logGradeEvidence(q,cat,level,alone){
  LearningFramework.record(learningConfig,state,{grade:state.grade,bank:q.learningBank||'built-in',source:q.learningSource||cat+':'+level,correct:!!q.ok,independent:alone,date:dayKey(),preview:isTestMode()});
}
const gradeGoalRows=()=>LearningFramework.assess(learningConfig,state,state.grade);
function gradeSummaryHTML(child=false) {
  const rows=gradeGoalRows();
  return `<h3>${child?'My learning journey':'Grade skill summary'} · ${esc(gradeName(state.grade))}</h3>
    <p class="note">${child?'Choose something to practise. Each small step counts!':'Based on practice in this app for the current grade. These broad goals do not cover the entire school curriculum. Unassessed skills are not weaknesses.'}</p>
    <div class="grade-goals">${rows.map(r=>`<article class="grade-goal"><b>${esc(r.label)}</b><span>${r.status}</span><small>${r.n?`${r.n} practice answers recorded`:'More evidence needed'}${!r.categories.length?' · Explore together through drawing, writing and conversation':''}</small>${r.categories.length?`<button type="button" class="big-btn small" data-goal="${r.id}">Practise</button>`:''}</article>`).join('')}</div>`;
}
function bindGoalButtons(root) {
  root.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{
    const goal=gradeGoals(state.grade).find(g=>g.id===b.dataset.goal);
    const candidates=goal.requirements.map(source=>({source, activity:learningConfig.activities[source]})).filter(x=>x.activity&&visibleGames().some(c=>c.id===x.activity.category&&c.gen));
    const target=candidates.find(x=>!state.skillEvidence?.[JSON.stringify([state.grade,x.source])])||candidates[0];
    if(target)startRound(target.activity.category,5,false,target.activity.level);
  });
}
const originalGradeDashboard=renderDashboard;
renderDashboard=function(){
  originalGradeDashboard();
  let box=$('#gradeSummary');if(!box){box=document.createElement('section');box.id='gradeSummary';$('#dashSummary').after(box);}
  box.innerHTML=gradeSummaryHTML();bindGoalButtons(box);
  const brain=GAMES.filter(g=>BRAIN_GAME_IDS.has(g.id)&&brainVisible(g));
  $('#brainProgress').innerHTML=`<p>Brain puzzles build reasoning through practice; their game levels are separate from grade skills.</p><ul>${brain.map(g=>`<li>${esc(g.title||g.name||g.id)} · Level ${state.gameLv?.[g.id]||1}</li>`).join('')}</ul>`;
  const secure=gradeGoalRows().filter(r=>r.status==='Secure').length;
  $('#learningProgressLabel').textContent=`Learning progress · ${secure} skills secure in app practice`;
};
const journey=document.createElement('section');journey.id='journey';journey.className='screen';
journey.innerHTML='<header class="play-top"><button class="icon-btn" id="journeyBack" aria-label="Back home">‹</button><h2>My learning journey</h2></header><div id="journeyGoals"></div>';
document.body.append(journey);
const journeyButton=document.createElement('button');journeyButton.className='big-btn small';journeyButton.id='journeyBtn';journeyButton.textContent='🌱 My learning journey';$('#todayChip').after(journeyButton);
journeyButton.onclick=()=>{$('#journeyGoals').innerHTML=gradeSummaryHTML(true);bindGoalButtons($('#journeyGoals'));show('journey');};$('#journeyBack').onclick=()=>{renderHome();show('home');};
// One reusable demonstration player. Banks author examples, steps and supported audio keys.
function openDemonstration(demo,onDone){
  const old=$('#lessonSheet');if(old)old.remove();
  const sheet=document.createElement('div');sheet.id='lessonSheet';sheet.className='overlay';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label',demo.title);
  document.body.append(sheet);let step=0;
  const close=()=>{sayToken++;stopClip();sheet.remove();};
  function paint(){
    const s=demo.steps[step];
    sheet.innerHTML=`<div class="panel lesson-panel"><h2>${esc(demo.title)}</h2>${s?`<p>Show me · ${step+1} / ${demo.steps.length}</p><div class="lesson-visual">${esc(s.visual)}</div><p>${esc(s.text)}</p><button class="big-btn" data-next>Next</button>`:`<h3>Try together</h3><p>${esc(demo.try.question)}</p><div>${demo.try.options.map(o=>`<button class="big-btn small" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}</div><p id="lessonFeedback" role="status"></p><button class="big-btn" data-done hidden>Try on my own</button>`}<button class="link-btn" data-skip>Skip demonstration</button></div>`;
    sheet.querySelector('[data-skip]').onclick=()=>{close();onDone?.();};
    if(s){sheet.querySelector('[data-next]').onclick=()=>{step++;paint();};if(s.audio)say(s.audio);}
    else sheet.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
      $('#lessonFeedback').textContent=(b.dataset.answer===demo.try.answer?'Yes! ':'Let us look together. ')+demo.try.explanation;
      sheet.querySelector('[data-done]').hidden=false;sheet.querySelector('[data-done]').onclick=()=>{close();onDone?.();};
    });
  }paint();sheet.querySelector('button')?.focus();
}
const showMe=document.createElement('button');showMe.id='showMeBtn';showMe.className='big-btn small';showMe.textContent='Show me';showMe.hidden=true;$('#play .play-top').after(showMe);
const originalLearningRound=startRound;
startRound=function(...args){
  const result=originalLearningRound(...args);
  const demo=learningConfig.demonstrations[args[0]+':'+(args[3]||levelOf(args[0]))];
  showMe.hidden=!demo;showMe.onclick=()=>openDemonstration(demo);
  return result;
};
const originalJourneyOpen=journeyButton.onclick;
journeyButton.onclick=()=>{
  originalJourneyOpen();
  const secure=gradeGoalRows().filter(r=>r.status==='Secure').length;
  const awards=learningConfig.milestones.filter(m=>secure>=m.minSecure);
  if(awards.length){const box=document.createElement('section');box.className='panel';box.innerHTML='<h3>My milestones</h3>'+awards.map(m=>`<article class="grade-goal"><h3>🌟 ${esc(m.title)}</h3><p>${esc(state.name||'You')} demonstrated ${secure} skills through independent practice across multiple days.</p></article>`).join('');$('#journeyGoals').append(box);}
};
