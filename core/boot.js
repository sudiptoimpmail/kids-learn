/* kids-core boot (ES module).
   1. Reads the app's config file (app.config.json): name, storage, voice, PIN, colours, data, scripts.
   2. Applies the colour scheme from the config as CSS variables (light, and dark when given).
   3. Loads the app's bundled JSON data (schema 1 namespaces) into ContentData.
   4. Loads the core scripts, then the app's own scripts, in order.
   Data is JSON, scripts contain only logic. No eval, no remote scripts. */
const CORE_VERSION = '1.1.0';
const CORE_SCRIPTS = ['util.js', 'feature-flags.js', 'storage.js', 'voice.js', 'sounds.js', 'confetti.js',
  'parent-gate.js', 'progression.js', 'content-packs.js', 'offline.js'];
const here = new URL('.', import.meta.url);           // …/core/
const status = document.getElementById('loadStatus');
const play = document.getElementById('startBtn');

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const deepFreeze = (o) => { if (isObj(o) || Array.isArray(o)) { Object.values(o).forEach(deepFreeze); Object.freeze(o); } return o; };
const SAFE_CSS = /^[#a-zA-Z0-9(),.%\s-]{1,60}$/;      // colours and simple values only: no ; { } or url()

function themeCss(theme) {
  const block = (vars) => Object.entries(vars || {}).filter(([k, v]) => /^[a-z][a-z0-9-]{0,40}$/.test(k) && SAFE_CSS.test(String(v)))
    .map(([k, v]) => `--${k}:${v};`).join('');
  let css = `:root{${block(theme.light)}}`;
  if (isObj(theme.dark) && Object.keys(theme.dark).length) {
    const d = block(theme.dark) + 'color-scheme:dark;';
    css += `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${d}}}:root[data-theme="dark"]{${d}}`;
  }
  return css;
}
export function applyTheme(theme) {
  if (!isObj(theme) || !isObj(theme.light)) throw Error('app.config.json: theme.light is required');
  const css = themeCss(theme);
  let el = document.getElementById('core-theme');
  if (!el) { el = document.createElement('style'); el.id = 'core-theme'; document.head.appendChild(el); }
  el.textContent = css;
  // remembered so core/theme-early.js can paint the right colours before this module runs next time
  try { localStorage.setItem('kids-core.theme:' + location.pathname.replace(/[^/]*$/, ''), css); } catch {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && theme.light['theme-color']) meta.setAttribute('content', theme.light['theme-color']);
}

export function checkConfig(cfg) {
  const need = (cond, msg) => { if (!cond) throw Error('app.config.json: ' + msg); };
  need(isObj(cfg), 'must be a JSON object');
  need(cfg.schema === 1, 'schema must be 1');
  need(isObj(cfg.app) && typeof cfg.app.id === 'string' && typeof cfg.app.name === 'string', 'app.id and app.name are required');
  need(typeof cfg.core === 'string', 'core (the kids-core version this app was built with) is required');
  need(isObj(cfg.storage) && typeof cfg.storage.key === 'string' && Array.isArray(cfg.storage.deviceKeys), 'storage.key and storage.deviceKeys are required');
  need(Array.isArray(cfg.avatars) && cfg.avatars.length, 'avatars must list at least one picture');
  need(isObj(cfg.voice) && isObj(cfg.voice.clips) && typeof cfg.voice.lang === 'string' && cfg.voice.clips[cfg.voice.lang], 'voice.lang and voice.clips[lang] are required');
  need(isObj(cfg.pin), 'pin is required');
  need(isObj(cfg.data) && Array.isArray(cfg.data.namespaces), 'data.namespaces is required');
  need(Array.isArray(cfg.scripts) && cfg.scripts.every((s) => typeof s === 'string' && /^[a-z0-9][a-z0-9/_.-]*\.js$/i.test(s) && !s.includes('..')), 'scripts must be local .js files');
  return cfg;
}

const load = (src) => new Promise((resolve, reject) => {
  const el = document.createElement('script');
  el.src = src; el.async = false;                      // keep the listed order
  el.onload = resolve; el.onerror = () => reject(new Error('Could not load ' + src));
  document.body.appendChild(el);
});

window.CORE_VERSION = CORE_VERSION;
window.CoreReady = (async () => {
  const res = await fetch('app.config.json', { cache: 'no-cache' }).catch(() => fetch('app.config.json'));
  if (!res.ok) throw Error('Missing app.config.json');
  const cfg = checkConfig(await res.json());
  if (cfg.core !== CORE_VERSION) console.warn(`App was built for kids-core ${cfg.core} but core/ is ${CORE_VERSION}`);
  window.AppConfig = deepFreeze(cfg);
  applyTheme(cfg.theme);
  if (cfg.app.title) document.title = cfg.app.title;

  const data = new Map(), dir = cfg.data.dir || 'data/';
  await Promise.all(cfg.data.namespaces.map(async (name) => {
    const response = await fetch(dir + name + '.json');
    if (!response.ok) throw Error('Missing offline data: ' + name);
    const payload = await response.json();
    if (payload.schema !== 1 || payload.namespace !== name || !isObj(payload.datasets)) throw Error('Invalid offline data: ' + name);
    data.set(name, payload.datasets);
  }));
  window.ContentData = Object.freeze({
    get(namespace, key) {
      const values = data.get(namespace);
      if (!values || !Object.prototype.hasOwnProperty.call(values, key)) throw new Error('Required bundled content is missing: ' + namespace + '/' + key);
      return values[key];
    },
    has: (namespace, key) => !!data.get(namespace) && Object.prototype.hasOwnProperty.call(data.get(namespace), key),
    namespaces: () => [...data.keys()]
  });

  await Promise.all([...CORE_SCRIPTS.map((s) => new URL(s, here).pathname), ...cfg.scripts].map(load));
  if (status) status.textContent = '';
  if (play) play.disabled = false;
  return true;
})().catch((err) => {
  console.error('The app could not load its offline content', err);
  if (status) status.textContent = 'Could not open learning content. Reconnect once and try again.';
  if (play) play.disabled = true;
  throw err;
});
window.KidsLearnReady = window.CoreReady;   // name used by Learn & Play's tests and native shell

// hold the module's load lifecycle until all local JSON and scripts are ready
await window.CoreReady;
