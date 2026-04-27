using UnityEngine;

namespace WashEmpire
{
    public class Changer : MonoBehaviour
    {
        private float bills;

        public int BillStacker => Mathf.FloorToInt(bills);

        public void AddBills(float amount) => bills += amount;

        public int CollectFromStacker()
        {
            int collected = Mathf.FloorToInt(bills);
            bills -= collected;
            return collected;
        }

        internal void ResetForTest() => bills = 0f;
    }
}
