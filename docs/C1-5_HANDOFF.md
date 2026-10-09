# C1.5 — Steep Behind-Ball Chase, 60m Real Ramp, Mirrored Side Rotors

Base: C1.4 `c1-4-low-chase-rotor-machines` / PR #13.
Input: owner 108s mobile recording `Recording 2026-10-09 215359.mp4`.

## Precisely requested changes

- The **default Infinite Mode camera** is no longer merely a lowered
  high-angle chase. Its desired transform is `ball - slopeUp*4.8m
  + slopeNormal*1.55m`, looking at `ball + slopeUp*8.5m
  + slopeNormal*2.55m`. This gives ~64 degrees positive pitch, places
  the ball near the lower screen, and looks genuinely uphill at the
  60-degree incline. Camera follows the ball using the existing smooth
  damping. Within 8 metres of summit, camera blends to the proven
  horizontal-platform view so Shop/Next and contact remain legible.
- `?mode=infinite`: new default steep chase.
  `?mode=infinite&camera=close`: C1.4 camera.
  `?mode=infinite&camera=low`: C1.3 low camera.
  `?mode=infinite&camera=classic`: original camera.
- **Infinite Mode hill is genuinely 60m** along the slope (up from 48m,
  +25%; vertical difference 51.96m). The actual Bullet static incline
  collider stretches to 60m, visual bands are generated to 60m, the
  60m summit deck and its real collision requirement shift uphill.
  Mystery box, falling emitter, near-summit cutoff, progress bar,
  reset check, magnet standoff/lip target and camera blend are linked
  to that length. The old 48m C0.7 test mode stays intact.
- **New opposing left/right rotor pattern** on levels 5, 9, 13,
  17 etc: two real slope-aligned, kinematic, compound cross rotors
  placed at x=-3.65 and x=+3.65 at equal height. With mirrored
  opposite angular signs (`direction=-1` on left and `+1` on
  right), their uphill/top sectors sweep inward. The design is intended
  to bat falling debris across the center, while retaining timed
  openings and player control. Other seeded levels retain solo
  hammers/crosses and two separated machines farther uphill.
  Maximum two active machines, unchanged primitive bounds.
- **No movement nerfs**: C1.3 swipe strength, physics mass, fall
  punishment and magnet contact semantics unchanged. No imported
  licensed ITHappy source assets (the user owns the pack, but meshes
  have not been uploaded).

## Regression gates

1. 1000 seeded levels preserve 60m true geometry and at most two
   physical rotors.
2. Both opposing rotor velocities are exactly mirrored and the pair's
   axes/placement are level-matched.
3. Mobile 390×844 camera has 58–70 degree true uphill pitch,
   camera below and behind ball and <6.5m separation.
4. Level 5 rotor contact with a real dynamic obstacle via Bullet.
5. 60m magnet-assisted approach produces a genuine plateau
   `collisionstart`; tests never spoof the contact.
6. Original C0–C1.4 Vitest, TypeScript, Playwright and cosmetic/level
   tests must all pass.
7. Publish only compiled public build as
   `c1-5-mobile-static-preview` after success.

**Owner QA still required:** feel of close camera on phone,
obstacle visibility, real paired interactions, and Android FPS.
