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
    public Guid GameId { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }


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
        if (!HasAvailableSeat)
        {
            throw new InvalidOperationException("No available seats at the table.");
        }

        var player = new HumanPlayer(user.Id, user.UserName, user.LastVisitToPortugal);
        _seatedPlayers.Add(player);
    }

    public void Leave(Guid userId)
    {
        var playerToRemove = _seatedPlayers.FirstOrDefault(p => p.Id == userId);
        if (playerToRemove != null)
        {
            _seatedPlayers.Remove(playerToRemove);
        }
    }
}