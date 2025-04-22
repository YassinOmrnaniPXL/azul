using System.Drawing;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal class HumanPlayer(Guid userId, string name, DateOnly? lastVisitToPortugal)
    : PlayerBase(userId, name, lastVisitToPortugal)
{
}
