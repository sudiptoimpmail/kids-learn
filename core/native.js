/* kids-core native: what changes when the app runs inside its iPhone / iPad (or Android) app shell (Capacitor).
   On the website none of this does anything.
   - Saved progress is also copied to the app's own storage (see storage.js), so iOS can't clear it.
   - No service worker: the app's files are already inside the app, so it works offline by itself.
   - Full screen: the status bar (clock, battery) is hidden while a child plays.
   - The screen stays on while a child is playing, and is allowed to sleep after a few quiet minutes.
   - A small tap feel (haptics) on buttons, on iPhones that have it.
   - The launch picture is taken away once the app is ready.
   Settings: app.config.json "native": { "haptics": true, "statusBar": "hidden", "keepAwakeMinutes": 5 } (all optional). */
const CoreNative = (() => {
  const C = window.Capacitor;
  const isNative = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  const P = (isNative && C.Plugins) || {};
  const cfg = Object.assign({ haptics: true, statusBar: 'hidden', keepAwakeMinutes: 5 }, AppConfig.native || {});
  const platform = isNative && typeof C.getPlatform === 'function' ? C.getPlatform() : 'web';
  const quiet = (p) => { try { const r = p && p(); if (r && r.catch) r.catch(() => {}); } catch {} };

  // a light tap feel; the app can also call CoreNative.tap('medium') for a correct answer
  function tap(style = 'light') {
    if (!isNative || !cfg.haptics || !P.Haptics) return;
    const s = { light: 'LIGHT', medium: 'MEDIUM', heavy: 'HEAVY' }[style] || 'LIGHT';
    quiet(() => P.Haptics.impact({ style: s }));
  }
  function success() { if (isNative && cfg.haptics && P.Haptics) quiet(() => P.Haptics.notification({ type: 'SUCCESS' })); }

  // keep the screen on while someone is touching the app, let it sleep after keepAwakeMinutes without a touch
  let awake = false, sleepTimer = 0;
  function stayAwake() {
    if (!isNative || !P.KeepAwake || !(cfg.keepAwakeMinutes > 0)) return;
    if (!awake) { awake = true; quiet(() => P.KeepAwake.keepAwake()); }
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(() => { awake = false; quiet(() => P.KeepAwake.allowSleep()); }, cfg.keepAwakeMinutes * 60000);
  }

  function start() {
    if (!isNative) return;
    document.documentElement.classList.add('native-app', 'native-' + platform);
    if (P.StatusBar) {
      if (cfg.statusBar === 'hidden') quiet(() => P.StatusBar.hide());
      // the bar can come back after the app returns from the background
      document.addEventListener('visibilitychange', () => { if (!document.hidden && cfg.statusBar === 'hidden') quiet(() => P.StatusBar.hide()); });
    }
    addEventListener('pointerdown', (e) => {
      stayAwake();
      const t = e.target && e.target.closest && e.target.closest('button, [role="button"], a, .tile, .opt');
      if (t && !t.disabled) tap('light');
    }, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) stayAwake(); });
    stayAwake();
    if (P.SplashScreen) quiet(() => P.SplashScreen.hide());
  }

  return Object.freeze({ isNative, platform, tap, success, start });
})();
CoreNative.start();
