using System.Collections.Concurrent;
using System.Diagnostics;
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

        Console.WriteLine(Context.ConnectionId + " joined the group " + gameId);

        if (username == game.WhiteUsername)
            game.WhiteReady = true;
        else if (username == game.BlackUsername)
            game.BlackReady = true;

        if (game.WhiteReady && game.BlackReady)
        {
            string whiteFenRow = "RNBQKBNR"; // default
            string blackFenRow = "rnbqkbnr"; // default

            if (game.Perks[game.WhiteUsername].LayoutPerk == "3knights") 
                whiteFenRow = "RNNQKBNR";
            else if (game.Perks[game.WhiteUsername].LayoutPerk == "3bishops")
                whiteFenRow = "RBBQKNBR"; 

            if (game.Perks[game.BlackUsername].LayoutPerk == "3knights") 
                blackFenRow = "rnnqkbnr";
            else if (game.Perks[game.BlackUsername].LayoutPerk == "3bishops")
                blackFenRow = "rbbqknbr";

            string fen = $"{blackFenRow}/pppppppp/8/8/8/8/PPPPPPPP/{whiteFenRow} w KQkq - 0 1";
            game.Board = ChessBoard.LoadFromFen(fen);

            await Clients.Group(gameId).SendAsync("GameStart", new { fen = game.Board.ToFen() });

            game.WhiteClock = new Stopwatch();
            game.WhiteClock.Start();

            game.BlackClock = new Stopwatch();
        }
    }
    
    public async Task JoinAsSpectator(string gameId)
    {
        if (!_gameState.Games.TryGetValue(gameId, out var game))
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

        // Send current state (fen, clocks, usernames)
        var fen = game.Board.ToFen();
        var whiteTime = game.WhiteClock != null ? (long)(game.TimeControl - game.WhiteClock.Elapsed).TotalMilliseconds : (long)game.TimeControl.TotalMilliseconds;
        var blackTime = game.BlackClock != null ? (long)(game.TimeControl - game.BlackClock.Elapsed).TotalMilliseconds : (long)game.TimeControl.TotalMilliseconds;

        await Clients.Caller.SendAsync("SpectatorSync", new
        {
            fen,
            whiteTime,
            blackTime,
            whiteUsername = game.WhiteUsername,
            blackUsername = game.BlackUsername
        });
    }
    public async Task SendChatMessage(string gameId, string sender, string message)
    {
        await Clients.Group(gameId).SendAsync("ReceiveChatMessage", new {
            sender, message, timestamp = DateTime.UtcNow
        });
    }

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
            if (move.Promotion is null)
                game.Board.Move(new Move(move.SourceSquare, move.DestinationSquare));
            else
            {
                game.Board.Move(move.SourceSquare[0] != move.DestinationSquare[0]
                    ? $"P{move.SourceSquare}x{move.DestinationSquare}={move.Promotion}"
                    : $"P{move.DestinationSquare}={move.Promotion}");
            }
        }
        catch (ChessInvalidMoveException exception)
        {
            await Clients.Caller.SendAsync("Error", exception.Message);
            return;
        }

        TimeSpan time;

        if (color == "white")
        {
            game.WhiteClock!.Stop();
            time = game.TimeControl - game.WhiteClock.Elapsed;
            game.BlackClock!.Start();
        }
        else
        {
            game.BlackClock!.Stop();
            time = game.TimeControl - game.BlackClock.Elapsed;
            game.WhiteClock!.Start();
        }

        bool isOpponentInCheck = game.Board.BlackKingChecked || game.Board.WhiteKingChecked;
        if (isOpponentInCheck)
        {
            if (color == "white" && game.Perks.ContainsKey(game.WhiteUsername) &&
                game.Perks[game.WhiteUsername].TimeOnCheck)
                time += TimeSpan.FromSeconds(15);
            else if (color == "black" && game.Perks.ContainsKey(game.BlackUsername) &&
                     game.Perks[game.BlackUsername].TimeOnCheck)
                time += TimeSpan.FromSeconds(15);
        }

        var response = new GetMoveMessage()
        {
            Color = color,
            SourceSquare = move.SourceSquare,
            DestinationSquare = move.DestinationSquare,
            Promotion = move.Promotion,
            Time = (long)time.TotalMilliseconds,
        };

        await Clients.Group(move.GameCode).SendAsync("GetMove", response);

        // check whether we have a game ending situation
        var isGameOver = game.Board.IsEndGame;

        if (isGameOver)
        {
            var endGame = game.Board.EndGame;
            var endType = endGame!.EndgameType.ToString();
            var winner = endGame.WonSide.ToString(); 
            Console.WriteLine($"{endType} {endGame.WonSide} {winner}");
            await Clients.Group(move.GameCode).SendAsync("GameOver", new
            {
                winner,
                endType,
                whiteUsername = game.WhiteUsername,
                blackUsername = game.BlackUsername
            });

        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _gameState.RemoveUser(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}