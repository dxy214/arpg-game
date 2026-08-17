import type * as THREE from 'three';

export type PlayerForm = 'nightbound' | 'wraith' | 'dreadwolf' | 'stonewrought';
export type AbilitySlot = 'primary' | 'secondary' | 'dash' | 'ultimate';
export type DamageKind = 'physical' | 'spectral' | 'rend' | 'crush';

export interface HitPayload {
  sourceId: string;
  amount: number;
  kind: DamageKind;
  point: THREE.Vector3;
  direction: THREE.Vector3;
  impulse: number;
  stagger: number;
  tags: readonly string[];
}

/** Minimal contract implemented by enemies, elites and bosses. */
export interface CombatTarget {
  readonly id: string;
  readonly position: THREE.Vector3;
  readonly radius: number;
  readonly alive?: boolean;
  receiveHit?: (hit: HitPayload) => void;
}

export interface PlayerUpdateContext {
  camera: THREE.Camera;
  targets: Iterable<CombatTarget>;
  elapsed: number;
  groundY?: number;
  /** World collision hook. Return the corrected world-space destination. */
  resolveMovement?: (
    from: Readonly<THREE.Vector3>,
    desired: Readonly<THREE.Vector3>,
    radius: number,
  ) => THREE.Vector3;
}

export interface PlayerSnapshot {
  form: PlayerForm;
  health: number;
  maxHealth: number;
  resource: number;
  maxResource: number;
  invulnerable: boolean;
  position: THREE.Vector3;
  facing: number;
  comboStep: number;
  cooldowns: Readonly<Record<AbilitySlot, number>>;
}

export type GameplayEvent =
  | { type: 'form'; from: PlayerForm; to: PlayerForm; position: THREE.Vector3 }
  | { type: 'attack'; form: PlayerForm; slot: AbilitySlot; position: THREE.Vector3; direction: THREE.Vector3 }
  | { type: 'hit'; form: PlayerForm; targetId: string; hit: HitPayload }
  | { type: 'dash'; form: PlayerForm; position: THREE.Vector3; direction: THREE.Vector3 }
  | { type: 'hurt'; amount: number; health: number; position: THREE.Vector3 }
  | { type: 'heal'; amount: number; health: number; position: THREE.Vector3 }
  | { type: 'resource'; value: number; delta: number }
  | { type: 'cooldown'; slot: AbilitySlot; duration: number }
  | { type: 'cameraImpulse'; strength: number; duration: number }
  | { type: 'audio'; cue: string; position: THREE.Vector3; intensity?: number }
  | { type: 'vfx'; cue: string; position: THREE.Vector3; direction?: THREE.Vector3; scale?: number };

export type GameplayEventSink = (event: GameplayEvent) => void;

export interface PlayerControllerOptions {
  domElement: HTMLElement;
  emit?: GameplayEventSink;
  initialPosition?: THREE.Vector3;
}

