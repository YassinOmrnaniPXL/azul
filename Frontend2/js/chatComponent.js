/**
 * Modular Chat Component
 * A reusable chat UI component that can be integrated into any page
 */
export class ChatComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            maxMessages: 100,
            showProfilePictures: true,
            showTimestamps: true,
            allowEmojis: true,
            placeholder: 'Type your message...',
            height: '400px',
            ...options
        };
        
        this.messages = [];
        this.isScrolledToBottom = true;
        this.unsubscribeFunctions = [];
        
        this.init();
    }

    /**
     * Initialize the chat component
     */
    init() {
        if (!this.container) {
            console.error(`Chat container with id '${this.containerId}' not found`);
            return;
        }

        this.createChatHTML();
        this.setupEventListeners();
        this.setupScrollDetection();
    }

    /**
     * Create the chat HTML structure
     */
    createChatHTML() {
        this.container.innerHTML = `
            <div class="chat-component" style="height: ${this.options.height}">
                <!-- Chat Header -->
                <div class="chat-header">
                    <div class="chat-title">
                        <i class="fas fa-comments"></i>
                        <span>Global Chat</span>
                    </div>
                    <div class="chat-status">
                        <span class="status-indicator" id="chat-status-indicator"></span>
                        <span class="status-text" id="chat-status-text">Connecting...</span>
                    </div>
                </div>

                <!-- Messages Container -->
                <div class="chat-messages" id="chat-messages">
                    <div class="chat-loading">
                        <div class="loading-spinner"></div>
                        <span>Connecting to chat...</span>
                    </div>
                </div>

                <!-- Scroll to Bottom Button -->
                <button class="scroll-to-bottom-btn" id="scroll-to-bottom-btn" style="display: none;">
                    <i class="fas fa-chevron-down"></i>
                    <span class="new-messages-badge" id="new-messages-badge">0</span>
                </button>

                <!-- Chat Input -->
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <input 
                            type="text" 
                            class="chat-input" 
                            id="chat-input" 
                            placeholder="${this.options.placeholder}"
                            maxlength="500"
                            autocomplete="off"
                        >
                        <button class="chat-send-btn" id="chat-send-btn" disabled>
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="chat-input-info">
                        <span class="char-count" id="char-count">0/500</span>
                        ${this.options.allowEmojis ? '<span class="emoji-hint">😊 Emojis supported</span>' : ''}
                    </div>
                </div>
            </div>
        `;

        this.addChatStyles();
    }

    /**
     * Add CSS styles for the chat component
     */
    addChatStyles() {
        if (document.getElementById('chat-component-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'chat-component-styles';
        styles.textContent = `
            .chat-component {
                display: flex;
                flex-direction: column;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                position: relative;
            }

            .chat-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .chat-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 16px;
            }

            .chat-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                opacity: 0.9;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #fbbf24;
                animation: pulse 2s infinite;
            }

            .status-indicator.connected {
                background: #10b981;
                animation: none;
            }

            .status-indicator.disconnected {
                background: #ef4444;
                animation: none;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #f8fafc;
                scroll-behavior: smooth;
            }

            .chat-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #64748b;
                gap: 12px;
            }

            .loading-spinner {
                width: 24px;
                height: 24px;
                border: 2px solid #e2e8f0;
                border-top: 2px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .chat-message {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
                animation: slideIn 0.3s ease-out;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .chat-message.system {
                justify-content: center;
                margin-bottom: 8px;
            }

            .chat-message.system .message-content {
                background: #e2e8f0;
                color: #475569;
                font-size: 12px;
                padding: 6px 12px;
                border-radius: 12px;
                font-style: italic;
            }

            .message-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                flex-shrink: 0;
            }

            .message-content {
                flex: 1;
                background: white;
                border-radius: 16px;
                padding: 12px 16px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                position: relative;
            }

            .message-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }

            .message-author {
                font-weight: 600;
                color: #1e293b;
                font-size: 14px;
            }

            .message-time {
                font-size: 11px;
                color: #64748b;
            }

            .message-text {
                color: #374151;
                line-height: 1.4;
                word-wrap: break-word;
            }

            .scroll-to-bottom-btn {
                position: absolute;
                bottom: 80px;
                right: 20px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #667eea;
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 10;
            }

            .scroll-to-bottom-btn:hover {
                background: #5a67d8;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }

            .new-messages-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
            }

            .chat-input-container {
                padding: 16px 20px;
                background: white;
                border-top: 1px solid #e2e8f0;
            }

            .chat-input-wrapper {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .chat-input {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 24px;
                outline: none;
                font-size: 14px;
                transition: border-color 0.2s ease;
                background: #f8fafc;
            }

            .chat-input:focus {
                border-color: #667eea;
                background: white;
            }

            .chat-send-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: #667eea;
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .chat-send-btn:disabled {
                background: #cbd5e1;
                cursor: not-allowed;
            }

            .chat-send-btn:not(:disabled):hover {
                background: #5a67d8;
                transform: scale(1.05);
            }

            .chat-input-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
                font-size: 11px;
                color: #64748b;
            }

            .char-count {
                font-weight: 500;
            }

            .emoji-hint {
                opacity: 0.7;
            }

            /* Scrollbar styling */
            .chat-messages::-webkit-scrollbar {
                width: 6px;
            }

            .chat-messages::-webkit-scrollbar-track {
                background: #f1f5f9;
            }

            .chat-messages::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }

            .chat-messages::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .chat-header {
                    padding: 12px 16px;
                }

                .chat-messages {
                    padding: 12px;
                }

                .chat-input-container {
                    padding: 12px 16px;
                }

                .message-content {
                    padding: 10px 12px;
                }

                .chat-title {
                    font-size: 14px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        const scrollBtn = document.getElementById('scroll-to-bottom-btn');
        const charCount = document.getElementById('char-count');

        // Input event listeners
        chatInput.addEventListener('input', () => {
            const length = chatInput.value.length;
                            charCount.textContent = `${length}/500`;
            sendBtn.disabled = length === 0;
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        scrollBtn.addEventListener('click', () => {
            this.scrollToBottom();
            this.hideScrollButton();
        });
    }

    /**
     * Set up scroll detection
     */
    setupScrollDetection() {
        const messagesContainer = document.getElementById('chat-messages');
        let newMessagesCount = 0;

        messagesContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
            this.isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;

            if (this.isScrolledToBottom) {
                this.hideScrollButton();
                newMessagesCount = 0;
            }
        });

        // Store reference for new message counting
        this.incrementNewMessages = () => {
            if (!this.isScrolledToBottom) {
                newMessagesCount++;
                this.updateScrollButton(newMessagesCount);
            }
        };
    }

    /**
     * Add a message to the chat
     */
    addMessage(message) {
        this.messages.push(message);
        
        // Remove old messages if we exceed the limit
        if (this.messages.length > this.options.maxMessages) {
            this.messages.shift();
        }

        this.renderMessage(message);
        
        // Handle scroll and new message notification
        if (this.isScrolledToBottom) {
            setTimeout(() => this.scrollToBottom(), 100);
        } else {
            this.incrementNewMessages();
        }
    }

    /**
     * Render a single message
     */
    renderMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        
        // Remove loading indicator if it exists
        const loading = messagesContainer.querySelector('.chat-loading');
        if (loading) {
            loading.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.IsSystemMessage ? 'system' : 'user'}`;

        if (message.IsSystemMessage) {
            messageElement.innerHTML = `
                <div class="message-content">
                    ${this.escapeHtml(message.Message)}
                </div>
            `;
        } else {
            const profilePicture = message.ProfilePictureUrl || 'images/Default_pfp.jpg';
            const displayName = this.escapeHtml(message.DisplayName || 'Unknown Player');
            const messageText = this.escapeHtml(message.Message);
            const timestamp = message.FormattedTime || 'now';

            messageElement.innerHTML = `
                ${this.options.showProfilePictures ? `<img src="${profilePicture}" alt="${displayName}" class="message-avatar">` : ''}
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${displayName}</span>
                        ${this.options.showTimestamps ? `<span class="message-time">${timestamp}</span>` : ''}
                    </div>
                    <div class="message-text">${messageText}</div>
                </div>
            `;
        }

        messagesContainer.appendChild(messageElement);
    }

    /**
     * Send a message
     */
    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();

        if (!message) return;

        try {
            // This will be called by the parent component
            if (this.onSendMessage) {
                await this.onSendMessage(message);
            }
            
            chatInput.value = '';
            document.getElementById('char-count').textContent = '0/500';
            document.getElementById('chat-send-btn').disabled = true;
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showError('Failed to send message. Please try again.');
        }
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(status) {
        const indicator = document.getElementById('chat-status-indicator');
        const text = document.getElementById('chat-status-text');

        indicator.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'connected':
                text.textContent = 'Connected';
                break;
            case 'connecting':
            case 'reconnecting':
                text.textContent = 'Connecting...';
                break;
            case 'disconnected':
                text.textContent = 'Disconnected';
                break;
            default:
                text.textContent = 'Unknown';
        }
    }

    /**
     * Show error message
     */
    showError(errorMessage) {
        this.addMessage({
            DisplayName: 'System',
            Message: `Error: ${errorMessage}`,
            IsSystemMessage: true,
            MessageType: 'error',
            Timestamp: new Date().toISOString()
        });
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.messages = [];
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.isScrolledToBottom = true;
    }

    /**
     * Show scroll to bottom button
     */
    updateScrollButton(newMessagesCount) {
        const scrollBtn = document.getElementById('scroll-to-bottom-btn');
        const badge = document.getElementById('new-messages-badge');
        
        scrollBtn.style.display = 'flex';
        badge.textContent = newMessagesCount;
        badge.style.display = newMessagesCount > 0 ? 'flex' : 'none';
    }

    /**
     * Hide scroll to bottom button
     */
    hideScrollButton() {
        const scrollBtn = document.getElementById('scroll-to-bottom-btn');
        scrollBtn.style.display = 'none';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set message send handler
     */
    setSendHandler(handler) {
        this.onSendMessage = handler;
    }

    /**
     * Destroy the chat component
     */
    destroy() {
        // Clean up event listeners
        this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        this.unsubscribeFunctions = [];

        // Clear the container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
} 