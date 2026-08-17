import * as THREE from 'three';
import { CharacterVisualSlot, type CharacterAssetHandle } from '../assets3d/CharacterPresentation';
import type { CombatTarget, HitPayload, PlayerController } from '../gameplay';
import blackenedSteelUrl from '../assets/blackened-steel-v1.jpg';

export type EnemyKind = 'mourner' | 'binder' | 'stalker' | 'choir' | 'elite';

interface EnemySpec {
  name: string;
  health: number;
  speed: number;
  radius: number;
  range: number;
  damage: number;
  windup: number;
  cooldown: number;
  color: number;
  accent: number;
}

const SPECS: Record<EnemyKind, EnemySpec> = {
  mourner: { name: 'Husk Mourner', health: 74, speed: 3.1, radius: 0.6, range: 1.8, damage: 14, windup: 0.62, cooldown: 1.6, color: 0x2b3036, accent: 0x9cc7c5 },
  binder: { name: 'Lantern Binder', health: 58, speed: 2.4, radius: 0.55, range: 8.5, damage: 12, windup: 0.9, cooldown: 2.5, color: 0x30313a, accent: 0xf4a55c },
  stalker: { name: 'Mire Stalker', health: 52, speed: 5.1, radius: 0.48, range: 1.5, damage: 10, windup: 0.38, cooldown: 1.15, color: 0x172b29, accent: 0x6ce8c6 },
  choir: { name: 'Choir Hexer', health: 66, speed: 2, radius: 0.58, range: 6.8, damage: 9, windup: 1.1, cooldown: 3.2, color: 0x30273a, accent: 0xba8cff },
  elite: { name: 'The Gloam Castellan', health: 460, speed: 2.8, radius: 0.9, range: 2.4, damage: 23, windup: 0.72, cooldown: 1.5, color: 0x242b31, accent: 0xd9bd73 },
};

interface Shot {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  age: number;
  radius: number;
}

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

const blackenedSteel = new THREE.TextureLoader().load(blackenedSteelUrl);
blackenedSteel.colorSpace = THREE.SRGBColorSpace;
blackenedSteel.wrapS = blackenedSteel.wrapT = THREE.RepeatWrapping;
blackenedSteel.repeat.set(1.7, 1.7);

function lathedBody(profile: Array<[number, number]>, segments = 12) {
  return new THREE.LatheGeometry(profile.map(([radius, y]) => new THREE.Vector2(radius, y)), segments);
}

function forgedMask() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.18, 0.2);
  shape.lineTo(0.18, 0.2);
  shape.lineTo(0.2, 0.04);
  shape.lineTo(0.12, -0.18);
  shape.lineTo(0, -0.25);
  shape.lineTo(-0.12, -0.18);
  shape.lineTo(-0.2, 0.04);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 });
  geometry.translate(0, 0, -0.05);
  return geometry;
}

function forgedBlade(broad = false) {
  const half = broad ? 0.16 : 0.09;
  const length = broad ? 0.96 : 0.64;
  const shape = new THREE.Shape();
  shape.moveTo(-half, -length);
  shape.lineTo(half, -length);
  shape.lineTo(half * 0.86, length * 0.62);
  shape.lineTo(0, length);
  shape.lineTo(-half * 0.86, length * 0.62);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: broad ? 0.12 : 0.08, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.015, bevelSegments: 1 });
  geometry.translate(0, 0, broad ? -0.06 : -0.04);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

// Enemy silhouettes are assembled from a small shared kit.  The parts are
// deliberately faceted (the Hollow March's hammered-iron art direction), but
// no longer read as a single debug primitive. Sharing geometry keeps the more
// articulated cast inexpensive despite the extra visual layers.
const ENEMY_GEO = {
  torso: lathedBody([[0.42, -0.46], [0.5, -0.28], [0.45, 0.08], [0.53, 0.35], [0.35, 0.48]]),
  narrowTorso: lathedBody([[0.34, -0.5], [0.39, -0.3], [0.32, 0.06], [0.42, 0.38], [0.28, 0.5]]),
  skirt: new THREE.CylinderGeometry(0.48, 0.62, 0.92, 12, 2, true),
  hood: lathedBody([[0.03, -0.28], [0.31, -0.2], [0.38, 0.06], [0.27, 0.24], [0.08, 0.31]], 10),
  mask: forgedMask(),
  head: new THREE.IcosahedronGeometry(0.27, 2),
  limb: new THREE.CapsuleGeometry(0.115, 0.49, 5, 9),
  heavyLimb: new THREE.CapsuleGeometry(0.17, 0.55, 5, 9),
  shin: new THREE.CapsuleGeometry(0.125, 0.4, 5, 9),
  paw: new THREE.SphereGeometry(0.2, 9, 6),
  pauldron: new THREE.SphereGeometry(0.27, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.58),
  largePauldron: new THREE.SphereGeometry(0.39, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62),
  plate: new THREE.BoxGeometry(0.72, 0.72, 0.18, 2, 2, 1),
  collar: new THREE.TorusGeometry(0.37, 0.08, 7, 18, Math.PI * 1.5),
  blade: forgedBlade(),
  greatBlade: forgedBlade(true),
  haft: new THREE.CylinderGeometry(0.045, 0.045, 1.8, 10),
  grip: new THREE.CylinderGeometry(0.055, 0.055, 0.42, 9),
  guard: new THREE.BoxGeometry(0.52, 0.08, 0.12, 2, 1, 1),
  lantern: new THREE.OctahedronGeometry(0.23, 2),
  spike: new THREE.ConeGeometry(0.1, 0.46, 8),
  claw: new THREE.ConeGeometry(0.07, 0.36, 7),
  hand: new THREE.SphereGeometry(0.13, 8, 6),
  visor: new THREE.BoxGeometry(0.18, 0.032, 0.025),
};

function enemyMaterial(color: number, roughness: number, metalness = 0, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}

interface EnemyPalette {
  darkCloth: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  tarnished: THREE.MeshStandardMaterial;
  bone: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glow: THREE.MeshBasicMaterial;
}

const paletteCache = new Map<EnemyKind, EnemyPalette>();

