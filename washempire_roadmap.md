# Wash Empire — Production Roadmap

*Companion document to washempirebible.md. The complete plan from pre-production through launch and beyond. Defines phases, gates, risks, and decision points.*

**Status:** v1
**Last updated:** April 26, 2026

---

## 1. Roadmap Philosophy

Three principles guide this plan:

1. **Ship at every milestone.** Every phase ends with a build that could theoretically be released (even if not polished). This prevents the "all-or-nothing" trap that kills indie projects.
2. **Gate decisions on data, not feelings.** Each phase has explicit success criteria. If the criteria aren't met, the next phase doesn't start — features are revised, scope is cut, or the project is reassessed.
3. **Marketing starts at Phase 2, not Phase 5.** Indie games die in obscurity, not from lack of features. Building an audience is parallel to building the game, not a final step.

---

## 2. The Five Phases at a Glance

| Phase | Goal | Duration (realistic) | Output |
|-------|------|----------------------|--------|
| 0 | Pre-production | ✅ Complete | Design docs (this set) |
| 1 | Vertical slice | ~13 weeks (revised from 9w after Sprint 2 FP redesign — see `washempire_fpcollection.md` §8.1) | Playable 30-min build, validates core loop |
| 2 | Core loop expansion | 4–6 months | Multi-lot game with employees, first rival |
| 3 | Content & balance | 3–5 months | Full content suite, all rivals, full progression |
| 4 | Polish & launch prep | 2–3 months | Launch-ready build with marketing in place |
| 5 | Launch & post-launch | Ongoing | Public release, patches, community |

**Total realistic timeline: 12–18 months** from end of pre-production to launch, assuming solo dev with consistent part-time hours (~20 hr/week) or focused full-time hours (~40 hr/week for 9–12 months).

---

## 3. Phase 0 — Pre-Production ✅

**Status: Complete.**

Pre-production produced this complete document set:
- ✅ `washempirebible.md` — design bible
- ✅ `washempire_economy.md` — economic simulation spec
- ✅ `washempire_rivals.md` — rival AI spec
- ✅ `washempire_progression.md` — tier progression spec
- ✅ `washempire_employees.md` — employee system spec
- ✅ `washempire_winconditions.md` — win conditions spec
- ✅ `washempire_verticalslice.md` — vertical slice scope
- ✅ `washempire_art.md` — art bible
- ✅ `washempire_content.md` — content library
- ✅ `washempire_roadmap.md` — this document

**Phase 0 gate:** all design docs complete, internally consistent, with clear open questions tracked. ✅ Met.

---

## 4. Phase 1 — Vertical Slice (Weeks 1–~13)

### 4.1 Goal
Build the smallest playable version that validates the core loop. Detailed in `washempire_verticalslice.md`.

### 4.2 Sprint Breakdown

**Sprint 1 (Weeks 1–2): The Loop**
- Unity project setup, version control
- Single-bay scene with car spawning, NavMesh, bay use → cash
- Basic camera controls
- **Sprint exit criteria:** car drives in, uses bay, leaves, +$5

**Sprint 2 (Weeks 2–7.5): The Cycle + FP Cash Collection**
- Sub-phased per `washempire_fpcollection.md` §8: 2A Time & Costs, 2B Bay Cash Accumulation, 2C Office & Stations Geometry, 2D Ritual State Machine, 2E Ritual UX, 2F Card Reader & Polish
- Day/week timer, fast-forward, pause
- Required-task system (cash collection)
- FP cash-collection ritual (overhead → FP camera handoff via Cinemachine, NavMesh-walked stations: bay bins, changer, money counter, coin sifter, terminal)
- Token slippage system, card-reader bypass
- Weekly review screen, save/load v2
- **Sprint exit criteria:** play 4 in-game weeks end-to-end with consistent math, FP ritual completes cleanly each week

