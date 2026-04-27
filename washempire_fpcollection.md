# Wash Empire — First-Person Cash Collection Spec

*Companion document to washempire_verticalslice.md. Defines the cash-collection ritual that replaces the click-coin-meter interaction in Sprint 2 of the vertical slice. Establishes the strategic surface (slippage, card readers, security) that this ritual creates.*

**Status:** v1, awaiting review
**Last updated:** April 26, 2026
**Slice impact:** Sprint 2 reshaped from 1.5w → 5.5w; total slice timeline 9w → ~12w realistic.

---

## 1. Design Philosophy

The slice's stated central satisfaction is the cash-collection moment (vertical slice spec §3.5: *"the physical moment in an otherwise abstract game"*). The original slice design used a click on the coin meter as a placeholder for that physicality. This spec replaces the placeholder with the actual designed moment — a first-person ritual the player walks through end-to-end.

Three principles drive every decision in this design:

1. **The ritual is non-failable.** Stakes come from world state (slippage, theft, vandalism), never from player skill at counting. Failing to count cash correctly is frustrating, not engaging.
2. **The ritual is the surface where invisible mechanics become visible.** Slippage, security upgrades, payment-method choices — none of these can land mechanically without a place where the player *sees* them. The ritual is that place.
3. **Earning the skip is a felt promotion.** Tier 1 (single lot) makes the ritual mandatory. Tier 2+ unlocks the option to skip. The mandatory experience makes the skip feel earned.

---

## 2. Scope, Timing, and the Gate

### 2.1 What this design is

The cash-collection ritual in vertical slice Sprint 2, replacing the original click-coin-meter interaction.

### 2.2 Locked decisions

| Decision | Value |
|---|---|
| Sprint timing | Sprint 2 of vertical slice (replaces the click) |
| Slice schedule impact | 9 weeks → ~12 weeks realistic |
| Mandatory threshold | 1 lot owned (slice = 1 lot, so always mandatory in slice) |
| Skip threshold | 2+ lots owned (Phase 2+; player chooses per week) |
| Ritual shape | Per-bay collection + back-of-house counting/sifting |
| Movement | Click-to-walk via NavMesh + "Next Station" keyboard button |
| Avatar | None — pure first-person, no visible character |
| Security framing | The ritual is the surface where security upgrades manifest mechanically |

### 2.3 Why this is justified mid-build

Slice spec §13.3 explicitly warns that adding scope mid-build kills slices. This design overrides that warning deliberately, in writing, with offsetting cuts:

1. The slice was testing the wrong fun-moment. Validating with a placeholder for the central satisfaction gives unreliable data.
2. Offsetting cuts are made in the same pass: 8 upgrades → 6 (Vacuum, Lighting, Repair Kit deferred). Net schedule cost is +3w realistic, not +5w.
3. The redesign produces a strategic surface (slippage / cards / security) that the original slice could only hint at.
4. The decision is recorded honestly with timeline impact tracked, not drifted into.

If the slice playtest invalidates this design, the spec includes a fallback path (§9.3 cutlines) that reverts to click-collect.

---

## 3. Ritual Flow

### 3.1 Trigger and Exit

**Trigger:** Sunday → Monday transition. The "Collect Cash" task fires in the task panel. Player clicks the task → camera transitions overhead → first-person at lot entrance → ritual begins.

**Exit:** After the office terminal's Continue is clicked → camera transitions back overhead → weekly review screen opens → Monday begins.

### 3.2 Station sequence (slice with 2 bays)

| # | Station | Location | Interaction | Order |
|---|---|---|---|---|
| 1 | Bay #1 coin bin | At each bay, on the lot | Press-and-hold to empty | Sources: any order |
| 2 | Bay #2 coin bin | At each bay, on the lot | Press-and-hold to empty | Sources: any order |
| 3 | Changer bill stacker | Standalone machine on lot edge | Press-and-hold to pull | Sources: any order |
| 4 | Office desk | Inside office | Auto-trigger on entry, locks doors behind | After all sources |
| 5 | Money counter | Inside office | Click to run, animation feeds bills | Either order |
| 6 | Coin sifter | Inside office | Click to run, animation sorts coins | Either order |
| 7 | Office terminal | Inside office | Read summary, click Continue | Final |

