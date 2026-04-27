using System;
using System.Collections.Generic;

namespace WashEmpire
{
    [Serializable]
    public class SaveData
    {
        public int version = 2;
        public int deposited_cash;
        public int current_day_index;
        public List<LotData> lots = new();
        public List<TaskData> active_tasks = new();
        public RitualStateData ritual_state;
    }

    [Serializable]
    public class LotData
    {
        public string id;
        public List<BayData> bays = new();
        public ChangerData changer;
    }

    [Serializable]
    public class BayData
    {
        public string id;
        public int cash_in_bin;
        public bool has_card_reader;
        public int lifetime_revenue;
        public int lifetime_slippage;
    }

    [Serializable]
    public class ChangerData
    {
        public int bill_stacker;
    }

    [Serializable]
    public class TaskData
    {
        public string id;
        public string type;
    }

    [Serializable]
    public class RitualStateData
    {
        public int current_station_index;
        public int tray_bills;
        public int tray_coins;
        public int tray_tokens;
    }
}
