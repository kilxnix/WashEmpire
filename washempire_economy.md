# Wash Empire — Economic Simulation Spec

*Companion document to washempirebible.md. Defines the economic model that drives the game: revenue, costs, demand, pricing, upgrade ROI, and the spreadsheet math behind every weekly cycle.*

**Status:** v1 baseline (numbers will require playtest tuning — values here are designed to be internally consistent and roughly correct, not final)
**Last updated:** April 26, 2026

---

## 1. Design Philosophy

Tycoons live or die on numerical feel. Three principles:

1. **Every decision must be a real tradeoff.** If an upgrade is obviously good, it's not interesting. The economy must produce *contested* choices where every option has a downside.
2. **The math should be legible.** Hidden formulas frustrate players. Visible relationships ("more bays = more capacity = more demand needed to fill them") make the strategy real.
3. **The spreadsheet is the game.** Every other system (rivals, employees, progression) plugs into the economic model. If the economy is broken, nothing else matters.

---

## 2. The Master Equation

At its core, every lot every week is:

```
weekly_profit = weekly_revenue - weekly_costs

weekly_revenue = sum_of(visits × price_per_visit) across all bays + secondary revenue
weekly_costs = fixed_costs + variable_costs + employee_wages + loan_servicing
```

The rest of this document defines every term in detail.

---

## 3. Customer Demand

### 3.1 Base Demand Per Lot

Every lot has a **base weekly demand** determined by:

```
base_demand = neighborhood_traffic × curb_appeal × reputation × competition_factor
```

#### Neighborhood Traffic (per-lot baseline visits per week)

| Neighborhood | Base traffic |
|--------------|--------------|
| Working class | 250 visits/week |
| Suburban | 200 visits/week |
| Affluent | 120 visits/week |
| Industrial | 150 visits/week |
| Tourist | 180 visits/week (high variance) |

These are *baseline*, before modifiers.

#### Curb Appeal Multiplier (0.5x – 1.5x)

Sum of:
- Paint condition: 0.0 (peeling) to +0.15 (pristine)
- Signage quality: 0.0 (faded) to +0.15 (premium)
- Lighting: 0.0 (dim/none) to +0.10 (well-lit)
- Landscaping: 0.0 (none) to +0.10 (manicured)

Base curb appeal = 1.0 + sum of bonuses, capped at 1.5x.
Degraded lot starting condition: 0.5x – 0.7x typical.

#### Reputation Multiplier (0.7x – 1.3x)

Reputation is a slow-moving stat (weeks-long EMA of customer satisfaction).
- New lot: 1.0x
- Persistent satisfaction issues: down to 0.7x
- Excellent service over time: up to 1.3x

#### Competition Factor (0.5x – 1.0x)

For each rival lot in the same neighborhood within a competition radius:
- 1 competitor: 0.85x
- 2 competitors: 0.70x
- 3+ competitors: 0.55x

Direct adjacency (same block) compounds further: -0.10x additional per adjacent rival.

### 3.2 Service Tier Demand Split

Each visiting customer chooses a service tier based on neighborhood demographic mix and lot's available services.

**Default service tier preferences by neighborhood:**

| Neighborhood | Basic % | Deluxe % | Premium % |
|--------------|---------|----------|-----------|
| Working class | 70% | 25% | 5% |
| Suburban | 40% | 45% | 15% |
| Affluent | 15% | 35% | 50% |
| Industrial | 80% | 18% | 2% |
| Tourist | 35% | 50% | 15% |

If a lot doesn't offer a tier, those customers shift down to the next available tier (or leave if no acceptable option, reducing effective demand).

### 3.3 Visit-to-Bay Conversion

Not every visit becomes a bay use:
- **Capacity check:** if all bays are occupied, customer queues briefly. Long queues (3+ minute wait at typical use times) cause some customers to leave (~15% balk rate per minute past 2 minutes).
- **Service availability:** if customer's preferred tier requires a bay configuration not available, they downgrade or leave.

```
actual_bay_uses = base_demand × tier_split × (1 - balk_rate)
```

### 3.4 Daily/Weekly Variance

