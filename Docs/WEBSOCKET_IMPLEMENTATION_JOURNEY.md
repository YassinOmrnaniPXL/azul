# Azul Game: Extra - WebSocket (SignalR) Real-Time Implementation

## 1. Introduction

This document details the significant upgrade of the Azul game's real-time update mechanism, transitioning from a polling-based system to a modern WebSocket solution using SignalR. This change was part of a broader enhancement to the game flow, which included:

*   **Manual Game Start:** Moving from an automatic game start to a system where a designated host player initiates the game.
*   **Table Management:** Introduction of new functionalities and API endpoints for players to create and join game tables.

The primary goal of this "extra implementation" was to provide a robust, responsive, and stable real-time experience for players, directly addressing the limitations of the previous polling architecture and supporting the new, more interactive game setup process.

## 2. Initial Problem Statement with Polling-Based System

The existing polling-based system for real-time updates suffered from several drawbacks:

*   **UI Lag & Delays:** Polling, by its nature, introduces latency between a game action and its reflection on other players' screens.
*   **Inconsistent Updates:** Players sometimes experienced issues like the game board disappearing or updates not appearing reliably, leading to a confusing user experience.
*   **Scalability Concerns:** Frequent polling from multiple clients can place unnecessary load on the server.

A critical underlying issue, which would have hampered any real-time data transmission (including more efficient polling if it used the same models), was a backend `System.NotSupportedException`. This occurred during JSON serialization of the 2D array `TileSpotModel[,]` used for the player's wall. This error could lead to failed updates and frontend state corruption.

## 3. Phase 1: Decommissioning the Polling-Based Update System

The first step was to remove the outdated polling mechanisms to make way for the WebSocket solution.

### Frontend (`Frontend2/`)
*   **Configuration (`js/config.js`):** The `FORCE_POLLING_MODE` flag, if used to enforce polling, was removed.
*   **Game Logic (`js/game.js`):**
    *   References to `FORCE_POLLING_MODE` were eliminated.
    *   The core polling loop, typically involving `setInterval` or `setTimeout` to call `fetchAndRenderGameState` repeatedly, was dismantled. The `fetchAndRenderGameState` function was retained for initial game load and potentially for explicit refreshes if ever needed, but not for continuous polling.
    *   Functions like `startPolling()` and `stopPolling()` were removed or refactored to no longer manage a polling interval for game state updates.

### Backend (`Backend/Azul.Api/`)
*   While the backend didn't have a specific "polling endpoint" that was removed (as polling typically hits the main game state endpoint), the *reliance* on clients repeatedly hitting `GET /api/games/{gameId}` for updates was now considered obsolete.
*   The `IGameEventBus` was retained for internal server-side eventing, but its role as a direct source for client polling updates (if it was ever used as such) was superseded by SignalR's targeted client communication.

## 4. Phase 2: WebSocket (SignalR) Implementation - A New Real-Time Architecture

This phase involved building the new SignalR solution, designed to integrate with the updated game flow (host player, manual game start, table management).

### Architectural Enhancements Supported
*   **Host-Initiated Games & Table Management:** New RESTful API endpoints were introduced on the backend (e.g., for creating tables, joining tables, and allowing the host to start the game). The SignalR communication for a specific game only begins after these interactions have established the game session.

