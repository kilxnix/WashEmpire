using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class OfficeTerminalScreen : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text bodyLabel;
        [SerializeField] private Button continueButton;
        [SerializeField] private OfficeTerminalStation terminalStation;
        [SerializeField] private MoneyCounterStation counterStation;
        [SerializeField] private CoinSifterStation sifterStation;
        [SerializeField] private LotEconomy economy;
        [SerializeField] private bool camerasOwned = false;

        private void OnEnable()
        {
            continueButton.onClick.AddListener(OnContinue);
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnStationEntered += OnEnter;
                RitualController.Instance.OnStationExited += OnExit;
            }
            if (root) root.SetActive(false);
        }

        private void OnDisable()
        {
            continueButton.onClick.RemoveListener(OnContinue);
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnStationEntered -= OnEnter;
                RitualController.Instance.OnStationExited -= OnExit;
            }
        }

        private void OnEnter(CollectionStation s)
        {
            if (s != terminalStation) return;
            if (root) root.SetActive(true);
            BuildReceiptText();
        }

        private void OnExit(CollectionStation s)
        {
            if (s == terminalStation && root) root.SetActive(false);
        }

        private void BuildReceiptText()
        {
            int billsCounter = counterStation != null ? counterStation.Total : 0;
            int coinsSifter = sifterStation != null ? sifterStation.Total : 0;
            int theoretical = economy != null ? economy.WeeklyRevenue : 0;
            int slippage = economy != null ? economy.WeeklySlippage : 0;
            int total = billsCounter + coinsSifter;
            int cardRevenue = economy != null ? economy.WeeklyCardRevenue : 0;

            string slippageHint = camerasOwned ? "" : "  ← cameras would help";
            string cardLine = cardRevenue > 0 ? $"Card revenue (auto): ${cardRevenue} (-3% fee)\n" : "";

            bodyLabel.text =
                $"─── WEEK DEPOSIT ───\n" +
                $"Bills (counter):     ${billsCounter}\n" +
                $"Coins (sifter):      ${coinsSifter}\n" +
                $"                   ─────\n" +
                $"TOTAL DEPOSITED:     ${total}\n\n" +
                $"Theoretical revenue: ${theoretical}\n" +
                $"Token slippage:      -${slippage}{slippageHint}\n" +
                cardLine;
        }

        private void OnContinue() => terminalStation.OnContinueClicked();
    }
}