**Sprint 3 (Weeks 3–5): The Choices**
- Upgrade panel UI
- All 8 vertical slice upgrades implemented
- Curb appeal → demand modifier
- Equipment condition + breakdown crisis
- Visual upgrade feedback (lot transforms)
- **Sprint exit criteria:** play 30 minutes from $20k start with meaningful decisions

**Sprint 4 (Weeks 5–7): Polish**
- Audio placeholders
- UI polish pass
- Save/load robustness
- Build deployment (Windows .exe)
- **Sprint exit criteria:** functional completeness checklist met (see vertical slice spec Section 8)

**Sprint 5 (Weeks 7–9): Test & Iterate**
- Internal testing
- 3–5 external playtest sessions
- Iterate on top 3 issues
- **Sprint exit criteria:** 3+ of 5 testers want to keep playing

### 4.3 Phase 1 Gate

**Pass conditions:**
- [ ] Vertical slice meets Definition of Done (vertical slice spec Section 8)
- [ ] Playtest hypothesis validated (3+ of 5 testers want to keep playing)
- [ ] No catastrophic technical debt (architecture extensible, save format stable)
- [ ] Visual identity confirmed (testers identify the *Schedule 1*-adjacent style)

**Fail action:** Pause and reassess. Either iterate on the slice further, redesign, or kill the project. Don't proceed to Phase 2 with an unvalidated core loop.

**Pass action:** Begin Phase 2 immediately. Begin Steam page setup in parallel.

---

## 5. Phase 2 — Core Loop Expansion (Months 3–8)

### 5.1 Goal
Expand from a single-lot proof-of-concept to a multi-lot game with employees, neighborhoods, and one rival AI. By the end of Phase 2, the game should *feel* like Wash Empire even if not all content is in.

### 5.2 Major Features Added

**Multi-lot system**
- City map UI (browse and navigate to lots)
- Lot acquisition mechanic
- Lot purchase financing (loans introduced)
- Travel/camera transitions between lots

**Multiple neighborhoods**
- All 5 neighborhoods (working class, suburban, affluent, industrial, tourist)
- Demographic-driven demand
- Neighborhood-specific pricing bands

**Employee system v1**
- Hiring board (weekly candidate refresh)
- Attendant + Maintenance Tech roles
- Wage system, weekly payments
- Reliability/skill ratings

**First rival AI: SudsCo**
- Simplest personality first
- Aggressive expansion, pricing pressure
- Player can see SudsCo's lots on city map
- Basic competition factor in demand

**Reputation system (real)**
- Reputation EMA per lot
- Affects demand multiplier
- Driven by satisfaction, prices, equipment quality

**Pricing system**
- Player can adjust prices per service tier per lot
- Price elasticity affects demand
- Pricing wars trigger when overlapping with SudsCo

**Premium services**
- Detail bay (requires detailer employee — defer to Phase 3)
- Laser/automatic tunnel
- Service tier selection (basic, deluxe, premium for self-serve bays)

**Loans & cash flow**
- Loan office UI
- Loan caps per tier
- Bankruptcy detection and game over

### 5.3 Phase 2 Sprint Breakdown (24-week structure)

| Sprint | Weeks | Focus |
|--------|-------|-------|
| 2.1 | 1–2 | City map UI, lot navigation, multi-lot data structure |
| 2.2 | 3–4 | Lot acquisition, second neighborhood (suburban), demographic demand |
| 2.3 | 5–6 | Loan system, bankruptcy, cash flow polish |
| 2.4 | 7–9 | Employee system v1, hiring board, attendant + maintenance |
| 2.5 | 10–12 | Pricing system, elasticity, all 5 neighborhoods |
| 2.6 | 13–15 | Reputation system, satisfaction tracking |
| 2.7 | 16–18 | First rival (SudsCo) — AI decision loop, threat detection |
| 2.8 | 19–20 | Pricing wars, competition factor, player vs. rival pricing |
| 2.9 | 21–22 | Premium services (bay tiers, laser tunnel) |
| 2.10 | 23–24 | Polish pass, Phase 2 build, internal testing |

