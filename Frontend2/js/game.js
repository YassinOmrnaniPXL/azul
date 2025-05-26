import {
    fetchGameData,
    takeTilesAction,
    placeTilesOnPatternLineAction,
    placeTilesOnFloorLineAction,
    leaveTable
} from './apiService.js';
import {
    renderGame,
    showLoading,
    showError,
    showConnectionStatus,
    logDebug,
    setLocalPlayerId as setRendererLocalPlayerId // Alias to avoid conflict if any local var with same name
} from './gameRenderer.js';
import { subscribe as wsSubscribe, unsubscribe as wsUnsubscribe, isWsConnected, getWsConnection } from './wsClient.js';
import { CONNECTION_MODE, POLLING_INTERVAL_MS } from './config.js';
import { initializeChat, isChatInitialized } from './chatClient.js';
import { playSfx, playMusic, stopMusic } from './audioManager.js';

let currentGameId = null;
let currentTableId = null; // Store tableId if needed for future actions or display
let currentGameState = null;
let localUserId = null; // Changed from localPlayerId

// State for the current move (picking tiles)
let selectedFactorySource = {
    displayId: null, // ID of the factory display or table center
    tileType: null,  // Type of tile selected
    sourceType: null // 'display' or 'center'
    // We don't store the actual tile elements here, as the backend will manage that.
    // The UI will reflect selection, and then placement options will be shown.
};

// Chat state is managed in chatClient.js

// Enum for TileTypes (assuming 0-4 map to specific colors, adjust as per backend)
const TileType = {
    BLUE: 0,
    YELLOW: 1,
    RED: 2,
    BLACK: 3,
    TEAL: 4, // Or LIGHT_BLUE, or whatever the 5th color is
    // Add more if backend has more than 5 colors for tiles
};

const TILE_COLOR_CLASSES = {
    [TileType.BLUE]: 'tile-blue',
    [TileType.YELLOW]: 'tile-yellow',
    [TileType.RED]: 'tile-red',
    [TileType.BLACK]: 'tile-black',
    [TileType.TEAL]: 'tile-teal',
};

// Fixed wall pattern for a standard Azul game
const WALL_PATTERN = [
    [TileType.BLUE, TileType.YELLOW, TileType.RED, TileType.BLACK, TileType.TEAL],
    [TileType.TEAL, TileType.BLUE, TileType.YELLOW, TileType.RED, TileType.BLACK],
    [TileType.BLACK, TileType.TEAL, TileType.BLUE, TileType.YELLOW, TileType.RED],
    [TileType.RED, TileType.BLACK, TileType.TEAL, TileType.BLUE, TileType.YELLOW],
    [TileType.YELLOW, TileType.RED, TileType.BLACK, TileType.TEAL, TileType.BLUE],
];

const FLOOR_LINE_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];

// Polling related variables (for fallback)
let pollIntervalId = null;
let isPollingActive = false; 
let realtimeConnFailedPermanently = false; // Flag to indicate real-time connection failed and we should stick to polling
let lastConnectionAttemptTime = null; // Track when we last tried to connect
let actionInProgress = false; // Tracks if a game action is in progress

// To be called on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initGamePage);

async function initGamePage() {
    showLoading(true);
    
    // Play game start sound
    playSfx('gameStart');
    
    const urlParams = new URLSearchParams(window.location.search);
    currentGameId = urlParams.get('gameId');
    currentTableId = urlParams.get('tableId');

    localUserId = localStorage.getItem('userId');
    const tokenFromSession = sessionStorage.getItem('token');

    if (!currentGameId) {
        showError('Game ID is missing in the URL. Cannot load game.');
        showLoading(false);
        return;
    }
    if (!localUserId || !tokenFromSession) {
        showError('User ID or token is missing. Please log in again.');
        showLoading(false);
        return;
    }

    console.log(`Game page initialized for user: ${localUserId}. Game: ${currentGameId}`);
    setRendererLocalPlayerId(localUserId);

    // Initial game state fetch
    try {
        // Initial fetch, then setup real-time updates (WebSocket or polling)
        await fetchAndRenderGameState(true, true); 
    } catch (initialError) {
        console.error('Critical error during initial game load:', initialError);
        showError(`Failed to load initial game state: ${initialError.message}. Please try refreshing.`);
        showLoading(false);
        return; // Stop if initial load fails critically
    }

    // Add Leave Game button listener
    const leaveGameButton = document.getElementById('leave-game-button');
    if (leaveGameButton) {
        leaveGameButton.addEventListener('click', handleLeaveGame);
    } else {
        console.warn('Leave Game button not found in initGamePage.');
    }

    // Setup visibility change listener to manage WS/polling activity
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => {
        wsUnsubscribe(); // Ensure WebSocket connection is closed
        stopPolling();    // Ensure polling is stopped
    });
}