Demand is not flat:
- **Weekend boost:** +30% on Saturday, +20% on Sunday vs. weekday baseline
- **Weather effects:** rain week reduces demand 40%, snow week reduces 60%, post-rain week boosts 25% (people wash off mud and salt)
- **Seasonal:** spring +15%, summer baseline, fall +10%, winter -20%
- **Random daily variance:** ±15% noise on top of all modifiers

---

## 4. Pricing

### 4.1 Service Tier Base Prices

| Service tier | Base price (single use) |
|--------------|------------------------|
| Basic wash | $5 |
| Deluxe wash (with wax/foam) | $10 |
| Premium wash (full menu) | $18 |
| Vacuum (per session) | $2 |
| Detail bay service | $40–$120 (varies by package) |
| Laser/automatic tunnel | $12 |

### 4.2 Neighborhood Price Multipliers

Each neighborhood has an expected price band. Charging within band = no penalty. Above or below shifts demand.

| Neighborhood | Price band multiplier |
|--------------|----------------------|
| Working class | 0.8x – 1.0x (price-sensitive) |
| Suburban | 0.9x – 1.1x |
| Affluent | 1.0x – 1.4x (will pay premium for premium service) |
| Industrial | 0.7x – 0.9x (commercial buyers expect bulk pricing) |
| Tourist | 1.1x – 1.3x (captive market) |

### 4.3 Price Elasticity

Demand response to pricing within band:
- **Price at low end of band:** +20% demand
- **Price at midpoint of band:** baseline demand
- **Price at high end of band:** -15% demand

Demand response to pricing outside band:
- **10% below low end:** +30% demand, but customer satisfaction drops (cheap = sketchy in some neighborhoods)
- **10% above high end:** -40% demand, reputation declines over weeks
- **20%+ above high end:** demand collapses (-70%), strong reputation hit

This elasticity is what makes pricing a real lever rather than "set max and forget."

### 4.4 Pricing War Mechanics (cross-reference rivals spec)

When player and rival both operate in same neighborhood:
- Each lot's price is compared to neighborhood-weighted average of competitors
- Cheaper lot gains demand share at expense of pricier lot:
  - 5% cheaper: +15% demand share, -15% to competitor
  - 10% cheaper: +25% demand share, -25% to competitor
  - 20%+ cheaper: +40% demand share, -40% to competitor

Pricing wars are *zero-sum on demand* but *negative-sum on margin* — both lose money relative to a stable equilibrium.

---

## 5. Costs

### 5.1 Fixed Weekly Costs Per Lot

| Cost | Tier 1 lot | Tier 3 lot | Tier 5 lot |
|------|-----------|-----------|-----------|
| Lease/mortgage | $300 | $600 | $1,200 |
| Electricity | $100 | $250 | $500 |
| Water (without reclaim) | $150 | $400 | $800 |
| Water (with reclaim system) | $50 | $130 | $260 |
| Insurance | $40 | $80 | $200 |
| Permits/fees | $20 | $50 | $100 |
| **Total fixed (no reclaim)** | **~$610** | **~$1,380** | **~$2,800** |
| **Total fixed (with reclaim)** | **~$510** | **~$1,110** | **~$2,260** |

Fixed costs scale with lot size and equipment density. Adding a bay or tunnel adds to baseline operating costs.

### 5.2 Variable Costs (per visit)

| Service tier | Variable cost per use |
|--------------|----------------------|
| Basic wash | $0.40 (water + soap) |
| Deluxe wash | $1.20 (water + soap + foam + wax) |
| Premium wash | $2.50 (full chemical menu) |
| Vacuum | $0.05 (electricity only) |
| Detail bay service | $8–$25 (chemicals, supplies) |
| Laser/automatic tunnel | $1.50 (water + chemicals + electricity) |

These scale linearly with usage. **Bulk chemical storage upgrade** reduces variable costs by 25%.

### 5.3 Employee Wages

Cross-reference employee spec for full wage scaling. Summary:

| Role | Wage range / week |
|------|-------------------|
| Attendant | $400–$800 |
| Maintenance tech | $700–$1,500 |
| Detailer | $1,000–$2,500 |
| Manager | $1,500–$3,500 |
| Scout | $1,200–$2,800 |

