/* kids-core: paints the app's colours from the last visit before the app loads (no flash of the wrong colours).
   The colours themselves come only from app.config.json, applied by core/boot.js. */
try { const css = localStorage.getItem('kids-core.theme:' + location.pathname.replace(/[^/]*$/, ''));
  if (css && !/[<]/.test(css)) { const s = document.createElement('style'); s.id = 'core-theme'; s.textContent = css; document.head.appendChild(s); } } catch {}
