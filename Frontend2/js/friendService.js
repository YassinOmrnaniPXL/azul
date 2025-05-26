import { API_BASE_URL, getAuthHeaders } from './config.js';

/**
 * Friend Service - Handles all friend system operations
 */
export class FriendService {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/Friends`;
    }

    // Friend management
    async sendFriendRequest(displayName) {
        try {
            const response = await fetch(`${this.baseUrl}/send-request`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ displayName })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to send friend request: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw error;
        }
    }

    async acceptFriendRequest(friendshipId) {
        try {
            const response = await fetch(`${this.baseUrl}/accept-request/${friendshipId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to accept friend request: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    }

    async declineFriendRequest(friendshipId) {
        try {
            const response = await fetch(`${this.baseUrl}/decline-request/${friendshipId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to decline friend request: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error declining friend request:', error);
            throw error;
        }
    }

    async removeFriend(friendId) {
        try {
            const response = await fetch(`${this.baseUrl}/remove/${friendId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to remove friend: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error removing friend:', error);
            throw error;
        }
    }

    // Friend queries
    async getFriends() {
        try {
            const response = await fetch(`${this.baseUrl}/list`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to get friends: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting friends:', error);
            throw error;
        }
    }

    async getPendingFriendRequests() {
        try {
            const response = await fetch(`${this.baseUrl}/pending-requests`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to get pending requests: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting pending friend requests:', error);
            throw error;
        }
    }

    async getSentFriendRequests() {
        try {
            const response = await fetch(`${this.baseUrl}/sent-requests`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to get sent requests: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting sent friend requests:', error);
            throw error;
        }
    }

    async searchUserByDisplayName(displayName) {
        try {
            const response = await fetch(`${this.baseUrl}/search/${encodeURIComponent(displayName)}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to search user: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching user:', error);
            throw error;
        }
    }

    // Game invitations
    async sendGameInvitation(toUserId, tableId, message = null) {
        try {
            const response = await fetch(`${this.baseUrl}/invite-to-game`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ toUserId, tableId, message })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to send game invitation: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending game invitation:', error);
            throw error;
        }
    }

    async acceptGameInvitation(invitationId) {
        try {
            const response = await fetch(`${this.baseUrl}/accept-game-invitation/${invitationId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to accept game invitation: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error accepting game invitation:', error);
            throw error;
        }
    }

    async declineGameInvitation(invitationId) {
        try {
            const response = await fetch(`${this.baseUrl}/decline-game-invitation/${invitationId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to decline game invitation: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error declining game invitation:', error);
            throw error;
        }
    }

    async getPendingGameInvitations() {
        try {
            const response = await fetch(`${this.baseUrl}/game-invitations`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to get game invitations: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting game invitations:', error);
            throw error;
        }
    }

    // Private messaging
    async sendPrivateMessage(toUserId, content) {
        try {
            const response = await fetch(`${this.baseUrl}/send-message`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ toUserId, content })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to send private message: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending private message:', error);
            throw error;
        }
    }

    async getPrivateMessages(friendId, limit = 50) {
        try {
            const response = await fetch(`${this.baseUrl}/messages/${friendId}?limit=${limit}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to get private messages: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting private messages:', error);
            throw error;
        }
    }

    async markMessagesAsRead(fromUserId) {
        try {
            const response = await fetch(`${this.baseUrl}/mark-messages-read/${fromUserId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to mark messages as read: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }

    async getUnreadMessageCount() {
        try {
            const response = await fetch(`${this.baseUrl}/unread-count`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                throw new Error(errorData.message || `Failed to get unread count: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting unread message count:', error);
            throw error;
        }
    }
} 