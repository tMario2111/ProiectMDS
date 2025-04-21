using backend;
using MessagePack;
using MessagePack.Resolvers;

var builder = WebApplication.CreateBuilder(args);

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
    if (string.IsNullOrEmpty(request.Username))
    {
        return Results.BadRequest("User name is required");
    }

    var gameId = Game.GenerateGameCode();

    GameHub.Games[gameId] = new Game
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

app.MapPost("api/join-game", (JoinGameRequest request) =>
{
    if (string.IsNullOrEmpty(request.Username))
        return Results.BadRequest("User name is required");

    if (!GameHub.Games.ContainsKey(request.GameId))
        return Results.NotFound();

    var game = GameHub.Games[request.GameId];

    if (game.WhiteUsername is not null && game.BlackUsername is not null ||
        game.GameStarted)
    {
        return Results.Conflict();
    }

    // Hardcoded for black
    GameHub.Games[request.GameId].BlackUsername = request.Username;
    GameHub.Games[request.GameId].GameStarted = true;
    
    

    return Results.Ok();
});

app.UseHttpsRedirection();

app.MapHub<GameHub>("/gameHub");

app.Run();