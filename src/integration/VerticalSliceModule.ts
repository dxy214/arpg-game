import * as THREE from 'three';
import type { EngineContext, FrameInfo, GameModule } from '../core/types';
import { PlayerController, type CombatTarget, type GameplayEvent } from '../gameplay';
import { HollowMarch } from '../world/HollowMarch';
import { EnemySystem } from '../enemies/EnemySystem';
import { BellSaintBoss } from '../boss/BellSaintBoss';
import { EffectDirector } from '../effects/EffectDirector';
import { ProceduralAudio } from '../audio/ProceduralAudio';
import { GameHud } from '../ui/GameHud';
import { V11_CHARACTER_ASSET_IDS } from '../assets3d/v11CharacterManifests';
import { V12_CHARACTER_ASSET_IDS } from '../assets3d/v12CharacterManifests';
import { V14_CHARACTER_ASSET_IDS } from '../assets3d/v14CharacterManifests';
import { V16_CHARACTER_ASSET_IDS, V16_CHARACTER_MANIFESTS } from '../assets3d/v16CharacterManifests';
import type { CharacterAssetHandle } from '../assets3d/CharacterPresentation';
import type { CharacterAssetId, CharacterAssetLibrary } from '../assets3d/CharacterAssetRuntime';
import { CollisionWorld, type DynamicCollider } from '../physics/CollisionWorld';
import '../ui/hud.css';

export class VerticalSliceModule implements GameModule {
  readonly id = 'vertical-slice';
  private world!: HollowMarch;
  private collisionWorld!: CollisionWorld;
  private player!: PlayerController;
  private enemies!: EnemySystem;
  private boss!: BellSaintBoss;
  private effects!: EffectDirector;
  private audio!: ProceduralAudio;
  private hud!: GameHud;
  private cameraTarget = new THREE.Vector3();
  private cameraPosition = new THREE.Vector3();
  private readonly bossRoomFocus = new THREE.Vector3(0, 0, -43);
  private moon?: THREE.DirectionalLight;
  private playerFill?: THREE.PointLight;
  private arenaFill?: THREE.PointLight;
  private qaGodMode = false;
  private qaInspectCamera = false;
  private qaCollision = false;
  private qaCapture = false;
  private characterAssets?: CharacterAssetLibrary;
  private assetStatusTarget?: HTMLElement;
  private disposed = false;
  private readonly dynamicColliders: DynamicCollider[] = [];

