// Chat client for real-time messaging
import { playSfx } from './audioManager.js';

let chatConnection = null;
let currentPlayerName = null;
let chatInitialized = false;

// Initialize chat functionality
const initializeChat = async (wsConnection, playerName) => {
    if (chatInitialized) return;
    
    try {
        chatConnection = wsConnection;
        currentPlayerName = playerName;
        
        // Set up chat message handlers
        chatConnection.on('ReceiveChatMessage', handleChatMessage);
        chatConnection.on('PlayerJoined', handlePlayerJoined);
        chatConnection.on('PlayerLeft', handlePlayerLeft);
        
        // Set up UI event handlers
        setupChatUI();
        
        chatInitialized = true;
        console.log('Chat initialized successfully');
    } catch (error) {
        console.error('Error initializing chat:', error);
    }
};

// Handle incoming chat messages
const handleChatMessage = (chatMessage) => {
    console.log('=== CHAT MESSAGE DEBUG ===');
    console.log('Full message object:', chatMessage);
    console.log('Type of message:', typeof chatMessage);
    console.log('Object keys:', Object.keys(chatMessage));
    
    // Try different possible property names
    console.log('PlayerName variations:');
    console.log('  PlayerName:', chatMessage.PlayerName);
    console.log('  playerName:', chatMessage.playerName);
    console.log('  Player:', chatMessage.Player);
    console.log('  player:', chatMessage.player);
    console.log('  Username:', chatMessage.Username);
    console.log('  username:', chatMessage.username);
    
    console.log('Message variations:');
    console.log('  Message:', chatMessage.Message);
    console.log('  message:', chatMessage.message);
    console.log('  Content:', chatMessage.Content);
    console.log('  content:', chatMessage.content);
    console.log('  Text:', chatMessage.Text);
    console.log('  text:', chatMessage.text);
    
    console.log('Timestamp variations:');
    console.log('  Timestamp:', chatMessage.Timestamp);
    console.log('  timestamp:', chatMessage.timestamp);
    console.log('  CreatedAt:', chatMessage.CreatedAt);
    console.log('  createdAt:', chatMessage.createdAt);
    console.log('  Time:', chatMessage.Time);
    console.log('  time:', chatMessage.time);
    
    console.log('=== END DEBUG ===');
    
    // Play message received sound
    playSfx('messageReceived');
    
    displayChatMessage(chatMessage);
};

// Handle player joined notifications
const handlePlayerJoined = (playerName) => {
    const systemMessage = {
        PlayerName: 'System',
        Message: `${playerName} joined the game`,
        Timestamp: new Date().toISOString(),
        IsSystemMessage: true
    };
    
    // Play player join sound
    playSfx('playerJoin');
    
    displayChatMessage(systemMessage);
};

// Handle player left notifications
const handlePlayerLeft = (playerName) => {
    const systemMessage = {
        PlayerName: 'System',
        Message: `${playerName} left the game`,
        Timestamp: new Date().toISOString(),
        IsSystemMessage: true
    };
    
    // Play player leave sound
    playSfx('playerLeave');
    
    displayChatMessage(systemMessage);
};

