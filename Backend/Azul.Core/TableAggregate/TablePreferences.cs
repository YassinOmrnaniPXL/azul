using Azul.Core.TableAggregate.Contracts;
using System.ComponentModel;

namespace Azul.Core.TableAggregate
{
    /// <inheritdoc cref="ITablePreferences"/>
    public class TablePreferences : ITablePreferences
    {

        [DefaultValue(2)]
        public int NumberOfPlayers { get; set; } = 2;

        [DefaultValue(0)]
        public int NumberOfArtificialPlayers { get; set; } = 0;

        public int NumberOfFactoryDisplays // aantal factories voor aantal spelers, 2 spelers zijn 5 rondjes, 3 = 7 en 4 = 9
        {
            get
            {
                if (NumberOfPlayers < 2 || NumberOfPlayers > 4)
                {
                    throw new InvalidOperationException($"Unsupported player count: {NumberOfPlayers}");
                }

                return NumberOfPlayers * 2 + 1;
            }
        }



        //DO NOT CHANGE THE CODE BELOW, unless (maybe) when you are working on EXTRA requirements
        public override bool Equals(object other)
        {
            if (other is ITablePreferences otherPreferences)
            {
                if( NumberOfPlayers != otherPreferences.NumberOfPlayers) return false;
                if (NumberOfArtificialPlayers != otherPreferences.NumberOfArtificialPlayers) return false;
            }
            return true;
        }

        public override int GetHashCode()
        {
            return NumberOfPlayers.GetHashCode();
        }
    }
}
