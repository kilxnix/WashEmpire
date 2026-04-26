# Wash Empire — Vertical Slice Scope

*Companion document to washempirebible.md. Defines the smallest playable build that proves the core loop. This is the bridge from design to code.*

**Status:** Locked v1
**Last updated:** April 26, 2026
**Target completion:** 6–10 weeks solo dev

---

## 1. Mission Statement

Build the smallest possible playable version of Wash Empire that answers one question:

> **Is the core loop of "watch cars wash, collect cash, spend cash on upgrades, watch cars wash better" fun for 30 minutes?**

If yes, the full game is worth building. If no, no amount of additional features will save it. **This is the only question the vertical slice exists to answer.**

Everything that doesn't help answer that question is cut.

---

## 2. Test Hypothesis

The vertical slice succeeds if a first-time player:
1. Picks up the controls within 5 minutes without major confusion
2. Reaches a positive-profit state by week 3 in-game
3. Buys at least 3 distinct upgrades in their first 30 minutes
4. At the end of 30 minutes, can articulate what they'd want to do next ("I want to add another bay" / "I want to upgrade the dials" / "I want to fix the broken vacuum")
5. Wants to keep playing past the slice's end

If 4 of 5 are true across most playtests: ship to Phase 2.
If 2 or fewer: redesign before continuing.

---

## 3. What's IN — The Locked Scope

### 3.1 The World
- **One lot, one neighborhood (working-class baseline)**
- 3D environment: small parking-lot-sized scene with 2 bay structures, room for vacuum addition, paint-able exterior walls, signage spot
- Floating overhead camera with rotate (Q/E or right-mouse-drag) and zoom (scroll)
- Time of day: static daylight only (no day/night cycle)

### 3.2 The Cars
- Car prefab(s) — 3–5 visual variants, all share same behavior
- Spawn at lot entrance edge of scene
- NavMesh-driven pathing to an available bay
- Queue if all bays full (max 2 in queue, then balk and leave)
- Use bay (timer-based, 30 in-game seconds = X real seconds depending on time speed)
- Pay coin meter on use → +cash to player
- Drive out

### 3.3 The Bays
- Start with 2 working bays
- Each bay has equipment slots: dials, brushes, soap dispenser
- Equipment has condition (0–100%) — degrades slowly with use
- Below 30% condition → bay can break (crisis event)
- Visual feedback: clean bay vs. degraded bay reads at a glance

### 3.4 Cash & Time
- Starting cash: $20,000
- Cash counter prominent in HUD
- In-game time: 1 in-game day = 30 seconds at normal speed (configurable)
- Day/week tracker in HUD
- Fast-forward button (3x and 10x speeds)
- Pause button

### 3.5 Required Tasks (Daily)
The only required task for the vertical slice: **end-of-week cash collection from coin meters.**
- Cash accumulates in meters during the week
- At week-end, "Collect Cash" task appears in task panel
- Player clicks each bay's coin meter to collect
- Cash transfers to main account
- Cannot fast-forward past Sunday → Monday transition without collecting

Reason for keeping this task: it's the *physical* moment in an otherwise abstract game. Players love cash collection. It's *the* satisfying click.

### 3.6 The Upgrade Tree (Vertical Slice Subset)

Eight upgrades, no more, no less. These are the choices the player makes in 30 minutes:

| # | Upgrade | Cost | Effect |
|---|---------|------|--------|
| 1 | Paint Job | $1,500 | Curb appeal +0.10 → demand +10% |
| 2 | New Signage | $2,500 | Curb appeal +0.10 → demand +10% |
| 3 | Better Dials (per bay) | $1,500 | Customer satisfaction +5%, demand +3% per upgraded bay |
| 4 | Soap Upgrade (per bay) | $800 | Equipment condition decay -20% |
| 5 | Add 3rd Bay | $10,000 | +1 bay capacity |
| 6 | Add Vacuum Station | $2,500 | Secondary revenue +$80–$150/wk |
| 7 | Lighting Upgrade | $2,000 | Curb appeal +0.10 → demand +10% |
| 8 | Equipment Repair Kit | $500 | Restore one bay to 100% condition (consumable) |

