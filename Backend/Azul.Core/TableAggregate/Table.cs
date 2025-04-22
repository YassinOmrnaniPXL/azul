using System.Drawing;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITable"/>
internal class Table : ITable
{
    internal Table(Guid id, ITablePreferences preferences)
    {
    }

    public Guid Id => throw new NotImplementedException();

    public ITablePreferences Preferences => throw new NotImplementedException();

    public IReadOnlyList<IPlayer> SeatedPlayers => throw new NotImplementedException();

    public bool HasAvailableSeat => throw new NotImplementedException();

    public Guid GameId { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

    public void FillWithArtificialPlayers(IGamePlayStrategy gamePlayStrategy)
    {
        throw new NotImplementedException();
    }

    public void Join(User user)
    {
        throw new NotImplementedException();
    }

    public void Leave(Guid userId)
    {
        throw new NotImplementedException();
    }
}