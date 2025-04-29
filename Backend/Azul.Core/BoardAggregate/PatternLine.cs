using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;

/// <inheritdoc cref="IPatternLine"/>
internal class PatternLine : IPatternLine
{
    private int _numberOfTiles;
    private TileType? _tileType;

    public PatternLine(int length)
    {
        Length = length; // max lengte van een lijn 
        _numberOfTiles = 0; // nog niks toegevoegd dus 0
        _tileType = null; // nog geen type gekozen dus null
    }

    public int Length { get; }

    public TileType? TileType => _tileType; // soort tile waar je nu mee bezig bent

    public int NumberOfTiles => _numberOfTiles; // hoeveel tegels er nu in je line zijn

    public bool IsComplete => _numberOfTiles == Length; // vol of niet

    public void Clear() // lijn resetten
    {
        _numberOfTiles = 0;
        _tileType = null;
    }

    public void TryAddTiles(TileType type, int numberOfTilesToAdd, out int remainingNumberOfTiles)
    {
        if (IsComplete)
        {
            throw new InvalidOperationException("Pattern line is already complete."); // kan geen tiles bijzetten als je line al klaar is
        }

        if (_tileType.HasValue && _tileType != type)
        {
            throw new InvalidOperationException("Pattern line already contains a different tile type."); // line moet zelfde tile hebben, error als het niet zo is
        }

        _tileType ??= type;

        int spaceLeft = Length - _numberOfTiles; // hoeveel vakjes je nog moet vullen
        int tilesToAdd = Math.Min(numberOfTilesToAdd, spaceLeft); // als je teveel tiles wil toevoegen, mag niet (heb er al 3/5 bv.)
        _numberOfTiles += tilesToAdd; // geplaatste tiles
        remainingNumberOfTiles = numberOfTilesToAdd - tilesToAdd; // tiles die niet toegevoegd kunnen worden, gaan weg
    }
}