### 5.4 Phase 2 Gate

**Pass conditions:**
- [ ] Player can run a 5+ hour campaign across multiple lots
- [ ] All 5 neighborhoods feel mechanically distinct in playtest
- [ ] SudsCo presents a real strategic challenge (not a pushover, not impossible)
- [ ] Employee system creates meaningful hiring decisions
- [ ] No save/load data corruption across sessions

**Fail action:** Identify blocker, allocate additional sprint to fix. If multiple systems are broken, audit and consider scope cut.

**Pass action:** Begin Phase 3. Steam Early Access decision: ship a Phase 2-complete build to Early Access? Reserve for Phase 3?

### 5.5 Marketing in Phase 2

**Begin in parallel with development:**
- Steam page setup (capsule art, screenshots, description)
- Twitter/X account, posting weekly progress GIFs
- Devlog blog or YouTube channel (one update per sprint cycle)
- Reach out to indie game press for awareness
- Set up Discord server for community building

This is **non-optional**. Steam pages with 3+ months of wishlist accumulation perform dramatically better at launch.

---

## 6. Phase 3 — Content & Balance (Months 9–13)

### 6.1 Goal
Fill out the game's content surface and balance it to ship-quality. By the end of Phase 3, the game should be *complete* in features even if rough.

### 6.2 Major Features Added

**Remaining rivals**
- Aurora Auto Spa (premium brand)
- Hydro Holdings (corporate)
- Pop's Wash & Wax (local family)
- All 4 rivals interacting in same campaign
- Acquisition system (player can buy out rivals)
- Player-acquisition-target alternative ending (Hydro hostile takeover)

**Remaining employee roles**
- Detailer (premium service enabler)
- Manager (delegation system, autonomous lot operation)
- Scout/Marketing (Tier 4 strategic role)

**Full upgrade tree**
- All 60+ upgrades from content library
- Tier-gating fully implemented
- Backend operations upgrades (reclaim water, solar, security, etc.)

**Crisis event library**
- Full crisis event catalog (equipment, people, property, market, rival)
- Prevention mechanisms working (cameras → vandalism reduction, etc.)
- Crisis frequency tuned per tier

**Marketing & promotion system**
- Flyer/radio/billboard campaigns
- Loyalty program
- Grand reopening events
- Brand identity customization

**Fleet contracts (B2B)**
- Contract bidding UI
- All 6 contract types
- Tier 4 unlock

**Win conditions implemented**
- Market Dominance victory
- Acquisition victory
- Wealth victory
- 4-week sustain checks
- Victory event presentation

**Difficulty modifiers**
- Easy / Normal / Hard / Empire (NG+) settings
- Configuration UI in main menu

**Achievements**
- Steam achievements integration
- All campaign and operational achievements

### 6.3 Phase 3 Sprint Breakdown (20-week structure)

| Sprint | Weeks | Focus |
|--------|-------|-------|
| 3.1 | 1–2 | Aurora Auto Spa AI, premium neighborhood mechanics |
| 3.2 | 3–4 | Hydro Holdings AI, corporate behavior |
| 3.3 | 5–6 | Pop's Wash & Wax AI, defensive mechanics, all 4 rivals integrated |
| 3.4 | 7–8 | Acquisition system, hostile takeover offer |
| 3.5 | 9–10 | Detailer + Manager employee roles, delegation system |
| 3.6 | 11–12 | Marketing/scout role, marketing campaign system |
| 3.7 | 13 | Full upgrade tree finalization, backend upgrades |
| 3.8 | 14–15 | Crisis event library completion, prevention mechanics |
| 3.9 | 16–17 | Fleet contract system, B2B mechanics |
| 3.10 | 18 | Win conditions, victory presentation, achievements |
| 3.11 | 19–20 | Balance pass — economic tuning, tier pacing, rival difficulty |

