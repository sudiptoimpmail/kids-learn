#!/usr/bin/env python3
"""Download CC0 candidates for *human* review, never enable them automatically."""
import hashlib
import io
import json
import os
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(os.environ.get('LANDMARK_CANDIDATE_DIR', 'tests/out/landmark-candidates'))
SOURCES = {
    'liberty': ('Statue of Liberty front shot.JPG', 'https://commons.wikimedia.org/wiki/File:Statue_of_Liberty_front_shot.JPG', 'L E X commons'),
    'eiffel': ('Eiffel tower in the morning.jpg', 'https://commons.wikimedia.org/wiki/File:Eiffel_tower_in_the_morning.jpg', 'Phivospharconides'),
}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    entries = []
    for landmark_id, (filename, page, creator) in SOURCES.items():
        url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + quote(filename.replace(' ', '_'))
        request = Request(url, headers={'User-Agent': 'KidsLearnEducationalMedia/1.0 (GitHub Actions review preparation)'})
        with urlopen(request, timeout=45) as response:
            if response.status != 200 or not response.headers.get('Content-Type', '').lower().startswith('image/'):
                raise ValueError(f'{landmark_id}: unexpected image response')
            data = response.read(12_000_001)
        if len(data) > 12_000_000:
            raise ValueError(f'{landmark_id}: source file exceeds safety limit')
        with Image.open(io.BytesIO(data)) as source:
            if source.format not in ('JPEG', 'PNG', 'WEBP'):
                # Wikimedia may negotiate a WebP thumbnail for a JPEG URL.
                raise ValueError(f'{landmark_id}: unexpected image format')
            image = ImageOps.exif_transpose(source).convert('RGB')
            image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            if image.width < 480 or image.height < 320:
                raise ValueError(f'{landmark_id}: image too small')
            output = OUT / (landmark_id + '.webp')
            image.save(output, 'WEBP', quality=82, method=6)
        entries.append({'id': landmark_id, 'file': output.name, 'sourceUrl': page,
                        'creator': creator, 'licenseClaim': 'CC0 (verify on source page)',
                        'sourceSha256': hashlib.sha256(data).hexdigest(),
                        'webpSha256': hashlib.sha256(output.read_bytes()).hexdigest(),
                        'dimensions': [image.width, image.height],
                        'reviewStatus': 'PENDING: human must verify subject, image, license and alt text'})
    (OUT / 'REVIEW.json').write_text(json.dumps(entries, indent=2) + '\n')
    print(f'Prepared {len(entries)} photo candidates for review at {OUT}. NOT enabled in the app.')

if __name__ == '__main__':
    main()
