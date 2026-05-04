#!/bin/bash

echo "🚀 Starting JURY AI Chatbot Backend..."

# Use script's own directory (works on any machine)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Auto-detect virtual environment
if [ -f "../.venv/bin/activate" ]; then
  source ../.venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
fi

# Check if MongoDB is running (only if nc is available)
if command -v nc >/dev/null 2>&1; then
  if ! nc -z localhost 27017 2>/dev/null; then
      echo "⚠️  Warning: MongoDB is not running on localhost:27017"
      echo "   MongoDB integration will be disabled"
  fi
else
  echo "ℹ️  Skipping MongoDB check (netcat not available)"
fi

# Start uvicorn
echo "📡 Starting FastAPI server on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
