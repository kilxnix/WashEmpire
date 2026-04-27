# Wash Empire — Sprint 2 Implementation Plan (FP Cash Collection)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Sprint 2 of the vertical slice — the time/cycle heartbeat, weekly economic settlement, and the first-person cash-collection ritual specified in `washempire_fpcollection.md`.

**Architecture:** A `TimeController` singleton drives a day/week clock that fires `OnWeekEnded` to a `TaskSystem`. The "Collect Cash" task starts a `RitualController` state machine that drives a `PlayerNavAgent` (invisible NavMeshAgent) between `CollectionStation` instances. A first-person Cinemachine vcam follows the agent at eye height; station-anchor vcams take over during interactions. `BayController` accumulates `CashInBin` per-week with 90/10 split to a `Changer.BillStacker` and 3% slippage on the cash-paid portion. Card-reader bays bypass the bin entirely and deposit directly to `GameManager` net of a 3% fee.

**Tech Stack:** Unity 6 LTS (6000.4.2f1), URP 17.4, Cinemachine 3.x (to install), AI Navigation 2.0 (installed), New Input System (installed), TextMeshPro (installed), Unity Test Framework (NUnit, installed), C# 9.

**Spec reference:** `washempire_fpcollection.md` v1.

---

## File Structure

### Files created

| Path | Responsibility |
|---|---|
| `Assets/Scripts/Core/TimeController.cs` | Day/week clock, speed multiplier, `OnWeekEnded` event |
| `Assets/Scripts/Economy/LotEconomy.cs` | Weekly revenue/cost accumulator, fixed cost calc per economy spec §5.1 |
| `Assets/Scripts/Economy/Changer.cs` | Bill stacker MonoBehaviour, accumulates 10% of cash-paid revenue |
| `Assets/Scripts/Tasks/Task.cs` | Data class: id, label, completion predicate |
| `Assets/Scripts/Tasks/TaskSystem.cs` | Singleton; generates "Collect Cash" task on `OnWeekEnded` |
| `Assets/Scripts/Ritual/Tray.cs` | Runtime data: Bills, Coins, Tokens columns |
| `Assets/Scripts/Ritual/RitualController.cs` | State machine: `Idle → Walking → AtStation → Interacting → AtTerminal → Done` |
| `Assets/Scripts/Ritual/PlayerNavAgent.cs` | Invisible body; click-to-walk via NavMesh |
| `Assets/Scripts/Ritual/FPCameraController.cs` | Eye-height camera follow + heading rotation |
| `Assets/Scripts/Ritual/Stations/CollectionStation.cs` | Abstract base; entrance, anchor, IsComplete, OnInteract |
| `Assets/Scripts/Ritual/Stations/BayBinStation.cs` | Hold to empty bay's CashInBin into Tray.Coins |
| `Assets/Scripts/Ritual/Stations/ChangerStation.cs` | Hold to empty Changer.BillStacker into Tray.Bills |
| `Assets/Scripts/Ritual/Stations/OfficeDoorStation.cs` | Auto-trigger; locks doors |
| `Assets/Scripts/Ritual/Stations/MoneyCounterStation.cs` | Click to run; drains Tray.Bills |
| `Assets/Scripts/Ritual/Stations/CoinSifterStation.cs` | Click to run; drains Tray.Coins |
| `Assets/Scripts/Ritual/Stations/OfficeTerminalStation.cs` | Receipt-style summary; Continue ends ritual |
| `Assets/Scripts/UI/TimeControlsHUD.cs` | Top-center pause/1x/3x/10x + day/week readout |
| `Assets/Scripts/UI/TaskPanelHUD.cs` | Top-right task list, click-to-trigger |
| `Assets/Scripts/UI/TrayHUD.cs` | Bottom-left tray overlay during ritual |
| `Assets/Scripts/UI/NextStationButton.cs` | Right-side button during ritual |
| `Assets/Scripts/UI/StationInteractionUI.cs` | Generic overlay (hold/click prompt) |
| `Assets/Scripts/UI/WeeklyReviewController.cs` | Modal post-ritual: revenue/costs/profit |
| `Assets/Scripts/UI/OfficeTerminalScreen.cs` | Receipt-styled UI for terminal station |
| `Assets/Scripts/Save/SaveSystem.cs` | JSON serialization, v1→v2 migration |
| `Assets/Scripts/Save/SaveData.cs` | DTO matching schema in spec §6.7 |
| `Assets/Tests/EditMode/CashFlowTests.cs` | Slippage, 90/10 split, card-reader fee math |
| `Assets/Tests/EditMode/TimeControllerTests.cs` | Day/week advance, speed multiplier |
| `Assets/Tests/EditMode/RitualStateMachineTests.cs` | State transitions, abort/resume |
| `Assets/Tests/EditMode/SaveMigrationTests.cs` | v1→v2 schema upgrade |
| `Assets/Tests/EditMode/WashEmpire.Tests.asmdef` | Test assembly definition |

### Files modified

| Path | Change |
|---|---|
| `Assets/Scripts/Core/GameManager.cs` | Split `Cash` → `DepositedCash` (spendable) + `PendingCash` (computed). Add `Deposit(int)`. |
| `Assets/Scripts/Lots/BayController.cs` | Add `CashInBin`, `LifetimeRevenue`, `LifetimeSlippage`, `HasCardReader`. Replace direct `AddCash` call with bin/changer routing. Add `CollectFromBin()`. |
| `Assets/Scripts/Lots/LotController.cs` | Add references to `Changer`, office stations. Add `GetActiveCollectionStations()`. |
| `Assets/Scripts/UI/CashHUD.cs` | Bind to `DepositedCash` instead of `Cash`. |
| `Assets/Scripts/Camera/OverheadCameraController.cs` | Expose `enabled` toggle responsiveness; no logic change. |
| `Assets/Lot01.unity` | Add office interior, changer/counter/sifter/terminal stand-ins, NavMesh re-bake, FP cinemachine vcam, time HUD canvas. |

---

## Pre-Flight Setup

### Task 0: Install Cinemachine + verify Test Framework

**Files:**
- Modify: `WashEmpire/Packages/manifest.json`

- [ ] **Step 1: Install Cinemachine via Package Manager**

In Unity Editor: `Window → Package Manager → Unity Registry → search "Cinemachine" → Install`. Cinemachine 3.x is the current version on Unity 6.

- [ ] **Step 2: Verify install**

Open `Packages/manifest.json` and confirm a line like `"com.unity.cinemachine": "3.x.x"` appears. Reopen Unity if not auto-recognized.

- [ ] **Step 3: Verify Unity Test Framework is available**

In Unity Editor: `Window → General → Test Runner`. The window should open with EditMode and PlayMode tabs. If it doesn't appear, Package Manager → Unity Registry → install "Test Framework".

- [ ] **Step 4: Commit package changes**

```bash
git add WashEmpire/Packages/manifest.json WashEmpire/Packages/packages-lock.json
git commit -m "Sprint 2 pre-flight: install Cinemachine"
```

---

### Task 1: Set up test assembly

**Files:**
- Create: `Assets/Tests/EditMode/WashEmpire.Tests.asmdef`
- Create: `Assets/Tests/EditMode/Smoke.cs`

- [ ] **Step 1: Create the test assembly definition**

Create `Assets/Tests/EditMode/WashEmpire.Tests.asmdef`:

```json
{
    "name": "WashEmpire.Tests",
    "rootNamespace": "WashEmpire.Tests",
    "references": [
        "GUID:27619889b8ba8c24980f49ee34dbb44a",
        "GUID:0acc523941302664db1f4e527237feb3"
    ],
    "includePlatforms": ["Editor"],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": true,
    "precompiledReferences": ["nunit.framework.dll"],
    "autoReferenced": false,
    "defineConstraints": ["UNITY_INCLUDE_TESTS"],
    "versionDefines": [],
    "noEngineReferences": false
}
```

(GUIDs above reference UnityEngine.TestRunner and UnityEditor.TestRunner — Unity resolves them automatically; if Unity reports missing references, replace with assembly names: `["UnityEngine.TestRunner", "UnityEditor.TestRunner"]`.)

- [ ] **Step 2: Add a smoke test to verify the assembly compiles**

Create `Assets/Tests/EditMode/Smoke.cs`:

```csharp
using NUnit.Framework;

namespace WashEmpire.Tests
{
    public class Smoke
    {
        [Test]
        public void Assembly_Compiles_And_Runs() => Assert.Pass();
    }
}
```

- [ ] **Step 3: Run the smoke test in Test Runner**

`Window → General → Test Runner → EditMode tab → Run All`. The smoke test should pass.

- [ ] **Step 4: Commit**

```bash
git add WashEmpire/Assets/Tests/
git commit -m "Sprint 2: test assembly scaffold"
```

---

## Sub-phase 2A — Time & Costs (Week 1)

### Task 2: Refactor GameManager for deposited/pending cash split

**Files:**
- Modify: `Assets/Scripts/Core/GameManager.cs`
- Test: `Assets/Tests/EditMode/CashFlowTests.cs`

- [ ] **Step 1: Write the failing test**

Create `Assets/Tests/EditMode/CashFlowTests.cs`:

```csharp
using NUnit.Framework;
using UnityEngine;

namespace WashEmpire.Tests
{
    public class CashFlowTests
    {
        [Test]
        public void Deposit_Adds_To_DepositedCash_And_Fires_Event()
        {
            var go = new GameObject();
            var gm = go.AddComponent<GameManager>();
            gm.SetStartingCash(1000);
            gm.Awake();

            int observed = -1;
            gm.OnCashChanged += c => observed = c;

            gm.Deposit(250);

            Assert.AreEqual(1250, gm.DepositedCash);
            Assert.AreEqual(1250, observed);

            Object.DestroyImmediate(go);
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

In Test Runner, run `CashFlowTests`. Expected: FAIL with "GameManager does not contain a definition for SetStartingCash" or similar.

- [ ] **Step 3: Refactor GameManager**

Replace `Assets/Scripts/Core/GameManager.cs`:

```csharp
using System;
using UnityEngine;

namespace WashEmpire
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [SerializeField] private int startingCash = 20000;

        public int DepositedCash { get; private set; }
        public int PendingCash { get; private set; }
        public int Cash => DepositedCash;

        public event Action<int> OnCashChanged;

        public void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DepositedCash = startingCash;
        }

        private void Start()
        {
            OnCashChanged?.Invoke(DepositedCash);
        }

        public void Deposit(int amount)
        {
            DepositedCash += amount;
            OnCashChanged?.Invoke(DepositedCash);
        }

        public bool TrySpend(int amount)
        {
            if (amount > DepositedCash) return false;
            DepositedCash -= amount;
            OnCashChanged?.Invoke(DepositedCash);
            return true;
        }

        public void SetPendingCash(int amount)
        {
            PendingCash = amount;
        }

        public void SetStartingCash(int amount) => startingCash = amount;
    }
}
```

Note: `Awake` is `public` (not `private`) so tests can invoke it without scene plumbing.

- [ ] **Step 4: Run test to verify it passes**

Run Test Runner. Expected: PASS.

- [ ] **Step 5: Verify CashHUD still binds correctly in scene**

Open `Lot01.unity`, press Play, watch a car wash complete. Cash counter should still tick (even though Bay still calls the legacy AddCash path — we'll fix in Task 4).

- [ ] **Step 6: Commit**

```bash
git add WashEmpire/Assets/Scripts/Core/GameManager.cs WashEmpire/Assets/Tests/EditMode/CashFlowTests.cs
git commit -m "Sprint 2.A: split GameManager.Cash into Deposited + Pending"
```

---

### Task 3: Add `AddCash` shim for Sprint 1 compatibility

**Files:**
- Modify: `Assets/Scripts/Core/GameManager.cs`

- [ ] **Step 1: Add a transitional method**

In `GameManager.cs`, add below `Deposit`:

```csharp
[System.Obsolete("Use Deposit() instead. Will be removed in Sprint 2.B.")]
public void AddCash(int amount) => Deposit(amount);
```

This keeps `BayController.RunWash`'s existing call working until Task 6 refactors it.

- [ ] **Step 2: Press Play, verify wash → cash still works**

A car completes a wash, cash counter ticks +$5. No errors in console (Obsolete is a warning, not an error).

- [ ] **Step 3: Commit**

```bash
git add WashEmpire/Assets/Scripts/Core/GameManager.cs
git commit -m "Sprint 2.A: AddCash shim for Sprint 1 backcompat"
```

---

### Task 4: TimeController — day/week clock + speed multiplier

**Files:**
- Create: `Assets/Scripts/Core/TimeController.cs`
- Test: `Assets/Tests/EditMode/TimeControllerTests.cs`

- [ ] **Step 1: Write failing tests**

Create `Assets/Tests/EditMode/TimeControllerTests.cs`:

```csharp
using NUnit.Framework;
using UnityEngine;

