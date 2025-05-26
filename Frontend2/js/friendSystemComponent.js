import { FriendService } from './friendService.js';
import { profilePictureService } from './profilePictureService.js';
import { modalService } from './modalService.js';

/**
 * Friend System Component - Handles friend system UI and interactions
 */
export class FriendSystemComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.friendService = new FriendService();
        this.friends = [];
        this.pendingRequests = [];
        this.gameInvitations = [];
        this.currentView = 'friends'; // 'friends', 'requests', 'invitations', 'search'
        
        this.init();
    }

    init() {
        this.render();
        this.loadFriends();
        this.loadPendingRequests();
        this.loadGameInvitations();
        
        // Refresh data every 5 seconds for better real-time experience
        setInterval(() => {
            this.refreshData();
        }, 5000);
    }

    async refreshData() {
        try {
            await Promise.all([
                this.loadFriends(),
                this.loadPendingRequests(),
                this.loadGameInvitations()
            ]);
        } catch (error) {
            console.error('Error refreshing friend data:', error);
            // Show a subtle error indicator if backend is down
            this.showBackendError();
        }
    }

    async loadFriends() {
        try {
            const response = await this.friendService.getFriends();
            this.friends = response.friends || [];
            this.updateFriendsView();
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }

    async loadPendingRequests() {
        try {
            const response = await this.friendService.getPendingFriendRequests();
            this.pendingRequests = response.requests || [];
            this.updateRequestsView();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    }

    async loadGameInvitations() {
        try {
            const response = await this.friendService.getPendingGameInvitations();
            this.gameInvitations = response.invitations || [];
            this.updateInvitationsView();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error loading game invitations:', error);
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="text-xl font-bold text-azulBlue font-display mb-4">Friends</h2>
                    
                    <!-- Navigation Tabs -->
                    <div class="flex space-x-1 bg-gray-100 rounded-lg p-1">
                        <button id="friends-tab" class="tab-button flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors duration-200 bg-white text-azulBlue shadow-sm">
                            Friends <span id="friends-count" class="ml-1 text-xs bg-azulBlue text-white rounded-full px-1.5 py-0.5">0</span>
                        </button>
                        <button id="requests-tab" class="tab-button flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors duration-200 text-gray-600 hover:text-azulBlue">
                            Requests <span id="requests-badge" class="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 hidden">0</span>
                        </button>
                        <button id="invitations-tab" class="tab-button flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors duration-200 text-gray-600 hover:text-azulBlue">
                            Invites <span id="invitations-badge" class="ml-1 text-xs bg-green-500 text-white rounded-full px-1.5 py-0.5 hidden">0</span>
                        </button>
                        <button id="search-tab" class="tab-button flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors duration-200 text-gray-600 hover:text-azulBlue">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-hidden">
                    <!-- Friends View -->
                    <div id="friends-view" class="h-full flex flex-col">
                        <div class="flex-1 overflow-y-auto p-3">
                            <div id="friends-list">
                                <div class="text-center text-gray-500 py-4">
                                    <i class="fas fa-users text-2xl mb-2"></i>
                                    <p class="text-sm">No friends yet. Add some friends to get started!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Requests View -->
                    <div id="requests-view" class="h-full flex flex-col hidden">
                        <div class="flex-1 overflow-y-auto p-3">
                            <div id="requests-list">
                                <div class="text-center text-gray-500 py-4">
                                    <i class="fas fa-user-plus text-2xl mb-2"></i>
                                    <p class="text-sm">No pending friend requests</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Game Invitations View -->
                    <div id="invitations-view" class="h-full flex flex-col hidden">
                        <div class="flex-1 overflow-y-auto p-3">
                            <div id="invitations-list">
                                <div class="text-center text-gray-500 py-4">
                                    <i class="fas fa-gamepad text-2xl mb-2"></i>
                                    <p class="text-sm">No game invitations</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search View -->
                    <div id="search-view" class="h-full flex flex-col hidden">
                        <div class="p-3 border-b border-gray-200">
                            <div class="flex space-x-2">
                                <input type="text" id="search-input" placeholder="Enter display name..." 
                                       class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-azulBlue focus:border-azulBlue">
                                <button id="search-button" class="px-3 py-1.5 bg-azulBlue text-white rounded-md hover:bg-opacity-90 transition-colors duration-200">
                                    <i class="fas fa-search text-sm"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-3">
                            <div id="search-results">
                                <div class="text-center text-gray-500 py-4">
                                    <i class="fas fa-search text-2xl mb-2"></i>
                                    <p class="text-sm">Search for users by their display name</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Tab navigation
        document.getElementById('friends-tab').addEventListener('click', () => this.switchView('friends'));
        document.getElementById('requests-tab').addEventListener('click', () => this.switchView('requests'));
        document.getElementById('invitations-tab').addEventListener('click', () => this.switchView('invitations'));
        document.getElementById('search-tab').addEventListener('click', () => this.switchView('search'));

        // Search functionality
        document.getElementById('search-button').addEventListener('click', () => this.handleSearch());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
    }

    switchView(view) {
        // Hide all views
        document.getElementById('friends-view').classList.add('hidden');
        document.getElementById('requests-view').classList.add('hidden');
        document.getElementById('invitations-view').classList.add('hidden');
        document.getElementById('search-view').classList.add('hidden');

        // Remove active state from all tabs
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('bg-white', 'text-azulBlue', 'shadow-sm');
            tab.classList.add('text-gray-600', 'hover:text-azulBlue');
        });

        // Show selected view and activate tab
        document.getElementById(`${view}-view`).classList.remove('hidden');
        const activeTab = document.getElementById(`${view}-tab`);
        activeTab.classList.add('bg-white', 'text-azulBlue', 'shadow-sm');
        activeTab.classList.remove('text-gray-600', 'hover:text-azulBlue');

        this.currentView = view;
    }

    updateNotificationBadge() {
        const requestsBadge = document.getElementById('requests-badge');
        const invitationsBadge = document.getElementById('invitations-badge');

        if (this.pendingRequests.length > 0) {
            requestsBadge.textContent = this.pendingRequests.length;
            requestsBadge.classList.remove('hidden');
        } else {
            requestsBadge.classList.add('hidden');
        }

        if (this.gameInvitations.length > 0) {
            invitationsBadge.textContent = this.gameInvitations.length;
            invitationsBadge.classList.remove('hidden');
        } else {
            invitationsBadge.classList.add('hidden');
        }
    }

    updateFriendsView() {
        const friendsList = document.getElementById('friends-list');
        const friendsCount = document.getElementById('friends-count');
        
        friendsCount.textContent = this.friends.length;

        if (this.friends.length === 0) {
            friendsList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-users text-3xl mb-2"></i>
                    <p>No friends yet. Add some friends to get started!</p>
                </div>
            `;
            return;
        }

        // Horizontal layout optimized for the new position
        friendsList.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                ${this.friends.map(friend => `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                        <div class="flex flex-col items-center text-center space-y-2">
                            <img src="images/Default_pfp.jpg" 
                                 alt="${friend.displayName}" 
                                 class="w-12 h-12 rounded-full object-cover border-2 border-azulAccent shadow-sm"
                                 data-user-id="${friend.id}">
                            <div>
                                <h3 class="font-semibold text-gray-800 text-xs">${friend.displayName}</h3>
                                <p class="text-xs text-gray-500">Online</p>
                            </div>
                            <div class="flex space-x-1 w-full">
                                <button onclick="friendSystem.sendGameInvitation('${friend.id}')" 
                                        class="flex-1 px-1 py-1 text-xs bg-azulAccent text-white rounded hover:bg-opacity-90 transition-colors duration-200"
                                        title="Invite to game">
                                    <i class="fas fa-gamepad"></i>
                                </button>
                                <button onclick="friendSystem.openPrivateChat('${friend.id}', '${friend.displayName}')" 
                                        class="flex-1 px-1 py-1 text-xs bg-azulBlue text-white rounded hover:bg-opacity-90 transition-colors duration-200"
                                        title="Private message">
                                    <i class="fas fa-comment"></i>
                                </button>
                                <button onclick="friendSystem.removeFriend('${friend.id}', '${friend.displayName}')" 
                                        class="flex-1 px-1 py-1 text-xs bg-red-500 text-white rounded hover:bg-opacity-90 transition-colors duration-200"
                                        title="Remove friend">
                                    <i class="fas fa-user-minus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Load profile pictures asynchronously
        this.friends.forEach(friend => {
            const img = friendsList.querySelector(`img[data-user-id="${friend.id}"]`);
            if (img) {
                profilePictureService.getProfilePictureUrl(friend.id)
                    .then(profilePictureUrl => {
                        img.src = profilePictureUrl;
                    })
                    .catch(error => {
                        console.warn(`Failed to load profile picture for ${friend.displayName}:`, error);
                        // Keep default image
                    });
            }
        });
    }

    updateRequestsView() {
        const requestsList = document.getElementById('requests-list');

        if (this.pendingRequests.length === 0) {
            requestsList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-user-plus text-3xl mb-2"></i>
                    <p>No pending friend requests</p>
                </div>
            `;
            return;
        }

        requestsList.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                ${this.pendingRequests.map(request => `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                        <div class="flex flex-col items-center text-center space-y-2">
                            <img src="images/Default_pfp.jpg" 
                                 alt="${request.fromUser.displayName}" 
                                 class="w-12 h-12 rounded-full object-cover border-2 border-azulAccent shadow-sm"
                                 data-user-id="${request.fromUser.id}">
                            <div>
                                <h3 class="font-semibold text-gray-800 text-xs">${request.fromUser.displayName}</h3>
                                <p class="text-xs text-gray-500">${new Date(request.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div class="flex space-x-1 w-full">
                                <button onclick="friendSystem.acceptFriendRequest('${request.id}')" 
                                        class="flex-1 px-1 py-1 text-xs bg-green-500 text-white rounded hover:bg-opacity-90 transition-colors duration-200">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button onclick="friendSystem.declineFriendRequest('${request.id}')" 
                                        class="flex-1 px-1 py-1 text-xs bg-red-500 text-white rounded hover:bg-opacity-90 transition-colors duration-200">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Load profile pictures asynchronously
        this.pendingRequests.forEach(request => {
            const img = requestsList.querySelector(`img[data-user-id="${request.fromUser.id}"]`);
            if (img) {
                profilePictureService.getProfilePictureUrl(request.fromUser.id)
                    .then(profilePictureUrl => {
                        img.src = profilePictureUrl;
                    })
                    .catch(error => {
                        console.warn(`Failed to load profile picture for ${request.fromUser.displayName}:`, error);
                        // Keep default image
                    });
            }
        });
    }

    updateInvitationsView() {
        const invitationsList = document.getElementById('invitations-list');

        if (this.gameInvitations.length === 0) {
            invitationsList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-gamepad text-3xl mb-2"></i>
                    <p>No game invitations</p>
                </div>
            `;
            return;
        }

        invitationsList.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                ${this.gameInvitations.map(invitation => `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                        <div class="flex flex-col items-center text-center space-y-2">
                            <img src="images/Default_pfp.jpg" 
                                 alt="${invitation.fromUser.displayName}" 
                                 class="w-12 h-12 rounded-full object-cover border-2 border-azulAccent shadow-sm"
                                 data-user-id="${invitation.fromUser.id}">
                            <div>
                                <h3 class="font-semibold text-gray-800 text-xs">${invitation.fromUser.displayName}</h3>
                                <p class="text-xs text-gray-500">Game invite</p>
                                ${invitation.message ? `<p class="text-xs text-gray-600 italic truncate" title="${invitation.message}">"${invitation.message}"</p>` : ''}
                            </div>
                            <div class="flex space-x-1 w-full">
                                <button onclick="friendSystem.acceptGameInvitation('${invitation.id}', '${invitation.tableId}')" 
                                        class="flex-1 px-1 py-1 text-xs bg-green-500 text-white rounded hover:bg-opacity-90 transition-colors duration-200">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button onclick="friendSystem.declineGameInvitation('${invitation.id}')" 
                                        class="flex-1 px-1 py-1 text-xs bg-red-500 text-white rounded hover:bg-opacity-90 transition-colors duration-200">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Load profile pictures asynchronously
        this.gameInvitations.forEach(invitation => {
            const img = invitationsList.querySelector(`img[data-user-id="${invitation.fromUser.id}"]`);
            if (img) {
                profilePictureService.getProfilePictureUrl(invitation.fromUser.id)
                    .then(profilePictureUrl => {
                        img.src = profilePictureUrl;
                    })
                    .catch(error => {
                        console.warn(`Failed to load profile picture for ${invitation.fromUser.displayName}:`, error);
                        // Keep default image
                    });
            }
        });
    }

    async handleSearch() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        const displayName = searchInput.value.trim();

        if (!displayName) {
            this.showError('Please enter a display name to search');
            return;
        }

        try {
            searchResults.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                    <p>Searching...</p>
                </div>
            `;

            const response = await this.friendService.searchUserByDisplayName(displayName);
            
            if (response.success && response.user) {
                const user = response.user;
                let actionButton = '';

                if (user.areFriends) {
                    actionButton = '<span class="w-full px-2 py-1 text-xs bg-green-100 text-green-800 rounded text-center block">Already friends</span>';
                } else if (user.hasPendingRequest) {
                    actionButton = '<span class="w-full px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded text-center block">Request pending</span>';
                } else {
                    actionButton = `<button onclick="friendSystem.sendFriendRequest('${user.displayName}')" 
                                           class="w-full px-2 py-1 text-xs bg-azulBlue text-white rounded hover:bg-opacity-90 transition-colors duration-200">
                                        <i class="fas fa-user-plus mr-1"></i>Add Friend
                                    </button>`;
                }

                searchResults.innerHTML = `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200 max-w-xs mx-auto">
                        <div class="flex flex-col items-center text-center space-y-2">
                            <img src="images/Default_pfp.jpg" 
                                 alt="${user.displayName}" 
                                 class="w-12 h-12 rounded-full object-cover border-2 border-azulAccent shadow-sm"
                                 data-user-id="${user.id}">
                            <div>
                                <h3 class="font-semibold text-gray-800 text-xs">${user.displayName}</h3>
                            </div>
                            <div class="w-full">
                                ${actionButton}
                            </div>
                        </div>
                    </div>
                `;

                // Load profile picture asynchronously
                if (user.id) {
                    const img = searchResults.querySelector(`img[data-user-id="${user.id}"]`);
                    if (img) {
                        profilePictureService.getProfilePictureUrl(user.id)
                            .then(profilePictureUrl => {
                                img.src = profilePictureUrl;
                            })
                            .catch(error => {
                                console.warn(`Failed to load profile picture for ${user.displayName}:`, error);
                                // Keep default image
                            });
                    }
                }
            } else {
                searchResults.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <i class="fas fa-user-slash text-3xl mb-2"></i>
                        <p>User not found</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error searching user:', error);
            searchResults.innerHTML = `
                <div class="text-center text-red-500 py-8">
                    <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                    <p>Error searching user: ${error.message}</p>
                </div>
            `;
        }
    }

    // Friend action methods
    async sendFriendRequest(displayName) {
        try {
            await this.friendService.sendFriendRequest(displayName);
            this.showSuccess(`Friend request sent to ${displayName}`);
            this.handleSearch(); // Refresh search results
        } catch (error) {
            this.showError(`Failed to send friend request: ${error.message}`);
        }
    }

    async acceptFriendRequest(friendshipId) {
        try {
            await this.friendService.acceptFriendRequest(friendshipId);
            this.showSuccess('Friend request accepted');
            this.refreshData();
        } catch (error) {
            this.showError(`Failed to accept friend request: ${error.message}`);
        }
    }

    async declineFriendRequest(friendshipId) {
        try {
            await this.friendService.declineFriendRequest(friendshipId);
            this.showSuccess('Friend request declined');
            this.refreshData();
        } catch (error) {
            this.showError(`Failed to decline friend request: ${error.message}`);
        }
    }

    async removeFriend(friendId, friendName) {
        const confirmed = await modalService.confirm(
            'Remove Friend',
            `Are you sure you want to remove ${friendName} from your friends?`,
            {
                confirmText: 'Remove',
                cancelText: 'Cancel',
                confirmClass: 'bg-red-500 hover:bg-red-600'
            }
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await this.friendService.removeFriend(friendId);
            this.showSuccess(`${friendName} removed from friends`);
            this.refreshData();
        } catch (error) {
            this.showError(`Failed to remove friend: ${error.message}`);
        }
    }

    async acceptGameInvitation(invitationId, tableId) {
        try {
            await this.friendService.acceptGameInvitation(invitationId);
            this.showSuccess('Game invitation accepted! Joining the game...');
            this.refreshData();
            
            // Import necessary functions
            const { joinSpecificTable, joinOrCreateTable } = await import('./apiService.js');
            
            try {
                // Try to join the specific table that the invitation was for
                console.log('Attempting to join specific table:', tableId);
                const joinedTableData = await joinSpecificTable(tableId);
                console.log('Join specific table result:', joinedTableData);
                
                if (joinedTableData && joinedTableData.id) {
                    // Set the current table ID and show waiting view
                    window.currentTableId = joinedTableData.id;
                    localStorage.setItem('currentTableId', joinedTableData.id);
                    
                    // Show success message
                    await modalService.alert(
                        'Invitation Accepted',
                        'Game invitation accepted! You have joined your friend\'s table. Waiting for the game to start...',
                        { confirmClass: 'bg-green-500 hover:bg-green-600' }
                    );
                    
                    // Reload the page to show the waiting view
                    window.location.reload();
                } else {
                    throw new Error('Failed to join table - no table data returned');
                }
            } catch (joinError) {
                console.error('Error joining specific table:', joinError);
                
                // Check if the error is because the table no longer exists
                if (joinError.message.includes('DataNotFoundException') || joinError.message.includes('not found') || joinError.message.includes('404')) {
                    // Table no longer exists, offer to create a new game with default settings
                    const createNew = await modalService.confirm(
                        'Table No Longer Available',
                        'The original table is no longer available (it may have expired or been removed). Would you like to create a new 2-player game instead?',
                        {
                            confirmText: 'Create New Game',
                            cancelText: 'Cancel',
                            confirmClass: 'bg-azulBlue hover:bg-opacity-90'
                        }
                    );
                    
                    if (createNew) {
                        try {
                            // Create a new 2-player game
                            const newTableData = await joinOrCreateTable({
                                numberOfPlayers: 2,
                                numberOfArtificialPlayers: 0
                            });
                            
                            if (newTableData && newTableData.id) {
                                window.currentTableId = newTableData.id;
                                localStorage.setItem('currentTableId', newTableData.id);
                                
                                await modalService.alert(
                                    'New Game Created',
                                    'A new 2-player game has been created. Your friend can join by creating a new game or you can invite them again.',
                                    { confirmClass: 'bg-green-500 hover:bg-green-600' }
                                );
                                
                                window.location.reload();
                            }
                        } catch (createError) {
                            console.error('Error creating new game:', createError);
                            await modalService.alert(
                                'Error',
                                `Failed to create new game: ${createError.message}`,
                                { confirmClass: 'bg-red-500 hover:bg-red-600' }
                            );
                        }
                    }
                } else {
                    // Other error (table full, game started, etc.)
                    await modalService.alert(
                        'Cannot Join Table',
                        `Game invitation accepted, but couldn't join the table: ${joinError.message}. The table might be full or the game may have already started.`,
                        { confirmClass: 'bg-azulAccent hover:bg-opacity-90' }
                    );
                }
            }
            
        } catch (error) {
            this.showError(`Failed to accept game invitation: ${error.message}`);
        }
    }

    async declineGameInvitation(invitationId) {
        try {
            await this.friendService.declineGameInvitation(invitationId);
            this.showSuccess('Game invitation declined');
            this.refreshData();
        } catch (error) {
            this.showError(`Failed to decline game invitation: ${error.message}`);
        }
    }

    async sendGameInvitation(friendId) {
        // Check if user is currently at a table
        const currentTableId = this.getCurrentTableId();
        
        if (!currentTableId) {
            await modalService.alert(
                'Cannot Send Invitation',
                'You need to be seated at a table to send game invitations. Please join or create a game first.',
                { confirmClass: 'bg-azulAccent hover:bg-opacity-90' }
            );
            return;
        }

        // Show invitation dialog
        const message = await modalService.prompt(
            'Send Game Invitation',
            'Enter an optional message for the invitation:',
            {
                placeholder: 'Come play Azul with me!',
                confirmText: 'Send Invitation',
                cancelText: 'Cancel'
            }
        );
        
        if (message === null) return; // User cancelled

        try {
            await this.friendService.sendGameInvitation(friendId, currentTableId, message || '');
            this.showSuccess('Game invitation sent!');
        } catch (error) {
            this.showError(`Failed to send game invitation: ${error.message}`);
        }
    }

    getCurrentTableId() {
        // Try to get table ID from URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const tableIdFromUrl = urlParams.get('join');
        if (tableIdFromUrl) {
            return tableIdFromUrl;
        }

        // Try to get table ID from the current page context
        // Look for table ID in the waiting section
        const tableIdElement = document.querySelector('[data-table-id]');
        if (tableIdElement) {
            return tableIdElement.getAttribute('data-table-id');
        }

        // Try to extract from the displayed table ID text
        const tableIdText = document.querySelector('.table-id-display');
        if (tableIdText) {
            const match = tableIdText.textContent.match(/ID:\s*([a-f0-9-]+)/i);
            if (match) {
                return match[1];
            }
        }

        // Check if there's a global variable for current table
        if (window.currentTableId) {
            return window.currentTableId;
        }

        return null;
    }

    openPrivateChat(friendId, friendName) {
        // This would open a private chat window
        // For now, show a placeholder message
        this.showInfo(`Private chat with ${friendName} - Coming soon!`);
    }

    // Utility methods
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showBackendError() {
        // Add a subtle error indicator to the header
        const header = this.container.querySelector('h2');
        if (header && !header.querySelector('.error-indicator')) {
            const errorIndicator = document.createElement('span');
            errorIndicator.className = 'error-indicator ml-2 text-red-500 text-sm';
            errorIndicator.innerHTML = '<i class="fas fa-exclamation-triangle" title="Backend connection error"></i>';
            header.appendChild(errorIndicator);
            
            // Remove after 10 seconds
            setTimeout(() => {
                errorIndicator.remove();
            }, 10000);
        }
    }
}

// Make it globally accessible for onclick handlers
window.friendSystem = null; 