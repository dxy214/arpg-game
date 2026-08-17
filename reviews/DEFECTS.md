# Supervisor Defect Register

## Version 18 disposition

- **Iteration status:** PASS — the flat boss platform is now a U-shaped ruined
  Bell Sanctum with original floor/wall/runner textures, layered architecture,
  wetness, debris, wall dressing, practical lighting and room-aware camera framing.
- **Visual status:** MATERIALLY IMPROVED BUT 4.5 REJECTED — the boss-room
  environment scores approximately 4.0/5 against the fixed interior references.
  It still lacks bespoke sculpted modular architecture, deep normal/AO response,
  ceiling treatment, dense story props and commercial shadow composition.
- **Technical status:** final `npm test` passes 14/14 contract/collision tests and
  2/2 static tests. The measured main V18 candidate held 60.00/56.84 average/
  1%-low at LOW with a clean console; exact-final U-wall telemetry is not claimed.

## Version 17 disposition

- **Iteration status:** PASS — the Bell-Saint now moves with phase-specific
  chase/retreat/strafe behavior, uses shared collision, and keeps cast locations
  world-locked. Boss energy-ball attacks are removed and replaced by cleaves,
  jagged ground fractures, shock rings, and delayed shard sigils.
- **Presentation status:** IMPROVED BUT REJECTED — real spacing and non-ball
  topologies materially improve the fight, but transition layers remain flat and
  busy, animation is still generic Mixamo, terrain aftermath is shallow, and the
  defeat sequence is unchanged. SUP-013 remains open.
- **Technical status:** final `npm test` passes 14/14 contracts/collision tests
  and 2/2 static tests. LOW Phase III is 60.00/56.44 average/1%-low with a clean
  console on the measured Apple M5 host.

## Version 16 disposition

- **Iteration status:** PASS — Mixamo Skeletonzombie and Warrok assets are
  downloaded, reproducibly converted, structurally validated, integrated in the
  production build, played through combat/boss victory, and measured at LOW and
  HIGH with clean consoles.
- **Presentation status:** IMPROVED BUT REJECTED — Warrok is the strongest boss
  body so far and the standard enemies now have real textured skinning. Role
  diversity, bespoke attack/phase animation and environment/VFX integration are
  still below the fixed V Rising reference.
- **Population/readability:** enemy population is intentionally reduced 13→9;
  the long ranged rectangular lane is removed and replaced by a compact caster
  pulse plus projectile readability.

## Version 15 checkpoint disposition

- **Iteration status:** PASS — original environment textures, non-primitive
  procedural landmark/prop geometry, real production-preview inspection,
  collision regression, LOW/HIGH performance, storage, and static-build gates
  are complete.
- **World status:** IMPROVED BUT REJECTED — stone, bark, gravestones, trees,
  chapel, aqueduct, gate, rocks, roots, foliage crowns and fallen logs have
  materially stronger surface and silhouette variation. Against the fixed
  V Rising world reference, the biome still lacks dense canopy layering,
  sculpted terrain transitions, decals, small-prop storytelling and commercial
  material depth. SUP-012 remains open.
- **Technical status:** `npm test` passes 14/14 contract/collision tests and 2/2
  static tests. LOW is 60.00/56.59 and HIGH 60.00/56.71 average/1%-low with
  zero resource growth and zero captured console issues on the measured host.

Open defects are ordered by severity and player impact. Version 12 has completed its bounded one-character Quaternius CC0 trial, but the candidate is visually rejected and V11 remains the default. The negative result may close the experiment; it does not close any commercial-quality defect.

## Version 12 final disposition

- **Iteration status:** PASS — one external CC0 candidate was reproducibly converted, validated, rendered in the real game, compared against V11 and the fixed official references, rejected honestly, routed behind an explicit query, and tested through default/fallback, performance, package, and static-build paths.
- **Candidate status:** REJECTED — approximately **1.6/5** at gameplay scale, materially below V11 Nightbound's already insufficient **3.0–3.2/5**. It is a 956-triangle, untextured, weaponless basic figure with weaker role silhouette and material/costume hierarchy.
- **Release status:** default remains `ready:v11`; explicit candidate is `ready:v12`; single-asset failure returns `fallback:v11`; total authored failure returns `fallback:procedural:v12,v11`.
- **Technical status:** supplied full `npm test` passed TypeScript, 9/9 contracts, production build, and 2/2 static tests. Independent supervisor replay passed both GLB validators and 9/9 contracts plus 2/2 static tests. Earlier invisible-material and animated-root-scale P0s are fixed in the exact candidate GLB and final rendered frame.
- **Performance/storage:** production LOW was 60.00/56.62 average/1%-low at DPR 0.65; HIGH was 60.00/55.87 at DPR 1.25, both console-clean. `dist` is 15.85 MiB allocated, main gzip 199,092 bytes, candidate GLB 361,240 bytes, and project excluding dependencies 338.04 MiB.
- **Evidence limit:** no final uninterrupted candidate motion capture was supplied. Structural mixer stability passes, but locomotion, foot planting, attack contact, hurt, transform, death, and retry cannot receive a perceptual pass. This does not block closure of an already visually rejected, non-default trial.

