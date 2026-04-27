using UnityEngine;

namespace WashEmpire
{
    public class CoinSifterStation : CollectionStation
    {
        [SerializeField] private float runDuration = 6f;
        private float t;
        private bool running;
        private int totalToSift;

        public override void OnArrive(Tray tray)
        {
            t = 0f;
            running = false;
            totalToSift = tray.Coins;
        }

        public override void Tick(StationInputContext input)
        {
            if (IsComplete) return;

            if (!running && input.ClickPrimaryDown)
            {
                running = true;
                input.Tray.DrainCoins();
            }

            if (running)
            {
                t += Time.deltaTime;
                if (t >= runDuration)
                {
                    if (GameManager.Instance != null) GameManager.Instance.Deposit(totalToSift);
                    IsComplete = true;
                }
            }
        }

        public float RunProgressNormalized => Mathf.Clamp01(t / runDuration);
        public int Total => totalToSift;
        public bool IsRunning => running;
    }
}
