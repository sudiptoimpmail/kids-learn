#!/usr/bin/env node
/* Copies the web app into www/ for the iPhone/iPad app (Capacitor's webDir):  node scripts/build-www.mjs
   Everything the website serves goes in, so the app works fully offline from the first launch.
   Developer-only folders (tests, scripts, docs, the iOS project itself) stay out. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'www');
const SKIP = new Set(['.git', '.github', 'node_modules', 'www', 'ios', 'android', 'tests', 'scripts', 'docs',
  'package.json', 'package-lock.json', 'capacitor.config.json', 'README.md', '.gitignore', '.DS_Store']);
const skipFile = (name) => SKIP.has(name) || name.endsWith('.md') || name.endsWith('.py') || name.startsWith('.');

let files = 0, bytes = 0;
function copy(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipFile(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copy(s, d);
    else if (e.isFile()) { fs.copyFileSync(s, d); files++; bytes += fs.statSync(s).size; }
  }
}
fs.rmSync(out, { recursive: true, force: true });
copy(root, out);
for (const need of ['index.html', 'app.config.json', 'core/boot.js', 'core/native.js']) {
  if (!fs.existsSync(path.join(out, need))) { console.error('www/ is missing ' + need); process.exit(1); }
}
console.log(`www/: ${files} files, ${(bytes / 1048576).toFixed(1)} MB`);
