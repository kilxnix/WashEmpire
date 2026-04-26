# Wash Empire — Win Conditions Spec

*Companion document to washempirebible.md. Locks the campaign victory definitions and post-victory behavior.*

**Status:** Locked v1
**Last updated:** April 26, 2026

---

## 1. Design Philosophy

A tycoon needs *multiple paths to victory* to reward different play styles. Three principles:

1. **Multiple win conditions, not just one.** A pure cash goal punishes diverse strategies. Multiple paths reward strategic identity.
2. **Victory is achievable but not automatic.** Each path requires a specific commitment — players who try to win all paths simultaneously will reach none.
3. **Post-victory matters.** Many players will keep playing after winning. The game must support sandbox continuation gracefully.

---

## 2. The Three Victory Paths

### 2.1 Market Dominance Victory
**Theme:** *"They all wash where I tell them to wash."*

- **Trigger:** Player achieves and sustains **75% market share** for 4 consecutive weeks
- **Market share calculation:** percentage of total customer-wash-events across the city, measured weekly
- **Why 75% and not 100%:** A 100% goal forces players to chase Pop's into their last loyal-customer corner, which becomes tedious. 75% says "you control the market" without demanding total annihilation.
- **Strategic flavor:** Aggressive expansion and lot density. Suits players who like building wide.

### 2.2 Acquisition Victory
**Theme:** *"They all work for me now."*

- **Trigger:** Player has **acquired or bankrupted all four named rivals**
- **"Acquired"** = full buyout via the acquisition system
- **"Bankrupted"** = rival reaches $0 cash + no recovery path (different from acquisition; rival exits the market without player gaining their lots)
- **Strategic flavor:** Targeted competitive play. Suits players who like the rivalry layer specifically and want to *eliminate* opponents rather than out-compete them.
- **Note:** Bankrupted rivals are *gone* — their lots are auctioned to whoever bids (could go to player, could go to a remaining rival, could become available city lots). Acquired rivals' lots transfer directly to player.

### 2.3 Wealth Victory
**Theme:** *"The numbers don't lie."*

- **Trigger:** Player achieves **$1,000,000 weekly revenue** (sustained for 4 consecutive weeks)
- **Why weekly revenue, not total cash:** Total cash rewards hoarding; weekly revenue rewards a thriving operation. The fantasy is being a successful business, not a dragon on a pile of gold.
- **Strategic flavor:** Optimization-focused. Suits players who like spreadsheet thinking and squeezing efficiency from every lot.

---

## 3. Victory Triggering Mechanics

### 3.1 Pre-Victory State

When the player is *close* to a victory condition (within 80% of the threshold), the game shows a soft progress indicator on the city map / weekly review:

- "Market share: 67% (75% to win)"
- "Rivals remaining: 1 of 4"
- "Weekly revenue: $812k (1M to win)"

This builds anticipation and tells the player which path they're naturally heading toward.

### 3.2 Victory Moment

When a condition is met:
- **Sustain check:** the condition must hold for 4 consecutive weeks (prevents flash victories from one-off market spikes)
- **Victory event:** dedicated end-of-week presentation showing how the player won, key stats, total time played
- **Choice prompt:** "Continue building?" or "End campaign and view summary?"

### 3.3 Multiple Simultaneous Victories

If the player meets multiple victory conditions at once (rare but possible), the game records all achieved paths in the campaign summary. The first-achieved path is the "primary" victory for the run, but all are credited.

---

## 4. Post-Victory Behavior

### 4.1 Continue Mode

If the player chooses to continue after victory:
- Game continues normally
- Win condition flag persists (cannot "lose" the win)
- Remaining unachieved victory conditions still trigger if reached
- Player can pursue completionist goals (achievements, all-rivals-acquired-AND-market-dominance, etc.)

### 4.2 Campaign Summary Screen

If the player ends the campaign:
- Total real time played
- In-game years elapsed
- Lots acquired, peak market share, peak weekly revenue
- Rival outcomes (acquired / bankrupted / surviving)
- Key decisions visualization (when they took loans, peak debt, biggest expansion week)
- Achievement/badge unlocks
- "Start new campaign" prompt with NG+ option if eligible

### 4.3 NG+ (Empire Difficulty) Unlock

After first campaign victory, **Empire difficulty** unlocks:
- Higher difficulty modifiers (see Rivals Spec Section 8)
- A fifth rival generated as a "ghost AI" trained on the player's previous campaign decisions
- Some carry-over: high-score table, hall-of-fame moments, possibly a starting cash bonus
- New aesthetic flair (golden lot markers? legacy branding?)

NG+ is the *real* endgame for engaged players.

---

## 5. Achievement Goals (Beyond Victory)

These are *not* victory conditions but provide additional long-tail goals:

- **Wash Tycoon:** Win all three victory paths in a single campaign
- **Empire Builder:** Own 20+ lots simultaneously
- **Brand Identity:** Win the campaign with all lots specialized in one tier (all premium, or all basic)
- **No Loans Allowed:** Win the campaign without taking out a single loan
- **Underdog:** Win the campaign starting on Hard difficulty
- **Speedrun:** Win the campaign in under 10 in-game years
- **Pacifist:** Win without ever undercutting a rival's price
- **Aggressor:** Win Market Dominance via Acquisition Victory (acquire all rivals as your dominance path)
- **Pop's Approves:** Win the campaign without acquiring or bankrupting Pop's Wash & Wax

These give players reasons to replay with self-imposed constraints.

---

## 6. Difficulty Modifier Effects on Victory

| Difficulty | Market dominance threshold | Wealth victory threshold | Notes |
|------------|---------------------------|-------------------------|-------|
| Easy | 60% | $750k/week | Two rivals, easier acquisitions |
| Normal | 75% | $1M/week | Standard |
| Hard | 80% | $1.25M/week | Aggressive rivals, harder acquisitions |
| Empire (NG+) | 85% | $1.5M/week | Five rivals, ghost AI included |

Acquisition victory threshold (all rivals defeated) scales with rival count, not a percentage.

---

## 7. Victory Progress Visibility

The Weekly Review screen always shows progress toward the *closest* of the three victory conditions:

```
WEEKLY REVIEW — Week 47

Cash: $2.4M
Weekly profit: +$78k
Market share: 41% [████████░░░░░░░░░] 75% to win

Rival status:
  SudsCo:  acquired ✅
  Aurora:  47% market share, healthy
  Hydro:   12% market share, weakening
  Pop's:   3 lots, defensive

Closest victory path: ACQUISITION (3 of 4 rivals eliminated)
```

This keeps the player oriented toward their strategic goal without pre-determining their path.

---

## 8. Failure State Override

The failure state (bankrupt + loan-capped → hard restart) takes priority over any victory condition. If the player meets a victory condition in the same week they meet failure conditions, the victory is recorded with an asterisk ("Pyrrhic Victory") and the campaign ends.

In practice this is nearly impossible to trigger but the rule exists for completeness.

---

## 9. Open Questions / TBD

- Whether the 4-consecutive-week sustain rule should be longer (8 weeks?) for harder difficulties
- Whether Pop's bankruptcy should be treated differently (narrative weight — they're the family business)
- Whether Hydro's hostile-takeover offer should *also* count as a "loss" path for record-keeping
- Achievement list final pass during content phase
- NG+ ghost AI specifics — exact fingerprinting of player decisions to "embody" them as an opponent

---

*End of win conditions spec v1*
