# C1.4 — Ultra-Low Chase & Physics Rotor Machines

Base: `c1-3-chair-gauntlet-fall-camera` (PR #12).
Evidence: owner Android recording `Recording 2026-10-09 213304.mp4`.
An overwhelmingly cluttered roadside and rushable early lanes are the main
new problems; side swipes are good and must remain identical to C1.3.

## Gameplay contract

- **Closer camera:** Infinite Mode now gets +0.95m lower relative to C1.3,
  +2.25m closer along the follow distance, and FOV 61→58 degrees,
  easing back toward the summit to preserve the magnetic arrival. Mode
  `?mode=infinite&camera=low` restores C1.3's lower baseline, and
  `?mode=infinite&camera=classic` restores C1.2. C0.7 `/` unchanged.
- **Clear road edges:** remove every old per-level solid boulder (physical
  side blockers now zero), decorative edge-spheres, distant sphere clouds,
  large summit wings, and off-road sphere islands from Infinite Mode.
  Only real ramp and summit collider remain static physical ground.
  Original C0.7 decorations untouched.
- **Rush pack:** six additional deterministic REAL Bullet hazards/rewards at
  approximately progress 4.5, 7.5, 10.5, 14, 18 and 22m, supplementing
  original eight C1.1 warm-start items and eight C1.3 gauntlet items.
  Includes hollow compound chairs, barrels/beams and one reward.
  No change to swipe cooldown, force or top speed. No artificial movement
  slowdowns. The aim is to create actual initial collision pressure.
- **Rotors:** Level 4+ contains one seeded, slope-aligned motor obstacle.
  Level 9+ has two. Cross, opposing hammer and paddle/platform variants
  have a slow 10–16 RPM kinematic Bullet compound rigidbody, with real
  collider children, therefore hit BOTH rolling hazards and players.
  They are anchored in world space; only angular transform changes.
  Hard cap two machines with 2–3 collision primitives each.
  Shapes are original procedural geometry; no proprietary meshes shipped.
- **Scope:** No changes to 48m underlying course length or magnetic
  summit, cosmetic shop, weights, speed cap, user wallet, viewport or
  old modes. Long-variable-length courses remain a separate later project.

## Verification

- 1,000 seeded levels deterministic: valid rotor spacing, real compound
  parts and exactly six seeded early rush objects each.
- Real Bullet browser integration: rotor kinematic type, progression
  angle, and a dynamic falling body hits spinning collider.
- Phone camera comparison, original C0–C1.3 full test suite, full
  level transitions and magnetic contact gates.
- Isolated successful GitHub Actions build publishes static compiled
  `c1-4-mobile-static-preview` only after all browser tests pass.
- Low-end Android FPS remains an owner phone-playtest gate.

## Licensed third-party obstacle models

User owns an ITHappy package/license but model bytes have not been
uploaded here. No purchased content should appear in public source or
preview until its license terms and allowed distribution are checked.
