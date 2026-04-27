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
