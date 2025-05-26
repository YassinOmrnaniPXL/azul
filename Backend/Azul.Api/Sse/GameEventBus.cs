using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging; // Optional: for logging

namespace Azul.Api.WS // Updated namespace
{
    public class GameEventBus : IGameEventBus
    {
        // Key: GameId, Value: List of subscriber handlers for that game
        private readonly ConcurrentDictionary<Guid, List<Func<GameStateChangedEventArgs, Task>>> _subscriptions;
        private readonly ILogger<GameEventBus> _logger; // Optional

        public GameEventBus(ILogger<GameEventBus> logger) // Optional: Inject logger
        {
            _subscriptions = new ConcurrentDictionary<Guid, List<Func<GameStateChangedEventArgs, Task>>>();
            _logger = logger;
        }

        public Task PublishAsync(GameStateChangedEventArgs eventArgs)
        {
            if (_subscriptions.TryGetValue(eventArgs.GameId, out var handlers))
            {
                // _logger?.LogInformation($"Publishing game state change for game {eventArgs.GameId} to {handlers.Count} subscribers.");
                var tasks = handlers.Select(handler => handler(eventArgs));
                return Task.WhenAll(tasks);
            }
            // _logger?.LogInformation($"No subscribers for game {eventArgs.GameId} during publish.");
            return Task.CompletedTask;
        }

        public void Subscribe(Guid gameId, Func<GameStateChangedEventArgs, Task> handler)
        {
            _subscriptions.AddOrUpdate(gameId,
                // Add new list if gameId doesn't exist
                _ => new List<Func<GameStateChangedEventArgs, Task>> { handler },
                // Update existing list if gameId exists
                (_, existingHandlers) =>
                {
                    lock (existingHandlers) // Ensure thread safety when modifying the list
                    {
                        if (!existingHandlers.Contains(handler))
                        {
                            existingHandlers.Add(handler);
                        }
                    }
                    return existingHandlers;
                });
            // _logger?.LogInformation($"Handler subscribed for game {gameId}.");
        }

        public void Unsubscribe(Guid gameId, Func<GameStateChangedEventArgs, Task> handler)
        {
            if (_subscriptions.TryGetValue(gameId, out var handlers))
            {
                lock (handlers) // Ensure thread safety when modifying the list
                {
                    handlers.Remove(handler);
                }
                // Optional: Remove the gameId from dictionary if no handlers are left, to prevent memory leaks
                if (!handlers.Any())
                {
                    _subscriptions.TryRemove(gameId, out _);
                    // _logger?.LogInformation($"Removed game {gameId} from subscriptions as no handlers left.");
                }
                // _logger?.LogInformation($"Handler unsubscribed for game {gameId}.");
            }
        }
    }
} 