namespace WashEmpire.Tests
{
    public class TimeControllerTests
    {
        private TimeController CreateController()
        {
            var go = new GameObject("TC");
            var tc = go.AddComponent<TimeController>();
            tc.Configure(secondsPerDay: 30f);
            tc.Awake();
            return tc;
        }

        [Test]
        public void Tick_Advances_TimeOfDay_And_Day()
        {
            var tc = CreateController();
            tc.Tick(15f);
            Assert.AreEqual(0, tc.CurrentDayIndex);
            Assert.AreEqual(0.5f, tc.NormalizedDayProgress, 0.001f);

            tc.Tick(15f);
            Assert.AreEqual(1, tc.CurrentDayIndex);
            Object.DestroyImmediate(tc.gameObject);
        }

        [Test]
        public void Tick_Fires_OnWeekEnded_After_Sunday()
        {
            var tc = CreateController();
            int weeksEnded = 0;
            tc.OnWeekEnded += w => weeksEnded++;

            // Advance 7 days = 7 × 30s = 210s
            tc.Tick(210f);

            Assert.AreEqual(1, weeksEnded, "OnWeekEnded should fire exactly once after one full week");
            Assert.AreEqual(1, tc.CurrentWeek);
            Object.DestroyImmediate(tc.gameObject);
        }

        [Test]
        public void Speed_Multiplier_Scales_Tick()
        {
            var tc = CreateController();
            tc.SetSpeed(3f);
            tc.Tick(10f);
            // 10s × 3x = 30s real progress = 1 day
            Assert.AreEqual(1, tc.CurrentDayIndex);
            Object.DestroyImmediate(tc.gameObject);
        }

        [Test]
        public void Pause_Stops_Tick()
        {
            var tc = CreateController();
            tc.SetSpeed(0f);
            tc.Tick(60f);
            Assert.AreEqual(0, tc.CurrentDayIndex);
            Object.DestroyImmediate(tc.gameObject);
        }
    }
}
```

- [ ] **Step 2: Run tests, verify they fail**

Test Runner → run `TimeControllerTests`. Expected: 4 fails (class doesn't exist).

- [ ] **Step 3: Implement TimeController**

Create `Assets/Scripts/Core/TimeController.cs`:

```csharp
using System;
using UnityEngine;

namespace WashEmpire
{
    public class TimeController : MonoBehaviour
    {
        public static TimeController Instance { get; private set; }

        [SerializeField] private float secondsPerDay = 30f;
        [SerializeField] private float speedMultiplier = 1f;

        private float dayProgress;
        private int dayIndex;

        public int CurrentDayIndex => dayIndex;
        public int CurrentWeek => dayIndex / 7;
        public int DayOfWeek => dayIndex % 7;
        public float NormalizedDayProgress => dayProgress / secondsPerDay;
        public float SpeedMultiplier => speedMultiplier;
        public bool IsPaused => Mathf.Approximately(speedMultiplier, 0f);

        public event Action<int> OnDayChanged;
        public event Action<int> OnWeekEnded;

        public void Configure(float secondsPerDay)
        {
            this.secondsPerDay = secondsPerDay;
        }

        public void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Update()
        {
            Tick(Time.deltaTime);
        }

        public void Tick(float realDeltaSeconds)
        {
            float scaled = realDeltaSeconds * speedMultiplier;
            dayProgress += scaled;

            while (dayProgress >= secondsPerDay)
            {
                dayProgress -= secondsPerDay;
                dayIndex++;
                OnDayChanged?.Invoke(dayIndex);
                if (DayOfWeek == 0)
                {
                    OnWeekEnded?.Invoke(CurrentWeek);
                }
            }
        }

        public void SetSpeed(float multiplier)
        {
            speedMultiplier = Mathf.Clamp(multiplier, 0f, 100f);
        }
    }
}
```

- [ ] **Step 4: Run tests, verify they pass**

Test Runner → all 4 `TimeControllerTests` PASS.

- [ ] **Step 5: Place TimeController in scene**

Open `Lot01.unity`, select `_Managers`, Add Component → `TimeController`. Set `Seconds Per Day = 30`. Press Play and observe console logs (you can add a temporary `Debug.Log` in `OnDayChanged` to confirm).

- [ ] **Step 6: Commit**

```bash
git add WashEmpire/Assets/Scripts/Core/TimeController.cs WashEmpire/Assets/Tests/EditMode/TimeControllerTests.cs
git commit -m "Sprint 2.A: TimeController with day/week clock and speed multiplier"
```

---

### Task 5: TimeControlsHUD — pause/1x/3x/10x + day readout

**Files:**
- Create: `Assets/Scripts/UI/TimeControlsHUD.cs`
- Modify: `Assets/Lot01.unity` (add HUD)

- [ ] **Step 1: Implement HUD script**

Create `Assets/Scripts/UI/TimeControlsHUD.cs`:

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class TimeControlsHUD : MonoBehaviour
    {
        [SerializeField] private TMP_Text dayLabel;
        [SerializeField] private Button pauseButton;
        [SerializeField] private Button speed1xButton;
        [SerializeField] private Button speed3xButton;
        [SerializeField] private Button speed10xButton;

        private static readonly string[] DayNames = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };

        private void OnEnable()
        {
            pauseButton.onClick.AddListener(() => TimeController.Instance.SetSpeed(0f));
            speed1xButton.onClick.AddListener(() => TimeController.Instance.SetSpeed(1f));
            speed3xButton.onClick.AddListener(() => TimeController.Instance.SetSpeed(3f));
            speed10xButton.onClick.AddListener(() => TimeController.Instance.SetSpeed(10f));
        }

        private void OnDisable()
        {
            pauseButton.onClick.RemoveAllListeners();
            speed1xButton.onClick.RemoveAllListeners();
            speed3xButton.onClick.RemoveAllListeners();
            speed10xButton.onClick.RemoveAllListeners();
        }

        private void Update()
        {
            if (TimeController.Instance == null || dayLabel == null) return;
            var tc = TimeController.Instance;
            dayLabel.text = $"Week {tc.CurrentWeek + 1} • {DayNames[tc.DayOfWeek]}";
        }
    }
}
```

- [ ] **Step 2: Build the HUD in scene**

In `Lot01.unity`:
1. Select `Canvas` → right-click → UI → Panel. Name it `TimeControlsPanel`. Anchor top-center, size 400×60, position offset Y = -20.
2. Right-click `TimeControlsPanel` → UI → Text – TextMeshPro. Name `DayLabel`. Anchor center-left, size 180×40.
3. Right-click `TimeControlsPanel` → UI → Button. Duplicate 3 times. Name them `PauseBtn`, `Speed1xBtn`, `Speed3xBtn`, `Speed10xBtn`. Use a HorizontalLayoutGroup on the panel. Set button text to `||`, `1x`, `3x`, `10x`.
4. Add `TimeControlsHUD` component to `TimeControlsPanel`. Drag the four buttons + DayLabel into its Inspector slots.

- [ ] **Step 3: Press Play, verify**

- The day label shows `Week 1 • Mon` and progresses through Tue/Wed/...
- Clicking `||` halts the day clock.
- Clicking `3x` accelerates by 3× (each in-game day = 10s real).
- Clicking `10x` accelerates by 10× (each in-game day = 3s real).
- Cars continue spawning regardless (Sprint 1 spawner uses `Time.deltaTime` not the time controller — this is fine for slice).

- [ ] **Step 4: Commit**

```bash
git add WashEmpire/Assets/Scripts/UI/TimeControlsHUD.cs WashEmpire/Assets/Lot01.unity
git commit -m "Sprint 2.A: TimeControlsHUD pause/1x/3x/10x + day readout"
```

---

### Task 6: LotEconomy — weekly fixed cost calculation

**Files:**
- Create: `Assets/Scripts/Economy/LotEconomy.cs`
- Test: extend `Assets/Tests/EditMode/CashFlowTests.cs`

- [ ] **Step 1: Add a failing test**

Append to `CashFlowTests.cs`:

```csharp
[Test]
public void Tier1_FixedCosts_Match_Economy_Spec()
{
    // Per economy spec §5.1: Tier 1 lot fixed costs
    // Lease 300 + Electricity 100 + Water 150 + Insurance 40 + Permits 20 = $610/week
    var go = new GameObject();
    var economy = go.AddComponent<LotEconomy>();
    economy.ConfigureTier1();

    Assert.AreEqual(610, economy.WeeklyFixedCosts);
    Object.DestroyImmediate(go);
}
```

- [ ] **Step 2: Run test, verify FAIL**

- [ ] **Step 3: Implement LotEconomy**

Create `Assets/Scripts/Economy/LotEconomy.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class LotEconomy : MonoBehaviour
    {
        [SerializeField] private int leasePerWeek = 300;
        [SerializeField] private int electricityPerWeek = 100;
        [SerializeField] private int waterPerWeek = 150;
        [SerializeField] private int insurancePerWeek = 40;
        [SerializeField] private int permitsPerWeek = 20;

        public int WeeklyFixedCosts => leasePerWeek + electricityPerWeek + waterPerWeek + insurancePerWeek + permitsPerWeek;

        public int WeeklyRevenue { get; private set; }
        public int WeeklyVariableCosts { get; private set; }
        public int WeeklySlippage { get; private set; }
        public int WeeklyProfit => WeeklyRevenue - WeeklyVariableCosts - WeeklyFixedCosts;

        public void ConfigureTier1()
        {
            leasePerWeek = 300;
            electricityPerWeek = 100;
            waterPerWeek = 150;
            insurancePerWeek = 40;
            permitsPerWeek = 20;
        }

        public void RecordRevenue(int amount) => WeeklyRevenue += amount;
        public void RecordVariableCost(int amount) => WeeklyVariableCosts += amount;
        public void RecordSlippage(int amount) => WeeklySlippage += amount;

        public void ResetForNewWeek()
        {
            WeeklyRevenue = 0;
            WeeklyVariableCosts = 0;
            WeeklySlippage = 0;
        }
    }
}
```

- [ ] **Step 4: Run test, verify PASS**

- [ ] **Step 5: Add LotEconomy to scene**

In `Lot01.unity`, add `LotEconomy` component to `_Managers`. Defaults are Tier 1 values.

- [ ] **Step 6: Commit**

```bash
git add WashEmpire/Assets/Scripts/Economy/LotEconomy.cs WashEmpire/Assets/Tests/EditMode/CashFlowTests.cs
git commit -m "Sprint 2.A: LotEconomy with Tier 1 fixed cost baseline ($610/wk)"
```

---

## Sub-phase 2B — Bay Cash Accumulation (½ Week)

### Task 7: BayController — accumulate CashInBin with 90/10 split + 3% slippage

**Files:**
- Modify: `Assets/Scripts/Lots/BayController.cs`
- Create: `Assets/Scripts/Economy/Changer.cs`
- Test: extend `Assets/Tests/EditMode/CashFlowTests.cs`

- [ ] **Step 1: Add failing tests**

Append to `CashFlowTests.cs`:

