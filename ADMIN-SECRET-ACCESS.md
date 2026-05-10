# 🔐 Secret Admin Access - Documentation

## Overview
A secret keyboard shortcut system that allows instant access to the admin dashboard from anywhere in the application.

---

## 🎯 Features

✅ **Global Keyboard Shortcut**: Press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac) from any page
✅ **Smart Access Control**:
  - Already admin? → Direct navigation to admin dashboard
  - Logged in but not admin? → Access denied notification
  - Not logged in? → Admin login modal appears
✅ **Secure Authentication**: Only users with admin role can access
✅ **Beautiful UI**: Professional modal with animations and backdrop blur
✅ **Alternative Access**: Can also login through normal login page

---

## 🚀 Quick Start

### Step 1: Create Admin User
Run this to create the default admin account:

```bash
# Double-click this file:
E:\Projects\jobie\backend\create-admin.bat

# Or run manually:
cd E:\Projects\jobie\backend
node create-admin.js
```

**Default Credentials:**
- Email: `admin@jobie.app`
- Password: `adminpassword123`
- Role: `admin`

### Step 2: Use the Secret Shortcut

1. **From any page** (home, candidate dashboard, recruiter, etc.)
2. Press: `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)
3. If not logged in as admin, a login modal will appear
4. Enter credentials and press "Access Admin Dashboard"
5. You'll be redirected to `/admin`

---

## 📋 How It Works

### Component Architecture

**`SecretAdminAccess.tsx`** (Global component in root layout)
```
├── Keyboard Event Listener
│   └── Detects Ctrl+Shift+A / Cmd+Shift+A
├── Access Check Logic
│   ├── If admin logged in → Navigate to /admin
│   ├── If non-admin logged in → Show "Access Denied" toast
│   └── If not logged in → Show admin login modal
└── Admin Login Modal
    ├── Email + Password fields
    ├── Backend authentication via /api/auth/login
    ├── Role validation (must be admin)
    └── Auto-redirect to /admin on success
```

### Authentication Flow

1. **Keyboard shortcut pressed**
   ```javascript
   Ctrl+Shift+A → handleSecretAccess()
   ```

2. **Check current user**
   ```javascript
   const user = getUser(); // from localStorage
   if (user.role === 'admin') → go to /admin
   else if (user) → show "Access Denied"
   else → show login modal
   ```

3. **Login authentication**
   ```javascript
   POST /api/auth/login
   → Check role === 'admin'
   → Store token + user in localStorage
   → Navigate to /admin
   → Reload page to update navbar
   ```

---

## 🎨 UI/UX Features

### Access Denied Toast
```
🚫 Access Denied
   Admin privileges required
```
- Red theme with blur backdrop
- Auto-dismisses after 3 seconds
- Slides in from right

### Admin Login Modal
```
🔐 Admin Access
   Enter admin credentials
   
   [Email input]
   [Password input]
   
   [Access Admin Dashboard button]
   
   💡 Default: admin@jobie.app / adminpassword123
   Shortcut: Ctrl+Shift+A
```
- Dark theme matching app design
- Click outside to close
- Smooth animations (fade in, scale)
- Auto-focus on email field

---

## 🔧 Configuration

### Change Admin Credentials

**Option 1: Create custom admin via script**
Edit `backend/create-admin.js`:
```javascript
const admin = await User.create({
  name: 'Your Name',
  email: 'youradmin@example.com',
  password: hashedPassword, // will hash 'admin123' or your choice
  role: 'admin',
});
```

**Option 2: Update existing user to admin**
Connect to MySQL and run:
```sql
UPDATE Users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Option 3: Via admin panel**
Once logged in as admin, you can manage user roles from `/admin`

### Change Keyboard Shortcut

Edit `frontend/components/SecretAdminAccess.tsx`:
```typescript
// Line ~26 - Change the key combination
if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
  // Change 'a' to any other key like 's', 'm', etc.
}
```

Example alternatives:
- `Ctrl+Shift+M` → Change `'a'` to `'m'`
- `Ctrl+Alt+A` → Change `e.shiftKey` to `e.altKey`
- `Ctrl+Shift+Space` → Change `'a'` to `' '`

---

## 📁 File Structure

```
frontend/
├── components/
│   └── SecretAdminAccess.tsx      # Main component (keyboard listener + modal)
├── app/
│   ├── layout.tsx                  # Imports SecretAdminAccess globally
│   ├── admin/
│   │   └── page.tsx                # Admin dashboard (protected route)
│   └── lib/
│       └── api.ts                  # Auth utilities (getUser, setAuth, etc.)

backend/
├── create-admin.js                 # Script to create admin user
├── create-admin.bat                # Windows batch wrapper
└── src/
    ├── models/
    │   └── User.ts                 # User model with role enum
    └── controllers/
        └── authController.ts       # Login endpoint
```

---

## 🔒 Security Features

✅ **Role-based access control**: Only users with `role: 'admin'` can access
✅ **Backend validation**: Admin role checked on login endpoint
✅ **Frontend protection**: Admin dashboard checks role before rendering
✅ **Secure password storage**: Bcrypt hashing with 10 salt rounds
✅ **JWT authentication**: Token-based auth with localStorage
✅ **No hardcoded credentials**: Admin user stored in database only

---

## 🐛 Troubleshooting

### "Access Denied: Admin privileges required"
- Your account doesn't have admin role
- Solution: Run `create-admin.js` or update your user role in database

### Modal doesn't appear
- Check browser console for errors
- Ensure `SecretAdminAccess` is imported in `layout.tsx`
- Try refreshing the page

### Login fails
- Check backend is running on port 5000
- Verify credentials: `admin@jobie.app` / `adminpassword123`
- Check backend logs for authentication errors

### Keyboard shortcut doesn't work
- Ensure no other extension/app is using the same shortcut
- Try different browser
- Check browser console for JavaScript errors

---

## 💡 Usage Tips

1. **Quick Admin Switch**: If managing multiple accounts, use the shortcut to quickly switch to admin
2. **Demo Mode**: Show admin features to clients by pressing the secret combo
3. **Emergency Access**: If navbar/UI breaks, you can still access admin via shortcut
4. **Multi-tab Support**: Works across all tabs of your app
5. **Persistent Login**: Once logged in as admin, shortcut directly navigates without modal

---

## 🎯 Alternative Access Methods

### Method 1: Secret Shortcut (Fastest)
```
Ctrl+Shift+A → Login modal → Admin dashboard
```

### Method 2: Normal Login Page
```
http://localhost:3000/login
→ Login with admin@jobie.app
→ Navigate to /admin from navbar or directly
```

### Method 3: Direct URL (if already logged in)
```
http://localhost:3000/admin
```

---

## 📊 Component Props & API

### SecretAdminAccess Component
```typescript
// No props - fully self-contained
<SecretAdminAccess />
```

### Authentication API
```typescript
// Get current user
const user = getUser(); // { id, name, email, role }

// Check if admin
if (user?.role === 'admin') { /* admin logic */ }

// Login endpoint
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }
```

---

## ✨ Future Enhancements

- [ ] Customizable shortcut via settings page
- [ ] Multi-factor authentication for admin
- [ ] Admin session timeout
- [ ] Audit log for admin access
- [ ] Dark/light theme toggle for modal
- [ ] Biometric authentication support

---

**Created**: 2026-04-01  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
