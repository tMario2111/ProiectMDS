// namespace backend;
//
// public class RegisterMessage
// {
//     public string Username { get; set; }
// }
//
// public class RegisterSuccessfulMessage
// {
// }
//
// public class MakeMoveMessage
// {
//     public string? GameCode { get; set; }
//     public string? SourceSquare { get; set; }
//     public string? DestinationSquare { get; set; }
//     public string? Promotion { get; set; }
// }
//
// public class GetMoveMessage
// {
//     public string? Color { get; set; }
//     public string? SourceSquare { get; set; }
//     public string? DestinationSquare { get; set; }
//     public string? Promotion { get; set; }
//     public long? Time { get; set; }
// }
namespace backend;

using System.Collections.Generic;

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
    public string? Promotion { get; set; }
    // public bool UsePawnPower { get; set; } = false;
    // public bool UseExtraMove { get; set; } = false;
    // public string? SecondSourceSquare { get; set; }
    // public string? SecondDestinationSquare { get; set; }
}

public class GetMoveMessage
{
    public string? Color { get; set; }
    public string? SourceSquare { get; set; }
    public string? DestinationSquare { get; set; }
    public string? Promotion { get; set; }
    public long? Time { get; set; }
    // public bool ExtraMove { get; set; } = false;
}