```csharp
[Test]
public void CashBay_Routes_90Percent_To_Bin_With_3Percent_Slippage()
{
    var bayGO = new GameObject("Bay");
    var bay = bayGO.AddComponent<BayController>();
    var changerGO = new GameObject("Changer");
    var changer = changerGO.AddComponent<Changer>();
    bay.SetChanger(changer);
    bay.SetSlippageRate(0.03f);

    bay.SetHasCardReader(false);
    bay.SettlePayout(payout: 5);
    // Expected: bin += 5 × 0.90 × 0.97 ≈ 4.365 → 4 (int truncation), changer += 5 × 0.10 × 0.97 ≈ 0.485 → 0
    // Slippage = 5 - (4 + 0) = 1 (or 0.15 in real cents — we round)
    Assert.AreEqual(4, bay.CashInBin);
    Assert.AreEqual(0, changer.BillStacker);

    // Repeat 100 times to amortize int truncation
    bayGO.GetComponent<BayController>().ResetForTest();
    changerGO.GetComponent<Changer>().ResetForTest();
    for (int i = 0; i < 100; i++) bay.SettlePayout(5);
    // Expected: bin ≈ 100 × 5 × 0.90 × 0.97 = 436.5 → ~436
    //          changer ≈ 100 × 5 × 0.10 × 0.97 = 48.5 → ~48
    Assert.That(bay.CashInBin, Is.InRange(430, 440));
    Assert.That(changer.BillStacker, Is.InRange(45, 51));

    Object.DestroyImmediate(bayGO);
    Object.DestroyImmediate(changerGO);
}

[Test]
public void CardBay_Deposits_Directly_With_3Percent_Fee_NoBin()
{
    var gmGO = new GameObject("GM");
    var gm = gmGO.AddComponent<GameManager>();
    gm.SetStartingCash(0);
    gm.Awake();

    var bayGO = new GameObject("Bay");
    var bay = bayGO.AddComponent<BayController>();
    var changerGO = new GameObject("Changer");
    var changer = changerGO.AddComponent<Changer>();
    bay.SetChanger(changer);
    bay.SetCardProcessingFee(0.03f);
    bay.SetHasCardReader(true);

    for (int i = 0; i < 100; i++) bay.SettlePayout(5);

    Assert.AreEqual(0, bay.CashInBin, "Card bay does not fill bin");
    Assert.AreEqual(0, changer.BillStacker, "Card bay does not feed changer");
    Assert.That(gm.DepositedCash, Is.InRange(480, 490), "Card bay deposits 100×5×0.97 ≈ 485");

    Object.DestroyImmediate(bayGO);
    Object.DestroyImmediate(changerGO);
    Object.DestroyImmediate(gmGO);
}

[Test]
public void CollectFromBin_Returns_And_Zeros()
{
    var bayGO = new GameObject("Bay");
    var bay = bayGO.AddComponent<BayController>();
    var changerGO = new GameObject("Changer");
    var changer = changerGO.AddComponent<Changer>();
    bay.SetChanger(changer);

    for (int i = 0; i < 100; i++) bay.SettlePayout(5);
    int collected = bay.CollectFromBin();

    Assert.That(collected, Is.GreaterThan(0));
    Assert.AreEqual(0, bay.CashInBin);

    Object.DestroyImmediate(bayGO);
    Object.DestroyImmediate(changerGO);
}
```

- [ ] **Step 2: Run tests, verify FAIL**

Three new tests should fail with "method not defined" / "type not found".

- [ ] **Step 3: Implement Changer**

Create `Assets/Scripts/Economy/Changer.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class Changer : MonoBehaviour
    {
        public int BillStacker { get; private set; }

        public void AddBills(int amount) => BillStacker += amount;

        public int CollectFromStacker()
        {
            int collected = BillStacker;
            BillStacker = 0;
            return collected;
        }

        public void ResetForTest() => BillStacker = 0;
    }
}
```

- [ ] **Step 4: Refactor BayController**

Replace `Assets/Scripts/Lots/BayController.cs`:

```csharp
using System.Collections;
using UnityEngine;

namespace WashEmpire
{
    public class BayController : MonoBehaviour
    {
        [SerializeField] private Transform serviceSpot;
        [SerializeField] private float washDuration = 6f;
        [SerializeField] private int payout = 5;

        [Header("Cash Routing (Sprint 2)")]
        [SerializeField] private Changer changer;
        [SerializeField] private bool hasCardReader = false;
        [Range(0f, 0.2f)]
        [SerializeField] private float slippageRate = 0.03f;
        [Range(0f, 0.1f)]
        [SerializeField] private float cardProcessingFee = 0.03f;
        [SerializeField, Range(0f, 1f)] private float bayBinShare = 0.90f;

        public bool IsOccupied { get; private set; }
        public Transform ServiceSpot => serviceSpot != null ? serviceSpot : transform;
        public int CashInBin { get; private set; }
        public int LifetimeRevenue { get; private set; }
        public int LifetimeSlippage { get; private set; }
        public bool HasCardReader => hasCardReader;

        public bool TryReserve()
        {
            if (IsOccupied) return false;
            IsOccupied = true;
            return true;
        }

        public void Release() => IsOccupied = false;

        public IEnumerator RunWash()
        {
            yield return new WaitForSeconds(washDuration);
            SettlePayout(payout);
        }

        public void SettlePayout(int amount)
        {
            LifetimeRevenue += amount;

            if (hasCardReader)
            {
                int net = Mathf.RoundToInt(amount * (1f - cardProcessingFee));
                if (GameManager.Instance != null) GameManager.Instance.Deposit(net);
                return;
            }

            float netCashRevenue = amount * (1f - slippageRate);
            int slippage = amount - Mathf.RoundToInt(netCashRevenue);
            LifetimeSlippage += slippage;

            int toBin = Mathf.RoundToInt(netCashRevenue * bayBinShare);
            int toChanger = Mathf.RoundToInt(netCashRevenue) - toBin;

            CashInBin += toBin;
            if (changer != null) changer.AddBills(toChanger);
        }

        public int CollectFromBin()
        {
            int collected = CashInBin;
            CashInBin = 0;
            return collected;
        }

        // Test hooks
        public void SetChanger(Changer c) => changer = c;
        public void SetHasCardReader(bool v) => hasCardReader = v;
        public void SetSlippageRate(float r) => slippageRate = r;
        public void SetCardProcessingFee(float f) => cardProcessingFee = f;
        public void ResetForTest() { CashInBin = 0; LifetimeRevenue = 0; LifetimeSlippage = 0; }
    }
}
```

- [ ] **Step 5: Run tests, verify PASS**

All three new tests should pass.

- [ ] **Step 6: Wire scene references**

In `Lot01.unity`:
1. Add empty GameObject `Changer` at lot edge (e.g., position `(-3, 0, 4)`). Add `Changer` component.
2. Select `Bay_01`. In the BayController inspector, drag the `Changer` GameObject into the `Changer` field. Confirm `Has Card Reader` is unchecked, `Slippage Rate` 0.03, `Bay Bin Share` 0.90.

- [ ] **Step 7: Press Play, verify**

Press Play. Watch a few cars complete washes. Open the BayController inspector with `Bay_01` selected — `CashInBin` should tick upward by ~4.36 per wash (rounded to 4 most washes, occasional 5). Changer's `BillStacker` should tick upward by 0–1 per wash.

The CashHUD will *no longer* tick up on each wash — that's expected. Cash now accumulates in bins until the ritual collects it.

- [ ] **Step 8: Commit**

```bash
git add WashEmpire/Assets/Scripts/Lots/BayController.cs WashEmpire/Assets/Scripts/Economy/Changer.cs WashEmpire/Assets/Tests/EditMode/CashFlowTests.cs WashEmpire/Assets/Lot01.unity
git commit -m "Sprint 2.B: BayController accumulates CashInBin with 90/10 split + 3% slippage; add Changer"
```

---

### Task 8: Remove the obsolete AddCash shim

**Files:**
- Modify: `Assets/Scripts/Core/GameManager.cs`

- [ ] **Step 1: Delete the obsolete method**

Remove the `[Obsolete] AddCash` shim added in Task 3 — no callers remain after Task 7.

- [ ] **Step 2: Verify no compile errors**

Open Unity. No callers of `AddCash` should exist. If there are, fix to use `Deposit`.

- [ ] **Step 3: Commit**

```bash
git add WashEmpire/Assets/Scripts/Core/GameManager.cs
git commit -m "Sprint 2.B: drop obsolete GameManager.AddCash shim"
```

---

## Sub-phase 2C — Office & Stations Geometry (Week)

### Task 9: Build the office interior

**Files:**
- Modify: `Assets/Lot01.unity` (manual scene work)

This task is entirely Unity Editor work. No code.

- [ ] **Step 1: Create office geometry**

In `Lot01.unity`:
1. Right-click in Hierarchy → Create Empty → name `Office`. Position at `(8, 0, 4)`.
2. Under `Office`, add 4 cube walls forming a 6×6×3m room with a doorway gap on the south wall (facing -Z, lot side):
   - `Wall_North`: Cube, scale `(6, 3, 0.2)`, position `(0, 1.5, 3)` local.
   - `Wall_East`:  Cube, scale `(0.2, 3, 6)`, position `(3, 1.5, 0)` local.
   - `Wall_West`:  Cube, scale `(0.2, 3, 6)`, position `(-3, 1.5, 0)` local.
   - `Wall_South_Left`: Cube, scale `(2.4, 3, 0.2)`, position `(-1.8, 1.5, -3)` local.
   - `Wall_South_Right`: Cube, scale `(2.4, 3, 0.2)`, position `(1.8, 1.5, -3)` local.
   - Doorway gap at south-center, ~1.2m wide.
3. Add `Floor`: Cube, scale `(6, 0.05, 6)`, position `(0, 0.025, 0)` local.
4. Add a `NavMesh Modifier` component to each wall and set `Override Area = Not Walkable`. Add a NavMesh Modifier to `Floor` set to Walkable.

- [ ] **Step 2: Place office stations as primitives**

Inside `Office`:
1. `Desk`: Cube, scale `(2, 0.8, 1)`, position `(0, 0.4, 1)` local. Add empty child `OfficeDeskAnchor`.
2. `MoneyCounter`: Cube, scale `(0.6, 0.4, 0.4)`, position `(-1.5, 0.95, 1)` local. Add empty child `MoneyCounterAnchor` at `(0, 0.6, -0.6)` local (FP camera position).
3. `CoinSifter`: Cube, scale `(0.8, 0.5, 0.5)`, position `(1.5, 1.1, 1)` local. Add empty child `CoinSifterAnchor` at `(0, 0.6, -0.6)` local.
4. `Terminal`: Cube, scale `(0.4, 0.6, 0.3)`, position `(0, 1.0, 1)` local. Add empty child `TerminalAnchor` at `(0, 0.0, -0.5)` local.

- [ ] **Step 3: Place changer outside the office**

If not already placed in Task 7: Add `Changer` GameObject at `(-3, 0, 0)` (on the lot, near a bay). Add a Cube as visual: scale `(0.6, 1.5, 0.4)`, position offset `(0, 0.75, 0)`. Add empty child `ChangerAnchor` at `(0, 1.2, -0.5)` (FP camera at face height in front).

- [ ] **Step 4: Place door portal**

Create `OfficeDoorTrigger`: empty GameObject at `Office/(0, 1, -3)` local. Add Box Collider, set Is Trigger true, scale `(1.2, 2, 0.5)`. This is what the player walks through to "enter the office." We'll wire it in Task 17.

- [ ] **Step 5: Re-bake NavMesh**

Select `_Navigation` → Inspector → NavMeshSurface → Bake. Confirm:
- The lot's open ground is walkable.
- The floor inside the office is walkable.
- The doorway gap is walkable (continuous NavMesh from lot into office).
- Walls block navigation.

- [ ] **Step 6: Verify with a test car**

