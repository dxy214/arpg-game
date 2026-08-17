# Version 16 performance report

## Verdict

**PASS on the measured Apple M5 host at LOW and HIGH.**

The final V16 runtime includes nine active Mixamo Skeletonzombie rigs and the
Mixamo Warrok boss. Both 30-second samples used the real Bell-Saint Phase III
after warmup at 1280×720.

| Tier | DPR | Average FPS | 1% low | Median / p95 / p99 / max | End calls / triangles | Resource result |
|---|---:|---:|---:|---|---|---|
| LOW | 0.65 | 60.00 | 56.75 | 16.7 / 17.0 / 17.6 / 17.7 ms | 60 / 35,365 | +30 transient objects; geometry -3; texture/program 0 |
| HIGH | 1.25 | 60.00 | 56.62 | 16.7 / 17.0 / 17.6 / 17.8 ms | 97 / 127,545 | +18 transient objects; geometry -15; texture/program 0 |

The positive object deltas are active pooled Phase-III hazard timing at the end
instant; geometry fell and texture/program counts were flat. Exact production
preview recorded zero warnings/errors. One host and two 30-second windows do not
prove low-end hardware or long-session leak freedom.
