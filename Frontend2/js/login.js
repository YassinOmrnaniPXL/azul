document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitButton = form.querySelector("button[type='submit']");
    const errorDiv = document.getElementById("errorMessage");

    const urlParams = new URLSearchParams(window.location.search);
    const emailFromRegister = urlParams.get("email");
    if (emailFromRegister) {
        emailInput.value = emailFromRegister;
    }

    form.addEventListener("submit", async function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        errorDiv.textContent = "";
        submitButton.disabled = true;
        submitButton.textContent = 'Bezig met inloggen...';

        if (!email && !password) {
            errorDiv.textContent = "Vul uw e-mailadres en wachtwoord in om in te loggen.";
            submitButton.disabled = false;
            submitButton.textContent = 'Inloggen';
            return;
        } else if (!email) {
            errorDiv.textContent = "Vul uw e-mailadres in.";
            submitButton.disabled = false;
            submitButton.textContent = 'Inloggen';
            return;
        } else if (!password) {
            errorDiv.textContent = "Vul uw wachtwoord in.";
            submitButton.disabled = false;
            submitButton.textContent = 'Inloggen';
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = "Voer een geldig e-mailadres in (bijvoorbeeld: naam@voorbeeld.nl).";
            submitButton.disabled = false;
            submitButton.textContent = 'Inloggen';
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
                }
            });

            if (response.ok) {
                try {
                    const data = await response.json();
                    if (data.token) {
                        sessionStorage.setItem("token", data.token);
                    }
                    if (data.user && data.user.id) {
                        localStorage.setItem('userId', data.user.id);
                        console.log('Stored userId:', data.user.id);
                    } else {
                        console.warn('User ID not found in login response.');
                    }
                    if (data.user && data.user.userName) {
                        localStorage.setItem('userName', data.user.userName);
                        console.log('Stored userName:', data.user.userName);
                    } else {
                        console.warn('User Name not found in login response.');
                    }
                } catch (jsonParseError) {
                    console.error("Error parsing JSON response from token endpoint:", jsonParseError);
                    errorDiv.textContent = "Received an invalid response from the server after login.";
                    submitButton.disabled = false;
                    submitButton.textContent = 'Inloggen';
                    return;
                }
                window.location.href = "lobby.html";
            } else if (response.status === 401) {
                errorDiv.textContent = "Onjuiste e-mail of wachtwoord. Probeer het opnieuw.";
            } else if (response.status === 404) {
                errorDiv.textContent = "Geen account gevonden met dit e-mailadres. Controleer uw gegevens of registreer.";
            } else if (response.status >= 500) {
                errorDiv.textContent = "Er is een probleem met de server. Probeer het later opnieuw.";
            } else {
                let errorMessage = "Inloggen mislukt. Controleer uw gegevens en probeer het opnieuw.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    console.error("Error parsing error response:", jsonError);
                }
                errorDiv.textContent = errorMessage;
            }
        } catch (err) {
            console.error("Login fetch error:", err);
            errorDiv.textContent = "Kan geen verbinding maken met de server. Controleer uw internetverbinding en probeer het later opnieuw.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Inloggen';
        }
    });
});
