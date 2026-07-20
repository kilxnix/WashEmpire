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

## Run 2026-05-19T19:27:12-04:00
- Task: L-003 District Identity Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 33 lot reward props, 6 bay upgrades); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass, screenshots written under qa/)
- Result: Passed. Added new district-specific roadside silhouette landmarks (small city clock plaza, harbor ferry pier/cabin, downtown neon skybridge, snow chairlift posts, beltline overpass) to improve city identity recognition from default camera distance.
- Next: Continue L-003 with per-district road markings and curb asset language that stays subordinate to the hero wash lot.

## Run 2026-05-20T03:37:13-04:00
- Task: L-006 Upgrade Reward Expansion
- Team: Visual / Art
- Changed: src/game/environmentRewards.ts; src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md; qa/launch-smoke-desktop.png; qa/launch-smoke-mobile-start-menu.png; qa/launch-smoke-mobile-hud.png; qa/launch-smoke-mobile-upgrades.png; qa/launch-smoke-mobile-map.png
- Verification: npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 34 lot reward props, 6 bay upgrades); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass, screenshots written under qa/)
- Result: Passed. Added a new manager-upgrade scene reward (`staff-break-canopy`) with a visible office-side crew rest canopy/bench prop and wired it through environment rewards so workforce progression reads more clearly in-scene.
- Next: Continue L-006 with security/ad-upgrade lot props that introduce stronger silhouette changes near the frontage corridor.

## Run 2026-05-20T05:42:21-04:00
- Task: L-003 District Identity Pass
- Team: Visual / Art
- Changed: src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 34 lot reward props, 6 bay upgrades); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (fail: Map panel did not open on mobile in scripts/launch-smoke.mjs)
- Result: Advanced L-003 with district-specific frontage roadway identity props (small city brick crossing, harbor bollards/dock lane, downtown neon bus-lane bars, snow chain grooves, beltline truck lane blocks); no commit because required mobile smoke check failed.
- Next: Release QA should fix the mobile map open step in scripts/launch-smoke.mjs and rerun npm.cmd run audit:smoke-ui before the next visual pass.

## Run 2026-05-20T13:52:51-04:00
- Task: L-006 Upgrade Reward Expansion
- Team: Visual / Art
- Changed: src/game/environmentRewards.ts; src/components/WashScene.tsx; docs/launch-pathway.md; docs/launch-run-log.md; qa/launch-smoke-desktop.png; qa/launch-smoke-mobile-start-menu.png; qa/launch-smoke-mobile-hud.png; qa/launch-smoke-mobile-upgrades.png; qa/launch-smoke-mobile-map.png
- Verification: npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 35 lot reward props, 6 bay upgrades); npm.cmd run test (pass); npm.cmd run build (pass); npm.cmd run audit:smoke-ui (pass, screenshots written under qa/)
- Result: Passed. Added a new security-upgrade visual reward (`security-gate-arm`) and scene-backed frontage checkpoint props (gate arm, kiosk, and camera post) so `securityLights` produces a clearer lot-edge progression silhouette from default desktop/mobile framing.
- Next: Continue L-006 with ad/marketing and employee/security compound props that add larger skyline-adjacent silhouettes without reducing car wash hero focus.

## Run 2026-05-22T20:52:17-04:00
- Task: L-011 WebGL Performance Budget
- Team: Release QA
- Changed: src/components/WashScene.tsx; scripts/performance-smoke.mjs; scripts/launch-audit.mjs; package.json; docs/launch-pathway.md; docs/launch-run-log.md; qa/performance-smoke.png; qa/launch-smoke-desktop.png; qa/launch-smoke-mobile-start-menu.png; qa/launch-smoke-mobile-hud.png; qa/launch-smoke-mobile-upgrades.png; qa/launch-smoke-mobile-map.png
- Verification: npm.cmd run lint (pass); npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 35 lot reward props, 6 bay upgrades); npm.cmd run test (pass: 3 files, 47 tests); npm.cmd run build (pass, Vite large chunk warning remains); npm.cmd run audit:perf (pass: steady 340 geometries, 6 textures); npm.cmd run audit:launch (pass)
- Result: Passed. Added a production performance smoke gate to launch audit and reduced high-churn traffic allocations by sharing box, wheel, occupant, and washer-tool geometries/materials across the scene.
- Next: Continue app-store prep with code splitting/asset packaging after the remaining art and gameplay acceptance work is locked.

## Run 2026-05-24T13:35:04-04:00
- Task: L-010 App Store Checklist
- Team: Release QA
- Changed: docs/app-store-readiness-checklist.md; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: Documentation-only pass; sourced against current Apple App Store Connect and App Review guidance; git diff --check (pass).
- Result: Added a detailed App Store readiness checklist covering gameplay completion, visual bar, WebGL/performance gates, iOS/Capacitor/Xcode work, App Store Connect metadata, paid app setup, privacy/ad disclosure, TestFlight, screenshots, and final submission.
- Next: Convert remaining unchecked items into implementation sprints, starting with eight-hour balance, iOS build path, privacy/ad compliance, and final district screenshot review.