  init(context: EngineContext) {
    this.disposed = false;
    const query = new URLSearchParams(window.location.search);
    const qaScenario = query.get('scenario');
    const qaForm = query.get('form');
    // Keep the explicit contract readable to the deterministic QA source test.
    this.qaGodMode = new URLSearchParams(window.location.search).get('god') === '1';
    this.qaInspectCamera = query.get('inspect') === '1';
    this.qaCollision = qaScenario === 'collision';
    this.qaCapture = query.get('capture') === '1';
    context.scene.background = new THREE.Color(0x182832);
    // The old 0.022 fog compressed the path, trees and chapel into one black
    // band. A slightly brighter, longer falloff preserves distance separation.
    context.scene.fog = new THREE.FogExp2(0x243b45, 0.0145);
    context.renderer.shadowMap.enabled = context.quality !== 'low';
    context.renderer.toneMappingExposure = context.quality === 'low' ? 1.62 : 1.78;

    const camera = context.camera as THREE.PerspectiveCamera;
    camera.fov = 37;
    camera.near = 0.1;
    camera.far = 180;
    camera.updateProjectionMatrix();

    // Broad sky bounce lifts upper planes without turning ground-facing facets
    // grey; the authored world retains its own lower-intensity local bounce.
    const hemi = new THREE.HemisphereLight(0xd5e5e9, 0x405249, 1.25);
    context.scene.add(hemi);
    this.moon = new THREE.DirectionalLight(0xc5dcff, 4);
    this.moon.position.set(-17, 28, 14);
    this.moon.castShadow = true;
    const shadowMapSize = context.quality === 'high' || context.quality === 'ultra' ? 2048 : 1024;
    this.moon.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    this.moon.shadow.camera.left = -24;
    this.moon.shadow.camera.right = 24;
    this.moon.shadow.camera.top = 27;
    this.moon.shadow.camera.bottom = -27;
    this.moon.shadow.camera.near = 1;
    this.moon.shadow.camera.far = 75;
    this.moon.shadow.bias = -0.00035;
    this.moon.shadow.normalBias = 0.026;
    this.moon.shadow.radius = context.quality === 'medium' ? 1.25 : 2;
    context.scene.add(this.moon);
    const fill = new THREE.DirectionalLight(0xa5c4be, 1.08);
    fill.position.set(15, 9, 24);
    context.scene.add(fill);
    const rim = new THREE.DirectionalLight(0x77649d, 1.05);
    rim.position.set(19, 11, -32);
    context.scene.add(rim);

    // A restrained, shadowless moving fill keeps the selected form readable at
    // game scale. It is deliberately too weak to erase authored practical pools.
    this.playerFill = new THREE.PointLight(0xb0ddd5, 3.15, 14, 2);
    this.playerFill.position.set(0, 4.2, 0);
    context.scene.add(this.playerFill);
    // The arena receives a separate rose-bronze value island only while active,
    // distinguishing the boss from the cyan marsh without adding shadow cost.
    this.arenaFill = new THREE.PointLight(0xe8bbc1, 0, 22, 2);
    this.arenaFill.position.set(0, 6.5, -41);
    context.scene.add(this.arenaFill);

    this.world = new HollowMarch();
    this.world.addTo(context.scene);
    this.collisionWorld = new CollisionWorld(
      this.world.collisionCircles,
      this.world.collisionBoxes,
      { minX: -27, maxX: 27, minZ: -54, maxZ: 34 },
    );
    this.effects = new EffectDirector();
    context.scene.add(this.effects.group);
    this.audio = new ProceduralAudio(context.canvas);
    this.hud = new GameHud(context.uiRoot);

    const events = (event: GameplayEvent) => {
      this.effects.onGameplayEvent(event);
      this.audio.onGameplayEvent(event);
      if (event.type === 'form') {
        const labels = { nightbound: 'THE DUSKWARDEN RETURNS', wraith: 'WRAITH · PHASE THROUGH PERIL', dreadwolf: 'DREADWOLF · HUNT WITHOUT MERCY', stonewrought: 'STONEWROUGHT · ENDURE AND BREAK' } as const;
        this.hud.announce(labels[event.to]);
      }
    };
    const initialPosition = qaScenario === 'boss'
      ? new THREE.Vector3(0, 0, -36)
      : qaScenario === 'chapel'
        ? new THREE.Vector3(-7, 0, 7.5)
      : qaScenario === 'aqueduct'
        ? new THREE.Vector3(7.5, 0, -5)
      : qaScenario === 'gate'
        ? new THREE.Vector3(0, 0, -25)
      : qaScenario === 'forest'
        ? new THREE.Vector3(17.5, 0, 17)
      : qaScenario === 'graveyard'
        ? new THREE.Vector3(-10.5, 0, 18)
      : qaScenario === 'collision'
        ? new THREE.Vector3(2.35, 0, -27)
      : qaScenario === 'mourners' || qaScenario === 'husk'
        ? new THREE.Vector3(0, 0, 8)
      : qaScenario === 'elite'
        ? new THREE.Vector3(5, 0, -4)
        : new THREE.Vector3(0, 0, 26);
    this.player = new PlayerController({ domElement: context.canvas, emit: events, initialPosition });
    if (qaForm === 'wraith' || qaForm === 'dreadwolf' || qaForm === 'stonewrought') this.player.setForm(qaForm);
    // Explicit QA-only switch used to capture every long-form boss phase; normal play never enables it.
    if (this.qaGodMode) this.player.invulnerable = true;
    context.scene.add(this.player.object);
    this.enemies = new EnemySystem(this.player, (from, desired, radius, id) =>
      this.collisionWorld.resolve(from, desired, radius, [], id));
    if (qaScenario === 'mourners' || qaScenario === 'husk') {
      this.enemies.stageMournerInspection(
        this.player.position,
        query.get('freeze') === '1' ? 999 : 0.8,
        qaScenario === 'husk' ? 1 : 4,
      );
    }
    context.scene.add(this.enemies.group);
    this.boss = new BellSaintBoss(this.player, (phase) => {
      if (phase > 0 && phase < 4) {
        this.audio.bell(phase);
        this.hud.announce(phase === 1 ? 'OSSIVAR AWAKENS' : phase === 2 ? 'THE CHOIR BELOW ANSWERS' : 'LAST RESONANCE');
      }
      if (phase === 4) this.hud.announce('THE BELL FALLS SILENT');
    }, (from, desired, radius, id) =>
      this.collisionWorld.resolve(from, desired, radius, this.dynamicColliders, id));
    context.scene.add(this.boss.object);

    // QA can invalidate the replacement root without causing a network 404.
    // This proves the V11 authored fallback while keeping console output clean.
    const assetFailureMode = query.get('assetFail');
    const preferV12Candidate = query.get('character') === 'v12';
    const preferV14Candidate = query.get('character') === 'v14' || query.get('character') === 'mixamo';
    this.assetStatusTarget = context.uiRoot;
    context.uiRoot.dataset.characterAssets = 'loading';
    void this.initializeCharacterAssets(assetFailureMode, preferV12Candidate, preferV14Candidate, context.uiRoot);

    this.cameraPosition.copy(this.player.position).add(new THREE.Vector3(12, 15.5, 15));
    camera.position.copy(this.cameraPosition);
    camera.lookAt(this.player.position.clone().add(new THREE.Vector3(0, 0.9, -1.5)));

    window.addEventListener('keydown', this.restartHandler);
  }

