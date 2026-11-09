#!/usr/bin/env python3
"""Download Wikimedia Commons photos listed in media/commons-fetch.json and save them for offline use.

Each item is keyed by its destination path (.webp or .jpg) and has either
  "file":   an exact Commons file name, or
  "search": a Commons search phrase (the first freely licensed, large, landscape photo is used),
plus optional "max" (longest side, default 640), "square" (centre crop) and "metaOnly"
(only record licence/author, do not download).

The licence and author always come from the official Commons API (extmetadata), never from the
caller: anything not CC0 / Public domain / CC BY / CC BY-SA is refused.
Results (licence, author, source page, size, sha256) go to media/commons-fetch-result.json.
"""
import hashlib, html, io, json, re, time
from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
UA = 'KidsLearnEducationalMedia/1.0 (https://github.com/sudiptoimpmail/kids-learn; educational app media fetch)'
API = 'https://commons.wikimedia.org/w/api.php?'
FREE = re.compile(r'^(CC0|Public domain|PD.*|CC BY(-SA)? \d(\.\d)?.*)$', re.I)


def get(url, binary=True):
    for attempt in range(5):
        try:
            with urlopen(Request(url, headers={'User-Agent': UA}), timeout=60) as r:
                return r.read(40_000_001)
        except HTTPError as e:
            if e.code not in (429, 500, 502, 503) or attempt == 4:
                raise
            time.sleep(10 * (attempt + 1))


def api(params):
    params = dict(params, format='json', formatversion='2')
    return json.loads(get(API + urlencode(params)))


def clean(s):
    s = html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()
    return re.sub(r'\s+', ' ', s)[:160]


def info(page):
    ii = (page.get('imageinfo') or [{}])[0]
    m = ii.get('extmetadata') or {}
    val = lambda k: (m.get(k) or {}).get('value', '')
    return {
        'file': page['title'].removeprefix('File:'),
        'sourceUrl': ii.get('descriptionurl') or 'https://commons.wikimedia.org/wiki/' + quote(page['title'].replace(' ', '_')),
        'license': clean(val('LicenseShortName')),
        'creator': clean(val('Artist')) or clean(val('Credit')) or 'Unknown',
        'width': ii.get('width', 0), 'height': ii.get('height', 0), 'mime': ii.get('mime', ''),
    }


IIPROP = {'prop': 'imageinfo', 'iiprop': 'extmetadata|size|mime|url'}


def by_name(name):
    pages = api(dict(IIPROP, action='query', titles='File:' + name))['query']['pages']
    p = pages[0]
    if p.get('missing') or 'imageinfo' not in p:
        raise ValueError('file not found on Commons: ' + name)
    return info(p)


def by_search(q, landscape=True):
    r = api(dict(IIPROP, action='query', generator='search', gsrnamespace='6', gsrsearch=q + ' filetype:bitmap', gsrlimit='20'))
    pages = sorted(r.get('query', {}).get('pages', []), key=lambda p: p.get('index', 99))
    for p in pages:
        i = info(p)
        if i['mime'] != 'image/jpeg' or not FREE.match(i['license']) or i['width'] < 1200:
            continue
        if landscape and i['width'] < i['height']:
            continue
        return i
    raise ValueError('no freely licensed landscape photo found for: ' + q)


def main():
    spec = json.loads((ROOT / 'media/commons-fetch.json').read_text())
    out = {}
    for dest, it in spec['items'].items():
        try:
            meta = by_search(it['search'], it.get('landscape', True)) if it.get('search') else by_name(it['file'])
            if not FREE.match(meta['license']):
                raise ValueError('licence not allowed: ' + meta['license'])
            rec = dict(meta, ok=True)
            if not it.get('metaOnly'):
                size = int(it.get('max', 640))
                url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + quote(meta['file']) + f'?width={min(meta["width"], 1600)}'
                with Image.open(io.BytesIO(get(url))) as src:
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
                rec.update(w=im.width, h=im.height, bytes=path.stat().st_size, sha256=hashlib.sha256(path.read_bytes()).hexdigest())
            out[dest] = rec
            print('ok', dest, meta['license'], '|', meta['creator'][:40])
        except Exception as e:  # keep going; report what failed
            out[dest] = {'ok': False, 'error': str(e)[:300], **{k: it[k] for k in ('file', 'search') if k in it}}
            print('FAIL', dest, e)
        time.sleep(1.0)
    (ROOT / 'media/commons-fetch-result.json').write_text(json.dumps(out, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
