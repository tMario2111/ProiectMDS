using backend;
using MessagePack;
using MessagePack.Resolvers;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<GameStateService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder =>
        {
            builder.WithOrigins("http://localhost:5173") // Allow your React app's origin
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});


builder.Services.AddSignalR(options => { options.EnableDetailedErrors = true; }).AddJsonProtocol();

var app = builder.Build();

app.UseCors("AllowSpecificOrigin");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapPost("/api/create-game", (CreateGameRequest request) =>
{
    var gameStateService = app.Services.GetRequiredService<GameStateService>();

    if (string.IsNullOrEmpty(request.Username))
    {
        return Results.BadRequest("User name is required");
    }

    if (!gameStateService.UsernameConnection.ContainsKey(request.Username))
    {
        return Results.BadRequest("User must register via the hub first");
    }

    var gameId = Game.GenerateGameCode();

    gameStateService.Games[gameId] = new Game
    {
        Code = gameId,
        WhiteUsername = request.Username,
        BlackUsername = null,
        GameStarted = false,
    };

    var response = new CreateGameResponse
    {
        GameId = gameId
    };

    return Results.Ok(response);
});

app.MapPost("api/join-game", async (JoinGameRequest request, IHubContext<GameHub> hubContext) =>
{
    var gameStateService = app.Services.GetRequiredService<GameStateService>();

    if (string.IsNullOrEmpty(request.Username))
        return Results.BadRequest("Username is required");

    if (!gameStateService.Games.ContainsKey(request.GameId))
        return Results.NotFound("Game does not exist");

    var game = gameStateService.Games[request.GameId];

    if (game.WhiteUsername is not null && game.BlackUsername is not null ||
        game.GameStarted)
    {
        return Results.Conflict("Game is already started");
    }

    // Hardcoded for black
    gameStateService.Games[request.GameId].BlackUsername = request.Username;
    gameStateService.Games[request.GameId].GameStarted = true;

    if (gameStateService.UsernameConnection.TryGetValue(game.WhiteUsername!, out var whiteConnId) &&
        gameStateService.UsernameConnection.TryGetValue(game.BlackUsername!, out var blackConnId))
    {
        await hubContext.Groups.AddToGroupAsync(whiteConnId, game.Code!);
        await hubContext.Groups.AddToGroupAsync(blackConnId, game.Code!);

        await hubContext.Clients.Group(game.Code!).SendAsync("GameStart");
    }
    else
    {
        return Results.BadRequest("Internal error (oops)");
    }

    return Results.Ok();
});

app.UseHttpsRedirection();

app.MapHub<GameHub>("/gameHub");

app.Run();