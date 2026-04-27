using UnityEngine;
using UnityEngine.AI;

namespace WashEmpire
{
    [RequireComponent(typeof(NavMeshAgent))]
    public class PlayerNavAgent : MonoBehaviour
    {
        [SerializeField] private float arrivalThreshold = 0.4f;
        private NavMeshAgent agent;
        private bool destinationSet;

        public bool HasArrived
        {
            get
            {
                if (!destinationSet) return false;
                if (agent.pathPending) return false;
                return agent.remainingDistance <= arrivalThreshold && agent.velocity.sqrMagnitude < 0.01f;
            }
        }

        public Vector3 Forward => agent.velocity.sqrMagnitude > 0.01f ? agent.velocity.normalized : transform.forward;

        private void Awake() => agent = GetComponent<NavMeshAgent>();

        public void GoTo(Vector3 worldPosition)
        {
            agent.SetDestination(worldPosition);
            destinationSet = true;
        }

        public void Stop()
        {
            agent.ResetPath();
            destinationSet = false;
        }
    }
}