Three of these (Paint, Signage, Lighting) stack into a curb appeal package.
Two of these (Dials, Soap) are per-bay equipment upgrades.
One (Bay) is a capacity expansion.
One (Vacuum) is a secondary revenue source.
One (Repair Kit) is reactive maintenance.

**This mix is deliberate.** It covers every category in the full game (cosmetic, equipment, capacity, secondary revenue, maintenance) at minimum scope. If this set is fun, the full game's wider tree will be too.

### 3.7 Demand & Revenue Simulation
- Use the formulas from `washempire_economy.md` Section 3
- Working-class neighborhood: 250 base visits/week
- Apply curb appeal, reputation (start at 1.0x, doesn't change in slice), and capacity check
- Service tier: basic only (price $5)
- No price elasticity in slice — price is fixed at $5

Reason for fixing price: pricing is a *huge* design surface. Better to lock revenue per visit and let upgrades drive demand changes. Pricing returns in Phase 2.

### 3.8 Crisis Event (One Type)
- **Equipment breakdown**: 5–10% chance per week per bay below 50% condition
- When triggered: bay is offline, "Repair?" notification appears
- Repair cost: $500 (or use Repair Kit if owned)
- If left unrepaired, bay generates no revenue and degrades faster

### 3.9 Weekly Review Screen
At the end of each in-game week:
- Revenue this week
- Costs this week (variable + fixed)
- Profit this week
- Cash balance
- "Next Week" button to advance

Simple. No graphs, no trends, no rivals. Just the four numbers.

### 3.10 Save / Load
- Single save slot
- Autosave at end of each week
- Manual save option
- Load on game start

---

## 4. What's OUT — The Explicit Cuts

Every item below is **deferred to Phase 2 or beyond**. Cutting these ruthlessly is what makes the vertical slice shippable. Listing them explicitly here so the dev resists scope creep mid-build.

### 4.1 Out: Multiple Lots
- The slice has *one* lot
- City map: not built yet
- Lot acquisition: not built yet
- Travel between lots: not built yet

### 4.2 Out: Rivals
- No SudsCo, no Aurora, no Hydro, no Pop's
- No competition factor in demand calculation
- No pricing wars
- No acquisition system
- The slice is a single-player against-the-numbers game

### 4.3 Out: Employees
- Player does everything in the slice
- No hiring board, no candidate pool
- No wages
- No managers, no delegation
- Lot is always player-operated

### 4.4 Out: Premium Services
- No detail bays
- No laser tunnels
- Basic wash only
- Service tiers (deluxe, premium) deferred

### 4.5 Out: Loans
- $20k starting capital is all the player has
- No loan office
- If player runs out of cash → soft fail state ("you need to start over"), not full bankruptcy mechanics

### 4.6 Out: Reputation System
- Reputation is a flat 1.0x in the slice
- Customer satisfaction effects on demand are not implemented
- Comes back in Phase 2

### 4.7 Out: Most Crisis Events
- Only equipment breakdown is implemented
- No vandalism, no plumbing, no code violations, no soap supplier hikes
- One crisis type is enough to test "do crises feel right" without scope explosion

### 4.8 Out: Marketing & Campaigns
- No marketing spend
- No promotional events
- Pure organic demand based on lot quality

### 4.9 Out: Tutorial / Onboarding
- One static "start screen" with rules summary
- No interactive tutorial
- Tooltips only on UI elements
- A real onboarding experience is a Phase 4 problem

### 4.10 Out: Audio Polish
- Placeholder sounds only (free / royalty-free)
- One ambient lot loop, one cash collection ding, one car engine
- Music: optional, single track
- Real audio direction comes after vertical slice validates the game

### 4.11 Out: All Achievements / NG+ / Difficulty Settings
- Single difficulty (Normal)
- No achievements
- No NG+
- These exist for the full game, not the slice

---

## 5. Asset Requirements

### 5.1 3D Models Needed
| Asset | Quantity | Source plan |
|-------|----------|-------------|
| Self-serve car wash bay structure | 1 (modular) | Synty POLYGON City or custom from primitives |
| Vacuum station kiosk | 1 | Synty / Kenney free pack |
| Cars (low-poly) | 3–5 variants | Synty POLYGON Vehicles or Kenney Car Kit |
| Lot ground plane (concrete, lines) | 1 | Custom material on Unity plane |
| Signage (modular, swappable) | 2–3 (degraded → upgraded) | Custom, or Synty signage pack |
| Background buildings (parallax) | 5–10 | Synty City pack |
| Coin meter (per bay) | 1 | Custom from primitives |
| Soap dispenser, brush, dryer (per bay) | 3 | Custom or Synty industrial pack |

**Total asset budget target:** $50–$200 in store-bought packs. Most can be sourced free from Kenney.

### 5.2 2D / UI Assets Needed
| Asset | Source plan |
|-------|-------------|
| HUD frame (cash, time, day) | Custom, lo-fi clipboard aesthetic |
| Upgrade panel UI | Custom |
| Weekly review screen | Custom |
| Task panel | Custom |
| Crisis notification popup | Custom |
| Pause/save menu | Custom |
| Icons (8 upgrades + 4 system) | Kenney UI pack or custom |
| Fonts | Free fonts matching Schedule 1 lo-fi feel (DotGothic16, VT323, Space Mono, etc.) |

### 5.3 Audio Placeholder
| Sound | Source plan |
|-------|-------------|
| Ambient lot loop | freesound.org CC0 |
| Car engine idle/drive | freesound.org CC0 |
| Coin meter ding (cash collected) | freesound.org CC0 |
| Bay use loop (water + brushes) | freesound.org CC0 |
| Equipment breakdown alert | freesound.org CC0 |
| Week-end fanfare | freesound.org CC0 |
| Background music (optional, 1 track) | itch.io free music or original |

### 5.4 Style Unification
- One toon shader applied to all 3D assets (low-poly + flat shading + slight outline)
- Limited shared palette enforced via material overrides
- This pass is non-optional — without it, mixed-source assets read as cheap

---

## 6. System Build Order

The order systems get built matters more than which systems exist. Build foundation-up, ship a playable build at every phase.

### Phase 1 — The Loop (Weeks 1–2)
**Goal: a car drives into a bay, waits, leaves, gives me $5. I can do this 50 times in a row and it costs me nothing.**

- [ ] Empty Unity scene with ground plane and one bay structure
- [ ] Floating overhead camera with rotate/zoom
- [ ] Cash counter UI (top of screen)
- [ ] Car prefab with NavMesh agent
- [ ] NavMesh baked on ground plane with bay as goal point
- [ ] Bay trigger zone with use-timer logic
- [ ] On bay use complete: +$5 to cash counter, car drives to exit
- [ ] Car spawner with timed spawn rate
- [ ] **Milestone build:** sit and watch cars come in, use bay, leave, you earn $5 each. The economy of one bay works.

**Cutline if behind schedule:** if Phase 1 is taking >3 weeks, the Unity foundation is wrong. Stop and reevaluate before continuing.

### Phase 2 — The Cycle (Weeks 2–3)
**Goal: the game has a heartbeat. Time advances, weeks pass, cash collection happens.**

- [ ] Day/week tracker system
- [ ] In-game time controller (pause, normal, 3x, 10x)
- [ ] Day/time HUD display
- [ ] Coin meter accumulation (cash builds up at bay, doesn't auto-transfer)
- [ ] End-of-week trigger (Sunday → Monday)
- [ ] Required-task panel UI
- [ ] "Collect Cash" task generation per bay at week-end
- [ ] Click-to-collect interaction on coin meters
- [ ] Block fast-forward past Sunday → Monday until tasks complete
- [ ] Weekly review screen (revenue, costs, profit, cash)
- [ ] Fixed cost calculation (water, electricity, lease for the lot)
- [ ] **Milestone build:** play 4 in-game weeks. Collect cash each week. See the weekly review. Math is consistent.

### Phase 3 — The Choices (Weeks 3–5)
**Goal: upgrades exist and meaningfully change the lot.**

- [ ] Upgrade panel UI (list of 8 upgrades, cost, effect, buy button)
- [ ] Curb appeal system (data structure + visual swap on lot)
- [ ] Demand modifier system (curb appeal → visit rate)
- [ ] Implement Paint Job upgrade (visual + curb appeal)
- [ ] Implement Signage upgrade (visual + curb appeal)
- [ ] Implement Lighting upgrade (visual + curb appeal)
- [ ] Implement Add 3rd Bay (instantiate new bay structure, add to capacity)
- [ ] Implement Add Vacuum Station (place model, add secondary revenue)
- [ ] Implement Better Dials per-bay (visual swap on bay, satisfaction bonus)
- [ ] Implement Soap Upgrade per-bay (visual swap, condition decay reduction)
- [ ] Implement Equipment Repair Kit (consumable, restores condition)
- [ ] Equipment condition system (degrade per use, visual feedback at low condition)
- [ ] Equipment breakdown crisis event (random trigger, repair flow)
- [ ] **Milestone build:** play 30 minutes from $20k start. Buy upgrades. Lot visibly transforms. Crisis events fire. Numbers match design spec.

### Phase 4 — Polish & Test (Weeks 5–8)
**Goal: it doesn't feel like a prototype.**

- [ ] Audio placeholder pass (all 6 placeholder sounds in)
- [ ] UI polish pass (consistent styling, clear hierarchy)
- [ ] Tooltips on all UI elements
- [ ] Pause/save menu
- [ ] Save/load system
- [ ] Single static title screen with start button
- [ ] Game over screen for cash-zero state
- [ ] Tooltip-based onboarding (no interactive tutorial yet)
- [ ] Build deployment (Windows .exe target via Unity Build Settings)
- [ ] **Playtest with 3–5 people, gather data, iterate**

### Phase 5 — Iterate Based on Playtest (Weeks 8–10, optional)
- Fix the 3 most-reported issues
- Tune numbers based on playtest data
- Decide: ship to Phase 2 of full game, or redesign

---

## 7. UI Requirements (Vertical Slice)

### 7.1 Always-Visible HUD
- **Top-left:** Cash balance
- **Top-center:** Day/week, time controls (pause/play/3x/10x)
- **Top-right:** Required tasks panel (collapsed by default)
- **Bottom-left:** Quick stats (current weekly revenue estimate)
- **Bottom-right:** Buttons for Upgrade Panel, Save/Load, Settings

### 7.2 Modal Screens
- **Upgrade Panel:** opens on button click, shows 8 upgrades in scrollable list, current cash visible at top
- **Weekly Review:** opens automatically on Sunday → Monday transition, "Continue" button to dismiss
- **Crisis Notification:** popup when equipment breaks, with Repair button
- **Save/Load Menu:** simple list

### 7.3 Visual Feedback Requirements
- Upgrade purchase: cash counter visibly counts down, lot visibly changes
- Cash collection: coin sound plays, cash number animates up
- Bay use: water/brush animation on car, particles
- Equipment breakdown: red overlay on broken bay, alert sound

If players can't see what their actions did, the game feels dead. This is non-negotiable for tycoon feel.

---

## 8. Definition of Done

The vertical slice is "done" when **all of the following** are true:

### 8.1 Functional Completeness
- [ ] All 8 upgrades buyable, functional, and visually distinct
- [ ] At least 4 weeks of in-game time playable end-to-end
- [ ] Save/load works, no data loss
- [ ] No crashes in normal play
- [ ] Performance: 60fps minimum on a mid-range PC

### 8.2 Design Validation
- [ ] First-time player can reach week 4 without external explanation
- [ ] First-time player buys at least 3 upgrades in 30 minutes
- [ ] Math from `washempire_economy.md` Section 8 (Tier 1 worked example) matches in-game observable values within 10%
- [ ] Crisis event fires and resolves correctly at expected frequency

### 8.3 Tonal Validation
- [ ] Visual style reads as Schedule 1-adjacent (consistent low-poly, limited palette, slightly grimy)
- [ ] At least one playtester unprompted compares it to Schedule 1 or "PS2 indie tycoon"
- [ ] Cash collection moment feels satisfying (visible/audible feedback)
- [ ] Lot visually transforms across upgrades — playtesters notice and comment

If any item above is incomplete, the slice is not done. No "I'll fix it in Phase 2" exceptions for the Definition of Done.

---

## 9. Cutlines (When to Abandon Features)

If schedule slips, cut features in this order. **Do not cut things higher on this list to save things lower.**

### 9.1 Cut First (if slipping by 1–2 weeks)
- Pause/save menu polish — basic save is enough
- Multi-variant car models — 1 car is fine for slice
- Audio placeholder beyond 3 essential sounds
- Tooltips (use static text labels instead)

### 9.2 Cut Second (if slipping by 3–4 weeks)
- Equipment Repair Kit (the consumable upgrade) — leave equipment repair as cash-only
- Equipment breakdown crisis event entirely
- Vacuum station upgrade
- Lighting upgrade

### 9.3 Cut Third (catastrophic schedule failure)
- Reduce upgrade tree from 8 to 5 (Paint, Signage, Dials, Bay, Soap)
- Reduce playable weeks from 4 to 2
- Single car model, no variation

### 9.4 Never Cut
- The core loop (car drives in, uses bay, pays, leaves)
- Cash collection ritual
- At least 3 upgrades that visibly change the lot
- The weekly cycle with fast-forward
- The visual identity (don't ship something that looks generic — better to ship later than to ship without style)

---

## 10. Tooling & Tech Decisions

### 10.1 Unity Version
- **Unity 2022 LTS** (most asset packs compatible, stable, mature)
- URP (Universal Render Pipeline) for stylized look + performance

### 10.2 Key Unity Features Used
- NavMesh for car pathfinding
- Cinemachine for the floating camera
- TextMeshPro for UI text (it's the de facto standard)
- ScriptableObjects for upgrade definitions, crisis event definitions
- Unity's Input System (new) for controls

### 10.3 Code Architecture (Recommended)
- **GameManager** singleton — game state, cash, time
- **LotController** — per-lot state, bay management, demand calculation
- **BayController** — per-bay state, equipment condition, coin meter
- **CarSpawner** — manages car instances, demand → spawn rate
- **CarController** — per-car state machine (driving, queuing, washing, leaving)
- **UpgradeSystem** — upgrade definitions (ScriptableObjects), purchase logic, effect application
- **TimeController** — day/week clock, fast-forward, pause
- **TaskSystem** — required task generation, completion tracking
- **SaveSystem** — JSON serialization to disk

For a vertical slice, simple is better than scalable. Refactor later when full game architecture matters.

### 10.4 Version Control
- Git from day 1
- `.gitignore` for Unity (use github/gitignore template)
- Commit at every milestone (end of each phase, every working build)

### 10.5 Build Targets
- Windows (primary, .exe via Unity Build Settings)
- Optional: Linux (since dev runs Linux on sheltron-land)
- Mac/web/console: deferred to Phase 2+

---

## 11. Playtest Protocol

When the vertical slice is functionally complete, run structured playtests.

### 11.1 Recruit
- 3–5 testers, ideally a mix of: tycoon genre fans, casual gamers, non-gamers
- Solo dev: friends, family, online communities (r/playmygame, indie dev Discords)

### 11.2 Test Session Format
- 30-minute play session, no instructions beyond "see what you can do"
- Observer takes notes (do not coach)
- Record screen if possible
- Post-play 10-minute interview

### 11.3 Questions to Ask
- What did you understand the game was about?
- What did you spend money on first? Why?
- Was there a moment that felt good? Bad?
- What did you want to do that you couldn't?
- Would you play this for an hour? Five hours? Twenty?
- What does the visual style remind you of?

### 11.4 What to Watch For
- **Confusion in first 5 minutes** → onboarding problem (fixable)
- **Indecision in upgrade panel** → upgrade choices unclear, need better tooltips/visual feedback
- **Boredom around minute 15–20** → loop isn't compelling enough, may need more variability
- **Excitement at end** → loop is working, scale up

### 11.5 Decision Criteria After Playtest
- **3+ of 5 testers wanted to keep playing:** ship to Phase 2 of full game
- **1–2 of 5 testers wanted to keep playing:** specific iteration, retest
- **0 of 5 wanted to keep playing:** redesign before continuing — the core loop is broken and no scale-up will fix it

---

## 12. Realistic Timeline

For a solo dev with C# experience and existing trading-indicator-level code skill:

| Phase | Optimistic | Realistic | Pessimistic |
|-------|-----------|-----------|-------------|
| Phase 1: The Loop | 1 week | 2 weeks | 3 weeks |
| Phase 2: The Cycle | 1 week | 1.5 weeks | 2.5 weeks |
| Phase 3: The Choices | 2 weeks | 2.5 weeks | 4 weeks |
| Phase 4: Polish & Test | 1 week | 2 weeks | 3 weeks |
| Phase 5: Iterate | 1 week | 1 week | 2 weeks |
| **Total** | **6 weeks** | **9 weeks** | **14 weeks** |

**Plan for 9 weeks. Treat 6 as best-case and 14 as the cutline at which to seriously reassess.**

If timeline exceeds 14 weeks: the project may have scope or technical issues that aren't getting solved by more time. Step back and audit.

---

## 13. Anti-Patterns to Avoid

Specific failure modes that have killed vertical slices:

### 13.1 Building "the engine" before the game
- Don't build a generic tycoon framework. Build *this game's* version of every system.
- Time spent on flexibility you don't need is time not spent on shipping.

### 13.2 Over-polishing one system while others are stubbed
- All systems should reach 60% before any reaches 90%.
- No feature should be "perfect" until the slice is end-to-end playable.

### 13.3 Adding scope mid-build
- Every feature in this doc was justified. Adding "just one more upgrade" or "a small rival demo" is how slices die.
- Resist. Note the idea in a `phase2_ideas.md` file. Move on.

### 13.4 Letting art block code
- Use placeholder cubes/cylinders if asset sourcing is delayed.
- Code should never wait on art. Art can iterate on a working code skeleton; code cannot iterate on art alone.

### 13.5 Skipping playtest
- The vertical slice exists *for the playtest*. Skipping it defeats the purpose.
- Even 2 playtesters is better than 0.

---

## 14. After the Slice

If the slice succeeds, the immediate next steps for Phase 2 of the full game are:

1. Build the city map (multiple lot system foundation)
2. Add second neighborhood type (suburban) and demographic-driven demand
3. Implement reputation system (real, not flat 1.0x)
4. Add price elasticity (player can adjust prices per service tier)
5. First rival AI (likely SudsCo — the simplest personality)
6. First employee (Attendant role, hiring board)

These are Phase 2 concerns. **They do not exist for the vertical slice.**

---

## 15. Open Questions / TBD

- Final asset pack purchase decisions (after evaluating Synty/Kenney coverage)
- Whether to use new Unity Input System or legacy (probably new for future-proofing)
- Specific tween/animation library (DOTween is standard for indie, free version covers most needs)
- Whether to use Unity's built-in UI Toolkit or uGUI (uGUI for v1 — more documentation, faster prototyping)
- Specific font choices pending visual style validation

---

*End of vertical slice spec v1*