Press Play. Cars should still drive bay → exit normally (don't enter office; they only know about Bay_01 ServiceSpot). If a car gets confused, check that the office area isn't accidentally on the route to the exit.

- [ ] **Step 7: Commit**

```bash
git add WashEmpire/Assets/Lot01.unity WashEmpire/Assets/Lot01/
git commit -m "Sprint 2.C: office interior + station primitives + NavMesh re-bake"
```

---

## Sub-phase 2D — Ritual State Machine (1.5 Weeks)

### Task 10: Tray data class

**Files:**
- Create: `Assets/Scripts/Ritual/Tray.cs`
- Test: `Assets/Tests/EditMode/RitualStateMachineTests.cs`

- [ ] **Step 1: Failing test**

Create `Assets/Tests/EditMode/RitualStateMachineTests.cs`:

```csharp
using NUnit.Framework;

namespace WashEmpire.Tests
{
    public class TrayTests
    {
        [Test]
        public void Tray_Adds_And_Drains_Per_Column()
        {
            var tray = new Tray();
            tray.AddCoins(700);
            tray.AddBills(87);
            Assert.AreEqual(700, tray.Coins);
            Assert.AreEqual(87, tray.Bills);
            Assert.AreEqual(787, tray.Total);

            int drained = tray.DrainCoins();
            Assert.AreEqual(700, drained);
            Assert.AreEqual(0, tray.Coins);
            Assert.AreEqual(87, tray.Total);
        }
    }
}
```

- [ ] **Step 2: Run test, verify FAIL**

- [ ] **Step 3: Implement Tray**

Create `Assets/Scripts/Ritual/Tray.cs`:

```csharp
using System;

namespace WashEmpire
{
    [Serializable]
    public class Tray
    {
        public int Bills { get; private set; }
        public int Coins { get; private set; }
        public int Tokens { get; private set; }

        public int Total => Bills + Coins + Tokens;

        public event Action OnChanged;

        public void AddBills(int amount) { Bills += amount; OnChanged?.Invoke(); }
        public void AddCoins(int amount) { Coins += amount; OnChanged?.Invoke(); }
        public void AddTokens(int amount) { Tokens += amount; OnChanged?.Invoke(); }

        public int DrainBills() { int v = Bills; Bills = 0; OnChanged?.Invoke(); return v; }
        public int DrainCoins() { int v = Coins; Coins = 0; OnChanged?.Invoke(); return v; }
        public int DrainTokens() { int v = Tokens; Tokens = 0; OnChanged?.Invoke(); return v; }

        public void Clear() { Bills = 0; Coins = 0; Tokens = 0; OnChanged?.Invoke(); }
    }
}
```

- [ ] **Step 4: Run tests, verify PASS**

- [ ] **Step 5: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/Tray.cs WashEmpire/Assets/Tests/EditMode/RitualStateMachineTests.cs
git commit -m "Sprint 2.D: Tray runtime data class"
```

---

### Task 11: CollectionStation abstract base

**Files:**
- Create: `Assets/Scripts/Ritual/Stations/CollectionStation.cs`

- [ ] **Step 1: Implement abstract base**

Create `Assets/Scripts/Ritual/Stations/CollectionStation.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public abstract class CollectionStation : MonoBehaviour
    {
        [SerializeField] protected Transform entrancePoint;
        [SerializeField] protected Transform cameraAnchor;
        [SerializeField] protected string displayName = "Station";

        public Transform EntrancePoint => entrancePoint != null ? entrancePoint : transform;
        public Transform CameraAnchor => cameraAnchor != null ? cameraAnchor : transform;
        public string DisplayName => displayName;
        public bool IsComplete { get; protected set; }

        /// <summary>
        /// Called once per frame while the player is at this station and the ritual is in Interacting state.
        /// Stations implement their hold/click/auto behavior here. Set IsComplete = true when done.
        /// </summary>
        public abstract void Tick(StationInputContext input);

        public virtual void OnArrive(Tray tray) { }
        public virtual void OnLeave(Tray tray) { }
        public virtual void Reset() { IsComplete = false; }
    }

    public struct StationInputContext
    {
        public bool HoldPrimary;       // mouse/touch pressed
        public bool ClickPrimaryDown;  // mouse/touch this-frame down
        public Tray Tray;
    }
}
```

- [ ] **Step 2: Verify compile**

Unity console clean.

- [ ] **Step 3: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/Stations/CollectionStation.cs
git commit -m "Sprint 2.D: CollectionStation abstract base"
```

---

### Task 12: BayBinStation

**Files:**
- Create: `Assets/Scripts/Ritual/Stations/BayBinStation.cs`

- [ ] **Step 1: Implement**

Create `Assets/Scripts/Ritual/Stations/BayBinStation.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class BayBinStation : CollectionStation
    {
        [SerializeField] private BayController bay;
        [SerializeField] private float holdDurationToEmpty = 3f;

        private float holdProgress;

        public override void OnArrive(Tray tray)
        {
            holdProgress = 0f;
            if (bay != null && bay.HasCardReader) IsComplete = true;
        }

        public override void Tick(StationInputContext input)
        {
            if (IsComplete || bay == null) return;
            if (bay.CashInBin == 0)
            {
                IsComplete = true;
                return;
            }

            if (input.HoldPrimary)
            {
                holdProgress += Time.deltaTime;
                if (holdProgress >= holdDurationToEmpty)
                {
                    int collected = bay.CollectFromBin();
                    input.Tray.AddCoins(collected);
                    IsComplete = true;
                }
            }
            else
            {
                // Resumable; don't reset on release per spec §3.6
            }
        }

        public float HoldProgressNormalized => Mathf.Clamp01(holdProgress / holdDurationToEmpty);
    }
}
```

- [ ] **Step 2: Verify compile**

- [ ] **Step 3: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/Stations/BayBinStation.cs
git commit -m "Sprint 2.D: BayBinStation hold-to-empty"
```

---

### Task 13: ChangerStation

**Files:**
- Create: `Assets/Scripts/Ritual/Stations/ChangerStation.cs`

- [ ] **Step 1: Implement**

Create `Assets/Scripts/Ritual/Stations/ChangerStation.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class ChangerStation : CollectionStation
    {
        [SerializeField] private Changer changer;
        [SerializeField] private float holdDurationToEmpty = 3f;

        private float holdProgress;

        public override void OnArrive(Tray tray) => holdProgress = 0f;

        public override void Tick(StationInputContext input)
        {
            if (IsComplete || changer == null) return;
            if (changer.BillStacker == 0)
            {
                IsComplete = true;
                return;
            }

            if (input.HoldPrimary)
            {
                holdProgress += Time.deltaTime;
                if (holdProgress >= holdDurationToEmpty)
                {
                    int collected = changer.CollectFromStacker();
                    input.Tray.AddBills(collected);
                    IsComplete = true;
                }
            }
        }

        public float HoldProgressNormalized => Mathf.Clamp01(holdProgress / holdDurationToEmpty);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/Stations/ChangerStation.cs
git commit -m "Sprint 2.D: ChangerStation hold-to-empty bill stacker"
```

---

### Task 14: OfficeDoorStation, MoneyCounterStation, CoinSifterStation

**Files:**
- Create: `Assets/Scripts/Ritual/Stations/OfficeDoorStation.cs`
- Create: `Assets/Scripts/Ritual/Stations/MoneyCounterStation.cs`
- Create: `Assets/Scripts/Ritual/Stations/CoinSifterStation.cs`

- [ ] **Step 1: OfficeDoorStation**

Create `Assets/Scripts/Ritual/Stations/OfficeDoorStation.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class OfficeDoorStation : CollectionStation
    {
        [SerializeField] private float autoCompleteDelay = 1.5f;
        [SerializeField] private GameObject[] doorBlockers;

        private float t;

        public override void OnArrive(Tray tray)
        {
            t = 0f;
            foreach (var b in doorBlockers) if (b != null) b.SetActive(true);
        }

        public override void Tick(StationInputContext input)
        {
            if (IsComplete) return;
            t += Time.deltaTime;
            if (t >= autoCompleteDelay) IsComplete = true;
        }
    }
}
```

`doorBlockers` is a list of inactive collider GameObjects that, when activated, block the doorway, preventing exit.

- [ ] **Step 2: MoneyCounterStation**

Create `Assets/Scripts/Ritual/Stations/MoneyCounterStation.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class MoneyCounterStation : CollectionStation
    {
        [SerializeField] private float runDuration = 5f;
        private float t;
        private bool running;
        private int totalToCount;

        public override void OnArrive(Tray tray)
        {
            t = 0f;
            running = false;
            totalToCount = tray.Bills;
        }

        public override void Tick(StationInputContext input)
        {
            if (IsComplete) return;

            if (!running && input.ClickPrimaryDown)
            {
                running = true;
                input.Tray.DrainBills();
            }

            if (running)
            {
                t += Time.deltaTime;
                if (t >= runDuration)
                {
                    if (GameManager.Instance != null) GameManager.Instance.Deposit(totalToCount);
                    IsComplete = true;
                }
            }
        }

        public float RunProgressNormalized => Mathf.Clamp01(t / runDuration);
        public int Total => totalToCount;
        public bool IsRunning => running;
    }
}
```

- [ ] **Step 3: CoinSifterStation**

Create `Assets/Scripts/Ritual/Stations/CoinSifterStation.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class CoinSifterStation : CollectionStation
    {
        [SerializeField] private float runDuration = 6f;
        private float t;
        private bool running;
        private int totalToSift;

        public override void OnArrive(Tray tray)
        {
            t = 0f;
            running = false;
            totalToSift = tray.Coins;
        }

        public override void Tick(StationInputContext input)
        {
            if (IsComplete) return;

            if (!running && input.ClickPrimaryDown)
            {
                running = true;
                input.Tray.DrainCoins();
            }

            if (running)
            {
                t += Time.deltaTime;
                if (t >= runDuration)
                {
                    if (GameManager.Instance != null) GameManager.Instance.Deposit(totalToSift);
                    IsComplete = true;
                }
            }
        }

        public float RunProgressNormalized => Mathf.Clamp01(t / runDuration);
        public int Total => totalToSift;
        public bool IsRunning => running;
    }
}
```

- [ ] **Step 4: Verify all three compile**

- [ ] **Step 5: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/Stations/OfficeDoorStation.cs WashEmpire/Assets/Scripts/Ritual/Stations/MoneyCounterStation.cs WashEmpire/Assets/Scripts/Ritual/Stations/CoinSifterStation.cs
git commit -m "Sprint 2.D: OfficeDoor, MoneyCounter, CoinSifter stations"
```

---

### Task 15: OfficeTerminalStation

**Files:**
- Create: `Assets/Scripts/Ritual/Stations/OfficeTerminalStation.cs`

The terminal's job is just to gate the ritual end and signal "Continue clicked." The receipt itself is assembled in the UI layer (Task 23) by reading from the counter/sifter stations and `LotEconomy`, since those are the authoritative totals after the run animations.

- [ ] **Step 1: Implement**

Create `Assets/Scripts/Ritual/Stations/OfficeTerminalStation.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class OfficeTerminalStation : CollectionStation
    {
        private bool continuePressed;

        public override void OnArrive(Tray tray) => continuePressed = false;

        public override void Tick(StationInputContext input)
        {
            if (IsComplete) return;
            if (continuePressed) IsComplete = true;
        }

        public void OnContinueClicked() => continuePressed = true;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/Stations/OfficeTerminalStation.cs
git commit -m "Sprint 2.D: OfficeTerminalStation gates ritual end on Continue"
```

---

### Task 16: PlayerNavAgent

**Files:**
- Create: `Assets/Scripts/Ritual/PlayerNavAgent.cs`

- [ ] **Step 1: Implement**

Create `Assets/Scripts/Ritual/PlayerNavAgent.cs`:

```csharp
using UnityEngine;
using UnityEngine.AI;

namespace WashEmpire
{
    [RequireComponent(typeof(NavMeshAgent))]
    public class PlayerNavAgent : MonoBehaviour
    {
        [SerializeField] private float arrivalThreshold = 0.4f;
        private NavMeshAgent agent;
        private bool destinationSet;

        public bool HasArrived
        {
            get
            {
                if (!destinationSet) return false;
                if (agent.pathPending) return false;
                return agent.remainingDistance <= arrivalThreshold && agent.velocity.sqrMagnitude < 0.01f;
            }
        }

        public Vector3 Forward => agent.velocity.sqrMagnitude > 0.01f ? agent.velocity.normalized : transform.forward;

        private void Awake() => agent = GetComponent<NavMeshAgent>();

        public void GoTo(Vector3 worldPosition)
        {
            agent.SetDestination(worldPosition);
            destinationSet = true;
        }

        public void Stop()
        {
            agent.ResetPath();
            destinationSet = false;
        }
    }
}
```

