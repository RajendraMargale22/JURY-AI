# Railway Deployment Guide — JURY AI

This guide covers deploying all 4 JURY AI services to [Railway](https://railway.app) with MongoDB Atlas.

## Architecture

| Service | Root Directory | Tech | Railway Service Name |
|---|---|---|---|
| Frontend | `jury-ai-app/frontend` | Vite + React | `jury-ai-frontend` |
| Main Backend | `jury-ai-app/backend` | Node.js + Express | `jury-ai-backend` |
| Chatbot Backend | `chatbot-backend` | Python + FastAPI | `jury-ai-chatbot` |
| Contract Review | `contract-review-backend` | Python + FastAPI | `jury-ai-contract-review` |

---

## Prerequisites

1. **Railway account** — Sign up at [railway.app](https://railway.app). The Hobby plan ($5/month) is recommended for 4 services.
2. **MongoDB Atlas cluster** — Free M0 tier works for development. Get your connection string from Atlas dashboard.
3. **GitHub repo** — Push this repo to GitHub. Railway deploys from GitHub.

---

## Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster (or use existing one)
3. **Network Access** → Add IP Address → `0.0.0.0/0` (Allow from anywhere — required because Railway has dynamic IPs)
4. **Database Access** → Create a user with a strong password
5. **Connect** → Get connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jury-ai?retryWrites=true&w=majority`

---

## Step 2: Create Railway Project

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `JURY-AI` repository

---

## Step 3: Create 4 Services

For each service, click **+ New Service** → **GitHub Repo** → select the same repo.

### Service 1: Main Backend

- **Settings → Root Directory**: `jury-ai-app/backend`
- **Settings → Watch Paths**: `jury-ai-app/backend/**`
- **Variables** (add these):
  ```
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jury-ai?retryWrites=true&w=majority
  JWT_SECRET=<generate-a-strong-secret>
  FRONTEND_URL=https://<your-frontend-service>.up.railway.app
  CLIENT_URL=https://<your-frontend-service>.up.railway.app
  CORS_ORIGINS=https://<your-frontend-service>.up.railway.app
  FASTAPI_URL=https://<your-chatbot-service>.up.railway.app/ask/
  SESSION_SECRET=<generate-a-strong-secret>
  ADMIN_EMAIL=admin@juryai.com
  SITE_NAME=Jury AI
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=<your-email>
  SMTP_PASS=<your-app-password>
  FIREBASE_PROJECT_ID=<your-firebase-project-id>
  FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
  FIREBASE_PRIVATE_KEY=<your-firebase-private-key>
  ```
- **Settings → Networking**: Generate a public domain

### Service 2: Frontend

- **Settings → Root Directory**: `jury-ai-app/frontend`
- **Settings → Watch Paths**: `jury-ai-app/frontend/**`
- **Variables** (add these):
  ```
  REACT_APP_API_URL=https://<your-backend-service>.up.railway.app/api
  REACT_APP_CHATBOT_API_URL=https://<your-chatbot-service>.up.railway.app
  REACT_APP_CONTRACT_REVIEW_API_URL=https://<your-contract-review-service>.up.railway.app
  REACT_APP_CONTRACT_REVIEW_API_KEY=<your-api-key>
  REACT_APP_FIREBASE_API_KEY=<your-firebase-api-key>
  REACT_APP_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
  REACT_APP_FIREBASE_PROJECT_ID=<your-project-id>
  REACT_APP_FIREBASE_APP_ID=<your-app-id>
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
  ```
- **Settings → Networking**: Generate a public domain

### Service 3: Chatbot Backend

- **Settings → Root Directory**: `chatbot-backend`
- **Settings → Watch Paths**: `chatbot-backend/**`
- **Variables** (add these):
  ```
  MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jury-ai?retryWrites=true&w=majority
  CORS_ORIGINS=https://<your-frontend-service>.up.railway.app,https://<your-backend-service>.up.railway.app
  PINECONE_API_KEY=<your-pinecone-key>
  GROQ_API_KEY=<your-groq-key>
  GOOGLE_API_KEY=<your-google-api-key>
  ```
- **Settings → Networking**: Generate a public domain

### Service 4: Contract Review Backend

- **Settings → Root Directory**: `contract-review-backend`
- **Settings → Watch Paths**: `contract-review-backend/**`
- **Variables** (add these):
  ```
  CORS_ORIGINS=https://<your-frontend-service>.up.railway.app
  ```
- **Settings → Networking**: Generate a public domain

---

## Step 4: Deploy

Railway auto-deploys when you push to the connected branch. After the first setup:

1. Each service will build using its `Dockerfile` (backends) or `railway.toml` config (frontend)
2. Railway assigns a dynamic `PORT` automatically — all services are already configured to use it
3. Health checks will verify each service is running

---

## Step 5: Update Cross-References

After all 4 services are deployed and have their Railway domains:

1. **Update `CORS_ORIGINS`** in the main backend with the actual frontend Railway URL
2. **Update `FRONTEND_URL`** and `CLIENT_URL` in the main backend
3. **Update `FASTAPI_URL`** in the main backend with the chatbot's Railway URL
4. **Update `REACT_APP_*`** URLs in the frontend with the actual backend Railway URLs
5. **Redeploy** the services that had variable changes

---

## Step 6: Firebase Setup

Add your Railway frontend domain to Firebase authorized domains:

1. Go to Firebase Console → Authentication → Settings
2. **Authorized Domains** → Add `<your-frontend-service>.up.railway.app`

---

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGINS` in each backend includes the frontend's Railway URL
- Check that the URL has no trailing slash

### MongoDB Connection Failures
- Verify Atlas Network Access allows `0.0.0.0/0`
- Ensure the connection string password has no special characters that need URL encoding
- Check Railway service logs for connection errors

### Health Check Failures
- Railway needs a few minutes for the first deployment
- Check logs in the Railway dashboard for startup errors
- Python services may take longer to start due to ML model loading

### Build Failures
- Check that `Root Directory` is set correctly in Railway service settings
- Verify `Watch Paths` don't conflict between services
