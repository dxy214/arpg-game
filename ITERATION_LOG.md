# Iteration Log

Version numbers advance only after a complete implementation, launch, playtest, rendered inspection, critique, fix, and regression loop. Five-version checkpoints then stop for user approval.

## Version 1 — Foundation and form identity

Status: Complete — iteration pass; checkpoint quality rejected

### Implemented

- Vite/TypeScript/Three.js WebGL2 runtime, fixed-step module lifecycle, responsive canvas, ACES tone mapping, shadows, performance sampling, and deployable static build.
- Camera-relative WASD movement, mouse aim, buffered attacks, dash, health/resource/cooldowns, hit reactions, projectiles, and four complete form kits.
- Initial Hollow March route, four enemy archetypes, mixed packs, Gloam Castellan elite, and three-phase Bell-Saint boss.
- Live HUD, form selector, boss health/phase presentation, procedural ambient/audio cues, weather, particles, and death/victory states.

### Rendered/playtest evidence

- `reviews/evidence/v1-fix-idle-13s.png` — full-health safe opening after 13 seconds idle.
- `reviews/evidence/v1-fix-dreadwolf-pack.png` — deliberate traversal, Dreadwolf switch, attack VFX, and first-pack engagement.
- Browser console was clean in repeated first-launch/form/death checks.
- `npm run typecheck` and `npm run build` pass; Vite reported only a large-chunk warning.

### Supervisor assessment

- Initial score approximately 0.8/5 because commercial-quality categories were unverified and the build began with a failing TypeScript gate.
- After fixes: **ITERATION PASS / CHECKPOINT QUALITY REJECTED**. Safe opening defect SUP-003 closed. Primitive actors, crushed blacks/flat materials, and unverified full form/elite/boss run carried forward as P1 defects.

### Defects fixed in this loop

- Production build errors across core/gameplay/encounter/effects/world/audio modules.
- Opening pack no longer kills an idle first-time player; it was moved beyond initial aggro and a 4.5-second grace was added.
- Enemy attack aim now locks at tell start; pack spacing, ranged kiting, and early encounter fairness improved.
- Boss phase callback spam, missing defeat callback, hazard disposal, and overlapping hazard burst damage were corrected.

### Remaining risks

- Procedural actors and environment read as low-poly primitives rather than commercial-quality authored art.
- Full boss completion, all form combat kits, elite, death/retry, and victory still require continuous rendered verification.
- Deep shadows obscure material response and action readability.

## Version 2 — The hunt and the world

Status: Complete — iteration pass; checkpoint quality rejected

### Implemented

- Dense biome/art pass: ground variation, organic water, instanced forest/rocks/graves, chapel/aqueduct/gate landmarks, arena runes, mist, wisps, rain, fire, and revised causeway.
- Encounter pass complete: role spacing and vulnerabilities, heavy interrupts, precise elite lane/radius tells, phase-specific boss form affinities, and multi-hit protection.
- Four articulated procedural player rigs with form-specific locomotion, attacks, silhouettes, secondary motion, transformation effects, and pooled combat VFX.
- Rebuilt HUD and field guide with live form mechanics, cooldowns, resources, boss state, damage feedback, audio status, and authored death/victory presentation.
- Layered procedural audio system with ambience, movement/combat/form cues, phase bells, compression, and visibility-aware suspend/resume.
- Articulated Bell-Saint presentation with layered reliquary armor and vestments, crozier/censer limbs, mask/crown/halos, phase mutations, anticipation poses, and higher-contrast floor tells.
- QA-only scenario entry points enabled deterministic rendered inspection of the elite and complete boss sequence; normal play does not enable their invulnerability option.

### Rendered/playtest evidence

- `reviews/evidence/v2-world-pass.png` — first biome art-pass establishing shot.
- `reviews/evidence/v2-ui-audio-unlocked.png` — authored Nightbound rig, revised HUD, and running Web Audio state.
- `reviews/evidence/v2-field-guide.png` — readable transformation/combat field guide.
- `reviews/evidence/v2-elite-dreadwolf-telegraph.png` and `v2-elite-stonewrought-defeated.png` — Gloam Castellan engagement and verified defeat result.
- `reviews/evidence/v2-boss-articulated-phase1.png`, `v2-boss-phase2-wraith.png`, `v2-boss-phase3-stonewrought.png`, and `v2-boss-victory.png` — authentic sequential Phase I→II→III→victory evidence with phase-appropriate forms.
- Browser console remained clean during the captured boss and elite runs.
- Final `npm run typecheck` and `npm run build` passed; production JS measured 638.28 kB minified / 167.62 kB gzip with only Vite's large-chunk advisory.

### Supervisor assessment

- **ITERATION PASS / CHECKPOINT QUALITY REJECTED**, approximately 1.9/5.
- Authentic boss I→II→III→victory and elite engagement→defeat are now evidenced. Controls/title overlap, opening fairness, and build defects are closed.
- World layering, HUD communication, form identity, and boss silhouette improved materially, but the result still does not meet the requested modern commercial art/feel bar.

### Defects fixed in this loop

- Replaced cone-like player placeholders with four mechanically and visually distinct articulated rigs.
- Reworked the environment into a denser authored route and lifted crushed midtones.
- Removed the location/control overlays during the boss encounter and made phase vulnerability/status truthful to live state.
- Rebuilt the boss silhouette and telegraphs, fixed phase announcements, and verified the real sequential state changes through victory.
- Relocated the elite encounter out of the aqueduct's worst occlusion and verified engagement and defeat.

### Remaining risks

- Bespoke model/material fidelity, terrain surface breakup, contact grounding, and structure occlusion remain well below the target reference bar.
- Full form-kit motion and subjective combat feel remain incompletely recorded even though state/UI evidence exists.
- Audio has been functionally verified but not perceptually graded; end-to-end frame-time lows and uninterrupted-run evidence remain outstanding.
- Boss entrance geometry still intrudes on some camera angles, and the vestment materials remain visually flat.

## Version 3 — Boss spectacle and run integrity

Status: Complete — iteration pass; checkpoint quality rejected

### Planned focus

- Verify and polish the boss approach, Phase I→II→III transitions, death/retry, and victory as one coherent run.
- Remove remaining arena-entry occlusion and strengthen boss attack anticipation/readability without changing the established combat contract.
- Capture truthful rendered death/retry and post-victory states, then complete supervisor critique, fixes, regression, and build gates before closing the version.

### Implemented so far

- Added a smooth encounter-aware dissolve to the processional gate so it remains an approach landmark but no longer blocks player silhouettes or boss floor tells during combat.
- Retained the tighter, higher boss camera while keeping arena-scale rings, hazards, and peripheral monoliths visible.
- Exercised normal-damage defeat and Enter-to-retry, then completed a fresh QA-assisted but mechanically sequential Phase I→II→III→victory run after the occlusion fix.

