using System;
using System.Threading.Tasks;

namespace Azul.Api.WS
{
    public interface IGameEventBus
    {
        Task PublishAsync(GameStateChangedEventArgs eventArgs);
        void Subscribe(Guid gameId, Func<GameStateChangedEventArgs, Task> handler);
        void Unsubscribe(Guid gameId, Func<GameStateChangedEventArgs, Task> handler);
    }
} 