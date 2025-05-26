import { API_BASE_URL, getAuthHeaders } from './config.js';
import {
    joinOrCreateTable,
    joinSpecificTable,
    getTableStatus,
    leaveTable,
    getPublicTables,
    startGameOnTable
} from './apiService.js';
import { profilePictureService } from './profilePictureService.js';
import { globalChatService } from './globalChatService.js';
import { ChatComponent } from './chatComponent.js';
import { FriendSystemComponent } from './friendSystemComponent.js';

const preferencesSection = document.getElementById('preferences-section');
const lobbyStatusSection = document.getElementById('lobby-status-section');
const joinCreateButton = document.getElementById('join-create-button');
const numPlayersSelect = document.getElementById('num-players');
const numAiSelect = document.getElementById('num-ai');
const statusMessage = document.getElementById('status-message');
const tableIdDisplay = document.getElementById('table-id-display');
const seatedPlayersList = document.getElementById('seated-players-list');
const leaveTableButton = document.getElementById('leave-table-button');
const startGameButton = document.getElementById('start-game-button');
const errorMessageDiv = document.getElementById('error-message');
const errorTextSpan = document.getElementById('error-text');

// New elements for public tables list
const publicTablesSection = document.getElementById('public-tables-section');
const publicTablesListDiv = document.getElementById('public-tables-list');
const noPublicTablesMessage = document.getElementById('no-public-tables-message');
const refreshTablesButton = document.getElementById('refresh-tables-button');

    let currentTableId = null;
// Make currentTableId globally accessible for friend system
window.currentTableId = null;
let pollIntervalId = null;
let userId = null;
let userName = null;

// Global chat variables
let chatComponent = null;
let chatUnsubscribeFunctions = [];

// Friend system variables
let friendSystemComponent = null;

function displayError(message) {
    if (errorTextSpan && errorMessageDiv) {
        errorTextSpan.textContent = message;
        errorMessageDiv.classList.remove('hidden');
    } else {
        console.error('Error display elements not found. Message:', message);
        alert('Error: ' + message); // Fallback
    }
}

function clearError() {
    if (errorMessageDiv) {
        errorMessageDiv.classList.add('hidden');
    }
}

function showLobbyView() {
    preferencesSection.classList.remove('hidden');
    lobbyStatusSection.classList.add('hidden');
    if (tableIdDisplay) {
        tableIdDisplay.removeAttribute('data-table-id');
        tableIdDisplay.classList.remove('table-id-display');
    }
    currentTableId = null;
    window.currentTableId = null; // Clear global reference
    clearError();
}

function showWaitingView(tableId) {
    preferencesSection.classList.add('hidden');
    lobbyStatusSection.classList.remove('hidden');
    if (tableIdDisplay) {
        tableIdDisplay.textContent = tableId;
        tableIdDisplay.setAttribute('data-table-id', tableId);
        tableIdDisplay.classList.add('table-id-display');
    }
    currentTableId = tableId;
    window.currentTableId = tableId; // Make globally accessible
    clearError();
}

