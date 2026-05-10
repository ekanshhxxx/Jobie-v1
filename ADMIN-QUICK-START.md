# 🔐 SECRET ADMIN ACCESS - Quick Guide

Press **`Ctrl+Shift+A`** (or **`Cmd+Shift+A`** on Mac) from **anywhere** in the app to access admin!

## 🚀 Setup (One-time)

1. **Create admin user:**
   ```bash
   # Double-click:
   E:\Projects\jobie\backend\create-admin.bat
   
   # Or run:
   cd E:\Projects\jobie\backend
   node create-admin.js
   ```

2. **Done!** The admin account is ready.

## 🎯 Usage

### Quick Access
- Press `Ctrl+Shift+A` from any page
- If not logged in → Login modal appears
- Login with: `admin@jobie.app` / `adminpassword123`
- Instant redirect to admin dashboard!

### Alternative Routes
- Normal login: http://localhost:3000/login
- Direct admin: http://localhost:3000/admin (if already logged in)

## 🔑 Default Credentials
```
Email:    admin@jobie.app
Password: adminpassword123
Role:     admin
```

## 📖 Full Documentation
See `ADMIN-SECRET-ACCESS.md` for complete details.

---

✨ **Feature**: Global keyboard shortcut for instant admin access  
🎨 **UI**: Beautiful modal with animations and smart access control  
🔒 **Security**: Role-based authentication with backend validation
