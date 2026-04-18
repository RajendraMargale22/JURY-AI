import os
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Optional

from fastapi import Depends, Header, HTTPException, Request


def _load_api_keys() -> set[str]:
    raw = os.getenv("CONTRACT_REVIEW_API_KEYS", "dev-local-key,wnrgargg7ag9e9geergerig8ugy74th384t7w8efbw8f7e4t")
    return {item.strip() for item in raw.split(",") if item.strip()}


_ALLOWED_API_KEYS = _load_api_keys()
_RATE_LIMIT_WINDOW_SEC = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
_RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "60"))

# key: <api_key>:<ip> -> timestamps
_RATE_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
_RATE_LOCK = Lock()


def verify_api_key(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")) -> str:
    if not x_api_key or x_api_key not in _ALLOWED_API_KEYS:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return x_api_key


def enforce_rate_limit(request: Request, api_key: str = Depends(verify_api_key)) -> None:
    now = time.time()
    client_ip = request.client.host if request.client else "unknown"
    bucket_key = f"{api_key}:{client_ip}"

    with _RATE_LOCK:
        bucket = _RATE_BUCKETS[bucket_key]
        cutoff = now - _RATE_LIMIT_WINDOW_SEC

        while bucket and bucket[0] < cutoff:
            bucket.popleft()

        if len(bucket) >= _RATE_LIMIT_MAX_REQUESTS:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        bucket.append(now)
