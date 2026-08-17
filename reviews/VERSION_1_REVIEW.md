# Supervisor Review — Version 1

**Verdict: REJECTED.** The build has a coherent original mood and a surprisingly composed HUD for an early slice, but direct play reveals a hostile opening and prototype-grade actors/environment. Most of the promised gameplay—including meaningful form combat, the elite, and all boss phases—has not yet been demonstrated. It is not close to the stated modern commercial action-RPG bar.

## Build and evidence

- Test date: 2026-08-07
- Browser target: WebGL2 desktop, in-app Chromium surface, approximately 1280×720 viewport
- Live build inspected: initial integrated Vite development build at `http://127.0.0.1:5173/`; current integration build later announced at port 5174
- Static gate: `npm run build` now passes; Vite output contains a 547.45 kB minified entry chunk and emits a size warning
- Console during initial visual inspection: no warnings or errors captured
- Direct evidence:
  - `evidence/v1-initial.png`
  - `evidence/v1-wraith.png`
  - `evidence/v1-dreadwolf.png`
  - `evidence/v1-stonewrought.png`
- Evidence missing: full run, reliable pack combat, elite, each boss phase, victory, audio evaluation, sustained movement/camera evaluation, frame-time trace, focus/resize/restart regression

## Hard gates

- Launch: PASS in development build
- Static production build: PASS after initial compilation repair
- Opening fairness/reliable first-play inspection: **REJECT**
- Three forms visually selectable: PASS, but mechanical depth unverified
- Elite: UNVERIFIED
- Boss phases: UNVERIFIED
- Performance: UNVERIFIED
- Evidence completeness: **REJECT**

## Evidence-weighted score

Unverified categories score 0 under the rubric. This is deliberately stricter than scoring implementation claims.

| Category | Score / 5 | Assessment |
|---|---:|---|
| Movement, controls, camera | 0.5 | Isometric framing is stable in the opening shot, but continuous movement/collision/camera play was interrupted by death. |
| Combat feel and responsiveness | 0.0 | Not reliably testable in the captured run. |
| Transformation depth | 1.0 | Three alternate silhouettes select successfully, but no distinct movement/combat grammar was demonstrated. |
| Enemy and encounter design | 0.8 | Multiple silhouettes are present, but immediate spawn pressure is unfair and the actors read as primitives. |
| Boss quality | 0.0 | Not reached. |
| World art and exploration | 1.6 | Strong palette and graveyard premise; obvious repeated slabs/gravestones, low asset detail, and crushed blacks prevent commercial finish. |
| Rendering, lighting, materials, VFX | 1.5 | Atmosphere and vignette are directionally good; materials are flat, silhouettes merge, and transformation rings are simple overlays. |
| Animation and physics | 0.5 | Authored locomotion/attack/reaction quality was not visible; actors mostly read as rigid assemblies. |
| UI/UX and onboarding | 2.7 | Typography, spacing, form rail, ability bar, and death presentation are the current strongest craft. Tiny top controls and an unsafe opening undermine onboarding. |
| Audio and atmosphere | 0.0 | Not verified with audio evidence. |
| Performance and robustness | 0.5 | Clean initial console and quick load, but no frame-time evidence or robustness pass. |

**Weighted result: approximately 0.8 / 5.0.** This low number primarily reflects unverified core gameplay, not a claim that every implemented system has no merit.

## Creative-director assessment

The strongest idea is the restrained blue-black graveyard palette paired with mint, magenta, and amber combat accents. The HUD has clear authorship and avoids copying a known commercial interface. The initial composition also creates a readable route and a pleasant sense of damp, nocturnal space.

The game itself still looks like a competent Three.js prototype. The player, enemies, and forms are recognizably made from cones, cylinders, and low-poly stones. There is no convincing anatomy, secondary motion, anticipation, follow-through, or material richness. Repeated props and uniformly dark ground flatten the biome into one plane. The transformation title cards communicate intent better than the actual bodies do.

The opening encounter is unacceptable. A player died while merely trying to inspect the game and begin testing inputs. High-pressure combat can be excellent, but it must begin through an intentional threshold with a readable first threat. This opening currently destroys trust before combat mastery is possible.

The version cannot receive credit for an elite or multi-phase boss until those encounters are completed on-screen. Source code and HUD phase labels are not evidence.

## Required next actions, in order

1. Fix opening aggro and demonstrate a fresh-load idle/read-controls test, then a deliberate engagement.
2. Provide a complete, controllable playthrough path so the supervisor can reach standard packs, elite, and boss without hidden intervention.
3. Replace primitive actor readability with authored multi-part silhouettes and visible locomotion/attack/hit/death animation.
4. Make each transformation visibly and mechanically different in movement, primary, art, traverse, and ultimate; demonstrate its tactical niche.
5. Improve lighting/material separation so player, threats, telegraphs, and paths remain legible without losing darkness.
6. Demonstrate the elite and every boss phase, including death/retry/victory and camera/VFX stress.
7. Capture audio-on gameplay and worst-case frame-time evidence.

Open defects and acceptance criteria are maintained in `DEFECTS.md`.

## Fix-loop re-test

The initial P1 opening-death defect was addressed in the same version loop.

- `evidence/v1-fix-idle-13s.png` shows full health after the 13-second idle capture window and a substantially safer spawn composition.
- `evidence/v1-fix-dreadwolf-pack.png` shows Dreadwolf reaching the opening pack through deliberate traversal, rather than combat beginning on top of the spawn.
- `npm run build` passes after the fix.

**V1 loop verdict: ITERATION PASS / CHECKPOINT QUALITY REJECTED.** The narrowly targeted opening-safety failure is closed, so foundation work may continue. The version still does not pass the commercial-quality bar: SUP-004 (prototype-grade visual/animation execution), SUP-005 (core encounters and transformation depth unverified), and SUP-001 (mandatory end-to-end evidence incomplete) carry forward at high priority.
