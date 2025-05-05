using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class FactoryDisplay : IFactoryDisplay
{
    private readonly ITableCenter _tableCenter;
    private readonly List<TileType> _tiles;
    public FactoryDisplay(ITableCenter tableCenter)
    {
        //FYI: The table center is injected to be able to move tiles (that were not taken by a player) to the center
        _tableCenter = tableCenter;
        _tiles = new List<TileType>();
        Id = Guid.NewGuid();
    }

    public Guid Id { get; }

    public IReadOnlyList<TileType> Tiles => _tiles.AsReadOnly();

    public bool IsEmpty => !_tiles.Any();

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        _tiles.AddRange(tilesToAdd);
        // throw new NotImplementedException();
    }

    public IReadOnlyList<TileType> TakeTiles(TileType tileType)
    {
        var taken = _tiles.Where(t => t == tileType).ToList();
        var remaining = _tiles.Where(t => t != tileType).ToList();

        _tiles.Clear(); 
        _tiles.AddRange(remaining); // niet genomen terug zetten

        // terug naar table center
        foreach (var tile in remaining)
        {
            _tableCenter.AddTiles(new List<TileType> { tile });
        }

        return taken;
        // throw new NotImplementedException();
    }
}