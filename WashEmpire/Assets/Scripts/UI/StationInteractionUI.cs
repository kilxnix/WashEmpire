using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class StationInteractionUI : MonoBehaviour
    {
        [SerializeField] private GameObject root;
        [SerializeField] private TMP_Text promptLabel;
        [SerializeField] private Slider progressBar;

        private void OnEnable()
        {
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnStationEntered += OnEnter;
                RitualController.Instance.OnStationExited += OnExit;
            }
            if (root) root.SetActive(false);
        }

        private void OnDisable()
        {
            if (RitualController.Instance != null)
            {
                RitualController.Instance.OnStationEntered -= OnEnter;
                RitualController.Instance.OnStationExited -= OnExit;
            }
        }

        private void OnEnter(CollectionStation station)
        {
            if (root) root.SetActive(true);
            promptLabel.text = station switch
            {
                BayBinStation _ => "Hold [LMB] to empty bin",
                ChangerStation _ => "Hold [LMB] to pull stacker",
                MoneyCounterStation _ => "Click to run counter",
                CoinSifterStation _ => "Click to run sifter",
                OfficeTerminalStation _ => "Read the receipt",
                _ => ""
            };
            progressBar.value = 0f;
        }

        private void OnExit(CollectionStation _) { if (root) root.SetActive(false); }

        private void Update()
        {
            var s = RitualController.Instance?.CurrentStation;
            if (s == null || progressBar == null) return;
            progressBar.value = s switch
            {
                BayBinStation b => b.HoldProgressNormalized,
                ChangerStation c => c.HoldProgressNormalized,
                MoneyCounterStation mc => mc.RunProgressNormalized,
                CoinSifterStation cs => cs.RunProgressNormalized,
                _ => 0f
            };
        }
    }
}
