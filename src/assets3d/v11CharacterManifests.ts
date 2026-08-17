import nightboundUrl from '../assets/models/nightbound.glb?url';
import huskMournerUrl from '../assets/models/husk-mourner.glb?url';
import bellSaintUrl from '../assets/models/bell-saint.glb?url';
import type { CharacterAssetManifest } from './CharacterAssetRuntime';

export const V11_CHARACTER_ASSET_IDS = {
  nightbound: 'v11-nightbound',
  huskMourner: 'v11-husk-mourner',
  bellSaint: 'v11-bell-saint',
} as const;

const sharedHumanoidAliases = {
  idle: 'idle',
  move: 'move',
  attackPrimary: 'attack',
  attackSecondary: 'attack',
  ability: 'attack',
  hit: 'hurt',
  death: 'death',
} as const;

/** Static-import URLs are rewritten for both Vite dev and `base: './'` builds. */
export const V11_CHARACTER_MANIFESTS: readonly CharacterAssetManifest[] = [
  {
    id: V11_CHARACTER_ASSET_IDS.nightbound,
    url: nightboundUrl,
    authoredRootName: 'NightboundRig',
    animationAliases: {
      ...sharedHumanoidAliases,
      transform: 'transform',
    },
    defaultAnimation: 'idle',
    scale: 1,
    rotationY: 0,
  },
  {
    id: V11_CHARACTER_ASSET_IDS.huskMourner,
    url: huskMournerUrl,
    authoredRootName: 'HuskMournerRig',
    animationAliases: sharedHumanoidAliases,
    defaultAnimation: 'idle',
    scale: 1,
    rotationY: 0,
  },
  {
    id: V11_CHARACTER_ASSET_IDS.bellSaint,
    url: bellSaintUrl,
    authoredRootName: 'BellSaintRig',
    animationAliases: {
      ...sharedHumanoidAliases,
      phaseTransition: 'phase_pose',
    },
    defaultAnimation: 'idle',
    scale: 1,
    rotationY: 0,
  },
] as const;
