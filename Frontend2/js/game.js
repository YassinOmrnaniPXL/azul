document.addEventListener("DOMContentLoaded", () => {
    // DOM element references
    const loadingState = document.getElementById('loadingState');
    const gameBoard = document.getElementById('gameBoard');
    const tableCenter = document.getElementById('tableCenter');
    const factoryDisplays = document.getElementById('factoryDisplays');
    const playersSection = document.getElementById('playersSection');
    const gameRound = document.getElementById('gameRound');
    const errorMessage = document.getElementById('errorMessage');

    // Backend URL
    const backendUrl = 'https://localhost:5051';

    // Game state
    let gameId = null;
    let gameData = null;
    let currentPlayerId = null;

    // Initialize
    init();

    /**
     * Initialize the game by checking for auth, getting gameId from URL, and loading game data
     */
    async function init() {
        try {
            // Check if user is authenticated
            const token = sessionStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            // Get current user info for player identification
            const currentUser = await getCurrentUser(token);
            if (currentUser) {
                currentPlayerId = currentUser.id;
            }

            // Get game ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            gameId = urlParams.get('gameId');

            if (!gameId) {
                showError('Geen geldig spel-ID gevonden. Ga terug naar de lobby.');
                return;
            }

            // Fetch and display game data
            await loadGameData();

            // Start polling for updates
            startGamePolling();
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Er is een fout opgetreden bij het initialiseren van het spel.');
        }
    }

    /**
     * Gets the current user info
     */
    async function getCurrentUser(token) {
        try {
            const response = await fetch(`${backendUrl}/api/Users/current`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }

    /**
     * Load game data from the API
     */
    async function loadGameData() {
        try {
            const token = sessionStorage.getItem('token');
            if (!token || !gameId) return;

            const response = await fetch(`${backendUrl}/api/Games/${gameId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                gameData = await response.json();
                console.log('Game data loaded:', gameData);
                
                // Debug the tile types
                debugGameData();
                
                if (gameData.tileFactory) {
                    console.log('Table center:', gameData.tileFactory.tableCenter);
                    console.log('Factory displays:', gameData.tileFactory.displays);
                }
                
                // Update UI
                updateGameUI();
                
                // Show game board and hide loading state
                loadingState.classList.add('hidden');
                gameBoard.classList.remove('hidden');
            } else if (response.status === 401) {
                showError('Uw sessie is verlopen. Log opnieuw in.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                let errorMsg = 'Kon het spel niet laden. Probeer het later opnieuw.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                showError(errorMsg);
            }
        } catch (error) {
            console.error('Error loading game data:', error);
            showError('Kan geen verbinding maken met de server. Controleer uw internetverbinding.');
        }
    }

    /**
     * Debug the game data to check tile types
     */
    function debugGameData() {
        if (!gameData || !gameData.tileFactory) return;
        
        console.log('DEBUG: Checking tile types');
        
        // Check table center
        if (gameData.tileFactory.tableCenter && gameData.tileFactory.tableCenter.tiles) {
            console.log('Table center tiles:', gameData.tileFactory.tableCenter.tiles);
            console.log('Types:', gameData.tileFactory.tableCenter.tiles.map(t => typeof t));
        }
        
        // Check factory displays
        if (gameData.tileFactory.displays) {
            gameData.tileFactory.displays.forEach((display, i) => {
                if (display.tiles) {
                    console.log(`Display ${i} tiles:`, display.tiles);
                    console.log(`Display ${i} tile types:`, display.tiles.map(t => typeof t));
                }
            });
        }
    }

    /**
     * Update the game UI based on the loaded game data
     */
    function updateGameUI() {
        if (!gameData) return;

        // Update game round
        gameRound.textContent = `Ronde ${gameData.roundNumber}`;

        // Clear existing elements
        tableCenter.innerHTML = '';
        factoryDisplays.innerHTML = '';
        playersSection.innerHTML = '';

        // Render table center
        renderTableCenter();

        // Render factory displays
        renderFactoryDisplays();

        // Render player boards
        renderPlayerBoards();
    }

    /**
     * Render the table center with tiles
     */
    function renderTableCenter() {
        if (!gameData || !gameData.tileFactory || !gameData.tileFactory.tableCenter) return;
    
        const centerTiles = gameData.tileFactory.tableCenter.tiles;
        console.log('Rendering table center tiles:', centerTiles);
    
        // Maak een Set van unieke tileTypes (want speler kiest alle van één type tegelijk)
        const uniqueTypes = [...new Set(centerTiles)];
    
        uniqueTypes.forEach(tileType => {
            const tile = createTileElement(tileType, 'factory-tile');
            tile.classList.add('cursor-pointer', 'hover:scale-105', 'transition-transform');
            tile.addEventListener('click', () => {
                handleTableCenterTileClick(tileType);
            });
            tableCenter.appendChild(tile);
        });
    }

    async function handleTableCenterTileClick(tileType) {
        if (currentPlayerId !== gameData.playerToPlayId) {
            showError('Het is niet jouw beurt ☆'); return;
        }
    
        const currentPlayer = gameData.players.find(p => p.id === currentPlayerId);
        if (currentPlayer.tilesToPlace && currentPlayer.tilesToPlace.length > 0) {
            showError('Je moet eerst je huidige tegels plaatsen voor je nieuwe mag nemen.'); return;
        }
    
        const token = sessionStorage.getItem('token');
        if (!token || !gameId) return;
    
        try {
            const response = await fetch(`${backendUrl}/api/Games/${gameId}/take-tiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    displayId: '00000000-0000-0000-0000-000000000000', // tafelcentrum-ID
                    tileType: tileType
                })
            });
    
            if (response.ok) {
                console.log(`Tegels van type ${tileType} succesvol opgepakt!`);
                await loadGameData(); // vernieuw UI
            } else {
                const err = await response.json();
                showError(err.message || 'Fout bij het selecteren van tegels.');
            }
        } catch (error) {
            console.error('Verzoek mislukt:', error);
            showError('Kan geen verbinding maken met de server');
        }
    }
    

    /**
     * Render all factory displays with tiles
     */
    function renderFactoryDisplays() {
        if (!gameData || !gameData.tileFactory || !gameData.tileFactory.displays) return;

        console.log('Rendering factory displays:', gameData.tileFactory.displays.length);
        
        gameData.tileFactory.displays.forEach((display, index) => {
            console.log(`Factory display ${index}:`, display);
            
            // Create factory display container
            const displayElement = document.createElement('div');
            displayElement.className = 'factory-display';
            displayElement.dataset.displayId = display.id;

            // Add tiles to the display in a grid layout
            if (display.tiles && display.tiles.length > 0) {
                display.tiles.forEach(tileType => {
                    console.log(`Creating factory tile of type: ${tileType} for display ${index}`);
                    const tile = createTileElement(tileType, 'factory-tile');
                    displayElement.appendChild(tile);
                });
            }

            factoryDisplays.appendChild(displayElement);
        });
    }

    /**
     * Render player boards for all players
     */
    function renderPlayerBoards() {
        if (!gameData || !gameData.players) return;

        gameData.players.forEach(player => {
            // Create player container
            const playerElement = document.createElement('div');
            playerElement.className = `player-container mb-6 pb-4 border-b border-gray-200`;
            
            // Create player info header
            const playerInfo = document.createElement('div');
            playerInfo.className = `player-info ${player.id === gameData.playerToPlayId ? 'current-player' : ''}`;
            
            const isCurrentUser = player.id === currentPlayerId;
            const playerNamePrefix = isCurrentUser ? 'Jij' : player.name;
            const playerTurn = player.id === gameData.playerToPlayId ? ' (Aan de beurt)' : '';
            
            playerInfo.innerHTML = `
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">${playerNamePrefix}${playerTurn}</h3>
                    <span class="text-sm">Score: ${player.board.score}</span>
                </div>
                ${player.hasStartingTile ? '<div class="mt-1 text-xs">Heeft de startingstegel</div>' : ''}
            `;
            
            // Create compact board layout
            const boardWrapper = document.createElement('div');
            boardWrapper.className = 'mt-3 flex flex-wrap gap-4';
            
            // Create pattern lines & floor line section
            const patternContainer = document.createElement('div');
            patternContainer.className = 'flex-1 min-w-[200px]';
            
            // Add title for pattern lines
            const patternTitle = document.createElement('h4');
            patternTitle.className = 'text-sm font-medium mb-2';
            patternTitle.textContent = 'Patroonlijnen';
            patternContainer.appendChild(patternTitle);
            
            // Create pattern lines
            const patternLinesSection = document.createElement('div');
            patternLinesSection.className = 'pattern-lines-section';
            
            // Create 5 pattern lines (rows 1-5)
            for (let i = 0; i < 5; i++) {
                const patternLine = document.createElement('div');
                patternLine.className = 'pattern-line';
                
                // Add empty spots (column numbers vary by row)
                for (let j = 0; j < i + 1; j++) {
                    const spot = document.createElement('div');
                    spot.className = 'pattern-tile-spot';
                    
                    // Get the line's tiles if available
                    if (player.board.patternLines && 
                        player.board.patternLines[i] && 
                        player.board.patternLines[i].tiles && 
                        j < player.board.patternLines[i].tiles.length) {
                        
                        const tileType = player.board.patternLines[i].tiles[j];
                        spot.classList.add(getTileColorClass(tileType));
                        spot.classList.add(getImageClass(tileType));
                    }
                    
                    patternLine.appendChild(spot);
                }
                
                patternLinesSection.appendChild(patternLine);
            }
            
            patternContainer.appendChild(patternLinesSection);
            
            // Add floor line section
            const floorLineSection = document.createElement('div');
            floorLineSection.className = 'mt-2';
            floorLineSection.innerHTML = '<h4 class="text-sm font-medium mb-2">Vloerlijn</h4>';
            
            const floorLine = document.createElement('div');
            floorLine.className = 'floor-line';
            
            // Add 7 floor line spots
            for (let i = 0; i < 7; i++) {
                const spot = document.createElement('div');
                spot.className = 'floor-tile-spot';
                
                // Fill in tile if it exists in the floor line
                if (player.board.floorLine && 
                    player.board.floorLine[i] && 
                    player.board.floorLine[i].hasTile) {
                    
                    // We don't know the exact tile type for floor line, use a default
                    const defaultTileType = 11; // Red tile as default
                    spot.classList.add(getTileColorClass(defaultTileType));
                    spot.classList.add(getImageClass(defaultTileType));
                }
                
                floorLine.appendChild(spot);
            }
            
            floorLineSection.appendChild(floorLine);
            patternContainer.appendChild(floorLineSection);
            
            // Create wall section
            const wallContainer = document.createElement('div');
            wallContainer.className = 'flex-1 min-w-[200px]';
            
            // Wall title with info tooltip
            wallContainer.innerHTML = `
                <h4 class="text-sm font-medium mb-2">
                    Muur
                    <div class="info-tooltip inline-block">
                        <i>ⓘ</i>
                        <span class="tooltip-text">In de muur worden tegels geplaatst volgens een vast patroon. Elke rij mag maar één tegel van elke kleur bevatten.</span>
                    </div>
                </h4>
                <p class="text-xs mb-2 text-gray-600">Tegels worden geplaatst volgens het patroon.</p>
            `;
            
            // Create the wall grid
            const wallGrid = document.createElement('div');
            wallGrid.className = 'wall-grid grid grid-cols-5 gap-1 p-2 bg-white rounded-lg border border-gray-200';
            
            // Add wall spots (5x5 grid)
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const spot = document.createElement('div');
                    const tileType = getTileTypeForWallPosition(row, col);
                    
                    // Check if tile is placed
                    const hasTile = player.board.wall && player.board.wall[row][col].hasTile;
                    
                    // Create the base spot
                    spot.className = 'wall-tile-spot';
                    
                    // Create a div for the tile
                    const tileDiv = document.createElement('div');
                    tileDiv.className = 'w-full h-full ' + getImageClass(tileType);
                    tileDiv.style.backgroundSize = 'cover';
                    spot.appendChild(tileDiv);
                    
                    // Add overlay for unfilled spots
                    if (!hasTile) {
                        // Create a semi-transparent overlay with a subtle border
                        const overlay = document.createElement('div');
                        overlay.className = 'wall-pattern-overlay';
                        
                        // Add a subtle outline to show the pattern more clearly
                        spot.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.1)';
                        
                        spot.appendChild(overlay);
                    } else {
                        // Add a subtle border for filled tiles
                        spot.style.border = '1px solid #666';
                        spot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    }
                    
                    wallGrid.appendChild(spot);
                }
            }
            
            wallContainer.appendChild(wallGrid);
            
            // Add tiles to place section if player has tiles to place
            if (player.tilesToPlace && player.tilesToPlace.length > 0) {
                const tilesToPlaceSection = document.createElement('div');
                tilesToPlaceSection.className = 'tiles-to-place mt-3 p-2 bg-azulCream rounded w-full';
                tilesToPlaceSection.innerHTML = '<h4 class="text-sm font-medium mb-2">Tegels om te plaatsen</h4><div class="flex flex-wrap"></div>';
                
                const tilesContainer = tilesToPlaceSection.querySelector('div');
                
                player.tilesToPlace.forEach(tileType => {
                    const tile = createTileElement(tileType, 'game-tile');
                    tilesContainer.appendChild(tile);
                });
                
                boardWrapper.appendChild(tilesToPlaceSection);
            }
            
            // Add both sections to the board wrapper
            boardWrapper.appendChild(patternContainer);
            boardWrapper.appendChild(wallContainer);
            
            // Assemble the player container
            playerElement.appendChild(playerInfo);
            playerElement.appendChild(boardWrapper);
            
            // Add to players section
            playersSection.appendChild(playerElement);
        });
    }

    /**
     * Create an HTML element for a tile
     */
    function createTileElement(tileType, className) {
        const tile = document.createElement('div');
        const colorClass = getTileColorClass(tileType);
        const imageClass = getImageClass(tileType);
        tile.className = `${className} ${colorClass} ${imageClass}`;
        tile.dataset.tileType = tileType;
        console.log(`Created tile element with type ${tileType}, color class ${colorClass}, and image class ${imageClass}`);
        return tile;
    }

    /**
     * Get CSS class for the tile background color (as fallback)
     */
    function getTileColorClass(tileType) {
        // Convert to number if it's a string
        const type = typeof tileType === 'string' ? parseInt(tileType, 10) : tileType;
        
        switch (type) {
            case 0: return 'bg-azulStartTile'; // StartingTile
            
            // Match the actual tile types from the backend
            case 11: return 'bg-azulTile1';    // PlainRed
            case 12: return 'bg-azulTile2';    // PlainBlue
            case 13: return 'bg-azulTile3';    // BlackBlue
            case 14: return 'bg-azulTile4';    // WhiteTurquoise
            case 15: return 'bg-azulTile5';    // YellowRed
            
            // Kept for backward compatibility
            case 1: return 'bg-azulTile1';     // PlainRed
            case 2: return 'bg-azulTile2';     // PlainBlue
            case 3: return 'bg-azulTile3';     // BlackBlue
            case 4: return 'bg-azulTile4';     // WhiteTurquoise
            case 5: return 'bg-azulTile5';     // YellowRed
            
            default: 
                console.warn(`Unknown tile type for color: ${tileType} (${typeof tileType})`);
                return 'bg-gray-300';          // Unknown
        }
    }

    /**
     * Get CSS class for the tile image
     */
    function getImageClass(tileType) {
        // Convert to number if it's a string
        const type = typeof tileType === 'string' ? parseInt(tileType, 10) : tileType;
        
        switch (type) {
            case 0: return 'img-azulStartTile'; // StartingTile
            
            // Match the actual tile types from the backend
            case 11: return 'img-azulTile1';    // PlainRed
            case 12: return 'img-azulTile2';    // PlainBlue
            case 13: return 'img-azulTile3';    // BlackBlue
            case 14: return 'img-azulTile4';    // WhiteTurquoise
            case 15: return 'img-azulTile5';    // YellowRed
            
            // Kept for backward compatibility
            case 1: return 'img-azulTile1';     // PlainRed
            case 2: return 'img-azulTile2';     // PlainBlue
            case 3: return 'img-azulTile3';     // BlackBlue
            case 4: return 'img-azulTile4';     // WhiteTurquoise
            case 5: return 'img-azulTile5';     // YellowRed
            
            default: 
                console.warn(`Unknown tile type for image: ${tileType} (${typeof tileType})`);
                return '';                      // No image
        }
    }

    /**
     * Start polling for game updates
     */
    function startGamePolling() {
        const pollInterval = 3000; // 3 seconds
        
        setInterval(() => {
            loadGameData();
        }, pollInterval);
    }

    /**
     * Display an error message
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    /**
     * Get the tile type for a specific position on the wall
     * The Azul wall follows a specific pattern for each position
     */
    function getTileTypeForWallPosition(row, col) {
        // Azul wall pattern (shifted by 1 each row)
        // Based on the standard Azul wall pattern where colors are arranged in a specific order
        const wallPattern = [
            [11, 12, 13, 14, 15], // Row 0: Red, Blue, Cyan, Purple, Yellow
            [15, 11, 12, 13, 14], // Row 1: Yellow, Red, Blue, Cyan, Purple
            [14, 15, 11, 12, 13], // Row 2: Purple, Yellow, Red, Blue, Cyan
            [13, 14, 15, 11, 12], // Row 3: Cyan, Purple, Yellow, Red, Blue
            [12, 13, 14, 15, 11]  // Row 4: Blue, Cyan, Purple, Yellow, Red
        ];
        
        return wallPattern[row][col];
    }
});
