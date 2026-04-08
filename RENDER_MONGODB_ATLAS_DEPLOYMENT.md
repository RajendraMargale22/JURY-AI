# Render + MongoDB Atlas Deployment Guide

This project runs as 4 services:

1. Frontend (Vite static site)
2. Node API backend
3. Chatbot FastAPI backend
4. Contract Review FastAPI backend

A ready-to-use Render blueprint is included in [render.yaml](render.yaml).

---

## 1) Create MongoDB Atlas Database

1. Create a free/shared cluster in MongoDB Atlas.
2. Create a database user with read/write access.
3. In Network Access, allow Render outbound IPs (or `0.0.0.0/0` initially, then tighten later).
4. Copy connection string and set DB name to `jury-ai`.

Example:

`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/jury-ai?retryWrites=true&w=majority`

You will use this value for `MONGODB_URI` in both:
- `jury-ai-backend`
- `jury-ai-chatbot`

---

## 2) Deploy on Render (Blueprint)

1. Push repository to GitHub/GitLab.
2. In Render, choose **New + > Blueprint**.
3. Select your repository.
4. Render detects [render.yaml](render.yaml) and creates 4 services.
5. For every `sync: false` variable, enter real secret values before first deploy.

---

## 3) Required Environment Variables

### A) `jury-ai-frontend` (static)
- `REACT_APP_API_URL=https://jury-ai-backend.onrender.com/api`
- `REACT_APP_CONTRACT_REVIEW_API_URL=https://jury-ai-contract-review.onrender.com`
- `REACT_APP_CONTRACT_REVIEW_API_KEY=<same key as contract review backend>`
- Firebase keys (`REACT_APP_FIREBASE_*`) if Google auth is enabled
- `REACT_APP_NEWS_API_KEY` (optional)

### B) `jury-ai-backend` (Node)
- `MONGODB_URI=<atlas-uri>`
- `JWT_SECRET=<strong-random-secret>`
- `CLIENT_URL=https://jury-ai-frontend.onrender.com`
- `FRONTEND_URL=https://jury-ai-frontend.onrender.com`
- `ADMIN_EMAIL=<admin email>`
- `ADMIN_PASSWORD=<admin password>`
- Firebase admin vars if using Google auth:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

### C) `jury-ai-chatbot` (Python)
- `MONGODB_URI=<atlas-uri>`
- `PINECONE_API_KEY=<pinecone-key>`
- `PINECONE_INDEX_NAME=<pinecone-index>`
- `GROQ_API_KEY=<groq-key>` (or configure Google model path)
- `CORS_ORIGINS=https://jury-ai-frontend.onrender.com,https://jury-ai-backend.onrender.com`

### D) `jury-ai-contract-review` (Python)
- `CONTRACT_REVIEW_API_KEYS=<comma-separated-api-keys>`
- `CORS_ORIGINS=https://jury-ai-frontend.onrender.com,https://jury-ai-backend.onrender.com`
- Optional tuning:
  - `RATE_LIMIT_WINDOW_SECONDS`
  - `RATE_LIMIT_MAX_REQUESTS`

---

## 4) Post-deploy checks

- Frontend opens: `https://jury-ai-frontend.onrender.com`
- Node API health: `https://jury-ai-backend.onrender.com/api/health`
- Chatbot health: `https://jury-ai-chatbot.onrender.com/health`
- Contract review health: `https://jury-ai-contract-review.onrender.com/health`

---

## 5) Important notes

1. Render free instances can sleep; first request may be slow.
2. Keep all service URLs consistent with CORS and frontend env values.
3. Rotate all secrets after first successful deploy.
4. Prefer Atlas IP allowlist hardening after deployment stabilizes.