### 5.4 One-Time Costs (Upgrades)

| Upgrade category | Cost range |
|------------------|-----------|
| Single bay equipment upgrade (dial, brush, dryer) | $500–$3,000 |
| Add new bay | $8,000–$15,000 |
| Add vacuum station | $2,500 |
| Add laser tunnel | $35,000 |
| Add detail bay | $20,000 |
| Paint job (full lot) | $1,500 |
| Signage upgrade | $800–$3,000 |
| Lighting upgrade | $2,000 |
| Reclaim water system | $25,000 |
| Bulk chemical storage | $8,000 |
| Security cameras | $2,500 |

### 5.5 New Lot Acquisition

| Lot quality | Purchase price |
|-------------|---------------|
| Distressed (working class) | $30,000–$60,000 |
| Standard (working class) | $80,000–$150,000 |
| Standard (suburban) | $150,000–$280,000 |
| Premium (affluent) | $300,000–$600,000 |
| Industrial/commercial | $120,000–$220,000 |
| Tourist hot spot | $250,000–$500,000 |

Distressed lots come with major repair needs (~$15k–$30k) before they're operational.

---

## 6. Loan Economics

### 6.1 Loan Caps Per Tier

| Tier | Max total loans | Max single loan | Annual interest |
|------|-----------------|-----------------|------------------|
| 1 | $30,000 | $15,000 | 12% |
| 2 | $100,000 | $50,000 | 10% |
| 3 | $500,000 | $250,000 | 8% |
| 4 | $2,500,000 | $1,000,000 | 7% |
| 5 | $10,000,000 | $5,000,000 | 6% |

### 6.2 Loan Servicing

Weekly payment formula (standard amortization):
```
weekly_payment = principal × (rate/52) / (1 - (1 + rate/52)^(-weeks))
```

For a 2-year (104 week) loan at 10% APR on $50k principal:
- Weekly payment: ~$533
- Total paid: ~$55,400
- Interest paid: ~$5,400

### 6.3 Default Mechanics

- Missed weekly payment: 5% late fee added, reputation hit, future loan rates +2%
- 4 consecutive missed payments: loan called, principal due immediately
- Inability to pay called loan: bankruptcy trigger evaluated

---

## 7. Upgrade ROI Curves

For tycoon feel, upgrades should generally pay back in **8–24 weeks** at Tier 2+, with Tier 1 upgrades paying back faster (4–12 weeks) since cash is most precious early.

### 7.1 Sample ROI Calculations

**Add a vacuum station ($2,500):**
- Estimated additional revenue: $80–$150/week (visit volume × $2)
- Variable cost: ~$10/week
- Net weekly: $70–$140
- Payback: 18–36 weeks
- **Verdict:** Decent secondary investment, slow payback. Better as part of curb appeal package than standalone.

**Bay equipment upgrade — dial set ($1,500):**
- Improves customer satisfaction +5%, demand +3%
- On a 200-visit/week working-class lot at $5 average: ~$30/week additional revenue
- Payback: ~50 weeks
- **Verdict:** Slow payback as standalone, but stacks with other satisfaction upgrades for compounding effect.

**Signage upgrade ($2,500):**
- Increases curb appeal by 0.10x
- On a 200-visit/week lot, +20 visits/week
- At $5 average: $100/week additional revenue
- Payback: 25 weeks
- **Verdict:** Solid early investment, particularly when paint is also degraded.

**Reclaim water system ($25,000):**
- Reduces water cost by 65% (~$100/week at Tier 1, ~$270/week at Tier 3, ~$540/week at Tier 5)
- Payback: 250 weeks (T1), 92 weeks (T3), 46 weeks (T5)
- **Verdict:** Tier 4+ investment. Don't buy this in Tier 1 — it locks up cash that's better deployed elsewhere.

**Laser tunnel ($35,000):**
- Adds high-throughput service: 800–1,200 visits/week at $12 average, variable cost $1.50
- Net per visit: $10.50
- Net weekly: $8,400–$12,600 (massive)
- Payback: 3–5 weeks
- **Verdict:** Dominant upgrade once player can afford it, but requires Tier 3 unlock and lot zoning capacity.

