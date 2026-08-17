import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const path = resolve(process.argv[2] ?? 'src/assets/models/mixamo-vampire.glb');
const expectedRoot = process.argv[3] ?? 'MixamoVampireRig';
const expectedJoints = Number(process.argv[4] ?? 99);
const bytes = await readFile(path);
assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'not a GLB');
assert.equal(bytes.readUInt32LE(4), 2, 'unsupported GLB version');
assert.equal(bytes.readUInt32LE(8), bytes.length, 'declared GLB length mismatch');

let offset = 12;
let json;
let binary;
while (offset < bytes.length) {
  const length = bytes.readUInt32LE(offset);
  const type = bytes.readUInt32LE(offset + 4);
  const body = bytes.subarray(offset + 8, offset + 8 + length);
  if (type === 0x4e4f534a) json = JSON.parse(body.toString('utf8').trim());
  if (type === 0x004e4942) binary = body;
  offset += 8 + length;
}
assert(json && binary, 'GLB must contain JSON and BIN chunks');

const rootIndex = json.nodes.findIndex((node) => node.name === expectedRoot);
assert.notEqual(rootIndex, -1, `${expectedRoot} root missing`);
assert.equal(json.skins?.length, 1, 'expected one skin');
assert.equal(json.skins[0].joints.length, expectedJoints, 'unexpected joint count');
assert.deepEqual(
  [...json.animations.map((animation) => animation.name)].sort(),
  ['attack', 'death', 'hurt', 'idle', 'move'],
  'animation contract mismatch',
);
for (const animation of json.animations) {
  for (const channel of animation.channels) {
    const target = channel.target;
    assert(
      target.node !== rootIndex || (target.path !== 'translation' && target.path !== 'scale'),
      `${animation.name} animates gameplay root ${target.path}`,
    );
  }
}

const componentsByType = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const readFloatAccessor = (accessorIndex) => {
  const accessor = json.accessors[accessorIndex];
  assert.equal(accessor.componentType, 5126, `accessor ${accessorIndex} must be float`);
  const view = json.bufferViews[accessor.bufferView];
  const components = componentsByType[accessor.type];
  const stride = view.byteStride ?? components * 4;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return Array.from({ length: accessor.count }, (_, element) =>
    Array.from({ length: components }, (_, component) =>
      binary.readFloatLE(start + element * stride + component * 4)));
};
for (const [index, accessor] of json.accessors.entries()) {
  if (accessor.componentType !== 5126 || accessor.bufferView === undefined) continue;
  const view = json.bufferViews[accessor.bufferView];
  const components = componentsByType[accessor.type];
  const packedStride = components * 4;
  const stride = view.byteStride ?? packedStride;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  for (let element = 0; element < accessor.count; element += 1) {
    for (let component = 0; component < components; component += 1) {
      const value = binary.readFloatLE(start + element * stride + component * 4);
      assert(Number.isFinite(value), `accessor ${index} contains non-finite data`);
    }
  }
}

for (const material of json.materials ?? []) {
  const alpha = material.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 1;
  assert(alpha > 0, `${material.name ?? 'material'} has zero base-color alpha`);
}

const triangleCount = (json.meshes ?? []).reduce((total, mesh) => total + mesh.primitives.reduce((meshTotal, primitive) => {
  const accessor = json.accessors[primitive.indices];
  return meshTotal + ((primitive.mode ?? 4) === 4 ? accessor.count / 3 : 0);
}, 0), 0);
const embeddedImageBytes = (json.images ?? []).reduce((total, image) => {
  const view = image.bufferView === undefined ? undefined : json.bufferViews[image.bufferView];
  return total + (view?.byteLength ?? 0);
}, 0);
const images = (json.images ?? []).map((image) => {
  const view = json.bufferViews[image.bufferView];
  const start = view.byteOffset ?? 0;
  const png = image.mimeType === 'image/png';
  return {
    mimeType: image.mimeType,
    bytes: view.byteLength,
    width: png ? binary.readUInt32BE(start + 16) : undefined,
    height: png ? binary.readUInt32BE(start + 20) : undefined,
  };
});
const suspiciousTranslations = json.animations.flatMap((animation) => animation.channels.flatMap((channel) => {
  if (channel.target.path !== 'translation') return [];
  const values = readFloatAccessor(animation.samplers[channel.sampler].output);
  const axes = [0, 1, 2].map((axis) => values.map((value) => value[axis]));
  const ranges = axes.map((axis) => Math.max(...axis) - Math.min(...axis));
  const maxAbs = Math.max(...axes.flat().map(Math.abs));
  return maxAbs > 3 || Math.max(...ranges) > 3 ? [{
    animation: animation.name,
    node: json.nodes[channel.target.node]?.name,
    maxAbs,
    ranges,
  }] : [];
}));
assert.equal(suspiciousTranslations.length, 0, 'authored root motion exceeds the presentation-only contract');

console.log(JSON.stringify({
  file: path,
  bytes: bytes.length,
  root: json.nodes[rootIndex].name,
  joints: json.skins[0].joints.length,
  animations: json.animations.map((animation) => animation.name),
  meshes: json.meshes?.length ?? 0,
  materials: (json.materials ?? []).map((material) => material.name),
  images,
  embeddedImageBytes,
  triangleCount,
  suspiciousTranslations,
}, null, 2));
