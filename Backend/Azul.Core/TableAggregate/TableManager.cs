using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITableManager"/>
internal class TableManager : ITableManager
{
    private readonly ITableRepository _tableRepository;
    private readonly ITableFactory _tableFactory;
    private readonly IGameRepository _gameRepository;
    private readonly IGameFactory _gameFactory;
    private readonly IGamePlayStrategy _gamePlayStrategy;

    public TableManager(
        ITableRepository tableRepository,
        ITableFactory tableFactory,
        IGameRepository gameRepository,
        IGameFactory gameFactory,
        IGamePlayStrategy gamePlayStrategy)
    {
        _tableRepository = tableRepository;
        _tableFactory = tableFactory;
        _gameRepository = gameRepository;
        _gameFactory = gameFactory;
        _gamePlayStrategy = gamePlayStrategy;
    }

    public ITable JoinOrCreateTable(User user, ITablePreferences preferences)
    {
        var availableTables = _tableRepository.FindTablesWithAvailableSeats(preferences);

        ITable table;

        if (availableTables == null || !availableTables.Any())
        {
            table = _tableFactory.CreateNewForUser(user, preferences); // creert nieuwe tafel als er geen bestaande zijn
            _tableRepository.Add(table);
        }
        else
        {
            table = availableTables.First(); // anders joint user bestaande tafel, met dezelfde preferences
            table.Join(user);
        }

        return table;
    }

    public void LeaveTable(Guid tableId, User user)
    {
        var table = _tableRepository.Get(tableId);

        if (table == null)
        {
            throw new ArgumentException($"Table with id {tableId} not found."); // zeker maken dat tafel nog bestaat
        }

        table.Leave(user.Id);

        if (!table.SeatedPlayers.Any())
        {
            _tableRepository.Remove(tableId); // tafel verwijderen als speler de laatste aan de tafel is
        }
    }


    public IGame StartGameForTable(Guid tableId, Guid userId)
    {
        var table = _tableRepository.Get(tableId);

        if (table == null)
        {
            throw new ArgumentException($"Table with id {tableId} not found.");
        }

        if (table.HostPlayerId != userId)
        {
            throw new InvalidOperationException("Only the host can start the game.");
        }

        if (table.SeatedPlayers.Count < table.Preferences.NumberOfPlayers)
        {
            throw new InvalidOperationException("Cannot start game: table is not full.");
        }

        if (table.GameId != Guid.Empty)
        {
            throw new InvalidOperationException("Game has already been started for this table.");
        }

        // Maak nieuw Game object aan vanuit de table (gebruik jouw CreateNewForTable!)
        IGame newGame = _gameFactory.CreateNewForTable(table);

        // Koppel de nieuwe game aan de tafel
        table.GameId = newGame.Id;

        // Save nieuwe game en update de tafel
        _gameRepository.Add(newGame);
        _tableRepository.Update(table);

        return newGame;
    }



    public void FillWithArtificialPlayers(Guid tableId, User user)
    {
        //TODO: Implement this method when you are working on the EXTRA requirement 'Play against AI'
        throw new NotImplementedException();
    }
}