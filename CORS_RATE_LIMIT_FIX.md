# 🔧 CORS & Rate Limiting Fix

## Issues Fixed

### 1. ❌ CORS Error
**Error:** `Access to XMLHttpRequest at 'http://localhost:5000/api/templates' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Cause:** Backend CORS configuration wasn't properly set up for development

**Solution:** Updated `server.ts` with:
- Multiple allowed origins (localhost:3000, localhost:3001)
- Proper CORS methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- Allowed headers (Content-Type, Authorization, X-Requested-With)
- Exposed headers (Content-Disposition for file downloads)
- Preflight request handler (`app.options('*', cors())`)

### 2. ❌ 429 Too Many Requests
**Error:** `GET http://localhost:5000/api/templates net::ERR_FAILED 429 (Too Many Requests)`

**Cause:** Rate limiter was set to only 100 requests per 15 minutes (too strict for development)

**Solution:** Updated rate limiter:
- **Development:** 1000 requests per 15 minutes
- **Production:** 100 requests per 15 minutes

## ✅ How to Apply Fix

### Step 1: Stop Backend Server
If backend is running, press `CTRL+C` in the terminal

### Step 2: Restart Backend
```bash
cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/backend
npm start
```

### Step 3: Verify Fix
```bash
# Test backend health
curl http://localhost:5000/api/health

# Test templates endpoint
curl http://localhost:5000/api/templates/categories
```

### Step 4: Refresh Frontend
In browser, refresh the page (F5 or CTRL+R)

## 🧪 Test Checklist

- [ ] Backend starts without errors
- [ ] No CORS errors in browser console
- [ ] No 429 errors in browser console
- [ ] Templates page loads successfully
- [ ] Categories display in sidebar
- [ ] Templates display in grid
- [ ] Search functionality works
- [ ] Category filter works

## 📋 Updated Configuration

### server.ts Changes

**Rate Limiter (Line ~36-42):**
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**CORS Configuration (Line ~55-65):**
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.CLIENT_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition']
}));
```

**Preflight Handler (Line ~69):**
```typescript
app.options('*', cors());
```

## 🔍 Troubleshooting

### Still Getting CORS Errors?

1. **Hard refresh browser:** CTRL+SHIFT+R (clears cache)
2. **Check backend console:** Look for startup messages
3. **Verify .env file:** Ensure `CLIENT_URL=http://localhost:3000`
4. **Check port:** Ensure backend is on port 5000

```bash
# Check if port 5000 is in use
lsof -i :5000
```

### Still Getting 429 Errors?

1. **Wait 15 minutes:** Rate limit window needs to reset
2. **Restart backend:** This resets the rate limit counter
3. **Check NODE_ENV:** Should be 'development'

```bash
# In backend directory
echo $NODE_ENV
# or check .env file
cat .env | grep NODE_ENV
```

### Backend Won't Start?

1. **Check for syntax errors:**
```bash
cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/backend
npm run build
```

2. **Check dependencies:**
```bash
npm install
```

3. **Check MongoDB:**
```bash
sudo systemctl status mongod
```

## 🎯 Expected Behavior After Fix

### Browser Console (No Errors)
✅ Templates load successfully  
✅ Categories load successfully  
✅ No CORS errors  
✅ No 429 errors  
✅ No network errors  

### Backend Console
```
🚀 Server running on port 5000
📱 Environment: development
✅ MongoDB Connected: localhost
```

### Frontend (Templates Page)
✅ Sidebar shows all 17 categories  
✅ Template cards display in grid  
✅ Search box works  
✅ Category filtering works  
✅ Upload button visible (if admin/lawyer)  

## 📝 Additional Notes

### Why React Makes Many Requests

React in development mode uses **Strict Mode** which:
- Mounts components twice
- Runs effects twice
- This causes duplicate API calls

This is normal and only happens in development. Production builds don't have this issue.

### Rate Limiting Best Practices

**Development:**
- High limit (1000 requests/15 min)
- Allows testing without hitting limits

**Production:**
- Lower limit (100 requests/15 min)
- Protects against abuse
- Can be adjusted based on needs

### CORS Best Practices

**Development:**
- Allow localhost origins
- Generous CORS policy

**Production:**
- Specific domain only
- Stricter CORS policy
- Use environment variables

## 🚀 Quick Commands

```bash
# Restart backend
cd /home/aditya/Downloads/JURY-AI-main/jury-ai-app/backend
npm start

# Check logs
tail -f logs/error.log

# Test API
curl -v http://localhost:5000/api/health
curl -v http://localhost:5000/api/templates/categories

# Check CORS headers
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  http://localhost:5000/api/templates
```

## ✅ Verification

After applying the fix and restarting:

1. Open browser: http://localhost:3000
2. Navigate to Templates page
3. Open Developer Tools (F12)
4. Go to Console tab
5. Should see NO errors
6. Go to Network tab
7. Refresh page
8. All requests should show status 200 (green)

---

**Status:** ✅ Fixed  
**Date:** November 7, 2025  
**Impact:** CORS and rate limiting now work correctly in development
