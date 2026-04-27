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
        [SerializeField] private bool hasCardReader = false;
        [Range(0f, 0.2f)]
        [SerializeField] private float slippageRate = 0.03f;
        [Range(0f, 0.1f)]
        [SerializeField] private float cardProcessingFee = 0.03f;
        [SerializeField, Range(0f, 1f)] private float bayBinShare = 0.90f;

        public bool IsOccupied { get; private set; }
        public Transform ServiceSpot => serviceSpot != null ? serviceSpot : transform;
        public int CashInBin { get; private set; }
        public int LifetimeRevenue { get; private set; }
        public int LifetimeSlippage { get; private set; }
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
            LifetimeRevenue += amount;

            if (hasCardReader)
            {
                int net = Mathf.RoundToInt(amount * (1f - cardProcessingFee));
                if (GameManager.Instance != null) GameManager.Instance.Deposit(net);
                return;
            }

            float netCashRevenue = amount * (1f - slippageRate);
            int slippage = amount - Mathf.RoundToInt(netCashRevenue);
            LifetimeSlippage += slippage;

            int toBin = Mathf.RoundToInt(netCashRevenue * bayBinShare);
            int toChanger = Mathf.RoundToInt(netCashRevenue) - toBin;

            CashInBin += toBin;
            if (changer != null) changer.AddBills(toChanger);
        }

        public int CollectFromBin()
        {
            int collected = CashInBin;
            CashInBin = 0;
            return collected;
        }

        // Test hooks
        public void SetChanger(Changer c) => changer = c;
        public void SetHasCardReader(bool v) => hasCardReader = v;
        public void SetSlippageRate(float r) => slippageRate = r;
        public void SetCardProcessingFee(float f) => cardProcessingFee = f;
        public void ResetForTest() { CashInBin = 0; LifetimeRevenue = 0; LifetimeSlippage = 0; }
    }
}
