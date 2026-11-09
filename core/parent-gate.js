/* kids-core grown-up PIN (asked before Settings and other grown-up areas).
   - The first PIN is created only after the device owner is verified (Face ID / Touch ID / passcode).
   - Apps on the same website can share one PIN: app.config.json "pin.shareWith" lists their storage keys.
     The PIN is read from this app first, then from those apps; setting or changing it updates all of them.
   - The app provides the global `state` (with state.pinHash) and `save()`. */
const PIN_CFG = AppConfig.pin;
const pinHash = (p) => { let h = 5381; for (const ch of (PIN_CFG.salt || 'lp:') + p) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h.toString(36); };
const PIN_SHARE = (PIN_CFG.shareWith || []).filter((k) => typeof k === 'string' && k !== AppConfig.storage.key);
const sharedPinHash = () => { for (const k of PIN_SHARE) { const d = Store.peek(k); const h = d && ((d.device && d.device.pinHash) || d.pinHash); if (typeof h === 'string' && h) return h; } return null; };
const currentPinHash = () => state.pinHash || sharedPinHash();
const pinIsShared = () => !state.pinHash && !!sharedPinHash();
function storePinHash(h) {
  state.pinHash = h; save();
  // the other apps keep their own saved data; only their grown-up PIN is updated
  for (const k of PIN_SHARE) {
    try { const d = Store.peek(k); if (!d || !d.device || typeof d.device !== 'object') continue; d.device.pinHash = h; localStorage.setItem(k, JSON.stringify(d)); } catch {}
  }
}
// the PIN sheet: kept when the page already has one, otherwise added here (same ids everywhere)
if (!document.getElementById('pinSheet')) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '✕', '0', '⌫'];
  document.body.insertAdjacentHTML('beforeend', `<div id="pinSheet" class="time-up core-sheet" hidden>
    <div class="tu-box pin-box core-sheet-box" role="dialog" aria-modal="true" aria-labelledby="pinTitle"><button id="pinBack" class="pin-back" aria-label="Go back">🏠 Back</button><h2 id="pinTitle">🔒 Grown-ups only</h2><p id="pinNote" class="note"></p>
      <div id="pinDots" class="pin-dots"><i></i><i></i><i></i><i></i></div>
      <div id="pinPad" class="pin-pad">${keys.map((k) => `<button data-k="${k}" aria-label="${k === '⌫' ? 'Delete' : k === '✕' ? 'Cancel' : k}">${k}</button>`).join('')}</div>
      <div id="pinForgot" class="pin-forgot" hidden></div>
      <button id="pinForgotBtn" class="link-btn">Forgot PIN?</button></div>
  </div>`);
}
let parentVerificationEpoch = 0;
function verifyParentDevice(onVerified) {
  const epoch = ++parentVerificationEpoch;
  const sheet = $('#pinSheet'); sheet.hidden = false;
  $('#pinTitle').textContent = 'Grown-up setup';
  $('#pinNote').textContent = 'Use the device owner’s fingerprint, face or device passcode before creating a PIN.';
  $('#pinPad').hidden = true; $('#pinPad').onclick = null; $('#pinForgotBtn').hidden = true; $('#pinForgot').hidden = true;
  let cancelled = false;
  $('#pinVerifyBtn')?.remove();
  const button = document.createElement('button'); button.id = 'pinVerifyBtn'; button.className = 'big-btn'; button.textContent = 'Verify device owner';
  $('#pinPad').before(button);
  const close = () => { cancelled = true; sheet.hidden = true; button.remove(); $('#pinPad').hidden = false; };
  $('#pinBack').onclick = close; sheet.onclick = (e) => { if (e.target === sheet) close(); };
  button.onclick = async () => {
    button.disabled = true;
    try {
      if (!window.isSecureContext || !navigator.credentials?.create || !window.PublicKeyCredential) throw Error('unsupported');
      const appName = PIN_CFG.rpName || AppConfig.app.name;
      const credential = await navigator.credentials.create({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: appName + ' parent setup' },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'parent-' + Date.now(), displayName: appName + ' parent' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
        timeout: 60000, attestation: 'none'
      } });
      if (cancelled || epoch !== parentVerificationEpoch) return;
      const authData = credential?.response?.getAuthenticatorData?.();
      if (!credential || credential.type !== 'public-key' || !authData || !(new Uint8Array(authData)[32] & 4)) throw Error('not verified');
      close(); onVerified();
    } catch (error) {
      if (cancelled || epoch !== parentVerificationEpoch) return;
      $('#pinNote').textContent = 'Device verification was not completed. Set up a device passcode or biometric unlock and try again in a supported browser. Parent controls stay locked.';
      button.disabled = false;
    }
  };
}
function askPin(onOk, change = false, verified = false) {
  parentVerificationEpoch++;
  if (change && currentPinHash() && !verified) return askPin(() => askPin(onOk, true, true));
  if (!currentPinHash() && !verified) return verifyParentDevice(() => askPin(onOk, change, true));
  $('#pinPad').hidden = false;
  const sheet = $('#pinSheet'); let typed = '', first = null, closed = false;
  const request = askPin.request = (askPin.request || 0) + 1;
  const mode = () => (!currentPinHash() || change ? (first ? 'confirm' : 'new') : 'check');
  const paint = () => {
    $('#pinTitle').textContent = mode() === 'check' ? '🔒 Grown-ups only' : mode() === 'new' ? '🔒 Make a grown-up PIN' : '🔒 Type it again';
    $('#pinNote').textContent = mode() === 'check' ? (pinIsShared() ? (PIN_CFG.sharedNote || 'Type your 4-digit PIN.') : 'Type your 4-digit PIN.') : mode() === 'new' ? 'Pick 4 numbers. You will need them to open Settings.' : 'Type the same 4 numbers.';
    $$('#pinDots i').forEach((d, k) => d.classList.toggle('on', k < typed.length));
    $('#pinForgotBtn').hidden = mode() !== 'check'; $('#pinForgot').hidden = true;
  };
  const close = () => { closed = true; sheet.hidden = true; $('#pinPad').onclick = null; sheet.onclick = null; };
  // kids who land here by accident: a big way back, and the voice tells them where it is
  const goBack = () => { sfx.tap(); sayToken++; stopClip(); close(); };
  $('#pinBack').onclick = goBack;
  sheet.onclick = (e) => { if (e.target === sheet) goBack(); };   // tapping outside the box also goes back
  const kidNote = () => say(PIN_CFG.kidNote || ['This part is for grown-ups.', 'Tap the house to go back.']);
  const shake = () => { const b = $('.pin-box'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); sfx.no(); };
  $('#pinPad').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k; sfx.tap();
    if (k === '✕') return close();
    if (k === '⌫') { typed = typed.slice(0, -1); return paint(); }
    if (typed.length >= 4) return;
    typed += k; paint();
    if (typed.length < 4) return;
    setTimeout(() => {
      if (closed || request !== askPin.request) return;
      const m = mode();
      if (m === 'check') {
        if (Date.now() < (askPin.lockUntil || 0)) { typed = ''; shake(); $('#pinNote').textContent = 'Too many tries. Wait a little and try again.'; return; }
        if (pinHash(typed) === currentPinHash()) { askPin.misses = 0; close(); onOk(); }
        else { typed = ''; shake(); paint(); kidNote(); askPin.misses = (askPin.misses || 0) + 1; if (askPin.misses >= 3) { askPin.lockUntil = Date.now() + 30000 * (askPin.misses - 2); $('#pinNote').textContent = 'Too many tries. Wait 30 seconds.'; } }
      }
      else if (m === 'new') { first = typed; typed = ''; paint(); }
      else if (typed === first) { storePinHash(pinHash(typed)); close(); sfx.yes(); askPin(onOk); }
      else { first = null; typed = ''; shake(); paint(); }
    }, 150);
  };
  // A public puzzle cannot verify a parent. Never clear the PIN from this screen.
  $('#pinForgotBtn').onclick = () => {
    $('#pinForgot').textContent = 'Your PIN stays on this device and cannot be recovered here. Try your saved PIN. Resetting the app’s stored data through device or browser settings removes the PIN, but also deletes children and progress. There is no reset puzzle or shortcut in the child app.';
    $('#pinForgot').hidden = false;
  };
  typed = ''; paint(); sheet.hidden = false;
  if (mode() === 'check') kidNote();
}
