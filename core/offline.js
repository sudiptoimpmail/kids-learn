/* kids-core offline: service worker registration, parent-approved updates, and the offline voice library.
   The service worker itself is the app's sw.js (its file list) + core/sw-core.js (the logic).
   Only over HTTPS on the real website: never inside a preview frame. */
const CoreOffline = (() => {
  const OFF_CFG = AppConfig.offline || {};
  let inFrame = true; try { inFrame = window.top !== window; } catch {}
  const available = () => 'serviceWorker' in navigator && location.protocol === 'https:' && !inFrame && OFF_CFG.serviceWorker !== false;
  let restartApproved = false;
  // "updateOnLaunch": apply a downloaded update by itself, but only when nobody is using the app:
  // right after it opens (before the first tap) or when it comes back on screen and the app's
  // canAutoUpdate() says it is on a resting screen. Otherwise a grown-up taps the update note.
  let touched = false;
  const opened = Date.now();
  if (OFF_CFG.updateOnLaunch) for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { touched = true; }, { capture: true, passive: true });
  const restingNow = () => !touched && Date.now() - opened < 6000;
  const appResting = () => typeof window.canAutoUpdate === 'function' && !!window.canAutoUpdate();
  function start() {
    if (!available()) return;
    navigator.serviceWorker.register(OFF_CFG.serviceWorker || 'sw.js').then((reg) => {
      const applyNow = () => { if (!reg.waiting || restartApproved) return false; restartApproved = true; reg.waiting.postMessage({ type: 'update-now' }); return true; };
      if (OFF_CFG.updateOnLaunch) document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        reg.update().catch(() => {});
        if (appResting()) applyNow();
      });
      // Do not change the page underneath a child who just tapped Play or began onboarding.
      // The parent explicitly chooses when to activate an installed update.
      const offerUpdate = () => {
        if (OFF_CFG.updateOnLaunch && reg.waiting && restingNow() && applyNow()) return;
        const host = document.getElementById(OFF_CFG.updateHost || 'home');
        if (!reg.waiting || !host || document.getElementById('updateAvailable')) return;
        const btn = document.createElement('button');
        btn.id = 'updateAvailable'; btn.type = 'button'; btn.className = 'update-available';
        btn.textContent = 'A new version is ready. Tap to restart when you are finished.';
        btn.onclick = () => { restartApproved = true; btn.disabled = true; btn.textContent = 'Updating…'; reg.waiting.postMessage({ type: 'update-now' }); };
        host.appendChild(btn);
      };
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (worker) worker.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); });
      });
      offerUpdate();
      // fetch any voice clips this device doesn't have yet (after start-up, so the app opens fast)
      setTimeout(() => reg.active && reg.active.postMessage({ type: state.offlineAudio === 'full' ? 'fill-audio-all' : 'fill-audio' }), 8000);
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // A newly claimed first controller must not reload Home; only an approved update may.
      if (restartApproved) location.reload();
    });
  }
  // Full voice library downloads are opt-in (grown-up Settings), to avoid silently downloading thousands of clips.
  async function downloadVoices(status, btn) {
    if (!('serviceWorker' in navigator) || !available()) { status.textContent = 'Offline audio download is available in the installed app over HTTPS.'; return; }
    status.textContent = 'Preparing the offline voice library…'; btn.disabled = true;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg.active) throw new Error('offline service unavailable');
      state.offlineAudio = 'full'; save();
      reg.active.postMessage({ type: 'fill-audio-all' });
    } catch { btn.disabled = false; status.textContent = 'Could not start the download. Check the connection and try again.'; }
  }
  function watchVoiceDownload(statusId, btnId) {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'audio-pack-progress' || e.data.mode !== 'fill-audio-all') return;
      const status = document.getElementById(statusId), btn = document.getElementById(btnId);
      if (!status) return;
      const { done, total, saved = 0 } = e.data;
      status.textContent = total ? `Saved ${saved} of ${total} additional voice clips (checked ${done}).` : 'All requested voice clips are already saved.';
      if (done >= total) {
        if (btn) btn.disabled = false;
        status.textContent = saved >= total ? 'Offline voice pack is ready.' : `Saved ${saved} of ${total} additional clips. Some could not be downloaded; try again when online.`;
      }
    });
  }
  return Object.freeze({ available, start, downloadVoices, watchVoiceDownload });
})();
