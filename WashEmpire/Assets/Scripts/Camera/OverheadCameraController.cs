using UnityEngine;
using UnityEngine.InputSystem;

namespace WashEmpire
{
    public class OverheadCameraController : MonoBehaviour
    {
        [SerializeField] private float panSpeed = 12f;
        [SerializeField] private float rotateSpeed = 90f;
        [SerializeField] private float zoomSpeed = 8f;
        [SerializeField] private float minZoom = 5f;
        [SerializeField] private float maxZoom = 30f;

        [Tooltip("Optional pivot the camera orbits around. If null, camera rotates around itself.")]
        [SerializeField] private Transform pivot;

        private Camera cam;

        private void Awake()
        {
            cam = GetComponent<Camera>();
        }

        private void Update()
        {
            if (RitualController.Instance != null && RitualController.Instance.IsActive) return;

            var keyboard = Keyboard.current;
            var mouse = Mouse.current;
            if (keyboard == null) return;

            HandlePan(keyboard);
            HandleRotate(keyboard);
            if (mouse != null) HandleZoom(mouse);
        }

        private void HandlePan(Keyboard kb)
        {
            float x = (kb.dKey.isPressed ? 1f : 0f) - (kb.aKey.isPressed ? 1f : 0f);
            float z = (kb.wKey.isPressed ? 1f : 0f) - (kb.sKey.isPressed ? 1f : 0f);
            if (x == 0f && z == 0f) return;

            var forward = transform.forward;
            forward.y = 0f;
            forward.Normalize();
            var right = transform.right;
            right.y = 0f;
            right.Normalize();

            transform.position += (right * x + forward * z) * panSpeed * Time.deltaTime;
        }

        private void HandleRotate(Keyboard kb)
        {
            float dir = (kb.eKey.isPressed ? 1f : 0f) - (kb.qKey.isPressed ? 1f : 0f);
            if (dir == 0f) return;

            float yaw = dir * rotateSpeed * Time.deltaTime;
            if (pivot != null)
            {
                transform.RotateAround(pivot.position, Vector3.up, yaw);
            }
            else
            {
                transform.Rotate(Vector3.up, yaw, Space.World);
            }
        }

        private void HandleZoom(Mouse m)
        {
            float scroll = m.scroll.ReadValue().y;
            if (Mathf.Approximately(scroll, 0f)) return;

            // scroll value is unscaled wheel delta; normalize so a single tick is meaningful.
            float delta = -Mathf.Sign(scroll) * zoomSpeed * Time.deltaTime * 60f;

            if (cam != null && cam.orthographic)
            {
                cam.orthographicSize = Mathf.Clamp(cam.orthographicSize + delta, minZoom, maxZoom);
            }
            else
            {
                transform.position += transform.forward * -delta;
            }
        }
    }
}
