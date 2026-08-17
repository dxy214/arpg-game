# Version 13 performance report

## Verdict

PASS for the established LOW boss benchmark; field-combat tail performance remains a documented carryover.

- Final stable 30-second boss sample after 12.5 seconds of warmup: **60.00 average / 56.43 FPS 1%-low**, median 16.7 ms, p95 17.3 ms, p99 17.7 ms, max 17.9 ms.
- 1280×720 CSS viewport, LOW, DPR 0.65, Chrome 151/WebGL2/ANGLE Metal on Apple M5.
- Resources ended at -4 objects and zero geometry, texture, or program growth. Console warnings/errors: zero.
- The collision world contained 238 authored static colliders plus live enemy/boss circles. The sample therefore validates the solver's steady overhead in the established boss gate.

An earlier elite-field sample started only 2.5 seconds after navigation and measured 54.0 average / 34.6 FPS 1%-low while seven geometries were still being introduced. It is rejected as a release measurement because it violated the 12-second warmup protocol, but it remains a warning that uncullled field combat and asset warmup deserve further profiling.

The final production build itself was smoke-tested separately at `http://127.0.0.1:5196/?scenario=collision&god=1&quality=high`; it loaded `ready:v11`, exposed all 238 static colliders, reproduced the exact gate stop, and logged no warnings/errors. The 30-second telemetry was taken from matching source on the development host, not repeated under the static preview.
