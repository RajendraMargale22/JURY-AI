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

# Install 'serve' — a production-ready static file server
RUN npm install -g serve@14

# Copy only the built static files
COPY --from=builder /app/dist ./dist

# Railway injects PORT at runtime; default to 8080
ENV PORT=8080

# serve: -s enables SPA mode (rewrites to index.html), -l binds to host:port
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:$PORT"]
