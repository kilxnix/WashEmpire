# Wash Empire Web

Browser-native vertical slice for Wash Empire. This version keeps the Unity prototype intact and rebuilds the core loop as a web game:

- React DOM HUD for cash, time controls, upgrades, save export, and save upload.
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
- Local autosave plus JSON import/export for demos.

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
11. Export and import JSON saves from the top-right HUD controls.

## Ad Hook

The browser demo uses `window.WashEmpireAds.showRewardedAd()` when a host provides it. Without a host SDK,
the app uses a short local fallback so the ad reward loop remains testable.
