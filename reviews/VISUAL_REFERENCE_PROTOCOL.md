# Visual reference protocol — Versions 6–10

## Purpose

The target is not thematic imitation. The target is comparable production finish in an original browser ARPG: coherent authored shapes, dense but navigable scenes, convincing material response, expressive characters, readable motion and effects, disciplined lighting, and stable performance. V Rising characters, names, maps, UI, models, textures, animations, audio, effects, and story may not be copied.

## Evidence rule

Every version must save both the fixed official reference set and fresh exact-build gameplay captures. A reviewer must inspect the images together. Source inspection, feature lists, filenames, and written claims do not count as visual evidence.

Required matched captures per version:

1. `vN-compare-world.png`: wide authored route after intro text fades and audio is unlocked.
2. `vN-compare-character.png`: player and at least two enemies at a readable mid-range scale.
3. `vN-compare-vfx.png`: primary contact plus a form-specific skill at peak readable impact.
4. `vN-compare-transformation.png`: a transformation transition with before/after silhouette evidence.
5. `vN-compare-boss.png`: boss and player separated in frame with an active phase telegraph or hazard.
6. `vN-reference-board.png`: reference and current-build frames presented together, labeled, without hiding defects.

The report must record the exact build hash or bundle filename, launch URL, quality tier, viewport, console result, and whether the evidence uses normal damage or disclosed QA acceleration.

## Scoring rubric

Each category is scored from 1 to 5:

- **1 — placeholder:** primitives, flat values, generic particles, no material or animation authorship.
- **2 — prototype:** coherent direction but visibly procedural, repeated, faceted, stiff, or under-layered.
- **3 — authored indie:** intentional composition and readable gameplay; obvious fidelity, deformation, material, or density gap versus the official references.
- **4 — modern AA:** convincing at normal play distance with only localized gaps visible in side-by-side comparison.
- **5 — reference-comparable:** the category remains visually convincing beside the fixed commercial reference at the same viewing scale.

Categories:

- Environment composition and route authorship.
- Terrain, architecture, foliage, and prop material fidelity.
- Character anatomy, silhouette, costume/material separation, and contact grounding.
- Locomotion, attack anticipation, contact, recovery, reaction, and transformation motion.
- Skill VFX shape, bright core, edge, trail, secondary motion, impact, and ground integration.
- Enemy and boss identity, phase spectacle, telegraph readability, and encounter framing.
- Lighting, shadows, atmospheric depth, focal hierarchy, and value readability.
- Camera composition, occlusion behavior, UI coexistence, and combat readability.
- Runtime stability at the tested tier.

## Acceptance

A version can complete its implementation loop while still receiving a quality rejection. It may be called "V Rising-level" only when every visual category scores at least 4.5/5 in fresh side-by-side evidence, the overall weighted score is at least 4.5/5, the full encounter remains readable in motion, and performance/restart/console gates pass. Until then, reports must say exactly which gaps remain.

The supervisor should prefer rejection over optimistic inference. A polished screenshot cannot prove animation feel, responsiveness, audio, or performance; those require real-play evidence.
