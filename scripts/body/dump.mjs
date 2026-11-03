import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder});
const doc = await io.read(process.argv[2]);
await doc.transform(dequantize());
const want = process.argv[4].split(',');
const out = {};
for (const n of doc.getRoot().listNodes()) {
  if (!want.includes(n.getName()) || !n.getMesh()) continue;
  const M = n.getWorldMatrix();
  const P = [], I = [];
  for (const p of n.getMesh().listPrimitives()) {
    const a = p.getAttribute('POSITION'), base = P.length / 3, v = [];
    for (let i = 0; i < a.getCount(); i++) { a.getElement(i, v); const [x,y,z] = v;
      P.push(M[0]*x+M[4]*y+M[8]*z+M[12], M[1]*x+M[5]*y+M[9]*z+M[13], M[2]*x+M[6]*y+M[10]*z+M[14]); }
    const ix = p.getIndices().getArray(); for (const k of ix) I.push(k + base);
  }
  out[n.getName()] = { P, I };
}
fs.writeFileSync(process.argv[3], JSON.stringify(out));
