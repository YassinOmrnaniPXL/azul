using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TableCenter : ITableCenter
{
    private readonly List<TileType> _tiles = new();
    public Guid Id { get; } = Guid.NewGuid();

    public IReadOnlyList<TileType> Tiles => _tiles;

    public bool IsEmpty => !_tiles.Any();

    public void AddStartingTile()
    {
        _tiles.Add(TileType.StartingTile);
        // throw new NotImplementedException();
    }

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        _tiles.AddRange(tilesToAdd);
        // throw new NotImplementedException();
    }

    public IReadOnlyList<TileType> TakeTiles(TileType tileType)
    {
        var taken = _tiles.Where(t => t == tileType || t == TileType.StartingTile).ToList();
        _tiles.RemoveAll(t => t == tileType || t == TileType.StartingTile);
        
        return taken;
        //throw new NotImplementedException();
    }
}