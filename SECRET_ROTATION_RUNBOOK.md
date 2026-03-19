# One-Time Secret Rotation Runbook (JURY-AI)

This runbook is specific to this repository and should be executed once after key exposure.

## Scope of potentially exposed secrets

### Node/React app (jury-ai-app)
- Firebase Admin service account private key (`FIREBASE_PRIVATE_KEY`)
- Firebase client email/project identifiers
- Firebase web key/config (`REACT_APP_FIREBASE_*`)
- SMTP password (`SMTP_PASS`)
- JWT/Session secrets (`JWT_SECRET`, `SESSION_SECRET`)

### Python chatbot service (chatbot-backend)
- `GROQ_API_KEY`
- `GOOGLE_API_KEY`
- `PINECONE_API_KEY`
- Any DB URI credentials if used in `.env`

---

## 1) Immediate containment (15 minutes)

1. Freeze deploys and notify maintainers.
2. Stop sharing logs/screenshots containing env values.
3. Confirm `.env` files are ignored (already true in root `.gitignore`).
4. Create a temporary incident branch for cleanup.

---

## 2) Revoke + rotate secrets at provider (required)

### Firebase / Google Cloud
1. Google Cloud Console -> IAM & Admin -> Service Accounts.
2. Open service account `firebase-adminsdk-...`.
3. **Delete old key** (the exposed one).
4. Create a new JSON key.
5. Update backend env:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (single-line string with `\n` escapes)

### Firebase Web key
1. Firebase Console -> Project settings -> General.
2. Regenerate/restrict the Web API key in Google Cloud API Credentials.
3. Restrict by:
   - Allowed HTTP referrers (your domains)
   - API restrictions to Firebase services only
4. Update frontend env `REACT_APP_FIREBASE_*`.

### GROQ
1. GROQ dashboard -> API keys.
2. Revoke exposed key.
3. Create replacement key.
4. Update `chatbot-backend/.env`.

### Google AI key
1. Google AI/Cloud credentials.
2. Revoke exposed key and create new one.
3. Restrict by API + source where possible.
4. Update `chatbot-backend/.env`.

### Pinecone
1. Pinecone console -> API Keys.
2. Revoke exposed key.
3. Create new key scoped to required project/environment.
4. Update `chatbot-backend/.env`.

### SMTP credentials
1. Revoke app password/token used by `SMTP_PASS`.
2. Create new app password.
3. Update `jury-ai-app/backend/.env`.

### JWT / session secrets
1. Generate new long random secrets.
2. Replace in backend env:
   - `JWT_SECRET`
   - `SESSION_SECRET`
3. Expect all current sessions/tokens to become invalid.

---

## 3) Update local environment files (not committed)

- `jury-ai-app/backend/.env`
- `jury-ai-app/frontend/.env`
- `chatbot-backend/.env`

Keep only placeholders in tracked example files:
- `jury-ai-app/backend/.env.example`
- `jury-ai-app/frontend/.env.example`

---

## 4) Sanitize git history if secrets were pushed

If any real secret reached GitHub history, rotate first, then purge history.

### Option A: git-filter-repo (recommended)
1. Mirror clone repository.
2. Create replacements file (literal old->new placeholders).
3. Run filter-repo replace-text.
4. Force-push all refs.

### Option B: BFG Repo-Cleaner
Use BFG for bulk text replacements, then force-push.

After rewrite:
- Ask all contributors to re-clone.
- Invalidate old forks if possible.

---

## 5) Enable prevention controls

1. Install pre-commit and run hooks locally:
   - `pip install pre-commit`
   - `pre-commit install`
   - `pre-commit run --all-files`
2. Keep `.env` and runtime secrets out of git.
3. Use repository secrets for CI/CD only.

---

## 6) Validate recovery (must pass)

1. Restart services:
   - backend (5000)
   - frontend (3000)
   - chatbot-backend (8000)
2. Verify:
   - email/password auth works
   - Google sign-in works
   - chatbot model calls work
   - Pinecone operations work
3. Verify old keys fail at provider side.

---

## 7) Incident closure checklist

- [ ] All exposed keys rotated
- [ ] `.env` values updated locally
- [ ] Examples sanitized
- [ ] Pre-commit secret scan enabled
- [ ] History rewrite completed (if needed)
- [ ] Team notified and access audited
