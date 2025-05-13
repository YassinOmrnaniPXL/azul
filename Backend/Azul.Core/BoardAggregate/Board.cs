using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;

/// <inheritdoc cref="IBoard"/>
internal class Board : IBoard
{
    public IPatternLine[] PatternLines { get; }

    public TileSpot[,] Wall { get; }

    public TileSpot[] FloorLine { get; }
    public int Score { get; private set; }
    public bool HasCompletedHorizontalLine => Wall.Cast<TileSpot>().All(ts => ts.HasTile);

    public Board()
    {
        //strafpunten rij
        FloorLine = new TileSpot[7];
        for (int i = 0; i < 7; i++)
        {
            FloorLine[i] = new TileSpot();
        }

        // patternline, lengtes van 1 tot 5
        PatternLines = new IPatternLine[5];
        for (int i = 0; i < 5; i++)
        {
            PatternLines[i] = new PatternLine(i + 1);
        }

        // wall instellen en roteren voor juiste volgorde
        Wall = new TileSpot[5, 5];
        TileType[] baseTypes = new[]
        {
        TileType.PlainBlue,
        TileType.WhiteTurquoise,
        TileType.BlackBlue,
        TileType.PlainRed,
        TileType.YellowRed
        };

        for (int row = 0; row < 5; row++)
        {
            for (int col = 0; col < 5; col++)
            {
                int index = (col + row) % 5;
                Wall[row, col] = new TileSpot(baseTypes[index]);
            }
        }

        // score 0 (staat in de test)
        Score = 0;
    }
    public void AddTilesToFloorLine(IReadOnlyList<TileType> tilesToAdd, ITileFactory tileFactory)
    {
        int floorLineIndex = 0;
        
        // Try to place each tile on the floor line
        foreach (TileType tile in tilesToAdd)
        {
            // Find the next empty spot in the floor line
            while (floorLineIndex < FloorLine.Length && FloorLine[floorLineIndex].HasTile)
            {
                floorLineIndex++;
            }
            
            // If there's space in the floor line, add the tile
            if (floorLineIndex < FloorLine.Length)
            {
                FloorLine[floorLineIndex].PlaceTile(tile);
            }
            // Otherwise, add the tile to the used tiles of the factory
            else
            {
                tileFactory.AddToUsedTiles(tile);
            }
        }
    }

    public void AddTilesToPatternLine(IReadOnlyList<TileType> tilesToAdd, int patternLineIndex, ITileFactory tileFactory)
    {
        // Check if there's already a tile of the same type on the wall in the corresponding row
        TileType tileType = tilesToAdd.FirstOrDefault(t => t != TileType.StartingTile);
        if (tileType == default)
        {
            // Only starting tiles, nothing to add to pattern line
            AddTilesToFloorLine(tilesToAdd, tileFactory);
            return;
        }
        
        // Check if the wall already has a tile of this type in the matching row
        TileSpot[] wallRow = new TileSpot[5];
        for (int i = 0; i < 5; i++)
        {
            wallRow[i] = Wall[patternLineIndex, i];
        }
        
        if (wallRow.Any(spot => spot.HasTile && spot.Type == tileType))
        {
            throw new InvalidOperationException($"The wall already has a tile of type {tileType} in this row.");
        }
        
        // Separate starting tiles from regular tiles
        var regularTiles = new List<TileType>();
        var startingTiles = new List<TileType>();
        
        foreach (TileType tile in tilesToAdd)
        {
            if (tile == TileType.StartingTile)
            {
                startingTiles.Add(tile);
            }
            else
            {
                regularTiles.Add(tile);
            }
        }
        
        // Add regular tiles to pattern line
        IPatternLine patternLine = PatternLines[patternLineIndex];
        patternLine.TryAddTiles(tileType, regularTiles.Count, out int remainingTiles);
        
        // Create a list of tiles that need to go to the floor line
        var tilesForFloorLine = new List<TileType>();
        
        // Add starting tiles to floor line
        tilesForFloorLine.AddRange(startingTiles);
        
        // Add overflow tiles to floor line
        for (int i = 0; i < remainingTiles; i++)
        {
            tilesForFloorLine.Add(tileType);
        }
        
        // Add tiles to floor line if any
        if (tilesForFloorLine.Count > 0)
        {
            AddTilesToFloorLine(tilesForFloorLine, tileFactory);
        }
    }

