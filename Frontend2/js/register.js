document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const emailInput = document.getElementById("email");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const lastVisitInput = document.getElementById("lastVisit");
    const submitButton = form.querySelector("button[type='submit']");
    const errorDiv = document.getElementById("errorMessage");

    form.addEventListener("submit", async function(e) {
        e.preventDefault(); // Prevent default form submission

        // Get form values
        const email = emailInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const lastVisit = lastVisitInput.value;

        // Clear previous errors and disable button
        errorDiv.textContent = "";
        submitButton.disabled = true;
        submitButton.textContent = 'Bezig met registreren...'; // Optional: Indicate loading

        // --- Enhanced Client-side Validation ---
        // Check for empty fields with specific messages
        if (!email) {
            errorDiv.textContent = "Vul een e-mailadres in om uw account te registreren.";
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
            return;
        }
        
        if (!username) {
            errorDiv.textContent = "Vul een gebruikersnaam in om uzelf te identificeren.";
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
            return;
        }
        
        if (!password) {
            errorDiv.textContent = "Kies een wachtwoord om uw account te beveiligen.";
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
            return;
        }
        
        if (!confirmPassword) {
            errorDiv.textContent = "Bevestig uw wachtwoord om te verifiëren dat u het correct heeft ingevoerd.";
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = "Voer een geldig e-mailadres in (bijvoorbeeld: naam@voorbeeld.nl).";
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
            return;
        }

        // Username validation
        if (username.length < 3) {
            errorDiv.textContent = "Gebruikersnaam moet minstens 3 karakters bevatten.";
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
            return;
        }
        
        // Enhanced password validation
        if (password.length < 6) {
            errorDiv.textContent = "Kies een sterker wachtwoord (minstens 6 karakters).";
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
            return;
        }

        if (password !== confirmPassword) {
            errorDiv.textContent = "Wachtwoorden komen niet overeen. Controleer of u hetzelfde wachtwoord heeft ingetypt.";
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
            return;
        }

        // Validate date - must be in the past
        if (lastVisit) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set time to start of day for accurate comparison
            const visitDate = new Date(lastVisit);

            if (visitDate >= today) { // Compare date parts only
                errorDiv.textContent = "De datum van uw laatste verblijf in Portugal moet in het verleden liggen.";
                submitButton.disabled = false; // Re-enable button
                submitButton.textContent = 'Registreer';
                return;
            }
        }
        // --- End Validation ---

        const payload = {
            email: email,
            username: username,
            password: password,
            lastVisitToPortugal: lastVisit || null // Send null if date is empty
        };

        try {
            // Attempt to register the user
            const response = await fetch("https://localhost:5051/api/Authentication/register", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                    // Removed Authorization header - not needed for registration
                }
            });

            if (response.ok) {
                // Redirect to login page with email prefilled on success
                window.location.href = `login.html?email=${encodeURIComponent(email)}`;
            } else if (response.status === 409) {
                errorDiv.textContent = "Dit e-mailadres of deze gebruikersnaam is al in gebruik. Kies een andere of log in.";
            } else if (response.status === 400) {
                // Try to get specific validation errors
                try {
                    const errorData = await response.json();
                    if (errorData.errors) {
                        // Handle structured validation errors
                        const errorMessages = [];
                        for (const key in errorData.errors) {
                            errorMessages.push(errorData.errors[key].join(', '));
                        }
                        errorDiv.textContent = errorMessages.join(' ');
                    } else if (errorData.message) {
                        errorDiv.textContent = errorData.message;
                    } else {
                        errorDiv.textContent = "Er zijn fouten in het registratieformulier. Controleer uw gegevens.";
                    }
                } catch (jsonError) {
                    console.error("Error parsing validation error response:", jsonError);
                    errorDiv.textContent = "Er zijn fouten in het registratieformulier. Controleer uw gegevens.";
                }
            } else if (response.status >= 500) {
                errorDiv.textContent = "Er is een probleem met de server. Probeer het later opnieuw.";
            } else {
                // Handle other registration errors
                let errorMessage = "Registratie mislukt. Controleer uw gegevens en probeer het opnieuw.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    // If response is not JSON or empty, use the default message
                    console.error("Error parsing error response:", jsonError);
                }
                errorDiv.textContent = errorMessage;
            }
        } catch (error) {
            // Handle network or other fetch errors
            console.error("Registration fetch error:", error);
            errorDiv.textContent = "Kan geen verbinding maken met de server. Controleer uw internetverbinding en probeer het later opnieuw.";
        } finally {
             // Re-enable button regardless of success or error
            submitButton.disabled = false;
            submitButton.textContent = 'Registreer';
        }
    });
});
