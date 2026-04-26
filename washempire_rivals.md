# Wash Empire — Rival AI Spec

*Companion document to washempirebible.md. Defines the four rival competitor personalities, their decision-making behavior, and how the player interacts with them across the campaign.*

**Status:** Locked v1 (subject to balance tuning during economic spec pass)
**Last updated:** April 26, 2026

---

## 1. Design Philosophy

The rival system is what makes Wash Empire an empire game instead of a tycoon. Three principles drive every rival decision:

1. **Each rival should require a different counter-strategy.** If beating Rival A and beating Rival B feel the same, the system has failed.
2. **Rivals should feel like *characters*, not just opposing forces.** Their decisions should be predictable enough that experienced players learn to anticipate them, but distinctive enough to be memorable.
3. **Rivals exist to create urgency.** Without rivals, the player can take their time. With rivals, every week of inaction has a cost.

---

## 2. The Roster

Four rival personalities, each with a distinct strategy, weakness, and acquisition flavor. All four are present in every campaign by default. Difficulty modifiers may add or remove rivals (see Section 8).

### 2.1 SudsCo — The Discount Chain
**Tagline:** *"Cheaper than the rest. Faster than you'd like."*

- **Strategy:** Aggressive low-price expansion in working-class and high-traffic neighborhoods
- **Strengths:** Fast lot acquisition, customer volume, price wars
- **Weaknesses:** Low quality scores, high customer churn, thin margins, vulnerable in any pricing war they don't start
- **Visual identity:** Bright yellow/orange, big hand-painted signs, slightly dilapidated lots
- **Capital profile:** Medium starting capital, fast cash velocity, low cash reserves
- **Decision style:** Rapid, opportunistic — moves first, optimizes later

### 2.2 Aurora Auto Spa — The Premium Brand
**Tagline:** *"The detail is in the details."*

- **Strategy:** Slow, deliberate expansion in affluent neighborhoods only. Detail bays and premium services dominate their menu.
- **Strengths:** High margins per lot, strong customer loyalty, hard to dislodge from established affluent areas
- **Weaknesses:** Won't compete in working-class areas (cedes that market entirely), slow to expand, vulnerable to capital starvation if affluent demand tightens
- **Visual identity:** Muted navy/silver, clean modernist signage, manicured landscaping
- **Capital profile:** High starting capital, slow cash velocity, deep reserves
- **Decision style:** Patient, quality-focused — waits for the right lot, then dominates it

### 2.3 Hydro Holdings Inc. — The Corporate Franchise
**Tagline:** *"Wash. Pay. Repeat. (™)"*

- **Strategy:** Methodical citywide expansion with standardized lots. Plays the long game.
- **Strengths:** Most capital of any rival, weathers price wars indefinitely, expands consistently regardless of conditions
- **Weaknesses:** Slow decision-making (takes weeks to react to player moves), generic offering with no neighborhood specialization, vulnerable to nimble competition that exploits the lag
- **Visual identity:** Corporate blue/white, identical signage at every lot, sterile and forgettable
- **Capital profile:** Highest starting capital, slowest cash velocity, near-infinite reserves
- **Decision style:** Bureaucratic — follows a fixed expansion playbook regardless of what's happening around them

### 2.4 Pop's Wash & Wax — The Local Family Business
**Tagline:** *"Three generations strong. Try to take it."*

- **Strategy:** Defends one or two beloved lots in established neighborhoods. Doesn't expand much. Wins on reputation.
- **Strengths:** Massive customer loyalty in their home neighborhoods, near-impossible to outcompete on reputation, immune to most pricing pressure from outsiders
- **Weaknesses:** Tiny capital, doesn't expand, vulnerable to gradual reputation erosion and demographic shifts
- **Visual identity:** Faded but cared-for, hand-lettered signs, family photos in the office, looks dated but loved
- **Capital profile:** Low starting capital, low cash velocity, modest reserves
- **Decision style:** Defensive — reacts to threats but rarely initiates expansion

---

