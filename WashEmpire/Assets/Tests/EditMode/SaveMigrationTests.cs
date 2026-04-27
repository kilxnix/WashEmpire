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
