# C0.6 Ball Climber — Android without using a PC

Source gameplay branch: `c0-6-weighted-swipes-speed-control`, commit `0bb936c3e4f9646030564766c2b3534c5365c73b`.

This workflow builds and verifies the **same physics gameplay** without editing it, and pushes only generated static browser files to `c0-6-mobile-static-preview`. The test URL can be opened directly in Android Chrome without a PC.

Test URL (active **only after** CI succeeded and hosting verified):
https://raw.githack.com/Oddropdev/ball-climber/c0-6-mobile-static-preview/index.html

The third-party raw.githack CDN may display an initial anti-phishing confirmation before showing HTML. It serves the repository's public build over HTTPS, no GitHub Pages setup necessary. This is a publicly accessible/unlisted test, not a private site or supported production host. It is not associated with GitHub or OpenAI. Do not add raw paid GLB assets or secrets to this branch.

C0.6 supports portrait touch controls: **up swipe** to climb / grow mass temporarily, lateral swipe to dodge, collect falling loot, and avoid avalanche furniture. Real Android FPS and touch handling require a physical-phone test. Report input lag, clipped HUD and pauses.

This preview is intentionally separate from `main` and other stacked draft PRs; no merging or public production release.
