# Azul Game Application

A full-stack implementation of the Azul board game for the 1TIN project 2025.

## 🎉 Recent Achievements

### ✅ Fixed Critical Table Persistence Bug (May 2025)
Successfully resolved a major issue where game tables would disappear immediately after creation:

**Root Cause**: Repository services were registered as `Scoped` instead of `Singleton`, causing each HTTP request to receive a new repository instance with empty data.

**Solution**: Changed repository registration from `AddScoped` to `AddSingleton` in dependency injection configuration.

**Impact**: 
- ✅ Tables now persist across HTTP requests
- ✅ Waiting modal stays visible correctly
- ✅ No more 404 errors when polling table status
- ✅ Multiplayer functionality restored

## 🏗️ Architecture

### Backend (ASP.NET Core)
- **API**: RESTful API with JWT authentication
- **Database**: SQL Server with Entity Framework Core
- **Storage**: In-memory repositories for game state (Singleton pattern)
- **Authentication**: JWT Bearer tokens with role-based access

### Frontend (Vanilla JavaScript)
- **SPA**: Single Page Application with modern ES6+
- **UI**: Responsive design with CSS Grid/Flexbox
- **State Management**: LocalStorage for session persistence
- **API Communication**: Fetch API with comprehensive error handling

## 🚀 Getting Started

### Prerequisites
- .NET 8.0 SDK
- SQL Server (LocalDB or full instance)
- Python 3.7+ (for frontend server)

### Backend Setup
```bash
cd Backend
dotnet restore
dotnet run --project Azul.Api/Azul.Api.csproj
```
Backend will be available at:
- HTTPS: https://localhost:5051
- HTTP: http://localhost:5050

### Frontend Setup
```bash
cd Frontend2
python -m http.server 8081
```
Frontend will be available at: http://localhost:8081/Frontend2/

### Test Account
- **Email**: test@test.com
- **Password**: test123

## 🔧 Key Technical Fixes

### 1. JWT Authentication
- Fixed from `AddIdentity()` to `AddIdentityCore()` to prevent authentication scheme conflicts
- Proper Bearer token validation and claim mapping

### 2. Repository Pattern
- **Before**: `services.AddScoped<ITableRepository, InMemoryTableRepository>()`
- **After**: `services.AddSingleton<ITableRepository, InMemoryTableRepository>()`
- Ensures data persistence across HTTP requests

### 3. Frontend State Management
- LocalStorage integration for table persistence
- Comprehensive error handling and fallback mechanisms
- Real-time polling with proper cleanup

## 📁 Project Structure
```
project-2425-azul-azul04/
├── Backend/
│   ├── Azul.Api/              # Web API controllers and configuration
│   ├── Azul.Core/             # Business logic and domain models
│   ├── Azul.Infrastructure/   # Data access and repositories
│   └── Azul.Bootstrapper/     # Dependency injection setup
└── Frontend2/
    ├── js/                    # JavaScript modules
    ├── css/                   # Stylesheets
    └── *.html                # Page templates
```

## 🎮 Features
- [x] User authentication and registration
- [x] Game table creation and joining
- [x] Real-time game state management
- [x] Multiplayer support
- [x] Responsive UI design
- [x] Session persistence

## 🐛 Debugging Tips
- Check browser console for frontend errors
- Monitor backend logs for API issues
- Verify JWT token expiration (60 minutes default)
- Ensure both backend and frontend servers are running

---
*Last updated: May 2025 - Table persistence issue resolved* ✅
