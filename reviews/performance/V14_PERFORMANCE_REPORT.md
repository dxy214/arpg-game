# Version 14 performance report

## Verdict

**PASS on the measured Apple M5 host for the explicit Mixamo candidate.**

Both final samples used the real Bell-Saint Phase III stress case after a 12-second warmup at a 1280×720 CSS viewport. The candidate remained `ready:v14`; browser console warnings/errors were zero.

| Tier | DPR | Average FPS | 1% low | Median / p95 / p99 / max | End calls / triangles | Resource delta |
|---|---:|---:|---:|---|---|---|
| LOW | 0.65 | 60.00 | 56.51 | 16.7 / 17.1 / 17.6 / 17.8 ms | 109 / 32,671 | +33 objects, 0 geometry, 0 textures, 0 programs |
| HIGH | 1.25 | 60.00 | 56.89 | 16.7 / 16.8 / 17.5 / 17.7 ms | 105 / 69,529 | -21 objects, -21 geometry, 0 textures, 0 programs |

The LOW object delta reflects live pooled Phase-III hazards at the end instant; renderer geometry, textures and programs were flat. The HIGH run ended after several transient hazards had cleared. These paired samples show no GPU-resource growth, but one 30-second window per tier is not a long-run leak proof.

The 99-bone, 15,021-triangle skinned candidate adds more character work than V11, but the measured host remains pinned at the 60 Hz target. Lower-end GPUs and uncapped headroom remain unverified.

Evidence: `reviews/performance/v14-low-phase3.json`, `reviews/performance/v14-high-phase3.json`, `reviews/evidence/v14-performance-low-phase3.jpg`, and `reviews/evidence/v14-performance-high-phase3.jpg`.
