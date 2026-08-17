import * as THREE from 'three';
import { CharacterVisualSlot, type CharacterAssetHandle } from '../assets3d/CharacterPresentation';
import type { CombatTarget, HitPayload, PlayerController } from '../gameplay';

const phaseTint = new THREE.Color();
const vestmentTint = new THREE.Color();
const bossToPlayer = new THREE.Vector3();
const bossMove = new THREE.Vector3();
const bossDesired = new THREE.Vector3();
const hazardLocal = new THREE.Vector3();

function shadowed(mesh: THREE.Mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function bellGeometry(scale = 1) {
  return new THREE.LatheGeometry([
    new THREE.Vector2(0.16 * scale, 0.62 * scale),
    new THREE.Vector2(0.34 * scale, 0.52 * scale),
    new THREE.Vector2(0.42 * scale, 0.16 * scale),
    new THREE.Vector2(0.48 * scale, -0.22 * scale),
    new THREE.Vector2(0.64 * scale, -0.48 * scale),
    new THREE.Vector2(0.71 * scale, -0.55 * scale),
    new THREE.Vector2(0.68 * scale, -0.66 * scale),
  ], 20);
}

function makeGroundRiftGeometry(length: number, width: number, seed: number) {
  const geometry = new THREE.PlaneGeometry(width * 2, length, 2, 9);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, length * 0.5);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const z = positions.getZ(i);
    const t = THREE.MathUtils.clamp(z / length, 0, 1);
    const side = Math.sign(positions.getX(i));
    const sway = Math.sin(t * 13.7 + seed * 0.83) * width * 0.42
      + Math.sin(t * 5.1 + seed) * width * 0.2;
    const taper = 0.28 + Math.sin(t * Math.PI) * 0.72;
    const ridge = side === 0 ? 0 : side * width * taper * (0.72 + Math.sin(t * 20.7 + seed) * 0.16);
    positions.setX(i, sway + ridge);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function prepareTelegraph(mesh: THREE.Mesh) {
  mesh.frustumCulled = false;
  mesh.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return;
    part.frustumCulled = false;
    part.renderOrder = 36;
    const materials = Array.isArray(part.material) ? part.material : [part.material];
    for (const material of materials) {
      material.depthTest = false;
      material.depthWrite = false;
      material.toneMapped = false;
      material.needsUpdate = true;
    }
  });
}

function addVestmentBreakup(mesh: THREE.Mesh, shadow: number, midtone: number, edge: number) {
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  const position = geometry.getAttribute('position');
  const bounds = geometry.boundingBox;
  if (!bounds) return;
  const colors = new Float32Array(position.count * 3);
  const dark = new THREE.Color(shadow);
  const mid = new THREE.Color(midtone);
  const rim = new THREE.Color(edge);
  const sample = new THREE.Color();
  const height = Math.max(0.01, bounds.max.y - bounds.min.y);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const vertical = (y - bounds.min.y) / height;
    const fold = 0.5 + Math.sin(Math.atan2(z, x) * 5 + vertical * 2.4) * 0.5;
    sample.copy(dark).lerp(mid, 0.2 + vertical * 0.46 + fold * 0.2);
    if (fold > 0.78) sample.lerp(rim, (fold - 0.78) * 1.45);
    colors[i * 3] = sample.r;
    colors[i * 3 + 1] = sample.g;
    colors[i * 3 + 2] = sample.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = mesh.material as THREE.MeshStandardMaterial;
  material.vertexColors = true;
  material.color.setHex(0xffffff);
  material.needsUpdate = true;
}

export type BossPhase = 0 | 1 | 2 | 3 | 4;

interface Hazard {
  mesh: THREE.Mesh;
  kind: 'ring' | 'line' | 'arc' | 'sigil';
  age: number;
  delay: number;
  duration: number;
  damage: number;
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  hit: boolean;
}

type BossMovementResolver = (
  from: Readonly<THREE.Vector3>,
  desired: Readonly<THREE.Vector3>,
  radius: number,
  id: string,
) => THREE.Vector3;

export class BellSaintBoss implements CombatTarget {
  readonly id = 'boss-ossivar';
  readonly object = new THREE.Group();
  readonly radius = 1.25;
  readonly maxHealth = 1800;
  readonly position: THREE.Vector3;
  alive = true;
  health = this.maxHealth;
  phase: BossPhase = 0;
  active = false;
  defeated = false;
  private readonly body: THREE.Mesh;
  private readonly bell: THREE.Mesh;
  private readonly halo: THREE.Mesh;
  private readonly innerHalo: THREE.Mesh;
  private readonly arenaVeil: THREE.Mesh;
  private readonly arenaPulse: THREE.Mesh;
  private readonly phaseBurst: THREE.Mesh;
  private readonly rig = new THREE.Group();
  private readonly hazardRoot = new THREE.Group();
  private readonly proceduralBody = new THREE.Group();
  private authoredVisual?: CharacterVisualSlot;
  private readonly leftArm = new THREE.Group();
  private readonly rightArm = new THREE.Group();
  private readonly crozier = new THREE.Group();
  private readonly censer = new THREE.Group();
  private readonly crown = new THREE.Group();
  private readonly vestments: THREE.Mesh[] = [];
  private readonly phaseMotes: THREE.InstancedMesh;
  private readonly instanceTransform = new THREE.Object3D();
  private readonly metalMaterial: THREE.MeshStandardMaterial;
  private readonly vestmentMaterial: THREE.MeshStandardMaterial;
  private readonly sacredMaterial: THREE.MeshStandardMaterial;
  private readonly voidMaterial: THREE.MeshStandardMaterial;
  private readonly energyMaterial: THREE.MeshBasicMaterial;
  private readonly phaseLight: THREE.PointLight;
  private readonly hazards: Hazard[] = [];
  private readonly arenaCenter = new THREE.Vector3(0, 0, -43);
  private attackCooldown = 2.2;
  private attackIndex = 0;
  private phaseLock = 0;
  private time = 0;
  private flash = 0;
  private intro = 0;
  private hazardHitGrace = 0;
  private movementLock = 0;
  private facingYaw = 0;
  private strafeDirection = 1;
  private strafeTimer = 1.8;
  private onState?: (phase: BossPhase, health: number) => void;

