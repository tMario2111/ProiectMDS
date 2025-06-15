// using System.Collections.Concurrent;
//
// namespace backend;
//
// public class GameStateService
// {
//     public ConcurrentDictionary<string, string> UsernameConnection { get; } = new();
//     public ConcurrentDictionary<string, string> ConnectionUsername { get; } = new();
//     public ConcurrentDictionary<string, Game> Games { get; } = new();
//
//     public void AddUser(string username, string connectionId)
//     {
//         UsernameConnection.AddOrUpdate(username, connectionId, (_, _) => connectionId);
//         ConnectionUsername.AddOrUpdate(connectionId, username, (_, _) => username);
//     }
//
//     public void RemoveUser(string connectionId)
//     {
//         if (ConnectionUsername.TryRemove(connectionId, out var username))
//         {
//             UsernameConnection.TryRemove(username, out _);
//         }
//     }
// }
using System.Collections.Concurrent;

namespace backend;

public class GameStateService
{
    public ConcurrentDictionary<string, string> UsernameConnection { get; } = new();
    public ConcurrentDictionary<string, string> ConnectionUsername { get; } = new();
    public ConcurrentDictionary<string, Game> Games { get; } = new();

    public void AddUser(string username, string connectionId)
    {
        UsernameConnection.AddOrUpdate(username, connectionId, (_,_ ) => connectionId);
        ConnectionUsername.AddOrUpdate(connectionId, username, (_,_ ) => username);
    }

    public void RemoveUser(string connectionId)
    {
        if (ConnectionUsername.TryRemove(connectionId, out var username))
        {
            UsernameConnection.TryRemove(username, out _);
        }
    }
}