## Version 11 final disposition

- **Iteration status:** PASS — implementation, launch, live playtest, screenshot/motion inspection, supervisor criticism, fixes, performance/storage measurement, and independent retest were completed.
- **Visual-quality status:** REJECTED — total score **3.0/5**; Nightbound **3.0–3.2/5**, below the required 3.5/5 gate and visibly below the fixed V Rising references.
- **Technical status:** `npm test` passed typecheck, 8/8 contracts, build, and 2/2 static tests. LOW Phase III was 60.00/56.25 FPS average/1% low; locked HIGH was 60.00/55.97; both console-clean. `dist` was 15.50 MiB; main entry 198,468 bytes gzip; project excluding `node_modules` 334.14 MiB.
- **Asset-path status:** three original Blender-authored skinned GLBs (Nightbound, Husk Mourner, Bell-Saint) are integrated, and graceful runtime fallbacks remain present.
- **Evidence limit:** normal final production load is proven. An earlier forced-fallback live frame is playable, but an exact-final-production fallback screenshot was blocked by the in-app browser security policy and could not be retried. That exact combination remains unverified.

## Open

| ID | Severity | Area / owner | Defect | Evidence and judgment | Player impact | Acceptance criteria | Status |
|---|---|---|---|---|---|---|---|
| SUP-004 | P1 | Character / enemy / rigging / animation | Authored actors still read as rigid stylized mid/low-poly assemblies, not commercial dark-fantasy characters; the V12 stock candidate makes the player worse. | V11 evidence shows faceted heads, segmented limbs, mitten hands, flat cape/skirt pieces, shallow skin deformation, weak material response, and cloned Husk poses. V12 `v12-knight-opaque-fixed.jpg` / `v12-production-candidate.jpg` add a correctly visible and scaled but generic 956-triangle, untextured, weaponless figure with a bare faceted head and almost no combat silhouette. It scores ~1.6/5 versus V11 Nightbound 3.0–3.2 and Husk ~2.9. Against `official-24.jpg` and `official-15.jpg`, anatomy, costume hierarchy, weapon read, materials, pose separation, and grounding remain decisively weaker. | V11 actors remain upgraded prototypes/toys; making the V12 candidate default would further weaken player identity and attack readability. | Replace the hero only with a candidate that first demonstrates layered authored topology, hands/feet/face, weapon and role silhouette, baked material detail, clean weights, cloth/secondary motion, planted locomotion, and close matched gameplay evidence scoring ≥3.5/5. A representative enemy must independently meet the same floor before this combined defect can close. | Open — V12 candidate rejected |
| SUP-012 | P1 | World / rendering / environment art | V15 removes much of the literal cylinder/box/card read and adds original tiled stone/bark surfaces, but the Hollow March is still too sparse and weakly layered for the fixed commercial reference. | `v15-environment-chapel-final.jpg`, `v15-aqueduct-textured.jpg`, `v15-forest-textured.jpg`, and `v15-static-preview-chapel.jpg` prove gnarled ring-built trunks, irregular rocks, extruded Gothic graves, lathed ruin piers, arched aqueduct spans, chipped platforms/steps, instanced leaf crowns/fallen logs, and shared albedo+bump stone/bark materials. They are a real improvement over V14. Against `official-20.jpg` and `official-26.jpg`, surfaces remain broadly tiled, the water/bank silhouette is flat, canopy/understory density is low, architecture has limited sculpted detail, and scene composition lacks rich foreground/midground/background overlap. World score improves from ~2.8 to ~3.1/5, below the ≥3.5 gate. | Exploration now reads less like colored primitives, but still resembles a polished stylized prototype rather than a dense handcrafted commercial biome. | Add terrain splat/macro masks and decals, authored modular ruin meshes with trim/normal/AO detail, denser clustered vegetation/roots/rubble, layered shore/water materials, stronger local light probes and occlusion-safe depth framing while preserving combat space and the current performance envelope. | Open — materially improved in V15 |
| SUP-013 | P1 | Boss / VFX / encounter animation | V17 makes the Bell-Saint mobile and removes all fired energy balls, but the replacement ground spectacle and defeat remain below commercial depth. | `v17-boss-mobile-phase1.jpg`, `v17-boss-sigils-phase2.jpg`, and `v17-boss-rifts-phase3.jpg` prove phase-specific chase/retreat/strafe spacing plus cleave, jagged-rift, ring, and delayed-sigil topologies. This is a real improvement over recolored radial projectiles and raises the complete boss presentation to ~3.45/5. Against `official-10.jpg`/`official-15.jpg`, transition layers are still flat/busy, fractures lack textured terrain response, debris/aftermath and secondary motion are thin, Mixamo clips are generic, and defeat is unchanged. | The boss now feels like a moving combatant and threats are readable, but peak spectacle still looks procedural rather than authored at V Rising quality. | Add boss-specific locomotion/cast/slam/transition/defeat clips; decal/normal-driven fractures, dust/debris and persistent aftermath; cleaner transition composition and local light response; reach ≥3.5/5 in comparable gameplay and motion evidence. | Open — materially improved in V17 |
| SUP-014 | P2 | Combat feel / animation / capture | Continuous motion is finally evidenced, but force transfer, reaction quality, foot planting, and audiovisual synchronization remain below target. | Nightbound, Husk, and boss WebPs/contact sheets show no T-pose, fatal state lock, or catastrophic mesh tearing. Attack phases and transformation out/in exist. Motion remains dominated by rigid joint rotations; foot/root behavior, hip/shoulder arcs, overshoot, recoil, hit-stop, recovery, enemy desynchronization, and cloth follow-through are weak. No synchronized-audio recording exists. Score ~3.0/5. | Controls function, but attacks and transformations look lightweight and mechanical. | Supply close 60 fps real-time captures showing planted movement, directional turns, anticipation→contact→hit-stop/reaction→recovery, secondary motion, varied pack timing, boss transitions and defeat, plus audible synchronization. | Open |
| SUP-017 | P2 | UI / accessibility | The HUD remains too small and low-contrast at the tested 1280×720 viewport. | Final production capture has intact glyphs, but form descriptions, controls, cooldown numerals, and boss/phase microcopy are tiny condensed all-caps text over translucent fields. Important information competes with center announcements. Keyboard focus and semantic accessibility are still unverified. | Players can miss abilities, cooldowns, and phase information during action, especially at laptop viewing distance or with reduced vision. | Increase critical type scale/contrast, simplify combat-time microcopy, strengthen cooldown/phase hierarchy, and separately verify focus, keyboard navigation, semantics, and contrast. | Open |
| SUP-018 | P2 | Audio | Audio presentation remains perceptually unverified. | Evidence consists of stills and silent animated WebPs. Implementation claims cannot establish impact, ambience, spatial placement, phase escalation, repetition, masking, mix headroom, or synchronization. | No honest commercial-quality audio judgment can be made; audiovisual combat polish is unproven. | Provide a real-time recording with audio across roaming, every transformation, group/elite combat, and all boss phases; review transient punch, spatial clarity, ambience, repetition, masking, dynamic range, and sync. | Open |
| SUP-020 | P2 | Performance / scalability | Production 60 Hz delivery is strong on the measured host but lower-end hardware and long-run headroom remain unproven. | V12 exact-production LOW reached 60.00/56.62 at DPR 0.65 and HIGH reached 60.00/55.87 at DPR 1.25 on Apple M5, both console-clean. This closes the earlier dev-server and HIGH-DPR evidence gaps. The 60 Hz cap still hides spare headroom, only one 30 s active window per tier was sampled, and HIGH ended +6 objects/+6 geometries. | The current slice is stable at intended LOW/HIGH DPR on the measured machine; scalability to weaker integrated GPUs, larger scenes, and repeated lifecycle cycles is unknown. | Sample representative lower-end GPU hardware, uncapped/headroom mode, and repeated Phase III→restart cycles with settled resource readings; investigate any repeatable object/geometry growth. | Open |
| SUP-023 | P1 | V14 player asset / combat presentation | The Mixamo Vampire is a real anatomy/animation upgrade but is not a complete Nightbound replacement. | Final V14 idle/attack/hurt/death renders show a textured, skinned 15k-triangle humanoid with stable roots and readable authored poses, approximately 3.3/5. It has no weapon, a narrow/dark isometric silhouette, only one slash reused for all attacks, no authored dash/transform, and weaker cloth/material response than the fixed V Rising character reference. | Opt-in play looks better than V11, but attacks visibly pantomime a missing weapon and do not express the existing dual-blade kit; promoting it by default would create a mechanics/presentation mismatch. | Attach an authored weapon to the correct hand bone; add distinct primary/secondary/ultimate/dash/transform clips; tune material values and gameplay-scale silhouette; capture continuous motion/contact and reach ≥3.5/5 against the fixed reference before default promotion. | Open — explicit V14 candidate only |
| SUP-025 | P1 | V16 enemy role art / animation | All four ordinary roles and the elite now share the same Mixamo Skeletonzombie mesh and generic five-clip set. | `v16-production-enemies.jpg` proves a real textured/skinned upgrade and per-role scale separation, but caster, stalker, melee and elite identities collapse into near-clones. The elite's gameplay telegraph distinguishes its slam, not its body/weapon identity. | Players have weaker pre-attack role recognition and encounter variety even though individual anatomy/material quality improves. | Add at least one caster-specific and one elite-specific textured/skinned asset; give melee/caster/elite distinct attack silhouettes and readable weapons/props, preserve the nine-enemy cap, and score each role ≥3.5/5 at gameplay scale. | Open |

