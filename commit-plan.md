# Commit Plan

This file details the commit plan for attributing work to each team member using the `--author` flag. Follow the commands as written for each commit.

---

## Backend & Hard Changes (Yassin)

### 1. Websockets & Chat
- **Author:** Yassin <your@email.com>
- **Message:** "Implement websockets and chat functionality"
- **Files:**
  - Backend/Azul.Api/Hubs/
  - Backend/Azul.Api/Sse/
  - Backend/Azul.Api/Controllers/DiagnosticsController.cs
- **Command:**
  ```sh
  git add Backend/Azul.Api/Hubs/ Backend/Azul.Api/Sse/ Backend/Azul.Api/Controllers/DiagnosticsController.cs
  git commit -m "Implement websockets and chat functionality" --author="Yassin <your@email.com>"
  ```

---

### 2. Auth Fix
- **Author:** Yassin <your@email.com>
- **Message:** "Fix authentication and user profile endpoints"
- **Files:**
  - Backend/Azul.Api/Controllers/UserController.cs
  - Backend/Azul.Api/Models/Input/ChangePasswordInputModel.cs
  - Backend/Azul.Api/Models/Input/UpdateProfileInputModel.cs
  - Backend/Azul.Api/Models/Input/UpdateSettingsInputModel.cs
  - Backend/Azul.Api/Models/Output/ProfilePictureUploadOutputModel.cs
  - Backend/Azul.Api/Models/Output/UserDetailsOutputModel.cs
  - Backend/Azul.Api/Models/UserProfileMappingProfile.cs
  - Backend/Azul.Api/Services/JwtTokenFactory.cs
- **Command:**
  ```sh
  git add Backend/Azul.Api/Controllers/UserController.cs Backend/Azul.Api/Models/Input/ChangePasswordInputModel.cs Backend/Azul.Api/Models/Input/UpdateProfileInputModel.cs Backend/Azul.Api/Models/Input/UpdateSettingsInputModel.cs Backend/Azul.Api/Models/Output/ProfilePictureUploadOutputModel.cs Backend/Azul.Api/Models/Output/UserDetailsOutputModel.cs Backend/Azul.Api/Models/UserProfileMappingProfile.cs Backend/Azul.Api/Services/JwtTokenFactory.cs
  git commit -m "Fix authentication and user profile endpoints" --author="Yassin <your@email.com>"
  ```

---

### 3. Backend and Test Refactoring (Split)

#### 3.1 Yassin
- **Author:** Yassin <your@email.com>
- **Message:** "Refactor backend and tests (part 1)"
- **Files:**
  - Backend/Azul.Api.Tests/Azul.Api.Tests.csproj
  - Backend/Azul.Api.Tests/ControllerIntegrationTestsBase.cs
  - Backend/Azul.Api.Tests/GamesControllerIntegrationTests.cs
  - Backend/Azul.Api.Tests/GamesControllerTests.cs
  - Backend/Azul.Api.Tests/TablesControllerTests.cs
  - Backend/Azul.Api/Azul.Api.csproj
  - Backend/Azul.Api/Controllers/GamesController.cs
  - Backend/Azul.Api/Controllers/TablesController.cs
  - Backend/Azul.Api/Models/Output/BoardModel.cs
  - Backend/Azul.Api/Models/Output/TableModel.cs
  - Backend/Azul.Api/Models/Output/UserModel.cs
- **Command:**
  ```sh
  git add Backend/Azul.Api.Tests/Azul.Api.Tests.csproj Backend/Azul.Api.Tests/ControllerIntegrationTestsBase.cs Backend/Azul.Api.Tests/GamesControllerIntegrationTests.cs Backend/Azul.Api.Tests/GamesControllerTests.cs Backend/Azul.Api.Tests/TablesControllerTests.cs Backend/Azul.Api/Azul.Api.csproj Backend/Azul.Api/Controllers/GamesController.cs Backend/Azul.Api/Controllers/TablesController.cs Backend/Azul.Api/Models/Output/BoardModel.cs Backend/Azul.Api/Models/Output/TableModel.cs Backend/Azul.Api/Models/Output/UserModel.cs
  git commit -m "Refactor backend and tests (part 1)" --author="Yassin <your@email.com>"
  ```

