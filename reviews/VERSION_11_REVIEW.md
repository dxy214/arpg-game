# Supervisor Review — Version 11

**Final status: ITERATION PASS / VISUAL QUALITY REJECTED. Total score: 3.0/5.** The Version 11 implementation→launch→playtest→rendered inspection→fix→retest loop is complete, so the version number may be closed. It does **not** meet the requested V Rising-level commercial presentation and must not be represented as doing so. **Do not begin Version 12 without the user's explicit approval.**

Independent release re-audit on 2026-08-11 inspected every requested V11 still/contact sheet and the fixed official comparison board, reconciled the performance/storage reports and V Rising source manifest, and reran `npm test` successfully. The final normal-production screenshot is clean. This audit did not infer an exact-final-production fallback image: in-app Browser security policy blocked that capture and prohibited retry, so only the runtime self-test and earlier live fallback evidence support that path.

## Executive verdict

Version 11 is a real technical and functional advance over Version 10: three original Blender-authored skinned GLBs—Nightbound, Husk Mourner, and Bell-Saint—are integrated through the local animation/runtime path with graceful procedural fallback; normal play, transformation, four-Husk staging, boss phases I→II→III, defeat, victory, retry, production loading, and fallback playability all have rendered evidence. The candidate is stable and fast on the measured host.

The commercial-quality gate still fails. In the fixed side-by-side board, the V11 actors read as stylized mid/low-poly rigid assemblies: anatomy is blocky, costume layers are broad flat slabs, hands/faces are minimal, skinning shows little soft deformation, cloth has no convincing secondary motion, and attacks move joints without enough whole-body weight. The environment remains sparse and uniformly gravelled. Boss spectacle is readable but mostly geometric overlays on a flat arena rather than animation-led, material-rich combat. Overall rendered quality is approximately **3.0/5**; Nightbound is **3.0–3.2/5**, below the required **3.5/5** acceptance floor and far below parity with the official reference.

## Evidence actually inspected

- Fixed official references and provenance: `reviews/references/v-rising/SOURCES.md`, with `official-00`, `02`, `10`, `15`, `20`, `24`, and `26` used only for review.
- Exact V11 comparison board: `reviews/evidence/v11-reference-board.jpg`.
- Player: `v11-nightbound-close-facing.png`, the uninterrupted `v11-nightbound-attack.webp` and its contact sheet, and `v11-nightbound-transform.webp` plus contact sheet.
- Enemy: `v11-husk-group.png`, `v11-husk-motion.webp`, `v11-husk-death.webp`, its contact sheet, and `v11-husk-death-result.png`.
- Boss: `v11-boss-phase1.png`, `phase2.png`, `phase3.png`, `v11-boss-final-motion.webp` and contact sheet, `v11-boss-death.png`, and `v11-boss-victory.png`.
- Runtime: `v11-production-normal.png`, `v11-asset-pipeline-fallback.png`, death/retry evidence, LOW/HIGH performance panels and JSON.
- Storage/bundle: `reviews/performance/V11_STORAGE_REPORT.md` and `bundle-metrics.json`.
- Independent supervisor run of `npm test` on 2026-08-11: TypeScript passed; contracts **8/8** passed; Vite production build passed; static distribution **2/2** passed.

## Side-by-side judgment against the fixed reference

### Character anatomy, costume, and materials — 3.1/5, FAIL

`official-24.jpg` shows a layered silhouette with hair, mantle/cape, fitted torso, footwear, articulated hands, metal/cloth response, small costume breaks, and stable grounded locomotion. `v11-nightbound-close-facing.png` has a clearer authored silhouette than V10 and at least three readable color/material masses, but its head is a faceted hood/helmet block, limbs are segmented tubes, hands are mitten-like, the torso and skirt are rigid, and the cape reads as several flat cards. Cloth/steel source work is not legible enough at play scale to overcome the model and lighting limits. The attack sheet proves anticipation, contact, follow-through, and return, but weight remains mostly an arm/torso rotation and the feet/body do not sell force transfer.

