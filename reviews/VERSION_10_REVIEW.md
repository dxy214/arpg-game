# Supervisor Review — Version 10

**Verdict: ITERATION PASS / CHECKPOINT QUALITY REJECTED.** Version 10 is runnable, stable, and materially clearer than Version 9 in three bounded areas: the marsh route is less repetitive, Wraith separates better from the cyan boss phase, and boss projectiles use several readable silhouettes instead of one repeated head. The 30-second Phase III probe also passes the established performance gate. The five-version loop may close at this checkpoint, but the result remains far below the requested modern-commercial/V Rising visual bar. Do not begin Version 11 without the user's explicit approval.

## Exact candidate and evidence

- Independent regression on 2026-08-07: `npm test` passed TypeScript, 8/8 contracts, production build, and 2/2 static-host tests.
- Exact production entry: `dist/assets/index-C1Pt-ALM.js` — 693.20 kB minified / 183.93 kB gzip; source map 3,272.67 kB. Vite still reports the non-blocking 500 kB chunk-size advisory.
- Fresh high-quality 1280×720 states: `v10-compare-world.png`, `v10-compare-transformation.png`, `v10-compare-character.png`, `v10-compare-vfx.png`, `v10-compare-enemies.png`, and `v10-compare-boss.png`.
- Transformation/combat continuity: `v10-motion-evidence.webp` with 105 real Chrome frames, plus `v10-motion-contact-sheet.jpg`.
- Authentic same-run boss evidence: `v10-boss-phase1.png`, `v10-boss-phase1-active.png`, `v10-boss-phase2.png`, `v10-boss-phase3.png`, and `v10-boss-phase3-active.png`; supporting samples in `v10-boss-active-contact-sheet.jpg`.
- Fixed-reference comparison: `v10-reference-board.jpg` against the official V Rising screenshot corpus in `reviews/references/v-rising/`.
- Worst-case runtime sample: `reviews/performance/v10-phase3.json` and `v10-performance-final.png` — 30.0 seconds / 1,800 frames, 60.0 FPS average, 56.2 FPS 1% low, 16.7 ms median, 17.4 ms p95, 17.7 ms p99, 18.1 ms max, WebGL2/Metal, LOW at 1280×720 and DPR 0.65, console clean.

## What genuinely improved

The route no longer reads as an identical chain of rectangular stepping stones. Slab silhouettes, yaw, width, and spacing are varied, and the previous bright shore seam is quieter. This is a visible authored-composition improvement even though the surrounding biome is still sparse.

Wraith's near-black indigo core now gives the form a distinct center against the cyan Phase II boss. In `v10-boss-phase2.png`, the dark-blue player disc and pale ring remain identifiable beside the brighter cyan boss. The separation problem is reduced, not eliminated.

Boss projectiles now include circles, diamonds, triangles, and faceted polygon heads with modest trail-width variation. The Phase I and Phase III active sheets prove those shapes are live attack states rather than decorative stills. Performance is also a real strength at the tested LOW tier: the Phase III trace is exceptionally flat and shows no texture/program growth.

## Numbered playable-state review

1. **Roaming world — stable, visually below bar.** The marsh has coherent rain, blue-black pools, wet ground, route lighting, and a readable objective. Uniform gravel frequency, sparse plant clusters, blunt architecture, and repeated black posts keep it at prototype quality.
2. **Nightbound — functional, visually below bar.** The base form has a readable magenta accent and warm contact core. Its rigid robe/body construction and limited attack deformation make contact look like overlapping pieces rather than weighted weapon work.
3. **Wraith — improved identity, visually below bar.** The indigo core, pale mask/hands, cyan eyes, and orbit ring distinguish it from Nightbound and improve Phase II separation. Movement still reads as a floating capsule with orbiting shapes rather than a fully animated spectral body.
4. **Dreadwolf — meaningful traversal silhouette, transformation below bar.** The quadruped form clearly changes scale and locomotion, and the motion sequence shows faster travel. The transformation is still a circular band plus an instantaneous model swap; anatomy and gait remain simple.
5. **Stonewrought — readable tank mass, visually below bar.** Cool-slate volumes and amber anchors separate the form and its broad attack. The body is a pile of rounded primitives with little joint articulation, weight shift, or surface hierarchy.
6. **Elite/group encounter — readable roles, poor contact staging.** `v10-compare-enemies.png` and motion frames show robed, hound-like, and armored silhouettes around the player. The cluster becomes visually tangled, enemies show limited hit reaction, and effects/debris do not establish impact direction or aftermath.
7. **Boss Phase I — readable, repetitive.** Pink material/halo and mixed projectile heads make the phase immediately identifiable. The active pattern is still a uniform radial spoke burst around the same rigid boss model.
8. **Boss Phase II — strongest relative state.** Cyan fracture identity, Wraith counter-form, and bright projectile pattern communicate a different phase. The player/boss palette separation is better in V10, but the arena, pose, topology, and aftermath barely change.
9. **Boss Phase III — readable and performant, not spectacular.** Amber/gold phase identity and the active radial field are clear. Boss and Stonewrought overlap, the phase again uses spoke geometry, and there is little sense of destructive escalation or terrain response.
10. **Performance state — pass at tested tier.** The 30-second active Phase III sample holds 60.0 FPS average / 56.2 FPS 1% low with a clean console. This result does not establish HIGH-quality behavior on slower desktop GPUs.

