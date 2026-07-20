# Wash Empire Browser-First Launch Plan

Updated: 2026-05-25

Goal: make Wash Empire fun in the browser first, host it where people can play instantly, launch as pay-what-you-want, add a real ad-backed boost path, and advertise the playable link before returning to app-store packaging.

## Browser-First Product Bet

The browser version should feel like a playable tycoon toy within the first minute:

- The car wash is the hero object.
- Cars visibly choose the wash, queue, wash, pay, and leave.
- The player always has a next win: collect, upgrade, restore, unlock, advertise, or watch the wash.
- Upgrades visibly change the lot.
- Cities feel different enough to be screenshots, not just stat modifiers.
- The ad boost feels like a business campaign, not a random button.

## Sprint B-001 Momentum Loop

- Status: complete for first browser pass
- Goal: Give players short-term goals while the idle simulation runs.
- Acceptance:
  - [x] Add a visible browser HUD panel with three current goals.
  - [x] Goals link to useful actions: collect, upgrades, map, ad boost.
  - [ ] Add reward claim moments for completed milestone goals.
  - [ ] Add satisfying event copy for weekly closeout and first unlocks.
  - [x] Keep the panel hidden or compact on mobile so it does not block the playfield.
- Verify: browser screenshot plus `npm.cmd run audit:launch`.

## Sprint B-002 Fun And Feedback

- Status: open
- Goal: Make actions feel good.
- Acceptance:
  - [ ] Add stronger collection pop/coin-count feedback.
  - [ ] Add first-time upgrade celebration.
  - [ ] Add city unlock/restoration celebration.
  - [ ] Add better ad boost activation feedback.
  - [ ] Add lightweight sound hooks with mute toggle, if audio is wanted.
- Verify: screenshot or short screen recording.

## Sprint B-003 Browser Ad Boost

- Status: open
- Goal: Replace the local fallback ad with a real browser ad provider while keeping the safe fallback for dev.
- Current hook: `window.WashEmpireAds.showRewardedAd()` can be supplied by a host/injected script. If it returns `true`, the game grants the boost.
- Acceptance:
  - [ ] Decide web ad provider: AdSense display ad around the game, Google Ad Manager/IMA rewarded placement, direct sponsor interstitial, or another web ad network.
  - [ ] Keep local fallback for localhost/dev.
  - [ ] Do not grant boost if the ad fails, closes early, or the provider returns no reward.
  - [ ] Add privacy/consent handling before production ads.
  - [ ] Add provider keys through environment variables, not hardcoded secrets.
  - [ ] Add a production smoke check that confirms the web ad hook is present when expected.
- Verify: ad success grants boost; cancel/fail grants nothing.

## Sprint B-004 Hosting

- Status: open
- Goal: Put the browser build somewhere people can play with one link.
- Best first path:
  - [ ] Build static `dist` with `npm.cmd run build`.
  - [ ] Upload to itch.io as an HTML5 browser game with pay-what-you-want pricing.
  - [ ] Also host a direct web version on Cloudflare Pages, Netlify, Vercel, GitHub Pages, or similar.
- Acceptance:
  - [ ] Hosted URL loads on desktop and mobile.
  - [ ] Save works through browser local storage.
  - [ ] Offline/return works on hosted URL.
  - [ ] No localhost URLs or dev-only text visible.
  - [ ] Hosted build passes browser smoke screenshots.
- Verify: open hosted URL and run manual checklist.

## Sprint B-007 Browser Launch Hardening

- Status: in progress
- Goal: Make the browser build feel safer to release before the public pay-what-you-want page goes live.
- Acceptance:
  - [x] Add a graphics quality setting.
  - [x] Default to a lower-memory balanced graphics mode.
  - [x] Keep high graphics available for screenshots and strong devices.
  - [x] Let offline earnings accrue for the full time away.
  - [x] Remove player-facing JSON import/export/reset controls from the in-game HUD.
  - [x] Add a production code-splitting pass to reduce the main JS chunk.
  - [x] Add a deterministic one-hour economy playtest for the first-session upgrade loop.
  - [ ] Run a hosted smoke check after upload.
- Verify: `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run audit:launch`.

## Sprint B-005 Landing Page And Advertising

- Status: open
- Goal: Make the game easy to explain and share.
- Acceptance:
  - [ ] One-line pitch: "Build a self-serve car wash empire, collect cash, upgrade bays, and expand across cities."
  - [ ] Create 6-8 screenshots from actual gameplay.
  - [ ] Create a 15-30 second gameplay clip.
  - [x] Create a first-player guide with controls, saves, upgrades, cities, and first-session tips.
  - [ ] Create an itch.io page with clear controls, screenshots, and update notes.
  - [ ] Create simple social posts showing before/after upgrades and city unlocks.
  - [ ] Track clicks/plays in a privacy-safe way.
- Verify: someone can understand the game from the page before pressing Play.

## Sprint B-006 Public Playtest

- Status: open
- Goal: Let people play and use feedback to decide what to build next.
- Acceptance:
  - [ ] Publish a playable browser link.
  - [ ] Add a feedback link/form.
  - [ ] Ask testers to play for 10 minutes and answer: what was fun, what was confusing, what looked unfinished?
  - [ ] Fix crashes, broken saves, bad mobile layout, and obvious visual placeholders before buying ads.
  - [ ] Use feedback to choose the next three gameplay improvements.
- Verify: at least 10 real play sessions or tester responses.

## Advertising Sequence

1. Soft launch link to friends/family and small communities.
2. Improve the first 10 minutes based on feedback.
3. Publish itch.io pay-what-you-want page and direct hosted link.
4. Post short gameplay clips: upgrades, cash collection, city unlock, ride view.
5. Run a small paid test only after the game has a good first-session loop.
6. If retention looks promising, return to Play Store/App Store packaging.

## Official References

- itch.io HTML5 games: https://itch.io/docs/creators/html5
- Google AdSense: https://support.google.com/adsense/
- Google Ad Manager: https://support.google.com/admanager/
- Google IMA SDK for HTML5: https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Netlify deploy overview: https://docs.netlify.com/site-deploys/overview/
- Vercel deployments: https://vercel.com/docs/deployments/overview