## 3. Decision-Making Architecture

All rivals run on the same underlying decision loop. Personality differences come from **weights** and **thresholds**, not different code paths.

### 3.1 Weekly Decision Cycle (per rival)

Each in-game week, every rival evaluates:

1. **Cash position check** — am I above, at, or below my safety reserve?
2. **Threat assessment** — has any competitor (player or other rival) made a move affecting my lots?
3. **Opportunity scan** — are there available lots, weak competitors, or market gaps?
4. **Action selection** — pick zero or one major action this week, weighted by personality

### 3.2 Possible Weekly Actions

- **Acquire lot** — buy an available lot from the market
- **Upgrade lot** — invest in an existing lot (capacity, services, curb appeal)
- **Reprice** — adjust pricing at one or more lots
- **Marketing campaign** — boost demand at specific lots for several weeks
- **Defensive hold** — do nothing, accumulate cash (only chosen if cash position is poor)
- **Acquisition bid** — buy out a weakened rival (rare, late-game)

### 3.3 Personality Weight Tables

| Action | SudsCo | Aurora | Hydro | Pop's |
|--------|--------|--------|-------|-------|
| Acquire lot | 40% | 15% | 30% | 2% |
| Upgrade lot | 15% | 35% | 20% | 25% |
| Reprice | 25% | 5% | 5% | 10% |
| Marketing | 10% | 20% | 15% | 5% |
| Defensive hold | 5% | 20% | 25% | 50% |
| Acquisition bid | 5% | 5% | 5% | 8% |

These weights are modified by current conditions (low cash → defensive hold spikes, threat detected → response actions take priority).

### 3.4 Neighborhood Preferences

| Neighborhood | SudsCo | Aurora | Hydro | Pop's |
|--------------|--------|--------|-------|-------|
| Working class | High | Avoid | Medium | Defensive only |
| Suburban | High | Low | High | Defensive only |
| Affluent | Low | Very high | Medium | Avoid |
| Industrial | High | Avoid | Medium | Avoid |
| Tourist | Medium | Medium | High | Avoid |

Pop's "Defensive only" means they won't enter the neighborhood unless they already have a lot there.

---

## 4. Threat Response

When a rival detects a threat (player or another rival making a move that affects them), they have a per-personality response window and response style.

| Rival | Detection delay | Response speed | Aggression |
|-------|----------------|----------------|------------|
| SudsCo | 0–1 weeks | Immediate, often overreacts | High |
| Aurora | 1–2 weeks | Measured, only if affluent area threatened | Medium |
| Hydro | 2–4 weeks | Slow, formulaic response | Low |
| Pop's | 0 weeks | Immediate but defensive only | High in home turf, zero elsewhere |

This delay system is what creates *exploitable patterns*. A skilled player learns that they have ~3 weeks to consolidate after Hydro detects them, but only days before SudsCo retaliates.

---

## 5. Pricing War Mechanics

When two competing lots exist in the same neighborhood, pricing pressure activates.

- **Trigger:** Any lot prices below 90% of the neighborhood baseline
- **Effect:** Demand at competitor lots drops by a percentage proportional to the price gap, until competitors respond
- **Escalation:** Each round of repricing increases the demand impact and decreases margins for all participants
- **Exit:** Whoever runs out of cash reserves first loses the war

Rival pricing war behavior:
- **SudsCo** *starts* pricing wars and can sustain them longer than expected (low margins are their normal state)
- **Aurora** never engages in pricing wars — they retreat from the neighborhood instead
- **Hydro** matches prices slowly but has near-infinite reserves to sustain
- **Pop's** matches prices in their home neighborhood only, otherwise ignores

---

## 6. Acquisition System

Rivals become acquisition targets when their position deteriorates. The player can also be acquired by rivals in worst-case scenarios (game over alternative — see Section 7).

### 6.1 Weakness Indicators (per rival)

