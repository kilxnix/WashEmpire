using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace WashEmpire
{
    public class TaskPanelHUD : MonoBehaviour
    {
        [SerializeField] private Transform listRoot;
        [SerializeField] private GameObject taskRowPrefab;

        private void OnEnable()
        {
            if (TaskSystem.Instance != null) TaskSystem.Instance.OnTasksChanged += Refresh;
            Refresh();
        }

        private void OnDisable()
        {
            if (TaskSystem.Instance != null) TaskSystem.Instance.OnTasksChanged -= Refresh;
        }

        private void Refresh()
        {
            foreach (Transform child in listRoot) Destroy(child.gameObject);
            if (TaskSystem.Instance == null) return;

            foreach (var task in TaskSystem.Instance.ActiveTasks)
            {
                var row = Instantiate(taskRowPrefab, listRoot);
                row.GetComponentInChildren<TMP_Text>().text = task.Label;
                row.GetComponentInChildren<Button>().onClick.AddListener(() => task.OnTrigger?.Invoke());
            }
        }
    }
}