## Run 2026-05-24T13:43:23-04:00
- Task: L-010 Google Play Checklist
- Team: Release QA
- Changed: docs/google-play-readiness-checklist.md; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: Documentation-only pass; sourced against current Google Play Console and Android developer guidance; git diff --check (pass).
- Result: Added a Google Play readiness checklist covering Android App Bundle production build work, Play Console setup, Data safety/privacy/ad declarations, store listing assets, testing tracks, real-device QA, and production rollout.
- Next: Add a real `android:aab` build command and begin Play Console/test-track prep after the gameplay/art acceptance items are locked.

## Run 2026-05-25T18:21:50-04:00
- Task: L-012 Browser-First Fun Launch
- Team: Gameplay; Release QA
- Changed: src/components/MomentumPanel.tsx; src/App.tsx; src/App.css; docs/browser-first-launch-plan.md; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run lint (initial JSX parent error fixed, pass); npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 35 lot reward props, 6 bay upgrades); npm.cmd run test (pass: 3 files, 47 tests); npm.cmd run build (pass, Vite large chunk warning remains); npm.cmd run audit:perf (initial heap drift failed, fixed with 20 Hz simulation cadence, pass); npm.cmd run audit:launch (pass: steady 280 geometries, 6 textures).
- Result: Passed. Started the browser-first shift by adding a Momentum goals panel, hiding it during ride view and weekly review, documenting the browser launch plan for fun loop/real web ad boost/hosting/advertising/public playtest, and reducing simulation state churn for browser memory stability.
- Next: Continue L-012 with reward feedback polish, a real hosted ad-provider bridge, and public browser hosting.

## Run 2026-05-25T20:42:12-04:00
- Task: L-013 Browser Launch Hardening
- Team: Gameplay; Release QA
- Changed: src/game/types.ts; src/game/simulation.ts; src/game/simulation.test.ts; src/components/Hud.tsx; src/components/OfflineReturnPanel.tsx; src/components/WashScene.tsx; src/App.tsx; docs/browser-first-launch-plan.md; docs/launch-pathway.md; docs/launch-run-log.md
- Verification: npm.cmd run lint (pass); npm.cmd run test (pass: 3 files, 47 tests); npm.cmd run build (pass, Vite large chunk warning remains); npm.cmd run audit:launch (pass: 10 lot upgrades, 35 lot reward props, 6 bay upgrades; perf steady 276 geometries, 2 textures, heap drift 21.2 MB; screenshots written).
- Result: Passed. Set the browser launch path to pay-what-you-want, added a saved graphics-quality preference, defaulted to balanced rendering with lower DPR/no contact shadows, kept high graphics available, added low graphics mode, and removed offline earning caps so the full away time is credited.
- Next: Continue with code splitting for the large bundle warning, reward feedback polish, real hosted ad bridge, and upload prep for the pay-what-you-want page.

## Run 2026-05-25T22:05:26-04:00
- Task: L-013 Browser Launch Hardening / Itch Upload Prep
- Team: Gameplay; Release QA
- Changed: src/components/Hud.tsx; src/App.tsx; src/App.css; src/index.css; README.md; docs/first-player-guide.md; docs/browser-first-launch-plan.md; docs/google-play-readiness-checklist.md; docs/app-store-readiness-checklist.md; docs/launch-pathway.md; docs/launch-run-log.md; wash-empire-itch.zip
- Verification: npm.cmd run lint (pass); npm.cmd run test (pass: 3 files, 47 tests); npm.cmd run build (pass, Vite large chunk warning remains); npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 35 lot reward props, 6 bay upgrades); npm.cmd run audit:launch (pass: perf steady 276 geometries, 2 textures, heap drift -11.2 MB; smoke screenshots written); in-app browser preview at 127.0.0.1:4174 confirmed HUD actions are Upgrades, City map, Graphics, and Watch Ad only.
- Result: Passed. Removed the player-facing JSON import/export/reset controls from the in-game HUD, kept browser autosave intact, added the first-player guide for itch instructions, refreshed readiness docs, and rebuilt the itch upload zip from the passing production build.
- Next: Upload the zip to itch.io as an HTML5 browser game with donations/pay-what-you-want enabled, add screenshots/page copy, then run a hosted smoke check.

