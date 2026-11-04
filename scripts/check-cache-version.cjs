// A cache-first PWA must NEVER deploy changed application assets with the old cache name.
// Used by CI; compare the PR or push with the previous version, not just HEAD^.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const git = (...args) => execFileSync('git', args, { encoding:'utf8' }).trim();
const sw = fs.readFileSync('sw.js', 'utf8');
const version = (src) => {
  const match = src.match(/const\s+VERSION\s*=\s*PREFIX\s*\+\s*['"]([^'"]+)['"]/);
  if (!match) throw Error('Cannot parse sw.js cache VERSION');
  return match[1];
};
const files = (src) => {
  const match = src.match(/const\s+FILES\s*=\s*\[([\s\S]*?)\];/);
  if (!match) throw Error('Cannot parse sw.js offline app manifest');
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1].replace(/^\.\//, ''));
};
const list = new Set(files(sw));
const html = fs.readFileSync('index.html', 'utf8');
for (const [,path] of html.matchAll(/<script\s+src="([^"]+)"/g)) {
  if (!list.has(path)) throw Error('Offline script missing from service-worker FILES: '+path);
}
for (const [,path] of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
  if (!list.has(path)) throw Error('Offline stylesheet missing from service-worker FILES: '+path);
}
const base = process.env.GITHUB_BASE_REF ? 'origin/'+process.env.GITHUB_BASE_REF :
  (process.env.BASE_SHA && !/^0+$/.test(process.env.BASE_SHA) ? process.env.BASE_SHA : 'HEAD^');
let old;
try { old = git('show', base+':sw.js'); }
catch (e) { throw Error('Cannot read base sw.js from '+base+' — checkout with fetch-depth: 0'); }
const changed = git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean);
const precached = changed.filter(f => f === 'sw.js' || list.has(f));
if (precached.length && version(old) === version(sw)) {
  throw Error('Precached assets changed but sw.js VERSION was not bumped: '+precached.join(', '));
}
console.log('PASS cache version '+version(old)+' -> '+version(sw)+', changed precached files: '+precached.length);
