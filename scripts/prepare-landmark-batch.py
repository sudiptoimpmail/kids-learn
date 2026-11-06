#!/usr/bin/env python3
"""Prepare a review-only photo batch for every unphotographed Famous Place.

Never adds images to the app or asserts that a search result is correctly
identified or licensed. All candidates require human source and visual review.
"""
import hashlib
import io
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(os.environ.get('LANDMARK_CANDIDATE_DIR', 'tests/out/landmark-batch'))
API = 'https://commons.wikimedia.org/w/api.php'
HEADERS = {'User-Agent': 'KidsLearnMediaReview/1.0 (educational offline review; https://github.com/sudiptoimpmail/kids-learn)', 'Accept': 'application/json'}
MAX_BYTES = 12_000_000
MAX_IMAGES = int(os.environ.get('MAX_LANDMARK_CANDIDATES', '37'))
DELAY = float(os.environ.get('LANDMARK_REQUEST_DELAY', '1.0'))

def fetch(url, accept=None):
    headers = dict(HEADERS)
    if accept:
        headers['Accept'] = accept
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers=headers), timeout=45) as response:
                data = response.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    raise ValueError('Response exceeds 12 MB')
                return data
        except HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(4 * (attempt + 1))
    raise RuntimeError('Unreachable')

def api(params):
    url = API + '?' + urlencode(dict(action='query', format='json', formatversion=2, **params))
    return json.loads(fetch(url))

def plain(s):
    return re.sub(r'<[^>]+>', '', s or '').strip()

def candidate(name, landmark_id):
    # Search is only discovery. It does NOT verify the pictured place.
    results = api({'generator':'search','gsrsearch':'filetype:bitmap ' + name,
                   'gsrnamespace':6,'gsrlimit':12,'prop':'imageinfo',
                   'iiprop':'url|extmetadata|size','iiurlwidth':1000}).get('query',{}).get('pages',[])
    for page in results:
        info = (page.get('imageinfo') or [{}])[0]
        metadata = info.get('extmetadata') or {}
        license_short = plain(metadata.get('LicenseShortName',{}).get('value',''))
        restrictions = plain(metadata.get('Restrictions',{}).get('value',''))
        # Restrict to simple license classes; no attribution claims are auto-approved.
        if license_short not in ('CC0', 'Public domain', 'Public Domain', 'PD'):
            continue
        if restrictions or info.get('width',0)<480 or info.get('height',0)<320:
            continue
        url = info.get('thumburl') or info.get('url')
        if not url or not url.startswith('https://'):
            continue
        try:
            data = fetch(url, 'image/jpeg,image/png,image/webp')
            with Image.open(io.BytesIO(data)) as src:
                if src.format not in ('JPEG','PNG','WEBP'):
                    continue
                img = ImageOps.exif_transpose(src).convert('RGB')
                img.thumbnail((1200,1200), Image.Resampling.LANCZOS)
                if img.width<480 or img.height<320:
                    continue
                output = OUT / (landmark_id+'.webp')
                img.save(output, 'WEBP', quality=82, method=6)
        except (HTTPError, URLError, OSError, ValueError):
            continue
        return {'id':landmark_id,'landmark':name,'file':output.name,
                'sourceUrl':info.get('descriptionurl') or 'https://commons.wikimedia.org/wiki/' + page['title'].replace(' ','_'),
                'sourceFileTitle':page['title'],'creatorClaim':plain(metadata.get('Artist',{}).get('value','')),
                'licenseClaim':license_short,
                'sourceSha256':hashlib.sha256(data).hexdigest(),
                'webpSha256':hashlib.sha256(output.read_bytes()).hexdigest(),
                'dimensions':[img.width,img.height],
                'reviewStatus':'PENDING HUMAN REVIEW: verify landmark identity, creator, license, alt text and source'}
    return None

def main():
    if not 1 <= MAX_IMAGES <= 39:
        raise ValueError('MAX_LANDMARK_CANDIDATES must be between 1 and 39')
    landmarks=json.loads((ROOT/'data/landmarks.json').read_text())['datasets']['LANDMARKS']
    enabled=set(json.loads((ROOT/'data/landmark-photos.json').read_text())['datasets']['ids'])
    OUT.mkdir(parents=True,exist_ok=True)
    review=[]
    for landmark_id,name,*_ in landmarks:
        if landmark_id in enabled:
            continue
        if len(review)>=MAX_IMAGES:
            break
        try:
            result=candidate(name,landmark_id)
        except (HTTPError,URLError,ValueError,KeyError,json.JSONDecodeError) as e:
            print(f'{landmark_id}: search unavailable ({e})',flush=True)
            result=None
        if result:
            review.append(result)
            print(f'{landmark_id}: candidate staged for review',flush=True)
        else:
            print(f'{landmark_id}: no eligible candidate; needs manual sourcing',flush=True)
        time.sleep(DELAY)
    (OUT/'REVIEW.json').write_text(json.dumps({'schema':1,'notPublished':True,
      'candidateCount':len(review),'remainingLandmarks':len(landmarks)-len(enabled),
      'candidates':review,'instructions':'Do not publish before source/subject/license/alt review'},indent=2)+'\n')
    print(f'Prepared {len(review)} review-only candidates; zero photos published.')

if __name__=='__main__':
    main()
