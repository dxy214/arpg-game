# Architecture

## Runtime contract

`GameRuntime` owns the single animation loop, renderer, scene, active camera, viewport, input lifecycle, fixed timestep, module ordering, and disposal. Feature systems implement `GameModule` and do not create their own `requestAnimationFrame` loops or renderer instances.

Frame order is intentionally stable:

1. `update` — input sampling, intent, animation, presentation-time logic.
2. `fixedUpdate` at 60 Hz — movement, collision, combat simulation, deterministic timers.
3. `lateUpdate` — camera follow, VFX attachment, UI projection.
4. one renderer submission.
5. input edge-state reset.

Modules are initialized and updated in registration order, then disposed in reverse order. IDs must be unique. Registration after startup is rejected to avoid half-initialized systems.

## Coordinate and timing conventions

- Three.js right-handed coordinates: +Y up, the ground is XZ.
- Angles are radians; distances are world meters; time is seconds.
- Rendering may interpolate, but authoritative combat/movement runs in `fixedUpdate`.
- Gameplay code uses `frame.deltaSeconds`, never wall-clock-dependent frame increments.
- Pointer normalized device coordinates are exposed in `InputSystem.pointer`.

## Module seams

Feature modules communicate through narrow shared stores or typed events. Core's event map is reserved for engine lifecycle, viewport, quality, and performance. Gameplay domains should expose their own typed event bus rather than adding unrelated types to core.

The active camera is mutable through `context.camera`; camera ownership must remain exclusive to the camera module. The scene and renderer are shared read-only references. Render features may configure renderer settings during initialization but must restore or document global changes.

## Performance budget

The initial desktop target is 60 fps at 1920×1080 on a representative mid-range discrete GPU. Initial budgets are 1,200 draw calls, 2.5M submitted triangles, 120 MB compressed initial payload, and no recurring frame allocations in hot combat loops. These are ceilings, not targets, and must be validated from rendered gameplay.

## Browser lifecycle

The app requires WebGL2 and fails immediately with a readable error if unavailable. Resize is driven by `ResizeObserver`. Pixel ratio is capped by quality tier and at 2×. Frame delta is capped at 100 ms after tab stalls. `dispose()` releases listeners, observers, GPU renderer state, and modules.
