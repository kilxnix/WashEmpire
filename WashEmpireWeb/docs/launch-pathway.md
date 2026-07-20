# Wash Empire Launch Pathway

This is the automation-safe launch rail for Wash Empire Web. The existing hourly visual audit remains the guardrail. The launch worker should use this file as its product backlog and make one small, verifiable improvement per run.

## Launch Goal

Ship a mobile-first browser/Capacitor idle game that is ready for family-and-friends testing, itch.io testing, and then app-store packaging.

The game should communicate the fantasy immediately: a self-serve car wash business that grows from a humble local wash into a managed multi-location wash empire. Visual upgrades must be visible in the world, cars should feel purposeful, and each district should have a clear identity.

## Art Direction

- Target style: tycoon, city-focused tycoon, mobile diorama.
- The car wash should be the hero object at default zoom, with the surrounding city supporting the fantasy instead of becoming visual noise.
- Districts should use readable silhouettes and larger props first, then small details only where they reinforce the location identity.
- Each city needs a distinct in-scene language: small city storefronts and civic details, harbor docks and boardwalks, neon downtown density, snow/lodge cues, and beltline/automatic wash infrastructure.

## Launch Gates

- `G1 Demo Ready`: start menu, save/load, first district, upgrades, car flow, cash collection, ads fallback, and weekly loop are playable without intervention.
- `G2 Family Test Ready`: no known softlocks, mobile HUD readable, visual rewards obvious, no bankrupt-by-default balance, and a simple Start New path exists.
- `G3 Itch Ready`: production build works from zipped `dist`, desktop/mobile screenshots are current, the README publish path is accurate, and the first-player guide is ready for the itch page.
- `G4 App Store Prep`: Capacitor Android build works, rewarded-ad hook is guarded, privacy/store checklist is documented, and app icons/screenshots are ready.
- `G5 Content Runway`: three distinct locations are playable with different demand, bay count, visuals, and upgrade strategy: small city, snow city, bustling/neon city.
- `G6 Performance Ready`: launch audit includes a WebGL steady-state budget check and fails if geometry or texture counts grow during 10x play.
- `G7 Browser Launch`: browser build is fun in the first session, hosted publicly, has a real ad/boost path, and can be advertised with screenshots/video.

## Automation Rules

- Work only inside `C:\Users\whate\Documents\AI Locally\WashEmpire\WashEmpireWeb`.
- Ignore unrelated Unity project changes in the parent repo.
- Before editing, run `git status -sb -- WashEmpireWeb` from the repo root. If `WashEmpireWeb` is dirty, stop and report the blocker.
- Pick exactly one task marked `in progress` or `open` and `Automation OK: yes` from the queue.
- Prefer the lowest-numbered `in progress` task first; if none exist, pick the lowest-numbered `open` task.
- Keep the patch small enough to verify in one run.
- After edits, run `npm.cmd run audit:visual-rewards`, `npm.cmd run test`, and `npm.cmd run build`.
- For visual/UI tasks, also run or add a browser screenshot check when practical and save evidence under `qa/`.
- Append the result to `docs/launch-run-log.md`.
- If verification passes, commit only the exact `WashEmpireWeb` files changed by the run. Do not stage or commit Unity files. Do not push unless the user asks.
- If verification fails, do not commit. Report the owning team, failing command, likely files, and next fix.

## Work Queue

### L-001 Production Launch Audit Script

- Owner: Release QA Team
- Status: complete
- Automation OK: yes
- Goal: Add a single launch audit command that runs visual reward audit, tests, build, and a browser smoke/screenshot pass.
- Acceptance: `npm.cmd run audit:launch` exists and fails clearly when a required launch check fails.
- Verify: `npm.cmd run audit:launch`.

### L-002 Mobile HUD Smoke Coverage

- Owner: Release QA Team
- Status: complete
- Automation OK: yes
- Goal: Add an automated mobile viewport smoke check for start menu, game HUD, upgrades panel, and map panel.
- Acceptance: screenshots are produced under `qa/` and the script checks that HUD controls are not missing.
- Verify: launch audit plus manual review of generated screenshots.

### L-003 District Identity Pass

