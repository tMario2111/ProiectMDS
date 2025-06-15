using backend;
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
            builder.WithOrigins("http://localhost:5173")
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

    var perks = new PlayerPerks
    {
        LayoutPerk = request.LayoutPerk,
        TimeOnCheck = request.TimeOnCheck
    };

    gameStateService.Games[gameId] = new Game
    {
        Code = gameId,
        WhiteUsername = request.Username,
        BlackUsername = null,
        GameStarted = false,
        Perks = new Dictionary<string, PlayerPerks>
        {
            [request.Username] = perks
        }
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
        return Results.Conflict("Game is already started");

    gameStateService.Games[request.GameId].BlackUsername = request.Username;
    gameStateService.Games[request.GameId].GameStarted = true;

    game.Perks[request.Username] = new PlayerPerks
    {
        LayoutPerk = request.LayoutPerk,
        TimeOnCheck = request.TimeOnCheck
    };

    return Results.Ok();
});

app.MapGet("api/get-game", (string? gameCode) =>
{
    var gameStateService = app.Services.GetRequiredService<GameStateService>();

    if (gameCode is null)
        return Results.BadRequest("Game code is null");
    if (!gameStateService.Games.TryGetValue(gameCode, out var game))
        return Results.NotFound("Game does not exist");

    var response = new GetGameResponse
    {
        WhiteUsername = game.WhiteUsername,
        BlackUsername = game.BlackUsername,
    };

    return Results.Ok(response);
});


app.UseHttpsRedirection();

app.MapHub<GameHub>("/gameHub");

app.Run();