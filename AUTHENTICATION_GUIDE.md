# Authentication System Documentation

## Overview

A complete authentication system has been added to Jury AI with login and registration functionality.

## Features

### Backend (Express/TypeScript)
- **User Registration**: Create new accounts with name, email, password, and role
- **User Login**: Authenticate users with email and password
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Middleware to protect routes requiring authentication
- **Password Hashing**: Secure password storage using bcrypt
- **Role-based Access**: Support for user, lawyer, and admin roles
- **Profile Management**: View and update user profiles

### Frontend (React/TypeScript)
- **Login Page**: Clean, modern login interface
- **Registration Page**: User-friendly registration form with validation
- **Auth Context**: Global authentication state management
- **Protected Routes**: Automatic redirection for unauthorized access
- **Token Management**: Automatic token refresh and storage
- **Social Login UI**: Placeholder for Google/Facebook login (to be implemented)

## API Endpoints

### Public Routes
- `POST /api/auth/register` - Register a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/logout` - Logout user

### Protected Routes (Require Authentication)
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
  ```json
  {
    "name": "John Updated",
    "phone": "+1234567890",
    "bio": "Bio text",
    "address": "123 Main St"
  }
  ```

## Frontend Routes

- `/login` - Login page
- `/register` - Registration page
- `/` - Home page (with login/register buttons)
- `/chat` - Chat page (redirects if not authenticated)
- `/admin/*` - Admin dashboard (requires admin role)

## Usage

### Registration Flow
1. User visits `/register`
2. Fills out registration form (name, email, password, role)
3. On success, receives JWT token and is logged in automatically
4. Redirected to `/chat` or `/admin` based on role

### Login Flow
1. User visits `/login`
2. Enters email and password
3. On success, receives JWT token
4. Token stored in localStorage and cookies
5. Redirected to appropriate page based on role

### Authentication State
The `AuthContext` provides:
- `isAuthenticated` - Boolean indicating if user is logged in
- `isLoading` - Boolean for loading state
- `user` - Current user object
- `login(email, password)` - Login function
- `register(name, email, password, role)` - Registration function
- `logout()` - Logout function
- `updateUser(userData)` - Update user data function

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
2. **JWT Tokens**: Secure, signed tokens with 7-day expiration
3. **HTTP-Only Cookies**: Tokens stored in HTTP-only cookies (when available)
4. **Authorization Headers**: Bearer token authentication
5. **Input Validation**: Server-side validation of all inputs
6. **Account Status**: Ability to deactivate accounts
7. **Role-Based Access Control**: Different permissions for users, lawyers, and admins

## Environment Variables

Required in `backend/.env`:
```env
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/jury-ai
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

## Testing

### Create a Test User
```bash
# Using curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## Next Steps (Optional Enhancements)

1. **Email Verification**: Send verification emails on registration
2. **Password Reset**: Forgot password functionality
3. **Two-Factor Authentication**: Add 2FA support
4. **OAuth Integration**: Implement Google/Facebook login
5. **Session Management**: Advanced session handling
6. **Account Recovery**: Email-based account recovery
7. **Login History**: Track user login attempts and history
8. **Rate Limiting**: Prevent brute force attacks (already partially implemented)

## File Structure

### Backend
```
backend/src/
├── controllers/
│   └── authController.ts      # Authentication logic
├── routes/
│   └── auth.ts                # Auth routes
├── middleware/
│   └── auth.ts                # Auth middleware
├── models/
│   └── User.ts                # User model
└── types/
    └── interfaces.ts          # TypeScript interfaces
```

### Frontend
```
frontend/src/
├── pages/
│   ├── LoginPage.tsx          # Login page
│   ├── RegisterPage.tsx       # Registration page
│   └── AuthPage.css           # Auth pages styling
├── contexts/
│   └── AuthContext.tsx        # Auth context provider
└── components/
    └── ProtectedRoute.tsx     # Protected route wrapper
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CLIENT_URL` is set correctly in backend `.env`
   - Check that `withCredentials: true` is set in axios

2. **Token Not Persisting**
   - Check localStorage in browser DevTools
   - Verify axios interceptor is adding token to requests

3. **Unauthorized Errors**
   - Ensure token is being sent with requests
   - Check token hasn't expired
   - Verify JWT_SECRET matches on server

4. **Registration Fails**
   - Check MongoDB connection
   - Verify email is unique
   - Ensure password meets minimum length (6 characters)

## Support

For issues or questions, please check the main project documentation or create an issue in the repository.
