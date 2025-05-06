using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TileFactory : ITileFactory
{
    private readonly int _numberOfDisplays;
    private readonly ITileBag _tileBag;
    internal TileFactory(int numberOfDisplays, ITileBag bag)
    {
        _numberOfDisplays = numberOfDisplays;
        _tileBag = bag ?? throw new ArgumentNullException(nameof(bag)); // lege bag gooit een error
        _displays = new List<IFactoryDisplay>(_numberOfDisplays);
        TableCenter = new TableCenter();
        UsedTiles = new List<TileType>();

        for (int i = 0; i < _numberOfDisplays; i++) // zet alle factory displays in de tablecenter
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

        for (int i = 0; i < _numberOfDisplays; i++)
        {
            var display = _displays[i];
            IReadOnlyList<TileType> tiles;

            // 4 tiles proberen te pakken
            if (!_tileBag.TryTakeTiles(4, out tiles))
            {
                // als 4 niet lukt, wat wel
                int tilesTaken = tiles?.Count ?? 0;
                int tilesNeeded = 4 - tilesTaken;

                // als we er nodig hebben en er zijn nog
                if (tilesNeeded > 0 && UsedTiles.Any())
                {
                    // gebruikte in bag zetten
                    _tileBag.AddTiles(UsedTiles);
                    UsedTiles.Clear();

                    // remaining tiles pakken
                    IReadOnlyList<TileType> additionalTiles;
                    if (_tileBag.TryTakeTiles(tilesNeeded, out additionalTiles))
                    {
                        // samenzetten met vorige
                        var combinedTiles = new List<TileType>();
                        if (tiles != null) combinedTiles.AddRange(tiles);
                        combinedTiles.AddRange(additionalTiles);
                        tiles = combinedTiles;
                    }
                }
            }

            display.AddTiles(tiles ?? new List<TileType>());
        }
    }

    public IReadOnlyList<TileType> TakeTiles(Guid displayId, TileType tileType)
    {
        // Check if it's the table center
        if (displayId == TableCenter.Id)
        {
            // Check if the tile type exists in the table center
            if (!TableCenter.Tiles.Contains(tileType))
            {
                throw new InvalidOperationException($"The table center does not contain any tiles of type {tileType}.");
            }
            
            // Take tiles from the table center
            return TableCenter.TakeTiles(tileType);
        }
        
        // Find the factory display
        IFactoryDisplay? display = Displays.FirstOrDefault(d => d.Id == displayId);
        
        // Check if the display exists
        if (display == null)
        {
            throw new InvalidOperationException($"Factory display with ID {displayId} does not exist.");
        }
        
        // Check if the tile type exists in the display
        if (!display.Tiles.Contains(tileType))
        {
            throw new InvalidOperationException($"The factory display does not contain any tiles of type {tileType}.");
        }
        
        // Take tiles from the display
        return display.TakeTiles(tileType);
    }
}