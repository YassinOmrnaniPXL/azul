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
        //TD: patternline en wall initialiseren
        // floorlune init
        FloorLine = new TileSpot[7];
        for (int i = 0; i < 7; i++)
        {
            FloorLine[i] = new TileSpot();
        }

        // score 0 (staat in de test)
        Score = 0;
    }
    public void AddTilesToFloorLine(IReadOnlyList<TileType> tilesToAdd, ITileFactory tileFactory)
    {
        throw new NotImplementedException();
    }

    public void AddTilesToPatternLine(IReadOnlyList<TileType> tilesToAdd, int patternLineIndex, ITileFactory tileFactory)
    {
        throw new NotImplementedException();
    }

    public void CalculateFinalBonusScores()
    {
        throw new NotImplementedException();
    }

    public void DoWallTiling(ITileFactory tileFactory)
    {
        throw new NotImplementedException();
    }
}