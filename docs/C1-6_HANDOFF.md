# C1.6 — Protected Resting Base, Hazard Purge, Passable Rotor Pairs

Base: `c1-5-steep-follow-dual-rotors-longer-climb`, PR #14.
Evidence: owner mobile recording `Recording 2026-10-09 225902.mp4`.

## Gameplay changes

- **Safe start/rest area** at the foot of the actual 60m slope.
  Add a broad 10.4m x 7.3m real *horizontal static Bullet platform*
  with left, right and back physical rails, plus two tiny forward
  side wings that keep the central uphill exit open. The transition
  meets the actual sloped Bullet ramp. All level starts and fall
  respawns are at `baseSpawn()`, physically on the rest floor.
  A last-resort safety catch handles extreme off-rail impulses
  around the base rather than counting them as gameplay falls.
- **Hazard kill switch:** any real dynamically falling actor at or
  below slope progress 1.25m is destroyed immediately in the normal
  physics update. This applies to both rock and loot and is enforced
  *before* proximity loot collection. A visible purely decorative
  warning stripe marks the threshold. Ball is never a kill target.
  The existing dynamic actor caps, real collision and 60m debris
  emission remain intact.
- **Playable paired side rotors:** at levels 5, 9, 13, etc reduce
  synchronized mirror-rotor radius from 3.1–3.34m to 1.65–1.83m.
  Preserve their position (-3.65/+3.65), 10–15rpm motion and opposite
  directions: the top blades still sweep toward the center.
  Conservative swept 360° collider bound leaves >3.1m guaranteed
  corridor through the middle, compared with a ball diameter
  of 1.16m. Single and staggered machines are unchanged.
- **Preserve favorite C1.5 camera unchanged on the climb.** The
  guarded flat start requires a separate brief rest-pose camera,
  otherwise the close behind-ball slope rig sits *under* the floor.
  Blend to exact C1.5 camera from 3–6m up the hill; no camera or
  touch/swipe changes beyond this short transition.
- Old C0.7 demo remains intact. Shop, magnetic collision-gated summit,
  60m incline and natural falling risk *above* the base are preserved.

## Required tests / release

1. 1000 deterministic pairs have at least 3.0m permanent swept gap.
2. Real Bullet base floor and 6 physical static bodies per base, ball
   survives side guard collision without accumulating a fall.
3. Spawned physical barrel/hazard crossing the 1.25m cleanup boundary
   is truly destroyed and counted. Player remains active.
4. Test-only empty corridor real Bullet ball can ascend through paired
   kinematic obstacle section with zero fall.
5. On a slope segment >6m the original true near-ball 60-degree
   forward camera stays unchanged and physics magnet still lands
   on the real 60m platform.
6. Full C0–C1.5 regressions, TS build, Playwright browser suite.
7. Only release compiled public artifacts after CI success, in
   branch `c1-6-mobile-static-preview`.

No licensed ITHappy meshes/source bundled without user-provided bytes
and confirmed distribution permissions.
