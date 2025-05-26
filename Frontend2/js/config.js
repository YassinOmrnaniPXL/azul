/**
 * Configuration file for API endpoints and environment settings
 */

// Detect if we're running on GitHub Pages or locally
const isProduction = window.location.hostname.includes('github.io');
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_CONFIG = {
    // Base URL for API calls
    BASE_URL: isProduction 
        ? 'https://your-backend-url.railway.app/api'  // Replace with your actual backend URL
        : 'https://localhost:5051/api',
    
    // WebSocket/SignalR configuration
    SIGNALR_URL: isProduction
        ? 'https://your-backend-url.railway.app/gameHub'  // Replace with your actual backend URL
        : 'https://localhost:5051/gameHub',
    
    // Environment settings
    ENVIRONMENT: isProduction ? 'production' : 'development',
    
    // Debug mode
    DEBUG: !isProduction,
    
    // API timeout settings
    TIMEOUT: 10000, // 10 seconds
    
    // Polling intervals
    POLLING_INTERVAL: 2000, // 2 seconds
    
    // JWT token settings
    TOKEN_STORAGE_KEY: 'azul_auth_token',
    USER_STORAGE_KEY: 'azul_user_data',
    
    // Game settings
    MAX_PLAYERS: 4,
    MIN_PLAYERS: 2,
    
    // UI settings
    TOAST_DURATION: 3000, // 3 seconds
    LOADING_TIMEOUT: 30000 // 30 seconds
};

// Helper functions for API calls
const ApiHelper = {
    /**
     * Get the full API URL for an endpoint
     * @param {string} endpoint - The API endpoint (without leading slash)
     * @returns {string} Full API URL
     */
    getUrl: (endpoint) => {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
    },
    
    /**
     * Get authorization headers with JWT token
     * @returns {Object} Headers object with authorization
     */
    getAuthHeaders: () => {
        const token = localStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    },
    
    /**
     * Make an authenticated API call
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise} Fetch promise
     */
    fetch: async (endpoint, options = {}) => {
        const url = ApiHelper.getUrl(endpoint);
        const headers = ApiHelper.getAuthHeaders();
        
        const config = {
            headers,
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        };
        
        if (API_CONFIG.DEBUG) {
            console.log(`API Call: ${options.method || 'GET'} ${url}`, config);
        }
        
        try {
            const response = await fetch(url, config);
            
            if (API_CONFIG.DEBUG) {
                console.log(`API Response: ${response.status}`, response);
            }
            
            return response;
        } catch (error) {
            if (API_CONFIG.DEBUG) {
                console.error(`API Error: ${url}`, error);
            }
            throw error;
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, ApiHelper };
}

// Log configuration in debug mode
if (API_CONFIG.DEBUG) {
    console.log('Azul Game Configuration:', {
        environment: API_CONFIG.ENVIRONMENT,
        baseUrl: API_CONFIG.BASE_URL,
        signalrUrl: API_CONFIG.SIGNALR_URL,
        hostname: window.location.hostname
    });
}

// Real-time connection settings
export const CONNECTION_MODE = 'websocket'; // Options: 'websocket', 'polling'
export const USE_WEBSOCKETS = CONNECTION_MODE === 'websocket';

// Polling interval settings
export const POLLING_INTERVAL_MS = 3000; // 3 seconds for fallback polling if WebSockets fail

// Backend TileType Enum Values
export const TileType = {
    STARTING_TILE: 0,
    BLUE: 11,       // PlainBlue
    YELLOW: 12,     // YellowRed (assuming maps to Yellow)
    RED: 13,        // PlainRed
    BLACK: 14,      // BlackBlue (assuming maps to Black)
    TEAL: 15,       // WhiteTurquoise (assuming maps to Teal/Cyan)
};

// Maps backend TileType numbers to CSS classes (legacy, might remove if images fully replace)
export const TILE_COLOR_CLASSES = {
    [TileType.BLUE]: 'tile-blue',
    [TileType.YELLOW]: 'tile-yellow',
    [TileType.RED]: 'tile-red',
    [TileType.BLACK]: 'tile-black',
    [TileType.TEAL]: 'tile-teal',
    // Add a style for STARTING_TILE if it needs to be visually distinct beyond an image
    [TileType.STARTING_TILE]: 'tile-starting-player' // Example class
};

// Maps backend TileType numbers to image paths
export const TILE_IMAGE_PATHS = {
    [TileType.BLUE]: 'images/blue.png',
    [TileType.YELLOW]: 'images/yellow.png',
    [TileType.RED]: 'images/red.png',
    [TileType.BLACK]: 'images/black.png',
    [TileType.TEAL]: 'images/cyan.png', // Mapping WhiteTurquoise to cyan.png
    // No image for STARTING_TILE for now, can be added if needed e.g. 'images/starting_tile.png'
};

// Wall pattern using the new TileType values
export const WALL_PATTERN = [
    [TileType.BLUE, TileType.YELLOW, TileType.RED, TileType.BLACK, TileType.TEAL],
    [TileType.TEAL, TileType.BLUE, TileType.YELLOW, TileType.RED, TileType.BLACK],
    [TileType.BLACK, TileType.TEAL, TileType.BLUE, TileType.YELLOW, TileType.RED],
    [TileType.RED, TileType.BLACK, TileType.TEAL, TileType.BLUE, TileType.YELLOW],
    [TileType.YELLOW, TileType.RED, TileType.BLACK, TileType.TEAL, TileType.BLUE],
];

export const FLOOR_LINE_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];

/**
 * Construct full URL for backend resources (like profile pictures)
 * @param {string} relativePath - The relative path from the backend (e.g., /UserUploads/ProfilePictures/image.jpg)
 * @returns {string} Full URL
 */
export const getFullResourceUrl = (relativePath) => {
    if (!relativePath) return 'images/Default_pfp.jpg'; // Default if no path
    // API_BASE_URL is like 'https://localhost:5051/api', we need 'https://localhost:5051'
    const domain = API_CONFIG.BASE_URL.substring(0, API_CONFIG.BASE_URL.lastIndexOf('/api'));
    return `${domain}${relativePath}`;
};

/**
 * Get SignalR Hub URL for connections
 * @returns {string} SignalR Hub URL (HTTP/HTTPS, not WebSocket)
 */
export const getWebSocketUrl = () => {
    // SignalR expects HTTP/HTTPS URL, it handles WebSocket upgrade internally
    // API_BASE_URL is like 'https://localhost:5051/api'
    const domain = API_CONFIG.BASE_URL.substring(0, API_CONFIG.BASE_URL.lastIndexOf('/api'));
    return `${domain}/api/gamehub`;
};

// Config object for easier importing
export const config = {
    API_BASE_URL: API_CONFIG.BASE_URL,
    CONNECTION_MODE,
    USE_WEBSOCKETS,
    POLLING_INTERVAL_MS,
    TileType,
    TILE_COLOR_CLASSES,
    TILE_IMAGE_PATHS,
    WALL_PATTERN,
    FLOOR_LINE_PENALTIES,
    getAuthHeaders: ApiHelper.getAuthHeaders,
    getFullResourceUrl,
    getWebSocketUrl
}; 