#### 3.2 MirtheReynders
- **Author:** MirtheReynders <12001582@student.pxl.be>
- **Message:** "Refactor backend and tests (part 2)"
- **Files:**
  - Backend/Azul.Api/Program.cs
  - Backend/Azul.Api/appsettings.json
  - Backend/Azul.Bootstrapper/Azul.Bootstrapper.csproj
  - Backend/Azul.Bootstrapper/ServiceCollectionExtensions.cs
  - Backend/Azul.Core.Tests/Azul.Core.Tests.csproj
  - Backend/Azul.Core.Tests/BoardTests.cs
  - Backend/Azul.Core.Tests/Builders/TableMockBuilder.cs
  - Backend/Azul.Core.Tests/TableManagerTests.cs
  - Backend/Azul.Core/Azul.Core.csproj
  - Backend/Azul.Core/BoardAggregate/Board.cs
- **Command:**
  ```sh
  git add Backend/Azul.Api/Program.cs Backend/Azul.Api/appsettings.json Backend/Azul.Bootstrapper/Azul.Bootstrapper.csproj Backend/Azul.Bootstrapper/ServiceCollectionExtensions.cs Backend/Azul.Core.Tests/Azul.Core.Tests.csproj Backend/Azul.Core.Tests/BoardTests.cs Backend/Azul.Core.Tests/Builders/TableMockBuilder.cs Backend/Azul.Core.Tests/TableManagerTests.cs Backend/Azul.Core/Azul.Core.csproj Backend/Azul.Core/BoardAggregate/Board.cs
  git commit -m "Refactor backend and tests (part 2)" --author="MirtheReynders <12001582@student.pxl.be>"
  ```

#### 3.3 MetehanKarakorukPXL
- **Author:** MetehanKarakorukPXL <12100606@student.pxl.be>
- **Message:** "Refactor backend and tests (part 3)"
- **Files:**
  - Backend/Azul.Core/GameAggregate/Contracts/IGameService.cs
  - Backend/Azul.Core/GameAggregate/GameService.cs
  - Backend/Azul.Core/TableAggregate/Contracts/ITable.cs
  - Backend/Azul.Core/TableAggregate/Contracts/ITableManager.cs
  - Backend/Azul.Core/TableAggregate/Contracts/ITableRepository.cs
  - Backend/Azul.Core/TableAggregate/Table.cs
  - Backend/Azul.Core/TableAggregate/TableFactory.cs
  - Backend/Azul.Core/TableAggregate/TableManager.cs
  - Backend/Azul.Core/TileFactoryAggregate/TileFactory.cs
  - Backend/Azul.Core/UserAggregate/User.cs
  - Backend/Azul.Core.Tests/Extensions/PatternLineExtensions.cs
  - Backend/Azul.Infrastructure.Tests/Azul.Infrastructure.Tests.csproj
  - Backend/Azul.Infrastructure/Azul.Infrastructure.csproj
  - Backend/Azul.Infrastructure/InMemoryTableRepository.cs
  - Backend/Azul.Infrastructure/Util/ExpiringDictionary.cs
  - Backend/Azul.Infrastructure/Migrations/
- **Command:**
  ```sh
  git add Backend/Azul.Core/GameAggregate/Contracts/IGameService.cs Backend/Azul.Core/GameAggregate/GameService.cs Backend/Azul.Core/TableAggregate/Contracts/ITable.cs Backend/Azul.Core/TableAggregate/Contracts/ITableManager.cs Backend/Azul.Core/TableAggregate/Contracts/ITableRepository.cs Backend/Azul.Core/TableAggregate/Table.cs Backend/Azul.Core/TableAggregate/TableFactory.cs Backend/Azul.Core/TableAggregate/TableManager.cs Backend/Azul.Core/TileFactoryAggregate/TileFactory.cs Backend/Azul.Core/UserAggregate/User.cs Backend/Azul.Core.Tests/Extensions/PatternLineExtensions.cs Backend/Azul.Infrastructure.Tests/Azul.Infrastructure.Tests.csproj Backend/Azul.Infrastructure/Azul.Infrastructure.csproj Backend/Azul.Infrastructure/InMemoryTableRepository.cs Backend/Azul.Infrastructure/Util/ExpiringDictionary.cs Backend/Azul.Infrastructure/Migrations/
  git commit -m "Refactor backend and tests (part 3)" --author="MetehanKarakorukPXL <12100606@student.pxl.be>"
  ```

