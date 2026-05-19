# Wash Empire Launch Run Log

Append one entry per launch-worker run. Keep this file short, factual, and useful for deciding what to do next.

## Format

```text
## Run YYYY-MM-DDTHH:mm:ss-04:00
- Task:
- Team:
- Changed:
- Verification:
- Result:
- Next:
```
## Run 2026-05-12T20:41:14-04:00
- Task: L-001 Production Launch Audit Script; L-002 Mobile HUD Smoke Coverage
- Team: Release QA
- Changed: package.json; scripts/launch-audit.mjs; scripts/launch-smoke.mjs; docs/launch-pathway.md; qa/launch-smoke-desktop.png; qa/launch-smoke-mobile.png
- Verification: npm.cmd run audit:visual-rewards; npm.cmd run test; npm.cmd run build; npm.cmd run audit:launch
- Result: Passed. Added a single launch audit command that fails at the first failing step and includes browser smoke screenshots for desktop, mobile start menu, mobile HUD, upgrades, and map.
- Next: Start L-003 District Identity Pass.
## Run 2026-05-13T00:35:28-04:00
- Task: L-003 District Identity Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards; npm.cmd run test; npm.cmd run build; npm.cmd run audit:launch
- Result: Passed. Added theme-specific minor-road density: downtown now renders extra cross/ring minor roads and snow removes two inner minor roads to read sparser.
- Next: Continue L-003 with signage/prop tone deltas and capture district screenshots when visual deltas are larger.

## Run 2026-05-13T22:00:20-04:00
- Task: L-004 Road And Arrival Polish
- Team: Gameplay
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards (pass); npm.cmd run test (pass); npm.cmd run build (initial fail TS6133, pass after fix); npm.cmd run audit:launch (fail at browser smoke/screenshot: Vite preview exited early code 1)
- Result: Advanced L-004 by rerouting passing traffic to perimeter roads so non-customer cars no longer pull into wash approach lanes; no commit because launch smoke verification failed.
- Next: Release QA should fix scripts/launch-smoke.mjs preview startup failure, then rerun audit:launch and capture updated qa/ evidence.

## Run 2026-05-14T05:09:15-04:00
- Task: L-005 People Washing Cars Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards (pass); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:launch (fail at browser smoke/screenshot: Vite preview exited early code 1)
- Result: Advanced L-005 by adding an occupied-bay header with soap/scrub/rinse label plus per-bay progress fill so wash state and time-in-bay read from the default camera; no commit because required launch audit failed.
- Next: Release QA should repair scripts/launch-smoke.mjs preview startup, rerun audit:launch, and then continue L-005 with screenshot evidence of at least two active bays.

## Run 2026-05-14T07:37:00-04:00
- Task: Launch automation recovery
- Team: Release QA
- Changed: scripts/launch-smoke.mjs; docs/launch-pathway.md; docs/launch-run-log.md; src/components/WashScene.tsx
- Verification: npm.cmd run audit:launch (pass: visual reward audit, tests, build, browser smoke/screenshots)
- Result: Passed. Recovered the launch-worker deadlock by starting Vite preview directly through Node on an available local port, which avoids the stale fixed-port preview process that caused browser smoke to exit early.
- Next: Commit the verified recovery patch so the next hourly launch worker starts from a clean WashEmpireWeb tree and continues the lowest-numbered in-progress task.

## Run 2026-05-14T08:13:20-04:00
- Task: L-003 District Identity Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards (pass); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass, screenshots refreshed under qa/)
- Result: Passed. Added downtown roadside neon curb/crosswalk accents and snow roadside route marker posts so bustling and snow districts read more distinct at the lot-edge glance.
- Next: Continue L-003 with additional signage tone and prop language differences across remaining districts.

## Run 2026-05-18T19:08:51-04:00
- Task: L-003 District Identity Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run lint (pass); npm.cmd run audit:visual-rewards (pass); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass, screenshots refreshed under qa/)
- Result: Passed. Added the explicit tycoon/mobile diorama art direction to the pathway, a raised diorama base frame, larger themed city storefronts and anchors, stronger plaza/curb/landscape treatment around the car wash, and theme-specific silhouettes for small city, harbor, downtown, snow, and beltline.
- Next: Continue L-003 and L-006 with fewer placeholder blocks, more upgrade-triggered physical props, and screenshots for each city before family testing.

