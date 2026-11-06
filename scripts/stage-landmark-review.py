#!/usr/bin/env python3
"""Copy downloaded candidate photos into a PR review directory, never enable them."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
subprocess.run([sys.executable,str(ROOT/'scripts/prepare-landmark-batch.py')],cwd=ROOT,check=True)
src=ROOT/'tests/out/landmark-batch'
report=json.loads((src/'REVIEW.json').read_text())
dest=ROOT/'assets/landmark-candidates'
dest.mkdir(parents=True,exist_ok=True)
for row in report['candidates']:
    if row['reviewStatus'].startswith('PENDING HUMAN REVIEW') is False:
        raise ValueError('Candidate review flag missing')
    file=src/row['file']
    if not file.is_file():
        raise ValueError('Missing candidate '+row['id'])
    shutil.copyfile(file,dest/row['file'])
(ROOT/'docs/landmark-candidate-review.json').write_text(json.dumps(report,indent=2)+'\n')
print(f"Staged {len(report['candidates'])} unapproved real photos in review-only folder.")
