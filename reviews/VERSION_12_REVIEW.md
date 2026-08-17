# Supervisor Review — Version 12

**Final status: ITERATION PASS / CC0 CANDIDATE REJECTED / V11 DEFAULT RETAINED / COMMERCIAL VISUAL QUALITY REJECTED.** Version 12 answered its deliberately narrow question: one character from Quaternius' CC0 Animated Knight Pack can be converted, loaded, animated, failed over, and shipped cheaply through the local runtime, but it is **materially worse than the V11 Nightbound in the actual game**. It must not become the default. Keeping it behind the explicit `?character=v12` evaluation query and restoring V11 as normal play is the correct release disposition.

The bounded experiment may close. This is not acceptance of the candidate, closure of SUP-004, or evidence of V Rising-level presentation. Do not expand to another character or Version 13 without explicit user direction.

## Executive verdict

The final V12 frame fixes the two earlier P0 presentation failures: the candidate is no longer invisible through material alpha and no longer collapsed by animated root scale. The final GLB is structurally sound, grounded at about 1.8 m, has a 42-joint skin and six runtime clips, remains at unit root scale through sampled clips, and uses three fully opaque materials. Exact production evidence also distinguishes normal V11, explicit V12, V12→V11 failure, and V12/V11→procedural failure paths.

Those engineering results do not rescue the art. `v12-knight-opaque-fixed.jpg` and `v12-production-candidate.jpg` show a very small, generic low-poly civilian/novice figure: a faceted bare blond head, plain blue/black tunic masses, tiny hands and feet, no helmet, no weapon, no cape, no readable armor construction, no texture detail, and almost no dark-fantasy role silhouette. The candidate has only 956 triangles and three flat untextured materials. At the locked game camera it loses the broad shoulder, cape, hood, oxblood accent, and glowing crescent silhouette that at least make V11 Nightbound legible. The V12 candidate scores approximately **1.6/5** for in-game character presentation, versus V11's already insufficient **3.0–3.2/5**.

Against fixed `official-24.jpg`, V12 lacks layered anatomy and costume, hair/cape flow, metal/cloth separation, weapon mass, small authored breaks, and grounded character authority. Against `official-02.jpg` and `official-15.jpg`, it also lacks a combat-readable weapon/action silhouette and material/value hierarchy. The replacement makes the reference gap larger, not smaller.

## Exact build and evidence inspected

- Locked production entry: `dist/assets/index-CIumqGUk.js`, 749,944 bytes, deterministic gzip 199,092 bytes, SHA-256 `ddab6e7741be70ec47d8c564599adb9b9e6a6092e7e8bab564d4d900fde97d9f`.
- Lazy character runtime: `CharacterAssetRuntime-DPtFPyOC.js`, 51,885 bytes, SHA-256 `dd866d0c7ad6c4ec41d438ce8007bda40ea22b594d9e0bc2b66c4f38a706111f`.
- Candidate: `quaternius-knight-DBTCfe9f.glb`, 361,240 bytes, SHA-256 `afc6a309f497c87e503f8a1fa591d84b0b636d998a2fb55e2f8e16ad9ff144a1`. The deployed file matches the source GLB hash.
- Final candidate renders: `reviews/evidence/v12-knight-opaque-fixed.jpg` and `v12-production-candidate.jpg`.
- Homologous default comparison: `reviews/evidence/v12-production-default-v11.jpg`, checked against V11's `v11-nightbound-close-facing.png` and `v11-reference-board.jpg`.
- Earlier failed frames: `v12-knight-gameplay.jpg`, `v12-knight-inspect-fixed.jpg`, `v12-knight-normal-fixed.jpg`, and `v12-knight-normalcamera.jpg`; these document the invisible/root-scale incident and are not final acceptance evidence.
- Fallback/static frames: `v12-fallback-v11-camera.jpg`, `reviews/performance/v12-static-normal.png`, `v12-static-fallback-v11.png`, and `v12-static-fallback-procedural.png`.
- Performance: `reviews/performance/v12-phase3-low.json`, `v12-phase3-high.json`, `reviews/evidence/v12-performance-low.jpg`, and `v12-performance-high.jpg`.
- Package report: `reviews/V12_STORAGE_REPORT.md` and `reviews/performance/bundle-metrics.json`.
- Provenance: `art_source/quaternius/ASSET_PROVENANCE.md`.
- Fixed official review sources: `official-24.jpg` primarily, with `official-02.jpg` and `official-15.jpg` for combat-scale judgment; provenance remains in `reviews/references/v-rising/SOURCES.md`.

