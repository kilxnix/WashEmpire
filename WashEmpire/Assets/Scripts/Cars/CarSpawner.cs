using UnityEngine;

namespace WashEmpire
{
    public class CarSpawner : MonoBehaviour
    {
        [SerializeField] private GameObject carPrefab;
        [SerializeField] private Transform spawnPoint;

        [Tooltip("Real-time seconds between spawns. Sprint 1 placeholder; demand-driven spawning lands in Sprint 3.")]
        [SerializeField] private float spawnInterval = 4f;

        [Tooltip("Initial delay before the first spawn so the scene settles.")]
        [SerializeField] private float initialDelay = 1f;

        private float timer;

        private void Start()
        {
            timer = -initialDelay;
        }

        private void Update()
        {
            timer += Time.deltaTime;
            if (timer >= spawnInterval)
            {
                timer = 0f;
                Spawn();
            }
        }

        private void Spawn()
        {
            if (carPrefab == null) return;
            var point = spawnPoint != null ? spawnPoint : transform;
            Instantiate(carPrefab, point.position, point.rotation);
        }
    }
}