    public void DoWallTiling(ITileFactory tileFactory)
    {
        // For each pattern line
        for (int rowIndex = 0; rowIndex < PatternLines.Length; rowIndex++)
        {
            IPatternLine patternLine = PatternLines[rowIndex];
            
            // If the pattern line is complete, move one tile to the wall
            if (patternLine.IsComplete)
            {
                TileType tileType = patternLine.TileType!.Value;
                
                // Find the matching spot in the wall
                for (int colIndex = 0; colIndex < 5; colIndex++)
                {
                    TileSpot spot = Wall[rowIndex, colIndex];
                    if (spot.Type == tileType)
                    {
                        // Place the tile on the wall
                        spot.PlaceTile(tileType);
                        
                        // Calculate score for this tile
                        CalculateScoreForTilePlacement(rowIndex, colIndex);
                        
                        // Move the remaining tiles to the used tiles
                        for (int i = 0; i < patternLine.Length - 1; i++)
                        {
                            tileFactory.AddToUsedTiles(tileType);
                        }
                        
                        // Clear the pattern line
                        patternLine.Clear();
                        break;
                    }
                }
            }
        }
        
        // Calculate penalty for floor line
        CalculateFloorLinePenalty();
        
        // Clear the floor line
        foreach (TileSpot spot in FloorLine)
        {
            if (spot.HasTile && spot.Type.HasValue)
            {
                tileFactory.AddToUsedTiles(spot.Type.Value);
                spot.Clear();
            }
        }
    }

    private void CalculateScoreForTilePlacement(int rowIndex, int colIndex)
    {
        // Calculate horizontal score
        int horizontalScore = 0;
        int horizontalCount = 1;
        
        // Check tiles to the left
        for (int c = colIndex - 1; c >= 0; c--)
        {
            if (Wall[rowIndex, c].HasTile)
            {
                horizontalCount++;
            }
            else
            {
                break;
            }
        }
        
        // Check tiles to the right
        for (int c = colIndex + 1; c < 5; c++)
        {
            if (Wall[rowIndex, c].HasTile)
            {
                horizontalCount++;
            }
            else
            {
                break;
            }
        }
        
        if (horizontalCount > 1)
        {
            horizontalScore = horizontalCount;
        }
        
        // Calculate vertical score
        int verticalScore = 0;
        int verticalCount = 1;
        
        // Check tiles above
        for (int r = rowIndex - 1; r >= 0; r--)
        {
            if (Wall[r, colIndex].HasTile)
            {
                verticalCount++;
            }
            else
            {
                break;
            }
        }
        
        // Check tiles below
        for (int r = rowIndex + 1; r < 5; r++)
        {
            if (Wall[r, colIndex].HasTile)
            {
                verticalCount++;
            }
            else
            {
                break;
            }
        }
        
        if (verticalCount > 1)
        {
            verticalScore = verticalCount;
        }
        
        // If both scores are 0, then it's a single tile (worth 1 point)
        if (horizontalScore == 0 && verticalScore == 0)
        {
            Score += 1;
        }
        else
        {
            Score += horizontalScore + verticalScore;
        }
    }

    private void CalculateFloorLinePenalty()
    {
        int penalty = 0;
        int[] penalties = { 1, 1, 2, 2, 2, 3, 3 };
        
        for (int i = 0; i < FloorLine.Length; i++)
        {
            if (FloorLine[i].HasTile)
            {
                penalty += penalties[i];
            }
        }
        
        Score = Math.Max(0, Score - penalty);
    }

    public void CalculateFinalBonusScores()
    {
        // 2 points for each completed horizontal line
        for (int row = 0; row < 5; row++)
        {
            bool isComplete = true;
            for (int col = 0; col < 5; col++)
            {
                if (!Wall[row, col].HasTile)
                {
                    isComplete = false;
                    break;
                }
            }
            
            if (isComplete)
            {
                Score += 2;
            }
        }
        
        // 7 points for each completed vertical line
        for (int col = 0; col < 5; col++)
        {
            bool isComplete = true;
            for (int row = 0; row < 5; row++)
            {
                if (!Wall[row, col].HasTile)
                {
                    isComplete = false;
                    break;
                }
            }
            
            if (isComplete)
            {
                Score += 7;
            }
        }
        
        // 10 points for each completed color set (all 5 tiles of a color)
        var colorCounts = new Dictionary<TileType, int>();
        for (int row = 0; row < 5; row++)
        {
            for (int col = 0; col < 5; col++)
            {
                TileSpot spot = Wall[row, col];
                if (spot.HasTile && spot.Type.HasValue)
                {
                    TileType type = spot.Type.Value;
                    if (!colorCounts.ContainsKey(type))
                    {
                        colorCounts[type] = 0;
                    }
                    colorCounts[type]++;
                }
            }
        }
        
        foreach (var count in colorCounts.Values)
        {
            if (count == 5)
            {
                Score += 10;
            }
        }
    }
}