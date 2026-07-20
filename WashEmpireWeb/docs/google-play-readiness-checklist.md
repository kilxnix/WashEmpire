# Wash Empire Google Play Readiness Checklist

Updated: 2026-05-24

Goal: ship Wash Empire on Google Play as a polished mobile tycoon game with stable performance, clear ad/privacy disclosures, a production Android App Bundle, and enough gameplay/content polish to survive real tester feedback.

## Current Reality

- Done: web build, Android Capacitor dependency, launch audit, mobile browser smoke screenshots, visual reward audit, performance smoke gate.
- Done: current package scripts include `android:sync`, `android:open`, and `android:apk`.
- Missing: Google Play-ready Android App Bundle script/build, Play Console app record, Data safety form, privacy policy, store listing assets, real device QA, closed/internal testing track, final production signing/release setup.
- Important: Google Play production upload should use an Android App Bundle (`.aab`), not just the current debug APK path.

## 1. Product And Monetization Lock

- [ ] Final launch name chosen.
- [ ] Final package/application ID chosen and frozen.
- [ ] Decide paid app, free app, or free with rewarded ads.
- [ ] Decide whether rewarded ads ship in v1 or stay behind a demo/offline fallback until ad approval.
- [ ] Confirm in-game money is clearly fictional and not cash-out/gambling-adjacent.
- [x] Remove dev import/export/reset controls from the in-game HUD before store screenshots.

## 2. Android Build Requirements

- [ ] Add a production Android App Bundle command, likely `android:aab`.
- [ ] Confirm `npm.cmd run android:sync` works from a clean build.
- [ ] Confirm Gradle can build a release `.aab`.
- [ ] Configure app ID/package name.
- [ ] Configure app version code and version name.
- [ ] Configure app signing and Play App Signing.
- [ ] Add adaptive icon, launcher icon, and splash/launch assets.
- [ ] Confirm app does not require permissions it does not use.
- [ ] Confirm orientation support is intentional and enforced.
- [ ] Test install on real Android device.
- [ ] Test cold launch, background/resume, no network, low battery/low memory, and offline return.

## 3. Google Play Console Setup

- [ ] Google Play Developer account active.
- [ ] App created in Play Console.
- [ ] App name, default language, app/game type, free/paid choice, and declarations completed.
- [ ] App category selected.
- [ ] Contact email added.
- [ ] Privacy policy URL added.
- [ ] Developer page/details reviewed.
- [ ] Countries/regions selected.
- [ ] Pricing completed if paid.
- [ ] Managed publishing decision made before first release.

## 4. Store Listing Assets

- [ ] Short description written.
- [ ] Full description written.
- [ ] App icon uploaded.
- [ ] Feature graphic created.
- [ ] Phone screenshots captured from real or representative Android viewport.
- [ ] Tablet screenshots captured if tablet support is enabled.
- [ ] Optional promo video created only if it looks smooth and polished.
- [ ] Screenshots should show:
  - [ ] Named location/start screen.
  - [ ] Starter self-serve wash.
  - [ ] Upgraded multi-bay wash.
  - [ ] People washing cars in bays.
  - [ ] Upgrade drawer.
  - [ ] City map/unlocks.
  - [ ] Snow city.
  - [ ] Bustling/neon city.
  - [ ] Automatic wash/ride view if included in v1.

## 5. App Content And Policy Declarations

- [ ] Data safety form completed accurately.
- [ ] Privacy policy matches the Data safety form.
- [ ] Ads declaration completed if rewarded ads ship.
- [ ] Content rating questionnaire completed.
- [ ] Target audience and content declarations completed.
- [ ] Families policy reviewed if the app is directed to children or likely to appeal to children.
- [ ] Financial features/gambling declarations reviewed; Wash Empire should not imply real money payouts.
- [ ] Sensitive permissions declaration avoided unless absolutely necessary.
- [ ] Third-party SDK list reviewed, especially AdMob.
- [ ] App access instructions added if review needs a way past onboarding or a test save.

## 6. Ads And Offline Gain Compliance

- [ ] Ad reward is granted only after a completed rewarded ad.
- [ ] Cancelled/failed ad grants no reward.
- [ ] Offline/idle gain can work without ads.
- [ ] Ad boost duration and reward are explained in UI.
- [ ] AdMob app/ad unit IDs configured per platform.
- [ ] Test ads used in development builds.
- [ ] Production ads only enabled in signed release builds after approval.
- [ ] Privacy/ad SDK disclosures match actual data collection.

## 7. Gameplay And Visual QA Before Testing

- [ ] `npm.cmd run audit:launch` passes.
- [ ] `npm.cmd run audit:perf` passes.
- [ ] Eight-hour balance test exists and passes.
- [ ] Save/load and offline return tested on Android.
- [ ] No bankrupt-by-default cash flow.
- [ ] Cars drive toward the wash purposefully; non-customer traffic stays secondary.
- [ ] Every city feels distinct and less cluttered than the old placeholder map.
- [ ] Every purchased upgrade has a visible in-scene reward.
- [ ] Self-serve bays show people washing, tools, spray/foam/rinse state, and progress.
- [ ] Automatic wash/ride view only appears where the automatic wash exists.
- [ ] HUD readable on small Android phones.

## 8. Testing Tracks

- [ ] Internal testing track set up for fast installs.
- [ ] Closed testing track set up before production.
- [ ] If using a new personal developer account, plan around Google Play's tester requirement before production access.
- [ ] Tester instructions written:
  - [ ] play 20 minutes,
  - [ ] buy upgrades,
  - [ ] collect pay box,
  - [ ] watch an ad boost,
  - [ ] unlock/check map,
  - [ ] close app and return,
  - [ ] report ugly/confusing spots.
- [ ] Crash/ANR monitoring reviewed after testing.
- [ ] Fix every crash, softlock, broken save, or unreadable UI before production.

## 9. Production Release

- [ ] Release `.aab` uploaded.
- [ ] Release notes written.
- [ ] App bundle selected for production release.
- [ ] Store listing complete.
- [ ] App content declarations complete.
- [ ] Privacy policy live.
- [ ] Pricing/countries complete.
- [ ] Managed publishing or staged rollout selected.
- [ ] Final Play Console warnings/errors resolved.
- [ ] Submit for review.
- [ ] After approval, release gradually and watch vitals/crashes/reviews.

## 10. Official Google References

- Create and set up an app: https://support.google.com/googleplay/android-developer/answer/9859152
- Prepare and roll out a release: https://support.google.com/googleplay/android-developer/answer/9859348
- Android App Bundles: https://developer.android.com/guide/app-bundle
- Play App Signing: https://support.google.com/googleplay/android-developer/answer/9842756
- Target API level requirements: https://support.google.com/googleplay/android-developer/answer/11926878
- Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Privacy policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Store listing assets: https://support.google.com/googleplay/android-developer/answer/9866151
- App content: https://support.google.com/googleplay/android-developer/answer/9859455
- Test your app: https://support.google.com/googleplay/android-developer/answer/9845334
