/**
 * wsClient.js
 * Manages SignalR connections for real-time game updates.
 */
import { API_BASE_URL, USE_WEBSOCKETS } from './config.js';
// Import the UMD module to ensure it executes and potentially attaches to window
import "../node_modules/@microsoft/signalr/dist/browser/signalr.js"; 
import { showConnectionStatus, logDebug } from './gameRenderer.js';

// Access SignalR functionalities via the global window object
// UMD builds like signalr.js often attach their main object (e.g., signalR) to window when no other module system is detected.
const signalR = window.signalR;

console.log("Inspecting signalRModule:", signalR);

let connection = null; // Stores the SignalR HubConnection
let currentSubscribedGameId = null;
let signalRHubUrl = null;

let onMessageCallback = null; // For GameStateUpdate
let onErrorCallback = null;   // For general connection errors relayed to game.js
let onOpenCallback = null;    // When connection is established
let onCloseCallback = null;   // When connection is closed (passed from game.js)

// Keep-alive ping (client to server)
let pingIntervalId = null;
const PING_INTERVAL_MS = 25000; // Send a ping every 25 seconds

/**
 * Subscribes to game events for a specific game ID using SignalR.
 * @param {string} gameId - The ID of the game to subscribe to.
 * @param {function} msgCb - Function to call when a "GameStateUpdate" message is received.
 * @param {function} openCb - Function to call when the connection is successfully opened.
 * @param {function} errorCb - Function to call when a connection error occurs.
 * @param {function} closeCb - Function to call when the connection closes.
 */
export async function subscribe(gameId, msgCb, openCb, errorCb, closeCb) {
    if (!USE_WEBSOCKETS) {
        logDebug('WS_CLIENT', 'Subscription ignored: WebSockets disabled by configuration');
        if (errorCb) {
            errorCb(new Error('WebSockets (SignalR) disabled by configuration'));
        }
        return;
    }

    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        logDebug('WS_CLIENT', 'Attempting to subscribe while already connected. Unsubscribing first...', { oldGameId: currentSubscribedGameId, newGameId: gameId });
        await unsubscribe(); // Cleanly close existing before opening new
    } else if (connection) {
        logDebug('WS_CLIENT', 'Connection exists but not connected. Stopping before new subscription.', { state: connection.state });
        await unsubscribe(); // Ensure any lingering connection is stopped
    }

    if (!signalR || !signalR.HubConnectionBuilder) {
        console.error("[SignalR] HubConnectionBuilder not found on window.signalR. Ensure signalr.js is loaded and window.signalR is populated.", window.signalR);
        logDebug('WS_CLIENT', 'SignalR library not loaded correctly on window.signalR. HubConnectionBuilder is missing.');
        if (onErrorCallback) {
            onErrorCallback(new Error('SignalR library failed to load.'));
        }
        return;
    }

    currentSubscribedGameId = gameId;
    onMessageCallback = msgCb;
    onOpenCallback = openCb;
    onErrorCallback = errorCb;
    onCloseCallback = closeCb;

    const token = sessionStorage.getItem('token');
    // Construct the HUB URL using HTTPS directly from API_BASE_URL
    // The SignalR client will handle negotiation over HTTPS and then connect via WSS.
    const negotiationUrl = `${API_BASE_URL}/gamehub`; // API_BASE_URL should be https://...
    
    let queryParams = `?gameId=${encodeURIComponent(currentSubscribedGameId)}`;
    if (token) {
        queryParams += `&access_token=${encodeURIComponent(token)}`;
    }
    
    const hubUrlWithParamsForNegotiation = negotiationUrl + queryParams;

    // This is the URL that will be used by SignalR to start the connection process.
    // For WebSockets, it will first do an HTTP(S) request to a negotiate endpoint.
    // The actual WebSocket connection (ws:// or wss://) URL is derived from this by the client.
    signalRHubUrl = hubUrlWithParamsForNegotiation; // For logging or diagnostics if needed

    logDebug('WS_CLIENT', `Attempting to connect to SignalR hub (negotiation URL: ${signalRHubUrl})`);

    connection = new signalR.HubConnectionBuilder()
        .withUrl(signalRHubUrl, { // Pass the HTTPS URL here
            // accessTokenFactory: () => token // Token is in query string
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000]) // Retry times in ms, then gives up
        .configureLogging(signalR.LogLevel.Trace) // CHANGED to Trace for maximum verbosity
        .build();

    // Register handler for receiving game state updates from the server
    connection.on("GameStateUpdate", (gameState) => {
        if (onMessageCallback) {
            if (gameState.gameId && gameState.gameId !== currentSubscribedGameId) {
                console.warn(`[SignalR] Received GameStateUpdate for a different game. Expected: ${currentSubscribedGameId}, Received: ${gameState.gameId}`);
                logDebug('WS_CLIENT', `ERROR: GameStateUpdate for wrong game: ${gameState.gameId}`);
                return;
            }
            onMessageCallback(gameState); // Pass the already deserialized game state object
        }
    });

    // Handle connection open
    // Note: onOpenCallback is called after connection.start() succeeds.

    // Handle connection close
    connection.onclose((error) => {
        logDebug('WS_CLIENT', 'SignalR connection closed.', { error: error ? error.message : 'No error details' });
        stopPing();
        if (onCloseCallback) {
            // Pass a simulated CloseEvent-like object or just the error if present
            // The original `event` in native WebSocket was a CloseEvent.
            // For SignalR, error will be undefined if closed cleanly, or an Error object if due to an issue (including reconnect failures).
            const mockCloseEvent = {
                wasClean: !error, // If error is undefined/null, assume clean closure
                code: error ? 1006 : 1000, // Simulate codes: 1006 for error, 1000 for clean
                reason: error ? error.message : 'SignalR connection closed.',
                error: error // Keep the original error if any
            };
            onCloseCallback(mockCloseEvent);
        }
        // game.js will decide if fallback to polling is needed based on this callback.
    });

    // Handle automatic reconnection events (optional, for more detailed logging/UI updates)
    connection.onreconnecting((error) => {
        logDebug('WS_CLIENT', 'SignalR connection reconnecting...', { error: error ? error.message : 'Retrying connection' });
        if (onErrorCallback) {
            onErrorCallback(new Error('Connection lost, attempting to reconnect...'));
        }
    });

    connection.onreconnected((connectionId) => {
        logDebug('WS_CLIENT', 'SignalR connection reconnected.', { newConnectionId: connectionId });
        if (onOpenCallback) {
            onOpenCallback(); // Or pass some event-like object if needed
        }
        startPing(); // Restart ping on successful reconnect
    });

    try {
        await connection.start();
        logDebug('WS_CLIENT', 'SignalR connection started successfully.');
        if (onOpenCallback) {
            onOpenCallback();
        }
        startPing(); // Start pinging once connected
    } catch (err) {
        logDebug('WS_CLIENT', 'Failed to start SignalR connection: ' + err.message, { error: err });
        if (onErrorCallback) {
            onErrorCallback(err);
        }
        // If connection.start() fails, onclose might not be triggered or might be triggered with an error.
        // The automatic reconnect might kick in if configured and failure is transient.
        // If it fails definitively here, onCloseCallback should also be triggered by SignalR or by us.
        // For robustness, ensure onCloseCallback is called if start() fails and no reconnect is attempted.
        if (connection.state !== signalR.HubConnectionState.Connected && 
            connection.state !== signalR.HubConnectionState.Connecting && 
            connection.state !== signalR.HubConnectionState.Reconnecting) {
            if (onCloseCallback) {
                 const mockCloseEvent = { wasClean: false, code: 1006, reason: 'Failed to start connection: ' + err.message, error: err };
                 onCloseCallback(mockCloseEvent);
            }
        }
    }
}

