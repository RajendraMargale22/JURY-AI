from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from logger import logger

async def catch_exception_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception("UNHANDLED EXCEPTION")
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error",
                "requestId": request_id,
            },
        )
