# C0.6 — Weighted Swipe & Speed Control (owner review)

- Base: C0.5 PR #5, branch c0-5-swipe-only-slow-avalanche.
- New draft branch: c0-6-weighted-swipes-speed-control.
- Owner 113s game recording: C0.5 swipe-only climbing has promising feel;
  excessive top speed is the remaining concern. Wants swiping to temporarily
  increase REAL player weight, allowing medium debris to be pushed aside.
- Preserve: true 60° Ammo slope, swipe-only propulsion, slower obstacle fall,
  hollow Bullet furniture, soft props, mystery box, physical risk of falling,
  camera translucency, 50+50 hard / 24+30 soft caps and teardown.

## C0.6 physics design
- Lower max uphill speed 17.0 -> 12.5. Unlike C0.5's impulse-only cap,
  enforce the positive uphill component on the real Bullet linear velocity
  even after repeated swipes or unusual heavy contacts. Sideward and
  downhill components remain free; obstacle impacts are NOT disabled.
- Lower base impulse 11.0 -> 10.7, chain +.95 -> +.55. Normalize applied
  impulse to actual current body mass to avoid undoing climb responsiveness.
- Each accepted UP swipe increments charge (max level 4), updating the
  REAL PlayCanvas RigidBodyComponent.mass / Bullet inertia from 1.4 to
  2.4/3.4/4.4/5.4. The ball can physically displace medium objects
  more effectively but cannot ignore giant >40 mass hazards or static
  walls. The collider stays the same size.
- Charge begins fading after 1.7s without up swipe, one level every .75s.
  A new swipe after a long gap begins at level 1, and a real fall/checkpoint
  or manual restart resets mass and streak. Visually tint the equator band
  and display MASS x* in HUD.
- One swipe still = one physics impulse, not continuous motor. Short/long
  pointer holds do not recharge.
- Mass-scaled anti-slide traction keeps same gravity feel; dynamic hazard
  drag is independent of player weight.

## Acceptance
- CI unit/Chromium assert real mass setter, increase/cap/fade and reset,
  uphill velocity ceiling, distinct one-flick behavior and prior fall/
  camera/furniture/respawn/resize systems.
- Real owner judgment of push-through collisions and mobile FPS remains
  OPEN. If pushing is too strong/weak, tune mass/momentum parameters only,
  not world physics or randomizer.
- Never put paid ITHappy files into public GitHub. Do not merge main
  without owner game-feel acceptance.
