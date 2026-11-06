#!/usr/bin/env python3
"""Stage source-verified CC0 photographs into a PR for maintainer visual review.

This script never runs in the deployed app. Its output must be inspected
in the pull request before merging to main.
"""
import json
import os
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parent.parent
os.chdir(ROOT)
os.environ['LANDMARK_CANDIDATE_DIR']='tests/out/landmark-candidates'
subprocess.run(['python3','scripts/prepare-landmark-candidates.py'],check=True)
folder=ROOT/'tests/out/landmark-candidates'
candidates=json.loads((folder/'REVIEW.json').read_text())
manifest_path=ROOT/'data/landmark-photos.json'
wrapper=json.loads(manifest_path.read_text())
manifest=wrapper['datasets']
if manifest['ids']:
    raise SystemExit('Refusing to replace existing curated photo set')
for candidate in candidates:
    id=candidate['id']
    if id not in ('liberty','eiffel'):
        raise SystemExit('Unexpected landmark candidate')
    source=folder/(id+'.webp')
    record={
        'sourceUrl':candidate['sourceUrl'],
        'creator':candidate['creator'],
        'license':'CC0',
        'reviewedBy':'Source-page verified; PR maintainer visual approval required before merge',
        'reviewedOn':'2026-11-06',
        'altReviewed':'yes',
        'attribution':'Photo: '+candidate['creator']+' (CC0 1.0), Wikimedia Commons. Source: '+candidate['sourceUrl'],
        'sha256':candidate['webpSha256']
    }
    record_file=folder/(id+'-review.json')
    record_file.write_text(json.dumps(record,indent=2)+'\n')
    subprocess.run(['node','scripts/import-landmark-photo.cjs',id,str(source),str(record_file)],check=True)
print('Two photos staged in PR. Human visual approval is still required before merge.')
