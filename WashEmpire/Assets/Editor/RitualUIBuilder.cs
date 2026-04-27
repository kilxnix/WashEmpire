using System.Collections.Generic;
using TMPro;
using Unity.Cinemachine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.UI;
using WashEmpire;

namespace WashEmpire.EditorTools
{
    public static class RitualUIBuilder
    {
        private const string PrefabsFolder = "Assets/Prefabs";
        private const string UIPrefabsFolder = "Assets/Prefabs/UI";
        private const string PlayerNavAgentPath = "Assets/Prefabs/PlayerNavAgent.prefab";
        private const string TaskRowPath = "Assets/Prefabs/UI/TaskRow.prefab";

        private static readonly List<string> created = new();
        private static readonly List<string> skipped = new();
        private static readonly List<string> wired = new();
        private static readonly List<string> warnings = new();

        [MenuItem("Wash Empire/Build Ritual UI + Prefabs")]
        public static void Build()
        {
            created.Clear();
            skipped.Clear();
            wired.Clear();
            warnings.Clear();

            EnsureFolder(PrefabsFolder);
            EnsureFolder(UIPrefabsFolder);

            BuildPlayerNavAgentPrefab();
            BuildTaskRowPrefab();

            var canvas = GameObject.Find("Canvas");
            if (canvas == null)
            {
                Debug.LogError("RitualUIBuilder: 'Canvas' not found in scene. Aborting UI panel build. (Prefabs were still created.)");
                return;
            }

            BuildTrayHUDPanel(canvas.transform);
            BuildNextStationPanel(canvas.transform);
            BuildStationInteractionPanel(canvas.transform);
            BuildOfficeTerminalPanel(canvas.transform);
            BuildWeeklyReviewPanel(canvas.transform);
            BuildTaskPanel(canvas.transform);

            WireRitualController();
            WireBayEconomy();

            EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
            AssetDatabase.SaveAssets();

            var managers = GameObject.Find("_Managers");
            if (managers != null) Selection.activeGameObject = managers;

            LogSummary();
        }

        // ---------- folders ----------

        private static void EnsureFolder(string assetPath)
        {
            if (AssetDatabase.IsValidFolder(assetPath)) return;
            var parent = System.IO.Path.GetDirectoryName(assetPath).Replace('\\', '/');
            var leaf = System.IO.Path.GetFileName(assetPath);
            if (!AssetDatabase.IsValidFolder(parent)) EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, leaf);
        }

        // ---------- 1. PlayerNavAgent prefab ----------

        private static void BuildPlayerNavAgentPrefab()
        {
            if (AssetDatabase.LoadAssetAtPath<GameObject>(PlayerNavAgentPath) != null)
            {
                skipped.Add($"prefab {PlayerNavAgentPath} (already exists)");
                return;
            }

            var go = new GameObject("PlayerNavAgent");
            go.transform.position = Vector3.zero;
            var agent = go.AddComponent<NavMeshAgent>();
            agent.speed = 2.5f;
            agent.angularSpeed = 300f;
            agent.stoppingDistance = 0.3f;
            agent.radius = 0.3f;
            agent.height = 1.7f;
            go.AddComponent<PlayerNavAgent>();

            PrefabUtility.SaveAsPrefabAsset(go, PlayerNavAgentPath);
            Object.DestroyImmediate(go);
            created.Add($"prefab {PlayerNavAgentPath}");
        }

        // ---------- 2. TaskRow prefab ----------

        private static void BuildTaskRowPrefab()
        {
            if (AssetDatabase.LoadAssetAtPath<GameObject>(TaskRowPath) != null)
            {
                skipped.Add($"prefab {TaskRowPath} (already exists)");
                return;
            }

            var btnGO = new GameObject("TaskRow", typeof(RectTransform));
            var rt = btnGO.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(220f, 32f);
            var img = btnGO.AddComponent<Image>();
            img.color = Color.white;
            var btn = btnGO.AddComponent<Button>();
            btn.targetGraphic = img;

            var labelGO = new GameObject("Label", typeof(RectTransform));
            labelGO.transform.SetParent(btnGO.transform, false);
            var lrt = labelGO.GetComponent<RectTransform>();
            lrt.anchorMin = Vector2.zero;
            lrt.anchorMax = Vector2.one;
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;
            var tmp = labelGO.AddComponent<TextMeshProUGUI>();
            tmp.text = "Task";
            tmp.fontSize = 14f;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.black;

            PrefabUtility.SaveAsPrefabAsset(btnGO, TaskRowPath);
            Object.DestroyImmediate(btnGO);
            created.Add($"prefab {TaskRowPath}");
        }

