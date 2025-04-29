using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate;

/// <inheritdoc cref="IGame"/>
internal class Game : IGame
{


    /// <summary>
    /// Creates a new game and determines the player to play first.
    /// </summary>
    /// <param name="id">The unique identifier of the game</param>
    /// <param name="tileFactory">The tile factory</param>
    /// <param name="players">The players that will play the game</param>
    public Game(Guid id, ITileFactory tileFactory, IPlayer[] players)
    {
        Id = id;
        TileFactory = tileFactory;
        Players = players;
        RoundNumber = 1;
        HasEnded = false;

        PlayerToPlayId = players
            .OrderByDescending(p => p.LastVisitToPortugal ?? DateOnly.MinValue)
            .First().Id;

        TileFactory.FillDisplays();

        TileFactory.TableCenter.AddStartingTile();

        foreach (var player in Players)
        {
            player.HasStartingTile = false;
        }
    }

    public Guid Id { get; }

    public ITileFactory TileFactory { get; }

    public IPlayer[] Players { get; }

    public Guid PlayerToPlayId { get; private set; }

    public int RoundNumber { get; private set; }

    public bool HasEnded { get; private set; }

    public void PlaceTilesOnFloorLine(Guid playerId)
    {
        throw new NotImplementedException();
    }

    public void PlaceTilesOnPatternLine(Guid playerId, int patternLineIndex)
    {
        throw new NotImplementedException();
    }

    public void TakeTilesFromFactory(Guid playerId, Guid displayId, TileType tileType)
    {
        throw new NotImplementedException();
    }
}