function setupRealtimeUpdates() {
    lastConnectionAttemptTime = new Date();
    
    if (document.hidden) {
        logDebug('Connection', 'Page is hidden, deferring real-time connection setup.');
        // Do not show any status update as it might be confusing if user is not looking
        return;
    }

    if (realtimeConnFailedPermanently && CONNECTION_MODE === 'websocket') {
        logDebug('Connection', 'Real-time WebSocket connection has failed permanently. Attempting to fall back to polling.');
        showConnectionStatus(false, false, false, true); // Show WS error initially
        conditionalStartPolling(); // This will start polling and update status to polling
        return;
    }
    
    if (CONNECTION_MODE === 'websocket') {
        if (isWsConnected()) {
            logDebug('Connection', 'WebSocket is already connected.');
            showConnectionStatus(true); // Connected via WebSocket
            return;
        }
        logDebug('Connection', 'Attempting WebSocket connection...');
        showConnectionStatus(false, false, true); // Connecting...
        wsSubscribe(
            currentGameId,
            handleWsMessage,
            handleWsOpen,
            handleWsError,
            handleWsClose // Pass the new close handler
        );
    } else if (CONNECTION_MODE === 'polling') {
        logDebug('Connection', 'CONNECTION_MODE is polling. Initiating polling.');
        // Even if mode is polling, ensure realtimeConnFailedPermanently reflects that WS isn't primary
        realtimeConnFailedPermanently = true; 
        showConnectionStatus(false, true); // Show as polling
        if (!isPollingActive) {
            startPolling();
        }
    } else {
        logDebug('Connection', `Unknown CONNECTION_MODE: ${CONNECTION_MODE}. Defaulting to no real-time updates.`);
        showConnectionStatus(false, false, false, true); // Show error, no connection
        realtimeConnFailedPermanently = true; // Prevent further attempts with unknown mode
    }
}

function handleWsOpen() {
    logDebug('WebSocket', 'Connection opened (game.js handler).');
    showConnectionStatus(true); // Connected via WebSocket
    realtimeConnFailedPermanently = false; // Reset flag on successful connection
    if (isPollingActive) {
        logDebug('WebSocket', 'WebSocket connected, stopping fallback polling.');
        stopPolling();
    }
    
    // Play connection sound
    playSfx('notification', 0.7);
    
    // Initialize chat when WebSocket connection is established
    initializeChatIfNeeded();
    
    // Consider fetching game state if needed after a reconnect, though wsClient might handle some scenarios
    // fetchAndRenderGameState(false); 
}

function handleWsMessage(newGameState) {
    logDebug('WebSocket', 'Received GameStateUpdate via WebSocket.', newGameState);
    showConnectionStatus('Message received', 'green', 1000);

    if (!newGameState || typeof newGameState !== 'object') {
        logDebug('WebSocket', 'Received invalid or empty game state from WebSocket.', newGameState);
        showError('Received invalid game data from server.', true);
        return;
    }
    
    if (newGameState.gameId && currentGameId && newGameState.gameId !== currentGameId) {
        logDebug('WebSocket', `Received game state for a different game. Current: ${currentGameId}, Received: ${newGameState.gameId}. Ignoring.`);
        // This could happen if the user quickly switches games or there's a mix-up.
        // For now, we'll just ignore it to prevent rendering the wrong game.
        // A more robust solution might involve notifying the user or attempting to switch context.
        return;
    }


    // Check for game state changes and play appropriate sounds
    checkGameStateChangesAndPlayAudio(currentGameState, newGameState);

    currentGameState = newGameState;
    // Ensure click handlers are correctly passed
    renderGame(currentGameState, handleBoardLocationClick, handleFactoryTileClick);
    logDebug('WebSocket', 'Game state updated and re-rendered from WS message.');
    ensureLoadingHidden(); // Make sure loading is hidden after WS update
}

