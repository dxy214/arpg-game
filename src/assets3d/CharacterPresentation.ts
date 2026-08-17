import * as THREE from 'three';
import type {
  CharacterAnimationPlayOptions,
  CharacterAnimationState,
} from './CharacterAssetRuntime';

/** Public, lightweight shape implemented by dynamically loaded GLTF instances. */
export interface CharacterAssetHandle {
  readonly object: THREE.Group;
  readonly animationState: CharacterAnimationState | undefined;
  readonly isDisposed: boolean;
  setTime(seconds: number): void;
  hasAnimation(state: CharacterAnimationState): boolean;
  isAnimationRunning(state?: CharacterAnimationState): boolean;
  play(state: CharacterAnimationState, options?: CharacterAnimationPlayOptions): boolean;
  setLocomotion(normalizedSpeed: number, fadeSeconds?: number): void;
  update(deltaSeconds: number): void;
  dispose(): void;
}

/**
 * Atomic authored/procedural presentation seam kept out of the heavy GLTF
 * loader chunk. The fallback remains visible until a full handle is attached.
 */
export class CharacterVisualSlot {
  private instance?: CharacterAssetHandle;
  private visible = true;
  private disposed = false;

  constructor(
    private readonly parent: THREE.Object3D,
    private readonly proceduralFallback: THREE.Object3D,
  ) {}

  get authored(): CharacterAssetHandle | undefined {
    return this.instance;
  }

  get presentationRoot(): THREE.Object3D {
    return this.instance?.object ?? this.proceduralFallback;
  }

  get animationState(): CharacterAnimationState | undefined {
    return this.instance?.animationState;
  }

  hasAnimation(state: CharacterAnimationState): boolean {
    return this.instance?.hasAnimation(state) ?? false;
  }

  attach(instance: CharacterAssetHandle): boolean {
    if (this.disposed || instance.isDisposed) return false;
    this.clear();
    this.instance = instance;
    this.parent.add(instance.object);
    instance.object.visible = this.visible;
    this.proceduralFallback.visible = false;
    return true;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.proceduralFallback.visible = visible && !this.instance;
    if (this.instance) this.instance.object.visible = visible;
  }

  play(state: CharacterAnimationState, options?: CharacterAnimationPlayOptions): boolean {
    return this.instance?.play(state, options) ?? false;
  }

  isAnimationRunning(state?: CharacterAnimationState): boolean {
    return this.instance?.isAnimationRunning(state) ?? false;
  }

  setLocomotion(normalizedSpeed: number, fadeSeconds?: number): void {
    this.instance?.setLocomotion(normalizedSpeed, fadeSeconds);
  }

  update(deltaSeconds: number): void {
    if (this.visible) this.instance?.update(deltaSeconds);
  }

  clear(): void {
    if (this.instance) {
      this.instance.dispose();
      this.instance = undefined;
    }
    if (!this.disposed) this.proceduralFallback.visible = this.visible;
  }

  dispose(): void {
    if (this.disposed) return;
    this.clear();
    this.disposed = true;
  }
}
