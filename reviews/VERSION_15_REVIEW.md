# Version 15 review — environment geometry and material pass

## Verdict

**ITERATION PASS / ENVIRONMENT MATERIALLY IMPROVED / CHECKPOINT COMMERCIAL-QUALITY REJECTED.**

V15 directly addresses the user's complaint that the world looked like colored
cylinders and boxes. Trees, graves, rocks and major ruin pieces now have authored
procedural silhouettes, and original tiled stone/bark textures add visible
surface information and subtle bump response. The result is clearly better in
real gameplay and remains performant. It is not equal to V Rising: the fixed
reference still has much denser vegetation, richer terrain blending, sculpted
architecture, stronger depth framing, decals, material variety and local light
hierarchy.

## Verified implementation

- Replaced cylinder trunks and branches with bent elliptical ring-built gnarled
  wood; added separate root flares, instanced leaf crowns, contact shadows and
  fallen logs with collision.
- Replaced primitive rocks with eroded irregular forms and box/cone graves with
  extruded Gothic silhouettes plus instanced reliefs.
- Rebuilt the chapel, aqueduct, boss gate, processional steps, arena obelisks and
  braziers around lathed, extruded, tapered and chipped geometry instead of raw
  cylinders/boxes wherever practical.
- Generated two wholly original 1024×1024 seamless environment textures for
  this project: damp Gothic stone and gnarled marsh bark. They are shared across
  instanced material families as sRGB albedo plus restrained no-color-space bump
  sources. Full prompts and provenance are recorded in
  `src/assets/environment/ASSET_PROVENANCE.md`.
- Added deterministic forest and graveyard QA spawn points and retained the
  existing swept collision system for new fallen logs and all existing world
  blockers.

## Rendered comparison

| Fixed V Rising reference (review only) | Exact V15 production build |
|---|---|
| [`official-20.jpg`](./references/v-rising/official-20.jpg) | [`v15-static-preview-chapel.jpg`](./evidence/v15-static-preview-chapel.jpg) |
| Dense layered canopy, mossy rock/terrain transitions, foreground framing and rich material breakup | Textured/chipped ruins, readable ground grain and Gothic silhouettes, but sparse canopy, broad tiled ground and limited sculpted trim |

Additional exact-build evidence:

- [`v15-environment-chapel-final.jpg`](./evidence/v15-environment-chapel-final.jpg)
- [`v15-aqueduct-textured.jpg`](./evidence/v15-aqueduct-textured.jpg)
- [`v15-gate-textured.jpg`](./evidence/v15-gate-textured.jpg)
- [`v15-forest-textured.jpg`](./evidence/v15-forest-textured.jpg)
- [`v15-environment-graveyard-final.jpg`](./evidence/v15-environment-graveyard-final.jpg)

## Harsh visual assessment

- **Environment geometry/materials: ~3.1/5**, up from ~2.8/5. The literal
  colored-cylinder problem is materially reduced. Bark and stone surfaces now
  carry visible grain, mortar/fissure structure and roughness response; grave,
  tree and landmark silhouettes are less generic.
- The chapel still reads as a relatively coarse kit of piers/walls rather than
  a high-resolution authored ruin. The aqueduct remains one broad repeated span.
  Tree crowns are graphic clusters rather than dense foliage cards/meshes.
- Ground uses one strong gravel/peat family across too much of the world; pools
  and banks remain flat from the isometric camera. The scene needs macro masks,
  mud/moss transitions, decals, rubble/roots and material-dependent local light.
- Player, enemies, boss, HUD and audio were not the focus of V15. Existing
  SUP-004/013/014/017/018 issues remain.

## Technical gate

- Final `npm test`: PASS — TypeScript, 14/14 contract/collision tests,
  production build and 2/2 static tests.
- Production-preview chapel boot: canvas/game/UI active, zero captured console
  warnings/errors.
- LOW Phase III: 60.00 FPS average / 56.59 FPS 1%-low at DPR 0.65.
- HIGH Phase III: 60.00 / 56.71 at DPR 1.25.
- Both 30-second runs ended with zero object, geometry, texture or program
  growth. This is one Apple M5 host, not lower-end-hardware proof.
- `dist` is about 33 MiB. The two new images add about 0.99 MB.

## Final disposition

V15 closes as a successful bounded environment pass and the Versions 11–15
checkpoint. Commercial/V Rising parity remains rejected. Do not begin V16
without explicit user approval.
