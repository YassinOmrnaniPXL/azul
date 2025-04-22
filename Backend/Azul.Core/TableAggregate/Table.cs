using System.Drawing;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITable"/>
internal class Table : ITable
{

    public ITablePreferences Preferences { get; private set; }
    public Guid Id { get; private set; }
    Guid ITable.Id => Id;
    public Guid GameId { get; set; } = Guid.Empty;



    internal Table(Guid id, ITablePreferences preferences)
    {
        Id = id;
        Preferences = preferences;
        
    }



    private readonly List<IPlayer> _seatedPlayers = new();
    IReadOnlyList<IPlayer> ITable.SeatedPlayers => _seatedPlayers;

    public bool HasAvailableSeat => _seatedPlayers.Count < Preferences.NumberOfPlayers;

    

    public void FillWithArtificialPlayers(IGamePlayStrategy gamePlayStrategy)
    {
        throw new NotImplementedException();
    }

    public void Join(User user)
    {
        if (_seatedPlayers.Any(p => p.Id == user.Id))
        {
            throw new InvalidOperationException("User is already seated at the table.");
        }

        if (!HasAvailableSeat)
        {
            throw new InvalidOperationException("Table is full. No available seats.");
        }

        var player = new HumanPlayer(user.Id, user.UserName, user.LastVisitToPortugal);
        _seatedPlayers.Add(player);
    }


    public void Leave(Guid userId)
    {
        var playerToRemove = _seatedPlayers.FirstOrDefault(p => p.Id == userId);
        if (playerToRemove == null)
        {
            throw new InvalidOperationException("User is not seated at the table.");
        }

        _seatedPlayers.Remove(playerToRemove);
    }

}