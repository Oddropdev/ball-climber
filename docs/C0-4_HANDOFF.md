# C0.4 — Furniture Flow & Player Visibility
Branch: c0-4-furniture-flow-camera, stacked on PR #3 (C0.3).
Original Oddropdev/game-factory is never changed.

## What changed
- 50/50 rock/loot hard ceilings remain. Live soft budgets are 24 rocks and
  30 loot. Lower wave cadence (~1.18 seconds), higher loot ratio. Richness
  comes from shapes and responsive physics rather than solid cube spam.
- Large tables and chairs are *actual multi-part dynamic Bullet compounds*
  (individual collision boxes for four legs + top, and chair backs).
  Their center contains no solid physics proxy. Standard ball fits under them.
- Ultra-light .14-mass Bullet debris can be knocked aside; giants remain heavy.
- Ball moves slowly uphill by continuous force and gains drive when held;
  upward swipes still deliver distinct impulse boosts. Horizontal swipes dodge.
  Heavy impacts and side-edge falls remain real.
- Camera follows actual displaced ball more aggressively. Near-line-of-sight
  opaque hazards use a shared transparent ghost material (render-only).
  Their Bullet colliders stay active, so it is NEVER a cheat/invincibility.
- Previous 60° slope, summit ? source and resource destruction preserved.
- Existing and new unit/browser CI checks, Windows owner ZIP.

## Limits and follow-up
CI success does not prove visual quality or target Android framerate.
Owner review should focus on furniture rotation, gap traversal, camera
clarity, progression speed and balance. Do not merge until approved.
