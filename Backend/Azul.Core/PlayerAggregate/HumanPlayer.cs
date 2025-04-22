using System.Drawing;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal class HumanPlayer : IPlayer
{
    public HumanPlayer(Guid userId, string name, DateOnly? lastVisitToPortugal)
        : base(userId, name, lastVisitToPortugal)
    {

    }

    public Guid Id => throw new NotImplementedException();

    public string Name => throw new NotImplementedException();

    public DateOnly? LastVisitToPortugal => throw new NotImplementedException();

    public IBoard Board => throw new NotImplementedException();

    public bool HasStartingTile { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

    public List<TileType> TilesToPlace => throw new NotImplementedException();
}