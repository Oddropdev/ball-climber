# C1.0 — Infinite Climb Foundation (stacked, owner playtest)

Base: C0.7 Gameplay Readability `c0-7-gameplay-readability` PR #8.
Branch: `c1-0-infinite-climb-foundation`.

## Player loop
The **opt-in** `/?mode=infinite` lets players climb the existing real Bullet
60° hillside, reach a **real static summit platform**, and choose:
- **NEXT LEVEL**: saves progression, safely destroys the previous level's
  physical side obstacles and summit platform, constructs a new deterministic
  level and resets the *same* dynamic Bullet ball to a fresh base.
- **SKIN SHOP**: visual-only ball skins; purchases use banked falling loot.
  Four skins total (Classic Pearl free, Coral 12, Mint 24, Midnight 40).
  No collision/charge/speed/loot/ability benefits.
- Store level, wallet, ownership and selected skin in a bounded,
  validated v1 localStorage record. No backend account or payments.

Every new level has its own generated physical side rocks and safe plateau,
new deterministic hazard wave seed and an appropriate biome. Level 1 = Rocky
Ascent; Level 2 = Stormwall; later rotate four themes. Runtime creates just
one level at a time, never builds all 1,000 scenes at once.

## Explicit limits
This is a **generator foundation**, not 1,000 hand-designed challenge grammars.
The C1.0 world recipe shares the original 48m 60° slope physics and several
safe scenic variables; the richer Stormwall wind system and terrain morphing
are for C1.1. 1,000 static spec validations do NOT claim 1,000 manual
physically completed runs.

The original C0.7 default game at `/` is preserved unmodified in behavior.
`?test=1` only with `?mode=infinite` unlocks a read-only snapshot and
`approachSummit()`: the test uses a SHORT physics-based approach near the
summit to avoid waiting through repeated 48m climbs. It does not trigger
the completion callback directly and is never available in normal infinite
mode. Never claim this as a natural from-start full run.

## Technical gates
- Numeric reproduction / bounds check for levels 1–1000, different seeds,
  safe arrival platform properties, bounded difficulty/biome variety.
- Verified shop wallet debits, owned/equipped only, restart/reload.
- Browser C1 test of Level 1 -> plateau -> shop -> Level 2 -> plateau ->
  Level 3, actual static Bullet scene entities/disposal, same dynamic ball.
- Frozen C0-C0.7 browser regressions.
- Public mobile test link is **compiled-only raw.githack CDN**, a third party;
  requires owner review for FPS, actual long-session memory and touch feel.
- Keep PR draft and avoid merging parent branches until owner playtest.