function renderSeatedPlayers(players) {
    if (!seatedPlayersList) return;
    seatedPlayersList.innerHTML = '<h3 class="text-lg font-medium text-gray-700 mb-3">Players at Table:</h3>';
    if (!players || players.length === 0) {
        const noPlayersP = document.createElement('p');
        noPlayersP.textContent = 'No players seated yet.';
        noPlayersP.classList.add('text-gray-500', 'italic');
        seatedPlayersList.appendChild(noPlayersP);
            return;
    }

    const listContainer = document.createElement('div');
    listContainer.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';

    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card bg-white p-3 rounded-lg shadow border border-gray-200 flex items-center space-x-3';
        
        const pfp = document.createElement('img');
        pfp.src = 'images/Default_pfp.jpg'; 
        pfp.alt = player.name;
        pfp.className = 'w-10 h-10 rounded-full object-cover border-2 border-azulAccent';
        
        // Load profile picture if available
        profilePictureService.getProfilePictureUrl(player.id)
            .then(profilePictureUrl => {
                pfp.src = profilePictureUrl;
            })
            .catch(error => {
                console.warn(`Failed to load profile picture for ${player.name}:`, error);
                // Keep default image
            });

        const playerNameEl = document.createElement('span');
        playerNameEl.textContent = player.name;
        playerNameEl.className = 'font-semibold text-gray-700';
        
        if (player.id === userId) {
            const youSpan = document.createElement('span');
            youSpan.textContent = ' (You)';
            youSpan.className = 'text-sm text-azulAccent';
            playerNameEl.appendChild(youSpan);
        }

        playerCard.appendChild(pfp);
        playerCard.appendChild(playerNameEl);
        listContainer.appendChild(playerCard);
    });
    seatedPlayersList.appendChild(listContainer);
}

async function fetchAndDisplayPublicTables() {
    if (!publicTablesListDiv || !noPublicTablesMessage) {
        console.warn('Public tables list elements not found in DOM.');
        return;
    }
    if (refreshTablesButton) refreshTablesButton.disabled = true;

    console.log('Fetching public tables...');
    try {
        const tables = await getPublicTables();
        publicTablesListDiv.innerHTML = ''; // Clear previous list

        if (!tables || tables.length === 0) {
            noPublicTablesMessage.classList.remove('hidden');
            publicTablesListDiv.appendChild(noPublicTablesMessage);
        } else {
            noPublicTablesMessage.classList.add('hidden');
            tables.forEach(table => {
                const tableCard = document.createElement('div');
                // Ensure table.preferences exists before accessing its properties
                const numPlayers = table.preferences ? table.preferences.numberOfPlayers : 'N/A';
                const currentPlayers = table.seatedPlayers ? table.seatedPlayers.length : 0;

                tableCard.className = 'p-4 border bg-gray-50 rounded-lg hover:shadow-md transition-shadow flex justify-between items-center';
                
                const tableInfo = document.createElement('div');
                const title = document.createElement('h3');
                title.className = 'font-semibold text-azulBlue';
                // Assuming table.name and table.hostName would come from backend, or construct a default
                // For now, let's use a generic name if specific name isn't available.
                const displayName = table.name || `Game Table`; // You might want a more descriptive default
                title.textContent = `${displayName} (${currentPlayers}/${numPlayers} players)`;
                
                const tableIdText = document.createElement('p');
                tableIdText.className = 'text-xs text-gray-500';
                tableIdText.textContent = `ID: ${table.id.substring(0,12)}...`;

                tableInfo.appendChild(title);
                tableInfo.appendChild(tableIdText);

                const joinButton = document.createElement('button');
                joinButton.textContent = 'Join';
                joinButton.className = 'text-white bg-azulAccent hover:bg-opacity-80 focus:ring-2 focus:ring-azulAccent px-4 py-2 rounded-md text-sm shadow';
                joinButton.onclick = () => handleJoinSpecificTable(table.id, table.preferences);
                
                if (table.preferences && currentPlayers >= table.preferences.numberOfPlayers) {
                    joinButton.disabled = true;
                    joinButton.textContent = 'Full';
                    joinButton.classList.remove('bg-azulAccent', 'hover:bg-opacity-80');
                    joinButton.classList.add('bg-gray-400', 'cursor-not-allowed');
                }

                tableCard.appendChild(tableInfo);
                tableCard.appendChild(joinButton);
                publicTablesListDiv.appendChild(tableCard);
            });
            }
        } catch (error) {
        console.error('Error fetching public tables:', error);
        displayError(`Could not fetch public games: ${error.message}`);
        noPublicTablesMessage.classList.remove('hidden');
        noPublicTablesMessage.textContent = 'Could not load games. Click Refresh to try again.';
        publicTablesListDiv.innerHTML = ''; // Clear any partial list
        publicTablesListDiv.appendChild(noPublicTablesMessage);
    } finally {
        if (refreshTablesButton) refreshTablesButton.disabled = false;
    }
}

