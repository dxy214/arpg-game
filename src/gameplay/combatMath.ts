import * as THREE from 'three';
import type { CombatTarget } from './types';

const scratch = new THREE.Vector3();

export function targetsInArc(
  origin: THREE.Vector3,
  forward: THREE.Vector3,
  range: number,
  halfAngle: number,
  targets: Iterable<CombatTarget>,
): CombatTarget[] {
  const result: CombatTarget[] = [];
  const minDot = Math.cos(halfAngle);
  for (const target of targets) {
    if (target.alive === false) continue;
    scratch.copy(target.position).sub(origin);
    scratch.y = 0;
    const maxRange = range + target.radius;
    const distanceSq = scratch.lengthSq();
    if (distanceSq > maxRange * maxRange) continue;
    if (distanceSq < 0.0001 || scratch.normalize().dot(forward) >= minDot) result.push(target);
  }
  return result;
}

export function targetsInRadius(
  origin: THREE.Vector3,
  radius: number,
  targets: Iterable<CombatTarget>,
): CombatTarget[] {
  const result: CombatTarget[] = [];
  for (const target of targets) {
    if (target.alive === false) continue;
    scratch.copy(target.position).sub(origin);
    scratch.y = 0;
    const maxRange = radius + target.radius;
    if (scratch.lengthSq() <= maxRange * maxRange) result.push(target);
  }
  return result;
}

export function distanceToSegmentSquared(
  point: THREE.Vector3,
  start: THREE.Vector3,
  end: THREE.Vector3,
): number {
  const segment = new THREE.Vector3().subVectors(end, start);
  const relative = new THREE.Vector3().subVectors(point, start);
  const lengthSq = Math.max(segment.lengthSq(), 0.0001);
  const t = THREE.MathUtils.clamp(relative.dot(segment) / lengthSq, 0, 1);
  return relative.sub(segment.multiplyScalar(t)).lengthSq();
}

