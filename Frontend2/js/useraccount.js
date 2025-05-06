document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    initTabs();
    
    // Initialize forms
    initProfileForm();
    initPasswordForm();
    initSettingsForm();
    
    // Initialize profile picture change
    initProfilePicture();
    
    // For demonstration (placeholder): Load mock user data
    loadMockUserData();
});

/**
 * Initialize tab functionality
 */
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('[id$="-tab"]');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Get the tab data attribute
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab content
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show the selected tab content
            const targetContent = document.getElementById(`${tabId}-tab`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });
}

/**
 * Initialize profile form
 */
function initProfileForm() {
    const profileForm = document.getElementById('profileForm');
    const profileMessage = document.getElementById('profileMessage');
    
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const displayName = document.getElementById('displayName').value;
            
            // Here you would normally send the data to the backend
            // But since the backend is not ready, we'll just show a success message
            
            // Update the username display
            const usernameDisplay = document.getElementById('usernameDisplay');
            if (usernameDisplay) {
                usernameDisplay.textContent = username;
            }
            
            // Show success message
            showMessage(profileMessage, 'Profiel succesvol bijgewerkt!', 'success');
            
            // Store in local storage (for demo purposes)
            localStorage.setItem('azul_username', username);
            localStorage.setItem('azul_email', email);
            localStorage.setItem('azul_displayName', displayName);
        });
    }
}

/**
 * Initialize password form
 */
function initPasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    const passwordMessage = document.getElementById('passwordMessage');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate passwords match
            if (newPassword !== confirmPassword) {
                showMessage(passwordMessage, 'Nieuwe wachtwoorden komen niet overeen!', 'error');
                return;
            }
            
            // Validate password length (demo purposes)
            if (newPassword.length < 6) {
                showMessage(passwordMessage, 'Wachtwoord moet minimaal 6 tekens bevatten!', 'error');
                return;
            }
            
            // Here you would normally send the data to the backend
            // But since the backend is not ready, we'll just show a success message
            showMessage(passwordMessage, 'Wachtwoord succesvol gewijzigd!', 'success');
            
            // Reset form
            passwordForm.reset();
        });
    }
}

/**
 * Initialize settings form
 */
function initSettingsForm() {
    const settingsForm = document.getElementById('settingsForm');
    const settingsMessage = document.getElementById('settingsMessage');
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const emailNotifications = document.getElementById('emailNotifications').checked;
            const soundEffects = document.getElementById('soundEffects').checked;
            const darkMode = document.getElementById('darkMode').checked;
            const publicProfile = document.getElementById('publicProfile').checked;
            
            // Here you would normally send the data to the backend
            // But since the backend is not ready, we'll just show a success message
            showMessage(settingsMessage, 'Instellingen succesvol opgeslagen!', 'success');
            
            // Store in local storage (for demo purposes)
            localStorage.setItem('azul_emailNotifications', emailNotifications);
            localStorage.setItem('azul_soundEffects', soundEffects);
            localStorage.setItem('azul_darkMode', darkMode);
            localStorage.setItem('azul_publicProfile', publicProfile);
        });
    }
}

/**
 * Initialize profile picture functionality
 */
function initProfilePicture() {
    const changeProfilePic = document.getElementById('changeProfilePic');
    const profilePicInput = document.getElementById('profilePicInput');
    const profileImage = document.getElementById('profileImage');
    
    if (changeProfilePic && profilePicInput && profileImage) {
        // Open file dialog when clicking change button
        changeProfilePic.addEventListener('click', () => {
            profilePicInput.click();
        });
        
        // Handle image selection
        profilePicInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validate it's an image
                if (!file.type.match('image.*')) {
                    alert('Selecteer een afbeelding');
                    return;
                }
                
                // Read and preview the image
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImage.src = e.target.result;
                    
                    // Store in local storage (for demo purposes)
                    localStorage.setItem('azul_profilePic', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

/**
 * Load mock user data (for demonstration purposes)
 */
function loadMockUserData() {
    // Check if we have stored user data and use it
    const username = localStorage.getItem('azul_username') || 'SpelerNaam';
    const email = localStorage.getItem('azul_email') || 'speler@voorbeeld.nl';
    const displayName = localStorage.getItem('azul_displayName') || 'Azul Meester';
    const profilePic = localStorage.getItem('azul_profilePic');
    
    // Set values
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const displayNameInput = document.getElementById('displayName');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const profileImage = document.getElementById('profileImage');
    
    if (usernameInput) usernameInput.value = username;
    if (emailInput) emailInput.value = email;
    if (displayNameInput) displayNameInput.value = displayName;
    if (usernameDisplay) usernameDisplay.textContent = username;
    
    // Set profile pic if it exists
    if (profileImage && profilePic) {
        profileImage.src = profilePic;
    }
    
    // Set settings
    const emailNotifications = document.getElementById('emailNotifications');
    const soundEffects = document.getElementById('soundEffects');
    const darkMode = document.getElementById('darkMode');
    const publicProfile = document.getElementById('publicProfile');
    
    if (emailNotifications) {
        emailNotifications.checked = localStorage.getItem('azul_emailNotifications') !== 'false';
    }
    if (soundEffects) {
        soundEffects.checked = localStorage.getItem('azul_soundEffects') !== 'false';
    }
    if (darkMode) {
        darkMode.checked = localStorage.getItem('azul_darkMode') === 'true';
    }
    if (publicProfile) {
        publicProfile.checked = localStorage.getItem('azul_publicProfile') !== 'false';
    }
}

/**
 * Helper function to show messages
 * @param {Element} messageElement - The element to show the message in
 * @param {string} message - The message to display
 * @param {string} type - The type of message ('success' or 'error')
 */
function showMessage(messageElement, message, type) {
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
        
        if (type === 'success') {
            messageElement.classList.add('bg-green-100', 'text-green-800');
        } else {
            messageElement.classList.add('bg-red-100', 'text-red-800');
        }
        
        messageElement.classList.add('p-3', 'rounded-md');
        
        // Hide message after 3 seconds
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 3000);
    }
} 