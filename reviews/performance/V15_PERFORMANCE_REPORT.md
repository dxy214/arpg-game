# Version 15 performance report

## Verdict

**PASS on the measured Apple M5 host at LOW and HIGH.**

Both 30-second samples used the real Bell-Saint Phase III stress case after a
12-second warmup at 1280×720. The newly textured and reshaped biome does not
regress the 60 Hz target on this machine.

| Tier | DPR | Average FPS | 1% low | Median / p95 / p99 / max | End calls / triangles | Resource delta |
|---|---:|---:|---:|---|---|---|
| LOW | 0.65 | 60.00 | 56.59 | 16.7 / 17.2 / 17.6 / 17.8 ms | 71 / 33,701 | 0 objects, 0 geometry, 0 textures, 0 programs |
| HIGH | 1.25 | 60.00 | 56.71 | 16.7 / 16.9 / 17.5 / 17.7 ms | 109 / 125,883 | 0 objects, 0 geometry, 0 textures, 0 programs |

The final production-preview scene also booted with zero captured console
warnings/errors. These runs prove one host and one 30-second window per tier;
they do not prove low-end GPUs, uncapped headroom, or long-session leak freedom.

Evidence: `v15-low-phase3.json`, `v15-high-phase3.json`,
`../evidence/v15-performance-low.jpg`, and
`../evidence/v15-performance-high.jpg`.
