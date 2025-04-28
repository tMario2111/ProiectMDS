namespace backend;

using Chess;

public class Game
{
    public string? Code;

    public string? WhiteUsername;
    public string? BlackUsername;

    public bool WhiteReady = false;
    public bool BlackReady = false;

    public bool GameStarted = false;

    public ChessBoard Board = new ChessBoard();

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