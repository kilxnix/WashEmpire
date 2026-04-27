using System.Collections.Generic;
using Unity.Cinemachine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using WashEmpire;

namespace WashEmpire.EditorTools
{
    public static class RitualSceneWirer
    {
        private static readonly List<string> added = new();
        private static readonly List<string> skipped = new();
        private static readonly List<string> warnings = new();

        [MenuItem("Wash Empire/Wire Ritual Scene")]
        public static void Wire()
        {
            added.Clear();
            skipped.Clear();
            warnings.Clear();

            WireStations();
            WireMainCameraBrain();
            var camRoot = EnsureCamerasRoot();
            var vcams = CreateVCams(camRoot);
            WireStationVCams(vcams);
            var managers = WireManagers();
            WireBayEconomy();

            EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
            if (managers != null) Selection.activeGameObject = managers;

            LogSummary();
        }

        // ---------- Step 1: station components ----------

        private static void WireStations()
        {
            var bay = GameObject.Find("Bay_01");
            if (bay != null)
            {
                var station = EnsureComponent<BayBinStation>(bay);
                var so = new SerializedObject(station);
                SetObjectField(so, "bay", bay.GetComponent<BayController>());
                SetStringField(so, "displayName", "Bay 1 Bin");
                var spot = bay.transform.Find("ServiceSpot");
                if (spot != null) SetObjectField(so, "entrancePoint", spot);
                else warnings.Add("Bay_01 has no 'ServiceSpot' child for entrancePoint.");
                so.ApplyModifiedProperties();
            }
            else warnings.Add("Bay_01 not found.");

            var changer = GameObject.Find("Changer");
            if (changer != null)
            {
                var station = EnsureComponent<ChangerStation>(changer);
                var so = new SerializedObject(station);
                SetObjectField(so, "changer", changer.GetComponent<Changer>());
                SetStringField(so, "displayName", "Changer");
                var anchor = changer.transform.Find("ChangerAnchor");
                SetObjectField(so, "entrancePoint", anchor != null ? (Object)anchor : changer.transform);
                so.ApplyModifiedProperties();
            }
            else warnings.Add("Changer not found.");

            WireOfficeChild<OfficeDoorStation>("OfficeDoorTrigger", "Office Door", null);
            WireOfficeChild<MoneyCounterStation>("MoneyCounter", "Money Counter", "MoneyCounterAnchor");
            WireOfficeChild<CoinSifterStation>("CoinSifter", "Coin Sifter", "CoinSifterAnchor");
            WireOfficeChild<OfficeTerminalStation>("Terminal", "Terminal", "TerminalAnchor");
        }

        private static void WireOfficeChild<T>(string childName, string display, string anchorName) where T : Component
        {
            var office = GameObject.Find("Office");
            if (office == null) { warnings.Add("Office not found."); return; }
            var child = office.transform.Find(childName);
            if (child == null) { warnings.Add($"Office/{childName} not found."); return; }

            var station = EnsureComponent<T>(child.gameObject);
            var so = new SerializedObject(station);
            SetStringField(so, "displayName", display);
            if (anchorName != null)
            {
                var anchor = child.Find(anchorName);
                if (anchor != null) SetObjectField(so, "entrancePoint", anchor);
                else warnings.Add($"{childName} missing '{anchorName}' child.");
            }
            so.ApplyModifiedProperties();
        }

        // ---------- Step 2: CinemachineBrain on Main Camera ----------

        private static void WireMainCameraBrain()
        {
            var mainCam = GameObject.Find("Main Camera");
            if (mainCam == null) { warnings.Add("Main Camera not found."); return; }
            if (mainCam.GetComponent<CinemachineBrain>() == null)
            {
                mainCam.AddComponent<CinemachineBrain>();
                added.Add("CinemachineBrain on Main Camera");
            }
            else skipped.Add("CinemachineBrain on Main Camera (already present)");
        }

        // ---------- Step 3: _Cameras root + vcams ----------

        private static GameObject EnsureCamerasRoot()
        {
            var root = GameObject.Find("_Cameras");
            if (root == null)
            {
                root = new GameObject("_Cameras");
                added.Add("_Cameras root");
            }
            else skipped.Add("_Cameras root (already present)");
            return root;
        }

