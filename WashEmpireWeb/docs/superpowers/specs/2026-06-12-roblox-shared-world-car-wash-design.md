# Wash Empire — Roblox Shared-World Car Wash (Design v1)

**Date:** 2026-06-12
**Status:** Approved design, ready for implementation planning (Milestone 1)
**Relationship to existing work:** This is a **new Roblox game** that reuses the *design blueprint* of the existing Wash Empire web build (`WashEmpireWeb`) — the service tiers, upgrade tree, economy shape, and city/progression content. **No code or assets transfer**; the web build is single-player idle/management (Unity/React), Roblox is multiplayer Luau. What carries over is the design, not the implementation.

---

## 1. Concept

A shared-world, multiplayer car-wash **roleplay** game on Roblox. One car wash per server, shared by everyone in it. Players pick a **role** each session: drive in as a **customer car**, or clock in for a **job** (washer; later oil-change tech, cashier). The whole server **levels the wash up together**, unlocking more bays, an oil-change station, and a laser tunnel. Players earn in-game currency for ranks/gear and spend **Robux on cosmetics**.

### Pillars
1. **Embodied & two-sided** — be the *car* or be the *crew*; both sides are active, not idle.
2. **Build it together** — the wash levels up for the whole server; visible, collaborative growth.
3. **Flex & customize** — earn in-game cash for ranks/gear; Robux for premium car cosmetics.

---

## 2. Roles

Players choose a role at a clock-in board (and can switch).

- **Customer** — spawn and drive a car in, get washed (and later oil-changed), pay, drive out.
- **Washer** — claim a bay, clean arriving cars (dirty → clean), get paid per car.
- *(Later milestones)* **Oil-change tech**, **cashier/attendant**.

There is **no per-server owner**. Progression is communal (see §5), so the wash belongs to everyone in the server.

---

## 3. Core Loop

**Car side:** spawn car → drive to entrance → pull into an open bay → car **snaps/locks into the bay** ("park assist," so the wash reads clean visually) → wait while washed → pay (auto on completion) → drive out.

**Crew side:** clock in at a bay → a car arrives → perform the wash action (hold-to-spray / short minigame; **dirt decals visibly fade** as you work) → car pays → you earn **Suds** + the **communal pot ticks up**.

---

## 4. Economy

Two currencies: **Suds** (earned, soft currency) and **Robux** (premium).

- Money is **minted by completed services**, not transferred player-to-player. This is the standard healthy Roblox job-game model and avoids a closed-loop economy death spiral.
- Each completed wash pays the **worker a wage** *and* adds to the **communal pot**.
- Customers do **not** need Suds to be served; completing a full service grants the customer a **small Suds trickle**, so both roles progress and the loop self-sustains.
- **Robux = cosmetics only** (car paints, parts, worker outfits, VIP game pass). **No pay-to-win** — cleaner gameplay and safer under Roblox policy.

Service tiers, prices, and wage scaling are seeded from the web blueprint's economy doc (`washempire_economy.md`) and then tuned for multiplayer pacing during playtests.

---

## 5. Progression & Persistence

- **Personal account = persistent (DataStore):** Suds balance, rank, owned cosmetics, and lifetime stats follow the player across all servers.
- **Communal wash level = per-server session:** each server builds its wash up live during its lifetime and resets when the server empties. This keeps the "build together" moment fresh for every group and avoids a global-max-level dead end. *(Persistent global milestones can be layered in later.)*
- **Unlock ladder (communal, mirrors the blueprint):**
  Bays 1–2 → Bay 3 → Vacuum island → **Oil-change station** → Bay 4 → Laser tunnel → premium services.

---

## 6. The Drivable Vehicle (risk control)

The "be the car" fantasy uses a **real drivable vehicle**, which is the most immersive but the **riskiest** part of Roblox dev (physics jank, flipping, networking). Mitigations, all in from M1:

- Simple **constraint-based chassis** on a `VehicleSeat`.
- **Low speed cap**, **flat and short** lot (spawn near the entrance — minimal driving distance).
- **Anti-flip** stabilization.
- **Gentle or no collision** between queued customer cars.
- **Network ownership** assigned to the driver; **despawn** the car when the player leaves or switches role.
- **Snap-to-bay lock** while washing, so the car is perfectly positioned and the wash looks clean.

We prove **one** well-behaved car before adding variety.

---

## 7. Architecture

- **Server-authoritative.** The server owns all money, wash level, payments, and job state. Clients send *intents* via `RemoteEvents`/`RemoteFunctions`; currency and progression are **never** client-trusted.
- **Persistence:** `DataStoreService` with a **session-lock profile pattern** (ProfileService-style) to prevent save corruption and item duplication.
- **One Place**, organized as:
  - `ServerScriptService` — game systems (economy, wash level, job manager, vehicle spawner, data).
  - `ReplicatedStorage` — RemoteEvents, shared modules/config, car models.
  - `StarterPlayer/StarterPlayerScripts` — client controllers (HUD, role pick, vehicle input).
  - `Workspace` — the lot, bays, stations, clock-in board.
- **Monetization** via `MarketplaceService` — Game Passes (VIP) + Developer Products (cosmetic purchases).

---

## 8. Roadmap

Each milestone is its own spec → plan → build cycle. **Milestone 1 is the scope for the first implementation plan.**

- **M1 — "The Shift" (vertical slice):** small lot, **2 bays**, one drivable customer car, washer job, dirty→clean wash interaction, **server-authoritative** pay → Suds + communal pot, role-pick spawn menu, minimal HUD (Suds + wash-level bar). **No** shop, oil-change, or persistence yet. **Goal: prove the embodied two-role networked loop is fun.**
- **M2 — Progression & persistence:** DataStore profiles, communal unlocks (Bay 3, vacuum), ranks, in-game Suds cosmetics shop.
- **M3 — Oil-change station + Robux:** the Valvoline-style station as a second service/job, `MarketplaceService` cosmetics, game passes.
- **M4 — Retention & polish:** tips, leaderboards, daily rewards, laser tunnel, VFX/sound, mobile controls.

---

## 9. Division of Labor

- **Claude:** writes all Luau, module structure, data model, and **exact Studio steps** (panel/property names, where to click — calibrated for a dev who has used Studio a couple of times).
- **You:** Studio building, model/asset placement, publishing, and playtesting (ideally with 1–2 friends to exercise the multiplayer loop).

---

## 10. Open Questions / Deferred

- Exact wash minigame feel (hold-to-spray vs. timed clicks vs. spray-the-dirty-spots) — decide during M1 planning.
- Where the Roblox source lives (new repo vs. subfolder of this project) — decide at M1 implementation planning.
- Cross-server persistent milestones — deferred past M1.
- Mobile control scheme for driving — deferred to M4 but kept in mind during M1 input design.
- Car variety / customization catalog scope — deferred to M2/M3.

---

*End of design v1.*