- Owner: Visual / Art Team
- Status: in progress
- Automation OK: yes
- Goal: Make the small city, snow city, and bustling/neon city read as unique locations without clutter.
- Acceptance: each district has different ground treatment, props, signage tone, road density, and traffic feel.
- Verify: desktop and mobile screenshots for each unlocked/current district.
- Progress: Added downtown roadside neon curb/crosswalk accents and snow district route marker posts to increase visual contrast between districts. Added a mobile diorama base frame, larger themed storefront/tower clusters, district anchor props, street lighting, and a stronger hero wash plaza so the car wash reads as the focal point from desktop and mobile cameras.
- Progress: Added theme-specific district gateway landmarks at the city approach edge (small city monument square, harbor dock crane/canal edge, downtown neon gateway bands, snow berm marker set, beltline service-road fleet row) to strengthen per-city silhouettes from the default play camera.
- Progress: Added larger theme-specific gateway sign silhouettes (small town timber arch, harbor lighthouse marker, downtown neon header pylons, snow pass arch, beltline overhead service beam) to improve city identification from default camera distance.
- Progress: Added city-specific roadside district marquee signs (main street shops, fish market row, neon arcade boulevard, summit lodge way, fleet service corridor) to strengthen business-tone identity near the lot edge from default camera framing.
- Progress: Replaced repeated placeholder cube clusters with parcel-style mini storefront blocks: parking aprons, sidewalks, curbs, awnings, windows, small parked cars, streetlights, and trees now surround the wash in every district.
- Progress: Added theme-specific roadside landmark silhouettes near the frontage corridor (small city clock plaza, harbor ferry pier/cabin, downtown neon skybridge, snow chairlift posts, beltline service overpass) so district identity reads faster at default zoom.
- Progress: Added district-specific frontage road language near the marquee corridor (small city brick crossing band, harbor dock lane + bollards, downtown neon bus-lane bars, snow chain-lane grooves, beltline heavy-truck lane blocks) to improve city identity at a quick camera glance.

### L-004 Road And Arrival Polish

- Owner: Gameplay Team
- Status: in progress
- Automation OK: yes
- Goal: Cars should drive with purpose toward the car wash, queue if worthwhile, or drive by if not. Avoid aimless circulation as the dominant visual.
- Acceptance: active customer cars visibly approach the wash entrance and non-customer traffic remains secondary.
- Verify: simulation tests or browser smoke notes plus screenshot/video evidence.
- Progress: Reworked the road/sidewalk art treatment so it reads as a real frontage road: removed debug-like sidewalk grid lines, replaced giant ground road words with street-sign blades, simplified random asphalt patches, added continuous curbs, sidewalk slabs, driveway throats, curb cuts, no-parking curb paint, and clearer enter/exit frontage markings.

### L-005 People Washing Cars Pass

- Owner: Visual / Art Team
- Status: in progress
- Automation OK: yes
- Goal: Always make self-serve bays feel occupied when a customer is washing: person, wand, spray/foam/rinse state, and time-in-bay progress.
- Acceptance: every occupied self-serve bay has a readable customer/wash action from the default camera.
- Verify: screenshot with at least two active bays.

### L-006 Upgrade Reward Expansion

- Owner: Visual / Art Team
- Status: in progress
- Automation OK: yes
- Goal: Expand visual rewards beyond the current 31 props so bay upgrades, vacuum island, employees, security, signage, and ad/marketing upgrades all visibly improve the lot.
- Acceptance: new reward ids are mapped in `environmentRewards.ts`, backed in `WashScene.tsx`, and audited.
- Verify: `npm.cmd run audit:visual-rewards`.
- Progress: Added per-bay scene-backed visual rewards for all six bay upgrade tracks: selector chips/readout, pressure wand hose reel and swivel arm, foam tanks and lines, rinse nozzles/gloss, dryer side blowers/air streams, and expanded vault cabinet/cassette. The visual reward audit now checks bay upgrade coverage too.
- Progress: Added manager-upgrade staffing visuals near the office (staff training board and manager/staff parking sign) so people-ops progression reads in-scene from the default camera rather than only through UI.
- Progress: Added a manager-upgrade staff break canopy/rest stop beside the office so workforce progression has a larger, camera-readable lot prop from default desktop/mobile framing.
- Progress: Added a security-upgrade frontage checkpoint (gate arm, kiosk, and camera post) mapped to `securityLights` so protection upgrades create an immediate lot-edge silhouette change from default camera distance.

### L-007 Economy Eight-Hour Balance Check

- Owner: Economy / Progression Team
- Status: in progress
- Automation OK: yes
- Goal: Add a deterministic balance test or script that simulates roughly eight hours of active play progression.
- Acceptance: the player cannot go bankrupt from normal operation and has meaningful upgrade choices across the run.
- Verify: `npm.cmd run test` or a dedicated balance script.
- Progress: Added a deterministic one-hour starter playtest inside `simulation.test.ts` that runs the first session with a rewarded campaign, regular collections, and a scripted upgrade plan; the test requires positive cash flow, high car volume, at least 45 purchases, and first-hour revenue over $150k.