### Backend (`Backend/Azul.Api/`)
*   **SignalR Hub (`Hubs/GameWebSocketHub.cs`):**
    *   A new hub `GameWebSocketHub` (inheriting from `Microsoft.AspNetCore.SignalR.Hub`) was created.
    *   `OnConnectedAsync`: Adds the connecting client to a SignalR group identified by the `gameId` (passed in the WebSocket connection URL's query string). This ensures that updates for a specific game are only sent to players in that game.
    *   `OnDisconnectedAsync`: Removes the client from the group.
    *   `Ping`: A simple method allowing clients to send a ping, primarily for keep-alive and connection testing.
*   **Game Service Decorator (`WS/Decorators/GameServiceRealtimeDecorator.cs`):**
    *   This new decorator wraps the core game service.
    *   It injects `IHubContext<GameWebSocketHub>` to enable communication with connected clients via the hub.
    *   After any game action (e.g., `TakeTilesFromFactory`, `PlaceTilesOnPatternLine`), it calls a method like `PublishAndBroadcastGameStateUpdateAsync`.
    *   This method fetches the complete, updated game state, maps it to the `GameModel` output DTO, and then broadcasts this `GameModel` to all clients in the specific game's SignalR group using:
        `await _hubContext.Clients.Group(gameId.ToString()).SendAsync("GameStateUpdate", gameModel);`
*   **Program Startup (`Program.cs`):**
    *   SignalR services were registered: `builder.Services.AddSignalR();`.
    *   The `GameWebSocketHub` was mapped to a specific endpoint: `app.MapHub<GameWebSocketHub>("/api/gamehub");`.
    *   JWT authentication was configured to correctly extract the `access_token` from the query string for connections to `/api/gamehub`, allowing SignalR to authorize WebSocket connections.
*   **Output Models (`Models/Output/BoardModel.cs`):**
    *   **Critical Fix:** The `TileSpotModel[,] Wall` property was changed to `List<List<TileSpotModel>> Wall`. This was crucial because `System.Text.Json` (and `Newtonsoft.Json` by default) does not support serializing/deserializing 2D arrays out-of-the-box without custom converters.
    *   Similarly, `PatternLineModel[] PatternLines` became `List<PatternLineModel> PatternLines`, and `TileSpotModel[] FloorLine` became `List<TileSpotModel> FloorLine` for consistency and to avoid potential future serialization issues.
    *   An AutoMapper `ITypeConverter<TileSpot[,], List<List<TileSpotModel>>>` (named `WallConverter`) was implemented and registered in `MappingProfile.cs`. This converter handles the transformation from the core domain model's 2D array to the DTO's `List<List<TileSpotModel>>`, ensuring successful JSON serialization for SignalR.

### Frontend (`Frontend2/`)
*   **NPM Package:** The `@microsoft/signalr` library was installed: `npm install @microsoft/signalr`.
*   **WebSocket Client (`js/wsClient.js`):**
    *   A new client module was created to encapsulate SignalR connection management.
    *   It uses `new signalR.HubConnectionBuilder()` to configure the connection.
    *   The connection URL was dynamically constructed using `API_BASE_URL` (which must be HTTPS for secure WebSocket negotiation) and appending the hub path `/api/gamehub`, along with `gameId` and the JWT `access_token` as query parameters.
    *   `connection.on("GameStateUpdate", (gameState) => { ... });` registers a handler to listen for `GameStateUpdate` messages broadcast by the server. This handler then calls the `handleWsMessage` callback provided by `game.js`.
    *   The `subscribe(gameId, msgCb, openCb, errorCb, closeCb)` function initializes, configures, and starts the SignalR connection.
    *   `unsubscribe()` stops the connection.
    *   A client-to-server `Ping` is sent periodically using `connection.invoke("Ping", ...)` to help maintain the connection and for diagnostics.
    *   `withAutomaticReconnect()` was configured to handle transient network issues.
    *   SignalR client-side logging was set to `LogLevel.Trace` during development for in-depth diagnostics.
*   **Game Logic (`js/game.js`):**
    *   `wsSubscribe` and `wsUnsubscribe` from `wsClient.js` are imported and used.
    *   In `initGamePage` (after initial game data fetch for the *new* game flow which might involve joining a table and waiting for the host), `setupRealtimeUpdates` is called.
    *   `setupRealtimeUpdates` calls `wsSubscribe`, providing callbacks:
        *   `handleWsMessage`: Processes incoming game state updates.
        *   `handleWsOpen`, `handleWsError`, `handleWsClose`: Manage connection lifecycle events.
    *   `handleWsMessage(newGameState)`:
        *   When a `GameStateUpdate` is received, this function updates the local `currentGameState`.
        *   Crucially, it then calls `renderGame(currentGameState, handleBoardLocationClick, handleFactoryTileClick)` to refresh the entire game UI with the new state.
        *   The logic that previously deferred updates if `actionInProgress` was true was removed. This ensures that updates resulting from a player's own action are processed immediately.
    *   Player action handlers (e.g., `handleFactoryTileClick`, `handleBoardLocationClick`) were simplified. They now primarily focus on sending the action to the backend and rely on the subsequent WebSocket broadcast to update the UI, rather than performing an additional `fetchAndRenderGameState` themselves. The `actionInProgress` flag in these handlers now mainly prevents the user from initiating multiple overlapping actions.
*   **Game Rendering (`js/gameRenderer.js`):**
    *   `renderChosenTilesArea`: This function was modified to always keep the "chosen tiles" display area container visible. If the player has no tiles currently selected (i.e., `tilesToPlace` is empty), a placeholder message like "Selected tiles will appear here." is displayed, instead of hiding the container. This prevents UI layout shifts when tiles are taken.

## 5. Key Troubleshooting Steps During WebSocket Implementation

Several challenges were encountered and resolved during the migration to SignalR:

*   **NPM Package Integration & Module Loading (`wsClient.js`):**
    *   Initial attempts to use ES6 style `import * as signalR from '@microsoft/signalr';` resulted in "bare specifier" errors when served directly to the browser without a bundling step.
    *   Switching to relative paths to `node_modules` led to MIME type errors (`text/html` instead of `application/javascript`).
    *   **Resolution:** The UMD (Universal Module Definition) version of the SignalR client was imported for its side effects: `import "../node_modules/@microsoft/signalr/dist/browser/signalr.js";`. This makes the `signalR` object available on the global `window` object, accessed via `const signalR = window.signalR;`.

*   **SignalR Negotiation Failure (URL Scheme "wss" not supported / NetworkError):**
    *   The client initially failed to connect, with browser console errors like `TypeError: NetworkError when attempting to fetch resource.` and `Fetch API cannot load wss://... URL scheme "wss" is not supported.`
    *   **Troubleshooting Steps:**
        *   Verified backend CORS policy was permissive.
        *   Ensured SSL certificate for `localhost:5051` (backend) was trusted by the browser.
        *   Corrected the backend SignalR hub mapping path from `/gamehub` (initial thought) to the actual `/api/gamehub`.
    *   **Root Cause & Resolution:** The SignalR client was attempting to use `wss://` for the initial HTTP-based negotiation request. The fix involved modifying `wsClient.js` to pass the standard `https://`-based `API_BASE_URL` (e.g., `https://localhost:5051/api/gamehub`) to `HubConnectionBuilder().withUrl()`. SignalR client library then correctly handles the negotiation over HTTPS and subsequently upgrades the connection to WebSockets (WSS) itself.

*   **Frontend Click Handler Issues (`lineClickHandler is not a function`):**
    *   After successfully connecting via WebSockets, player actions like placing tiles on the board failed.
    *   The browser console showed: `Uncaught TypeError: lineClickHandler is not a function` originating from `gameRenderer.js`.
    *   **Root Cause:** Debugging revealed that `renderGame` in `game.js` was being called with incorrect arguments. Specifically, `localUserId` (a string) was mistakenly passed in the position where the `handleBoardLocationClick` callback function was expected.
    *   **Resolution:** The calls to `renderGame` within `fetchAndRenderGameState` and `handleWsMessage` in `game.js` were corrected to: `renderGame(currentGameState, handleBoardLocationClick, handleFactoryTileClick);`.

*   **Backend `async Task Ping` Warning:**
    *   The `Ping` method in `GameWebSocketHub.cs` was defined as `async Task` but did not contain any `await` operations, leading to a compiler warning.
    *   **Resolution:** The method was kept as `async Task` to allow for potential future asynchronous logic within the ping operation (e.g., logging to a database). The warning is benign if no async calls are made. If a "pong" were sent back using `await Clients.Caller.SendAsync(...)`, the `await` would satisfy the async requirement. Alternatively, it could be changed to `void Ping()` if it's guaranteed to remain purely synchronous.

*   **Backend: WebSocket Connection Drops After First Action (Serialization Error):**
    *   This was the re-emergence of the `System.NotSupportedException: Serialization and deserialization of 'Azul.Api.Models.Output.TileSpotModel[,]' instances is not supported.` error when SignalR attempted to serialize the `GameModel` for broadcasting.
    *   **Resolution:** As detailed in the Backend (Phase 2) section, the `BoardModel.cs` was updated to use `List<List<TileSpotModel>>` for the `Wall` (and similarly for `PatternLines` and `FloorLine`). The crucial `WallConverter` (an AutoMapper `ITypeConverter`) was implemented to bridge the gap between the domain model's 2D array and the DTO's list-based structure.

*   **UI Not Updating in Real-Time Without Manual Refresh:**
    *   Even with the backend sending updates and `wsClient.js` receiving them, the UI for the acting player sometimes wouldn't refresh.
    *   **Root Cause:** The `handleWsMessage` function in `game.js` had a check `if (actionInProgress)` which would cause it to `return` without rendering if a player action had just been initiated. The WebSocket message (confirming the action) was arriving *while* this flag was still true from the initiating action call.
    *   **Resolution:** The `if (actionInProgress)` block was removed from `handleWsMessage`. The `actionInProgress` flag in the actual action handlers (like `handleFactoryTileClick`) still serves its purpose of preventing a user from firing off multiple actions simultaneously, but it no longer blocks the processing of an incoming WebSocket update that reflects the result of the just-completed action.

*   **"Chosen Tiles" Area Causing Page Refresh/Jump Sensation:**
    *   The UI section displaying tiles chosen by the player (but not yet placed) would appear and disappear based on whether tiles were selected. This caused a noticeable layout shift.
    *   **Resolution:** The `renderChosenTilesArea` function in `gameRenderer.js` was updated. The main container for this area is now always visible. When no tiles are selected, it displays a placeholder text ("Selected tiles will appear here.") instead of being hidden via CSS.

## 6. Backend Integration Test Adjustments (`GamesControllerIntegrationTests.cs`)

The refactoring of backend output models, particularly `BoardModel.cs`, from using arrays (e.g., `TileSpotModel[,]`, `PatternLineModel[]`) to `List<T>` collections (e.g., `List<List<TileSpotModel>>`, `List<PatternLineModel>`) necessitated corresponding changes in the integration tests.

Key adjustments in `Backend/Azul.Api.Tests/GamesControllerIntegrationTests.cs` included:

*   **Wall Access:**
    *   Previously, accessing a tile in the wall might have used 2D array syntax: `player.Board.Wall[row, col]`.
    *   This was updated to use list-of-lists indexing: `player.Board.Wall[row][col]`.
*   **Collection Length/Count:**
    *   Assertions checking the size of `PatternLines` and `FloorLine` (and rows/columns of `Wall`) were changed from using the array `.Length` property to the list `.Count` property.
    *   For example, `player.Board.PatternLines.Length` became `player.Board.PatternLines.Count`.
*   **`PatternLineModel` Property:**
    *   An initial assumption was that `PatternLineModel` might have a `Capacity` property to denote its size (1-5 tiles).
    *   The actual property in `PatternLineModel.cs` was found to be `Length`. Test code was updated to use `patternLine.Length` where it previously might have incorrectly used `patternLine.Capacity` or relied on array dimensions.
    *   This affected LINQ queries and direct property access when determining a pattern line's intended size or its index.

These test modifications ensured that the integration tests remained aligned with the updated data structures, verifying the correct behavior of the game logic and API endpoints after the model changes required for successful SignalR serialization.

## 7. Diagnostic Code Removal

Once the WebSocket implementation proved stable and reliable:
*   All temporary diagnostic code, including UI elements (like a diagnostics button and page) and related JavaScript functions (`createDiagnosticButton`, `showConnectionDiagnostics`, `saveDiagnosticData`, `getWsDiagnostics`, etc.), were removed from `game.js`, `wsClient.js`, and `gameRenderer.js`.
*   The `Frontend2/diagnostic.html` page was deleted.
This cleanup streamlined the codebase for a production-like state.

## 8. Final State & Benefits

The migration to a WebSocket (SignalR) based real-time system, integrated with the new host-initiated game flow and table management features, has yielded significant improvements:

*   **Enhanced User Experience:** Game actions are reflected across all clients almost instantaneously, eliminating noticeable lag.
*   **Increased Stability:** The new system resolved bugs related to UI inconsistencies and disappearing game elements that were present with the polling mechanism.
*   **Improved Responsiveness:** The game feels more interactive and dynamic.
*   **Modern Architecture:** The adoption of WebSockets aligns the application with current best practices for real-time web applications.

This "extra implementation" successfully modernized the real-time capabilities of the Azul game, providing a solid foundation for future features and a much more enjoyable experience for players. 