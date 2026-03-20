module.exports = {
  apps: [
    {
      name: 'contract-review-backend',
      cwd: '/home/aditya/Downloads/JURY-AI-main/contract-review-backend',
      script: '/home/aditya/Downloads/JURY-AI-main/.venv/bin/uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8001 --workers 2',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        CORS_ORIGINS: 'https://your-frontend.example.com',
        CONTRACT_REVIEW_API_KEYS: 'replace-with-strong-key',
        RATE_LIMIT_WINDOW_SECONDS: '60',
        RATE_LIMIT_MAX_REQUESTS: '120',
        MAX_UPLOAD_BYTES: '10485760',
        UPLOAD_SCAN_POLICY: 'basic',
      },
    },
  ],
};
