import * as THREE from 'three';
import type { GameplayEvent } from '../gameplay';

type PoolKind =
  | 'ring' | 'ringCore' | 'ringSoft'
  | 'shard' | 'debris'
  | 'arc' | 'arcCore' | 'arcSoft'
  | 'streak' | 'streakCore' | 'streakSoft'
  | 'pillar' | 'orb';

interface Effect {
  object: THREE.Mesh;
  kind: PoolKind;
  age: number;
  duration: number;
  velocity: THREE.Vector3;
  scaleRatio: THREE.Vector3;
  spin: number;
  startScale: number;
  endScale: number;
  baseOpacity: number;
  gravity: number;
  fadePower: number;
}

const up = new THREE.Vector3(0, 1, 0);
const zero = new THREE.Vector3();
const scratchDirection = new THREE.Vector3();
const scratchRight = new THREE.Vector3();
const scratchPosition = new THREE.Vector3();
const scratchVelocity = new THREE.Vector3();

/**
 * Bounded, allocation-stable combat feedback. Each live effect is a prewarmed
 * mesh with a permanently attached state record; pool exhaustion drops only
 * optional decoration instead of allocating during combat.
 */
export class EffectDirector {
  readonly group = new THREE.Group();
  private readonly effects: Effect[] = [];
  private readonly pools: Record<PoolKind, THREE.Mesh[]> = {
    ring: [], ringCore: [], ringSoft: [], shard: [], debris: [],
    arc: [], arcCore: [], arcSoft: [], streak: [], streakCore: [], streakSoft: [],
    pillar: [], orb: [],
  };
  private readonly geometries: Partial<Record<PoolKind, THREE.BufferGeometry>> = {};
  private shake = 0;
  private shakeTime = 0;

  constructor() {
    this.group.name = 'pooled-combat-effects';
    this.prewarm('ring', 24);
    this.prewarm('ringCore', 12);
    this.prewarm('ringSoft', 8);
    this.prewarm('shard', 84);
    this.prewarm('debris', 16);
    this.prewarm('arc', 18);
    this.prewarm('arcCore', 12);
    this.prewarm('arcSoft', 8);
    this.prewarm('streak', 10);
    this.prewarm('streakCore', 8);
    this.prewarm('streakSoft', 6);
    this.prewarm('pillar', 16);
    this.prewarm('orb', 8);
  }

  onGameplayEvent = (event: GameplayEvent): void => {
    if (event.type === 'vfx') this.spawnCue(event.cue, event.position, event.direction, event.scale ?? 1);
    if (event.type === 'attack') this.spawnAttack(event.form, event.slot, event.position, event.direction);
    if (event.type === 'dash') this.spawnDashWake(event.form, event.position, event.direction);
    if (event.type === 'form') this.spawnTransformation(event.to, event.position);
    if (event.type === 'hit') {
      this.spawnContact(event.form, event.hit.kind, event.hit.point, event.hit.direction, event.hit.amount, event.hit.tags);
      this.shake = Math.max(this.shake, Math.min(0.42, event.hit.amount / 155));
    }
    if (event.type === 'hurt') {
      scratchPosition.copy(event.position).addScaledVector(up, 0.8);
      this.spawnBurst(scratchPosition, 0xff405e, 12, undefined, 0.85);
      this.activate('orb', 0xffe4e8, scratchPosition, 0.15, 0.3, 0.95, 0.88);
      this.shake = Math.max(this.shake, 0.34);
    }
    if (event.type === 'cameraImpulse') this.shake = Math.max(this.shake, Math.min(0.62, event.strength * 0.5));
  };

