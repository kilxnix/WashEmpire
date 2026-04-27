using System.Collections;
using UnityEngine;

namespace WashEmpire
{
    public class BayController : MonoBehaviour
    {
        [SerializeField] private Transform serviceSpot;
        [SerializeField] private float washDuration = 6f;
        [SerializeField] private int payout = 5;

        [Header("Cash Routing (Sprint 2)")]
        [SerializeField] private Changer changer;
        [SerializeField] private LotEconomy economy;
        [SerializeField] private bool hasCardReader = false;
        [Range(0f, 0.2f)]
        [SerializeField] private float slippageRate = 0.03f;
        [Range(0f, 0.1f)]
        [SerializeField] private float cardProcessingFee = 0.03f;
        [SerializeField, Range(0f, 1f)] private float bayBinShare = 0.90f;

        private float cashInBin;
        private float lifetimeRevenue;
        private float lifetimeSlippage;
        private float cardCredit;

        public bool IsOccupied { get; private set; }
        public Transform ServiceSpot => serviceSpot != null ? serviceSpot : transform;
        public int CashInBin => Mathf.FloorToInt(cashInBin);
        public int LifetimeRevenue => Mathf.FloorToInt(lifetimeRevenue);
        public int LifetimeSlippage => Mathf.FloorToInt(lifetimeSlippage);
        public bool HasCardReader => hasCardReader;

        public bool TryReserve()
        {
            if (IsOccupied) return false;
            IsOccupied = true;
            return true;
        }

        public void Release() => IsOccupied = false;

        public IEnumerator RunWash()
        {
            yield return new WaitForSeconds(washDuration);
            SettlePayout(payout);
        }

        public void SettlePayout(int amount)
        {
            lifetimeRevenue += amount;
            if (economy != null) economy.RecordRevenue(amount);

            if (hasCardReader)
            {
                cardCredit += amount * (1f - cardProcessingFee);
                int whole = Mathf.FloorToInt(cardCredit);
                if (whole > 0)
                {
                    cardCredit -= whole;
                    if (GameManager.Instance != null) GameManager.Instance.Deposit(whole);
                    if (economy != null) economy.RecordCardRevenue(whole);
                }
                return;
            }

            float netCashRevenue = amount * (1f - slippageRate);
            float slippageThisCall = amount - netCashRevenue;
            lifetimeSlippage += slippageThisCall;
            if (economy != null) economy.RecordSlippage(Mathf.RoundToInt(slippageThisCall));

            float toBin = netCashRevenue * bayBinShare;
            float toChanger = netCashRevenue - toBin;

            cashInBin += toBin;
            if (changer != null) changer.AddBills(toChanger);
        }

        public int CollectFromBin()
        {
            int collected = Mathf.FloorToInt(cashInBin);
            cashInBin -= collected;
            return collected;
        }

        // Test hooks
        internal void SetChanger(Changer c) => changer = c;
        internal void SetHasCardReader(bool v) => hasCardReader = v;
        internal void SetSlippageRate(float r) => slippageRate = r;
        internal void SetCardProcessingFee(float f) => cardProcessingFee = f;
        internal void ResetForTest()
        {
            cashInBin = 0f;
            lifetimeRevenue = 0f;
            lifetimeSlippage = 0f;
            cardCredit = 0f;
            IsOccupied = false;
        }
    }
}