### Fresh rendered/playtest evidence

- `reviews/evidence/v3-death.png` and `v3-retry.png` — normal-damage defeat overlay and successful active Phase I restart.
- `reviews/evidence/v3-phase1-postfix.png`, `v3-phase2-postfix.png`, and `v3-phase3-postfix.png` — fresh post-fix phase sequence with truthful live HUD state and phase-appropriate forms.
- `reviews/evidence/v3-victory-postfix.png` — fresh post-fix victory state.
- Browser warn/error log was empty for the completed run.
- `npm run typecheck` and `npm run build` pass; production JS is 638.95 kB minified / 167.81 kB gzip, with only Vite's existing chunk-size advisory.

### Supervisor assessment

- **ITERATION PASS / CHECKPOINT QUALITY REJECTED**, approximately 2.1/5.
- The exact death→retry→Phase I→II→III→victory sequence passes. The encounter-aware gate dissolve is accepted, the foreground occlusion defect SUP-006 is closed, and runtime/build gates are green.
- Boss authorship and readability now score approximately 3.2/5, but commercial fidelity is still rejected because vestments remain faceted, materials and orb hazards remain simple, and timing/impact/audio/fairness lack sufficient recorded evidence.
- SUP-001, SUP-004, and SUP-005 carry into Version 4.

## Version 4 — Performance and combat evidence

Status: Complete — iteration pass; hard quality rejected

### Planned focus

- Add repeatable automated checks for runtime architecture, transformation mechanics, encounter state integrity, and production-build requirements.
- Measure real browser frame timing in representative traversal, mixed-pack, elite, and boss/VFX conditions; investigate any sub-45 FPS lows.
- Verify resize, focus loss/recovery, restart, console cleanliness, and static-build serving in the actual browser.
- Capture the missing movement/primary/secondary/traversal evidence for each form and address the highest-impact responsiveness/readability defects before supervisor re-review.

### Implemented so far

- Added an opt-in 30-second browser telemetry probe with average FPS, 1%-low, median/p95/p99/max frame time, draw calls, triangles, renderer resources, object-count deltas, viewport/quality, browser, and WebGL metadata.
- Added deterministic blank-baseline and forced-quality QA modes, 1 Hz probe presentation, and a three-step fixed-update catch-up cap to prevent focus/background hitches from cascading into simulation debt.
- Added downward runtime quality adaptation, low-tier shadow disable, responsiveness-first pixel-ratio caps, reduced transparent ambience, and boss-only world culling.
- Replaced 28 individual arena monolith/crystal objects and geometries with two static instanced draws while restoring the complete arena ornament ring.
- Added hidden live canvas telemetry for one-second FPS/frame-time/draw/triangle readings without exposing a debug overlay in normal play.
- Expanded automated coverage to runtime/WebGL2 contracts, form differentiation, QA routes, enemy roster, boss thresholds/cleanup, bounded effects, static build integrity, and plain static-host resolution.

### Fresh rendered/playtest evidence

- `reviews/evidence/v4-nightbound-blood-crescent.png`, `v4-wraith-veil-burst.png`, `v4-dreadwolf-pounce.png`, and `v4-stonewrought-slam.png` — distinct secondary/Form Art states.
- `reviews/evidence/v4-nightbound-traverse-primary.png`, `v4-wraith-traverse-primary.png`, `v4-dreadwolf-traverse-primary.png`, and `v4-stonewrought-traverse-primary.png` — traverse cooldown/state plus immediate primary contact/trajectory for each form.
- `reviews/evidence/v4-performance-phase3.png` through `v4-performance-phase3-candidate3.png` — truthful failed and improving performance candidates; structured JSON and analysis are under `reviews/performance/`.
- Automated tests and the production build pass; final controlled performance candidate and supervisor disposition remain pending.

### Supervisor assessment

- **ITERATION PASS / HARD QUALITY REJECTED**, approximately 2.3/5.
- SUP-005 closed from paired Form Art and primary/traverse evidence for every form. Static-host, resize, restart, console, and resource-stability checks pass.
- Empty-scene baseline measured 54.96 FPS average with severe IAB tail hitches. Best warmed Phase III timing was 45.54 FPS average / 32.98 FPS 1%-low; the final structurally leaner build measured 43.26 / 29.86 at LOW DPR 0.65 with 76 steady draw calls.
- No 60 FPS or ≥45 FPS 1%-low claim is made. SUP-007 remains P1, and real focus blur/resume is explicitly unverified after controlled-tab, new-tab, address-bar, and Codex-panel focus attempts all left the in-app document visible/focused.
- Low tier is visibly softer and the boss arena is flatter than the high-tier composition; commercial performance and fidelity remain rejected.

## Version 5 — Checkpoint polish and release audit

Status: Complete — iteration pass; checkpoint quality rejected

### Planned focus

- Perform a final visual/readability polish pass that does not undo Version 4 stability, concentrating on material response, boss arena depth, and combat contrast.
- Run the complete automated suite and a clean production-preview smoke test, then re-check representative roaming, elite, all-form, boss, death/retry, and victory evidence.
- Finalize launch/build documentation, evidence index, five-version summary, honest supervisor checkpoint assessment, remaining defects, and proposed Versions 6–10 priorities.
- Stop after the Version 5 supervisor loop and wait for explicit user approval; do not begin Version 6.

### Implemented

- Integrated an original generated Hollow March ground albedo, retained procedural roughness breakup, and rebalanced the one-draw instanced causeway for readable moss-stone route values.
- Replaced the opaque Nightbound projectile blob with a broad additive blood blade and gave Wraith Veil Burst a directional pooled arc, without increasing the established transient draw budget.
- Added no-mesh-cost value breakup to the Bell-Saint vestments and deterministic nonuniform scale, rotation, and phase-value variation to radial hazards.
- Corrected the first hazard-variation pass after rendered rejection: phase-transition orbs now retain bright, untone-mapped cyan/amber cores at normal and LOW quality while preserving count, damage, collision, and draw structure.
- Added disclosed `capture=1` QA acceleration for browser evidence. It multiplies incoming boss damage only; live phase thresholds, attacks, affinities, hazards, transitions, and victory remain unchanged.
- Finalized the checkpoint README, exact launch/build/test instructions, evidence index, performance report/JSON, defect register, and proposed Versions 6–10 priorities.

### Fresh rendered/playtest evidence