### 6.4 Phase 3 Gate

**Pass conditions:**
- [ ] Full campaign playable end-to-end at Normal difficulty
- [ ] All 3 victory paths achievable
- [ ] All 4 rivals present meaningfully different challenges
- [ ] Crisis event frequency feels right (target ranges met)
- [ ] Tier progression pacing within target ranges (vertical slice spec)
- [ ] No hard-blocking bugs in main campaign flow
- [ ] Internal full-campaign playtests successful

**Fail action:** Allocate balance sprint. Consider cutting incomplete features rather than shipping rough.

**Pass action:** Begin Phase 4 polish. Make Early Access vs. full launch decision (see Section 9).

---

## 7. Phase 4 — Polish & Launch Prep (Months 14–16)

### 7.1 Goal
Bring the game to launch-ready quality and execute on launch logistics.

### 7.2 Polish Workstreams

**Audio polish**
- Replace all placeholder audio with final
- Original or licensed soundtrack
- Voice acting decision (if budget allows)
- SFX pass for every interaction

**Visual polish**
- Lighting pass per scene
- Particle effects refinement
- UI animation pass
- Loading screen, splash, branding consistency

**UX polish**
- Onboarding tutorial
- Tooltip system across all UI
- Settings menu (audio, video, controls, accessibility)
- Save management (multiple slots, backup recovery)
- Steam achievements polish

**Performance optimization**
- Profile and optimize hot paths
- Memory profiling (especially late-game with many lots)
- Loading time targets (<10s for save load)
- 60fps minimum on target hardware

**Quality assurance**
- Internal QA pass on all features
- External beta playtest with 20–50 testers
- Bug triage and fix sprint
- Edge case testing (save corruption, weird input, etc.)

**Localization**
- English finalization
- Optional: Spanish, French, German, Portuguese (if budget allows)
- Externalize all strings to localization files

### 7.3 Launch Logistics

**Steam page completion**
- Final capsule art, library art
- 6+ screenshots, 1 trailer
- Final description with feature list
- Tags optimized
- System requirements set

**Marketing push**
- Trailer release 4 weeks before launch
- Press outreach (review keys to streamers, journalists)
- Demo build released on Steam Next Fest if timing aligns
- Discord/community engagement increase
- Social media content calendar

**Pricing decision**
- Indie tycoon market reference: typically $14.99–$24.99
- Wash Empire target: $19.99 launch price (TBD)
- Launch discount: 10–15% week-of-launch
- Wishlist conversion strategy

**Build & distribution**
- Steam build pipeline
- itch.io build
- DRM-free option (for itch)
- Build versioning, hotfix pipeline ready

### 7.4 Phase 4 Sprint Breakdown (12-week structure)

| Sprint | Weeks | Focus |
|--------|-------|-------|
| 4.1 | 1–2 | Audio polish, original soundtrack integration |
| 4.2 | 3–4 | Visual polish, lighting, particles, UI animation |
| 4.3 | 5–6 | UX polish, tutorial, tooltips, settings |
| 4.4 | 7–8 | Performance optimization, memory profiling |
| 4.5 | 9 | External beta playtest |
| 4.6 | 10 | Bug fix sprint based on beta feedback |
| 4.7 | 11 | Marketing push (trailer, press, Steam Next Fest) |
| 4.8 | 12 | Final QA, build pipeline lock, pre-launch readiness |

### 7.5 Phase 4 Gate

**Pass conditions:**
- [ ] All blocker and critical bugs fixed
- [ ] External beta feedback incorporated (top 5 issues addressed)
- [ ] Performance targets met on minimum spec hardware
- [ ] Steam page ready for launch (all assets, copy, store listing)
- [ ] Marketing materials prepared (trailer, screenshots, key art)
- [ ] Wishlist count above target threshold (3000+ for healthy launch, ideally 10000+)

**Fail action:** Delay launch. Better to ship later than to ship broken.

