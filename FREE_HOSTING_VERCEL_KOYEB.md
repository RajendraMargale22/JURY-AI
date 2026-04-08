# Free Hosting Plan (Vercel + Koyeb + MongoDB Atlas)

Use this for a no-Render setup.

## 1) Frontend on Vercel (free)

- Import repo in Vercel
- Project root: `jury-ai-app/frontend`
- Build command: `npm run build`
- Output directory: `dist`

Set environment variables in Vercel:

- `REACT_APP_API_URL=https://<koyeb-node-backend-domain>/api`
- `REACT_APP_CONTRACT_REVIEW_API_URL=https://<koyeb-contract-review-domain>`
- `REACT_APP_CONTRACT_REVIEW_API_KEY=<same-key-as-contract-backend>`
- `REACT_APP_FIREBASE_API_KEY` (if using Firebase)
- `REACT_APP_FIREBASE_AUTH_DOMAIN` (if using Firebase)
- `REACT_APP_FIREBASE_PROJECT_ID` (if using Firebase)
- `REACT_APP_FIREBASE_APP_ID` (if using Firebase)
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` (if using Firebase)
- `REACT_APP_NEWS_API_KEY` (optional)

## 2) Node backend on Koyeb (free web service)

Service name: `jury-ai-backend`

- Repo root: this repository
- Working directory: `jury-ai-app/backend`
- Build command: `npm install && npm run build`
- Run command: `npm start`
- HTTP port: `5000`

Environment variables:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI=<atlas-uri-with-/jury-ai>`
- `JWT_SECRET=<strong-secret>`
- `CLIENT_URL=https://<your-vercel-domain>`
- `FRONTEND_URL=https://<your-vercel-domain>`
- `ADMIN_EMAIL=<email>`
- `ADMIN_PASSWORD=<password>`
- `FIREBASE_PROJECT_ID` (if using Firebase auth)
- `FIREBASE_CLIENT_EMAIL` (if using Firebase auth)
- `FIREBASE_PRIVATE_KEY` (if using Firebase auth)

Health check path: `/api/health`

## 3) Chatbot backend on Koyeb (free web service)

Service name: `jury-ai-chatbot`

- Repo root: this repository
- Working directory: `chatbot-backend`
- Build command: `pip install -r requirements.txt`
- Run command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- HTTP port: `8000`

Environment variables:

- `PORT=8000`
- `MONGODB_URI=<atlas-uri-with-/jury-ai>`
- `CORS_ORIGINS=https://<your-vercel-domain>,https://<koyeb-node-backend-domain>`
- `PINECONE_API_KEY=<key>`
- `PINECONE_INDEX_NAME=<index>`
- `GROQ_API_KEY=<key>`
- `GOOGLE_API_KEY=<optional>`
- `MAX_UPLOAD_FILES=10`
- `MAX_UPLOAD_BYTES=10485760`
- `MAX_QUESTION_CHARS=2000`
- `VECTOR_TOP_K=5`

Health check path: `/health`

## 4) Contract-review backend on Koyeb (free web service)

Service name: `jury-ai-contract-review`

- Repo root: this repository
- Working directory: `contract-review-backend`
- Build command: `pip install -r requirements.txt`
- Run command: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`
- HTTP port: `8001`

Environment variables:

- `PORT=8001`
- `CORS_ORIGINS=https://<your-vercel-domain>,https://<koyeb-node-backend-domain>`
- `CONTRACT_REVIEW_API_KEYS=<comma-separated-keys>`
- `RATE_LIMIT_WINDOW_SECONDS=60`
- `RATE_LIMIT_MAX_REQUESTS=60`
- `USE_LEGACY_CONTRACT_REVIEW=false`

Health check path: `/health`

## 5) Final verification

1. Frontend opens successfully.
2. Node API health: `https://<koyeb-node-backend-domain>/api/health`
3. Chatbot health: `https://<koyeb-chatbot-domain>/health`
4. Contract health: `https://<koyeb-contract-review-domain>/health`
5. Test login, chatbot question/upload, contract review API call.

## 6) Important

- Free services may sleep when idle.
- Keep CORS limited to your actual frontend and backend domains.
- Rotate any secret exposed in screenshots.
