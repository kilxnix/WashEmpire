using NUnit.Framework;
using UnityEngine;

namespace WashEmpire.Tests
{
    public class CashFlowTests
    {
        private GameObject go;
        private GameManager gm;

        [SetUp]
        public void SetUp()
        {
            go = new GameObject("GM");
            gm = go.AddComponent<GameManager>();
        }

        [TearDown]
        public void TearDown()
        {
            if (go != null) Object.DestroyImmediate(go);
            GameManager.ResetForTests();
        }

        [Test]
        public void Deposit_Adds_To_DepositedCash_And_Fires_Event()
        {
            gm.SetStartingCash(1000);
            gm.Initialize();

            int observed = -1;
            int callCount = 0;
            gm.OnCashChanged += c => { observed = c; callCount++; };

            gm.Deposit(250);

            Assert.AreEqual(1250, gm.DepositedCash);
            Assert.AreEqual(1250, observed);
            Assert.AreEqual(1, callCount, "OnCashChanged must fire exactly once per Deposit");
            Assert.AreEqual(gm.DepositedCash, gm.Cash, "Cash backcompat alias must mirror DepositedCash");
        }

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
            bay.SettlePayout(5);
            // Expected: bin += 5 × 0.90 × 0.97 ≈ 4.365 → 4 (int truncation), changer += 5 × 0.10 × 0.97 ≈ 0.485 → 0
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

        [Test]
        public void CardBay_Deposits_Directly_With_3Percent_Fee_NoBin()
        {
            // Reuse [SetUp]'s GameManager singleton; reset its cash to 0 for this test
            GameManager.Instance.SetStartingCash(0);
            GameManager.Instance.Initialize();

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
            Assert.That(GameManager.Instance.DepositedCash, Is.InRange(480, 490), "Card bay deposits 100×5×0.97 ≈ 485");

            Object.DestroyImmediate(bayGO);
            Object.DestroyImmediate(changerGO);
        }

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
    }
}