// Display a chat message in the UI
const displayChatMessage = (chatMessage) => {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Clear placeholder text if this is the first message
    if (chatMessages.children.length === 1 && chatMessages.children[0].textContent.includes('Chat will appear here')) {
        chatMessages.innerHTML = '';
    }
    
    // Try to extract player name from various possible properties
    let playerName = chatMessage.PlayerName || 
                    chatMessage.playerName || 
                    chatMessage.Player || 
                    chatMessage.player || 
                    chatMessage.Username || 
                    chatMessage.username || 
                    'Unknown Player';
    
    // Try to extract message content from various possible properties
    let messageContent = chatMessage.Message || 
                        chatMessage.message || 
                        chatMessage.Content || 
                        chatMessage.content || 
                        chatMessage.Text || 
                        chatMessage.text || 
                        'No message content';
    
    // Try to extract timestamp from various possible properties
    let timestampValue = chatMessage.Timestamp || 
                        chatMessage.timestamp || 
                        chatMessage.CreatedAt || 
                        chatMessage.createdAt || 
                        chatMessage.Time || 
                        chatMessage.time || 
                        new Date().toISOString();
    
    console.log('Extracted values:');
    console.log('  playerName:', playerName);
    console.log('  messageContent:', messageContent);
    console.log('  timestampValue:', timestampValue);
    
    // Format timestamp
    let timestamp = 'Invalid Date';
    try {
        let date;
        
        // Handle different timestamp formats
        if (typeof timestampValue === 'string') {
            // Handle .NET DateTime formats
            if (timestampValue.includes('T') && (timestampValue.includes('Z') || timestampValue.includes('+'))) {
                date = new Date(timestampValue);
            } else if (timestampValue.match(/^\d{4}-\d{2}-\d{2}/)) {
                date = new Date(timestampValue);
            } else {
                date = new Date(timestampValue);
            }
        } else if (typeof timestampValue === 'number') {
            date = new Date(timestampValue);
        } else {
            date = new Date();
        }
        
        if (!isNaN(date.getTime())) {
            timestamp = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        } else {
            console.warn('Invalid timestamp, using current time:', timestampValue);
            timestamp = new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        }
    } catch (error) {
        console.error('Error parsing timestamp:', error, timestampValue);
        timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'mb-2';
    
    // Determine if this is the current player's message
    const isOwnMessage = playerName === currentPlayerName;
    const isSystemMessage = chatMessage.IsSystemMessage || playerName === 'System';
    
    if (isSystemMessage) {
        messageElement.className += ' text-center';
        messageElement.innerHTML = `
            <div class="text-xs text-gray-500 italic py-1">
                <span class="opacity-75">${timestamp}</span> - ${messageContent}
            </div>
        `;
    } else {
        const messageClass = isOwnMessage 
            ? 'bg-azulBlue text-white ml-8' 
            : 'bg-gray-100 text-gray-800 mr-8';
        
        messageElement.className = `p-2 rounded-lg ${messageClass}`;
        messageElement.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <span class="font-semibold text-xs ${isOwnMessage ? 'text-azulCream' : 'text-azulBlue'}">${playerName}</span>
                <span class="text-xs opacity-75 ml-2">${timestamp}</span>
            </div>
            <div class="text-sm">${messageContent}</div>
        `;
    }
    
    // Add message to chat
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Show notification if chat is closed
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer && chatContainer.classList.contains('hidden')) {
        showChatNotification();
    }
};

// Set up chat UI event handlers
const setupChatUI = () => {
    const chatToggle = document.getElementById('chat-toggle');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send');
    
    if (chatToggle) {
        chatToggle.addEventListener('click', toggleChat);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', handleChatInputKeypress);
        chatInput.addEventListener('input', updateCharacterCount);
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
    }
};

// Toggle chat panel
const toggleChat = () => {
    const chatContainer = document.getElementById('chat-container');
    const chatToggleIcon = document.getElementById('chat-toggle-icon');
    
    if (!chatContainer) return;
    
    const isHidden = chatContainer.classList.contains('hidden');
    
    if (isHidden) {
        // Show chat
        chatContainer.classList.remove('hidden');
        if (chatToggleIcon) {
            chatToggleIcon.classList.remove('fa-chevron-down');
            chatToggleIcon.classList.add('fa-chevron-up');
        }
        clearChatNotification();
        
        // Focus on input when opening
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 100);
        }
    } else {
        // Hide chat
        chatContainer.classList.add('hidden');
        if (chatToggleIcon) {
            chatToggleIcon.classList.remove('fa-chevron-up');
            chatToggleIcon.classList.add('fa-chevron-down');
        }
    }
    
    // Play button click sound
    try {
        playSfx('buttonClick', 0.5);
    } catch (e) {
        // Audio not available yet
    }
};

// Handle Enter key in chat input
const handleChatInputKeypress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
};

// Update character count display
const updateCharacterCount = () => {
    const chatInput = document.getElementById('chat-input');
    const charCount = document.getElementById('char-count');
    
    if (chatInput && charCount) {
        const remaining = 500 - chatInput.value.length;
        charCount.textContent = remaining;
        charCount.className = remaining < 50 ? 'text-red-500' : 'text-gray-500';
    }
};

// Send chat message
const sendChatMessage = async () => {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput || !chatConnection) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    if (message.length > 500) {
        alert('Message is too long. Maximum 500 characters.');
        playSfx('errorSound');
        return;
    }
    
    try {
        await chatConnection.invoke('SendChatMessage', message, currentPlayerName);
        chatInput.value = '';
        updateCharacterCount();
        
        // Play message sent sound
        playSfx('messageSent');
        
        console.log('Chat message sent successfully');
    } catch (error) {
        console.error('Error sending chat message:', error);
        alert('Failed to send message. Please try again.');
        playSfx('errorSound');
    }
};

// Show chat notification when new message arrives and chat is closed
const showChatNotification = () => {
    const chatHeader = document.getElementById('chat-toggle');
    const chatTitle = chatHeader?.querySelector('h3');
    if (chatTitle && !chatTitle.textContent.includes('!')) {
        chatTitle.textContent = 'Game Chat 💬!';
        chatHeader.classList.add('animate-pulse');
    }
};

// Clear chat notification when chat is opened
const clearChatNotification = () => {
    const chatHeader = document.getElementById('chat-toggle');
    const chatTitle = chatHeader?.querySelector('h3');
    if (chatTitle) {
        chatTitle.textContent = 'Game Chat 💬';
        chatHeader.classList.remove('animate-pulse');
    }
};

// Check if chat is initialized
const isChatInitialized = () => chatInitialized;

// Export functions
export { initializeChat, isChatInitialized, toggleChat }; 