        // ---------- 3a. TrayHUDPanel ----------

        private static void BuildTrayHUDPanel(Transform canvas)
        {
            const string name = "TrayHUDPanel";
            if (canvas.Find(name) != null) { skipped.Add($"panel {name}"); return; }

            var panel = MakePanel(name, canvas, new Vector2(0f, 0f), new Vector2(0f, 0f), new Vector2(0f, 0f),
                new Vector2(200f, 120f), new Vector2(20f, 20f));

            var vlg = panel.AddComponent<VerticalLayoutGroup>();
            vlg.padding = new RectOffset(8, 8, 8, 8);
            vlg.spacing = 4f;
            vlg.childControlWidth = true;
            vlg.childControlHeight = true;
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;

            var bills = MakeTMPLabel("BillsLabel", panel.transform, "Bills: $0", 16f, TextAlignmentOptions.MidlineLeft);
            var coins = MakeTMPLabel("CoinsLabel", panel.transform, "Coins: $0", 16f, TextAlignmentOptions.MidlineLeft);
            var tokens = MakeTMPLabel("TokensLabel", panel.transform, "Tokens: $0", 16f, TextAlignmentOptions.MidlineLeft);
            AddFlexibleHeight(bills.gameObject);
            AddFlexibleHeight(coins.gameObject);
            AddFlexibleHeight(tokens.gameObject);

            var hud = panel.AddComponent<TrayHUD>();
            var so = new SerializedObject(hud);
            SetObjectField(so, "root", panel);
            SetObjectField(so, "billsLabel", bills);
            SetObjectField(so, "coinsLabel", coins);
            SetObjectField(so, "tokensLabel", tokens);
            so.ApplyModifiedProperties();

            created.Add($"panel {name}");
        }

        private static void AddFlexibleHeight(GameObject go)
        {
            var le = go.AddComponent<LayoutElement>();
            le.flexibleHeight = 1f;
        }

        // ---------- 3b. NextStationPanel ----------

        private static void BuildNextStationPanel(Transform canvas)
        {
            const string name = "NextStationPanel";
            if (canvas.Find(name) != null) { skipped.Add($"panel {name}"); return; }

            var panel = MakePanel(name, canvas, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), new Vector2(1f, 0.5f),
                new Vector2(220f, 60f), new Vector2(-20f, 0f));

            var btn = MakeButton("Btn", panel.transform, Vector2.zero, Vector2.one, new Vector2(0.5f, 0.5f),
                Vector2.zero, Vector2.zero, Vector2.zero);
            var label = MakeTMPLabel("Label", btn.transform, "Next →", 16f, TextAlignmentOptions.Center);
            var lrt = label.GetComponent<RectTransform>();
            lrt.anchorMin = Vector2.zero;
            lrt.anchorMax = Vector2.one;
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;

            var nsb = panel.AddComponent<NextStationButton>();
            var so = new SerializedObject(nsb);
            SetObjectField(so, "root", panel);
            SetObjectField(so, "label", label);
            SetObjectField(so, "button", btn.GetComponent<Button>());
            so.ApplyModifiedProperties();

