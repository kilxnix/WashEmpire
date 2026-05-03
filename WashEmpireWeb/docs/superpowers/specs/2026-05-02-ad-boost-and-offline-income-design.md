# Ad Boost Stocking & Offline Income — Design

**Date:** 2026-05-02
**Status:** Approved
**Scope:** Browser web app (`WashEmpireWeb`). Quality control is a separate, later sub-project.

## Goal

Make the existing rewarded-ad system meaningful by:
1. Letting players "stock" ads — up to 5 watched in any rolling 24-hour window — that contribute to a single boost timer (max 12 h of stack).
2. Adding always-on offline cash income, capped without boost, uncapped while boost is active.
3. Making the boost a flat **3× cash multiplier** that applies to *all* income, online and offline.

The result: ads buy real-world time, real-world time pays in cash, and a player who closes the tab actually has something to come back to.

## Decisions Locked In

| # | Decision |
|---|---|
| 1 | 5 ad slots, refilling on a trickle: +1 every 4.8 h, capped at 5. |
| 2 | Each watched ad → +2.4 h of boost time. Boost stack capped at 12 h real-time. |
| 3 | Boost is a **3× cash multiplier**, applied at payment settlement (online) and to offline trickle (offline). |
| 4 | Offline income is always on. Baseline = 50% of computed `expectedHourlyRevenue`. Capped at 8 h of unboosted accrual per offline session. Boost removes the cap for as long as it's active. |
| 5 | While offline, the **week clock does not advance**, bay condition does **not** decay, no cars are simulated. Offline is a stipend pause, not a fast-forward. |
| 6 | Offline rate is *computed from setup* (closed-form) using existing simulation primitives — no rolling-stat tracking required. |
| 7 | Hard reconciliation ceiling: 24 h. Negative elapsed time clamps to 0. Single-player, browser-local; no server-side anti-cheat. |
| 8 | The instant cash drop from the current `claimRewardedAd` is **removed**. The boost *is* the reward. |

## Data Model

### `AdState` (replaces current shape)

```ts
interface AdState {
  slotsAvailable: number      // 0–5, integer
  nextSlotInSeconds: number   // 0–17280 (4.8 h); paused once slotsAvailable === 5
  boostSeconds: number        // 0–43200 (12 h cap)
  totalWatched: number        // lifetime stat, kept
  totalRewardedCash: number   // lifetime stat, repurposed: sum of boost-attributed cash
}
```

Removed: `rewardCooldownSeconds`, `lastReward`.

### New fields on `GameState`

```ts
interface GameState {
  // ...existing fields
  lastTickAt: number                              // Date.now() ms, written every tick
  pendingOfflineSummary: OfflineSummary | null    // populated by reconciliation, consumed by panel
}

interface OfflineSummary {
  elapsedSeconds: number
  boostedSeconds: number
  unboostedSeconds: number
  cashEarned: number
  slotsRefilled: number
}
```

### Save migration

`hydrateGameState` maps old saves:
- Old `AdState.rewardCooldownSeconds` → discarded.
- Old `AdState.lastReward` → discarded.
- Old `AdState.boostSeconds` → preserved (already in seconds), clamped to ≤ 43 200.
- Missing `slotsAvailable` → defaults to 5 (give returning players the full slate).
- Missing `nextSlotInSeconds` → defaults to 17 280.
- Missing `lastTickAt` → defaults to `Date.now()` (no offline reconciliation on first load after migration).
- Missing `pendingOfflineSummary` → `null`.

## Constants

All live as named exports / module constants in `simulation.ts`:

```ts
const AD_BOOST_PER_WATCH_SECONDS = 8_640        // 2.4 h
const AD_BOOST_MAX_STACK_SECONDS = 43_200       // 12 h
const AD_BOOST_MULTIPLIER = 3
const AD_SLOTS_MAX = 5
const AD_SLOT_REFILL_SECONDS = 17_280           // 4.8 h
const OFFLINE_BASELINE_RATE_FRACTION = 0.5
const OFFLINE_UNBOOSTED_CAP_SECONDS = 28_800    // 8 h
const OFFLINE_HARD_CAP_SECONDS = 86_400         // 24 h
const OFFLINE_MIN_RECONCILE_SECONDS = 60        // ignore short tab-switches
```

