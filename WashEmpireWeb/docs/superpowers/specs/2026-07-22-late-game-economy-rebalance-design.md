# Late-Game Economy Rebalance — Design

Date: 2026-07-22
Branch: sprint-2-the-cycle
Status: Approved (design), pending implementation

## Problem

Playtesting to the endgame exposed that the three-crown finish is unreachable and the
late-game is unprofitable, purely from economy balance (the systems themselves work).

Measured facts (fully maxed lot: all bay upgrades L6, all lot upgrades, all 3 staff,
legacy +25%, best district Frostpeak, demand x2.70):

- **Revenue is throughput-capped.** A 3-bay lot cycles ~8.8s/bay, serving ~107
  customers/week × ~$18 avg = **~$2,500/week ceiling**. Extra demand only inflates
  "missed opportunity" (~$13,000/week unserved).
- **Fixed costs nearly equal the ceiling.** Full build = base overhead $520 + manager
  upgrade $420 + laser $260 + wages (cash runner $240 + bay tech $480 + night manager
  $900 = $1,620) = **$2,820/week** (conveyor +$620 = $3,440). Net ≈ **−$320/week**.
- **Wealth Crown target ($4,000/week) sits ~35% above the revenue ceiling**, so the
  streak never reaches 4 and the third crown cannot be earned through play.

Root cause: bay throughput caps revenue below both the cost base and the crown target.

## Goal

A fully-built lot in a strong district should feel **lucrative and earned**:

- Maxed lot earns **~$4,500–5,000/week** (clears the $4,000 Wealth Crown with margin,
  before the legacy bonus).
- Maxed lot is **clearly profitable** (~+$2,000/week net) — staff pay for themselves.
- Profitability arrives **before** full max, so the crown is the final push, not a wall.
- Early game gets faster, not trivialized (first-hour intent preserved).

Keep the **$4,000 Wealth target** and the crown structure unchanged — the fix is revenue
reaching the target, matching the crown's own flavor ("a thriving operation, not a pile
of gold").

## Approach — three levers (retuning existing systems only)

1. **Raise the throughput ceiling (core fix).** Convert wasted demand into washes:
   - `CAPTURE_FACTOR` 0.75 → ~0.9.
   - Reduce per-cycle dead time at high upgrade levels (wand/dryer cut wash time more;
     trim the stall-clear buffer) so maxed bays cycle ~6.5s instead of ~9s.
   - Net: a maxed lot serves ~1.8× more cars, roughly doubling revenue to ~$4,800.
   - Side benefit: demand, marketing, and ad-boost upgrades finally matter.

2. **Make staff net-positive.** Trim the steepest wage (Night Manager $900 → ~$600) so
   the three collectors clearly pay for themselves against the higher revenue.

3. **Keep the $4,000 target and other costs as-is.** The fix is revenue, not the target.

## Non-goals (YAGNI)

- No new bays, districts, or upgrade tracks.
- No UI changes beyond what the numbers imply.
- No changes to the crown/legacy structure.

## Validation

This is empirical tuning, not blind constant edits:

1. Encode the intended late-game economics as an automated test (a maxed-lot fixture must
   land in the ~$4.5–5k/week profitable band; a mid-build lot must be break-even-plus).
2. Tune constants against that test **and** against the live sim using the seeded-save +
   measurement harness used to find the bug, iterating until the bands are hit.
3. Keep existing web tests green (1-hour starter playtest, cashflow, ads) — update only
   with intent, documented in the run log.
4. Re-run `npm run audit:launch`. Confirm first-hour numbers stay within intent (higher
   is fine; not wildly inflated).
5. Manual spot-check in the browser: a maxed district shows a profitable weekly review and
   the Wealth Crown streak advances.

## Risk / rollback

Pure constant/formula changes in `src/game/simulation.ts` (+ a new test). Fully revertable
by reverting the commit. Main risk is over-tuning early game; mitigated by the retained
first-hour playtest assertions and the mid-build break-even check.