  update(dt: number, camera: THREE.Camera): void {
    this.shakeTime += dt;
    this.shake *= Math.exp(-dt * 17);
    camera.userData.shakeX = Math.sin(this.shakeTime * 71) * this.shake * 0.31 + Math.sin(this.shakeTime * 113) * this.shake * 0.1;
    camera.userData.shakeY = Math.sin(this.shakeTime * 89 + 1.7) * this.shake * 0.16;

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.age += dt;
      const t = THREE.MathUtils.clamp(effect.age / effect.duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      effect.object.position.addScaledVector(effect.velocity, dt);
      effect.velocity.y -= effect.gravity * dt;
      effect.object.rotation.y += dt * effect.spin;
      const scale = THREE.MathUtils.lerp(effect.startScale, effect.endScale, eased);
      effect.object.scale.set(
        scale * effect.scaleRatio.x,
        scale * effect.scaleRatio.y,
        scale * effect.scaleRatio.z,
      );
      const pulse = effect.kind === 'orb' ? 0.76 + Math.sin(t * Math.PI) * 0.38 : 1;
      (effect.object.material as THREE.MeshBasicMaterial).opacity = effect.baseOpacity * Math.pow(1 - t, effect.fadePower) * pulse;

      if (effect.age >= effect.duration) {
        this.effects.splice(i, 1);
        this.release(effect);
      }
    }
  }

  private prewarm(kind: PoolKind, count: number): void {
    for (let i = 0; i < count; i++) this.pools[kind].push(this.makeMesh(kind));
  }

  private makeMesh(kind: PoolKind): THREE.Mesh {
    const geometry = this.geometries[kind] ?? this.createGeometry(kind);
    this.geometries[kind] = geometry;
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: kind === 'debris',
      blending: kind === 'debris' ? THREE.NormalBlending : THREE.AdditiveBlending,
      toneMapped: kind === 'debris',
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.frustumCulled = false;
    const effect: Effect = {
      object: mesh,
      kind,
      age: 0,
      duration: 0,
      velocity: new THREE.Vector3(),
      scaleRatio: new THREE.Vector3(1, 1, 1),
      spin: 0,
      startScale: 1,
      endScale: 1,
      baseOpacity: 0,
      gravity: 0,
      fadePower: 1.15,
    };
    mesh.userData.effect = effect;
    return mesh;
  }

  private createGeometry(kind: PoolKind): THREE.BufferGeometry {
    return kind === 'ring'
      ? new THREE.RingGeometry(0.5, 0.78, 36)
      : kind === 'ringCore'
        ? new THREE.RingGeometry(0.57, 0.68, 36)
        : kind === 'ringSoft'
          ? new THREE.RingGeometry(0.38, 0.9, 36)
          : kind === 'shard'
            ? new THREE.TetrahedronGeometry(0.085, 0)
            : kind === 'debris'
              ? new THREE.DodecahedronGeometry(0.09, 0)
              : kind === 'arc'
                ? new THREE.TorusGeometry(0.9, 0.125, 6, 30, Math.PI * 1.28)
                : kind === 'arcCore'
                  ? new THREE.TorusGeometry(0.9, 0.04, 5, 30, Math.PI * 1.28)
                  : kind === 'arcSoft'
                    ? new THREE.TorusGeometry(0.9, 0.22, 6, 30, Math.PI * 1.28)
                    : kind === 'streak'
                      ? new THREE.CylinderGeometry(0.055, 0.19, 1.8, 7)
                      : kind === 'streakCore'
                        ? new THREE.CylinderGeometry(0.022, 0.07, 1.84, 7)
                        : kind === 'streakSoft'
                          ? new THREE.CylinderGeometry(0.13, 0.3, 1.9, 7)
                          : kind === 'pillar'
                            ? new THREE.ConeGeometry(0.13, 1.4, 5, 1, true)
                            : new THREE.SphereGeometry(0.22, 8, 6);
  }

  private acquire(kind: PoolKind): Effect | undefined {
    const mesh = this.pools[kind].pop();
    if (!mesh) return undefined;
    mesh.visible = true;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.setScalar(1);
    this.group.add(mesh);
    return mesh.userData.effect as Effect;
  }

  private release(effect: Effect): void {
    const mesh = effect.object;
    this.group.remove(mesh);
    mesh.visible = false;
    const kind = effect.kind;
    this.pools[kind].push(mesh);
  }