function paletteFor(kind: EnemyKind, spec: EnemySpec) {
  const cached = paletteCache.get(kind);
  if (cached) return cached;
  const palette: EnemyPalette = {
    darkCloth: enemyMaterial(kind === 'stalker' ? 0x10201e : 0x101316, 0.92),
    leather: enemyMaterial(0x3b2e26, 0.76, 0.04),
    iron: new THREE.MeshStandardMaterial({ color: kind === 'elite' ? 0xa5aca8 : 0x7f8989, map: blackenedSteel, roughness: 0.4, metalness: 0.72 }),
    tarnished: new THREE.MeshStandardMaterial({ color: kind === 'elite' ? 0xb19a65 : 0x927757, map: blackenedSteel, roughness: 0.52, metalness: 0.5 }),
    bone: enemyMaterial(0xc7bfa5, 0.74, 0.02),
    accent: enemyMaterial(spec.accent, 0.28, 0.12, spec.accent, 1.55),
    glow: new THREE.MeshBasicMaterial({ color: spec.accent, transparent: true, opacity: 0.9 }),
  };
  paletteCache.set(kind, palette);
  return palette;
}

function enemyPart(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1],
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

class EnemyActor implements CombatTarget {
  readonly object = new THREE.Group();
  readonly id: string;
  readonly kind: EnemyKind;
  readonly spec: EnemySpec;
  readonly radius: number;
  alive = true;
  health: number;
  private attackTimer = 0;
  private currentWindup = 0;
  private attackSerial = 0;
  private eliteSlam = false;
  private releasePose = 0;
  private readonly attackDirection = new THREE.Vector3(0, 0, 1);
  private cooldown = 0;
  private hurt = 0;
  private flash = 0;
  private strafeSeed: number;
  private readonly visualRoot = new THREE.Group();
  private authoredVisual?: CharacterVisualSlot;
  private readonly torsoPivot = new THREE.Group();
  private readonly leftArm = new THREE.Group();
  private readonly rightArm = new THREE.Group();
  private readonly leftLeg = new THREE.Group();
  private readonly rightLeg = new THREE.Group();
  private readonly weaponPivot = new THREE.Group();
  private readonly reactiveMaterials: THREE.MeshStandardMaterial[] = [];
  private baseBodyY = 0.84;
  private telegraph: THREE.Mesh;
  private areaTelegraph?: THREE.Mesh;
  private onDeath: (enemy: EnemyActor) => void;
  private onHit: (point: THREE.Vector3, color: number) => void;
  private readonly movementScratch = new THREE.Vector3();
  private readonly movementDesired = new THREE.Vector3();

