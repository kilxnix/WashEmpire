using UnityEngine;

namespace WashEmpire
{
    public class FPCameraController : MonoBehaviour
    {
        [SerializeField] private PlayerNavAgent target;
        [SerializeField] private Vector3 eyeOffset = new(0, 1.65f, 0);
        [SerializeField] private float rotationLerp = 8f;

        public void SetTarget(PlayerNavAgent agent) => target = agent;

        private void LateUpdate()
        {
            if (target == null) return;
            transform.position = target.transform.position + eyeOffset;

            Vector3 fwd = target.Forward;
            fwd.y = 0;
            if (fwd.sqrMagnitude > 0.001f)
            {
                Quaternion targetRot = Quaternion.LookRotation(fwd);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, rotationLerp * Time.deltaTime);
            }
        }
    }
}