## Fixed-reference score

| Category | V10 / 5 | Evidence-based assessment |
|---|---:|---|
| Environment composition and route authorship | 2.6 | Route rhythm and shore transition improve; biome layering is still sparse and repetitive. |
| Terrain, architecture, foliage, prop materials | 2.4 | Ground texture is visible, but macro-zoning and asset/material richness remain weak. |
| Character anatomy, silhouette, costume, grounding | 2.4 | Wraith value separation improves; all actors remain toy-like procedural assemblies. |
| Animation and transformation motion | 2.3 verified | All four forms appear in a real sequence; swaps, gait, attack weight, and reactions remain simple. |
| Skill VFX construction and ground integration | 3.1 | Clear palettes and mixed projectile heads; limited topology, lighting, debris, and aftermath. |
| Enemy/elite/boss identity and phase spectacle | 3.1 | Three phases and counter-forms are unmistakable; model/arena staging changes are shallow. |
| Lighting, atmosphere, focal/value hierarchy | 3.0 | Coherent rainy marsh palette and readable phase colors; world midtones and focal hierarchy stay flat. |
| Camera, occlusion, UI coexistence, readability | 2.9 | Field and boss remain visible, but tiny HUD text and combat clustering reduce readability. |
| Runtime stability at tested tier | 4.2 verified | Excellent LOW-tier Phase III trace and clean regressions; HIGH-tier and slower-GPU coverage remain absent. |

**Simple verified score: approximately 2.8 / 5.0.** The stable runtime and clearer phase/form language are credible strengths. No visual category reaches the 4.5/5 reference threshold, and the asset, animation, world-density, and impact-response gaps remain too large for a modern commercial-quality claim.

## Defect decisions

- **SUP-004 remains P1:** Wraith value separation does not solve actor anatomy, costume layering, grounding, attack weight, or hit reactions.
- **SUP-012 remains P1:** varied slabs and a quieter bank are visible improvements, but authored macro terrain, foliage/prop clustering, architecture, and material hierarchy remain thin.
- **SUP-013 remains P1:** projectile-head variety and Phase II separation improve; phase topology, boss animation/staging, terrain response, and impact aftermath remain substantially below reference.
- **SUP-014 remains P2:** performance is now verified and strong at LOW; close tactile timing, hit-stop/recovery, and audiovisual sync are still not proven.
- **SUP-017 opens P2:** critical HUD text and cooldown/phase information are too small and low-contrast at 1280×720; semantic/focus behavior is unverified.
- **SUP-018 opens P2:** no audible capture exists, so combat mix, spatial clarity, repetition, phase escalation, and sync cannot be honestly scored.

## Evidence limits

- The screenshots and WebP are genuine rendered gameplay, but they do not measure input latency or prove commercial-quality animation blending.
- The elite scenario demonstrates a mixed encounter, not a separate exhaustive run for every enemy archetype and behavior branch.
- No gameplay audio was captured or heard; audio implementation claims receive no perceptual score.
- The performance probe covers LOW quality at DPR 0.65 on an Apple M5/Metal path, not HIGH quality or representative lower-end desktop hardware.
- Accessibility conclusions are visual risks only. Keyboard focus, semantic structure, assistive technology, zoom/reflow, and reduced-motion behavior require separate testing.

## Closure decision

V10 may close as **ITERATION PASS / CHECKPOINT QUALITY REJECTED**. The final candidate is buildable, static-hostable, console-clean in the supplied runs, and stable at the tested performance tier. The bounded V10 fixes are visible and do not require another emergency repair loop. The five-version checkpoint must now stop. Do not describe this as V Rising-level or modern-AA quality, and do not begin Version 11 until the user explicitly approves the next batch.
