# 🚀 Deployment Guide - Azul Game Application

## Overview
This guide covers deploying your full-stack Azul game application using free hosting services.

## 📋 Architecture
- **Frontend**: Vanilla JavaScript/HTML (Static hosting)
- **Backend**: ASP.NET Core API (Server hosting)
- **Database**: SQL Server/PostgreSQL

---

## 🌐 Frontend Deployment (GitHub Pages)

### Prerequisites
- GitHub repository
- GitHub account

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow is already configured in `.github/workflows/deploy-frontend.yml`

### Step 2: Update Configuration
1. Edit `Frontend2/package.json`
2. Replace `yourusername` in the homepage URL:
   ```json
   "homepage": "https://YOUR_GITHUB_USERNAME.github.io/project-2425-azul-azul04"
   ```

### Step 3: Deploy
1. Push changes to your main branch
2. GitHub Actions will automatically deploy to: `https://YOUR_USERNAME.github.io/project-2425-azul-azul04/`

### Alternative: Manual GitHub Pages
If you prefer manual deployment:
1. Go to **Settings** → **Pages**
2. Select **Deploy from a branch**
3. Choose **main** branch and **/ (root)** folder
4. Your site will be available at the GitHub Pages URL

---

## 🖥️ Backend Deployment Options

### Option A: Railway (Recommended) 💰 $5/month
**Best for production apps with database needs**

#### Setup Steps:
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add PostgreSQL database service
4. Configure environment variables:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   ConnectionStrings__DefaultConnection=<Railway_PostgreSQL_URL>
   JWT__SecretKey=<your-secret-key>
   JWT__Issuer=https://your-app.railway.app
   JWT__Audience=https://your-app.railway.app
   ```

#### Database Migration:
```bash
# Update connection string in appsettings.json
# Run migrations
dotnet ef database update --project Azul.Infrastructure
```

### Option B: Render (Free Tier) 🆓
**Best for testing and development**

#### Setup Steps:
1. Create account at [render.com](https://render.com)
2. Create new **Web Service**
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `dotnet publish -c Release -o out`
   - **Start Command**: `dotnet out/Azul.Api.dll`
   - **Environment**: `ASPNETCORE_ENVIRONMENT=Production`

#### Database Setup:
1. Create **PostgreSQL** service on Render
2. Add connection string to environment variables

### Option C: Azure App Service (Free Tier) 🆓
**Best for .NET applications**

#### Setup Steps:
1. Create Azure account (free tier)
2. Create **App Service** (F1 Free tier)
3. Deploy via:
   - Visual Studio publish
   - GitHub Actions
   - Azure CLI

---

## 🗄️ Database Migration Guide

### From SQL Server to PostgreSQL

#### 1. Install PostgreSQL Provider
```bash
cd Backend
dotnet add Azul.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL
```

#### 2. Update Connection String
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=azul_game;Username=postgres;Password=yourpassword"
  }
}
```

#### 3. Update DbContext Configuration
```csharp
// In Azul.Infrastructure/Data/ApplicationDbContext.cs
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    if (!optionsBuilder.IsConfigured)
    {
        optionsBuilder.UseNpgsql(connectionString);
    }
}
```

#### 4. Generate New Migration
```bash
dotnet ef migrations add InitialPostgreSQL --project Azul.Infrastructure
dotnet ef database update --project Azul.Infrastructure
```

---

## 🔧 Configuration Updates

### Frontend API Configuration
Update your frontend JavaScript files to point to the deployed backend:

```javascript
// In Frontend2/js/config.js (create this file)
const API_CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-url.railway.app/api'
        : 'https://localhost:5051/api'
};

// Update all fetch calls to use API_CONFIG.BASE_URL
```

### CORS Configuration
Update your backend CORS settings:

```csharp
// In Azul.Api/Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://yourusername.github.io",
            "http://localhost:8081"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});
```

---

## 🚀 Quick Deployment Checklist

### Frontend (GitHub Pages)
- [ ] Repository is public
- [ ] GitHub Pages enabled
- [ ] Workflow file committed
- [ ] Homepage URL updated in package.json
- [ ] API endpoints updated for production

### Backend (Railway/Render)
- [ ] Account created
- [ ] Repository connected
- [ ] Environment variables configured
- [ ] Database service added
- [ ] CORS configured for frontend domain
- [ ] SSL/HTTPS enabled

### Database
- [ ] PostgreSQL service created
- [ ] Connection string updated
- [ ] Migrations applied
- [ ] Test data seeded (optional)

---

## 🔍 Testing Your Deployment

### Frontend Testing
1. Visit your GitHub Pages URL
2. Check browser console for errors
3. Test user registration/login
4. Verify API calls work

### Backend Testing
1. Test API endpoints directly
2. Check database connections
3. Verify JWT authentication
4. Test CORS with frontend

### Integration Testing
1. Full user flow from frontend to backend
2. Game creation and joining
3. Real-time features (if applicable)

---

## 💡 Cost Breakdown

### Free Options
- **Frontend**: GitHub Pages (Free)
- **Backend**: Render Free Tier (Limited)
- **Database**: Render PostgreSQL (90 days free)
- **Total**: $0 (temporary)

### Paid Options (Recommended for Production)
- **Frontend**: GitHub Pages (Free)
- **Backend**: Railway ($5/month)
- **Database**: Included with Railway
- **Total**: $5/month

---

## 🆘 Troubleshooting

### Common Issues
1. **CORS Errors**: Update CORS policy in backend
2. **404 on GitHub Pages**: Check file paths and routing
3. **Database Connection**: Verify connection string format
4. **JWT Issues**: Check secret key and issuer/audience settings

### Debug Commands
```bash
# Check backend logs
dotnet run --project Azul.Api

# Test API endpoints
curl https://your-backend-url.railway.app/api/health

# Check frontend in browser
# Open Developer Tools → Console
```

---

## 📞 Support
If you encounter issues:
1. Check the logs in your hosting platform
2. Verify environment variables
3. Test locally first
4. Check CORS and authentication settings

**Happy Deploying! 🎉** 