public class CreateGameRequest
{
    public string Username { get; set; }
};

public class CreateGameResponse
{
    public string GameId { get; set; }
};

public class JoinGameRequest
{
    public string Username { get; set; }
    public string GameId { get; set; }
};

public class GetGameResponse
{
    public string? WhiteUsername { get; set; }
    public string? BlackUsername { get; set; }
}