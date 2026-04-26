# Wash Empire — Employee System Spec

*Companion document to washempirebible.md. Defines the full employee system: roles, hiring, training, wages, and delegation.*

**Status:** Locked v1 (subject to balance tuning during economic spec pass)
**Last updated:** April 26, 2026

---

## 1. Design Philosophy

Employees are the player's *force multiplier*. Without them, the player can't scale beyond a small number of lots. With them, the game becomes a delegation puzzle — who's good enough to trust, what are they worth, and where do they go?

Three principles:

1. **Employees are a cost before they're a benefit.** Every employee adds weekly wage drain immediately, but their value depends on assignment quality, lot conditions, and skill level. Bad hires actively hurt the business.
2. **Skill matters more than quantity.** A skilled manager covering one lot is worth more than three unskilled attendants. Player should feel rewarded for investing in development, not just numbers.
3. **Delegation is the late-game core mechanic.** Tier 1–2 the player does everything. Tier 3+ delegation becomes essential. Tier 4–5 the player is essentially managing managers. The delegation system *is* the empire system.

---

## 2. The Five Roles

### 2.1 Attendant
**The basic worker. The first hire most players make.**

- **Function:** Handles customer questions, restocks supplies on assigned lot, performs minor cleaning, light upkeep
- **Effect on lot:** Reduces required-task burden for that lot (player doesn't have to manually restock if attendant is on duty), small customer satisfaction boost
- **Tier unlock:** Tier 2
- **Required count:** 0–2 per lot (1 typical, 2 for high-volume lots)
- **Skill range:** Low to medium — most attendant candidates are entry-level
- **Wage range:** $400–$800 / week

### 2.2 Maintenance Tech
**Keeps the equipment running. The unsung hero.**

- **Function:** Repairs equipment, performs preventive maintenance, reduces breakdown frequency
- **Effect on lot:** Reduces equipment failure crisis events by up to 70% at high skill, extends equipment lifespan, reduces repair costs
- **Tier unlock:** Tier 2
- **Required count:** 0–1 per 2–3 lots (one tech can rotate)
- **Skill range:** Medium to high — high-skill techs are rare and expensive
- **Wage range:** $700–$1,500 / week

### 2.3 Detailer
**The specialist. Required for premium operations.**

- **Function:** Operates detail bays, performs hand-detailing services, executes premium service orders
- **Effect on lot:** Detail bays *cannot operate without a detailer assigned* — they're locked until staffed. High-skill detailers earn premium service revenue.
- **Tier unlock:** Tier 3
- **Required count:** 1 per active detail bay
- **Skill range:** Medium to very high — top detailers are scarce, expensive, and valuable
- **Wage range:** $1,000–$2,500 / week (highest standard role)

### 2.4 Manager
**The delegation enabler. The reason you can have an empire.**

- **Function:** Operates an entire lot autonomously. Player no longer needs to manually visit lot for required tasks. Manager makes day-to-day decisions: small repricing, supply ordering, employee scheduling.
- **Effect on lot:** Replaces the player's required-task burden. Manager skill determines lot performance under autonomous operation (low-skill manager = lot underperforms; high-skill manager ≈ player operating themselves).
- **Tier unlock:** Tier 3
- **Required count:** 0–1 per lot (cannot have multiple managers)
- **Skill range:** Medium to very high — managers must be developed or hired at premium
- **Wage range:** $1,500–$3,500 / week
- **Critical mechanic:** A managed lot still earns revenue and incurs costs, but the player doesn't *do anything* there unless a crisis fires. This is what enables 10+ lot empires.

### 2.5 Marketing/Scout
**The strategic role. Late-game leverage.**

- **Function:** Runs marketing campaigns at improved efficiency, scouts new lots before they hit the market (advance notice), provides intel on rival activities (better Dossier accuracy)
- **Effect on lot:** Not lot-bound — operates at company level. One scout improves player's information advantage citywide.
- **Tier unlock:** Tier 4
- **Required count:** 0–2 (diminishing returns past 2)
- **Skill range:** Medium to high — skilled scouts are rare and provide significant strategic edge
- **Wage range:** $1,200–$2,800 / week

---

## 3. Skill System

Each employee has a single **skill rating** from 1–10, abstracting their effectiveness in their role.

### 3.1 Skill Effects by Role

| Role | What skill affects |
|------|-------------------|
| Attendant | Customer satisfaction bonus, restock efficiency |
| Maintenance | Breakdown reduction %, repair cost reduction |
| Detailer | Premium service quality (revenue multiplier on detail jobs) |
| Manager | Autonomous lot performance (% of optimal player operation) |
| Scout | Lot scouting advance notice, Dossier accuracy improvement |

### 3.2 Skill Tiers (descriptive)

- **1–3 — Green:** entry-level, high error rate, cheap, good for low-stakes assignments
- **4–6 — Solid:** reliable, mid-wage, the workhorse middle of the labor pool
- **7–8 — Skilled:** scarce, expensive, noticeable performance lift
- **9–10 — Elite:** rare, very expensive, transformative for the operation

### 3.3 Wage Demand Formula

```
weekly_wage = base_role_wage × (1 + (skill - 1) × 0.18)
```

So a skill-1 attendant might demand ~$400/week, while a skill-10 attendant demands ~$1,000/week. A skill-10 detailer demands ~$2,500/week.

These are *demand* numbers — the player can negotiate, but lowballing increases quitting risk.

---

## 4. Hiring System

### 4.1 The Candidate Pool

- **Refreshes weekly** — a new pool of candidates appears each in-game week
- **Pool size:** 3–6 candidates total across all roles per week
- **Skill distribution:** Mostly entry-level (skill 1–4), occasional mid-tier (5–7), rare high-tier (8–10)
- **High-tier candidates appear more often when:**
  - Player has high reputation
  - Player has hired/trained successfully in the past
  - Marketing/scout employees are active
  - Player is offering above-market wages on existing roles

### 4.2 The Hiring Board UI

Each candidate shows:
- **Name** (procedurally generated, varied)
- **Role specialty** (attendant, maintenance, detailer, manager, scout)
- **Skill rating** (visible to player, no hidden stats — keeps decisions clean)
- **Wage demand** (weekly $)
- **Reliability rating** (1–5 stars — predicts quit risk and absenteeism)
- **Background flavor** (one-line bio for character — *"Former gas station manager. Steady hands."*)

### 4.3 Negotiation

Player can attempt to negotiate wage down:
- **Lowball (under demand):** higher quit risk if hired, may insult and walk
- **At demand:** standard hire, normal stability
- **Above demand:** better stability, sets internal benchmark for other employees' wage expectations (caution — overpaying one person makes others ask for raises)

### 4.4 Onboarding Period

- New hires have a 2-week "onboarding" period where their skill operates at -1 effective rating
- Reduces gameplay snap-decisions (hiring isn't an instant solution to a crisis)
- Makes pre-emptive hiring more valuable than reactive hiring

---

## 5. Training System

Skill development for existing employees.

### 5.1 Mechanics

- Player can spend cash to train an employee
- **Cost per training session:** scales with current skill level — going from 3→4 is cheap, 9→10 is expensive
- **Time per session:** 2–4 in-game weeks of partial productivity loss while training
- **Outcome:** +1 skill on success (90% chance), no change on failure (rare)

### 5.2 Cost Curve

```
training_cost = 500 × (current_skill ^ 1.7)
```

Examples:
- Skill 1→2: ~$500
- Skill 5→6: ~$8,000
- Skill 8→9: ~$25,000
- Skill 9→10: ~$35,000

### 5.3 Strategic Implications

Training is *cheaper than hiring elite* in absolute cost, but *slower*. Player choice:
- **Hire elite:** instant high skill, very expensive wage forever
- **Hire mid + train up:** lower wage, but lower performance during training, time investment
- **Hire entry + train up:** cheapest path, longest time investment, biggest skill ceiling risk

This is a good tycoon decision shape — multiple valid paths with different time/money tradeoffs.

---

## 6. Reliability & Quitting

### 6.1 Reliability Rating (1–5 stars)

Visible at hire, predicts:
- **Absenteeism:** how often the employee misses a workday (high reliability = rare miss; low = frequent)
- **Quit risk:** weekly probability of quitting under various stressors
- **Loyalty:** resistance to being poached by rivals (yes, rivals can poach high-skill employees in late-game)

### 6.2 Quit Triggers

Employees may quit when:
- **Underpaid:** wage below regional/skill benchmark for 4+ weeks
- **Overworked:** lot is understaffed, employee covering multiple roles for 4+ weeks
- **Mismatched:** detailer assigned to attendant duties, manager left without lot to manage, etc.
- **Player neglect:** lot is in poor condition, equipment frequently broken
- **Better offer:** rival or random event offers them a job (late-game only, Tier 4+)

Each trigger increases weekly quit probability. Stacking multiple triggers makes departures near-certain.

### 6.3 Quit Notice

- 2-week notice in most cases (player can scramble to replace)
- Immediate departure on severe triggers (sudden severe pay cut, hostile event)
- Player can attempt counter-offer (raise wage, change assignment) — works ~50% of time depending on cause

---

## 7. Assignment & Scheduling

### 7.1 Assignment Mechanics

- Each employee is assigned to **one lot** (managers and attendants) or **company-wide** (scouts, marketing)
- **Maintenance techs** can rotate between 2–3 lots with reduced effectiveness per lot covered
- Reassignment takes 1 in-game week (employee transition)

### 7.2 Schedule Mechanics

*(Stretch goal — may be cut for v1)*

- Day-shift / night-shift / split-shift options
- Affects which hours the lot is "covered"
- Adds depth but adds significant UI complexity

**v1 recommendation:** assume always-on coverage during operating hours, no schedule micromanagement. Reserve scheduling depth for post-launch update.

---

## 8. Manager Delegation Deep Dive

The most important employee system. Deserves its own section.

### 8.1 What a Managed Lot Does Differently

When a manager is assigned to a lot:

- **Player no longer sees required tasks for that lot** in their daily queue
- **Cash collection happens automatically** at week-end (deposited to player's main account)
- **Supply restocks happen automatically** when needed (cost deducted from main account)
- **Minor crises auto-resolve** (small breakdowns, supply runouts)
- **Major crises still notify the player** (large equipment failure, severe customer complaint, vandalism above threshold)

### 8.2 Manager Performance Modifier

A managed lot operates at:
```
performance = 0.5 + (manager_skill × 0.05)
```

So:
- **Skill 1 manager:** 55% of player-operated efficiency (probably losing money)
- **Skill 5 manager:** 75% of player-operated efficiency (decent)
- **Skill 8 manager:** 90% of player-operated efficiency (excellent)
- **Skill 10 manager:** 100% of player-operated efficiency (perfect)

**Implication:** assigning a low-skill manager to a high-margin lot loses money. Player must match manager skill to lot stakes.

### 8.3 Manager Trust Levels

*(Stretch goal — adds depth if implemented)*

- **Trust 1:** Manager handles only basic operations, player approves all upgrades and pricing changes
- **Trust 2:** Manager can adjust pricing within ±10% of player's set price
- **Trust 3:** Manager can purchase minor upgrades up to a budget cap
- **Trust 4:** Full autonomy — manager makes all decisions, player gets reports only

Trust earned through demonstrated performance over time. Higher trust = less player attention required.

---

## 9. Wage Cost Scaling

Total wage burden as a % of revenue is a critical balance metric.

| Tier | Target wage burden | Notes |
|------|-------------------|-------|
| T1 | 0% | No employees yet |
| T2 | 10–20% | First attendant, maybe maintenance |
| T3 | 25–35% | Detailers, managers entering the picture |
| T4 | 30–40% | Full team across multiple lots |
| T5 | 25–35% | Economies of scale, scouts add citywide value |

If wage burden exceeds 50% in any tier, the player is overstaffed. If below the floor of the range, they're understaffed and likely missing optimization opportunities.

The economic simulation must tune wages and revenue to make these targets achievable but not automatic.

---

## 10. Open Questions / TBD

- Whether to implement scheduling system in v1
- Whether to implement Manager Trust Levels in v1
- Whether rival employee poaching is in v1 (probably v2)
- Specific wage numbers pending economic simulation pass
- Whether onboarding period is 2 weeks (current) or shorter for high-skill hires
- Whether to add specialty sub-roles (e.g., "experienced detailer with classic car expertise") for narrative texture

---

*End of employee system spec v1*
