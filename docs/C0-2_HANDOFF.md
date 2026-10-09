# C0.2 — 60° Slope Climber Handoff

**Branch:** `c0-2-sixty-degree-swipe-slope` (draft PR, base C0 PR #1).
**Source:** Oddropdev/ball-climber. No Game Factory or Ball Runner files changed.

## Implemented
- Real, pitched 60° *static Bullet slope* (48m along face, ~41.6m vertical).
- Dynamic Bullet sphere, genuine collision and risk of falling sideways/downslope.
- Chase camera **behind and ~1.4m below** the ball, looking steeply uphill.
- Upward swipe or W/↑: **one bounded forward Bullet impulse and torque impulse**, no input hold = no motor.
- Side swipe or A/D/←/→: one lateral impulse. Repeated fast upward swipes chain momentum within a 14m/s cap.
- Procedural, deterministic unlimited-length `makeWave(seed,index)`: sphere/cube/rectangular box hazards and loot, rows, trains, diagonals, mixed waves.
- Spawn only a bounded group ahead of the player, no upfront infinite entities.
- Reclaim with `Entity.destroy()` on collection or after descending below player/time limits; enforce 48-body active cap.
- Short-course checkpoint penalty on genuine falls; collectible/impact counters; no invisible handhold at the side boundaries.
- Browser tests: authentic control events, no self-climb, physical ramp, shape variety, cleanup, camera. 
- No private paid assets.

## Important
Do not claim real mobile feel / final difficulty / Android performance until owner playtests. First priority after CI is C0.2.1 swipe responsiveness + obstacle density tuning using owner video, not ten levels yet.

## Preview
GitHub Actions produces a ZIP; extract and run `Start_Ball_Climber.cmd` (Node.js >=24). No other dependencies. Physics Ammo is built into preview.
