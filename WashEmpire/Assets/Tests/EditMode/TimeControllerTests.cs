using NUnit.Framework;
using UnityEngine;

namespace WashEmpire.Tests
{
    public class TimeControllerTests
    {
        private GameObject go;
        private TimeController tc;

        [SetUp]
        public void SetUp()
        {
            go = new GameObject("TC");
            tc = go.AddComponent<TimeController>();
            tc.Configure(secondsPerDay: 30f);
            tc.Initialize();
        }

        [TearDown]
        public void TearDown()
        {
            if (go != null) Object.DestroyImmediate(go);
            TimeController.ResetForTests();
        }

        [Test]
        public void Tick_Advances_TimeOfDay_And_Day()
        {
            tc.Tick(15f);
            Assert.AreEqual(0, tc.CurrentDayIndex);
            Assert.AreEqual(0.5f, tc.NormalizedDayProgress, 0.0001f);

            tc.Tick(15f);
            Assert.AreEqual(1, tc.CurrentDayIndex);
        }

        [Test]
        public void Tick_Fires_OnWeekEnded_After_Sunday()
        {
            int weeksEnded = 0;
            tc.OnWeekEnded += w => weeksEnded++;

            tc.Tick(210f);

            Assert.AreEqual(1, weeksEnded, "OnWeekEnded must fire exactly once after a full week");
            Assert.AreEqual(1, tc.CurrentWeek);
        }

        [Test]
        public void Speed_Multiplier_Scales_Tick()
        {
            tc.SetSpeed(3f);
            tc.Tick(10f);
            Assert.AreEqual(1, tc.CurrentDayIndex);
        }

        [Test]
        public void Pause_Stops_Tick()
        {
            tc.SetSpeed(0f);
            tc.Tick(60f);
            Assert.AreEqual(0, tc.CurrentDayIndex);
        }
    }
}
