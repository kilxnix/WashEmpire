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
