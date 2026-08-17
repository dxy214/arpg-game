# Version 13 review — collision and physical-space integrity

## Verdict

**ITERATION PASS / COLLISION ACCEPTED / TRIPO ASSET BLOCKED / COMMERCIAL VISUAL QUALITY REJECTED.**

This was a bounded systems iteration. It materially improves navigation and combat-space integrity, but it does not improve the character-art quality score because the selected Gothic Vampire could not be exported from Tripo without purchasing a subscription. No purchase or paywall bypass was attempted.

## Verified result

- Added one allocation-free XZ swept-circle solver with bounded substeps, three-pass depenetration, circle and expanded-AABB obstacles, dynamic actor circles, world bounds, and tangent-preserving wall sliding.
- Routed normal movement, dash, Wraith blink, Dreadwolf pounce, enemy pursuit/kiting/lunge, enemy knockback, pair separation, player/enemy separation, and boss-body blocking through the physical-space rules.
- Authored 238 static blockers covering deep pools, trees, significant rocks, graves, chapel walls, aqueduct pillars, boss-gate columns, arena monoliths, and braziers. Decorative ground cover remains non-blocking by design.
- Deterministic tests prove no tunnelling through a thin wall during an eight-unit dash, diagonal wall sliding, static prop rejection, live-character rejection, and ignore-self behavior.
- Real HIGH production render: starting at `(2.350,-27.000)`, a forward high-speed dash stopped at the eastern gate face at `z=-29.570`, exactly the column's expanded collision plane. A subsequent lateral move changed x while retaining wall contact, confirming sliding rather than movement cancellation.
- Final static smoke: `ready:v11`, 238 blockers, no console warnings/errors. Final `npm test`: 13/13 contract/collision tests, TypeScript, production build, and 2/2 static tests all pass.
- LOW benchmark: 60.00 average / 56.43 FPS 1%-low, p99 17.7 ms, zero geometry/texture/program growth.

## Release/build facts

- Final application chunk: `index-D_rW1K2-.js`, 167,479 bytes / 51,505 gzip.
- Three.js vendor chunk: `three-Dnyrl7VX.js`, 587,009 bytes / 149,254 gzip.
- Lazy character runtime: 51,924 bytes / 15,414 gzip.
- Deployable `dist`: 16,603,209 logical bytes (about 15.8 MiB). The vendor split removes the previous 750 kB entry-chunk cliff without changing runtime behavior.

## Honest defects and limits

- The selected Tripo model remains absent. The visible export workflow led to a paid subscription modal even though the account had 195 credits and the button advertised a five-credit export. The user must subscribe/export manually or provide a GLB before integration can start.
- Collision is deliberately 2.5D and uses authored circles/boxes rather than triangle-accurate mesh collision. This is appropriate for an isometric action RPG, but rotated ruin edges and organic shorelines are approximations.
- Projectiles and VFX are not stopped by scenery; the request covered characters, and adding projectile occlusion needs separate combat/readability design.
- The first un-warmed elite sample exposed field-combat tail hitches; the established warmed LOW boss gate passes, but a future version should profile uncullled roaming combat after full asset warmup.
- Character/environment/VFX fidelity is unchanged from V12 and remains far below the fixed V Rising reference bar.

## Supervisor disposition

The root-level rendered review accepts the collision feature and closes Version 13 as a functional iteration. It explicitly rejects any claim that the Gothic Vampire was integrated or that commercial visual parity improved. No Version 14 work should begin without user approval.
