#!/bin/bash

echo "🚀 Starting JURY AI Chatbot Backend..."

cd /home/aditya/Downloads/JURY-AI-main/chatbot-backend

# Activate virtual environment
source venv/bin/activate

# Check if MongoDB is running
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  Warning: MongoDB is not running on localhost:27017"
    echo "   MongoDB integration will be disabled"
fi

# Start uvicorn
echo "📡 Starting FastAPI server on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
