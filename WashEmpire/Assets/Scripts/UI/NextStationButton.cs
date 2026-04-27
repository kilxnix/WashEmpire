using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class NextStationButton : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text label;
        [SerializeField] private Button button;

        private void OnEnable()
        {
            button.onClick.AddListener(GoToNext);
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnRitualStarted += Show;
                RitualController.Instance.OnRitualCompleted += Hide;
                RitualController.Instance.OnStationExited += OnStationExited;
            }
            Hide();
        }

        private void OnDisable()
        {
            button.onClick.RemoveListener(GoToNext);
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnRitualStarted -= Show;
                RitualController.Instance.OnRitualCompleted -= Hide;
                RitualController.Instance.OnStationExited -= OnStationExited;
            }
        }

        private void OnStationExited(CollectionStation _) => Refresh();

        private void Show() { if (root) root.SetActive(true); Refresh(); }
        private void Hide() { if (root) root.SetActive(false); }

        private void Refresh()
        {
            var rc = RitualController.Instance;
            if (rc == null) return;
            var next = rc.PeekNextStation();
            label.text = next != null ? $"Next: {next.DisplayName} →" : "Continue";
        }

        private void GoToNext()
        {
            RitualController.Instance?.AdvanceToNextStation();
        }
    }
}