async function handleJoinSpecificTable(tableId, preferences) {
    console.log(`Attempting to join specific table ${tableId}`);
    
    joinCreateButton.disabled = true;
    joinCreateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Joining...';

    try {
        // Use the new joinSpecificTable API to join the exact table
        const tableData = await joinSpecificTable(tableId);
        console.log('Joined specific table:', tableData);
        if (tableData && tableData.id) {
            currentTableId = tableData.id; // Set currentTableId here
            window.currentTableId = tableData.id; // Make globally accessible
            localStorage.setItem('currentTableId', tableData.id); // Store in localStorage for persistence
            showWaitingView(tableData.id);
            renderSeatedPlayers(tableData.seatedPlayers);
            if (statusMessage) statusMessage.textContent = 'Successfully joined table. Waiting for other players or for host to start...';
            
            // Add a small delay before starting polling to avoid race conditions
            setTimeout(() => {
                startPolling();
            }, 500); // 500ms delay to ensure table is fully persisted
        } else {
            throw new Error('Invalid response from server when trying to join table.');
        }
    } catch (error) {
        console.error('Failed to join specific table:', error);
        displayError(error.message || 'Could not join the table. It might be full or the game may have already started.');
        showLobbyView(); 
    } finally {
        joinCreateButton.disabled = false;
        joinCreateButton.innerHTML = '<i class="fas fa-search mr-2"></i>Find or Create Game';
    }
}

