import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import * as THREE from 'three';

let CollisionWorld;

before(async () => {
  const source = await readFile(new URL('../src/physics/CollisionWorld.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)((id) => {
    if (id === 'three') return THREE;
    throw new Error(`Unexpected test dependency: ${id}`);
  }, module, module.exports);
  ({ CollisionWorld } = module.exports);
});

test('swept circle cannot tunnel through a thin box during a long dash', () => {
  const world = new CollisionWorld([], [{ minX: -1, maxX: 1, minZ: 0, maxZ: 0.2 }], { minX: -20, maxX: 20, minZ: -20, maxZ: 20 });
  const result = world.resolve(new THREE.Vector3(0, 0, 4), new THREE.Vector3(0, 0, -4), 0.5);
  assert.ok(result.z >= 0.7 - 1e-6, `dash tunneled through wall: z=${result.z}`);
});

test('blocked diagonal movement retains a wall-slide component', () => {
  const world = new CollisionWorld([], [{ minX: 0, maxX: 1, minZ: -5, maxZ: 5 }], { minX: -20, maxX: 20, minZ: -20, maxZ: 20 });
  const result = world.resolve(new THREE.Vector3(-2, 0, -2), new THREE.Vector3(2, 0, 2), 0.5);
  assert.ok(result.x <= -0.5 + 1e-6, `entered wall: x=${result.x}`);
  assert.ok(result.z > 1.5, `lost slide component: z=${result.z}`);
});

test('static props and live characters both reject overlap', () => {
  const world = new CollisionWorld([{ x: 2, z: 0, radius: 1 }], [], { minX: -20, maxX: 20, minZ: -20, maxZ: 20 });
  const dynamic = [{ id: 'enemy', x: -2, z: 0, radius: 0.8 }];
  const propResult = world.resolve(new THREE.Vector3(0, 0, 0), new THREE.Vector3(3, 0, 0), 0.5);
  const actorResult = world.resolve(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-3, 0, 0), 0.5, dynamic, 'player');
  assert.ok(!world.overlaps(propResult, 0.5), 'resolved prop position still overlaps');
  assert.ok(!world.overlaps(actorResult, 0.5, dynamic, 'player'), 'resolved actor position still overlaps');
});
