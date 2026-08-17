# Veilfall — Version 5 checkpoint

This is the mandatory stop after Versions 1–5. **Do not begin Version 6 without explicit user approval.**

## Checkpoint verdict

Veilfall is a complete, original, playable browser vertical slice: one dense route through the Hollow March, four mechanically distinct player forms, mixed enemy packs, the Gloam Castellan elite, and the three-phase Bell-Saint boss through death/retry and victory. The project installs, builds to static files, and has deterministic QA routes and automated regression checks.

It is **not yet at the requested modern commercial action-RPG quality bar**. The final independent supervisor score is approximately **2.7/5**, against a target of 4.0/5 with no category below 3.5. Version 5 closes the tested LOW-tier performance and boss-hazard readability defects, but visual fidelity and uninterrupted experiential evidence remain open. This checkpoint is a useful, unusually well-instrumented prototype/early vertical slice—not a production-ready demo.

## Exact launch, test, and build instructions

Requirements: a current desktop browser with WebGL2, Node.js, and npm.

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm install
npm run dev
```

Open the URL printed by Vite. The usual local URL is `http://localhost:5173/`; if that port is occupied, use the port Vite reports.

To run the complete automated gate:

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm test
```

`npm test` performs strict TypeScript checking, eight source/runtime contract checks, a production build, and two static-output/preview tests.

To create and serve the deployable static build:

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm run build
npm run preview
```

