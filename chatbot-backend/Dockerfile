FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose default port (Railway injects PORT)
ENV PORT="8000"
EXPOSE ${PORT}

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
