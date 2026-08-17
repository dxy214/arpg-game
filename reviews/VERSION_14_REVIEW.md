# Version 14 review — Mixamo Vampire authored-character trial

## Verdict

**ITERATION PASS / MIXAMO CANDIDATE ACCEPTED AS AN EXPLICIT TRIAL / V11 DEFAULT RETAINED / V RISING PARITY REJECTED.**

The downloaded `Vampire A Lusth` is a genuine visual improvement over the failed Quaternius experiment and over V11 in anatomy, skinning, costume texture density and authored motion. It is not yet a complete Nightbound replacement: the model has no weapon, its silhouette is narrow at the isometric gameplay scale, its armor values are dark against the Hollow March, its one slash is reused by all attacks, and no bespoke transformation clip exists. It therefore remains opt-in through `?character=v14`.

## Verified implementation

- Downloaded one skinned Mixamo character plus Standing Idle, in-place Running, Stable Sword Outward Slash, Standing React Large From Front, and Dying FBXs under the signed-in user's Mixamo access.
- Deterministically merged them with Blender into one 16.83 MB GLB: 15,021 triangles, 7,870 vertices, 99 bones, two materials, five named clips, and five embedded textures.
- Found and fixed two runtime-only presentation blockers: source-scene Hips offsets initially displaced idle by about six metres, while attack/hurt/death root motion moved the visible skin tens of metres away from the gameplay collider. The converter now removes all Hips translation while preserving joint rotations; the validator rejects excessive translation and non-finite accessors.
- Real HIGH screenshots prove idle, slash, hurt and death poses at gameplay scale. Runtime diagnostics keep model/collider roots coincident and the animated bounds in the camera frustum.
- Collision regression passed with `ready:v14`; the candidate retains the Version-13 swept movement, wall sliding and dynamic-character blockers because presentation never owns gameplay displacement.
- Death→Enter retry returned to `ready:v14`. Forced candidate failure returned `fallback:v11`; failure of both authored Nightbounds returned `fallback:procedural:v14,v11`; normal default remained `ready:v11`. All paths logged zero warnings/errors.
- Final `npm test` passes 14/14 contracts/collision tests, TypeScript, production build and 2/2 static tests. LOW and HIGH Phase-III performance both sustain 60 FPS average with 56.51/56.89 FPS 1%-low.

## Visual assessment against the fixed references

- **Character model: approximately 3.3/5.** The Mixamo candidate has credible humanoid proportions, deforming shoulders/elbows, layered clothing/armor and textured surface information, materially above V11 Nightbound's 3.0–3.2 and far above Quaternius' 1.6. It still misses the fixed V Rising character reference in face/hair detail, weapon identity, garment layering, cloth follow-through, material response and authored silhouette.
- **Animation: approximately 3.2/5.** Slash, hit and death are visibly authored and no longer rigid procedural poses. Root cleanup prevents skating away from the collider. The single attack does not match the current dual-blade mechanics, all three attack slots reuse it, feet/turn transitions and hit synchronization remain weaker than the commercial reference, and transformation still relies on the existing VFX swap.
- **Whole-game visual score remains about 3.0/5.** The player improves, but environment density, enemies, boss geometry/VFX, HUD scale and audio evidence are unchanged. The game is not at V Rising fidelity.

## Release facts and caveats

- `dist` grows to 31.89 MiB, dominated by 15.66 MB of embedded PNG textures. It remains under budget but should be compressed if this candidate is promoted.
- The model is a local evaluation candidate. Mixamo permits use of downloaded characters/animations in games under its terms, but a browser GLB is inherently extractable. Confirm the current Adobe license and distribution approach before public release; do not redistribute the raw FBX or GLB as a standalone asset.
- The candidate has no weapon/prop. Attaching an authored blade to the hand bone and selecting additional secondary/ultimate/dash/transform animations are the highest-value next steps.

## Mandatory stop

Version 14 is complete. Do not begin Version 15 until the user explicitly approves it.
