# 🚀 Azul Game Deployment Script (PowerShell)
# This script helps deploy your application to various platforms

param(
    [string]$Action = "menu"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🎮 Azul Game Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Helper functions
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Check if git is available
function Test-Git {
    try {
        git --version | Out-Null
        return $true
    }
    catch {
        Write-Error "Git is not installed. Please install Git first."
        exit 1
    }
}

# Check if we're in a git repository
function Test-GitRepo {
    try {
        git rev-parse --git-dir | Out-Null
        return $true
    }
    catch {
        Write-Error "Not in a Git repository. Please run this script from your project root."
        exit 1
    }
}

# Frontend deployment to GitHub Pages
function Deploy-Frontend {
    Write-Info "Deploying Frontend to GitHub Pages..."
    
    # Check if package.json exists
    if (-not (Test-Path "Frontend2/package.json")) {
        Write-Error "Frontend2/package.json not found!"
        exit 1
    }
    
    # Install dependencies
    Write-Info "Installing frontend dependencies..."
    Push-Location Frontend2
    try {
        npm install
    }
    finally {
        Pop-Location
    }
    
    # Check if GitHub Pages is configured
    Write-Warning "Make sure GitHub Pages is enabled in your repository settings!"
    Write-Info "Go to: Settings → Pages → Source: GitHub Actions"
    
    # Commit and push changes
    Write-Info "Committing and pushing changes..."
    git add .
    try {
        git commit -m "Deploy: Update frontend for GitHub Pages deployment"
    }
    catch {
        Write-Info "No changes to commit or commit failed, continuing..."
    }
    
    try {
        git push origin main
    }
    catch {
        try {
            git push origin master
        }
        catch {
            Write-Warning "Failed to push to both main and master branches. Please check your branch name."
        }
    }
    
    Write-Success "Frontend deployment initiated! Check GitHub Actions for progress."
    Write-Info "Your site will be available at: https://YOUR_USERNAME.github.io/project-2425-azul-azul04/"
}

# Backend deployment preparation
function Prepare-Backend {
    Write-Info "Preparing Backend for deployment..."
    
    # Check if .NET is available
    try {
        dotnet --version | Out-Null
    }
    catch {
        Write-Error ".NET SDK is not installed. Please install .NET 8.0 SDK first."
        exit 1
    }
    
    # Build the project
    Write-Info "Building backend project..."
    Push-Location Backend
    try {
        dotnet restore
        dotnet build --configuration Release
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Backend build completed successfully!"
    
    # Show deployment options
    Write-Host ""
    Write-Info "Backend Deployment Options:"
    Write-Host "1. 🚂 Railway (Recommended) - `$5/month" -ForegroundColor White
    Write-Host "   - Visit: https://railway.app" -ForegroundColor Gray
    Write-Host "   - Connect your GitHub repository" -ForegroundColor Gray
    Write-Host "   - Add PostgreSQL database" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. 🎨 Render (Free Tier) - Free with limitations" -ForegroundColor White
    Write-Host "   - Visit: https://render.com" -ForegroundColor Gray
    Write-Host "   - Create Web Service from GitHub" -ForegroundColor Gray
    Write-Host "   - Add PostgreSQL database" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. ☁️  Azure App Service (Free Tier) - Free with limitations" -ForegroundColor White
    Write-Host "   - Visit: https://portal.azure.com" -ForegroundColor Gray
    Write-Host "   - Create App Service (F1 Free tier)" -ForegroundColor Gray
    Write-Host ""
    Write-Warning "Remember to update CORS settings and connection strings!"
}

# Update configuration for production
function Update-Config {
    Write-Info "Updating configuration for production..."
    
    # Prompt for backend URL
    Write-Host ""
    $backendUrl = Read-Host "Enter your backend URL (e.g., https://your-app.railway.app)"
    
    if ($backendUrl) {
        # Update frontend config
        $configPath = "Frontend2/js/config.js"
        if (Test-Path $configPath) {
            $content = Get-Content $configPath -Raw
            $content = $content -replace "https://your-backend-url\.railway\.app", $backendUrl
            Set-Content $configPath -Value $content
            Write-Success "Updated frontend configuration with backend URL: $backendUrl"
        }
    }
    
    # Prompt for GitHub username
    Write-Host ""
    $githubUsername = Read-Host "Enter your GitHub username"
    
    if ($githubUsername) {
        # Update package.json homepage
        $packagePath = "Frontend2/package.json"
        if (Test-Path $packagePath) {
            $content = Get-Content $packagePath -Raw
            $content = $content -replace "yourusername", $githubUsername
            Set-Content $packagePath -Value $content
            Write-Success "Updated package.json with GitHub username: $githubUsername"
        }
    }
}

# Main menu
function Show-Menu {
    Write-Host ""
    Write-Host "What would you like to do?" -ForegroundColor Cyan
    Write-Host "1. 🌐 Deploy Frontend (GitHub Pages)" -ForegroundColor White
    Write-Host "2. 🖥️  Prepare Backend for deployment" -ForegroundColor White
    Write-Host "3. ⚙️  Update configuration" -ForegroundColor White
    Write-Host "4. 🚀 Full deployment (Frontend + Backend prep)" -ForegroundColor White
    Write-Host "5. ❌ Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Choose an option (1-5)"
    
    switch ($choice) {
        "1" { Deploy-Frontend }
        "2" { Prepare-Backend }
        "3" { Update-Config }
        "4" { 
            Update-Config
            Prepare-Backend
            Deploy-Frontend
        }
        "5" { 
            Write-Info "Goodbye! 👋"
            exit 0
        }
        default { 
            Write-Error "Invalid option. Please choose 1-5."
            Show-Menu
        }
    }
}

# Main execution
function Main {
    Test-Git
    Test-GitRepo
    
    $currentDir = Get-Location
    $currentBranch = git branch --show-current
    
    Write-Info "Current directory: $currentDir"
    Write-Info "Git branch: $currentBranch"
    
    if ($Action -eq "menu") {
        Show-Menu
    }
    elseif ($Action -eq "frontend") {
        Deploy-Frontend
    }
    elseif ($Action -eq "backend") {
        Prepare-Backend
    }
    elseif ($Action -eq "config") {
        Update-Config
    }
    elseif ($Action -eq "full") {
        Update-Config
        Prepare-Backend
        Deploy-Frontend
    }
    else {
        Write-Error "Invalid action. Use: menu, frontend, backend, config, or full"
        exit 1
    }
}

# Run main function
Main 