### 3.3 Order constraints

- Bays + changer: any order (sources are open-world on the lot).
- Office sequence: counter + sifter in any order, but both must complete before Continue unlocks.
- Cannot skip sources to reach office — office door is gated until all bay bins + changer are empty.
- Once player enters office, doors lock behind them. Prevents forgetting back-office work and wandering back outside.

### 3.4 "Next Station" Button

Persistent right-side HUD button during ritual. Label updates dynamically: `Next: Bay #2 →` / `Next: Changer →` / `Next: Money Counter →`. One click triggers click-to-walk on the NavMesh. Player can also click any visible station object directly. Both inputs route through the same NavMesh agent.

### 3.5 Cash math at slice values

```
weekly_bay_revenue = sum(bay.uses × $5)            // total income
each bay.coin_bin    = bay.uses × $5 × 0.90 × (1 - slippage)
changer.bill_stacker = weekly_bay_revenue × 0.10 × (1 - slippage)
```

Where `slippage = 0.03` for slice (Tier 1 baseline). 90% direct-coin / 10% changer split is a placeholder pending playtest.

For card-reader bays:
```
GameManager.DepositedCash += bay.uses × $5 × 0.97   // 3% processing fee
bay.coin_bin = 0   // no FP collection for this bay
```

### 3.6 Failure modes and abandon handling

- Mid-ritual save = ritual state persists. On reload, FP camera resumes at the last completed station's exit.
- No "skip ritual" escape in slice (1 lot = mandatory).
- Esc opens pause menu, ritual time freezes, no exit option.
- Ritual is non-failable. Every interaction succeeds. Stakes come from external state (§5).

---

## 4. Per-Station UX

### 4.1 Coin bin (per bay)

- **Camera:** locked first-person, framed on bin door and lock.
- **Interaction:** hold left-mouse → bin door opens → contents pour into tray.
- **Duration:** ~3 seconds at hold. Releasing early stops the empty (resumable on rehold).
- **Audio:** lock click → metallic creak → coin clatter loop → tail.
- **Visual feedback:** tray HUD shows running count ticking up. Bin visibly empties.

### 4.2 Changer bill stacker

- **Camera:** locked first-person on changer's lower bill compartment.
- **Interaction:** hold left-mouse → key turn → drawer slides → bills auto-transfer.
- **Duration:** ~3 seconds.
- **Audio:** key turn → drawer slide → paper rustle.
- **Visual feedback:** tray HUD now shows separate `Coins/Tokens` and `Bills` rows.

### 4.3 Office desk (auto-trigger)

- **Camera:** smooth transition from FP exterior → FP interior office on entry.
- **Interaction:** none — automatic on door entry.
- **Duration:** ~1.5 seconds.
- **Audio:** door open → footsteps on different floor texture → tray clatter on desk.
- **State change:** office doors lock; "Next Station" updates to office stations.

### 4.4 Money counter

- **Camera:** locked first-person on counter slot.
- **Interaction:** click to feed → automated animation.
- **Duration:** ~4–6 seconds (longer = more bills = satisfying weekly delta cue).
- **Audio:** classic bill-counter `brrrrrt` ramping in pitch, soft beep at end.
- **Visual feedback:** counter LED ticks up. Tray's `Bills` row drains to $0.

### 4.5 Coin sifter

- **Camera:** locked first-person on sifter top.
- **Interaction:** click to dump → automated animation through denomination chutes.
- **Duration:** ~5–8 seconds.
- **Audio:** mass coin pour → mechanical clinking through chutes → settling.
- **Visual feedback:** sifter denomination columns fill. Total ticks up. Tray `Coins/Tokens` drains.

### 4.6 Office terminal — total display