The transformation sheet proves the outgoing and incoming authored states are no longer an instantaneous invisible swap. It remains a compressed pose plus rings/text rather than a materially rich metamorphosis with body breakup, secondary particles, distortion, silhouette morphing, and forceful landing.

### Enemy group and death — 2.9/5, FAIL

The four authored Husks are stable and distinguishable from the player, and the isolated sequence proves a readable collapse/death state. Against `official-15.jpg`, the group lacks anatomical specificity, costume variation, pose desynchronization, contact separation, and material response. In `v11-husk-group.png`, all four actors share near-identical silhouettes and nearly the same open-arm posture, so the pack reads as cloned mannequins. The death becomes a small prone prop quickly and is heavily occluded by Stonewrought; it is functional evidence, not a commercial death finish.

### World composition and atmosphere — 2.8/5, FAIL

Against `official-20.jpg` and `official-26.jpg`, the Hollow March has coherent darkness, rain, water, stepping-stone routing, and a few warm/cool light anchors. It does not have comparable vegetation density, canopy shadow, terrain macro-zones, blended banks, landmark architecture, foreground framing, or depth layers. The uniform high-frequency ground texture and widely spaced primitive grave/ruin props leave large empty areas. It remains an atmospheric prototype biome, not a dense handcrafted commercial location.

### Boss silhouette, phase staging, and effects — 3.1/5, FAIL

The Bell-Saint is the strongest V11 asset improvement: crown/halo, bell-crook, vestment mass, censer/prop, phase colors, defeat, and victory are recognizable. The same-run Phase I→II→III→defeat sequence has functional integrity. However, the head/halo/crook overlap produces tangencies, the body is still assembled from broad low-poly slabs, the face has little authored read, and phase identity relies heavily on hue and geometric projectile rings. In Phase III, Stonewrought overlaps the boss and reduces action readability. Compared with `official-10.jpg` and `official-15.jpg`, there is little local light response, terrain disturbance, layered debris, secondary trails, animation-driven anticipation, or escalating arena transformation. The death separates props and collapses successfully, but reads as pieces falling apart rather than a spectacular authored defeat.

### Combat motion and feel — 3.0/5, FAIL

The evidence closes the previous absence of continuous motion: attack phases, transformation out/in, enemy pursuit/death, boss phases, and boss defeat are visible without T-pose, mesh explosion, or fatal state lock. It does not establish commercial tactile quality. Foot planting, root motion, recoil, hit-stop, reaction duration, cloth follow-through, per-enemy timing variation, and audio synchronization remain weak or ungraded. Contact is readable but lightweight.

### UI and audio — UI 3.0/5; audio ungraded

The HUD is coherent and the final production-normal capture has intact glyphs. Critical text and cooldown labels remain very small and low-contrast at 1280×720. No audible real-time recording was supplied, so audio quality, spatial placement, repetition, mix headroom, impact synchronization, and boss escalation cannot be honestly scored.

## Acceptance gate disposition