- `reviews/evidence/v5-world-wide.png` — final generated ground treatment, balanced causeway, authored route, rain, and SOUND AWAKENED state.
- `v5-nightbound-crescent.png`, `v5-wraith-veil.png`, `v5-dreadwolf-lunge.png`, and `v5-stonewrought-slam.png` — all four form silhouettes and revised combat effects in live encounters.
- `v5-boss-phase1.png`, `v5-boss-phase2.png`, `v5-boss-phase3.png`, and `v5-boss-victory.png` — authentic sequential phase labels/affinities and victory; Phase II uses Wraith/Spectral and Phase III uses Stonewrought/Crush.
- `v5-low-phase3-hazards.png` — exact-current-build LOW DPR 0.65 proof that amber Phase III pressure remains unmistakable.
- `v5-performance-final.png` and `reviews/performance/v5-phase3-final.json` — post-readability 30-second Phase III sample: 60.0 FPS average, 56.23 FPS 1%-low, 16.7 ms median, 17.7 ms p99, 72 final calls, and no console warnings/errors.
- Final `npm test` passes strict typecheck, 8/8 contracts, production build, and 2/2 static-output tests. JS is 652.03 kB minified / 172.11 kB gzip plus the 421.62 kB ground JPG; the existing Vite chunk advisory remains.

### Supervisor assessment

- **ITERATION PASS / CHECKPOINT QUALITY REJECTED**, weighted verified score approximately 2.7/5.
- SUP-007 (tested LOW-tier performance) and SUP-010 (normal/LOW boss-hazard readability) are closed after exact post-fix evidence and regression.
- SUP-001 remains P0: no inspectable uncut, audio-on, normal-damage full run covering exploration, packs, elite, forms, death/retry, all boss phases, victory, feel, and a true focus-loss test.
- SUP-004 remains P1: player/enemy anatomy, locomotion, combat animation, material hierarchy, contact grounding, and wide-scene values still read as procedural/faceted rather than modern commercial production art.
- Formal review: `reviews/VERSION_5_REVIEW.md`; checkpoint handoff: `reviews/CHECKPOINT_V5.md`.

### Mandatory checkpoint stop

Versions 1–5 are complete. Implementation stops here. Version 6 must not begin without explicit user approval.

## Version 6 — Commercial-art reference pass

Status: Complete — iteration pass; visual quality rejected

### Planned focus

- Establish a reference-only corpus of official V Rising gameplay screenshots and a repeatable side-by-side visual scoring protocol; none of the reference material may ship as a game asset.
- Improve the authored Hollow March route's material hierarchy, ground contact, environmental density, lighting depth, and navigation values while preserving the Version 5 performance gate.
- Improve original player silhouettes, material separation, pose language, attack contact, and spell shape/edge/core hierarchy without copying proprietary characters, effects, or animations.
- Capture matched current-build world, player, mixed-combat, transformation, and boss frames; let the independent supervisor reject or accept the rendered result against the fixed reference rubric.
- Complete launch, playtest, visual comparison, critique, responsible-owner fixes, retest, automated tests, and an honest Version 6 review before Version 7 begins.

### Implemented

- Saved a fixed, reference-only set of official V Rising Steam screenshots and documented their sources; none are imported by the runtime.
- Added a repeatable visual comparison protocol with fixed world, character, VFX, transformation, boss, camera, material, lighting, and performance criteria.
- Expanded the Hollow March with wet-surface breakup, road-edge debris, leaves, ferns, tree roots/contact shadows, moss/value variation, and additional chapel masonry, windows, buttresses, rubble, tiles, and cool local lighting.
- Rebuilt the Nightbound and Dreadwolf presentations with layered original procedural anatomy, costume/armor materials, masks, boots, claws, mane, and more articulated traversal/attack posing.
- Rebuilt five enemy visual archetypes with original segmented anatomy, role-specific clothing/armor, heads, weapons/casting props, locomotion, anticipation, release, and recovery poses.
- Upgraded pooled attacks, dashes, transformations, and impacts to use bright cores, saturated bodies, shaped edges, and secondary pooled accents.
- Added `tooling/capture-visual-evidence.mjs` for controlled, repeatable real-Chrome evidence capture and fixed the only observed console 404 with a self-contained favicon.

### Fresh rendered/playtest evidence

- `reviews/evidence/v6-compare-world.png`, `v6-compare-character.png`, `v6-compare-vfx.png`, `v6-compare-transformation.png`, `v6-compare-enemies.png`, and `v6-compare-boss.png` — fresh HIGH-quality real-browser six-state set.
- `reviews/evidence/v6-reference-board.jpg` — current build and fixed official references presented together.
- The post-fix controlled run reported `consoleIssues=[]` at 1280×720 HIGH.
- Final `npm test` passes typecheck, 8/8 contracts, production build, and 2/2 static deployment tests. Bundle: `index-HGIxwe9e.js`, 666.78 kB minified / 176.26 kB gzip; the existing chunk advisory remains.

### Supervisor assessment

- **ITERATION PASS / VISUAL QUALITY REJECTED**, approximately 2.0/5 against the fixed commercial reference.
- The new six-state capture closes SUP-001. The corrected boss frame removes stale intro text and dominant gate occlusion.
- SUP-004 remains P1 for primitive actor anatomy/materials and unproven motion quality; SUP-012 remains P1 for crushed, sparse, repeated world values; SUP-013 remains P1 for generic VFX/boss spectacle; SUP-014 remains P2 because transformation/motion/frame-time evidence is still based on isolated frames.
- Formal review: `reviews/VERSION_6_REVIEW.md`.

## Version 7 — Authored materials and value hierarchy

Status: Complete — iteration pass; visual quality rejected

### Planned focus

- Integrate original generated, runtime-safe terrain/material/VFX assets rather than relying only on flat procedural colors.
- Rebalance the playable route's local exposure, bounce, fog, path edges, foliage grouping, and landmark values so detail survives at normal gameplay scale without flattening the nocturnal mood.
- Re-capture the six fixed states, build a new reference board, measure the performance cost, complete supervisor rejection/fix/retest, and close the version before Version 8.

### Implemented

- Generated and integrated a new original 1024² rain-soaked peat/mud/slate albedo; preserved the source prompt and processing record under `reviews/assets/`.
- Added safe asynchronous texture binding, sRGB/NoColorSpace separation, wrap/repeat/anisotropy, wetland material sharing, path mud beds, smaller broken slabs, denser shoreline sampling, and reduced contact-shadow crushing.
- Rebalanced ACES exposure, fog, hemisphere/fill/moon lighting, shadow frustum/quality, player-follow fill, and a boss-only local value island while keeping LOW shadows disabled.
- Consolidated 34 ground overlays into six instanced batches and retained all 84 trees while moving only camera-strip occluders to deterministic side bands.
- After supervisor rejection, reduced terrain contrast/saturation, doubled shore contour sampling, removed the central combat trunk obstruction, and strengthened pooled attack/contact cores, rings, and directional arcs without increasing peak object count.

### Fresh rendered/playtest evidence

