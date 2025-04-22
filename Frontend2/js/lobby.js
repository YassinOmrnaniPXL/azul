document.addEventListener("DOMContentLoaded", () => {
    // Select DOM elements
    const playerOptions = document.querySelectorAll('.player-option');
    const joinTableBtn = document.getElementById('joinTableBtn');
    const statusMessage = document.getElementById('statusMessage');
    const tableStatus = document.getElementById('tableStatus');
    const tableDetails = document.getElementById('tableDetails');
    const errorMessage = document.getElementById('errorMessage');
    
    // Backend API URL - may need to be updated based on environment
    const backendUrl = 'https://localhost:5051';
    
    // Store selected player count
    let selectedPlayerCount = null;
    
    // Check if user is authenticated
    checkAuthStatus();
    
    // Add selection functionality to player options
    playerOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Clear previous selection
            playerOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Apply selection to clicked option
            option.classList.add('selected');
            
            // Get player count from option id (e.g., "option-2" -> 2)
            selectedPlayerCount = parseInt(option.id.split('-')[1]);
            
            // Enable join button
            joinTableBtn.disabled = false;
        });
    });
    
    // Join table button click handler
    joinTableBtn.addEventListener('click', async () => {
        if (!selectedPlayerCount) {
            showError("Selecteer eerst het aantal spelers");
            return;
        }
        
        await joinOrCreateTable(selectedPlayerCount);
    });
    
    // Function to check if user is authenticated
    function checkAuthStatus() {
        const token = sessionStorage.getItem('token');
        
        if (!token) {
            // Redirect to login page if not authenticated
            window.location.href = 'login.html';
            return;
        }
    }
    
    // Function to join or create a table
    async function joinOrCreateTable(playerCount) {
        try {
            // Get authentication token
            const token = sessionStorage.getItem('token');
            
            if (!token) {
                showError("U bent niet ingelogd. Log in om een spel te starten.");
                return;
            }
            
            // Show loading state
            joinTableBtn.disabled = true;
            joinTableBtn.textContent = 'Even geduld...';
            
            // Prepare request payload
            const payload = {
                numberOfPlayers: playerCount
            };
            
            // Send request to join or create table
            const response = await fetch(`${backendUrl}/api/Tables/join-or-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            // Reset button state
            joinTableBtn.textContent = 'Deelnemen aan Spel';
            
            if (response.ok) {
                const data = await response.json();
                displayTableJoined(data);
            } else if (response.status === 401) {
                showError("Uw sessie is verlopen. Log opnieuw in.");
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                let errorMsg = "Er is een fout opgetreden. Probeer het later opnieuw.";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) {
                    console.error("Error parsing error response:", e);
                }
                showError(errorMsg);
                joinTableBtn.disabled = false;
            }
        } catch (error) {
            console.error("Error joining table:", error);
            showError("Kan geen verbinding maken met de server. Controleer uw internetverbinding.");
            joinTableBtn.disabled = false;
            joinTableBtn.textContent = 'Deelnemen aan Spel';
        }
    }
    
    // Function to display table joined status
    function displayTableJoined(tableData) {
        // Hide join button and show table status
        joinTableBtn.classList.add('hidden');
        
        // Set status message color and text
        statusMessage.classList.remove('hidden');
        statusMessage.classList.add('bg-azulTile3', 'bg-opacity-20', 'text-azulTile3');
        statusMessage.textContent = "U bent succesvol aan een tafel toegevoegd!";
        
        // Show table status container
        tableStatus.classList.remove('hidden');
        
        // Calculate filled seats
        const filledSeats = tableData.players ? tableData.players.length : 1;
        const totalSeats = tableData.maxPlayers || selectedPlayerCount;
        
        // Create table details HTML
        const tableDetailsHTML = `
            <div class="mb-4">
                <div class="flex justify-center items-center mb-2">
                    <span class="text-3xl font-bold text-azulBlue">${filledSeats}</span>
                    <span class="mx-2 text-xl">/</span>
                    <span class="text-3xl font-bold text-azulAccent">${totalSeats}</span>
                </div>
                <p>spelers aan tafel</p>
            </div>
            <div class="mb-4">
                <p class="text-sm text-azulAccent italic">Wachten op andere spelers...</p>
                <div class="mt-3 relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="absolute top-0 left-0 h-full bg-azulBlue" style="width: ${(filledSeats/totalSeats*100)}%;"></div>
                </div>
            </div>
            <p class="text-sm text-gray-600">Het spel begint automatisch zodra alle spelers zijn toegevoegd.</p>
        `;
        
        // Update table details
        tableDetails.innerHTML = tableDetailsHTML;
        
        // Set up polling to check for updates (optional enhancement)
        // setupTableStatusPolling(tableData.id);
    }
    
    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }
}); 