  private activate(
    kind: PoolKind,
    color: number,
    position: THREE.Vector3,
    duration: number,
    startScale: number,
    endScale: number,
    opacity: number,
    velocity?: THREE.Vector3,
    spin = 0,
    gravity = 0,
    scaleRatio?: readonly [number, number, number],
    fadePower = 1.15,
  ): THREE.Mesh | undefined {
    const effect = this.acquire(kind);
    if (!effect) return undefined;
    effect.object.position.copy(position);
    (effect.object.material as THREE.MeshBasicMaterial).color.setHex(color);
    (effect.object.material as THREE.MeshBasicMaterial).opacity = opacity;
    effect.age = 0;
    effect.duration = duration;
    effect.velocity.copy(velocity ?? zero);
    effect.spin = spin;
    effect.startScale = startScale;
    effect.endScale = endScale;
    effect.baseOpacity = opacity;
    effect.gravity = gravity;
    effect.fadePower = fadePower;
    if (scaleRatio) effect.scaleRatio.set(scaleRatio[0], scaleRatio[1], scaleRatio[2]);
    else effect.scaleRatio.set(1, 1, 1);
    this.effects.push(effect);
    return effect.object;
  }

  private formColor(name: string): number {
    if (name.includes('wraith') || name.includes('spectral')) return 0x44e8ff;
    if (name.includes('wolf') || name.includes('rend')) return 0xff2863;
    if (name.includes('stone') || name.includes('seismic') || name.includes('crush')) return 0xff9b42;
    return 0xd82d68;
  }

  private formCore(name: string): number {
    if (name.includes('wraith') || name.includes('spectral')) return 0xe3feff;
    if (name.includes('stone') || name.includes('crush')) return 0xffedbd;
    return 0xffe3eb;
  }

  private placeAlong(position: THREE.Vector3, direction: THREE.Vector3, forward: number, height: number, lateral = 0): THREE.Vector3 {
    scratchDirection.copy(direction).setY(0);
    if (scratchDirection.lengthSq() < 0.01) scratchDirection.set(0, 0, 1);
    else scratchDirection.normalize();
    scratchRight.crossVectors(up, scratchDirection).normalize();
    return scratchPosition.copy(position)
      .addScaledVector(scratchDirection, forward)
      .addScaledVector(scratchRight, lateral)
      .addScaledVector(up, height);
  }

  private layerArc(
    color: number,
    coreColor: number,
    position: THREE.Vector3,
    direction: THREE.Vector3,
    scale: number,
    duration: number,
    height = 0.85,
    roll = -Math.PI * 0.55,
    ratio?: readonly [number, number, number],
  ): void {
    const effectPosition = this.placeAlong(position, direction, 0, height);
    const yaw = -Math.atan2(direction.x, direction.z);
    const soft = this.activate('arcSoft', color, effectPosition, duration * 1.15, 0.58, scale * 1.08, 0.2, undefined, 0, 0, ratio, 2.1);
    const body = this.activate('arc', color, effectPosition, duration, 0.62, scale, 0.78, undefined, 0, 0, ratio, 1.8);
    const core = this.activate('arcCore', coreColor, effectPosition, duration * 0.75, 0.58, scale * 0.94, 0.98, undefined, 0, 0, ratio, 2.2);
    for (const mesh of [soft, body, core]) {
      if (!mesh) continue;
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.y = yaw;
      mesh.rotation.z = roll;
    }
  }

  private layerRing(color: number, coreColor: number, position: THREE.Vector3, scale: number, duration: number, ratio?: readonly [number, number, number]): void {
    scratchPosition.copy(position).addScaledVector(up, 0.075);
    const soft = this.activate('ringSoft', color, scratchPosition, duration * 1.15, 0.22, scale * 1.12, 0.18, undefined, 0, 0, ratio, 1.9);
    const body = this.activate('ring', color, scratchPosition, duration, 0.28, scale, 0.72, undefined, 0, 0, ratio, 1.5);
    const core = this.activate('ringCore', coreColor, scratchPosition, duration * 0.72, 0.25, scale * 0.9, 0.96, undefined, 0, 0, ratio, 2.1);
    for (const mesh of [soft, body, core]) if (mesh) mesh.rotation.x = -Math.PI / 2;
  }

