# Veilfall — Version 15 checkpoint

This is the mandatory stop after Versions 11–15. **Do not begin Version 16
without explicit user approval.**

## Checkpoint verdict

Versions 11–15 changed Veilfall from a mainly procedural presentation prototype
into a technically robust vertical slice with a real skinned-asset pipeline,
safe fallbacks, tested character candidates, swept collision, richer authored
world silhouettes and original environment textures. It remains fully playable
and deployable.

It is **not at V Rising or modern commercial ARPG visual quality**. V15's world
is approximately 3.1/5 against the fixed reference and the complete slice remains
around 3.1/5. Character quality, environment density, boss spectacle, motion
weight, HUD readability and perceptually reviewed audio remain below target.

## Exact launch instructions

Requirements: current Node.js/npm and a desktop browser with WebGL2.

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173/`.

Build/test the deployable project:

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm test
npm run preview
```

The static deployment output is `dist/`.

Optional character trials:

- `?character=v14` — Mixamo Vampire evaluation candidate.
- Default/no query — V11 authored Nightbound.
- V12 Quaternius remains an explicit rejected QA experiment, not a recommended
  presentation path.

## Versions 11–15 summary

### Version 11 — authored skinned-asset pipeline

- Added lazy GLTF/skinning/animation runtime, clone/disposal correctness and
  procedural fallback.
- Integrated original skinned Nightbound, Husk and Bell-Saint validation assets.
- Technical pipeline passed; visual target rejected at roughly 3.0/5.

### Version 12 — Quaternius candidate experiment

- Reproducibly converted and validated a CC0 animated knight.
- Found/fixed root-scale and alpha-zero export defects.
- Rejected it at about 1.6/5 and retained V11 as default.

### Version 13 — collision and physical-space integrity

- Added allocation-free swept-circle movement, wall sliding and static/dynamic
  blockers for player, forms, enemies, boss and world props.
- Collision accepted with deterministic tests and a stable performance gate.

### Version 14 — Mixamo Vampire evaluation

- Integrated a textured 15k-triangle/99-bone Vampire plus idle/run/slash/hurt/
  death clips behind `?character=v14`.
- Accepted as an explicit trial at about 3.3/5; not promoted because it has no
  weapon, bespoke transform or form-specific attack set.

### Version 15 — world geometry and textures

- Replaced many cylinder/box/card props with gnarled, extruded, lathed, chipped
  and tapered authored procedural geometry.
- Added original seamless Gothic-stone and gnarled-bark texture families with
  shared albedo/bump runtime usage and recorded provenance.
- Reverified production preview, console, collision tests, LOW/HIGH performance
  and static build. World improves to approximately 3.1/5; parity is rejected.

## Representative V15 evidence

| Area | Evidence |
|---|---|
| Fixed reference comparison | [`official-20.jpg`](./references/v-rising/official-20.jpg), [`VERSION_15_REVIEW.md`](./VERSION_15_REVIEW.md) |
| Chapel/stone materials | [`v15-static-preview-chapel.jpg`](./evidence/v15-static-preview-chapel.jpg) |
| Aqueduct | [`v15-aqueduct-textured.jpg`](./evidence/v15-aqueduct-textured.jpg) |
| Gate | [`v15-gate-textured.jpg`](./evidence/v15-gate-textured.jpg) |
| Forest/bark/foliage | [`v15-forest-textured.jpg`](./evidence/v15-forest-textured.jpg) |
| Graveyard | [`v15-environment-graveyard-final.jpg`](./evidence/v15-environment-graveyard-final.jpg) |
| LOW/HIGH telemetry | [`v15-performance-low.jpg`](./evidence/v15-performance-low.jpg), [`v15-performance-high.jpg`](./evidence/v15-performance-high.jpg) |

## Performance and storage

- LOW, 1280×720/DPR 0.65: 60.00 average / 56.59 FPS 1%-low.
- HIGH, 1280×720/DPR 1.25: 60.00 / 56.71.
- Zero object/geometry/texture/program growth in both 30-second Phase-III runs.
- No captured production-preview console warnings/errors.
- `dist`: approximately 33 MiB; main application chunk 175,638 bytes / 54,103
  deterministic gzip. New original environment images total about 0.99 MB.

See [`V15_PERFORMANCE_REPORT.md`](./performance/V15_PERFORMANCE_REPORT.md) and
[`V15_STORAGE_REPORT.md`](./V15_STORAGE_REPORT.md).

## Honest remaining problems

1. The world still lacks V Rising's terrain blending, decals, dense canopy,
   sculpted architecture, small-prop storytelling and layered light hierarchy.
2. The V11 player/enemy rigs remain below commercial quality; V14 is better but
   missing its weapon and distinct form/ability animation set.
3. Boss phase topology, deformation, arena response and defeat spectacle remain
   too simple.
4. Combat motion still needs stronger planting, reaction, recoil, secondary
   motion and synchronized audio proof.
5. HUD microcopy is too small; audio mix remains unheard in review; lower-end
   hardware and long-session leak behavior remain unverified.

## Proposed Versions 16–20 priorities

These are proposals only; implementation requires explicit approval.

1. **V16 — terrain material system:** macro masks/splat blending for mud, moss,
   wet stone and banks; decals, puddle normals and local AO without expanding the
   map.
2. **V17 — modular environment assets:** higher-detail ruin trims, roots, rocks,
   foliage clusters, props and landmark dressing with collision/occlusion QA.
3. **V18 — final player presentation:** attach an authored weapon and add unique
   attack/dash/transform clips to the best candidate; promote only above 3.5/5.
4. **V19 — boss/encounter spectacle:** animation-led phases, distinct spatial
   topologies, terrain/light response, hit aftermath and bespoke defeat.
5. **V20 — production/accessibility/audio audit:** scalable HUD, audible capture,
   focus/gamepad/pause, lower-end hardware, long-run resource cycles and final
   fixed-reference checkpoint.

## Mandatory stop

Versions 11–15 are complete. Stop here and wait for explicit approval before
Version 16.