## Closed or functionally accepted

| ID | Closed evidence |
|---|---|
| SUP-001 | V6 supplied the named world/transformation/character/VFX/enemy/boss capture set and a console-clean exact-build comparison board. Later visual-quality gaps remain in SUP-004/012/013/014. |
| SUP-002 | Reverified through V12: supplied typecheck, 9/9 contracts, production build, and 2/2 static tests pass; independent supervisor replay passed 9/9 contracts and 2/2 static tests. The >500 kB raw entry warning is advisory; gzip remains within the explicit budget. |
| SUP-003 | V1 safe-opening evidence established deliberate traversal before pack combat; later retry evidence remains functional. |
| SUP-005 | V4 paired evidence proved distinct primary/secondary/traverse execution for all forms. Functional kits are accepted; subjective timing/animation quality remains in SUP-014. |
| SUP-006 | V3/V11 phase, gate, death, retry, and victory evidence confirms coherent boss state progression and completion integrity. Presentation quality remains in SUP-013. |
| SUP-007 | V5 established the LOW Phase III performance gate; V11 independently exceeds it at 60.00 average / 56.25 FPS 1% low with zero console issues. Broader scalability is now SUP-020. |
| SUP-010 | Phase-specific pink/cyan/amber hazard identities remain readable at LOW and normal/HIGH captures. Spectacle depth remains SUP-013. |
| SUP-015 | V9 fixed camera-strip tree obstructions at field and boss entry; no recurrence is visible in V11 evidence. |
| SUP-016 | Stonewrought remains readable against the arena with cool-slate massing and amber form identity. Its rigid anatomy is intentionally covered by the broader character-quality defect SUP-004. |
| SUP-019 | V12 exact-production evidence closes the prior fallback gap: default reports `ready:v11`, explicit candidate `ready:v12`, single-asset failure `fallback:v11`, and total authored failure `fallback:procedural:v12,v11`. Static-host screenshots show intact UI/playable scenes and the 2/2 static suite passes. |
| SUP-021 | V12 supplied exact-build final candidate renders, V11 default comparison, official-reference inspection, CC0/source/GLB provenance, structural and Three.js validation, fallback routing, performance JSON/panels, and storage/build evidence. The evidence conclusively rejects the candidate at ~1.6/5 rather than proving improvement. The trial question is closed; SUP-004 remains open and V11 remains default. |
| SUP-022 | `reviews/performance/V12_PERFORMANCE_REPORT.md` now records `Final verdict — PASS`, the final 60.00/56.62 LOW and 60.00/55.87 HIGH measurements, production runtime matrix, deltas, and retained caveats. No pending/sign-off wording remains. |
| SUP-024 | V14 root-motion integration incidents are closed. The converter zeros all Mixamo Hips translation, structural validation finds no suspicious translation channels, and final rendered attack/hurt/death diagnostics keep the skinned bounds within about 1.2 m of the gameplay actor with roots coincident and bounds in-frustum. |

## Version 12 resolved implementation incidents

- **Invisible candidate material:** earlier frames showed the FBX-derived alpha/transparency failure. Final conversion forces all three materials to opaque alpha 1; Three.js validation and `v12-knight-opaque-fixed.jpg` confirm the exact candidate is visible. Resolved before final review.
- **Animated root-scale collapse:** earlier clips could drive the authored root toward ~0.3215 scale. Final conversion removes constant object-scale tracks, runtime locks authored root scale, and every validator sample remains `[1,1,1]` with visible extent ≥1 m. Resolved before final review.

## Version 12 closure directive

Version 12's bounded loop is complete and may close as an iteration pass with the candidate visually rejected. Keep V11 as the default; do not describe the optional V12 asset as an upgrade, commercial quality, or V Rising-level. No P1 visual defect closes. Stop after Version 12 and do not begin another asset search, broader replacement, or Version 13 without explicit user direction.
