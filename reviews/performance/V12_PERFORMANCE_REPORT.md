# Veilfall Version 12 performance and release verification

## Final verdict — PASS

**FINAL PASS on the measured Apple M5 host for the locked production build's LOW gate; HIGH also held the 60 Hz cap. All required performance and release measurements are complete.** Both runs used the default production character selection (`ready:v11`), a 1280×720 viewport, explicit quality lock, deterministic live-boss progression to Phase III, a 12-second Phase III warmup, and an uninterrupted 30-second in-page `PerformanceProbe` sample.

This is a controlled single-host result, not a general desktop guarantee. The HIGH run exercised DPR 1.25, whereas the V11 HIGH baseline was limited to DPR 1.0; that makes the HIGH resource/frame comparison useful but not perfectly matched.

## Final Version 12 results

| Field | LOW | HIGH |
| --- | ---: | ---: |
| Requested and measured tier | low | high |
| Viewport / pixel ratio | 1280×720 / 0.65 | 1280×720 / 1.25 |
| Sample | 30 s / 1,801 samples | 30 s / 1,800 samples |
| Average FPS | **60.00** | **60.00** |
| 1% low FPS | **56.62** | **55.87** |
| Median frame time | 16.7 ms | 16.7 ms |
| p95 / p99 / max | 17.1 / 17.5 / 18.4 ms | 17.0 / 17.4 / 23.5 ms |
| Start calls / triangles | 104 / 21,412 | 169 / 56,518 |
| End calls / triangles | 97 / 20,254 | 138 / 57,974 |
| Start resources | 1,177 obj / 248 geo / 89 tex / 23 programs | 1,171 obj / 351 geo / 96 tex / 52 programs |
| End resources | 1,141 obj / 245 geo / 89 tex / 23 programs | 1,177 obj / 357 geo / 96 tex / 52 programs |
| Sample delta | -36 obj / -3 geo / 0 tex / 0 programs | +6 obj / +6 geo / 0 tex / 0 programs |

Evidence: `v12-phase3-low.json`, `v12-phase3-high.json`, `../evidence/v12-performance-low.jpg`, and `../evidence/v12-performance-high.jpg`.

The in-app browser interface used for the final performance captures did not expose console/page event collection, so this report does **not** claim that console issues were directly sampled during those two windows. A separate exact-production custom-Chrome smoke performed by the integration owner reported zero issues for the four static runtime paths below; that is distinct evidence and must not be conflated with the performance probe.

## Static production/runtime matrix

The locked production build was exercised through all intended selection and fallback paths:

| Path | Observed diagnostic | Result |
| --- | --- | --- |
| default | `ready:v11` | PASS — V11 remains the shipped/default presentation |
| `?character=v12&inspect=1` | `ready:v12` | PASS — optional CC0 candidate loads explicitly |
| candidate plus `assetFail=1` | `fallback:v11` | PASS |
| candidate plus `assetFail=all` | `fallback:procedural:v12,v11` | PASS |

The separate production smoke reported zero console/page issues across this matrix. Candidate evidence includes `../evidence/v12-production-candidate.jpg`; default evidence includes `../evidence/v12-production-default-v11.jpg`.

## Gate and V11 regression view

| Measure | V11 LOW | V12 LOW | Delta / gate |
| --- | ---: | ---: | --- |
| Average FPS | 60.00 | **60.00** | flat; ≥57 gate PASS |
| 1% low FPS | 56.25 | **56.62** | +0.37; ≥53.44 gate PASS |
| Median / p95 / p99 / max | 16.7 / 17.5 / 17.7 / 17.9 ms | 16.7 / 17.1 / 17.5 / 18.4 ms | tails mostly improved; max +0.5 ms |
| End calls / triangles | 91 / 19,102 | 97 / 20,254 | +6 / +1,152 (+6.0% triangles) |
| End objects / geometries | 1,138 / 216 | 1,141 / 245 | +3 / +29 |
| End textures / programs | 54 / 25 | 89 / 23 | +35 / -2 |

| Measure | V11 HIGH | V12 HIGH | Delta / interpretation |
| --- | ---: | ---: | --- |
| Average / 1% low FPS | 60.00 / 55.97 | **60.00 / 55.87** | flat / -0.10 FPS |
| Median / p95 / p99 / max | 16.7 / 17.5 / 17.8 / 18.0 ms | 16.7 / 17.0 / 17.4 / 23.5 ms | common tails improved; isolated max +5.5 ms |
| End calls / triangles | 125 / 55,658 | 138 / 57,974 | +13 / +2,316 (+4.2% triangles) |
| End objects / geometries | 1,138 / 351 | 1,177 / 357 | +39 / +6 |
| End textures / programs | 96 / 52 | 96 / 52 | flat |
| Pixel ratio | 1.0 | 1.25 | V12 HIGH rendered more pixels; not perfectly matched |

V12 LOW remains comfortably above both its relative gate and the 45 FPS hard floor. HIGH's +6 objects/+6 geometries with flat textures/programs is consistent with sampling an active transient-hazard window in the bounded pool system. It is **not** proof of cleanup or lifetime leak freedom; repeated Phase III/restart cycles remain the correct follow-up.

## Build and package verification

- Complete `npm test`: PASS after the final semantics-neutral bundle trim.
- TypeScript: PASS.
- Source contracts: 9/9 PASS, including the explicit V12-candidate/fallback contract.
- Production build: PASS.
- Static distribution tests: 2/2 PASS.
- Main entry: 749,944 bytes raw, 199,092 bytes deterministic gzip.
- Deployable `dist`: 16,587,639 logical bytes / 15.85 MiB allocated.
- No FBX, Blend, archive, Python, backup, or cache artifacts shipped.
- Exact hashes, package deltas, and storage budgets: `../V12_STORAGE_REPORT.md`.

## Excluded provisional sample

`v12-phase3-low-run1.json` is retained as diagnostic evidence only and is not part of the final result. It was captured before the root-scale/visibility and material-alpha P0 fixes and before default selection was restored to V11. Its 59.99 / 49.76 FPS result is invalid for final build comparison and is intentionally excluded.

## Remaining performance risks

1. The main entry is only 56 raw bytes below the 750,000-byte regression ceiling, so any future code growth needs code splitting or an explicit budget decision rather than incidental trimming.
2. LOW ends at 1,141 objects and HIGH at 1,177; CPU traversal remains a scalability concern for world expansion.
3. HIGH's 96 textures, 52 programs, 138 end draw calls, transparent/additive effects, and DPR 1.25 need validation on weaker integrated GPUs.
4. One 30-second active window cannot establish lifetime leak freedom; repeat Phase III/retry/transform cycles are still required.
5. Performance evidence validates the default V11 presentation. The rejected optional V12 candidate was not separately performance-gated because it is not enabled in normal play.

## Release disposition

The exact V12 production package is buildable, statically deployable, within storage budgets, robust across the explicit candidate/fallback matrix, and passes the measured LOW performance gate on this host. This performance pass does not overturn the visual verdict: the optional CC0 low-poly knight is materially worse than V11 and correctly remains behind `?character=v12` for evaluation only.
