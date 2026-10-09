# C1.3 — Chair Gauntlet, Real Falls and Low Camera

Starting point: accepted C1.2 branch `c1-2-magnetic-summit-obstacle-variety`.
User evidence: mobile recording `Recording 2026-10-09 211429.mp4`.

## Gameplay changes

- **Side swipe** in Infinite Mode: old C0.7 mass/lateral contract is
  unchanged. Infinite Mode uses a 6.2 baseline x-impulse and retains 78%
  when fully charged, plus a small capped impulse when countersteering.
  Actual mass-scaled Bullet impulse and collision remain intact; no
  velocity teleport, lane switching or auto-uphill movement.
- **Fall** in Infinite Mode: side-of-track departure does not immediately
  teleport; recover after the ball is about 8 metres below the slope
  surface or reaches a hard world safety bound. On recovery go to
  progress=2 and reset the checkpoint/max progress to 2. Charged mass
  and swipes reset normally. Other 60-degree C0.7 modes keep the prior
  checkpoint logic. Loot already collected in the ongoing attempt
  remains unchanged.
- **Chair gauntlet**: 8 seed-determined start-of-level dynamic objects
  across 8–42m: 5 open-legged chairs, 1 table, 2 gold rewards, each
  actual compound Ammo collision shape. This supplements the older
  eight C1.1 warmstart items rather than changing their contract.
  An at-most-9 live furniture budget limits extra wave-generated
  compounds and the original 6 complex shapes cap remains.
- **Live waves**: modest ~14% shorter inter-wave interval in Infinite
  Mode to reduce empty stretches without changing 50+50 hard caps.
- **Low camera**: default infinite-mode camera is 2.35m lower than
  C1.2 at the foot of the slope, easing toward 1.41m lower at the
  summit; original C0.7 and `?mode=infinite&camera=classic` retain
  the prior camera for direct A/B comparison. Camera never changes
  Bullet transforms.
- **Magnetic summit**: C1.2 contact-gated magnetic landing stays intact.

## Asset provenance

The user has purchased a licensed ITHappy obstacle pack, but has not
yet provided the mesh files or full license terms in this conversation.
This release includes **only original procedurally authored compound
shapes** and intentionally does **not** copy or redistribute the paid
ITHappy meshes. Asset integration follows a user-uploaded pack and
license review (private handling if the license disallows publication).

## Verification

- 1000 distinct level seeds retain identical bounded chair layouts
  and all five accessible furniture leg-gap colliders.
- Full original C0–C1.2 browser regressions.
- A direct Bullet off-edge test must *not* reset immediately at the
  road edge and must eventually reset from midlevel to the bottom.
- Side swipe must cause a measurable horizontal rigidbody velocity.
- Camera screenshot comparisons at the exact same mobile viewport.
- New preview `c1-3-mobile-static-preview` only published after
  successful tests; owner must still validate real Android FPS.

### Links
GitHub test branch: `c1-3-chair-gauntlet-fall-camera`.
Modes: `?mode=infinite` (low), `?mode=infinite&camera=classic` (old).