| Gate | Result | Supervisor finding |
|---|---|---|
| Nightbound rendered quality ≥3.5 | **FAIL** | Authored and stable, but only 3.0–3.2/5; anatomy, costume layering, deformation, and grounding remain visibly mid/low-poly. |
| Representative enemy quality ≥3.5 | **FAIL** | Four actors and death are proven; cloned poses, rigid anatomy, weak variation, and fast/occluded death keep it ~2.9/5. |
| Bell-Saint rendered quality ≥3.5 | **FAIL** | Distinct authored silhouette and full state integrity; flat slabs, tangencies, shallow deformation, and geometric spectacle keep it ~3.1/5. |
| Motion/deformation | **PARTIAL / QUALITY FAIL** | No T-pose or catastrophic tearing in evidence; action phases exist, but force, foot planting, secondary motion, and reaction quality are below target. |
| Loading/fallback/runtime | **PASS WITH EVIDENCE LIMIT** | Exact final production normal-load is proven and earlier live fallback is playable. The exact final production fallback screenshot could not be captured because the in-app browser security policy blocked that navigation and prohibited retry; therefore visual equivalence of that exact combination remains unverified. |
| LOW/HIGH performance | **PASS on measured host** | LOW 60.00 average / 56.25 1% low; locked HIGH 60.00 / 55.97; 30 s each; 0 console issues; flat texture/program counts and falling object/geometry counts in-window. HIGH was DPR 1.0, not the tier's 1.25 maximum. |
| Storage/bundle | **PASS** | `dist` 15.50 MiB; entry 748,217 B / 198,468 B gzip; project excluding `node_modules` 334.14 MiB; no Blender/cache artifacts in `dist`. |
| Automated/static build | **PASS** | Independent `npm test`: typecheck, 8/8 contracts, production build, and 2/2 static tests passed. Raw entry still triggers Vite's >500 kB advisory. |

## Performance and storage interpretation

The LOW result preserves the V10 frame-pacing baseline despite a 57% rise in end-of-sample triangles and 15% rise in draw calls. HIGH also stays at the 60 Hz cap on the Apple M5 host. This is credible evidence of current-scene stability, not broad hardware certification: production-preview timing, HIGH DPR 1.25, Ultra, integrated GPUs, and repeated restart/Phase III leak cycles remain unmeasured.

Storage is comfortably within the approved budget. Review evidence is now 256.57 MiB and 76.8% of project size excluding dependencies; it is justified for audit but should be archived/compressed at later checkpoints. The deployable GLBs total about 10.73 MiB and dominate `dist`, while Blender sources and ImageGen-derived material sources remain outside the deployment.

## What Version 11 genuinely achieved

1. Established an original local GLB/skinning/clip pipeline with graceful fallback rather than only procedural actor assemblies.
2. Replaced the principal player, representative enemy, and boss presentation with authored assets without breaking transformation, encounter, retry, or boss completion state.
3. Added real uninterrupted evidence for player attack/transform, representative enemy death, and a complete boss run.
4. Preserved capped 60 Hz delivery on the measured host at both recorded tiers and stayed far inside storage limits.

These are meaningful engineering and production-pipeline achievements. They are not evidence of commercial visual parity.

## Mandatory priorities if Version 12 is later approved

1. **Character art and rigging:** rebuild Nightbound/Husk/Bell-Saint around higher-quality authored anatomy, layered costume topology, hands/feet/face, baked normal/roughness detail, cleaner skin weights, and cloth/secondary bones. One excellent hero plus one enemy should be completed before adding content.
2. **Animation quality:** use stronger keyed root/hip/shoulder arcs, planted-foot locomotion, attack anticipation and overshoot, recoil/hit reaction, directional recovery, varied enemy timing, and boss phase-transition performances. Review close 60 fps captures, not only stills.
3. **World density/material hierarchy:** replace the gravel carpet with quiet/active macro zones, wet-mud-moss transitions, blended banks, clustered foliage, authored ruins/landmarks, foreground frames, and deliberate light pools while preserving combat readability.
4. **Boss spectacle:** create genuinely different phase topologies and arena responses, animation-led telegraphs, local lighting, layered particles/debris, reactive props/ground, strong aftermath, and a bespoke defeat sequence.
5. **Combat feel and audiovisual proof:** capture real-time video with audio; tune hit-stop, shake, impulse, contact VFX, reaction windows, transient punch, spatial mix, and masking together.
6. **Evidence/runtime follow-up:** obtain an exact final production fallback capture through an approved harness; run production-preview frame timing, DPR 1.25 HIGH, representative lower-end GPU tests, and repeated boss/restart resource cycles.

## Final directive

**Version 11 may be recorded as a completed iteration loop, but it is rejected as a commercial visual-quality milestone. Do not start Version 12. Stop and wait for the user's explicit approval.**
