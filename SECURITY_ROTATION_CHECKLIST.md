# Security Rotation Checklist

If any secrets were exposed on GitHub, complete these steps immediately.

## 1) Revoke and rotate secrets

- Firebase service account key (Google Cloud Console -> IAM & Admin -> Service Accounts)
- Firebase Web API key (Firebase Console -> Project Settings)
- GROQ API key
- Google AI API key
- Pinecone API key
- SMTP/app password
- JWT/session secrets

## 2) Update local environment files (not committed)

- chatbot-backend/.env
- jury-ai-app/backend/.env
- jury-ai-app/frontend/.env

## 3) Ensure no secrets are committed

Tracked files should contain placeholders only:
- jury-ai-app/backend/.env.example
- jury-ai-app/frontend/.env.example

## 4) Remove leaked secrets from git history (if already pushed)

Use git-filter-repo or BFG, then force-push:

1. Mirror clone the repo
2. Rewrite history to replace/remove leaked values
3. Force push cleaned history
4. Ask all collaborators to re-clone

## 5) Add repository secret scanning

Recommended:
- GitHub Advanced Security / Secret Scanning
- gitleaks in CI

## 6) Post-incident validation

- Restart backend/frontend
- Verify auth and API integrations
- Confirm old keys no longer work
