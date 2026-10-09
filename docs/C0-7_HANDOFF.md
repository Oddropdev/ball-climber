# C0.7 — Gameplay Readability Pass (owner review)

Source of truth for C0.6 physics is `c0-6-weighted-swipes-speed-control` / PR #6.
C0.7 is its own stacked draft PR. Do not merge to main before mobile owner feel validation.

## Why (actual OnePlus Nord N100 owner clip)
- Video shows a real 60-degree swipe-climb, falling props, loot and mass.
- Huge falling furniture can cover the play corridor.
- Large HUD/status and feedback messages sit over incoming hazards.
- Constant high weight makes mass more reward than tradeoff.
- Owner reports the base C0.6 Android version actually runs on old OnePlus Nord N100.

## Actual C0.7 changes
- **Two-tier camera-only fade:** cheap deterministic line-of-sight proxy; giant or
  camera-near physics blockers become more transparent. Loot NEVER fades.
  Shared materials avoid per-actor shader allocations; colliders remain live.
- **Readability palette:** danger furniture coral/rose, loot gold, lightweight
  pushable props teal. Same physical wave and collectible scripts.
- **Mobile HUD:** title, score and progress compact while running. Status moves
  to lower-left; transient toast moves to top-right instead of center lane.
  Three mobile viewport layout checks, including landscape.
- **Real mass tradeoff:** 0-charge side impulse is bit-for-bit unchanged;
  at charge 4 lateral acceleration on the **same live Bullet rigidbody** is
  scaled by 0.58, interpolating linearly. Uphill impulses, friction, gravity,
  12.5 m/s cap and wave generation stay untouched. No fake kinematic lock.
- Existing main scenario remains **48m**: we did not arbitrarily shorten
  or add a next level before seeing whether a cleaner version feels better.

## Acceptance
- All preexisting pure unit and real Chromium browser tests must remain green.
- New C0.7 tests assert two-level visual fade, loot non-fading, mass tradeoff,
  HUD bounding boxes at 360x800, 390x844 and 844x390, input and actual Bullet.
- Android owner compares side-steering at light versus fully charged mass,
  obstruction by giant furniture, progress/loot legibility and FPS/heat.
- **New Android test link** is an openly accessible but unadvertised compiled
  static site on a THIRD PARTY preview CDN. Do not publish private assets.
  New static branch is independent from C0.6's original static preview.
- Before C1 Stormwall Level 2, decide whether current 48m density/swipe
  effort is enjoyable; do not pre-commit a new progression economy.

## Continuation
After mobile feedback: tune ONLY 1–3 observed feel/readability issues;
then proceed to C1 Stormwall with real separate LevelSpec + preload.