  update(frame: FrameInfo, context: EngineContext) {
    const targets: CombatTarget[] = this.enemies.targets.filter((target) => target.alive !== false);
    if (this.boss.active && this.boss.alive) targets.push(this.boss);
    this.refreshDynamicColliders();
    this.player.update(frame.deltaSeconds, {
      camera: context.camera,
      targets,
      elapsed: frame.elapsedSeconds,
      groundY: 0,
      resolveMovement: (from, desired, radius) => this.collisionWorld.resolve(from, desired, radius, this.dynamicColliders, 'player'),
    });
    // Form traversal abilities own short invulnerability windows and may clear the
    // flag when they finish; keep explicit QA god mode stable between systems.
    if (this.qaGodMode) this.player.invulnerable = true;
    this.enemies.update(frame.deltaSeconds, frame.elapsedSeconds);
    // The collider list was built before player input so player movement could
    // resolve against actors. Refresh its entry before the mobile boss resolves
    // its own step, preventing a one-frame overlap during opposing movement.
    const playerCollider = this.dynamicColliders[0];
    if (playerCollider?.id === 'player') {
      playerCollider.x = this.player.position.x;
      playerCollider.z = this.player.position.z;
    }
    this.boss.update(frame.deltaSeconds);
    this.world.setBossArenaActive(this.boss.active && !this.boss.defeated);
    this.world.setQuality(context.quality);
    this.world.update(frame.deltaSeconds);
    this.effects.update(frame.deltaSeconds, context.camera);
    this.updateCamera(frame.deltaSeconds, context.camera as THREE.PerspectiveCamera);
    this.hud.update(frame.deltaSeconds, this.player.snapshot, this.boss);
    if (this.qaCollision) {
      context.uiRoot.dataset.collisionPosition = `${this.player.position.x.toFixed(3)},${this.player.position.z.toFixed(3)}`;
      context.uiRoot.dataset.collisionStatic = `${this.world.collisionCircles.length + this.world.collisionBoxes.length}`;
    }
    if (this.qaInspectCamera) this.writeV12Diagnostics(context.camera, context.uiRoot);

    if (this.moon) {
      this.moon.position.x = this.player.position.x - 17;
      this.moon.position.z = this.player.position.z + 14;
      this.moon.target.position.copy(this.player.position);
      if (!this.moon.target.parent) context.scene.add(this.moon.target);
    }
    if (this.playerFill) {
      this.playerFill.position.set(this.player.position.x, 4.2, this.player.position.z + 0.8);
    }
    if (this.arenaFill) {
      const targetIntensity = this.boss.active && !this.boss.defeated ? 2.6 : 0;
      this.arenaFill.intensity = THREE.MathUtils.damp(this.arenaFill.intensity, targetIntensity, 4.5, frame.deltaSeconds);
    }
  }

  private refreshDynamicColliders(): void {
    this.dynamicColliders.length = 0;
    this.dynamicColliders.push({ id: 'player', x: this.player.position.x, z: this.player.position.z, radius: 0.5 });
    for (const actor of this.enemies.actors) {
      if (!actor.alive) continue;
      this.dynamicColliders.push({ id: actor.id, x: actor.position.x, z: actor.position.z, radius: actor.radius * 0.92 });
    }
    if (this.boss.active && this.boss.alive) {
      this.dynamicColliders.push({ id: this.boss.id, x: this.boss.position.x, z: this.boss.position.z, radius: this.boss.radius });
    }
  }

