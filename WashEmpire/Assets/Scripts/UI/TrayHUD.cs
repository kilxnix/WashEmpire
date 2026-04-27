using TMPro;
using UnityEngine;

namespace WashEmpire
{
    public class TrayHUD : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text billsLabel;
        [SerializeField] private TMP_Text coinsLabel;
        [SerializeField] private TMP_Text tokensLabel;

        private void OnEnable()
        {
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnRitualStarted += Show;
                RitualController.Instance.OnRitualCompleted += Hide;
                RitualController.Instance.Tray.OnChanged += Refresh;
            }
            Hide();
        }

        private void OnDisable()
        {
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnRitualStarted -= Show;
                RitualController.Instance.OnRitualCompleted -= Hide;
                RitualController.Instance.Tray.OnChanged -= Refresh;
            }
        }

        private void Show() { if (root) root.SetActive(true); Refresh(); }
        private void Hide() { if (root) root.SetActive(false); }

        private void Refresh()
        {
            var t = RitualController.Instance?.Tray;
            if (t == null) return;
            billsLabel.text = $"Bills:  ${t.Bills}";
            coinsLabel.text = $"Coins:  ${t.Coins}";
            tokensLabel.text = $"Tokens: ${t.Tokens}";
        }
    }
}
