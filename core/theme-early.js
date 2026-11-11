/* kids-core: paints the app's colours from the last visit before the app loads (no flash of the wrong colours).
   The colours themselves come only from app.config.json, applied by core/boot.js.
   Light or dark: a grown-up's choice for this device (CoreScheme.set('light' | 'medium' | 'dark' | 'auto')) is kept here and put on
   <html data-theme>. 'medium' is a look the app draws itself (core colours stay light). With no choice saved, the app's own <html data-theme="…"> stays (none = follow the device). */
const CoreScheme = (() => {
  const LOOKS = ['light', 'medium', 'dark'];
  const KEY = 'kids-core.scheme:' + location.pathname.replace(/[^/]*$/, '');
  const root = document.documentElement, appDefault = root.getAttribute('data-theme') || 'auto';
  const apply = (v) => { if (LOOKS.includes(v)) root.setAttribute('data-theme', v); else root.removeAttribute('data-theme'); };
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  if (LOOKS.includes(saved) || saved === 'auto') apply(saved);
  return Object.freeze({
    get: () => { try { const v = localStorage.getItem(KEY); if (LOOKS.includes(v) || v === 'auto') return v; } catch {} return appDefault; },
    set: (v) => { if (!LOOKS.includes(v) && v !== 'auto') return; try { localStorage.setItem(KEY, v); } catch {} apply(v); },
    // what is showing right now
    isDark: () => root.getAttribute('data-theme') === 'dark' || (!root.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches),
  });
})();
try { const css = localStorage.getItem('kids-core.theme:' + location.pathname.replace(/[^/]*$/, ''));
  if (css && !/[<]/.test(css)) { const s = document.createElement('style'); s.id = 'core-theme'; s.textContent = css; document.head.appendChild(s); } } catch {}