**Pass action:** Schedule launch. Phase 5 begins.

---

## 8. Phase 5 — Launch & Post-Launch (Month 16+)

### 8.1 Launch Window (Day 0 – Week 4)

**Day 0 (Launch Day)**
- Build live on Steam
- Press release / social media announcement
- Discord launch event
- Watch metrics (sales, reviews, performance issues)
- Hotfix readiness on standby

**Week 1**
- Daily monitoring of reviews, bug reports
- Hotfix patches as needed
- Engage with community (Discord, Steam forums)
- Track wishlist conversion rate, sales velocity

**Week 2–4**
- First content patch (small balance updates, bug fixes)
- Continue press engagement
- Sale/discount strategy depending on sales performance

### 8.2 Post-Launch Roadmap (Months 1–6)

**Months 1–3: Stabilization**
- Bug fix patches as needed
- Balance updates based on player data
- Quality-of-life features from community feedback
- First content drop: new lot template, new crisis events

**Months 3–6: Content updates**
- Possible expansion: new neighborhood type, new rival personality
- Mod support evaluation (Steam Workshop)
- Localization expansion (if not done at launch)
- Community-requested features prioritization

### 8.3 Long-Term Considerations

**DLC / Expansion**
- New city/region with different demographics
- New service types (motorcycle wash, RV wash, boat wash)
- Story/campaign mode
- Decision deferred until 6 months post-launch based on sales

**Sequel decision**
- Wash Empire 2 viability based on Wash Empire 1 reception
- Multiplayer/co-op mode as differentiator
- Console port consideration

---

## 9. Early Access vs. Full Launch Decision Tree

A critical strategic decision made at end of Phase 2 or Phase 3.

### 9.1 Early Access Pros
- Earlier revenue
- Community feedback during development
- Lower launch expectations
- More iteration time
- Steam EA tag attracts certain genre fans

### 9.2 Early Access Cons
- "Launches twice" problem (less impact at full launch)
- Risk of EA fatigue if development drags
- Negative reviews stick if EA build is rough
- Marketing harder for EA than full launch

### 9.3 Recommendation Framework

**Choose Early Access if:**
- Phase 2 completes strong and feels close to playable in full
- Budget/runway pressure requires earlier revenue
- Community engagement is high (3000+ wishlists, active Discord)
- Genre comparable EA games have succeeded (yes — *Coffee Inc., Software Inc., Project Highrise*)

**Choose Full Launch if:**
- Phase 3 completes strong and content is robust
- Marketing budget supports a launch push
- Sufficient runway exists to delay revenue
- Risk tolerance is low

**Default recommendation:** **Early Access at end of Phase 3** (around month 13), with a 4–8 month EA period before full 1.0 launch (around month 16–20). This balances the tradeoffs and is the path most successful indie tycoons take.

---

## 10. Risk Register

Major risks that could derail the project, with mitigation strategies.

### 10.1 Schedule Risks

**Risk: Solo dev burnout / loss of momentum**
- **Likelihood:** Medium-High
- **Impact:** Project death
- **Mitigation:** Sustainable pace (avoid 60+ hour weeks), regular breaks, ship at every milestone for ongoing dopamine
- **Early signal:** missing 2+ consecutive sprint goals
- **Response:** take 1-week break, audit scope, possibly cut features

**Risk: Scope creep**
- **Likelihood:** Very High
- **Impact:** Schedule blowout
- **Mitigation:** "Phase 2 ideas" file for new ideas. Do not add to current phase. Ruthless cutlines documented (vertical slice spec Section 9).
- **Early signal:** any feature added that's not in the design docs
- **Response:** stop. Add to deferred list. Re-anchor to current phase scope.

**Risk: Technical debt compounding**
- **Likelihood:** Medium
- **Impact:** Velocity decline over time
- **Mitigation:** Refactor sprints between major phases. Don't carry hacks across phase boundaries.
- **Early signal:** simple changes taking unexpectedly long
- **Response:** allocate refactor sprint before next feature work