- [ ] **Step 2: Create PlayerNavAgent prefab**

In Unity:
1. Create empty GameObject `PlayerNavAgent` at origin.
2. Add `NavMeshAgent` component. Set Speed = 2.5, Angular Speed = 300, Stopping Distance = 0.3, Radius = 0.3, Height = 1.7.
3. Add `PlayerNavAgent` component.
4. Drag into `Assets/Prefabs/PlayerNavAgent.prefab`. Delete from scene.

- [ ] **Step 3: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/PlayerNavAgent.cs WashEmpire/Assets/Prefabs/PlayerNavAgent.prefab WashEmpire/Assets/Prefabs/PlayerNavAgent.prefab.meta
git commit -m "Sprint 2.D: PlayerNavAgent prefab + script"
```

---

### Task 17: FPCameraController + Cinemachine vcam setup

**Files:**
- Create: `Assets/Scripts/Ritual/FPCameraController.cs`
- Modify: `Assets/Lot01.unity`

- [ ] **Step 1: Implement script**

Create `Assets/Scripts/Ritual/FPCameraController.cs`:

```csharp
using UnityEngine;

namespace WashEmpire
{
    public class FPCameraController : MonoBehaviour
    {
        [SerializeField] private PlayerNavAgent target;
        [SerializeField] private Vector3 eyeOffset = new(0, 1.65f, 0);
        [SerializeField] private float rotationLerp = 8f;

        public void SetTarget(PlayerNavAgent agent) => target = agent;

        private void LateUpdate()
        {
            if (target == null) return;
            transform.position = target.transform.position + eyeOffset;

            Vector3 fwd = target.Forward;
            fwd.y = 0;
            if (fwd.sqrMagnitude > 0.001f)
            {
                Quaternion targetRot = Quaternion.LookRotation(fwd);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, rotationLerp * Time.deltaTime);
            }
        }
    }
}
```

- [ ] **Step 2: Create Cinemachine virtual cameras in scene**

In `Lot01.unity`:
1. Add Component on `Main Camera`: `CinemachineBrain`. Default blend = `EaseInOut`, default time = 1.0s.
2. Hierarchy → Create Empty `_Cameras`. Children:
   - `vcam_Overhead`: Add `CinemachineCamera` component. Position/rotation match Sprint 1 overhead camera. Priority 10. Add Standard "Position Composer" tracking nothing for now.
   - `vcam_FP`: Add `CinemachineCamera`. Priority 0 (will rise during ritual). Add Standard "Position Composer" — leave Follow target empty; we'll set it programmatically. Add `FPCameraController` component to this same GameObject; we'll route position via this script (Cinemachine treats it as the world transform).
   - `vcam_Station_BayBin1`: Add `CinemachineCamera`. Priority 0. Position parented to `Bay_01/ServiceSpot/BinAnchor` (create empty child at `(0, 1.2, -0.6)` to face the bin). 
   - Repeat for `vcam_Station_BayBin2`, `vcam_Station_Changer`, `vcam_Station_OfficeDoor`, `vcam_Station_MoneyCounter`, `vcam_Station_CoinSifter`, `vcam_Station_Terminal`. Each parented to its station's `CameraAnchor`.

- [ ] **Step 3: Disable OverheadCameraController during FP**

Modify `Assets/Scripts/Camera/OverheadCameraController.cs`:

Find the `Update` method and wrap the contents:

```csharp
private void Update()
{
    if (RitualController.Instance != null && RitualController.Instance.IsActive) return;
    // ... existing pan/rotate/zoom code
}
```

(Forward-references RitualController, which we create next task. This compile-time fails until Task 18; that's fine — we'll resolve in 18.)

- [ ] **Step 4: Commit (with note)**

```bash
git add WashEmpire/Assets/Scripts/Ritual/FPCameraController.cs WashEmpire/Assets/Scripts/Camera/OverheadCameraController.cs WashEmpire/Assets/Lot01.unity
git commit -m "Sprint 2.D: FPCameraController + Cinemachine vcams (compile-fails until Task 18 lands)"
```

If Unity's compile errors block further work, temporarily comment the RitualController check; restore after Task 18.

---

### Task 18: RitualController state machine

**Files:**
- Create: `Assets/Scripts/Ritual/RitualController.cs`
- Test: extend `Assets/Tests/EditMode/RitualStateMachineTests.cs`

- [ ] **Step 1: Failing tests**

Append to `RitualStateMachineTests.cs`:

```csharp
using UnityEngine;

public class RitualStateMachineTests
{
    [Test]
    public void StartRitual_From_Idle_Transitions_To_Walking()
    {
        var go = new GameObject();
        var rc = go.AddComponent<RitualController>();
        rc.ConfigureForTest();

        Assert.AreEqual(RitualController.RitualState.Idle, rc.State);
        rc.StartRitual();
        Assert.AreEqual(RitualController.RitualState.Walking, rc.State);

        Object.DestroyImmediate(go);
    }

    [Test]
    public void Complete_All_Stations_Transitions_To_Done()
    {
        var go = new GameObject();
        var rc = go.AddComponent<RitualController>();

        var s1 = new GameObject().AddComponent<TestStation>();
        var s2 = new GameObject().AddComponent<TestStation>();
        rc.ConfigureForTest(s1, s2);
        rc.StartRitual();

        rc.AdvanceToNextStation();
        s1.MarkComplete();
        rc.OnStationComplete();
        Assert.AreEqual(RitualController.RitualState.Walking, rc.State);

        rc.AdvanceToNextStation();
        s2.MarkComplete();
        rc.OnStationComplete();
        Assert.AreEqual(RitualController.RitualState.Done, rc.State);

        Object.DestroyImmediate(s1.gameObject);
        Object.DestroyImmediate(s2.gameObject);
        Object.DestroyImmediate(go);
    }

    private class TestStation : CollectionStation
    {
        public override void Tick(StationInputContext input) { }
        public void MarkComplete() => IsComplete = true;
    }
}
```

- [ ] **Step 2: Run tests, verify FAIL**

- [ ] **Step 3: Implement RitualController**

Create `Assets/Scripts/Ritual/RitualController.cs`:

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

namespace WashEmpire
{
    public class RitualController : MonoBehaviour
    {
        public static RitualController Instance { get; private set; }

        public enum RitualState { Idle, Walking, AtStation, Interacting, Done }

        [SerializeField] private GameObject playerNavAgentPrefab;
        [SerializeField] private Transform ritualEntryPoint;
        [SerializeField] private List<CollectionStation> stations = new();
        [SerializeField] private FPCameraController fpCamera;

        public RitualState State { get; private set; } = RitualState.Idle;
        public bool IsActive => State != RitualState.Idle && State != RitualState.Done;
        public Tray Tray { get; private set; } = new Tray();
        public CollectionStation CurrentStation { get; private set; }

        public event Action OnRitualStarted;
        public event Action OnRitualCompleted;
        public event Action<CollectionStation> OnStationEntered;
        public event Action<CollectionStation> OnStationExited;

        private PlayerNavAgent player;
        private int stationIndex = -1;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        public void ConfigureForTest(params CollectionStation[] testStations)
        {
            stations = new List<CollectionStation>(testStations);
        }

        public void StartRitual()
        {
            if (State != RitualState.Idle) return;
            Tray.Clear();
            stationIndex = -1;
            foreach (var s in stations) s?.Reset();
            State = RitualState.Walking;
            OnRitualStarted?.Invoke();
        }

        public void AdvanceToNextStation()
        {
            stationIndex++;
            if (stationIndex >= stations.Count)
            {
                EndRitual();
                return;
            }
            CurrentStation = stations[stationIndex];
            if (player != null) player.GoTo(CurrentStation.EntrancePoint.position);
            State = RitualState.Walking;
        }

        public void OnArriveAtStation()
        {
            if (CurrentStation == null) return;
            CurrentStation.OnArrive(Tray);
            State = RitualState.AtStation;
            OnStationEntered?.Invoke(CurrentStation);
        }

        public void BeginInteraction() => State = RitualState.Interacting;

        public void OnStationComplete()
        {
            if (CurrentStation == null) return;
            CurrentStation.OnLeave(Tray);
            OnStationExited?.Invoke(CurrentStation);
            CurrentStation = null;
            if (stationIndex + 1 >= stations.Count) EndRitual();
            else State = RitualState.Walking;
        }

        private void EndRitual()
        {
            State = RitualState.Done;
            OnRitualCompleted?.Invoke();
        }

        private void Update()
        {
            if (State == RitualState.Idle || State == RitualState.Done) return;

            if (State == RitualState.Walking && player != null && player.HasArrived && CurrentStation != null)
            {
                OnArriveAtStation();
            }

            if (State == RitualState.AtStation || State == RitualState.Interacting)
            {
                var ctx = new StationInputContext
                {
                    HoldPrimary = Mouse.HoldPrimary(),
                    ClickPrimaryDown = Mouse.ClickPrimaryDown(),
                    Tray = Tray
                };
                CurrentStation?.Tick(ctx);
                if (CurrentStation != null && CurrentStation.IsComplete)
                {
                    OnStationComplete();
                    AdvanceToNextStation();
                }
            }
        }

        public void RegisterPlayerAgent(PlayerNavAgent agent) => player = agent;
        public void ClearPlayerAgent() => player = null;
    }

    internal static class Mouse
    {
        public static bool HoldPrimary() =>
            UnityEngine.InputSystem.Mouse.current != null &&
            UnityEngine.InputSystem.Mouse.current.leftButton.isPressed;

        public static bool ClickPrimaryDown() =>
            UnityEngine.InputSystem.Mouse.current != null &&
            UnityEngine.InputSystem.Mouse.current.leftButton.wasPressedThisFrame;
    }
}
```

- [ ] **Step 4: Run tests, verify PASS**

- [ ] **Step 5: Resolve Task 17 compile dep**

The OverheadCameraController reference to `RitualController.Instance.IsActive` should now compile cleanly. Verify Unity's console is clean.

- [ ] **Step 6: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/RitualController.cs WashEmpire/Assets/Tests/EditMode/RitualStateMachineTests.cs
git commit -m "Sprint 2.D: RitualController state machine"
```

---

### Task 19: Wire ritual into scene; camera handoff blends

**Files:**
- Modify: `Assets/Lot01.unity`
- Modify: `Assets/Scripts/Ritual/RitualController.cs`

- [ ] **Step 1: Spawn / despawn PlayerNavAgent**

In `RitualController.cs`, augment `StartRitual()` and `EndRitual()`:

```csharp
public void StartRitual()
{
    if (State != RitualState.Idle) return;
    Tray.Clear();
    stationIndex = -1;
    foreach (var s in stations) s?.Reset();

    if (playerNavAgentPrefab != null && ritualEntryPoint != null)
    {
        var go = Instantiate(playerNavAgentPrefab, ritualEntryPoint.position, ritualEntryPoint.rotation);
        player = go.GetComponent<PlayerNavAgent>();
        if (fpCamera != null) fpCamera.SetTarget(player);
    }

    State = RitualState.Walking;
    OnRitualStarted?.Invoke();
    AdvanceToNextStation();
}

private void EndRitual()
{
    State = RitualState.Done;
    if (player != null) Destroy(player.gameObject);
    player = null;
    OnRitualCompleted?.Invoke();
}
```

- [ ] **Step 2: Camera blend integration**

Add helper to swap vcam priorities. Add to RitualController:

```csharp
[Header("Cinemachine VCam Priorities")]
[SerializeField] private Unity.Cinemachine.CinemachineCamera overheadVCam;
[SerializeField] private Unity.Cinemachine.CinemachineCamera fpVCam;

