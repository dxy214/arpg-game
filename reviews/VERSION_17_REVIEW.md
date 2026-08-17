# Version 17 review — mobile boss and grounded skill overhaul

## Verdict

**ITERATION PASS / MOBILE BOSS ACCEPTED / ENERGY-BALL ATTACKS REMOVED / V RISING PARITY REJECTED.**

The Bell-Saint is no longer a fixed arena turret. It pursues, retreats, circles,
faces the player, changes movement style by phase, respects the same static and
dynamic collision solver used by actors, and pauses movement during committed
attack tells. All fired energy-ball attacks were removed. Its attack set now
uses melee cleave sectors, jagged ground fractures, expanding shock rings, and
delayed shard sigils.

## Verified implementation

- Phase I closes to melee pressure and strafes at 1.7 m/s; Phase II maintains
  casting distance and circles more aggressively; Phase III rushes back into
  close pressure at 2.8 m/s.
- Boss movement resolves against authored world blockers, the player, live
  enemies, arena bounds, and monolith collision. The player collider is refreshed
  immediately before the boss step to prevent opposing-motion overlap.
- Cast telegraphs remain at their original world positions while the boss moves;
  they do not slide with its transform.
- Energy-ball/projectile attack code is absent from the boss attack system.
  Ambient phase motes remain presentation-only and are never fired.
- Form counterplay remains: Wraith mitigates Phase-II rifts/sigils and
  Stonewrought mitigates Phase-III ring/cleave pressure.
- Final `npm test` passes TypeScript, 14/14 contract/collision tests, production
  build, and 2/2 static-host tests. Exact browser console: zero warnings/errors.

## Rendered evidence

- [`v17-boss-mobile-phase1.jpg`](./evidence/v17-boss-mobile-phase1.jpg) — mobile
  Phase-I boss and jagged aimed ground fracture.
- [`v17-boss-sigils-phase2.jpg`](./evidence/v17-boss-sigils-phase2.jpg) — Phase-II
  cyan transition with non-projectile fractures and delayed sigils.
- [`v17-boss-rifts-phase3.jpg`](./evidence/v17-boss-rifts-phase3.jpg) — Phase-III
  amber escalation with reduced-count rifts/sigils and arena response.
- [`v17-performance-low.jpg`](./evidence/v17-performance-low.jpg) — final 30 s
  LOW telemetry result.

## Harsh visual assessment

The encounter improves from the V16 boss presentation (~3.3/5) to roughly
**3.45/5**. Movement makes Warrok feel like an opponent rather than a prop, and
the three phases now differ in spacing and attack topology instead of relying on
recolored moving balls. Cleave boundaries and sigil timing are very readable.

It still does not match V Rising. The transition frames remain geometrically
flat and somewhat busy; ground fractures are translucent polygon ribbons rather
than textured/decal-driven terrain damage; shard aftermath and debris are thin;
Warrok still reuses generic Mixamo attack/hurt clips; and defeat presentation is
unchanged. SUP-013 therefore remains open rather than being cosmetically closed.

## Performance and release result

LOW Phase III: **60.00 average / 56.44 FPS 1%-low**, p99 17.6 ms, zero captured
console issues. Full details are in
[`V17_PERFORMANCE_REPORT.md`](./performance/V17_PERFORMANCE_REPORT.md).

Version 17 may close. Version 18 has not started.
