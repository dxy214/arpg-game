import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

export type CharacterAssetId = string;

export type CharacterAnimationState =
  | 'idle'
  | 'move'
  | 'attackPrimary'
  | 'attackSecondary'
  | 'ability'
  | 'dash'
  | 'transform'
  | 'hit'
  | 'death'
  | 'phaseTransition';

export type CharacterAnimationAliases = Partial<
  Record<CharacterAnimationState, string | readonly string[]>
>;

export interface CharacterAssetManifest {
  readonly id: CharacterAssetId;
  /** A Vite-imported URL or `new URL('./asset.glb', import.meta.url).href`. */
  readonly url: string;
  /** Required authored node name inside the GLTF scene. */
  readonly authoredRootName: string;
  readonly animationAliases?: CharacterAnimationAliases;
  readonly defaultAnimation?: CharacterAnimationState;
  readonly scale?: number;
  readonly rotationY?: number;
  readonly castShadow?: boolean;
  readonly receiveShadow?: boolean;
  /** Restore the validated authored-root scale after animation evaluation. */
  readonly lockAuthoredRootScale?: boolean;
}

export interface CharacterInstanceOptions {
  readonly name?: string;
  readonly visible?: boolean;
  readonly scale?: number;
  readonly rotationY?: number;
  /** Per-instance aliases override, then extend, the manifest aliases. */
  readonly animationAliases?: CharacterAnimationAliases;
}

export interface CharacterAnimationPlayOptions {
  readonly fadeSeconds?: number;
  readonly reset?: boolean;
  readonly loop?: THREE.AnimationActionLoopStyles;
  readonly repetitions?: number;
  readonly clampWhenFinished?: boolean;
  readonly timeScale?: number;
}

export type CharacterAssetStatus =
  | { readonly state: 'unloaded' }
  | { readonly state: 'loading' }
  | { readonly state: 'ready' }
  | { readonly state: 'failed'; readonly error: Error };

export type CharacterAssetLoadResult =
  | { readonly ok: true; readonly instance: CharacterAssetInstance }
  | { readonly ok: false; readonly error: Error };

interface LoadedCharacterAsset {
  readonly gltf: GLTF;
  readonly manifest: CharacterAssetManifest;
}

interface CacheEntry {
  readonly manifest: CharacterAssetManifest;
  status: CharacterAssetStatus;
  promise?: Promise<LoadedCharacterAsset>;
  loaded?: LoadedCharacterAsset;
  references: number;
  disposeWhenUnused: boolean;
}

const DEFAULT_FADE_SECONDS = 0.12;
const ANIMATION_STATES: readonly CharacterAnimationState[] = [
  'idle', 'move', 'attackPrimary', 'attackSecondary', 'ability', 'dash',
  'transform', 'hit', 'death', 'phaseTransition',
];

/**
 * One SkeletonUtils-cloned rig and its private mixer. Geometry, materials and
 * textures remain shared with the library source and are intentionally not
 * disposed here. The owning library releases those resources after every clone
 * has been returned.
 */
export class CharacterAssetInstance {
  readonly object: THREE.Group;
  readonly authoredRoot: THREE.Object3D;
  readonly mixer: THREE.AnimationMixer;
  readonly clips: readonly THREE.AnimationClip[];

  private readonly actions = new Map<string, THREE.AnimationAction>();
  private readonly stateActions = new Map<CharacterAnimationState, THREE.AnimationAction>();
  private currentAction?: THREE.AnimationAction;
  private currentState?: CharacterAnimationState;
  private readonly lockedAuthoredRootScale?: THREE.Vector3;
  private disposed = false;

  constructor(
    object: THREE.Group,
    authoredRoot: THREE.Object3D,
    clips: readonly THREE.AnimationClip[],
    aliases: CharacterAnimationAliases,
    private readonly releaseReference: () => void,
    lockAuthoredRootScale = false,
  ) {
    this.object = object;
    this.authoredRoot = authoredRoot;
    this.clips = clips;
    this.mixer = new THREE.AnimationMixer(authoredRoot);
    if (lockAuthoredRootScale) this.lockedAuthoredRootScale = authoredRoot.scale.clone();
    const actionsByNormalizedName = new Map<string, THREE.AnimationAction>();
    for (const clip of clips) {
      const action = this.mixer.clipAction(clip, authoredRoot);
      this.actions.set(clip.name, action);
      actionsByNormalizedName.set(clip.name.toLocaleLowerCase(), action);
    }
    for (const state of ANIMATION_STATES) {
      const candidates = aliases[state];
      const names = typeof candidates === 'string' ? [candidates] : candidates;
      if (names) {
        for (const name of names) {
          const action = this.actions.get(name) ?? actionsByNormalizedName.get(name.toLocaleLowerCase());
          if (action) {
            this.stateActions.set(state, action);
            break;
          }
        }
      } else {
        const action = this.actions.get(state) ?? actionsByNormalizedName.get(state.toLocaleLowerCase());
        if (action) this.stateActions.set(state, action);
      }
    }
  }

