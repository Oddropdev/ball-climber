# C0 — Ball Climber extraction and first physics loop
Source: selected engine/Ammo patterns from Oddropdev/game-factory, W9.4.
Do NOT overwrite source Game Factory, copy licensed GLBs, or publish user-owned archives.

## This branch
- New, independent PlayCanvas 2.22.6 + Ammo/Bullet game.
- Pinned self-hosted official Ammo modules (same SHA256 as verified Game Factory).
- Static real 42m cliff and Bullet dynamic player; persistent physical magnet assist and force-driven climb.
- Real Bullet dynamic rocks and loot, collision contacts, collection and checkpoints.
- Original lightweight styling, pointer and keyboard input, live camera.
- Pure deterministic C0 hazard/loot layout. No dependency on Ball Runner modes.
- Unit + Playwright browser smoke and GitHub Actions build/artifact.
- CI and human Android game-feel remain acceptance gates; do not claim polished gameplay.

## Developer workflow
Node.js >=24. First `npm install`, then `npm run build` and `npm run dev`
(the build step fetches and verifies local Ammo runtime). Or use GitHub Actions ZIP
and `Start_Ball_Climber.cmd` with Node installed.

## Next milestone: C0.1
Observe real owner video. Tune upward magnetic traction / impact impulse / dodge window;
then 10 short deterministic LevelSpec levels, hazards and loot varieties.
Keep physics authoritative; never fake dynamic falling rocks with animated transforms.
