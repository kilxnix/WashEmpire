using System.Collections.Generic;
using UnityEngine;

namespace WashEmpire
{
    public class LotController : MonoBehaviour
    {
        public static LotController Instance { get; private set; }

        [SerializeField] private List<BayController> bays = new();
        [SerializeField] private Transform exitPoint;

        public Transform ExitPoint => exitPoint;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public BayController TryReserveOpenBay()
        {
            foreach (var bay in bays)
            {
                if (bay != null && bay.TryReserve())
                {
                    return bay;
                }
            }
            return null;
        }
    }
}
