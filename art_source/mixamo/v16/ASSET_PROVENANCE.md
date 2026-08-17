# Version 16 Mixamo enemy and boss assets

Downloaded on 2026-08-12 from the signed-in Adobe Mixamo character library for
evaluation as embedded game characters.

## Standard enemy

- Mixamo character: `Skeletonzombie T Avelange`
- Archived source: `enemy-skeletonzombie.fbx`
- Runtime asset: `src/assets/models/mixamo-skeletonzombie.glb`
- Root: `MixamoSkeletonZombieRig`
- Target height: 1.95 m
- Clips: idle, move, attack, hurt, death
- Conversion report: `enemy-conversion-report.json`

## Boss

- Mixamo character: `Warrok W Kurniawan`
- Archived source: `boss-warrok.fbx`
- Runtime asset: `src/assets/models/mixamo-warrok.glb`
- Root: `MixamoWarrokRig`
- Target height: 4.6 m
- Clips: idle, move, attack, hurt, death
- Conversion report: `boss-conversion-report.json`

The five presentation motions reuse the previously archived Mixamo motion FBXs
in the parent directory. `tooling/mixamo/convert_vampire.py` now accepts generic
root/source arguments, removes gameplay-root translation/scale, strips curves
for bones absent from the selected character, and leaves model-specific cloth,
face or armour bones in their bind pose. Gameplay remains responsible for
movement, collision, damage, timing and phase logic.

Mixamo assets are for embedded game use under Adobe's current Mixamo terms; do
not redistribute the raw FBX or extracted GLB as standalone stock assets.