**Risk: Sprint 2 redesign mid-build (FP cash collection)**
- A deliberate scope reframe with offsetting cuts (8→6 upgrades). Tracked in `washempire_fpcollection.md` §2.3. Pessimistic timeline 19w breaches §12 cutline; cutline order in §9.3 is the recovery path.

### 10.2 Market Risks

**Risk: Genre saturation at launch**
- **Likelihood:** Medium
- **Impact:** Lower sales than projected
- **Mitigation:** Strong unique identity (*Schedule 1* style + self-serve niche). Build wishlist via consistent marketing.
- **Early signal:** competing self-serve tycoons announced before launch
- **Response:** strengthen differentiation, accelerate or delay launch strategically

**Risk: Schedule 1's audience moves on by launch**
- **Likelihood:** Medium
- **Impact:** Loss of zeitgeist tailwind
- **Mitigation:** Don't depend on the comparison. The game must stand alone. Build other reference points (*Coffee Inc.* fans, tycoon enthusiasts).
- **Early signal:** *Schedule 1* community shrinking
- **Response:** lean less on the comparison in marketing, find other anchors

**Risk: Negative early reviews tank wishlist conversion**
- **Likelihood:** Medium
- **Impact:** High — kills launch
- **Mitigation:** Robust beta playtest, fix top issues before launch, ensure quality bar is met
- **Early signal:** mixed beta feedback
- **Response:** delay launch until fixed. Ship later, ship better.

### 10.3 Technical Risks

**Risk: Save format breaks late in development**
- **Likelihood:** Medium
- **Impact:** Player data loss, refund risk
- **Mitigation:** Save format versioning from Phase 1. Migration scripts. Extensive save/load testing.
- **Early signal:** save corruption in QA
- **Response:** allocate save migration work, never break old saves silently

**Risk: Performance issues with many lots / customers**
- **Likelihood:** Medium
- **Impact:** Late-game becomes unplayable
- **Mitigation:** Profile early and often. Set performance budgets. Consider ECS for customer simulation if needed.
- **Early signal:** framerate drops with 5+ lots active
- **Response:** optimization sprint. Worst case: cap simulation depth at far lots.

**Risk: Asset pipeline issues**
- **Likelihood:** Low-Medium
- **Impact:** Style inconsistency, art quality problems
- **Mitigation:** Style unification process (art bible Section 19.2). Test imported assets early.
- **Early signal:** new assets feel out of place
- **Response:** strengthen unification pass, possibly commission custom work for outliers

### 10.4 Personal Risks

**Risk: Distracted by other projects**
- **Likelihood:** High (given existing project portfolio)
- **Impact:** Project stalls
- **Mitigation:** Treat Wash Empire as primary project. Time-box exploration of other ideas. Schedule discipline.
- **Early signal:** more than 1 week between commits
- **Response:** honest reassessment — is this still the active project?

**Risk: Loss of motivation in mid-development "valley"**
- **Likelihood:** High (around month 6–9 typically)
- **Impact:** Project death
- **Mitigation:** Public-facing devlog creates accountability. Community engagement creates external motivation. Milestone celebrations.
- **Early signal:** "I don't know if I want to keep doing this" thoughts
- **Response:** take a break. Don't quit during the valley — it's universal. Come back with fresh perspective.

---

## 11. Budget Tracking

### 11.1 Expense Categories

