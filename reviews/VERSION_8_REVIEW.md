# Supervisor Review — Version 8

**Verdict: ITERATION PASS / VISUAL QUALITY REJECTED.** V8 makes a genuine combatant-art step, then completes a bounded fix/retest: Stonewrought becomes independently readable in the boss arena and the contact capture now shows a clear staged impact with separated actors. The implementation loop may close; the fixed commercial reference still exposes a large anatomy, material, pose, animation, and spectacle gap.

## Exact candidate and evidence

- Final production bundle independently built as `dist/assets/index-BT2Cq7Hd.js` — 675.89 kB minified / 179.02 kB gzip
- Generated runtime materials: `nightbound-cloth-v1-Dn7s_WAt.jpg` — 68.86 kB; `blackened-steel-v1-CbApwC8O.jpg` — 74.33 kB
- Original prompts/provenance: `reviews/assets/V8_IMAGEGEN_ASSETS.md`
- Fresh real-Chrome states: `v8-compare-world.png`, `v8-compare-transformation.png`, `v8-compare-character.png`, `v8-compare-vfx.png`, `v8-compare-enemies.png`, `v8-compare-boss.png`
- Side-by-side: `v8-reference-board.jpg`; reported `consoleIssues=[]`
- Independent regression: `npm test` passes 8/8 contracts, TypeScript/build, and 2/2 static-host tests
- Remaining build warning: entry chunk exceeds Vite's 500 kB advisory threshold

## What genuinely improved

The standard roster no longer reads exclusively as colored cones. Figures now have smoother heads, shoulders, arms, leg/robe divisions, round shields or weapons, and clearer caster/melee profiles. Dreadwolf is more organic and quadrupedal; Nightbound's cloth mass and magenta trim hold together more coherently. These changes improve first-glance role recognition even before UI.

Asset provenance is clean and original. The cloth and steel maps are technically present without copying the fixed reference. At the current camera distance, however, their woven/hammered microdetail is mostly invisible. What the player sees is still dominated by large flat dark masses, so the commercial reference's costume panels, edge wear, hair, anatomy, and specular hierarchy are not approached.

## Numbered state review

1. **World — stable.** V7's improved terrain/light pass is preserved. Uniform gravel frequency, repeated slabs, bright shore seams, and primitive props remain unchanged.
2. **Transformation — brighter, still incomplete.** The ring is more visible and Dreadwolf's post-change mass is clearer. A single frame still cannot prove before/transition/after animation.
3. **Character — improved anatomy, weak presentation.** Dreadwolf has a more readable back, haunches, paws, and color accents; surrounding enemies have smoother humanoid divisions. All remain small in frame, stiff, and weakly grounded compared with `official-24.jpg`.
4. **VFX — basic hit readability fixed.** The retest separates the player, struck target, shielded melee enemy, and caster; a warm-white/red starburst clearly marks contact. Trail, recoil, debris, and terrain response remain thin.
5. **Enemies — visible role upgrade.** The staged frame makes caster, melee, shield, and beast profiles easier to parse. Faces, joints, hands, costume layers, contact shadows, and expressive poses remain prototype-grade.
6. **Boss — Stonewrought readability fixed.** Cool-slate midtones, bright edge masses, amber anchors, and a splayed pose make the player form immediately visible against the arena. It still reads as smooth assembled volumes rather than convincing stone anatomy/material.
7. **Reference board — honest but not homologous.** The board exposes the character gap, but the official characters occupy far more pixels and show a staged pose while V8 uses a distant overhead cluster. A closer matched combat capture is required for meaningful material comparison.

## Side-by-side score

| Category | V8 / 5 | Assessment |
|---|---:|---|
| Environment composition and route authorship | 2.4 | Preserves V7's readable route; no major V8 world delta. |
| Terrain, architecture, foliage, prop materials | 2.3 | Stable V7 terrain; shoreline and macro hierarchy issues remain. |
| Character anatomy, silhouette, costume, grounding | 2.2 | Clear improvement from primitive cones, still small/doll-like and materially flat. |
| Animation and transformation motion | 1.3 verified | Pose state is visible; animation continuity is not. |
| Skill VFX construction and ground integration | 2.2 | Clear impact core and separated staging; secondary response remains sparse. |
| Enemy/boss identity and phase spectacle | 2.3 | Enemy role silhouettes improve; boss/player staging remains prototype-grade. |
| Lighting, atmosphere, focal/value hierarchy | 2.7 | Stonewrought now separates clearly; world hierarchy issues remain. |
| Camera, occlusion, UI coexistence, readability | 2.9 | Staged contact and boss form are legible; actor scale remains distant. |
| Runtime stability at tested tier | 2.5 verified | Chrome/console and tests are clean; no V8 frame-time sample. |

**Simple verified score: approximately 2.3 / 5.0.** V8 shifts quality from crude geometry toward authored prototype characters and closes its two immediate readability failures. The remaining deficit is predominantly fidelity and motion rather than a blocking still-frame bug.

## Fix-loop outcome and remaining priorities

1. **SUP-016 closes:** Stonewrought's midtones, separated masses, amber anchors, and splayed pose survive the boss arena.
2. **Basic contact-readability failure closes:** separated staging and a clear starburst make the strike point obvious; SUP-013 remains for commercial VFX depth.
3. **SUP-004 remains:** add macro material blocks that survive the camera—cloth trim, armor plates, skin/face, weapon edges—and stronger authored anatomy/pose.
4. Produce a closer homologous character/combat comparison while retaining enough arena context to judge gameplay readability.
5. **SUP-014 remains:** show real locomotion, anticipation, contact/recovery, reactions, and transformation motion; rerun the performance probe.

## Evidence limits

- Still frames cannot establish animation timing, cancel windows, hit-stop, audio, or responsiveness.
- The fixed and V8 character frames use different actor scales and camera staging.
- No V8 performance trace was inspected; clean console/build does not prove frame pacing.

## Closure decision

V8 may close as **ITERATION PASS / VISUAL QUALITY REJECTED**. The character/enemy work is a real improvement; the exact-build retest visibly fixes Stonewrought readability and contact staging, reports a clean console, and passes regression on the final bundle. Do not describe the result as modern-AA or V Rising-level: every visual category remains below the 4.5 acceptance threshold.