  private layerStreak(
    color: number,
    coreColor: number,
    position: THREE.Vector3,
    direction: THREE.Vector3,
    scale: number,
    duration: number,
    height = 0.72,
    lateral = 0,
    ratio?: readonly [number, number, number],
  ): void {
    const effectPosition = this.placeAlong(position, direction, scale * 0.68, height, lateral);
    const yaw = Math.atan2(direction.x, direction.z);
    const soft = this.activate('streakSoft', color, effectPosition, duration * 1.18, 0.62, scale * 1.06, 0.19, undefined, 0, 0, ratio, 2.25);
    const body = this.activate('streak', color, effectPosition, duration, 0.66, scale, 0.76, undefined, 0, 0, ratio, 1.9);
    const core = this.activate('streakCore', coreColor, effectPosition, duration * 0.72, 0.6, scale * 0.96, 1, undefined, 0, 0, ratio, 2.3);
    for (const mesh of [soft, body, core]) {
      if (!mesh) continue;
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.y = yaw;
    }
  }

  private spawnAttack(form: string, slot: string, position: THREE.Vector3, direction: THREE.Vector3): void {
    const color = this.formColor(form);
    const core = this.formCore(form);
    const primary = slot === 'primary';
    const ultimate = slot === 'ultimate';

    if (form === 'nightbound') {
      const scale = ultimate ? 2.15 : primary ? 1.08 : 1.55;
      this.layerArc(color, core, this.placeAlong(position, direction, ultimate ? 0.75 : 0.55, 0), direction, scale, ultimate ? 0.34 : 0.24, 0.88, -Math.PI * 0.55);
      if (primary || ultimate) {
        const second = this.activate('arc', 0x8f1647, this.placeAlong(position, direction, 0.74, 0.84), ultimate ? 0.36 : 0.23, 0.55, scale * 0.92, 0.58);
        if (second) {
          second.rotation.x = Math.PI / 2;
          second.rotation.z = -Math.atan2(direction.x, direction.z) + Math.PI * 0.1;
        }
      }
      if (ultimate) this.layerRing(color, core, position, 3.2, 0.46, [1, 1, 0.78]);
      return;
    }

    if (form === 'wraith') {
      this.layerStreak(color, core, position, direction, ultimate ? 2.4 : primary ? 1.15 : 1.8, ultimate ? 0.36 : 0.25, 0.86, 0, [0.86, 1, 0.86]);
      this.activate('orb', core, this.placeAlong(position, direction, primary ? 1.0 : 1.5, 0.88), 0.19, 0.2, ultimate ? 1.25 : 0.72, 0.9);
      if (ultimate) {
        for (let i = -1; i <= 1; i += 2) {
          const side = this.activate('streak', 0x1d8fae, this.placeAlong(position, direction, 1.05, 0.68, i * 0.62), 0.32, 0.55, 1.48, 0.46, undefined, i * 0.8);
          if (side) {
            side.rotation.x = Math.PI / 2;
            side.rotation.y = Math.atan2(direction.x, direction.z) + i * 0.18;
          }
        }
      }
      return;
    }

    if (form === 'dreadwolf') {
      const scale = ultimate ? 2.3 : primary ? 1.02 : 1.56;
      this.layerArc(color, core, this.placeAlong(position, direction, 0.6, 0), direction, scale, ultimate ? 0.34 : 0.2, 0.56, -Math.PI * 0.5, [1.15, 0.78, 1]);
      for (let i = -1; i <= 1; i++) {
        if (i === 0) continue;
        const claw = this.activate('arc', 0xa30f43, this.placeAlong(position, direction, 0.72, 0.58, i * 0.26), 0.19, 0.62, scale * 0.88, 0.56);
        if (claw) {
          claw.rotation.x = Math.PI / 2;
          claw.rotation.z = -Math.atan2(direction.x, direction.z) - Math.PI * 0.5 + i * 0.14;
        }
      }
      if (ultimate) this.layerRing(color, core, position, 3.5, 0.42, [1, 1, 0.82]);
      return;
    }

    const scale = ultimate ? 2.5 : primary ? 1.28 : 1.82;
    this.layerArc(color, core, this.placeAlong(position, direction, 0.58, 0), direction, scale, ultimate ? 0.42 : 0.3, 0.48, -Math.PI * 0.55, [1.42, 0.66, 1.1]);
    this.spawnGroundDebris(this.placeAlong(position, direction, primary ? 1.35 : 2.05, 0.12), direction, ultimate ? 6 : primary ? 2 : 3, ultimate ? 1.3 : 0.78);
    if (ultimate) this.layerRing(color, core, position, 4.2, 0.54, [1, 1, 0.82]);
  }

