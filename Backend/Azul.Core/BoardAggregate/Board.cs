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