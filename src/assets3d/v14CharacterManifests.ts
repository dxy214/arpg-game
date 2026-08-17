import mixamoVampireUrl from '../assets/models/mixamo-vampire.glb?url';
import type { CharacterAssetManifest } from './CharacterAssetRuntime';
import { V12_CHARACTER_MANIFESTS } from './v12CharacterManifests';

export const V14_CHARACTER_ASSET_IDS = {
  nightbound: 'v14-mixamo-vampire',
} as const;

/**
 * Adobe Mixamo candidate used only when `?character=v14` is explicit. The
 * gameplay controller still owns movement, attacks and collision; this asset
 * contributes presentation clips only.
 */
const mixamoVampireManifest: CharacterAssetManifest = {
  id: V14_CHARACTER_ASSET_IDS.nightbound,
  url: mixamoVampireUrl,
  authoredRootName: 'MixamoVampireRig',
  animationAliases: {
    idle: 'idle',
    move: 'move',
    attackPrimary: 'attack',
    attackSecondary: 'attack',
    ability: 'attack',
    hit: 'hurt',
    death: 'death',
  },
  defaultAnimation: 'idle',
  scale: 1,
  rotationY: 0,
  castShadow: true,
  receiveShadow: true,
};

/** V12 and V11 stay in the library as deterministic authored fallbacks. */
export const V14_CHARACTER_MANIFESTS: readonly CharacterAssetManifest[] = [
  mixamoVampireManifest,
  ...V12_CHARACTER_MANIFESTS,
];
