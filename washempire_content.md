# Wash Empire — Content Library

*Companion document to washempirebible.md. The complete inventory of game content: upgrades, crisis events, customer types, lot variations, and other content data. This is the lookup reference during implementation.*

**Status:** v1 baseline — counts and tuning subject to playtest
**Last updated:** April 26, 2026

---

## 1. Design Philosophy

Content quantity matters less than content variety. Three principles:

1. **Every piece of content must be mechanically distinct.** Two upgrades that produce the same effect with different art are dead weight. Content that doesn't change player decisions is bloat.
2. **Content should compound.** Upgrades that combine into emergent strategies are worth more than upgrades that operate in isolation.
3. **Late-game content gates pay-off.** Content unlocked at Tier 4 must feel like a reward for surviving Tiers 1–3, not just "more of the same."

---

## 2. Upgrade Library — Complete Tree

### 2.1 Lot Cosmetic Upgrades (Curb Appeal)

These upgrades stack to 1.5x curb appeal multiplier and drive visible lot transformation.

| ID | Name | Cost | Effect | Tier unlock |
|----|------|------|--------|-------------|
| COSM_PAINT_01 | Basic Paint Job | $1,500 | Curb appeal +0.10 | 1 |
| COSM_PAINT_02 | Premium Paint Job | $4,500 | Curb appeal +0.20 (replaces basic) | 2 |
| COSM_SIGN_01 | Replacement Signage | $2,500 | Curb appeal +0.10 | 1 |
| COSM_SIGN_02 | Backlit Signage | $7,000 | Curb appeal +0.15, emissive | 2 |
| COSM_SIGN_03 | Branded Marquee | $15,000 | Curb appeal +0.20, brand identity boost | 3 |
| COSM_LIGHT_01 | Basic Lighting Upgrade | $2,000 | Curb appeal +0.10, enables night ops | 1 |
| COSM_LIGHT_02 | Decorative Lighting | $5,500 | Curb appeal +0.15 | 3 |
| COSM_LAND_01 | Basic Landscaping | $3,000 | Curb appeal +0.05, +small satisfaction | 2 |
| COSM_LAND_02 | Premium Landscaping | $8,000 | Curb appeal +0.10, +medium satisfaction | 3 |
| COSM_BRAND_01 | Brand Identity Package | $12,000 | Lot adopts player brand, +reputation | 3 |

### 2.2 Bay Equipment Upgrades

Per-bay upgrades that improve customer satisfaction, equipment longevity, and revenue per use.

| ID | Name | Cost (per bay) | Effect | Tier unlock |
|----|------|----------------|--------|-------------|
| BAY_DIAL_01 | Better Dials | $1,500 | Satisfaction +5%, demand +3% | 1 |
| BAY_DIAL_02 | Premium Dials | $3,500 | Satisfaction +10%, demand +5% | 2 |
| BAY_SOAP_01 | Soap Upgrade | $800 | Equipment decay -20% | 1 |
| BAY_SOAP_02 | Premium Chemicals | $2,500 | Equipment decay -40%, satisfaction +5% | 2 |
| BAY_BRUSH_01 | Soft Brush Upgrade | $1,200 | Satisfaction +5%, fewer complaints | 1 |
| BAY_BRUSH_02 | Touchless Wash Module | $6,000 | Satisfaction +15%, premium clientele draw | 3 |
| BAY_DRYER_01 | Heated Air Dryer | $3,500 | Satisfaction +10%, deluxe service quality | 2 |
| BAY_DRYER_02 | Hurricane Dryer | $9,000 | Satisfaction +15%, premium service quality | 3 |
| BAY_PRESOAK_01 | Pre-soak Module | $2,200 | Adds pre-soak option, satisfaction +5% | 2 |
| BAY_UNDER_01 | Undercarriage Module | $4,500 | Adds undercarriage option, premium pricing | 3 |
| BAY_WAX_01 | Spray Wax Module | $3,800 | Adds wax option, satisfaction +10% | 2 |
| BAY_WAX_02 | Hot Wax Module | $8,500 | Premium wax option, satisfaction +15% | 3 |
| BAY_PAY_01 | Coin Acceptor Upgrade | $600 | Reduces meter jam crises | 1 |
| BAY_PAY_02 | Card Reader | $2,800 | Enables card payment, +5% revenue ceiling | 2 |
| BAY_PAY_03 | App Pay / Loyalty | $7,500 | App pay enabled, +10% revenue ceiling, repeat customer bonus | 4 |

