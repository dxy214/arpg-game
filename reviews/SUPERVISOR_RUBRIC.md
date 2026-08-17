# Quality Supervisor Rubric

This rubric judges the rendered, playable game—not architecture, feature lists, or developer claims. A version passes only after direct play, visual evidence, and performance evidence are captured for that exact build.

## Commercial-quality bar

Scores use a 0–5 scale:

- **0 — Broken/missing:** unusable or not present.
- **1 — Prototype:** functional only in the loosest sense; obvious primitives, placeholders, severe feel/readability defects.
- **2 — Amateur:** coherent but generic, rough, poorly tuned, or visually inconsistent.
- **3 — Good indie vertical slice:** enjoyable and presentable, with identifiable authored strengths and manageable defects.
- **4 — Commercial-quality slice:** polished, responsive, distinctive, cohesive, and robust enough for a public demo.
- **5 — Reference quality:** exceptional craft and memorable execution comparable in finish—not copied content—to leading modern isometric ARPG encounters.

The checkpoint target is **4.0 overall**, with no category below **3.5**. A build scoring lower may still be a valuable iteration, but must not be described as commercial quality.

## Hard rejection gates

Any one of these rejects the version regardless of average score:

1. Build, launch, input, camera, progression, transformation, elite, or boss completion is blocked.
2. Sustained frame rate drops below 45 FPS on the agreed test machine, or frequent visible hitches disrupt combat.
3. Player damage is unreadable, unfair, or routinely caused from off-screen without warning.
4. Any transformation is cosmetic-only or is dominated by the base form in both movement and combat.
5. Boss phases are indistinguishable, can be skipped through bugs, or lack telegraphed counterplay.
6. Encounter resets, death/restart, audio, pause/focus, or resize behavior leaves the game in a broken state.
7. Severe visual defects: blank/black render, shader errors, z-fighting over large areas, camera clipping, missing materials, or persistent screen-obscuring VFX.
8. Evidence is insufficient to verify the requested content in the exact version.

## Weighted scorecard

| Category | Weight | Direct evidence required |
|---|---:|---|
| Movement, controls, camera | 12% | Continuous play showing acceleration, stopping, dodge/escape, collision, camera tracking, and edge cases |
| Combat feel and responsiveness | 15% | Representative pack fight in base form and each transformation; input latency and hit feedback observations |
| Transformation depth | 12% | Each form’s movement, complete combat kit, tactical role, transition, limits/costs, and a situation where it is meaningfully best |
| Enemy and encounter design | 10% | Every standard enemy type, mixed pack composition, elite encounter, aggro/leash/reset behavior |
| Boss quality | 14% | Full uninterrupted fight including every phase, transition, death/retry, victory, and stress conditions |
| World art and exploration | 10% | Traversal through the whole biome, landmarks, paths, navigation, boundaries, environmental storytelling |
| Rendering, lighting, materials, VFX | 9% | Day/night or lighting states if present, close and wide views, combat readability, low-health/heavy-VFX moments |
| Animation and physics | 6% | Locomotion blends, attacks, reactions, deaths, transformations, collisions, projectile behavior |
| UI/UX and onboarding | 5% | First launch, control discovery, HUD states, cooldowns, boss presentation, restart, fullscreen/resize |
| Audio and atmosphere | 4% | Music/ambience/SFX mix during exploration, pack, elite, boss phases, low health, victory/death |
| Performance and robustness | 3% | Frame-time capture or browser profiling during worst-case combat, resize/focus/restart smoke tests |

## Evaluation standards

### Movement, controls, camera

- Input response feels immediate; inertia is intentional, not mushy.
- Character direction, aiming, locomotion, and attack commitment agree visually.
- Collision glides around obstacles and does not snag on decorative geometry.
- Camera preserves spatial awareness, avoids nausea, and handles boundaries/occlusion gracefully.
- Pointer capture, focus loss, resizing, and common desktop resolutions do not break control.

### Combat

