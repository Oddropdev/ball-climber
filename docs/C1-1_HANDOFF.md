# C1.1 — Climb Pacing & Summit Polish

Base: C1.0 `c1-0-infinite-climb-foundation`, PR #9.
Implement only in new `c1-1-climb-pacing-summit-camera` branch, draft PR.
Player's evidence: `Recording 2026-10-09 201207.mp4` from Android C1.0; the fast
swipe player reaches the summit before the slow emitter wave travels downhill,
a near-mounted large mystery cube occludes the entire finish view.

## Implemented scope
- `?mode=infinite` has **8 preexisting real Bullet obstacles/rewards**
  pre-positioned over 14–43m on level start. 5 hazards + 3 gold rewards:
  actual dynamics and collision, seeded per level, not painted props.
  The original timed producer and 50+50 hard caps still operate; warm-start
  objects share the SAME cap and destroy path, not a separate physics budget.
- The upper mystery cube is bigger (7.2m) and moved vertically to a higher
  world position above the plateau; the drop port rises too. Position and
  size are evidence telemetry, not substitute for actual gameplay.
- Ongoing waves gain cylindrical barrels, narrow beams and bouncing balls,
  preserving original crates/rocks/light props and true compound furniture.
- Procedurally regenerated furniture in infinite mode is **taller and
  narrower**; original C0.7 remains identical.
- Upper landing plateau gains lightweight visual runout bars and edge
  accents without false invisible barriers. The follow camera eases
  to near-horizontal pitch on approach and at the actual summit.
- No change to swipe force, bullet dynamic ball, mass, lane movement,
  shop = cosmetics-only, wallet, seeds, level transitions or main branch.

## Important reality check
- Actual first 48m ascent and obstacle encounter rhythm require **owner
  physical-phone playtest**, ideally compare direct C1.0 and C1.1.
- Early avalanche uses a small seeded *pre-positioned* set, representing
  objects already flowing from the mystery before the run begins. Later waves
  spawn at the original emitter. Do not claim all eight start from the
  mystery cube during the run.
- 1000 seed checks only prove reproducible specs and bounded variety, not
  1000 fully playtested levels.
- Per-level early objects are removed on reset/transition, along with
  other active physics bodies. Old default `/` remains C0.7 behavior.
- Android link is compiled unlicensed static build on third-party
  raw.githack.com test CDN. Published only after whole browser CI green.

## Android acceptance
On OnePlus Nord N100: new hazards and loot must be visible and meet the ball
within the first seconds, rather than only the finish. Player should be able
to steer between taller/leaner furniture. Summit platform must look level
and the camera must look forward rather than at the underside of the box.
Level 1 -> Shop -> Next Level -> Level 2 still works. Watch FPS and heat.