## Simulation Changes (`src/game/simulation.ts`)

### `watchAdForBoost(state)` — replaces `claimRewardedAd`

```
if (state.ads.slotsAvailable <= 0) return state
ads.slotsAvailable -= 1
ads.boostSeconds = min(43_200, ads.boostSeconds + 8_640)
ads.totalWatched += 1
// no instant cash drop
```

### `cashMultiplier(state) → number`

```
return state.ads.boostSeconds > 0 ? 3 : 1
```

Applied inside `settlePayment` to **every** payment component (bills, coins, tokens, card net):
- Card path: `net = gross * (1 - CARD_FEE_RATE) * mult`; `state.cash += net`.
- Cash/coin/token path: each component scaled by `mult` before being added to `bay.cashBox` and `state.weekRevenue` / `state.lifetimeRevenue`.

`totalRewardedCash` accrues the *delta* introduced by the multiplier — i.e. `(mult - 1) × baseGross` — so the lifetime stat reflects "cash you got because of boost." When boost is off, no contribution.

### `expectedHourlyRevenue(state) → number`

```
spawn       = 1 / spawnInterval(state)              // cars / sec
avgPrice    = mean(bayWashPrice(...) over active bays) + marketPriceBonus(state)
serveShare  = clamp(1 - driveByMissShare(state), 0.4, 1)   // ≈ 1 minus expected loss
return spawn * avgPrice * 3600 * CUSTOMERS_PER_VISIBLE_CAR * serveShare
```

`driveByMissShare` is a coarse estimate using `queueAppealChance` as a proxy — implementation can iterate. Goal: a deterministic estimate of online $/h that doesn't require an actual simulation pass.

### `advanceAds(ads, realDeltaSeconds) → AdState`

```
boostSeconds -= realDeltaSeconds  (floored at 0)
if (slotsAvailable < 5) {
  nextSlotInSeconds -= realDeltaSeconds
  while (nextSlotInSeconds <= 0 && slotsAvailable < 5) {
    slotsAvailable += 1
    nextSlotInSeconds += 17_280
  }
  if (slotsAvailable === 5) nextSlotInSeconds = 17_280   // hold
}
```

Note: `while`-loop handles the offline case where `realDeltaSeconds` could be > 4.8 h.

### `reconcileOffline(state, nowMs) → state`

Run once on app load (and only on app load):

```
elapsed = (nowMs - state.lastTickAt) / 1000
if (elapsed < 60) {
  state.lastTickAt = nowMs
  return state
}
elapsed = clamp(elapsed, 0, 86_400)

// 1. Snapshot pre-tick state we need for accrual math.
boostBefore   = state.ads.boostSeconds
slotsBefore   = state.ads.slotsAvailable

// 2. Tick ads forward (burns boost, refills slots).
state.ads = advanceAds(state.ads, elapsed)

// 3. Accrue cash: boost is consumed first.
boostedT   = min(elapsed, boostBefore)
unboostedT = min(elapsed - boostedT, 28_800)

ratePerSec = expectedHourlyRevenue(state) * 0.5 / 3600
cashEarned = ratePerSec * (boostedT * 3 + unboostedT)
state.cash += cashEarned

// 4. Build the welcome-back report.
state.pendingOfflineSummary = {
  elapsedSeconds:   elapsed,
  boostedSeconds:   boostedT,
  unboostedSeconds: unboostedT,
  cashEarned,
  slotsRefilled:    state.ads.slotsAvailable - slotsBefore,
}
state.lastTickAt = nowMs
```

**Why the snapshot:** `advanceAds` mutates both `boostSeconds` and `slotsAvailable` in one pass. We need the *pre-tick* boost value to compute fair accrual (you should be paid the 3× rate for as much time as you actually had boost banked when you left), and the *pre-tick* slot count to report how many slots refilled. Doing the snapshot before the call keeps `advanceAds` as the single source of truth for both burns.

### `advanceGame(state, realDeltaSeconds)` — small change

After the existing body, set `state.lastTickAt = Date.now()`. (Tick this every frame; the autosave loop already persists every 1.5 s.)

### Game-clock and bays during offline — explicitly **not** modified

