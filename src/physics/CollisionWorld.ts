import * as THREE from 'three';

export interface CollisionCircle {
  x: number;
  z: number;
  radius: number;
  id?: string;
}

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  id?: string;
}

export interface DynamicCollider extends CollisionCircle {
  enabled?: boolean;
}

/**
 * Allocation-free XZ swept-circle solver. Long dashes are divided into bounded
 * steps, then projected out of authored obstacles and live actors. Projection
 * preserves the unblocked component, producing a natural wall-slide instead of
 * cancelling the entire move.
 */
export class CollisionWorld {
  private readonly result = new THREE.Vector3();
  private readonly delta = new THREE.Vector3();
  private readonly step = new THREE.Vector3();

  constructor(
    readonly circles: readonly CollisionCircle[],
    readonly boxes: readonly CollisionBox[],
    readonly bounds: CollisionBox,
  ) {}

  resolve(
    from: Readonly<THREE.Vector3>,
    desired: Readonly<THREE.Vector3>,
    radius: number,
    dynamic: readonly DynamicCollider[] = [],
    ignoreId?: string,
  ): THREE.Vector3 {
    this.result.copy(from).setY(0);
    this.delta.copy(desired).sub(from).setY(0);
    const distance = this.delta.length();
    const steps = Math.min(16, Math.max(1, Math.ceil(distance / Math.max(0.22, radius * 0.55))));
    this.step.copy(this.delta).multiplyScalar(1 / steps);
    for (let i = 0; i < steps; i++) {
      this.result.add(this.step);
      this.project(radius, dynamic, ignoreId);
    }
    this.result.y = 0;
    return this.result;
  }

  overlaps(position: Readonly<THREE.Vector3>, radius: number, dynamic: readonly DynamicCollider[] = [], ignoreId?: string): boolean {
    if (position.x - radius < this.bounds.minX || position.x + radius > this.bounds.maxX || position.z - radius < this.bounds.minZ || position.z + radius > this.bounds.maxZ) return true;
    for (const circle of this.circles) {
      const dx = position.x - circle.x;
      const dz = position.z - circle.z;
      if (dx * dx + dz * dz < (radius + circle.radius) ** 2) return true;
    }
    for (const box of this.boxes) {
      if (position.x > box.minX - radius && position.x < box.maxX + radius && position.z > box.minZ - radius && position.z < box.maxZ + radius) return true;
    }
    for (const circle of dynamic) {
      if (circle.enabled === false || circle.id === ignoreId) continue;
      const dx = position.x - circle.x;
      const dz = position.z - circle.z;
      if (dx * dx + dz * dz < (radius + circle.radius) ** 2) return true;
    }
    return false;
  }

  private project(radius: number, dynamic: readonly DynamicCollider[], ignoreId?: string): void {
    this.result.x = THREE.MathUtils.clamp(this.result.x, this.bounds.minX + radius, this.bounds.maxX - radius);
    this.result.z = THREE.MathUtils.clamp(this.result.z, this.bounds.minZ + radius, this.bounds.maxZ - radius);
    // Three passes resolve corners and tightly packed props without oscillation.
    for (let pass = 0; pass < 3; pass++) {
      for (const circle of this.circles) this.projectCircle(circle, radius);
      for (const box of this.boxes) this.projectBox(box, radius);
      for (const circle of dynamic) {
        if (circle.enabled === false || circle.id === ignoreId) continue;
        this.projectCircle(circle, radius);
      }
    }
  }

  private projectCircle(circle: CollisionCircle, radius: number): void {
    const dx = this.result.x - circle.x;
    const dz = this.result.z - circle.z;
    const minimum = radius + circle.radius;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= minimum * minimum) return;
    if (distanceSq < 1e-8) {
      const axisX = Math.abs(this.step.x) < Math.abs(this.step.z);
      this.result.x += axisX ? minimum : 0;
      this.result.z += axisX ? 0 : minimum;
      return;
    }
    const scale = minimum / Math.sqrt(distanceSq);
    this.result.x = circle.x + dx * scale;
    this.result.z = circle.z + dz * scale;
  }

  private projectBox(box: CollisionBox, radius: number): void {
    const minX = box.minX - radius;
    const maxX = box.maxX + radius;
    const minZ = box.minZ - radius;
    const maxZ = box.maxZ + radius;
    if (this.result.x <= minX || this.result.x >= maxX || this.result.z <= minZ || this.result.z >= maxZ) return;
    const left = this.result.x - minX;
    const right = maxX - this.result.x;
    const near = this.result.z - minZ;
    const far = maxZ - this.result.z;
    const smallest = Math.min(left, right, near, far);
    if (smallest === left) this.result.x = minX;
    else if (smallest === right) this.result.x = maxX;
    else if (smallest === near) this.result.z = minZ;
    else this.result.z = maxZ;
  }
}
