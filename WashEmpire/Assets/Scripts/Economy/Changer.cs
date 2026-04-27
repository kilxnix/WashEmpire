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