- `clockSeconds` does **not** advance during `reconcileOffline`.
- `bays[].condition` does **not** decay.
- `cars[]` is left untouched.
- No week rollover can happen offline. The first online tick after reopen resumes normal advancement.

## App Glue (`src/App.tsx`)

1. **Load path.** `loadSavedGame()` already returns hydrated state. Wrap with `reconcileOffline(state, Date.now())` before passing to `useState`.
2. **Visibility / unload save.** Add `visibilitychange` and `beforeunload` listeners that flush an immediate save (the existing `exportGameState` writer), so `lastTickAt` lands as close to "tab gone" as possible.
3. **`handleClaimAd`.** Becomes `handleWatchAd`: calls `setGame(state => watchAdForBoost(state))` after the ad shim resolves. The `adLoading` and `showRewardedAd` plumbing is unchanged.
4. **Welcome-back panel.** When `game.pendingOfflineSummary !== null`, render `<OfflineReturnPanel summary={...} onDismiss={...} />`. Dismiss handler clears the field via `setGame(state => ({ ...state, pendingOfflineSummary: null }))`.

## UI (`src/components/Hud.tsx` + new component)

### Ad button (replace existing cooldown button)

Three lines, ~120 px wide, in the same HUD slot:

```
┌──────────────────────────┐
│  ▶ Watch Ad   ( 3 / 5 )  │
│  Boost: 7h 12m           │
│  Next slot in 2h 14m     │
└──────────────────────────┘
```

State table:

| Slots | Boost active | Disabled? | Boost line | Refill line |
|---|---|---|---|---|
| > 0 | no  | no  | hidden | shown |
| > 0 | yes | no  | shown  | shown |
| 0   | yes | yes | shown  | shown |
| 0   | no  | yes | hidden | shown |
| 5   | yes | no  | shown  | hidden |
| 5   | no  | no  | hidden | hidden |

Loading state is unchanged (existing spinner pattern).

### 3× chip on cash readout

Existing HUD cash row gets an inline pill `3×` shown only when `boostSeconds > 0`. Visual only — exists so the player *sees* the multiplier on every payment, not just trusts the timer.

### `OfflineReturnPanel.tsx` (new)

Modal-style overlay, dismissible. Renders only when `pendingOfflineSummary != null`. Layout:

```
Welcome back
You were away 9h 41m

+$4 280 earned
   Boosted:    6h 12m  (3× rate)
   Baseline:   3h 29m  (capped at 8h, 8h applied)
   1 ad slot refilled

[ Collect ]
```

`Collect` button calls `onDismiss` — *no economic transaction happens here*. Cash and slots were already credited inside `reconcileOffline`. The panel is a report, not a checkout.

`onDismiss` clears `pendingOfflineSummary` to `null`.

## Files Touched

| File | Change |
|---|---|
| `src/game/types.ts` | Replace `AdState`, add `OfflineSummary`, add `lastTickAt` + `pendingOfflineSummary` to `GameState` |
| `src/game/simulation.ts` | Constants, `watchAdForBoost`, `cashMultiplier`, `expectedHourlyRevenue`, `reconcileOffline`, updated `advanceAds`, updated `settlePayment`, updated `advanceGame` (heartbeat), updated `hydrateGameState` (migration), updated `createInitialState` |
| `src/App.tsx` | Wrap load in `reconcileOffline`, add visibility/unload save, rename `handleClaimAd` → `handleWatchAd`, render `OfflineReturnPanel` |
| `src/components/Hud.tsx` | Replace ad button block, add 3× chip on cash readout |
| `src/components/OfflineReturnPanel.tsx` | **New** |
| `src/services/ads.ts` | No change |

## Out of Scope

- Quality control / testing infrastructure — separate brainstorm.
- Server-side anti-cheat. The 24 h ceiling and 0-floor are the only mitigations; this is a single-player browser game.
- Variable boost amounts per ad (e.g. higher-CPM ads paying more time) — not requested, would over-complicate balance.
- Boost being used for things *other* than cash multiplier (e.g. faster condition repair, demand-only). Decision was explicit: pure cash multiplier.
- Ad-network integration. The `services/ads.ts` shim already exists and stays as-is; the WebView host is responsible for wiring `window.WashEmpireAds`.