| Category | Estimated cost | Notes |
|----------|---------------|-------|
| Asset packs (Synty, etc.) | $100–$300 | One-time |
| Steam direct fee | $100 | One-time, refundable on $1k revenue |
| Audio assets / soundtrack | $0–$2,000 | Free option viable; original is best |
| Voice acting (optional) | $0–$5,000 | Skip for v1 |
| Localization (Phase 4) | $500–$3,000 per language | Skip for v1 if budget limited |
| Marketing (ads) | $500–$2,000 | Optional Steam ads, social ads |
| Press/PR | $0–$1,000 | DIY vs. agency |
| Trailer production (optional) | $500–$3,000 | DIY viable |
| Software (Unity, Blender, etc.) | $0 | Free tools sufficient |
| **Minimum viable budget** | **~$200–$500** | |
| **Realistic target budget** | **~$2,000–$5,000** | |
| **Comfortable budget** | **~$10,000+** | |

### 11.2 Revenue Projections (Conservative)

For a successful indie tycoon launch:
- **Bad launch:** 1k–3k units × $20 = $20k–$60k gross (after Steam 30%)
- **Average launch:** 5k–15k units × $20 = $100k–$300k gross
- **Strong launch:** 30k–100k units × $20 = $600k–$2M gross
- **Breakout:** 100k+ units (Schedule 1 scale)

These are wide ranges. The actual outcome depends on launch quality, marketing execution, market timing, and luck.

### 11.3 Runway Considerations

- Solo dev part-time (20 hr/week): 12–18 months of dev time fits with day job
- Solo dev full-time: requires 9–12 months of personal runway (savings, partner support, etc.)
- Small team (2–3 people): cost scales with people, faster delivery, more risk

---

## 12. Decision Calendar

Key decisions to make at specific times during development.

| When | Decision |
|------|----------|
| End of Phase 1 | Vertical slice validated? Continue, iterate, or pivot. |
| Start of Phase 2 | Steam page setup begins. |
| Mid-Phase 2 | Begin marketing presence (devlog, social). |
| End of Phase 2 | Early Access decision (now or later)? |
| Start of Phase 3 | Localization scope: which languages? |
| Mid-Phase 3 | Audio strategy: original soundtrack or licensed? |
| End of Phase 3 | Early Access launch (if chosen) OR continue to full launch. |
| Start of Phase 4 | Voice acting decision (final). |
| Mid-Phase 4 | Steam Next Fest demo participation. |
| End of Phase 4 | Launch date locked. |
| Day 0 | Launch executed. |
| Month 6 post-launch | DLC/expansion decision. |

---

## 13. Single Page Summary

For quick reference:

**Phase 0:** ✅ Pre-production complete
**Phase 1:** Vertical slice (9 weeks). Validate core loop. Gate: 3+ of 5 testers want to keep playing.
**Phase 2:** Core loop expansion (4–6 months). Multi-lot, employees, first rival, all neighborhoods. Gate: 5+ hour campaign playable. Marketing begins.
**Phase 3:** Content & balance (3–5 months). All rivals, all roles, full upgrade tree, all crisis events, all win conditions. Gate: full campaign at Normal difficulty validated. Early Access decision.
**Phase 4:** Polish & launch prep (2–3 months). Audio, visual, UX polish. Tutorial. Beta. Marketing push. Gate: launch-ready quality.
**Phase 5:** Launch and post-launch. Stabilize, content updates, evaluate expansion.

**Total realistic timeline:** 12–18 months from end of pre-production to launch.

**Total realistic budget:** $2,000–$5,000 cash + dev time.

**Single biggest risks:** scope creep, solo burnout, distraction by other projects.

**Single biggest mitigation:** ship at every milestone, document everything, build community in parallel with development.

---

## 14. Open Questions / TBD

- Whether to bring on a partner (artist? composer? co-developer?) at any phase
- Whether to pursue console ports (Switch, PlayStation, Xbox) or stay PC-only
- Whether to pursue mobile port (significant adaptation work, different audience)
- Specific launch date target — depends on Phase 3 completion
- Whether Steam Next Fest participation aligns with timeline
- Whether to apply for indie game grants (Epic MegaGrants, etc.)
- Whether to pitch to publishers or self-publish (self-publish is default; publisher consideration if extreme funding need)

---

*End of production roadmap v1*
