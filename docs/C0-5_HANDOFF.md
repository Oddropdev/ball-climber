# C0.5 — Swipe-Only / Slow Avalanche
- Branch: c0-5-swipe-only-slow-avalanche, stacked on C0.4 PR #4.
- Source of truth: Oddropdev/ball-climber; do not merge until CI and owner review.
- Owner's 43.7s video on Oct 9, 12:41 shows continuing motor-driven ascent is
  too fast/easy. Restore the uniquely skill-based original discrete swipe.
- Player has a real dynamic Ammo/Bullet body; permanent C0.4 baseline motor
  and hold-to-drive are removed. A mild weaker-than-gravity anti-slide force
  cushions loss but DOES NOT ascend unaided.
- Single upward flick creates finite impulse + torque. Calibrated base 11.0,
  chain +0.95, cap 17.0 (prior C0.4 base 11.6, chain +1.6, cap 23).
  Keep side flicks. Holding input must not provide upward velocity.
- Obstacles receive mass-proportional 48% uphill gravity relief and linear
  drag 0.65 per downhill speed, starting at 2.8 vs old 4.3+.
  This slows only hazard bodies, not the player, physics clock or camera.
  Impact impulse remains mass-dependent, and collisions are genuine.
- Extended hazard lifespan to 22s so slower items don't disappear prematurely.
  Hard limits 50 rock + 50 loot; soft 24/30, procedural furniture with hollow
  Bullet collision leg spaces, light 0.14 mass props and camera ghost visibility
  all retained. No need to repaint or rewrite visuals.
- Video and Android FPS still require human approval. Compare current speed and
  swipe cadence with C0.3 for feel; if still too fast, tune Motion.ts only.
- Windows CI artifact includes no private paid assets.
