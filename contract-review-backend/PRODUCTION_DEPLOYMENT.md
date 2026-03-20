# Contract Review Backend — Production Deployment

## Required environment variables
- `CONTRACT_REVIEW_API_KEYS` (comma-separated API keys)
- `CORS_ORIGINS` (comma-separated exact origins, no wildcard)
- `RATE_LIMIT_WINDOW_SECONDS` (default `60`)
- `RATE_LIMIT_MAX_REQUESTS` (default `60`)
- `MAX_UPLOAD_BYTES` (default `10485760`)
- `UPLOAD_SCAN_POLICY` (`off|basic|strict`, default `basic`)

## Run options
- Preferred: systemd unit in `deploy/systemd/contract-review-backend.service`
- Alternative: pm2 ecosystem in `deploy/pm2/ecosystem.config.js`
- Container: `Dockerfile` (uvicorn workers, no reload)

## Security controls
- API key required on `/contract-review/analyze` via `X-API-Key`
- In-memory rate limiting per `api_key + client_ip`
- Upload guards: extension allowlist, MIME allowlist, size cap, content scanning policy

## Observability
- Health: `/health`
- Metrics: `/metrics`
- Alert rules: `observability/prometheus-alerts.yml`

## Load test baseline
Run:
```bash
python scripts/load_test_baseline.py
```
