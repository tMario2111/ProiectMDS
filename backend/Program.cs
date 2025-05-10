using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<GameStateService>();

builder.Configuration.AddJsonFile("secret.json");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "ChessV2",
            ValidateAudience = true,
            ValidAudience = "ChessV2Clients",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

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


builder.Services
    .AddSignalR(options => { options.EnableDetailedErrors = true; })
    .AddJsonProtocol();

var app = builder.Build();

app.UseCors("AllowSpecificOrigin");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/api/token", (IConfiguration config) =>
{
    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        new Claim("clientType", "chessClient")
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: "ChessV2",
        audience: "ChessV2Clients",
        claims: claims,
        expires: DateTime.UtcNow.AddHours(2),
        signingCredentials: creds
    );

    return Results.Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
}).AllowAnonymous();

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
}).RequireAuthorization();

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

    // Hardcoded for black
    gameStateService.Games[request.GameId].BlackUsername = request.Username;
    gameStateService.Games[request.GameId].GameStarted = true;

    return Results.Ok();
}).RequireAuthorization();

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
}).RequireAuthorization();

app.UseHttpsRedirection();

app.MapHub<GameHub>("/gameHub").RequireAuthorization();

app.Run();