private void SetOverheadActive(bool active)
{
    if (overheadVCam) overheadVCam.Priority = active ? 10 : 0;
    if (fpVCam) fpVCam.Priority = active ? 0 : 10;
}
```

(Cinemachine 3.x namespace is `Unity.Cinemachine`. Confirm by checking installed package.)

Call `SetOverheadActive(false)` in `StartRitual()`, `SetOverheadActive(true)` in `EndRitual()`.

For per-station vcams, expose a `CinemachineCamera` reference on each `CollectionStation`:

In `CollectionStation.cs`, add:

```csharp
[SerializeField] protected Unity.Cinemachine.CinemachineCamera stationVCam;
public Unity.Cinemachine.CinemachineCamera StationVCam => stationVCam;
```

Then in `RitualController.OnArriveAtStation()` and `OnStationComplete()`:

```csharp
public void OnArriveAtStation()
{
    if (CurrentStation == null) return;
    CurrentStation.OnArrive(Tray);
    if (CurrentStation.StationVCam) CurrentStation.StationVCam.Priority = 20;
    State = RitualState.AtStation;
    OnStationEntered?.Invoke(CurrentStation);
}

public void OnStationComplete()
{
    if (CurrentStation == null) return;
    if (CurrentStation.StationVCam) CurrentStation.StationVCam.Priority = 0;
    CurrentStation.OnLeave(Tray);
    OnStationExited?.Invoke(CurrentStation);
    var done = CurrentStation;
    CurrentStation = null;
    if (stationIndex + 1 >= stations.Count) EndRitual();
    else State = RitualState.Walking;
}
```

- [ ] **Step 3: Wire scene references**

Open `Lot01.unity`. Select `_Managers`:
1. Add `RitualController` component if not present.
2. Drag `Assets/Prefabs/PlayerNavAgent.prefab` into `Player Nav Agent Prefab`.
3. Drag `SpawnPoint` (or create new `RitualEntryPoint` near office door) into `Ritual Entry Point`.
4. Drag the seven station GameObjects into `Stations` list in order: BayBin1, BayBin2, Changer, OfficeDoor, MoneyCounter, CoinSifter, Terminal. Each station GameObject must have its respective station component added (BayBinStation on Bay_01's bin sub-object, etc.).
5. Drag `vcam_Overhead` and `vcam_FP` into the corresponding fields.
6. Drag `fpCamera` (the FPCameraController on `vcam_FP` GameObject) into `Fp Camera`.

For each station GameObject in scene, drag its station-specific vcam (e.g., `vcam_Station_BayBin1` for `Bay_01_Bin`) into the `Station VCam` slot on its CollectionStation component.

- [ ] **Step 4: Smoke test the camera handoff**

Add a temporary trigger to `_Managers`: a TestRitualLauncher script that calls `RitualController.Instance.StartRitual()` on key press. Or just add a debug menu item.

Quick test script `Assets/Scripts/Debug/RitualDebugLauncher.cs`:

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

namespace WashEmpire
{
    public class RitualDebugLauncher : MonoBehaviour
    {
        private void Update()
        {
            if (Keyboard.current != null && Keyboard.current.rKey.wasPressedThisFrame)
            {
                if (RitualController.Instance != null) RitualController.Instance.StartRitual();
            }
        }
    }
}
```

Add this component to `_Managers`.

Press Play, let cars accumulate cash for ~30s, press R. Camera should blend overhead → FP, agent walks to first bay, camera anchors on bin. Hold left mouse 3 sec, agent advances. Walk through changer, office door, counter, sifter, terminal. After terminal, ritual ends and camera blends back overhead.

If camera doesn't blend, confirm CinemachineBrain is on Main Camera and vcam priorities are wired. If agent doesn't walk, confirm NavMesh covers the path.

- [ ] **Step 5: Commit**

```bash
git add WashEmpire/Assets/Scripts/Ritual/RitualController.cs WashEmpire/Assets/Scripts/Ritual/Stations/CollectionStation.cs WashEmpire/Assets/Scripts/Debug/RitualDebugLauncher.cs WashEmpire/Assets/Lot01.unity
git commit -m "Sprint 2.D: ritual scene wiring + Cinemachine vcam blends + R-key debug launcher"
```

---

## Sub-phase 2E — Ritual UX (Week)

### Task 20: TrayHUD

**Files:**
- Create: `Assets/Scripts/UI/TrayHUD.cs`

- [ ] **Step 1: Implement**

```csharp
using TMPro;
using UnityEngine;

namespace WashEmpire
{
    public class TrayHUD : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text billsLabel;
        [SerializeField] private TMP_Text coinsLabel;
        [SerializeField] private TMP_Text tokensLabel;

        private void OnEnable()
        {
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnRitualStarted += Show;
                RitualController.Instance.OnRitualCompleted += Hide;
                RitualController.Instance.Tray.OnChanged += Refresh;
            }
            Hide();
        }

        private void OnDisable()
        {
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnRitualStarted -= Show;
                RitualController.Instance.OnRitualCompleted -= Hide;
                RitualController.Instance.Tray.OnChanged -= Refresh;
            }
        }

        private void Show() { if (root) root.SetActive(true); Refresh(); }
        private void Hide() { if (root) root.SetActive(false); }

        private void Refresh()
        {
            var t = RitualController.Instance?.Tray;
            if (t == null) return;
            billsLabel.text = $"Bills:  ${t.Bills}";
            coinsLabel.text = $"Coins:  ${t.Coins}";
            tokensLabel.text = $"Tokens: ${t.Tokens}";
        }
    }
}
```

- [ ] **Step 2: Build TrayHUD UI**

In `Lot01.unity` Canvas, create a Panel `TrayHUDPanel`, anchor bottom-left, size 200×120, position offset `(20, 20)`. Children: 3 TMP_Text labels stacked vertically. Add `TrayHUD` component, wire `root = TrayHUDPanel`, label slots filled.

- [ ] **Step 3: Press R, observe TrayHUD shows during ritual, hides after**

- [ ] **Step 4: Commit**

```bash
git add WashEmpire/Assets/Scripts/UI/TrayHUD.cs WashEmpire/Assets/Lot01.unity
git commit -m "Sprint 2.E: TrayHUD bottom-left overlay during ritual"
```

---

### Task 21: NextStationButton + click-to-walk on stations

**Files:**
- Create: `Assets/Scripts/UI/NextStationButton.cs`

- [ ] **Step 1: Implement**

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class NextStationButton : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text label;
        [SerializeField] private Button button;

        private void OnEnable()
        {
            button.onClick.AddListener(GoToNext);
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnRitualStarted += Show;
                RitualController.Instance.OnRitualCompleted += Hide;
                RitualController.Instance.OnStationExited += _ => Refresh();
            }
            Hide();
        }

        private void OnDisable()
        {
            button.onClick.RemoveListener(GoToNext);
        }

        private void Show() { if (root) root.SetActive(true); Refresh(); }
        private void Hide() { if (root) root.SetActive(false); }

        private void Refresh()
        {
            var rc = RitualController.Instance;
            if (rc == null) return;
            // Show name of next pending station
            var next = rc.PeekNextStation();
            label.text = next != null ? $"Next: {next.DisplayName} →" : "Continue";
        }

        private void GoToNext()
        {
            RitualController.Instance?.AdvanceToNextStation();
        }
    }
}
```

Add `PeekNextStation()` to RitualController:

```csharp
public CollectionStation PeekNextStation()
{
    int idx = stationIndex + 1;
    if (idx >= 0 && idx < stations.Count) return stations[idx];
    return null;
}
```

- [ ] **Step 2: Build button UI**

In Canvas, create panel `NextStationPanel` anchor middle-right, size 220×60. Add child Button with TMP_Text. Add `NextStationButton` component.

- [ ] **Step 3: Smoke test**

Press R. Button shows label, click advances agent to next station automatically.

- [ ] **Step 4: Commit**

```bash
git add WashEmpire/Assets/Scripts/UI/NextStationButton.cs WashEmpire/Assets/Scripts/Ritual/RitualController.cs WashEmpire/Assets/Lot01.unity
git commit -m "Sprint 2.E: NextStationButton with PeekNextStation"
```

---

### Task 22: StationInteractionUI + hold/click prompts

**Files:**
- Create: `Assets/Scripts/UI/StationInteractionUI.cs`

- [ ] **Step 1: Implement**

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class StationInteractionUI : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text promptLabel;
        [SerializeField] private Slider progressBar;

        private void OnEnable()
        {
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnStationEntered += OnEnter;
                RitualController.Instance.OnStationExited += OnExit;
            }
            if (root) root.SetActive(false);
        }

        private void OnEnter(CollectionStation station)
        {
            if (root) root.SetActive(true);
            promptLabel.text = station switch
            {
                BayBinStation _ => "Hold [LMB] to empty bin",
                ChangerStation _ => "Hold [LMB] to pull stacker",
                MoneyCounterStation _ => "Click to run counter",
                CoinSifterStation _ => "Click to run sifter",
                OfficeTerminalStation _ => "Read the receipt",
                _ => ""
            };
            progressBar.value = 0f;
        }

        private void OnExit(CollectionStation _) { if (root) root.SetActive(false); }

        private void Update()
        {
            var s = RitualController.Instance?.CurrentStation;
            if (s == null || progressBar == null) return;
            progressBar.value = s switch
            {
                BayBinStation b => b.HoldProgressNormalized,
                ChangerStation c => c.HoldProgressNormalized,
                MoneyCounterStation mc => mc.RunProgressNormalized,
                CoinSifterStation cs => cs.RunProgressNormalized,
                _ => 0f
            };
        }
    }
}
```

- [ ] **Step 2: Build UI**

Canvas panel `StationInteractionPanel`, anchor bottom-center, size 320×80. Children: TMP_Text prompt, Slider progress bar. Add `StationInteractionUI` component, wire references.

- [ ] **Step 3: Smoke test**

Press R, walk through ritual. At each station the prompt shows; progress bar fills during hold-or-run.

- [ ] **Step 4: Commit**

```bash
git add WashEmpire/Assets/Scripts/UI/StationInteractionUI.cs WashEmpire/Assets/Lot01.unity
git commit -m "Sprint 2.E: StationInteractionUI prompts + progress bar"
```

---

### Task 23: OfficeTerminalScreen — receipt UI

**Files:**
- Create: `Assets/Scripts/UI/OfficeTerminalScreen.cs`

This UI assembles the receipt by reading authoritative totals from the counter and sifter stations (which captured them on `OnArrive`), the changer (for the bills total prior to count), `LotEconomy` (for theoretical revenue / slippage / card revenue), and a config flag for camera ownership.

- [ ] **Step 1: Implement**

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class OfficeTerminalScreen : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text bodyLabel;
        [SerializeField] private Button continueButton;
        [SerializeField] private OfficeTerminalStation terminalStation;
        [SerializeField] private MoneyCounterStation counterStation;
        [SerializeField] private CoinSifterStation sifterStation;
        [SerializeField] private LotEconomy economy;
        [SerializeField] private bool camerasOwned = false;

        private void OnEnable()
        {
            continueButton.onClick.AddListener(OnContinue);
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnStationEntered += OnEnter;
                RitualController.Instance.OnStationExited += OnExit;
            }
            if (root) root.SetActive(false);
        }

        private void OnDisable()
        {
            continueButton.onClick.RemoveListener(OnContinue);
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnStationEntered -= OnEnter;
                RitualController.Instance.OnStationExited -= OnExit;
            }
        }

        private void OnEnter(CollectionStation s)
        {
            if (s != terminalStation) return;
            if (root) root.SetActive(true);
            BuildReceiptText();
        }

        private void OnExit(CollectionStation s)
        {
            if (s == terminalStation && root) root.SetActive(false);
        }

        private void BuildReceiptText()
        {
            int billsCounter = counterStation != null ? counterStation.Total : 0;
            int coinsSifter = sifterStation != null ? sifterStation.Total : 0;
            int theoretical = economy != null ? economy.WeeklyRevenue : 0;
            int slippage = economy != null ? economy.WeeklySlippage : 0;
            int total = billsCounter + coinsSifter;
            int cardRevenue = economy != null ? economy.WeeklyCardRevenue : 0;

            string slippageHint = camerasOwned ? "" : "  ← cameras would help";
            string cardLine = cardRevenue > 0 ? $"Card revenue (auto): ${cardRevenue} (-3% fee)\n" : "";

            bodyLabel.text =
                $"─── WEEK DEPOSIT ───\n" +
                $"Bills (counter):     ${billsCounter}\n" +
                $"Coins (sifter):      ${coinsSifter}\n" +
                $"                   ─────\n" +
                $"TOTAL DEPOSITED:     ${total}\n\n" +
                $"Theoretical revenue: ${theoretical}\n" +
                $"Token slippage:      -${slippage}{slippageHint}\n" +
                cardLine;
        }

        private void OnContinue() => terminalStation.OnContinueClicked();
    }
}
```

- [ ] **Step 2: Build receipt UI**

Canvas panel `OfficeTerminalPanel`, anchor center, size 480×360. CRT-style aesthetic: dark green background, monospace TMP_Text body. Continue button at bottom. Add `OfficeTerminalScreen` component, wire references and the OfficeTerminalStation in scene.

- [ ] **Step 3: Smoke test**

Press R, complete ritual through to terminal. Receipt panel appears with breakdown. Click Continue, ritual ends.

- [ ] **Step 4: Commit**

```bash
git add WashEmpire/Assets/Scripts/UI/OfficeTerminalScreen.cs WashEmpire/Assets/Lot01.unity
git commit -m "Sprint 2.E: OfficeTerminalScreen receipt UI"
```

---

### Task 24: WeeklyReviewController + integrate end-of-week flow

**Files:**
- Create: `Assets/Scripts/UI/WeeklyReviewController.cs`
- Create: `Assets/Scripts/Tasks/Task.cs`
- Create: `Assets/Scripts/Tasks/TaskSystem.cs`
- Create: `Assets/Scripts/UI/TaskPanelHUD.cs`

- [ ] **Step 1: Task data class**

`Assets/Scripts/Tasks/Task.cs`:

```csharp
using System;

