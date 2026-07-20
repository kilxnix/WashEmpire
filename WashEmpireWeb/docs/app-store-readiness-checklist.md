# Wash Empire App Store Readiness Checklist

Updated: 2026-05-24

Goal: ship Wash Empire as a polished paid mobile tycoon game at a low paid price point, with optional rewarded ads, stable memory use, and enough visible progression to justify a public App Store release.

## Current Reality

- Done: web build, launch audit, visual reward audit, mobile smoke screenshots, performance smoke gate.
- Done: start menu, location naming, save/load path, city map, upgrades, paid/idle loop, visible bay/customer washing loop, rewarded ad boost fallback, performance guard.
- Missing: iOS/Apple build path, App Store metadata, privacy policy, ad/privacy disclosures, physical device TestFlight QA, final store screenshots, eight-hour balance proof, final visual polish pass across all districts.
- Important: this repo currently has `@capacitor/android`, but not `@capacitor/ios`. Apple App Store release needs a Mac/Xcode build pipeline or a cloud Mac build service.

## 1. Product Scope Lock

- [ ] Decide the launch title: `Wash Empire`, `Wash Empire Auto Spa`, or another final name.
- [ ] Decide launch platform order: Apple App Store first, Google Play later, or both.
- [ ] Decide whether v1 is paid `$0.99` with rewarded ads, or free with ads. A paid app with ads can be done, but the store page should make the ad boost clear.
- [ ] Lock v1 content promise: self-serve car wash tycoon, multiple cities, upgradeable bays, optional automatic wash location, ride view only in automatic wash.
- [x] Remove dev-facing import/export/reset controls from the in-game HUD so the HUD looks like a real shipped mobile game.

## 2. Gameplay Must Be Finished

- [ ] Eight-hour balance script: simulate roughly eight hours of active play and prove normal operation cannot bankrupt the player.
- [ ] Upgrade pacing: early upgrades should be achievable quickly, mid-game upgrades should require choices, late upgrades should take commitment.
- [ ] Individual bay upgrades: each bay should have its own meaningful upgrade state and visual state.
- [ ] Employee loop: staff should show wage, weekly pickup timing, and manual collect should remain available.
- [ ] Ads/offline gain: rewarded ads must only grant rewards when watched successfully; failed/cancelled ads must grant nothing.
- [ ] City unlocks: small city, snow city, bustling/neon city, and automatic wash area should all be playable and mechanically different.
- [ ] Queue/drive-by behavior: cars should primarily be customers driving to the wash; non-customer traffic must stay secondary and purposeful.
- [ ] Ride view gating: first-person ride view must stay locked unless the current location has an automatic conveyor wash.
- [ ] Weekly review: profit, costs, employee wages, lost sales, auto-collected amount, and pay-box due must be clear.

## 3. Visual Quality Bar

- [ ] Default camera screenshot must instantly read as a car wash, not a generic floating road grid.
- [ ] The car wash must remain the hero object in every city.
- [ ] Roads should read like actual roads: consistent lanes, curbs, driveway cuts, crosswalks where useful, no random debug-like line clutter.
- [ ] Buildings should read as deliberate local businesses, not repeated cubes.
- [ ] Each city needs a distinct palette and landmark language:
  - [ ] Small city: local storefronts, civic/clock/old-town details.
  - [ ] Snow city: snow banks, lodge cues, plow/service props.
  - [ ] Bustling/neon city: denser buildings, lights, busier roads, downtown signage.
  - [ ] Harbor/extra city if shipped: docks, water, pier/market cues.
  - [ ] Automatic wash district: conveyor infrastructure and industrial/service-road identity.
- [ ] Every purchased upgrade should visibly improve the lot:
  - [ ] Vacuum island adds actual vacuums, hoses, posts, pad markings, signage.
  - [ ] Security adds gate/camera/light changes.
  - [ ] Manager/staff adds visible staff/office improvements.
  - [ ] Ads/marketing adds visible signage or promotional props.
  - [ ] Bay upgrades add physical hardware in each bay.
- [ ] Occupied self-serve bays should always show a person, wand/brush, spray/foam/rinse state, and progress.
- [ ] Capture final screenshots for every district and compare side-by-side before store submission.

## 4. Technical Release Gates

- [ ] `npm.cmd run audit:launch` passes.
- [ ] `npm.cmd run audit:perf` passes with no steady-state WebGL geometry/texture growth.
- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] Fix or formally accept the current Vite large chunk warning. Prefer code splitting before App Store.
- [ ] Test save migration from an older save.
- [ ] Test offline return/reward math.
- [ ] Test no-network behavior.
- [ ] Test low-memory/background/resume behavior.
- [ ] Test portrait and landscape decisions. If only one orientation is supported, enforce it.
- [ ] Verify mobile safe areas: notches, home indicator, small phones, large phones.
- [ ] Confirm no localhost/dev URLs, debug logs, or dev-only panels ship in production.

