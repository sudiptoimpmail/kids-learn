#!/usr/bin/env python3
"""Source extra review-only candidates; preserve already staged image provenance."""
import json
import shutil
import subprocess
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
report_path=ROOT/'docs/landmark-candidate-review.json'
old=json.loads(report_path.read_text())
subprocess.run([sys.executable,str(ROOT/'scripts/prepare-landmark-batch.py')],cwd=ROOT,check=True)
source=ROOT/'tests/out/landmark-batch'
new=json.loads((source/'REVIEW.json').read_text())
existing={row['id']:row for row in old['candidates']}
rejected=json.loads((ROOT/'docs/landmark-rejections.json').read_text())['rejected']
bad={r['sourceUrl'] for r in rejected}|{r['sourceSha256'] for r in rejected}
dest=ROOT/'assets/landmark-candidates'
dest.mkdir(exist_ok=True)
added=0
for row in new['candidates']:
    if row['id'] in existing or row['sourceUrl'] in bad or row['sourceSha256'] in bad:
        continue  # already staged, or rejected on sight before
    if not row['reviewStatus'].startswith('PENDING HUMAN REVIEW'):
        raise ValueError('Review flag missing')
    shutil.copyfile(source/row['file'],dest/row['file'])
    existing[row['id']]=row
    added+=1
landmarks=json.loads((ROOT/'data/landmarks.json').read_text())['datasets']['LANDMARKS']
merged={**old,'candidates':sorted(existing.values(),key=lambda x:x['id']),
        'candidateCount':len(existing),'remainingLandmarks':len(landmarks)-2,
        'notPublished':True}
report_path.write_text(json.dumps(merged,indent=2)+'\n')
print(f'Added {added} candidates; {len(existing)} total remain unapproved; {len(landmarks)-2-len(existing)} still unsourced.')