  get animationState(): CharacterAnimationState | undefined {
    return this.currentState;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  setTime(seconds: number): void {
    if (!this.disposed) {
      this.mixer.setTime(Math.max(0, seconds));
      this.restoreAuthoredRootScale();
    }
  }

  hasAnimation(state: CharacterAnimationState): boolean {
    return this.resolveAction(state) !== undefined;
  }

  isAnimationRunning(state?: CharacterAnimationState): boolean {
    const action = state ? this.resolveAction(state) : this.currentAction;
    return action?.isRunning() ?? false;
  }

  play(state: CharacterAnimationState, options: CharacterAnimationPlayOptions = {}): boolean {
    if (this.disposed) return false;
    const next = this.resolveAction(state);
    if (!next) return false;

    const fadeSeconds = Math.max(0, options.fadeSeconds ?? DEFAULT_FADE_SECONDS);
    if (this.currentAction !== next) {
      if (this.currentAction) this.currentAction.fadeOut(fadeSeconds);
      next.enabled = true;
      if (options.reset ?? true) next.reset();
      next.fadeIn(fadeSeconds).play();
      this.currentAction = next;
    } else if (options.reset ?? true) {
      // A new attack can legitimately reuse the same aliased clip while the
      // previous action is still recovering. Restart at authored frame zero.
      next.reset().play();
    } else if (!next.isRunning()) {
      next.play();
    }

    next.setLoop(options.loop ?? THREE.LoopRepeat, Math.max(1, options.repetitions ?? Infinity));
    next.clampWhenFinished = options.clampWhenFinished ?? false;
    next.timeScale = options.timeScale ?? 1;
    this.currentState = state;
    return true;
  }

  /** Uses existing idle/move actions; this method does not allocate per frame. */
  setLocomotion(normalizedSpeed: number, fadeSeconds = DEFAULT_FADE_SECONDS): void {
    const speed = THREE.MathUtils.clamp(normalizedSpeed, 0, 1);
    const state: CharacterAnimationState = speed > 0.08 ? 'move' : 'idle';
    if (this.currentState !== state) this.play(state, { fadeSeconds, timeScale: state === 'move' ? 0.72 + speed * 0.58 : 1 });
    if (state === 'move' && this.currentAction) this.currentAction.timeScale = 0.72 + speed * 0.58;
  }

  update(deltaSeconds: number): void {
    if (!this.disposed && deltaSeconds > 0) {
      this.mixer.update(Math.min(deltaSeconds, 0.1));
      this.restoreAuthoredRootScale();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.authoredRoot);
    this.actions.clear();
    this.stateActions.clear();
    this.object.removeFromParent();
    this.releaseReference();
  }

  private resolveAction(state: CharacterAnimationState): THREE.AnimationAction | undefined {
    return this.stateActions.get(state);
  }

  private restoreAuthoredRootScale(): void {
    if (this.lockedAuthoredRootScale) this.authoredRoot.scale.copy(this.lockedAuthoredRootScale);
  }
}

/**
 * Atomic authored/procedural presentation seam. The fallback remains visible
 * until a complete CharacterAssetInstance is attached, and is restored if that
 * instance is cleared or failed upstream.
 */
export class CharacterVisualSlot {
  private instance?: CharacterAssetInstance;
  private visible = true;
  private disposed = false;

  constructor(
    private readonly parent: THREE.Object3D,
    private readonly proceduralFallback: THREE.Object3D,
  ) {}

  get authored(): CharacterAssetInstance | undefined {
    return this.instance;
  }

  get presentationRoot(): THREE.Object3D {
    return this.instance?.object ?? this.proceduralFallback;
  }

  get animationState(): CharacterAnimationState | undefined {
    return this.instance?.animationState;
  }

