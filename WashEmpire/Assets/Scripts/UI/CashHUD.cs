using TMPro;
using UnityEngine;

namespace WashEmpire
{
    public class CashHUD : MonoBehaviour
    {
        [SerializeField] private TMP_Text cashLabel;
        [SerializeField] private string format = "${0:N0}";

        private void OnEnable()
        {
            TrySubscribe();
        }

        private void Start()
        {
            TrySubscribe();
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnCashChanged -= HandleCashChanged;
            }
        }

        private void TrySubscribe()
        {
            if (GameManager.Instance == null) return;
            GameManager.Instance.OnCashChanged -= HandleCashChanged;
            GameManager.Instance.OnCashChanged += HandleCashChanged;
            HandleCashChanged(GameManager.Instance.Cash);
        }

        private void HandleCashChanged(int cash)
        {
            if (cashLabel != null)
            {
                cashLabel.text = string.Format(format, cash);
            }
        }
    }
}
