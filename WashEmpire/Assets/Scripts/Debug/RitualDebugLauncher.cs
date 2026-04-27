using UnityEngine;
using UnityEngine.InputSystem;

namespace WashEmpire
{
    public class RitualDebugLauncher : MonoBehaviour
    {
        private void Update()
        {
            if (Keyboard.current != null && Keyboard.current.rKey.wasPressedThisFrame)
            {
                if (RitualController.Instance != null) RitualController.Instance.StartRitual();
            }
        }
    }
}
