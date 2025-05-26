#!/bin/bash

# 🚀 Azul Game Deployment Script
# This script helps deploy your application to various platforms

set -e  # Exit on any error

echo "🎮 Azul Game Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if git is available
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a Git repository. Please run this script from your project root."
        exit 1
    fi
}

# Frontend deployment to GitHub Pages
deploy_frontend() {
    print_info "Deploying Frontend to GitHub Pages..."
    
    # Check if package.json exists
    if [ ! -f "Frontend2/package.json" ]; then
        print_error "Frontend2/package.json not found!"
        exit 1
    fi
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    cd Frontend2
    npm install
    cd ..
    
    # Check if GitHub Pages is configured
    print_warning "Make sure GitHub Pages is enabled in your repository settings!"
    print_info "Go to: Settings → Pages → Source: GitHub Actions"
    
    # Commit and push changes
    print_info "Committing and pushing changes..."
    git add .
    git commit -m "Deploy: Update frontend for GitHub Pages deployment" || true
    git push origin main || git push origin master
    
    print_success "Frontend deployment initiated! Check GitHub Actions for progress."
    print_info "Your site will be available at: https://YOUR_USERNAME.github.io/project-2425-azul-azul04/"
}

# Backend deployment preparation
prepare_backend() {
    print_info "Preparing Backend for deployment..."
    
    # Check if .NET is available
    if ! command -v dotnet &> /dev/null; then
        print_error ".NET SDK is not installed. Please install .NET 8.0 SDK first."
        exit 1
    fi
    
    # Build the project
    print_info "Building backend project..."
    cd Backend
    dotnet restore
    dotnet build --configuration Release
    cd ..
    
    print_success "Backend build completed successfully!"
    
    # Show deployment options
    echo ""
    print_info "Backend Deployment Options:"
    echo "1. 🚂 Railway (Recommended) - $5/month"
    echo "   - Visit: https://railway.app"
    echo "   - Connect your GitHub repository"
    echo "   - Add PostgreSQL database"
    echo ""
    echo "2. 🎨 Render (Free Tier) - Free with limitations"
    echo "   - Visit: https://render.com"
    echo "   - Create Web Service from GitHub"
    echo "   - Add PostgreSQL database"
    echo ""
    echo "3. ☁️  Azure App Service (Free Tier) - Free with limitations"
    echo "   - Visit: https://portal.azure.com"
    echo "   - Create App Service (F1 Free tier)"
    echo ""
    print_warning "Remember to update CORS settings and connection strings!"
}

# Update configuration for production
update_config() {
    print_info "Updating configuration for production..."
    
    # Prompt for backend URL
    echo ""
    read -p "Enter your backend URL (e.g., https://your-app.railway.app): " BACKEND_URL
    
    if [ ! -z "$BACKEND_URL" ]; then
        # Update frontend config
        sed -i.bak "s|https://your-backend-url.railway.app|$BACKEND_URL|g" Frontend2/js/config.js
        print_success "Updated frontend configuration with backend URL: $BACKEND_URL"
    fi
    
    # Prompt for GitHub username
    echo ""
    read -p "Enter your GitHub username: " GITHUB_USERNAME
    
    if [ ! -z "$GITHUB_USERNAME" ]; then
        # Update package.json homepage
        sed -i.bak "s|yourusername|$GITHUB_USERNAME|g" Frontend2/package.json
        print_success "Updated package.json with GitHub username: $GITHUB_USERNAME"
    fi
    
    # Clean up backup files
    find . -name "*.bak" -delete 2>/dev/null || true
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1. 🌐 Deploy Frontend (GitHub Pages)"
    echo "2. 🖥️  Prepare Backend for deployment"
    echo "3. ⚙️  Update configuration"
    echo "4. 🚀 Full deployment (Frontend + Backend prep)"
    echo "5. ❌ Exit"
    echo ""
    read -p "Choose an option (1-5): " choice
    
    case $choice in
        1)
            deploy_frontend
            ;;
        2)
            prepare_backend
            ;;
        3)
            update_config
            ;;
        4)
            update_config
            prepare_backend
            deploy_frontend
            ;;
        5)
            print_info "Goodbye! 👋"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please choose 1-5."
            show_menu
            ;;
    esac
}

# Main execution
main() {
    check_git
    check_git_repo
    
    print_info "Current directory: $(pwd)"
    print_info "Git branch: $(git branch --show-current)"
    
    show_menu
}

# Run main function
main 