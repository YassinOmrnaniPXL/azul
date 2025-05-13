using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;


/// <summary>
/// Represents a spot on the board or floor line where a tile can be placed.
/// </summary>
public class TileSpot
{
    /// <summary>
    /// The type of tile that can be placed on this spot.
    /// If null, any type of tile can be placed.
    /// </summary>
    public TileType? Type { get; private set; }

    /// <summary>
    /// Indicates whether a tile is placed on this spot.
    /// </summary>
    public bool HasTile { get; private set; }

    public TileSpot(TileType? type = null)
    {
        Type = type;
        HasTile = false;
    }

    public void PlaceTile(TileType type)
    {
        // Check if a tile is already placed
        if (HasTile)
        {
            throw new InvalidOperationException("This spot already has a tile.");
        }
        
        // Check if the type is compatible
        if (Type != null && Type != type)
        {
            throw new InvalidOperationException($"Cannot place a tile of type {type} on a spot for type {Type}.");
        }
        
        // Place the tile
        Type = type;
        HasTile = true;
    }

    public void Clear()
    {
        Type = null;
        HasTile = false;
    }
}