- Fresh post-fix `reviews/evidence/v7-compare-*.png` six-state set at 1280×720 HIGH; the controlled Chrome run reports `consoleIssues=[]`.
- `reviews/evidence/v7-reference-board.jpg` places the post-fix world/combat frames beside the fixed official references.
- Final `npm test` passes typecheck, 8/8 contracts, production build, and 2/2 static tests. Bundle: `index-BOwZnoNp.js`, 669.40 kB / 177.07 kB gzip; existing chunk advisory remains.
- Automated Phase III perf driving failed to reach Phase III twice and is not presented as a performance result; V7 makes no new frame-time claim.

### Supervisor assessment

- **ITERATION PASS / VISUAL QUALITY REJECTED**, approximately 2.2/5.
- Terrain/material/lighting readability is a real improvement and SUP-015 closes after the camera-strip trunk fix.
- SUP-004, SUP-012, SUP-013, and SUP-014 remain open: procedural actors, uniform gravel/slabs, thin/generic VFX, and missing motion/frame-time proof remain below the commercial reference.
- Formal review: `reviews/VERSION_7_REVIEW.md`.

## Version 8 — Authored combatant silhouettes and motion

Status: Complete — iteration pass; visual quality rejected

### Planned focus

- Improve original player/enemy anatomy, costume/armor silhouette, surface materials, locomotion, attack anticipation/contact/recovery, and transformation motion at actual gameplay scale.
- Preserve the V7 environment readability and performance structure; do not add world scope or mechanics.
- Capture the same six states, add short motion evidence where tooling permits, compare against the fixed official character/combat references, complete rejection/fix/retest, and close before Version 9.

### Implemented

- Generated and integrated original 512² crimson ritual-cloth and blackened-steel albedos with documented prompts/provenance, safe async loading, disposal guards, sRGB/repeat/aniso configuration, and explicit cleanup.
- Refined all four player forms with smoother major masses and clearer material/armor/anatomy hierarchy; substantially rebuilt Stonewrought's chest, core, shoulders, fists, knees, feet, cracks, and edge plates.
- Replaced attack-lock posing with bounded anticipation→contact→recovery phase timing and added form-specific weight shift, locomotion cadence, torso/head follow, hurt deformation, dash posture, and transformation compression/twist.
- Rebuilt enemy anatomy with lathed torsos, capsule limbs, rounded feet, forged masks, emissive eye slits, hands/guards/grips/blades, cached shared materials, and role-specific locomotion/attack/recovery/hurt poses.
- Fixed enemies playing walk motion while stationary in attack range.
- After supervisor rejection, lifted Stonewrought into cool-slate midtones, separated armor planes, added restrained amber anchors, splayed the attack pose, and changed the capture route to stage readable player/target separation and peak contact.

### Fresh rendered/playtest evidence

- Post-fix `reviews/evidence/v8-compare-*.png` six-state real-browser set at HIGH 1280×720, `consoleIssues=[]`.
- `reviews/evidence/v8-reference-board.jpg` compares the post-fix Stonewrought and contact state beside fixed official character/combat references.
- Final `npm test` passes typecheck, 8/8 contracts, production build, and 2/2 static tests. Bundle: `index-BT2Cq7Hd.js`, 675.89 kB / 179.02 kB gzip; runtime textures are 68.86 kB and 74.33 kB.

### Supervisor assessment

- **ITERATION PASS / VISUAL QUALITY REJECTED**, approximately 2.3/5.
- SUP-016 closes because Stonewrought remains independently readable in the arena; the staged contact frame also closes the basic hit-readability failure.
- SUP-004 remains for procedural/unsinned asset fidelity, SUP-012 remains for world repetition, SUP-013 remains for commercial VFX depth, and SUP-014 remains for missing motion/frame-time proof.
- Formal review: `reviews/VERSION_8_REVIEW.md`.

## Version 9 — Impact, phase spectacle, and motion evidence

Status: Complete — iteration pass; visual quality rejected

### Planned focus

- Deepen original combat VFX with shaped trails, target reaction, restrained debris, terrain contact, and form-specific impact language while keeping pools bounded.
- Improve Bell-Saint phase spectacle and arena response without changing the validated boss mechanics, phase thresholds, or damage readability.
- Capture short real-browser motion evidence in addition to the six fixed still states; complete supervisor rejection/fix/retest and close before Version 10.

### Implemented

- Reworked EffectDirector into form-specific layered languages: crimson scissor/crescent cuts, cyan soul lances/veil, magenta claw rakes/pounce response, and broad amber weight arcs/debris/ground rings.
- Hard-capped effects at 230 pooled meshes sharing 13 geometry buffers, with no runtime effect-record/mesh creation and graceful optional-decoration drops on exhaustion.
- Added distinct Bell-Saint phase materials, silhouette/pose/halo/mote behavior, anticipation, reusable phase-burst and arena-floor pulses, phase-responsive veil, and radial hazard trails/contact rings with complete cleanup; combat mechanics/timings were unchanged.
- Rebuilt procedural audio around limiter-safe low/mid/high buses, form/slot/impact-specific structures, elite/boss authored layers, differentiated phase bells, ambience ducking, one startup noise buffer, and hardened visibility/focus resume.
- Added real-Chrome motion capture tooling that records frame sequences without external ffmpeg, assembles a 105-frame animated WebP, and generates an inspectable motion contact sheet.
- Added a deterministic same-run Phase I→II→III capture tool with authentic form swaps and phase labels.
- After supervisor rejection, extended camera-strip tree relocation through the boss approach while retaining all 84 instances, re-recorded the motion sequence, and captured active pink Phase-I and amber Phase-III unsafe fields.

### Fresh rendered/playtest evidence

- Post-fix `reviews/evidence/v9-compare-*.png`, `v9-boss-phase1.png`, `v9-boss-phase2.png`, `v9-boss-phase3.png`, `v9-boss-phase1-active.png`, and `v9-boss-phase3-active.png`.
- `reviews/evidence/v9-motion-evidence.webp` is a 105-frame controlled real-Chrome sequence; `v9-motion-contact-sheet.jpg` is the inspectable five-state sample. Both post-fix runs report clean consoles.
- `reviews/evidence/v9-reference-board.jpg` compares current contact/phase spectacle with the fixed official reference set.
- Final `npm test` passes typecheck, 8/8 contracts, production build, and 2/2 static tests. Exact bundle: `index-aQ32AGUa.js`, 691.56 kB / 183.32 kB gzip.

### Supervisor assessment

- **ITERATION PASS / VISUAL QUALITY REJECTED**, approximately 2.6/5.
- SUP-015 closes again because the full motion path keeps Stonewrought/attacks visible. Active Phase-I and Phase-III threat evidence is accepted.
- SUP-013 remains P1 for repeated projectile topology, cyan Wraith/boss value merging, and limited deformation/aftermath. Actor/world commercial-fidelity gaps and perceptual audio/performance proof remain open.
- Formal review: `reviews/VERSION_9_REVIEW.md`.

## Version 10 — Final checkpoint stabilization and commercial-gap audit