            created.Add($"panel {name}");
        }

        // ---------- 3c. StationInteractionPanel ----------

        private static void BuildStationInteractionPanel(Transform canvas)
        {
            const string name = "StationInteractionPanel";
            if (canvas.Find(name) != null) { skipped.Add($"panel {name}"); return; }

            var panel = MakePanel(name, canvas, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
                new Vector2(320f, 80f), new Vector2(0f, 100f));

            var prompt = MakeTMPLabel("PromptLabel", panel.transform, "...", 16f, TextAlignmentOptions.Center);
            var prt = prompt.GetComponent<RectTransform>();
            prt.anchorMin = new Vector2(0f, 1f);
            prt.anchorMax = new Vector2(1f, 1f);
            prt.pivot = new Vector2(0.5f, 1f);
            prt.sizeDelta = new Vector2(0f, 40f);
            prt.anchoredPosition = new Vector2(0f, 0f);

            var sliderGO = new GameObject("ProgressBar", typeof(RectTransform));
            sliderGO.transform.SetParent(panel.transform, false);
            var srt = sliderGO.GetComponent<RectTransform>();
            srt.anchorMin = new Vector2(0f, 0f);
            srt.anchorMax = new Vector2(1f, 0f);
            srt.pivot = new Vector2(0.5f, 0f);
            srt.sizeDelta = new Vector2(-16f, 24f);
            srt.anchoredPosition = new Vector2(0f, 8f);

            var bg = sliderGO.AddComponent<Image>();
            bg.color = new Color(0.2f, 0.2f, 0.2f, 1f);

            var fillArea = new GameObject("Fill Area", typeof(RectTransform));
            fillArea.transform.SetParent(sliderGO.transform, false);
            var fart = fillArea.GetComponent<RectTransform>();
            fart.anchorMin = new Vector2(0f, 0.25f);
            fart.anchorMax = new Vector2(1f, 0.75f);
            fart.offsetMin = new Vector2(5f, 0f);
            fart.offsetMax = new Vector2(-5f, 0f);

            var fill = new GameObject("Fill", typeof(RectTransform));
            fill.transform.SetParent(fillArea.transform, false);
            var frt = fill.GetComponent<RectTransform>();
            frt.anchorMin = Vector2.zero;
            frt.anchorMax = Vector2.one;
            frt.offsetMin = Vector2.zero;
            frt.offsetMax = Vector2.zero;
            var fillImage = fill.AddComponent<Image>();
            fillImage.color = new Color(0.3f, 0.7f, 0.3f, 1f);

            var slider = sliderGO.AddComponent<Slider>();
            slider.fillRect = frt;
            slider.direction = Slider.Direction.LeftToRight;
            slider.minValue = 0f;
            slider.maxValue = 1f;
            slider.value = 0f;
            slider.transition = Selectable.Transition.None;

            var ui = panel.AddComponent<StationInteractionUI>();
            var so = new SerializedObject(ui);
            SetObjectField(so, "root", panel);
            SetObjectField(so, "promptLabel", prompt);
            SetObjectField(so, "progressBar", slider);
            so.ApplyModifiedProperties();

            created.Add($"panel {name}");
        }

        // ---------- 3d. OfficeTerminalPanel ----------

        private static void BuildOfficeTerminalPanel(Transform canvas)
        {
            const string name = "OfficeTerminalPanel";
            if (canvas.Find(name) != null) { skipped.Add($"panel {name}"); return; }

            var panel = MakePanel(name, canvas, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0.5f, 0.5f), new Vector2(480f, 360f), Vector2.zero);
            var bg = panel.GetComponent<Image>();
            bg.color = new Color(0.04f, 0.17f, 0.04f, 1f);

            var body = MakeTMPLabel("BodyLabel", panel.transform, "(receipt)", 16f, TextAlignmentOptions.TopLeft);
            var brt = body.GetComponent<RectTransform>();
            brt.anchorMin = Vector2.zero;
            brt.anchorMax = Vector2.one;
            brt.pivot = new Vector2(0.5f, 0.5f);
            brt.offsetMin = new Vector2(16f, 56f);
            brt.offsetMax = new Vector2(-16f, -16f);
            TryApplyMonoFont(body);

            var continueBtn = MakeButton("ContinueButton", panel.transform,
                new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
                new Vector2(160f, 40f), Vector2.zero, new Vector2(0f, 16f));
            var continueLabel = MakeTMPLabel("Label", continueBtn.transform, "Continue", 14f, TextAlignmentOptions.Center);
            var crt = continueLabel.GetComponent<RectTransform>();
            crt.anchorMin = Vector2.zero;
            crt.anchorMax = Vector2.one;
            crt.offsetMin = Vector2.zero;
            crt.offsetMax = Vector2.zero;

            var screen = panel.AddComponent<OfficeTerminalScreen>();
            var so = new SerializedObject(screen);
            SetObjectField(so, "root", panel);
            SetObjectField(so, "bodyLabel", body);
            SetObjectField(so, "continueButton", continueBtn.GetComponent<Button>());

            var terminal = FindOfficeChildComponent<OfficeTerminalStation>("Terminal");
            var counter = FindOfficeChildComponent<MoneyCounterStation>("MoneyCounter");
            var sifter = FindOfficeChildComponent<CoinSifterStation>("CoinSifter");
            var econ = FindManagersComponent<LotEconomy>();
            if (terminal != null) SetObjectField(so, "terminalStation", terminal); else warnings.Add("OfficeTerminalScreen: Office/Terminal OfficeTerminalStation not found.");
            if (counter != null) SetObjectField(so, "counterStation", counter); else warnings.Add("OfficeTerminalScreen: Office/MoneyCounter MoneyCounterStation not found.");
            if (sifter != null) SetObjectField(so, "sifterStation", sifter); else warnings.Add("OfficeTerminalScreen: Office/CoinSifter CoinSifterStation not found.");
            if (econ != null) SetObjectField(so, "economy", econ); else warnings.Add("OfficeTerminalScreen: _Managers LotEconomy not found.");
            so.ApplyModifiedProperties();

            created.Add($"panel {name}");
        }

        private static void TryApplyMonoFont(TMP_Text label)
        {
            var guids = AssetDatabase.FindAssets("LiberationMono t:TMP_FontAsset");
            if (guids == null || guids.Length == 0) return;
            var path = AssetDatabase.GUIDToAssetPath(guids[0]);
            var font = AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(path);
            if (font != null) label.font = font;
        }

        // ---------- 3e. WeeklyReviewPanel ----------

        private static void BuildWeeklyReviewPanel(Transform canvas)
        {
            const string name = "WeeklyReviewPanel";
            if (canvas.Find(name) != null) { skipped.Add($"panel {name}"); return; }

            var panel = MakePanel(name, canvas, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(0.5f, 0.5f), new Vector2(480f, 360f), Vector2.zero);

            var body = MakeTMPLabel("BodyLabel", panel.transform, "(weekly review)", 16f, TextAlignmentOptions.TopLeft);
            var brt = body.GetComponent<RectTransform>();
            brt.anchorMin = Vector2.zero;
            brt.anchorMax = Vector2.one;
            brt.pivot = new Vector2(0.5f, 0.5f);
            brt.offsetMin = new Vector2(16f, 56f);
            brt.offsetMax = new Vector2(-16f, -16f);

            var continueBtn = MakeButton("ContinueButton", panel.transform,
                new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
                new Vector2(160f, 40f), Vector2.zero, new Vector2(0f, 16f));
            var continueLabel = MakeTMPLabel("Label", continueBtn.transform, "Continue", 14f, TextAlignmentOptions.Center);
            var crt = continueLabel.GetComponent<RectTransform>();
            crt.anchorMin = Vector2.zero;
            crt.anchorMax = Vector2.one;
            crt.offsetMin = Vector2.zero;
            crt.offsetMax = Vector2.zero;

            var review = panel.AddComponent<WeeklyReviewController>();
            var so = new SerializedObject(review);
            SetObjectField(so, "root", panel);
            SetObjectField(so, "bodyLabel", body);
            SetObjectField(so, "continueButton", continueBtn.GetComponent<Button>());
            var econ = FindManagersComponent<LotEconomy>();
            if (econ != null) SetObjectField(so, "economy", econ); else warnings.Add("WeeklyReviewController: _Managers LotEconomy not found.");
            so.ApplyModifiedProperties();

            created.Add($"panel {name}");
        }

        // ---------- 3f. TaskPanel ----------

        private static void BuildTaskPanel(Transform canvas)
        {
            const string name = "TaskPanel";
            if (canvas.Find(name) != null) { skipped.Add($"panel {name}"); return; }

            var panel = MakePanel(name, canvas, new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(1f, 1f),
                new Vector2(240f, 200f), new Vector2(-20f, -20f));

            var listGO = new GameObject("ListRoot", typeof(RectTransform));
            listGO.transform.SetParent(panel.transform, false);
            var lrt = listGO.GetComponent<RectTransform>();
            lrt.anchorMin = Vector2.zero;
            lrt.anchorMax = Vector2.one;
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;

            var vlg = listGO.AddComponent<VerticalLayoutGroup>();
            vlg.childAlignment = TextAnchor.UpperLeft;
            vlg.padding = new RectOffset(8, 8, 8, 8);
            vlg.spacing = 4f;
            vlg.childControlWidth = true;
            vlg.childControlHeight = true;
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;

            var hud = panel.AddComponent<TaskPanelHUD>();
            var so = new SerializedObject(hud);
            SetObjectField(so, "listRoot", listGO.transform);
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(TaskRowPath);
            if (prefab != null) SetObjectField(so, "taskRowPrefab", prefab);
            else warnings.Add("TaskPanelHUD: TaskRow prefab not found.");
            so.ApplyModifiedProperties();

            created.Add($"panel {name}");
        }

        // ---------- 4. RitualController wiring ----------

        private static void WireRitualController()
        {
            var managers = GameObject.Find("_Managers");
            if (managers == null) { warnings.Add("RitualController: _Managers not found."); return; }
            var rc = managers.GetComponent<RitualController>();
            if (rc == null) { warnings.Add("RitualController: component missing on _Managers."); return; }

            var so = new SerializedObject(rc);

            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(PlayerNavAgentPath);
            if (prefab != null) { SetObjectField(so, "playerNavAgentPrefab", prefab); wired.Add("playerNavAgentPrefab"); }
            else warnings.Add("RitualController: PlayerNavAgent prefab not found.");

            var spawn = GameObject.Find("SpawnPoint");
            if (spawn == null)
            {
                var nav = GameObject.Find("_Navigation");
                if (nav != null) spawn = nav;
            }
            if (spawn != null) { SetObjectField(so, "ritualEntryPoint", spawn.transform); wired.Add("ritualEntryPoint"); }
            else warnings.Add("RitualController: no SpawnPoint or _Navigation transform found.");

            var stationsList = new List<CollectionStation>();
            var bayBin = FindComponentByPath<BayBinStation>("Bay_01");
            var changer = FindComponentByPath<ChangerStation>("Changer");
            var officeDoor = FindOfficeChildComponent<OfficeDoorStation>("OfficeDoorTrigger");
            var moneyCounter = FindOfficeChildComponent<MoneyCounterStation>("MoneyCounter");
            var coinSifter = FindOfficeChildComponent<CoinSifterStation>("CoinSifter");
            var terminal = FindOfficeChildComponent<OfficeTerminalStation>("Terminal");

            if (bayBin != null) stationsList.Add(bayBin); else warnings.Add("Station missing: Bay_01/BayBinStation.");
            if (changer != null) stationsList.Add(changer); else warnings.Add("Station missing: Changer/ChangerStation.");
            if (officeDoor != null) stationsList.Add(officeDoor); else warnings.Add("Station missing: Office/OfficeDoorTrigger/OfficeDoorStation.");
            if (moneyCounter != null) stationsList.Add(moneyCounter); else warnings.Add("Station missing: Office/MoneyCounter/MoneyCounterStation.");
            if (coinSifter != null) stationsList.Add(coinSifter); else warnings.Add("Station missing: Office/CoinSifter/CoinSifterStation.");
            if (terminal != null) stationsList.Add(terminal); else warnings.Add("Station missing: Office/Terminal/OfficeTerminalStation.");

            var stationsProp = so.FindProperty("stations");
            if (stationsProp != null)
            {
                stationsProp.arraySize = stationsList.Count;
                for (int i = 0; i < stationsList.Count; i++)
                {
                    stationsProp.GetArrayElementAtIndex(i).objectReferenceValue = stationsList[i];
                }
                wired.Add($"stations[{stationsList.Count}]");
            }

            var fpVCamGO = FindCameraChild("vcam_FP");
            var overheadGO = FindCameraChild("vcam_Overhead");
            if (fpVCamGO != null)
            {
                var fpCtrl = fpVCamGO.GetComponent<FPCameraController>();
                if (fpCtrl != null) { SetObjectField(so, "fpCamera", fpCtrl); wired.Add("fpCamera"); }
                else warnings.Add("RitualController: FPCameraController missing on vcam_FP.");
                var fpCM = fpVCamGO.GetComponent<CinemachineCamera>();
                if (fpCM != null) { SetObjectField(so, "fpVCam", fpCM); wired.Add("fpVCam"); }
                else warnings.Add("RitualController: CinemachineCamera missing on vcam_FP.");
            }
            else warnings.Add("RitualController: _Cameras/vcam_FP not found.");

            if (overheadGO != null)
            {
                var ohCM = overheadGO.GetComponent<CinemachineCamera>();
                if (ohCM != null) { SetObjectField(so, "overheadVCam", ohCM); wired.Add("overheadVCam"); }
                else warnings.Add("RitualController: CinemachineCamera missing on vcam_Overhead.");
            }
            else warnings.Add("RitualController: _Cameras/vcam_Overhead not found.");

            so.ApplyModifiedProperties();
        }

        private static GameObject FindCameraChild(string childName)
        {
            var root = GameObject.Find("_Cameras");
            if (root == null) return null;
            var t = root.transform.Find(childName);
            return t != null ? t.gameObject : null;
        }

        // ---------- 5. Bay_01 economy ----------

        private static void WireBayEconomy()
        {
            var bay = GameObject.Find("Bay_01");
            if (bay == null) return;
            var bc = bay.GetComponent<BayController>();
            if (bc == null) return;
            var managers = GameObject.Find("_Managers");
            if (managers == null) return;
            var econ = managers.GetComponent<LotEconomy>();
            if (econ == null) return;
            var so = new SerializedObject(bc);
            SetObjectField(so, "economy", econ);
            so.ApplyModifiedProperties();
            wired.Add("Bay_01.BayController.economy");
        }

        // ---------- helpers ----------

        private static GameObject MakePanel(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 pivot, Vector2 sizeDelta, Vector2 anchoredPosition)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = pivot;
            rt.sizeDelta = sizeDelta;
            rt.anchoredPosition = anchoredPosition;
            var img = go.AddComponent<Image>();
            img.color = new Color(0f, 0f, 0f, 0.6f);
            return go;
        }

        private static TMP_Text MakeTMPLabel(string name, Transform parent, string text, float fontSize, TextAlignmentOptions align)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.alignment = align;
            tmp.color = Color.white;
            return tmp;
        }

        private static GameObject MakeButton(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax,
            Vector2 pivot, Vector2 sizeDelta, Vector2 offsetMinExtra, Vector2 anchoredPosition)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = pivot;
            rt.sizeDelta = sizeDelta;
            rt.anchoredPosition = anchoredPosition;
            var img = go.AddComponent<Image>();
            img.color = new Color(0.85f, 0.85f, 0.85f, 1f);
            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;
            return go;
        }

        private static T FindComponentByPath<T>(string objectName) where T : Component
        {
            var go = GameObject.Find(objectName);
            return go != null ? go.GetComponent<T>() : null;
        }

        private static T FindOfficeChildComponent<T>(string childName) where T : Component
        {
            var office = GameObject.Find("Office");
            if (office == null) return null;
            var c = office.transform.Find(childName);
            return c != null ? c.GetComponent<T>() : null;
        }

        private static T FindManagersComponent<T>() where T : Component
        {
            var m = GameObject.Find("_Managers");
            return m != null ? m.GetComponent<T>() : null;
        }

        private static void SetObjectField(SerializedObject so, string fieldName, Object value)
        {
            var prop = so.FindProperty(fieldName);
            if (prop == null) { warnings.Add($"Field '{fieldName}' not found on {so.targetObject.GetType().Name}."); return; }
            prop.objectReferenceValue = value;
        }

        private static void LogSummary()
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("RitualUIBuilder complete.");
            sb.AppendLine($"Created ({created.Count}):");
            foreach (var c in created) sb.AppendLine($"  + {c}");
            sb.AppendLine($"Skipped ({skipped.Count}):");
            foreach (var s in skipped) sb.AppendLine($"  = {s}");
            sb.AppendLine($"Wired RitualController/Bay fields ({wired.Count}):");
            foreach (var w in wired) sb.AppendLine($"  * {w}");
            if (warnings.Count > 0)
            {
                sb.AppendLine($"Warnings ({warnings.Count}):");
                foreach (var w in warnings) sb.AppendLine($"  ! {w}");
            }
            sb.AppendLine();
            sb.AppendLine("Remaining manual steps:");
            sb.AppendLine("  1. Re-bake NavMesh: select _Navigation → NavMeshSurface → Bake");
            sb.AppendLine("  2. Save scene (Ctrl+S)");

            if (warnings.Count > 0) Debug.LogWarning(sb.ToString());
            else Debug.Log(sb.ToString());
        }
    }
}
