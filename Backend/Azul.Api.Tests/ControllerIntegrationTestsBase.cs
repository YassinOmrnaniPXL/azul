using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using Azul.Api.Controllers;
using Azul.Api.Models.Input;
using Azul.Api.Models.Output;
using Azul.Api.Tests.Util;
using Azul.Api.Util;
using Azul.Core.TableAggregate;
using Azul.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Azul.Api.Tests;

public abstract class ControllerIntegrationTestsBase<TController> where TController : ApiControllerBase
{
    protected HttpClient ClientA = null!;
    protected HttpClient ClientB = null!;
    protected JsonSerializerOptions JsonSerializerOptions = null!;
    protected AccessPassModel PlayerAAccessPass = null!;
    protected AccessPassModel PlayerBAccessPass = null!;

    [OneTimeSetUp]
    public void BeforeAllTests()
    {
        JsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        JsonSerializerOptions.Converters.Add(new TwoDimensionalArrayJsonConverter<TileSpotModel>());

        var factory = new TestWebApplicationFactory(services =>
        {
            // Remove the existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AzulDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Build configuration to read from testsettings.json and environment variables
            var configuration = new ConfigurationBuilder()
                .AddJsonFile("testsettings.json", optional: false)
                .AddEnvironmentVariables()
                .Build();

            // Replace the database with test database
            services.AddDbContext<AzulDbContext>(options =>
            {
                string connectionString = configuration.GetConnectionString("TestDatabase")!;
                options.UseSqlServer(connectionString).EnableSensitiveDataLogging(true);
            });

            // Make sure the test database is deleted before each test run
            var serviceProvider = services.BuildServiceProvider();
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AzulDbContext>();
            dbContext.Database.EnsureDeleted();
        });
        ClientA = factory.CreateClient();
        ClientB = factory.CreateClient();

        // Make usernames unique per test class to avoid conflicts
        string testClassName = typeof(TController).Name;
        PlayerAAccessPass = RegisterAndLoginUser(ClientA, $"PlayerA_{testClassName}", null);
        PlayerBAccessPass = RegisterAndLoginUser(ClientB, $"PlayerB_{testClassName}", new DateOnly(2000, 3, 15));
    }

    [OneTimeTearDown]
    public void AfterAllTests()
    {
        ClientA.Dispose();
        ClientB.Dispose();
    }