Status: Complete — iteration pass; checkpoint quality rejected

### Planned focus

- Apply only bounded, performance-safe corrections to the most visible remaining world, Wraith/boss separation, and hazard-topology defects.
- Re-run full automated tests, static preview, six-state capture, authentic boss phases, real motion evidence, and a 30-second LOW worst-case performance sample.
- Produce the final Version 10 reference board, supervisor review, Versions 6–10 checkpoint summary, exact launch instructions, honest remaining gaps, and proposed next priorities.
- Stop after Version 10 and wait for explicit user approval; do not begin Version 11.

### Implemented

- Replaced the regular route stones with a still-instanced, asymmetric chipped silhouette, vertex moss/side shading, and restrained per-instance shape/value variation; aligned pond bank, water, and shoreline contours and removed the bright polygon seam without adding draw calls.
- Separated Wraith from the cyan boss phase using a depth-writing indigo core, translucent blue-violet veils, bone-lavender mask/hands, and restrained cyan energy accents, with no new geometry or draw calls.
- Diversified the Bell-Saint's existing radial hazards across four shared core topologies, varied trail/contact proportions and orientation, and added bounded fade/expansion aftermath using the existing pieces; boss counts, damage, timing, collision, thresholds, and phase mechanics are unchanged.
- Re-recorded all six fixed visual states, a 105-frame real-Chrome motion sequence, authentic same-run Phase I→II→III evidence, active Phase I/III threat fields, a fixed-reference board, and a LOW-quality Phase III hazard-readability frame. Controlled runs reported no console warnings/errors.
- Repaired the deterministic Phase III performance driver and completed a warmed 30-second LOW/DPR 0.65 stress sample: 60.0 FPS average, 56.2 FPS 1%-low, 16.7 ms median, 17.7 ms p99, 79 ending draw calls, and no texture/program growth.

### Fresh rendered/playtest evidence

- `reviews/evidence/v10-compare-*.png` — final HIGH 1280×720 world, transformation, character, VFX, mixed-enemy, and boss states.
- `reviews/evidence/v10-motion-evidence.webp` and `v10-motion-contact-sheet.jpg` — 105-frame real-Chrome movement/combat/transformation/boss-entry sequence.
- `reviews/evidence/v10-boss-phase1-active.png`, `v10-boss-phase2.png`, and `v10-boss-phase3-active.png` — authentic counter-form and active-threat phase evidence.
- `reviews/evidence/v10-low-phase3-hazards.png` — final LOW/DPR 0.65 projectile readability after the topology pass.
- `reviews/evidence/v10-reference-board.jpg` — final build presented beside the fixed official reference set.
- `reviews/evidence/v10-performance-final.png` and `reviews/performance/v10-phase3.json` — exact 30-second Phase III telemetry and structured result.
- Final `npm test` passes typecheck, 8/8 contracts, production build, and 2/2 static tests. Exact entry: `index-C1Pt-ALM.js`, 693.20 kB minified / 183.93 kB gzip; the existing Vite chunk advisory remains.

### Supervisor assessment

- **ITERATION PASS / CHECKPOINT QUALITY REJECTED**, approximately 2.8/5.
- Runtime stability and LOW-tier performance are strong, the route repetition is reduced, Wraith separates better from Phase II, and projectile silhouettes are more varied.
- SUP-004, SUP-012, and SUP-013 remain P1: actors/animation are still procedural and toy-like, the biome remains sparse/repetitive, and boss phases still depend on similar radial spoke patterns with weak deformation/aftermath.
- SUP-014 remains P2 for close tactile/audiovisual timing; SUP-017 opens P2 for tiny low-contrast HUD text; SUP-018 opens P2 because no audible gameplay capture exists.
- Formal review: `reviews/VERSION_10_REVIEW.md`; checkpoint handoff: `reviews/CHECKPOINT_V10.md`.

### Mandatory checkpoint stop

Versions 6–10 are complete. Implementation stops here. Version 11 must not begin without explicit user approval.

## Version 11 — Authored skinned-asset pipeline validation

Status: Complete — ITERATION PASS / VISUAL QUALITY REJECTED (2026-08-11)

### Planned focus

- Add a static-build-safe GLTF/skinning/animation runtime with asynchronous preload, safe procedural fallback, deterministic animation aliases, clone/disposal correctness, and bounded per-frame work.
- Create three wholly original Blender-authored validation assets: Nightbound, the common Husk Mourner, and the Bell-Saint boss, each with an armature, skinned deformation, layered PBR-compatible materials, and idle/move/attack/hurt clips.
- Replace presentation only; preserve every validated movement, combat, transformation, enemy, elite, boss, damage, timing, phase, and QA mechanic.
- Inspect all three assets at the actual isometric camera scale and in motion, compare homologous states with the fixed official V Rising review corpus, and reject any asset that still reads as a procedural toy.
- Re-run real-browser console, motion, boss-phase, storage/bundle, and worst-case performance evidence; complete independent supervisor rejection/fix/retest before closing Version 11.
- Stop after Version 11. Do not begin Version 12 without explicit user direction.

### Completed implementation

- Added a static-build-safe, asynchronously loaded GLTF/skinning/animation runtime with isolated clones, clip aliases, reference-safe disposal, and immediate procedural fallback if an asset or the lazy runtime chunk fails.
- Created three wholly original Blender-authored skinned assets: Nightbound (8,766 triangles, 21 bones, 6 clips), Husk Mourner (7,128 triangles, 21 bones, 5 clips), and Bell-Saint (10,660 triangles, 25 bones, 6 clips). Deterministic Blender sources, validation tooling, previews, and provenance remain inside the project.
- Integrated authored idle/move/attack/hurt/death, Nightbound transform, and Bell-Saint phase-pose presentation without changing validated movement, damage, cooldown, encounter, transformation, or boss mechanics.
- Fixed authored one-shot interruption and visual-form timing so Nightbound attack, transformation exit/entry, enemy death, phase staging, and boss death remain visible through their intended action windows.
- Added an explicit quality-query lock for honest LOW/HIGH QA while retaining adaptive quality for normal auto-detected play.

### Completed evidence and verification

- Captured final gameplay-scale Nightbound, four-Husk group, isolated Husk death, Nightbound attack/transformation motion, same-run Bell-Saint Phase I→II→III→death→victory, death/retry, and production-normal evidence.
- Built `reviews/evidence/v11-reference-board.jpg` against the fixed official V Rising character, enemy, world, and boss references. The comparison visibly rejects parity rather than relying on feature claims.
- Final `npm test` passed: strict TypeScript, 8/8 runtime contracts, production build, and 2/2 static-distribution tests.
- Locked LOW Phase III measured 60.00 FPS average / 56.25 FPS 1%-low; locked HIGH measured 60.00 / 55.97 on the Apple M5 test host, both with clean consoles. HIGH was limited to DPR 1.0 by the test browser.
- Deployable `dist` is 15.50 MiB; entry is 748,217 bytes / 198,468 bytes gzip; project excluding `node_modules` is 334.14 MiB; no Blender source or cache artifacts enter `dist`.

