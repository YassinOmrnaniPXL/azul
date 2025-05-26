using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using Azul.Api.WS; // For IGameEventBus and GameStateChangedEventArgs
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization; // For [Authorize]
using System.Security.Claims;

namespace Azul.Api.Hubs
{
    // [Authorize] // Add JWT authorization if needed for the hub itself
    public class GameWebSocketHub : Hub
    {
        private readonly IGameEventBus _eventBus;
        private readonly ILogger<GameWebSocketHub> _logger;
        // private static readonly ConcurrentDictionary<Guid, HashSet<string>> _gameSubscriptions = new ConcurrentDictionary<Guid, HashSet<string>>();

        public GameWebSocketHub(IGameEventBus eventBus, ILogger<GameWebSocketHub> logger)
        {
            _eventBus = eventBus;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var gameIdString = httpContext?.Request.Query["gameId"].ToString();
            var lobbyMode = httpContext?.Request.Query["lobby"].ToString();
            var token = httpContext?.Request.Query["token"].ToString(); // Token is primarily for auth middleware

            _logger.LogInformation($"WebSocket client trying to connect. ConnectionId: {Context.ConnectionId}. GameId from query: {gameIdString}, Lobby mode: {lobbyMode}");

            // Handle lobby connections (global chat)
            if (!string.IsNullOrEmpty(lobbyMode) && lobbyMode.ToLower() == "true")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "GlobalLobby");
                _logger.LogInformation($"Client {Context.ConnectionId} connected to GlobalLobby group.");
                
