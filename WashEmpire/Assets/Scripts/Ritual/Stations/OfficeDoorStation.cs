using UnityEngine;

namespace WashEmpire
{
    public class OfficeDoorStation : CollectionStation
    {
        [SerializeField] private float autoCompleteDelay = 1.5f;
        [SerializeField] private GameObject[] doorBlockers;

        private float t;

        public override void OnArrive(Tray tray)
        {
            t = 0f;
            foreach (var b in doorBlockers) if (b != null) b.SetActive(true);
        }

        public override void Tick(StationInputContext input)
        {
            if (IsComplete) return;
            t += Time.deltaTime;
            if (t >= autoCompleteDelay) IsComplete = true;
        }
    }
}
