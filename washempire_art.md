# Wash Empire — Art Bible

*Companion document to washempirebible.md. Defines the complete visual identity of Wash Empire: style, palette, materials, character/vehicle/environment design, UI, and the asset pipeline that ties it all together.*

**Status:** Locked v1
**Last updated:** April 26, 2026

---

## 1. Visual Mission Statement

Wash Empire's visual identity is **"a slightly grimy world rendered with deliberate jank, where every upgrade you make is *seen*."**

Three things must always be true on screen:
1. The world looks lived-in, not pretty
2. The style is consistent enough to feel intentional, not cheap
3. Every player action produces visible feedback

If a screenshot of the game doesn't communicate "this is its own thing," the visuals are failing.

---

## 2. Style Pillars

Four non-negotiables. Every art decision must defend against these.

### 2.1 Consistent Jank
The PS1/PS2-era aesthetic isn't an excuse for low quality — it's a *rule set* that must be applied uniformly. Every asset commits to the same visual rules, or the spell breaks. Mixed-fidelity is the death of stylized games.

### 2.2 Legibility Over Beauty
The player needs to identify, at a glance from the floating camera: which bay is in use, which is broken, which is upgraded, which neighborhood they're in, who owns each lot. **If a player can't read the state from the visuals in 2 seconds, the visual design is failing.**

### 2.3 Visible Progression
Every upgrade must be *seen*. If the player buys "Better Dials" and the bay looks identical, the upgrade feels fake. Visible feedback is what makes tycoon progression feel real.

### 2.4 Tonal Weight
The game is satirical-deadpan, not slapstick. The world feels mildly oppressive, mildly funny, mildly sad — like a real strip mall on a Tuesday afternoon. Visual humor comes from *specificity* (the exact wrong color of yellow, the slightly-too-tall sign, the broken light flickering) not exaggeration.

---

## 3. Reference Anchors

### 3.1 Primary Reference: *Schedule 1*
The visual north star. Specific properties to study and emulate:
- Low-poly 3D with deliberate roughness
- Limited, slightly desaturated palette
- Slightly wonky character proportions
- Affine-mapped texture warping on surfaces
- Vertex snap / jitter on movement (the PS1 wobble)
- Sharp/dithered shadows, no soft shadow blurring
- Diegetic UI pieces (clipboards, paper documents) when possible
- The *consistency of commitment* to the aesthetic — nothing in the world breaks the rule set

