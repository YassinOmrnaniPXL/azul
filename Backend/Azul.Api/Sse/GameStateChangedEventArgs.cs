using System;
using Azul.Api.Models.Output;

namespace Azul.Api.WS // Updated namespace
{
    public class GameStateChangedEventArgs : EventArgs
    {
        public Guid GameId { get; }
        public GameModel GameState { get; } 

        public GameStateChangedEventArgs(Guid gameId, GameModel gameState)
        {
            GameId = gameId;
            GameState = gameState;
        }
    }
} 