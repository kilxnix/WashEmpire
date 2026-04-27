using Unity.AI.Navigation;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace WashEmpire.EditorTools
{
    public static class OfficeGeometryBuilder
    {
        private const int AreaWalkable = 0;
        private const int AreaNotWalkable = 1;

        [MenuItem("Wash Empire/Build Office Geometry")]
        public static void Build()
        {
            var existing = GameObject.Find("Office");
            if (existing != null)
            {
                bool rebuild = EditorUtility.DisplayDialog(
                    "Office already exists",
                    "Office already exists. Delete and rebuild?",
                    "OK",
                    "Cancel");
                if (!rebuild)
                {
                    Debug.Log("OfficeGeometryBuilder: aborted by user.");
                    return;
                }
                Object.DestroyImmediate(existing);
            }

            var officeRoot = new GameObject("Office");
            officeRoot.transform.position = new Vector3(8f, 0f, 4f);

            BuildWalls(officeRoot.transform);
            BuildFloor(officeRoot.transform);
            BuildStations(officeRoot.transform);
            BuildDoorTrigger(officeRoot.transform);
            WireChanger();

            Selection.activeGameObject = officeRoot;
            EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
            Debug.Log("Office geometry built. Re-bake NavMesh (_Navigation → NavMeshSurface → Bake) to update walkability.");
        }

        private static void BuildWalls(Transform parent)
        {
            var north = MakeCube("Wall_North", parent, new Vector3(0f, 1.5f, 3f), new Vector3(6f, 3f, 0.2f));
            var east = MakeCube("Wall_East", parent, new Vector3(3f, 1.5f, 0f), new Vector3(0.2f, 3f, 6f));
            var west = MakeCube("Wall_West", parent, new Vector3(-3f, 1.5f, 0f), new Vector3(0.2f, 3f, 6f));
            var southLeft = MakeCube("Wall_South_Left", parent, new Vector3(-1.8f, 1.5f, -3f), new Vector3(2.4f, 3f, 0.2f));
            var southRight = MakeCube("Wall_South_Right", parent, new Vector3(1.8f, 1.5f, -3f), new Vector3(2.4f, 3f, 0.2f));

            AddNavBlocker(north);
            AddNavBlocker(east);
            AddNavBlocker(west);
            AddNavBlocker(southLeft);
            AddNavBlocker(southRight);
        }

        private static void BuildFloor(Transform parent)
        {
            var floor = MakeCube("Floor", parent, new Vector3(0f, 0.025f, 0f), new Vector3(6f, 0.05f, 6f));
            var mod = floor.AddComponent<NavMeshModifier>();
            mod.overrideArea = true;
            mod.area = AreaWalkable;
        }

        private static void BuildStations(Transform parent)
        {
            var desk = MakeCube("Desk", parent, new Vector3(0f, 0.4f, 1f), new Vector3(2f, 0.8f, 1f));
            MakeEmpty("OfficeDeskAnchor", desk.transform, Vector3.zero);

            var moneyCounter = MakeCube("MoneyCounter", parent, new Vector3(-1.5f, 0.95f, 1f), new Vector3(0.6f, 0.4f, 0.4f));
            MakeEmpty("MoneyCounterAnchor", moneyCounter.transform, new Vector3(0f, 0.6f, -0.6f));

            var coinSifter = MakeCube("CoinSifter", parent, new Vector3(1.5f, 1.1f, 1f), new Vector3(0.8f, 0.5f, 0.5f));
            MakeEmpty("CoinSifterAnchor", coinSifter.transform, new Vector3(0f, 0.6f, -0.6f));

            var terminal = MakeCube("Terminal", parent, new Vector3(0f, 1.0f, 1f), new Vector3(0.4f, 0.6f, 0.3f));
            MakeEmpty("TerminalAnchor", terminal.transform, new Vector3(0f, 0f, -0.5f));
        }

        private static void BuildDoorTrigger(Transform parent)
        {
            var trigger = MakeEmpty("OfficeDoorTrigger", parent, new Vector3(0f, 1f, -3f));
            var box = trigger.AddComponent<BoxCollider>();
            box.isTrigger = true;
            box.size = new Vector3(1.2f, 2f, 0.5f);
        }

        private static void WireChanger()
        {
            var changer = GameObject.Find("Changer");
            if (changer == null)
            {
                Debug.LogWarning("OfficeGeometryBuilder: 'Changer' GameObject not found in scene. Per Plan Task 7, create one at (-3, 0, 0). Skipping changer visual/anchor.");
                return;
            }

            if (changer.transform.Find("ChangerVisual") == null)
            {
                var visual = MakeCube("ChangerVisual", changer.transform, new Vector3(0f, 0.75f, 0f), new Vector3(0.6f, 1.5f, 0.4f));
                Object.DestroyImmediate(visual.GetComponent<BoxCollider>());
            }

            if (changer.transform.Find("ChangerAnchor") == null)
            {
                MakeEmpty("ChangerAnchor", changer.transform, new Vector3(0f, 1.2f, -0.5f));
            }
        }

        private static GameObject MakeCube(string name, Transform parent, Vector3 localPos, Vector3 localScale)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            go.transform.localScale = localScale;
            go.transform.localRotation = Quaternion.identity;
            return go;
        }

        private static GameObject MakeEmpty(string name, Transform parent, Vector3 localPos)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            go.transform.localRotation = Quaternion.identity;
            go.transform.localScale = Vector3.one;
            return go;
        }

        private static void AddNavBlocker(GameObject go)
        {
            var mod = go.AddComponent<NavMeshModifier>();
            mod.overrideArea = true;
            mod.area = AreaNotWalkable;
        }
    }
}