### 2.3 Capacity Expansion

Adding bays, vacuum stations, and lot footprint.

| ID | Name | Cost | Effect | Tier unlock |
|----|------|------|--------|-------------|
| CAP_BAY_01 | Add Self-Serve Bay | $10,000 | +1 bay capacity | 1 |
| CAP_VAC_01 | Add Vacuum Station | $2,500 | Secondary revenue, +small demand | 1 |
| CAP_VAC_02 | Add Premium Vacuum (heated) | $5,500 | Higher per-use price, premium clientele | 3 |
| CAP_LOT_01 | Buy Adjacent Parcel (Small) | $25,000 | +1 zoning slot for new structures | 2 |
| CAP_LOT_02 | Buy Adjacent Parcel (Large) | $80,000 | +3 zoning slots for new structures | 3 |
| CAP_TUNNEL_01 | Laser/Automatic Tunnel | $35,000 | High-throughput tier, requires zoning slot | 3 |
| CAP_TUNNEL_02 | Express Tunnel (premium) | $90,000 | Highest throughput, premium service tier | 4 |
| CAP_DETAIL_01 | Detail Bay | $20,000 | Premium service tier, requires detailer employee | 3 |
| CAP_DETAIL_02 | Premium Detail Studio | $55,000 | High-end detail services, requires high-skill detailer | 4 |

### 2.4 Backend / Operations Upgrades

Cost reduction and operational efficiency upgrades.

| ID | Name | Cost | Effect | Tier unlock |
|----|------|------|--------|-------------|
| BACK_RECLAIM_01 | Reclaim Water System | $25,000 | Water cost -65% | 3 |
| BACK_BULK_01 | Bulk Chemical Storage | $8,000 | Variable cost -25% | 2 |
| BACK_BULK_02 | Industrial Storage | $22,000 | Variable cost -40% | 4 |
| BACK_SEC_01 | Security Cameras | $2,500 | Vandalism crises -50% | 2 |
| BACK_SEC_02 | Premium Security System | $7,500 | Vandalism crises -75%, lower insurance | 3 |
| BACK_OFFICE_01 | Office / Management Hub | $12,000 | Required for managers, employee comfort | 3 |
| BACK_OFFICE_02 | Premium Office | $30,000 | Better employee retention, +scout effectiveness | 4 |
| BACK_SOLAR_01 | Solar Panels | $40,000 | Electricity cost -75% | 4 |
| BACK_AUTO_01 | Automated Maintenance System | $35,000 | Equipment decay -60%, fewer crises | 4 |

### 2.5 Marketing & Promotion (Tier 3+)

Demand-boosting investments.

| ID | Name | Cost | Effect | Tier unlock |
|----|------|------|--------|-------------|
| MARK_FLYER_01 | Flyer Campaign | $1,500 | +15% demand for 4 weeks (one lot) | 3 |
| MARK_RADIO_01 | Local Radio Spot | $5,000 | +10% demand for 8 weeks (citywide) | 3 |
| MARK_BILLBOARD_01 | Billboard Ad | $12,000 | +15% demand for 12 weeks (one neighborhood) | 4 |
| MARK_GRAND_01 | Grand Reopening | $3,000 | +30% demand for 2 weeks (one lot) | 3 |
| MARK_LOYALTY_01 | Loyalty Program | $8,000 | Repeat customer rate +25%, ongoing | 3 |
| MARK_CORP_01 | Corporate Outreach | $15,000 | Unlocks fleet contract bidding | 4 |

### 2.6 Brand Identity Upgrades (Cosmetic, late-game)

Customizing player's empire identity.

| ID | Name | Cost | Effect | Tier unlock |
|----|------|------|--------|-------------|
| BRAND_NAME_01 | Brand Renaming | $5,000 | Change company name | 2 |
| BRAND_PALETTE_01 | Brand Palette Change | $3,000 | Switch to alt color scheme | 2 |
| BRAND_LOGO_01 | Custom Logo | $8,000 | Visual brand identity update | 3 |
| BRAND_UNIFORM_01 | Employee Uniforms | $4,500 | Visual brand identity, +small reputation | 3 |
| BRAND_FLAGSHIP_01 | Flagship Lot Designation | $25,000 | One lot becomes flagship, +reputation citywide | 4 |