async function pollTableStatus() {
    if (!currentTableId || !lobbyStatusSection || lobbyStatusSection.classList.contains('hidden')) return;

    console.log('=== POLLING TABLE STATUS ===');
    console.log('Looking for table ID:', currentTableId);
    
    let tableData = null;
    let tableFound = false;
    
    try {
        // First try to get the table directly
        try {
            console.log('Attempting direct table lookup for ID:', currentTableId);
            tableData = await getTableStatus(currentTableId);
            tableFound = true;
            console.log('✅ Table found via direct lookup');
        } catch (directError) {
            console.log('❌ Direct table lookup failed:', directError.message);
            console.log('Trying to find via all-joinable tables...');
            
            // Fallback: Find the table in the list of all joinable tables
            try {
                const allTables = await getPublicTables();
                console.log('All joinable tables:', allTables.map(t => ({ id: t.id, players: t.seatedPlayers?.length || 0 })));
                console.log('Looking for table with ID:', currentTableId);
                
                tableData = allTables.find(table => table.id === currentTableId);
                
                if (tableData) {
                    tableFound = true;
                    console.log('✅ Table found via all-joinable tables fallback');
                } else {
                    // Table truly doesn't exist in either place
                    console.log('❌ Table not found in all-joinable tables either');
                    console.log('Available table IDs:', allTables.map(t => t.id));
                    throw new Error('Table not found via direct lookup or all-joinable tables');
                }
            } catch (fallbackError) {
                console.log('❌ Fallback lookup also failed:', fallbackError.message);
                throw directError; // Throw the original error
            }
        }

        if (tableFound && tableData) {
            renderSeatedPlayers(tableData.seatedPlayers);

            const isTableFull = !tableData.hasAvailableSeat; // More direct check from TableModel
            const isUserHost = userId === tableData.hostPlayerId;
            const gameHasStarted = tableData.gameId && tableData.gameId !== "00000000-0000-0000-0000-000000000000";

            if (gameHasStarted) {
                console.log('Game has started! Game ID:', tableData.gameId);
                if (statusMessage) statusMessage.textContent = 'Game starting! Redirecting...';
                if (startGameButton) startGameButton.classList.add('hidden');
                stopPolling();
                // Ensure userId is correctly passed (it's a global in this script, should be fine)
                window.location.href = `game.html?gameId=${tableData.gameId}&tableId=${currentTableId}&userId=${userId}`;
            } else if (isTableFull) {
                if (isUserHost) {
                    if (statusMessage) statusMessage.textContent = 'Table is full! You can start the game.';
                    if (startGameButton) startGameButton.classList.remove('hidden');
                } else {
                    if (statusMessage) statusMessage.textContent = 'Table is full. Waiting for the host to start the game...';
                    if (startGameButton) startGameButton.classList.add('hidden');
                }
            } else {
                const humanPlayers = tableData.seatedPlayers ? tableData.seatedPlayers.length : 0;
                const totalPlayers = tableData.preferences ? tableData.preferences.numberOfPlayers : 'N/A';
                if (statusMessage) statusMessage.textContent = `Waiting for players... ${humanPlayers} / ${totalPlayers} human players.`;
                if (startGameButton) startGameButton.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error polling table status (both direct and fallback failed):', error);
        
        // Only clear table state if BOTH direct lookup AND fallback failed
        console.log('Table no longer exists (confirmed by both direct and fallback), clearing state and returning to lobby');
        displayError('The table no longer exists. Returning to lobby setup.');
        
        // Clear table state
        currentTableId = null;
        localStorage.removeItem('currentTableId');
        
        // Stop polling and return to lobby view
        stopPolling();
        showLobbyView();
    }
}

function startPolling() {
    if (pollIntervalId) clearInterval(pollIntervalId);
    // Make sure critical elements are present before starting polling
    if (lobbyStatusSection && statusMessage && seatedPlayersList) {
        pollIntervalId = setInterval(pollTableStatus, 3000); 
        pollTableStatus(); // Initial immediate check
    } else {
        console.error("Cannot start polling: Critical lobby status elements are missing from the DOM.");
    }
}

function stopPolling() {
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
    }
}

async function handleJoinOrCreateGame() {
    clearError();
    // userId and userName are set globally in init now, ensure they are loaded before this call.
    // const token = sessionStorage.getItem('token');
    // if (!token || !userId) { ... } // This check is good, ensure userId is available

    if (!numPlayersSelect || !joinCreateButton) { // Simplified check for essential elements
        displayError("Lobby form elements are missing. Cannot proceed.");
        return;
    }
    const numberOfPlayers = parseInt(numPlayersSelect.value, 10);
    const numberOfArtificialPlayers = 0; // Keep AI forced to 0 for now

    // Basic validation for number of players
    if (numberOfPlayers < 2 || numberOfPlayers > 4) { // Assuming min 2, max 4 for human players in preferences
        displayError('Number of human players must be between 2 and 4.');
            return;
        }

    const preferences = {
        numberOfPlayers: numberOfPlayers,
        numberOfArtificialPlayers: numberOfArtificialPlayers
    };

    joinCreateButton.disabled = true;
    joinCreateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Finding or Creating Game...';

    try {
        const tableData = await joinOrCreateTable(preferences);
        console.log('Joined or created table:', tableData);
        console.log('Table ID from response:', tableData?.id);
        console.log('Current user ID:', userId);
        
        if (tableData && tableData.id) {
            currentTableId = tableData.id; // Set currentTableId here
            localStorage.setItem('currentTableId', tableData.id); // Store in localStorage for persistence
            console.log('Set currentTableId to:', currentTableId);
            
            showWaitingView(tableData.id);
            renderSeatedPlayers(tableData.seatedPlayers);
            // Logic for immediate redirect based on gameId has been removed.
            // Polling will now handle game start detection.
            if (statusMessage) statusMessage.textContent = 'Successfully joined table. Waiting for other players or for host to start...';
            
            // Add a small delay before starting polling to avoid race conditions
            setTimeout(async () => {
                console.log('Starting polling for table ID:', currentTableId);
                
                // First, let's check what tables exist right before we start polling
                try {
                    console.log('=== PRE-POLLING TABLE CHECK ===');
                    const allTablesBeforePolling = await getPublicTables();
                    console.log('All tables before polling:', allTablesBeforePolling.map(t => ({ 
                        id: t.id, 
                        players: t.seatedPlayers?.length || 0,
                        hostId: t.hostPlayerId
                    })));
                    
                    const ourTable = allTablesBeforePolling.find(t => t.id === currentTableId);
                    if (ourTable) {
                        console.log('✅ Our table exists in all-joinable list before polling');
                        console.log('Table details:', ourTable);
                    } else {
                        console.log('❌ Our table NOT found in all-joinable list before polling!');
                        console.log('Looking for ID:', currentTableId);
                    }
                } catch (error) {
                    console.log('❌ Error checking tables before polling:', error);
                }
                
                startPolling();
            }, 1000); // Increased to 1000ms to see if timing is the issue
        } else {
            throw new Error('Invalid response from server when trying to join/create table.');
        }
    } catch (error) {
        console.error('Failed to join or create game:', error);
        displayError(error.message || 'Could not connect to the server to join or create a game. Ensure you are logged in.');
        showLobbyView(); 
    } finally {
        joinCreateButton.disabled = false;
        joinCreateButton.innerHTML = '<i class="fas fa-search mr-2"></i>Find or Create Game';
    }
}

async function handleLeaveTable() {
    if (!currentTableId || !leaveTableButton) return;
    leaveTableButton.disabled = true;
    leaveTableButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Leaving...';
    
    const tableIdToLeave = currentTableId; // Store it in case currentTableId is cleared by another async op
    stopPolling(); 

    try {
        await leaveTable(tableIdToLeave);
        if (statusMessage) statusMessage.textContent = 'You have left the table.';
        console.log('Successfully left table', tableIdToLeave);
    } catch (error) {
        console.error('Error leaving table:', error);
        displayError(error.message || 'Could not leave the table. You might need to refresh.');
    } finally {
        currentTableId = null; // Clear currentTableId after attempt
        localStorage.removeItem('currentTableId'); // Clear from localStorage
        showLobbyView();
        leaveTableButton.disabled = false;
        leaveTableButton.innerHTML = '<i class="fas fa-door-open mr-2"></i>Leave Table';
    }
}

// --- NEW --- Handler for Start Game button
async function handleStartGameClick() {
    if (!currentTableId || !startGameButton) return;

    startGameButton.disabled = true;
    startGameButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Starting Game...';
    if (statusMessage) statusMessage.textContent = 'Attempting to start the game...';

    try {
        await startGameOnTable(currentTableId);
        // On success, polling should pick up the gameId and trigger redirect.
        // No direct redirect here to allow polling to confirm game state from server.
        console.log('Start game request sent successfully for table:', currentTableId);
        // Optionally, trigger an immediate pollTableStatus() if desired
        // await pollTableStatus(); 
    } catch (error) {
        console.error('Error starting game:', error);
        displayError(error.message || 'Could not start the game. Please ensure you are the host and the table is full.');
        if (statusMessage) statusMessage.textContent = 'Failed to start game. Please try again.'; // Reset status
    } finally {
        startGameButton.disabled = false;
        startGameButton.innerHTML = '<i class="fas fa-play mr-2"></i>Start Game';
    }
}

/**
 * Check if user is already at a table and restore the waiting state
 */
async function checkAndRestoreTableState() {
    try {
        // First check if there's a stored table ID from localStorage
        const storedTableId = localStorage.getItem('currentTableId');
        
        if (storedTableId) {
            try {
                // Try to get the specific table first
                const tableData = await getTableStatus(storedTableId);
                
                if (tableData) {
                    // Verify user is still seated at this table
                    const userIsSeated = tableData.seatedPlayers && 
                        tableData.seatedPlayers.some(player => player.id === userId);
                    
                    if (userIsSeated) {
                        console.log('Restored table state from localStorage:', storedTableId);
                        currentTableId = storedTableId;
                        
                        // Check if the game has already started
                        const gameHasStarted = tableData.gameId && tableData.gameId !== "00000000-0000-0000-0000-000000000000";
                        
                        if (gameHasStarted) {
                            console.log('Game has already started, redirecting to game...');
                            window.location.href = `game.html?gameId=${tableData.gameId}&tableId=${tableData.id}&userId=${userId}`;
                            return;
                        }
                        
                        // Show waiting view and start polling
                        showWaitingView(tableData.id);
                        renderSeatedPlayers(tableData.seatedPlayers);
                        
                        // Set appropriate status message
                        const isTableFull = !tableData.hasAvailableSeat;
                        const isUserHost = userId === tableData.hostPlayerId;
                        
                        if (isTableFull) {
                            if (isUserHost) {
                                if (statusMessage) statusMessage.textContent = 'Table is full! You can start the game.';
                                if (startGameButton) startGameButton.classList.remove('hidden');
                            } else {
                                if (statusMessage) statusMessage.textContent = 'Table is full. Waiting for the host to start the game...';
                                if (startGameButton) startGameButton.classList.add('hidden');
                            }
                        } else {
                            const humanPlayers = tableData.seatedPlayers ? tableData.seatedPlayers.length : 0;
                            const totalPlayers = tableData.preferences ? tableData.preferences.numberOfPlayers : 'N/A';
                            if (statusMessage) statusMessage.textContent = `Waiting for players... ${humanPlayers} / ${totalPlayers} human players.`;
                            if (startGameButton) startGameButton.classList.add('hidden');
                        }
                        
                        startPolling();
                        console.log('Restored waiting state for table:', tableData.id);
                        return;
                    } else {
                        // User is not seated at this table anymore, clear localStorage
                        console.log('User is no longer seated at stored table, clearing localStorage');
                        localStorage.removeItem('currentTableId');
                    }
                }
            } catch (error) {
                // Table doesn't exist anymore, clear localStorage
                console.log('Stored table no longer exists, clearing localStorage');
                localStorage.removeItem('currentTableId');
            }
        }
        
        // If we get here, user is not at any table, show lobby view
        showLobbyView();
        console.log('User is not at any table, showing lobby view');
        
    } catch (error) {
        console.error('Error checking table state:', error);
        // If there's an error, default to showing lobby view
        showLobbyView();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    userId = localStorage.getItem('userId');
    userName = localStorage.getItem('userName');
    const tokenFromSession = sessionStorage.getItem('token');

    if (!preferencesSection || !lobbyStatusSection || !joinCreateButton || !numPlayersSelect || !numAiSelect || !statusMessage || !tableIdDisplay || !seatedPlayersList || !leaveTableButton || !startGameButton || !errorMessageDiv || !errorTextSpan || !publicTablesSection || !publicTablesListDiv || !noPublicTablesMessage || !refreshTablesButton) {
        console.error("One or more critical lobby HTML elements are missing. Lobby functionality will be impaired.");
        document.body.innerHTML = '<p style="color: red; font-size: 18px; text-align: center; padding: 20px;">Error: Lobby page is not correctly structured. Critical elements are missing. Please contact support.</p>';
                return;
            }

    if (!userId || !tokenFromSession) {
        let missingItems = [];
        if (!userId) missingItems.push("User ID");
        if (!tokenFromSession) missingItems.push("authentication token (session)");
        
        displayError(`${missingItems.join(' and ')} is missing. Please log in again to use the lobby.`);
        if (joinCreateButton) {
            joinCreateButton.disabled = true;
            joinCreateButton.title = 'Login required to join or create games.';
        }
        return; 
    }
    console.log(`Lobby initialized for user: ${userName} (ID: ${userId}). Token found in session.`);

    joinCreateButton.addEventListener('click', handleJoinOrCreateGame);
    leaveTableButton.addEventListener('click', handleLeaveTable);
    startGameButton.addEventListener('click', handleStartGameClick);
    
    // --- NEW --- Event listener for refresh button
    if (refreshTablesButton) {
        refreshTablesButton.addEventListener('click', fetchAndDisplayPublicTables);
    }
    
    // Check if user is already at a table and restore waiting state
    await checkAndRestoreTableState();
    
    fetchAndDisplayPublicTables(); // Initial fetch of public tables
    
    // Initialize global chat
    await initializeGlobalChat();
    
    // Initialize friend system
    initializeFriendSystem();
});

window.addEventListener('beforeunload', () => {
    // Optional: Attempt to leave table if user closes tab while in a waiting room
    // This is often unreliable and backend should handle stale tables.
    // if (currentTableId) {
    //     const tokenForBeacon = sessionStorage.getItem('token'); 
    //     navigator.sendBeacon(`${API_BASE_URL}/Tables/${currentTableId}/leave`, JSON.stringify({ token: tokenForBeacon }));
    // }
    stopPolling();
    
    // Clean up global chat
    cleanupGlobalChat();
});

/**
 * Initialize global chat component
 */
async function initializeGlobalChat() {
    try {
        // Create chat component
        chatComponent = new ChatComponent('global-chat-container', {
            height: '100%',
            placeholder: 'Chat with other players...',
            maxMessages: 50
        });

        // Set up message send handler
        chatComponent.setSendHandler(async (message) => {
            await globalChatService.sendMessage(message);
        });

        // Set up global chat service event handlers
        const unsubscribeMessage = globalChatService.onMessage((message) => {
            chatComponent.addMessage(message);
        });

        const unsubscribeConnection = globalChatService.onConnectionChange((state) => {
            chatComponent.updateConnectionStatus(state);
        });

        const unsubscribeError = globalChatService.onError((type, message) => {
            console.error('Global chat error:', type, message);
            chatComponent.showError(message);
        });

        // Store unsubscribe functions for cleanup
        chatUnsubscribeFunctions.push(unsubscribeMessage, unsubscribeConnection, unsubscribeError);

        // Initialize the global chat service
        const currentUser = {
            id: userId,
            username: userName,
            displayName: localStorage.getItem('displayName') || userName
        };

        await globalChatService.initialize(currentUser);
        console.log('Global chat initialized successfully');

    } catch (error) {
        console.error('Failed to initialize global chat:', error);
        // Show error in chat component if it exists
        if (chatComponent) {
            chatComponent.showError('Failed to connect to chat. Please refresh the page.');
        }
    }
}

/**
 * Clean up global chat resources
 */
function cleanupGlobalChat() {
    try {
        // Unsubscribe from all event handlers
        chatUnsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        chatUnsubscribeFunctions = [];

        // Disconnect from global chat service
        if (globalChatService) {
            globalChatService.disconnect();
        }

        // Destroy chat component
        if (chatComponent) {
            chatComponent.destroy();
            chatComponent = null;
        }

        console.log('Global chat cleaned up successfully');
    } catch (error) {
        console.error('Error cleaning up global chat:', error);
    }
}

/**
 * Initialize friend system component
 */
function initializeFriendSystem() {
    try {
        // Create friend system component
        friendSystemComponent = new FriendSystemComponent('friend-system-container');
        
        // Make it globally accessible for onclick handlers
        window.friendSystem = friendSystemComponent;
        
        console.log('Friend system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize friend system:', error);
        // Show error in the friend system container
        const container = document.getElementById('friend-system-container');
        if (container) {
            container.innerHTML = `
                <div class="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center">
                    <div class="text-center text-red-500">
                        <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                        <p>Failed to load friend system</p>
                        <p class="text-sm">Please refresh the page</p>
                    </div>
                </div>
            `;
        }
    }
}