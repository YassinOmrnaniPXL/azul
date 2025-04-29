document.addEventListener("DOMContentLoaded", () => {
    // Select DOM elements
    const playerOptions = document.querySelectorAll('.player-option');
    const joinTableBtn = document.getElementById('joinTableBtn');
    const statusMessage = document.getElementById('statusMessage');
    const tableStatus = document.getElementById('tableStatus');
    const tableDetails = document.getElementById('tableDetails');
    const errorMessage = document.getElementById('errorMessage');

    const backendUrl = 'https://localhost:5051';

    let selectedPlayerCount = null;
    let currentTableId = null;
    let previousPlayerNames = []; // ✨ opgeslagen vorige spelers

    checkAuthStatus();

    playerOptions.forEach(option => {
        option.addEventListener('click', () => {
            playerOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedPlayerCount = parseInt(option.id.split('-')[1]);
            joinTableBtn.disabled = false;
        });
    });

    joinTableBtn.addEventListener('click', async () => {
        if (!selectedPlayerCount) {
            showError("Selecteer eerst het aantal spelers");
            return;
        }
        await joinOrCreateTable(selectedPlayerCount);
    });

    function checkAuthStatus() {
        const token = sessionStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
        }
    }

    async function joinOrCreateTable(playerCount) {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                showError("U bent niet ingelogd. Log in om een spel te starten.");
                return;
            }

            joinTableBtn.disabled = true;
            joinTableBtn.textContent = 'Even geduld...';

            const payload = {
                numberOfPlayers: playerCount,
                numberOfArtificialPlayers: 0,
                numberOfFactoryDisplays: 0
            };

            const response = await fetch(`${backendUrl}/api/Tables/join-or-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            joinTableBtn.textContent = 'Deelnemen aan Spel';

            if (response.ok) {
                const data = await response.json();
                displayTableJoined(data);
                currentTableId = data.id;
                previousPlayerNames = data.seatedPlayers.map(p => p.name);
                startTablePolling();
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

    function displayTableJoined(tableData) {
        joinTableBtn.classList.add('hidden');
        statusMessage.classList.remove('hidden');
        statusMessage.classList.add('bg-azulTile3', 'bg-opacity-20', 'text-azulTile3');
        statusMessage.textContent = "U bent succesvol aan een tafel toegevoegd!";
        tableStatus.classList.remove('hidden');

        updateTableStatus(tableData);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');

        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function updateTableStatus(tableData, leaverName = null) {
        const filledSeats = tableData.seatedPlayers ? tableData.seatedPlayers.length : 1;
        const totalSeats = tableData.preferences ? tableData.preferences.numberOfPlayers : selectedPlayerCount;

        // 🧠 Speler lijst opbouwen
        let playerListHTML = '<ul class="text-gray-700 mb-4">';
        if (tableData.seatedPlayers && tableData.seatedPlayers.length > 0) {
            tableData.seatedPlayers.forEach(player => {
                playerListHTML += `<li>👤 ${player.name}</li>`;
            });
        }
        playerListHTML += '</ul>';

        // ✨ Melding als iemand vertrokken is
        let leaveNotificationHTML = '';
        if (leaverName) {
            leaveNotificationHTML = `
                <div id="leaveNotification" class="text-azulTile1 font-semibold mb-4">
                    ${leaverName} is vertrokken van de tafel.
                </div>
            `;
        }

        const tableDetailsHTML = `
            <div class="mb-4">
                <div class="flex justify-center items-center mb-2">
                    <span class="text-3xl font-bold text-azulBlue">${filledSeats}</span>
                    <span class="mx-2 text-xl">/</span>
                    <span class="text-3xl font-bold text-azulAccent">${totalSeats}</span>
                </div>
                <p>spelers aan tafel</p>
            </div>

            ${playerListHTML}
            ${leaveNotificationHTML}

            <div class="mb-4">
                <p class="text-sm text-azulAccent italic">Wachten op andere spelers...</p>
                <div class="mt-3 relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="absolute top-0 left-0 h-full bg-azulBlue" style="width: ${(filledSeats/totalSeats*100)}%;"></div>
                </div>
            </div>
            <p class="text-sm text-gray-600 mb-4">Het spel begint automatisch zodra alle spelers zijn toegevoegd.</p>

            <button id="leaveTableBtn" class="mt-6 py-2 px-6 bg-azulTile1 text-white rounded-lg hover:bg-red-400 transition">
                Tafel Verlaten
            </button>
        `;

        tableDetails.innerHTML = tableDetailsHTML;

        const leaveTableBtn = document.getElementById('leaveTableBtn');
        leaveTableBtn.addEventListener('click', leaveTable);

        // ✨ Automatisch melding laten verdwijnen na 3 sec
        if (leaverName) {
            setTimeout(() => {
                const notification = document.getElementById('leaveNotification');
                if (notification) {
                    notification.remove();
                }
            }, 3000);
        }
    }

    async function leaveTable() {
        if (!currentTableId) return;

        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${backendUrl}/api/Tables/${currentTableId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                console.log("Succesvol tafel verlaten.");
                window.location.reload();
            } else {
                showError("Kon de tafel niet verlaten.");
            }
        } catch (error) {
            console.error("Error leaving table:", error);
        }
    }

    function startTablePolling() {
        if (!currentTableId) {
            console.error("Geen tableId gevonden voor polling.");
            return;
        }

        const pollInterval = 3000;

        setInterval(async () => {
            const token = sessionStorage.getItem('token');
            if (!token) {
                console.error("Geen token gevonden tijdens polling.");
                return;
            }

            try {
                const response = await fetch(`${backendUrl}/api/Tables/${currentTableId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const tableData = await response.json();
                    console.log("Tafel data:", tableData);

                    const currentNames = tableData.seatedPlayers.map(p => p.name);

                    // ✨ Check wie vertrokken is
                    const leaverName = previousPlayerNames.find(name => !currentNames.includes(name));
                    previousPlayerNames = currentNames;

                    updateTableStatus(tableData, leaverName);

                    if (tableData.gameId && tableData.gameId !== "00000000-0000-0000-0000-000000000000") {
                        console.log("Spel gevonden! Redirecting naar game.html...");
                        window.location.href = `game.html?gameId=${tableData.gameId}`;
                    }
                } else {
                    console.error("Fout bij ophalen tafel:", response.status);
                }
            } catch (error) {
                console.error("Error polling table:", error);
            }
        }, pollInterval);
    }
});