---

## 3. Crisis Event Library

Crisis events trigger weekly based on lot conditions and random chance. Each has prevention factors and resolution costs.

### 3.1 Equipment Crises

| Event | Trigger condition | Cost | Prevention |
|-------|-------------------|------|-----------|
| Minor equipment breakdown | Bay condition <50%, weekly random | $500–$1,500 | Maintenance tech, regular repairs |
| Major equipment failure | Bay condition <30%, weekly random | $3,000–$8,000 | Maintenance tech, equipment replacement |
| Plumbing emergency | Random, lot age modifier | $2,000–$6,000 | Reclaim water system reduces frequency |
| Electrical fault | Random, lot age modifier | $1,500–$4,000 | Solar panels, premium lighting |
| Coin meter jam | Random, low-tier coin acceptor | $200–$500 | Coin acceptor upgrades |
| Card reader failure | Random, requires card reader | $400–$800 | Newer payment systems |

### 3.2 People Crises

| Event | Trigger condition | Cost | Prevention |
|-------|-------------------|------|-----------|
| Customer complaint payout | Low satisfaction, random | $200–$1,000 | Maintain satisfaction above 70% |
| Customer injury claim | Severe equipment fault, lot in disrepair | $5,000–$20,000 | Maintenance, security, lot condition |
| Employee injury | Random, prevention via training | $1,000–$5,000 | Employee training, manager presence |
| Employee theft | Low manager skill, random | $500–$3,000 | Manager skill, security cameras |
| Walkout / strike | Wage below market for 4+ weeks | Lot offline 1–3 weeks | Pay market rate, retain managers |

### 3.3 Property Crises

| Event | Trigger condition | Cost | Prevention |
|-------|-------------------|------|-----------|
| Vandalism (small) | Random, neighborhood modifier | $500 | Security cameras |
| Vandalism (severe) | Random, low security | $3,000–$10,000 | Premium security, lighting upgrades |
| Theft (chemical/equipment) | Low security, random | $1,000–$4,000 | Security upgrades |
| Weather damage (storm) | Seasonal, random | $1,500–$8,000 | Lot quality (not directly preventable) |
| Code violation | Lot in disrepair, random inspection | $1,000–$5,000 | Maintain lot condition |
| Permit lapse | Random, infrequent | $800–$2,500 | Background "compliance" investment (TBD) |

### 3.4 Market Crises

| Event | Trigger condition | Cost / Effect | Prevention |
|-------|-------------------|---------------|-----------|
| Soap supplier price hike | Random | +20% variable cost for 4 weeks | Bulk storage upgrade |
| Water bill hike | Random, citywide | Fixed cost +15% for 8 weeks | Reclaim water system |
| New regulation | Random, infrequent | Compliance cost $5,000–$25,000 | None (annual fixed cost) |
| Recession | Random, infrequent | -25% demand citywide for 12 weeks | Cash reserves |
| Boom period | Random, infrequent | +25% demand citywide for 12 weeks | (Positive event) |

### 3.5 Rival-Triggered Crises

These come from rival actions, not random chance.

| Event | Trigger | Effect |
|-------|---------|--------|
| Rival opens nearby | Rival decision | Demand impact via competition factor |
| Rival pricing war | Rival decision | Pricing pressure on overlapping lots |
| Rival employee poach | Rival decision (Tier 4+) | High-skill employee may leave for rival |
| Rival corporate espionage | Rival decision (stretch) | Brief intel leak / sabotage event |

### 3.6 Crisis Frequency Targets

Total crises per lot per year (in-game) should average:
- Tier 1 lot: 4–6 crises/year (mostly minor)
- Tier 3 lot: 6–10 crises/year (mix of minor and major)
- Tier 5 lot: 8–14 crises/year (more crises but also more capacity to absorb)

If a lot has zero crises in a year, the system isn't firing enough. If a lot has 20+ crises in a year, the system is over-tuned and frustrating.

