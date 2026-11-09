// Turns each story's cartoon page SVGs into WebP pictures (puzzles and read-aloud both use them):
//   node scripts/library/rasterize-pages.cjs little-red-hen lion-and-mouse max-kite little-seed
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 750 } });
  for (const id of process.argv.slice(2)) {
    const dir = path.join(__dirname, '..', '..', 'library', id), book = JSON.parse(fs.readFileSync(path.join(dir, 'book.json')));
    for (const pg of book.pages) {
      if (!pg.art.endsWith('.svg')) continue;
      await p.setContent(`<body style="margin:0"><img src="data:image/svg+xml;base64,${fs.readFileSync(path.join(dir, pg.art)).toString('base64')}" width="1200" height="750"></body>`);
      await p.waitForTimeout(100);
      const png = path.join(dir, pg.art.replace('.svg', '.png')); await p.screenshot({ path: png });
      const out = pg.art.replace('.svg', '.webp');
      execFileSync('python3', ['-c', `from PIL import Image; Image.open(r"${png}").convert("RGB").save(r"${path.join(dir, out)}","WEBP",quality=86,method=6)`]);
      fs.unlinkSync(png); fs.unlinkSync(path.join(dir, pg.art)); pg.art = out;
    }
    if (book.cover && book.cover.endsWith('.svg')) book.cover = book.cover.replace('.svg', '.webp');
    for (const v of Object.values(book.versions || {})) for (const pg of v.pages || []) pg.art = pg.art.replace(/\.svg$/, '.webp');   // per-grade texts share the pictures
    fs.writeFileSync(path.join(dir, 'book.json'), JSON.stringify(book, null, 2) + '\n');
  }
  await b.close();
})();
