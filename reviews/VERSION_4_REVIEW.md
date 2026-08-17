# Supervisor Review — Version 4

**Verdict: ITERATION PASS / HARD QUALITY REJECTED.** Version 4 adds the first honest runtime telemetry, materially improves worst-case stability, verifies all form-kit inputs, and passes deterministic/static-build regression. It does not pass the commercial performance gate, and low-tier visual compromises are conspicuous.

## Evidence inspected

Form Art / secondary:

- `evidence/v4-nightbound-blood-crescent.png`
- `evidence/v4-wraith-veil-burst.png`
- `evidence/v4-dreadwolf-pounce.png`
- `evidence/v4-stonewrought-slam.png`

Primary + traverse pairs:

- `evidence/v4-nightbound-traverse-primary.png`
- `evidence/v4-wraith-traverse-primary.png`
- `evidence/v4-dreadwolf-traverse-primary.png`
- `evidence/v4-stonewrought-traverse-primary.png`

Performance and regression:

- `reviews/performance/PERFORMANCE_REPORT.md`
- `reviews/performance/v4-blank-baseline.json`
- `reviews/performance/v4-phase3-sample.json`
- `reviews/performance/v4-phase3-candidate2.json`
- `reviews/performance/v4-phase3-candidate3.json`
- `reviews/performance/v4-phase3-final.json`
- `evidence/v4-performance-phase3.png`
- `evidence/v4-performance-phase3-candidate2.png`
- `evidence/v4-performance-phase3-candidate3.png`
- `evidence/v4-performance-phase3-final.png`
- `npm test` passes 8 source contracts, typecheck, production build, and 2 static-dist tests

## Transformation verdict

Functional evidence now shows all four kits producing distinct Art/secondary and primary/traverse states. Cooldown counters corroborate recent inputs, while silhouettes and roles remain clearly separated:

- Nightbound: balanced close-range blades, Blood Crescent, Shade Step.
- Wraith: ranged Soul Lance, Veil Burst, long phase traversal.
- Dreadwolf: fastest pursuit, Ruinous Pounce, Hunt Rush.
- Stonewrought: heavy Hammerfist, Seismic Slam, Bulwark Charge and mitigation.

This closes the functional evidence defect. It does not establish commercial responsiveness or balance: still frames cannot prove input latency, cancel windows, hit-stop, sound impact, or whether form choices remain optimal under normal-damage pressure.

## Performance verdict

The first real stress run was catastrophic: roughly 35.3 average / 18.2 FPS 1% low after the earliest correction, with an earlier observation around 25.8 / 8.0. The probe and runtime were then improved through forced tiers, shader warmup, lower update perturbation, capped fixed catch-up, boss-world culling, instancing, and lower render scale.

Best controlled result:

- Forced LOW, 1280×720 CSS, DPR 0.65
- 45.54 average FPS / 32.98 FPS 1% low
- Median 21.9 ms; p95 27.1; p99 29.3; max 32.0
- 96 draw calls; 11,771 triangles; 201 geometries; 20 programs; 489 objects
- Empty runtime baseline on the same IAB: 54.96 average FPS with severe external tail variance

Final frozen-code repeat:

- 43.26 average / 29.86 FPS 1% low
- Median 22.7 ms; p95 29.5; p99 32.4; max 36.8
- 76 calls; 9,947 triangles; 181 geometries; 26 programs; 469 objects

The improvement is substantial and the final tail is stable, but neither result meets the absolute target of near-60 average and ≥45 FPS 1% low. The IAB blank baseline also fails a normal 1%-low expectation, so the run is useful for relative optimization but cannot certify an unthrottled desktop-browser target. SUP-007 stays open.

## Quality score

**Evidence-weighted score: approximately 2.3 / 5.0.** Transformations rise to about 2.8/5 from functional evidence; performance/robustness rises from unverified to about 1.8/5 because instrumentation and regression are real, but the actual frame-rate gate fails.

## Harsh assessment

The project is now more testable and honest than many prototypes: QA routes, live telemetry, static-host checks, clean console, bounded effects, resize regression, and transparent failed measurements are all valuable. The forms have distinct tactical intent and readable silhouettes.

The performance trade is not yet acceptable for a commercial action RPG. LOW at 0.65 render scale is visibly soft and the boss arena becomes sparse and flat, yet still misses the absolute 1%-low target. The form effects also remain simple: Blood Crescent reads as a large opaque blob, Veil Burst is subtle, and primary/traverse contact is hard to parse when the player overlaps the boss. Do not describe this as 60 FPS or fully responsive.

Focus blur/resume remains unverified. Both the subagent and root browser surfaces attempted controlled-tab switches, a temporary tab, address-bar focus, and a Codex-file switch, but the game continued reporting `document.visibilityState = visible` and focused state. This was correctly logged rather than simulated.

Final regression: `npm test` passes 8/8 contracts, production build, and 2/2 static-host tests. Final bundle is approximately 647.14 kB minified / 170.38 kB gzip with the known Vite advisory.