- **Camera:** locked first-person on a CRT-style terminal screen.
- **Aesthetic:** lo-fi receipt per art bible §13.
- **Layout (printed-receipt style):**

  ```
  ─── WEEK 4 DEPOSIT ───
  Bills (counter):       $87
  Coins (sifter):       $700
                       ─────
  TOTAL DEPOSITED:      $787

  Theoretical revenue:  $875
  Token slippage:       -$88   ← cameras would help
  ───────────────────────────
                  [ Continue ]
  ```
- **Interaction:** read → click Continue → exit FP → weekly review.
- **Slippage UX:** `cameras would help` hint shown when slippage > 0 AND no cameras owned (slice = always). With cameras owned, hint replaced by `Slippage: -$22 (cameras: ↓5%)`.
- **Card revenue line:** when ≥1 card reader installed: `Card revenue (auto-deposited): $X (-3% fee)`.

### 4.7 Tray HUD (persistent during FP)

Bottom-left fixed overlay:

```
┌── Tray ──┐
│ Bills:    $87
│ Coins:   $700
│ Tokens:  $0    (slice doesn't track separately)
└──────────┘
```

Updates live as stations complete. Disappears when player exits FP at Continue.

### 4.8 Total ritual time target (slice, 2 bays, no upgrades)

| Step | Time |
|---|---|
| Walk to Bay #1 | ~5s |
| Empty Bay #1 bin | ~3s |
| Walk to Bay #2 | ~4s |
| Empty Bay #2 bin | ~3s |
| Walk to Changer | ~5s |
| Empty Changer | ~3s |
| Walk to Office | ~6s |
| Office entry transition | ~2s |
| Run Money Counter | ~5s |
| Run Coin Sifter | ~6s |
| Read Total + Continue | ~3s |
| **Total** | **~45 sec** |

Target: ≤1 minute. Tunable via walk speed and animation lengths.

---

## 5. Cash-Flow Rules: Slippage, Cards, and the Strategic Loop

### 5.1 Token slippage

% of cash-paid revenue lost between bay and bin. Tokens leave the lot in pockets, get lost on the ground, kept as souvenirs.

| Tier | Baseline slippage |
|---|---|
| 1 (slice) | **3%** |
| 2 | 5% |
| 3 | 8% |
| 4 | 10% |
| 5 | 12% |

Escalating curve matches the empire-scale "leakage gets sticky" reality and aligns content lib §2.4 BACK_SEC tier gating (security becomes more important as slippage grows).

**Slice example:** Tier 1 lot, ~$700 cash-paid revenue → $21/week leaked. Spec §8 worked example profit $34 → $13 with slippage. Real but not catastrophic.

### 5.2 Security upgrades (referenced for design coherence, not slice-implemented)

| Upgrade | Cost | Slippage effect | Tier unlock |
|---|---|---|---|
| BACK_SEC_01 — Security Cameras | $2,500 | -50% relative | 2 |
| BACK_SEC_02 — Premium Security System | $7,500 | -75% relative | 3 |

**Slice implication:** cameras are NOT in slice. Slice player experiences slippage as a felt cost they can't fix. Terminal `cameras would help` hint sets up Phase 2 demand. Slice playtest §11.3 question *"what did you want to do that you couldn't?"* should produce "buy security cameras" if the design lands.

### 5.3 Card reader (slice-implemented)

Pulled from Tier 2 → Tier 1 for slice.

