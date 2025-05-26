import { TILE_COLOR_CLASSES, WALL_PATTERN, FLOOR_LINE_PENALTIES, TileType, TILE_IMAGE_PATHS } from './config.js';
import { profilePictureService } from './profilePictureService.js';

let localPlayerId = null; // Will be set by the main game.js

export const setLocalPlayerId = (id) => {
    localPlayerId = id;
};

// Debug logging
const DEBUG = true; // Set to false in production
export const logDebug = (component, message, data = null) => {
    if (!DEBUG) return;
    
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${component}] ${message}`;
    
    if (data) {
        console.log(formattedMessage, data);
    } else {
        console.log(formattedMessage);
    }
    
    // Optionally log to a persistent location for debugging
    try {
        const existingLogs = JSON.parse(sessionStorage.getItem('gameLogs') || '[]');
        existingLogs.push({
            timestamp,
            component,
            message,
            data: data ? JSON.stringify(data).substring(0, 500) : null
        });
        // Keep only the last 100 logs to avoid memory issues
        while (existingLogs.length > 100) {
            existingLogs.shift();
        }
        sessionStorage.setItem('gameLogs', JSON.stringify(existingLogs));
    } catch (e) {
        console.error('Error saving log to session storage:', e);
    }
};

export const showLoading = (isLoading) => {
    const loadingElement = document.getElementById('loading-state');
    const gameContainer = document.getElementById('game-container');
    const errorElement = document.getElementById('error-state');

    if (loadingElement && gameContainer && errorElement) {
        if (isLoading) {
            loadingElement.classList.remove('hidden');
            gameContainer.classList.add('hidden');
            errorElement.classList.add('hidden');
        } else {
            loadingElement.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            // Keep error hidden unless explicitly shown
        }
    } else {
        console.warn('Loading or game container elements not found in showLoading');
    }
};

export const showError = (message, isTemp = true) => {
    logDebug('Error', message);
    
    const errorElement = document.getElementById('error-state');
    const errorTextElement = document.getElementById('error-text-game');
    const gameContainer = document.getElementById('game-container');
    const loadingElement = document.getElementById('loading-state');

    if (errorElement && errorTextElement) {
        errorTextElement.textContent = message;
        errorElement.classList.remove('hidden');
        
        // Only hide the game container for serious errors
        if (!isTemp) {
            if (gameContainer) gameContainer.classList.add('hidden');
            if (loadingElement) loadingElement.classList.add('hidden');
        } else {
            // For temp errors, show error banner but keep game visible
            if (gameContainer && gameContainer.classList.contains('hidden')) {
                gameContainer.classList.remove('hidden');
            }
            if (loadingElement && !loadingElement.classList.contains('hidden')) {
        loadingElement.classList.add('hidden');
            }
            
            // Auto-hide temporary errors after 5 seconds
            setTimeout(() => {
                if (errorElement && !errorElement.classList.contains('hidden')) {
                    errorElement.classList.add('hidden');
                }
            }, 5000);
        }
    } else {
        console.warn('Error display elements not found in showError. Error state ID: error-state, Error text ID: error-text-game');
        alert(`Error: ${message}`); // Fallback to alert
    }
};

export const showConnectionStatus = (isConnected, isPolling, isConnecting = false, isWsError = false, isWsDisconnectedCleanly = false) => {
    const statusBar = document.getElementById('connection-status-container');
    if (!statusBar) {
        logDebug('Renderer', 'Connection status container element not found (expected ID: connection-status-container).');
        return;
    }
    
    // Remove any existing connection status indicator
    const existingIndicator = document.getElementById('connection-status');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create new status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'connection-status';
    statusIndicator.classList.add('text-xs', 'px-2', 'py-1', 'rounded', 'mr-2', 'flex', 'items-center', 'border');
    
    // Create status icon
    const statusIcon = document.createElement('span');
    statusIcon.classList.add('inline-block', 'w-2', 'h-2', 'rounded-full', 'mr-2');
    
    // Create status text
    const statusText = document.createElement('span');
    
    if (isConnected) {
        statusIcon.classList.add('bg-green-500');
        statusText.textContent = 'Live: Connected (WS)';
        statusIndicator.classList.add('bg-green-100', 'text-green-800', 'border-green-300');
        statusIndicator.title = 'WebSocket connection is active.';
    } else if (isConnecting) {
        statusIcon.classList.add('bg-blue-500'); // Blue for connecting
        statusText.textContent = 'Live: Connecting...';
        statusIndicator.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
        statusIndicator.title = 'Attempting to establish WebSocket connection.';
    } else if (isPolling) {
        statusIcon.classList.add('bg-yellow-500');
        statusText.textContent = 'Live: Polling';
        statusIndicator.classList.add('bg-yellow-100', 'text-yellow-800', 'border-yellow-300');
        statusIndicator.title = 'Using fallback polling for updates. Game may be slightly delayed.';
    } else if (isWsError) {
        statusIcon.classList.add('bg-red-500');
        statusText.textContent = 'Live: Connection Error';
        statusIndicator.classList.add('bg-red-100', 'text-red-800', 'border-red-300');
        statusIndicator.title = 'WebSocket connection error. May fallback to polling or require refresh.';
    } else if (isWsDisconnectedCleanly) {
        statusIcon.classList.add('bg-gray-500'); // Gray for clean disconnect
        statusText.textContent = 'Live: Disconnected';
        statusIndicator.classList.add('bg-gray-100', 'text-gray-800', 'border-gray-300');
        statusIndicator.title = 'WebSocket connection closed. May attempt to reconnect or switch to polling.';
    } else { // Default disconnected state (e.g. initial state, or unexpected)
        statusIcon.classList.add('bg-red-500');
        statusText.textContent = 'Live: Disconnected';
        statusIndicator.classList.add('bg-red-100', 'text-red-800', 'border-red-300');
        statusIndicator.title = 'No live connection. Game updates may not be real-time.';
    }
    
    // Add the icon and text to the indicator
    statusIndicator.appendChild(statusIcon);
    statusIndicator.appendChild(statusText);
    
    // Clear previous content and append new status
    statusBar.innerHTML = ''; 
    statusBar.appendChild(statusIndicator);
};

const getTileDisplayClass = (tileType) => {
    return TILE_COLOR_CLASSES[tileType] || 'tile-empty';
};

const createTileElement = (tileType, isEmpty = false) => {
    const tileDiv = document.createElement('div');
    tileDiv.classList.add('tile', 'cursor-pointer', 'transition-transform', 'duration-150', 'ease-in-out', 'hover:scale-110', 'focus:scale-110', 'focus:outline-none', 'focus:ring-2', 'focus:ring-azulAccent');

    if (isEmpty || tileType === null || tileType === undefined) {
        tileDiv.classList.add('tile-empty-slot');
    } else {
        const imagePath = TILE_IMAGE_PATHS[tileType]; // Check for image path first, including for STARTING_TILE

        if (imagePath) { // If any tile has a defined image path, use it
            const img = document.createElement('img');
            img.src = imagePath;
            let altTextBase = 'tile';
            if (tileType === TileType.STARTING_TILE) {
                altTextBase = 'Starting player';
            } else if (TILE_COLOR_CLASSES[tileType]) {
                altTextBase = TILE_COLOR_CLASSES[tileType].replace('tile-', '');
            } else {
                altTextBase = `type ${tileType}`;
            }
            img.alt = altTextBase.charAt(0).toUpperCase() + altTextBase.slice(1) + ' tile';
            tileDiv.appendChild(img);
        } else if (tileType === TileType.STARTING_TILE) { // Fallback for STARTING_TILE if no image
            tileDiv.classList.add('tile-starting-player-bg'); // Use a specific background class
            tileDiv.textContent = 'S'; // Display 'S'
            tileDiv.setAttribute('aria-label', 'Starting player tile');
        } else { // Fallback for other tiles if no image
            const fallbackClass = TILE_COLOR_CLASSES[tileType];
            if (fallbackClass) {
                tileDiv.classList.add(fallbackClass + '-bg'); // e.g., tile-blue-bg
            } else {
                tileDiv.classList.add('tile-unknown-bg'); // Generic fallback for unknown types
                tileDiv.textContent = '?'; // Indicate unknown
                console.warn(`Unknown tile type without image or specific class: ${tileType}`);
            }
            // Add aria-label for fallback tiles
            const ariaLabelForFallback = TILE_COLOR_CLASSES[tileType] ? TILE_COLOR_CLASSES[tileType].replace('tile-', '') : `tile type ${tileType}`;
            tileDiv.setAttribute('aria-label', ariaLabelForFallback.charAt(0).toUpperCase() + ariaLabelForFallback.slice(1) + ' tile');
        }
    }
    return tileDiv;
};

const renderPatternLines = (patternLinesData, containerId, isInteractive, lineClickHandler) => {
    logDebug('renderPatternLines', 'Entry', { 
        containerId, 
        isInteractive, 
        lineClickHandlerIsFunction: typeof lineClickHandler === 'function' 
    });
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Pattern lines container '${containerId}' not found.`);
        return;
    }
    container.innerHTML = '<h4 class="text-lg font-semibold text-azulBlue font-display mb-2">Pattern Lines</h4>';

    patternLinesData.forEach((line, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.classList.add('flex', 'items-center', 'justify-end', 'space-x-1', 'mb-0.5');
        lineDiv.dataset.lineIndex = index;

        for (let i = 0; i < 5 - line.length; i++) {
            const emptyVisualSlot = document.createElement('div');
            emptyVisualSlot.classList.add('w-8', 'h-8');
            lineDiv.appendChild(emptyVisualSlot);
        }

        for (let i = 0; i < line.length; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('pattern-line-slot');
            if (i < line.numberOfTiles && line.tileType !== null && line.tileType !== undefined) {
                slotDiv.appendChild(createTileElement(line.tileType));
            } else {
                slotDiv.classList.add('tile-empty');
            }
            if (isInteractive) {
                // Ensure lineClickHandler is a function before adding event listener that uses it
                if (typeof lineClickHandler !== 'function') {
                    logDebug('renderPatternLines', 'CRITICAL_ERROR: lineClickHandler is NOT a function when trying to make line interactive', { lineIndex: index, lineClickHandler });
                    // Fallback or skip adding listener if handler is invalid
                    // For now, this will still allow the game to render but clicks will do nothing/log error if not checked inside listener too
                }

                lineDiv.addEventListener('click', (event) => {
                    if (typeof lineClickHandler === 'function') {
                        lineClickHandler(index, -1, 'pattern');
                    } else {
                        logDebug('renderPatternLines', 'Click ignored: lineClickHandler was not a function.', { lineIndex: index });
                        // Optionally, you could show an error to the user here or in the handler check above.
                    }
                });
                lineDiv.setAttribute('role', 'button');
                slotDiv.setAttribute('tabindex', '0');
                slotDiv.setAttribute('role', 'button');
                slotDiv.setAttribute('aria-label', `Pattern line ${index + 1}, slot ${i + 1}. Capacity: ${line.length}. Filled: ${line.numberOfTiles}. Tile Type: ${line.tileType !== null ? TILE_COLOR_CLASSES[line.tileType] : 'N/A'}. Click to place tiles.`);
                slotDiv.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        if (typeof lineClickHandler === 'function') {
                            lineClickHandler(index, -1, 'pattern');
                        } else {
                            logDebug('renderPatternLines', 'Keydown ignored: lineClickHandler was not a function.', { lineIndex: index });
                        }
                    }
                });
            }
            lineDiv.appendChild(slotDiv);
        }
        container.appendChild(lineDiv);
    });
};