## 5. Apple/iOS Build Work

- [ ] Add iOS platform support: install `@capacitor/ios`, run Capacitor iOS add/sync, and commit generated iOS project files intentionally.
- [ ] Build on a Mac with current Xcode.
- [ ] Configure bundle ID, app display name, version, build number, signing team, capabilities, and deployment target.
- [ ] Add app icons and launch screen/splash assets.
- [ ] Configure AdMob/iOS SDK settings if rewarded ads ship.
- [ ] Add required iOS privacy strings, including tracking permission text if IDFA/tracking is used.
- [ ] Archive a release build in Xcode.
- [ ] Upload the build to App Store Connect through Xcode or Transporter.

## 6. App Store Connect Setup

- [ ] Apple Developer Program membership active.
- [ ] Paid Apps Agreement accepted, plus tax and banking completed, before selling for `$0.99`.
- [ ] App record created with bundle ID and SKU.
- [ ] App category chosen, likely `Games` with an appropriate subcategory.
- [ ] Price set to the desired paid price point in Pricing and Availability.
- [ ] Availability countries/regions selected.
- [ ] Age rating questionnaire completed, including advertising disclosure.
- [ ] Privacy policy URL added.
- [ ] App privacy details completed, including data collected by the app and any ad/analytics SDKs.
- [ ] App Review contact information completed.
- [ ] Review notes explain rewarded ads, offline gain, restore/reset, and any demo/test path needed.

## 7. Store Page Assets

- [ ] App name, subtitle, promotional text, keywords, and description written.
- [ ] Description clearly explains the game loop: build, upgrade, collect, hire, expand cities, unlock automatic wash.
- [ ] Support URL live.
- [ ] Marketing URL optional but useful.
- [ ] Privacy policy URL live.
- [ ] Final screenshots: Apple allows one to ten screenshots per supported device class.
- [ ] Screenshots should show:
  - [ ] Start/menu with named location.
  - [ ] Small city starter wash.
  - [ ] Upgraded multi-bay wash.
  - [ ] Upgrade drawer with visible rewards.
  - [ ] City map/unlock screen.
  - [ ] Snow city.
  - [ ] Bustling/neon city.
  - [ ] Automatic wash/ride view, if included in v1.
- [ ] Optional app preview video: only if it looks polished and performs smoothly.

## 8. Privacy, Ads, And Legal

- [ ] Privacy policy describes local saves, ads, analytics, crash reporting, and any third-party SDK data use.
- [ ] If using AdMob or any ad SDK, confirm SDK privacy manifest/signature requirements and disclose third-party collection accurately.
- [ ] If tracking/IDFA is used, implement AppTrackingTransparency and explain why in the prompt.
- [ ] If no tracking is used, configure ads accordingly and make sure no SDK behavior contradicts the privacy label.
- [ ] Confirm the app does not include real-money gambling or misleading cash-out mechanics. In-game car wash money must be obviously fictional.
- [ ] Add terms/support email if needed.
- [ ] Check EU trader/DSA requirements in App Store Connect if selling in the EU.

## 9. TestFlight / Family And Friends Sprint

- [ ] Upload first iOS build to App Store Connect.
- [ ] Fill TestFlight beta app description, feedback email, and features to test.
- [ ] Internal TestFlight pass on at least:
  - [ ] one small iPhone,
  - [ ] one large iPhone,
  - [ ] one iPad if iPad is supported.
- [ ] External family/friends TestFlight group.
- [ ] Tester script:
  - [ ] play 20 minutes,
  - [ ] buy three upgrades,
  - [ ] collect cash,
  - [ ] watch one ad boost,
  - [ ] unlock/check map,
  - [ ] close app and return,
  - [ ] report confusion or ugly spots.
- [ ] Fix every crash, softlock, broken save, unreadable UI, or obvious visual placeholder before submission.

## 10. Final Submission Gate

- [ ] Current branch clean except intentional release files.
- [ ] `npm.cmd run audit:launch` passes on release candidate.
- [ ] iOS archive uploaded and selected for the app version.
- [ ] TestFlight feedback reviewed and resolved.
- [ ] App Store metadata complete.
- [ ] Screenshots match actual gameplay.
- [ ] Review notes specific and honest.
- [ ] Release option chosen: manual release is safest for first launch.
- [ ] Submit for App Review.

## Official Apple References

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect workflow: https://developer.apple.com/app-store-connect/
- Upload builds: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/
- TestFlight overview: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
- Set a price: https://developer.apple.com/help/app-store-connect/manage-app-pricing/set-a-price/
- App information and privacy policy URL: https://developer.apple.com/help/app-store-connect/reference/app-information/
- Manage app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- User privacy and AppTrackingTransparency: https://developer.apple.com/app-store/user-privacy-and-data-use/
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/
- Submit an app: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/
