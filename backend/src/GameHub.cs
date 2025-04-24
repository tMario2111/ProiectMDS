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

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _gameState.RemoveUser(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}