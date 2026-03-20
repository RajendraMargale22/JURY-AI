import json
import statistics
import threading
import time
import urllib.request

URL = "http://localhost:8001/contract-review/analyze"
API_KEY = "dev-local-key"
TOTAL_REQUESTS = 100
CONCURRENCY = 10
PAYLOAD = "contract_text=1.%20Either%20party%20may%20terminate%20with%2030%20days%20notice."

latencies_ms: list[float] = []
status_codes: list[int] = []
lock = threading.Lock()


def worker(request_count: int):
    for _ in range(request_count):
        started = time.perf_counter()
        req = urllib.request.Request(
            URL,
            data=PAYLOAD.encode("utf-8"),
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "X-API-Key": API_KEY,
            },
            method="POST",
        )
        status = 0
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                status = response.getcode()
                _ = response.read()
        except Exception:
            status = 0
        elapsed = (time.perf_counter() - started) * 1000
        with lock:
            latencies_ms.append(elapsed)
            status_codes.append(status)


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = int((p / 100.0) * (len(ordered) - 1))
    return ordered[idx]


def main():
    start = time.perf_counter()

    threads = []
    per_thread = TOTAL_REQUESTS // CONCURRENCY
    extra = TOTAL_REQUESTS % CONCURRENCY

    for i in range(CONCURRENCY):
        count = per_thread + (1 if i < extra else 0)
        t = threading.Thread(target=worker, args=(count,))
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    duration = time.perf_counter() - start
    success = sum(1 for s in status_codes if s == 200)
    fail = len(status_codes) - success

    report = {
        "total_requests": len(status_codes),
        "success_200": success,
        "failed": fail,
        "duration_sec": round(duration, 3),
        "throughput_rps": round(len(status_codes) / duration, 2) if duration > 0 else 0,
        "latency_ms": {
            "avg": round(statistics.mean(latencies_ms), 2) if latencies_ms else 0,
            "p50": round(percentile(latencies_ms, 50), 2),
            "p95": round(percentile(latencies_ms, 95), 2),
            "p99": round(percentile(latencies_ms, 99), 2),
            "max": round(max(latencies_ms), 2) if latencies_ms else 0,
        },
    }

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
