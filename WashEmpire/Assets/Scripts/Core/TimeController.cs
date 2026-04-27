using System;
using UnityEngine;

namespace WashEmpire
{
    public class TimeController : MonoBehaviour
    {
        public static TimeController Instance { get; private set; }

        [SerializeField] private float secondsPerDay = 30f;
        [SerializeField] private float speedMultiplier = 1f;

        private float dayProgress;
        private int dayIndex;

        public int CurrentDayIndex => dayIndex;
        public int CurrentWeek => dayIndex / 7;
        public int DayOfWeek => dayIndex % 7;
        public float NormalizedDayProgress => dayProgress / secondsPerDay;
        public float SpeedMultiplier => speedMultiplier;
        public bool IsPaused => Mathf.Approximately(speedMultiplier, 0f);

        public event Action<int> OnDayChanged;
        public event Action<int> OnWeekEnded;

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
        }

        internal static void ResetForTests()
        {
            Instance = null;
        }

        internal void Configure(float secondsPerDay)
        {
            this.secondsPerDay = secondsPerDay;
        }

        private void Update() => Tick(Time.deltaTime);

        public void Tick(float realDeltaSeconds)
        {
            float scaled = realDeltaSeconds * speedMultiplier;
            dayProgress += scaled;
            while (dayProgress >= secondsPerDay)
            {
                dayProgress -= secondsPerDay;
                dayIndex++;
                OnDayChanged?.Invoke(dayIndex);
                if (DayOfWeek == 0) OnWeekEnded?.Invoke(CurrentWeek);
            }
        }

        public void SetSpeed(float multiplier) => speedMultiplier = Mathf.Clamp(multiplier, 0f, 100f);
    }
}
