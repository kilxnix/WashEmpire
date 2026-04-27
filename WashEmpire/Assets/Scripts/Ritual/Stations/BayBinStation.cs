using UnityEngine;

namespace WashEmpire
{
    public class BayBinStation : CollectionStation
    {
        [SerializeField] private BayController bay;
        [SerializeField] private float holdDurationToEmpty = 3f;

        private float holdProgress;

        public override void OnArrive(Tray tray)
        {
            holdProgress = 0f;
            if (bay != null && bay.HasCardReader) IsComplete = true;
        }

        public override void Tick(StationInputContext input)
        {
            if (IsComplete || bay == null) return;
            if (bay.CashInBin == 0)
            {
                IsComplete = true;
                return;
            }

            if (input.HoldPrimary)
            {
                holdProgress += Time.deltaTime;
                if (holdProgress >= holdDurationToEmpty)
                {
                    int collected = bay.CollectFromBin();
                    input.Tray.AddCoins(collected);
                    IsComplete = true;
                }
            }
        }

        public float HoldProgressNormalized => Mathf.Clamp01(holdProgress / holdDurationToEmpty);
    }
}
