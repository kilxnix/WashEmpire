using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class TimeControlsHUD : MonoBehaviour
    {
        [SerializeField] private TMP_Text dayLabel;
        [SerializeField] private Button pauseButton;
        [SerializeField] private Button speed1xButton;
        [SerializeField] private Button speed3xButton;
        [SerializeField] private Button speed10xButton;

        private static readonly string[] DayNames = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };

        private void OnEnable()
        {
            pauseButton.onClick.AddListener(() => TimeController.Instance.SetSpeed(0f));
            speed1xButton.onClick.AddListener(() => TimeController.Instance.SetSpeed(1f));
            speed3xButton.onClick.AddListener(() => TimeController.Instance.SetSpeed(3f));
            speed10xButton.onClick.AddListener(() => TimeController.Instance.SetSpeed(10f));
        }

        private void OnDisable()
        {
            pauseButton.onClick.RemoveAllListeners();
            speed1xButton.onClick.RemoveAllListeners();
            speed3xButton.onClick.RemoveAllListeners();
            speed10xButton.onClick.RemoveAllListeners();
        }

        private void Update()
        {
            if (TimeController.Instance == null || dayLabel == null) return;
            var tc = TimeController.Instance;
            dayLabel.text = $"Week {tc.CurrentWeek + 1} • {DayNames[tc.DayOfWeek]}";
        }
    }
}
