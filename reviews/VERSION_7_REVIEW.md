# Supervisor Review — Version 7

**Verdict: ITERATION PASS / VISUAL QUALITY REJECTED.** V7 makes a real terrain/lighting improvement, then completes a bounded fix/retest that removes the central combat occluder and strengthens contact visibility. The implementation loop may close. The material pass still replaces crushed darkness with a broadly uniform gravel carpet rather than achieving the macro-to-micro hierarchy of the fixed reference.

## Exact candidate and evidence

- Final production bundle independently built as `dist/assets/index-BOwZnoNp.js` — 669.40 kB minified / 177.07 kB gzip
- Runtime material: `hollow-march-ground-v2-BqB-fioT.jpg` — 386.37 kB; original generation prompt and processing are documented in `reviews/assets/V7_IMAGEGEN_ASSET.md`
- Controlled real-Chrome captures: `v7-compare-world.png`, `v7-compare-transformation.png`, `v7-compare-character.png`, `v7-compare-vfx.png`, `v7-compare-enemies.png`, `v7-compare-boss.png`
- Comparison: `v7-reference-board.jpg` against fixed `official-20.jpg` and `official-15.jpg`
- Reported environment: HIGH, 1280×720; `consoleIssues=[]`
- Independent regression: `npm test` passes 8/8 contracts, TypeScript/build, and 2/2 static-host tests
- Remaining build warning: entry chunk exceeds Vite's 500 kB advisory threshold

## What genuinely improved

The world is no longer swallowed by black. Wet gravel, mud, small stones, rain, water, reeds, and lamp pools are visible across the route. The player, path, pools, and encounter area separate more reliably, and the HIGH-tier lighting feels less flat. The generated albedo is original and its provenance is properly recorded.

This is a useful V6→V7 delta, especially in raw readability. It does not by itself create reference-level world art: the official route uses broad quiet path shapes, mid-frequency terrain changes, dense authored foliage/rock framing, and controlled highlights. V7 applies nearly the same sharp pebble frequency everywhere, including beneath actors, so the ground competes with combat rather than supporting it.

## Numbered state review

1. **World — improved, still weak.** `v7-compare-world.png` is much more readable than V6. Repeated green slabs, polygonal shores, sparse foliage, black primitive trunks, and uniform gravel frequency keep it well below `official-20.jpg`.
2. **Transformation — unchanged weakness.** The Dreadwolf state and magenta rings read, but this is still a single post-change frame rather than transformation motion.
3. **Character — weak.** Brighter terrain increases silhouette separation, but the Dreadwolf and enemy bodies remain primitive and stiff; the ground now has more detail than the characters.
4. **VFX — readable, still weak.** The central trunk is gone and brighter contact shapes separate the melee cluster from the terrain. The effect remains thin—mostly lavender diamonds and pale arcs—with little target reaction, trail, debris, or localized terrain light.
5. **Enemies — occlusion fixed, art gap remains.** Player, melee targets, caster, and incoming attack direction are visible in one frame. Multiple roles can now be judged, but anatomy, pose, grounding, and material separation remain weak.
6. **Boss — readable, prototype-grade.** Player and boss remain separated and the stale overlay is gone. The circular guides, spike cones, flat arena surface, and faceted boss still lack phase spectacle and authored material/pose detail.
7. **Reference board — honest.** The side-by-side makes the terrain lift visible and also reveals the lack of composition hierarchy, foliage density, actor fidelity, and combat staging.

## Side-by-side score

| Category | V7 / 5 | Assessment |
|---|---:|---|
| Environment composition and route authorship | 2.4 | Clearer route; repetition and sparse authored layering remain. |
| Terrain, architecture, foliage, prop materials | 2.3 | Large albedo improvement, but overly uniform/noisy and stylistically ahead of primitive props. |
| Character anatomy, silhouette, costume, grounding | 1.7 | Better background contrast, unchanged prototype bodies. |
| Animation and transformation motion | 1.2 verified | No motion evidence; single transformation state. |
| Skill VFX construction and ground integration | 1.9 | Occlusion is fixed and contact is brighter; impact layering remains sparse. |
| Enemy/boss identity and phase spectacle | 2.1 | Readable concepts, primitive bodies and telegraphs. |
| Lighting, atmosphere, focal/value hierarchy | 2.6 | Meaningful lift, but ground frequency competes with actors. |
| Camera, occlusion, UI coexistence, readability | 2.8 | Central combat is unobstructed after tree relocation; HUD remains stable. |
| Runtime stability at tested tier | 2.5 verified | HIGH Chrome run and console clean, tests green; no frame-time sample. |

**Simple verified score: approximately 2.2 / 5.0.** V7 improves world visibility and material perception, and the fix/retest restores combat readability. Most of the remaining gap is asset, composition, animation, and VFX fidelity rather than a blocking presentation bug.

## Fix-loop outcome and remaining priorities

1. **SUP-015 closes:** camera-strip trees were relocated without deleting world density; fresh VFX/enemy frames keep the central fight unobstructed.
2. **SUP-013 remains:** raise one contact effect above ground noise with a directional bright core, short trail, target flash/reaction, and restrained debris; capture the peak.
3. **SUP-012 remains:** reduce route-frequency noise and add broad mud/moss/wet macro zones; keep detail stronger toward non-playable edges.
4. Replace the bright polygonal shoreline seam with blended mud/reed overlap or a soft irregular transition.
5. Add restrained midtone/rim separation to black trunks and grave props so they read as materials rather than void silhouettes.

## Accessibility/readability risks

- High-frequency terrain detail competes with small actors and telegraphs.
- Enemy roles still depend heavily on hue rather than shape and movement.
- Motion, focus behavior, color-blind differentiation, audio redundancy, and frame pacing remain unverified from screenshots.

## Closure decision

V7 may close as **ITERATION PASS / VISUAL QUALITY REJECTED**. The generated ground, lighting, exposure, and shadow work are visibly worthwhile; the bounded retest proves the central occlusion fix, strengthened contact shapes, clean console, and green regression on the final exact bundle. Do not describe the result as commercial or V Rising-level: every visual category remains below the 4.5 acceptance threshold.
