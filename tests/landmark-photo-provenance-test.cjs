#!/usr/bin/env node
'use strict';
// Phase 5B: fail closed when a landmark photograph is enabled without
// a real, locally bundled, reviewed and attributable media record.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(fs.readFileSync('data/landmark-photos.json','utf8')).datasets;
const landmarks = JSON.parse(fs.readFileSync('data/landmarks.json','utf8')).datasets;
const known = new Set(landmarks.LANDMARKS.map(row => row[0]));
const allowed = new Set(manifest.acceptedLicense);
const ids = manifest.ids;
const records = manifest.records || {};
assert.ok(Array.isArray(ids), 'Photo allowlist must be an array');
assert.equal(new Set(ids).size, ids.length, 'Duplicate landmark photo ID');
assert.ok(records && typeof records === 'object' && !Array.isArray(records),
  'Photo provenance records must be an object');
assert.deepEqual(Object.keys(records).sort(), [...ids].sort(),
  'Every enabled photo must have exactly one reviewed provenance record');
assert.ok(Number.isInteger(manifest.minimumWidth) && manifest.minimumWidth > 0);
assert.ok(Number.isInteger(manifest.minimumHeight) && manifest.minimumHeight > 0);

function dimensions(buffer) {
  assert.equal(buffer.toString('ascii',0,4),'RIFF','Not a RIFF WebP');
  assert.equal(buffer.toString('ascii',8,12),'WEBP','Not a WebP image');
  const format = buffer.toString('ascii',12,16);
  if (format === 'VP8X') return [
    1 + buffer.readUIntLE(24,3), 1 + buffer.readUIntLE(27,3)
  ];
  if (format === 'VP8 ') {
    assert.equal(buffer.toString('hex',23,26),'9d012a','Invalid VP8 frame');
    return [buffer.readUInt16LE(26)&0x3fff,buffer.readUInt16LE(28)&0x3fff];
  }
  if (format === 'VP8L') {
    assert.equal(buffer[20],0x2f,'Invalid lossless WebP signature');
    const bits = buffer.readUInt32LE(21);
    return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];
  }
  assert.fail('Unsupported WebP image format: '+format);
}
for (const id of ids) {
  assert.ok(known.has(id), 'Unknown landmark photo: '+id);
  assert.match(id,/^[a-z0-9-]+$/,'Unsafe photo ID');
  const r = records[id];
  assert.ok(r && typeof r==='object','Missing record for '+id);
  for(const key of ['sourceUrl','creator','license','reviewedBy','reviewedOn','altReviewed'])
    assert.ok(typeof r[key]==='string' && r[key].trim(),id+': missing '+key);
  assert.ok(/^https:\/\//.test(r.sourceUrl),id+': source must be HTTPS');
  assert.ok(allowed.has(r.license),id+': unapproved license');
  assert.match(r.reviewedOn,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(r.altReviewed,'yes',id+': visual alt text not reviewed');
  if(/CC BY/.test(r.license)) assert.ok(typeof r.attribution==='string' &&
    r.attribution.trim(),id+': attribution required');
  const file = path.join('assets','landmark-photos',id+'.webp');
  assert.ok(fs.existsSync(file),id+': enabled image not bundled');
  const bytes = fs.readFileSync(file);
  assert.ok(bytes.length>=30,id+': invalid/truncated image');
  const [width,height]=dimensions(bytes);
  assert.ok(width>=manifest.minimumWidth && height>=manifest.minimumHeight,
    id+': image below required dimensions');
  assert.ok(typeof landmarks.MEDIA_DESCRIPTIONS[id]==='string' &&
    landmarks.MEDIA_DESCRIPTIONS[id].trim(),id+': missing accessible description');
}
console.log('PASS landmark photo provenance: '+ids.length+' reviewed offline photographs; no unverified photo enabled');
