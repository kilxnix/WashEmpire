using NUnit.Framework;
using UnityEngine;

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

    public class RitualStateMachineTests
    {
        [TearDown]
        public void TearDown() => RitualController.ResetForTests();

        [Test]
        public void StartRitual_From_Idle_Transitions_To_Walking()
        {
            var go = new GameObject();
            var rc = go.AddComponent<RitualController>();
            rc.Initialize();
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
            rc.Initialize();

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
}
