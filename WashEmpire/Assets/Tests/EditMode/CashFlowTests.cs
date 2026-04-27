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
    }
}
