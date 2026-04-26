using System.Collections;
using UnityEngine;

namespace WashEmpire
{
    public class BayController : MonoBehaviour
    {
        [Tooltip("Where the car parks for the wash cycle.")]
        [SerializeField] private Transform serviceSpot;

        [Tooltip("Real-time seconds the wash takes (slice spec §3.2 — 30 in-game seconds).")]
        [SerializeField] private float washDuration = 6f;

        [Tooltip("Cash awarded on completed wash (slice spec §3.7 — basic price $5).")]
        [SerializeField] private int payout = 5;

        public bool IsOccupied { get; private set; }
        public Transform ServiceSpot => serviceSpot != null ? serviceSpot : transform;

        public bool TryReserve()
        {
            if (IsOccupied) return false;
            IsOccupied = true;
            return true;
        }

        public void Release()
        {
            IsOccupied = false;
        }

        public IEnumerator RunWash()
        {
            yield return new WaitForSeconds(washDuration);
            if (GameManager.Instance != null)
            {
                GameManager.Instance.AddCash(payout);
            }
        }
    }
}
