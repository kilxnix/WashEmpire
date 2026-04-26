# Wash Empire — Progression Tiers Spec

*Companion document to washempirebible.md. Defines the wealth/scale progression bands that structure the campaign arc and gate content.*

**Status:** Locked v1 (subject to balance tuning during economic spec pass)
**Last updated:** April 26, 2026

---

## 1. Design Philosophy

Tycoon games live or die on the *progression curve* — the felt rate at which the player's options expand. Three principles:

1. **Each tier should feel like a different game.** Tier 1 is a survival sim. Tier 4 is a strategy game. The same mechanical systems should produce different *kinds of decisions* at different scales.
2. **Tiers gate complexity, not just content.** The player shouldn't be managing 10 lots in Tier 1 — they shouldn't have the *option* to. New systems unlock as the player can handle them.
3. **The transition between tiers should be earned.** Not auto-promoted at a cash threshold — the player must demonstrate stability (sustained profit, low debt, manageable workload) to unlock the next tier's systems.

---

## 2. The Five Tiers

### Tier 1 — *Survival* ($0 – $50k)
**Game feel:** *"I can barely keep this place running."*

- **Lots owned:** 1 (the starter lot)
- **Phase goal:** Stabilize the starter lot and reach consistent weekly profit
- **Key mechanics in play:** basic upgrades, supply restocks, customer demand basics, single-lot management
- **Mechanics locked:** employees beyond a single attendant, multiple-lot management, premium services, rivals' direct attention
- **Learning curve:** the player learns the core economic loop — coin collection, supply costs, upgrade ROI
- **Exit criteria:** $50k cash + 4 consecutive weeks of positive profit + lot at 60%+ condition rating

**Time-in-tier target:** 2–3 in-game years (~30–60 minutes real-time)

### Tier 2 — *Expansion* ($50k – $200k)
**Game feel:** *"I can afford a second lot. Now what?"*

- **Lots owned:** 1–3
- **Phase goal:** Successfully manage multiple lots and learn travel-between-locations workflow
- **Key mechanics unlocked:** second lot acquisition, basic employee hiring (attendants, maintenance), city map navigation, neighborhood demographics matter
- **Mechanics still locked:** premium services (laser/detail), manager delegation, full rival aggression, fleet contracts
- **Rivals enter player awareness:** Tier 2 is when SudsCo starts paying attention. Aurora and Hydro are still expanding without regard to player.
- **Learning curve:** the player learns multi-lot logistics, employee management basics, neighborhood matching
- **Exit criteria:** $200k cash + 2+ profitable lots + at least one neighborhood matched correctly to demographics

**Time-in-tier target:** 3–5 in-game years (~1–2 hours real-time)

### Tier 3 — *Specialization* ($200k – $1M)
**Game feel:** *"I'm a real operator now. I can play the market."*

- **Lots owned:** 3–6
- **Phase goal:** Develop a coherent business strategy (low-cost chain, premium brand, balanced portfolio) and execute it
- **Key mechanics unlocked:** premium services (laser tunnels, detail bays), specialized employees (detailers), manager delegation, marketing campaigns, basic rival pricing wars
- **Mechanics still locked:** acquisition of rival lots, fleet contracts, city-level market influence
- **Rival behavior:** all four rivals are now actively responding to the player. Pricing wars become real threats. Aurora may avoid neighborhoods the player has invested in.
- **Learning curve:** the player learns to specialize — generalist operators struggle here. The neighborhood/service-tier matching is critical.
- **Exit criteria:** $1M cash + 4+ profitable lots + recognizable brand identity (specialization in at least one service tier or neighborhood type)

**Time-in-tier target:** 5–8 in-game years (~3–5 hours real-time)

### Tier 4 — *Domination* ($1M – $10M)
**Game feel:** *"This is a war for the city now."*

- **Lots owned:** 6–15
- **Phase goal:** Out-compete rivals for prime territory and begin the acquisition endgame
- **Key mechanics unlocked:** rival acquisition bids, fleet/B2B contracts, marketing manager / scout employees, lot blocking, advanced rival mechanics (espionage if implemented)
- **Mechanics still locked:** full empire systems (citywide advertising, regional expansion if added)
- **Rival behavior:** at least one rival should be visibly weakened by this point. The player is the one rivals are responding to, not the other way around.
- **Learning curve:** the player learns the acquisition timing, when to absorb a rival vs. when to keep them weak as a buffer against other rivals
- **Exit criteria:** $10M cash AND one of: 50%+ market share, 2+ rivals acquired, or all rivals reduced to <10% market share each

**Time-in-tier target:** 5–8 in-game years (~3–5 hours real-time)

### Tier 5 — *Empire* ($10M+)
**Game feel:** *"I am the car wash king."*

- **Lots owned:** 15+
- **Phase goal:** Achieve campaign victory condition
- **Key mechanics unlocked:** all systems available; this is the endgame state
- **Rival behavior:** survival mode for any remaining rivals. Hydro may make hostile acquisition bid on player if player has gotten sloppy.
- **Win conditions activate:**
  - **Market dominance:** 75%+ market share across the city
  - **Total acquisition:** all four rivals acquired or bankrupt
  - **Achievement victories:** specific completionist goals (own one of every lot type, complete fleet contract chain, achieve $1M weekly revenue)