namespace WashEmpire
{
    [Serializable]
    public class Task
    {
        public string Id;
        public string Label;
        public bool IsComplete;
        public Action OnTrigger;
    }
}
```

- [ ] **Step 2: TaskSystem singleton**

`Assets/Scripts/Tasks/TaskSystem.cs`:

```csharp
using System.Collections.Generic;
using UnityEngine;

namespace WashEmpire
{
    public class TaskSystem : MonoBehaviour
    {
        public static TaskSystem Instance { get; private set; }

        public List<Task> ActiveTasks { get; } = new();
        public event System.Action OnTasksChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void OnEnable()
        {
            if (TimeController.Instance != null) TimeController.Instance.OnWeekEnded += OnWeekEnded;
        }

        private void OnDisable()
        {
            if (TimeController.Instance != null) TimeController.Instance.OnWeekEnded -= OnWeekEnded;
        }

        private void OnWeekEnded(int week)
        {
            var collect = new Task
            {
                Id = $"collect_week_{week}",
                Label = "Collect Cash",
                OnTrigger = () =>
                {
                    if (RitualController.Instance != null) RitualController.Instance.StartRitual();
                }
            };
            ActiveTasks.Add(collect);
            OnTasksChanged?.Invoke();
        }

        public void Complete(Task t)
        {
            t.IsComplete = true;
            ActiveTasks.Remove(t);
            OnTasksChanged?.Invoke();
        }

        public bool HasIncomplete => ActiveTasks.Count > 0;
    }
}
```

- [ ] **Step 3: TaskPanelHUD**

`Assets/Scripts/UI/TaskPanelHUD.cs`:

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class TaskPanelHUD : MonoBehaviour
    {
        [SerializeField] private Transform listRoot;
        [SerializeField] private GameObject taskRowPrefab; // a prefab containing Button + TMP_Text

        private void OnEnable()
        {
            if (TaskSystem.Instance != null) TaskSystem.Instance.OnTasksChanged += Refresh;
            Refresh();
        }

        private void OnDisable()
        {
            if (TaskSystem.Instance != null) TaskSystem.Instance.OnTasksChanged -= Refresh;
        }

        private void Refresh()
        {
            foreach (Transform child in listRoot) Destroy(child.gameObject);
            if (TaskSystem.Instance == null) return;

            foreach (var task in TaskSystem.Instance.ActiveTasks)
            {
                var row = Instantiate(taskRowPrefab, listRoot);
                row.GetComponentInChildren<TMP_Text>().text = task.Label;
                row.GetComponentInChildren<Button>().onClick.AddListener(() => task.OnTrigger?.Invoke());
            }
        }
    }
}
```

- [ ] **Step 4: WeeklyReviewController**

`Assets/Scripts/UI/WeeklyReviewController.cs`:

```csharp
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class WeeklyReviewController : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text bodyLabel;
        [SerializeField] private Button continueButton;
        [SerializeField] private LotEconomy economy;

        private void OnEnable()
        {
            continueButton.onClick.AddListener(Hide);
            if (RitualController.Instance != null) RitualController.Instance.OnRitualCompleted += Show;
            Hide();
        }

        private void OnDisable()
        {
            continueButton.onClick.RemoveListener(Hide);
            if (RitualController.Instance != null) RitualController.Instance.OnRitualCompleted -= Show;
        }

        private void Show()
        {
            if (root) root.SetActive(true);
            int rev = economy ? economy.WeeklyRevenue : 0;
            int variable = economy ? economy.WeeklyVariableCosts : 0;
            int fixedCosts = economy ? economy.WeeklyFixedCosts : 0;
            int profit = economy ? economy.WeeklyProfit : 0;
            int cash = GameManager.Instance ? GameManager.Instance.DepositedCash : 0;

            bodyLabel.text =
                $"─── WEEKLY REVIEW ───\n" +
                $"Revenue:     ${rev}\n" +
                $"Variable:   -${variable}\n" +
                $"Fixed:      -${fixedCosts}\n" +
                $"           ─────\n" +
                $"Profit:      ${profit}\n\n" +
                $"Cash on hand: ${cash}";
            economy?.ResetForNewWeek();
            // Find and complete the Collect Cash task
            if (TaskSystem.Instance != null)
            {
                foreach (var t in TaskSystem.Instance.ActiveTasks.ToArray())
                {
                    if (t.Id.StartsWith("collect_week_")) { TaskSystem.Instance.Complete(t); break; }
                }
            }
        }

        private void Hide() { if (root) root.SetActive(false); }
    }
}
```

- [ ] **Step 5: Build TaskPanel + WeeklyReview UI**

In Canvas:
1. `TaskPanel`: anchor top-right, size 240×200. Vertical layout group on a child `ListRoot`. Create a `TaskRow` prefab in `Assets/Prefabs/UI/`: button + TMP_Text. Add `TaskPanelHUD` component to `TaskPanel`, wire references.
2. `WeeklyReviewPanel`: anchor center, size 480×360. TMP_Text body + Continue button. Add `WeeklyReviewController`, wire economy and references.

- [ ] **Step 6: Block fast-forward when tasks pending**

Modify `TimeController.Tick`:

```csharp
public void Tick(float realDeltaSeconds)
{
    if (TaskSystem.Instance != null && TaskSystem.Instance.HasIncomplete && DayOfWeek == 6)
    {
        // It's Sunday and we have incomplete tasks — freeze the clock at end-of-week
        // This is a coarse implementation; refine if testers complain
        if (NormalizedDayProgress >= 0.99f) return;
    }
    // ... rest of tick logic
}
```

Or simpler: in `TaskSystem.OnWeekEnded` set `TimeController.Instance.SetSpeed(0f)` and require player to click task to unfreeze. Restore after ritual.

- [ ] **Step 7: Press Play, observe full week → ritual → review flow**

- Wait one week (use 10x speed).
- Sunday → Monday triggers OnWeekEnded → TaskSystem creates "Collect Cash" task → time pauses.
- Click task → ritual begins → walk through stations → terminal Continue → weekly review opens.
- Click Continue on review → time resumes, week 2 begins.

- [ ] **Step 8: Commit**

```bash
git add WashEmpire/Assets/Scripts/Tasks/ WashEmpire/Assets/Scripts/UI/TaskPanelHUD.cs WashEmpire/Assets/Scripts/UI/WeeklyReviewController.cs WashEmpire/Assets/Scripts/Core/TimeController.cs WashEmpire/Assets/Lot01.unity WashEmpire/Assets/Prefabs/UI/
git commit -m "Sprint 2.E: end-of-week task → ritual → weekly review flow integrated"
```

---

## Sub-phase 2F — Card Reader & Polish (½ Week)

### Task 25: Verify card-reader bypass in ritual

**Files:** none (configuration)

- [ ] **Step 1: Toggle card reader on Bay_01**

Press Play, in the BayController inspector for `Bay_01`, check `Has Card Reader`. Continue playing.

- [ ] **Step 2: Verify behavior**

- A car using Bay_01 should result in cash going directly to GameManager (cash counter ticks +$5 ≈ $4.85 net of 3% fee = +$5 rounded).
- Bay_01's `CashInBin` should remain $0.
- Bay_02 (no card reader) continues to accumulate normally with slippage.
- At end of week, ritual still triggers; Bay_01's `BayBinStation` auto-completes immediately via `OnArrive`'s `HasCardReader` check (Task 12).
- Office terminal receipt shows a "Card revenue (auto): $X" line.

- [ ] **Step 3: Add CardRevenue tracking to LotEconomy**

Modify `LotEconomy`:

```csharp
public int WeeklyCardRevenue { get; private set; }
public void RecordCardRevenue(int amount) => WeeklyCardRevenue += amount;
public void ResetForNewWeek()
{
    WeeklyRevenue = 0;
    WeeklyVariableCosts = 0;
    WeeklySlippage = 0;
    WeeklyCardRevenue = 0;
}
```

Modify `BayController.SettlePayout` card branch:

```csharp
if (hasCardReader)
{
    int net = Mathf.RoundToInt(amount * (1f - cardProcessingFee));
    if (GameManager.Instance != null) GameManager.Instance.Deposit(net);
    var econ = FindFirstObjectByType<LotEconomy>();
    econ?.RecordCardRevenue(net);
    return;
}
```

Modify `OfficeTerminalStation.BuildReceipt`:

```csharp
Receipt = new ReceiptData
{
    // ...existing
    CardRevenue = lotEconomy != null ? lotEconomy.WeeklyCardRevenue : 0
};
```

- [ ] **Step 4: Commit**

```bash
git add WashEmpire/Assets/Scripts/Economy/LotEconomy.cs WashEmpire/Assets/Scripts/Lots/BayController.cs WashEmpire/Assets/Scripts/Ritual/Stations/OfficeTerminalStation.cs
git commit -m "Sprint 2.F: card-reader revenue tracked + surfaced in receipt"
```

---

### Task 26: Save / Load v2

**Files:**
- Create: `Assets/Scripts/Save/SaveData.cs`
- Create: `Assets/Scripts/Save/SaveSystem.cs`
- Test: `Assets/Tests/EditMode/SaveMigrationTests.cs`

- [ ] **Step 1: SaveData DTOs**

```csharp
using System;
using System.Collections.Generic;

namespace WashEmpire
{
    [Serializable]
    public class SaveData
    {
        public int version = 2;
        public int deposited_cash;
        public int current_day_index;
        public List<LotData> lots = new();
        public List<TaskData> active_tasks = new();
        public RitualState ritual_state;
    }

    [Serializable]
    public class LotData
    {
        public string id;
        public List<BayData> bays = new();
        public ChangerData changer;
    }

    [Serializable]
    public class BayData
    {
        public string id;
        public int cash_in_bin;
        public bool has_card_reader;
        public int lifetime_revenue;
        public int lifetime_slippage;
    }

    [Serializable]
    public class ChangerData
    {
        public int bill_stacker;
    }

    [Serializable]
    public class TaskData
    {
        public string id;
        public string type;
    }

    [Serializable]
    public class RitualState
    {
        public int current_station_index;
        public int tray_bills;
        public int tray_coins;
        public int tray_tokens;
    }
}
```

- [ ] **Step 2: SaveSystem with migration**

