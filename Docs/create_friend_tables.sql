-- Create Friendships table
CREATE TABLE [Friendships] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [FriendId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [IsAccepted] bit NOT NULL,
    [RequestedById] uniqueidentifier NOT NULL,
    [AcceptedAt] datetime2 NULL,
    CONSTRAINT [PK_Friendships] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_Friendship_NotSelf] CHECK ([UserId] != [FriendId]),
    CONSTRAINT [FK_Friendships_Users_FriendId] FOREIGN KEY ([FriendId]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_Friendships_Users_RequestedById] FOREIGN KEY ([RequestedById]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_Friendships_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);

-- Create GameInvitations table
CREATE TABLE [GameInvitations] (
    [Id] uniqueidentifier NOT NULL,
    [FromUserId] uniqueidentifier NOT NULL,
    [ToUserId] uniqueidentifier NOT NULL,
    [TableId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [Status] int NOT NULL,
    [RespondedAt] datetime2 NULL,
    [Message] nvarchar(500) NULL,
    CONSTRAINT [PK_GameInvitations] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_GameInvitation_NotSelf] CHECK ([FromUserId] != [ToUserId]),
    CONSTRAINT [FK_GameInvitations_Users_FromUserId] FOREIGN KEY ([FromUserId]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_GameInvitations_Users_ToUserId] FOREIGN KEY ([ToUserId]) REFERENCES [Users] ([Id])
);

-- Create PrivateMessages table
CREATE TABLE [PrivateMessages] (
    [Id] uniqueidentifier NOT NULL,
    [FromUserId] uniqueidentifier NOT NULL,
    [ToUserId] uniqueidentifier NOT NULL,
    [Content] nvarchar(1000) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [IsRead] bit NOT NULL,
    [ReadAt] datetime2 NULL,
    CONSTRAINT [PK_PrivateMessages] PRIMARY KEY ([Id]),
    CONSTRAINT [CK_PrivateMessage_NotSelf] CHECK ([FromUserId] != [ToUserId]),
    CONSTRAINT [FK_PrivateMessages_Users_FromUserId] FOREIGN KEY ([FromUserId]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_PrivateMessages_Users_ToUserId] FOREIGN KEY ([ToUserId]) REFERENCES [Users] ([Id])
);

-- Create indexes for Friendships
CREATE INDEX [IX_Friendships_FriendId] ON [Friendships] ([FriendId]);
CREATE INDEX [IX_Friendships_RequestedById] ON [Friendships] ([RequestedById]);
CREATE INDEX [IX_Friendships_UserId] ON [Friendships] ([UserId]);
CREATE UNIQUE INDEX [IX_Friendships_UserId_FriendId] ON [Friendships] ([UserId], [FriendId]);

-- Create indexes for GameInvitations
CREATE INDEX [IX_GameInvitations_FromUserId] ON [GameInvitations] ([FromUserId]);
CREATE INDEX [IX_GameInvitations_ToUserId] ON [GameInvitations] ([ToUserId]);
CREATE INDEX [IX_GameInvitations_TableId] ON [GameInvitations] ([TableId]);

-- Create indexes for PrivateMessages
CREATE INDEX [IX_PrivateMessages_FromUserId] ON [PrivateMessages] ([FromUserId]);
CREATE INDEX [IX_PrivateMessages_ToUserId] ON [PrivateMessages] ([ToUserId]);
CREATE INDEX [IX_PrivateMessages_CreatedAt] ON [PrivateMessages] ([CreatedAt]);

-- Add migration record
INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES ('20250525180000_AddFriendSystemTables', '8.0.0'); 