                // Send welcome message to the user
                await Clients.Caller.SendAsync("LobbyConnected", "Connected to global lobby chat");
            }
            // Handle game connections (existing functionality)
            else if (Guid.TryParse(gameIdString, out Guid gameId) && gameId != Guid.Empty)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, gameId.ToString());
                _logger.LogInformation($"Client {Context.ConnectionId} connected to group {gameId}.");
                
                // Potentially subscribe to event bus here if managing subscriptions per game dynamically
                // For simplicity, the decorator GameServiceSseDecorator handles publishing to the bus,
                // and the hub, once registered as a listener to that bus (globally or via DI scope),
                // will filter and forward messages.
                // Let's assume for now GameServiceSseDecorator always publishes, and the hub needs a way to get these.
                // The simplest approach is to have GameEventBus handle the fan-out, and the hub gets relevant messages if it subscribes.
                // Consider a shared service that the hub uses to subscribe to the event bus or directly receive GameStateChangedEvents.

                // Example: Send a welcome message or initial state if needed (though frontend fetches initial state via REST)
                // await Clients.Caller.SendAsync("HubMessage", "Welcome to the game hub!");
            }
            else
            {
                _logger.LogWarning($"Client {Context.ConnectionId} connected without valid gameId or lobby mode. Closing connection.");
                Context.Abort(); // Close connection if no valid gameId or lobby mode
                return;
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // No explicit group removal needed, SignalR handles this.
            // However, if we were managing dynamic subscriptions to IGameEventBus per gameId, we'd unsubscribe here
            // if this was the last client for a particular gameId.
            _logger.LogInformation($"Client {Context.ConnectionId} disconnected. Exception: {exception?.Message}");
            await base.OnDisconnectedAsync(exception);
        }

        // Method to be called by the client for ping
        public async Task Ping(string message)
        {
            _logger.LogInformation($"Ping received from {Context.ConnectionId}: {message}");
            // Optionally send a pong back
            await Clients.Caller.SendAsync("Pong", "Server acknowledges ping from " + Context.ConnectionId);
        }

        // === CHAT FUNCTIONALITY ===
        
        /// <summary>
        /// Handles chat messages sent by clients
        /// </summary>
        /// <param name="message">The chat message content</param>
        /// <param name="playerName">The name of the player sending the message</param>
        public async Task SendChatMessage(string message, string playerName = null)
        {
            try
            {
                // Get gameId from connection context (from the query parameter when connected)
                var httpContext = Context.GetHttpContext();
                var gameIdString = httpContext?.Request.Query["gameId"].ToString();
                
                // Use provided player name or fallback
                if (string.IsNullOrWhiteSpace(playerName))
                {
                    playerName = "Unknown Player";
                    // Try to get from claims as fallback
                    if (Context.User?.Identity?.IsAuthenticated == true)
                    {
                        var nameClaim = Context.User.FindFirst(ClaimTypes.Name) ?? 
                                       Context.User.FindFirst("name") ?? 
                                       Context.User.FindFirst("username");
                        if (nameClaim != null)
                        {
                            playerName = nameClaim.Value;
                        }
                    }
                }
                
                // Validate inputs
                if (string.IsNullOrWhiteSpace(gameIdString) || string.IsNullOrWhiteSpace(message))
                {
                    _logger.LogWarning($"Invalid chat message from {Context.ConnectionId}: gameId={gameIdString}, message={message}");
                    await Clients.Caller.SendAsync("ChatError", "Invalid message or game session");
                    return;
                }

                // Sanitize message (basic protection)
                var sanitizedMessage = message.Trim();
                if (sanitizedMessage.Length > 500) // Limit message length
                {
                    sanitizedMessage = sanitizedMessage.Substring(0, 500);
                }

                // Create chat message object
                var chatMessage = new
                {
                    GameId = gameIdString,
                    PlayerName = playerName,
                    Message = sanitizedMessage,
                    Timestamp = DateTime.UtcNow,
                    ConnectionId = Context.ConnectionId
                };

                _logger.LogInformation($"Chat message from {playerName} in game {gameIdString}: {sanitizedMessage}");

                // Broadcast to all clients in the game group
                await Clients.Group(gameIdString).SendAsync("ReceiveChatMessage", chatMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling chat message from {Context.ConnectionId}");
                await Clients.Caller.SendAsync("ChatError", "Failed to send message");
            }
        }

        /// <summary>
        /// Handles player join notifications for chat
        /// </summary>
        /// <param name="gameId">The game ID</param>
        /// <param name="playerName">The name of the player who joined</param>
        public async Task NotifyPlayerJoined(string gameId, string playerName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(gameId) || string.IsNullOrWhiteSpace(playerName))
                {
                    return;
                }

                var joinMessage = new
                {
                    GameId = gameId,
                    PlayerName = "System",
                    Message = $"{playerName} joined the game",
                    Timestamp = DateTime.UtcNow,
                    IsSystemMessage = true,
                    MessageType = "player_joined"
                };

                _logger.LogInformation($"Player {playerName} joined game {gameId}");
                await Clients.Group(gameId).SendAsync("ChatMessage", joinMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error notifying player joined for {Context.ConnectionId}");
            }
        }

        /// <summary>
        /// Handles player leave notifications for chat
        /// </summary>
        /// <param name="gameId">The game ID</param>
        /// <param name="playerName">The name of the player who left</param>
        public async Task NotifyPlayerLeft(string gameId, string playerName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(gameId) || string.IsNullOrWhiteSpace(playerName))
                {
                    return;
                }

                var leaveMessage = new
                {
                    GameId = gameId,
                    PlayerName = "System",
                    Message = $"{playerName} left the game",
                    Timestamp = DateTime.UtcNow,
                    IsSystemMessage = true,
                    MessageType = "player_left"
                };

                _logger.LogInformation($"Player {playerName} left game {gameId}");
                await Clients.Group(gameId).SendAsync("ChatMessage", leaveMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error notifying player left for {Context.ConnectionId}");
            }
        }

        // This method will be called by the GameEventBus (or a service listening to it)
        // when a game state changes. This is NOT a client-callable hub method.
        // This assumes the Hub itself is a listener on the event bus, or a mediating service calls this.
        // For a simple integration, GameServiceSseDecorator publishes to IGameEventBus.
        // The Hub needs to get these events. One way: inject IGameEventBus and have the hub subscribe itself (e.g. in constructor or a singleton service).
        // However, direct subscription here is tricky with hub lifecycle. 
        // A better pattern: a hosted service listens to IGameEventBus and uses IHubContext<GameWebSocketHub> to send messages.
        // For "least invasive", we'll try to make the decorator work with a hub context, or have the hub context injected and used by the decorator.
        // Let's keep the decorator publishing to the bus, and create a separate hosted service to bridge bus to hub.

        // Placeholder for how the hub might send updates. The actual sending will be triggered by GameEventBus.
        // public async Task BroadcastGameState(Guid gameId, object gameState)
        // {
        // _logger.LogInformation($"Broadcasting game state for {gameId} to group.");
        //     await Clients.Group(gameId.ToString()).SendAsync("GameStateUpdate", gameState);
        // }

        // === GLOBAL LOBBY CHAT FUNCTIONALITY ===

        /// <summary>
        /// Handles global lobby chat messages sent by clients
        /// </summary>
        /// <param name="message">The chat message content</param>
        public async Task SendLobbyMessage(string message)
        {
            try
            {
                // Get user information from claims
                var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                // Debug: Log all available claims
                if (Context.User?.Claims != null)
                {
                    _logger.LogInformation("Available claims for user:");
                    foreach (var claim in Context.User.Claims)
                    {
                        _logger.LogInformation($"  Claim Type: {claim.Type}, Value: {claim.Value}");
                    }
                }
                
                // Get display name from claims - look for the NameIdentifier claim with the username (not the GUID)
                var nameIdentifierClaims = Context.User?.FindAll(ClaimTypes.NameIdentifier)?.ToList();
                string displayName = "Unknown Player";
                
                if (nameIdentifierClaims != null && nameIdentifierClaims.Count > 1)
                {
                    // The second NameIdentifier claim contains the username
                    displayName = nameIdentifierClaims[1].Value;
                }
                else
                {
                    // Fallback to other claim types
                    displayName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? 
                                 Context.User?.FindFirst("sub")?.Value ?? 
                                 Context.User?.FindFirst("name")?.Value ?? 
                                 Context.User?.FindFirst("username")?.Value ?? 
                                 "Unknown Player";
                }

                // Validate inputs
                if (string.IsNullOrWhiteSpace(message))
                {
                    _logger.LogWarning($"Empty lobby message from {Context.ConnectionId}");
                    await Clients.Caller.SendAsync("LobbyError", "Message cannot be empty");
                    return;
                }

                // Sanitize message (basic protection)
                var sanitizedMessage = message.Trim();
                if (sanitizedMessage.Length > 500) // Same limit as game chat
                {
                    sanitizedMessage = sanitizedMessage.Substring(0, 500);
                }

                // Create lobby chat message object
                var lobbyMessage = new
                {
                    UserId = userId,
                    DisplayName = displayName,
                    Message = sanitizedMessage,
                    Timestamp = DateTime.UtcNow,
                    ConnectionId = Context.ConnectionId,
                    MessageType = "user_message"
                };

                _logger.LogInformation($"Lobby chat message from {displayName} ({userId}): {sanitizedMessage}");

                // Broadcast to all clients in the global lobby
                await Clients.Group("GlobalLobby").SendAsync("ReceiveLobbyMessage", lobbyMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling lobby message from {Context.ConnectionId}");
                await Clients.Caller.SendAsync("LobbyError", "Failed to send message");
            }
        }

        /// <summary>
        /// Handles user join notifications for lobby chat
        /// </summary>
        /// <param name="displayName">The display name of the user who joined</param>
        public async Task NotifyLobbyUserJoined(string displayName = null)
        {
            try
            {
                // Get user information from claims if not provided
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    var nameIdentifierClaims = Context.User?.FindAll(ClaimTypes.NameIdentifier)?.ToList();
                    if (nameIdentifierClaims != null && nameIdentifierClaims.Count > 1)
                    {
                        displayName = nameIdentifierClaims[1].Value;
                    }
                    else
                    {
                        displayName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? 
                                     Context.User?.FindFirst("sub")?.Value ?? 
                                     Context.User?.FindFirst("name")?.Value ?? 
                                     Context.User?.FindFirst("username")?.Value ?? 
                                     "Unknown Player";
                    }
                }

                var joinMessage = new
                {
                    UserId = "system",
                    DisplayName = "System",
                    Message = $"{displayName} joined the lobby",
                    Timestamp = DateTime.UtcNow,
                    IsSystemMessage = true,
                    MessageType = "user_joined"
                };

                _logger.LogInformation($"User {displayName} joined the lobby");
                await Clients.Group("GlobalLobby").SendAsync("ReceiveLobbyMessage", joinMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error notifying lobby user joined for {Context.ConnectionId}");
            }
        }

        /// <summary>
        /// Handles user leave notifications for lobby chat
        /// </summary>
        /// <param name="displayName">The display name of the user who left</param>
        public async Task NotifyLobbyUserLeft(string displayName = null)
        {
            try
            {
                // Get user information from claims if not provided
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    var nameIdentifierClaims = Context.User?.FindAll(ClaimTypes.NameIdentifier)?.ToList();
                    if (nameIdentifierClaims != null && nameIdentifierClaims.Count > 1)
                    {
                        displayName = nameIdentifierClaims[1].Value;
                    }
                    else
                    {
                        displayName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? 
                                     Context.User?.FindFirst("sub")?.Value ?? 
                                     Context.User?.FindFirst("name")?.Value ?? 
                                     Context.User?.FindFirst("username")?.Value ?? 
                                     "Unknown Player";
                    }
                }

                var leaveMessage = new
                {
                    UserId = "system",
                    DisplayName = "System",
                    Message = $"{displayName} left the lobby",
                    Timestamp = DateTime.UtcNow,
                    IsSystemMessage = true,
                    MessageType = "user_left"
                };

                _logger.LogInformation($"User {displayName} left the lobby");
                await Clients.Group("GlobalLobby").SendAsync("ReceiveLobbyMessage", leaveMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error notifying lobby user left for {Context.ConnectionId}");
            }
        }

        /// <summary>
        /// Gets recent lobby chat messages for newly connected users
        /// </summary>
        public async Task RequestLobbyHistory()
        {
            try
            {
                // For now, we'll send a simple welcome message
                // In a production system, you'd fetch recent messages from a database or cache
                var welcomeMessage = new
                {
                    UserId = "system",
                    DisplayName = "System",
                    Message = "Welcome to the Azul lobby! Chat with other players while waiting for games.",
                    Timestamp = DateTime.UtcNow,
                    IsSystemMessage = true,
                    MessageType = "welcome"
                };

                await Clients.Caller.SendAsync("ReceiveLobbyMessage", welcomeMessage);
                _logger.LogInformation($"Sent lobby history to {Context.ConnectionId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending lobby history to {Context.ConnectionId}");
            }
        }

        // === FRIEND SYSTEM FUNCTIONALITY ===

        /// <summary>
        /// Handles private messages between friends
        /// </summary>
        /// <param name="toUserId">The ID of the friend to send the message to</param>
        /// <param name="message">The message content</param>
        public async Task SendPrivateMessage(string toUserId, string message)
        {
            try
            {
                // Get sender information from claims
                var fromUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var nameIdentifierClaims = Context.User?.FindAll(ClaimTypes.NameIdentifier)?.ToList();
                string displayName = "Unknown Player";
                
                if (nameIdentifierClaims != null && nameIdentifierClaims.Count > 1)
                {
                    displayName = nameIdentifierClaims[1].Value;
                }

                // Validate inputs
                if (string.IsNullOrWhiteSpace(toUserId) || string.IsNullOrWhiteSpace(message) || string.IsNullOrWhiteSpace(fromUserId))
                {
                    _logger.LogWarning($"Invalid private message from {Context.ConnectionId}: toUserId={toUserId}, message={message}, fromUserId={fromUserId}");
                    await Clients.Caller.SendAsync("PrivateMessageError", "Invalid message or recipient");
                    return;
                }

                // Sanitize message
                var sanitizedMessage = message.Trim();
                if (sanitizedMessage.Length > 1000)
                {
                    sanitizedMessage = sanitizedMessage.Substring(0, 1000);
                }

                // Create private message object
                var privateMessage = new
                {
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    FromDisplayName = displayName,
                    Message = sanitizedMessage,
                    Timestamp = DateTime.UtcNow,
                    MessageType = "private_message"
                };

                _logger.LogInformation($"Private message from {displayName} ({fromUserId}) to {toUserId}: {sanitizedMessage}");

                // Send to specific user (if they're connected)
                await Clients.User(toUserId).SendAsync("ReceivePrivateMessage", privateMessage);
                
                // Send confirmation back to sender
                await Clients.Caller.SendAsync("PrivateMessageSent", privateMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling private message from {Context.ConnectionId}");
                await Clients.Caller.SendAsync("PrivateMessageError", "Failed to send message");
            }
        }

        /// <summary>
        /// Notifies a user about a new friend request
        /// </summary>
        /// <param name="toUserId">The ID of the user receiving the friend request</param>
        /// <param name="fromDisplayName">The display name of the user sending the request</param>
        /// <param name="friendshipId">The ID of the friendship record</param>
        public async Task NotifyFriendRequest(string toUserId, string fromDisplayName, string friendshipId)
        {
            try
            {
                var notification = new
                {
                    Type = "friend_request",
                    FromDisplayName = fromDisplayName,
                    FriendshipId = friendshipId,
                    Timestamp = DateTime.UtcNow,
                    Message = $"{fromDisplayName} sent you a friend request"
                };

                _logger.LogInformation($"Friend request notification sent to {toUserId} from {fromDisplayName}");
                await Clients.User(toUserId).SendAsync("FriendNotification", notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending friend request notification: {ex.Message}");
            }
        }

        /// <summary>
        /// Notifies a user that their friend request was accepted
        /// </summary>
        /// <param name="toUserId">The ID of the user who sent the original request</param>
        /// <param name="fromDisplayName">The display name of the user who accepted</param>
        public async Task NotifyFriendRequestAccepted(string toUserId, string fromDisplayName)
        {
            try
            {
                var notification = new
                {
                    Type = "friend_request_accepted",
                    FromDisplayName = fromDisplayName,
                    Timestamp = DateTime.UtcNow,
                    Message = $"{fromDisplayName} accepted your friend request"
                };

                _logger.LogInformation($"Friend request accepted notification sent to {toUserId} from {fromDisplayName}");
                await Clients.User(toUserId).SendAsync("FriendNotification", notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending friend request accepted notification: {ex.Message}");
            }
        }

        /// <summary>
        /// Notifies a user about a game invitation from a friend
        /// </summary>
        /// <param name="toUserId">The ID of the user receiving the invitation</param>
        /// <param name="fromDisplayName">The display name of the user sending the invitation</param>
        /// <param name="invitationId">The ID of the game invitation</param>
        /// <param name="tableId">The ID of the game table</param>
        /// <param name="message">Optional message with the invitation</param>
        public async Task NotifyGameInvitation(string toUserId, string fromDisplayName, string invitationId, string tableId, string message = null)
        {
            try
            {
                var notification = new
                {
                    Type = "game_invitation",
                    FromDisplayName = fromDisplayName,
                    InvitationId = invitationId,
                    TableId = tableId,
                    Message = message,
                    Timestamp = DateTime.UtcNow,
                    NotificationMessage = $"{fromDisplayName} invited you to join a game"
                };

                _logger.LogInformation($"Game invitation notification sent to {toUserId} from {fromDisplayName} for table {tableId}");
                await Clients.User(toUserId).SendAsync("GameInvitationNotification", notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending game invitation notification: {ex.Message}");
            }
        }

        /// <summary>
        /// Notifies a user that their game invitation was accepted
        /// </summary>
        /// <param name="toUserId">The ID of the user who sent the invitation</param>
        /// <param name="fromDisplayName">The display name of the user who accepted</param>
        /// <param name="tableId">The ID of the game table</param>
        public async Task NotifyGameInvitationAccepted(string toUserId, string fromDisplayName, string tableId)
        {
            try
            {
                var notification = new
                {
                    Type = "game_invitation_accepted",
                    FromDisplayName = fromDisplayName,
                    TableId = tableId,
                    Timestamp = DateTime.UtcNow,
                    Message = $"{fromDisplayName} accepted your game invitation"
                };

                _logger.LogInformation($"Game invitation accepted notification sent to {toUserId} from {fromDisplayName}");
                await Clients.User(toUserId).SendAsync("GameInvitationNotification", notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending game invitation accepted notification: {ex.Message}");
            }
        }
    }
} 