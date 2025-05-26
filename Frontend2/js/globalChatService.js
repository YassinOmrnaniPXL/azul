import { config } from './config.js';
import { profilePictureService } from './profilePictureService.js';

/**
 * Global Chat Service for Lobby
 * Handles WebSocket connections and chat functionality for the global lobby
 */
class GlobalChatService {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.messageHandlers = new Set();
        this.connectionHandlers = new Set();
        this.errorHandlers = new Set();
        this.currentUser = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
    }

    /**
     * Initialize the global chat service
     * @param {Object} user - Current user information
     */
    async initialize(user) {
        this.currentUser = user;
        await this.connect();
    }

    /**
     * Connect to the global lobby chat
     */
    async connect() {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Create SignalR connection for lobby
            const connectionUrl = `${config.getWebSocketUrl()}?lobby=true&token=${encodeURIComponent(token)}`;
            
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(connectionUrl)
                .withAutomaticReconnect([0, 2000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Set up event handlers
            this.setupEventHandlers();

            // Start the connection
            await this.connection.start();
            console.log('Global chat connected successfully');
            
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.notifyConnectionHandlers('connected');

            // Request lobby history and notify join
            await this.requestLobbyHistory();
            await this.notifyUserJoined();

        } catch (error) {
            console.error('Failed to connect to global chat:', error);
            this.isConnected = false;
            this.notifyErrorHandlers('connection_failed', error.message);
            
            // Attempt reconnection
            this.scheduleReconnect();
        }
    }

    /**
     * Set up SignalR event handlers
     */
    setupEventHandlers() {
        if (!this.connection) return;

        // Handle incoming lobby messages
        this.connection.on('ReceiveLobbyMessage', async (message) => {
            await this.handleIncomingMessage(message);
        });

        // Handle lobby connection confirmation
        this.connection.on('LobbyConnected', (message) => {
            console.log('Lobby connection confirmed:', message);
        });

        // Handle lobby errors
        this.connection.on('LobbyError', (error) => {
            console.error('Lobby error:', error);
            this.notifyErrorHandlers('lobby_error', error);
        });

        // Handle connection state changes
        this.connection.onreconnecting(() => {
            console.log('Global chat reconnecting...');
            this.isConnected = false;
            this.notifyConnectionHandlers('reconnecting');
        });

        this.connection.onreconnected(() => {
            console.log('Global chat reconnected');
            this.isConnected = true;
            this.notifyConnectionHandlers('reconnected');
            this.notifyUserJoined(); // Re-announce presence
        });

        this.connection.onclose(() => {
            console.log('Global chat connection closed');
            this.isConnected = false;
            this.notifyConnectionHandlers('disconnected');
            this.scheduleReconnect();
        });
    }

    /**
     * Handle incoming chat messages
     */
    async handleIncomingMessage(message) {
        try {
            // Normalize property names from camelCase to PascalCase for consistency
            if (message.userId !== undefined) message.UserId = message.userId;
            if (message.displayName !== undefined) message.DisplayName = message.displayName;
            if (message.message !== undefined) message.Message = message.message;
            if (message.timestamp !== undefined) message.Timestamp = message.timestamp;
            if (message.isSystemMessage !== undefined) message.IsSystemMessage = message.isSystemMessage;
            if (message.messageType !== undefined) message.MessageType = message.messageType;
            
            // Debug only for user messages (not system messages)
            if (!message.IsSystemMessage) {
                console.log('=== USER MESSAGE DEBUG ===');
                console.log('Raw message object:', message);
                console.log('DisplayName after normalization:', message.DisplayName);
                console.log('Message after normalization:', message.Message);
                console.log('=== END USER MESSAGE DEBUG ===');
            }

            // Add profile picture if it's a user message
            if (message.UserId && message.UserId !== 'system') {
                try {
                    message.ProfilePictureUrl = await profilePictureService.getProfilePictureUrl(message.UserId);
                } catch (error) {
                    console.warn('Failed to load profile picture for user:', message.UserId, error);
                    message.ProfilePictureUrl = 'images/Default_pfp.jpg';
                }
            }

            // Add formatted timestamp
            message.FormattedTime = this.formatTimestamp(message.Timestamp);

            // Notify all message handlers
            this.notifyMessageHandlers(message);
        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }

    /**
     * Send a message to the global lobby
     * @param {string} message - The message to send
     */
    async sendMessage(message) {
        if (!this.isConnected || !this.connection) {
            throw new Error('Not connected to global chat');
        }

        if (!message || message.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }

        try {
            await this.connection.invoke('SendLobbyMessage', message.trim());
        } catch (error) {
            console.error('Failed to send lobby message:', error);
            this.notifyErrorHandlers('send_failed', error.message);
            throw error;
        }
    }

    /**
     * Notify that user joined the lobby
     */
    async notifyUserJoined() {
        if (!this.isConnected || !this.connection) return;

        try {
            const displayName = this.currentUser?.displayName || this.currentUser?.username || 'Unknown Player';
            await this.connection.invoke('NotifyLobbyUserJoined', displayName);
        } catch (error) {
            console.error('Failed to notify user joined:', error);
        }
    }

    /**
     * Notify that user left the lobby
     */
    async notifyUserLeft() {
        if (!this.isConnected || !this.connection) return;

        try {
            const displayName = this.currentUser?.displayName || this.currentUser?.username || 'Unknown Player';
            await this.connection.invoke('NotifyLobbyUserLeft', displayName);
        } catch (error) {
            console.error('Failed to notify user left:', error);
        }
    }

    /**
     * Request lobby chat history
     */
    async requestLobbyHistory() {
        if (!this.isConnected || !this.connection) return;

        try {
            await this.connection.invoke('RequestLobbyHistory');
        } catch (error) {
            console.error('Failed to request lobby history:', error);
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.notifyErrorHandlers('max_reconnect_attempts', 'Unable to reconnect to chat');
            return;
        }

        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
        this.reconnectAttempts++;

        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    /**
     * Disconnect from global chat
     */
    async disconnect() {
        if (this.connection) {
            try {
                await this.notifyUserLeft();
                await this.connection.stop();
            } catch (error) {
                console.error('Error during disconnect:', error);
            }
            
            this.connection = null;
            this.isConnected = false;
            this.notifyConnectionHandlers('disconnected');
        }
    }

    /**
     * Add a message handler
     * @param {Function} handler - Function to handle incoming messages
     */
    onMessage(handler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler); // Return unsubscribe function
    }

    /**
     * Add a connection state handler
     * @param {Function} handler - Function to handle connection state changes
     */
    onConnectionChange(handler) {
        this.connectionHandlers.add(handler);
        return () => this.connectionHandlers.delete(handler); // Return unsubscribe function
    }

    /**
     * Add an error handler
     * @param {Function} handler - Function to handle errors
     */
    onError(handler) {
        this.errorHandlers.add(handler);
        return () => this.errorHandlers.delete(handler); // Return unsubscribe function
    }

    /**
     * Notify all message handlers
     */
    notifyMessageHandlers(message) {
        this.messageHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        });
    }

    /**
     * Notify all connection handlers
     */
    notifyConnectionHandlers(state) {
        this.connectionHandlers.forEach(handler => {
            try {
                handler(state);
            } catch (error) {
                console.error('Error in connection handler:', error);
            }
        });
    }

    /**
     * Notify all error handlers
     */
    notifyErrorHandlers(type, message) {
        this.errorHandlers.forEach(handler => {
            try {
                handler(type, message);
            } catch (error) {
                console.error('Error in error handler:', error);
            }
        });
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        if (!timestamp) {
            return 'just now';
        }

        let date;
        try {
            // Handle different timestamp formats
            if (typeof timestamp === 'string') {
                // Handle .NET DateTime formats
                if (timestamp.includes('T') && (timestamp.includes('Z') || timestamp.includes('+'))) {
                    date = new Date(timestamp);
                } else if (timestamp.match(/^\d{4}-\d{2}-\d{2}/)) {
                    date = new Date(timestamp);
                } else {
                    date = new Date(timestamp);
                }
            } else if (typeof timestamp === 'number') {
                date = new Date(timestamp);
            } else {
                date = new Date();
            }

            if (isNaN(date.getTime())) {
                return 'just now';
            }

            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);

            if (diffMins < 1) {
                return 'just now';
            } else if (diffMins < 60) {
                return `${diffMins}m ago`;
            } else if (diffHours < 24) {
                return `${diffHours}h ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            return 'just now';
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
        };
    }

    /**
     * Clear all handlers (useful for cleanup)
     */
    clearAllHandlers() {
        this.messageHandlers.clear();
        this.connectionHandlers.clear();
        this.errorHandlers.clear();
    }
}

// Create and export singleton instance
export const globalChatService = new GlobalChatService(); 