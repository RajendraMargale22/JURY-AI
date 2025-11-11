# 🚀 How to Start JURY AI Application

## ❌ Error You're Seeing:
```
POST http://localhost:8000/ask/ net::ERR_CONNECTION_REFUSED
```

**This means:** The Python chatbot backend (FastAPI) is not running on port 8000.

---

## ✅ Solution: Start All Services

You need to start **3 services** in **3 separate terminal windows**:

### **Terminal 1: Python Chatbot Backend (Port 8000)**

```bash
cd /home/aditya/Downloads/JURY-AI-main/chatbot-backend
./start.sh
```

**OR manually:**
```bash
cd /home/aditya/Downloads/JURY-AI-main/chatbot-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

### **Terminal 2: Node.js Backend (Port 5000)**

```bash
cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/backend
npm start
```

**You should see:**
```
🚀 Server running on port 5000
📱 Environment: development
✅ MongoDB Connected: localhost
```

---

### **Terminal 3: React Frontend (Port 3000)**

```bash
cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/frontend
npm start
```

**You should see:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## 🧪 Testing Each Service

### Test Python Backend (Port 8000):
```bash
curl http://localhost:8000/health/
```

**Expected response:**
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "mongodb_enabled": true
}
```

### Test Node.js Backend (Port 5000):
```bash
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-01T...",
  "environment": "development"
}
```

### Test Frontend (Port 3000):
Open browser: http://localhost:3000

---

## 🐛 Troubleshooting

### Problem: "Port already in use"

**For port 8000:**
```bash
lsof -i :8000
kill -9 <PID>
```

**For port 5000:**
```bash
lsof -i :5000
kill -9 <PID>
```

**For port 3000:**
```bash
lsof -i :3000
kill -9 <PID>
```

---

### Problem: "MongoDB not running"

```bash
# Start MongoDB
sudo systemctl start mongod

# Check status
sudo systemctl status mongod

# If not installed
sudo apt install mongodb
```

---

### Problem: Python backend shows errors

**Check logger.py is fixed:**
```bash
cd /home/aditya/Downloads/JURY-AI-main/chatbot-backend
cat logger.py
```

Should have:
```python
import logging
from loguru import logger as loguru_logger
# ... rest of file
logger = loguru_logger
```

---

### Problem: "Module not found"

**Install Python dependencies:**
```bash
cd /home/aditya/Downloads/JURY-AI-main/chatbot-backend
source venv/bin/activate
pip install -r requirements.txt
```

**Install Node.js dependencies:**
```bash
cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/backend
npm install

cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/frontend
npm install
```

---

## 📋 Quick Start Checklist

- [ ] MongoDB is running: `sudo systemctl start mongod`
- [ ] Terminal 1: Python backend started on port 8000
- [ ] Terminal 2: Node.js backend started on port 5000  
- [ ] Terminal 3: React frontend started on port 3000
- [ ] Test Python backend: `curl http://localhost:8000/health/`
- [ ] Test Node backend: `curl http://localhost:5000/api/health`
- [ ] Open browser: http://localhost:3000
- [ ] Try asking a question in the chat

---

## 🎯 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | User interface |
| Node.js API | http://localhost:5000 | Main backend |
| Python AI | http://localhost:8000 | Chatbot AI |
| FastAPI Docs | http://localhost:8000/docs | API documentation |
| MongoDB Compass | mongodb://localhost:27017 | Database GUI |

---

## 💡 Tips

1. **Keep all 3 terminals open** - Don't close them
2. **MongoDB must be running** before starting backends
3. **Wait for each service to start** before testing
4. **Check logs** if something fails
5. **Use CTRL+C** to stop a service (not close terminal)

---

## 🔧 One-Command Startup (Advanced)

Create this script: `start-all.sh`

```bash
#!/bin/bash

# Start MongoDB
sudo systemctl start mongod

# Terminal 1: Python Backend
gnome-terminal -- bash -c "cd /home/aditya/Downloads/JURY-AI-main/chatbot-backend && ./start.sh; exec bash"

# Terminal 2: Node.js Backend  
gnome-terminal -- bash -c "cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/backend && npm start; exec bash"

# Terminal 3: Frontend
gnome-terminal -- bash -c "cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/frontend && npm start; exec bash"

echo "✅ All services starting in separate terminals!"
```

Then run:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

**After starting all 3 services, the chatbot will work!** 🎉
