# Version 18 review — Bell Sanctum environment overhaul

## Verdict

**ITERATION PASS / BOSS-ROOM ENVIRONMENT MATERIALLY IMPROVED / 4.5 TARGET NOT YET HONESTLY MET.**

The former flat blue-grey arena has been replaced by an original ruined Bell
Sanctum: textured wet flagstone, chipped foundation and rim, a U-shaped carved
apse and side-wall enclosure, recessed pointed windows, buttresses, wall ribs,
ivy, debris, damp patches, a worn runner, altar and bell dressing, banners, and
layered warm/cool practical lighting. The boss camera now keeps the room in the
composition while retaining player/boss tracking and readable floor attacks.

## Fixed-reference comparison

Compared side by side with `official-01.jpg`, `official-06.jpg`, and
`official-24.jpg`, the V18 room has a much stronger authored material hierarchy,
recognizable architectural boundary, focal runner/apse, and practical-light
rhythm than V17. Combat readability remains strong: floor tells consistently
outrank the low-contrast inlays, carpet and wet patches.

The room does **not** honestly score 4.5/5 against those commercial references.
The harsh current score is approximately **4.0/5 for the boss-room environment**
(up from roughly 2.7–3.0 for the old functional platform). The remaining gap is
concentrated in high-value assets: the wall silhouettes and altar are still
procedurally assembled, window/trim relief is shallower, there is no bespoke
ceiling/roof or high-detail sculpted modular kit, and the room lacks the dense
prop storytelling, baked AO/normal depth and richer shadow composition visible
in the fixed V Rising interiors. The full boss presentation also inherits the
existing generic boss-animation/VFX limitations and therefore scores lower than
the room in isolation.

## Original project assets

- `bell-sanctum-floor-v1.jpg` — original AI-assisted rain-darkened slate floor.
- `bell-sanctum-wall-v1.jpg` — original AI-assisted carved gothic masonry.
- `bell-sanctum-runner-v1.jpg` — original AI-assisted worn crimson runner.
- Full source PNGs are retained under `art_source/textures/`; no V Rising image,
  symbol, texture, model or proprietary asset is included.

## Rendered evidence

- [`v18-bell-sanctum-final.jpg`](./evidence/v18-bell-sanctum-final.jpg) — final
  HIGH Phase-I room composition and active sector tell.
- [`v18-bell-sanctum-phase2.jpg`](./evidence/v18-bell-sanctum-phase2.jpg) — Phase-II
  room/tell readability before the final U-wall refinement; retained as iteration
  evidence, not the canonical beauty frame.
- [`v18-performance-low.jpg`](./evidence/v18-performance-low.jpg) — 30-second LOW
  telemetry from the pre-U-wall candidate. Final structural code is covered by
  the automated suite; exact post-U-wall LOW replay is a documented follow-up.

## Technical result

Final `npm test` passes TypeScript, 14/14 contract/collision tests, production
build, and 2/2 static-host tests. The final app entry is
`index-Bi1eDW8C.js`, 190,560 bytes raw / 58,492 bytes gzip-9, SHA-256
`5e2aaa53d9d0e06907dc791e1cf831b98eeeaa86d5e9e5842eff603f1c85ec69`.
Deployable `dist` is approximately 64 MiB.

The measured 30-second LOW run reached **60.00 average / 56.84 FPS 1%-low**,
p99 17.5 ms, with zero console warnings/errors. That telemetry predates the last
batched U-wall/runner refinement, so it is evidence of the main V18 material and
apse pass, not a dishonest exact-final performance claim. The final additions
are primarily batched/static, but exact-final LOW should be re-sampled before a
checkpoint-level performance statement.

Version 18 may close as a substantial environment iteration, with the 4.5 target
remaining open rather than falsely marked complete.
