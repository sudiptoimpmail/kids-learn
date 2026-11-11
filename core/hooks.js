/* kids-core hooks: the one way for an app's add-on scripts to change what a core or app function does.
   No script replaces another script's function. The app lists its hookable functions in app.config.json
   "hooks" (names of global functions); core wraps each one once, after the app's scripts have loaded.

     CoreHooks.before('startRound', (cat) => { if (onBreak()) { showBreak(); return false; } }, { priority: 10 });
     CoreHooks.after('openSettings', () => renderFamilyControls());
     CoreHooks.after('startRound', (result, cat) => { … });

   - before(name, fn): runs before the function, with its arguments. Returning false cancels the call.
   - after(name, fn): runs right after it returns, with (result, ...arguments). It cannot change the result.
     For an async function, { settled: true } waits until its promise has finished instead.
   - Handlers run by priority (lower first), then in the order they were added, so load order never matters.
   - A handler that throws is reported and skipped; the others and the function itself still run.
   - Functions loaded later (on demand) are wrapped when they arrive: CoreHooks.install(name). */
// a global const (like Store): visible to every script and to core/boot.js
const CoreHooks = (() => {
  const table = new Map();          // name → { before: [], after: [] }
  const WRAPPED = Symbol('core-hook');
  let seq = 0;
  const entry = (name) => { if (!table.has(name)) table.set(name, { before: [], after: [] }); return table.get(name); };
  const add = (kind) => (name, fn, opts = {}) => {
    if (typeof name !== 'string' || typeof fn !== 'function') throw new TypeError('CoreHooks.' + kind + '(name, fn)');
    const list = entry(name)[kind];
    list.push({ fn, priority: Number.isFinite(opts.priority) ? opts.priority : 0, seq: seq++, settled: !!opts.settled });
    list.sort((a, b) => a.priority - b.priority || a.seq - b.seq);
    return () => { const i = list.findIndex((h) => h.fn === fn); if (i >= 0) list.splice(i, 1); };
  };
  const report = (name, e) => { try { console.error(`kids-core hook for ${name} failed`, e); } catch {} };
  // wrap a function so its hooks run around it
  function wrap(name, fn) {
    if (typeof fn !== 'function' || fn[WRAPPED]) return fn;
    const hooked = function (...args) {
      const h = table.get(name);
      if (h) for (const b of h.before.slice()) {
        let r; try { r = b.fn.apply(this, args); } catch (e) { report(name, e); continue; }
        if (r === false) return undefined;
      }
      const result = fn.apply(this, args);
      if (h && h.after.length) {
        const thenable = result && typeof result.then === 'function';
        const run = (a, value) => { try { a.fn.call(this, value, ...args); } catch (e) { report(name, e); } };
        for (const a of h.after.slice()) {
          if (a.settled && thenable) result.then((v) => run(a, v), () => {}); else run(a, result);
        }
      }
      return result;
    };
    Object.defineProperty(hooked, 'name', { value: fn.name || name });
    hooked[WRAPPED] = fn;
    return hooked;
  }
  // wrap the global function `name` (once); returns false when there is no such function yet
  function install(name) {
    const g = globalThis[name];
    if (typeof g !== 'function') return false;
    if (!g[WRAPPED]) globalThis[name] = wrap(name, g);
    entry(name);
    return true;
  }
  return Object.freeze({
    before: add('before'),
    after: add('after'),
    install,
    wrap,
    // for tests and the QA screen: which hooks exist
    list: () => [...table.entries()].map(([name, h]) => ({ name, before: h.before.length, after: h.after.length, installed: !!(globalThis[name] && globalThis[name][WRAPPED]) })),
    original: (fn) => (fn && fn[WRAPPED]) || fn,
  });
})();
