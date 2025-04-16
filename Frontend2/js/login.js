document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const errorDiv = document.getElementById("errorMessage");

    // Vul automatisch e-mail in als die meegegeven is via URL
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromRegister = urlParams.get("email");
    if (emailFromRegister) {
        document.getElementById("email").value = emailFromRegister;
    }

    form.addEventListener("submit", async function(e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        errorDiv.textContent = "";

        // Check lege velden
        if (!email || !password) {
            errorDiv.textContent = "Gelieve e-mailadres en wachtwoord in te vullen.";
            return;
        }

        const payload = {
            email: email,
            password: password
        };

        try {
            const response = await fetch("https://localhost:5051/api/Authentication/token", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + sessionStorage.getItem("token")
                }
            });

            if (response.ok) {
                // Login OK → navigeer naar lobby
                window.location.href = "lobby.html";
            } else {
                const errorData = await response.json();
                errorDiv.textContent = errorData.message || "Inloggegevens zijn onjuist.";
            }
        } catch (err) {
            errorDiv.textContent = "Kan geen verbinding maken met de server.";
        }
    });
});