        private static Dictionary<string, CinemachineCamera> CreateVCams(GameObject root)
        {
            var map = new Dictionary<string, CinemachineCamera>();

            var mainCam = GameObject.Find("Main Camera");
            Vector3 mainPos = mainCam != null ? mainCam.transform.position : Vector3.zero;
            Quaternion mainRot = mainCam != null ? mainCam.transform.rotation : Quaternion.identity;

            map["vcam_Overhead"] = EnsureVCam(root, "vcam_Overhead", mainPos, mainRot, 10);

            var fp = EnsureVCam(root, "vcam_FP", Vector3.zero, Quaternion.identity, 0);
            if (fp.GetComponent<FPCameraController>() == null)
            {
                fp.gameObject.AddComponent<FPCameraController>();
                added.Add("FPCameraController on vcam_FP");
            }
            map["vcam_FP"] = fp;

            var bay = GameObject.Find("Bay_01");
            Vector3 bayPos = bay != null ? bay.transform.position + new Vector3(0f, 1.5f, 0f) : Vector3.zero;
            map["vcam_Station_BayBin1"] = EnsureVCam(root, "vcam_Station_BayBin1", bayPos, Quaternion.identity, 0);

            var changer = GameObject.Find("Changer");
            Vector3 changerPos = Vector3.zero;
            if (changer != null)
            {
                var anchor = changer.transform.Find("ChangerAnchor");
                changerPos = anchor != null ? anchor.position : changer.transform.position;
            }
            map["vcam_Station_Changer"] = EnsureVCam(root, "vcam_Station_Changer", changerPos, Quaternion.identity, 0);

            map["vcam_Station_OfficeDoor"] = EnsureVCam(root, "vcam_Station_OfficeDoor",
                FindChildPos("Office", "OfficeDoorTrigger"), Quaternion.identity, 0);
            map["vcam_Station_MoneyCounter"] = EnsureVCam(root, "vcam_Station_MoneyCounter",
                FindAnchorPos("Office/MoneyCounter", "MoneyCounterAnchor"), Quaternion.identity, 0);
            map["vcam_Station_CoinSifter"] = EnsureVCam(root, "vcam_Station_CoinSifter",
                FindAnchorPos("Office/CoinSifter", "CoinSifterAnchor"), Quaternion.identity, 0);
            map["vcam_Station_Terminal"] = EnsureVCam(root, "vcam_Station_Terminal",
                FindAnchorPos("Office/Terminal", "TerminalAnchor"), Quaternion.identity, 0);

            return map;
        }

        private static CinemachineCamera EnsureVCam(GameObject root, string name, Vector3 pos, Quaternion rot, int priority)
        {
            var existing = root.transform.Find(name);
            if (existing != null)
            {
                skipped.Add($"{name} (already present)");
                var c = existing.GetComponent<CinemachineCamera>();
                if (c == null) c = existing.gameObject.AddComponent<CinemachineCamera>();
                return c;
            }
            var go = new GameObject(name);
            go.transform.SetParent(root.transform, false);
            go.transform.position = pos;
            go.transform.rotation = rot;
            var cam = go.AddComponent<CinemachineCamera>();
            cam.Priority = priority;
            added.Add(name);
            return cam;
        }

        private static Vector3 FindChildPos(string parentName, string childName)
        {
            var p = GameObject.Find(parentName);
            if (p == null) { warnings.Add($"{parentName} not found for vcam placement."); return Vector3.zero; }
            var c = p.transform.Find(childName);
            if (c == null) { warnings.Add($"{parentName}/{childName} not found for vcam placement."); return p.transform.position; }
            return c.position;
        }

        private static Vector3 FindAnchorPos(string parentPath, string anchorName)
        {
            var parts = parentPath.Split('/');
            var root = GameObject.Find(parts[0]);
            if (root == null) { warnings.Add($"{parts[0]} not found."); return Vector3.zero; }
            Transform t = root.transform;
            for (int i = 1; i < parts.Length; i++)
            {
                t = t.Find(parts[i]);
                if (t == null) { warnings.Add($"{parentPath} chain broken at '{parts[i]}'."); return Vector3.zero; }
            }
            var anchor = t.Find(anchorName);
            if (anchor == null) { warnings.Add($"{parentPath}/{anchorName} missing — vcam placed at parent."); return t.position; }
            return anchor.position;
        }

        // ---------- Step 4: wire stationVCam fields ----------

        private static void WireStationVCams(Dictionary<string, CinemachineCamera> vcams)
        {
            WireStationVCam<BayBinStation>(GameObject.Find("Bay_01"), vcams, "vcam_Station_BayBin1");
            WireStationVCam<ChangerStation>(GameObject.Find("Changer"), vcams, "vcam_Station_Changer");
            WireStationVCam<OfficeDoorStation>(FindOfficeChild("OfficeDoorTrigger"), vcams, "vcam_Station_OfficeDoor");
            WireStationVCam<MoneyCounterStation>(FindOfficeChild("MoneyCounter"), vcams, "vcam_Station_MoneyCounter");
            WireStationVCam<CoinSifterStation>(FindOfficeChild("CoinSifter"), vcams, "vcam_Station_CoinSifter");
            WireStationVCam<OfficeTerminalStation>(FindOfficeChild("Terminal"), vcams, "vcam_Station_Terminal");
        }