### Supervisor assessment

- **ITERATION PASS / VISUAL QUALITY REJECTED**, approximately 3.0/5 overall. The authored asset pipeline is a genuine production and stability improvement, but Nightbound remains only 3.0–3.2/5 against the required 3.5/5 floor.
- Character anatomy, costume layering, hands/feet/face, material response, skin deformation, cloth secondary motion, foot planting, attack weight, enemy variation, biome density, boss phase topology, UI readability, and perceptually graded audio remain below modern commercial and V Rising reference quality.
- Exact-final production normal loading is proven. Exact-final production forced-fallback visual capture remains unverified because the in-app browser security policy blocked the navigation and prohibited retry; functional runtime fallback and earlier rendered fallback evidence pass.
- Formal review: `reviews/VERSION_11_REVIEW.md`; open defects: `reviews/DEFECTS.md`; performance/storage: `reviews/performance/PERFORMANCE_REPORT.md` and `reviews/performance/V11_STORAGE_REPORT.md`.

### Mandatory stop

Version 11 is complete. Do not begin Version 12 without explicit user approval.

## Version 12 — CC0 animated-character replacement trial

Status: Complete — iteration pass; CC0 candidate rejected; V11 default retained (2026-08-12)

### Bounded focus

- Validate one externally authored, genuinely downloadable CC0 animated character before replacing any additional actors or expanding content.
- Use Quaternius' Animated Knight Pack as a presentation-only Nightbound candidate; preserve all existing movement, combat, transformation, damage, cooldown, and encounter mechanics.
- Convert and validate the FBX through Blender into a static-build-safe GLB with recorded provenance, bones, clips, triangle count, materials, orientation, origin, and exact bundle cost.
- Launch and inspect the candidate at real isometric play scale through locomotion, primary attack, transformation, hurt, death/retry, mixed combat, and boss play.
- Compare homologous V12 frames directly against V11 and the fixed official V Rising reference corpus; reject the replacement if it does not materially improve the actual rendered game.
- Complete performance, console, fallback, build, static-host, supervisor rejection/fix/retest, and log closure before advancing. Stop after Version 12 until the user explicitly directs otherwise.

### Implemented and validated

- Downloaded and reproducibly converted the selected Quaternius `KnightCharacter.fbx` under CC0 1.0 into a local 361,240-byte GLB. Provenance, source checksum, deterministic Blender conversion, structural GLB validation, and Three.js mixer validation are retained inside the project.
- Integrated an explicit V12 candidate path without changing gameplay mechanics. The normal game remains `ready:v11`; `?character=v12` enables the candidate; candidate failure falls back to V11, and failure of both authored assets falls back to the procedural player.
- Found and fixed two real rendered blockers missed by the initial load smoke: every clip re-applied a 0.3215 root scale, and all three materials exported as masked alpha-zero. Validators now reject root-scale animation channels and non-opaque/alpha-zero materials; the final candidate is 1.8 m, unit-scale, grounded, opaque, and visible.
- Rejected the candidate after matched real-browser inspection. At 956 triangles with no textures, weapon, helmet, or cape, it reads as a generic bare low-poly figure and is materially worse than the V11 Nightbound at gameplay scale. The asset remains only as an explicit QA experiment and is not the shipped default.
- Final `npm test` passes 9/9 contracts, the production build, and 2/2 static tests. Production static hosting verifies `ready:v11`, `ready:v12`, V11 fallback, and procedural fallback.
- Final warmed 30-second Phase-III production samples pass: LOW 60.00 average / 56.62 FPS 1%-low at DPR 0.65; HIGH 60.00 / 55.87 at DPR 1.25. Deployable `dist` is 15.85 MiB; the 749,944-byte entry is 199,092 bytes gzip; project size excluding `node_modules` is 338.48 MiB.

### Supervisor assessment

- **ITERATION PASS / CC0 CANDIDATE REJECTED / V11 DEFAULT RETAINED / COMMERCIAL VISUAL QUALITY REJECTED.**
- Candidate presentation is approximately 1.6/5 versus V11 Nightbound's 3.0–3.2/5; it falls substantially farther below the fixed V Rising comparison in anatomy, costume hierarchy, materials, silhouette, and attack identity.
- The external-asset loading, validation, deterministic fallback, performance, static deployment, and storage experiment succeeded. Continuous final candidate motion was not recorded, so its animation feel remains perceptually unverified; that does not justify accepting a candidate already rejected by static gameplay-scale evidence.
- Formal review: `reviews/VERSION_12_REVIEW.md`; performance: `reviews/performance/V12_PERFORMANCE_REPORT.md`; storage: `reviews/V12_STORAGE_REPORT.md`.

### Mandatory stop

Version 12 is complete. Do not begin Version 13 without explicit user approval.

## Version 13 — collision and physical-space integrity

Status: Complete — collision accepted; Tripo asset blocked by subscription (2026-08-12)

### Bounded focus

- Add a deterministic swept-circle collision system for normal movement, dashes, Wraith blink, Dreadwolf pounce, knockback, and enemy locomotion.
- Prevent the player, standard enemies, elite, boss, trees, rocks, graves, deep pools, chapel, aqueduct, gate, arena monoliths, and braziers from occupying the same physical space.
- Preserve responsive wall sliding, combat readability, all encounter mechanics, and the validated LOW/HIGH performance envelope.
- Integrate the selected Tripo Gothic Vampire only if a legally exportable GLB becomes available. Tripo currently blocks this account behind a paid subscription despite showing a five-credit export action; no subscription purchase is authorized.
- Complete implementation, launch, real playtest, collision regression tests, performance/build review, supervisor fix/retest, and log closure before advancing. Stop after Version 13.

### Implemented and validated

- Added an allocation-free XZ swept-circle solver with bounded substeps, circle/AABB depenetration, tangent-preserving wall sliding, world bounds, and live-character blockers.
- Routed normal movement, all dashes, Wraith blink, Dreadwolf pounce, enemy locomotion/lunges/knockback, pack separation, player/enemy separation, and boss-body collision through the new physical-space rules.
- Authored 238 static blockers across deep pools, trees, significant rocks, graves, chapel, aqueduct, boss gate, arena monoliths, and braziers while leaving decorative foliage and route surfaces traversable.
- Added deterministic no-tunnelling, wall-slide, prop-overlap, and character-overlap tests plus a collision-gate QA entry point. Final `npm test` passes 13/13 contract/collision tests, TypeScript, production build, and 2/2 static tests.
- Production browser verification on the exact final build reproduced a high-speed gate stop at `z=-29.570`, lateral wall sliding, `ready:v11`, and zero console warnings/errors.
- Stable LOW boss telemetry passes at 60.00 average / 56.43 FPS 1%-low with p99 17.7 ms and zero geometry/texture/program growth. `dist` is about 15.8 MiB.
- Split Three.js into a vendor chunk, reducing the application entry from the previous 749,944-byte cliff to 167,479 bytes while keeping every chunk below the 750 kB regression ceiling.

