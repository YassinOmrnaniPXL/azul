import { API_BASE_URL, getAuthHeaders } from './config.js';

/**
 * Fetches the current state of a game.
 * @param {string} gameId - The ID of the game to fetch.
 * @returns {Promise<Object|null>} The game data object or null if an error occurs.
 */
export async function fetchGameData(gameId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Games/${gameId}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            if (response.status === 404) throw new Error(`Game with ID ${gameId} not found.`);
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
            throw new Error(`Failed to fetch game data: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown API error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error in fetchGameData:', error);
        // Re-throw the error so the caller can handle UI updates (e.g., showError)
        throw error;
    }
}

/**
 * Joins an existing table or creates a new one based on preferences.
 * @param {{ numberOfPlayers: number, numberOfArtificialPlayers: number }} preferences 
 * @returns {Promise<Object|null>} The table data object or null if an error occurs.
 */
export async function joinOrCreateTable(preferences) {
    try {
        const response = await fetch(`${API_BASE_URL}/Tables/join-or-create`,
        {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(preferences),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
            throw new Error(`Failed to join or create table: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown API error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error in joinOrCreateTable:', error);
        throw error;
    }
}

/**
 * Joins a specific table by its ID.
 * @param {string} tableId - The ID of the table to join.
 * @returns {Promise<Object|null>} The table data object or null if an error occurs.
 */
export async function joinSpecificTable(tableId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Tables/${tableId}/join`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
            throw new Error(`Failed to join table: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown API error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error in joinSpecificTable:', error);
        throw error;
    }
}

/**
 * Fetches the status of a specific table.
 * @param {string} tableId - The ID of the table to fetch.
 * @returns {Promise<Object|null>} The table data object or null if an error occurs.
 */
export async function getTableStatus(tableId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Tables/${tableId}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            if (response.status === 404) throw new Error(`Table with ID ${tableId} not found.`);
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
            throw new Error(`Failed to get table status: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown API error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error in getTableStatus:', error);
        throw error;
    }
}

/**
 * Removes the current logged-in user from a table.
 * @param {string} tableId - The ID of the table to leave.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function leaveTable(tableId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Tables/${tableId}/leave`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
            throw new Error(`Failed to leave table: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown API error'}`);
        }
        return true; // Or handle specific response if backend returns one
    } catch (error) {
        console.error('Error in leaveTable:', error);
        throw error;
    }
}

// --- NEW --- Function to get all public joinable tables
export async function getPublicTables() {
    const response = await fetch(`${API_BASE_URL}/Tables/all-joinable`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch public tables: ${response.status} ${errorData || response.statusText}`);
    }
    return await response.json();
}

// --- NEW --- Function to tell the backend to start the game on a specific table
export async function startGameOnTable(tableId) {
    const response = await fetch(`${API_BASE_URL}/Tables/${tableId}/start-game`, {
        method: 'POST',
        headers: getAuthHeaders(), // Important for authentication
        // No body needed, the action is on the resource URL
    });
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to start game on table ${tableId}: ${response.status} ${errorData || response.statusText}`);
    }
    // Backend might return the updated table data with a gameId, or just a 200 OK.
    // Depending on backend, you might want to parse JSON: return await response.json();
    return true; // Assuming 200 OK means success for now
}

// --- Game Action API Calls (to be used later) ---

/**
 * Player takes tiles from a factory display or table center.
 * @param {string} gameId
 * @param {string} displayId - ID of the factory display or table center
 * @param {number} tileType - The type of tile to take
 * @returns {Promise<Object|null>} API response or null
 */
export async function takeTilesAction(gameId, displayId, tileType) {
    try {
        const response = await fetch(`${API_BASE_URL}/Games/${gameId}/take-tiles`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ displayId, tileType }),
        });
        if (!response.ok) {
            // Try to parse error as JSON, but fallback if it's not JSON
            let errorDetail = 'Unknown API error';
            try {
                const errorData = await response.json();
                errorDetail = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = await response.text() || response.statusText;
            }
            throw new Error(`Failed to take tiles: ${response.status} - ${errorDetail}`);
        }
        // If response.ok, assume success and no body needed for this action
        return true; 
    } catch (error) {
        console.error('Error in takeTilesAction:', error);
        throw error;
    }
}

/**
 * Player places tiles on a pattern line.
 * @param {string} gameId
 * @param {number} patternLineIndex - Index of the pattern line
 * @returns {Promise<Object|null>} API response or null
 */
export async function placeTilesOnPatternLineAction(gameId, patternLineIndex) {
    try {
        const response = await fetch(`${API_BASE_URL}/Games/${gameId}/place-tiles-on-patternline`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ patternLineIndex }),
        });
        if (!response.ok) {
            let errorDetail = 'Unknown API error';
            try {
                const errorData = await response.json();
                errorDetail = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = await response.text() || response.statusText;
            }
            throw new Error(`Failed to place tiles on pattern line: ${response.status} - ${errorDetail}`);
        }
        // If response.ok, assume success and no body needed
        return true;
    } catch (error) {
        console.error('Error in placeTilesOnPatternLineAction:', error);
        throw error;
    }
}

/**
 * Player places tiles on the floor line.
 * @param {string} gameId
 * @returns {Promise<Object|null>} API response or null
 */
export async function placeTilesOnFloorLineAction(gameId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Games/${gameId}/place-tiles-on-floorline`, {
            method: 'POST',
            headers: getAuthHeaders(),
            // No body expected for this according to GamesController.cs
        });
        if (!response.ok) {
            let errorDetail = 'Unknown API error';
            try {
                const errorData = await response.json();
                errorDetail = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = await response.text() || response.statusText;
            }
            throw new Error(`Failed to place tiles on floor line: ${response.status} - ${errorDetail}`);
        }
        // If response.ok, assume success and no body needed
        return true;
    } catch (error) {
        console.error('Error in placeTilesOnFloorLineAction:', error);
        throw error;
    }
} 