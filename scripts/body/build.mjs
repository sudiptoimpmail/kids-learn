import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, simplify, weld, meshopt, dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import fs from 'fs';
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder});
const [src, prepFile, outFile] = process.argv.slice(2);
const prep = JSON.parse(fs.readFileSync(prepFile));
const doc = await io.read(src);
const root = doc.getRoot(), scene = root.listScenes()[0];
const DROP = new Set(['breast_l','breast_r','uterus','ovary_l','ovary_r','fallopian_tubes','vagina','reproductive','prostate',
  'pharynx','larynx','pituitary','adrenal_l','adrenal_r','salivary_glands','thymus','tongue','ureter_l','ureter_r','appendix','eye_l','eye_r','skin']);
const groups = {};
for (const g of scene.listChildren()) {
  if (!['skin','skeleton','organs','vessels'].includes(g.getName())) { g.listChildren().forEach(c => c.dispose()); g.dispose(); continue; }
  groups[g.getName()] = g;
}
for (const n of root.listNodes()) if (DROP.has(n.getName()) && n.getMesh()) n.dispose();
for (const n of root.listNodes()) if (n.getName() === 'lung_l') n.setName('airway_l'); else if (n.getName() === 'lung_r') n.setName('airway_r');
const buf = root.listBuffers()[0] || doc.createBuffer();
const mat = (name) => doc.createMaterial(name);
function addMesh(group, name, o, withPart) {
  const pos = doc.createAccessor().setType('VEC3').setArray(new Float32Array(o.P)).setBuffer(buf);
  const n = o.P.length / 3;
  const idx = doc.createAccessor().setType('SCALAR').setArray(n > 65535 ? new Uint32Array(o.I) : new Uint16Array(o.I)).setBuffer(buf);
  const prim = doc.createPrimitive().setAttribute('POSITION', pos).setIndices(idx).setMaterial(mat(name));
  if (withPart) prim.setAttribute('_PART', doc.createAccessor().setType('SCALAR').setArray(new Uint8Array(o.L)).setBuffer(buf));
  const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim));
  group.addChild(node);
}
addMesh(groups.organs, 'lung_l', prep.lung_l_surf); addMesh(groups.organs, 'lung_r', prep.lung_r_surf);
await doc.transform(dequantize(), prune(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.45, error: 0.0015 }));
const outside = doc.createNode('outside'); scene.addChild(outside);
for (const nm of ['skin','shirt','shorts','shoes','hair']) addMesh(outside, nm, prep[nm], true);
scene.setExtras({ parts: prep.parts, eyes: prep.eyes });
await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
await io.write(outFile, doc);