  attach(instance: CharacterAssetInstance): boolean {
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

/** A bounded GLTF source cache with reference-safe SkeletonUtils instances. */
export class CharacterAssetLibrary {
  private readonly loader: GLTFLoader;
  private readonly entries = new Map<CharacterAssetId, CacheEntry>();
  private disposed = false;

  constructor(manifests: readonly CharacterAssetManifest[], loadingManager?: THREE.LoadingManager) {
    this.loader = new GLTFLoader(loadingManager);
    for (const manifest of manifests) {
      if (this.entries.has(manifest.id)) throw new Error(`Duplicate character asset id: ${manifest.id}`);
      this.entries.set(manifest.id, {
        manifest,
        status: { state: 'unloaded' },
        references: 0,
        disposeWhenUnused: false,
      });
    }
  }

  getStatus(id: CharacterAssetId): CharacterAssetStatus {
    return this.entries.get(id)?.status ?? {
      state: 'failed',
      error: new Error(`Unknown character asset: ${id}`),
    };
  }

  async preload(id: CharacterAssetId): Promise<boolean> {
    try {
      await this.load(id);
      return true;
    } catch {
      return false;
    }
  }

  async preloadAll(): Promise<ReadonlyMap<CharacterAssetId, boolean>> {
    const results = await Promise.all(
      [...this.entries.keys()].map(async (id) => [id, await this.preload(id)] as const),
    );
    return new Map(results);
  }

  async instantiate(
    id: CharacterAssetId,
    options: CharacterInstanceOptions = {},
  ): Promise<CharacterAssetLoadResult> {
    try {
      const loaded = await this.load(id);
      if (this.disposed) throw new Error('Character asset library was disposed during instantiation.');

      const clonedScene = cloneSkeleton(loaded.gltf.scene) as THREE.Group;
      const authoredRoot = clonedScene.getObjectByName(loaded.manifest.authoredRootName);
      if (!authoredRoot) {
        throw new Error(
          `Character asset ${id} is missing authored root "${loaded.manifest.authoredRootName}".`,
        );
      }

      const container = new THREE.Group();
      container.name = options.name ?? `${id}-authored-instance`;
      container.visible = options.visible ?? true;
      container.scale.setScalar(options.scale ?? loaded.manifest.scale ?? 1);
      container.rotation.y = options.rotationY ?? loaded.manifest.rotationY ?? 0;
      container.add(clonedScene);
      const castShadow = loaded.manifest.castShadow ?? true;
      const receiveShadow = loaded.manifest.receiveShadow ?? true;
      authoredRoot.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = castShadow;
          node.receiveShadow = receiveShadow;
        }
      });

      const entry = this.requireEntry(id);
      entry.references += 1;
      let released = false;
      const aliases = { ...loaded.manifest.animationAliases, ...options.animationAliases };
      const instance = new CharacterAssetInstance(
        container,
        authoredRoot,
        loaded.gltf.animations,
        aliases,
        () => {
          if (released) return;
          released = true;
          entry.references = Math.max(0, entry.references - 1);
          if (entry.disposeWhenUnused && entry.references === 0) this.releaseEntry(entry);
        },
        loaded.manifest.lockAuthoredRootScale,
      );
      if (loaded.manifest.defaultAnimation) instance.play(loaded.manifest.defaultAnimation, { fadeSeconds: 0 });
      return { ok: true, instance };
    } catch (cause) {
      return { ok: false, error: toError(cause) };
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.entries.values()) {
      entry.disposeWhenUnused = true;
      if (entry.references === 0 && entry.loaded) this.releaseEntry(entry);
    }
  }

  private async load(id: CharacterAssetId): Promise<LoadedCharacterAsset> {
    if (this.disposed) throw new Error('Character asset library is disposed.');
    const entry = this.requireEntry(id);
    if (entry.loaded) return entry.loaded;
    if (entry.promise) return entry.promise;

    entry.status = { state: 'loading' };
    entry.promise = this.loader.loadAsync(entry.manifest.url)
      .then((gltf) => {
        if (!gltf.scene.getObjectByName(entry.manifest.authoredRootName)) {
          disposeObjectResources(gltf.scene);
          throw new Error(
            `Character asset ${id} is missing authored root "${entry.manifest.authoredRootName}".`,
          );
        }
        const loaded = { gltf, manifest: entry.manifest };
        if (this.disposed) {
          disposeObjectResources(gltf.scene);
          throw new Error('Character asset library was disposed while loading.');
        }
        entry.loaded = loaded;
        entry.status = { state: 'ready' };
        return loaded;
      })
      .catch((cause: unknown) => {
        const error = toError(cause);
        entry.status = { state: 'failed', error };
        throw error;
      })
      .finally(() => {
        entry.promise = undefined;
      });
    return entry.promise;
  }

  private requireEntry(id: CharacterAssetId): CacheEntry {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`Unknown character asset: ${id}`);
    return entry;
  }

  private releaseEntry(entry: CacheEntry): void {
    if (!entry.loaded) return;
    disposeObjectResources(entry.loaded.gltf.scene);
    entry.loaded = undefined;
    entry.status = { state: 'unloaded' };
  }
}

function disposeObjectResources(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of nodeMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}