### Supervisor assessment

- **ITERATION PASS / COLLISION ACCEPTED / TRIPO ASSET BLOCKED / COMMERCIAL VISUAL QUALITY REJECTED.**
- The physical-space feature is real, rendered, tested, performant in the established gate, and materially improves gameplay integrity.
- The selected Gothic Vampire was not integrated: Tripo redirected the five-credit export action to a paid subscription modal. No subscription purchase or paywall bypass was authorized.
- Visual fidelity therefore remains unchanged and far below the fixed V Rising reference bar. See `reviews/VERSION_13_REVIEW.md` and `reviews/performance/V13_PERFORMANCE_REPORT.md`.

### Mandatory stop

Version 13 is complete. Do not begin Version 14 without explicit user approval.

## Version 14 — Mixamo Vampire authored-character trial

Status: Complete — explicit candidate accepted; V11 default retained (2026-08-12)

### Bounded focus

- Download and validate one Adobe Mixamo `Vampire A Lusth` character plus idle, in-place run, horizontal slash, front hit reaction, and death motions.
- Convert the licensed FBX sources into one static-build-safe GLB, preserving textures and skinning while removing object-level drift/scale channels.
- Integrate the model only as an explicit Nightbound candidate with V11 authored and procedural fallbacks unchanged.
- Inspect real gameplay-scale appearance, locomotion, attack, hurt, death/retry, collision behavior, console state, bundle/storage cost, and LOW/HIGH performance before deciding whether it can replace V11.
- Stop after Version 14; do not begin Version 15 without explicit approval.

### Implemented and validated

- Downloaded and archived Mixamo `Vampire A Lusth` plus idle, in-place run, outward slash, front hit reaction and death FBXs with checksums and provenance.
- Built one presentation-only 16.83 MB GLB through a reproducible Blender converter: 15,021 triangles, 7,870 vertices, 99 bones, five textures and five clips. A structural validator checks the root, skin, clip contract, finite float accessors, material alpha and forbidden root displacement.
- Found and fixed source-scene Hips offsets and large authored root motion that initially moved the rendered skin away from the game actor. All Hips translation is removed; movement, knockback, death position and collision remain owned by the game systems.
- Added `?character=v14`/`?character=mixamo` as an explicit candidate only. Default remains `ready:v11`; selected-candidate failure falls back to V11; total authored failure falls back to the procedural player.
- Real browser evidence verifies visible idle, attack, hurt and death states, collider/model coincidence, death/retry, Version-13 collision behavior and a clean fallback matrix with no console warnings/errors.
- Final `npm test` passes TypeScript, 14/14 contract/collision tests, production build and 2/2 static tests. Phase-III LOW measures 60.00/56.51 FPS average/1%-low; HIGH measures 60.00/56.89. `dist` is 31.89 MiB.

### Supervisor assessment

- **ITERATION PASS / EXPLICIT MIXAMO CANDIDATE ACCEPTED / V11 DEFAULT RETAINED / COMMERCIAL VISUAL QUALITY REJECTED.**
- The candidate is a material visual upgrade over Quaternius and a modest upgrade over V11 in anatomy, skinning, texture density and authored motion, approximately 3.3/5 as a character. It still lacks a weapon, bespoke transformation, distinct ability animations, strong gameplay-scale contrast and V Rising-level model/material/cloth quality.
- Formal review: `reviews/VERSION_14_REVIEW.md`; performance: `reviews/performance/V14_PERFORMANCE_REPORT.md`; storage: `reviews/V14_STORAGE_REPORT.md`.

### Mandatory stop

Version 14 is complete. Do not begin Version 15 without explicit user approval.

## Version 15 — environment geometry, materials, and five-version checkpoint

Status: Complete — iteration pass; environment materially improved; checkpoint commercial-quality rejected (2026-08-12)

### Bounded focus

- Replace the scene's most obvious colored-cylinder, box, cone and card-like
  props with more authored procedural silhouettes without expanding the biome.
- Add original tiled environment textures only where they improve visible
  material response, while preserving collision, combat readability and the
  established LOW/HIGH performance envelope.
- Inspect real gameplay and production-preview frames against the fixed V Rising
  world reference, complete tests/performance/storage, write the V11–V15
  checkpoint, then stop before V16.

### Implemented and validated

- Rebuilt trees and roots from bent elliptical ring geometry; added instanced
  leaf crowns, contact shadows and fallen logs. Replaced basic rocks and graves
  with irregular eroded forms, extruded Gothic silhouettes and reliefs.
- Rebuilt visible chapel, aqueduct, gate, steps, arena obelisks and braziers with
  lathed, extruded, tapered or chipped geometry rather than raw primitive stacks.
- Generated two original seamless textures—damp Gothic stone and gnarled marsh
  bark—and integrated them as shared sRGB albedo plus restrained bump sources.
  Prompts and provenance are retained under `src/assets/environment`.
- Added forest/graveyard QA spawns and retained collision for all existing props
  plus the new fallen logs. Final `npm test` passes TypeScript, 14/14 contract/
  collision tests, production build and 2/2 static tests.
- Exact production preview loaded the textured chapel with zero captured console
  issues. Thirty-second Phase-III samples pass at LOW 60.00/56.59 and HIGH
  60.00/56.71 average/1%-low with zero object/geometry/texture/program growth.
- Deployable `dist` is about 33 MiB; main application chunk is 175,638 bytes /
  54,103 bytes deterministic gzip. The two V15 texture assets add about 0.99 MB.

### Supervisor assessment

- **ITERATION PASS / ENVIRONMENT MATERIALLY IMPROVED / CHECKPOINT COMMERCIAL-QUALITY REJECTED.**
- World quality improves from approximately 2.8 to 3.1/5. Stone/bark surfaces,
  landmark silhouettes, graves, rocks and trees no longer read as plainly as
  colored primitives.
- V Rising parity is not reached: terrain remains broadly tiled, water/banks are
  flat, foliage/canopy and storytelling-prop density are low, and architecture
  lacks sculpted trim/normal/AO detail and layered composition.
- Formal review: `reviews/VERSION_15_REVIEW.md`; checkpoint:
  `reviews/CHECKPOINT_V15.md`; remaining defects: `reviews/DEFECTS.md`.

### Mandatory checkpoint stop

Versions 11–15 are complete. Do not begin Version 16 without explicit user
approval.

## Version 16 — Mixamo enemy/Boss replacement and environment dressing

Status: Complete — iteration pass; presentation improved; V Rising parity rejected (2026-08-12)

