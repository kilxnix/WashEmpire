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
            bay.SetHasCardReader(false);
            bay.SetSlippageRate(0.03f);

            // Settle $100 cash payment.
            // netCash = 100 * 0.97 = 97; slippage = 100 - 97 = 3
            // toBin = round(97 * 0.90) = 87; toChanger = 97 - 87 = 10
            bay.SettlePayout(100);

            Assert.AreEqual(100, bay.LifetimeRevenue);
            Assert.AreEqual(3, bay.LifetimeSlippage);
            Assert.AreEqual(87, bay.CashInBin);
            Assert.AreEqual(10, changer.BillStacker);

            Object.DestroyImmediate(changerGO);
            Object.DestroyImmediate(bayGO);
        }

        [Test]
        public void CollectFromBin_Returns_And_Zeros()
        {
            var bayGO = new GameObject("Bay");
            var bay = bayGO.AddComponent<BayController>();
            var changerGO = new GameObject("Changer");
            var changer = changerGO.AddComponent<Changer>();
            bay.SetChanger(changer);
            bay.SetHasCardReader(false);
            bay.SetSlippageRate(0.03f);

            bay.SettlePayout(100);
            int beforeCollect = bay.CashInBin;
            Assert.Greater(beforeCollect, 0, "Bin should have cash before collection");

            int collected = bay.CollectFromBin();

            Assert.AreEqual(beforeCollect, collected);
            Assert.AreEqual(0, bay.CashInBin);

            Object.DestroyImmediate(changerGO);
            Object.DestroyImmediate(bayGO);
        }

        [Test]
        public void CardBay_Deposits_Directly_With_3Percent_Fee_NoBin()
        {
            // Reuse [SetUp]'s GameManager singleton — reset its cash to 0 for this test
            GameManager.Instance.SetStartingCash(0);
            GameManager.Instance.Initialize();

            var bayGO = new GameObject("Bay");
            var bay = bayGO.AddComponent<BayController>();
            bay.SetHasCardReader(true);
            bay.SetCardProcessingFee(0.03f);

            // $100 card payment: net = round(100 * 0.97) = 97, deposited directly
            bay.SettlePayout(100);

            Assert.AreEqual(100, bay.LifetimeRevenue);
            Assert.AreEqual(0, bay.LifetimeSlippage, "Card path does not accumulate slippage");
            Assert.AreEqual(0, bay.CashInBin, "Card path bypasses bin");
            Assert.AreEqual(97, GameManager.Instance.DepositedCash);

            Object.DestroyImmediate(bayGO);
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
