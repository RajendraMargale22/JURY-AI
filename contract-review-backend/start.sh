#!/bin/bash

set -e

echo "🚀 Starting JURY AI Contract Review Backend..."

# Use script's own directory to find the project (works on any machine)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if command -v lsof >/dev/null 2>&1; then
  EXISTING_PID=$(lsof -t -i:8001 -sTCP:LISTEN 2>/dev/null | head -n 1 || true)
  if [ -n "$EXISTING_PID" ]; then
    echo "⚠️ Port 8001 is already in use by PID $EXISTING_PID"
    echo "👉 Stop it with: kill -9 $EXISTING_PID"
    echo "👉 Or run: lsof -i :8001"
    exit 1
  fi
fi

# Auto-detect virtual environment
if [ -f "../.venv/bin/activate" ]; then
  source ../.venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
fi

echo "📡 Starting FastAPI server on http://localhost:8001"

HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8001}
WEB_CONCURRENCY=${WEB_CONCURRENCY:-2}
DEV_RELOAD=${DEV_RELOAD:-false}

if [ "$DEV_RELOAD" = "true" ]; then
  echo "🛠️ DEV_RELOAD=true -> starting with autoreload"
  uvicorn main:app --host "$HOST" --port "$PORT" --reload
else
  uvicorn main:app --host "$HOST" --port "$PORT" --workers "$WEB_CONCURRENCY"
fi