  private spawnContact(
    form: string,
    kind: string,
    point: THREE.Vector3,
    direction: THREE.Vector3,
    amount: number,
    tags: readonly string[],
  ): void {
    const color = this.formColor(form || kind);
    const core = this.formCore(form || kind);
    const heavy = kind === 'crush' || amount >= 60 || tags.includes('ultimate');
    const areaHit = tags.includes('secondary') || tags.includes('ultimate');
    scratchPosition.copy(point).addScaledVector(up, heavy ? 0.55 : 0.68);
    this.activate('orb', core, scratchPosition, heavy ? 0.2 : 0.15, 0.28, heavy ? 1.28 : 0.92, 0.98, undefined, 0, 0, undefined, 2.2);

    if (form === 'nightbound') {
      this.layerArc(color, core, point, direction, heavy ? 1.25 : 0.82, 0.18, 0.62, -Math.PI * 0.42, [0.8, 0.82, 0.8]);
      scratchPosition.copy(point).addScaledVector(up, heavy ? 0.55 : 0.68);
      this.spawnBurst(scratchPosition, color, heavy ? 8 : 5, direction, 0.78);
    } else if (form === 'wraith') {
      this.layerStreak(color, core, point, direction, heavy ? 1.28 : 0.8, 0.18, 0.62, 0, [0.65, 1, 0.65]);
      scratchPosition.copy(point).addScaledVector(up, heavy ? 0.55 : 0.68);
      this.spawnBurst(scratchPosition, color, heavy ? 7 : 4, direction, 0.72);
    } else if (form === 'dreadwolf') {
      for (let i = -1; i <= 1; i++) {
        const rake = this.activate('arc', i === 0 ? core : color, this.placeAlong(point, direction, 0.08, 0.62 + i * 0.07, i * 0.16), 0.17, 0.48, heavy ? 1.02 : 0.72, i === 0 ? 0.94 : 0.66);
        if (rake) {
          rake.rotation.x = Math.PI / 2;
          rake.rotation.z = -Math.atan2(direction.x, direction.z) - Math.PI * 0.48 + i * 0.13;
        }
      }
      scratchPosition.copy(point).addScaledVector(up, heavy ? 0.55 : 0.68);
      this.spawnBurst(scratchPosition, color, heavy ? 8 : 5, direction, 0.72);
    } else {
      this.layerRing(color, core, point, heavy ? 1.72 : 1.18, 0.28, [1, 1, 0.78]);
      this.spawnGroundDebris(point, direction, areaHit ? 1 : heavy ? 4 : 2, heavy ? 1.15 : 0.72);
      this.spawnBurst(scratchPosition, color, areaHit ? 3 : heavy ? 5 : 3, direction, 0.65);
    }
  }

