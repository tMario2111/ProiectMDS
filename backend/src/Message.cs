namespace backend;

public class RegisterMessage
{
    public string Username { get; set; }
}

public class RegisterSuccessfulMessage
{
}

public class MakeMoveMessage
{
    public string? GameCode { get; set; }
    public string? SourceSquare { get; set; }
    public string? DestinationSquare { get; set; }
}

public class GetMoveMessage
{
    public string? Color { get; set; }
    public string? SourceSquare { get; set; }
    public string? DestinationSquare { get; set; }
}