---

## 4. Customer Types

Customer types drive demand, revenue mix, and satisfaction sensitivity per neighborhood.

### 4.1 Customer Archetypes

| Archetype | Found in | Service tier preference | Price sensitivity | Loyalty |
|-----------|----------|------------------------|-------------------|---------|
| Working Commuter | Working class, Suburban | Basic 80%, Deluxe 20% | High (cost-sensitive) | Medium |
| Family Driver | Suburban | Deluxe 60%, Basic 30%, Premium 10% | Medium | High |
| Affluent Owner | Affluent | Premium 60%, Detail 30%, Deluxe 10% | Low (will pay for quality) | Very high if quality met |
| Fleet Driver | Industrial | Basic 90%, Deluxe 10% | High (bulk pricing expected) | Locked by contract |
| Tourist | Tourist | Deluxe 60%, Premium 30%, Basic 10% | Low (captive market) | None (one-time) |
| Truck/Work Vehicle | Working class, Industrial | Basic 70%, Undercarriage 30% | High | Medium |
| Sports Car Owner | Affluent | Detail 50%, Premium 40%, Touchless 10% | Very low | High if detail quality met |
| Beater Driver | Working class | Basic 95%, none 5% (vacuum only) | Very high | Low |

### 4.2 Customer Generation

Each visit generates a customer based on neighborhood demographic mix:

```
For each visit:
  archetype = random_weighted_choice(neighborhood_archetype_weights)
  vehicle_type = random_weighted_choice(archetype.vehicle_pool)
  service_choice = random_weighted_choice(archetype.service_preferences)
  satisfaction_sensitivity = archetype.sensitivity_modifier
```

### 4.3 Repeat Customers

A small percentage of visits are *repeat customers* — they remember a previous experience and prefer or avoid your lot:

- Base repeat rate: 15% of visits
- With Loyalty Program upgrade: 35% of visits
- With premium reputation (>1.2x): 25% of visits
- Repeat customers are 30% more sensitive to satisfaction (good experiences boost rep faster, bad experiences hurt more)

---

## 5. Lot Variations / Templates

Lots come in template variations that determine starting state and zoning capacity.

### 5.1 Lot Templates

| Template | Bays at start | Zoning slots | Starting condition | Typical cost |
|----------|--------------|--------------|-------------------|--------------|
| Distressed Self-Serve | 2 | 3 | Decrepit | $30k–$60k |
| Standard Self-Serve | 3 | 4 | Standard | $80k–$150k |
| Premium Self-Serve | 4 | 5 | Standard or Upgraded | $200k–$350k |
| Conversion Lot (gas station) | 1 | 4 | Decrepit (requires conversion) | $40k–$80k + $30k conversion |
| Existing Detail Shop | 0 (1 detail bay) | 3 | Standard | $120k–$220k |
| Industrial Truck Wash | 2 (large) | 4 | Standard | $150k–$280k |
| Tourist Trap Combo | 2 | 5 | Standard, with shop | $250k–$500k |

### 5.2 Zoning Slots

Zoning slots represent the lot's capacity for additional structures:
- 1 slot per bay
- 1 slot per vacuum station
- 1 slot per tunnel
- 1 slot per detail bay
- 1 slot per office/back-of-house structure

A 3-slot lot with 2 starting bays has 1 slot left for expansion. Buying adjacent parcel adds slots.

### 5.3 Lot Special Features (Random)

Some lots have one or two random "special features" affecting their gameplay:

- **Corner location** — +20% drive-by traffic (better than mid-block)
- **Highway adjacent** — +30% commuter traffic
- **Strip mall anchor** — +15% demand from foot traffic
- **Residential adjacency** — -10% demand (noise complaints)
- **Recently renovated** — starts at Standard condition instead of Decrepit
- **Historic designation** — +reputation bonus, but can't modify exterior aggressively
- **Easement/access issue** — -20% demand until resolved (requires $X cash)

These add narrative texture and variety in lot acquisition decisions.

---

## 6. Fleet Contracts (Tier 4+)

Late-game B2B revenue stream. Player bids on contracts for steady volume from fleet operators.

### 6.1 Contract Types