  private spawnCue(cue: string, position: THREE.Vector3, direction?: THREE.Vector3, scale = 1): void {
    const color = this.formColor(cue);
    const core = this.formCore(cue);
    scratchDirection.copy(direction ?? zero);
    if (scratchDirection.lengthSq() < 0.01) scratchDirection.set(0, 0, 1);
    else scratchDirection.normalize();
    if (cue.includes('transform')) return;

    if (cue.includes('projectile-nightbound')) {
      this.layerArc(color, core, position, scratchDirection, 1.08, 0.29, 0.28, -Math.PI * 0.54, [1.15, 0.72, 1]);
      return;
    }
    if (cue.includes('projectile-wraith')) {
      this.layerStreak(color, core, position, scratchDirection, 0.92, 0.25, 0.2, 0, [0.58, 1, 0.58]);
      return;
    }
    if (cue.includes('blink')) {
      this.layerArc(color, core, position, scratchDirection, 2.1 * scale, 0.34, 0.88, -Math.PI * 0.18, [1.18, 0.78, 1]);
      this.activate('orb', color, this.placeAlong(position, scratchDirection, 0, 0.82), 0.3, 0.42, 1.2 * scale, 0.34);
      return;
    }
    if (cue.includes('wolf-pounce')) {
      this.layerRing(color, core, position, 1.65 * scale, 0.34, [1, 1, 0.76]);
      this.spawnGroundDebris(position, scratchDirection, 5, 0.85);
      return;
    }
    if (cue.includes('stone-charge') || cue.includes('seismic')) {
      this.layerRing(color, core, position, Math.min(4.8, 1.15 * scale), 0.48, [1, 1, 0.72]);
      const spikeCount = cue.includes('seismic') ? 4 : 3;
      this.spawnGroundDebris(position, scratchDirection, 6, cue.includes('seismic') ? 1.35 : 0.9);
      for (let i = 0; i < spikeCount; i++) {
        const angle = i / spikeCount * Math.PI * 2;
        scratchPosition.set(
          position.x + Math.sin(angle) * scale * 0.45,
          position.y + 0.16,
          position.z + Math.cos(angle) * scale * 0.45,
        );
        const pillar = this.activate('pillar', color, scratchPosition, 0.42, 0.18, 0.85 + scale * 0.12, 0.44);
        if (pillar) pillar.rotation.y = angle;
      }
      return;
    }
    if (cue.includes('ultimate')) {
      this.spawnUltimateGround(cue, position, scale);
      return;
    }
    if (cue.includes('dash')) this.spawnImpactRing(position, color, core, 1.15 * scale);
  }

