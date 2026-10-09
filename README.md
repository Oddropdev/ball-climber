# Ball Climber

A standalone PlayCanvas 2.22.6 + real Ammo/Bullet mobile climbing game, extracted from proven Game Factory engine patterns without copying its gameplay.

## Current WIP: C0.2 — 60° Slope Physics

- **One upward flick** = one real Bullet forward roll/torque impulse, no perpetual uphill motor.
- Swipe left/right for single lateral dodging impulses.
- A genuine pitched **60° physical ramp** with no hidden side safety rails, so physics hazards can push the ball down/off the cliff.
- Indefinitely generated seeded rock / loot waves: spheres, cubes, boxes, aligned rows, trains and diagonals. Only 48 simultaneously active, old Bullet objects destroyed after they fall below the camera/character.
- Follow camera just below the ball looking uphill; 48m short level, checkpoint loss on falls.

## Quick start

Requires Node.js >=24.

```bash
npm install
npm run build
npm run dev
```

CI produces a no-install owner ZIP that can be launched through `Start_Ball_Climber.cmd`.

## Branches

- `main`: minimal independent repository.
- `c0-playcanvas-bullet-foundation`: accepted technical C0 base, draft PR #1.
- `c0-2-sixty-degree-swipe-slope`: C0.2 gameplay iteration, not yet merged.

See `docs/C0-2_HANDOFF.md`. Keep public repo free of purchased private GLBs.
