import mixamoSkeletonZombieUrl from '../assets/models/mixamo-skeletonzombie.glb?url';
import mixamoWarrokUrl from '../assets/models/mixamo-warrok.glb?url';
import type { CharacterAssetManifest } from './CharacterAssetRuntime';
import { V14_CHARACTER_MANIFESTS } from './v14CharacterManifests';

export const V16_CHARACTER_ASSET_IDS = {
  standardEnemy: 'v16-mixamo-skeletonzombie',
  bellSaint: 'v16-mixamo-warrok',
} as const;

const sharedCombatAliases = {
  idle: 'idle',
  move: 'move',
  attackPrimary: 'attack',
  attackSecondary: 'attack',
  ability: 'attack',
  phaseTransition: 'hurt',
  hit: 'hurt',
  death: 'death',
} as const;

const standardEnemy: CharacterAssetManifest = {
  id: V16_CHARACTER_ASSET_IDS.standardEnemy,
  url: mixamoSkeletonZombieUrl,
  authoredRootName: 'MixamoSkeletonZombieRig',
  animationAliases: sharedCombatAliases,
  defaultAnimation: 'idle',
  scale: 1,
  rotationY: 0,
  castShadow: true,
  receiveShadow: true,
};

const bellSaint: CharacterAssetManifest = {
  id: V16_CHARACTER_ASSET_IDS.bellSaint,
  url: mixamoWarrokUrl,
  authoredRootName: 'MixamoWarrokRig',
  animationAliases: sharedCombatAliases,
  defaultAnimation: 'idle',
  scale: 1,
  rotationY: 0,
  castShadow: true,
  receiveShadow: true,
};

export const V16_CHARACTER_MANIFESTS: readonly CharacterAssetManifest[] = [
  standardEnemy,
  bellSaint,
  ...V14_CHARACTER_MANIFESTS,
];
