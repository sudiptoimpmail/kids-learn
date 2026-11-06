/* Reusable family controls, collections and portfolio, configured by the learning framework. */
const familyConfig=learningConfig.family;
const familyOptions=()=>state.familySettings||{};
const familyStoryRate=()=>familyConfig.storyRates.some(x=>x.value===familyOptions().storyRate)?familyOptions().storyRate:1;
function logPortfolioWord(q,alone){
  if(!alone||isTestMode()||!q.spell?.word)return;
  const word=String(q.spell.word).toLowerCase();if(!/^[a-z]{1,30}$/.test(word))return;
  const words=state.wordPortfolio||(state.wordPortfolio={});words[word]={grade:state.grade,date:dayKey()};
  const keys=Object.keys(words);while(keys.length>familyConfig.portfolioLimit)delete words[keys.shift()];
}
const originalCollections=renderStickers;
renderStickers=function(){
  originalCollections();$('#stickerGrid').style.display='block';
  $('#stickerGrid').innerHTML=learningConfig.collections.map(set=>{
    const have=set.items.filter(s=>state.stickers.includes(s));
    return `<section class="panel"><h3>${esc(set.title)} · ${have.length}/${set.items.length}${have.length===set.items.length?' ✓':''}</h3><div class="collection-grid">${set.items.map(s=>`<div class="stk ${have.includes(s)?'have':''}" aria-label="${have.includes(s)?'Collected':'Not collected'}">${have.includes(s)?s:'❔'}</div>`).join('')}</div></section>`;
  }).join('');
};
const portfolio=document.createElement('section');portfolio.id='portfolio';portfolio.className='screen';document.body.append(portfolio);
function openPortfolio(){
  const words=Object.keys(state.wordPortfolio||{}),drawings=state.drawings||[];
  portfolio.innerHTML=`<header class="play-top"><button class="icon-btn" id="portfolioBack" aria-label="Back home">‹</button><h2>Things I have made</h2></header><h3>Words I spelled on my own</h3><p>These are successful practice attempts, not a complete reading assessment.</p><div class="collection-grid">${words.length?words.map(w=>`<button class="big-btn small" data-word="${esc(w)}">${esc(w)}</button>`).join(''):'Finish a spelling word without a hint to add it here.'}</div><h3>My drawings</h3><div class="grade-goals">${drawings.length?drawings.filter(d=>/^data:image\/(jpeg|png);base64,/.test(d.img)).map(d=>`<figure><img style="width:100%" src="${d.img}" alt="${esc(d.name||'My drawing')}"><figcaption>${esc(d.name||'My drawing')}</figcaption></figure>`).join(''):'Your finished drawings will appear here.'}</div>`;
  $('#portfolioBack').onclick=()=>{renderHome();show('home');};portfolio.querySelectorAll('[data-word]').forEach(b=>b.onclick=()=>say(b.dataset.word));show('portfolio');
}
const portfolioButton=document.createElement('button');portfolioButton.className='big-btn small';portfolioButton.id='portfolioBtn';portfolioButton.textContent='🎨 My creations';journeyButton.after(portfolioButton);portfolioButton.onclick=openPortfolio;
const familyPanel=document.createElement('section');familyPanel.className='field';familyPanel.id='familyControls';$('#voiceStatus').after(familyPanel);
function renderFamilyControls(){
  const settings=familyOptions();
  familyPanel.innerHTML=`<h3>Family reading and time controls</h3><label class="lvrow">Story pace<select id="storyRate">${familyConfig.storyRates.map(x=>`<option value="${x.value}">${esc(x.label)}</option>`).join('')}</select></label><label class="lvrow">Session length<select id="sessionMinutes">${familyConfig.sessionMinutes.map(n=>`<option value="${n}">${n?n+' minutes':'No limit'}</option>`).join('')}</select></label><small>Counts foreground activity time per child. A ${familyConfig.breakMinutes}-minute break starts a fresh session. Settings and background time do not count.</small><label class="lvrow">Quiet hours<input id="quietEnabled" type="checkbox"></label><label class="lvrow">From<input id="quietStart" type="time"></label><label class="lvrow">Until<input id="quietEnd" type="time"></label><small>Uses this device's local time. Matching start and end times turn the quiet window off.</small>`;
  $('#storyRate').value=String(familyStoryRate());$('#sessionMinutes').value=String(settings.sessionMinutes||0);$('#quietEnabled').checked=!!settings.quietEnabled;$('#quietStart').value=settings.quietStart||'20:00';$('#quietEnd').value=settings.quietEnd||'07:00';
  familyPanel.onchange=()=>{state.familySettings={storyRate:+$('#storyRate').value,sessionMinutes:+$('#sessionMinutes').value,quietEnabled:$('#quietEnabled').checked,quietStart:$('#quietStart').value,quietEnd:$('#quietEnd').value};save();};
}
const originalFamilySettings=openSettings;openSettings=function(){originalFamilySettings();renderFamilyControls();};
function quietAt(settings,date=new Date()){
  if(!settings.quietEnabled)return false;
  const parse=s=>/^\d{2}:\d{2}$/.test(s||'')?+s.slice(0,2)*60 + +s.slice(3):null;
  const start=parse(settings.quietStart),end=parse(settings.quietEnd),now=date.getHours()*60+date.getMinutes();
  if(start==null||end==null||start===end)return false;
  return start<end?now>=start&&now<end:now>=start||now<end;
}
function familyBlockReason(now=Date.now()){
  if(quietAt(familyOptions(),new Date(now)))return 'Quiet time';
  const session=state.learningSession;
  if(session&&now-session.lastActive>=familyConfig.breakMinutes*60000){delete state.learningSession;return '';}
  const limit=familyOptions().sessionMinutes||0;
  return limit&&session?.usedMs>=limit*60000?'Time for a break':'';
}
function showFamilyBreak(reason){
  if($('#familyBreak'))return;
  sayToken++;stopClip();if(typeof stopReading==='function')stopReading();if(typeof stopGame==='function')stopGame();
  const box=document.createElement('div');box.id='familyBreak';box.className='family-break';box.innerHTML=`<div class="panel"><h2>${esc(reason)}</h2><p>Let us take a break. Your progress is saved.</p><button class="big-btn" data-home>Home</button><button class="link-btn" data-parent>Grown-up settings</button></div>`;document.body.append(box);
  box.querySelector('[data-home]').onclick=()=>{box.remove();show('home');};box.querySelector('[data-parent]').onclick=()=>{box.remove();askPin(openSettings);};save();
}
const originalFamilyShow=show;
show=function(id){const reason=familyConfig.limitedScreens.includes(id)&&familyBlockReason();if(reason){originalFamilyShow('home');showFamilyBreak(reason);return;}originalFamilyShow(id);};
// Stop activity entry before generators/timers start; the screen guard also covers other routes.
for(const name of ['startRound','openGame','openPlayZone','openTrace','openLibrary','openLearn']){
  const original=globalThis[name];if(typeof original!=='function')continue;
  globalThis[name]=function(...args){const reason=familyBlockReason();if(reason){showFamilyBreak(reason);return;}return original(...args);};
}
let familyTick=performance.now();
setInterval(()=>{
  const now=performance.now(),delta=Math.min(2000,Math.max(0,now-familyTick));familyTick=now;
  if(document.hidden||!familyConfig.limitedScreens.some(id=>$('#'+id)?.classList.contains('active')))return;
  const reason=familyBlockReason();if(reason){originalFamilyShow('home');showFamilyBreak(reason);return;}
  if(!familyOptions().sessionMinutes)return;
  const s=state.learningSession||(state.learningSession={usedMs:0,lastActive:Date.now()});s.usedMs+=delta;s.lastActive=Date.now();
},1000);
document.addEventListener('visibilitychange',()=>{familyTick=performance.now();});