  dispose() {
    this.disposed = true;
    this.player.dispose();
    this.enemies.disposeAuthoredVisuals();
    this.boss.disposeAuthoredVisual();
    this.characterAssets?.dispose();
    this.characterAssets = undefined;
    if (this.assetStatusTarget) delete this.assetStatusTarget.dataset.characterAssets;
    if (this.assetStatusTarget) delete this.assetStatusTarget.dataset.v12Diagnostics;
    if (this.assetStatusTarget) delete this.assetStatusTarget.dataset.collisionPosition;
    if (this.assetStatusTarget) delete this.assetStatusTarget.dataset.collisionStatic;
    this.assetStatusTarget = undefined;
    window.removeEventListener('keydown', this.restartHandler);
  }

  private async initializeCharacterAssets(
    failureMode: string | null,
    preferV12Candidate: boolean,
    preferV14Candidate: boolean,
    statusTarget: HTMLElement,
  ): Promise<void> {
    // GLTFLoader and SkeletonUtils stay in this on-demand chunk; the procedural
    // scene is already interactive while the import and three assets resolve.
    let runtime: typeof import('../assets3d/CharacterAssetRuntime');
    try {
      runtime = await import('../assets3d/CharacterAssetRuntime');
    } catch {
      if (!this.disposed) statusTarget.dataset.characterAssets = 'fallback:runtime';
      return;
    }
    if (this.disposed) return;
    const manifests = failureMode
      ? V16_CHARACTER_MANIFESTS.map((manifest) => {
        const selectedNightboundId = preferV14Candidate
          ? V14_CHARACTER_ASSET_IDS.nightbound
          : preferV12Candidate
            ? V12_CHARACTER_ASSET_IDS.nightbound
            : V11_CHARACTER_ASSET_IDS.nightbound;
        const failReplacement = manifest.id === selectedNightboundId;
        const failLegacy = failureMode === 'all' && manifest.id === V11_CHARACTER_ASSET_IDS.nightbound;
        return failReplacement || failLegacy
          ? { ...manifest, authoredRootName: 'DeliberatelyMissingNightboundRoot' }
          : manifest;
      })
      : V16_CHARACTER_MANIFESTS;
    this.characterAssets = new runtime.CharacterAssetLibrary(manifests);
    await this.attachAuthoredCharacters(preferV12Candidate, preferV14Candidate, statusTarget);
  }

  private async attachAuthoredCharacters(
    preferV12Candidate: boolean,
    preferV14Candidate: boolean,
    statusTarget: HTMLElement,
  ): Promise<void> {
    const library = this.characterAssets;
    if (!library) return;
    const failures = new Set<CharacterAssetId>();

    const tryAttach = async (
      id: CharacterAssetId,
      attach: (instance: CharacterAssetHandle) => boolean,
    ): Promise<boolean> => {
      if (this.disposed || !await library.preload(id)) return false;
      const result = await library.instantiate(id);
      if (!result.ok) return false;
      if (this.disposed || !attach(result.instance)) {
        result.instance.dispose();
        return false;
      }
      return true;
    };

    const attachNightbound = async (): Promise<'v14' | 'v12' | 'v11' | 'procedural'> => {
      const attach = (instance: CharacterAssetHandle) =>
        this.player.attachAuthoredFormVisual('nightbound', instance);
      if (preferV14Candidate && await tryAttach(V14_CHARACTER_ASSET_IDS.nightbound, attach)) return 'v14';
      if (preferV12Candidate && await tryAttach(V12_CHARACTER_ASSET_IDS.nightbound, attach)) return 'v12';
      if (await tryAttach(V11_CHARACTER_ASSET_IDS.nightbound, attach)) return 'v11';
      return 'procedural';
    };
    const nightboundSourcePromise = attachNightbound();
    const attachBoss = async () => {
      const attach = (instance: CharacterAssetHandle) => this.boss.attachAuthoredVisual(instance);
      if (await tryAttach(V16_CHARACTER_ASSET_IDS.bellSaint, attach)) return;
      if (!await tryAttach(V11_CHARACTER_ASSET_IDS.bellSaint, attach)) failures.add(V16_CHARACTER_ASSET_IDS.bellSaint);
    };
    const attachEnemy = async (id: string, index: number) => {
      const attach = (instance: CharacterAssetHandle) =>
        this.enemies.attachActorVisual(id, instance, 0.19 + index * 0.37);
      if (await tryAttach(V16_CHARACTER_ASSET_IDS.standardEnemy, attach)) return;
      if (!await tryAttach(V11_CHARACTER_ASSET_IDS.huskMourner, attach)) failures.add(V16_CHARACTER_ASSET_IDS.standardEnemy);
    };
    await Promise.all([
      nightboundSourcePromise,
      attachBoss(),
      ...this.enemies.getActorIds().map(attachEnemy),
    ]);
    if (!this.disposed) {
      const nightboundSource = await nightboundSourcePromise;
      const status = nightboundSource === 'v14'
        ? 'ready:v14'
        : nightboundSource === 'v12'
          ? 'ready:v12'
        : nightboundSource === 'v11'
          ? preferV12Candidate || preferV14Candidate ? 'fallback:v11' : 'ready:v11'
          : preferV14Candidate
            ? 'fallback:procedural:v14,v11'
            : preferV12Candidate ? 'fallback:procedural:v12,v11' : 'fallback:procedural:v11';
      statusTarget.dataset.characterAssets = failures.size
        ? `${status};missing=${[...failures].join(',')}`
        : status;
    }
  }

