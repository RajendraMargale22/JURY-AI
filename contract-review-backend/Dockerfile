FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV CORS_ORIGINS="https://your-frontend.up.railway.app"
ENV RATE_LIMIT_WINDOW_SECONDS=60
ENV RATE_LIMIT_MAX_REQUESTS=120
ENV MAX_UPLOAD_BYTES=10485760
ENV UPLOAD_SCAN_POLICY=basic

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request, os; urllib.request.urlopen(f'http://localhost:{os.environ.get(\"PORT\", 8001)}/health')" || exit 1

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1
