using Azul.Core.TableAggregate.Contracts;
using Azul.Core.Util;
using Azul.Infrastructure.Util;

namespace Azul.Infrastructure;

/// <inheritdoc cref="ITableRepository"/>
internal class InMemoryTableRepository : ITableRepository
{
    private readonly ExpiringDictionary<Guid, ITable> _tableDictionary;

    public InMemoryTableRepository()
    {
        _tableDictionary = new ExpiringDictionary<Guid, ITable>(TimeSpan.FromHours(24)); // Increased to 24 hours to test if expiration is the issue
    }

    public void Add(ITable table)
    {
        Console.WriteLine($"[REPO] Adding table {table.Id} with {table.SeatedPlayers.Count} players");
        _tableDictionary.AddOrReplace(table.Id, table);
        Console.WriteLine($"[REPO] Table {table.Id} added successfully. Total tables: {_tableDictionary.Values.Count()}");
    }

    public ITable Get(Guid tableId)
    {
        if (_tableDictionary.TryGetValue(tableId, out ITable table))
        {
            return table!;
        }
        throw new DataNotFoundException();
    }

    public void Remove(Guid tableId)
    {
        Console.WriteLine($"[REPO] REMOVING table {tableId}");
        var stackTrace = Environment.StackTrace;
        Console.WriteLine($"[REPO] Remove called from: {stackTrace}");
        bool removed = _tableDictionary.TryRemove(tableId, out ITable _);
        Console.WriteLine($"[REPO] Table {tableId} removal result: {removed}. Remaining tables: {_tableDictionary.Values.Count()}");
    }

    public IList<ITable> FindTablesWithAvailableSeats(ITablePreferences preferences)
    {
        //TODO: loop over all tables (user the Values property of _tableDictionary)
        //and check if those tables have the same preferences and have seats available.
        //Put the tables that have the same preferences and have seats available in a list and return that list.

        return _tableDictionary.Values
            .Where(t => t.Preferences.Equals(preferences) && t.HasAvailableSeat)
            .ToList();

        // throw new System.NotImplementedException();
    }

    // googly googly .net advanced clutch 1
    public void Update(ITable table)
    {
        _tableDictionary.AddOrReplace(table.Id, table);
    }

    public IEnumerable<ITable> GetAllJoinableTables()
    {
        // Returns tables that have available seats and haven't started a game yet.
        // You can add more conditions, e.g., if you add an IsPublic flag to ITable.
        var allTables = _tableDictionary.Values.ToList();
        Console.WriteLine($"[REPO] GetAllJoinableTables - Total tables in dictionary: {allTables.Count}");
        
        var joinableTables = allTables
            .Where(t => t.HasAvailableSeat && t.GameId == Guid.Empty)
            .OrderByDescending(t => t.SeatedPlayers.Count) // Optional: show fuller tables first
            .ThenBy(t => t.Id) // Consistent ordering
            .ToList();
            
        Console.WriteLine($"[REPO] GetAllJoinableTables - Joinable tables: {joinableTables.Count}");
        foreach (var table in joinableTables)
        {
            Console.WriteLine($"[REPO] - Table {table.Id}: {table.SeatedPlayers.Count} players, GameId: {table.GameId}");
        }
        
        return joinableTables;
    }
}