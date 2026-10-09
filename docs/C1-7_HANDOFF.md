# C1.7 — Visibility, Anti-Plow, Rotor Grammar & New Shape Pack

Base: C1.6 `c1-6-safe-base-hazard-purge-passable-pairs` / PR #15.
Owner feedback: `Recording 2026-10-09 235014.mp4`.

## Core gameplay specification

- **The ball must appear in the very first mobile frame**: adjust only
  the rest-pad camera position and focus above the 3.4m rear rail,
  looking at the physical ball on the horizontal platform.
  Snap camera immediately on level reset; from 3m→6m blend to the
  previous, owner-favorite, steep C1.5 60° slope camera unchanged.
- **Anti-plow**: Infinite Mode charged dynamic Bullet mass grows by
  0.45kg per level instead of 1kg (base 1.4; max 3.2 vs 5.4);
  preserve constant per-kg uphill swipe acceleration by applying the
  existing real mass-scaled impulse. Side swipe C1.3 unchanged.
  C0.7 mass physics completely unchanged. Large falling compound
  obstacles have their own real mass and collide naturally.
- **Rotor grammar**: any non-paired level has only ONE rotor at
  15.5-18.5m. No two aligned central rotating machines in sequence,
  and no middle rotor near the summit. Levels 5,9,13,... retain the
  opposite shoulder pair with >3m swept central corridor.
- **Summit infinite boost fix**: normal up-swipes are ignored within
  final 2.6m; physically damp/correct any ball launching more than
  3.8m over the summit deck and place it above the real Bullet
  collider with downward velocity. Never synthesize a collision or
  automatic win. A real `collisionstart` still exclusively completes
  the level; skin shop and Next level remain unchanged.
- **Mystery cube**: disable the stray nonphysical circular chute disk
  in Infinite Mode. Keep actual falling emitter and mystery cube.
  Do not alter legacy C0.7 visuals.
- **New procedural physics silhouettes**: nine additional shapes:
  pyramid, A-frame triangle, banana crescent, four-wheeled car,
  sofa, stool, oversized boot, glove and wide-brim hat. Each is
  real bounded dynamic Bullet compound parts, visually distinguished,
  deterministic by seed. Two novel shapes prewarm at 25m and 44m
  each level; all also participate in all-biome random falling
  choices. Keep the existing compound actor CPU cap.

## Verification / scope

C1.7 tests inspect first-frame projected ball inside the 390×844
viewport; 1000 level seeds for rotor grammar and shape variation;
real reduced-mass Bullet behavior; ignored final swipe; real dynamic
overshoot correction and physical deck collision; new silhouette parts;
and complete C0-C1.6 regression. The 60m static ramp and protected
base remain unchanged. No proprietary ITHappy bytes in source.

Only publish compiled code and WASM to
`c1-7-mobile-static-preview` after ALL CI tests pass.