  constructor(
    private readonly player: PlayerController,
    onState?: (phase: BossPhase, health: number) => void,
    private readonly resolveMovement?: BossMovementResolver,
  ) {
    this.onState = onState;
    this.object.name = 'The Bell-Saint, Ossivar';
    this.object.position.set(0, 0, -43);
    this.position = this.object.position;

    this.vestmentMaterial = new THREE.MeshStandardMaterial({ color: 0x171824, roughness: 0.78, metalness: 0.08, emissive: 0x241938, emissiveIntensity: 0.22 });
    this.metalMaterial = new THREE.MeshStandardMaterial({ color: 0x58515d, roughness: 0.3, metalness: 0.82, emissive: 0x725b8f, emissiveIntensity: 0.12 });
    this.sacredMaterial = new THREE.MeshStandardMaterial({ color: 0xa88954, roughness: 0.26, metalness: 0.9, emissive: 0xc18b45, emissiveIntensity: 0.22 });
    this.voidMaterial = new THREE.MeshStandardMaterial({ color: 0x07070b, roughness: 0.28, metalness: 0.15, emissive: 0x35183e, emissiveIntensity: 0.32 });
    this.energyMaterial = new THREE.MeshBasicMaterial({ color: 0xc18fff, transparent: true, opacity: 0.78, depthWrite: false, blending: THREE.AdditiveBlending });
    this.hazardRoot.name = 'Boss grounded skill effects';
    this.object.add(this.rig, this.hazardRoot);
    this.rig.add(this.proceduralBody);

    // Three overlapping, uneven vestment shells give the Saint a broad ceremonial
    // silhouette without reading as a single primitive. The gaps glow like an
    // inhabited reliquary when he changes resonance.
    const lower = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.62, 2.2, 10, 1, true), this.vestmentMaterial));
    lower.position.y = 1.42;
    lower.rotation.y = Math.PI / 10;
    this.vestments.push(lower);
    this.proceduralBody.add(lower);
    const middle = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.76, 1.38, 1.62, 9, 1, true), this.vestmentMaterial.clone()));
    middle.position.set(0.05, 2.16, -0.02);
    middle.rotation.y = -Math.PI / 9;
    this.vestments.push(middle);
    this.proceduralBody.add(middle);
    const splitSkirt = shadowed(new THREE.Mesh(new THREE.ConeGeometry(1.48, 1.65, 8, 1, true, 0.22, Math.PI * 1.78), this.vestmentMaterial.clone()));
    splitSkirt.position.set(0, 1.05, 0.02);
    splitSkirt.rotation.y = -0.44;
    this.vestments.push(splitSkirt);
    this.proceduralBody.add(splitSkirt);
    const vestmentValues = [0x11141f, 0x292433, 0x181c2b];
    this.vestments.forEach((vestment, i) => {
      const material = vestment.material as THREE.MeshStandardMaterial;
      material.color.setHex(vestmentValues[i]);
      material.roughness = 0.86 - i * 0.09;
      material.metalness = 0.035 + i * 0.055;
      material.flatShading = i !== 1;
      material.needsUpdate = true;
    });
    addVestmentBreakup(lower, 0x090c14, 0x242538, 0x55415b);
    addVestmentBreakup(middle, 0x14101d, 0x393044, 0x6b4f65);
    addVestmentBreakup(splitSkirt, 0x0d121d, 0x252d3e, 0x4b5a6a);
    for (let i = 0; i < 5; i++) {
      const angle = (i - 2) * 0.34;
      const panel = shadowed(new THREE.Mesh(new THREE.BoxGeometry(i === 2 ? 0.5 : 0.42, 1.75 - Math.abs(i - 2) * 0.12, 0.12), i === 2 ? this.sacredMaterial : this.metalMaterial));
      panel.position.set(Math.sin(angle) * 1.05, 1.68 - Math.abs(i - 2) * 0.08, 0.78 - Math.abs(angle) * 0.3);
      panel.rotation.z = -angle * 0.22;
      panel.rotation.y = angle;
      this.proceduralBody.add(panel);
    }
    const waistBell = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.09, 7, 18), this.sacredMaterial));
    waistBell.position.set(0, 2.63, 0.13);
    waistBell.rotation.x = Math.PI / 2;
    waistBell.scale.z = 0.72;
    this.proceduralBody.add(waistBell);

    this.body = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 1.14, 6, 10), this.metalMaterial));
    this.body.position.y = 3.12;
    this.body.scale.set(1.05, 1, 0.72);
    this.proceduralBody.add(this.body);

    const sternum = shadowed(new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), this.sacredMaterial));
    sternum.position.set(0, 3.22, 0.55);
    sternum.scale.set(0.76, 1.15, 0.25);
    this.proceduralBody.add(sternum);
    for (const side of [-1, 1]) {
      const pauldron = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 0), this.metalMaterial));
      pauldron.position.set(side * 0.93, 3.62, 0);
      pauldron.scale.set(1.25, 0.72, 0.82);
      pauldron.rotation.z = side * -0.28;
      this.proceduralBody.add(pauldron);
      const shoulderSpike = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.72, 5), this.sacredMaterial));
      shoulderSpike.position.set(side * 1.35, 3.72, -0.03);
      shoulderSpike.rotation.z = side * -1.12;
      this.proceduralBody.add(shoulderSpike);
    }

    // A faceless suspended mask, framed by a broken reliquary crown.
    const hoodMaterial = this.vestmentMaterial.clone();
    hoodMaterial.vertexColors = false;
    hoodMaterial.color.setHex(0x18131f);
    const hood = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.66, 1.22, 7, 1, true), hoodMaterial));
    hood.position.set(0, 4.46, 0);
    hood.rotation.z = Math.PI;
    this.proceduralBody.add(hood);
    const mask = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), this.voidMaterial));
    mask.position.set(0, 4.42, 0.34);
    mask.scale.set(0.66, 1.08, 0.32);
    this.proceduralBody.add(mask);
    const maskSlit = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.48), this.energyMaterial);
    maskSlit.position.set(0, 4.45, 0.49);
    this.proceduralBody.add(maskSlit);

    this.crown.position.set(0, 4.76, -0.02);
    const crownTines = new THREE.InstancedMesh(new THREE.ConeGeometry(0.075, 1, 5), this.sacredMaterial, 7);
    for (let i = 0; i < 7; i++) {
      const angle = THREE.MathUtils.lerp(-1.08, 1.08, i / 6);
      this.instanceTransform.position.set(Math.sin(angle) * 0.73, Math.cos(angle) * 0.38, -0.05);
      this.instanceTransform.rotation.set(0, 0, -angle);
      this.instanceTransform.scale.set(1, 0.72 + Math.cos(angle) * 0.3, 1);
      this.instanceTransform.updateMatrix();
      crownTines.setMatrixAt(i, this.instanceTransform.matrix);
    }
    crownTines.castShadow = true;
    crownTines.receiveShadow = true;
    crownTines.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.crown.add(crownTines);
    this.proceduralBody.add(this.crown);

    // Articulated arms: one bears a tolling crozier, the other a chained censer.
    this.leftArm.position.set(-0.9, 3.5, 0);
    this.rightArm.position.set(0.9, 3.5, 0);
    this.proceduralBody.add(this.leftArm, this.rightArm);
    const leftUpper = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.82, 4, 7), this.metalMaterial));
    leftUpper.position.y = -0.55;
    leftUpper.rotation.z = 0.16;
    this.leftArm.add(leftUpper);
    const leftHand = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), this.sacredMaterial));
    leftHand.position.set(0.16, -1.12, 0.03);
    this.leftArm.add(leftHand);
    const rightUpper = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.92, 4, 7), this.metalMaterial));
    rightUpper.position.y = -0.58;
    rightUpper.rotation.z = -0.2;
    this.rightArm.add(rightUpper);
    const rightHand = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), this.sacredMaterial));
    rightHand.position.set(-0.2, -1.18, 0.02);
    this.rightArm.add(rightHand);

    this.crozier.position.set(-0.48, -1.15, 0.08);
    const shaft = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 3.5, 8), this.sacredMaterial));
    shaft.position.y = -0.48;
    this.crozier.add(shaft);
    const crook = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.09, 7, 22, Math.PI * 1.55), this.sacredMaterial));
    crook.position.set(0.38, 1.23, 0);
    crook.rotation.z = 0.18;
    this.crozier.add(crook);
    const hammerBell = shadowed(new THREE.Mesh(bellGeometry(0.48), this.sacredMaterial));
    hammerBell.position.set(0.02, -2.18, 0);
    this.crozier.add(hammerBell);
    this.leftArm.add(this.crozier);

    this.censer.position.set(0.42, -1.28, 0.08);
    for (let i = 0; i < 4; i++) {
      const link = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 5, 8), this.sacredMaterial));
      link.position.y = -i * 0.19;
      link.rotation.x = i % 2 ? Math.PI / 2 : 0;
      this.censer.add(link);
    }
    this.bell = shadowed(new THREE.Mesh(bellGeometry(0.72), this.sacredMaterial));
    this.bell.position.y = -1.08;
    this.censer.add(this.bell);
    const clapper = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), this.voidMaterial));
    clapper.position.y = -1.6;
    this.censer.add(clapper);
    this.rightArm.add(this.censer);

    this.halo = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.075, 8, 64), this.energyMaterial.clone());
    this.halo.position.set(0, 4.28, -0.48);
    this.rig.add(this.halo);
    this.innerHalo = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.035, 6, 40), this.energyMaterial.clone());
    this.innerHalo.position.copy(this.halo.position);
    this.innerHalo.rotation.z = 0.38;
    this.rig.add(this.innerHalo);
    this.phaseMotes = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), this.energyMaterial.clone(), 9);
    this.phaseMotes.frustumCulled = false;
    this.rig.add(this.phaseMotes);
    this.phaseLight = new THREE.PointLight(0xc18fff, 1.8, 7.5, 2);
    this.phaseLight.position.set(0, 3.35, 1.2);
    this.rig.add(this.phaseLight);

    this.phaseBurst = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 10),
      new THREE.MeshBasicMaterial({ color: 0xc18fff, transparent: true, opacity: 0, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending, toneMapped: false }),
    );
    this.phaseBurst.position.y = 3.1;
    this.phaseBurst.visible = false;
    this.rig.add(this.phaseBurst);

    this.arenaVeil = new THREE.Mesh(new THREE.CylinderGeometry(13.2, 13.2, 4.5, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x8e68b5, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    this.arenaVeil.position.y = 2.2;
    this.object.add(this.arenaVeil);
    this.arenaPulse = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 1, 72),
      new THREE.MeshBasicMaterial({ color: 0xc18fff, transparent: true, opacity: 0, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }),
    );
    this.arenaPulse.rotation.x = -Math.PI / 2;
    this.arenaPulse.position.y = 0.17;
    this.arenaPulse.visible = false;
    this.object.add(this.arenaPulse);
    this.object.visible = false;
  }

  /** Keeps arena VFX on `rig`; only the procedural body is swapped. */
  attachAuthoredVisual(instance: CharacterAssetHandle): boolean {
    this.authoredVisual?.dispose();
    const slot = new CharacterVisualSlot(this.rig, this.proceduralBody);
    if (!slot.attach(instance)) return false;
    this.authoredVisual = slot;
    return true;
  }

  disposeAuthoredVisual(): void {
    this.authoredVisual?.dispose();
    this.authoredVisual = undefined;
  }

  /** QA-only phase stepping; the integration exposes it only with capture=1. */
  advanceCapturePhase(): void {
    if (!this.active || !this.alive) return;
    if (this.phase === 1) {
      this.health = this.maxHealth * 0.65;
      this.beginPhase(2);
    } else if (this.phase === 2) {
      this.health = this.maxHealth * 0.32;
      this.beginPhase(3);
    }
  }

  receiveHit = (hit: HitPayload) => {
    if (!this.active || !this.alive || this.phaseLock > 0) return;
    // Each resonance exposes a different fracture. The halo color communicates
    // the intended answer: crimson/rend, cyan/spectral, then amber/crush.
    const multiplier = this.phase === 1
      ? hit.kind === 'rend' ? 1.28 : hit.kind === 'physical' ? 1 : 0.9
      : this.phase === 2
        ? hit.kind === 'spectral' ? 1.36 : hit.kind === 'crush' ? 0.95 : 0.86
        : hit.kind === 'crush' ? 1.42 : 0.84;
    // Evidence capture still exercises the real phase thresholds, attacks, damage
    // types, and victory state; it only shortens a long browser-automation run.
    const captureMultiplier = new URLSearchParams(window.location.search).get('capture') === '1' ? 4 : 1;
    this.health = Math.max(0, this.health - hit.amount * multiplier * captureMultiplier);
    this.flash = 0.1;
    const nextPhase: BossPhase = this.health <= 0 ? 4 : this.health <= this.maxHealth * 0.33 ? 3 : this.health <= this.maxHealth * 0.66 ? 2 : 1;
    if (nextPhase !== this.phase) this.beginPhase(nextPhase);
  };

  update(dt: number) {
    this.time += dt;
    if (!this.active && this.player.position.z < -33) this.activate();
    if (!this.active) return;

    this.intro = Math.max(0, this.intro - dt);
    this.phaseLock = Math.max(0, this.phaseLock - dt);
    this.hazardHitGrace = Math.max(0, this.hazardHitGrace - dt);
    this.movementLock = Math.max(0, this.movementLock - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.attackCooldown -= dt;
    const moving = this.updateMovement(dt);
    if (this.authoredVisual) {
      const animationState = this.authoredVisual.animationState;
      if (!this.authoredVisual.isAnimationRunning() || animationState === 'idle' || animationState === 'move') {
        this.authoredVisual.setLocomotion(moving ? 1 : 0, 0.14);
      }
      this.authoredVisual.update(dt);
    }
    let anticipation = 0;
    let impact = 0;
    for (const hazard of this.hazards) {
      if (hazard.age < 0) continue;
      if (hazard.age < hazard.delay) anticipation = Math.max(anticipation, THREE.MathUtils.smoothstep(hazard.age, 0, hazard.delay));
      else if (hazard.age < hazard.delay + 0.2) impact = Math.max(impact, 1 - (hazard.age - hazard.delay) / 0.2);
    }
    const transitionDuration = this.intro > 0 ? 2.2 : 1.25;
    const transitionProgress = this.phaseLock > 0 ? 1 - THREE.MathUtils.clamp(this.phaseLock / transitionDuration, 0, 1) : 1;
    const transition = this.phaseLock > 0 ? Math.sin(transitionProgress * Math.PI) : 0;
    const float = Math.sin(this.time * 1.55) * 0.11;
    this.rig.position.y = float + transition * 0.38;
    this.rig.rotation.y = this.facingYaw + Math.sin(this.time * 0.34) * 0.055 + impact * 0.08;
    this.rig.rotation.z = Math.sin(this.time * 0.72) * 0.012;
    if (this.alive) this.rig.scale.set(1 + anticipation * 0.08 + transition * 0.055, 1 - anticipation * 0.065 + transition * 0.075, 1 + anticipation * 0.08 + transition * 0.055);
    this.body.scale.set(1.05 + (this.phase === 2 ? 0.06 : this.phase >= 3 ? 0.16 : 0), 1 + transition * 0.13 - impact * 0.05, 0.72 + (this.phase >= 3 ? 0.08 : 0));
    this.leftArm.rotation.z = -0.3 - (this.phase === 2 ? 0.12 : this.phase >= 3 ? 0.28 : 0) + Math.sin(this.time * 1.15) * 0.06 - anticipation * 0.68 + impact * 0.5;
    this.leftArm.rotation.x = -0.08 + Math.sin(this.time * 0.83) * 0.04 + anticipation * 0.2;
    this.rightArm.rotation.z = 0.34 + (this.phase === 2 ? 0.13 : this.phase >= 3 ? 0.31 : 0) - Math.sin(this.time * 1.06) * 0.07 + anticipation * 0.78 - impact * 0.66;
    this.rightArm.rotation.x = 0.06 - anticipation * 0.28;
    this.crozier.rotation.z = (this.phase >= 3 ? -0.17 : 0) + Math.sin(this.time * 0.92) * 0.045 - anticipation * 0.24;
    this.censer.rotation.z = Math.sin(this.time * 2.3) * (0.1 + this.phase * 0.018) + impact * 0.48;
    this.censer.rotation.x = Math.sin(this.time * 1.7) * 0.07;
    this.crown.rotation.z = Math.sin(this.time * 0.6) * 0.045;
    this.crown.scale.setScalar(1 + (this.phase === 2 ? 0.1 : this.phase >= 3 ? 0.25 : 0) + transition * 0.3 + (this.phase >= 3 ? Math.sin(this.time * 5) * 0.025 : 0));
    this.halo.rotation.z += dt * (0.24 + this.phase * 0.2);
    this.halo.rotation.x = this.phase === 1 ? 0 : this.phase === 2 ? Math.sin(this.time * 0.8) * 0.14 : 0.3 + Math.sin(this.time * 1.1) * 0.08;
    this.halo.scale.setScalar(1 + (this.phase === 2 ? 0.1 : this.phase >= 3 ? 0.24 : 0) + transition * 0.34 + anticipation * 0.08);
    this.innerHalo.rotation.z -= dt * (this.phase === 1 ? 0.22 : this.phase === 2 ? 0.82 : 1.18);
    this.innerHalo.rotation.x = this.phase === 1 ? 0 : this.phase === 2 ? -0.2 : -0.46;
    this.innerHalo.scale.setScalar(1 + (this.phase === 2 ? 0.22 : this.phase >= 3 ? 0.38 : 0) + transition * 0.22 - anticipation * 0.08);
    this.bell.rotation.y = Math.sin(this.time * 2.4) * 0.17;
    const phaseColor = this.phase === 1 ? 0xde426e : this.phase === 2 ? 0x62d9e8 : this.phase >= 3 ? 0xf1b75d : 0xc18fff;
    phaseTint.setHex(phaseColor);
    (this.halo.material as THREE.MeshBasicMaterial).color.lerp(phaseTint, 1 - Math.exp(-dt * 4));
    this.energyMaterial.color.lerp(phaseTint, 1 - Math.exp(-dt * 4));
    this.energyMaterial.opacity = 0.7 + anticipation * 0.24;
    this.phaseLight.color.lerp(phaseTint, 1 - Math.exp(-dt * 5));
    this.phaseLight.intensity = this.alive ? 0.5 + this.phase * 0.16 + transition * 1.1 + impact * 0.8 : 0;
    (this.innerHalo.material as THREE.MeshBasicMaterial).color.lerp(phaseTint, 1 - Math.exp(-dt * 4.5));
    const burstMaterial = this.phaseBurst.material as THREE.MeshBasicMaterial;
    const pulseMaterial = this.arenaPulse.material as THREE.MeshBasicMaterial;
    burstMaterial.color.lerp(phaseTint, 1 - Math.exp(-dt * 8));
    pulseMaterial.color.lerp(phaseTint, 1 - Math.exp(-dt * 8));
    this.phaseBurst.visible = this.phaseLock > 0 && transition > 0.015;
    this.arenaPulse.visible = this.phaseLock > 0 && transition > 0.015;
    this.phaseBurst.scale.setScalar(0.65 + transitionProgress * (this.phase >= 3 ? 5.8 : 4.7));
    this.arenaPulse.scale.setScalar(0.8 + transitionProgress * 11.2);
    burstMaterial.opacity = transition * (this.phase >= 3 ? 0.3 : 0.2);
    pulseMaterial.opacity = transition * (this.phase >= 3 ? 0.92 : 0.72);
    this.sacredMaterial.emissive.lerp(phaseTint, 1 - Math.exp(-dt * 3.5));
    this.sacredMaterial.emissiveIntensity = 0.2 + this.phase * 0.07 + anticipation * 0.34 + impact * 0.6;
    this.metalMaterial.emissive.lerp(phaseTint, 1 - Math.exp(-dt * 2.5));
    this.metalMaterial.emissiveIntensity = this.flash > 0 ? 1.7 : 0.1 + transition * 0.55;
    this.voidMaterial.emissive.lerp(phaseTint, 1 - Math.exp(-dt * 4));
    this.voidMaterial.emissiveIntensity = 0.28 + this.phase * 0.08 + anticipation * 0.5;
    this.vestments.forEach((vestment, i) => {
      const material = vestment.material as THREE.MeshStandardMaterial;
      const restRotation = i === 0 ? Math.PI / 10 : i === 1 ? -Math.PI / 9 : -0.44;
      vestment.rotation.y = restRotation + Math.sin(this.time * (0.45 + i * 0.1) + i) * 0.045 + (this.phase === 2 ? (i - 1) * 0.065 : this.phase >= 3 ? (i - 1) * 0.12 : 0);
      const flare = 1 + (this.phase === 2 ? i * 0.025 : this.phase >= 3 ? 0.08 + i * 0.035 : 0) + transition * 0.08;
      vestment.scale.set(flare, 1 - anticipation * (0.025 + i * 0.018), flare);
      material.emissive.lerp(phaseTint, 1 - Math.exp(-dt * (1.8 + i * 0.3)));
      material.emissiveIntensity = 0.12 + this.phase * 0.055 + transition * (0.3 + i * 0.12) + (this.flash > 0 ? 0.75 : 0);
      const tint = this.phase === 1
        ? [0xf1dce1, 0xd7c0d0, 0xdce1ed][i]
        : this.phase === 2
          ? [0xc7e3eb, 0xd8f0ef, 0xb8d5e2][i]
          : [0xf0d7ad, 0xffe8bf, 0xd8bd91][i];
      vestmentTint.setHex(tint);
      material.color.lerp(vestmentTint, 1 - Math.exp(-dt * 2));
    });
    for (let i = 0; i < this.phaseMotes.count; i++) {
      const tier = i % 3;
      const orbitDirection = this.phase === 2 && tier === 1 ? -1 : 1;
      const orbit = this.time * (0.46 + tier * 0.15) * orbitDirection + i * 2.39;
      const radius = 1.32 + tier * 0.29 + (this.phase === 2 ? 0.34 : this.phase >= 3 ? 0.58 : 0) + transition * 1.35;
      this.instanceTransform.position.set(Math.cos(orbit) * radius, 3.2 + Math.sin(orbit * 1.7) * (0.65 + tier * 0.22), Math.sin(orbit) * radius * 0.62);
      this.instanceTransform.rotation.set(this.time * (1.2 + i * 0.05), -this.time * 0.9, 0);
      const moteScale = (i % 3 === 0 ? 0.13 : 0.08) * ((this.phase === 1 ? 0.55 : this.phase === 2 ? 0.88 : 1.08) + transition * 1.3 + impact * 0.7);
      this.instanceTransform.scale.setScalar(moteScale);
      this.instanceTransform.updateMatrix();
      this.phaseMotes.setMatrixAt(i, this.instanceTransform.matrix);
    }
    this.phaseMotes.instanceMatrix.needsUpdate = true;
    const moteMat = this.phaseMotes.material as THREE.MeshBasicMaterial;
    moteMat.color.lerp(phaseTint, 1 - Math.exp(-dt * 4));
    moteMat.opacity = this.phase === 1 ? 0.34 : this.phase === 2 ? 0.62 : 0.88;
    (this.arenaVeil.material as THREE.MeshBasicMaterial).color.lerp(phaseTint, 1 - Math.exp(-dt * 1.8));
    (this.arenaVeil.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp((this.arenaVeil.material as THREE.MeshBasicMaterial).opacity, this.alive ? 0.07 + transition * 0.16 : 0, dt * 3);
    // Arena-wide presentation stays fixed while the boss body moves.
    this.arenaVeil.position.set(this.arenaCenter.x - this.position.x, this.arenaVeil.position.y, this.arenaCenter.z - this.position.z);
    this.arenaPulse.position.set(this.arenaCenter.x - this.position.x, this.arenaPulse.position.y, this.arenaCenter.z - this.position.z);

    if (this.alive && this.phaseLock <= 0 && this.intro <= 0 && this.attackCooldown <= 0) {
      this.performPattern();
    }
    this.updateHazards(dt);
    if (!this.alive) {
      if (!this.authoredVisual) {
        this.rig.rotation.y += dt * 1.7;
        this.rig.scale.multiplyScalar(Math.max(0.97, 1 - dt * 0.4));
      }
    }
  }

  private updateMovement(dt: number): boolean {
    if (!this.alive || this.intro > 0 || this.phaseLock > 0 || this.movementLock > 0) return false;
    bossToPlayer.copy(this.player.position).sub(this.position).setY(0);
    const distance = bossToPlayer.length();
    if (distance < 0.001) return false;
    bossToPlayer.multiplyScalar(1 / distance);

    const targetYaw = Math.atan2(bossToPlayer.x, bossToPlayer.z);
    const yawDelta = Math.atan2(Math.sin(targetYaw - this.facingYaw), Math.cos(targetYaw - this.facingYaw));
    this.facingYaw += yawDelta * (1 - Math.exp(-dt * (5.2 + this.phase)));

    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeDirection *= -1;
      this.strafeTimer = 1.35 + (Math.sin(this.time * 1.73) * 0.5 + 0.5) * 1.25;
    }

    const desiredRange = this.phase === 1 ? 2.15 : this.phase === 2 ? 4.8 : 1.95;
    const speed = this.phase === 1 ? 1.7 : this.phase === 2 ? 2.25 : 2.8;
    const tangentX = bossToPlayer.z * this.strafeDirection;
    const tangentZ = -bossToPlayer.x * this.strafeDirection;
    bossMove.set(0, 0, 0);
    if (distance > desiredRange + 0.7) bossMove.addScaledVector(bossToPlayer, 1);
    else if (distance < desiredRange - 0.8) bossMove.addScaledVector(bossToPlayer, -0.72);
    const strafeWeight = this.phase === 1 ? 0.28 : this.phase === 2 ? 0.92 : 0.48;
    bossMove.x += tangentX * strafeWeight;
    bossMove.z += tangentZ * strafeWeight;
    if (this.phase >= 3 && distance > 4.6) bossMove.addScaledVector(bossToPlayer, 0.45);
    if (bossMove.lengthSq() < 0.001) return false;
    bossMove.normalize().multiplyScalar(speed * dt);
    bossDesired.copy(this.position).add(bossMove);

    // Hold the encounter inside the authored arena even if a player hugs the gate.
    hazardLocal.copy(bossDesired).sub(this.arenaCenter).setY(0);
    if (hazardLocal.lengthSq() > 9.4 * 9.4) {
      hazardLocal.setLength(9.4);
      bossDesired.copy(this.arenaCenter).add(hazardLocal);
    }
    const corrected = this.resolveMovement?.(this.position, bossDesired, this.radius, this.id) ?? bossDesired;
    const moved = corrected.distanceToSquared(this.position) > 0.000001;
    this.position.copy(corrected);
    return moved;
  }

  private activate() {
    this.active = true;
    this.phase = 1;
    this.intro = 2.2;
    this.phaseLock = 2.2;
    this.object.visible = true;
    this.authoredVisual?.play('phaseTransition', {
      fadeSeconds: 0.04, loop: THREE.LoopOnce, clampWhenFinished: false,
    });
    this.onState?.(this.phase, this.health);
    this.spawnRing(0.9, 10, 1.6, 0, 0);
  }

  private beginPhase(next: BossPhase) {
    this.phase = next;
    if (next === 4) {
      this.alive = false;
      this.defeated = true;
      this.authoredVisual?.play('death', {
        fadeSeconds: 0.08, loop: THREE.LoopOnce, clampWhenFinished: true,
      });
      this.hazards.forEach((hazard) => {
        this.removeHazardVisuals(hazard);
      });
      this.hazards.length = 0;
      this.spawnRing(1, 12, 0.7, 0, 0);
      this.onState?.(this.phase, this.health);
      return;
    }
    this.authoredVisual?.play('phaseTransition', {
      fadeSeconds: 0.04, loop: THREE.LoopOnce, clampWhenFinished: false,
    });
    this.phaseLock = 1.25;
    this.movementLock = 1.05;
    this.attackCooldown = 0.6;
    this.spawnRing(1, 11.5, 1.4, 0.55, 18 + next * 3);
    // Transitions fracture the floor instead of launching energy projectiles.
    if (next === 2) {
      this.spawnRadialRifts(4, 0.86, 15, 9.5);
      this.spawnSigilVolley(2, 1.02, 16);
    }
    if (next === 3) {
      this.spawnRadialRifts(6, 0.72, 18, 11.5);
      this.spawnSigilVolley(3, 0.92, 19);
      this.spawnRing(7, 12, 1.4, 1.25, 22);
    }
    this.onState?.(this.phase, this.health);
  }

  private performPattern() {
    this.authoredVisual?.play('attackPrimary', {
      fadeSeconds: 0.06, loop: THREE.LoopOnce, clampWhenFinished: false,
    });
    this.movementLock = this.phase >= 3 ? 0.48 : 0.62;
    const pattern = this.attackIndex++ % (this.phase === 1 ? 3 : this.phase === 2 ? 4 : 5);
    if (pattern === 0) {
      this.spawnCleaveArc(this.phase === 1 ? 5.6 : 6.8, this.phase === 1 ? 1.75 : 2.05, 0.72, 18 + this.phase * 4);
      this.attackCooldown = 2.15;
    } else if (pattern === 1) {
      this.spawnAimedLines(this.phase === 1 ? 1 : this.phase === 2 ? 3 : 5, 0.82, 18 + this.phase * 3);
      this.attackCooldown = 2.25;
    } else if (pattern === 2) {
      if (this.phase === 1) this.spawnRing(1.2, 8.8, 1.05, 0, 20);
      else this.spawnSigilVolley(this.phase === 2 ? 3 : 5, 0.82, 16 + this.phase * 3);
      this.attackCooldown = 2.45;
    } else if (pattern === 3) {
      this.spawnRing(4, 10.5, 1, 0.6, 24);
      this.spawnRadialRifts(6, 0.92, 20, 10.5);
      this.attackCooldown = 2.8;
    } else {
      this.spawnCleaveArc(8.2, 2.5, 0.68, 27);
      this.spawnAimedLines(5, 0.86, 24);
      this.spawnSigilVolley(3, 1.12, 22);
      this.attackCooldown = 3.1;
    }
  }

  private spawnRing(inner: number, outer: number, delay: number, extraDelay: number, damage: number) {
    const color = this.phase === 1 ? 0xe25378 : this.phase === 2 ? 0x65d5df : 0xf0ad59;
    const mesh = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.055, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    // Crisp inner/outer boundaries carry the dodge read; the broad fill remains
    // restrained so characters and floor detail are never painted over.
    const edgeWidth = 0.095;
    const innerEdge = new THREE.Mesh(new THREE.RingGeometry(Math.max(0.01, inner - edgeWidth), inner + edgeWidth, 96), new THREE.MeshBasicMaterial({ color: 0xffe5dc, transparent: true, opacity: 0.25, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    const outerEdge = new THREE.Mesh(new THREE.RingGeometry(Math.max(inner + 0.02, outer - edgeWidth), outer + edgeWidth, 96), new THREE.MeshBasicMaterial({ color: 0xffe5dc, transparent: true, opacity: 0.25, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    innerEdge.position.z = outerEdge.position.z = 0.014;
    mesh.add(innerEdge, outerEdge);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.43;
    prepareTelegraph(mesh);
    this.hazardRoot.add(mesh);
    this.hazards.push({ mesh, kind: 'ring', age: 0, delay: delay + extraDelay, duration: 0.32, damage, origin: this.position.clone(), direction: new THREE.Vector3(), hit: false });
  }

  private spawnAimedLines(count: number, delay: number, damage: number) {
    const base = Math.atan2(this.player.position.x - this.position.x, this.player.position.z - this.position.z);
    const length = this.phase === 1 ? 11.5 : this.phase === 2 ? 13 : 14;
    for (let i = 0; i < count; i++) {
      const angle = base + (i - (count - 1) / 2) * 0.24;
      this.spawnRift(angle, length, this.phase >= 3 ? 0.92 : 0.78, delay + Math.abs(i - count / 2) * 0.04, damage, i + this.attackIndex * 7);
    }
  }

  private spawnRadialRifts(count: number, delay: number, damage: number, length: number) {
    const offset = this.time * 0.37;
    for (let i = 0; i < count; i++) {
      const angle = offset + (i / count) * Math.PI * 2;
      this.spawnRift(angle, length, this.phase >= 3 ? 0.82 : 0.68, delay + (i % 2) * 0.055, damage, i * 13 + this.attackIndex);
    }
  }

  private spawnRift(angle: number, length: number, width: number, delay: number, damage: number, seed: number) {
    const color = this.phase === 2 ? 0x66dce8 : this.phase >= 3 ? 0xf2aa55 : 0xdf537c;
    const mesh = new THREE.Mesh(
      makeGroundRiftGeometry(length, width, seed),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.055, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    const ruptureSeal = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.62, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    ruptureSeal.rotation.x = -Math.PI / 2;
    ruptureSeal.position.y = 0.025;
    ruptureSeal.userData.riftSeal = true;
    const ruptureSpine = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 1.35, 4),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    ruptureSpine.position.set(0, 0.68, 1.15);
    ruptureSpine.rotation.y = Math.PI / 4;
    ruptureSpine.userData.riftSpine = true;
    mesh.add(ruptureSeal, ruptureSpine);
    mesh.rotation.y = angle;
    mesh.position.y = 0.42;
    mesh.userData.length = length;
    mesh.userData.width = width;
    prepareTelegraph(mesh);
    this.hazardRoot.add(mesh);
    this.hazards.push({
      mesh,
      kind: 'line',
      age: 0,
      delay,
      duration: 0.36,
      damage,
      origin: this.position.clone(),
      direction: new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)),
      hit: false,
    });
  }

  private spawnCleaveArc(radius: number, span: number, delay: number, damage: number) {
    bossToPlayer.copy(this.player.position).sub(this.position).setY(0).normalize();
    // RingGeometry is authored in XY and rotated onto XZ, which flips its local
    // Y into world -Z. Negating Z keeps the visible sector and damage cone aligned.
    const forwardAngle = Math.atan2(-bossToPlayer.z, bossToPlayer.x);
    const start = forwardAngle - span * 0.5;
    const color = this.phase === 2 ? 0x69dfe8 : this.phase >= 3 ? 0xf2a94f : 0xe5537d;
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(1.15, radius, 72, 1, start, span),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    const edge = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.16, radius + 0.08, 72, 1, start, span),
      new THREE.MeshBasicMaterial({ color: 0xffead6, transparent: true, opacity: 0.28, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    edge.position.z = 0.014;
    mesh.add(edge);
    const inner = 1.15;
    const boundaryLength = radius - inner;
    for (const theta of [start, start + span]) {
      const boundary = new THREE.Mesh(
        new THREE.BoxGeometry(boundaryLength, 0.075, 0.025),
        new THREE.MeshBasicMaterial({ color: 0xffead6, transparent: true, opacity: 0.24, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      const midpoint = inner + boundaryLength * 0.5;
      boundary.position.set(Math.cos(theta) * midpoint, Math.sin(theta) * midpoint, 0.018);
      boundary.rotation.z = theta;
      mesh.add(boundary);
    }
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.43;
    mesh.userData.arcHalf = span * 0.5;
    prepareTelegraph(mesh);
    this.hazardRoot.add(mesh);
    this.hazards.push({ mesh, kind: 'arc', age: 0, delay, duration: 0.34, damage, origin: this.position.clone(), direction: bossToPlayer.clone(), hit: false });
  }

  private spawnSigilVolley(count: number, delay: number, damage: number) {
    const center = this.player.position.clone();
    for (let i = 0; i < count; i++) {
      const angle = i / Math.max(1, count) * Math.PI * 2 + this.time * 0.61;
      const radius = i === 0 ? 0 : 2.1 + (i % 2) * 0.75;
      const point = center.clone().add(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
      this.spawnSigil(point, this.phase >= 3 ? 1.65 : 1.42, delay + i * 0.11, damage);
    }
  }

  private spawnSigil(point: THREE.Vector3, radius: number, delay: number, damage: number) {
    const color = this.phase === 2 ? 0x65dce8 : this.phase >= 3 ? 0xf4a84f : 0xdf567d;
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.045, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.43;
    mesh.userData.radius = radius;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.78, radius, 48),
      new THREE.MeshBasicMaterial({ color: 0xffebd7, transparent: true, opacity: 0.24, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    ring.position.z = 0.012;
    mesh.add(ring);
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2;
      const shard = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.22, 0),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      shard.position.set(Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72, 0.03);
      shard.rotation.z = angle;
      shard.userData.sigilShard = true;
      mesh.add(shard);
    }
    prepareTelegraph(mesh);
    this.hazardRoot.add(mesh);
    this.hazards.push({ mesh, kind: 'sigil', age: 0, delay, duration: 0.5, damage, origin: point.clone(), direction: new THREE.Vector3(), hit: false });
  }

  private updateHazards(dt: number) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hazard = this.hazards[i];
      hazard.age += dt;
      const mat = hazard.mesh.material as THREE.MeshBasicMaterial;
      if (hazard.age < 0) continue;
      // The boss can move after casting, so every telegraph stays locked to its
      // original world-space cast point rather than sliding under his feet.
      hazardLocal.copy(hazard.origin).sub(this.position);
      hazard.mesh.position.x = hazardLocal.x;
      hazard.mesh.position.z = hazardLocal.z;

      const charge = THREE.MathUtils.clamp(hazard.age / Math.max(0.001, hazard.delay), 0, 1);
      const fired = hazard.age >= hazard.delay;
      const aftermath = fired ? THREE.MathUtils.clamp((hazard.age - hazard.delay) / hazard.duration, 0, 1) : 0;
      const fillPeak = hazard.kind === 'arc' ? 0.24 : hazard.kind === 'ring' ? 0.2 : hazard.kind === 'sigil' ? 0.34 : 0.4;
      const tellBase = hazard.kind === 'arc' ? 0.035 : hazard.kind === 'ring' ? 0.04 : hazard.kind === 'line' ? 0.045 : 0.07;
      const tellGain = hazard.kind === 'arc' ? 0.14 : hazard.kind === 'ring' ? 0.13 : hazard.kind === 'sigil' ? 0.24 : 0.22;
      mat.opacity = fired ? fillPeak * (1 - aftermath) : tellBase + charge * tellGain;
      hazard.mesh.children.forEach((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const childMaterial = child.material as THREE.MeshBasicMaterial;
        const childTellBase = hazard.kind === 'sigil' ? 0.22 : hazard.kind === 'arc' ? 0.24 : 0.28;
        const childTellGain = hazard.kind === 'sigil' ? 0.5 : 0.56;
        childMaterial.opacity = fired
          ? 0.92 * Math.pow(1 - aftermath, 0.55)
          : childTellBase + charge * childTellGain + Math.sin(this.time * 13) * 0.025 * charge;
        if (child.userData.sigilShard) {
          // The parent is laid flat, so local Z is world height. Shards rise at
          // detonation and collapse back into the rune during the aftermath.
          child.position.z = 0.03 + (fired ? Math.sin(aftermath * Math.PI) * 1.15 : charge * 0.12);
          child.rotation.x += dt * (2.2 + charge * 2.8);
          child.rotation.z += dt * 1.7;
          child.scale.setScalar(0.75 + charge * 0.35 + (fired ? Math.sin(aftermath * Math.PI) * 0.85 : 0));
        } else if (child.userData.riftSpine) {
          const rise = fired ? Math.sin(aftermath * Math.PI) : charge * 0.18;
          child.scale.set(0.75 + rise * 0.65, 0.12 + rise * 1.2, 0.75 + rise * 0.65);
          childMaterial.opacity = fired ? (1 - aftermath) * 0.74 : 0.08 + charge * 0.18;
        } else if (child.userData.riftSeal) {
          child.scale.setScalar(0.7 + charge * 0.28 + (fired ? aftermath * 0.62 : 0));
          childMaterial.opacity = fired ? (1 - aftermath) * 0.72 : 0.14 + charge * 0.34;
        } else {
          child.scale.setScalar(1 + (fired ? 0.018 + aftermath * 0.055 : 0));
        }
      });

      if (fired && !hazard.hit) {
        hazard.hit = true;
        const local = bossDesired.copy(this.player.position).sub(hazard.origin).setY(0);
        const distance = local.length();
        const damageDirection = distance > 0.001 ? local.clone().multiplyScalar(1 / distance) : hazard.direction.clone();
        if (hazard.kind === 'ring') {
          const params = (hazard.mesh.geometry as THREE.RingGeometry).parameters;
          if (distance >= params.innerRadius - 0.55 && distance <= params.outerRadius + 0.55) {
            this.applyHazardDamage(hazard.damage, damageDirection, 0.24, 'ring');
          }
        } else if (hazard.kind === 'line') {
          const along = local.dot(hazard.direction);
          const across = Math.abs(local.x * hazard.direction.z - local.z * hazard.direction.x);
          const length = hazard.mesh.userData.length as number;
          const width = hazard.mesh.userData.width as number;
          if (along > -0.35 && along < length + 0.45 && across < width * 0.72 + 0.5) {
            this.applyHazardDamage(hazard.damage, hazard.direction, 0.25, 'line');
          }
        } else if (hazard.kind === 'arc') {
          const params = (hazard.mesh.geometry as THREE.RingGeometry).parameters;
          const facing = distance > 0.001 ? local.dot(hazard.direction) / distance : 1;
          if (distance >= params.innerRadius - 0.55 && distance <= params.outerRadius + 0.55
            && facing >= Math.cos(hazard.mesh.userData.arcHalf as number)) {
            this.applyHazardDamage(hazard.damage, damageDirection, 0.34, 'arc');
          }
        } else {
          const radius = hazard.mesh.userData.radius as number;
          if (distance <= radius + 0.55) this.applyHazardDamage(hazard.damage, damageDirection, 0.3, 'sigil');
        }
      }
      if (hazard.age > hazard.delay + hazard.duration) {
        this.removeHazardVisuals(hazard);
        this.hazards.splice(i, 1);
      }
    }
  }

  private removeHazardVisuals(hazard: Hazard) {
    this.hazardRoot.remove(hazard.mesh);
    this.disposeHazard(hazard.mesh);
  }

  private disposeHazard(mesh: THREE.Mesh) {
    mesh.traverse((part) => {
      if (!(part instanceof THREE.Mesh)) return;
      if (!part.userData.sharedGeometry) part.geometry.dispose();
      const materials = Array.isArray(part.material) ? part.material : [part.material];
      materials.forEach((material) => material.dispose());
    });
  }

  private applyHazardDamage(amount: number, direction: THREE.Vector3, stagger: number, kind: Hazard['kind']) {
    if (this.hazardHitGrace > 0) return;
    const form = this.player.snapshot.form;
    // Form-specific defensive answers complement the offensive phase fractures:
    // Wraith slips through the line choir; Stonewrought can brace the final toll.
    const formMitigation = this.phase === 2 && (kind === 'line' || kind === 'sigil') && form === 'wraith'
      ? 0.56
      : this.phase >= 3 && (kind === 'ring' || kind === 'arc') && form === 'stonewrought'
        ? 0.62
        : 1;
    if (this.player.receiveDamage(amount * formMitigation, direction, stagger)) this.hazardHitGrace = 0.3;
  }
}
