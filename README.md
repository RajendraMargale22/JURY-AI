# JURY-AI Legal Assistant Platform

A comprehensive AI-powered legal assistance platform built with React, Node.js, FastAPI, and MongoDB. This platform provides users with AI-powered legal advice, document analysis, template management, and lawyer consultation services.

![Platform](https://img.shields.io/badge/Platform-Legal%20Tech-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active%20Development-yellow)

## 🌟 Features

### 🤖 AI-Powered Legal Assistant
- Natural language query processing using Google Gemini AI
- Vector-based document search with Pinecone
- Context-aware legal advice with confidence scoring
- Query history and analytics

### 📄 Document Management
- Upload and analyze legal documents
- AI-powered document analysis with risk assessment
- Key point extraction and suggestions
- Support for multiple document formats (PDF, DOCX, etc.)

### 📋 Template System
- Pre-built legal document templates
- Category-based organization (Contracts, Agreements, Legal Forms, etc.)
- Dynamic field filling
- Template upload and management (Admin)
- Download tracking

### 👥 Multi-Role System
- **User**: Access AI chat, upload documents, browse templates
- **Lawyer**: Provide consultations, manage profile, verify credentials
- **Admin**: User management, lawyer verification, system configuration

### 💬 Chat System
- AI chat for legal queries
- Direct lawyer consultation
- Message history with attachments
- Real-time communication (Socket.io ready)

### 📊 Analytics & Monitoring
- Query tracking and analytics
- User behavior monitoring
- System health checks
- Performance metrics

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (React)                      │
│                        Port: 3000                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (Express.js Backend)                │
│                        Port: 5000                            │
│  ┌─────────────┬──────────────┬───────────┬──────────────┐ │
│  │ Auth Routes │ Chat Routes  │ Templates │ Admin Routes │ │
│  └─────────────┴──────────────┴───────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   MongoDB Database       │  │  AI Service (FastAPI)        │
│   - Users                │  │  Port: 8000                  │
│   - Lawyers              │  │  - Google Gemini AI          │
│   - Templates            │  │  - Pinecone Vector DB        │
│   - Documents            │  │  - HuggingFace Embeddings    │
│   - Chats                │  │  - LangChain                 │
│   - Legal Queries        │  └──────────────────────────────┘
│   - Analytics            │
└──────────────────────────┘
```

### Tech Stack

#### Frontend
- **Framework**: React.js with TypeScript
- **State Management**: React Context API
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: CSS/Styled Components

#### Backend (Express)
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Database**: MongoDB with Mongoose
- **WebSocket**: Socket.io

#### Backend (FastAPI - AI Service)
- **Framework**: FastAPI (Python 3.8+)
- **LLM**: Google Gemini AI
- **Embeddings**: HuggingFace Models
- **Vector Store**: Pinecone
- **Document Processing**: LangChain, PyPDF

#### Database & Storage
- **Database**: MongoDB
- **Vector DB**: Pinecone
- **File Storage**: Local file system

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- MongoDB
- API Keys: Google Gemini, Pinecone

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/JURY-AI-main.git
   cd JURY-AI-main
   ```

2. **Setup MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   
   # Run setup script
   node setup-mongodb.js
   ```

3. **Setup Backend (Express)**
   ```bash
   cd jury-ai-app/backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your credentials
   
   # Build TypeScript
   npm run build
   
   # Start server
   npm start
   ```

4. **Setup AI Service (FastAPI)**
   ```bash
   cd chatbot-backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create .env file with:
   # GOOGLE_API_KEY=your_gemini_key
   # PINECONE_API_KEY=your_pinecone_key
   # PINECONE_ENVIRONMENT=your_environment
   # PINECONE_INDEX_NAME=your_index
   # MONGODB_URI=your_mongodb_uri
   
   # Start service
   ./start.sh
   ```

5. **Setup Frontend**
   ```bash
   cd jury-ai-app/frontend
   npm install
   
   # Start development server
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:8000

### Quick Setup with Scripts

```bash
# Setup authentication
./setup-auth.sh

# Start all services
cd jury-ai-app
./start-app.sh
```

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/jury-ai
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

### Chatbot Backend (.env)
```env
GOOGLE_API_KEY=your_google_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=legal-docs
MONGODB_URI=mongodb://localhost:27017/jury-ai
```

## 📚 Documentation

- [System Diagrams](./SYSTEM_DIAGRAMS.md) - UML, ERD, Architecture, DFD, Flowcharts
- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Template System](./TEMPLATE_SYSTEM_ARCHITECTURE.md)
- [MongoDB Setup](./MONGODB_COMPLETE_SETUP.md)
- [Quick Start](./HOW_TO_START.md)
- [Performance Optimizations](./PERFORMANCE_OPTIMIZATIONS.md)
- [Secret Rotation Runbook](./SECRET_ROTATION_RUNBOOK.md)

## 🔗 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile

### Templates (`/api/templates`)
- `GET /` - List all templates
- `GET /:id` - Get template details
- `GET /:id/download` - Download template
- `POST /` - Create template (Admin)
- `PUT /:id` - Update template (Admin)
- `DELETE /:id` - Delete template (Admin)

### AI Chat (`/ask`)
- `POST /` - Ask legal question
- `POST /feedback` - Submit feedback
- `GET /history/:userId` - Get query history
- `GET /analytics` - Get analytics summary

### Admin (`/api/admin`)
- `GET /users` - List all users
- `GET /lawyers` - List lawyers
- `PUT /lawyers/:id/verify` - Verify lawyer
- `GET /stats` - System statistics

## 🛡️ Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcrypt
- Rate limiting per IP
- CORS configuration
- Helmet security headers
- Input validation
- File upload security
- Role-based access control

### Pre-commit secret scanning

This repo includes:
- `.pre-commit-config.yaml`
- `.gitleaks.toml`

Setup once:

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

This blocks commits that contain detected secrets.

## 🎯 Key Features Implementation

### AI Query Processing
```python
# Vector search with Pinecone
embedded_query = embed_model.embed_query(question)
results = index.query(vector=embedded_query, top_k=5)

# LLM processing with Gemini
chain = get_llm_chain(retriever)
response = query_chain(chain, question)
```

### Document Analysis
- Upload PDF/DOCX documents
- Extract text and analyze content
- Identify document type and key points
- Assess risk level (low/medium/high)
- Generate suggestions and summary

### Template Management
- Browse by category
- Dynamic field filling
- Download with custom values
- Admin upload and management

## 📊 Database Schema

See [SYSTEM_DIAGRAMS.md](./SYSTEM_DIAGRAMS.md) for complete ERD and data models.

### Main Collections
- **Users**: User accounts and profiles
- **Lawyers**: Lawyer-specific information
- **Templates**: Legal document templates
- **Documents**: Uploaded documents and analysis
- **Chats**: Chat conversations and messages
- **LegalQueries**: AI query history
- **Analytics**: System analytics and tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Aditya - Initial work

## 🙏 Acknowledgments

- Google Gemini AI for language model
- Pinecone for vector database
- LangChain for AI orchestration
- MongoDB for database
- React and Express communities

## 📞 Support

For support, email support@juryai.com or join our Slack channel.

## 🚀 Roadmap

- [ ] Real-time collaboration features
- [ ] Video consultation integration
- [ ] Payment gateway for consultations
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Multi-language support
- [ ] Document comparison tool
- [ ] Case law database integration

---

**Built with ❤️ for making legal services accessible to everyone**
