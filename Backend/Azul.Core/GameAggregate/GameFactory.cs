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

        var bag = new TileBag();
        foreach (TileType tileType in Enum.GetValues(typeof(TileType)))
        {
            // TileType.StartingTile overslaan
            if (tileType == TileType.StartingTile) continue;

            // bag vullen
            var tiles = Enumerable.Repeat(tileType, 20).ToList();
            bag.AddTiles(tiles);
        }
        // tablecenter aanmaken
        ITableCenter tableCenter = new TableCenter();

        // tilefactory vullen
        int numberOfDisplays = table.Preferences.NumberOfFactoryDisplays;
        var tileFactory = new TileFactory(numberOfDisplays, bag);

        // display vullen met tiles
        tileFactory.FillDisplays();

        // game maken en teruggeven
        return new Game(gameId, tileFactory, players);
    }
}