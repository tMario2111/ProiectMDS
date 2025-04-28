using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Chess;
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

    // TODO: This needs server-side validation
    public async Task MakeMove(MakeMoveMessage move)
    {
        if (!_gameState.ConnectionUsername.TryGetValue(Context.ConnectionId, out var username))
        {
            await Clients.Caller.SendAsync("Error", "Register first");
            return;
        }

        if (move.GameCode is null)
        {
            await Clients.Caller.SendAsync("Error", "Game code is null");
            return;
        }

        if (!_gameState.Games.TryGetValue(move.GameCode, out var game))
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        if (game.WhiteUsername != username && game.BlackUsername != username)
        {
            await Clients.Caller.SendAsync("Error", "Can't make a move in a game you are not part of");
            return;
        }

        var color = game.WhiteUsername == username ? "white" : "black";

        if (game.Board.Turn == PieceColor.White && color != "white" ||
            game.Board.Turn == PieceColor.Black && color != "black")
        {
            await Clients.Caller.SendAsync("Error", "Can't make a move if it's not your turn");
            return;
        }

        if (move.SourceSquare == null || move.DestinationSquare == null)
        {
            await Clients.Caller.SendAsync("Error", "Move is null");
            return;
        }

        try
        {
            game.Board.Move(new Move(move.SourceSquare, move.DestinationSquare));
        }
        catch (ChessInvalidMoveException exception)
        {
            await Clients.Caller.SendAsync("Error", exception.Message);
            return;
        }

        var response = new GetMoveMessage()
        {
            Color = color,
            SourceSquare = move.SourceSquare,
            DestinationSquare = move.DestinationSquare,
        };

        await Clients.Group(move.GameCode).SendAsync("GetMove", response);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _gameState.RemoveUser(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}