- **ID:** BAY_PAY_02 — Card Reader
- **Cost:** $2,800 per bay
- **Effect:** that bay's revenue is 100% card-paid. **No coin bin to empty.** Bay is skipped in FP ritual.
- **Processing fee:** 3% deducted at source (bay's reported revenue is already net).
- **Side benefit:** +5% revenue ceiling on that bay (preserves existing content-lib effect).

### 5.4 Why slippage = card fee = 3% for slice

Deliberately equal in slice. The decision becomes purely about ritual labor, not arithmetic. Player chooses: walk to that bay each week, or pay the same cost to skip it?

Strategic depth emerges in Phase 2 when:
- Slippage ramps to 5%+ (cards become cheaper than cash)
- Cameras unlock (cash + cameras becomes cheaper than cards)
- Different neighborhoods have different card-adoption rates
- Late game: optimal mix per neighborhood is real strategy

### 5.5 The strategic loop (Phase 2+ preview)

| Stage | Right move | Why |
|---|---|---|
| Early Tier 1 | Eat the 3% slippage, save cash | Card readers too pricey early |
| Late Tier 1 / early Tier 2 | Buy card readers per bay | Skip ritual, escape rising slippage |
| Mid Tier 2 | Buy cameras | Cash + cameras now beats cards on margin |
| Tier 3+ | Mix by neighborhood card adoption | Demographic-tuned payment portfolio |

Recorded in this spec for Phase 2 trajectory. Not slice-implemented.

### 5.6 What surfaces in the slice ritual

| Cue | Where | When |
|---|---|---|
| Card-reader bay greyed-out in "Next Station" | Tray HUD + button | When that bay has card reader installed |
| Bay's coin bin volume looks lighter than expected | Bay station, visually | Always when slippage occurred |
| Office terminal `Theoretical / Slippage / Total` breakdown | Terminal final screen | Every ritual end |
| `cameras would help` hint with delta | Terminal final screen | When slippage > 0 AND no cameras owned |
| Card revenue summary line | Terminal final screen | When ≥1 card reader installed |

---

## 6. Technical Architecture

### 6.1 Existing script changes

| Script | Change |
|---|---|
| `GameManager` | Split `Cash` into `DepositedCash` (spendable) and `PendingCash` (computed sum across bays + changer). Add `Deposit(int)`. Card-reader revenue → `DepositedCash` directly net of fee. |
| `BayController` | New fields: `CashInBin`, `LifetimeRevenue`, `LifetimeSlippage`, `HasCardReader`. `RunWash` no longer calls `GameManager.AddCash` directly — routes payout per §3.5 cash-flow rules. New: `int CollectFromBin()`. |
| `LotController` | Add references to `Changer`, `OfficeDoor`, four office stations. New: `GetActiveCollectionStations()`. |
| `CarController` | No change. |
| `CarSpawner` | No change. |
| `OverheadCameraController` | No change to logic; gets disabled/enabled by `RitualController`. |
| `CashHUD` | Bind to `DepositedCash` instead of `Cash`. |

### 6.2 New components — Cycle / Time

| Component | Responsibility |
|---|---|
| `TimeController` | Singleton. Day/week/time-of-day clock. Speed multiplier (pause/1x/3x/10x). Events: `OnDayChanged`, `OnWeekEnded`. |
| `TimeControlsHUD` | Top-center UI per art bible §13.3. Pause/1x/3x/10x buttons + day/week readout. |

### 6.3 New components — Economy / Tasks

| Component | Responsibility |
|---|---|
| `LotEconomy` | Tracks weekly revenue, variable costs, fixed costs (~$610/week per economy spec §5.1). Settles at week-end. |
| `Changer` | New MonoBehaviour. Holds `BillStacker` ($). Receives 10% of cash-paid revenue. `int CollectFromStacker()`. |
| `Task` | Data class — id, label, completion predicate. |
| `TaskSystem` | Singleton. Generates "Collect Cash" task on `OnWeekEnded`. UI panel top-right, art bible §13.3 clipboard aesthetic. Blocks time advance while incomplete. |
| `WeeklyReviewController` | Modal post-ritual. Revenue / costs / profit / cash deltas per economy spec §8. |

### 6.4 New components — FP Collection Ritual

| Component | Responsibility |
|---|---|
| `RitualController` | Singleton state machine: `Idle → Walking → AtStation → Interacting → AtTerminal → Done`. |
| `PlayerNavAgent` | Invisible NavMeshAgent. Player's "body" during ritual. Spawn on start, destroy on end. |
| `FPCameraController` | Eye-height camera following `PlayerNavAgent`. Auto-rotates to heading. Hands off to station-anchor cameras via Cinemachine blends. |
| `CollectionStation` (abstract) | Base class. Each has `EntrancePoint`, `CameraAnchor`, `IsComplete`, `OnInteract()`. |
| `BayBinStation` | Hold to empty `CashInBin` into `Tray.Coins`. |
| `ChangerStation` | Hold to empty `Changer.BillStacker` into `Tray.Bills`. |
| `OfficeDoorStation` | Auto-trigger on entry. Locks doors behind. Marks "in office" state. |
| `MoneyCounterStation` | Click to run. Drains `Tray.Bills` into counter total. |
| `CoinSifterStation` | Click to run. Drains `Tray.Coins` into sifter total. |
| `OfficeTerminalStation` | Read-only summary. Shows receipt-style breakdown. Continue → ritual end. |
| `Tray` | Runtime data. Three columns: `Bills`, `Coins`, `Tokens` (Tokens = $0 in slice). |
| `TrayHUD` | Persistent overlay during ritual. Bound to `Tray`. |
| `NextStationButton` | Persistent button. Click → walk via `PlayerNavAgent.SetDestination`. |
| `StationInteractionUI` | Generic overlay invoked when at station — hold prompt or click prompt. |

### 6.5 Camera handoff sequence (Cinemachine)

1. **Ritual start:** OverheadCameraController disabled → PlayerNavAgent spawned at entrance → overhead vcam priority drops, FP vcam rises → ~1s blend.
2. **Walking:** `PlayerNavAgent.SetDestination`. FP vcam follows agent, auto-rotates to heading.
3. **At station:** FP vcam priority drops, station-anchor vcam rises → ~0.5s blend. Station-anchor is hand-placed.
4. **After interaction:** Station-anchor priority drops, blends back to FP.
5. **Office entry:** Smooth FP→FP through door portal. Doors lock (collider re-enabled inverted).
6. **Ritual end:** All FP vcams priority drop, overhead rises → 1s blend back. PlayerNavAgent destroyed. `OverheadCameraController` re-enabled. `WeeklyReviewController.Show()`.

### 6.6 Office as same-scene geometry

Office is a small walled-off interior on the same lot, on the same NavMesh. **Not a separate scene.** Door portal triggers camera blend; no scene loading. Phase 2 may revisit when interiors get larger.

### 6.7 Save state (extends Sprint 1)

Save format `v1` → `v2`. Schema:

```json
{
  "version": 2,
  "deposited_cash": 19534,
  "current_day": "Mon",
  "current_week": 5,
  "lots": [{
    "id": "Lot01",
    "bays": [
      {"id": "Bay_01", "cash_in_bin": 311, "has_card_reader": false,
       "lifetime_revenue": 1450, "lifetime_slippage": 44},
      {"id": "Bay_02", "cash_in_bin": 0, "has_card_reader": true,
       "lifetime_revenue": 1820, "lifetime_slippage": 0}
    ],
    "changer": {"bill_stacker": 32}
  }],
  "active_tasks": [{"id": "collect_week_5", "type": "CollectCash"}],
  "ritual_state": null
}
```

`ritual_state` non-null only if save fires mid-ritual. On reload, `RitualController` resumes at last completed station's exit. Migration script promotes v1 → v2 with sane field defaults.

### 6.8 Required package install

**Cinemachine** — needed for camera blends. Install via Unity Package Manager → Unity Registry → Cinemachine. Sprint 2 work can technically begin without it (manual camera switching) but is significantly cleaner with it.

---

## 7. Doc Reconciliations

When this spec is approved, the following changes are made to existing design docs:

| Doc | Section | Change |
|---|---|---|
| `washempire_verticalslice.md` | §3.5 | Replace click-coin-meter description with pointer to this spec |
| | §3.6 | Upgrade tree 8 → 6 (drop Vacuum, Lighting, Repair Kit; add Card Reader) |
| | §3.7 | Add 3% slippage rule on cash-paid revenue |
| | §6 | Phase 2 expanded with FP ritual sub-phases (see §8 below) |
| | §8.1 | Add FP ritual completion to Definition of Done |
| | §10.2 | Add Cinemachine to locked stack |
| | §12 | Revise timeline table (9w → ~12w realistic) |
| `washempire_art.md` | §18.3 | Add FP exception clause |
| | §18 | New sub-section for FP collection mode |
| | §10 | Add office interior to lot anatomy |
| | §13 | Add tray HUD, terminal receipt, station overlays |
| `washempire_economy.md` | §5 | Note slippage as revenue-side leak |
| | §7 | Add Card Reader and Security Camera ROI math |
| | §8 | Update worked example to include 3% slippage |
| | New §3.5 | Token slippage rates per tier table |
| `washempire_progression.md` | §2 Tier 1 | Add "FP cash collection mandatory" |
| | §2 Tier 2 | Add "FP skip unlocks at 2+ lots" as felt promotion |
| | §3 | Add skip-unlock event |
| `washempire_content.md` | §2.2 BAY_PAY_02 | Pull tier unlock 2 → 1; clarify skip-ritual + 3% fee |
| | §2.4 BACK_SEC_01/02 | Clarify slippage-reduction effect |
| | New | Slippage as cash-flow concept |
| `washempire_employees.md` | §2.4 Manager | Note: managers run ritual autonomously at managed lots (Tier 3+) |
| `washempire_roadmap.md` | §4.2 | Sprint Breakdown: Sprint 2 expanded; total Phase 1 9w → ~13w |
| | §10.1 | Acknowledge this spec as deliberate scope reframe with offsetting cuts |

`washempire_rivals.md` and `washempire_winconditions.md` need no changes.

---

## 8. Sprint 2 Sub-Phase Plan

Original Sprint 2 (slice spec §6 Phase 2) was a 1.5-week block. With FP collection added, becomes 5.5 weeks of sub-phased work:

| Sub-phase | Weeks | Focus |
|---|---|---|
| 2A — Time & Costs | 1 | `TimeController`, fast-forward, pause, `LotEconomy` weekly costs, baseline weekly review (placeholder click-collect) |
| 2B — Bay Cash Accumulation | 0.5 | Refactor `BayController` to accumulate `CashInBin`, route 90/10 to bay/changer with 3% slippage |
| 2C — Office & Stations Geometry | 1 | Build office interior, place changer/counter/sifter/terminal stand-ins, NavMesh re-bake |
| 2D — Ritual State Machine | 1.5 | `RitualController`, `PlayerNavAgent`, FP camera with Cinemachine, station base + 6 concrete stations, hand-off |
| 2E — Ritual UX | 1 | Tray HUD, Next Station button, station overlays, terminal receipt screen with slippage breakdown |
| 2F — Card Reader & Polish | 0.5 | Card reader integration, save/load v2, "skip ritual" gate (no-op in slice), bug fixes |
| **Total** | **5.5w realistic** | |

### 8.1 Revised slice timeline

| Phase | Original Realistic | Revised Realistic |
|---|---|---|
| 1 — The Loop | 2w | ✅ done |
| 2 — The Cycle (with FP) | 1.5w | **5.5w** |
| 3 — The Choices (6 upgrades) | 2.5w | 2w |
| 4 — Polish & Test | 2w | 2w |
| 5 — Iterate | 1w | 1w |
| **Total** | **9w** | **~12w** |

Optimistic / Realistic / Pessimistic spread: **8w / 12w / 19w**. Slice spec §12 cutline ("step back if exceeds 14 weeks") is breached by pessimistic case; logged as risk in §9.

### 8.2 New slice upgrade list

| # | Upgrade | Cost | Effect |
|---|---|---|---|
| 1 | Paint Job | $1,500 | Curb appeal +0.10 → demand +10% |
| 2 | New Signage | $2,500 | Curb appeal +0.10 → demand +10% |
| 3 | Better Dials (per bay) | $1,500 | Satisfaction +5%, demand +3% |
| 4 | Soap Upgrade (per bay) | $800 | Equipment condition decay -20% |
| 5 | Add 3rd Bay | $10,000 | +1 bay capacity |
| 6 | **Card Reader (per bay)** | **$2,800** | Auto-deposit, 3% fee, +5% revenue ceiling |

Cut: Vacuum Station, Lighting Upgrade, Equipment Repair Kit. Slice §9.3 sanctions a cut to 5; this list of 6 lands one above.

---

## 9. Open Questions, Risks, and Cutlines

### 9.1 Open questions (deferred to playtest)

| Question | Slice default | Revisit when |
|---|---|---|
| Slippage rate baseline | 3% of cash-paid revenue | Playtest reveals it feels punitive or invisible |
| Card processing fee | 3% (equal to slippage by design) | Phase 2 — diverge by neighborhood card adoption |
| Cash/bills split at bay | 90% bin / 10% changer | Real ritual feel test |
| Total ritual length target | ~45s for 2 bays | Playtest §11.4 boredom signal |
| Hold-to-empty duration | ~3s per station | Same |
| Counter / sifter animation | 5s / 6s | Playtest |
| `cameras would help` hint copy | Fixed text | Phase 2 — context-aware variants |
| First-week ritual onboarding | None — straight in | Phase 4 polish: tutorial overlay first time |
| Pause behaviour during ritual | Esc opens menu, time freezes | If players want a "leave the lot" escape |
| Save mid-ritual | Resume at last completed station's exit | If save corruption observed, fall back to restart |
| First-person walk speed | 2.5 m/s | Playtest comfort |
| Alternate input: WASD in FP | Click-to-walk only for slice | Phase 2 if testers ask |
| Office aesthetic | Lo-fi clipboard + CRT terminal per §4.6 | After interior block-out |

### 9.2 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FP ritual doesn't land in playtest | Medium | Whole pivot was wrong | Ship slice, test it. If 3+/5 hate it, fall back to click-collect. |
| Cinemachine learning curve eats Sub-phase 2D | Medium | 1–2w slip | Half-day spike before 2D begins |
| NavMesh bake breaks with office interior | Medium | Player can't walk lot ↔ office | Test bake immediately when interior blocked out |
| FP camera reveals art as ugly, not charming | High | Slice reads as cheap | Art bible §6 polygon budgets need 1.5–2× bump for hero assets visible up close. Logged as art-bible amendment. |
| Tray HUD confusion | Medium | Slippage reads as noise | First-time tooltip; animate column updates on every interaction |
| Schedule slips past 14w (§12 cutline) | Medium | Mandates audit/redesign | Hard cutline at end of Week 12 of Sprint 2 — see §9.3 |
| Token slippage reads as hidden tax | Medium | Players blame game, not design | Terminal explicitly names it; post-Week-1 nudge |
| Skip option dominates Phase 2 | Low | Ritual was wasted dev | Intended design — mandatory experience IS the felt promotion |
| Office "locks doors" frustrates | Low | UX friction | Phase 4 polish: "I forgot something" button to void run |
| Save v1 → v2 migration breaks | Low | Existing slice saves wiped | Migration script with sane field defaults |

### 9.3 Cutlines (schedule recovery order)

If Sprint 2 slips, cut features in this order. **Do not cut earlier items to save later ones.**

| Slip | Cut |
|---|---|
| 1 week behind | Card Reader upgrade (Sub-phase 2F) — ritual still ships, strategic layer weakens |
| 2 weeks behind | Token slippage system entirely — collect 100% of revenue, no slippage line on terminal |
| 3 weeks behind | Changer station — ritual is bays + office only. Strip 2 stations |
| 4 weeks behind | Office back-of-house — ritual becomes "empty bays, see total" (option A from brainstorm) |
| 5 weeks behind | Revert entirely to click-collect. Update spec to record what happened. Slice ships per original §3.5 design. |

The order preserves what's most distinctive (the FP ritual itself) at the cost of what's least essential (Card Reader strategic depth). Bottom of list is the hard fallback.

### 9.4 What this spec is explicitly not solving

For clarity:

- **Tutorial / onboarding for the ritual** — Phase 4 polish per slice §4.9
- **Audio polish** — placeholder sounds only per slice §4.10
- **Manager autonomous ritual** (Tier 3+) — implied, not slice-implemented
- **Multi-lot ritual coordination** — Phase 2 with multi-lot
- **Rival visibility into ritual state** — no rivals in slice
- **Crisis events during ritual** — none trigger mid-ritual in slice
- **Achievements tied to ritual** — full-game scope

---

*End of FP cash collection spec v1*
