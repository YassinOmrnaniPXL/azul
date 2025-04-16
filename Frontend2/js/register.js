document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const lastVisit = document.getElementById("lastVisit").value;
    const errorDiv = document.getElementById("errorMessage");

    errorDiv.textContent = ""; // Reset foutmelding

    // 1. Check verplichte velden
    if (!email || !username || !password || !confirmPassword) {
        errorDiv.textContent = "Gelieve alle verplichte velden in te vullen.";
        return;
    }

    // 2. Check wachtwoordlengte
    if (password.length < 6) {
        errorDiv.textContent = "Wachtwoord moet minstens 6 karakters bevatten.";
        return;
    }

    // 3. Check wachtwoorden overeenkomen
    if (password !== confirmPassword) {
        errorDiv.textContent = "Wachtwoorden komen niet overeen.";
        return;
    }

    // 4. Check of lastVisit geldig is (in het verleden)
    if (lastVisit && new Date(lastVisit) > new Date()) {
        errorDiv.textContent = "Datum van laatste verblijf in Portugal moet in het verleden liggen.";
        return;
    }

    const payload = {
        email: email,
        username: username,
        password: password,
        lastVisitToPortugal: lastVisit || null
    };

    try {
        const response = await fetch("https://localhost:5051/api/Authentication/register", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + sessionStorage.getItem("token")
            }
        });

        if (response.ok) {
            // Succesvol geregistreerd, ga naar login pagina met ingevuld e-mailadres
            window.location.href = `login.html?email=${encodeURIComponent(email)}`;
        } else {
            const errorData = await response.json();
            errorDiv.textContent = errorData.message || "Er is een fout opgetreden tijdens registratie.";
        }
    } catch (error) {
        errorDiv.textContent = "Netwerkfout of server niet bereikbaar.";
    }
});
