using System;

namespace WashEmpire
{
    [Serializable]
    public class Task
    {
        public string Id;
        public string Label;
        public bool IsComplete;
        public Action OnTrigger;
    }
}
