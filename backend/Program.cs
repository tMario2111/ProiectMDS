using backend;

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
                .AllowAnyHeader();
        });
});

var app = builder.Build();

app.UseCors("AllowSpecificOrigin");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var games = new Dictionary<string, Game>();

app.MapPost("/api/create-game", (CreateGameRequest request) =>
{
    if (string.IsNullOrEmpty(request.Username))
    {
        return Results.BadRequest("User name is required");
    }

    var gameId = Game.GenerateGameCode();

    games[gameId] = new Game
    {
        WhiteUsername = request.Username,
        BlackUsername = null
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
    {
        return Results.BadRequest("User name is required");
    }

    if (!games.ContainsKey(request.GameId))
        return Results.NotFound();

    return Results.Ok();
});

app.UseHttpsRedirection();

app.Run();