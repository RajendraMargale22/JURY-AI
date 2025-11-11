# Quick Start Guide - Authentication

## Summary of Changes

A complete authentication system has been added to Jury AI with the following components:

### Backend Changes

1. **authController.ts** - Added 5 new endpoints:
   - `register` - User registration
   - `login` - User login with JWT token generation
   - `logout` - User logout
   - `getProfile` - Get authenticated user profile (updated)
   - `updateProfile` - Update user profile (updated)

2. **auth.ts routes** - Updated to include:
   - `POST /api/auth/register` - Public registration endpoint
   - `POST /api/auth/login` - Public login endpoint
   - `POST /api/auth/logout` - Public logout endpoint
   - `GET /api/auth/profile` - Protected profile endpoint
   - `PUT /api/auth/profile` - Protected profile update endpoint

3. **User.ts model** - Already has:
   - Password hashing with bcrypt
   - `comparePassword` method for authentication
   - Proper field validation

4. **interfaces.ts** - Added `comparePassword` method to IUser interface

### Frontend Changes

1. **LoginPage.tsx** - New login page with:
   - Email and password fields
   - Remember me option
   - Forgot password link
   - Social login placeholders
   - Link to registration

2. **RegisterPage.tsx** - New registration page with:
   - Full name, email, password fields
   - Password confirmation
   - Role selection (user/lawyer)
   - Terms and conditions checkbox
   - Social registration placeholders
   - Link to login

3. **AuthPage.css** - Styling for authentication pages with:
   - Modern gradient design
   - Smooth animations
   - Responsive layout
   - Form validation styles

4. **AuthContext.tsx** - Enhanced with:
   - `login` function
   - `register` function
   - Token management in localStorage
   - Axios interceptor for automatic token injection
   - Proper authentication state management

5. **App.tsx** - Added new routes:
   - `/login` - Login page route
   - `/register` - Registration page route

## How to Start

### 1. Backend Setup

```bash
cd jury-ai-app/backend

# Install dependencies (if not already done)
npm install

# Make sure MongoDB is running
# Check your .env file has these variables:
# MONGODB_URI=mongodb://localhost:27017/jury-ai
# JWT_SECRET=your-secret-key
# PORT=5000
# CLIENT_URL=http://localhost:3000

# Build and start the backend
npm run build
npm start

# Or use dev mode
npm run dev
```

### 2. Frontend Setup

```bash
cd jury-ai-app/frontend

# Install dependencies (if not already done)
npm install

# Make sure you have .env with:
# REACT_APP_API_URL=http://localhost:5000/api

# Start the frontend
npm start
```

### 3. Test the Authentication

1. Open browser at `http://localhost:3000`
2. Click "Register" or "Sign Up"
3. Fill in the registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Role: User
   - Check terms and conditions
4. Click "Create Account"
5. You should be logged in and redirected to the chat page

### 4. Create an Admin User (Optional)

You can create an admin user using the existing script:

```bash
cd jury-ai-app/backend
npm run seed:admin
```

Or manually via MongoDB:

```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@juryai.com",
  password: "$2a$10$...", // Use bcrypt to hash password
  role: "admin",
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Testing the API

### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Features Included

✅ User Registration with validation
✅ User Login with JWT authentication
✅ Password hashing with bcrypt
✅ Token-based authentication
✅ Protected routes (backend & frontend)
✅ Role-based access control
✅ Profile management
✅ Logout functionality
✅ Modern, responsive UI
✅ Form validation
✅ Error handling
✅ Loading states
✅ Toast notifications

## What's Next?

Optional enhancements you can add:
- Email verification
- Password reset functionality
- OAuth integration (Google, Facebook)
- Two-factor authentication
- Remember me functionality
- Session management
- Login history

## Troubleshooting

### Cannot connect to backend
- Make sure backend is running on port 5000
- Check CORS settings in backend
- Verify REACT_APP_API_URL in frontend .env

### Registration fails
- Check MongoDB is running
- Verify MONGODB_URI in backend .env
- Check console for validation errors

### Token not working
- Verify JWT_SECRET is set in backend .env
- Check browser localStorage for token
- Make sure axios interceptor is configured

### Redirect issues
- Check routes in App.tsx
- Verify ProtectedRoute component
- Check user role permissions

## Files Modified/Created

### Backend
- ✏️ `controllers/authController.ts` - Completely rewritten
- ✏️ `routes/auth.ts` - Updated routes
- ✏️ `types/interfaces.ts` - Added comparePassword method
- ✅ `middleware/auth.ts` - Already existed, works as-is
- ✅ `models/User.ts` - Already had all necessary features

### Frontend
- ➕ `pages/LoginPage.tsx` - New
- ➕ `pages/RegisterPage.tsx` - New
- ➕ `pages/AuthPage.css` - New
- ✏️ `contexts/AuthContext.tsx` - Enhanced with login/register
- ✏️ `App.tsx` - Added auth routes

### Documentation
- ➕ `AUTHENTICATION_GUIDE.md` - Complete guide
- ➕ `QUICK_START_AUTH.md` - This file

Legend:
- ➕ New file
- ✏️ Modified file
- ✅ Existing file (no changes needed)
