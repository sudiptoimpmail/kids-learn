/* kids-core boot (ES module).
   1. Reads the app's config file (app.config.json): name, storage, voice, PIN, colours, data, scripts.
   2. Applies the colour scheme from the config as CSS variables (light, and dark when given; dark follows the device only when no look is chosen),
      then the app's theme pack (theme.pack): a set of skins, like WordPress themes. Each skin (a mascot) has its own colours
      for Light, Medium and Night. Packs live in core/themes/<id>.json, or in the app's own themes/<id>.json (checked first),
      and can extend another pack. window.CoreSkins lists the skins and puts one on <body class="theme-<skin>">.
   3. Loads the app's bundled JSON data (schema 1 namespaces) into ContentData.
   4. Loads the core scripts, then the app's own scripts, in order.
   Data is JSON, scripts contain only logic. No eval, no remote scripts. */
const CORE_VERSION = '1.5.0';
const CORE_SCRIPTS = ['util.js', 'feature-flags.js', 'native.js', 'storage.js', 'voice.js', 'sounds.js', 'confetti.js',
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
    css += `@media (prefers-color-scheme:dark){:root:not([data-theme]){${d}}}:root[data-theme="dark"]{${d}}`;
  }
  return css;
}
/* ---------- theme packs (skins) ---------- */
const COLOR = /^(#[0-9a-fA-F]{3,8}|(rgb|hsl)a?\([0-9.,%\s]{1,40}\)|transparent)$/;
const STOP = /^(#[0-9a-fA-F]{3,8})(\s+\d{1,3}%)?$/;
const ID = /^[a-z0-9][a-z0-9-]{0,30}$/;
const SPOTS = [['12% 8%', 130], ['90% 30%', 135], ['18% 96%', 165], ['95% 92%', 110]];
const PATTERNS = {
  stars: (c) => [`radial-gradient(${c} 1.2px, transparent 1.6px)`, '26px 26px'],
  stripes: (c) => [`repeating-linear-gradient(90deg, transparent 0 60px, ${c} 60px 62px)`, 'auto'],
  checks: (c) => [`repeating-linear-gradient(45deg, transparent 0 22px, ${c} 22px 24px)`, 'auto'],
};
const LOOK_SCOPES = {
  light: ['body.theme-%'],
  medium: [':root[data-theme="medium"] body.theme-%'],
  dark: [':root[data-theme="dark"] body.theme-%', '@media (prefers-color-scheme:dark){:root:not([data-theme]) body.theme-%'],
};
function mergeDeep(a, b) {
  const out = { ...(isObj(a) ? a : {}) };
  for (const [k, v] of Object.entries(isObj(b) ? b : {})) out[k] = isObj(v) && isObj(out[k]) ? mergeDeep(out[k], v) : v;
  return out;
}
function lookCss(look) {
  if (!isObj(look)) return '';
  const vars = Object.entries(isObj(look.colors) ? look.colors : {})
    .filter(([k, v]) => /^[a-z][a-z0-9-]{0,40}$/.test(k) && SAFE_CSS.test(String(v))).map(([k, v]) => `--${k}:${v};`).join('');
  const images = [], sizes = [];
  (Array.isArray(look.bubbles) ? look.bubbles : []).filter((c) => COLOR.test(c)).slice(0, SPOTS.length).forEach((c, i) => {
    const [at, r] = SPOTS[i];
    images.push(`radial-gradient(circle at ${at}, ${c} 0 ${r}px, transparent ${r + 1}px)`); sizes.push('auto');
  });
  if (look.pattern && PATTERNS[look.pattern] && COLOR.test(look.patternColor || '')) {
    const [img, size] = PATTERNS[look.pattern](look.patternColor); images.push(img); sizes.push(size);
  }
  const bg = COLOR.test(look.bg || '') ? `--bg:${look.bg};background-color:${look.bg};` : '';
  return vars + bg + (images.length ? `background-image:${images.join(',')};background-size:${sizes.join(',')};` : '');
}
export function skinsCss(pack) {
  if (!isObj(pack) || !isObj(pack.skins)) return '';
  let css = '';
  for (const [id, skin] of Object.entries(pack.skins)) {
    if (!ID.test(id) || !isObj(skin)) continue;
    for (const look of ['light', 'medium', 'dark']) {
      const body = lookCss(isObj(skin[look]) ? { pattern: skin.pattern, ...skin[look] } : null);
      if (!body) continue;
      for (const scope of LOOK_SCOPES[look]) {
        const sel = scope.replace('%', id);
        css += sel.startsWith('@media') ? `${sel}{${body}}}` : `${sel}{${body}}`;
      }
    }
    const stops = (Array.isArray(skin.splash) ? skin.splash : []).filter((c) => STOP.test(c));
    if (stops.length > 1) css += `body.theme-${id}{--splash:linear-gradient(160deg, ${stops.join(', ')});}`;
  }
  return css;
}
// the app's pack: theme.pack names it, theme.skins changes or adds skins, theme.only picks and orders them
export async function loadPack(theme, fetchJson) {
  if (!isObj(theme) || !theme.pack) return null;
  const seen = new Set();
  async function get(id) {
    if (!ID.test(id) || seen.has(id)) throw Error('theme pack: bad or circular id ' + id);
    seen.add(id);
    const pack = (await fetchJson('themes/' + id + '.json')) || (await fetchJson(new URL('themes/' + id + '.json', here).pathname));
    if (!isObj(pack) || pack.schema !== 1 || !isObj(pack.skins)) throw Error('theme pack not found or invalid: ' + id);
    return pack.extends ? mergeDeep(await get(pack.extends), { ...pack, extends: undefined }) : pack;
  }
  let pack = await get(theme.pack);
  if (isObj(theme.skins)) pack = mergeDeep(pack, { skins: theme.skins });
  if (Array.isArray(theme.only) && theme.only.length) {
    const skins = {};
    for (const id of theme.only) if (isObj(pack.skins[id])) skins[id] = pack.skins[id];
    pack = { ...pack, skins };
  }
  if (!pack.skins[pack.default]) pack.default = Object.keys(pack.skins)[0];
  return pack;
}
function makeSkins(pack) {
  const skins = (pack && pack.skins) || {};
  const ids = Object.keys(skins);
  const fallback = pack ? pack.default : null;
  return Object.freeze({
    pack: pack ? Object.freeze({ id: pack.id, name: pack.name, version: pack.version }) : null,
    default: fallback,
    list: () => ids.map((id) => ({ id, label: skins[id].label || id, mascot: skins[id].mascot || '' })),
    has: (id) => ids.includes(id),
    get: (id) => (ids.includes(id) ? skins[id] : null),
    // puts the skin on <body>; an unknown id falls back to the pack's default
    apply(id) {
      const pick = ids.includes(id) ? id : fallback;
      document.body.className = document.body.className.replace(/\btheme-[\w-]+/g, '').trim() + (pick ? ' theme-' + pick : '');
      const meta = document.querySelector('meta[name="theme-color"]');
      const c = pick && skins[pick].light && skins[pick].light.colors && skins[pick].light.colors.theme;
      if (meta && c && COLOR.test(c)) meta.setAttribute('content', c);
      return pick;
    },
  });
}

export function applyTheme(theme, pack) {
  if (!isObj(theme) || !isObj(theme.light)) throw Error('app.config.json: theme.light is required');
  const css = themeCss(theme) + skinsCss(pack);
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
  const fetchJson = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } };
  const pack = await loadPack(cfg.theme, fetchJson);
  applyTheme(cfg.theme, pack);
  window.CoreSkins = makeSkins(pack);
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
