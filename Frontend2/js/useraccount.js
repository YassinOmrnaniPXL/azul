import { API_BASE_URL, getAuthHeaders, getFullResourceUrl } from './config.js';
import { audioManager } from './audioManager.js';
import { profilePictureService } from './profilePictureService.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    initTabs();
    
    // Initialize forms
    initProfileForm();
    initPasswordForm();
    initSettingsForm();
    
    // Initialize profile picture change
    initProfilePicture();
    
    // Initialize audio settings integration
    initAudioSettings();
    
    // Load user data from backend
    loadUserData();
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
 * Load user data from the backend
 */
async function loadUserData() {
    const usernameInput = document.getElementById('username'); // This is for the username field
    const displayNameInput = document.getElementById('displayName'); // This is for the display name field
    const emailInput = document.getElementById('email');
    const usernameDisplay = document.getElementById('usernameDisplay'); // Welcome message span
    const profileImage = document.getElementById('profileImage');

    const emailNotifications = document.getElementById('emailNotifications');
    const soundEffects = document.getElementById('soundEffects');
    const darkMode = document.getElementById('darkMode');
    const publicProfile = document.getElementById('publicProfile');

    const generalMessageElement = document.getElementById('profileMessage'); // Or a dedicated one for loading errors

    try {
        const response = await fetch(`${API_BASE_URL}/user/details`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                showMessage(generalMessageElement, 'Sessie verlopen. Log opnieuw in.', 'error');
                // Potentially redirect to login: window.location.href = 'login.html';
            } else {
                showMessage(generalMessageElement, `Fout bij laden gebruikersgegevens: ${response.statusText}`, 'error');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Loaded user data:', data); // Debug log

        // Set the username field (this should be the actual username, not display name)
        if (usernameInput) usernameInput.value = data.userName || data.username || ''; 
        
        // Set the display name field
        if (displayNameInput) displayNameInput.value = data.displayName || '';
        
        // Set email field
        if (emailInput) emailInput.value = data.email || '';
        
        // Set the welcome message to use display name
        if (usernameDisplay) usernameDisplay.textContent = data.displayName || data.userName || 'Speler';

        // Set profile image
        if (profileImage) {
            profileImage.src = getFullResourceUrl(data.profilePictureUrl);
        }

        // Set settings checkboxes (emailNotifications checkbox removed from UI but functionality preserved)
        if (emailNotifications) emailNotifications.checked = data.emailNotificationsEnabled ?? true;
        if (soundEffects) soundEffects.checked = data.soundEffectsEnabled ?? true;
        if (darkMode) darkMode.checked = data.darkModeEnabled ?? false;
        if (publicProfile) publicProfile.checked = data.isProfilePublic ?? true;

        // Sync audio manager settings with user preferences
        if (audioManager) {
            audioManager.isSfxEnabled = data.soundEffectsEnabled ?? true;
            audioManager.saveSettings();
        }

    } catch (error) {
        console.error('Failed to load user data:', error);
        if (generalMessageElement && !generalMessageElement.textContent) { // Avoid overwriting specific errors
             showMessage(generalMessageElement, 'Kon gebruikersgegevens niet laden.', 'error');
        }
    }
}

/**
 * Initialize profile form
 */
function initProfileForm() {
    const profileForm = document.getElementById('profileForm');
    const profileMessage = document.getElementById('profileMessage');
    
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const displayName = document.getElementById('displayName').value; // Get from the display name field
            // Email is not updatable via this endpoint as per backend changes.
            // const email = document.getElementById('email').value; 

            try {
                const response = await fetch(`${API_BASE_URL}/user/profile`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ displayName }), // Only sending displayName
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                    showMessage(profileMessage, errorData.message || 'Profiel bijwerken mislukt.', 'error');
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Update the username display immediately if it exists
                const usernameDisplay = document.getElementById('usernameDisplay');
                if (usernameDisplay) {
                    usernameDisplay.textContent = displayName;
                }

                showMessage(profileMessage, 'Profiel succesvol bijgewerkt!', 'success');

            } catch (error) {
                console.error('Failed to update profile:', error);
                if (!profileMessage.textContent.includes('succesvol')) { // Don't overwrite success message if error is a follow-up console error
                    showMessage(profileMessage, 'Fout bij bijwerken profiel.', 'error');
                }
            }
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
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                showMessage(passwordMessage, 'Nieuwe wachtwoorden komen niet overeen!', 'error');
                return;
            }
            if (newPassword.length < 6) {
                showMessage(passwordMessage, 'Wachtwoord moet minimaal 6 tekens bevatten!', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/user/password`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ currentPassword, newPassword }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                    showMessage(passwordMessage, errorData.message || 'Wachtwoord wijzigen mislukt.', 'error');
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                showMessage(passwordMessage, 'Wachtwoord succesvol gewijzigd!', 'success');
                passwordForm.reset();

            } catch (error) {
                console.error('Failed to change password:', error);
                 if (!passwordMessage.textContent.includes('succesvol')) {
                    showMessage(passwordMessage, 'Fout bij wijzigen wachtwoord.', 'error');
                }
            }
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
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get current email notifications setting from loaded data (since checkbox is removed from UI)
            const emailNotificationsElement = document.getElementById('emailNotifications');
            const emailNotificationsEnabled = emailNotificationsElement ? emailNotificationsElement.checked : true; // Default to true if element doesn't exist
            
            const soundEffectsEnabled = document.getElementById('soundEffects').checked;
            const darkModeEnabled = document.getElementById('darkMode').checked;
            const isProfilePublic = document.getElementById('publicProfile').checked;

            try {
                const response = await fetch(`${API_BASE_URL}/user/settings`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ 
                        emailNotificationsEnabled, 
                        soundEffectsEnabled, 
                        darkModeEnabled, 
                        isProfilePublic 
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                    showMessage(settingsMessage, errorData.message || 'Instellingen opslaan mislukt.', 'error');
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                showMessage(settingsMessage, 'Instellingen succesvol opgeslagen!', 'success');

                // Sync audio manager settings with updated preferences
                if (audioManager) {
                    audioManager.isSfxEnabled = soundEffectsEnabled;
                    audioManager.saveSettings();
                }

            } catch (error) {
                console.error('Failed to save settings:', error);
                if (!settingsMessage.textContent.includes('succesvol')) {
                    showMessage(settingsMessage, 'Fout bij opslaan instellingen.', 'error');
                }
            }
        });
    }
}

/**
 * Initialize profile picture functionality
 */
function initProfilePicture() {
    const changeProfilePicButton = document.getElementById('changeProfilePic');
    const profilePicInput = document.getElementById('profilePicInput');
    const profileImage = document.getElementById('profileImage');
    const profileMessage = document.getElementById('profileMessage'); // For showing errors/success related to pic change

    if (changeProfilePicButton && profilePicInput && profileImage) {
        changeProfilePicButton.addEventListener('click', () => {
            profilePicInput.click();
        });

        profilePicInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.match('image.*')) {
                showMessage(profileMessage, 'Selecteer een afbeelding (JPG, PNG, GIF).', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit, same as backend
                showMessage(profileMessage, 'Bestand is te groot (max 5MB).', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('profilePicture', file);

            // Get auth headers but only use Authorization, not Content-Type for FormData
            const authHeaders = getAuthHeaders();
            const headers = {};
            if (authHeaders['Authorization']) {
                headers['Authorization'] = authHeaders['Authorization'];
            }
            // Don't set Content-Type - let browser set it automatically for FormData

            console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }
            console.log('Headers to send:', headers);

            try {
                const response = await fetch(`${API_BASE_URL}/user/profile-picture`, {
                    method: 'POST',
                    headers: headers,
                    body: formData,
                });

                console.log('Upload response status:', response.status);

                if (!response.ok) {
                    console.log('Response headers:', response.headers);
                    const responseText = await response.text();
                    console.log('Raw response text:', responseText);
                    
                    let errorData;
                    try {
                        errorData = JSON.parse(responseText);
                    } catch (e) {
                        errorData = { message: responseText || `HTTP error ${response.status}` };
                    }
                    
                    console.log('Upload error data:', errorData);
                    showMessage(profileMessage, errorData.message || 'Profielfoto uploaden mislukt.', 'error');
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Invalidate the profile picture cache for the current user
                const currentUserId = localStorage.getItem('userId');
                if (currentUserId) {
                    profilePictureService.invalidateUser(currentUserId);
                }
                
                profileImage.src = getFullResourceUrl(data.profilePictureUrl);
                showMessage(profileMessage, 'Profielfoto succesvol bijgewerkt!', 'success');
            
            } catch (error) {
                console.error('Failed to upload profile picture:', error);
                 if (!profileMessage.textContent.includes('succesvol')) {
                    showMessage(profileMessage, 'Fout bij uploaden profielfoto.', 'error');
                }
            }
            // Reset file input to allow re-uploading the same file if needed after an error
            profilePicInput.value = ''; 
        });
    }
}

/**
 * Initialize audio settings integration
 */
function initAudioSettings() {
    const soundEffectsCheckbox = document.getElementById('soundEffects');
    
    if (soundEffectsCheckbox) {
        soundEffectsCheckbox.addEventListener('change', (e) => {
            // Immediately sync with audio manager for instant feedback
            if (audioManager) {
                audioManager.isSfxEnabled = e.target.checked;
                audioManager.saveSettings();
                
                // Play a test sound if enabled
                if (e.target.checked) {
                    setTimeout(() => {
                        audioManager.playSfx('buttonClick', 0.7);
                    }, 100);
                }
            }
        });
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
        messageElement.className = 'p-3 rounded-md'; // Reset classes then add common ones

        if (type === 'success') {
            messageElement.classList.add('bg-green-100', 'text-green-800');
        } else {
            messageElement.classList.add('bg-red-100', 'text-red-800');
        }
        messageElement.classList.remove('hidden');

        setTimeout(() => {
            messageElement.classList.add('hidden');
            messageElement.textContent = ''; // Clear text after hiding
        }, 3000);
    }
} 