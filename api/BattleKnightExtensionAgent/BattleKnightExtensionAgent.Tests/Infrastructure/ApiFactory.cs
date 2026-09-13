using BattleKnightExtensionAgent.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace BattleKnightExtensionAgent.Tests.Infrastructure;

/// <summary>
/// Hosts the real API in memory against an in-memory SQLite database.
///
/// SQLite rather than the EF Core InMemory provider because InMemory doesn't
/// enforce relational constraints — and the unique email index is exactly the
/// kind of thing these tests need to exercise.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    /// <summary>
    /// An in-memory SQLite database only lives as long as its connection, so one
    /// connection is held open for the lifetime of the factory.
    /// </summary>
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();

        // Not Development: that environment loads user-secrets, which would make the
        // tests depend on whatever happens to be configured on the machine running them.
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration(configuration => configuration.AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "integration-tests-only-signing-key-0123456789abcdef",
            }));

        builder.ConfigureTestServices(services =>
        {
            // Remove the configuration callback as well as the options — EF Core applies
            // every registered callback, so leaving it would still point at the file database.
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();

            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Program.cs only migrates in Development, so the schema is created here.
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();

        return host;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            _connection.Dispose();
        }
    }
}