The independent supervisor reran both Quaternius validators successfully. The structural validator confirmed the exact GLB hash, 956 triangles, 2,046 exported vertex records, one mesh/skin, 42 joints, three opaque materials, no images, grounded 1.8 m bind height, and six positive-duration clips. The Three.js mixer validator confirmed unit root scale, visible bounds, and opaque/visible materials at five samples of every clip. The supervisor also reran the 9 source contracts and 2 static tests: **11/11 passed**. The supplied locked full `npm test` result additionally reports TypeScript, production build, 9/9 contracts, and 2/2 static tests passing.

## Candidate visual judgment — 1.6/5, FAIL

The final correction proves the actor is genuinely rendered, not a fallback, and is plausibly human-proportioned. That is the limit of the improvement. At real play scale the large bare head dominates while the narrow body collapses into two dark blocks. The three flat colors do not read as differentiated armor, leather, cloth, and skin under the Hollow March lighting. There is no weapon even though the gameplay HUD says Dusk Blades and the attack clip derives from `swordAttackJump`. Hands, feet, face, armor edges, and secondary silhouette elements do not survive the camera.

V11 is crude and rigid, but its broad armored shoulders, hood, three-part cape, oxblood mass, steel arms, and bright crescent communicate a named combatant. V12 removes most of that readable information. The candidate is not a lateral stylistic alternative; it is a clear downgrade of presentation, identity, and attack readability.

## Skeleton, animation, and state judgment — structural PASS / perceptual evidence incomplete / candidate rejected

The final GLB's sampled mixer data establishes that the former animated-scale collapse is fixed and that all six clips can be evaluated without invisible material, root-scale failure, or sub-one-metre full-body collapse. This is credible structural stability evidence for idle, move, attack, hurt, death, and transform clips.

It is not commercial motion evidence. No final uninterrupted in-game candidate clip/contact sheet was supplied for locomotion, turning, repeated primary attack, hurt, transform out/in, death, or retry. The provenance also discloses that `hurt` is the source `Roll` action and `transform` is the source `Jump` action—compatibility placeholders rather than authored reactions—and the sword attack has no weapon mesh. Therefore foot planting, root motion, attack contact, clipping, hit reaction, transformation continuity, death finish, and retry pose cannot receive a perceptual pass.

This missing motion proof does not require keeping the bounded experiment open: the candidate already fails the mandatory rendered visual gate decisively and is not selected by default. It does mean the candidate itself is **not accepted as gameplay-ready**, even for animation quality.

## Fallback, runtime, and build judgment — PASS for the retained V11 release path

The final path matrix is coherent:

| Production path | Final diagnostic / disposition |
|---|---|
| Default | `ready:v11` — correct retained presentation |
| Explicit `?character=v12` | `ready:v12` — isolated evaluation candidate |
| Explicit candidate plus `assetFail=1` | `fallback:v11` — authored fallback retained |
| Explicit candidate plus `assetFail=all` | `fallback:procedural:v12,v11` — procedural fallback retained |

The static suite passes local asset resolution and plain-host query routing. The supplied static frames show intact UI and playable scenes on normal and both fallback routes. The candidate's failure cannot silently replace the V11 default, which is the critical release safeguard for this rejected trial.

## Performance and package judgment — PASS on the measured host

| Measure | V11 | Final V12 | Delta / judgment |
|---|---:|---:|---|
| LOW average / 1% low | 60.00 / 56.25 | **60.00 / 56.62** | Flat average, +0.37 1% low; pass |
| LOW DPR | 0.65 | 0.65 | Matched |
| LOW end calls / triangles | 91 / 19,102 | 97 / 20,254 | +6 / +1,152; acceptable |
| HIGH average / 1% low | 60.00 / 55.97 | **60.00 / 55.87** | Flat average, -0.10 1% low; pass |
| HIGH DPR | 1.0 | **1.25** | V12 exercised the intended higher DPR; not a perfectly matched load |
| HIGH end calls / triangles | 125 / 55,658 | 138 / 57,974 | +13 / +2,316; acceptable on host |
| Console/page issues | 0 | 0 | Pass |

