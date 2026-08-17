import * as THREE from 'three';
import nightboundClothUrl from '../assets/nightbound-cloth-v1.jpg';
import blackenedSteelUrl from '../assets/blackened-steel-v1.jpg';
import { CharacterVisualSlot, type CharacterAssetHandle } from '../assets3d/CharacterPresentation';
import { InputController } from './InputController';
import { distanceToSegmentSquared, targetsInArc, targetsInRadius } from './combatMath';
import { FORM_DEFINITIONS } from './formData';
import type {
  AbilitySlot,
  CombatTarget,
  DamageKind,
  GameplayEvent,
  HitPayload,
  PlayerControllerOptions,
  PlayerForm,
  PlayerSnapshot,
  PlayerUpdateContext,
} from './types';

interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  radius: number;
  damage: number;
  kind: DamageKind;
  hitIds: Set<string>;
}

interface DashState {
  age: number;
  duration: number;
  distance: number;
  direction: THREE.Vector3;
  start: THREE.Vector3;
  hitIds: Set<string>;
}

const UP = new THREE.Vector3(0, 1, 0);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();
const aimPlane = new THREE.Plane(UP, 0);

/**
 * Self-contained player simulation/presentation object. Add `object` to the scene,
 * call `update()` once per frame, and feed enemies through PlayerUpdateContext.
 */
export class PlayerController {
  /** QA-only keyboard mirror for browsers that cannot target canvas pointer presses reliably. */
  private readonly qaCaptureControls = new URLSearchParams(window.location.search).get('capture') === '1';
  readonly object = new THREE.Group();
  readonly actor = new THREE.Group();
  readonly input: InputController;
  readonly maxHealth = 240;
  readonly maxResource = 100;

  health = this.maxHealth;
  resource = this.maxResource;
  form: PlayerForm = 'nightbound';
  facing = 0;
  invulnerable = false;

  private readonly emit?: (event: GameplayEvent) => void;
  private readonly velocity = new THREE.Vector3();
  private readonly aimDirection = new THREE.Vector3(0, 0, 1);
  private readonly raycaster = new THREE.Raycaster();
  private readonly cooldowns: Record<AbilitySlot, number> = {
    primary: 0, secondary: 0, dash: 0, ultimate: 0,
  };
  private readonly projectiles: Projectile[] = [];
  private dash?: DashState;
  private attackLock = 0;
  private attackWindup = 0;
  private queuedPrimary = 0;
  private comboStep = 0;
  private comboExpiry = 0;
  private hurtLock = 0;
  private formLock = 0;
  private animationTime = 0;
  private attackPoseClock = 1;
  private attackPoseDuration = 0;
  private visualForm: PlayerForm = 'nightbound';
  private pendingVisualForm?: PlayerForm;
  private visualFormDelay = 0;
  private lastResource = this.maxResource;
  private readonly formVisuals = new Map<PlayerForm, THREE.Group>();
  private readonly authoredFormVisuals = new Map<PlayerForm, CharacterVisualSlot>();
  private readonly loadedTextures = new Set<THREE.Texture>();
  private disposed = false;

  constructor(options: PlayerControllerOptions) {
    this.input = new InputController(options.domElement);
    this.emit = options.emit;
    this.object.name = 'player-gameplay-root';
    this.actor.name = 'player-actor';
    this.actor.position.copy(options.initialPosition ?? new THREE.Vector3(0, 0, 0));
    this.object.add(this.actor);
    this.createVisuals();
    this.applyFormVisual();
  }

  get position(): THREE.Vector3 {
    return this.actor.position;
  }

  get snapshot(): PlayerSnapshot {
    return {
      form: this.form,
      health: this.health,
      maxHealth: this.maxHealth,
      resource: this.resource,
      maxResource: this.maxResource,
      invulnerable: this.invulnerable,
      position: this.position.clone(),
      facing: this.facing,
      comboStep: this.comboStep,
      cooldowns: { ...this.cooldowns },
    };
  }

  update(dt: number, context: PlayerUpdateContext): void {
    const step = Math.min(dt, 0.05);
    this.animationTime += step;
    this.tickTimers(step);
    this.updateAim(context.camera, context.groundY ?? 0);
    this.handleFormInput();
    this.handleActionInput(context);
    this.updateMovement(step, context);
    this.updateProjectiles(step, context.targets);
    this.updatePresentation(step);
    this.resource = Math.min(this.maxResource, this.resource + FORM_DEFINITIONS[this.form].resourceRegen * step);
    if (Math.abs(this.resource - this.lastResource) > 0.05) {
      this.emit?.({ type: 'resource', value: this.resource, delta: this.resource - this.lastResource });
      this.lastResource = this.resource;
    }
    this.input.endFrame();
  }

  /** External enemy attacks call this. Returns false when the hit is ignored. */
  receiveDamage(amount: number, direction?: THREE.Vector3, stagger = 0.18): boolean {
    if (this.invulnerable || this.health <= 0) return false;
    const applied = amount * FORM_DEFINITIONS[this.form].damageTaken;
    this.health = Math.max(0, this.health - applied);
    this.hurtLock = Math.max(this.hurtLock, stagger);
    if (direction) this.velocity.addScaledVector(direction, Math.min(8, applied * 0.08));
    this.emit?.({ type: 'hurt', amount: applied, health: this.health, position: this.position.clone() });
    this.emit?.({ type: 'cameraImpulse', strength: Math.min(0.75, applied / 55), duration: 0.16 });
    this.emit?.({ type: 'audio', cue: `player-hurt-${this.form}`, position: this.position.clone() });
    this.authoredFormVisuals.get(this.form)?.play(this.health <= 0 ? 'death' : 'hit', {
      fadeSeconds: 0.06,
      loop: THREE.LoopOnce,
      clampWhenFinished: this.health <= 0,
    });
    return true;
  }

