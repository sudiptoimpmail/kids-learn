#!/usr/bin/env python3
"""Download the Wikimedia Commons files listed in media/commons-fetch.json and save them as WebP.

Input  {"items": {"<dest .webp|.jpg>": {"file": "<Commons file name>", "max": 640, "square": false}}}
Output the WebP files, plus media/commons-fetch-result.json (sha256, size, status per item).
"""
import hashlib, io, json, time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
UA = 'KidsLearnEducationalMedia/1.0 (https://github.com/sudiptoimpmail/kids-learn; educational app media fetch)'


def get(url):
    for attempt in range(4):
        try:
            with urlopen(Request(url, headers={'User-Agent': UA}), timeout=60) as r:
                if not r.headers.get('Content-Type', '').startswith('image/'):
                    raise ValueError('not an image: ' + r.headers.get('Content-Type', ''))
                return r.read(25_000_001)
        except HTTPError as e:
            if e.code not in (429, 500, 502, 503) or attempt == 3:
                raise
            time.sleep(15 * (attempt + 1))


def main():
    spec = json.loads((ROOT / 'media/commons-fetch.json').read_text())
    out = {}
    for dest, it in spec['items'].items():
        size = int(it.get('max', 640))
        url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + quote(it['file']) + f'?width={size * 2 if size < 800 else size}'
        try:
            data = get(url)
            with Image.open(io.BytesIO(data)) as src:
                im = ImageOps.exif_transpose(src).convert('RGB')
            if it.get('square'):                      # centre crop to a square (picture cards)
                side = min(im.size); l = (im.width - side) // 2; t = (im.height - side) // 2
                im = im.crop((l, t, l + side, t + side))
            im.thumbnail((size, size), Image.Resampling.LANCZOS)
            path = ROOT / dest
            path.parent.mkdir(parents=True, exist_ok=True)
            if dest.endswith('.jpg'):
                im.save(path, 'JPEG', quality=int(it.get('q', 82)), optimize=True, progressive=True)
            else:
                im.save(path, 'WEBP', quality=int(it.get('q', 80)), method=6)
            out[dest] = {'file': it['file'], 'ok': True, 'w': im.width, 'h': im.height,
                         'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
            print('ok', dest, im.size)
        except Exception as e:  # keep going; report what failed
            out[dest] = {'file': it['file'], 'ok': False, 'error': str(e)[:200]}
            print('FAIL', dest, e)
        time.sleep(1.2)
    (ROOT / 'media/commons-fetch-result.json').write_text(json.dumps(out, indent=2) + '\n')


if __name__ == '__main__':
    main()
