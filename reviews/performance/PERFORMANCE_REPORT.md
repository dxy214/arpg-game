# Veilfall Version 11 performance report

## Verdict

**PASS on the measured host for the LOW Phase III gate; HIGH also held the 60 Hz cap in this run.** Both captures used the same 1280×720 browser viewport, deterministic boss progression from Phase I to Phase III, 12-second Phase III warmup, and an uninterrupted 30-second in-page `PerformanceProbe` sample. Both captures completed with zero console warnings, console errors, or page errors.

This is a controlled single-host result, not a general desktop hardware guarantee. In particular, headless Chrome exposed device pixel ratio 1.0, so the locked HIGH run exercised the HIGH shadow/antialias path but was capped to DPR 1.0 rather than the tier's 1.25 maximum.

## Version 11 results

| Field | LOW | HIGH |
| --- | ---: | ---: |
| Requested and measured tier | low | high |
| Viewport / pixel ratio | 1280×720 / 0.65 | 1280×720 / 1.0 |
| Sample | 30.0 s / 1,800 frames | 30.0 s / 1,800 frames |
| Average FPS | **60.00** | **60.00** |
| 1% low FPS | **56.25** | **55.97** |
| Median frame time | 16.70 ms | 16.70 ms |
| p95 / p99 / max | 17.50 / 17.70 / 17.90 ms | 17.50 / 17.80 / 18.00 ms |
| Start calls / triangles | 103 / 21,406 | 130 / 56,808 |
| End calls / triangles | 91 / 19,102 | 125 / 55,658 |
| Start resources | 1,177 obj / 222 geo / 54 tex / 25 programs | 1,141 obj / 354 geo / 96 tex / 52 programs |
| End resources | 1,138 obj / 216 geo / 54 tex / 25 programs | 1,138 obj / 351 geo / 96 tex / 52 programs |
| Sample delta | -39 obj / -6 geo / 0 tex / 0 programs | -3 obj / -3 geo / 0 tex / 0 programs |
| Console issues | 0 | 0 |

Evidence: [LOW JSON](./v11-phase3-low.json), [HIGH JSON](./v11-phase3-high.json), [LOW rendered panel](../evidence/v11-performance-low.png), and [HIGH rendered panel](../evidence/v11-performance-high.png).

## Method and tier-lock defect

The browser was Chrome 151 through Playwright, WebGL 2.0 over ANGLE Metal on Apple M5. Each run loaded the game with `scenario=boss`, `god=1`, `perf=1`, `capture=1`, and an explicit `quality` query, then used normal attacks and abilities to advance the live boss into Phase III. Sampling started only after the 12-second warmup.

The first attempted HIGH capture exposed a real QA defect: although `?quality=high` selected HIGH at boot, the adaptive-quality controller lowered it to MEDIUM during the pre-sample encounter. That 60.00 / 56.32 FPS result is intentionally not presented as HIGH evidence. Version 11 now treats an explicit quality query as a locked tier while retaining adaptation for automatically detected quality. The recorded HIGH result above is the post-fix rerun and the probe itself confirms `quality: "high"`.

## Regression view

| Checkpoint | Tier | Avg / 1% low | Median / p95 / p99 / max | End calls / triangles | Gate |
| --- | --- | ---: | ---: | ---: | --- |
| V4 final | low | 45.54 / 32.98 | 21.9 / 27.1 / 29.3 / 32.0 ms | 96 / 11,771 | Fail |
| V5 final | low | 60.00 / 56.23 | 16.7 / 17.6 / 17.7 / 18.1 ms | 72 / 10,311 | Pass |
| V10 final | low | 60.00 / 56.20 | 16.7 / 17.4 / 17.7 / 18.1 ms | 79 / 12,163 | Pass |
| V11 final | low | **60.00 / 56.25** | **16.7 / 17.5 / 17.7 / 17.9 ms** | **91 / 19,102** | **Pass** |
| V11 final | high | **60.00 / 55.97** | **16.7 / 17.5 / 17.8 / 18.0 ms** | **125 / 55,658** | Measured pass on this host |

V11's authored skinned assets materially increase the steady render load. Versus V10 LOW, end-of-sample triangles rise from 12,163 to 19,102 (+57%), draw calls from 79 to 91 (+15%), objects from 765 to 1,138 (+49%), textures from 3 to 54, and programs from 25 to 25. Frame delivery nevertheless remains effectively flat at the host's 60 Hz cap. HIGH renders roughly 2.9× the LOW triangle count and 34 more end draw calls, while its 1% low differs by only 0.28 FPS in this run.

The negative object/geometry deltas and flat texture/program counts are consistent with transient cleanup during these windows, not monotonic growth. A single active 30-second window still does not prove lifetime leak freedom; repeated Phase III/restart cycles and a settled post-hazard sample remain appropriate follow-up tests.

## Remaining performance risks

1. The 1,138 steady scene objects are the clearest CPU traversal/scaling risk for a larger world.
2. HIGH's 96 textures, 52 programs, 125 draw calls, and transparent/additive effects may behave differently on integrated GPUs below this M5 host.
3. This was a Vite development-server capture. The production static build passed separate resolution tests, but production-preview frame timing was not sampled in this evidence set.
4. The browser's DPR 1.0 cap means HIGH at DPR 1.25 and Ultra at DPR 1.5 remain unmeasured.
5. The 60 Hz cap hides available headroom; these results prove stable capped delivery on this host, not an uncapped maximum.
