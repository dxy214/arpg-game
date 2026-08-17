import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const manifestPath = path.join(projectRoot, 'src/assets/models/v11-character-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const componentSizes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const typeWidths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

for (const asset of manifest.assets) {
  const glbPath = path.join(projectRoot, asset.glb);
  const bytes = fs.readFileSync(glbPath);
  if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2) {
    throw new Error(`${asset.id}: invalid GLB header`);
  }
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  const binaryStart = 20 + ((jsonLength + 3) & ~3) + 8;
  const roots = gltf.scenes[gltf.scene ?? 0].nodes.map((index) => gltf.nodes[index].name);
  if (roots.length !== 1 || roots[0] !== asset.authored_root_name) {
    throw new Error(`${asset.id}: root mismatch ${roots.join(', ')}`);
  }
  if (!gltf.skins?.length) throw new Error(`${asset.id}: no skin`);
  const clips = gltf.animations?.map((animation) => animation.name).sort() ?? [];
  if (JSON.stringify(clips) !== JSON.stringify([...asset.clips].sort())) {
    throw new Error(`${asset.id}: clip mismatch ${clips.join(', ')}`);
  }
  for (const [index, accessor] of (gltf.accessors ?? []).entries()) {
    if (accessor.componentType !== 5126 || accessor.bufferView == null) continue;
    const view = gltf.bufferViews[accessor.bufferView];
    const width = typeWidths[accessor.type];
    const stride = view.byteStride ?? width * componentSizes[accessor.componentType];
    const offset = binaryStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    for (let row = 0; row < accessor.count; row += 1) {
      for (let component = 0; component < width; component += 1) {
        const value = bytes.readFloatLE(offset + row * stride + component * 4);
        if (!Number.isFinite(value)) throw new Error(`${asset.id}: non-finite accessor ${index}`);
      }
    }
  }
  console.log(`PASS ${asset.id}: ${asset.triangles} tris, ${asset.bones} bones, ${clips.join('/')}, ${asset.bytes} bytes`);
}
