using System.Drawing;
using Azul.Core.PlayerAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal class HumanPlayer : PlayerBase
{
    public HumanPlayer(Guid userId, string name, DateOnly? lastVisitToPortugal)
        : base(userId, name, lastVisitToPortugal)
    {

    }

}