## Run 2026-05-25T22:19:31-04:00
- Task: Vite Chunk Warning / One-Hour Economy Pass
- Team: Gameplay; Release QA
- Changed: vite.config.ts; src/App.tsx; src/App.css; src/game/simulation.ts; src/game/simulation.test.ts; docs/browser-first-launch-plan.md; docs/launch-pathway.md; docs/launch-run-log.md; wash-empire-itch.zip
- Verification: npm.cmd run lint (pass); npm.cmd run test (pass: 3 files, 48 tests); npm.cmd run build (pass, no large chunk warning; largest chunks 372.58 kB and 355.85 kB); npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 35 lot reward props, 6 bay upgrades); npm.cmd run audit:perf (pass: stable 276 geometries, 2 textures); npm.cmd run audit:launch (pass); fresh in-app browser preview at 127.0.0.1:4175 confirmed canvas and HUD render after lazy scene load.
- Result: Passed. Lazy-loaded the 3D wash scene, split React/Three/R3F dependencies into production chunks under Vite's warning threshold, raised base wash revenue from $6 to $12, and added a deterministic one-hour starter playtest requiring positive cash, 45+ purchases, 3,800+ cars, and $150k+ first-hour revenue with the rewarded campaign loop.
- Next: Hosted itch smoke check after upload, then longer balance coverage for the remaining multi-hour/city-unlock curve.

## Run 2026-05-25T22:58:34-04:00
- Task: Continue Save Canvas Recovery
- Team: Release QA
- Changed: src/components/WashScene.tsx; docs/launch-run-log.md; wash-empire-itch.zip
- Verification: npm.cmd run lint (pass); npm.cmd run test (pass: 3 files, 48 tests); npm.cmd run build (pass, no large chunk warning); npm.cmd run audit:visual-rewards (pass: 10 lot upgrades, 35 lot reward props, 6 bay upgrades); npm.cmd run audit:perf (pass: stable 2048 calls, 147 geometries, 1 texture, heap drift 0.3 MB); npm.cmd run audit:launch (pass); Playwright/SwiftShader save-load smoke confirmed Neon Downtown renders after Continue without WebGL context loss; rebuilt wash-empire-itch.zip (396,974 bytes).
- Result: Passed. Removed live Drei/Troika 3D text rendering from the WebGL scene path and replaced ambient micro-labels with geometric sign chips, preventing resumed saves from hanging on text/font work while keeping HUD labels intact.
- Next: Hosted itch smoke check after upload, then capture final page screenshots from the uploaded build.

## Run 2026-05-25T23:27:39-04:00
- Task: Browser Favicon Dial
- Team: Visual / Release QA
- Changed: public/favicon.svg; docs/launch-run-log.md; wash-empire-itch.zip
- Verification: npm.cmd run build (pass, no large chunk warning); in-app browser preview confirmed the favicon SVG renders as a wash selector dial; rebuilt wash-empire-itch.zip (395,935 bytes).
- Result: Passed. Replaced the old favicon with a compact car-wash spin-dial mark using a dark selector ring, cyan wash arc, yellow dial center, and pink pointer.
- Next: Use the new zip for the itch upload smoke check.

## Run 2026-07-19T22:40:00-04:00
- Task: Soft-launch blockers from launch-readiness audit
- Team: Gameplay / UI / Release QA
- Changed: src/App.tsx; src/App.css; src/components/StartMenu.tsx; src/components/OfflineReturnPanel.tsx; src/game/simulation.ts; src/game/simulation.test.ts; scripts/launch-smoke.mjs; README.md; docs/launch-run-log.md; wash-empire-itch.zip
- Verification: npm.cmd run lint (pass); npm.cmd run test (pass: 3 files, 49 tests); npm.cmd run build (pass, no large chunk warning); npm.cmd run audit:visual-rewards (pass: 10/35/6); npm.cmd run audit:launch (pass: WebGL stable 149 geometries / 1 texture, smoke waits for live traffic and regenerates qa/launch-smoke-*-cars.png plus map/title shots)
- Result: Passed. Fixed offline resume (reconcile on visibility restore, preserve lastTickAt while backgrounded, no offline cash before game start), wrapped district map pills so mobile cards no longer overflow, mounted the 3D lot behind the title card, proved cars render in smoke (Drive-bys and live road cars), and rebuilt wash-empire-itch.zip without prototype-assets placeholders.
- Next: Upload wash-empire-itch.zip to itch.io (pay-what-you-want), paste first-player guide copy, run hosted smoke, send link to family testers.

## Run 2026-07-19T22:46:00-04:00
- Task: B-003 Browser IMA rewarded ad path (defer itch until real ads)
- Team: Monetization / Release
- Changed: src/services/ads.ts; src/services/ads.test.ts; src/services/imaRewarded.ts; src/services/imaTypes.ts; src/App.css; .env.example; README.md; docs/browser-first-launch-plan.md; docs/launch-run-log.md
- Verification: npm.cmd run lint (pass); npm.cmd run test (pass: 3 files, 52 tests); npm.cmd run build (pass)
- Result: Passed. Browser Ad Boost now loads Google IMA, requests a VAST/Ad Manager tag (`VITE_IMA_AD_TAG_URL` or public sample tag), grants boost only on full COMPLETE, fails closed on skip/error, keeps local modal for localhost/dev, and documents env config. Itch upload still deferred until a live production ad tag is configured.
- Next: Set production `VITE_IMA_AD_TAG_URL` from Ad Manager; add consent/privacy banner; then host + itch soft launch.