### 7.2 ROI Design Targets

| Upgrade type | Target payback (weeks) | Notes |
|--------------|----------------------|-------|
| Curb appeal (paint, signage) | 15–30 | Should stack to compound |
| Bay equipment | 30–60 | Slower, but reliability/satisfaction matter |
| New bay | 20–40 | Big capacity boost |
| Vacuum stations | 20–40 | Secondary revenue stream |
| Backend (reclaim, bulk storage) | 40–80 | Long-term plays for established empires |
| Premium services (laser, detail) | 4–15 | Big winners but high tier-gate |

If any upgrade has a payback faster than 4 weeks, it's overpowered and should be repriced. If any takes longer than 80 weeks, it's underpowered or mispriced.

---

## 8. Worked Example: A Tier 1 Lot

To make the math concrete, here's a typical Tier 1 working-class lot:

**Starting state (week 1):**
- 1 lot, working-class neighborhood, 2 bays, basic wash only
- Curb appeal: 0.7x (faded paint, dim lighting, weak signage)
- Reputation: 1.0x (new ownership)
- Competition factor: 1.0x (no nearby rivals yet)

**Demand calculation:**
- Base traffic: 250 visits/week
- Modifiers: 250 × 0.7 × 1.0 × 1.0 = **175 visits/week effective**
- Tier split (working class): 70% basic = 122 basic visits, 25% deluxe = no deluxe service available, customers downgrade or leave
- Effective basic visits: ~140 (after some downgrade conversions)
- Capacity check: 2 bays at ~12 mins/use = ~50 visits/bay/day = 700/week capacity. No queue issue.

**Revenue:**
- 140 visits × $5 (basic price at neighborhood midpoint) = **$700/week**

**Costs:**
- Fixed: $610/week
- Variable: 140 × $0.40 = $56/week
- Employees: $0 (player-operated)
- Loans: $0 (no initial debt)
- **Total costs: $666/week**

**Profit: $34/week.** Barely profitable. Player must invest in upgrades to grow.

**Week 1 player decision:** spend ~$5,000 on signage + paint to lift curb appeal from 0.7x to 1.0x:
- New demand: 250 × 1.0 = 250 visits/week (but 70% basic = 175 basic, capacity still fine)
- New revenue: 175 × $5 = $875/week
- Costs: $610 + (175 × $0.40) = $680/week
- **New profit: $195/week**
- ROI on $5k upgrade: payback in ~26 weeks (about 6 months in-game)

This is **the right shape** — early upgrades are felt but not transformative, and the player has to make multiple upgrades stack to escape Tier 1.

---

## 9. Worked Example: A Tier 3 Lot

A mid-game working-class lot with full upgrade suite and one attendant:

**State:**
- 1 lot, working-class, 4 bays + 4 vacuum stations, basic + deluxe service
- Curb appeal: 1.4x (full upgrades)
- Reputation: 1.2x (sustained good service)
- Competition: 0.85x (one rival nearby)

**Demand:**
- Base: 250 × 1.4 × 1.2 × 0.85 = **357 visits/week effective**
- Tier split: 70% basic = 250, 25% deluxe = 89, 5% premium → downgrade to deluxe
- Effective: 250 basic + 95 deluxe

**Revenue:**
- Basic: 250 × $5 = $1,250
- Deluxe: 95 × $10 = $950
- Vacuum: 80% of customers vacuum × $2 = ~$550
- **Total revenue: ~$2,750/week**

**Costs:**
- Fixed: $1,380/week (Tier 3 lot)
- Variable: (250 × $0.40) + (95 × $1.20) = $214/week
- Attendant wage: $600/week
- **Total costs: ~$2,194/week**

**Profit: ~$556/week.** Healthy operation. Player has cash to expand to next lot.

---

## 10. Crisis Events Economic Impact

Random crisis events that can hit any week:

| Event | Cost to player | Frequency |
|-------|---------------|-----------|
| Equipment minor breakdown | $500–$1,500 | ~1x/month per lot |
| Equipment major failure | $3,000–$8,000 | ~1x/year per lot |
| Vandalism (small) | $500 | ~1x/quarter per lot |
| Vandalism (severe) | $3,000–$10,000 | ~1x/year per lot |
| Customer complaint payout | $200–$1,000 | ~1x/month per lot |
| Code violation fine | $1,000–$5,000 | rare, triggered by neglect |
| Plumbing emergency | $2,000–$6,000 | ~1x/year per lot |
| Soap supplier price hike | +20% variable cost for 4 weeks | rare |

Maintenance employee at high skill reduces equipment-related crises by up to 70%.
Security cameras reduce vandalism crises by 50%.
Manager presence reduces all crises by 20%.

---

## 11. Cash Flow Targets Per Tier

What "healthy" looks like at each tier:

| Tier | Total weekly revenue | Profit margin | Cash on hand | Notes |
|------|---------------------|---------------|---------------|-------|
| 1 | $700–$1,500 | 5–15% | $5k–$50k | Survival mode |
| 2 | $2,000–$5,000 | 15–25% | $20k–$200k | Building reserves |
| 3 | $8,000–$25,000 | 20–30% | $100k–$1M | Scaling up |
| 4 | $50,000–$200,000 | 25–35% | $500k–$10M | Empire mode |
| 5 | $500,000+ | 25–40% | $5M+ | Endgame |

If the player is below the bottom of these ranges, they're struggling. If above the top, they may be ready to advance tiers.

---

## 12. Rival Economic Behavior

Rivals follow the same economic model as the player but with personality-modified parameters:

| Parameter | SudsCo | Aurora | Hydro | Pop's |
|-----------|--------|--------|-------|-------|
| Starting cash | $200k | $500k | $1M | $80k |
| Pricing tendency | -10% (cheap) | +15% (premium) | midpoint | +5% (loyalty premium) |
| Curb appeal investment | Low | Very high | Medium | Medium |
| Service tier mix | Basic-heavy | Premium-heavy | Balanced | Balanced |
| Cash reserve floor | $20k | $100k | $300k | $15k |

These create distinct economic signatures the player can read on the city map.

---

## 13. Save Game Economic State

For save/load consistency, the following must persist:

- Cash balance (player + each rival's *estimated* cash)
- All lot states: condition ratings, equipment, upgrades, employees assigned
- All employee states: skill, wage, reliability, weeks employed
- All loans: principal, weeks remaining, payment schedule
- Reputation values per lot (slow-moving EMA, must persist)
- Crisis event cooldowns
- Rival decision state (what they're planning, threat detection state)
- Weekly history (for graphs, weekly review summaries)

---

## 14. Tuning & Playtest Targets

The following metrics are what playtests should measure to validate the economy:

1. **Time to escape Tier 1:** target 30–60 minutes real-time
2. **Time to first new lot:** target 45–90 minutes real-time
3. **First profitable week:** target weeks 2–4 in-game (after initial stabilization investment)
4. **Bankruptcy rate of new players:** target 15–25% (some failure feels real, but most should succeed)
5. **Average campaign length to first win:** target 12–18 hours real-time
6. **Distribution of victory paths:** ideally 40/30/30 or so across the three paths (no single path dominant)

If any of these fall outside target ranges in playtests, specific economic levers to adjust:
- Slow Tier 1 escape → reduce starter lot fixed costs or increase base traffic
- Fast bankruptcy rate → increase Tier 1 loan availability or reduce crisis frequency
- Single victory path dominant → adjust thresholds in win conditions spec

---

## 15. Open Questions / TBD

- Whether to implement seasonal cycles in v1 or v2
- Exact day length / week length in real-time minutes
- Whether weather should be predictable (forecast in advance) or surprise
- Whether to add a "city economy" mega-modifier (recession / boom cycles affecting all neighborhoods)
- Inflation: does base demand grow over in-game years to simulate city growth?
- Specific tuning values pending playtest data
- Whether to add a "negotiation" minigame for lot purchases (haggling) or keep prices fixed

---

*End of economic simulation spec v1*