| Contract | Volume | Revenue/week | Duration | Requirements |
|----------|--------|--------------|----------|--------------|
| Local Taxi Co. | 50 cars/week | $1,200 | 26 weeks | Standard self-serve, near commercial |
| Delivery Van Fleet | 80 vans/week | $2,400 | 52 weeks | Industrial-zoned lot, undercarriage option |
| Rental Car Agency | 100 cars/week | $4,000 | 52 weeks | Quality reputation, near airport/transit |
| Municipal Vehicle Wash | 40 vehicles/week | $1,800 | 104 weeks | Industrial-zoned, security clearance |
| Limousine Service | 20 cars/week | $3,000 | 26 weeks | Detail bay + premium reputation |
| School Bus Maintenance | 30 buses/season | $8,000/season | Annual | Industrial lot, high capacity |

### 6.2 Contract Mechanics

- Contracts appear weekly in a "Bidding" panel (Tier 4 unlock)
- Player bids — lowest qualified bid wins, with reputation tiebreaker
- Contracts lock in revenue for the duration but consume bay capacity
- Failure to fulfill contract (lot offline, capacity overrun) → penalties
- Successful contract completion → reputation boost + renewal opportunity

---

## 7. Employee NPC Names & Backgrounds (Flavor)

For employee character flavor in the hiring board. These are sample names/backgrounds the system rotates through.

### 7.1 Sample Attendant Backgrounds
- "Former gas station manager. Steady hands, hates small talk."
- "Just out of high school. Eager but green."
- "Retired postal worker, picking up extra shifts."
- "Ex-mechanic, knows engines better than soap."
- "College student paying tuition. Studies between customers."
- "Career service industry. Has seen everything."

### 7.2 Sample Maintenance Tech Backgrounds
- "Twenty-year HVAC veteran. Can fix anything that hums."
- "Self-taught from YouTube. Cheap, slightly chaotic."
- "Former dealership mechanic. Expensive but reliable."
- "Apprentice, eager to learn the trade."
- "Old-timer, retired but bored. Half the wage, full the skill."

### 7.3 Sample Detailer Backgrounds
- "Trained at a luxury auto dealership. Knows leather and chrome."
- "Mobile detailer building a portfolio. Picky about chemicals."
- "Former NASCAR pit crew. Fast, clean, expensive."
- "Self-taught Instagram detailer. Strong opinions about wax."
- "Old-school detailer. Refuses to use machines for paint correction."

### 7.4 Sample Manager Backgrounds
- "Former regional manager at fast food. Knows operations."
- "Owned a small business that closed during the recession."
- "MBA, climbing the ladder. Will leave when offered better."
- "Career industry insider. Steady, dependable, will retire here."
- "Family business expat looking for new chapter."

These should rotate through procedurally combined with name generators. Adds personality without requiring deep characterization.

---

## 8. Achievement / Goal Library

Long-tail goals that extend playtime beyond core campaign.

### 8.1 Campaign Achievements
- **Wash Tycoon** — Win all three victory paths in a single campaign
- **Empire Builder** — Own 20+ lots simultaneously
- **Brand Identity** — Win the campaign with all lots specialized in one tier
- **No Loans Allowed** — Win the campaign without taking out a single loan
- **Underdog** — Win the campaign starting on Hard difficulty
- **Speedrun** — Win the campaign in under 10 in-game years
- **Pacifist** — Win without ever undercutting a rival's price
- **Aggressor** — Win Market Dominance via Acquisition Victory
- **Pop's Approves** — Win the campaign without acquiring or bankrupting Pop's Wash & Wax

### 8.2 Operational Achievements
- **Spotless Record** — One year without a single equipment breakdown crisis
- **Untouchable** — One year without vandalism at any lot
- **Five-Star Service** — Maintain >1.25x reputation across all lots for 6 months
- **Big Boss** — Have 10+ employees on payroll simultaneously
- **Cost Cutter** — Achieve 50%+ profit margin at any lot for 4 weeks
- **Volume Champion** — Service 1,000+ cars in a single week
- **Diversified** — Own at least one lot in every neighborhood type

