// Landmark alt text must describe the drawing instead of announcing the
// correct answer in the future photo-identification question modes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const landmarks=JSON.parse(fs.readFileSync('data/landmarks.json','utf8')).datasets;
const catalog=landmarks.LANDMARKS,descriptions=landmarks.MEDIA_DESCRIPTIONS;
assert.equal(catalog.length,39);
assert.deepEqual(Object.keys(descriptions).sort(),catalog.map(x=>x[0]).sort(),
 'Every landmark needs one authored descriptive alt');
assert.equal(new Set(Object.values(descriptions).map(x=>x.toLowerCase())).size,39);
for(const [id,name,country,city] of catalog){
 const alt=descriptions[id];
 assert.ok(typeof alt==='string'&&alt.split(/\s+/).length>=8,
   'Too little useful visual description for '+id);
 assert.ok(!alt.toLowerCase().includes(name.toLowerCase()),
   'Answer leaked in alt description '+id);
 assert.ok(!/[<>]/.test(alt),'Unsafe markup in landmark alt: '+id);
}
(async()=>{
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox']
 });
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:8765/index.html');
  await page.waitForFunction(()=>!!window.KidsLearnReady);
  await page.evaluate(()=>window.KidsLearnReady);
  const report=await page.evaluate(()=>{
   const errs=[],check=(p,m)=>{if(!p)errs.push(m)};
   for(const [id,name] of LANDMARKS){
     const html=landmarkArt(id,'small');
     const template=document.createElement('template');
     template.innerHTML=html;
     const image=template.content.querySelector('img');
     check(!!image,'Missing landmark image '+id);
     if(!image)continue;
     const alt=image.alt;
     check(alt.toLowerCase().startsWith('illustration showing '),
       'Wrong illustration media status '+id);
     check(alt.length>=35 && !alt.toLowerCase().includes(name.toLowerCase()),
       'Alt is blank or reveals landmark name '+id);
     check(image.getAttribute('src')==='assets/landmarks/'+id+'.svg',
       'Wrong bundled schematic path '+id);
   }
   const photoId='liberty';
   LANDMARK_PHOTO_IDS.add(photoId);
   const template=document.createElement('template');
   template.innerHTML=landmarkArt(photoId,'small');
   const photo=template.content.querySelector('img');
   check(photo?.alt.startsWith('Photograph showing '),
     'Real-photo alt label missing');
   check(!photo?.alt.toLowerCase().includes('statue of liberty'),
     'Answer leaked via photograph alt');
   check(photo?.getAttribute('src')==='assets/landmark-photos/liberty.webp',
     'Photo allowlist path not used');
   LANDMARK_PHOTO_IDS.delete(photoId);
   check(landmarkHasPhoto(photoId)===false,
     'Test left modified photo allowlist');
   // Until curated real photos are shipped, a schematic must never trigger a
   // photo-recognition card, even when a child visits Famous Places repeatedly.
   state.grade='g2';
   for(let i=0;i<120;i++){
     const q=genPlaces(3);
     check(!q.key.startsWith('lm-which-')&&!q.key.startsWith('lm-name-'),
       'Schematic shown as a photographic recognition challenge: '+q.key);
   }
   return errs;
  });
  assert.deepEqual(report,[],JSON.stringify(report));
  assert.deepEqual(errors,[]);
  console.log('PASS 39 descriptive landmark alternatives, no revealed answers or schematic photo-recognition');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