Both final samples are exact production, 1280×720, 30 seconds after a 12-second Phase III warmup on Chrome 151 / WebGL2 ANGLE Metal / Apple M5. LOW easily exceeds the V12 ≥57 average and ≥53.44 1%-low regression thresholds and the >45 FPS hard floor. HIGH's maximum frame was 23.5 ms but sustained delivery and 1% low remain strong. Texture/program counts are flat during both windows; LOW cleans up 36 objects/3 geometries, while HIGH ends +6 objects/+6 geometries. One window does not prove lifetime leak freedom, but no monotonic texture/program growth is present.

Package budgets all pass: `dist` is 15.85 MiB allocated / 16,587,639 logical bytes, main gzip is 199,092 bytes, and project size excluding dependencies is 338.04 MiB. Versus V11, the optional candidate adds about 0.35 MiB to `dist`, 1,727 raw / 624 gzip bytes to the main entry, and 3.90 MiB to the repository footprint. No FBX, Blender, archive, Python, backup, or cache artifacts enter `dist`. The 749,944-byte main entry is only 56 bytes below the local 750,000-byte raw regression ceiling, so future edits have essentially no raw headroom even though the explicit 250 KiB gzip gate remains comfortable.

## Acceptance-gate disposition

| Gate | Result | Supervisor finding |
|---|---|---|
| Candidate identity/license | **PASS WITH MINOR RECORD LIMIT** | Official Quaternius page/mirror, author, CC0 1.0, source FBX path/hash, conversion settings, GLB hash, and technical inventory are recorded. The locked baseline additionally requested archive filename/hash, download date, and locally retained license text; these are not recorded. |
| Real game-scale improvement ≥3.5 | **FAIL — 1.6/5** | Final in-game render is visible and correctly scaled but markedly worse than V11 in silhouette, armor/costume, materials, weapon read, identity, and world separation. |
| Fixed V Rising comparison | **FAIL** | The gap to `official-24`, `official-02`, and `official-15` is larger than V11, not smaller. |
| Skeleton/root/material stability | **STRUCTURAL PASS** | Exact GLB and Three.js validators pass every sampled clip at unit scale with visible bounds and opaque materials; final rendered frame closes the prior invisible/scale P0s. |
| Locomotion/attack/hurt/transform/death/retry motion | **UNVERIFIED PERCEPTUALLY** | Six clips exist and sample safely, but no final uninterrupted in-game candidate motion evidence was supplied; hurt/transform are placeholders and attack has no weapon. |
| Gameplay/state regression | **PASS FOR DEFAULT / CANDIDATE NOT ACCEPTED** | Default remains unchanged V11. Explicit candidate/fallback routing and source/static contracts pass. Candidate gameplay quality is not accepted. |
| Production fallback/static deployment | **PASS** | Normal V11, explicit V12, V11 fallback, and procedural fallback are separated and evidenced; static routing and local references pass. |
| LOW/HIGH performance | **PASS on measured host** | 60.00/56.62 LOW and 60.00/55.87 HIGH, console-clean; HIGH additionally ran at DPR 1.25. |
| Package/storage | **PASS** | All budgets and hygiene checks pass; optional GLB cost is 361,240 bytes. Raw-entry ceiling has only 56 bytes headroom. |
| Automated/static checks | **PASS** | Supplied full suite passed; independent 9/9 contracts and 2/2 static tests plus both GLB validators passed. |

## Performance-report reconciliation

The earlier stale status in `reviews/performance/V12_PERFORMANCE_REPORT.md` is resolved. The report now records a final PASS, the exact-build LOW/HIGH measurements, the production runtime matrix, comparison deltas, and the remaining caveats without pending/sign-off wording. It is consistent with the raw JSON, rendered panels, and this review.

## Final directive

**Close Version 12 as a completed negative-result experiment.** The candidate is rejected, V11 remains the default, and no visual-quality defect is closed. The technically successful CC0 conversion/fallback pipeline may be retained for explicit evaluation, but its presence in `dist` must never be described as a player-character upgrade. Stop after Version 12 and wait for explicit user direction before any new asset search, broader replacement, or Version 13 work.
