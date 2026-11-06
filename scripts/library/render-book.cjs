#!/usr/bin/env node
'use strict';
// Paints a library book's SVG illustrations to WebP images (run once; the app ships the images).
//   node scripts/library/render-book.cjs red-riding-hood [--svg dir]   (needs Playwright + python3 Pillow)
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const id = process.argv[2] || 'red-riding-hood';
const svgDir = (() => { const i = process.argv.indexOf('--svg'); return i > 0 ? process.argv[i + 1] : ''; })();
const art = require(`./${id}.cjs`);
const out = path.join('library', id);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ deviceScaleFactor: 1 });
  const jobs = [...Object.entries(art.pages).map(([k, svg]) => [k, svg, 1200, 800, 84]), ...Object.entries(art.questions).map(([k, svg]) => [k, svg, 400, 400, 82])];
  for (const [name, svg, w, h, q] of jobs) {
    if (svgDir) fs.writeFileSync(path.join(svgDir, name + '.svg'), svg);
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    const png = path.join(out, name + '.png');
    await p.screenshot({ path: png, clip: { x: 0, y: 0, width: w, height: h } });
    execFileSync('python3', ['-c', `from PIL import Image; Image.open('${png}').convert('RGB').save('${png.replace(/\.png$/, '.webp')}', 'WEBP', quality=${q}, method=6)`]);
    fs.unlinkSync(png);
  }
  await b.close();
  const sizes = fs.readdirSync(out).filter((f) => f.endsWith('.webp')).map((f) => fs.statSync(path.join(out, f)).size);
  console.log(`painted ${sizes.length} images for ${id}, ${Math.round(sizes.reduce((a, b) => a + b, 0) / 1024)} KB`);
})().catch((e) => { console.error(e); process.exit(1); });
