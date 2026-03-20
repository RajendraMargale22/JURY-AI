# Observability

## Metrics endpoint
- Path: `/metrics`
- Format: Prometheus exposition
- Main metrics:
  - `contract_review_http_requests_total{method,path,status}`
  - `contract_review_http_request_duration_seconds_bucket{method,path,le}`

## Alert rules
- File: `observability/prometheus-alerts.yml`
- Includes:
  - High 5xx error rate on `/contract-review/analyze`
  - High p95 latency on `/contract-review/analyze`
  - No analyze traffic for 30 minutes

## Suggested alert targets
- Slack / PagerDuty for `warning`
- Email for `info`
