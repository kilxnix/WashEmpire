using System;
using System.Collections.Generic;
using UnityEngine;

namespace WashEmpire
{
    public class RitualController : MonoBehaviour
    {
        public static RitualController Instance { get; private set; }

        public enum RitualState { Idle, Walking, AtStation, Interacting, Done }

        [SerializeField] private GameObject playerNavAgentPrefab;
        [SerializeField] private Transform ritualEntryPoint;
        [SerializeField] private List<CollectionStation> stations = new();
        [SerializeField] private FPCameraController fpCamera;

        [Header("Cinemachine VCam Priorities")]
        [SerializeField] private Unity.Cinemachine.CinemachineCamera overheadVCam;
        [SerializeField] private Unity.Cinemachine.CinemachineCamera fpVCam;

        public RitualState State { get; private set; } = RitualState.Idle;
        public bool IsActive => State != RitualState.Idle && State != RitualState.Done;
        public Tray Tray { get; private set; } = new Tray();
        public CollectionStation CurrentStation { get; private set; }

        public event Action OnRitualStarted;
        public event Action OnRitualCompleted;
        public event Action<CollectionStation> OnStationEntered;
        public event Action<CollectionStation> OnStationExited;

        private PlayerNavAgent player;
        private int stationIndex = -1;

        private void Awake() => Initialize();

        internal void Initialize()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        internal static void ResetForTests() => Instance = null;

        internal void ConfigureForTest(params CollectionStation[] testStations)
        {
            stations = new List<CollectionStation>(testStations);
        }

        public void StartRitual()
        {
            if (State != RitualState.Idle) return;
            Tray.Clear();
            stationIndex = -1;
            foreach (var s in stations) s?.Reset();

            if (playerNavAgentPrefab != null && ritualEntryPoint != null)
            {
                var go = Instantiate(playerNavAgentPrefab, ritualEntryPoint.position, ritualEntryPoint.rotation);
                player = go.GetComponent<PlayerNavAgent>();
                if (fpCamera != null) fpCamera.SetTarget(player);
            }

            SetOverheadActive(false);
            State = RitualState.Walking;
            OnRitualStarted?.Invoke();
            AdvanceToNextStation();
        }

        public void AdvanceToNextStation()
        {
            stationIndex++;
            if (stationIndex >= stations.Count)
            {
                EndRitual();
                return;
            }
            CurrentStation = stations[stationIndex];
            if (player != null) player.GoTo(CurrentStation.EntrancePoint.position);
            State = RitualState.Walking;
        }

        public void OnArriveAtStation()
        {
            if (CurrentStation == null) return;
            CurrentStation.OnArrive(Tray);
            if (CurrentStation.StationVCam != null) CurrentStation.StationVCam.Priority = 20;
            State = RitualState.AtStation;
            OnStationEntered?.Invoke(CurrentStation);
        }

        public void BeginInteraction() => State = RitualState.Interacting;

        public void OnStationComplete()
        {
            if (CurrentStation == null) return;
            if (CurrentStation.StationVCam != null) CurrentStation.StationVCam.Priority = 0;
            CurrentStation.OnLeave(Tray);
            OnStationExited?.Invoke(CurrentStation);
            CurrentStation = null;
            if (stationIndex + 1 >= stations.Count) EndRitual();
            else State = RitualState.Walking;
        }

        private void EndRitual()
        {
            State = RitualState.Done;
            if (player != null) Destroy(player.gameObject);
            player = null;
            SetOverheadActive(true);
            SaveCurrentState();
            OnRitualCompleted?.Invoke();
        }

        private void OnApplicationQuit() => SaveCurrentState();

        private void SaveCurrentState()
        {
            if (GameManager.Instance == null) return;
            var data = new SaveData
            {
                version = 2,
                deposited_cash = GameManager.Instance.DepositedCash,
                current_day_index = TimeController.Instance != null ? TimeController.Instance.CurrentDayIndex : 0
            };
            SaveSystem.Save(data);
        }

        private void SetOverheadActive(bool active)
        {
            if (overheadVCam != null) overheadVCam.Priority = active ? 10 : 0;
            if (fpVCam != null) fpVCam.Priority = active ? 0 : 10;
        }

        private void Update()
        {
            if (State == RitualState.Idle || State == RitualState.Done) return;

            if (State == RitualState.Walking && player != null && player.HasArrived && CurrentStation != null)
            {
                OnArriveAtStation();
            }

            if (State == RitualState.AtStation || State == RitualState.Interacting)
            {
                var ctx = new StationInputContext
                {
                    HoldPrimary = RitualMouse.HoldPrimary(),
                    ClickPrimaryDown = RitualMouse.ClickPrimaryDown(),
                    Tray = Tray
                };
                CurrentStation?.Tick(ctx);
                if (CurrentStation != null && CurrentStation.IsComplete)
                {
                    OnStationComplete();
                    AdvanceToNextStation();
                }
            }
        }

        public void RegisterPlayerAgent(PlayerNavAgent agent) => player = agent;
        public void ClearPlayerAgent() => player = null;

        public CollectionStation PeekNextStation()
        {
            int idx = stationIndex + 1;
            if (idx >= 0 && idx < stations.Count) return stations[idx];
            return null;
        }
    }

    internal static class RitualMouse
    {
        public static bool HoldPrimary() =>
            UnityEngine.InputSystem.Mouse.current != null &&
            UnityEngine.InputSystem.Mouse.current.leftButton.isPressed;

        public static bool ClickPrimaryDown() =>
            UnityEngine.InputSystem.Mouse.current != null &&
            UnityEngine.InputSystem.Mouse.current.leftButton.wasPressedThisFrame;
    }
}
