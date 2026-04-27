using System;
using UnityEngine;

namespace WashEmpire
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [SerializeField] private int startingCash = 20000;

        public int DepositedCash { get; private set; }
        public int PendingCash { get; private set; }
        public int Cash => DepositedCash;

        public event Action<int> OnCashChanged;
        public event Action<int> OnPendingCashChanged;

        private void Awake()
        {
            Initialize();
        }

        internal void Initialize()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DepositedCash = startingCash;
        }

        internal static void ResetForTests()
        {
            Instance = null;
        }

        private void Start()
        {
            OnCashChanged?.Invoke(DepositedCash);
        }

        public void Deposit(int amount)
        {
            DepositedCash += amount;
            OnCashChanged?.Invoke(DepositedCash);
        }

        [Obsolete("Use Deposit() instead. Will be removed in Sprint 2.B.")]
        public void AddCash(int amount) => Deposit(amount);

        public bool TrySpend(int amount)
        {
            if (amount > DepositedCash) return false;
            DepositedCash -= amount;
            OnCashChanged?.Invoke(DepositedCash);
            return true;
        }

        internal void SetPendingCash(int amount)
        {
            PendingCash = Mathf.Max(0, amount);
            OnPendingCashChanged?.Invoke(PendingCash);
        }

        internal void SetStartingCash(int amount) => startingCash = amount;
    }
}
