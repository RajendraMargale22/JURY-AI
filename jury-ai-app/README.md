# Jury AI - Legal Assistant Application

A modern full-stack legal assistant platform built with React, Node.js, Express, TypeScript, and MongoDB (with mock database support for development).

## 🌟 Features

### Core Features
- ✅ **AI-Powered Legal Chatbot** - Interactive chat interface for legal consultations
- ✅ **User Authentication** - Secure JWT-based authentication with role-based access control
- ✅ **Community Forum** - Discussion board for legal questions and knowledge sharing
- ✅ **Legal Document Templates** - Library of customizable legal document templates
- ✅ **Lawyer Verification System** - Admin-managed lawyer verification workflow
- ✅ **Document Analysis** - Upload and analyze legal documents (Coming Soon)
- ✅ **Real-time Chat** - Connect with verified lawyers (Coming Soon)

### Admin Dashboard
- 📊 **Dashboard Overview** - Real-time statistics and analytics
- 👥 **User Management** - Manage users, roles, and permissions
- ⚖️ **Lawyer Verification** - Review and approve lawyer applications
- 🌐 **Community Moderation** - Monitor and moderate community posts
- 📄 **Template Management** - Create, edit, and manage legal templates
- ⚙️ **System Settings** - Configure application settings and preferences

### User Roles
- **User** - Access to chat, community, and templates
- **Lawyer** - All user features + ability to create templates and offer consultations
- **Admin** - Full system access including user management and moderation

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (optional - mock database included for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jury-ai-app
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Backend .env file (already configured)
   cd backend
   # The .env file is already set up with development defaults
   ```

4. **Start the application**
   ```bash
   # From the jury-ai-app directory
   chmod +x start-app.sh
   ./start-app.sh
   ```

The application will start with:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

## 🔐 Demo Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `password`
- **Features**: Full system access

### Demo User Account
- **Username**: `demo_user`
- **Password**: `password`
- **Features**: Chat, Community, Templates

### Demo Lawyer Account
- **Username**: `demo_lawyer`
- **Password**: `password`
- **Features**: User features + Template creation

## 📁 Project Structure

```
jury-ai-app/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── server.ts       # Main server (MongoDB)
│   │   ├── serverMock.ts   # Mock server (in-memory DB)
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth & error handling
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Helper functions & mock DB
│   ├── uploads/            # File upload directory
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── pages/         # Page components
│   │   │   ├── admin/    # Admin dashboard pages
│   │   │   ├── ChatPage.tsx
│   │   │   ├── CommunityPage.tsx
│   │   │   ├── TemplatesPage.tsx
│   │   │   └── ...
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # Entry point
│   └── package.json
│
└── start-app.sh           # Application startup script
```

## 🛠️ Development

### Running in Development Mode

**With Mock Database (Recommended for testing)**:
```bash
# Backend
cd backend
npm run dev:mock

# Frontend (in separate terminal)
cd frontend
npm start
```

**With MongoDB**:
```bash
# Ensure MongoDB is running
sudo systemctl start mongod

# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

### Building for Production

```bash
# Build backend
cd backend
npm run build
npm start

# Build frontend
cd frontend
npm run build
# Serve the build folder with a static server
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/lawyers` - List lawyers
- `PUT /api/admin/lawyers/:id/verify` - Verify lawyer
- `GET /api/admin/community` - List community posts
- `GET /api/admin/templates` - List templates
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings

### Chat
- `GET /api/chat/history` - Get chat history
- `POST /api/chat` - Send message to AI
- `GET /api/chat/:id` - Get specific chat
- `DELETE /api/chat/:id` - Delete chat

### Community
- `GET /api/community` - List community posts
- `POST /api/community` - Create new post
- `GET /api/community/:id` - Get specific post
- `POST /api/community/:id/like` - Like/unlike post
- `POST /api/community/:id/reply` - Add reply to post
- `PUT /api/community/:id` - Update post
- `DELETE /api/community/:id` - Delete post

### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates/:id/download` - Download template
- `POST /api/templates/:id/generate` - Generate document from template
- `POST /api/templates` - Create new template (lawyer/admin only)
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

## 🎨 Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **React Router** - Routing
- **Bootstrap 5** - UI framework
- **Axios** - HTTP client
- **Context API** - State management

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB/Mongoose** - Database (optional)
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email service

## 🔒 Security Features

- HTTP-only cookies for JWT tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet.js for security headers
- Input validation and sanitization
- Role-based access control

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@juryai.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Document analysis with AI
- [ ] Real-time lawyer consultation
- [ ] Payment integration
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] Two-factor authentication

## ⚠️ Note

This application is currently using a mock in-memory database for development and demonstration purposes. For production use, configure MongoDB connection in the `.env` file and use the regular server (`npm run dev` instead of `npm run dev:mock`).

---

**Built with ❤️ for the legal community**
