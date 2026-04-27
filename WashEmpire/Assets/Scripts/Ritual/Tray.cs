using System;

namespace WashEmpire
{
    [Serializable]
    public class Tray
    {
        public int Bills { get; private set; }
        public int Coins { get; private set; }
        public int Tokens { get; private set; }

        public int Total => Bills + Coins + Tokens;

        public event Action OnChanged;

        public void AddBills(int amount) { Bills += amount; OnChanged?.Invoke(); }
        public void AddCoins(int amount) { Coins += amount; OnChanged?.Invoke(); }
        public void AddTokens(int amount) { Tokens += amount; OnChanged?.Invoke(); }

        public int DrainBills() { int v = Bills; Bills = 0; OnChanged?.Invoke(); return v; }
        public int DrainCoins() { int v = Coins; Coins = 0; OnChanged?.Invoke(); return v; }
        public int DrainTokens() { int v = Tokens; Tokens = 0; OnChanged?.Invoke(); return v; }

        public void Clear() { Bills = 0; Coins = 0; Tokens = 0; OnChanged?.Invoke(); }
    }
}