- Every hit communicates anticipation, contact, and recovery through animation, sound, VFX, target response, and restrained camera impulse.
- Telegraphs are legible by shape, timing, color/value, and audio—not color alone.
- Cancel rules, recovery windows, cooldowns, ranges, and damage support deliberate decisions.
- Packs create complementary pressure rather than indistinct swarms.
- No dominant spam loop trivializes ordinary enemies, elite, or boss.

### Transformations

- At least three forms have distinct locomotion models and combat grammars.
- Each form changes positioning, threat response, and optimal targets—not just statistics or silhouettes.
- Swapping is responsive, visually authored, readable, and balanced by meaningful timing/cost/commitment.
- Forms remain useful in elite and boss play without becoming mandatory single-answer gimmicks.

### Enemies, elite, boss

- Silhouette, motion, effects, and audio make threat types recognizable before reading UI.
- Attacks have fair telegraphs, intentional punish windows, and robust state transitions.
- Elite meaningfully recombines mechanics and pressures mastery rather than only adding health/damage.
- Boss phases alter decision-making and arena use; transitions are theatrical but concise.
- Arena hazards, adds, projectiles, melee pressure, and camera framing remain simultaneously readable.

### World and presentation

- Biome has a distinct visual thesis, authored landmarks, compositional hierarchy, and traversal rhythm.
- Materials respond coherently to lighting; objects are grounded through shadows, contact, scale, and placement.
- Atmosphere adds depth without crushing blacks, fogging out telegraphs, or hiding navigation.
- UI has consistent typography, spacing, hierarchy, and states; it does not resemble a debug overlay.
- Audio has hierarchy, variation, spatial placement, and enough headroom for critical cues.

### Performance and robustness

- Target is stable 60 FPS on the agreed desktop profile, with 1% lows above 45 FPS in the worst encounter.
- Avoid recurrent shader compilation stalls, runaway particles, allocation spikes, and unbounded entities.
- Static build works from a normal static host and browser console has no recurring errors.

## Mandatory version evidence

Every reviewed version must provide:

1. Git commit or immutable build identifier and version label.
2. Exact launch command, URL, browser, viewport, machine/GPU, and graphics settings.
3. Full playthrough recording from first input to boss victory, without cuts hiding failures.
4. Separate clips or reproducible timestamps for base form; every transformation; every enemy; elite; every boss phase; death/retry; and victory.
5. Representative screenshots: world establishing shot, traversal landmark, mixed pack, each form in motion/combat, elite, each boss phase, low-health/heavy-VFX stress, victory, and relevant UI.
6. Browser console capture and performance trace/frame-time evidence during the worst-case fight.
7. Audio-on recording or direct live inspection; screenshots cannot validate audio or feel.
8. Known-issues list. Claims unsupported by evidence are scored as unverified (0).

## Review loop and defect policy

For each version:

1. Verify build identity and launch.
2. Run first-time-player smoke test with no developer guidance.
3. Traverse the entire biome and probe boundaries, collision, focus, resize, pause/restart, and death.
4. Exercise every move in every form against both single and mixed targets.
5. Complete every encounter, elite, and all boss phases; retry at least once.
6. Capture evidence and score independently.
7. File defects by severity and owner, with reproduction, evidence, impact, and acceptance criteria.
8. Re-test all P0/P1 fixes and regression-smoke all adjacent systems.
9. Record the honest delta and remaining problems before the version can close.

Severity:

- **P0 Blocker:** cannot launch/complete; data loss; catastrophic render/control failure.
- **P1 Critical:** commercial-quality rejection gate; major feel/readability/performance/fairness defect.
- **P2 Major:** conspicuous polish, balance, consistency, or reliability issue that materially harms the slice.
- **P3 Minor:** localized imperfection with small play impact.

A defect closes only when the acceptance criteria are demonstrated in a new captured run. A code change or verbal assertion is not closure.

## Version sign-off template

- Build/version:
- Test environment:
- Evidence paths:
- Hard gates: PASS/REJECT
- Weighted score:
- Strongest quality:
- Weakest quality:
- P0/P1 open count:
- Verdict: REJECT / ITERATION PASS / CHECKPOINT QUALITY PASS
- Honest assessment:
- Prioritized defects:
- Re-test notes:

