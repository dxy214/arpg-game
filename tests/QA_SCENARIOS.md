# QA scenario URLs

Run `npm run dev`, then use these deterministic entry points. They are query-only and also work with `npm run preview`.

| Scenario | URL | Purpose |
| --- | --- | --- |
| Roam / Nightbound | `http://localhost:5173/` | Default traversal, atmosphere, first pack, baseline HUD/audio unlock |
| Elite / Wraith | `http://localhost:5173/?scenario=elite&form=wraith` | Ranged spacing and phase traversal versus the elite pack |
| Elite / Dreadwolf | `http://localhost:5173/?scenario=elite&form=dreadwolf` | Pursuit, rush, pounce, and rend pressure |
| Elite / Stonewrought | `http://localhost:5173/?scenario=elite&form=stonewrought` | Mitigation, charge, slam, and crush pressure |
| Boss / Nightbound | `http://localhost:5173/?scenario=boss` | Normal boss entry, death, and Enter-to-restart |
| Boss / Wraith | `http://localhost:5173/?scenario=boss&form=wraith&god=1` | Phase-two movement, spectral sigils, and sustained ground-rift inspection |
| Boss / Dreadwolf | `http://localhost:5173/?scenario=boss&form=dreadwolf&god=1` | Phase-one fracture and sustained melee inspection |
| Boss / Stonewrought | `http://localhost:5173/?scenario=boss&form=stonewrought&god=1` | Worst-case phase-three rings, cleaves, sigils, and crush fracture |
| Boss / performance | `http://localhost:5173/?scenario=boss&form=stonewrought&god=1&perf=1` | Visible performance telemetry; reach phase three, then press `P` to start/restart a 30-second sample |
| Blank runtime baseline | `http://localhost:5173/?perf=1&baseline=1` | Browser/renderer ceiling with the vertical slice omitted; press `P` for the same 30-second telemetry |

`god=1` is a QA-only invulnerability switch. It does not alter boss health, phase progression, attacks, VFX, or normal entry points.
On a `capture=1` boss URL, press `F` to step Phase I → II → III for visual inspection without changing the production encounter path.

## Mandatory live gate

For every checkpoint build, record browser version, operating system, viewport, DPR, renderer/GPU string, quality tier, console errors, and a minimum 30-second frame sample during the phase-three Stonewrought scenario. Report median, p95, p99 frame time, average FPS, and 1% low FPS. The `?perf=1` entry remains armed until `P` is pressed, then exposes its completed structured result as `#qa-performance[data-result]`. Also exercise reload, death/restart, focus blur/resume, and resize `1280×720 → 960×540 → 1280×720`.
