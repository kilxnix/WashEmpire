using System.Collections;
using UnityEngine;
using UnityEngine.AI;

namespace WashEmpire
{
    [RequireComponent(typeof(NavMeshAgent))]
    public class CarController : MonoBehaviour
    {
        private enum State { SeekingBay, DrivingToBay, Washing, Leaving, Despawning }

        [Tooltip("Distance from destination at which the car is considered to have arrived.")]
        [SerializeField] private float arrivalThreshold = 0.5f;

        [Tooltip("Time before destroy after reaching exit, lets the car ease off-screen.")]
        [SerializeField] private float despawnDelay = 0.5f;

        private NavMeshAgent agent;
        private BayController reservedBay;
        private State state;

        private void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
        }

        private void Start()
        {
            state = State.SeekingBay;
            TrySeekBay();
        }

        private void Update()
        {
            switch (state)
            {
                case State.SeekingBay:
                    TrySeekBay();
                    break;

                case State.DrivingToBay:
                    if (HasArrived())
                    {
                        StartCoroutine(WashThenLeave());
                    }
                    break;

                case State.Leaving:
                    if (HasArrived())
                    {
                        state = State.Despawning;
                        StartCoroutine(Despawn());
                    }
                    break;
            }
        }

        private void TrySeekBay()
        {
            if (LotController.Instance == null) return;

            reservedBay = LotController.Instance.TryReserveOpenBay();
            if (reservedBay == null)
            {
                // No bay available; balk and leave (slice spec §3.2 deferred queue).
                DriveToExit();
                return;
            }

            agent.SetDestination(reservedBay.ServiceSpot.position);
            state = State.DrivingToBay;
        }

        private IEnumerator WashThenLeave()
        {
            state = State.Washing;
            agent.isStopped = true;
            yield return reservedBay.RunWash();
            agent.isStopped = false;
            reservedBay.Release();
            reservedBay = null;
            DriveToExit();
        }

        private void DriveToExit()
        {
            var exit = LotController.Instance != null ? LotController.Instance.ExitPoint : null;
            if (exit == null)
            {
                state = State.Despawning;
                StartCoroutine(Despawn());
                return;
            }
            agent.SetDestination(exit.position);
            state = State.Leaving;
        }

        private bool HasArrived()
        {
            if (agent.pathPending) return false;
            if (agent.remainingDistance > arrivalThreshold) return false;
            return !agent.hasPath || agent.velocity.sqrMagnitude < 0.01f;
        }

        private IEnumerator Despawn()
        {
            yield return new WaitForSeconds(despawnDelay);
            Destroy(gameObject);
        }

        private void OnDestroy()
        {
            if (reservedBay != null)
            {
                reservedBay.Release();
            }
        }
    }
}
