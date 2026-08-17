#!/usr/bin/env node
/** Browser-runtime validation using the project's installed Three.js GLTFLoader. */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const expectedClips = new Set(['idle', 'move', 'attack', 'hurt', 'death', 'transform']);
const filename = path.resolve(process.argv[2] ?? 'src/assets/models/quaternius-knight.glb');

function invariant(condition, message) {
  if (!condition) throw new Error(`Three.js GLB validation failed: ${message}`);
}

const file = fs.readFileSync(filename);
const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const gltf = await new Promise((resolve, reject) => {
  new GLTFLoader().parse(arrayBuffer, '', resolve, reject);
});

const clips = new Map(gltf.animations.map((clip) => [clip.name, clip.duration]));
invariant(
  clips.size === expectedClips.size && [...expectedClips].every((name) => clips.has(name)),
  `unexpected clips: ${[...clips.keys()].sort().join(', ')}`,
);

const root = gltf.scene.getObjectByName('NightboundKnight');
invariant(root, 'missing NightboundKnight root');
invariant(root.scale.distanceTo(new THREE.Vector3(1, 1, 1)) < 1e-6, 'root scale is not unit');
invariant(root.quaternion.angleTo(new THREE.Quaternion()) < 1e-6, 'root rotation is not identity');

const skinnedMeshes = [];
gltf.scene.traverse((object) => {
  if (object.isSkinnedMesh) skinnedMeshes.push(object);
});
invariant(skinnedMeshes.length === 3, `expected 3 material primitives, got ${skinnedMeshes.length}`);
invariant(
  skinnedMeshes.every((mesh) => mesh.skeleton?.bones.length === 42),
  'a skinned primitive does not have 42 bones',
);
for (const mesh of skinnedMeshes) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) {
    invariant(material, `${mesh.name} has no material`);
    invariant(material.opacity === 1, `${material.name} opacity is ${material.opacity}, not 1`);
    invariant(material.transparent === false, `${material.name} is marked transparent`);
    invariant(material.alphaTest === 0, `${material.name} alphaTest is ${material.alphaTest}, not 0`);
    invariant(material.visible !== false, `${material.name} is not visible`);
  }
}

gltf.scene.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(gltf.scene, true);
const size = bounds.getSize(new THREE.Vector3());
invariant(Math.abs(size.y - 1.8) < 0.01, `expected ~1.8 m runtime height, got ${size.y}`);
invariant(Math.abs(bounds.min.y) < 0.01, `expected feet at y=0, got ${bounds.min.y}`);

const baselinePosition = root.position.clone();
const baselineQuaternion = root.quaternion.clone();
const baselineScale = root.scale.clone();
const clipMixerChecks = {};
for (const clip of gltf.animations) {
  root.position.copy(baselinePosition);
  root.quaternion.copy(baselineQuaternion);
  root.scale.copy(baselineScale);

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();

  const sampleTimes = [0, 0.25, 0.5, 0.75, 0.999].map((fraction) => clip.duration * fraction);
  const heights = [];
  const fullBodyExtents = [];
  const rootScales = [];
  for (const time of sampleTimes) {
    mixer.setTime(time);
    gltf.scene.updateMatrixWorld(true);
    const sampleBounds = new THREE.Box3().setFromObject(gltf.scene, true);
    const sampleSize = sampleBounds.getSize(new THREE.Vector3());
    const height = sampleSize.y;
    const fullBodyExtent = Math.max(...sampleSize.toArray());
    const scale = root.scale.toArray();
    invariant(scale.every((value) => Math.abs(value - 1) < 1e-6), `${clip.name} changes root scale at ${time}s: ${scale}`);
    // Roll/Jump legitimately produce large axis-aligned boxes while the body is
    // rotated or airborne. The P0 regression is collapse to ~0.579 m, so require
    // finite, non-collapsed geometry here and a standing >=1.7 m first sample.
    invariant(Number.isFinite(height) && height > 0.2 && height < 10, `${clip.name} has invalid visible height ${height} at ${time}s`);
    // Use the largest AABB dimension as a rotation-invariant visible full-body
    // extent: a roll/death may turn 1.8 m from Y into X/Z. The jumping attack
    // also curls into a compact ~1.225 m pose, so 1.0 m is the honest lower
    // bound; the historical 0.3215 root collapse reduces even this pose to
    // roughly 0.394 m and is still rejected decisively.
    invariant(fullBodyExtent >= 1.0 && fullBodyExtent < 10, `${clip.name} visible full-body extent collapsed to ${fullBodyExtent} at ${time}s`);
    heights.push(height);
    fullBodyExtents.push(fullBodyExtent);
    rootScales.push(scale);
  }
  // Roll begins in a slightly crouched authored pose (~1.61 m AABB). Requiring
  // 1.5 m still decisively catches the historical 0.3215 root-scale collapse.
  invariant(heights[0] >= 1.5, `${clip.name} starts below 1.5 m visible height: ${heights[0]}`);
  clipMixerChecks[clip.name] = {
    rootScaleAtSamples: rootScales,
    visibleHeightAtSamples: heights,
    visibleFullBodyExtentAtSamples: fullBodyExtents,
    minVisibleHeight: Math.min(...heights),
    maxVisibleHeight: Math.max(...heights),
    minVisibleFullBodyExtent: Math.min(...fullBodyExtents),
    maxVisibleFullBodyExtent: Math.max(...fullBodyExtents),
  };
  mixer.stopAllAction();
  mixer.uncacheRoot(gltf.scene);
}

root.position.copy(baselinePosition);
root.quaternion.copy(baselineQuaternion);
root.scale.copy(baselineScale);
gltf.scene.updateMatrixWorld(true);

console.log(JSON.stringify({
  file: filename,
  bytes: file.byteLength,
  root: root.name,
  rootScale: root.scale.toArray(),
  rootQuaternion: root.quaternion.toArray(),
  skinnedPrimitives: skinnedMeshes.length,
  bonesPerPrimitive: skinnedMeshes.map((mesh) => mesh.skeleton.bones.length),
  materials: skinnedMeshes.map((mesh) => ({
    name: mesh.material.name,
    opacity: mesh.material.opacity,
    transparent: mesh.material.transparent,
    alphaTest: mesh.material.alphaTest,
    visible: mesh.material.visible,
  })),
  runtimeBounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray() },
  clipsSeconds: Object.fromEntries([...clips].sort(([left], [right]) => left.localeCompare(right))),
  clipMixerChecks,
}, null, 2));