## Run 2026-05-18T20:13:36-04:00
- Task: L-003 District Identity Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards (pass); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass, screenshots written under qa/)
- Result: Passed. Added district gateway landmark silhouettes per city theme at the approach edge so small city, harbor, downtown, snow, and beltline read faster from the default camera.
- Next: Continue L-003 with stronger city-specific signage tone at the lot perimeter while preserving car wash hero focus.

## Run 2026-05-19T04:26:02-04:00
- Task: L-003 District Identity Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards (pass); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass, screenshots written under qa/)
- Result: Passed. Added larger city-specific gateway sign silhouettes (small town arch, harbor lighthouse marker, downtown neon header pylons, snow pass arch, beltline overhead service beam) so district identity reads faster without pulling focus from the car wash lot.
- Next: Continue L-003 with city-specific roadside signage language tied to each district's business mix.

## Run 2026-05-19T05:26:47-04:00
- Task: L-003 District Identity Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md; qa/launch-smoke-desktop.png; qa/launch-smoke-mobile-start-menu.png; qa/launch-smoke-mobile-hud.png; qa/launch-smoke-mobile-upgrades.png
- Verification: npm.cmd run audit:visual-rewards (pass); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (fail: Map panel did not open on mobile in scripts/launch-smoke.mjs)
- Result: Advanced L-003 by adding city-specific roadside marquee signs for each district business mix; no commit because required mobile smoke check failed while opening the map panel.
- Next: Release QA should fix the mobile map toggle step in scripts/launch-smoke.mjs and rerun audit:smoke-ui before the next art pass.

## Run 2026-05-19T11:06:00-04:00
- Task: L-003 District Identity Pass; L-002 Mobile HUD Smoke Coverage
- Team: Visual / Art; Release QA
- Changed: src/components/WashScene.tsx; scripts/launch-smoke.mjs; docs/launch-pathway.md; docs/launch-run-log.md; qa/launch-smoke-desktop.png; qa/launch-smoke-mobile-start-menu.png; qa/launch-smoke-mobile-hud.png; qa/launch-smoke-mobile-upgrades.png; qa/launch-smoke-mobile-map.png
- Verification: npm.cmd run lint (pass); npm.cmd run audit:visual-rewards (pass); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass); npm.cmd run audit:launch (pass)
- Result: Passed. Replaced repeated mini city placeholder blocks with real parcel-style storefront clusters including parking aprons, sidewalks, curbs, awnings, windows, parked micro-cars, streetlights, and trees; repaired the mobile map smoke step and added WebGL settle time so screenshots validate the rendered scene instead of a blank first frame.
- Next: Continue L-006 with upgrade-triggered exterior rewards for bay/equipment upgrades, then capture city-specific screenshots for snow, downtown, harbor, and automatic districts.

## Run 2026-05-19T11:37:24-04:00
- Task: L-006 Upgrade Reward Expansion
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; scripts/visual-reward-audit.mjs; docs/launch-pathway.md; docs/launch-run-log.md; qa/bay-upgrade-visual-pass.png
- Verification: npm.cmd run lint (pass); npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 31 lot reward props, 6 bay upgrades); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:launch (pass)
- Result: Passed. Added per-bay visual reward props for selector, wand, soap, rinse, dryer, and vault upgrade tracks, plus an upgraded-bay QA screenshot showing those changes in-scene.
- Next: Continue L-006 with employee/ad/marketing visible-state upgrades.

## Run 2026-05-19T12:36:11-04:00
- Task: L-006 Upgrade Reward Expansion
- Team: Visual / Art
- Changed: src/game/environmentRewards.ts; src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 33 lot reward props, 6 bay upgrades); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass, screenshots written under qa/)
- Result: Passed. Added manager-upgrade staffing reward props (staff training board and manager parking sign) and mapped them in environment rewards so office/staff expansion is visible in-scene.
- Next: Continue L-006 with additional employee/security/ad-upgrade lot props that are visible from the default mobile camera.

## Run 2026-05-19T16:36:21-04:00
- Task: L-004 Road And Arrival Polish
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md; qa/road-frontage-cleanup.png
- Verification: npm.cmd run lint (pass); npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 33 lot reward props, 6 bay upgrades); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:launch (pass)
- Result: Passed. Removed the debug-like sidewalk grid feel and giant road words, then replaced them with curb/sidewalk slabs, driveway throats, curb cuts, no-parking curb paint, street-sign blades, and clearer car wash entry/exit frontage markings.
- Next: Continue with tighter city block placement and parking-lot polish.
