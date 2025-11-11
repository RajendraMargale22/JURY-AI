#!/bin/bash

echo "🚀 Starting Jury AI Application Setup..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /tmp/jury-ai-logs

# Set environment variables for development
export NODE_ENV=development
export PORT=5000
export FRONTEND_URL=http://localhost:3000
export JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_123456789
export SESSION_SECRET=your_super_secret_session_key_here_make_it_long_and_random_987654321
export EMAIL_HOST=smtp.gmail.com
export EMAIL_PORT=587
export EMAIL_USER=your_email@gmail.com
export EMAIL_PASS=your_app_password_123456

# For development, we'll use a simple file-based mock database instead of MongoDB
echo "🔧 Setting up mock database..."

# Start the backend server
echo "⚡ Starting backend server..."
cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/backend

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Build the backend
echo "🔨 Building backend..."
npm run build

# Start backend in the background
npm run dev:mock &
BACKEND_PID=$!

echo "🌐 Backend server started with PID: $BACKEND_PID (Mock Mode)"

# Start the frontend server
echo "⚡ Starting frontend server..."
cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/frontend

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in the background
PORT=3000 npm start &
FRONTEND_PID=$!

echo "🌐 Frontend server started with PID: $FRONTEND_PID"

echo "✅ Jury AI Application is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "Demo Credentials:"
echo "👤 Admin: username=admin, password=password"
echo "👤 User: username=demo_user, password=password"
echo "👤 Lawyer: username=demo_lawyer, password=password"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal trap
trap cleanup SIGINT SIGTERM

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
