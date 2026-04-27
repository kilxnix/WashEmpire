using System.Collections.Generic;
using UnityEngine;

namespace WashEmpire
{
    public class TaskSystem : MonoBehaviour
    {
        public static TaskSystem Instance { get; private set; }

        public List<Task> ActiveTasks { get; } = new();
        public event System.Action OnTasksChanged;

        private void Awake() => Initialize();

        internal void Initialize()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        internal static void ResetForTests()
        {
            Instance = null;
        }

        private void OnEnable()
        {
            if (TimeController.Instance != null) TimeController.Instance.OnWeekEnded += OnWeekEnded;
        }

        private void OnDisable()
        {
            if (TimeController.Instance != null) TimeController.Instance.OnWeekEnded -= OnWeekEnded;
        }

        private void OnWeekEnded(int week)
        {
            if (TimeController.Instance != null) TimeController.Instance.SetSpeed(0f);

            var collect = new Task
            {
                Id = $"collect_week_{week}",
                Label = "Collect Cash",
                OnTrigger = () =>
                {
                    if (RitualController.Instance != null) RitualController.Instance.StartRitual();
                }
            };
            ActiveTasks.Add(collect);
            OnTasksChanged?.Invoke();
        }

        public void Complete(Task t)
        {
            t.IsComplete = true;
            ActiveTasks.Remove(t);
            OnTasksChanged?.Invoke();
        }

        public bool HasIncomplete => ActiveTasks.Count > 0;
    }
}