const renderWall = (wallData, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Wall container '${containerId}' not found.`);
        return;
    }
    container.innerHTML = '<h4 class="text-lg font-semibold text-azulBlue font-display mb-2 col-span-5 text-center">Wall</h4>';
    container.classList.add('grid', 'grid-cols-5', 'gap-0.5');

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const wallSlotDiv = document.createElement('div');
            wallSlotDiv.classList.add('wall-slot');
            const fixedPatternTileType = WALL_PATTERN[i][j];

            if (wallData[i][j] && wallData[i][j].hasTile) {
                wallSlotDiv.appendChild(createTileElement(wallData[i][j].type));
                wallSlotDiv.setAttribute('aria-label', `Wall row ${i + 1}, column ${j + 1}. Filled with ${TILE_COLOR_CLASSES[wallData[i][j].type]}. Expected: ${TILE_COLOR_CLASSES[fixedPatternTileType]}`);
            } else {
                const emptyTilePlaceholder = createTileElement(fixedPatternTileType);
                emptyTilePlaceholder.classList.add('opacity-30');
                wallSlotDiv.appendChild(emptyTilePlaceholder);
                wallSlotDiv.setAttribute('aria-label', `Wall row ${i + 1}, column ${j + 1}. Empty. Expected: ${TILE_COLOR_CLASSES[fixedPatternTileType]}`);
            }
            wallSlotDiv.setAttribute('tabindex', '-1'); // Generally not interactive for placement
            container.appendChild(wallSlotDiv);
        }
    }
};

const renderFloorLine = (floorLineData, containerId, isInteractive, lineClickHandler) => {
    logDebug('renderFloorLine', 'Entry', { 
        containerId, 
        isInteractive, 
        lineClickHandlerIsFunction: typeof lineClickHandler === 'function' 
    });
    const floorLineElement = document.getElementById(containerId);
     if (!floorLineElement) {
        console.error(`Floor line container '${containerId}' not found.`);
        return;
    }
    const container = floorLineElement.querySelector('div'); // Target the inner div for slots
    if (!container) {
        console.error(`Inner div for floor line slots in '${containerId}' not found.`);
        return;
    }
    container.innerHTML = '';

    FLOOR_LINE_PENALTIES.forEach((penalty, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('floor-line-slot', 'relative');
        const penaltyText = document.createElement('span');
        penaltyText.classList.add('absolute', 'text-xs', 'top-0', 'left-0', 'text-red-700', 'font-semibold', 'p-0.5');
        penaltyText.textContent = penalty;
        slotDiv.appendChild(penaltyText);

        if (index < floorLineData.length && floorLineData[index] && floorLineData[index].hasTile) {
            slotDiv.appendChild(createTileElement(floorLineData[index].type));
             slotDiv.setAttribute('aria-label', `Floor line slot ${index + 1}. Penalty: ${penalty}. Filled: ${TILE_COLOR_CLASSES[floorLineData[index].type]}.`);
        } else {
            slotDiv.classList.add('tile-empty');
            slotDiv.setAttribute('aria-label', `Floor line slot ${index + 1}. Penalty: ${penalty}. Empty.`);
        }
        // Make the entire floor line area (or individual slots if preferred) clickable if interactive
        if (isInteractive) {
            // Ensure lineClickHandler is a function before adding event listener that uses it
            if (typeof lineClickHandler !== 'function') {
                logDebug('renderFloorLine', 'CRITICAL_ERROR: lineClickHandler is NOT a function when trying to make slot interactive', { slotIndex: index, lineClickHandler });
            }

            slotDiv.addEventListener('click', (event) => {
                // const slotIndex = parseInt(event.currentTarget.dataset.slotIndex); // Not needed if using i directly
                if (typeof lineClickHandler === 'function') {
                    lineClickHandler(-1, index, 'floor'); // -1 for lineIndex as floor line slots are individual
                } else {
                    logDebug('renderFloorLine', 'Click ignored: lineClickHandler was not a function.', { slotIndex: index });
                }
            });
            slotDiv.setAttribute('role', 'button');
            slotDiv.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    // const slotIndex = parseInt(event.currentTarget.dataset.slotIndex);
                    if (typeof lineClickHandler === 'function') {
                        lineClickHandler(-1, index, 'floor');
                    } else {
                        logDebug('renderFloorLine', 'Keydown ignored: lineClickHandler was not a function.', { slotIndex: index });
                    }
                }
            });
        }
        container.appendChild(slotDiv);
    });
};

export const renderPlayerBoard = (player, isItLocalPlayer, lineClickHandler) => {
    logDebug('renderPlayerBoard', 'Entry', { 
        playerId: player ? player.id : 'N/A', 
        isItLocalPlayer, 
        lineClickHandlerIsFunction: typeof lineClickHandler === 'function' 
    });
    const boardContainerId = isItLocalPlayer ? 'current-player-board-container' : `opponent-board-${player.id}`;
    let playerBoardSection = document.getElementById(boardContainerId);

    if (!playerBoardSection && !isItLocalPlayer) {
        playerBoardSection = document.createElement('div');
        playerBoardSection.id = boardContainerId;
        playerBoardSection.classList.add('p-4', 'bg-white', 'rounded-lg', 'shadow', 'mb-4');
        document.getElementById('opponent-boards-container').appendChild(playerBoardSection);
    }
    
    if (!playerBoardSection) {
        console.error(`Board container ${boardContainerId} not found.`);
        return;
    }

    if (isItLocalPlayer) {
        // Ensure the main player board container HTML is set up if not already (e.g. after a clear)
        // This structure should match what's expected by renderPatternLines, renderWall, renderFloorLine
        if (!document.getElementById('local-player-name')) { // Check if board content needs to be scaffolded
             playerBoardSection.innerHTML = `
                <div class="flex items-center mb-3">
                    <img id="local-player-avatar" src="images/Default_pfp.jpg" alt="Profile Picture" class="w-12 h-12 rounded-full object-cover border-2 border-azulBlue mr-3">
                    <h3 class="text-xl font-bold font-display text-azulBlue"><span id="local-player-name">${player.name}</span> Board</h3>
                </div>
                <div id="player-board">
                    <div class="flex flex-col md:flex-row justify-between items-start mb-4 md:space-x-4">
                        <div id="pattern-lines" class="space-y-1 w-full md:w-auto mb-4 md:mb-0"></div>
                        <div id="wall" class="grid grid-cols-5 gap-0.5 w-full md:w-auto"></div>
                    </div>
                    <div id="floor-line" class="mt-4 cursor-pointer" role="button" tabindex="0" aria-label="Place chosen tiles on Floor Line">
                        <h4 class="text-lg font-semibold text-gray-700 font-display mb-2">Floor Line</h4>
                        <div class="flex flex-wrap space-x-1">
                            <!-- JS will generate floor line slots here -->
                        </div>
                    </div>
                    <p class="mt-3 text-lg"><span class="text-gray-700 font-semibold">Score:</span> <span id="player-score" class="font-mono font-bold text-azulBlue text-xl">0</span></p>
                </div>`;
        }

        const localPlayerNameEl = document.getElementById('local-player-name');
        if (localPlayerNameEl) localPlayerNameEl.textContent = player.name; // Already set in scaffold, but good to ensure

        const playerScoreEl = document.getElementById('player-score');
        if (playerScoreEl) playerScoreEl.textContent = player.board.score;

        // Load and set profile picture for local player
        const localPlayerAvatar = document.getElementById('local-player-avatar');
        if (localPlayerAvatar) {
            profilePictureService.getProfilePictureUrl(player.id)
                .then(profilePictureUrl => {
                    localPlayerAvatar.src = profilePictureUrl;
                })
                .catch(error => {
                    console.warn('Failed to load local player profile picture:', error);
                    // Keep default image
                });
        }
        
        logDebug('renderPlayerBoard', 'Before calling renderPatternLines for local player', { lineClickHandlerIsFunction: typeof lineClickHandler === 'function', isItLocalPlayer });
        renderPatternLines(player.board.patternLines, 'pattern-lines', true, lineClickHandler);
        renderWall(player.board.wall, 'wall');
        
        logDebug('renderPlayerBoard', 'Before calling renderFloorLine for local player', { lineClickHandlerIsFunction: typeof lineClickHandler === 'function', isItLocalPlayer });
        renderFloorLine(player.board.floorLine, 'floor-line', true, lineClickHandler); // isInteractive passed as true

        // Add click listener to the main floor-line div for placing tiles
        const floorLineDiv = document.getElementById('floor-line');
        if (floorLineDiv && lineClickHandler) {
            // Remove old listener to prevent duplicates if re-rendering
            const newFloorLineDiv = floorLineDiv.cloneNode(true);
            floorLineDiv.parentNode.replaceChild(newFloorLineDiv, floorLineDiv);
            
            newFloorLineDiv.addEventListener('click', () => lineClickHandler(null, null, 'floor'));
            newFloorLineDiv.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    lineClickHandler(null, null, 'floor');
                }
            });
        }

    } else {
        playerBoardSection.innerHTML = `
            <div class="flex items-center mb-2">
                <img id="opponent-avatar-${player.id}" src="images/Default_pfp.jpg" alt="Profile Picture" class="w-10 h-10 rounded-full object-cover border-2 border-azulAccent mr-2">
                <div>
                    <h3 class="text-md font-semibold text-azulBlue font-display">${player.name} (Opponent)</h3>
                    <p class="text-sm text-gray-600">Score: <span class="font-mono font-semibold text-azulBlue">${player.board.score}</span></p>
                </div>
            </div>
            <div class="flex flex-col sm:flex-row justify-between items-start mb-3 mt-2">
                <div id="opponent-pattern-${player.id}" class="space-y-0.5 w-full sm:w-auto mb-3 sm:mb-0"></div>
                <div id="opponent-wall-${player.id}" class="grid grid-cols-5 gap-0.5 w-full sm:w-auto"></div>
            </div>
            <div id="opponent-floor-${player.id}" class="mt-1">
                 <h4 class="text-sm font-semibold text-gray-700 font-display mb-1">Floor Line</h4>
                 <div class="flex flex-wrap space-x-0.5"></div>
            </div>
        `;
        // Consistent styling for opponent board cards
        playerBoardSection.className = 'p-3 bg-white rounded-lg shadow-md border border-gray-200 mb-4';

        // Load and set profile picture for opponent
        const opponentAvatar = document.getElementById(`opponent-avatar-${player.id}`);
        if (opponentAvatar) {
            profilePictureService.getProfilePictureUrl(player.id)
                .then(profilePictureUrl => {
                    opponentAvatar.src = profilePictureUrl;
                })
                .catch(error => {
                    console.warn(`Failed to load opponent profile picture for ${player.name}:`, error);
                    // Keep default image
                });
        }

        renderPatternLines(player.board.patternLines, `opponent-pattern-${player.id}`, false, null);
        renderWall(player.board.wall, `opponent-wall-${player.id}`);
        renderFloorLine(player.board.floorLine, `opponent-floor-${player.id}`, false, null);
    }
};

export const renderTileFactory = (tileFactoryData, factoryTileClickHandler) => {
    const displaysContainer = document.getElementById('factory-displays');
    if (!displaysContainer) { console.error('Factory displays container not found.'); return; }
    displaysContainer.innerHTML = ''; // Clear previous content

    if (tileFactoryData && tileFactoryData.displays) {
        tileFactoryData.displays.forEach(display => {
            if (display.tiles.length > 0) { // Only render display if it has tiles
                const displayDiv = document.createElement('div');
                displayDiv.classList.add('factory-display', 'p-2', 'border', 'border-sky-200', 'rounded', 'bg-sky-50', 'flex', 'flex-wrap', 'justify-center', 'items-center', 'gap-1', 'min-h-[4.5rem]');
                displayDiv.dataset.displayId = display.id;

                display.tiles.forEach(tileType => {
                    const tileElement = createTileElement(tileType);
                    tileElement.setAttribute('role', 'button');
                    tileElement.setAttribute('tabindex', '0');
                    let tileNameForAria = TILE_COLOR_CLASSES[tileType] ? TILE_COLOR_CLASSES[tileType].replace('tile-', '') : `type ${tileType}`;
                    if (tileType === TileType.STARTING_TILE) tileNameForAria = 'Starting Player';
                    tileElement.setAttribute('aria-label', `Take ${tileNameForAria} tile(s) from display ${display.id.substring(0, 4)}`);
                    
                    const clickHandler = (event) => {
                        event.stopPropagation(); 
                        factoryTileClickHandler(display.id, tileType, 'display');
                    };
                    tileElement.addEventListener('click', clickHandler);
                    tileElement.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            clickHandler(event); 
                        }
                    });
                    displayDiv.appendChild(tileElement);
                });
                displaysContainer.appendChild(displayDiv);
            } else {
                const emptyDisplayDiv = document.createElement('div');
                emptyDisplayDiv.classList.add('factory-display', 'p-2', 'border', 'border-dashed', 'border-gray-200', 'rounded', 'bg-slate-50', 'flex', 'justify-center', 'items-center', 'min-h-[4.5rem]', 'text-xs', 'text-gray-400', 'italic');
                emptyDisplayDiv.textContent = 'Empty';
                emptyDisplayDiv.setAttribute('aria-label', 'Empty factory display');
                displaysContainer.appendChild(emptyDisplayDiv);
            }
        });
    }

    const tableCenterContainer = document.getElementById('table-center-tiles');
    if (!tableCenterContainer) { console.error('Table center container not found.'); return; }
    tableCenterContainer.innerHTML = ''; // Clear previous content

    if (tileFactoryData && tileFactoryData.tableCenter && tileFactoryData.tableCenter.tiles) {
        const tableCenterActualId = tileFactoryData.tableCenter.id; // Get the actual ID
        if (!tableCenterActualId) {
            console.error("Table Center ID is missing from tileFactoryData.tableCenter.id");
            // Potentially render an error or stop, as clicks won't work
        }

        if (tileFactoryData.tableCenter.tiles.length === 0) {
            const emptyCenterText = document.createElement('p');
            emptyCenterText.textContent = 'Table center is empty.';
            emptyCenterText.classList.add('text-gray-500', 'italic');
            tableCenterContainer.appendChild(emptyCenterText);
        } else {
            tileFactoryData.tableCenter.tiles.forEach(tileType => {
                const tileElement = createTileElement(tileType);
                tileElement.setAttribute('role', 'button');
                tileElement.setAttribute('tabindex', '0');
                let tileName = 'tile';
                if (tileType === TileType.STARTING_TILE) tileName = 'Starting Player';
                else if (TILE_COLOR_CLASSES[tileType]) tileName = TILE_COLOR_CLASSES[tileType].replace('tile-','');
                tileElement.setAttribute('aria-label', `Take ${tileName} tile(s) from table center`);
                
                const clickHandler = (event) => {
                    event.stopPropagation(); 
                    factoryTileClickHandler(tableCenterActualId, tileType, 'center'); 
                };
                tileElement.addEventListener('click', clickHandler);
                tileElement.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        clickHandler(event);
                    }
                });
                tableCenterContainer.appendChild(tileElement);
            });
        }
    }
};

export const renderChosenTilesArea = (tilesToPlace) => {
    const chosenTilesContainer = document.getElementById('chosen-tiles-container');
    const chosenTilesDisplay = document.getElementById('chosen-tiles-display');

    if (!chosenTilesContainer || !chosenTilesDisplay) {
        console.error('Chosen tiles display elements not found.');
        return;
    }

    chosenTilesDisplay.innerHTML = ''; // Clear previous tiles

    // Make sure the main container is always visible by removing 'hidden' if it exists
    chosenTilesContainer.classList.remove('hidden');

    if (tilesToPlace && tilesToPlace.length > 0) {
        tilesToPlace.forEach(tileType => {
            const tileElement = createTileElement(tileType);
            // Make these tiles not interactive, they are just for display
            tileElement.style.cursor = 'default'; 
            tileElement.classList.remove('tile-interactive', 'cursor-pointer', 'hover:scale-110', 'focus:scale-110'); // Remove interactive classes
            tileElement.removeAttribute('role');
            tileElement.removeAttribute('tabindex');
            chosenTilesDisplay.appendChild(tileElement);
        });
    } else {
        // Display a placeholder message if no tiles are chosen
        const placeholder = document.createElement('p');
        placeholder.textContent = 'Selected tiles will appear here.';
        placeholder.classList.add('text-sm', 'text-gray-500', 'italic');
        chosenTilesDisplay.appendChild(placeholder);
    }
};

export const renderGameInfo = (gameData, allPlayers) => {
    const roundNumberEl = document.getElementById('round-number');
    if (roundNumberEl) roundNumberEl.textContent = gameData.roundNumber;
    
    const currentPlayerNameEl = document.getElementById('current-player-name');
    const currentPlayerIdEl = document.getElementById('current-player-id');
    const currentPlayer = allPlayers.find(p => p.id === gameData.playerToPlayId);
    if (currentPlayerNameEl) currentPlayerNameEl.textContent = currentPlayer ? currentPlayer.name : 'N/A';
    if (currentPlayerIdEl) currentPlayerIdEl.textContent = gameData.playerToPlayId;

    // Game over message is now handled in renderGame
};

export const renderGame = (gameData, lineClickHandler, factoryTileClickHandler) => {
    logDebug('renderGame', 'Entry', { 
        gameDataExists: !!gameData, 
        lineClickHandlerIsFunction: typeof lineClickHandler === 'function',
        factoryTileClickHandlerIsFunction: typeof factoryTileClickHandler === 'function'
    });
    if (!gameData) {
        showError('No game data to render.');
        return;
    }

    const localPlayer = gameData.players.find(p => p.id === localPlayerId);
    const opponents = gameData.players.filter(p => p.id !== localPlayerId);

    // Render Game Info
    renderGameInfo(gameData, gameData.players);

    // Render Tile Factory (Displays and Table Center)
    if (gameData.tileFactory) {
        renderTileFactory(gameData.tileFactory, factoryTileClickHandler);
    }

    // Render Local Player's Board and Chosen Tiles
    if (localPlayer) {
        logDebug('renderGame', 'Rendering local player board', { playerId: localPlayer.id, lineClickHandlerIsFunction: typeof lineClickHandler === 'function' });
        renderPlayerBoard(localPlayer, true, lineClickHandler);
        renderChosenTilesArea(localPlayer.tilesToPlace);
    } else {
        logDebug('renderGame', 'Local player not found in gameData for rendering player board.', { localPlayerId });
        // Hide chosen tiles area if local player not found for some reason
        const chosenTilesContainer = document.getElementById('chosen-tiles-container');
        if (chosenTilesContainer) chosenTilesContainer.classList.add('hidden');
    }

    // Render Opponent Boards
    const opponentBoardsContainer = document.getElementById('opponent-boards-container');
    if (opponentBoardsContainer) {
        opponentBoardsContainer.innerHTML = ''; // Clear previous opponent boards
        opponents.forEach(opponent => {
            logDebug('renderGame', 'Rendering opponent board', { playerId: opponent.id });
            renderPlayerBoard(opponent, false, null); // Opponent boards are not interactive for current player
        });
    } else {
        console.warn('Opponent boards container not found.');
    }

    // Handle Game Over state
    const gameContainer = document.getElementById('game-container');
    let gameOverDisplayContainer = document.getElementById('game-over-display-container');

    if (gameData.hasEnded) {
        if (!gameOverDisplayContainer) {
            gameOverDisplayContainer = document.createElement('div');
            gameOverDisplayContainer.id = 'game-over-display-container';
            gameOverDisplayContainer.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50'; // Full screen overlay
            
            const gameOverContent = document.createElement('div');
            gameOverContent.className = 'bg-azulCream p-6 md:p-8 rounded-lg shadow-xl text-center max-w-md w-full border border-azulBlue/20'; // Added border
            
            let winnerText = '<h2 class="text-3xl font-bold font-display text-azulBlue mb-4">Game Over!</h2>';
            
            if (gameData.winners && gameData.winners.length > 0) {
                const winnerNames = gameData.winners.map(w => w.name).join(', ');
                winnerText += `<p class="text-xl text-azulAccent font-semibold mb-1">Winner(s): ${winnerNames}</p>`;
                // Additional details about tie-breaking could be added if backend provides it
                // For example: gameData.tieBreakInfo
            } else {
                winnerText += '<p class="text-xl text-gray-700 mb-1">The game has concluded.</p>';
            }
            
            winnerText += '<h3 class="text-lg font-semibold text-azulBlue mt-6 mb-2">Final Scores:</h3>';
            winnerText += '<div class="space-y-1 text-left max-w-xs mx-auto">';
            gameData.players.forEach(p => {
                winnerText += `<p class="text-gray-800"><span class="font-medium">${p.name}:</span> <span class="font-bold">${p.board.score} points</span></p>`;
            });
            winnerText += '</div>';

            winnerText += `<button id="return-to-lobby-button" class="mt-8 bg-azulAccent hover:bg-yellow-500 text-azulBlue font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50">Return to Lobby</button>`;
            
            gameOverContent.innerHTML = winnerText;
            gameOverDisplayContainer.appendChild(gameOverContent);
            
            // Prepend to body for true overlay, or gameContainer if preferred for scoping
            document.body.appendChild(gameOverDisplayContainer); 
            
            const returnButton = document.getElementById('return-to-lobby-button');
            if (returnButton) {
                returnButton.addEventListener('click', () => {
                    window.location.href = 'lobby.html';
                });
            }
        }
    } else {
        // If game is not ended, ensure any old game over display is removed (e.g., if state changed back somehow, though unlikely)
        if (gameOverDisplayContainer) {
            gameOverDisplayContainer.remove();
        }
    }

    // Setup How to Play Modal Listeners (do this once)
    const howToPlayButton = document.getElementById('how-to-play-button');
    const closeHowToPlayButton = document.getElementById('close-how-to-play-button');
    const howToPlayModal = document.getElementById('how-to-play-modal');

    if (howToPlayButton && closeHowToPlayButton && howToPlayModal) {
        if (!howToPlayButton.dataset.listenerAttached) {
            howToPlayButton.addEventListener('click', () => {
                howToPlayModal.classList.remove('hidden');
            });
            closeHowToPlayButton.addEventListener('click', () => {
                howToPlayModal.classList.add('hidden');
            });
            // Close modal if clicking outside of it
            howToPlayModal.addEventListener('click', (event) => {
                if (event.target === howToPlayModal) {
                    howToPlayModal.classList.add('hidden');
                }
            });
            howToPlayButton.dataset.listenerAttached = 'true';
        }
    } else {
        console.warn('How to Play modal elements not found. Functionality will be missing.');
    }
}; 