  private spawnUltimateGround(formCue: string, position: THREE.Vector3, scale: number): void {
    const color = this.formColor(formCue);
    const core = this.formCore(formCue);
    const radius = THREE.MathUtils.clamp(scale * 0.62, 2.4, 4.8);
    this.layerRing(color, core, position, radius, 0.52, [1, 1, 0.8]);
    if (formCue.includes('wraith')) {
      for (let i = 0; i < 5; i++) {
        const angle = i / 5 * Math.PI * 2;
        scratchDirection.set(Math.sin(angle), 0, Math.cos(angle));
        const lance = this.activate('streak', color, this.placeAlong(position, scratchDirection, radius * 0.48, 0.3), 0.38, 0.45, 1.28, 0.42);
        if (lance) {
          lance.rotation.x = Math.PI / 2;
          lance.rotation.y = angle;
        }
      }
    } else if (formCue.includes('stone')) {
      this.spawnGroundDebris(position, scratchDirection.set(0, 0, 1), 10, 1.45);
    } else {
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2;
        scratchPosition.set(
          position.x + Math.sin(angle) * radius * 0.48,
          position.y + 0.18,
          position.z + Math.cos(angle) * radius * 0.48,
        );
        this.activate('pillar', color, scratchPosition, 0.48, 0.18, 0.72, 0.4, undefined, i % 2 ? -1.8 : 1.8);
      }
    }
  }

  private spawnDashWake(form: string, position: THREE.Vector3, direction: THREE.Vector3): void {
    const color = this.formColor(form);
    const core = this.formCore(form);
    scratchDirection.copy(direction).normalize();
    if (form === 'wraith') {
      this.layerStreak(color, core, position, scratchDirection, 1.65, 0.3, 0.62, 0, [0.82, 1, 0.82]);
    } else if (form === 'dreadwolf') {
      for (let i = 0; i < 4; i++) {
        const wake = this.activate('streak', color, this.placeAlong(position, scratchDirection, -i * 0.38, 0.22, i % 2 ? 0.22 : -0.22), 0.25 + i * 0.025, 0.3, 0.82, 0.25);
        if (wake) {
          wake.rotation.x = Math.PI / 2;
          wake.rotation.y = Math.atan2(direction.x, direction.z);
        }
      }
    } else if (form === 'stonewrought') {
      this.spawnGroundDebris(position, scratchDirection, 6, 0.85);
      this.spawnImpactRing(position, color, core, 1.3);
    } else {
      for (let i = 0; i < 4; i++) {
        scratchPosition.copy(position).addScaledVector(scratchDirection, -i * 0.35).addScaledVector(up, 0.28 + i * 0.09);
        const wake = this.activate('pillar', color, scratchPosition, 0.28 + i * 0.03, 0.2, 0.72, 0.28);
        if (wake) {
          wake.rotation.x = Math.PI / 2;
          wake.rotation.y = Math.atan2(direction.x, direction.z);
        }
      }
    }
  }

  private spawnTransformation(form: string, position: THREE.Vector3): void {
    const color = this.formColor(form);
    const core = this.formCore(form);
    this.layerRing(color, core, position, 2.7, 0.62, [1, 1, 0.82]);
    scratchPosition.copy(position).addScaledVector(up, 0.92);
    this.activate('orb', color, scratchPosition, 0.48, 0.34, 1.9, 0.34);
    this.spawnBurst(scratchPosition, color, 20, undefined, 0.9);
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2;
      scratchPosition.set(
        position.x + Math.sin(angle) * 0.58,
        position.y + 0.12,
        position.z + Math.cos(angle) * 0.58,
      );
      scratchVelocity.set(Math.sin(angle) * 0.4, 2.1 + (i % 2) * 0.45, Math.cos(angle) * 0.4);
      const pillar = this.activate('pillar', color, scratchPosition, 0.68, 0.2, 0.72, 0.46, scratchVelocity);
      if (pillar) pillar.rotation.y = -angle;
    }
    this.shake = Math.max(this.shake, 0.24);
  }

  private spawnImpactRing(position: THREE.Vector3, color: number, core: number, scale: number): void {
    this.layerRing(color, core, position, scale, 0.32, [1, 1, 0.78]);
  }

  private spawnGroundDebris(position: THREE.Vector3, direction: THREE.Vector3, count: number, force: number): void {
    for (let i = 0; i < count; i++) {
      const angle = i / Math.max(1, count) * Math.PI * 2 + (i % 2) * 0.37;
      scratchVelocity.set(Math.cos(angle) * force * (0.7 + i % 3 * 0.18), 1.1 + (i % 4) * 0.34, Math.sin(angle) * force * (0.7 + i % 3 * 0.18));
      scratchVelocity.addScaledVector(direction, force * 0.28);
      scratchPosition.copy(position).addScaledVector(up, 0.12);
      const debris = this.activate('debris', i % 2 ? 0x403b38 : 0x6a5545, scratchPosition, 0.42 + (i % 4) * 0.06, 0.72 + (i % 3) * 0.16, 0.2, 0.82, scratchVelocity, i % 2 ? -5 : 5, 5.6, [1, 0.75, 1]);
      if (debris) debris.rotation.set(angle, angle * 0.7, angle * 1.2);
    }
  }

  private spawnBurst(position: THREE.Vector3, color: number, count: number, direction?: THREE.Vector3, force = 1): void {
    for (let i = 0; i < count; i++) {
      const angle = i / Math.max(1, count) * Math.PI * 2 + (i % 3) * 0.31;
      const radial = (1.05 + (i % 5) * 0.32) * force;
      scratchVelocity.set(Math.cos(angle) * radial, (0.9 + (i % 4) * 0.62) * force, Math.sin(angle) * radial);
      if (direction) scratchVelocity.addScaledVector(direction, (1.1 + (i % 3) * 0.35) * force);
      const shard = this.activate('shard', color, position, 0.3 + (i % 5) * 0.045, 0.58 + (i % 3) * 0.16, 0.04, 0.82, scratchVelocity, (i % 2 ? -1 : 1) * (5 + i % 7), 4.5, [0.7, 1.35, 0.7]);
      if (shard) shard.rotation.set(angle, angle * 0.7, angle * 1.3);
    }
  }
}
