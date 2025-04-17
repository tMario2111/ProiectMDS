using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace backend;

public class GameHub : Hub
{
    private static readonly ConcurrentDictionary<string, string> UsernameConnection = new();
    private static readonly ConcurrentDictionary<string, string> ConnectionUsername = new();

    public async Task RegisterUser(RegisterMessage message)
    {
        var username = message.Username;

        UsernameConnection.AddOrUpdate(username, Context.ConnectionId, (key, oldValue) => Context.ConnectionId);
        ConnectionUsername.AddOrUpdate(Context.ConnectionId, username, (key, oldValue) => username);
        
        await Clients.Caller.SendAsync("RegisterSuccessful", new RegisterSuccessful());
    }
}