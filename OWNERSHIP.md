# Ownership and integration boundaries

No agent should overwrite another domain without first coordinating its contract. Cross-domain changes should be additive and reviewed by the integration owner.

| Domain | Owned paths | Required seam |
| --- | --- | --- |
| Integration/core | `package*`, configs, `index.html`, `src/main.ts`, `src/core/**`, root docs | `GameModule`, `EngineContext` |
| Player/movement | `src/player/**` | exports one player module and stable player state API |
| Combat | `src/combat/**` | fixed-step damage/hit contracts; no direct UI writes |
| Transformations | `src/transformations/**` | form state/abilities through player and combat contracts |
| Enemies/AI | `src/enemies/**` | fixed-step AI module and target/damage contracts |
| Boss | `src/boss/**` | isolated encounter phase state and telegraph events |
| World | `src/world/**`, authored world assets | one world module; no renderer ownership |
| Rendering/camera | `src/rendering/**` | owns camera and post-processing submission policy |
| Animation/VFX | `src/animation/**`, `src/effects/**` | pooled visual objects; no authoritative hit logic |
| UI | `src/ui/**` | DOM overlay rooted at `context.uiRoot`; event-driven |
| Audio | `src/audio/**`, audio assets | one listener, buses, unlock/resume handling |
| Tests/tooling | `tests/**`, `tools/**` | must not silently mutate authored assets |

Shared gameplay interfaces should live in the narrowest owning domain. A generic dumping-ground `utils` folder is prohibited. All feature modules must clean up scene objects, subscriptions, and DOM during `dispose`.
