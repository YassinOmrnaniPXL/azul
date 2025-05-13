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

        PlayerToPlayId = players // kiest degene die het laatst naar portugal is geweest
            .OrderByDescending(p => p.LastVisitToPortugal ?? DateOnly.MinValue)
            .First().Id;

        TileFactory.FillDisplays(); // displays vullen met tiles

        TileFactory.TableCenter.AddStartingTile(); // starting tile toevoegen

        foreach (var player in Players) // niemand mag starting tile hebben bij het begin
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
        // Check if it's the player's turn
        if (playerId != PlayerToPlayId)
        {
            throw new InvalidOperationException("It is not your turn to play.");
        }

        // Find the player
        IPlayer player = Players.FirstOrDefault(p => p.Id == playerId) ?? 
            throw new InvalidOperationException("Player not found.");

        // Check if the player has tiles to place
        if (player.TilesToPlace.Count == 0)
        {
            throw new InvalidOperationException("You have no tiles to place.");
        }

        // Add tiles to floor line
        player.Board.AddTilesToFloorLine(player.TilesToPlace, TileFactory);
        
        // Clear the player's tiles to place
        player.TilesToPlace.Clear();
        
        // Check if the factory is empty
        if (TileFactory.IsEmpty)
        {
            // End of round - do wall tiling for all players
            foreach (var p in Players)
            {
                p.Board.DoWallTiling(TileFactory);
            }
            
            // Check if the game has ended (a player has a completed horizontal line)
            bool gameEnded = Players.Any(p => p.Board.HasCompletedHorizontalLine);
            
            if (gameEnded)
            {
                // Calculate final scores
                foreach (var p in Players)
                {
                    p.Board.CalculateFinalBonusScores();
                }
                
                HasEnded = true;
            }
            else
            {
                // Start a new round
                RoundNumber++;
                
                // Find the player with the starting tile
                IPlayer playerWithStartingTile = Players.FirstOrDefault(p => p.HasStartingTile) ?? player;
                
                // Reset starting tile status
                foreach (var p in Players)
                {
                    p.HasStartingTile = false;
                }
                
                // Add starting tile to table center
                TileFactory.TableCenter.AddStartingTile();
                
                // Fill the factory displays
                TileFactory.FillDisplays();
                
                // Set the player with starting tile as the next player
                PlayerToPlayId = playerWithStartingTile.Id;
            }
        }
        else
        {
            // Give turn to the other player
            PlayerToPlayId = Players.First(p => p.Id != playerId).Id;
        }
    }

    public void PlaceTilesOnPatternLine(Guid playerId, int patternLineIndex)
    {
        // Check if it's the player's turn
        if (playerId != PlayerToPlayId)
        {
            throw new InvalidOperationException("It is not your turn to play.");
        }

        // Find the player
        IPlayer player = Players.FirstOrDefault(p => p.Id == playerId) ?? 
            throw new InvalidOperationException("Player not found.");

        // Check if the player has tiles to place
        if (player.TilesToPlace.Count == 0)
        {
            throw new InvalidOperationException("You have no tiles to place.");
        }

        // Add tiles to pattern line
        player.Board.AddTilesToPatternLine(player.TilesToPlace, patternLineIndex, TileFactory);
        
        // Clear the player's tiles to place
        player.TilesToPlace.Clear();
        
        // Check if the factory is empty
        if (TileFactory.IsEmpty)
        {
            // End of round - do wall tiling for all players
            foreach (var p in Players)
            {
                p.Board.DoWallTiling(TileFactory);
            }
            
            // Check if the game has ended (a player has a completed horizontal line)
            bool gameEnded = Players.Any(p => p.Board.HasCompletedHorizontalLine);
            
            if (gameEnded)
            {
                // Calculate final scores
                foreach (var p in Players)
                {
                    p.Board.CalculateFinalBonusScores();
                }
                
                HasEnded = true;
            }
            else
            {
                // Start a new round
                RoundNumber++;
                
                // Find the player with the starting tile
                IPlayer playerWithStartingTile = Players.FirstOrDefault(p => p.HasStartingTile) ?? player;
                
                // Reset starting tile status
                foreach (var p in Players)
                {
                    p.HasStartingTile = false;
                }
                
                // Add starting tile to table center
                TileFactory.TableCenter.AddStartingTile();
                
                // Fill the factory displays
                TileFactory.FillDisplays();
                
                // Set the player with starting tile as the next player
                PlayerToPlayId = playerWithStartingTile.Id;
            }
        }
        else
        {
            // Give turn to the other player
            PlayerToPlayId = Players.First(p => p.Id != playerId).Id;
        }
    }

    public void TakeTilesFromFactory(Guid playerId, Guid displayId, TileType tileType)
    {
        // Check if it's the player's turn
        if (playerId != PlayerToPlayId)
        {
            throw new InvalidOperationException("It is not your turn to play.");
        }

        // Find the player
        IPlayer player = Players.FirstOrDefault(p => p.Id == playerId) ?? 
            throw new InvalidOperationException("Player not found.");

        // Check if the player already has tiles to place
        if (player.TilesToPlace.Count > 0)
        {
            throw new InvalidOperationException("You already have tiles that need to be placed.");
        }

        // Take tiles from the factory
        IReadOnlyList<TileType> takenTiles = TileFactory.TakeTiles(displayId, tileType);

        // Add tiles to the player's tiles to place
        foreach (TileType tile in takenTiles)
        {
            if (tile == TileType.StartingTile)
            {
                player.HasStartingTile = true;
            }
            
            // Add all tiles (including starting tile) to the player's tiles to place
            player.TilesToPlace.Add(tile);
        }
    }
}