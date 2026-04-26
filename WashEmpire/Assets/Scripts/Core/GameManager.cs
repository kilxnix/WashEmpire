using System;
using UnityEngine;

namespace WashEmpire
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [SerializeField] private int startingCash = 20000;

        public int Cash { get; private set; }
        public event Action<int> OnCashChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            Cash = startingCash;
        }

        private void Start()
        {
            OnCashChanged?.Invoke(Cash);
        }

        public void AddCash(int amount)
        {
            Cash += amount;
            OnCashChanged?.Invoke(Cash);
        }

        public bool TrySpend(int amount)
        {
            if (amount > Cash) return false;
            Cash -= amount;
            OnCashChanged?.Invoke(Cash);
            return true;
        }
    }
}
