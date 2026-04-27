using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class WeeklyReviewController : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text bodyLabel;
        [SerializeField] private Button continueButton;
        [SerializeField] private LotEconomy economy;

        private void OnEnable()
        {
            continueButton.onClick.AddListener(OnContinue);
            if (RitualController.Instance != null) RitualController.Instance.OnRitualCompleted += Show;
            Hide();
        }

        private void OnDisable()
        {
            continueButton.onClick.RemoveListener(OnContinue);
            if (RitualController.Instance != null) RitualController.Instance.OnRitualCompleted -= Show;
        }

        private void Show()
        {
            if (root) root.SetActive(true);
            int rev = economy ? economy.WeeklyRevenue : 0;
            int variable = economy ? economy.WeeklyVariableCosts : 0;
            int fixedCosts = economy ? economy.WeeklyFixedCosts : 0;
            int profit = economy ? economy.WeeklyProfit : 0;
            int cash = GameManager.Instance ? GameManager.Instance.DepositedCash : 0;

            bodyLabel.text =
                $"─── WEEKLY REVIEW ───\n" +
                $"Revenue:     ${rev}\n" +
                $"Variable:   -${variable}\n" +
                $"Fixed:      -${fixedCosts}\n" +
                $"           ─────\n" +
                $"Profit:      ${profit}\n\n" +
                $"Cash on hand: ${cash}";

            if (TaskSystem.Instance != null)
            {
                foreach (var t in TaskSystem.Instance.ActiveTasks.ToArray())
                {
                    if (t.Id.StartsWith("collect_week_")) { TaskSystem.Instance.Complete(t); break; }
                }
            }
        }

        private void OnContinue()
        {
            economy?.ResetForNewWeek();
            if (TimeController.Instance != null) TimeController.Instance.SetSpeed(1f);
            Hide();
        }

        private void Hide() { if (root) root.SetActive(false); }
    }
}
