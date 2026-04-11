# AWS Amplify Frontend Deployment (jury-ai-app/frontend)

This project uses **Vite** and outputs production files to `dist`, so Amplify must build from `jury-ai-app/frontend` and publish `dist`.

## Files added

- `amplify.yml` (repo root)
- `jury-ai-app/frontend/.env.production.example`

## 1) Prerequisites

- AWS account with Amplify access
- Git repository connected to Amplify (GitHub/GitLab/Bitbucket)
- Production backend URLs ready:
  - Main API (`/api`)
  - Chatbot API
  - Contract review API

## 2) Connect repo in Amplify

1. Open **AWS Amplify Console**.
2. Click **New app** → **Host web app**.
3. Select Git provider and authorize.
4. Choose repository: `JURY-AI-main`.
5. Choose the branch to deploy (for example `main`).

## 3) Use monorepo build settings

Amplify will detect and use `amplify.yml` at repository root:

- App root: `jury-ai-app/frontend`
- Build command: `npm run build`
- Artifact directory: `dist`

If UI asks for app root, set it to `jury-ai-app/frontend`.

## 4) Configure environment variables in Amplify

In Amplify app settings, add these environment variables for your branch:

- `REACT_APP_API_URL`
- `REACT_APP_CHATBOT_API_URL`
- `REACT_APP_CONTRACT_REVIEW_API_URL`
- `REACT_APP_CONTRACT_REVIEW_API_KEY`
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

Reference template: `jury-ai-app/frontend/.env.production.example`

## 5) Start first deployment

1. Save Amplify settings.
2. Click **Save and deploy**.
3. Wait for build to finish.
4. Open generated Amplify URL and validate:
   - Login/auth flow
   - API calls to production backend
   - File/template flows

## 6) Custom domain (recommended)

1. Amplify app → **Domain management**.
2. Add your domain/subdomain.
3. Configure DNS records as shown by Amplify.
4. Wait for SSL certificate provisioning.

## 7) CORS checklist (backend)

Allow your Amplify domain(s) in backend CORS:

- `https://<branch>.<app-id>.amplifyapp.com`
- Your custom domain (if configured)

## 8) Redeploy flow

Each push to connected branch triggers automatic rebuild/redeploy.

For manual deploy: Amplify app → **Deployments** → **Redeploy this version**.
