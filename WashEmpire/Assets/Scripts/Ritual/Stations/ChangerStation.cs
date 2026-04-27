using UnityEngine;

namespace WashEmpire
{
    public class ChangerStation : CollectionStation
    {
        [SerializeField] private Changer changer;
        [SerializeField] private float holdDurationToEmpty = 3f;

        private float holdProgress;

        public override void OnArrive(Tray tray) => holdProgress = 0f;

        public override void Tick(StationInputContext input)
        {
            if (IsComplete || changer == null) return;
            if (changer.BillStacker == 0)
            {
                IsComplete = true;
                return;
            }

            if (input.HoldPrimary)
            {
                holdProgress += Time.deltaTime;
                if (holdProgress >= holdDurationToEmpty)
                {
                    int collected = changer.CollectFromStacker();
                    input.Tray.AddBills(collected);
                    IsComplete = true;
                }
            }
        }

        public float HoldProgressNormalized => Mathf.Clamp01(holdProgress / holdDurationToEmpty);
    }
}