### Bounded focus

- Replace the standard/elite enemy bodies and Bell-Saint body with visibly
  higher-quality Mixamo assets without changing validated gameplay mechanics.
- Reduce encounter population, remove the ranged long rectangular tell, and
  retain readable/fair combat through collision and projectile cues.
- Continue environment refinement inside the existing biome, then complete
  real production rendering, boss victory, LOW/HIGH performance, storage and
  full automated regression.

### Implemented and validated

- Downloaded and archived `Skeletonzombie T Avelange` and
  `Warrok W Kurniawan`; converted them to static-build-safe GLBs with 73/81 bones,
  12,486/12,626 triangles and idle/move/attack/hurt/death clips.
- Retargeting removes gameplay-root displacement and foreign bone curves. The
  physical actor continues to own movement, collision, damage, knockback and
  boss phase timing.
- Attached Skeletonzombie to every standard role and the elite with restrained
  role-scale variation. Attached Warrok to the Bell-Saint while preserving all
  three phases, weaknesses, hazards and victory state.
- Reduced population from 13 to 9 across four encounter locations. Replaced the
  ranged nine-metre rectangular lane with a compact ring at the caster; visible
  projectiles retain direction/readability.
- Added batched dark vines and moss clusters to the chapel/aqueduct and kept the
  V15 stone/bark/geometry pass intact.
- Final `npm test` passes TypeScript, 14/14 contract/collision tests, production
  build and 2/2 static tests. Exact production preview is console-clean.
- Phase-III LOW measures 60.00/56.75 average/1%-low; HIGH 60.00/56.62. Texture/
  program counts are flat. `dist` is about 61.7 MiB.

### Supervisor assessment

- **ITERATION PASS / ENEMY AND BOSS PRESENTATION IMPROVED / V RISING PARITY REJECTED.**
- Warrok's textured organic silhouette is a major upgrade and scores about
  3.6/5 as a body; the complete boss presentation remains ~3.3/5 because phase
  animation, VFX/terrain response and defeat spectacle remain generic.
- Skeletonzombie enemies improve anatomy/material/animation to ~3.2/5, but one
  cloned appearance across all roles creates a new role-diversity defect.
- Environment improves only incrementally to ~3.15/5; terrain blending,
  shoreline geometry, decals, dense foliage and sculpted trim remain open.
- Formal review: `reviews/VERSION_16_REVIEW.md`; performance/storage:
  `reviews/performance/V16_PERFORMANCE_REPORT.md` and
  `reviews/V16_STORAGE_REPORT.md`.

Version 16 is complete.

## Version 17 — mobile boss and non-projectile skill overhaul

Status: Complete — iteration pass; mobile boss accepted; commercial spectacle rejected (2026-08-12)

### Bounded focus

- Make the Bell-Saint move and space like an enemy while retaining arena bounds,
  collision integrity, readable commitment windows, and all phase weaknesses.
- Remove every fired boss energy ball and replace the attack set with grounded,
  non-projectile effects that remain readable while the boss moves.
- Complete real three-phase rendering, console inspection, automated regression,
  LOW performance validation, review, fix/retest, and log closure.

### Implemented and validated

- Added phase-specific chase, retreat and strafe movement with smoothed facing,
  attack movement locks, authored move animation selection and a 9.4 m arena
  leash. Phase I/III pressure melee range; Phase II circles at casting range.
- Routed the boss through the shared swept-circle solver against world blockers,
  the current player position, live actors and arena bounds. Player and boss
  cannot occupy the same physical space.
- Replaced radial energy-ball attacks with readable cleave sectors, jagged ground
  fractures, shock rings and delayed shard sigils. Cast effects stay fixed at the
  original world location after the boss moves.
- Reduced transition overlap after rendered review (Phase II: four rifts/two
  sigils; Phase III: six rifts/three sigils) and lowered rift fill while preserving
  bright phase-colored boundaries.
- Final `npm test` passes TypeScript, 14/14 contracts/collision tests, production
  build and 2/2 static tests. Exact browser console is clean.
- Thirty-second LOW Phase-III telemetry passes at 60.00 average / 56.44 FPS
  1%-low, p99 17.6 ms. Final app entry is 181,876 bytes / 55,630 gzip-9;
  deployable `dist` is approximately 62 MiB.

### Supervisor assessment

- **ITERATION PASS / MOBILE BOSS ACCEPTED / ENERGY-BALL ATTACKS REMOVED / V RISING PARITY REJECTED.**
- Mobility and actual phase spacing are a substantial gameplay improvement, and
  non-ball topologies make the encounter more varied and readable.
- Commercial parity remains rejected: transitions are still flat/busy, ground
  damage lacks decal/normal/debris depth, boss clips are generic and defeat is
  unchanged. Formal review: `reviews/VERSION_17_REVIEW.md`.

Version 17 is complete.

## Version 18 — Bell Sanctum boss-room environment overhaul

Status: Complete — iteration pass; environment materially improved; 4.5 target not yet met (2026-08-12)

### Bounded focus

- Replace the boss platform with a recognizable handcrafted ruined room while
  retaining all V17 boss mechanics, collision, telegraph readability and LOW
  performance discipline.
- Compare real rendered results against the fixed V Rising interior references,
  iterate on the largest visual gaps, and report the score honestly.

### Implemented and validated

- Added three original AI-assisted project textures: rain-darkened slate floor,
  carved gothic wall relief and a worn crimson runner; retained their source
  PNGs under `art_source/textures/`.
- Rebuilt the arena as a U-shaped Bell Sanctum with chipped foundation/rim,
  textured flagstone, radial inlays, wet patches, debris, carved apse, side-wall
  bays, pointed windows, wall ribs, buttresses, ivy, banners, altar, suspended
  bell, runner and warm/cool practical lighting.
- Reduced monolith count and moved them to the rear half, kept the entrance open,
  added static collision for the side walls, and reframed the boss camera so the
  room remains visible without losing combat tracking.
- Final `npm test` passes TypeScript, 14/14 contract/collision tests, production
  build and 2/2 static-host tests. Exact browser console was clean during the
  measured candidate.
- The 30-second LOW candidate measured 60.00 average / 56.84 FPS 1%-low, p99
  17.5 ms. Exact-final U-wall performance remains a follow-up rather than an
  inferred claim.

### Supervisor assessment

- **ITERATION PASS / BOSS-ROOM ENVIRONMENT MATERIALLY IMPROVED / 4.5 TARGET NOT YET HONESTLY MET.**
- Boss-room environment rises to roughly **4.0/5**, but still trails the fixed
  V Rising references in bespoke sculpted modular architecture, normal/AO depth,
  ceiling/roof treatment, prop-story density, and sophisticated shadow layering.
- Formal review: `reviews/VERSION_18_REVIEW.md`.

Version 18 is complete.
