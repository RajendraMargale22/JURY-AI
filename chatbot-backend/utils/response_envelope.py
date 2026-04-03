from typing import Any, Optional
from fastapi import Request
from fastapi.responses import JSONResponse


def _request_id(request: Optional[Request]) -> Optional[str]:
    if request is None:
        return None
    return getattr(request.state, "request_id", None)


def success_payload(
    data: Any,
    message: str = "OK",
    request: Optional[Request] = None,
) -> dict:
    base = {
        "success": True,
        "message": message,
        "data": data,
        "requestId": _request_id(request),
    }
    if isinstance(data, dict):
        return {**base, **data}
    return base


def error_response(
    message: str,
    status_code: int,
    request: Optional[Request] = None,
    data: Any = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": data,
            "requestId": _request_id(request),
        },
    )