- **Post-victory:** player can continue in sandbox mode or trigger NG+ (Empire difficulty)

**Time-in-tier target:** 2–4 in-game years (~1–2 hours real-time, depending on win condition pursued)

---

## 3. Tier Transition Mechanics

Tier promotion is *automatic* upon meeting exit criteria, but signaled clearly to the player:

- **Promotion event** — week-end notification celebrating the milestone
- **System unlock screen** — visual showcase of newly available mechanics, framed as the player's growing capabilities
- **Tutorial/hint pop** — soft guidance on the new tier's strategic considerations
- **Difficulty adjustment** — rivals notice the player's growth and recalibrate (no number-bump, but threat detection delays decrease)

There is **no demotion** — once a tier is reached, it's reached, even if the player's cash drops below the floor. This prevents tier-flickering and preserves the unlock progression.

---

## 4. Tier-Gated Content Inventory

What's available at each tier, summarized:

| Mechanic | T1 | T2 | T3 | T4 | T5 |
|----------|----|----|----|----|----|
| Basic upgrades (bays, dials, paint) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vacuum stations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Single-lot management | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multiple lots | ❌ | ✅ | ✅ | ✅ | ✅ |
| Basic employees (attendants, maintenance) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Specialized employees (detailers) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Managers (delegation) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Marketing/scout employees | ❌ | ❌ | ❌ | ✅ | ✅ |
| Premium services (laser, detail) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Marketing campaigns | ❌ | ❌ | ✅ | ✅ | ✅ |
| Backend systems (water reclaim, bulk storage) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Rival acquisition bids | ❌ | ❌ | ❌ | ✅ | ✅ |
| Fleet/B2B contracts | ❌ | ❌ | ❌ | ✅ | ✅ |
| Lot blocking strategy | ❌ | ❌ | ❌ | ✅ | ✅ |
| Sub-brand operation | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 5. Pacing Targets

The full campaign is intended to play in **15–25 real-time hours**. Distribution:

- Tier 1: ~30–60 min (tight, focused intro)
- Tier 2: ~1–2 hours (expansion mechanics introduced gradually)
- Tier 3: ~3–5 hours (the meaty middle)
- Tier 4: ~3–5 hours (the war phase)
- Tier 5: ~1–2 hours (the victory lap)

**Total target: ~10–15 hours for an efficient campaign, ~20–25 hours for a thorough one.**

These are felt-time targets, not hard limits. Sandbox players will exceed them; speedrunners will undercut them. The numbers are for tuning the *first pass* through the campaign at Normal difficulty.

---

## 6. Loan Caps Per Tier

Loan availability scales with tier to match risk capacity:

| Tier | Max loan total | Max single loan | Interest (annual) |
|------|---------------|-----------------|-------------------|
| 1 | $30k | $15k | 12% |
| 2 | $100k | $50k | 10% |
| 3 | $500k | $250k | 8% |
| 4 | $2.5M | $1M | 7% |
| 5 | $10M | $5M | 6% |

Loans get easier (more available, cheaper) as the player demonstrates capacity. This rewards stable expansion.

---

## 7. Anti-Stuck Mechanisms

To prevent players from getting permanently stuck mid-tier without enough capital to advance and not enough to recover:

- **Bankruptcy is the only failure** — there is no "stuck but not failed" state. If you have any cash and any loan capacity, you can keep playing.
- **Tier 1 has a guaranteed weekly demand floor** — the starter neighborhood always has enough customers to allow a profitable lot, given decent management. The first tier should never feel impossibly hard.
- **Crisis events scale with tier** — Tier 1 doesn't get equipment-replacement-level crises. The big-cost crises only appear at Tier 3+.
- **Loan availability scales** — Tier 1 has a small but always-available loan path for emergency cash.
- **Optional: Tutorial buyback** — first-run players can rewind 1 week if they make a catastrophic error in Tier 1 (TBD — adds onboarding safety, may dilute consequences).

---

## 8. Difficulty Modifier Interactions

Difficulty settings interact with tier progression:

- **Easy:** Tier exit criteria 25% lower, loan caps 25% higher, starting cash $30k
- **Normal:** Standard values as documented
- **Hard:** Tier exit criteria 25% higher, loan caps 25% lower, starting cash $15k
- **Empire (NG+):** All criteria 50% higher, starting cash $10k, Tier 1 has crisis events

---

## 9. Open Questions / TBD

- Exact in-game-time-to-real-time ratio (how many days/weeks does an in-game year span?)
- Whether tier-up events should pause the game or play during normal flow
- Whether tier 5 should have an explicit "you won" ending or just unlock continued play with victory recorded
- Whether to add a Tier 0 / tutorial layer below Tier 1 for first-run players
- Final loan interest rates pending economic simulation pass

---

*End of progression tiers spec v1*
