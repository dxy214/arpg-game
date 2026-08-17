import quaterniusKnightUrl from '../assets/models/quaternius-knight.glb?url';
import type { CharacterAssetManifest } from './CharacterAssetRuntime';
import { V11_CHARACTER_MANIFESTS } from './v11CharacterManifests';

export const V12_CHARACTER_ASSET_IDS = {
  nightbound: 'v12-quaternius-knight',
} as const;

/** Only aliases for clips validated in the shipped GLB are declared here. */
const quaterniusKnightManifest: CharacterAssetManifest = {
  id: V12_CHARACTER_ASSET_IDS.nightbound,
  url: quaterniusKnightUrl,
  authoredRootName: 'NightboundKnight',
  animationAliases: {
    idle: 'idle',
    move: 'move',
    attackPrimary: 'attack',
    attackSecondary: 'attack',
    ability: 'attack',
    transform: 'transform',
    hit: 'hurt',
    death: 'death',
  },
  defaultAnimation: 'idle',
  scale: 1,
  rotationY: 0,
  lockAuthoredRootScale: true,
};

/** V11 entries remain available as the authored fallback and unchanged NPC set. */
export const V12_CHARACTER_MANIFESTS: readonly CharacterAssetManifest[] = [
  quaterniusKnightManifest,
  ...V11_CHARACTER_MANIFESTS,
];
