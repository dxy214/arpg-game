# Veilfall

Veilfall is an original browser-based isometric dark-fantasy action RPG vertical slice. The project targets WebGL2 desktop browsers and deliberately excludes construction, crafting, survival meters, farming, and inventory micromanagement.

## Run locally

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). A WebGL2-capable desktop browser is required.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` | Move |
| Mouse | Aim |
| Left mouse | Primary attack |
| Right mouse or `Q` | Form Art / secondary ability |
| `Space` or left `Shift` | Form-specific traversal move |
| `R` | Ultimate |
| `1` / `2` / `3` / `4` | Nightbound / Wraith / Dreadwolf / Stonewrought |
| `H` | Field guide |
| `Enter` | Restart after defeat |

Interact once to unlock browser audio. The HUD reports **SOUND AWAKENED** when Web Audio is running.

## Production build

```bash
cd /Users/dxy/Desktop/tencent/codingagent/arpg-test
npm run build
npm run preview
```

The deployable static build is written to `dist/` and uses relative asset paths.

## Test and performance QA

```bash
npm test
```

This runs strict typechecking, source/runtime contract checks, a production build, local-asset integrity checks, bundle measurement, and static-route resolution. Use `npm run test:quick` while iterating and `npm run test:dist` after an existing build.

Live performance is not inferred from those static gates. Open the performance scenario printed in [`tests/QA_SCENARIOS.md`](./tests/QA_SCENARIOS.md), reach the desired stress case, and press `P` to start a visible 30-second sample. Current measurements and limitations are recorded in [`reviews/performance/PERFORMANCE_REPORT.md`](./reviews/performance/PERFORMANCE_REPORT.md).

## Version 11 status

Version 11 is complete and work is stopped pending explicit approval for Version 12. It adds an original local GLTF/skinning/animation pipeline plus Blender-authored Nightbound, Husk Mourner, and Bell-Saint assets with safe procedural fallback. The full evidence-based result is in [`reviews/VERSION_11_REVIEW.md`](./reviews/VERSION_11_REVIEW.md), the official-reference comparison is [`reviews/evidence/v11-reference-board.jpg`](./reviews/evidence/v11-reference-board.jpg), and storage details are in [`reviews/performance/V11_STORAGE_REPORT.md`](./reviews/performance/V11_STORAGE_REPORT.md).

The independent verdict is **ITERATION PASS / VISUAL QUALITY REJECTED**, approximately 3.0/5. The authored assets are a meaningful improvement but remain visibly below V Rising-level commercial fidelity in anatomy, costume/material detail, deformation, animation weight, world density, and boss spectacle. The measured LOW Phase III result is 60.00 FPS average / 56.25 FPS 1%-low; locked HIGH is 60.00 / 55.97 on the Apple M5 test host. These are controlled-host results, not broad hardware certification.

## Earlier checkpoints

The mandatory Versions 6–10 handoff remains in [`reviews/CHECKPOINT_V10.md`](./reviews/CHECKPOINT_V10.md), with representative rendered evidence and the full five-version summary.

The earlier Versions 1–5 handoff remains available at [`reviews/CHECKPOINT_V5.md`](./reviews/CHECKPOINT_V5.md).

## Integration

Systems implement `GameModule` from `src/core/types.ts` and are registered with `runtime.addModule(...)` in `src/main.ts` before `runtime.start()`. See `ARCHITECTURE.md` and `OWNERSHIP.md` before editing shared seams.
