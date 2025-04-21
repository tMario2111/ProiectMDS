namespace backend;

public class Game
{
    public string? Code;
    
    public string? WhiteUsername;
    public string? BlackUsername;

    public bool GameStarted = false;

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