  private updateCamera(dt: number, camera: THREE.PerspectiveCamera) {
    // Pull the boss camera inside the arena wall and slightly higher so foreground
    // monoliths frame the fight instead of occluding the player and telegraphs.
    const offset = this.qaInspectCamera
      ? this.boss.active && !this.boss.defeated
        ? new THREE.Vector3(6.2, 11.4, 6.2)
        : new THREE.Vector3(6.4, 8.8, 7.2)
      : this.boss.active && !this.boss.defeated
        ? new THREE.Vector3(14.5, 21.5, 14.5)
        : new THREE.Vector3(12, 15.5, 15);
    const desiredFov = this.boss.active && !this.boss.defeated && !this.qaInspectCamera ? 43 : 37;
    const nextFov = THREE.MathUtils.damp(camera.fov, desiredFov, 5.2, dt);
    if (Math.abs(nextFov - camera.fov) > 0.002) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
    const focus = this.player.position.clone();
    if (this.boss.active && !this.boss.defeated) {
      focus.lerp(this.boss.position, 0.18);
      // Keep the rear apse and room boundary in frame even when both combatants
      // drift toward the entrance. This is a restrained composition anchor,
      // not a camera lock: player and boss positions still drive most motion.
      focus.lerp(this.bossRoomFocus, 0.34);
    }
    this.cameraPosition.copy(focus).add(offset);
    const blend = 1 - Math.exp(-dt * 5.6);
    camera.position.lerp(this.cameraPosition, blend);
    camera.position.x += camera.userData.shakeX ?? 0;
    camera.position.y += camera.userData.shakeY ?? 0;
    this.cameraTarget.lerp(focus.clone().add(new THREE.Vector3(0, 0.8, -1.2)), 1 - Math.exp(-dt * 8));
    camera.lookAt(this.cameraTarget);
  }

  private writeV12Diagnostics(camera: THREE.Camera, statusTarget: HTMLElement): void {
    const slot = this.player.getAuthoredFormVisual('nightbound');
    const instance = slot?.authored;
    if (!instance) return;
    const authoredSource = instance.object.name.startsWith(`${V14_CHARACTER_ASSET_IDS.nightbound}-`)
      ? 'v14'
      : instance.object.name.startsWith(`${V12_CHARACTER_ASSET_IDS.nightbound}-`)
        ? 'v12'
        : undefined;
    if (!authoredSource) return;

    const bounds = new THREE.Box3().setFromObject(instance.object, true);
    const center = bounds.getCenter(new THREE.Vector3());
    const actorPosition = this.player.actor.getWorldPosition(new THREE.Vector3());
    const frustum = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    );
    let meshCount = 0;
    const materials: Array<{ visible: boolean; opacity: number }> = [];
    let frustumCulled = true;
    instance.object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      meshCount += 1;
      frustumCulled &&= node.frustumCulled;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        materials.push({
          visible: material.visible,
          opacity: material.opacity,
        });
      }
    });
    statusTarget.dataset.v12Diagnostics = JSON.stringify({
      authoredCandidate: true,
      authoredSource,
      visible: instance.object.visible,
      objectScale: instance.object.scale.toArray(),
      objectPosition: instance.object.getWorldPosition(new THREE.Vector3()).toArray(),
      actorPosition: actorPosition.toArray(),
      bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), center: center.toArray() },
      centerDistanceToActor: center.distanceTo(actorPosition),
      boundsInFrustum: frustum.intersectsBox(bounds),
      meshCount,
      materials,
      frustumCulled,
    });
  }

  private restartHandler = (event: KeyboardEvent) => {
    if (event.code === 'Enter' && this.player.health <= 0) window.location.reload();
    if (event.code === 'KeyF' && this.qaCapture) this.boss.advanceCapturePhase();
  };
}
