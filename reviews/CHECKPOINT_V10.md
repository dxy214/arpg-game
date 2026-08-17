# Veilfall — Version 10 checkpoint

This is the mandatory stop after Versions 6–10. **Do not begin Version 11 without explicit user approval.**

## Checkpoint verdict

Veilfall remains a complete, original, playable WebGL2 vertical slice with four mechanically distinct forms, mixed enemy packs, an elite encounter, and the three-phase Bell-Saint boss. Versions 6–10 materially improved terrain/material readability, player and enemy silhouette hierarchy, contact effects, boss phase identity, camera occlusion, motion evidence, and LOW-tier performance.

It is **not at V Rising or modern commercial ARPG visual quality**. The independent Version 10 supervisor verdict is **ITERATION PASS / CHECKPOINT QUALITY REJECTED**, approximately **2.8/5**. Runtime stability is credible; the largest remaining gaps are authored character/enemy/boss assets, skeletal animation and reaction depth, world density/material zoning, boss-mechanic spectacle, HUD legibility, and perceptually verified audio.

## Exact launch, test, and build instructions

Requirements: Node.js, npm, and a current desktop browser with WebGL2.

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm install
npm run dev
```

Open the URL printed by Vite. The usual URL is `http://localhost:5173/`; use the reported port if it differs.

Run the complete gate:

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm test
```

Create and serve the deployable static build:

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm run build
npm run preview
```

