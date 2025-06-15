using System.Diagnostics;
using Chess;
using System.Collections.Generic;

namespace backend;

public class PlayerPerks
{
    public string LayoutPerk { get; set; } = ""; // "3bishops" sau "3knights"
    public bool TimeOnCheck { get; set; } = false;
}

public class Game
{
    public string? Code;

    public string? WhiteUsername;
    public string? BlackUsername;

    public bool WhiteReady = false;
    public bool BlackReady = false;

    public bool GameStarted = false;

    public ChessBoard Board = new ChessBoard();

    public TimeSpan TimeControl = TimeSpan.FromSeconds(180);

    public Stopwatch? WhiteClock;
    public Stopwatch? BlackClock;

    // Perks pentru fiecare player 
    public Dictionary<string, PlayerPerks> Perks = new();

    public static string GenerateGameCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        string code = "";
        for (int i = 0; i < 8; ++i)
            code += chars[random.Next(chars.Length)];

        return code;
    }
}