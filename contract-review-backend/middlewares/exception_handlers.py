from fastapi import Request
from fastapi.responses import JSONResponse
from logger import logger


async def catch_exception_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as error:  # pylint: disable=broad-except
        logger.exception(f"Unhandled error on {request.url.path}: {error}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error during contract review"
            }
        )