Deploy the contents of `dist/` to a normal static host. Assets use relative paths.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` | Move relative to the isometric camera |
| Mouse | Aim |
| Left mouse | Primary attack |
| Right mouse or `Q` | Form Art / secondary ability |
| `Space` or left `Shift` | Form-specific traversal move |
| `R` | Ultimate |
| `1` / `2` / `3` / `4` | Nightbound / Wraith / Dreadwolf / Stonewrought |
| `H` | Open or close the field guide |
| `Enter` | Restart after defeat |
| `P` | Start a 30-second sample when `?perf=1` is enabled |

Browser audio starts after the first interaction, as required by browser autoplay policy. The top-right status changes to **SOUND AWAKENED** when the audio context is running.

## Five-version summary

### Version 1 — foundation and form identity

- Established the Vite/TypeScript/Three.js WebGL2 runtime, fixed-step lifecycle, isometric camera, movement, mouse aim, combat, transformations, HUD, world route, enemy roster, elite, boss, and procedural audio/VFX.
- Fixed an initially failing production build, unsafe opening pressure, enemy aim tracking during tells, boss callback/cleanup defects, and overlapping hazard burst damage.
- Supervisor result: **iteration pass / checkpoint quality rejected**, approximately 0.8/5. The slice functioned, but primitive actors, flat materials, crushed values, and missing full-run evidence dominated the presentation.

### Version 2 — the hunt and the world

- Rebuilt the Hollow March with landmarks, water, graves, forest/rock layering, weather, lighting, arena runes, and authored traversal composition.
- Added articulated procedural player and boss rigs, distinct form kits, richer encounters, revised HUD/field guide, layered procedural audio, and deterministic elite/boss QA entry points.
- Verified elite defeat and a sequential Phase I → II → III → victory boss run.
- Supervisor result: **iteration pass / checkpoint quality rejected**, approximately 1.9/5. System and encounter breadth became credible; bespoke model/material/animation fidelity remained far below target.

### Version 3 — boss spectacle and run integrity

- Added an encounter-aware processional-gate dissolve, improved arena framing and attack readability, and re-ran the complete boss sequence.
- Verified normal-damage defeat, Enter-to-retry, all three boss phases, and victory after the occlusion fix.
- Supervisor result: **iteration pass / checkpoint quality rejected**, approximately 2.1/5. Boss presentation improved, but faceted vestments, simple hazards, and incomplete feel/audio/performance evidence prevented acceptance.

### Version 4 — performance and combat evidence

- Added a visible 30-second browser telemetry probe, deterministic quality/baseline modes, adaptive quality, capped fixed-step catch-up, low-tier shadow/ambience reductions, boss-only world culling, and arena/boss instancing.
- Added strict contract, build-integrity, static-host, form-differentiation, encounter-state, and resource-bounding tests.
- Captured Form Art and primary/traversal states for all four kits; this closed the transformation-evidence defect.
- Supervisor result: **iteration pass / hard quality rejected**, approximately 2.3/5. Performance improved dramatically but still failed: best controlled Phase III result was 45.54 FPS average / 32.98 FPS 1%-low; the final structurally leaner sample measured 43.26 / 29.86 at LOW DPR 0.65.

### Version 5 — checkpoint polish and release audit

- Added the final checkpoint presentation pass: richer Hollow March ground surface, clearer Nightbound crescent and Wraith veil silhouettes, and improved boss material/hazard variation without expanding the slice.
- Captured a fresh 1280×720 establishing shot, all-form action states, every boss phase, and victory for the Version 5 candidate.
- Consolidated launch/build/controls, QA routes, evidence, performance limitations, remaining defects, and the next-five-version proposal in this handoff.
- Final supervisor result: **iteration pass / checkpoint quality rejected**, approximately 2.7/5. The candidate closes the tested LOW-tier numeric gate and hazard-readability defect, but not the commercial-fidelity or uninterrupted experiential-evidence defects.

## Representative rendered evidence

All images are 1280×720 PNG captures from real browser rendering. Query-assisted `god=1` evidence uses invulnerability. The disclosed `capture=1` sequence multiplies incoming QA damage only to shorten browser capture; phase thresholds, attacks, affinities, hazards, VFX, transitions, and victory remain live.

### Version 5 presentation candidate

| Area | Evidence | What it demonstrates |
| --- | --- | --- |
| World | [`v5-world-wide.png`](./evidence/v5-world-wide.png) | Hollow March route, rain, ground treatment, graveyard composition, HUD, and audio-unlocked state |
| Nightbound | [`v5-nightbound-crescent.png`](./evidence/v5-nightbound-crescent.png) | Blood Crescent shape/readability in a live pack |
| Wraith | [`v5-wraith-veil.png`](./evidence/v5-wraith-veil.png) | Ranged/phase-form silhouette and Veil Burst treatment |
| Dreadwolf | [`v5-dreadwolf-lunge.png`](./evidence/v5-dreadwolf-lunge.png) | Predatory movement/attack posture and live combat spacing |
| Stonewrought | [`v5-stonewrought-slam.png`](./evidence/v5-stonewrought-slam.png) | Heavy form, Seismic Slam, and area-contact readability |
| Boss Phase I | [`v5-boss-phase1.png`](./evidence/v5-boss-phase1.png) | Phase I identity, boss silhouette, arena framing, and Rend affinity |
| Boss Phase II | [`v5-boss-phase2.png`](./evidence/v5-boss-phase2.png) | Phase II palette/mechanics transition and ranged response |
| Boss Phase III | [`v5-boss-phase3.png`](./evidence/v5-boss-phase3.png) | Last Resonance state, Stonewrought response, and final-phase arena load |
| LOW hazard proof | [`v5-low-phase3-hazards.png`](./evidence/v5-low-phase3-hazards.png) | Amber Phase III pressure remains unmistakable at LOW DPR 0.65 |
| LOW telemetry | [`v5-performance-final.png`](./evidence/v5-performance-final.png) | Exact post-readability 30-second Phase III sample |
| Victory | [`v5-boss-victory.png`](./evidence/v5-boss-victory.png) | Completed boss state and authored victory presentation |

### Supporting checkpoint evidence from earlier exact-version loops

| Area | Evidence |
| --- | --- |
| Elite telegraph and defeat | [`v2-elite-dreadwolf-telegraph.png`](./evidence/v2-elite-dreadwolf-telegraph.png), [`v2-elite-stonewrought-defeated.png`](./evidence/v2-elite-stonewrought-defeated.png) |
| Death and retry | [`v3-death.png`](./evidence/v3-death.png), [`v3-retry.png`](./evidence/v3-retry.png) |
| Complete form-kit pairs | [`v4-nightbound-blood-crescent.png`](./evidence/v4-nightbound-blood-crescent.png), [`v4-wraith-veil-burst.png`](./evidence/v4-wraith-veil-burst.png), [`v4-dreadwolf-pounce.png`](./evidence/v4-dreadwolf-pounce.png), [`v4-stonewrought-slam.png`](./evidence/v4-stonewrought-slam.png), plus the four `v4-*-traverse-primary.png` captures in the same directory |
| Performance panel | [`v4-performance-phase3-candidate4.png`](./evidence/v4-performance-phase3-candidate4.png) |
| Performance data and analysis | [`performance/PERFORMANCE_REPORT.md`](./performance/PERFORMANCE_REPORT.md) and its linked JSON traces |

This is a cross-version checkpoint index, not a claim that every supporting state was re-recorded in one V5 process. That exact-build evidence gap remains open.

## Supervisor assessment and hard caveats

The supervisor's final review is [`VERSION_5_REVIEW.md`](./VERSION_5_REVIEW.md): **iteration pass / checkpoint quality rejected**, approximately 2.7/5. Performance and hazard readability now pass their exact tested gates, but the still-image evidence does not prove sound mix, combat responsiveness, fairness, or uninterrupted run integrity.

Open supervisor defects at checkpoint:

1. **SUP-001 — exact-version/full-run evidence (P0).** There is no single immutable V5 capture running first input → exploration → mixed packs → elite → boss → victory, with audio and console/performance proof. Still images cannot validate feel.
2. **SUP-004 — visual fidelity (P1).** Actors, enemies, props, structures, and the boss are recognizable and art-directed, but still visibly assembled from faceted procedural primitives. Animation, anatomy, surface detail, contact grounding, and material hierarchy do not meet a 3.5/5 commercial floor.
3. **Broader performance validation.** SUP-007 is closed for the exact tested LOW tier: 60.0 FPS average / 56.23 FPS 1%-low, 16.7 ms median / 17.7 ms p99 at DPR 0.65. Medium/high/ultra, production-preview timing, and settled post-hazard resource return remain unverified.

Additional limitations:

- Focus blur/resume could not be genuinely triggered in the available in-app browser and remains unverified, even though source hooks exist.
- The exact production-preview route boots and static-host tests pass, but the 30-second distribution was captured on the equivalent development build rather than `vite preview`.
- The final JavaScript bundle is approximately 652 kB minified / 172 kB gzip, plus a 422 kB ground texture, and still triggers Vite's >500 kB advisory.
- Audio unlock and state transitions are functionally evidenced, but the sound mix has not been perceptually graded in an audio-on recording.
- The slice has no gamepad/touch support and is intended for desktop keyboard/mouse browsers.

## Remaining problems, in priority order

1. Capture one immutable production-build, audio-on, uninterrupted full run with timestamps for every form, enemy type, elite, death/retry, all boss phases, victory, console, and frame trace.
2. Profile Phase III at medium/high/ultra in external desktop Chrome; pool boss hazard geometry/materials, verify resource return after hazards settle, and preserve the LOW-tier pass at higher readable quality.
3. Replace the most visible procedural character/enemy/boss surfaces with authored topology, stronger anatomy, layered materials, and disciplined locomotion/attack/reaction animation.
4. Improve contact grounding and combat impact: anticipation/contact/recovery poses, hit-stop/camera impulse tuning, reaction variation, shape-first VFX, and a perceptually graded audio hierarchy.
5. Reduce world repetition and improve material response/landmark readability without expanding the world footprint.
6. Verify focus blur/resume, pause behavior, resize, reload, death/restart, and resource stability in a normal external browser.
7. Split the entry bundle and add boot/load measurements after steady-state performance is fixed.

## Proposed priorities for Versions 6–10

These are proposals only. Work remains stopped until explicit approval.

### Version 6 — immutable evidence and feel baseline

- Establish a production-build identifier and record the uninterrupted audio-on reference run.
- Add reproducible input-to-action, hit-stop, cancel-window, and damage/readability measurements.
- Close evidence and browser-lifecycle gaps before broad art changes.

### Version 7 — authored hero forms

- Replace the highest-visibility player/form primitives with authored silhouettes and better deformation/secondary motion.
- Tune locomotion, starts/stops, attack anticipation/contact/recovery, swapping, and form-specific traversal feel.
- Preserve the four distinct tactical roles already validated.

### Version 8 — enemy, elite, and impact pass

- Give each threat authored anatomy, motion language, hit/death reactions, audio identity, and clearer non-color telegraphs.
- Rebalance mixed packs and elite punish windows under normal damage.
- Grade the complete combat/audio hierarchy in a recorded run.

### Version 9 — boss and world fidelity

- Replace the boss's faceted vestments/hazards with richer authored surfaces and pooled shape-first effects.
- Improve Phase I/II/III mechanical distinction, transition spectacle, arena depth, and landmark/material quality without increasing biome scope.
- Retest full boss fairness with every form.

### Version 10 — performance and public-demo checkpoint

- Complete external Chrome CPU/GPU profiling, pooling/instancing, shader warmup, scene traversal reduction, and normal-quality stress validation.
- Meet near-60 average and ≥45 FPS 1%-low in worst-case Phase III without the current LOW-tier softness.
- Run the full production regression/evidence loop, complete supervisor review, and stop for the next five-version checkpoint.

## QA shortcuts

Deterministic scenario URLs are documented in [`../tests/QA_SCENARIOS.md`](../tests/QA_SCENARIOS.md). `god=1` is a QA-only invulnerability switch. Use normal routes for balance/fairness validation; use QA routes only to reproduce a state or hold a phase long enough for visual/performance inspection.
