import time

from fastapi import Request
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    "contract_review_http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

REQUEST_LATENCY = Histogram(
    "contract_review_http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
)


async def instrument_request_middleware(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - started

    path = request.url.path
    method = request.method
    status = str(response.status_code)

    REQUEST_COUNT.labels(method=method, path=path, status=status).inc()
    REQUEST_LATENCY.labels(method=method, path=path).observe(elapsed)
    return response
