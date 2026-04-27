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
                data.version = 2;
                if (data.lots == null || data.lots.Count == 0)
                {
                    data.lots = new System.Collections.Generic.List<LotData>
                    {
                        new()
                        {
                            id = "Lot01",
                            bays = new System.Collections.Generic.List<BayData>(),
                            changer = new ChangerData()
                        }
                    };
                }
            }
            return data;
        }
    }
}
