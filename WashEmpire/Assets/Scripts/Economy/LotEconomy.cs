using UnityEngine;

namespace WashEmpire
{
    public class LotEconomy : MonoBehaviour
    {
        [SerializeField] private int leasePerWeek = 300;
        [SerializeField] private int electricityPerWeek = 100;
        [SerializeField] private int waterPerWeek = 150;
        [SerializeField] private int insurancePerWeek = 40;
        [SerializeField] private int permitsPerWeek = 20;

        public int WeeklyFixedCosts => leasePerWeek + electricityPerWeek + waterPerWeek + insurancePerWeek + permitsPerWeek;

        public int WeeklyRevenue { get; private set; }
        public int WeeklyVariableCosts { get; private set; }
        public int WeeklySlippage { get; private set; }
        public int WeeklyCardRevenue { get; private set; }
        public int WeeklyProfit => WeeklyRevenue - WeeklyVariableCosts - WeeklyFixedCosts;

        public void ConfigureTier1()
        {
            leasePerWeek = 300;
            electricityPerWeek = 100;
            waterPerWeek = 150;
            insurancePerWeek = 40;
            permitsPerWeek = 20;
        }

        public void RecordRevenue(int amount) => WeeklyRevenue += amount;
        public void RecordVariableCost(int amount) => WeeklyVariableCosts += amount;
        public void RecordSlippage(int amount) => WeeklySlippage += amount;
        public void RecordCardRevenue(int amount) => WeeklyCardRevenue += amount;

        public void ResetForNewWeek()
        {
            WeeklyRevenue = 0;
            WeeklyVariableCosts = 0;
            WeeklySlippage = 0;
            WeeklyCardRevenue = 0;
        }
    }
}
