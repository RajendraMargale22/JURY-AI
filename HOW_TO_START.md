# 🚀 How to Start JURY AI Application

## ❌ Error You're Seeing:
```
POST http://localhost:8000/ask/ net::ERR_CONNECTION_REFUSED
```

**This means:** The Python chatbot backend (FastAPI) is not running on port 8000.

---

## ✅ Solution: Start All Services

Use **Windows PowerShell** in `c:\Users\adity\Downloads\JURY-AI`. MongoDB Atlas is already configured in `jury-ai-app/backend/.env`, so you do **not** need a local MongoDB service.

You need to start **4 services** in **4 separate terminal windows**:

### **Terminal 1: Python Chatbot Backend (Port 8000)**

```powershell
cd "c:\Users\adity\Downloads\JURY-AI"
if (-not (Test-Path .venv)) { python -m venv .venv }
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r chatbot-backend\requirements.txt -r contract-review-backend\requirements.txt
Set-Location "c:\Users\adity\Downloads\JURY-AI\chatbot-backend"
& "c:\Users\adity\Downloads\JURY-AI\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

This backend now reads `MONGODB_URI` from `jury-ai-app/backend/.env` automatically.

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

```powershell
Set-Location "c:\Users\adity\Downloads\JURY-AI\jury-ai-app\backend"
npm run build
npm start
```

**You should see:**
```
🚀 Server running on port 5000
📱 Environment: development
✅ MongoDB Connected: ac-9nlywco-shard-00-00.jw8jtuu.mongodb.net
```

---

### **Terminal 3: React Frontend (Port 3000)**

```powershell
Set-Location "c:\Users\adity\Downloads\JURY-AI\jury-ai-app\frontend"
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

### **Terminal 4: Contract Review Backend (Port 8001)**

```powershell
Set-Location "c:\Users\adity\Downloads\JURY-AI\contract-review-backend"
& "c:\Users\adity\Downloads\JURY-AI\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8001
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

---

## 🧪 Testing Each Service

### Test Python Backend (Port 8000):
```powershell
Invoke-WebRequest http://localhost:8000/health/ -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected response:**
```json
{
  "success": true,
  "message": "Service health fetched",
  "data": {
    "status": "healthy",
    "mongodb": "connected",
    "mongodb_enabled": true
  }
}
```

### Test Node.js Backend (Port 5000):
```powershell
Invoke-WebRequest http://localhost:5000/api/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected response:**
```json
{
  "success": true,
  "status": "OK",
  "data": {
    "status": "OK",
    "timestamp": "2026-05-03T...",
    "environment": "development"
  }
}
```

### Test Frontend (Port 3000):
Open browser: http://localhost:3000

### Test Contract Review Backend (Port 8001):
```powershell
Invoke-WebRequest http://localhost:8001/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "contract-review-backend",
  "legacy_loaded": false,
  "version": "1.0.0"
}
```

---

## 🐛 Troubleshooting

### Problem: "Port already in use"

**For port 8000:**
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**For port 5000:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**For port 3000:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**For port 8001:**
```powershell
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

---

### Problem: "MongoDB Atlas connection failed"

No local MongoDB service is required.
Check the Atlas connection string in `jury-ai-app/backend/.env` and confirm your Atlas IP/network access settings.

### Problem: Python backend shows errors

**Check logger.py is fixed:**
```powershell
Set-Location "c:\Users\adity\Downloads\JURY-AI\chatbot-backend"
Get-Content logger.py
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
```powershell
Set-Location "c:\Users\adity\Downloads\JURY-AI"
.\.venv\Scripts\python -m pip install -r chatbot-backend\requirements.txt -r contract-review-backend\requirements.txt
```

If you see `externally-managed-environment`, do not use system `pip`.
Use `.\.venv\Scripts\python -m pip` commands shown above.

**Install Node.js dependencies:**
```powershell
Set-Location "c:\Users\adity\Downloads\JURY-AI\jury-ai-app\backend"
npm install

Set-Location "c:\Users\adity\Downloads\JURY-AI\jury-ai-app\frontend"
npm install
```

---

## 📋 Quick Start Checklist

- [ ] Atlas connection is configured in `jury-ai-app/backend/.env`
- [ ] Terminal 1: Python backend started on port 8000
- [ ] Terminal 2: Node.js backend started on port 5000  
- [ ] Terminal 3: React frontend started on port 3000
- [ ] Terminal 4: Contract review backend started on port 8001
- [ ] Test Python backend: `Invoke-WebRequest http://localhost:8000/health/ -UseBasicParsing`
- [ ] Test Node backend: `Invoke-WebRequest http://localhost:5000/api/health -UseBasicParsing`
- [ ] Test Contract backend: `Invoke-WebRequest http://localhost:8001/health -UseBasicParsing`
- [ ] Open browser: http://localhost:3000
- [ ] Try asking a question in the chat

---

## 🎯 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | User interface |
| Node.js API | http://localhost:5000 | Main backend |
| Python AI | http://localhost:8000 | Chatbot AI |
| Contract Review API | http://localhost:8001 | Contract document analysis |
| FastAPI Docs | http://localhost:8000/docs | API documentation |
| Contract Review Docs | http://localhost:8001/docs | Contract review API docs |
| MongoDB Compass | Atlas URI from `jury-ai-app/backend/.env` | Database GUI |

---

## 💡 Tips

1. **Keep all 4 terminals open** - Don't close them
2. **Atlas must be reachable** and the connection string in `jury-ai-app/backend/.env` must be valid
3. **Wait for each service to start** before testing
4. **Check logs** if something fails
5. **Use CTRL+C** to stop a service (not close terminal)

---

## 🔧 One-Command Startup (Advanced)

Create this script: `start-all.ps1`

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "c:\Users\adity\Downloads\JURY-AI\chatbot-backend"; & "c:\Users\adity\Downloads\JURY-AI\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "c:\Users\adity\Downloads\JURY-AI\jury-ai-app\backend"; npm run build; npm start'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "c:\Users\adity\Downloads\JURY-AI\jury-ai-app\frontend"; npm start'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "c:\Users\adity\Downloads\JURY-AI\contract-review-backend"; & "c:\Users\adity\Downloads\JURY-AI\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8001'

Write-Host "✅ All services starting in separate PowerShell windows!"
```

Then run:
```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```

---

**After starting all 4 services, chatbot + contract review will work smoothly!** 🎉
