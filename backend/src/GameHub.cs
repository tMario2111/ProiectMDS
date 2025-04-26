using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.SignalR;

namespace backend;

public class GameHub : Hub
{
    private readonly GameStateService _gameState;

    public GameHub(GameStateService gameState)
    {
        _gameState = gameState;
    }

    public async Task RegisterUser(RegisterMessage message)
    {
        var username = message.Username;

        if (_gameState.UsernameConnection.ContainsKey(username))
        {
            if (_gameState.UsernameConnection[username] != Context.ConnectionId)
            {
                await Clients.Caller.SendAsync("Error", "Username already exists");
                return;
            }
        }

        _gameState.AddUser(username, Context.ConnectionId);
        await Clients.Caller.SendAsync("RegisterSuccessful", new RegisterSuccessfulMessage());
    }

    // TODO: Maybe solve the double "GameStart" message
    public async Task JoinGameGroup(string gameId)
    {
        if (!_gameState.ConnectionUsername.TryGetValue(Context.ConnectionId, out var username))
        {
            await Clients.Caller.SendAsync("Error", "Register first");
            return;
        }

        if (!_gameState.Games.TryGetValue(gameId, out var game) ||
            (game.WhiteUsername != username && game.BlackUsername != username))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game or player");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

        // TODO: Would be really great to have some logs
        Console.WriteLine(Context.ConnectionId + " joined the group " + gameId);

        if (username == game.WhiteUsername)
            game.WhiteReady = true;
        else if (username == game.BlackUsername)
            game.BlackReady = true;

        if (game.WhiteReady && game.BlackReady)
        {
            await Clients.Group(gameId).SendAsync("GameStart");
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _gameState.RemoveUser(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}