# Version 16 review — Mixamo enemies, Warrok boss, and world dressing

## Verdict

**ITERATION PASS / ENEMY AND BOSS PRESENTATION IMPROVED / V RISING PARITY REJECTED.**

V16 replaces the visible procedural enemy bodies with Mixamo
`Skeletonzombie T Avelange` rigs and replaces the Bell-Saint body with Mixamo
`Warrok W Kurniawan`. The result is a substantial boss silhouette/material
upgrade and a meaningful anatomy/animation upgrade for ordinary enemies. The
slice still does not match V Rising because standard enemy roles now share one
model, the imported clips are generic, and arena/world/VFX layering remains much
simpler than the fixed reference.

## Implemented and verified

- Downloaded, archived and converted two signed-in Mixamo characters with exact
  provenance, reports and hashes. Skeletonzombie is 12,486 triangles / 73 bones;
  Warrok is 12,626 triangles / 81 bones.
- Retargeted idle, move, attack, hurt and death. Conversion removes gameplay-root
  displacement and foreign animation curves while leaving character-specific
  cloth/face/armour bones stable in bind pose.
- All standard roles and the elite use the Skeletonzombie presentation with
  bounded per-role scale variation. Gameplay specs, weaknesses, AI, collision,
  damage and projectile logic remain distinct.
- Warrok replaces only the boss body; all three Bell-Saint phases, health,
  hazards, weaknesses, collision and victory logic remain unchanged.
- Reduced population from 13 to 9 across the same four authored encounter areas:
  eight ordinary enemies plus one elite.
- Removed the ranged enemies' nine-metre rectangular ground strip. A compact
  caster ring plus the visible projectile now communicates ranged timing.
- Added darker hanging vines and moss clusters to the chapel and aqueduct using
  batched TubeGeometry/instanced foliage, without adding collision clutter.

## Real rendered evidence

- [`v16-production-enemies.jpg`](./evidence/v16-production-enemies.jpg) — exact
  static build, reduced population and Mixamo enemies.
- [`v16-production-boss.jpg`](./evidence/v16-production-boss.jpg) — exact static
  build, Phase-I Warrok boss and active hazard field.
- [`v16-ranged-telegraph.jpg`](./evidence/v16-ranged-telegraph.jpg) — combat with
  no long ranged rectangle; the large circle is the existing elite radial slam.
- [`v16-boss-defeat.jpg`](./evidence/v16-boss-defeat.jpg) — complete victory state.
- [`v16-performance-low.jpg`](./evidence/v16-performance-low.jpg) and
  [`v16-performance-high.jpg`](./evidence/v16-performance-high.jpg) — exact
  telemetry panels.

## Comparison with fixed V Rising reference

Against [`official-15.jpg`](./references/v-rising/official-15.jpg), Warrok has a
far stronger textured, organic and asymmetric boss silhouette than the former
procedural Bell-Saint. It still lacks the reference's differentiated minion
silhouettes, authored weapon/attack identity, terrain deformation, dense local
lighting, debris, secondary motion and environment integration. V16 boss body is
approximately 3.6/5; the complete boss presentation remains about 3.3/5.

Skeletonzombie enemies are approximately 3.2/5: anatomy, skinning, textures and
reaction/death clips improve, but using one appearance for melee, caster,
stalker and elite weakens role readability. This is an intentional first
replacement, not a final commercial enemy roster.

Environment moves only slightly beyond V15 (~3.15/5). Vines/moss improve ruin
age and layering, but terrain blending, shoreline geometry, dense foliage,
decals and sculpted architectural trim remain below the fixed world reference.

## Technical result

- Final `npm test` passes 14/14 contract/collision tests and 2/2 static tests.
- Exact production preview: `ready:v14` player path, both V16 encounter assets
  visible, zero captured console warnings/errors.
- LOW: 60.00 average / 56.75 FPS 1%-low.
- HIGH: 60.00 / 56.62.
- `dist`: approximately 61.7 MiB. New embedded textures account for most growth.

## Remaining priority defects

1. Add at least one separate Mixamo caster and one elite model so role silhouette
   is not communicated only by scale/VFX.
2. Acquire boss-specific roar, slam, cast, phase-transition and death animations;
   the generic slash/hurt clips do not fully fit Warrok.
3. Transcode 2048 textures and add distance/animation culling before further
   enemy diversity.
4. Continue terrain splat blending, decals, bank/water geometry and clustered
   foliage rather than adding more map area.

Version 16 may close. Version 17 has not started.
