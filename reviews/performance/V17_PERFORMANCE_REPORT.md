# Version 17 performance report

## Verdict

**PASS on the measured LOW-tier Phase-III gate.** The mobile boss, dynamic
collision resolution, and grounded skill effects held the 60 Hz cap in the
in-app WebGL2 browser on the measured Apple M5 host.

| Metric | Result |
| --- | ---: |
| Sample | 30 s / 1,800 frames |
| Average / 1% low | **60.00 / 56.44 FPS** |
| Median / p95 / p99 / max | 16.7 / 17.0 / 17.6 / 17.8 ms |
| Viewport / DPR | 1280×720 / 0.65 |
| End calls / triangles | 52 / 36,819 |
| End resources | 1,608 objects / 153 geometries / 20 textures / 42 programs |
| Sample delta | +6 objects / +6 geometries / 0 textures / 0 programs |
| Console warnings/errors | 0 |

The +6 object/+6 geometry result was captured during active transient hazards;
flat texture/program counts are consistent with bounded cleanup, but one active
window is not proof of lifetime leak freedom. A repeated Phase III → retry soak
remains appropriate before world expansion.

Evidence: [`v17-phase3-low.json`](./v17-phase3-low.json) and
[`v17-performance-low.jpg`](../evidence/v17-performance-low.jpg).

Final production build: `index-DWxZ7kWm.js`, 181,876 bytes raw / 55,630 bytes
gzip-9, SHA-256 `149039468380f4f054481c76c942c1cf78337d18dadeeee75622167d779410b3`.
Deployable `dist` occupies approximately 62 MiB. HIGH and lower-end hardware
were not re-sampled in V17; prior V16 HIGH evidence remains the latest HIGH gate.