  constructor(
    id: string,
    kind: EnemyKind,
    position: THREE.Vector3,
    onDeath: (enemy: EnemyActor) => void,
    onHit: (point: THREE.Vector3, color: number) => void,
    private readonly resolveMovement?: (from: Readonly<THREE.Vector3>, desired: Readonly<THREE.Vector3>, radius: number, id: string) => THREE.Vector3,
  ) {
    this.id = id;
    this.kind = kind;
    this.spec = SPECS[kind];
    this.radius = this.spec.radius;
    this.health = this.spec.health;
    this.strafeSeed = Math.random() * Math.PI * 2;
    this.onDeath = onDeath;
    this.onHit = onHit;
    this.object.name = `${this.spec.name} ${id}`;
    this.object.position.copy(position);

    this.object.add(this.visualRoot);
    this.visualRoot.add(this.torsoPivot, this.leftLeg, this.rightLeg);
    this.torsoPivot.add(this.leftArm, this.rightArm, this.weaponPivot);
    this.buildVisual(kind);

    const isRanged = kind === 'binder' || kind === 'choir';
    // Ranged shots are readable projectiles; a long rectangular lane dominated
    // the ground and looked like debug geometry. Casters now use a compact pulse
    // under their feet while melee/elite attacks retain directional shapes.
    const tellGeometry = isRanged
      ? new THREE.RingGeometry(0.38, 0.82, 36)
      : new THREE.PlaneGeometry(kind === 'elite' ? 3.1 : kind === 'stalker' ? 1.05 : 1.45, kind === 'elite' ? 3.25 : this.spec.range + 0.7);
    this.telegraph = new THREE.Mesh(tellGeometry, new THREE.MeshBasicMaterial({ color: this.spec.accent, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    this.telegraph.rotation.x = -Math.PI / 2;
    this.telegraph.position.y = 0.08;
    this.telegraph.position.z = isRanged ? 0 : (kind === 'elite' ? 3.25 : this.spec.range + 0.7) * 0.5;
    this.object.add(this.telegraph);
    if (kind === 'elite') {
      this.areaTelegraph = new THREE.Mesh(new THREE.RingGeometry(0.45, 4.25, 72), (this.telegraph.material as THREE.MeshBasicMaterial).clone());
      this.areaTelegraph.rotation.x = -Math.PI / 2;
      this.areaTelegraph.position.y = 0.07;
      this.object.add(this.areaTelegraph);
    }
  }

  get position() { return this.object.position; }

  attachAuthoredVisual(instance: CharacterAssetHandle, animationOffset: number): boolean {
    this.authoredVisual?.dispose();
    const slot = new CharacterVisualSlot(this.object, this.visualRoot);
    if (!slot.attach(instance)) return false;
    const roleScale = this.kind === 'elite' ? 1.28
      : this.kind === 'stalker' ? 1.08
        : this.kind === 'binder' || this.kind === 'choir' ? 0.94 : 1.02;
    instance.object.scale.multiplyScalar(roleScale);
    instance.setTime(animationOffset);
    this.authoredVisual = slot;
    if (!this.alive) slot.play('death', {
      fadeSeconds: 0.06, loop: THREE.LoopOnce, clampWhenFinished: true,
    });
    return true;
  }

  disposeAuthoredVisual(): void {
    this.authoredVisual?.dispose();
    this.authoredVisual = undefined;
  }

  updateAuthoredVisual(dt: number): void {
    this.authoredVisual?.update(dt);
  }

  receiveHit = (hit: HitPayload) => {
    if (!this.alive) return;
    const vulnerability =
      (this.kind === 'mourner' && hit.kind === 'crush') ||
      (this.kind === 'binder' && hit.kind === 'spectral') ||
      (this.kind === 'stalker' && hit.kind === 'rend') ||
      (this.kind === 'choir' && hit.kind === 'physical') ||
      (this.kind === 'elite' && hit.kind === 'crush') ? 1.22 : 1;
    this.health -= hit.amount * vulnerability;
    this.hurt = Math.max(this.hurt, hit.stagger * (this.kind === 'elite' ? 0.42 : 1));
    this.flash = 0.12;
    this.authoredVisual?.play('hit', {
      fadeSeconds: 0.05, loop: THREE.LoopOnce, clampWhenFinished: false,
    });
    this.moveBy(this.movementScratch.copy(hit.direction).setY(0).multiplyScalar(Math.min(0.42, hit.impulse * 0.026)));
    this.onHit(hit.point, hit.kind === 'spectral' ? 0x79e9ff : hit.kind === 'crush' ? 0xf1bb6d : 0xd46687);
    // Heavy, readable attacks can interrupt ordinary enemies. This gives
    // Stonewrought crowd-control a real defensive use instead of only more damage.
    if (this.kind !== 'elite' && this.attackTimer > 0 && hit.stagger >= 0.5) {
      this.attackTimer = 0;
      (this.telegraph.material as THREE.MeshBasicMaterial).opacity = 0;
      this.cooldown = Math.max(this.cooldown, 0.55);
    }
    if (this.health <= 0) {
      this.alive = false;
      this.authoredVisual?.play('death', {
        fadeSeconds: 0.06, loop: THREE.LoopOnce, clampWhenFinished: true,
      });
      this.onDeath(this);
    }
  };

  update(dt: number, player: PlayerController, time: number, shoot: (from: THREE.Vector3, target: THREE.Vector3, damage: number, color: number, speed?: number) => void) {
    if (!this.alive) {
      if (this.authoredVisual) {
        this.authoredVisual.update(dt);
      } else {
        this.object.scale.multiplyScalar(Math.max(0, 1 - dt * 3.8));
        this.object.rotation.y += dt * 5;
      }
      return;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.releasePose = Math.max(0, this.releasePose - dt);
    this.hurt = Math.max(0, this.hurt - dt);
    this.flash = Math.max(0, this.flash - dt);
    for (const material of this.reactiveMaterials) material.emissiveIntensity = this.flash > 0 ? 1.8 : 0.06;
    const toPlayer = tmp.copy(player.position).sub(this.position).setY(0);
    const distance = toPlayer.length();
    if (distance > 0.01) toPlayer.normalize();
    const aggro = this.kind === 'elite' ? 18 : 12;
    let moving = false;

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      const progress = 1 - this.attackTimer / this.currentWindup;
      const activeTell = this.eliteSlam ? this.areaTelegraph ?? this.telegraph : this.telegraph;
      const teleMat = activeTell.material as THREE.MeshBasicMaterial;
      teleMat.opacity = 0.1 + progress * 0.72;
      activeTell.scale.setScalar(0.72 + progress * 0.28);
      if (this.attackTimer <= 0) {
        teleMat.opacity = 0;
        this.resolveAttack(player, shoot);
        this.cooldown = this.spec.cooldown;
      }
    } else if (this.hurt <= 0 && distance < aggro) {
      if (distance <= this.spec.range || (this.kind === 'binder' || this.kind === 'choir') && distance < 10) {
        if (this.cooldown <= 0) {
          this.eliteSlam = this.kind === 'elite' && this.attackSerial++ % 3 === 2;
          this.currentWindup = this.spec.windup + (this.eliteSlam ? 0.42 : 0);
          this.attackTimer = this.currentWindup;
          this.authoredVisual?.play('attackPrimary', {
            fadeSeconds: 0.06, loop: THREE.LoopOnce, clampWhenFinished: false,
          });
          this.attackDirection.copy(toPlayer);
          (this.telegraph.material as THREE.MeshBasicMaterial).opacity = 0;
          if (this.areaTelegraph) (this.areaTelegraph.material as THREE.MeshBasicMaterial).opacity = 0;
          this.telegraph.scale.setScalar(0.7);
          this.areaTelegraph?.scale.setScalar(0.7);
          this.object.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        } else if (this.kind === 'binder' || this.kind === 'choir') {
          // Ranged enemies maintain a readable firing lane rather than stacking on
          // top of the player. Choir drifts more slowly; Binders reposition harder.
          const retreat = distance < 4.2 ? -0.75 : 0;
          tmp2.set(-toPlayer.z, 0, toPlayer.x).multiplyScalar(Math.sin(time * 0.9 + this.strafeSeed) * this.spec.speed * 0.45);
          tmp2.addScaledVector(toPlayer, retreat * this.spec.speed).multiplyScalar(dt);
          this.moveBy(tmp2);
          moving = tmp2.lengthSq() > 0.00001;
        }
      } else {
        const speed = this.kind === 'stalker' ? this.spec.speed * (1 + Math.max(0, Math.sin(time * 3 + this.strafeSeed)) * 0.35) : this.spec.speed;
        this.moveBy(this.movementScratch.copy(toPlayer).multiplyScalar(speed * dt));
        this.object.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        moving = true;
      }
    }

    const motion = Math.sin(time * (this.kind === 'stalker' ? 10 : 5) + this.strafeSeed);
    const attackProgress = this.attackTimer > 0 ? 1 - this.attackTimer / this.currentWindup : -1;
    this.animateVisual(motion, attackProgress, moving);
    if (this.attackTimer <= 0 && this.hurt <= 0) this.authoredVisual?.setLocomotion(moving ? 1 : 0);
    this.authoredVisual?.update(dt);
  }

  moveBy(offset: Readonly<THREE.Vector3>): void {
    const desired = this.movementDesired.copy(this.position).add(offset);
    const corrected = this.resolveMovement?.(this.position, desired, this.radius, this.id) ?? desired;
    this.position.copy(corrected);
  }

  private buildVisual(kind: EnemyKind) {
    const cloth = enemyMaterial(this.spec.color, 0.86, 0.02, this.spec.accent, 0.06);
    const { darkCloth, leather, iron, tarnished, bone, accent, glow } = paletteFor(kind, this.spec);
    this.reactiveMaterials.push(cloth);

    let torso: THREE.Mesh;
    if (kind === 'mourner') {
      this.baseBodyY = 1.12;
      this.torsoPivot.position.y = this.baseBodyY;
      this.torsoPivot.rotation.x = 0.16;
      torso = enemyPart(ENEMY_GEO.torso, cloth, [0, 0, 0], [0.08, 0, 0], [1, 1.08, 0.82]);
      this.torsoPivot.add(
        torso,
        enemyPart(ENEMY_GEO.skirt, darkCloth, [0, -0.56, -0.02], [0, 0, 0], [0.9, 0.8, 0.82]),
        enemyPart(ENEMY_GEO.collar, leather, [0, 0.34, 0.03], [Math.PI / 2, 0, 0], [1.18, 1.18, 1.18]),
        enemyPart(ENEMY_GEO.hood, darkCloth, [0, 0.72, 0.01], [0.08, 0, 0], [1.05, 1.05, 1.05]),
        enemyPart(ENEMY_GEO.mask, bone, [0, 0.67, 0.24], [0.05, 0, 0], [0.72, 0.9, 0.62]),
        enemyPart(ENEMY_GEO.visor, glow, [0, 0.71, 0.31], [0.05, 0, 0], [0.7, 1, 1]),
      );
      this.leftArm.position.set(-0.47, 0.25, 0);
      this.rightArm.position.set(0.47, 0.25, 0);
      this.leftArm.add(enemyPart(ENEMY_GEO.limb, cloth, [0, -0.3, 0], [0, 0, -0.12]));
      this.rightArm.add(enemyPart(ENEMY_GEO.limb, cloth, [0, -0.3, 0], [0, 0, 0.12]));
      this.weaponPivot.position.set(0.55, -0.05, 0.1);
      this.weaponPivot.rotation.z = -0.22;
      this.weaponPivot.add(
        enemyPart(ENEMY_GEO.blade, iron, [0, -0.33, 0.5], [0.04, 0, 0], [1.25, 1, 1]),
        enemyPart(ENEMY_GEO.spike, tarnished, [0, -0.28, 1.12], [Math.PI / 2, 0, 0], [1.25, 1.1, 1.25]),
        enemyPart(ENEMY_GEO.guard, tarnished, [0, -0.33, -0.08], [0, 0, 0], [0.86, 0.86, 0.86]),
        enemyPart(ENEMY_GEO.grip, leather, [0, -0.33, -0.25], [Math.PI / 2, 0, 0]),
        enemyPart(ENEMY_GEO.hand, leather, [0, -0.33, -0.16], [0, 0, 0], [0.82, 0.82, 0.82]),
      );
      this.makeBipedLegs(darkCloth, 0.32, 0.6);
    } else if (kind === 'binder') {
      this.baseBodyY = 1.17;
      this.torsoPivot.position.y = this.baseBodyY;
      torso = enemyPart(ENEMY_GEO.narrowTorso, cloth, [0, 0, 0], [0, 0, 0], [0.9, 1.05, 0.82]);
      this.torsoPivot.add(
        torso,
        enemyPart(ENEMY_GEO.skirt, darkCloth, [0, -0.58, 0], [0, 0, 0], [0.9, 1.06, 0.8]),
        enemyPart(ENEMY_GEO.hood, leather, [0, 0.71, 0], [0, 0, 0], [0.92, 1.15, 0.94]),
        enemyPart(ENEMY_GEO.mask, iron, [0, 0.67, 0.24], [0, 0, 0], [0.6, 0.85, 0.55]),
        enemyPart(ENEMY_GEO.visor, glow, [0, 0.7, 0.3], [0, 0, 0], [0.62, 1, 1]),
      );
      this.leftArm.position.set(-0.38, 0.2, 0);
      this.rightArm.position.set(0.38, 0.2, 0);
      this.leftArm.add(enemyPart(ENEMY_GEO.limb, cloth, [0, -0.3, 0]));
      this.rightArm.add(enemyPart(ENEMY_GEO.limb, cloth, [0, -0.3, 0]));
      this.weaponPivot.position.set(0.57, 0.1, 0.05);
      this.weaponPivot.rotation.z = -0.1;
      this.weaponPivot.add(
        enemyPart(ENEMY_GEO.haft, tarnished, [0, -0.52, 0]),
        enemyPart(ENEMY_GEO.lantern, iron, [0, -1.26, 0], [0, Math.PI / 4, 0], [1.22, 1.22, 1.22]),
        enemyPart(ENEMY_GEO.lantern, glow, [0, -1.26, 0], [0, Math.PI / 4, 0], [0.62, 0.62, 0.62]),
        enemyPart(ENEMY_GEO.hand, leather, [0, -0.16, 0], [0, 0, 0], [0.74, 0.74, 0.74]),
      );
      const light = new THREE.PointLight(this.spec.accent, 1.15, 4, 2);
      light.position.set(0.57, -1.12, 0.05);
      this.torsoPivot.add(light);
      this.makeBipedLegs(darkCloth, 0.27, 0.58);
    } else if (kind === 'stalker') {
      this.baseBodyY = 0.78;
      this.torsoPivot.position.y = this.baseBodyY;
      torso = enemyPart(ENEMY_GEO.torso, cloth, [0, 0, 0], [Math.PI / 2, 0, 0], [0.88, 1.35, 0.72]);
      this.torsoPivot.add(
        torso,
        enemyPart(ENEMY_GEO.head, darkCloth, [0, 0.15, 0.75], [-0.12, 0, 0], [1.15, 0.82, 1.2]),
        enemyPart(ENEMY_GEO.mask, bone, [0, 0.09, 1.0], [0.16, 0, 0], [0.66, 0.45, 0.6]),
        enemyPart(ENEMY_GEO.visor, glow, [0, 0.11, 1.07], [0.16, 0, 0], [0.52, 0.7, 1]),
        enemyPart(ENEMY_GEO.spike, accent, [-0.22, 0.36, 0.77], [-0.62, 0, -0.28], [0.75, 1, 0.75]),
        enemyPart(ENEMY_GEO.spike, accent, [0.22, 0.36, 0.77], [-0.62, 0, 0.28], [0.75, 1, 0.75]),
      );
      this.leftArm.position.set(-0.34, 0, 0.45);
      this.rightArm.position.set(0.34, 0, 0.45);
      this.leftArm.add(enemyPart(ENEMY_GEO.limb, darkCloth, [0, -0.3, 0], [0.18, 0, 0]), enemyPart(ENEMY_GEO.claw, bone, [0, -0.69, 0.08], [0.48, 0, 0]));
      this.rightArm.add(enemyPart(ENEMY_GEO.limb, darkCloth, [0, -0.3, 0], [0.18, 0, 0]), enemyPart(ENEMY_GEO.claw, bone, [0, -0.69, 0.08], [0.48, 0, 0]));
      this.leftLeg.position.set(-0.33, 0.72, -0.46);
      this.rightLeg.position.set(0.33, 0.72, -0.46);
      this.leftLeg.add(enemyPart(ENEMY_GEO.shin, darkCloth, [0, -0.32, 0], [-0.18, 0, 0]), enemyPart(ENEMY_GEO.paw, darkCloth, [0, -0.65, 0.12], [0, 0, 0], [0.75, 0.55, 1.65]));
      this.rightLeg.add(enemyPart(ENEMY_GEO.shin, darkCloth, [0, -0.32, 0], [-0.18, 0, 0]), enemyPart(ENEMY_GEO.paw, darkCloth, [0, -0.65, 0.12], [0, 0, 0], [0.75, 0.55, 1.65]));
    } else if (kind === 'choir') {
      this.baseBodyY = 1.25;
      this.torsoPivot.position.y = this.baseBodyY;
      torso = enemyPart(ENEMY_GEO.narrowTorso, cloth, [0, 0, 0], [0, 0, 0], [1, 1.12, 0.88]);
      this.torsoPivot.add(
        torso,
        enemyPart(ENEMY_GEO.skirt, darkCloth, [0, -0.64, 0], [0, 0, 0], [1.05, 1.2, 0.94]),
        enemyPart(ENEMY_GEO.collar, tarnished, [0, 0.42, 0], [Math.PI / 2, 0, 0], [1.25, 1.25, 1.25]),
        enemyPart(ENEMY_GEO.hood, darkCloth, [0, 0.79, 0], [0, 0, 0], [1.05, 1.2, 1.05]),
        enemyPart(ENEMY_GEO.mask, bone, [0, 0.74, 0.24], [0, 0, 0], [0.58, 0.92, 0.52]),
        enemyPart(ENEMY_GEO.visor, glow, [0, 0.78, 0.3], [0, 0, 0], [0.62, 1, 1]),
      );
      const halo = enemyPart(new THREE.TorusGeometry(0.53, 0.045, 6, 24), glow, [0, 0.83, -0.13], [Math.PI / 2, 0, 0]);
      this.torsoPivot.add(halo);
      this.leftArm.position.set(-0.43, 0.2, 0);
      this.rightArm.position.set(0.43, 0.2, 0);
      this.leftArm.add(enemyPart(ENEMY_GEO.limb, cloth, [0, -0.28, 0]));
      this.rightArm.add(enemyPart(ENEMY_GEO.limb, cloth, [0, -0.28, 0]));
      this.weaponPivot.position.set(-0.57, 0.05, 0);
      this.weaponPivot.add(
        enemyPart(ENEMY_GEO.haft, tarnished, [0, -0.55, 0]),
        enemyPart(ENEMY_GEO.lantern, accent, [0, 0.42, 0], [0, 0, 0], [0.72, 0.72, 0.72]),
        enemyPart(ENEMY_GEO.hand, bone, [0, -0.18, 0], [0, 0, 0], [0.72, 0.72, 0.72]),
      );
      this.makeBipedLegs(darkCloth, 0.29, 0.64);
    } else {
      this.baseBodyY = 1.46;
      this.torsoPivot.position.y = this.baseBodyY;
      torso = enemyPart(ENEMY_GEO.torso, cloth, [0, 0, 0], [0, 0, 0], [1.65, 1.42, 1.08]);
      this.torsoPivot.add(
        torso,
        enemyPart(ENEMY_GEO.plate, iron, [0, 0.12, 0.48], [-0.12, 0, 0], [1.32, 1.18, 1]),
        enemyPart(ENEMY_GEO.largePauldron, iron, [-0.74, 0.35, 0], [0, 0, 0.16]),
        enemyPart(ENEMY_GEO.largePauldron, iron, [0.74, 0.35, 0], [0, 0, -0.16]),
        enemyPart(ENEMY_GEO.head, darkCloth, [0, 0.88, 0], [0, 0, 0], [1.2, 1.28, 1.08]),
        enemyPart(ENEMY_GEO.mask, tarnished, [0, 0.88, 0.3], [0, 0, 0], [1.14, 1.05, 0.75]),
        enemyPart(ENEMY_GEO.visor, glow, [0, 0.93, 0.39], [0, 0, 0], [1.08, 1.4, 1]),
        enemyPart(ENEMY_GEO.spike, iron, [-0.27, 1.24, 0], [0, 0, -0.34], [1.15, 1.25, 1.15]),
        enemyPart(ENEMY_GEO.spike, iron, [0.27, 1.24, 0], [0, 0, 0.34], [1.15, 1.25, 1.15]),
      );
      this.leftArm.position.set(-0.72, 0.18, 0);
      this.rightArm.position.set(0.72, 0.18, 0);
      this.leftArm.add(enemyPart(ENEMY_GEO.heavyLimb, cloth, [0, -0.38, 0], [0, 0, -0.1]));
      this.rightArm.add(enemyPart(ENEMY_GEO.heavyLimb, cloth, [0, -0.38, 0], [0, 0, 0.1]));
      this.weaponPivot.position.set(0.84, 0, 0.12);
      this.weaponPivot.rotation.z = -0.22;
      this.weaponPivot.add(
        enemyPart(ENEMY_GEO.greatBlade, iron, [0, -0.35, 0.72], [-0.06, 0, 0], [1.24, 1, 1]),
        enemyPart(ENEMY_GEO.spike, accent, [0, -0.34, 1.68], [Math.PI / 2, 0, 0], [1.3, 1.3, 1.3]),
        enemyPart(ENEMY_GEO.guard, tarnished, [0, -0.35, -0.05], [0, 0, 0], [1.28, 1.22, 1.2]),
        enemyPart(ENEMY_GEO.grip, leather, [0, -0.35, -0.28], [Math.PI / 2, 0, 0], [1.18, 1.35, 1.18]),
        enemyPart(ENEMY_GEO.hand, iron, [0, -0.35, -0.17], [0, 0, 0], [1.08, 1.08, 1.08]),
      );
      this.makeBipedLegs(iron, 0.46, 0.85);
    }
    return torso;
  }

  private makeBipedLegs(material: THREE.Material, spacing: number, length: number) {
    this.leftLeg.position.set(-spacing, length * 0.98, 0);
    this.rightLeg.position.set(spacing, length * 0.98, 0);
    this.leftLeg.add(enemyPart(ENEMY_GEO.shin, material, [0, -length * 0.5, 0], [0, 0, 0], [1, length / 0.64, 1]), enemyPart(ENEMY_GEO.paw, material, [0, -length, 0.12], [0, 0, 0], [0.74, 0.54, 1.58]));
    this.rightLeg.add(enemyPart(ENEMY_GEO.shin, material, [0, -length * 0.5, 0], [0, 0, 0], [1, length / 0.64, 1]), enemyPart(ENEMY_GEO.paw, material, [0, -length, 0.12], [0, 0, 0], [0.74, 0.54, 1.58]));
  }

  private animateVisual(motion: number, attackProgress: number, moving: boolean) {
    const gait = moving && this.attackTimer <= 0 ? motion : 0;
    const beast = this.kind === 'stalker';
    const caster = this.kind === 'binder' || this.kind === 'choir';
    const elite = this.kind === 'elite';
    const stride = beast ? 0.72 : elite ? 0.34 : caster ? 0.23 : 0.48;
    this.visualRoot.position.set(0, Math.abs(gait) * (beast ? 0.07 : elite ? 0.09 : 0.055), 0);
    this.visualRoot.rotation.set(0, 0, gait * (beast ? 0.045 : elite ? 0.014 : 0.025));
    this.leftLeg.rotation.set(gait * stride, 0, this.kind === 'mourner' ? -0.05 : 0);
    this.rightLeg.rotation.set(-gait * (this.kind === 'mourner' ? stride * 0.62 : stride), 0, this.kind === 'mourner' ? 0.04 : 0);
    this.leftArm.rotation.x = -gait * (caster ? 0.1 : beast ? 0.54 : 0.32);
    this.rightArm.rotation.x = gait * (caster ? 0.1 : beast ? 0.54 : 0.32);
    this.leftArm.rotation.z = 0;
    this.rightArm.rotation.z = 0;
    this.torsoPivot.rotation.set(beast ? -0.02 - Math.abs(gait) * 0.035 : elite ? -0.025 : this.kind === 'mourner' ? 0.12 : 0, 0, caster ? gait * 0.016 : gait * 0.03);
    this.weaponPivot.rotation.x = caster && moving ? gait * 0.025 : 0;
    this.weaponPivot.rotation.y = 0;
    this.weaponPivot.rotation.z = this.kind === 'mourner' || elite ? -0.22 : this.kind === 'binder' ? -0.1 : 0;

    if (attackProgress >= 0) {
      const draw = THREE.MathUtils.smootherstep(attackProgress, 0, 1);
      if (this.kind === 'binder') {
        // The Binder shields the lantern, then presents it like a firearm.
        this.leftArm.rotation.x = -0.42 * draw;
        this.rightArm.rotation.x = -1.05 * draw;
        this.leftArm.rotation.z = -0.18 * draw;
        this.rightArm.rotation.z = 0.46 * draw;
        this.torsoPivot.rotation.x = -0.12 * draw;
        this.torsoPivot.rotation.y = 0.2 * draw;
        this.weaponPivot.rotation.x = -0.34 * draw;
        this.weaponPivot.rotation.z = -0.1 + 0.42 * draw;
      } else if (this.kind === 'choir') {
        // Choir casts with an open, cruciform silhouette so it never resembles
        // the compact, single-source Binder windup.
        this.leftArm.rotation.x = -1.08 * draw;
        this.rightArm.rotation.x = -1.08 * draw;
        this.leftArm.rotation.z = -0.92 * draw;
        this.rightArm.rotation.z = 0.92 * draw;
        this.torsoPivot.rotation.x = 0.18 * draw;
        this.visualRoot.position.y += 0.12 * draw;
        this.weaponPivot.rotation.z = -0.3 * draw;
      } else if (beast) {
        this.torsoPivot.rotation.x = -0.38 * draw;
        this.visualRoot.position.y -= 0.23 * draw;
        this.visualRoot.position.z -= 0.16 * draw;
        this.leftArm.rotation.x = -0.62 * draw;
        this.rightArm.rotation.x = -0.62 * draw;
        this.leftLeg.rotation.x = 0.38 * draw;
        this.rightLeg.rotation.x = 0.38 * draw;
      } else if (this.eliteSlam) {
        this.leftArm.rotation.x = -1.48 * draw;
        this.rightArm.rotation.x = -1.48 * draw;
        this.leftArm.rotation.z = -0.16 * draw;
        this.rightArm.rotation.z = 0.16 * draw;
        this.weaponPivot.rotation.x = -1.72 * draw;
        this.torsoPivot.rotation.x = -0.28 * draw;
        this.visualRoot.position.y += 0.08 * draw;
      } else {
        const heavyDraw = elite ? 1.2 : 1;
        this.rightArm.rotation.x = -1.2 * draw * heavyDraw;
        this.rightArm.rotation.z = -0.55 * draw;
        this.leftArm.rotation.x = -0.32 * draw;
        this.weaponPivot.rotation.x = -1.36 * draw * heavyDraw;
        this.weaponPivot.rotation.y = -0.48 * draw;
        this.torsoPivot.rotation.y = -0.42 * draw;
        this.torsoPivot.rotation.x += 0.12 * draw;
      }
    } else if (this.releasePose > 0) {
      const release = this.releasePose / 0.18;
      const settle = release * release;
      if (caster) {
        this.leftArm.rotation.x = -0.65 * settle;
        this.rightArm.rotation.x = -0.65 * settle;
        this.torsoPivot.rotation.x = 0.2 * settle;
        this.visualRoot.position.z = 0.13 * settle;
      } else if (beast) {
        this.torsoPivot.rotation.x = 0.22 * settle;
        this.leftArm.rotation.x = 0.65 * settle;
        this.rightArm.rotation.x = 0.65 * settle;
        this.visualRoot.position.z = 0.24 * settle;
      } else if (this.eliteSlam) {
        this.weaponPivot.rotation.x = 1.72 * settle;
        this.rightArm.rotation.x = 1.14 * settle;
        this.leftArm.rotation.x = 0.7 * settle;
        this.torsoPivot.rotation.x = 0.42 * settle;
        this.visualRoot.position.y = -0.12 * settle;
      } else {
        this.weaponPivot.rotation.x = 1.38 * settle;
        this.weaponPivot.rotation.y = 0.34 * settle;
        this.rightArm.rotation.x = 0.96 * settle;
        this.torsoPivot.rotation.x = 0.3 * settle;
        this.torsoPivot.rotation.y = 0.25 * settle;
      }
    }

    if (this.hurt > 0) {
      const recoil = THREE.MathUtils.clamp(this.hurt / (elite ? 0.72 : 0.5), 0, 1);
      const shudder = Math.sin(recoil * Math.PI * 3) * 0.055;
      this.visualRoot.position.z = -0.24 * recoil;
      this.visualRoot.position.y -= 0.08 * recoil;
      this.torsoPivot.rotation.x = -0.36 * recoil;
      this.torsoPivot.rotation.z = shudder;
      this.leftArm.rotation.x += 0.34 * recoil;
      this.rightArm.rotation.x += 0.48 * recoil;
    }
  }

  private resolveAttack(player: PlayerController, shoot: (from: THREE.Vector3, target: THREE.Vector3, damage: number, color: number, speed?: number) => void) {
    this.releasePose = 0.18;
    if (this.kind === 'binder' || this.kind === 'choir') {
      const origin = this.position.clone().add(new THREE.Vector3(0, 1.3, 0));
      const count = this.kind === 'choir' ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const angle = (i - (count - 1) / 2) * 0.16;
        const aimed = this.attackDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        shoot(origin.clone(), origin.clone().addScaledVector(aimed, 12), this.spec.damage, this.spec.accent, this.kind === 'choir' ? 5.2 : 7.5);
      }
      return;
    }
    if (this.kind === 'stalker') this.moveBy(this.movementScratch.copy(this.attackDirection).multiplyScalar(1.25));
    const relative = tmp2.copy(player.position).sub(this.position).setY(0);
    const distance = relative.length();
    const contactPadding = player.snapshot.form === 'stonewrought' ? 0.8 : 0.5;
    if (this.eliteSlam) {
      if (distance <= 4.25 + contactPadding) {
        player.receiveDamage(18, relative.normalize(), 0.34);
      }
    } else {
      const along = relative.dot(this.attackDirection);
      const across = Math.abs(relative.x * this.attackDirection.z - relative.z * this.attackDirection.x);
      const width = this.kind === 'elite' ? 1.55 : this.kind === 'stalker' ? 1.0 : 1.25;
      if (along >= -0.25 && along <= this.spec.range + contactPadding && across <= width + contactPadding * 0.35) {
        player.receiveDamage(this.spec.damage, this.attackDirection, this.kind === 'elite' ? 0.42 : 0.2);
      }
    }
    if (this.kind === 'elite') {
      // Give a clean punish window after the Castellan's committed strike.
      this.cooldown += this.eliteSlam ? 0.85 : 0.48;
    }
  }
}

export class EnemySystem {
  readonly group = new THREE.Group();
  readonly targets: CombatTarget[] = [];
  readonly actors: EnemyActor[] = [];
  private readonly shots: Shot[] = [];
  private readonly particles: Array<{ mesh: THREE.Mesh; life: number; velocity: THREE.Vector3 }> = [];
  private counter = 0;
  private combatGrace = 4.5;
  private projectileHitGrace = 0;

  constructor(
    private readonly player: PlayerController,
    private readonly resolveMovement?: (from: Readonly<THREE.Vector3>, desired: Readonly<THREE.Vector3>, radius: number, id: string) => THREE.Vector3,
  ) {
    this.group.name = 'Enemy encounters';
    // Leave the arrival clearing quiet: the first patrol only wakes once the player
    // deliberately leaves the form-inspection space instead of opening on a blind hit.
    this.spawnPack(new THREE.Vector3(-8, 0, 12), ['mourner', 'binder']);
    this.spawnPack(new THREE.Vector3(5, 0, 4), ['stalker', 'choir']);
    this.spawnPack(new THREE.Vector3(-7, 0, -15), ['mourner', 'stalker', 'choir']);
    // Keep the elite in the open western bay; the eastern aqueduct is a landmark,
    // not a camera-side occluder for its precise lane and radial telegraphs.
    this.spawnPack(new THREE.Vector3(8, 0, -10), ['elite', 'binder']);
  }

  update(dt: number, time: number) {
    this.combatGrace = Math.max(0, this.combatGrace - dt);
    if (this.combatGrace > 0) {
      for (const enemy of this.actors) enemy.updateAuthoredVisual(dt);
      return;
    }
    this.projectileHitGrace = Math.max(0, this.projectileHitGrace - dt);
    for (const enemy of this.actors) enemy.update(dt, this.player, time, this.shoot);
    // Cheap pairwise separation keeps packs readable and stops several hurtboxes
    // collapsing into a single visually unavoidable threat.
    for (let a = 0; a < this.actors.length; a++) {
      const first = this.actors[a];
      if (!first?.alive) continue;
      for (let b = a + 1; b < this.actors.length; b++) {
        const second = this.actors[b];
        if (!second?.alive) continue;
        tmp.copy(second.position).sub(first.position).setY(0);
        const minimum = (first.radius + second.radius) * 0.92;
        const distanceSq = tmp.lengthSq();
        if (distanceSq <= 0.0001 || distanceSq >= minimum * minimum) continue;
        const correction = (minimum - Math.sqrt(distanceSq)) * 0.5;
        tmp.normalize().multiplyScalar(correction);
        first.moveBy(tmp2.copy(tmp).multiplyScalar(-1));
        second.moveBy(tmp);
      }
      // Enemies yield the final fraction of overlap to the player. The player
      // also treats them as dynamic blockers, so neither side can tunnel or
      // settle inside the other during lunges and knockback.
      tmp.copy(first.position).sub(this.player.position).setY(0);
      const playerMinimum = first.radius + 0.48;
      const playerDistanceSq = tmp.lengthSq();
      if (playerDistanceSq < playerMinimum * playerMinimum) {
        if (playerDistanceSq < 0.0001) tmp.set(1, 0, 0);
        else tmp.multiplyScalar(1 / Math.sqrt(playerDistanceSq));
        first.moveBy(tmp.multiplyScalar(playerMinimum - Math.sqrt(Math.max(playerDistanceSq, 0.0001))));
      }
    }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      shot.age += dt;
      shot.mesh.position.addScaledVector(shot.velocity, dt);
      shot.mesh.rotation.y += dt * 8;
      if (shot.mesh.position.distanceToSquared(this.player.position) < (shot.radius + 0.55) ** 2) {
        if (this.projectileHitGrace <= 0 && this.player.receiveDamage(shot.damage, shot.velocity.clone().normalize(), 0.16)) {
          this.projectileHitGrace = 0.16;
        }
        this.burst(shot.mesh.position, (shot.mesh.material as THREE.MeshBasicMaterial).color.getHex());
        shot.age = 99;
      }
      if (shot.age > 4) {
        this.group.remove(shot.mesh);
        shot.mesh.geometry.dispose();
        (shot.mesh.material as THREE.Material).dispose();
        this.shots.splice(i, 1);
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= dt * 5;
      p.mesh.scale.setScalar(Math.max(0, p.life * 1.5));
      if (p.life <= 0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  getMournerActorIds(): readonly string[] {
    return this.actors.filter((actor) => actor.kind === 'mourner').map((actor) => actor.id);
  }

  getActorIds(): readonly string[] {
    return this.actors.map((actor) => actor.id);
  }

  /** QA-only composition: a bounded set of real Mourners with normal AI and no pack clutter. */
  stageMournerInspection(center: THREE.Vector3, graceSeconds = 0.8, activeCount = 4): void {
    const mourners = this.actors.filter((actor) => actor.kind === 'mourner');
    const activeMourners = mourners.slice(0, Math.max(1, Math.min(activeCount, mourners.length)));
    activeMourners.forEach((actor, index) => {
      const angle = index / Math.max(1, activeMourners.length) * Math.PI * 2 + 0.35;
      actor.position.set(
        center.x + Math.cos(angle) * 3.6,
        0,
        center.z + Math.sin(angle) * 3.6,
      );
    });
    let exile = 0;
    for (const actor of this.actors) {
      if (activeMourners.includes(actor)) continue;
      actor.position.set(42 + exile * 2.2, 0, 42);
      exile += 1;
    }
    this.combatGrace = graceSeconds;
  }

  attachMournerVisual(id: string, instance: CharacterAssetHandle, animationOffset: number): boolean {
    return this.actors.find((actor) => actor.id === id)?.attachAuthoredVisual(instance, animationOffset) ?? false;
  }

  attachActorVisual(id: string, instance: CharacterAssetHandle, animationOffset: number): boolean {
    return this.actors.find((actor) => actor.id === id)?.attachAuthoredVisual(instance, animationOffset) ?? false;
  }

  disposeAuthoredVisuals(): void {
    for (const actor of this.actors) actor.disposeAuthoredVisual();
  }

  private spawnPack(center: THREE.Vector3, kinds: EnemyKind[]) {
    kinds.forEach((kind, i) => {
      const angle = (i / kinds.length) * Math.PI * 2 + 0.4;
      const position = center.clone().add(new THREE.Vector3(Math.cos(angle) * (1.5 + i * 0.25), 0, Math.sin(angle) * (1.5 + i * 0.25)));
      const actor = new EnemyActor(`enemy-${++this.counter}`, kind, position, this.onDeath, this.burst, this.resolveMovement);
      this.actors.push(actor);
      this.targets.push(actor);
      this.group.add(actor.object);
    });
  }

  private onDeath = (enemy: EnemyActor) => {
    this.burst(enemy.position.clone().add(new THREE.Vector3(0, 0.8, 0)), enemy.spec.accent);
    this.player.heal(enemy.kind === 'elite' ? 45 : 7);
  };

  private shoot = (from: THREE.Vector3, target: THREE.Vector3, damage: number, color: number, speed = 7) => {
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 }));
    mesh.position.copy(from);
    this.group.add(mesh);
    this.shots.push({ mesh, velocity: target.sub(from).normalize().multiplyScalar(speed), damage, age: 0, radius: 0.25 });
  };

  private burst = (point: THREE.Vector3, color: number) => {
    for (let i = 0; i < 7; i++) {
      const mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.08 + Math.random() * 0.1), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
      mesh.position.copy(point);
      this.group.add(mesh);
      this.particles.push({ mesh, life: 0.4 + Math.random() * 0.35, velocity: new THREE.Vector3((Math.random() - 0.5) * 4, 1 + Math.random() * 3, (Math.random() - 0.5) * 4) });
    }
  };
}
