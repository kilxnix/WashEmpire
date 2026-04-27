using UnityEngine;

namespace WashEmpire
{
    public class OfficeTerminalStation : CollectionStation
    {
        private bool continuePressed;

        public override void OnArrive(Tray tray) => continuePressed = false;

        public override void Tick(StationInputContext input)
        {
            if (IsComplete) return;
            if (continuePressed) IsComplete = true;
        }

        public void OnContinueClicked() => continuePressed = true;
    }
}