### L-008 Employee Collection Clarity

- Owner: Gameplay Team
- Status: open
- Automation OK: yes
- Goal: Make employee weekly collection obvious while keeping the manual collect button useful.
- Acceptance: player can see staff count, wage impact, next pickup timing, and whether manual collection is still available.
- Verify: tests or browser smoke notes.

### L-009 Ads And Offline Gain Launch Guard

- Owner: Economy / Progression Team
- Status: open
- Automation OK: yes
- Goal: Ensure rewarded ads boost offline/idle income without granting rewards when an ad fails or is cancelled.
- Acceptance: ad fallback remains demo-safe, native ad path is guarded, and tests cover reward/no-reward outcomes.
- Verify: `npm.cmd run test`.

### L-010 Itch And App Store Checklist

- Owner: Release QA Team
- Status: in progress
- Automation OK: yes
- Goal: Create a launch checklist for itch.io and app-store readiness, including screenshots, privacy notes, ad disclosure, build commands, and known test devices.
- Acceptance: checklist exists in `docs/` and references current commands.
- Verify: documentation review plus build.
- Progress: Added `docs/app-store-readiness-checklist.md` with the Apple App Store readiness checklist, including gameplay/art gates, iOS build work, App Store Connect metadata, privacy/ad requirements, TestFlight, screenshots, and final submission steps.
- Progress: Added `docs/google-play-readiness-checklist.md` with the Google Play readiness checklist, including Android App Bundle work, Play Console setup, Data safety/privacy/ad declarations, store listing assets, testing tracks, and production rollout steps.
- Progress: Added `docs/first-player-guide.md` for itch page instructions, player onboarding, controls, saves, upgrades, cities, weekly review, and first-session tips.

### L-011 WebGL Performance Budget

- Owner: Release QA Team
- Status: complete
- Automation OK: yes
- Goal: Add a repeatable memory/performance guard so the game can run at 10x without silently growing WebGL geometry or texture counts.
- Acceptance: `npm.cmd run audit:perf` samples production preview render metrics after warmup and `npm.cmd run audit:launch` includes it.
- Verify: `npm.cmd run audit:launch`.
- Progress: Added shared geometry/material caching for high-churn box, wheel, occupant, and washer-tool meshes; added a render-info probe and production performance smoke test. Latest launch audit held steady at 340 geometries and 6 textures during 10x play.

### L-012 Browser-First Fun Launch

- Owner: Gameplay Team
- Status: in progress
- Automation OK: yes
- Goal: Prioritize browser fun, hosted play, real web ad boost integration, and shareable marketing before returning to app-store packaging.
- Acceptance: `docs/browser-first-launch-plan.md` exists, the game has a visible short-term goal loop, the hosted web launch tasks are tracked, and the browser launch audit stays green.
- Verify: `npm.cmd run audit:launch` plus browser screenshot review.
- Progress: Added `docs/browser-first-launch-plan.md`, started the Momentum Loop with an in-game goals panel that links to collect/upgrades/map/ad boost actions, hid the panel during ride view and weekly review, and moved simulation updates to a 20 Hz cadence to reduce browser memory churn. Latest launch audit passed.

### L-013 Browser Launch Hardening

- Owner: Gameplay Team; Release QA Team
- Status: in progress
- Automation OK: yes
- Goal: Prepare the public pay-what-you-want browser build with safer memory defaults, graphics control, and uncapped offline earnings.
- Acceptance: Graphics quality is player-selectable, default graphics reduce render cost, offline return credits the full elapsed time, dev save controls are absent from the HUD, and the full launch audit passes.
- Verify: `npm.cmd run lint`; `npm.cmd run test`; `npm.cmd run build`; `npm.cmd run audit:launch`.
- Progress: Added the browser graphics quality preference, switched the default to balanced rendering, and removed offline earning caps.
- Progress: Removed player-facing JSON import/export/reset controls from the in-game HUD while keeping autosave and the title-screen Start New path.
- Progress: Split the 3D scene and Three/R3F dependencies into lazy production chunks so `npm.cmd run build` no longer emits the Vite large-chunk warning.
- Progress: Raised the base wash price from $6 to $12 so the cold first week is profitable and the first hour has stronger upgrade cadence.

## Current Product Risks

- The visual reward audit proves upgrade props exist, but it does not judge whether the scene looks production-ready.
- Automated tests cover core logic, but browser/mobile playability still needs screenshot and interaction checks.
- The cron can help steadily, but it must work from small queue tasks and leave a clear run log.
- The production bundle still triggers Vite's large chunk warning; before App Store submission, code splitting should be considered after gameplay/art stabilizes.
