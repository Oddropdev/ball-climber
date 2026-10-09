# C1.2 — Magnetic Summit & Obstacle Biomes

Base: `c1-1-climb-pacing-summit-camera`. Working branch
`c1-2-magnetic-summit-obstacle-variety`. Experimental standalone PlayCanvas
2.22.6 + real Ammo/Bullet mobile game.

## Evidence and regression target
Owner Android video `Recording 2026-10-09 204211.mp4`: rapidly climbed
ball launches above/around the flat final deck; Levels 1+ look too similar,
despite their theme colors. Owner proposed many ITHappy-style falling obstacles.

## Physical magnetic landing
- Damped 3-axis capture spring uses `rigidbody.applyForce` with the
  ball's current mass and position/velocity. Gravity compensation applies
  ONLY within the final ~4.5 meters of the climb, to a ball actually
  close to the summit and within the course.
- No attraction at all below progress 43.5, far off the course, below
  the platform or already beyond it. No automatic ascent on the slope.
- The visual magnetic landing pad has decorative rings with no phantom
  collisions. A real physics contact with the flat deck is still required
  before the summit/shop/next-level dialog. No fake contact callback.
- Swipe-only uphill movement, ball mass, max forward speed, camera follow,
  checkpoint losses and cosmetic-only shop retained.

## Seeded gameplay variation
- New original mesh-free obstacle builder composes real compound
  Bullet collisions for hammer, cross, dumbbell, mace, gate and paddle.
- Rocky / Stormwall / Scrapfall / Candy now have distinct preloaded hazard
  silhouettes and ongoing falling profile. Original furniture is still
  tall, narrow and fully hollow. No third-party assets were copied.
- Biome-specific roadside landmarks and a visible circular magnetic
  target improve differentiation beyond simple color changes.
- Keep the original 8 prewarmed physical avalanche objects on every level,
  5 hazards / 3 loot. Limit active *compound* bodies to 6 alongside
  existing 50+50 hard ceiling and shared resource disposal.
- No new monetization, power upgrades, mobile interaction complexity or
  project dependency.

## Acceptance and caveats
1. Typecheck + original C0-C1 unit/browser tests pass.
2. 1000 seeds deterministic, each biome shows distinctive hazards.
3. Physical test teleports to an uphill location with upward velocity,
   not into the platform, and must reach a *real collision* with the deck
   after the magnet engages. Contact event must still gate completion.
4. Level1->Shop->Level2 still works. Original `/` C0.7 mode unchanged.
5. No purchased ITHappy meshes in the public repository. The studio's
   separate `Platformer 2 Obstacles` pack should only be imported later
   from a user-owned, appropriately licensed GLB/FBX bundle.
6. Actual gameplay quality and frame rate on the owner's older Android
   handset require phone testing. Browser CI cannot establish phone FPS.
7. CI publishes `c1-2-mobile-static-preview` only if all above checks pass.

## Safety guard
This is a gameplay prototype, not a claim of production readiness.
If the physics magnet causes deck clipping or a spring-launch, tune
`SummitMagnet.ts` in this feature branch and rerun real-Bullet tests;
do not silently teleport or bypass physical summit contact.
