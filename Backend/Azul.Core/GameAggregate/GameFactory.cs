using System.Drawing;
using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.TileFactoryAggregate;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate;

internal class GameFactory : IGameFactory
{
    private readonly ITileFactory _tileFactory;

    public GameFactory() 
    {
    }
    public GameFactory(ITileFactory tileFactory)
    {
        _tileFactory = tileFactory;
    }

    public IGame CreateNewForTable(ITable table)
    {
        var gameId = Guid.NewGuid();
        var players = table.SeatedPlayers.ToArray(); // van IReadOnlyList naar array

        return new Game(gameId, _tileFactory, players);
    }
}