function startPing() {
    if (pingIntervalId) {
        clearInterval(pingIntervalId);
    }
    pingIntervalId = setInterval(async () => {
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            try {
                // console.log('[SignalR] Sending ping to hub');
                await connection.invoke("Ping", "Client ping from wsClient.js");
            } catch (err) {
                logDebug('WS_CLIENT', 'Error sending SignalR ping: ' + err.message, { error: err });
                // If ping fails, SignalR's automatic reconnect should handle underlying connection issues.
            }
        }
    }, PING_INTERVAL_MS);
}

function stopPing() {
    if (pingIntervalId) {
        clearInterval(pingIntervalId);
        pingIntervalId = null;
    }
}

/**
 * Unsubscribes by stopping the SignalR connection.
 */
export async function unsubscribe() {
    stopPing();
    const gameIdBeingClosed = currentSubscribedGameId;
    currentSubscribedGameId = null; // Signal that we are intentionally closing

    if (connection) {
        logDebug('WS_CLIENT', `Unsubscribing from game ${gameIdBeingClosed}. Stopping SignalR connection.`, { state: connection.state });
        try {
            await connection.stop();
            logDebug('WS_CLIENT', 'SignalR connection stopped successfully.');
        } catch (err) {
            logDebug('WS_CLIENT', 'Error stopping SignalR connection: ' + err.message, { error: err });
        }
        connection = null;
    }
    
    // Clear callbacks
    onMessageCallback = null;
    onErrorCallback = null;
    onOpenCallback = null;
    // onCloseCallback is cleared by game.js or by a new subscribe call. Keeping it allows final close event if stop fails.
}

/**
 * Checks if the SignalR connection is currently connected.
 * @returns {boolean} True if connected, false otherwise.
 */
export function isWsConnected() {
    return connection && connection.state === signalR.HubConnectionState.Connected;
}

/**
 * Get the current SignalR connection for use by other modules (like chat)
 * @returns {object|null} The current SignalR connection or null if not connected
 */
export function getWsConnection() {
    return connection && connection.state === signalR.HubConnectionState.Connected ? connection : null;
}

window.manualSignalRConnect = () => {
    const gameId = sessionStorage.getItem('currentGameId'); // Or get it from somewhere
    if (gameId) {
        // Call your existing subscribe function, but ensure callbacks are defined
        // This is a simplified example; adapt to your actual subscribe call
        subscribe(gameId, 
            (gameState) => console.log("WS Message:", gameState),
            () => console.log("WS Open"),
            (err) => console.error("WS Error:", err),
            (closeEvent) => console.log("WS Close:", closeEvent)
        );
    } else {
        console.error("No gameId for manual connect test");
    }
}; 