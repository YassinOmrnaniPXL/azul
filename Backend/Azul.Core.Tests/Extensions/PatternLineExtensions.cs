using Azul.Core.BoardAggregate.Contracts;
using System.Reflection;

namespace Azul.Core.Tests.Extensions
{
    /// <summary>
    /// Extension methods for pattern lines for testing purposes only
    /// </summary>
    internal static class PatternLineExtensions
    {
        /// <summary>
        /// Sets tiles on a pattern line without a type for testing purposes.
        /// This is used to create the "Empty,N" pattern lines in tests.
        /// </summary>
        public static void SetTilesWithoutTypeForTesting(this IPatternLine patternLine, int numberOfTiles)
        {
            // We need to use reflection to directly access and modify the private fields
            // This is only acceptable in test code, not in production code
            var concreteInstance = patternLine;
            
            // Get the type of the concrete pattern line
            var type = concreteInstance.GetType();
            
            // Set the _numberOfTiles field using reflection
            var numberOfTilesField = type.GetField("_numberOfTiles", BindingFlags.NonPublic | BindingFlags.Instance);
            if (numberOfTilesField != null)
            {
                // Make sure we don't exceed the line's capacity
                int actualNumberOfTiles = Math.Min(numberOfTiles, patternLine.Length);
                numberOfTilesField.SetValue(concreteInstance, actualNumberOfTiles);
            }
            
            // Make sure _tileType is null
            var tileTypeField = type.GetField("_tileType", BindingFlags.NonPublic | BindingFlags.Instance);
            if (tileTypeField != null)
            {
                tileTypeField.SetValue(concreteInstance, null);
            }
        }
    }
} 