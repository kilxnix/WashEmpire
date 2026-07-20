# Wash Empire Web

Browser-native vertical slice for Wash Empire. This version keeps the Unity prototype intact and rebuilds the core loop as a web game:

- React DOM HUD for cash, time controls, upgrades, city map, graphics, and ad boosts.
- React Three Fiber scene for the self-serve bay, pay box, office, cars, and upgrade visuals.
- Idle-style simulation state kept outside the renderer.
- District-specific washes with two or three active bays, plus future-bay pads where a smaller location can grow.
- Active bays are individually upgradable with six equipment tracks per bay.
- Floating city districts with drive-by traffic, queue pressure, and missed-customer tracking.
- Connected floating city-board world with roads, parcels, parks, ponds, and district wash sites.
- City map progression for buying and restoring run-down car washes in new districts.
- First-run location naming and persistent location branding.
- Hireable employees with weekly wages and automatic weekly cash pickup.
- Rewarded-ad hook with a local fallback for demo builds.
- PWA manifest and mobile web-app metadata for phone testing.
- Title menu with saved-game continue and new-location naming.
- Local autosave in browser storage.

## Run

```powershell
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://127.0.0.1:5173/`.

## Build

```powershell
npm run build
npm run lint
```

Use Node `22.12+`. Node 21 is not supported by the current Vite/Rolldown toolchain, and the Android AdMob wrapper uses Capacitor packages that require Node 22+.

## Itch.io Upload

```powershell
npm install
npm run build
if (Test-Path wash-empire-itch.zip) { Remove-Item wash-empire-itch.zip -Force }
Get-ChildItem dist | Where-Object { $_.Name -ne 'prototype-assets' } | Compress-Archive -DestinationPath wash-empire-itch.zip -Force
```

Upload `wash-empire-itch.zip` as an HTML game. The Vite build uses relative asset paths, so `index.html`, `assets/`, `favicon.svg`, and `manifest.webmanifest` can live at the zip root. Exclude the `prototype-assets` placeholder folder from the zip.

Use `docs/first-player-guide.md` as the first-player guide or itch page instructions.

## Demo Loop

1. Cars enter the self-serve bays and customers spend time washing.
2. Cash, coins, and tokens accumulate across all bay pay boxes.
3. Click the HUD collect button or office safe to collect all physical profit at once.
4. Upgrade each bay's selector, wand, foam, rinse, dryer, and vault tiers.
5. Hire employees to auto-collect weekly cash while keeping manual collect available anytime.
6. Buy lot expansion upgrades for demand, automation, security, ads, and the late-game laser wash.
7. Open the city map to buy a run-down district wash, restore it, and move into higher-traffic areas.
8. Watch traffic pressure: if the bays are full, less-interested cars keep driving, while stronger districts and upgrades create a queue.
9. Use the rewarded-ad button to bank offline earning boost time.
10. At week end, time pauses until profits are collected or staff has auto-collected them.
11. Close the tab and return later; the local autosave and offline return panel bring the run forward.

## Ad Hook

The reward button calls `showRewardedAd()` before granting the boost. Resolution order:

1. `window.WashEmpireAds.showRewardedAd()` when a custom host injects a provider.
2. `@capacitor-community/admob` when running in the Android Capacitor APK.
3. **Browser:** Google IMA HTML5 SDK + VAST/Ad Manager tag (real video ad).
4. Local "Driver Campaign" modal only on `localhost` / when `VITE_ADS_FORCE_LOCAL=true` / when `VITE_ADS_ALLOW_LOCAL_FALLBACK=true`.

### Browser IMA (default path)

Copy `.env.example` to `.env` (or set CI env vars) and configure:

```text
VITE_IMA_AD_TAG_URL=https://your-ad-manager-vast-or-tag-url
VITE_IMA_USE_SAMPLE_TAG=false
```

If `VITE_IMA_AD_TAG_URL` is empty, the game uses Google's public sample linear VAST tag so you can verify the player without your own inventory. Boost is granted only when the IMA creative **completes** (skip/close/error = no boost).

### Android AdMob

```text
Android app id: ca-app-pub-0396642445880935~1557835307
Rewarded ad unit: ca-app-pub-0396642445880935/6253769968
```

Override with `VITE_ADMOB_*` env vars if needed. The Android wrapper lives in `android/` after:

```powershell
npm run android:sync
npm run android:apk
```

Android builds require JDK 21 and Android SDK platform/build-tools 36. The native manifest includes `com.google.android.gms.ads.APPLICATION_ID`. Boost is granted only when AdMob returns a reward with `amount > 0`.