        private static GameObject FindOfficeChild(string name)
        {
            var office = GameObject.Find("Office");
            if (office == null) return null;
            var c = office.transform.Find(name);
            return c != null ? c.gameObject : null;
        }

        private static void WireStationVCam<T>(GameObject host, Dictionary<string, CinemachineCamera> vcams, string vcamName) where T : CollectionStation
        {
            if (host == null) return;
            var station = host.GetComponent<T>();
            if (station == null) return;
            if (!vcams.TryGetValue(vcamName, out var vcam) || vcam == null) return;
            var so = new SerializedObject(station);
            SetObjectField(so, "stationVCam", vcam);
            so.ApplyModifiedProperties();
        }

        // ---------- Step 5: managers ----------

        private static GameObject WireManagers()
        {
            var managers = GameObject.Find("_Managers");
            if (managers == null) { warnings.Add("_Managers not found."); return null; }

            EnsureManagerComponent<RitualController>(managers);
            EnsureManagerComponent<TaskSystem>(managers);
            EnsureManagerComponent<RitualDebugLauncher>(managers);
            return managers;
        }

        private static void EnsureManagerComponent<T>(GameObject managers) where T : Component
        {
            if (managers.GetComponent<T>() == null)
            {
                managers.AddComponent<T>();
                added.Add($"{typeof(T).Name} on _Managers");
            }
            else skipped.Add($"{typeof(T).Name} on _Managers (already present)");
        }

        // ---------- Step 6: BayController.economy ----------

        private static void WireBayEconomy()
        {
            var bay = GameObject.Find("Bay_01");
            if (bay == null) return;
            var bc = bay.GetComponent<BayController>();
            if (bc == null) { warnings.Add("Bay_01 has no BayController."); return; }
            var managers = GameObject.Find("_Managers");
            if (managers == null) return;
            var econ = managers.GetComponent<LotEconomy>();
            if (econ == null) { warnings.Add("LotEconomy not found on _Managers — skipping BayController.economy wiring."); return; }
            var so = new SerializedObject(bc);
            SetObjectField(so, "economy", econ);
            so.ApplyModifiedProperties();
        }

        // ---------- helpers ----------

        private static T EnsureComponent<T>(GameObject go) where T : Component
        {
            var c = go.GetComponent<T>();
            if (c == null)
            {
                c = go.AddComponent<T>();
                added.Add($"{typeof(T).Name} on {go.name}");
            }
            else skipped.Add($"{typeof(T).Name} on {go.name} (already present)");
            return c;
        }

        private static void SetObjectField(SerializedObject so, string fieldName, Object value)
        {
            var prop = so.FindProperty(fieldName);
            if (prop == null) { warnings.Add($"Field '{fieldName}' not found on {so.targetObject.GetType().Name}."); return; }
            prop.objectReferenceValue = value;
        }

        private static void SetStringField(SerializedObject so, string fieldName, string value)
        {
            var prop = so.FindProperty(fieldName);
            if (prop == null) { warnings.Add($"Field '{fieldName}' not found on {so.targetObject.GetType().Name}."); return; }
            prop.stringValue = value;
        }

        private static void LogSummary()
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("RitualSceneWirer complete.");
            sb.AppendLine($"Added ({added.Count}):");
            foreach (var a in added) sb.AppendLine($"  + {a}");
            sb.AppendLine($"Skipped ({skipped.Count}):");
            foreach (var s in skipped) sb.AppendLine($"  = {s}");
            if (warnings.Count > 0)
            {
                sb.AppendLine($"Warnings ({warnings.Count}):");
                foreach (var w in warnings) sb.AppendLine($"  ! {w}");
            }
            sb.AppendLine();
            sb.AppendLine("Remaining manual steps:");
            sb.AppendLine("  1. Create PlayerNavAgent prefab and drag into RitualController.PlayerNavAgentPrefab slot");
            sb.AppendLine("  2. Drag vcam_Overhead / vcam_FP into RitualController.OverheadVcam / FpVcam");
            sb.AppendLine("  3. Drag the 6 station GameObjects into RitualController.Stations list (in order: Bay_01, Changer, OfficeDoorTrigger, MoneyCounter, CoinSifter, Terminal)");
            sb.AppendLine("  4. Drag vcam_FP's FPCameraController into RitualController.FpCamera");
            sb.AppendLine("  5. Build TrayHUD / NextStationButton / StationInteractionUI / OfficeTerminalPanel / WeeklyReviewPanel / TaskPanel UI on Canvas");
            sb.AppendLine("  6. Re-bake NavMesh after PlayerNavAgent prefab is placed");

            if (warnings.Count > 0) Debug.LogWarning(sb.ToString());
            else Debug.Log(sb.ToString());
        }
    }
}