```csharp
using System.IO;
using UnityEngine;

namespace WashEmpire
{
    public static class SaveSystem
    {
        private static string Path => System.IO.Path.Combine(Application.persistentDataPath, "save.json");

        public static void Save(SaveData data)
        {
            string json = JsonUtility.ToJson(data, prettyPrint: true);
            File.WriteAllText(Path, json);
        }

        public static SaveData Load()
        {
            if (!File.Exists(Path)) return null;
            string json = File.ReadAllText(Path);
            var data = JsonUtility.FromJson<SaveData>(json);
            return Migrate(data);
        }

        public static SaveData Migrate(SaveData data)
        {
            if (data.version < 2)
            {
                // v1 had no per-bay cash_in_bin / changer / etc. Initialize defaults.
                data.version = 2;
                if (data.lots == null || data.lots.Count == 0)
                {
                    data.lots.Add(new LotData
                    {
                        id = "Lot01",
                        bays = new System.Collections.Generic.List<BayData>(),
                        changer = new ChangerData()
                    });
                }
            }
            return data;
        }
    }
}
```

- [ ] **Step 3: Migration test**

Create `Assets/Tests/EditMode/SaveMigrationTests.cs`:

```csharp
using NUnit.Framework;

namespace WashEmpire.Tests
{
    public class SaveMigrationTests
    {
        [Test]
        public void V1_Save_Migrates_To_V2_With_Defaults()
        {
            var v1 = new SaveData { version = 1, deposited_cash = 5000 };
            var migrated = SaveSystem.Migrate(v1);
            Assert.AreEqual(2, migrated.version);
            Assert.IsNotNull(migrated.lots);
            Assert.GreaterOrEqual(migrated.lots.Count, 1);
        }
    }
}
```

- [ ] **Step 4: Run test, verify PASS**

- [ ] **Step 5: Wire actual save/load into game lifecycle**

Save on `OnRitualCompleted` and on quit:

In `RitualController.cs`:

```csharp
private void OnApplicationQuit() => SaveCurrentState();

private void OnRitualEnd_Save()
{
    SaveCurrentState();
}

private void SaveCurrentState()
{
    if (GameManager.Instance == null) return;
    var data = new SaveData
    {
        version = 2,
        deposited_cash = GameManager.Instance.DepositedCash,
        current_day_index = TimeController.Instance != null ? TimeController.Instance.CurrentDayIndex : 0,
        // Lot/bay data populated by LotController in a follow-up task
    };
    SaveSystem.Save(data);
}
```

(Full lot serialization is deferred to Phase 4 polish; slice ships with cash + day saved minimum.)

- [ ] **Step 6: Commit**

```bash
git add WashEmpire/Assets/Scripts/Save/ WashEmpire/Assets/Tests/EditMode/SaveMigrationTests.cs WashEmpire/Assets/Scripts/Ritual/RitualController.cs
git commit -m "Sprint 2.F: save/load v2 with v1 migration"
```

---

### Task 27: Reconcile design docs

**Files:**
- Modify: `washempire_verticalslice.md`
- Modify: `washempire_art.md`
- Modify: `washempire_economy.md`
- Modify: `washempire_progression.md`
- Modify: `washempire_content.md`
- Modify: `washempire_employees.md`
- Modify: `washempire_roadmap.md`

This task executes the doc edits captured in `washempire_fpcollection.md` §7. Without this, the doc set drifts out of sync with the implementation.

- [ ] **Step 1: vertical slice doc edits**

In `washempire_verticalslice.md`:
- §3.5: Replace the "click each bay's coin meter" description with: *"End-of-week cash collection runs as the FP ritual specified in `washempire_fpcollection.md`. The click is replaced by a walk-through-the-lot ritual visiting each coin bin, the changer, and the back-office counter and sifter."*
- §3.6: Replace the 8-upgrade table with the 6-upgrade table from `washempire_fpcollection.md` §8.2 (drop Vacuum, Lighting, Repair Kit; add Card Reader).
- §3.7: After the existing demand model paragraph, add: *"Token slippage of 3% is applied to cash-paid revenue per `washempire_fpcollection.md` §5. Card-reader bays bypass this with a 3% processing fee instead."*
- §6 Phase 2 sub-phase block: replace with the 2A–2F sub-phases from `washempire_fpcollection.md` §8.
- §8.1: Append the FP ritual DoD bullets from this plan's Task 27 (now Task 28) Step 6 list.
- §10.2: Add `Cinemachine` to the Key Unity Features list.
- §12: Replace the timeline table with the revised numbers (9w → ~12w realistic) from `washempire_fpcollection.md` §8.1.

- [ ] **Step 2: art bible edits**

In `washempire_art.md`:
- §18.3: After "Cannot rotate vertically (no third-person dive)" add: *"Exception: during cash-collection ritual, the camera enters first-person mode at eye height (~1.7m). See `washempire_fpcollection.md` §3 for ritual scope. Default tycoon overhead camera resumes once the ritual ends."*
- §18: Add a new sub-section `§18.4 First-Person Collection Mode` with two paragraphs summarizing camera handoff (Cinemachine blends, station anchors, blend duration).
- §10: Add `Office interior` to the lot anatomy list (small walled-off building on the same lot, NavMesh continuous, contains money counter, coin sifter, and CRT terminal).
- §13: Add three sub-sub-sections for Tray HUD, Office Terminal Receipt screen, Station Interaction overlay; each one paragraph describing the lo-fi clipboard / receipt aesthetic.

- [ ] **Step 3: economy spec edits**

In `washempire_economy.md`:
- §5: After variable costs, add a paragraph: *"Token slippage is a revenue-side leak — % of cash-paid revenue that never reaches the bin (customers pocket tokens, lose them, take them home). Tier-scaled per §3.5 below."*
- §7: Add ROI rows for Card Reader and Security Cameras with slippage-aware math from `washempire_fpcollection.md` §5.
- §8: Update the worked example. The "$700/week revenue, $666 costs, $34 profit" line stays, but add a follow-up sentence: *"With the 3% Tier 1 slippage applied, cash actually deposited is ~$679/week, profit ~$13/week."*
- New §3.5 (or wherever fits): Insert the per-tier slippage table from `washempire_fpcollection.md` §5.1.

- [ ] **Step 4: progression spec edits**

In `washempire_progression.md`:
- §2 Tier 1 "Key mechanics in play": add `FP cash collection mandatory at week-end`.
- §2 Tier 2 "Key mechanics unlocked": add `Option to skip FP cash collection (player chooses each week-end)`.
- §3: Add a bullet to the tier transition events list: *"Tier 2 promotion event explicitly highlights the FP-skip unlock as a felt promotion."*

- [ ] **Step 5: content lib edits**

In `washempire_content.md`:
- §2.2 BAY_PAY_02 (Card Reader): change Tier unlock from `2` to `1`. Update Effect column to: *"Bay's revenue auto-deposited (no FP collection). 3% processing fee. +5% revenue ceiling (existing convenience effect)."*
- §2.4 BACK_SEC_01 / BACK_SEC_02: Append to Effect column: *"Slippage -50% relative (BACK_SEC_01) / -75% relative (BACK_SEC_02)."*
- Add a new §3.5 (or appropriate position): a short subsection titled *Token Slippage* describing the concept and tier curve, pointing to `washempire_fpcollection.md` for the FP UX specifics.

- [ ] **Step 6: employees spec edit**

In `washempire_employees.md`:
- §2.4 Manager: append to the role description: *"At Tier 3+, a manager assigned to a lot also runs that lot's FP cash-collection ritual autonomously each week — the player no longer visits the lot in person. Cash is deposited net of any slippage the manager couldn't prevent (security upgrades still apply)."*

- [ ] **Step 7: roadmap edits**

In `washempire_roadmap.md`:
- §4.2 Sprint Breakdown table: revise Sprint 2 row to reference the 2A–2F sub-phases. Total Phase 1 changes from 9 weeks to ~13 weeks.
- §10.1 Schedule Risks: add a new risk entry: *"Sprint 2 redesign mid-build (FP cash collection): a deliberate scope reframe with offsetting cuts (8→6 upgrades). Tracked in `washempire_fpcollection.md` §2.3. Pessimistic timeline 19w breaches §12 cutline; cutline order in §9.3 is the recovery path."*

- [ ] **Step 8: Commit**

```bash
git add washempire_*.md
git commit -m "Sprint 2: reconcile design docs with FP cash collection spec"
```

---

### Task 28: Sprint 2 acceptance gate

**Files:** none

This is a verification task, not code. Walk through the full flow end-to-end, multiple weeks, without crashes.

- [ ] **Step 1: Fresh play test**

Restart Unity (close and reopen). Open `Lot01.unity`. Press Play.

- [ ] **Step 2: Week 1 normal flow**

- Cars spawn and wash. Cash accumulates in BayController.CashInBin (visible in inspector while playing).
- Hit 10x speed. Time advances Mon → Tue → ... → Sun.
- Sunday → Monday transition triggers Collect Cash task. Time pauses.
- Click the task. Ritual begins: camera blends overhead → FP, agent walks to Bay_01.

- [ ] **Step 3: Walk through ritual**

- At each bay bin, hold left mouse for ~3 seconds. Tray HUD's Coins ticks up.
- At Changer, hold left mouse for ~3 seconds. Tray HUD's Bills ticks up.
- Walk into office (door auto-triggers).
- Click Money Counter, watch counter run. Tray HUD's Bills drains to $0.
- Click Coin Sifter, watch sifter run. Tray HUD's Coins drains to $0.
- Read terminal receipt. Confirm slippage line shows non-zero with `← cameras would help` hint.
- Click Continue. Camera blends back overhead. WeeklyReviewController shows revenue/cost/profit. Cash on hand reflects deposit.

- [ ] **Step 4: Card reader test**

- Stop play. Check Bay_01's `Has Card Reader` flag in inspector.
- Press Play. Notice that during washes, GameManager's DepositedCash ticks up live (instead of accumulating in bin).
- Wait one week. Trigger ritual.
- Bay_01's bin station auto-completes (no walk to bay needed); ritual goes Bay_02 → Changer → Office.
- Terminal receipt shows a "Card revenue (auto-deposited): $X" line.

- [ ] **Step 5: Multi-week stability**

Play through 4 consecutive weeks. Confirm:
- No null-reference exceptions in Console.
- Cash math stays internally consistent (Total Deposited = Bills + Coins each week).
- Slippage accumulates in `LotEconomy.WeeklySlippage` and resets at week-end.

- [ ] **Step 6: Definition-of-Done checklist (slice spec §8.1 expanded)**

- [ ] All 6 stations functional (BayBin × 2, Changer, OfficeDoor, MoneyCounter, CoinSifter, OfficeTerminal)
- [ ] FP camera blends cleanly to/from overhead
- [ ] Tray HUD updates per station
- [ ] NextStation button advances agent
- [ ] Receipt shows correct breakdown including slippage line
- [ ] Card reader bypasses ritual for that bay
- [ ] Weekly review opens after ritual
- [ ] At least 4 weeks playable end-to-end without crashes
- [ ] Save/load v2 round-trips without corruption (close and reopen Unity, cash persists)
- [ ] Math from economy spec §8 worked example matches in-game observation within 10% (factoring 3% slippage)

- [ ] **Step 7: Tag the milestone**

```bash
cd "C:/Users/whate/Documents/AI Locally/WashEmpire"
git tag -a sprint-2-the-cycle -m "Sprint 2: The Cycle + FP Cash Collection complete"
git log --oneline -5
```

---

## Open Cutline Triggers

If schedule slips during execution, follow `washempire_fpcollection.md` §9.3 cutline order:

1. Cut **Task 25** (Card reader integration) → ritual still ships, strategic layer weakens
2. Cut **slippage system** → all `slippageRate = 0` in Bay inspector; remove slippage line from receipt; collect 100% of revenue
3. Cut **Tasks 13, 25** (Changer + ChangerStation) → ritual is bays + office only
4. Cut **Tasks 9, 14, 15, 22, 23** (office back-of-house) → ritual becomes "empty bays, see total" (option A)
5. Revert entirely to click-collect (revert to Sprint 1 BayController behavior; remove Sub-phase 2C onward)

---

*End of Sprint 2 implementation plan v1*