The deployable output is `dist/` and uses relative asset paths.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` | Move |
| Mouse | Aim |
| Left mouse | Primary attack |
| Right mouse or `Q` | Form Art / secondary ability |
| `Space` or left `Shift` | Form-specific traversal move |
| `R` | Ultimate |
| `1` / `2` / `3` / `4` | Nightbound / Wraith / Dreadwolf / Stonewrought |
| `H` | Field guide |
| `Enter` | Restart after defeat |

Interact once to start Web Audio; the HUD shows **SOUND AWAKENED** when it is running.

## Versions 6–10 summary

### Version 6 — fixed commercial reference and art baseline

- Established a fixed, review-only corpus of official V Rising screenshots and a homologous six-state comparison protocol.
- Reworked world surface breakup, landmarks, player/enemy silhouettes, procedural articulation, and layered VFX.
- Closed the missing six-state evidence blocker after a full real-browser recapture.
- Supervisor: **iteration pass / visual quality rejected**, ~2.0/5.

### Version 7 — terrain materials, lighting, and occlusion

- Integrated an original generated wet peat/mud/slate albedo and rebuilt wetland/path material handling.
- Improved fog, exposure, moon/fill hierarchy, instancing, shoreline contours, and contact effects.
- Removed camera-strip tree obstruction and reduced gravel competition after rendered rejection.
- Supervisor: **iteration pass / visual quality rejected**, ~2.2/5.

### Version 8 — combatant surfaces and pose timing

- Integrated original generated ritual-cloth and blackened-steel textures.
- Refined all forms and enemy roles with clearer anatomy/material blocks and bounded anticipation→contact→recovery posing.
- Repaired Stonewrought's collapsed silhouette and staged clearer player/target contact after supervisor rejection.
- Supervisor: **iteration pass / visual quality rejected**, ~2.3/5.

### Version 9 — form VFX, boss spectacle, and motion proof

- Added bounded form-specific VFX languages, deeper boss phase presentation, and more structured procedural combat audio.
- Captured the first 105-frame real-Chrome motion artifact and deterministic same-run Phase I→II→III evidence.
- Removed a boss-entry tree obstruction and re-recorded active Phase I/III pressure after motion review exposed it.
- Supervisor: **iteration pass / visual quality rejected**, ~2.6/5.

### Version 10 — bounded polish and checkpoint stabilization

- Varied the still-instanced route stones, aligned pond contours, separated Wraith from Phase II, and diversified boss projectile silhouettes/aftermath without changing mechanics.
- Re-recorded all fixed states, motion, authentic phases, HIGH/LOW threat readability, reference board, and performance telemetry.
- Final `npm test` passes TypeScript, 8/8 contracts, production build, and 2/2 static-host tests.
- Exact entry: `index-C1Pt-ALM.js`, 693.20 kB / 183.93 kB gzip.
- Supervisor: **iteration pass / checkpoint quality rejected**, ~2.8/5.

## Representative final evidence

| Area | Evidence |
| --- | --- |
| Reference comparison | [`v10-reference-board.jpg`](./evidence/v10-reference-board.jpg) |
| World | [`v10-compare-world.png`](./evidence/v10-compare-world.png) |
| Character/form | [`v10-compare-character.png`](./evidence/v10-compare-character.png), [`v10-compare-transformation.png`](./evidence/v10-compare-transformation.png) |
| Mixed combat/VFX | [`v10-compare-enemies.png`](./evidence/v10-compare-enemies.png), [`v10-compare-vfx.png`](./evidence/v10-compare-vfx.png) |
| Motion sequence | [`v10-motion-evidence.webp`](./evidence/v10-motion-evidence.webp), [`v10-motion-contact-sheet.jpg`](./evidence/v10-motion-contact-sheet.jpg) |
| Boss I/II/III | [`v10-boss-phase1-active.png`](./evidence/v10-boss-phase1-active.png), [`v10-boss-phase2.png`](./evidence/v10-boss-phase2.png), [`v10-boss-phase3-active.png`](./evidence/v10-boss-phase3-active.png) |
| LOW hazard proof | [`v10-low-phase3-hazards.png`](./evidence/v10-low-phase3-hazards.png) |
| Performance | [`v10-performance-final.png`](./evidence/v10-performance-final.png), [`v10-phase3.json`](./performance/v10-phase3.json) |

Official comparison images are review-only and documented in [`references/v-rising/SOURCES.md`](./references/v-rising/SOURCES.md). They are not shipped or imported by the runtime.

## Performance result and scope

The warmed 30-second Phase III LOW test at 1280×720, DPR 0.65, WebGL2/Metal recorded:

- 60.0 FPS average; 56.2 FPS 1%-low.
- 16.7 ms median; 17.4 ms p95; 17.7 ms p99; 18.1 ms maximum.
- 79 ending draw calls; 12,163 triangles.
- No console errors/warnings; no texture/program growth.

This is a pass for the tested LOW tier only. It does not prove medium/high/ultra behavior, slower hardware, production-preview timing, long-session leak freedom, or perceptual responsiveness.

## Supervisor's honest assessment

See [`VERSION_10_REVIEW.md`](./VERSION_10_REVIEW.md) and [`DEFECTS.md`](./DEFECTS.md).

The comparison protocol shows real progress, but the gap to the official reference remains large:

1. Player, enemy, and boss bodies still read as procedural primitives rather than authored/sculpted production assets.
2. Animation lacks skeletal deformation, foot planting, layered locomotion, strong hit reactions, and convincing attack weight.
3. The marsh remains a sparse gravel carpet with repeated structures and weak macro material/foliage zoning.
4. Boss phases are color-distinct but still reuse related radial-spoke topology and a largely rigid boss/arena.
5. VFX has better cores/trails, but little lighting interaction, deformation, debris persistence, or terrain aftermath.
6. HUD text is too small at 1280×720.
7. Audio is implemented and functionally starts/resumes, but no audible capture was graded; mix quality and sync are unverified.

## Proposed Versions 11–15 priorities

These are proposals only. **No implementation begins without explicit approval.**

1. **Version 11 — asset-pipeline decision:** replace the highest-visibility procedural hero/enemy/boss bodies with original authored GLTF/skinned assets and proper PBR texture sets; preserve current mechanics.
2. **Version 12 — animation and contact:** skeletal locomotion, attack anticipation/contact/recovery, hit reactions, foot planting, transformation transitions, hit-stop/camera/audio sync.
3. **Version 13 — world macro-authorship:** terrain masks, clustered foliage/props, richer architecture, decals, water/shore transitions, and occlusion-safe composition without expanding the biome.
4. **Version 14 — boss mechanics/spectacle:** phase-specific spatial patterns and arena responses, stronger transitions/aftermath, counter-form readability, and normal-damage fairness validation.
5. **Version 15 — accessibility, audio, and production audit:** legible scalable HUD, focus/pause/gamepad checks, audible captured mix review, HIGH-tier/external-hardware profiling, bundle splitting, and an uninterrupted production-build run.

## Mandatory stop

Versions 6–10 are complete. Version 11 has not started. Resume only after the user explicitly approves the next five-version batch.
