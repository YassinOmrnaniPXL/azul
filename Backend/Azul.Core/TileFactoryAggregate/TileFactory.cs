using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TileFactory : ITileFactory
{
    private readonly int _numberOfDisplays;
    private readonly ITileBag _tileBag;
    internal TileFactory(int numberOfDisplays, ITileBag bag)
    {
        _numberOfDisplays = numberOfDisplays;
        _tileBag = bag ?? throw new ArgumentNullException(nameof(bag));
        _displays = new List<IFactoryDisplay>(_numberOfDisplays); // NEW
        TableCenter = new TableCenter();
        UsedTiles = new List<TileType>();

        for (int i = 0; i < _numberOfDisplays; i++)
        {
            _displays.Add(new FactoryDisplay(TableCenter));
        }
    }

    public ITileBag Bag => _tileBag;

    private readonly List<IFactoryDisplay> _displays;
    public IReadOnlyList<IFactoryDisplay> Displays => _displays;

    public ITableCenter TableCenter { get; }
    public List<TileType> UsedTiles { get; }
    public bool IsEmpty => !Displays.Any(d => d.Tiles.Any()) && !TableCenter.Tiles.Any();

    IReadOnlyList<TileType> ITileFactory.UsedTiles => UsedTiles;

    public void AddToUsedTiles(TileType tile)
    {
        UsedTiles.Add(tile);
        // throw new NotImplementedException();
    }

    public void FillDisplays()
    {
        // wtf

        // gaat over elke rij van display die gevuld moet worden
        for (int i = 0; i < _numberOfDisplays; i++)
        {
            var display = _displays[i];
            IReadOnlyList<TileType> tiles;

            if (!_tileBag.TryTakeTiles(4, out tiles))
            {
                if (UsedTiles.Any())
                {
                    _tileBag.AddTiles(UsedTiles);
                    UsedTiles.Clear();
                }

                // als het niet lukt, bag vullen met usedtiles
                if (!_tileBag.TryTakeTiles(4, out tiles))
                {
                    tiles = new List<TileType>();
                }
            }
            // toevoegen aan display
            display.AddTiles(tiles);
            ((List<IFactoryDisplay>)Displays).Add(display);
            // throw new NotImplementedException();
        }
    }

    public IReadOnlyList<TileType> TakeTiles(Guid displayId, TileType tileType)
    {
        throw new NotImplementedException();
    }
}