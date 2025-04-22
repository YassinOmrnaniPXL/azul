using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

/// <inheritdoc cref="ITileBag"/>
internal class TileBag : ITileBag
{
    private readonly List<TileType> _tiles = new();

    public IReadOnlyList<TileType> Tiles => _tiles.AsReadOnly();

    public void AddTiles(int amount, TileType tileType)
    {
        for (int i = 0; i < amount; i++)
        {
            _tiles.Add(tileType);
        }
    }
    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        {
            _tiles.AddRange(tilesToAdd);
        }
    }

    public bool TryTakeTiles(int amount, out IReadOnlyList<TileType> tiles)
    {
        if (_tiles.Count < amount)
        {
            // alle tiles pakken
            tiles = _tiles.ToList();
            _tiles.Clear();
            return false;
        }

        // shufflen
        var shuffledTiles = _tiles.OrderBy(_ => Random.Shared.Next()).ToList();
        tiles = shuffledTiles.Take(amount).ToList();

        // tiles verwijderen
        foreach (var tile in tiles)
        {
            _tiles.Remove(tile);
        }

        return true;
    }
}