function handleWsError(error) {
    logDebug('WebSocket', 'Error reported by wsClient (game.js handler).', error);
    // wsClient's onClose will determine if reconnections are exhausted.
    // This handler is more for reacting to an immediate error signal.
    // We might not know yet if it's a permanent failure.
    showConnectionStatus(false, false, false, true); // Show WS error
    // If not already marked, signal that a failure occurred. 
    // The onClose handler will make the final call on permanent failure.
    if (!realtimeConnFailedPermanently) {
         // realtimeConnFailedPermanently = true; // Tentatively mark, wsClient's onClose will confirm if max retries hit
    }
    // No direct call to conditionalStartPolling() here, as wsClient manages retries.
    // Polling fallback logic is primarily in handleWsClose after wsClient gives up.
}

function handleWsClose(event) {
    logDebug('WebSocket', `Connection closed (game.js handler). Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
    
    if (event.wasClean) {
        // Clean closure (e.g., server shutdown gracefully, client called unsubscribe)
        showConnectionStatus(false, false, false, false, true); // Show as cleanly disconnected
        logDebug('WebSocket', 'Connection closed cleanly. No automatic fallback to polling unless game explicitly restarts connection.');
        // If polling was active (e.g. manual start), it might continue or be stopped depending on game logic.
        // For now, if it was clean, we assume it was intentional or handled, so no auto-poll start.
    } else {
        // Unclean closure (e.g., network error, server crash, max retries in wsClient)
        logDebug('WebSocket', 'Connection closed unexpectedly. This might trigger fallback polling.');
        realtimeConnFailedPermanently = true; // Mark as failed because wsClient would have retried if possible
        showConnectionStatus(false, false, false, true); // Show WS error/disconnected state

        if (CONNECTION_MODE === 'websocket') { // Only try polling if WS was the primary mode and it failed
            logDebug('WebSocket', 'Unclean WS close, attempting to fall back to polling.');
            conditionalStartPolling();
        }
    }
    // Note: wsClient handles its own retry logic. This handler reacts to the final outcome of that process (permanent failure or clean close).
}

async function fetchAndRenderGameState(showLoader = true, initialSetup = false) {
    if (actionInProgress) {
        logDebug('Fetch', 'Action in progress, skipping fetchAndRenderGameState.');
        return;
    }
    if (showLoader) showLoading(true);
    actionInProgress = true; // Set flag before async operation

    try {
        logDebug('Fetch', `Fetching game state for game ID: ${currentGameId}`);
        const gameState = await fetchGameData(currentGameId);
        if (!gameState || !gameState.id) { // Basic validation - CHANGED to gameState.id
            throw new Error('Received invalid game state from server (missing or invalid ID).');
        }
        currentGameState = gameState;
        renderGame(currentGameState, handleBoardLocationClick, handleFactoryTileClick);
        logDebug('Fetch', 'Game state fetched and rendered successfully.');
        
        if (initialSetup) {
            // After initial fetch, setup real-time updates (WebSocket or fallback polling)
            // This will use CONNECTION_MODE to decide
            setupRealtimeUpdates();
        } else {
            // If this fetch was due to polling, show polling status
            if (isPollingActive) {
                showConnectionStatus(false, true); // Show as polling
            } else if (isWsConnected()) {
                showConnectionStatus(true); // Show as WS connected
                // Try to initialize chat if WebSocket is connected
                initializeChatIfNeeded();
            }
        }

    } catch (error) {
        console.error('Error fetching or rendering game state:', error);
        showError(`Failed to update game: ${error.message}`);
        // If initial setup fails to fetch, setupRealtimeUpdates might still run and try to connect/poll
        // which might then succeed or fail and show its own status.
        // If not initial setup, and polling is active, it will continue.
        // If WebSocket was active, it might have disconnected due to this error or related server issue.
        if (isWsConnected()) {
            // If WS is somehow still connected but fetch failed, show error but keep WS status
            showConnectionStatus(true, false, false, true); // WS connected, but error occurred
        } else if (!isPollingActive) { // If neither polling nor WS is active, show a general error status
            showConnectionStatus(false, false, false, true); // Error status
        }
    } finally {
        if (showLoader) showLoading(false);
        actionInProgress = false; // Clear flag after operation completes
        ensureLoadingHidden(); 
    }
}

async function handleLeaveGame() {
    if (!currentTableId) {
        showError("Table ID is missing. Cannot leave table.");
        return;
    }
    showLoading(true);
    wsUnsubscribe(); 
    stopPolling(); 

    try {
        await leaveTable(currentTableId);
        window.location.href = 'lobby.html';
    } catch (error) {
        console.error('Error leaving table:', error);
        showError(error.message || 'Failed to leave the table. Please try again.');
        showLoading(false);
        // If leaving failed, re-evaluate real-time connection
        setupRealtimeUpdates(); 
    }
}

// --- Audio Integration --- //

function checkGameStateChangesAndPlayAudio(oldState, newState) {
    if (!oldState || !newState) return;
    
    // Check for game end
    if (!oldState.hasEnded && newState.hasEnded) {
        playSfx('gameEnd');
        
        // Check if local player won
        if (newState.winners && newState.winners.some(w => w.id === localUserId)) {
            setTimeout(() => playSfx('victory'), 500);
            playMusic('victory', true);
        }
        return; // Don't play other sounds if game ended
    }
    
    // Check for round completion
    if (oldState.roundNumber !== newState.roundNumber) {
        playSfx('roundComplete');
        
        // Start ambient music for new round if not already playing
        if (newState.roundNumber === 1) {
            playMusic('gameplay', true);
        }
    }
    
    // Check for turn changes
    if (oldState.playerToPlayId !== newState.playerToPlayId) {
        if (newState.playerToPlayId === localUserId) {
            playSfx('turnStart');
        } else {
            playSfx('turnEnd', 0.7);
        }
    }
    
    // Check for scoring events (compare player scores)
    const oldLocalPlayer = oldState.players?.find(p => p.id === localUserId);
    const newLocalPlayer = newState.players?.find(p => p.id === localUserId);
    
    if (oldLocalPlayer && newLocalPlayer) {
        const oldScore = oldLocalPlayer.board?.score || 0;
        const newScore = newLocalPlayer.board?.score || 0;
        
        if (newScore > oldScore) {
            const scoreDiff = newScore - oldScore;
            if (scoreDiff >= 10) {
                playSfx('bonusPoints');
            } else {
                playSfx('scoring');
            }
        }
        
        // Check for completed pattern lines
        if (oldLocalPlayer.board?.patternLines && newLocalPlayer.board?.patternLines) {
            for (let i = 0; i < newLocalPlayer.board.patternLines.length; i++) {
                const oldLine = oldLocalPlayer.board.patternLines[i];
                const newLine = newLocalPlayer.board.patternLines[i];
                
                // Check if line was completed (went from incomplete to complete)
                const oldComplete = oldLine?.tiles?.length === (i + 1);
                const newComplete = newLine?.tiles?.length === (i + 1);
                
                if (!oldComplete && newComplete) {
                    playSfx('lineComplete');
                    break; // Only play once per update
                }
            }
        }
    }
    
    // Check for new players joining/leaving
    const oldPlayerCount = oldState.players?.length || 0;
    const newPlayerCount = newState.players?.length || 0;
    
    if (newPlayerCount > oldPlayerCount) {
        playSfx('playerJoin');
    } else if (newPlayerCount < oldPlayerCount) {
        playSfx('playerLeave');
    }
}

// --- Chat Integration --- //

function initializeChatIfNeeded() {
    if (isChatInitialized()) {
        // Chat is already initialized
        logDebug('Chat', 'Chat already initialized');
        return;
    }
    
    const connection = getWsConnection();
    if (!connection || !localUserId) {
        logDebug('Chat', 'Cannot initialize chat: missing connection or userId');
        return;
    }
    
    // Get player name from current game state
    let playerName = 'Player';
    if (currentGameState && currentGameState.players) {
        const localPlayer = currentGameState.players.find(p => p.id === localUserId);
        if (localPlayer && localPlayer.name) {
            playerName = localPlayer.name;
        }
    }
    
    try {
        initializeChat(connection, playerName);
        logDebug('Chat', `Chat initialized for player ${playerName}`);
    } catch (error) {
        console.error('Error initializing chat:', error);
    }
}

// --- Interaction Handlers --- //

async function handleFactoryTileClick(displayId, tileType, sourceType) {
    if (!currentGameState || currentGameState.hasEnded || currentGameState.playerToPlayId !== localUserId) {
        if (currentGameState && currentGameState.playerToPlayId !== localUserId && !currentGameState.hasEnded) {
            showError("It's not your turn.");
            playSfx('errorSound');
        }
        return;
    }
    
    if (actionInProgress) {
        showError('An action is already in progress. Please wait.');
        playSfx('errorSound');
        return;
    }
    
    const localPlayer = currentGameState.players.find(p => p.id === localUserId);
    if (localPlayer && localPlayer.tilesToPlace && localPlayer.tilesToPlace.length > 0) {
        showError('You already have tiles. Place them before taking new ones.');
        playSfx('errorSound');
        return;
    }
        
    showLoading(true);
    actionInProgress = true;
    console.log(`[Game] Taking tiles - Display: ${displayId}, Type: ${tileType}`);

    // Play tile pickup sound
    playSfx('tilePickup');

    try {
        const result = await takeTilesAction(currentGameId, displayId, tileType);
        console.log('[Game] Take tiles action completed:', result);
        
        // Play tile click sound on successful action
        playSfx('tileClick');
        
        // The WebSocket message from the server should trigger a re-render via handleWsMessage.
        // The explicit fetchAndRenderGameState via setTimeout is removed for now to rely on WS.
        // If WS updates are too slow or unreliable, this can be revisited.

    } catch (error) {
        console.error('[Game] Error taking tiles:', error);
        showError(error.message || 'Could not take tiles.');
        // showLoading(false); // Handled in finally
        if (!isWsConnected()) conditionalStartPolling(); 
    } finally {
        actionInProgress = false; // Clear the flag in the finally block
        showLoading(false); // Ensure loading indicator is hidden
    }
}

async function handleBoardLocationClick(lineIndex, slotIndex, targetType) {
    if (!currentGameState || currentGameState.hasEnded || currentGameState.playerToPlayId !== localUserId) {
        if (currentGameState && currentGameState.playerToPlayId !== localUserId) {
            showError("It's not your turn.");
            playSfx('errorSound');
        }
        return;
    }
    
    if (actionInProgress) {
        showError('An action is already in progress. Please wait.');
        playSfx('errorSound');
        return;
    }
    
    const localPlayer = currentGameState.players.find(p => p.id === localUserId);
    if (!localPlayer || !localPlayer.tilesToPlace || localPlayer.tilesToPlace.length === 0) {
        showError('No tiles selected to place. Pick tiles from factory first.');
        playSfx('errorSound');
        return;
    }

    showLoading(true);
    actionInProgress = true;
    console.log(`[Game] Placing tiles - Target: ${targetType}, Line: ${lineIndex}`);

    try {
        if (targetType === 'pattern') {
            await placeTilesOnPatternLineAction(currentGameId, lineIndex);
            // Play tile placement sound
            playSfx('tilePlace');
        } else if (targetType === 'floor') {
            await placeTilesOnFloorLineAction(currentGameId);
            // Play different sound for floor placement (penalty)
            playSfx('tilePlace', 0.7);
        }
        
        console.log(`[Game] Place tiles action completed for ${targetType}`);
        
        // The WebSocket message from the server should trigger a re-render via handleWsMessage.
        // The explicit fetchAndRenderGameState via setTimeout is removed for now to rely on WS.

    } catch (error) {
        console.error(`[Game] Error placing tiles on ${targetType}:`, error);
        showError(error.message || `Could not place tiles on ${targetType}.`);
        // showLoading(false); // Handled in finally
        if (!isWsConnected()) conditionalStartPolling();
    } finally {
        actionInProgress = false; // Clear the flag in the finally block
        showLoading(false); // Ensure loading indicator is hidden
    }
}

// --- Polling Logic (Fallback) ---
function conditionalStartPolling() {
    // This function is called when a real-time connection (WebSocket) fails
    // and we need to decide whether to start polling.
    if (CONNECTION_MODE === 'polling') { // If primary mode is polling, always start.
        logDebug('Polling', 'Primary connection mode is polling. Ensuring polling is active.');
        if (!isPollingActive) startPolling();
        return;
    }

    // If primary mode is WebSocket, only start polling if WS has failed permanently
    // and polling is not already active.
    if (CONNECTION_MODE === 'websocket' && realtimeConnFailedPermanently) {
        logDebug('Polling', 'WebSocket connection failed. Attempting to start fallback polling.');
        if (!isPollingActive) {
            startPolling();
        } else {
            logDebug('Polling', 'Fallback polling is already active.');
        }
    } else if (CONNECTION_MODE === 'websocket' && !realtimeConnFailedPermanently) {
        logDebug('Polling', 'WebSocket connection not marked as permanently failed. Polling not started.');
        // Optionally, try to re-establish WebSocket connection here if appropriate
        // setupRealtimeUpdates(); // This might create a loop if called carelessly
    }
}

function startPolling() {
    if (isPollingActive) {
        logDebug('Polling', 'Polling is already active. Skipping startPolling call.');
        return;
    }
    if (!currentGameId) {
        logDebug('Polling', 'No game ID, cannot start polling.');
        return;
    }

    // If CONNECTION_MODE is 'websocket', polling is a fallback.
    // If CONNECTION_MODE is 'polling', it's the primary method.
    if (CONNECTION_MODE === 'websocket' && !realtimeConnFailedPermanently) {
        logDebug('Polling', 'Attempting to start polling, but WebSocket has not been marked as failed. This might be an error or wsClient is attempting reconnection.');
        // We might get here if wsClient is still trying to connect and hasn't declared permanent failure.
        // In this case, we should be cautious about starting polling to avoid conflicts.
        // For now, proceed but log a warning.
        // showConnectionStatus might show "Connecting..." for WS.
    }
    
    logDebug('Polling', `Starting polling with interval: ${POLLING_INTERVAL_MS}ms.`);
    isPollingActive = true;
    // Show polling status immediately, even before the first fetch
    showConnectionStatus(false, true); 
    
    // Clear any existing interval to avoid multiple polling loops
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
    }

    // Fetch immediately, then set interval
    fetchAndRenderGameState(false) // No loader for background polls
        .then(() => {
            if (isPollingActive) { // Check again, as it might have been stopped
                pollIntervalId = setInterval(() => {
                    if (!actionInProgress) { // Only poll if no other action is happening
                        fetchAndRenderGameState(false);
                    } else {
                        logDebug('Polling', 'Skipping poll interval due to action in progress.');
                    }
                }, POLLING_INTERVAL_MS);
                logDebug('Polling', `Polling interval set with ID: ${pollIntervalId}`);
            }
        })
        .catch(error => {
            console.error('Error during initial poll fetch:', error);
            // Polling might fail to start; status should reflect this.
            // showConnectionStatus will be updated by fetchAndRenderGameState's error handling.
        });
}

function stopPolling() {
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
        logDebug('Polling', 'Polling interval cleared.');
    }
    if (isPollingActive) {
        isPollingActive = false;
        logDebug('Polling', 'Polling stopped.');
        // Update status only if WebSocket is not connected or trying
        if (!isWsConnected() && !(CONNECTION_MODE === 'websocket' && !realtimeConnFailedPermanently)) {
             // If WS is not active/trying, show disconnected status or error if appropriate
            showConnectionStatus(false, false, false, !realtimeConnFailedPermanently); // Show error if WS didn't fail permanently
        }
    }
}

function handleVisibilityChange() {
    if (document.hidden) {
        logDebug('Visibility', 'Page hidden. Real-time updates might be paused by wsClient or polling might be less frequent.');
        // wsClient might disconnect or stop pinging. Polling might be stopped by game.js (not implemented here yet).
        // No direct action to stop WS here; wsClient can manage its lifecycle based on browser events if designed to.
    } else {
        logDebug('Visibility', 'Page visible.');

        // If WebSocket is the mode and it's not connected, try to set it up.
        // This handles cases where the connection might have been dropped while tab was hidden,
        // or if initial setup was deferred because tab was hidden.
        if (CONNECTION_MODE === 'websocket' && !isWsConnected()) {
            logDebug('Visibility', 'Page visible and WebSocket not connected. Attempting to setup/reconnect WebSocket.');
            // Reset permanent failure if user is actively bringing tab to focus, give WS another chance before polling.
            // However, wsClient manages its own retry limits. This call primarily ensures setup is (re)initiated.
            if (realtimeConnFailedPermanently) {
                logDebug('Visibility', 'Resetting realtimeConnFailedPermanently flag due to page becoming visible.');
                realtimeConnFailedPermanently = false; // Give WS a fresh chance
            }
            setupRealtimeUpdates(); 
        } else if (CONNECTION_MODE === 'polling' && !isPollingActive) {
            logDebug('Visibility', 'Page visible and polling is the mode but not active. Starting polling.');
            startPolling();
        } else if (isWsConnected()) {
            logDebug('Visibility', 'Page visible and WebSocket is connected. Ensuring latest state.');
            // Optionally, fetch game state to ensure sync if significant time passed
            // fetchAndRenderGameState(false); 
            showConnectionStatus(true); // Refresh status display
        } else if (isPollingActive) {
            logDebug('Visibility', 'Page visible and polling is active.');
            showConnectionStatus(false, true); // Refresh status display
        }
    }
}

// Function to ensure loading indicator isn't stuck
function ensureLoadingHidden() {
    const loadingElement = document.getElementById('loading-state');
    if (loadingElement && !loadingElement.classList.contains('hidden')) {
        console.log('[Game] Found stuck loading indicator, hiding it');
        loadingElement.classList.add('hidden');
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.classList.remove('hidden');
        }
    }
}