A rival is "weak" and acquisition-eligible when:
- Cash reserves below their personality minimum for 4+ consecutive weeks
- Market share below 5% of their starting share
- Lost 50%+ of their original lot count
- Negative weekly profit for 6+ consecutive weeks

### 6.2 Acquisition Pricing Formula

```
Acquisition cost = (sum of lot values × weakness modifier) + (annual revenue × multiple)

Weakness modifier:
  - Healthy rival: 1.5x (premium, only desperate buyers pay this)
  - Stressed rival: 1.0x (fair price)
  - Weak rival: 0.7x (discount)
  - Distressed rival: 0.5x (fire sale)

Multiple:
  - SudsCo: 1.5x annual revenue (low margins, lower multiple)
  - Aurora: 4x annual revenue (premium brand commands premium)
  - Hydro: 2.5x annual revenue (corporate baseline)
  - Pop's: 3x annual revenue (loyalty premium)
```

### 6.3 Acquisition Process

1. Player initiates bid through the Rival Dossier screen
2. Rival evaluates against their personality threshold (Pop's almost never sells, Hydro sells when their formula says to, SudsCo sells eagerly when distressed)
3. Negotiation: 1–3 rounds of counter-offers
4. On acceptance: rival's lots transfer to player at current condition, employees stay (player can fire), brand identity is consumed (lots get repainted to player's brand or kept as a sub-brand)

### 6.4 Stretch Goal: Sub-brand Operation
Player can choose to keep an acquired rival's brand identity (Aurora lots stay Aurora-themed) for ongoing reputation bonuses in that rival's specialty. Adds management complexity but rewards strategic acquisitions.

---

## 7. Player as Acquisition Target

If the player's company is severely weakened (criteria mirror Section 6.1), Hydro Holdings — the corporate rival — may attempt a hostile acquisition.

- **Trigger:** Player meets weakness indicators AND Hydro has sufficient cash reserves
- **Offer:** Hydro presents a buyout offer
- **Player options:**
  - Accept → alternative game over with a softer ending ("you cashed out")
  - Reject → game continues, but Hydro may bid again later
- **Bankruptcy rule:** If player rejects and then hits bankrupt + loan-capped, normal failure state applies (hard restart)

This adds narrative texture to failure and gives the player a non-restart exit option in late-game struggles.

---

## 8. Difficulty Modifiers

Optional difficulty scaling adjusts rival behavior:

| Difficulty | Rival count | Starting capital | Aggression | Detection delay |
|------------|-------------|------------------|------------|-----------------|
| Easy | 2 (SudsCo + Pop's) | 75% | -25% | +1 week |
| Normal | All 4 | 100% | 100% | Standard |
| Hard | All 4 | 125% | +25% | -1 week |
| Empire (NG+) | All 4 + custom AI rival | 150% | +50% | 0 weeks |

The Empire difficulty unlocks a fifth rival generated from the player's previous campaign — a "ghost AI" trained on how the player played their last winning run.

---

## 9. Rival UI / Player Visibility

The player sees rivals through:

- **City map** — color-coded lot ownership, real-time updates as moves happen
- **Rival Dossier** — per-rival panel showing: estimated cash, lot count, market share, recent moves, weakness indicators, acquisition cost estimate
- **Weekly review** — rival action summary ("SudsCo opened a new lot in West Side. Aurora upgraded their downtown detail bay.")
- **News feed (stretch)** — in-game tabloid headlines flavoring rival actions ("LOCAL HERO POP'S RAISES PRICES — FANS REVOLT?")

The Dossier numbers should be *estimated*, not exact, with accuracy improving when the player invests in marketing/scout employees. This adds a fog-of-war information layer.

---

## 10. Open Questions / TBD

- Exact cash reserve thresholds per rival
- Whether rivals can ally temporarily against a dominant player
- Whether the player can initiate acquisitions of *individual lots* from rivals (not full buyout)
- Whether rivals can also be acquired by *each other* if player ignores them (probably yes — adds emergent narrative)
- Final naming pass — current names are placeholders pending vibe check

---

*End of rivals spec v1*
