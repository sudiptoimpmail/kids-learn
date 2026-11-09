/* kids-core voice.
   Pre-recorded natural voice clips only (listed in the clip maps from app.config.json "voice").
   - Every new say() cancels the one before (sayToken), so nothing plays late or on top.
   - Web Audio first (fast, works with the silent switch), a plain <audio> element as backup.
   - Several languages: a part can be { text, lang } to use another language's clip map.
   - Device speech is never used for content. Only parts marked { device: true } (a child's name)
     may use it, and only when the config sets voice.deviceVoiceForNames. */
const VOICE_CFG = AppConfig.voice;
const AUDIO_DIR = VOICE_CFG.dir || 'audio/';
const VOICE_LANG = VOICE_CFG.lang;
const clipKey = VOICE_CFG.keys === 'unicode'
  ? (t) => String(t).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim()
  : (t) => String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const splitSentences = (t) => (String(t).match(/[^.!?]+[.!?]*/g) || []).map((x) => x.trim()).filter((x) => clipKey(x));
let CLIPS = {};                       // the main language's clip map (phrase key → file)
const CLIPS_BY_LANG = {};
const clipsReady = Promise.all(Object.entries(VOICE_CFG.clips).map(([lang, file]) =>
  fetch(file).then((r) => r.json()).then((j) => { CLIPS_BY_LANG[lang] = j; if (lang === VOICE_LANG) CLIPS = j; }).catch(() => {})));
// a preview build may ship every clip in one file: { file, index } (index = file name → [offset, length])
const VOICE_PACK = VOICE_CFG.pack || null;
let packIndex = null, packData = null;
const packReady = () => packData || (packData = Promise.all([fetch(VOICE_PACK.index).then((r) => r.json()), fetch(VOICE_PACK.file).then((r) => { if (!r.ok) throw Error(r.status); return r.arrayBuffer(); })])
  .then(([idx, ab]) => { packIndex = idx; return ab; }).catch((e) => { packData = null; throw e; }));
async function clipBytes(file) {
  if (VOICE_PACK) { const ab = await packReady(); const at = packIndex[file]; if (at) return ab.slice(at[0], at[0] + at[1]); }
  const r = await fetch(AUDIO_DIR + file); if (!r.ok) throw new Error(r.status); return r.arrayBuffer();
}
let sayToken = 0, actx, curSrc = null;
// let sound play even when the iPhone's silent switch is on (Safari 16.4+)
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
function ctx() {
  actx = actx || new (window.AudioContext || window.webkitAudioContext)();
  // iOS can leave the context 'suspended' OR 'interrupted' (app switch, call, system speech)
  if (actx.state !== 'running') actx.resume().catch(() => {});
  return actx;
}

// Backup player: a plain <audio> element, unlocked on the first touch.
const htmlPlayer = new Audio();
htmlPlayer.preload = 'auto';
let htmlUnlocked = false;

// Every touch re-wakes audio (iPhone only allows this inside a tap).
function unlockAudio() {
  try {
    const c = ctx();
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start(0);
  } catch {}
  if (!htmlUnlocked) {
    htmlPlayer.src = AUDIO_DIR + 'silence.mp3';
    const p = htmlPlayer.play();
    if (p && p.then) p.then(() => { htmlUnlocked = true; }).catch(() => {});
  }
}
['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach((ev) =>
  addEventListener(ev, unlockAudio, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden && actx) actx.resume().catch(() => {}); });

// decoded voice clips, newest last; only the most recent ones are kept so memory stays small on iPads
const bufs = new Map(), BUF_MAX = 80;
function getBuf(file) {
  if (bufs.has(file)) { const p = bufs.get(file); bufs.delete(file); bufs.set(file, p); return p; }
  while (bufs.size >= BUF_MAX) bufs.delete(bufs.keys().next().value);
  const p = clipBytes(file).then((ab) => new Promise((ok, bad) => ctx().decodeAudioData(ab, ok, bad)));
  bufs.set(file, p); p.catch(() => bufs.delete(file));
  return p;
}
// apps may add steps: expand one part into several (e.g. big numbers), or swap a part (e.g. "zed")
const VoiceHooks = { expand: [], map: [] };
const sayParts = (text) => (Array.isArray(text) ? text.map((p) => (p && typeof p === 'object' ? p : String(p))) : splitSentences(text))
  .flatMap((p) => (typeof p === 'object' ? [p] : VoiceHooks.expand.reduce((acc, fn) => acc.flatMap(fn), [p])))
  .map((p) => (typeof p === 'object' ? p : VoiceHooks.map.reduce((acc, fn) => fn(acc), p)));