### 3.2 Secondary References
- **Lethal Company** — for atmospheric grimy-low-poly mood and stylized lighting
- **Cruelty Squad** — for color choices and UI willingness to be ugly on purpose (we won't go this far, but study it)
- **Project Zomboid** — for the "lived-in stripmall America" mood and prop density
- **Crazy Taxi / Beetle Adventure Racing** — for low-poly vehicles that have personality
- **Tony Hawk's Pro Skater 2** — for environmental color palettes and small-town American feel

### 3.3 Anti-References
Things this game must **not** look like:
- **Two Point Hospital** — too clean, too cartoony, too pixar-bright
- **Theme Hospital** — wrong era, wrong vibe (we're 3D, not isometric pixel)
- **Mobile tycoon games** — saturated, candy-colored, popups everywhere
- **Modern PBR / unity-asset-store-default** — no realistic materials, no ambient occlusion baking, no chrome
- **Roblox** — primitive doesn't mean simple-block-toy

---

## 4. Color Palette

### 4.1 The Master Palette

A constrained palette of 32 core colors enforces visual unity. All assets ship using only this palette (with grayscale and alpha variations allowed).

**Environment / Base World**
- Concrete: `#7A7570` `#5C5852` `#3D3A36`
- Asphalt: `#2E2C2A` `#1F1D1B`
- Faded yellow lines: `#BFA85A`
- Sky: `#A8B8B5` (overcast default), `#C9B785` (warm dusk option)
- Building beige: `#A89878` `#8C7E62`
- Building brick red: `#7A463A` `#5A332A`
- Vegetation muted green: `#5A6B4E` `#3F4D38`

**Player Feedback / Highlights**
- Cash / profit green: `#7AA85C`
- Bright accent yellow: `#D9B84A`
- Warning orange: `#C97A3A`
- Crisis red: `#A8453A`
- UI white: `#E8E0D0` (warm-tinted, not pure white — pure white is too clean)

**Customer / Vehicle Variety**
- Car palette: `#7A8A9A` (muted blue), `#A85A4A` (faded red), `#5A6A4A` (avocado green), `#8A7A5A` (tan), `#3A3A3A` (gray-black), `#A89878` (cream), `#5A4A6A` (faded purple)
- All car colors are *desaturated* — no candy-bright vehicles

**Rival Brand Palettes (locked per rival)**
- **SudsCo:** Yellow `#D9A83A` + orange `#C97A3A` + dingy white `#D8D0BE`
- **Aurora Auto Spa:** Navy `#3A4A5A` + silver `#A8A8A8` + cream `#E0D8C8`
- **Hydro Holdings:** Corporate blue `#5A7A9A` + white `#E8E0D0` + light gray `#B8B0A8`
- **Pop's Wash & Wax:** Faded teal `#5A8A8A` + warm cream `#D8C8A8` + brick red `#7A463A`
- **Player (default):** TBD — player can choose from 4–6 brand palettes

### 4.2 Palette Discipline

- Source any new asset → restrict its texture palette to the master palette via post-processing pass before integration
- No off-palette colors in shipped assets, ever
- A "palette enforcement" script in the asset pipeline (see Section 21) automatically clamps imported textures

---

## 5. Lighting Direction

### 5.1 Lighting Approach
- **Mostly flat / vertex-lit** with selective specular highlights
- No real-time shadows on most objects (use baked or fake shadows — circular gradient under cars/people)
- No global illumination, no light bouncing, no PBR
- One directional light = sun, soft and slightly yellow
- Ambient color is muted blue-gray (cool fill, warm key)

### 5.2 Time of Day (Phase 2+)
- **Dawn:** muted oranges/pinks, long shadows, sky `#C9B785`
- **Day (default):** overcast slightly-gray sky `#A8B8B5`, cool ambient
- **Dusk:** warm orange `#C97A3A` sky, lights starting to come on at lots
- **Night:** deep navy sky, lot lighting becomes critical (drives Lighting upgrade value)

For vertical slice: **day only**. Other times of day are Phase 2.

### 5.3 Lot Self-Lighting
- Each lot has emissive elements (signs, neon, fluorescent strips inside bays)
- Emissives glow even in daylight — this makes upgraded signage *pop* visually
- A degraded lot has dim/flickering emissives; upgraded signage has steady, saturated emissives
- This is one of the strongest visual upgrade-feedback mechanisms

---

## 6. 3D Style Specifications

### 6.1 Polygon Budgets (Strict)

| Asset type | Triangle count |
|------------|---------------|
| Car | 100–300 tris |
| Character (employee/customer) | 500–1,500 tris |
| Bay structure | 800–2,000 tris |
| Vacuum kiosk | 200–500 tris |
| Building (background) | 500–1,500 tris |
| Sign (modular) | 50–200 tris |
| Prop (small, e.g. trash can) | 50–200 tris |

**Rationale:** these counts force the low-poly aesthetic naturally. If an asset exceeds budget, it's wrong for the game even if it "looks better."

### 6.2 Texture Specifications

- **Resolution:** 128×128 to 512×512 for most assets. 1024×1024 only for hero assets (player-owned brand sign, primary lot exterior).
- **Filter mode:** Point (no bilinear filtering) — this gives the crunchy PS1 look
- **Compression:** standard Unity compression, but tested at low quality settings to preserve the slightly-degraded look
- **No normal maps**
- **No specular maps** (use vertex-painted specular highlights for occasional shine)
- **No ambient occlusion baking**
- **Alpha:** dithered transparency only (no smooth alpha gradients)

### 6.3 Modeling Style

- Hard edges, sharp vertices — no smoothing groups for organic look
- Flat shading on most surfaces
- No subdivisions, no high-poly source models, no retopology
- Models look "blocked out" because they *are* blocked out
- Small details rendered as texture, not geometry (don't model rivets, paint them)

### 6.4 Vertex Effects

The PS1 vertex jitter is a defining visual feature:
- Small per-frame vertex snap on moving objects (cars, characters)
- Snap to ~0.1 unit grid for that distinctive wobble
- Affine texture mapping shader option for surfaces seen at oblique angles
- These should be *subtle* — present enough to read as the aesthetic, not so much that the game feels broken

---

## 7. Shader Pipeline

### 7.1 The Master Shader

A single custom URP shader handles the look for ~90% of assets:

**Core features:**
- Flat / vertex-lit base
- Optional vertex-snap effect (toggle per object)
- Optional affine texture mapping (toggle per object)
- Optional emissive layer (for signs, lights)
- Palette clamp (texture sampled colors snap to master palette)
- Slight color quantization (8-bit-ish color depth)
- Optional dithered transparency
- Optional outline (subtle dark line on silhouettes — toggleable per material, used selectively)

### 7.2 Specialty Shaders

- **Water shader** — for active bay water spray, vacuum suction effect. Animated UV scroll + simple particles. PS1-style, not realistic water.
- **Glass shader** — flat blue tint with single specular highlight, no reflections, no transparency
- **Metal shader** — flat color + small specular vertex paint, no reflections
- **Sign emission shader** — base color + emissive, with optional flicker (for broken/degraded states)

### 7.3 Post-Processing Stack

Applied to the final image:
- **Dithering pass** — adds slight color quantization noise across the screen
- **Subtle CRT scanlines (very light)** — barely perceptible, adds analog feel
- **Slight chromatic aberration** at screen edges
- **Color grading** to enforce overall palette mood (slightly desaturated, warm shadows)
- **No bloom** (or very minimal) — bright = ugly here, intentionally
- **No depth of field**
- **No motion blur**

The post-processing is what unifies mixed-source assets into one look.

---

## 8. Character Design Language

### 8.1 Proportions
- Heads slightly larger than realistic (1:6 head-to-body ratio, vs. real-world 1:7-8)
- Hands and feet small
- Bodies blocky and simplified — no detailed musculature, no precise anatomy
- Slightly wonky proportions are *good* — perfectly correct anatomy reads as wrong-for-this-game

### 8.2 Faces
- Simple geometric features (cube nose, painted-on eyes)
- Static face textures, no facial bones
- Expressions read from body language and dialogue text, not face
- Distinctive silhouettes matter more than face details

### 8.3 Clothing
- Texture-painted, not modeled (a "shirt" is just a colored band on the torso)
- Neighborhood/role appropriate:
  - Working class customers: Carhartt-coded, work boots, baseball caps, jeans
  - Affluent customers: polos, slacks, sunglasses, crisp light colors
  - Industrial/fleet drivers: high-vis vests, work uniforms
  - Tourists: shorts, vacation shirts, cameras
- Employees wear lot-branded attire that updates with player branding upgrades

### 8.4 Animation
- Stiff, looped animations (idle, walk, work)
- 8–12 frame keyframe animations max
- No inverse kinematics
- Foot sliding is *acceptable* — it's part of the era look
- Characters mostly stand still anyway (this is a tycoon, not a platformer)

### 8.5 Customer Variety
- 8–12 character base models
- Each has 3–5 texture variants (different shirts, hair colors)
- Combined: ~30–60 unique-looking customers in rotation
- Cycle randomly per visit — no individual customer tracking

---

## 9. Vehicle Design Language

### 9.1 Vehicle Categories

| Category | Visual notes | Found in neighborhoods |
|----------|--------------|----------------------|
| Compact sedan | Small, boxy, faded paint | Working class, suburban |
| Pickup truck | Tall, work-coded, dirt on lower panels | Working class, industrial |
| Family minivan | Long, beige/muted, baby-on-board sticker | Suburban |
| Luxury sedan | Sleek, dark, clean | Affluent |
| Sports car | Low, bright color (faded), aggressive lines | Affluent, tourist |
| Beater car | Asymmetric damage, mismatched panels | Working class |
| Service van | Branded (fake brands), white/tan | Industrial, fleet |
| SUV | Boxy, suburban-coded | Suburban, affluent |

### 9.2 Vehicle Modeling
- 100–300 triangles per vehicle
- 4 wheels modeled, simple geometry
- Single-material (one texture per vehicle)
- Minor variations through texture swaps (color, dirt level, decals)

### 9.3 Vehicle Animation
- Wheels rotate when moving
- Suspension bobs slightly when stopping/starting
- No doors opening (customers despawn inside, respawn on exit)
- Optional: very minor body wobble during wash cycle

### 9.4 Vehicle Variety Rotation
- 5–8 base car models for vertical slice
- 12–20 base car models for full game
- Each with 3–5 paint variants → ~40–80 unique-looking cars in full game
- Customer demographics determine which cars appear in which neighborhoods

---

## 10. Environment & Lot Design

### 10.1 The Lot Anatomy

Every lot consists of:
- **Ground plane** — concrete pad with painted lines, drainage grates, optional cracks
- **Bay structures** — modular, swappable add-ons for each upgrade
- **Vacuum kiosks** — separate small structures
- **Signage** — primary brand sign + per-bay tier signs
- **Lighting** — pole lights, building-mounted floods
- **Coin meters** — per bay, prominent visual element
- **Office interior** — small walled-off building on the same lot, NavMesh continuous; contains money counter, coin sifter, and CRT terminal. See `washempire_fpcollection.md` §6.6.
- **Detail elements** — trash cans, vending machines, optional benches, cigarette butts, oil stains

### 10.2 Lot Quality Levels (Visual States)

A lot exists in one of several visible quality bands. Players must read the lot's state at a glance.

**Decrepit** (starting state for cheap lots):
- Faded paint, peeling
- Bent/missing letters on signage
- Cracked concrete with weed growth
- Dim, flickering, or broken lights
- Torn awnings
- Trash visible
- One or more visibly broken bays

**Standard** (post-basic-upgrades):
- Clean paint job
- Replaced signage, all letters present
- Clean concrete, repainted lines
- Working lights, steady illumination
- No visible decay or trash
- All bays operational

**Upgraded** (mid-game lot):
- Premium paint with brand colors
- Backlit/branded signage
- Clean, cared-for environment
- Bright, even lighting
- Possible secondary features (banners, pricing displays)

**Premium** (late-game lot):
- High-quality branded environment
- Premium signage with emissive details
- Pristine concrete, maybe pavers
- Decorative lighting
- Landscaping (planters, small trees)
- Visible employee uniforms, branded touches everywhere

The visual delta between Decrepit and Premium must be **dramatic**. A decrepit lot and a premium lot in the same neighborhood should look like different games.

### 10.3 Modular Construction

The bay structure is built from:
- Base bay frame (4 walls + roof)
- Door/opening (always-open archway)
- Equipment pack (dial set + soap dispenser + brushes — swappable for tier upgrades)
- Roof signage (modular tier label)
- Floor markings (paint-dependent on lot quality)
- Side trim/panels (swappable for color/branding)

Each upgrade swaps specific modules, not the whole bay. This makes upgrades visible and asset reuse high.

---

## 11. Neighborhood Visual Differentiation

Each neighborhood reads instantly through environmental color, prop density, and ambient detail.

### 11.1 Working Class
- Color cast: warm dingy yellows, faded reds, gray asphalt
- Background buildings: small commercial (laundromats, pawn shops, liquor stores), low-rise
- Props: utility poles, dumpsters, fire hydrants, shopping carts, telephone wires
- Signage in environment: hand-painted, faded, neon
- Vehicle traffic: pickups, beaters, work vans

### 11.2 Suburban
- Color cast: muted greens, beiges, soft pastels
- Background buildings: strip malls, fast food, small retail
- Props: planters, bus stops, sidewalks, kept-up landscaping
- Signage: corporate-clean but slightly dated
- Vehicle traffic: minivans, SUVs, family sedans

### 11.3 Affluent
- Color cast: cool grays, muted blues, dark greens
- Background buildings: upscale boutiques, banks, dental offices
- Props: manicured landscaping, modern street lamps, no clutter
- Signage: minimalist, modern, no neon
- Vehicle traffic: luxury sedans, modern SUVs, sports cars

### 11.4 Industrial
- Color cast: ochre, rust, exposed concrete gray
- Background buildings: warehouses, depots, factory walls
- Props: chain-link fences, shipping containers, dumpsters, stacks of pallets
- Signage: utilitarian, regulatory, faded
- Vehicle traffic: service vans, work trucks, fleet vehicles

### 11.5 Tourist
- Color cast: bleached pastels, sun-faded signs, warm sky
- Background buildings: motels, gift shops, diners, beach-coded if relevant
- Props: tourist signage, palm trees (if applicable), benches, vending
- Signage: bright but faded, kitschy, dated
- Vehicle traffic: rental cars, RVs, out-of-state plates

---

## 12. Rival Visual Identity

Each rival's lots must be instantly recognizable from the floating camera. Their brand palette (Section 4.1) drives every choice.

### 12.1 SudsCo (Discount Chain)
- Yellow + orange brand colors, hand-painted-feel signage
- Bright but cheap-looking
- Big "PRICE!" callouts, banner ads
- Lots are slightly cluttered, busy
- Always reads as "trying too hard"

### 12.2 Aurora Auto Spa (Premium)
- Navy + silver minimalist branding
- Clean, modern signage with emissive backlighting
- Manicured landscaping
- Few visible details (uncluttered = premium)
- Always reads as "expensive"

### 12.3 Hydro Holdings (Corporate)
- Generic corporate blue + white, sterile
- Identical signage at every lot (literally same model)
- No personality, no flair
- Always reads as "anonymous franchise"

### 12.4 Pop's Wash & Wax (Local)
- Hand-lettered teal + cream signage
- Family touches (a hand-painted mural, a "since 1962" plaque)
- Slightly dated but well-kept
- Always reads as "loved by locals"

### 12.5 Player Brand (Default)
- Player chooses from 4–6 brand palettes at game start
- Brand identity applied to all owned lots (signage, paint trim, employee uniforms)
- Player can update brand identity mid-game (cosmetic upgrade)

---

## 13. UI / HUD Aesthetic

### 13.1 Visual Identity
- **Lo-fi clipboard / receipt aesthetic** — UI feels like physical paper, not digital glass
- Slightly off-white background (`#E8E0D0`) with warm tint
- Black or dark-brown text (`#2A2520`)
- Hand-drawn-feeling icons (not vector-perfect)
- Slightly imperfect line work
- Stamps, stickers, paper clips as decorative elements where appropriate
- Yellowed/aged texture overlay on UI panels

### 13.2 UI Layout Principles
- **Heavy borders and frames** — UI elements feel like physical clipboards
- **Tabular layouts** for numerical data (revenue/cost tables look like accounting sheets)
- **Generous whitespace** — readability over density
- **Color used sparingly** — most UI is black-on-cream, with color reserved for: cash (green), warnings (orange), crises (red), brand accent

### 13.3 HUD Elements

**Cash Display**
- Top-left, large monospaced numerals
- Cream background, dark text, slight drop shadow
- Cash collection animation: numbers tick up, brief green flash

**Time Controls**
- Top-center, "clock face" icon + digital readout
- Pause / play / 3x / 10x as physical-button-styled toggles

**Required Tasks Panel**
- Top-right, collapsible
- Each task as a "ticket" entry on a clipboard
- Strikethrough animation when completed

**Notifications**
- Slide in from right edge
- Paper-airplane or memo aesthetic
- Auto-dismiss after a few seconds, or click to read

### 13.4 Modal Screens

**Upgrade Panel**
- Full-screen "purchase order form" aesthetic
- Each upgrade shown as a line item with description, cost, effect
- "Approve" button stamps a purchase mark when bought

**Weekly Review**
- "End-of-Week Report" styled like a printed accounting sheet
- Revenue / costs / profit in tabular format
- Optional: paper-tearing-off animation when dismissed

**Rival Dossier**
- "Confidential Folder" aesthetic
- Per-rival pages with photo (placeholder portrait of the rival's mascot/owner)
- Numerical data with intentionally imprecise readings (estimates, not exact)

### 13.5 UI Animation
- **No smooth eases** — animations snap, slide, or pop
- Slight wobble on hover (paper-stuck-to-clipboard physics)
- No fade-in/fade-out — replace with cuts or paper-flip animations
- Sound effects on every UI interaction (paper rustle, stamp, click)

### 13.6 Tray HUD (FP Ritual)

Persistent bottom-left overlay during the FP cash-collection ritual. Lo-fi clipboard aesthetic matches the rest of the HUD: cream `#E8E0D0` paper with dark text, three rows for `Bills`, `Coins`, `Tokens` (Tokens at $0 in slice). Rows tick up live as the player empties stations and drain to $0 as the office counter and sifter run. Disappears at ritual end. See `washempire_fpcollection.md` §4.7.

### 13.7 Office Terminal Receipt

The office terminal renders as a CRT-styled screen displaying a printed-receipt layout: header `─── WEEK N DEPOSIT ───`, line items for Bills (counter) and Coins (sifter), a totalled `TOTAL DEPOSITED`, then theoretical revenue and slippage breakdown. Monospaced font, single `[ Continue ]` button. The `cameras would help` slippage hint sits under the slippage line when applicable. See `washempire_fpcollection.md` §4.6.

### 13.8 Station Interaction Overlay

Generic overlay invoked at each ritual station. Shows the station's interaction prompt (`Hold to empty`, `Click to run`) on a small clipboard slip pinned to the lower-center of the screen. Hold actions show a tick-up progress bar; click actions show a single click target. Overlay matches the cream + black aesthetic of all other HUD pieces.

---

## 14. Iconography

### 14.1 Icon Style
- Hand-drawn feeling, slightly imperfect line work
- Black ink on cream background as default
- Simple silhouettes — readable at small sizes
- 32×32 base size for in-game icons, 64×64 for menu icons
- No gradients, no soft edges

### 14.2 Icon Library Required (Vertical Slice)

| Icon | Purpose |
|------|---------|
| Cash bill | Currency display |
| Bay (small structure) | Bay-related upgrades |
| Paint roller | Paint upgrade |
| Sign | Signage upgrade |
| Light bulb | Lighting upgrade |
| Soap bottle | Soap upgrade |
| Dial | Dials upgrade |
| Vacuum | Vacuum station upgrade |
| Wrench | Repair / maintenance |
| Clipboard | Tasks |
| Clock | Time controls |
| Floppy disk | Save (intentionally retro) |
| Gear | Settings |
| Warning triangle | Crisis events |

### 14.3 Icon Sourcing
- Kenney UI packs as base, restyled to match aesthetic
- Custom drawing for game-specific icons (bay, dials, vacuum)
- Single-color flat icons unified through palette

---

## 15. Typography

### 15.1 Font Choices
- **Primary UI font:** A pixel-adjacent or slightly bitmap font that reads as PS1/PS2-era
  - Options: **DotGothic16**, **VT323**, **Press Start 2P** (use sparingly — only for emphasis)
- **Secondary / numerical:** A monospaced font for cash and tabular data
  - Options: **Space Mono**, **JetBrains Mono**, **VT323**
- **Display / signage (in-world):** A condensed sans or hand-painted-feel font for diegetic signage
  - Options: **Bebas Neue** (signage), custom hand-drawn for charm

### 15.2 Type Hierarchy
- **Display:** 32–48pt, used for screen titles
- **Heading:** 20–24pt, used for section headers
- **Body:** 12–16pt, used for general text
- **Tabular:** 14–16pt monospaced, used for numbers
- **Label:** 10–12pt, used for HUD labels and small annotations

### 15.3 Type Treatment Rules
- No anti-aliasing on small text (under 16pt) — keep it crisp/pixel-y
- Slight character spacing on display type
- Use uppercase sparingly — looks aggressive when overused
- No fancy effects (gradients, glow, drop shadows) except subtle drop shadow on HUD numbers for legibility

---

## 16. Animation Direction

### 16.1 Movement Philosophy
- **Snappy and economical** — animations are short and punchy
- **Limited frames** (8–12 frames per loop typical)
- **Looping is fine** — repetition is part of the era look
- **No motion smoothing** — hard cuts between key poses

### 16.2 Specific Animations Required (Vertical Slice)

**Cars**
- Drive (wheel spin + body bob)
- Stop / start (suspension dip)
- Wash cycle (slight body wobble while in bay)

**Equipment**
- Dial movement (segmented rotation)
- Brush sway (back and forth)
- Soap dispenser activation (pulse)
- Coin meter (glint when full)

**Effects**
- Water spray (looped particle burst)
- Steam (rising particles when premium services unlock)
- Suds (foam particles)

**Characters (vertical slice doesn't need many)**
- Idle (subtle breathing/sway)
- Walk cycle (8-frame loop)
- Work animation (if attendant added — wave, sweep)

### 16.3 Camera Animation
- Smooth pan/zoom for player camera control (the only "smooth" animation in the game)
- Cut transitions between scenes (no fades)
- Slight camera shake on crisis events (equipment breakdown)

---

## 17. VFX & Particles

### 17.1 Particle Style
- **Low particle counts** — 5–20 particles per effect, not hundreds
- **Sprite-based** — billboarded quads with simple textures
- **No physics simulation** — just timed transforms
- **Limited lifespan** — particles disappear quickly, don't accumulate

### 17.2 Required Effects (Vertical Slice)
- **Water spray** at active bays (constant low-volume)
- **Soap suds** during wash cycle
- **Cash collection sparkle** (small glint when collecting)
- **Crisis smoke / sparks** when equipment breaks
- **Vacuum dust** at vacuum stations

### 17.3 Effects to Avoid
- No realistic fluid simulation
- No bloom or glow on particles (rely on color contrast)
- No sub-emitters or complex VFX trees
- No screen-space effects (no full-screen flashes)

---

## 18. Camera Language

### 18.1 Default Camera
- Floating overhead, slight perspective tilt (~45° down angle)
- Player controls: WASD/arrows pan, Q/E or right-mouse rotate, scroll wheel zoom
- Smooth movement (the *one* exception to "no smoothing")
- Min zoom: tight on a single bay (read individual interactions)
- Max zoom: see entire lot + immediate surroundings

### 18.2 Cinematic Moments
- **Week-end transition:** brief pull-back showing whole lot
- **Crisis event:** quick zoom toward the affected bay
- **Upgrade purchase:** brief focus on the upgraded element

### 18.3 Camera Limitations
- Cannot tilt below horizon
- Cannot rotate vertically (no third-person dive)
- Exception: during cash-collection ritual, the camera enters first-person mode at eye height (~1.7m). See `washempire_fpcollection.md` §3 for ritual scope. Default tycoon overhead camera resumes once the ritual ends.
- Cannot pan beyond lot boundaries (in vertical slice — full game has city map for cross-lot navigation)

### 18.4 First-Person Collection Mode

During end-of-week cash collection, the overhead vcam yields to a first-person eye-height camera that follows an invisible NavMesh agent. Movement is click-to-walk; no avatar is rendered. Each ritual station (coin bin, changer, money counter, coin sifter, terminal) has a hand-placed station-anchor vcam that takes priority on arrival via Cinemachine blend.

Blend durations are tight to keep the ritual under one minute: ~1s overhead → FP at start, ~0.5s FP → station-anchor at each station, ~0.5s station-anchor → FP on station completion, ~1s FP → overhead at ritual end. Office entry is an FP → FP transition through a door portal — no scene load, no fade. See `washempire_fpcollection.md` §6.5.

---

## 19. Asset Pipeline

### 19.1 Asset Acquisition Sources

**Primary sources (start here):**
- **Kenney.nl** — free CC0 low-poly assets (vehicles, characters, props)
- **Synty Studios** — paid POLYGON packs (City, Vehicles, Construction)
- **KayKit** — free stylized character packs
- **Unity Asset Store** — for tycoon-specific systems (UI, save systems)

**Secondary sources:**
- **itch.io** — niche packs, signage, props
- **Sketchfab** (CC-licensed only)
- **Custom modeling** — only when no asset matches the need

### 19.2 Style Unification Process

**Every imported asset goes through this pipeline before integration:**

1. **Polygon check:** does it meet the polygon budget? If over by >50%, reject or simplify.
2. **Texture downscale:** all textures resampled to 256×256 or 512×512 max.
3. **Palette clamp:** texture colors mapped to master palette via lookup table.
4. **Filter mode:** set to Point in Unity import settings.
5. **Material assignment:** apply master shader, configure emissive layers if applicable.
6. **Shadow settings:** disable real-time shadow casting unless specifically needed.
7. **Final visual check:** does it sit next to existing assets without breaking immersion?

### 19.3 Custom Asset Creation Workflow

For the small percentage of assets that must be custom-made:

- **Tool:** Blender (free, open source, sufficient for low-poly)
- **Process:** block out → unwrap UVs → paint texture in palette → export FBX
- **Naming convention:** `category_name_variant_v##.fbx` (e.g., `bay_basic_yellow_v01.fbx`)
- **Source files committed to repo** alongside exported assets

### 19.4 Asset Folder Structure (Unity)

```
Assets/
├── Art/
│   ├── Models/
│   │   ├── Lots/
│   │   ├── Vehicles/
│   │   ├── Characters/
│   │   └── Props/
│   ├── Textures/
│   │   ├── Diffuse/
│   │   └── Emissive/
│   ├── Materials/
│   ├── Shaders/
│   └── UI/
│       ├── Sprites/
│       ├── Fonts/
│       └── Icons/
├── Audio/
├── Prefabs/
└── Scenes/
```

### 19.5 Asset Budget (Vertical Slice)

| Category | Estimated cost |
|----------|---------------|
| Synty POLYGON City Pack | $30–$50 |
| Synty Vehicles Pack | $20–$30 |
| Kenney UI / Icon Packs | Free |
| KayKit Characters | Free |
| Custom modeling time | Solo dev time, ~30 hours |
| Audio (freesound CC0) | Free |
| **Total cash budget** | **$50–$80** |

---

## 20. Don't List

Specific anti-patterns. Things that will break the visual identity.

- **Don't use realistic PBR materials.** Chrome reflections, normal-mapped concrete, and metallic shaders break the era aesthetic.
- **Don't add bloom.** Modern bloom is the opposite of this game's look.
- **Don't add depth of field.** The camera never focuses on something specific in this game's view.
- **Don't add motion blur.** It looks expensive and clean — wrong direction.
- **Don't use stock Unity skyboxes.** Custom solid-color or simple gradient skyboxes only.
- **Don't use cartoon/toon shaders that look "cute".** Two Point Hospital aesthetic is out.
- **Don't mix high-poly and low-poly assets.** One high-poly hero asset breaks the rule and pulls focus.
- **Don't use particle systems with thousands of particles.** PS1 era couldn't, this game shouldn't.
- **Don't animate UI with smooth bouncy easing.** Snap or paper-cut animations only.
- **Don't use vector-perfect modern icons.** Hand-drawn or pixel feel only.
- **Don't ship pure white.** Use cream `#E8E0D0` instead.
- **Don't use saturated bright colors except as feedback.** Saturated = important, muted = ambient.
- **Don't pretend the game is realistic.** Lean into the stylization, don't apologize for it.

---

## 21. Open Questions / TBD

- Final brand palette options for player customization
- Whether to add subtle vertex jitter to all moving objects or only vehicles
- Specific font licensing (some fonts above need verification before commercial use)
- Whether weather effects (rain, snow) get a Phase 1 placeholder or Phase 2 inclusion
- Whether to commission custom 3D modeling work for hero assets or stay 100% asset-pack-based
- Animation sourcing — Mixamo for characters? Custom keyframes? Hand-animated?
- Specific shader implementation in URP — research whether Shader Graph or custom HLSL
- Whether to support 4K rendering or cap at 1080p (PS1 effect reads better at lower res)

---

*End of art bible v1*
