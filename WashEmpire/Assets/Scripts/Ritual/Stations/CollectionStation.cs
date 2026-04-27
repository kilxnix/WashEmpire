using UnityEngine;

namespace WashEmpire
{
    public abstract class CollectionStation : MonoBehaviour
    {
        [SerializeField] protected Transform entrancePoint;
        [SerializeField] protected Transform cameraAnchor;
        [SerializeField] protected string displayName = "Station";

        public Transform EntrancePoint => entrancePoint != null ? entrancePoint : transform;
        public Transform CameraAnchor => cameraAnchor != null ? cameraAnchor : transform;
        public string DisplayName => displayName;
        public bool IsComplete { get; protected set; }

        public abstract void Tick(StationInputContext input);

        public virtual void OnArrive(Tray tray) { }
        public virtual void OnLeave(Tray tray) { }
        public virtual void Reset() { IsComplete = false; }
    }

    public struct StationInputContext
    {
        public bool HoldPrimary;
        public bool ClickPrimaryDown;
        public Tray Tray;
    }
}