const partFile = (p) => (typeof p === 'object' ? (p.device ? null : (CLIPS_BY_LANG[p.lang || VOICE_LANG] || {})[clipKey(p.text)]) : CLIPS[clipKey(p)]);
function prefetch(text) { if (text) sayParts(text).forEach((p) => { const f = partFile(p); if (f) getBuf(f).catch(() => {}); }); }
function stopClip() {
  try { curSrc && curSrc.stop(); } catch {} curSrc = null;
  try { htmlPlayer.pause(); htmlPlayer.removeAttribute('src'); htmlPlayer.load(); } catch {}
  try { if (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch {}
}

function htmlPlay(file, token = sayToken, rate = 1) {
  if (token !== sayToken) return Promise.resolve();
  return (async () => {
    let src = AUDIO_DIR + file, blob = null;
    if (VOICE_PACK) { try { blob = URL.createObjectURL(new Blob([await clipBytes(file)], { type: 'audio/mpeg' })); src = blob; } catch {} }
    if (token !== sayToken) { if (blob) URL.revokeObjectURL(blob); return; }
    await new Promise((res) => {
      let done = false; const fin = () => { if (!done) { done = true; if (blob) setTimeout(() => URL.revokeObjectURL(blob), 1000); res(); } };
      htmlPlayer.onended = fin; htmlPlayer.onerror = fin;
      htmlPlayer.src = src;
      htmlPlayer.playbackRate = rate; htmlPlayer.preservesPitch = true; htmlPlayer.webkitPreservesPitch = true;
      const p = htmlPlayer.play(); if (p && p.then) p.then(() => { if (token !== sayToken) { htmlPlayer.pause(); fin(); } }).catch(fin);
      setTimeout(fin, 30000 / rate);
    });
  })();
}
const lastAudio = { path: '', err: '' };
async function playClip(file, token = sayToken, rate = 1) {
  if (token !== sayToken) return;
  if (rate !== 1) { lastAudio.path = 'html'; return htmlPlay(file, token, rate); }
  const c = ctx();
  if (c.state !== 'running') { await Promise.race([c.resume().catch(() => {}), sleep(300)]); }
  if (token !== sayToken) return;
  if (c.state !== 'running') { lastAudio.path = 'html'; return htmlPlay(file, token); }
  let buf;
  try { buf = await getBuf(file); } catch (e) { if (token !== sayToken) return; lastAudio.path = 'html'; lastAudio.err = String(e); return htmlPlay(file, token); }
  if (token !== sayToken) return;
  return new Promise((res) => {
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    try {
      if (token !== sayToken) return fin();
      const src = c.createBufferSource(); src.buffer = buf; src.connect(c.destination);
      src.onended = fin; curSrc = src; src.start();
      lastAudio.path = 'webaudio';
      setTimeout(fin, buf.duration * 1000 + 400);
    } catch (e) { if (token !== sayToken) return fin(); lastAudio.err = String(e); htmlPlay(file, token).then(fin); }
  });
}
// a child's name only, and only when the app's config allows it
function deviceSpeak(part, token) {
  return new Promise((res) => {
    if (!VOICE_CFG.deviceVoiceForNames || !window.speechSynthesis || token !== sayToken || !part.text) return res();
    const u = new SpeechSynthesisUtterance(part.text); u.lang = part.lang || VOICE_CFG.deviceLang || 'en-US'; u.rate = 0.9;
    const g = setTimeout(res, part.text.length * 120 + 1500); u.onend = u.onerror = () => { clearTimeout(g); res(); };
    try { speechSynthesis.speak(u); } catch { clearTimeout(g); res(); }
  });
}

// opts.rate < 1 plays the same recordings slower (pitch kept)
async function say(text, opts = {}) {
  const my = ++sayToken;
  stopClip();
  if (!text || !state.voice) return;
  if (!Object.keys(CLIPS).length) await Promise.race([clipsReady, sleep(4000)]);
  if (my !== sayToken) return;
  const parts = sayParts(text);
  if (Array.isArray(text)) text = text.map((p) => (typeof p === 'object' ? p.text : p)).join(' ');
  const files = parts.map(partFile);
  if (parts.length && files.every((f, i) => f || (typeof parts[i] === 'object' && parts[i].device))) {
    say.current = null;
    for (let i = 0; i < parts.length; i++) {
      if (my !== sayToken) return;
      if (files[i]) await playClip(files[i], my, opts.rate || 1); else await deviceSpeak(parts[i], my);
    }
    return;
  }
  return deviceSay(text, opts, my);
}

function deviceSay(text) {
  // Non-robotic fallback: the question and options are still visible.
  // This hook is intentionally retained for voice audits to report missing clips.
  if (typeof testFeatureAvailable === 'function' && testFeatureAvailable()) console.warn('Missing natural recording:', text);
  return Promise.resolve();
}
