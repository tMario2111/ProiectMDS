using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.SignalR;

namespace backend;

public class GameHub : Hub
{
    private static readonly ConcurrentDictionary<string, string> UsernameConnection = new();
    private static readonly ConcurrentDictionary<string, string> ConnectionUsername = new();

    public static readonly Dictionary<string, Game> Games = new();

    public async Task RegisterUser(RegisterMessage message)
    {
        var username = message.Username;

        // TODO: Check if username already exists
        UsernameConnection.AddOrUpdate(username, Context.ConnectionId, (key, oldValue) => Context.ConnectionId);
        ConnectionUsername.AddOrUpdate(Context.ConnectionId, username, (key, oldValue) => username);

        await Clients.Caller.SendAsync("RegisterSuccessful", new RegisterSuccessfulMessage());
    }

    public async Task NotifyGameStart(Game game)
    {
        await Groups.AddToGroupAsync(UsernameConnection[game.WhiteUsername!], game.Code!);
        await Groups.AddToGroupAsync(UsernameConnection[game.BlackUsername!], game.Code!);

        await Clients.Group(game.Code!).SendAsync("GameStart");
    }
}