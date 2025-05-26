import { API_BASE_URL, getAuthHeaders, getFullResourceUrl } from './config.js';

/**
 * Service to handle profile picture fetching and caching
 */
class ProfilePictureService {
    constructor() {
        this.cache = new Map(); // Cache profile pictures by user ID
        this.fetchPromises = new Map(); // Track ongoing fetch requests to avoid duplicates
    }

    /**
     * Get profile picture URL for a user
     * @param {string} userId - The user ID
     * @returns {Promise<string>} The profile picture URL
     */
    async getProfilePictureUrl(userId) {
        // Check cache first
        if (this.cache.has(userId)) {
            return this.cache.get(userId);
        }

        // Check if we're already fetching this user's data
        if (this.fetchPromises.has(userId)) {
            return await this.fetchPromises.get(userId);
        }

        // Create fetch promise
        const fetchPromise = this.fetchUserProfilePicture(userId);
        this.fetchPromises.set(userId, fetchPromise);

        try {
            const profilePictureUrl = await fetchPromise;
            this.cache.set(userId, profilePictureUrl);
            return profilePictureUrl;
        } catch (error) {
            console.warn(`Failed to fetch profile picture for user ${userId}:`, error);
            // Cache the default image to avoid repeated failed requests
            const defaultUrl = 'images/Default_pfp.jpg';
            this.cache.set(userId, defaultUrl);
            return defaultUrl;
        } finally {
            this.fetchPromises.delete(userId);
        }
    }

    /**
     * Fetch user profile picture from the backend
     * @param {string} userId - The user ID
     * @returns {Promise<string>} The profile picture URL
     */
    async fetchUserProfilePicture(userId) {
        try {
            // Use the new endpoint to get any user's profile picture
            const response = await fetch(`${API_BASE_URL}/user/${userId}/profile-picture`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`User ${userId} not found, using default image`);
                    return 'images/Default_pfp.jpg';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // If user has a profile picture, we need to fetch it as a blob to avoid CORS issues
            if (data.profilePictureUrl) {
                try {
                    // Try fetching the image file directly (static files don't need auth)
                    const imageResponse = await fetch(getFullResourceUrl(data.profilePictureUrl), {
                        method: 'GET',
                    });
                    
                    if (imageResponse.ok) {
                        const blob = await imageResponse.blob();
                        return URL.createObjectURL(blob);
                    } else {
                        console.warn(`Failed to fetch profile picture blob (status: ${imageResponse.status}), using default`);
                        return 'images/Default_pfp.jpg';
                    }
                } catch (blobError) {
                    console.warn('Error fetching profile picture as blob:', blobError);
                    return 'images/Default_pfp.jpg';
                }
            } else {
                return 'images/Default_pfp.jpg';
            }
        } catch (error) {
            console.warn(`Error fetching profile picture for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Clear the cache (useful for testing or when user updates their profile picture)
     */
    clearCache() {
        // Revoke any blob URLs to free memory
        for (const [userId, url] of this.cache.entries()) {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        }
        this.cache.clear();
        this.fetchPromises.clear();
    }

    /**
     * Remove a specific user from cache (useful when a user updates their profile picture)
     * @param {string} userId - The user ID to remove from cache
     */
    invalidateUser(userId) {
        const cachedUrl = this.cache.get(userId);
        if (cachedUrl && cachedUrl.startsWith('blob:')) {
            URL.revokeObjectURL(cachedUrl);
        }
        this.cache.delete(userId);
        this.fetchPromises.delete(userId);
    }
}

// Export a singleton instance
export const profilePictureService = new ProfilePictureService(); 