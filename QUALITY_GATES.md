# Quality gates

Feature lists and passing compilation are not evidence of game quality. A version completes only after the complete implement → launch → playtest → screenshot/video inspection → supervisor critique → repair → regression test loop is recorded.

## Required evidence per version

- A clean `npm run build` and browser smoke test with no console errors.
- Measured frame rate, frame-time behavior, draw calls, triangles, and load time from real gameplay.
- Representative screenshots from exploration, every form, elite combat, and every boss phase.
- Keyboard/mouse playtest covering movement, aiming, attack buffering, hit reactions, dodge/escape, form changes, death/restart, and camera constraints.
- Harsh supervisor verdict with prioritized, observable defects and ownership.
- Fix verification, including regressions introduced by the fix.

## Vertical-slice acceptance bar

The slice must include a cohesive handcrafted biome, readable traversal landmarks, enemy group composition, at least three mechanically distinct transformations, a designed elite, and a multi-phase boss. Combat must remain legible under maximum VFX load. Inputs must feel immediate and movement must not exhibit frame-rate dependence, camera judder, collision snagging, or lost edge inputs.

Visual comparison may use commercial references only to calibrate composition, readability, atmosphere, material hierarchy, animation clarity, encounter pacing, and finish. No proprietary characters, narrative, layouts, models, textures, animation, UI, or audio may be copied.