### 8.3 Hidden / Easter Egg Achievements
- **Foam Party** — Trigger 10 soap-related crises in a single campaign (intentionally bad management)
- **Pop's Final Stand** — Reduce Pop's to one lot and let them survive the campaign
- **Hostile Takeover** — Get acquired by Hydro and accept the deal (alternative ending)
- **Zero to Empire** — Win starting from Distressed lot with no upgrades for first 4 weeks

---

## 9. Tutorial / Onboarding Content

For Phase 4 of vertical slice and Phase 1 of full game polish.

### 9.1 First-Run Tutorial Flow (Phase 4 / Full Game)

**Stage 1: The Lot (5 minutes)**
- "Welcome to your new car wash. It's a fixer-upper."
- Highlight the cash counter, the lot, the bays
- "Cars will come on their own. Let's see what happens."
- Wait for first car, highlight the wash cycle, the cash collection

**Stage 2: The Cycle (5 minutes)**
- Highlight time controls, fast-forward
- "Every Sunday, you'll need to collect the week's cash."
- Walk player through first week-end review
- Show profit calculation

**Stage 3: The Choices (5 minutes)**
- Highlight upgrade panel
- "Spending money makes more money. But what to spend it on?"
- Offer suggested first upgrade (paint or signage typically)
- Show visual transformation
- "Now wait a week and see the difference."

**Stage 4: Free Play (15+ minutes)**
- Tutorial ends
- Player runs the lot at their own pace
- Tooltips remain available on hover

### 9.2 Tooltip Content (Examples)

- **Cash counter:** "Your liquid cash. Spend it on upgrades or save for a new lot."
- **Bay status indicator:** "Green = open. Yellow = in use. Red = broken."
- **Coin meter:** "Click to collect. Don't let it sit too long — there's a limit."
- **Upgrade button:** "Spend money to make money. Each upgrade has a payback period."

### 9.3 Hint System (Late-Game)

Optional contextual hints appear when the player seems stuck:
- "You haven't collected cash in 2 weeks. Click the coin meters."
- "Your equipment is degrading. Consider hiring a maintenance tech."
- "Pop's is undercutting you in West End. Match prices or upgrade signage."

These should be opt-in and easily disabled by experienced players.

---

## 10. Audio Content List (Full Game)

### 10.1 SFX Library Required

| Category | Sounds needed |
|----------|--------------|
| Cash | Coin drop, bill rustle, register ding, week-end cha-ching |
| Cars | Engine idle (3 variants), engine start, engine off, door close, drive away |
| Wash equipment | Water spray, brush whirr, dryer blow, suds bubble, vacuum hum |
| UI | Click, hover, paper rustle, stamp, page flip, error buzz |
| Alerts | Equipment breakdown, crisis siren, new lot available, week-end fanfare |
| Ambience | Lot ambience (wind, distant traffic), neighborhood ambience (per type) |
| Employees | Walk steps, working sound, idle whistle |
| Music | Main theme, ambient cycle, victory stinger, defeat stinger |

### 10.2 Music Direction
- Lo-fi electronic with slight off-key melancholy
- Reference: *Schedule 1*'s soundtrack tone, *Lethal Company*'s ambient menus, *Disco Elysium*'s background loops
- Original composition or licensed CC0/itch.io tracks
- Player can adjust music volume independently of SFX

### 10.3 Voice Acting
- **None planned for v1.** Text-only dialogue, no spoken lines.
- Stretch goal: hire VAs for rival "personalities" in Phase 4+ if budget allows.

---

## 11. Localization Targets

Phase 4+ localization plan:

- Primary: English (development language)
- Secondary tier: Spanish, French, German, Brazilian Portuguese (largest indie audiences)
- Tertiary: Russian, Simplified Chinese, Japanese (if community interest)
- All UI text must be externalized to localization files from day 1 — no hardcoded strings in code

---

## 12. Open Questions / TBD

- Final crisis frequency tuning per tier
- Whether to add "lawsuits" as a major crisis category (could be powerful or annoying)
- Whether achievement system uses Steam achievements API or custom solution
- Whether fleet contracts should have negotiation mechanics or fixed bid system
- Whether to add a "weather forecast" UI panel (helps planning) or keep weather random surprise
- Lot template count for v1 — six listed but may need fewer to reduce scope
- Whether to add "specialty contracts" (one-off jobs like "wash all cars in this parade") for variety

---

*End of content library v1*
