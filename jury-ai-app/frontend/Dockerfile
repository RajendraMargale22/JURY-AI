# ── Build stage ──────────────────────────────────────────────
FROM node:22.14-alpine AS builder

WORKDIR /app

# Railway passes service variables as build args automatically.
# Declare every REACT_APP_* variable so Vite can inline them at build time.
ARG REACT_APP_API_URL
ARG REACT_APP_CHATBOT_API_URL
ARG REACT_APP_CONTRACT_REVIEW_API_URL
ARG REACT_APP_CONTRACT_REVIEW_API_KEY
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_APP_ID
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_NEWS_API_KEY

ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_CHATBOT_API_URL=$REACT_APP_CHATBOT_API_URL \
    REACT_APP_CONTRACT_REVIEW_API_URL=$REACT_APP_CONTRACT_REVIEW_API_URL \
    REACT_APP_CONTRACT_REVIEW_API_KEY=$REACT_APP_CONTRACT_REVIEW_API_KEY \
    REACT_APP_FIREBASE_API_KEY=$REACT_APP_FIREBASE_API_KEY \
    REACT_APP_FIREBASE_AUTH_DOMAIN=$REACT_APP_FIREBASE_AUTH_DOMAIN \
    REACT_APP_FIREBASE_PROJECT_ID=$REACT_APP_FIREBASE_PROJECT_ID \
    REACT_APP_FIREBASE_APP_ID=$REACT_APP_FIREBASE_APP_ID \
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$REACT_APP_FIREBASE_MESSAGING_SENDER_ID \
    REACT_APP_NEWS_API_KEY=$REACT_APP_NEWS_API_KEY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────
FROM node:22.14-alpine

WORKDIR /app

# Copy only what's needed to serve the built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Railway injects PORT at runtime; vite preview must bind to it
ENV PORT=4173
EXPOSE $PORT

CMD ["sh", "-c", "npx vite preview --host 0.0.0.0 --port $PORT"]
