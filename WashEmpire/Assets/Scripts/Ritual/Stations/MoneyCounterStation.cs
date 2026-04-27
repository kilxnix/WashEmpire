using UnityEngine;

namespace WashEmpire
{
    public class MoneyCounterStation : CollectionStation
    {
        [SerializeField] private float runDuration = 5f;
        private float t;
        private bool running;
        private int totalToCount;

        public override void OnArrive(Tray tray)
        {
            t = 0f;
            running = false;
            totalToCount = tray.Bills;
        }

        public override void Tick(StationInputContext input)
        {
            if (IsComplete) return;

            if (!running && input.ClickPrimaryDown)
            {
                running = true;
                input.Tray.DrainBills();
            }

            if (running)
            {
                t += Time.deltaTime;
                if (t >= runDuration)
                {
                    if (GameManager.Instance != null) GameManager.Instance.Deposit(totalToCount);
                    IsComplete = true;
                }
            }
        }

        public float RunProgressNormalized => Mathf.Clamp01(t / runDuration);
        public int Total => totalToCount;
        public bool IsRunning => running;
    }
}
