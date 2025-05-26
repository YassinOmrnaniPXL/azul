using System;
using System.Threading.Tasks;
using Azul.Api.WS; // Updated: For IGameEventBus and GameStateChangedEventArgs from within Api project
using Azul.Core.GameAggregate.Contracts; // For IGameService and IGame
using Azul.Core.TileFactoryAggregate.Contracts; // For TileType
using Azul.Api.Models.Output;
using AutoMapper; 
using Microsoft.AspNetCore.SignalR; // Added for IHubContext
using Azul.Api.Hubs; // Added for GameWebSocketHub

namespace Azul.Api.WS.Decorators // Updated namespace
{
    public class GameServiceRealtimeDecorator : IGameService
    {
        private readonly IGameService _decoratedService;
        private readonly IGameEventBus _eventBus;
        private readonly IMapper _mapper; 
        private readonly IHubContext<GameWebSocketHub> _hubContext;

        public GameServiceRealtimeDecorator(
            IGameService decoratedService, 
            IGameEventBus eventBus, 
            IMapper mapper,
            IHubContext<GameWebSocketHub> hubContext)
        {
            _decoratedService = decoratedService;
            _eventBus = eventBus;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        public IGame GetGame(Guid gameId)
        {
            return _decoratedService.GetGame(gameId);
        }

        public async Task TakeTilesFromFactoryAsync(Guid gameId, Guid playerId, Guid displayId, TileType tileType)
        {
            _decoratedService.TakeTilesFromFactory(gameId, playerId, displayId, tileType);
            await PublishAndBroadcastGameStateUpdateAsync(gameId);
        }

        public void TakeTilesFromFactory(Guid gameId, Guid playerId, Guid displayId, TileType tileType)
        {
            _decoratedService.TakeTilesFromFactory(gameId, playerId, displayId, tileType);
            _ = PublishAndBroadcastGameStateUpdateAsync(gameId); 
        }

        public async Task PlaceTilesOnPatternLineAsync(Guid gameId, Guid playerId, int patternLineIndex)
        {
            _decoratedService.PlaceTilesOnPatternLine(gameId, playerId, patternLineIndex);
            await PublishAndBroadcastGameStateUpdateAsync(gameId);
        }

        public void PlaceTilesOnPatternLine(Guid gameId, Guid playerId, int patternLineIndex)
        {
            _decoratedService.PlaceTilesOnPatternLine(gameId, playerId, patternLineIndex);
            _ = PublishAndBroadcastGameStateUpdateAsync(gameId);
        }

        public async Task PlaceTilesOnFloorLineAsync(Guid gameId, Guid playerId)
        {
            _decoratedService.PlaceTilesOnFloorLine(gameId, playerId);
            await PublishAndBroadcastGameStateUpdateAsync(gameId);
        }

        public void PlaceTilesOnFloorLine(Guid gameId, Guid playerId)
        {
            _decoratedService.PlaceTilesOnFloorLine(gameId, playerId);
            _ = PublishAndBroadcastGameStateUpdateAsync(gameId);
        }

        private async Task PublishAndBroadcastGameStateUpdateAsync(Guid gameId)
        {
            try
            {
                IGame updatedGame = _decoratedService.GetGame(gameId);
                GameModel gameModel = _mapper.Map<GameModel>(updatedGame); 
                
                // 1. Publish to the event bus (existing behavior)
                var eventArgs = new GameStateChangedEventArgs(gameId, gameModel);
                await _eventBus.PublishAsync(eventArgs);

                // 2. Broadcast to WebSocket clients via SignalR HubContext
                if (_hubContext != null)
                {
                    Console.WriteLine($"[GameServiceRealtimeDecorator] Broadcasting 'GameStateUpdate' for gameId: {gameId}. Round: {gameModel?.RoundNumber}. PlayerToPlayId: {gameModel?.PlayerToPlayId}. Message sent to SignalR group: {gameId.ToString()}");
                    await _hubContext.Clients.Group(gameId.ToString()).SendAsync("GameStateUpdate", gameModel);
                    Console.WriteLine($"[GameServiceRealtimeDecorator] Successfully SENT 'GameStateUpdate' for gameId: {gameId} to SignalR group.");
                }
                else
                {
                    Console.WriteLine($"[GameServiceRealtimeDecorator] _hubContext is null. Cannot broadcast for game {gameId}.");
                }
            }
            catch (Exception ex) 
            {
                Console.WriteLine($"[GameServiceRealtimeDecorator] CRITICAL ERROR in PublishAndBroadcastGameStateUpdateAsync for game {gameId}: {ex.ToString()}");
            }
        }
    }
} 