  heal(amount: number): void {
    const before = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.health > before) this.emit?.({
      type: 'heal', amount: this.health - before, health: this.health, position: this.position.clone(),
    });
  }

  setForm(next: PlayerForm): boolean {
    if (next === this.form || this.formLock > 0 || this.dash || this.health <= 0) return false;
    const previous = this.form;
    this.form = next;
    this.formLock = 0.42;
    this.attackLock = 0.34;
    this.attackWindup = 0;
    this.velocity.multiplyScalar(0.4);
    this.comboStep = 0;
    this.attackPoseClock = 1;
    this.attackPoseDuration = 0;
    const outgoingAuthored = this.authoredFormVisuals.get(previous);
    if (previous === 'nightbound' && outgoingAuthored?.hasAnimation('transform')) {
      // Gameplay form changes immediately, but the authored body gets fourteen
      // or more 60 Hz presentation frames to compress before it disappears.
      this.visualForm = previous;
      this.pendingVisualForm = next;
      this.visualFormDelay = 0.24;
      this.applyFormVisual();
      outgoingAuthored.play('transform', {
        fadeSeconds: 0.025, reset: true, loop: THREE.LoopOnce, clampWhenFinished: false,
      });
    } else {
      this.visualForm = next;
      this.pendingVisualForm = undefined;
      this.visualFormDelay = 0;
      this.applyFormVisual();
      this.authoredFormVisuals.get(next)?.play('transform', {
        fadeSeconds: 0.025, reset: true, loop: THREE.LoopOnce, clampWhenFinished: false,
      });
    }
    this.emit?.({ type: 'form', from: previous, to: next, position: this.position.clone() });
    this.emit?.({ type: 'vfx', cue: `transform-${next}`, position: this.position.clone(), scale: 1.25 });
    this.emit?.({ type: 'audio', cue: `transform-${next}`, position: this.position.clone(), intensity: 1 });
    return true;
  }

  dispose(): void {
    this.disposed = true;
    this.input.dispose();
    for (const slot of this.authoredFormVisuals.values()) slot.dispose();
    this.authoredFormVisuals.clear();
    this.object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => material.dispose());
    });
    this.loadedTextures.forEach((texture) => texture.dispose());
    this.loadedTextures.clear();
  }

  /** Atomically replaces one procedural form only after a complete GLTF instance exists. */
  attachAuthoredFormVisual(form: PlayerForm, instance: CharacterAssetHandle): boolean {
    const fallback = this.formVisuals.get(form);
    if (!fallback || this.disposed) return false;
    this.authoredFormVisuals.get(form)?.dispose();
    const slot = new CharacterVisualSlot(this.actor, fallback);
    if (!slot.attach(instance)) return false;
    slot.setVisible(form === this.visualForm);
    this.authoredFormVisuals.set(form, slot);
    return true;
  }

  /** QA presentation seam; callers must not mutate the returned slot. */
  getAuthoredFormVisual(form: PlayerForm): CharacterVisualSlot | undefined {
    return this.authoredFormVisuals.get(form);
  }

  private tickTimers(dt: number): void {
    (Object.keys(this.cooldowns) as AbilitySlot[]).forEach((slot) => {
      this.cooldowns[slot] = Math.max(0, this.cooldowns[slot] - dt);
    });
    this.attackLock = Math.max(0, this.attackLock - dt);
    this.attackWindup = Math.max(0, this.attackWindup - dt);
    this.hurtLock = Math.max(0, this.hurtLock - dt);
    this.formLock = Math.max(0, this.formLock - dt);
    this.queuedPrimary = Math.max(0, this.queuedPrimary - dt);
    this.comboExpiry = Math.max(0, this.comboExpiry - dt);
    if (this.comboExpiry === 0) this.comboStep = 0;
  }

  private updateAim(camera: THREE.Camera, groundY: number): void {
    this.raycaster.setFromCamera(this.input.pointerNdc, camera);
    aimPlane.constant = -groundY;
    if (this.raycaster.ray.intersectPlane(aimPlane, tmpA)) {
      this.aimDirection.copy(tmpA).sub(this.position).setY(0);
      if (this.aimDirection.lengthSq() > 0.04) this.aimDirection.normalize();
    }
  }

  private handleFormInput(): void {
    if (this.input.pressed('Digit1')) this.setForm('nightbound');
    if (this.input.pressed('Digit2')) this.setForm('wraith');
    if (this.input.pressed('Digit3')) this.setForm('dreadwolf');
    if (this.input.pressed('Digit4')) this.setForm('stonewrought');
  }

  private handleActionInput(context: PlayerUpdateContext): void {
    // Capture-only presentation gates exercise authored reactions without
    // changing normal controls or encounter damage. They remain unavailable
    // unless the explicit `?capture=1` QA query is present.
    if (this.qaCaptureControls && this.input.pressed('KeyJ')) {
      this.receiveDamage(18, undefined, 0.72);
    }
    if (this.qaCaptureControls && this.input.pressed('KeyK')) {
      this.invulnerable = false;
      this.receiveDamage(this.maxHealth * 2, undefined, 1.2);
    }
    if (this.input.buttonPressed(0) || (this.qaCaptureControls && this.input.pressed('KeyF'))) {
      this.queuedPrimary = 0.16;
    }
    if (this.queuedPrimary > 0 && this.canAct() && this.cooldowns.primary <= 0) {
      if (this.useResource(FORM_DEFINITIONS[this.form].primaryCost)) {
        this.queuedPrimary = 0;
        this.performPrimary(context.targets);
      }
    }
    if ((this.input.buttonPressed(2) || this.input.pressed('KeyQ')) && this.canAct()) {
      this.performSecondary(context);
    }
    if ((this.input.pressed('ShiftLeft') || this.input.pressed('Space')) && this.canAct()) {
      this.startDash();
    }
    if (this.input.pressed('KeyR') && this.canAct()) this.performUltimate(context.targets);
  }

  private canAct(): boolean {
    return this.attackLock <= 0 && this.hurtLock <= 0 && this.formLock <= 0 && !this.dash && this.health > 0;
  }

  private updateMovement(dt: number, context: PlayerUpdateContext): void {
    const def = FORM_DEFINITIONS[this.form];
    if (this.dash) {
      this.updateDash(dt, context);
      return;
    }

    tmpA.set(this.input.movementX, 0, this.input.movementY);
    if (tmpA.lengthSq() > 1) tmpA.normalize();
    // Camera-relative input, projected on the XZ plane.
    context.camera.getWorldDirection(tmpB).setY(0).normalize();
    tmpC.crossVectors(tmpB, UP).normalize();
    const desired = tmpB.multiplyScalar(tmpA.z).addScaledVector(tmpC, tmpA.x).multiplyScalar(def.moveSpeed);
    const control = this.attackLock > 0 ? 0.38 : 1;
    const blend = 1 - Math.exp(-def.acceleration * control * dt);
    this.velocity.lerp(desired, blend);

    if (this.attackWindup <= 0 && this.aimDirection.lengthSq() > 0.1) {
      const targetFacing = Math.atan2(this.aimDirection.x, this.aimDirection.z);
      this.facing = this.lerpAngle(this.facing, targetFacing, 1 - Math.exp(-def.turnSpeed * dt));
    }

    tmpA.copy(this.position);
    tmpB.copy(this.position).addScaledVector(this.velocity, dt);
    const corrected = context.resolveMovement?.(tmpA, tmpB, this.form === 'stonewrought' ? 0.72 : 0.48) ?? tmpB;
    this.position.copy(corrected);
  }


  private startDash(): void {
    const def = FORM_DEFINITIONS[this.form];
    if (this.cooldowns.dash > 0 || !this.useResource(def.dashCost)) return;
    tmpA.set(this.input.movementX, 0, this.input.movementY);
    const direction = tmpA.lengthSq() > 0.01 ? this.velocity.clone().setY(0).normalize() : this.aimDirection.clone();
    if (direction.lengthSq() < 0.1) direction.set(Math.sin(this.facing), 0, Math.cos(this.facing));
    this.dash = {
      age: 0, duration: def.dashDuration, distance: def.dashDistance,
      direction, start: this.position.clone(), hitIds: new Set(),
    };
    this.velocity.set(0, 0, 0);
    this.cooldowns.dash = def.dashCooldown;
    this.invulnerable = this.form === 'wraith' || this.form === 'nightbound';
    this.emit?.({ type: 'dash', form: this.form, position: this.position.clone(), direction: direction.clone() });
    this.emit?.({ type: 'cooldown', slot: 'dash', duration: def.dashCooldown });
    this.emit?.({ type: 'vfx', cue: `dash-${this.form}`, position: this.position.clone(), direction: direction.clone() });
    this.emit?.({ type: 'audio', cue: `dash-${this.form}`, position: this.position.clone() });
  }

  private updateDash(dt: number, context: PlayerUpdateContext): void {
    if (!this.dash) return;
    const dash = this.dash;
    dash.age += dt;
    const t0 = THREE.MathUtils.clamp((dash.age - dt) / dash.duration, 0, 1);
    const t1 = THREE.MathUtils.clamp(dash.age / dash.duration, 0, 1);
    const ease = (t: number): number => 1 - Math.pow(1 - t, 3);
    const deltaDistance = (ease(t1) - ease(t0)) * dash.distance;
    tmpA.copy(this.position);
    tmpB.copy(this.position).addScaledVector(dash.direction, deltaDistance);
    const corrected = context.resolveMovement?.(tmpA, tmpB, this.form === 'stonewrought' ? 0.72 : 0.48) ?? tmpB;
    this.position.copy(corrected);

    if (this.form === 'dreadwolf' || this.form === 'stonewrought') {
      const damage = this.form === 'dreadwolf' ? 44 : 34;
      const kind: DamageKind = this.form === 'dreadwolf' ? 'rend' : 'crush';
      for (const target of targetsInRadius(this.position, this.form === 'dreadwolf' ? 0.9 : 1.15, context.targets)) {
        if (dash.hitIds.has(target.id)) continue;
        dash.hitIds.add(target.id);
        this.applyHit(target, damage, kind, dash.direction, this.form === 'dreadwolf' ? 7 : 12, 0.5, ['dash', this.form]);
      }
    }

    if (dash.age >= dash.duration) {
      if (this.form === 'stonewrought') {
        for (const target of targetsInRadius(this.position, 2.15, context.targets)) {
          this.applyHit(target, 28, 'crush', dash.direction, 10, 0.55, ['dash-end', 'stonewrought']);
        }
        this.emit?.({ type: 'vfx', cue: 'stone-charge-impact', position: this.position.clone(), scale: 2 });
      }
      this.dash = undefined;
      this.invulnerable = false;
    }
  }

  private performPrimary(targets: Iterable<CombatTarget>): void {
    const forward = this.aimDirection.clone();
    this.comboStep = this.comboExpiry > 0 ? (this.comboStep % 3) + 1 : 1;
    this.comboExpiry = 0.72;

    if (this.form === 'wraith') {
      this.spawnProjectile(22, 18, 0.27, 1.15, 'spectral');
      this.attackLock = 0.22;
      this.cooldowns.primary = 0.16;
    } else {
      const isWolf = this.form === 'dreadwolf';
      const isStone = this.form === 'stonewrought';
      const range = isWolf ? 2.25 : isStone ? 2.65 : 2.45;
      const halfAngle = isWolf ? 0.78 : isStone ? 1.02 : 0.72;
      const amount = isWolf ? 30 + this.comboStep * 3 : isStone ? 48 + this.comboStep * 5 : 32 + this.comboStep * 5;
      const kind: DamageKind = isWolf ? 'rend' : isStone ? 'crush' : 'physical';
      for (const target of targetsInArc(this.position, forward, range, halfAngle, targets)) {
        this.applyHit(target, amount, kind, forward, isStone ? 9 : 5, isStone ? 0.55 : 0.25, ['primary', `combo-${this.comboStep}`]);
      }
      this.attackLock = isStone ? 0.5 : isWolf ? 0.27 : 0.34;
      this.attackWindup = this.attackLock * 0.66;
      this.cooldowns.primary = isStone ? 0.38 : isWolf ? 0.18 : 0.24;
    }
    this.emitAttack('primary', forward);
  }

  private performSecondary(context: PlayerUpdateContext): void {
    const targets = context.targets;
    const def = FORM_DEFINITIONS[this.form];
    if (this.cooldowns.secondary > 0 || !this.useResource(def.secondaryCost)) return;
    const forward = this.aimDirection.clone();

    if (this.form === 'nightbound') {
      // Piercing blood crescent: broad projectile with a life-returning hit tag.
      this.spawnProjectile(45, 13, 0.65, 1.25, 'physical');
      this.attackLock = 0.38;
    } else if (this.form === 'wraith') {
      // Slip through space, then detonate at the destination.
      tmpA.copy(this.position);
      tmpB.copy(this.position).addScaledVector(forward, 4.5);
      this.position.copy(context.resolveMovement?.(tmpA, tmpB, 0.48) ?? tmpB);
      for (const target of targetsInRadius(this.position, 2.35, targets)) {
        this.applyHit(target, 50, 'spectral', forward, 4, 0.45, ['secondary', 'blink']);
      }
      this.invulnerable = true;
      window.setTimeout(() => { if (!this.dash) this.invulnerable = false; }, 180);
      this.emit?.({ type: 'vfx', cue: 'wraith-blink-burst', position: this.position.clone(), scale: 2.4 });
      this.attackLock = 0.25;
    } else if (this.form === 'dreadwolf') {
      // Predatory pounce: leap immediately and maul a cone at landing.
      const start = this.position.clone();
      tmpA.copy(this.position);
      tmpB.copy(this.position).addScaledVector(forward, 5.2);
      this.position.copy(context.resolveMovement?.(tmpA, tmpB, 0.48) ?? tmpB);
      for (const target of targets) {
        const radius = target.radius + 0.8;
        if (distanceToSegmentSquared(target.position, start, this.position) <= radius * radius) {
          this.applyHit(target, 64, 'rend', forward, 10, 0.65, ['secondary', 'pounce']);
        }
      }
      this.emit?.({ type: 'vfx', cue: 'wolf-pounce-impact', position: this.position.clone(), scale: 1.8 });
      this.attackLock = 0.4;
    } else {
      // A slow form gets a decisive area denial tool and brief super armor.
      for (const target of targetsInRadius(this.position, 4.2, targets)) {
        tmpA.copy(target.position).sub(this.position).setY(0).normalize();
        this.applyHit(target, 72, 'crush', tmpA, 17, 1.0, ['secondary', 'seismic-slam']);
      }
      this.invulnerable = true;
      window.setTimeout(() => { if (!this.dash) this.invulnerable = false; }, 320);
      this.emit?.({ type: 'vfx', cue: 'seismic-slam', position: this.position.clone(), scale: 4.2 });
      this.emit?.({ type: 'cameraImpulse', strength: 1.1, duration: 0.34 });
      this.attackLock = 0.72;
    }
    this.cooldowns.secondary = def.secondaryCooldown;
    this.emit?.({ type: 'cooldown', slot: 'secondary', duration: def.secondaryCooldown });
    this.emitAttack('secondary', forward);
  }

  private performUltimate(targets: Iterable<CombatTarget>): void {
    if (this.cooldowns.ultimate > 0 || !this.useResource(65)) return;
    const radius = this.form === 'stonewrought' ? 6.5 : 5.3;
    for (const target of targetsInRadius(this.position, radius, targets)) {
      tmpA.copy(target.position).sub(this.position).setY(0).normalize();
      this.applyHit(target, this.form === 'stonewrought' ? 105 : 86, this.form === 'wraith' ? 'spectral' : 'physical', tmpA, 16, 1.2, ['ultimate', this.form]);
    }
    this.cooldowns.ultimate = 14;
    this.attackLock = 0.85;
    this.emit?.({ type: 'cooldown', slot: 'ultimate', duration: 14 });
    this.emit?.({ type: 'vfx', cue: `ultimate-${this.form}`, position: this.position.clone(), scale: radius });
    this.emit?.({ type: 'cameraImpulse', strength: 1.25, duration: 0.42 });
    this.emitAttack('ultimate', this.aimDirection);
  }

  private spawnProjectile(damage: number, speed: number, radius: number, lifetime: number, kind: DamageKind): void {
    const color = kind === 'spectral' ? 0x7ce7ff : 0xef3e67;
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: kind === 'spectral' ? 0.88 : 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const geometry = this.form === 'nightbound'
      ? new THREE.TorusGeometry(radius * 0.94, radius * 0.16, 5, 24, Math.PI * 1.42)
      : new THREE.OctahedronGeometry(radius, 0);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.projectileForm = this.form;
    if (this.form === 'nightbound') {
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = -Math.atan2(this.aimDirection.x, this.aimDirection.z) - Math.PI * 0.7;
      mesh.scale.set(1.38, 1, 1);
    } else {
      mesh.scale.set(0.7, 1.35, 0.7);
    }
    mesh.position.copy(this.position).add(new THREE.Vector3(0, this.form === 'wraith' ? 1.05 : 0.8, 0));
    this.object.add(mesh);
    this.projectiles.push({
      mesh, velocity: this.aimDirection.clone().multiplyScalar(speed), age: 0,
      lifetime, radius, damage, kind, hitIds: new Set(),
    });
    this.emit?.({ type: 'vfx', cue: `projectile-${this.form}`, position: mesh.position.clone(), direction: this.aimDirection.clone() });
  }

  private updateProjectiles(dt: number, targets: Iterable<CombatTarget>): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      if (!projectile) continue;
      projectile.age += dt;
      projectile.mesh.position.addScaledVector(projectile.velocity, dt);
      if (projectile.mesh.userData.projectileForm === 'nightbound') projectile.mesh.rotation.z += dt * 7.5;
      else {
        projectile.mesh.rotation.x += dt * 9;
        projectile.mesh.rotation.y += dt * 13;
      }
      for (const target of targets) {
        if (target.alive === false || projectile.hitIds.has(target.id)) continue;
        const hitRadius = projectile.radius + target.radius;
        if (projectile.mesh.position.distanceToSquared(target.position) <= hitRadius * hitRadius) {
          projectile.hitIds.add(target.id);
          this.applyHit(target, projectile.damage, projectile.kind, projectile.velocity.clone().normalize(), 5, 0.35, ['projectile', this.form]);
          if (this.form === 'nightbound') this.heal(3.5);
        }
      }
      if (projectile.age >= projectile.lifetime) {
        this.object.remove(projectile.mesh);
        projectile.mesh.geometry.dispose();
        (projectile.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private applyHit(
    target: CombatTarget,
    amount: number,
    kind: DamageKind,
    direction: THREE.Vector3,
    impulse: number,
    stagger: number,
    tags: string[],
  ): void {
    const hit: HitPayload = {
      sourceId: 'player', amount, kind, point: target.position.clone(),
      direction: direction.clone(), impulse, stagger, tags,
    };
    target.receiveHit?.(hit);
    this.emit?.({ type: 'hit', form: this.form, targetId: target.id, hit });
    this.emit?.({ type: 'vfx', cue: `hit-${kind}`, position: target.position.clone(), direction: direction.clone(), scale: Math.min(2, amount / 35) });
    this.emit?.({ type: 'audio', cue: `hit-${kind}`, position: target.position.clone(), intensity: Math.min(1.5, amount / 50) });
  }

  private emitAttack(slot: AbilitySlot, direction: THREE.Vector3): void {
    this.attackPoseClock = 0;
    this.attackPoseDuration = slot === 'ultimate'
      ? 1.02
      : slot === 'secondary'
        ? (this.form === 'stonewrought' ? 0.78 : 0.56)
        : (this.form === 'stonewrought' ? 0.68 : this.form === 'dreadwolf' ? 0.34 : 0.42);
    this.emit?.({ type: 'attack', form: this.form, slot, position: this.position.clone(), direction: direction.clone() });
    this.emit?.({ type: 'audio', cue: `${this.form}-${slot}`, position: this.position.clone() });
    this.authoredFormVisuals.get(this.form)?.play(
      slot === 'primary' ? 'attackPrimary' : slot === 'secondary' ? 'attackSecondary' : 'ability',
      { fadeSeconds: 0.045, loop: THREE.LoopOnce, clampWhenFinished: false },
    );
  }

  private useResource(cost: number): boolean {
    if (this.resource + 0.001 < cost) return false;
    this.resource -= cost;
    return true;
  }

  private updatePresentation(dt: number): void {
    this.advanceVisualForm(dt);
    this.attackPoseClock = Math.min(this.attackPoseDuration, this.attackPoseClock + dt);
    const speedRatio = THREE.MathUtils.clamp(this.velocity.length() / FORM_DEFINITIONS[this.form].moveSpeed, 0, 1);
    this.actor.rotation.y = this.facing;
    const authoredSlot = this.authoredFormVisuals.get(this.visualForm);
    const active = authoredSlot?.presentationRoot ?? this.formVisuals.get(this.visualForm);
    if (!active) return;
    const gaitRate = this.form === 'dreadwolf' ? 14 : this.form === 'stonewrought' ? 5.6 : 9;
    const phase = this.animationTime * gaitRate;
    const gaitWave = Math.sin(phase);
    const bob = Math.sin(phase * (this.form === 'dreadwolf' ? 2 : 1)) * (this.form === 'stonewrought' ? 0.045 : 0.07) * speedRatio;
    const targetScale = this.formLock > 0 ? 0.82 + (0.42 - this.formLock) * 0.42 : 1;
    const transformProgress = this.formLock > 0 ? 1 - this.formLock / 0.42 : 1;
    const transformPose = this.formLock > 0 ? Math.sin(transformProgress * Math.PI) : 0;
    const weightShift = gaitWave * speedRatio;
    active.position.x = THREE.MathUtils.damp(active.position.x, weightShift * (this.form === 'stonewrought' ? 0.055 : 0.035), 13, dt);
    active.position.y = THREE.MathUtils.damp(active.position.y, bob - transformPose * 0.16, 15, dt);
    active.scale.setScalar(THREE.MathUtils.damp(active.scale.x, targetScale, 18, dt));
    active.rotation.x = THREE.MathUtils.damp(active.rotation.x, -transformPose * 0.16, 15, dt);
    active.rotation.y = THREE.MathUtils.damp(active.rotation.y, transformPose * 0.3, 14, dt);
    active.rotation.z = THREE.MathUtils.damp(active.rotation.z, -this.input.movementX * 0.08 * speedRatio - weightShift * 0.018, 12, dt);

    if (authoredSlot) {
      // A clamped authored death must never be replaced by locomotion after the
      // short gameplay hurt lock expires; the existing defeat UI owns restart.
      if (this.health <= 0) {
        authoredSlot.update(dt);
        return;
      }
      const actionState = authoredSlot.animationState;
      const authoredOneShotPlaying = actionState !== undefined
        && actionState !== 'idle'
        && actionState !== 'move'
        && authoredSlot.isAnimationRunning(actionState);
      if (!authoredOneShotPlaying && this.formLock <= 0 && this.hurtLock <= 0 && !this.dash) {
        authoredSlot.setLocomotion(speedRatio);
      }
      authoredSlot.update(dt);
      return;
    }

    const joints = active.userData.joints as Record<string, THREE.Object3D> | undefined;
    if (!joints) return;
    const attackT = this.attackPoseDuration > 0
      ? THREE.MathUtils.clamp(this.attackPoseClock / this.attackPoseDuration, 0, 1)
      : 1;
    const attacking = attackT < 1;
    const anticipation = attacking && attackT < 0.32 ? Math.sin(attackT / 0.32 * Math.PI) : 0;
    const contact = attacking ? Math.max(0, 1 - Math.abs(attackT - 0.42) / 0.13) : 0;
    const followThrough = attacking && attackT >= 0.42
      ? Math.sin(THREE.MathUtils.clamp((attackT - 0.42) / 0.58, 0, 1) * Math.PI)
      : 0;
    const attackAmount = Math.max(anticipation, contact, followThrough);
    const hurt = this.hurtLock > 0 ? Math.sin(this.hurtLock * 25) * 0.16 : 0;
    const dashPose = this.dash ? Math.sin(Math.min(1, this.dash.age / Math.max(0.001, this.dash.duration)) * Math.PI) : 0;

    if (this.form === 'nightbound') {
      const stride = Math.sin(phase) * speedRatio;
      joints.leftLeg.rotation.x = THREE.MathUtils.damp(joints.leftLeg.rotation.x, stride * 0.55, 18, dt);
      joints.rightLeg.rotation.x = THREE.MathUtils.damp(joints.rightLeg.rotation.x, -stride * 0.55, 18, dt);
      joints.leftArm.rotation.x = THREE.MathUtils.damp(joints.leftArm.rotation.x, -stride * 0.36 - anticipation * 0.7 + contact * 0.32 - dashPose * 0.65, 20, dt);
      joints.rightArm.rotation.x = THREE.MathUtils.damp(joints.rightArm.rotation.x, stride * 0.36 + anticipation * 1.18 - contact * 2.05 - followThrough * 1.05 - dashPose * 0.9, 24, dt);
      joints.rightArm.rotation.z = THREE.MathUtils.damp(joints.rightArm.rotation.z, -0.2 - contact * 1.02 - followThrough * 0.42, 22, dt);
      joints.torso.position.x = THREE.MathUtils.damp(joints.torso.position.x, -weightShift * 0.035 + contact * 0.08, 15, dt);
      joints.torso.rotation.x = THREE.MathUtils.damp(joints.torso.rotation.x, -0.08 * speedRatio - contact * 0.24 - dashPose * 0.42 + hurt, 16, dt);
      joints.torso.rotation.y = THREE.MathUtils.damp(joints.torso.rotation.y, anticipation * -0.5 + contact * 0.78 + followThrough * 0.28, 22, dt);
      if (joints.head) joints.head.rotation.y = THREE.MathUtils.damp(joints.head.rotation.y, anticipation * 0.18 - contact * 0.24 - hurt * 0.8, 17, dt);
      joints.cape.rotation.x = THREE.MathUtils.damp(joints.cape.rotation.x, -0.1 - speedRatio * 0.32 + Math.sin(phase + 0.8) * 0.08, 9, dt);
    } else if (this.form === 'wraith') {
      joints.core.position.y = 1.18 + Math.sin(this.animationTime * 3.4) * 0.12;
      joints.core.rotation.y += dt * (0.35 + speedRatio * 0.55);
      joints.leftArm.rotation.z = THREE.MathUtils.damp(joints.leftArm.rotation.z, 0.55 + Math.sin(phase) * 0.16 + anticipation * 0.5 - contact * 0.38, 10, dt);
      joints.rightArm.rotation.z = THREE.MathUtils.damp(joints.rightArm.rotation.z, -0.55 - Math.sin(phase + 1) * 0.16 - contact * 0.92 - followThrough * 0.38, 10, dt);
      joints.core.rotation.x = THREE.MathUtils.damp(joints.core.rotation.x, -contact * 0.3 + hurt, 14, dt);
      joints.mask.rotation.x = THREE.MathUtils.damp(joints.mask.rotation.x, -0.12 - contact * 0.42 - followThrough * 0.18 + hurt, 12, dt);
      (joints.trails.children as THREE.Object3D[]).forEach((trail, index) => {
        trail.rotation.z = Math.sin(this.animationTime * (2.2 + index * 0.18) + index) * 0.18;
        trail.rotation.x = -0.1 - speedRatio * 0.22 + Math.cos(this.animationTime * 2 + index) * 0.08;
      });
    } else if (this.form === 'dreadwolf') {
      const stride = Math.sin(phase) * speedRatio;
      joints.frontLeft.rotation.x = THREE.MathUtils.damp(joints.frontLeft.rotation.x, -stride * 0.72 - contact * 0.62 - followThrough * 0.24, 22, dt);
      joints.frontRight.rotation.x = THREE.MathUtils.damp(joints.frontRight.rotation.x, stride * 0.72 - anticipation * 0.62 - contact * 0.36, 22, dt);
      joints.backLeft.rotation.x = THREE.MathUtils.damp(joints.backLeft.rotation.x, stride * 0.75, 22, dt);
      joints.backRight.rotation.x = THREE.MathUtils.damp(joints.backRight.rotation.x, -stride * 0.75, 22, dt);
      joints.body.position.x = THREE.MathUtils.damp(joints.body.position.x, -weightShift * 0.045, 15, dt);
      joints.body.rotation.x = THREE.MathUtils.damp(joints.body.rotation.x, 0.06 + Math.abs(stride) * 0.06 - anticipation * 0.2 - contact * 0.25 - dashPose * 0.28 + hurt, 16, dt);
      joints.neck.rotation.x = THREE.MathUtils.damp(joints.neck.rotation.x, -0.32 + anticipation * 0.48 - contact * 0.88 - followThrough * 0.32, 24, dt);
      joints.jaw.rotation.x = THREE.MathUtils.damp(joints.jaw.rotation.x, attackAmount > 0 ? 0.16 + contact * 0.62 + anticipation * 0.28 : 0.08 + Math.sin(this.animationTime * 2) * 0.035, 24, dt);
      joints.tail.rotation.y = Math.sin(this.animationTime * 4.2) * (0.24 + speedRatio * 0.18);
      joints.tail.rotation.x = -0.45 + Math.sin(this.animationTime * 5.1) * 0.08;
      for (const [name, offset] of [['frontLeftLower', 0], ['frontRightLower', Math.PI], ['backLeftLower', Math.PI], ['backRightLower', 0]] as const) {
        const lower = joints[name];
        if (lower) lower.rotation.x = THREE.MathUtils.damp(lower.rotation.x, 0.3 + Math.max(0, Math.sin(phase + offset)) * 0.72 + dashPose * 0.48, 22, dt);
      }
    } else {
      const stride = Math.sin(phase) * speedRatio;
      joints.leftLeg.rotation.x = THREE.MathUtils.damp(joints.leftLeg.rotation.x, stride * 0.34, 12, dt);
      joints.rightLeg.rotation.x = THREE.MathUtils.damp(joints.rightLeg.rotation.x, -stride * 0.34, 12, dt);
      joints.leftArm.rotation.x = THREE.MathUtils.damp(joints.leftArm.rotation.x, -stride * 0.28 - anticipation * 0.82 + contact * 0.28, 13, dt);
      joints.rightArm.rotation.x = THREE.MathUtils.damp(joints.rightArm.rotation.x, stride * 0.28 - anticipation * 1.08 + contact * 1.42 + followThrough * 0.64, 15, dt);
      joints.leftArm.rotation.y = THREE.MathUtils.damp(joints.leftArm.rotation.y, -contact * 0.22, 15, dt);
      joints.rightArm.rotation.y = THREE.MathUtils.damp(joints.rightArm.rotation.y, contact * 0.28, 15, dt);
      joints.leftArm.rotation.z = THREE.MathUtils.damp(joints.leftArm.rotation.z, -0.14 - anticipation * 0.26 - contact * 0.42, 16, dt);
      joints.rightArm.rotation.z = THREE.MathUtils.damp(joints.rightArm.rotation.z, 0.14 + anticipation * 0.34 + contact * 0.46, 16, dt);
      joints.torso.position.x = THREE.MathUtils.damp(joints.torso.position.x, weightShift * 0.045 + contact * 0.1, 11, dt);
      joints.torso.rotation.x = THREE.MathUtils.damp(joints.torso.rotation.x, -0.08 + anticipation * 0.24 - contact * 0.25 - followThrough * 0.14 + hurt, 12, dt);
      joints.torso.rotation.y = THREE.MathUtils.damp(joints.torso.rotation.y, anticipation * -0.32 + contact * 0.46 + followThrough * 0.18, 14, dt);
      if (joints.head) {
        joints.head.position.y = THREE.MathUtils.damp(joints.head.position.y, 0.82 + anticipation * 0.08 + contact * 0.14, 14, dt);
        joints.head.position.z = THREE.MathUtils.damp(joints.head.position.z, 0.02 + contact * 0.12, 14, dt);
        joints.head.rotation.x = THREE.MathUtils.damp(joints.head.rotation.x, anticipation * 0.12 - contact * 0.14 + hurt * 0.6, 13, dt);
      }
      joints.core.rotation.z += dt * 0.55;
    }
  }

  private applyFormVisual(): void {
    for (const [form, visual] of this.formVisuals) {
      const authored = this.authoredFormVisuals.get(form);
      if (authored) authored.setVisible(form === this.visualForm);
      else visual.visible = form === this.visualForm;
    }
  }

  private advanceVisualForm(dt: number): void {
    if (!this.pendingVisualForm) return;
    this.visualFormDelay = Math.max(0, this.visualFormDelay - dt);
    if (this.visualFormDelay > 0) return;
    this.visualForm = this.pendingVisualForm;
    this.pendingVisualForm = undefined;
    this.applyFormVisual();
  }

  private createVisuals(): void {
    const material = (color: number, emissive: number, metalness = 0.35, emissiveIntensity = 0.65, roughness = 0.48): THREE.MeshStandardMaterial =>
      new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness, metalness, flatShading: false });
    const bindAlbedo = (
      url: string,
      materials: THREE.MeshStandardMaterial[],
      repeat: [number, number],
    ): void => {
      new THREE.TextureLoader().load(url, (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(...repeat);
        texture.anisotropy = 4;
        this.loadedTextures.add(texture);
        materials.forEach((boundMaterial) => {
          boundMaterial.map = texture;
          boundMaterial.needsUpdate = true;
        });
      }, undefined, () => undefined);
    };
    const addMesh = (
      group: THREE.Group, geometry: THREE.BufferGeometry, mat: THREE.Material,
      position: [number, number, number], scale: [number, number, number] = [1, 1, 1],
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    const limb = (parent: THREE.Group, mat: THREE.Material, position: [number, number, number], length: number, radius: number): THREE.Group => {
      const joint = new THREE.Group();
      joint.position.set(...position);
      parent.add(joint);
      addMesh(joint, new THREE.CapsuleGeometry(radius, length, 6, 10), mat, [0, -length * 0.5, 0]);
      return joint;
    };

    const night = new THREE.Group();
    const nightMat = material(0x8b7880, 0x321228, 0.18, 0.3, 0.78);
    const nightEdge = material(0x642743, 0x8d153e, 0.66, 0.74, 0.28);
    const crimson = material(0xad214a, 0xff245f, 0.72, 2.15, 0.22);
    const bone = material(0xb7a99c, 0x210b13, 0.16, 0.12, 0.62);
    const blackSteel = material(0x77777d, 0x1e101c, 0.82, 0.18, 0.26);
    bindAlbedo(nightboundClothUrl, [nightMat], [1.8, 2.8]);
    const nightTorso = new THREE.Group(); nightTorso.position.y = 1.05; night.add(nightTorso);
    addMesh(nightTorso, new THREE.CylinderGeometry(0.32, 0.47, 0.86, 12), nightMat, [0, 0, 0], [1.05, 1, 0.72]);
    addMesh(nightTorso, new THREE.CylinderGeometry(0.34, 0.42, 0.18, 12), nightEdge, [0, 0.31, 0.02], [1.22, 1, 0.8]);
    addMesh(nightTorso, new THREE.BoxGeometry(0.12, 0.48, 0.08), crimson, [0, 0, 0.34]).rotation.z = -0.12;
    addMesh(nightTorso, new THREE.TorusGeometry(0.37, 0.045, 6, 20, Math.PI * 1.45), blackSteel, [0, -0.34, 0.03], [1, 1, 0.74]).rotation.x = Math.PI / 2;
    const waistCloth = addMesh(nightTorso, new THREE.ConeGeometry(0.48, 0.72, 9, 2, true), nightMat, [0, -0.69, -0.01], [1, 1, 0.72]);
    waistCloth.rotation.y = Math.PI / 9;
    for (const x of [-0.43, 0.43]) {
      const pauldron = addMesh(nightTorso, new THREE.ConeGeometry(0.25, 0.5, 8), nightEdge, [x, 0.3, 0], [1.2, 1, 0.7]);
      pauldron.rotation.z = x < 0 ? 1.28 : -1.28;
    }
    const nightHead = new THREE.Group(); nightHead.position.set(0, 0.71, 0.03); nightTorso.add(nightHead);
    addMesh(nightHead, new THREE.IcosahedronGeometry(0.27, 2), nightMat, [0, 0, 0], [0.9, 1.18, 0.82]);
    addMesh(nightHead, new THREE.ConeGeometry(0.31, 0.42, 8, 1, true), nightEdge, [0, -0.11, -0.02], [1, 1, 0.92]).rotation.x = Math.PI;
    addMesh(nightHead, new THREE.BoxGeometry(0.32, 0.085, 0.07), blackSteel, [0, 0.02, 0.228]);
    for (const x of [-0.09, 0.09]) addMesh(nightHead, new THREE.SphereGeometry(0.027, 7, 5), crimson, [x, 0.02, 0.273]);
    for (const x of [-0.2, 0.2]) {
      const horn = addMesh(nightHead, new THREE.ConeGeometry(0.055, 0.48, 5), bone, [x, 0.25, 0], [1, 1, 0.7]);
      horn.rotation.z = x < 0 ? 0.38 : -0.38;
    }
    const nightLeftArm = limb(nightTorso, nightMat, [-0.49, 0.2, 0], 0.68, 0.13); nightLeftArm.rotation.z = 0.16;
    const nightRightArm = limb(nightTorso, nightMat, [0.49, 0.2, 0], 0.68, 0.13); nightRightArm.rotation.z = -0.16;
    addMesh(nightLeftArm, new THREE.CylinderGeometry(0.16, 0.12, 0.3, 8), blackSteel, [0, -0.66, 0]);
    addMesh(nightRightArm, new THREE.CylinderGeometry(0.16, 0.12, 0.3, 8), blackSteel, [0, -0.66, 0]);
    const blade = addMesh(nightRightArm, new THREE.TorusGeometry(0.42, 0.055, 5, 18, Math.PI * 1.28), crimson, [0.04, -0.78, 0.08]);
    blade.rotation.set(Math.PI / 2, 0.25, -0.65);
    const leftBlade = addMesh(nightLeftArm, new THREE.ConeGeometry(0.075, 0.65, 5), nightEdge, [-0.02, -0.77, 0.08]); leftBlade.rotation.z = 0.18;
    const nightLeftLeg = limb(night, nightMat, [-0.23, 0.72, 0], 0.72, 0.15);
    const nightRightLeg = limb(night, nightMat, [0.23, 0.72, 0], 0.72, 0.15);
    addMesh(nightLeftLeg, new THREE.BoxGeometry(0.28, 0.36, 0.42), blackSteel, [0, -0.74, 0.1], [1, 1, 1.15]);
    addMesh(nightRightLeg, new THREE.BoxGeometry(0.28, 0.36, 0.42), blackSteel, [0, -0.74, 0.1], [1, 1, 1.15]);
    const cape = new THREE.Group(); cape.position.set(0, 1.34, -0.25); night.add(cape);
    addMesh(cape, new THREE.ConeGeometry(0.67, 1.45, 9, 3, true), nightMat, [0, -0.61, 0], [1, 1, 0.3]);
    addMesh(cape, new THREE.TorusGeometry(0.5, 0.08, 6, 20, Math.PI), nightEdge, [0, -0.04, 0.04], [1, 1, 0.45]).rotation.x = Math.PI / 2;
    for (const x of [-0.4, 0, 0.4]) addMesh(cape, new THREE.ConeGeometry(0.11, 0.65, 5), nightEdge, [x, -1.23 + Math.abs(x) * 0.15, 0], [1, 1, 0.5]);
    night.userData.joints = { torso: nightTorso, head: nightHead, leftArm: nightLeftArm, rightArm: nightRightArm, leftLeg: nightLeftLeg, rightLeg: nightRightLeg, cape };
    this.actor.add(night); this.formVisuals.set('nightbound', night);

    const wraith = new THREE.Group();
    // Wraith keeps a spectral cyan signature at its edges, but its body is a
    // depth-writing indigo mass so it cannot disappear inside cyan boss fields.
    const ghost = new THREE.MeshStandardMaterial({
      color: 0x11162d,
      emissive: 0x162752,
      emissiveIntensity: 0.48,
      roughness: 0.42,
      metalness: 0.28,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    const ghostVeil = new THREE.MeshStandardMaterial({
      color: 0x283469,
      emissive: 0x215c88,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.62,
      roughness: 0.3,
      metalness: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ghostMask = new THREE.MeshStandardMaterial({
      color: 0x8f9bb2,
      emissive: 0x263b67,
      emissiveIntensity: 0.42,
      roughness: 0.34,
      metalness: 0.52,
    });
    const ghostBright = new THREE.MeshStandardMaterial({
      color: 0xbdefff,
      emissive: 0x57cce8,
      emissiveIntensity: 1.75,
      transparent: true,
      opacity: 0.84,
      roughness: 0.16,
      depthWrite: false,
    });
    const wraithCore = new THREE.Group(); wraithCore.position.y = 1.18; wraith.add(wraithCore);
    addMesh(wraithCore, new THREE.IcosahedronGeometry(0.42, 2), ghost, [0, 0, 0], [0.92, 1.4, 0.74]);
    addMesh(wraithCore, new THREE.TorusGeometry(0.45, 0.12, 8, 24, Math.PI * 1.5), ghostVeil, [0, 0.25, -0.02], [1.18, 1, 0.72]).rotation.x = Math.PI / 2;
    const mask = new THREE.Group(); mask.position.set(0, 0.55, 0.08); wraithCore.add(mask);
    addMesh(mask, new THREE.ConeGeometry(0.24, 0.58, 9), ghostMask, [0, 0, 0.14], [0.85, 1, 0.4]).rotation.x = Math.PI;
    for (const x of [-0.085, 0.085]) addMesh(mask, new THREE.BoxGeometry(0.045, 0.045, 0.035), ghostBright, [x, 0.08, 0.27]);
    const wraithLeftArm = new THREE.Group(); wraithLeftArm.position.set(-0.33, 0.15, 0); wraithCore.add(wraithLeftArm);
    const wraithRightArm = new THREE.Group(); wraithRightArm.position.set(0.33, 0.15, 0); wraithCore.add(wraithRightArm);
    for (const [arm, sign] of [[wraithLeftArm, -1], [wraithRightArm, 1]] as const) {
      addMesh(arm, new THREE.ConeGeometry(0.12, 0.82, 5, 1, true), ghostVeil, [sign * 0.25, -0.25, 0]).rotation.z = sign * -0.72;
      addMesh(arm, new THREE.TetrahedronGeometry(0.17, 0), ghostMask, [sign * 0.53, -0.46, 0]);
      const shoulderVeil = addMesh(arm, new THREE.ConeGeometry(0.19, 0.62, 7, 1, true), ghostVeil, [sign * 0.08, 0.02, -0.04], [1.2, 1, 0.7]);
      shoulderVeil.rotation.z = sign * -0.42;
    }
    addMesh(wraithCore, new THREE.TorusGeometry(0.56, 0.035, 5, 32), ghostBright, [0, -0.05, 0], [1, 1, 0.62]).rotation.x = Math.PI / 2;
    const trails = new THREE.Group(); trails.position.y = 0.98; wraith.add(trails);
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const trail = new THREE.Group(); trail.position.set(Math.sin(angle) * 0.35, 0, Math.cos(angle) * 0.22); trails.add(trail);
      addMesh(trail, new THREE.ConeGeometry(0.13, 1.45 + (i % 3) * 0.18, 5, 1, true), ghostVeil, [0, -0.72, 0], [1, 1, 0.6]);
    }
    for (let i = 0; i < 5; i++) {
      const shard = addMesh(wraithCore, new THREE.TetrahedronGeometry(0.1, 0), ghostBright, [Math.sin(i * 2.51) * 0.78, Math.cos(i * 1.7) * 0.36, Math.cos(i * 2.51) * 0.46]);
      shard.rotation.set(i, i * 0.7, i * 0.3);
    }
    wraith.userData.joints = { core: wraithCore, mask, leftArm: wraithLeftArm, rightArm: wraithRightArm, trails };
    this.actor.add(wraith); this.formVisuals.set('wraith', wraith);

    const wolf = new THREE.Group();
    const wolfMat = material(0x211b21, 0x351426, 0.05, 0.36, 0.82);
    const wolfRidge = material(0x6a203f, 0xb51e51, 0.18, 0.92, 0.6);
    const fang = material(0xd8c7af, 0x5a1626, 0.12, 0.32, 0.38);
    const claw = material(0x332a31, 0x43101f, 0.58, 0.18, 0.24);
    const wolfBody = new THREE.Group(); wolfBody.position.set(0, 0.82, -0.08); wolf.add(wolfBody);
    addMesh(wolfBody, new THREE.CapsuleGeometry(0.44, 1.2, 8, 12), wolfMat, [0, 0, 0], [1.05, 1, 1.28]).rotation.x = Math.PI / 2;
    addMesh(wolfBody, new THREE.IcosahedronGeometry(0.48, 1), wolfMat, [0, 0.08, 0.45], [1.25, 1, 1.2]);
    addMesh(wolfBody, new THREE.SphereGeometry(0.43, 10, 7), wolfMat, [0, 0.02, -0.48], [1.18, 0.95, 1.12]);
    addMesh(wolfBody, new THREE.ConeGeometry(0.48, 0.72, 9, 2, true), wolfRidge, [0, 0.24, 0.32], [1.05, 1, 0.88]).rotation.x = -0.28;
    for (let i = 0; i < 5; i++) {
      const spine = addMesh(wolfBody, new THREE.ConeGeometry(0.075, 0.42 - i * 0.035, 5), wolfRidge, [0, 0.42, -0.45 + i * 0.23], [1, 1, 0.7]);
      spine.rotation.x = -0.18;
    }
    const neck = new THREE.Group(); neck.position.set(0, 0.23, 0.6); wolfBody.add(neck);
    addMesh(neck, new THREE.IcosahedronGeometry(0.4, 1), wolfMat, [0, 0.1, 0.18], [0.9, 1.12, 1.18]);
    addMesh(neck, new THREE.ConeGeometry(0.29, 0.78, 7), wolfMat, [0, 0.06, 0.62], [1, 1, 0.75]).rotation.x = Math.PI / 2;
    addMesh(neck, new THREE.ConeGeometry(0.32, 0.62, 9, 1, true), wolfRidge, [0, 0.22, 0.32], [1.2, 1, 0.9]).rotation.x = -0.35;
    const jaw = new THREE.Group(); jaw.position.set(0, -0.08, 0.82); neck.add(jaw);
    addMesh(jaw, new THREE.BoxGeometry(0.35, 0.16, 0.5), wolfMat, [0, 0, 0.1]);
    for (const x of [-0.12, 0.12]) addMesh(jaw, new THREE.ConeGeometry(0.035, 0.22, 5), fang, [x, -0.08, 0.28]).rotation.x = Math.PI;
    for (const x of [-0.25, 0.25]) {
      const ear = addMesh(neck, new THREE.ConeGeometry(0.11, 0.48, 5), wolfRidge, [x, 0.47, 0.32], [0.75, 1, 0.5]);
      ear.rotation.z = x < 0 ? -0.18 : 0.18;
    }
    for (const x of [-0.13, 0.13]) addMesh(neck, new THREE.SphereGeometry(0.055, 7, 5), wolfRidge, [x, 0.19, 0.89]);
    const wolfLegs: Record<string, THREE.Group> = {};
    for (const [name, x, z] of [['frontLeft', -0.34, 0.46], ['frontRight', 0.34, 0.46], ['backLeft', -0.34, -0.48], ['backRight', 0.34, -0.48]] as const) {
      const leg = new THREE.Group(); leg.position.set(x, -0.18, z); wolfBody.add(leg);
      addMesh(leg, new THREE.CapsuleGeometry(0.13, 0.34, 5, 8), wolfMat, [0, -0.2, 0]);
      const lower = new THREE.Group(); lower.position.set(0, -0.42, 0.03); leg.add(lower);
      addMesh(lower, new THREE.CapsuleGeometry(0.095, 0.3, 5, 8), wolfMat, [0, -0.18, 0.08]).rotation.x = -0.12;
      addMesh(lower, new THREE.BoxGeometry(0.24, 0.12, 0.42), wolfRidge, [0, -0.42, 0.18], [1, 0.65, 1]);
      for (const clawX of [-0.07, 0, 0.07]) {
        const clawMesh = addMesh(lower, new THREE.ConeGeometry(0.018, 0.19, 5), claw, [clawX, -0.46, 0.41]);
        clawMesh.rotation.x = Math.PI / 2;
      }
      wolfLegs[name] = leg;
      wolfLegs[`${name}Lower`] = lower;
    }
    const tail = new THREE.Group(); tail.position.set(0, 0.08, -0.72); wolfBody.add(tail);
    const tailMesh = addMesh(tail, new THREE.ConeGeometry(0.17, 1.25, 7), wolfMat, [0, 0, -0.52], [1, 1, 0.8]); tailMesh.rotation.x = -Math.PI / 2;
    wolf.userData.joints = { body: wolfBody, neck, jaw, tail, ...wolfLegs };
    this.actor.add(wolf); this.formVisuals.set('dreadwolf', wolf);

    const stone = new THREE.Group();
    const basalt = material(0x4f626a, 0x142830, 0.08, 0.34, 0.82);
    const basaltEdge = material(0x829da7, 0x244550, 0.16, 0.46, 0.58);
    const rune = material(0x8e4b2e, 0xff6c31, 0.48, 3.2);
    bindAlbedo(blackenedSteelUrl, [blackSteel], [2.2, 2.2]);
    const stoneTorso = new THREE.Group(); stoneTorso.position.y = 1.18; stone.add(stoneTorso);
    addMesh(stoneTorso, new THREE.IcosahedronGeometry(0.72, 1), basalt, [0, 0, 0], [1.35, 1.24, 0.9]);
    addMesh(stoneTorso, new THREE.CylinderGeometry(0.46, 0.6, 0.38, 10, 1, false), basaltEdge, [0, 0.24, 0.34], [1.5, 1, 0.42]).rotation.x = Math.PI / 2;
    addMesh(stoneTorso, new THREE.BoxGeometry(1.15, 0.14, 0.13), basaltEdge, [0, 0.36, 0.55]).rotation.z = -0.08;
    const chestCrackA = addMesh(stoneTorso, new THREE.BoxGeometry(0.055, 0.56, 0.035), rune, [-0.18, 0.02, 0.7]); chestCrackA.rotation.z = -0.48;
    const chestCrackB = addMesh(stoneTorso, new THREE.BoxGeometry(0.05, 0.42, 0.035), rune, [0.22, -0.09, 0.69]); chestCrackB.rotation.z = 0.62;
    const stoneCore = new THREE.Group(); stoneCore.position.set(0, 0.03, 0.69); stoneTorso.add(stoneCore);
    addMesh(stoneCore, new THREE.TorusGeometry(0.27, 0.07, 7, 20), rune, [0, 0, 0]).rotation.x = Math.PI / 2;
    addMesh(stoneCore, new THREE.OctahedronGeometry(0.16, 1), rune, [0, 0, 0.02]);
    const stoneHead = new THREE.Group(); stoneHead.position.set(0, 0.82, 0.02); stoneTorso.add(stoneHead);
    addMesh(stoneHead, new THREE.IcosahedronGeometry(0.38, 1), basalt, [0, 0, 0], [1.05, 0.9, 0.85]);
    addMesh(stoneHead, new THREE.BoxGeometry(0.48, 0.08, 0.08), rune, [0, 0.02, 0.34]);
    for (const x of [-0.31, 0.31]) {
      const crown = addMesh(stoneHead, new THREE.ConeGeometry(0.12, 0.58, 7), basaltEdge, [x, 0.32, 0], [1, 1, 0.75]);
      crown.rotation.z = x < 0 ? -0.3 : 0.3;
    }
    const stoneLeftArm = new THREE.Group(); stoneLeftArm.position.set(-0.83, 0.36, 0); stoneTorso.add(stoneLeftArm);
    const stoneRightArm = new THREE.Group(); stoneRightArm.position.set(0.83, 0.36, 0); stoneTorso.add(stoneRightArm);
    for (const arm of [stoneLeftArm, stoneRightArm]) {
      addMesh(arm, new THREE.IcosahedronGeometry(0.38, 1), basaltEdge, [0, -0.08, 0], [1.15, 1, 1]);
      addMesh(arm, new THREE.CylinderGeometry(0.25, 0.34, 0.66, 10), basalt, [0, -0.5, 0]);
      addMesh(arm, new THREE.IcosahedronGeometry(0.36, 1), basaltEdge, [0, -0.9, 0.06], [1.2, 1.1, 1.35]);
      addMesh(arm, new THREE.BoxGeometry(0.08, 0.42, 0.06), rune, [0, -0.5, 0.29]);
      const fistRune = addMesh(arm, new THREE.TorusGeometry(0.245, 0.035, 6, 16, Math.PI * 1.38), rune, [0, -0.9, 0.36]);
      fistRune.rotation.x = Math.PI / 2;
      fistRune.rotation.z = -Math.PI * 0.2;
    }
    const stoneLeftLeg = limb(stone, basalt, [-0.4, 0.78, 0], 0.78, 0.25);
    const stoneRightLeg = limb(stone, basalt, [0.4, 0.78, 0], 0.78, 0.25);
    addMesh(stoneLeftLeg, new THREE.IcosahedronGeometry(0.29, 1), basaltEdge, [0, -0.42, 0.12], [1.2, 0.8, 1]);
    addMesh(stoneRightLeg, new THREE.IcosahedronGeometry(0.29, 1), basaltEdge, [0, -0.42, 0.12], [1.2, 0.8, 1]);
    const leftFoot = addMesh(stoneLeftLeg, new THREE.CapsuleGeometry(0.24, 0.34, 6, 10), basaltEdge, [0, -0.83, 0.18], [1.12, 0.8, 1.25]); leftFoot.rotation.x = Math.PI / 2;
    const rightFoot = addMesh(stoneRightLeg, new THREE.CapsuleGeometry(0.24, 0.34, 6, 10), basaltEdge, [0, -0.83, 0.18], [1.12, 0.8, 1.25]); rightFoot.rotation.x = Math.PI / 2;
    for (const x of [-0.58, 0.58]) addMesh(stoneTorso, new THREE.ConeGeometry(0.12, 0.5, 5), basaltEdge, [x, 0.62, -0.13]).rotation.z = x < 0 ? -0.8 : 0.8;
    stone.userData.joints = { torso: stoneTorso, head: stoneHead, core: stoneCore, leftArm: stoneLeftArm, rightArm: stoneRightArm, leftLeg: stoneLeftLeg, rightLeg: stoneRightLeg };
    this.actor.add(stone); this.formVisuals.set('stonewrought', stone);
  }

  private lerpAngle(from: number, to: number, t: number): number {
    const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    return from + delta * t;
  }
}