---

### 4. Frontend Audio, Game Logic, and WebSocket/Chat Clients
- **Author:** Yassin <your@email.com>
- **Message:** "Add frontend game logic, audio support, and websocket/chat clients"
- **Files:**
  - Frontend2/js/game.js
  - Frontend2/js/gameRenderer.js
  - Frontend2/js/audioManager.js
  - Frontend2/js/audioSynthesizer.js
  - Frontend2/audio/
  - Frontend2/audio-test.html
  - Frontend2/js/wsClient.js
  - Frontend2/js/chatClient.js
- **Command:**
  ```sh
  git add Frontend2/js/game.js Frontend2/js/gameRenderer.js Frontend2/js/audioManager.js Frontend2/js/audioSynthesizer.js Frontend2/audio/ Frontend2/audio-test.html Frontend2/js/wsClient.js Frontend2/js/chatClient.js
  git commit -m "Add frontend game logic, audio support, and websocket/chat clients" --author="Yassin <your@email.com>"
  ```

---

## Frontend & Docs (MirtheReynders & MetehanKarakorukPXL)

### 5. Frontend Commit (MirtheReynders)
- **Author:** MirtheReynders <12001582@student.pxl.be>
- **Message:** "Implement frontend chat, API service, and UI pages"
- **Files:**
  - Frontend2/js/apiService.js
  - Frontend2/js/config.js
  - Frontend2/js/lobby.js
  - Frontend2/js/login.js
  - Frontend2/js/useraccount.js
  - Frontend2/lobby.html
  - Frontend2/useraccount.html
  - Frontend2/game.html
- **Command:**
  ```sh
  git add Frontend2/js/apiService.js Frontend2/js/config.js Frontend2/js/lobby.js Frontend2/js/login.js Frontend2/js/useraccount.js Frontend2/lobby.html Frontend2/useraccount.html Frontend2/game.html
  git commit -m "Implement frontend chat, API service, and UI pages" --author="MirtheReynders <12001582@student.pxl.be>"
  ```

---

### 6. Frontend Docs and Packages (MetehanKarakorukPXL)
- **Author:** MetehanKarakorukPXL <12100606@student.pxl.be>
- **Message:** "Remove outdated frontend documentation and add package files"
- **Files:**
  - Deleted: Frontend2/documentation/index.html.md
  - Deleted: Frontend2/documentation/lobby.js.md
  - Deleted: Frontend2/documentation/login.html.md
  - Deleted: Frontend2/documentation/login.js.md
  - Deleted: Frontend2/documentation/register.html.md
  - Deleted: Frontend2/documentation/register.js.md
  - Deleted: Frontend2/documentation/team.html.md
  - Frontend2/package.json
  - Frontend2/package-lock.json
- **Command:**
  ```sh
  git rm Frontend2/documentation/index.html.md Frontend2/documentation/lobby.js.md Frontend2/documentation/login.html.md Frontend2/documentation/login.js.md Frontend2/documentation/register.html.md Frontend2/documentation/register.js.md Frontend2/documentation/team.html.md
  git add Frontend2/package.json Frontend2/package-lock.json
  git commit -m "Remove outdated frontend documentation and add package files" --author="MetehanKarakorukPXL <12100606@student.pxl.be>"
  ```

---

### 7. Docs and Miscellaneous (Optional)
- **Author:** MirtheReynders <12001582@student.pxl.be>
- **Message:** "Add project documentation"
- **Files:**
  - Docs/
- **Command:**
  ```sh
  git add Docs/
  git commit -m "Add project documentation" --author="MirtheReynders <12001582@student.pxl.be>"
  ```

---

# Instructions
- Follow the order above for a realistic commit history.
- Use the `--author` flag for each commit as shown.
- Adjust author names/emails as needed.
- If you want to further split or combine commits, update this plan accordingly.
