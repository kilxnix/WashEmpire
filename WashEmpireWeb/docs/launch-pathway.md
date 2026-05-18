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
- `G2 Family Test Ready`: no known softlocks, mobile HUD readable, visual rewards obvious, no bankrupt-by-default balance, and a simple reset/export path exists.
- `G3 Itch Ready`: production build works from zipped `dist`, desktop/mobile screenshots are current, and the README publish path is accurate.
- `G4 App Store Prep`: Capacitor Android build works, rewarded-ad hook is guarded, privacy/store checklist is documented, and app icons/screenshots are ready.
- `G5 Content Runway`: three distinct locations are playable with different demand, bay count, visuals, and upgrade strategy: small city, snow city, bustling/neon city.

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

### L-004 Road And Arrival Polish

- Owner: Gameplay Team
- Status: in progress
- Automation OK: yes
- Goal: Cars should drive with purpose toward the car wash, queue if worthwhile, or drive by if not. Avoid aimless circulation as the dominant visual.
- Acceptance: active customer cars visibly approach the wash entrance and non-customer traffic remains secondary.
- Verify: simulation tests or browser smoke notes plus screenshot/video evidence.

### L-005 People Washing Cars Pass

- Owner: Visual / Art Team
- Status: in progress
- Automation OK: yes
- Goal: Always make self-serve bays feel occupied when a customer is washing: person, wand, spray/foam/rinse state, and time-in-bay progress.
- Acceptance: every occupied self-serve bay has a readable customer/wash action from the default camera.
- Verify: screenshot with at least two active bays.

### L-006 Upgrade Reward Expansion

- Owner: Visual / Art Team
- Status: open
- Automation OK: yes
- Goal: Expand visual rewards beyond the current 31 props so bay upgrades, vacuum island, employees, security, signage, and ad/marketing upgrades all visibly improve the lot.
- Acceptance: new reward ids are mapped in `environmentRewards.ts`, backed in `WashScene.tsx`, and audited.
- Verify: `npm.cmd run audit:visual-rewards`.

### L-007 Economy Eight-Hour Balance Check

- Owner: Economy / Progression Team
- Status: open
- Automation OK: yes
- Goal: Add a deterministic balance test or script that simulates roughly eight hours of active play progression.
- Acceptance: the player cannot go bankrupt from normal operation and has meaningful upgrade choices across the run.
- Verify: `npm.cmd run test` or a dedicated balance script.

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
- Status: open
- Automation OK: yes
- Goal: Create a launch checklist for itch.io and app-store readiness, including screenshots, privacy notes, ad disclosure, build commands, and known test devices.
- Acceptance: checklist exists in `docs/` and references current commands.
- Verify: documentation review plus build.

## Current Product Risks

- The visual reward audit proves upgrade props exist, but it does not judge whether the scene looks production-ready.
- Automated tests cover core logic, but browser/mobile playability still needs screenshot and interaction checks.
- The cron can help steadily, but it must work from small queue tasks and leave a clear run log.