    private AccessPassModel RegisterAndLoginUser(HttpClient client, string userName, DateOnly? lastVisitToPortugal)
    {
        var registerModel = new RegisterModel
        {
            UserName = userName,
            Email = $"{userName}@test.be",
            Password = "password123",
            LastVisitToPortugal = lastVisitToPortugal
        };
        
        // Register user and check if it succeeded
        var registerResponse = client.PostAsJsonAsync("api/authentication/register", registerModel).Result;
        if (!registerResponse.IsSuccessStatusCode)
        {
            var registerError = registerResponse.Content.ReadAsStringAsync().Result;
            throw new Exception($"Registration failed for {userName}: {registerResponse.StatusCode} - {registerError}");
        }
        
        // Login and get token
        HttpResponseMessage response = client.PostAsJsonAsync("api/authentication/token", new LoginModel
        {
            Email = registerModel.Email,
            Password = registerModel.Password
        }).Result!;
        
        if (!response.IsSuccessStatusCode)
        {
            var loginError = response.Content.ReadAsStringAsync().Result;
            throw new Exception($"Login failed for {userName}: {response.StatusCode} - {loginError}");
        }

        AccessPassModel? accessPassModel = response.Content.ReadAsAsync<AccessPassModel>().Result;
        if (accessPassModel == null)
        {
            var responseContent = response.Content.ReadAsStringAsync().Result;
            throw new Exception($"AccessPassModel is null for {userName}. Response content: {responseContent}");
        }
        
        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + accessPassModel.Token);
        return accessPassModel;
    }

    protected TableModel StartANewGameForANewTable()
    {
        //User A creates a table
        var tablePreferences = new TablePreferences();
        Assert.That(tablePreferences.NumberOfPlayers, Is.EqualTo(2), "The default number of players should be 2");
        Assert.That(tablePreferences.NumberOfArtificialPlayers, Is.EqualTo(0), "The default number of artificial players should be 0");

        HttpResponseMessage response = ClientA.PostAsJsonAsync("api/tables/join-or-create", tablePreferences).Result;
        Assert.That((int)response.StatusCode, Is.EqualTo(StatusCodes.Status200OK), "User A could not correctly create a table.");
        TableModel table = response.Content.ReadAsAsync<TableModel>().Result;
        Assert.That(table, Is.Not.Null, "User A could not correctly add a table.");
        Assert.That(table.SeatedPlayers.Count, Is.EqualTo(1), "User A could not correctly create a table. There should be 1 seated player");
        Assert.That(table.SeatedPlayers.First().Name, Is.EqualTo(PlayerAAccessPass.User.DisplayName ?? PlayerAAccessPass.User.UserName),
            "User A could not correctly create a table. The seated player has an incorrect name");
        Assert.That(table.SeatedPlayers.First().Id, Is.EqualTo(PlayerAAccessPass.User.Id),
            "User A could not correctly create a table. The seated player has an incorrect id (should be the id of the user");
        Assert.That(table.GameId, Is.EqualTo(Guid.Empty),
            "User A could not correctly create a table. The GameId of the new table should be an empty Guid.");
        Assert.That(table.HasAvailableSeat, Is.True,
            "User A could not correctly create a table. The table should have available seats left.");
        Assert.That(table.Preferences.NumberOfPlayers, Is.EqualTo(tablePreferences.NumberOfPlayers),
            "User A could not correctly create a table. The table should have the preferences that were posted.");
        
        Guid tableId = table.Id; // Store table ID for starting the game

        //User B joins the table
        response = ClientB.PostAsJsonAsync("api/tables/join-or-create", tablePreferences).Result; // This should find the table by A
        Assert.That((int)response.StatusCode, Is.EqualTo(StatusCodes.Status200OK), "User B could not correctly join the table.");
        table = response.Content.ReadAsAsync<TableModel>().Result;
        Assert.That(table, Is.Not.Null, "User B could not correctly join the available table.");
        Assert.That(table.SeatedPlayers.Count, Is.EqualTo(2),
            "User B could not correctly join the available table. There should be 2 seated players");
        Assert.That(table.SeatedPlayers.First().Name, Is.Not.EqualTo(table.SeatedPlayers.Last().Name),
                       "User B could not correctly join the available table. The seated players should have different names");
        Assert.That(table.HasAvailableSeat, Is.False,
            "User B could not correctly join the available table. The table should not have any available seats left.");
        //Assert.That(table!.GameId, Is.Not.EqualTo(Guid.Empty), // OLD ASSERTION
        //    "When the table is full, a game should be started, but the Game Id is empty");
        Assert.That(table!.GameId, Is.EqualTo(Guid.Empty), // NEW ASSERTION: GameId is still empty
            "After User B joins, GameId should still be empty as game is not auto-started.");

        // User A (assumed host) starts the game
        response = ClientA.PostAsync($"api/tables/{tableId}/start-game", null).Result;
        Assert.That((int)response.StatusCode, Is.EqualTo(StatusCodes.Status200OK), $"User A (host) could not start the game for table {tableId}. Status: {response.StatusCode}, Content: {response.Content.ReadAsStringAsync().Result}");
        
        // Re-fetch the table to get the populated GameId
        response = ClientA.GetAsync($"api/tables/{tableId}").Result;
        Assert.That((int)response.StatusCode, Is.EqualTo(StatusCodes.Status200OK), $"Could not re-fetch table {tableId} after starting game. Status: {response.StatusCode}");
        table = response.Content.ReadAsAsync<TableModel>().Result;
        Assert.That(table!.GameId, Is.Not.EqualTo(Guid.Empty),
            $"After host starts the game, the GameId for table {tableId} should be populated.");

        return table;
    }
}