# C1.8 — Skippable Camera Flythrough, Starter Pad, Directed Patterns & Hollow Frames

Base C1.7 / PR #16. Input: 153s Android recording `1000016078.mp4`.
Owner specifically requests meaningful passable shapes, a short course intro,
a physically separate starter pad farther down from the existing plaza, and
less constant clutter (without removing fun occasional piles).

## Shipped implementation

1. **3.8 second intro shot**: the existing PlayCanvas camera travels down
   the real 60m hill: near summit → mid-section → lower rotating setpiece
   → safe starting platform. No codec, extra files or static screenshot.
   A tap or Space/Enter/Up skips instantly. Shown only the *first time
   each new level starts*, not retry. URL `?mode=infinite&intro=off`
   bypasses it. Browser tests use `test=1` to bypass except explicit
   `?test=1&intro=1`. Physics actors do NOT pre-spawn during intro.
   The user-approved steep third-person climbing chase resumes after intro.
2. **Dedicated physical starting pad**: a separate 4.6m-wide,
   4.4m-deep static Bullet pad at z=9.2..13.6, connected to the
   original broad 10.4m rest plaza by a 2.7m level bridge.
   Real side/rear guards, safe no-fall spawn at z=11.35; original
   lower slope/camp hazard killswitch stays untouched.
3. **Pacing**: 6 deterministic role-labelled 60m course sections:
   opening, weaving chairs/tables, rotor setpiece, hollow frames,
   one intentional pile, and late recovery. Roles shift by
   level seed, but counts and no-clutter windows remain stable.
   Newly streamed waves have at most 1–4 actual dynamic obstacles,
   separated by 1.75–2.8s and individually staggered, rather
   than many simultaneous 1s waves. Single pile section is
   deliberately retained. Fully seeded/replayable; previous
   C1.7 deterministic prewarm counter contracts retained.
4. **Hollow real Bullet shapes**: open cube, elongated rectangular
   prism, pyramid, triangle-prism/A-frame. Exactly 12/12/8/9
   physical small beam colliders per actor; 0 center collider.
   Geometry uses only native boxes; visual exactly mirrors Bullet
   edge collision. Opening sizes are more than 1.16m sphere
   diameter. Two pre-positioned dynamic hollow pieces per level
   and curated frame-section live actor opportunities. No licensed
   paid meshes. Preview device performance remains a phone-test gate.

## Acceptance / test protocol

- Tap-to-skip preview starts physics and hazards immediately.
- Unskipped tour ends and ball is grounded and visible on its private pad.
- Retry same level bypasses tour, new level shows tour.
- After intro, <6m ease into previous favorite camera; 60m summit
  still requires genuine `collisionstart`.
- 1000 seeds preserve exactly one pile, weaving, frames, recovery.
- Hollow frame in PlayCanvas = compound real Bullet dynamic rigidbody
  and exactly 8–12 physical edge-only colliders. Distinct real openings.
- Original C0..C1.7 physics, swipes, collision magnet, ball shop and
  deterministic waveform tests remain passing.
- GitHub Actions build only writes compiled `dist` to
  `c1-8-mobile-static-preview` after ALL green suites.

## Non-scope

No new actual downloaded video file, no reauthoring user-favorite
steep camera, no changes to mass, side-swipe or cosmetic economy.
Existing ITHappy commercial meshes/license are not bundled.
