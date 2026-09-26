import contextvars
import json
import logging
import logging.config
import signal
import threading
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.routes import complaints, health, meta, stats

_request_id_var = contextvars.ContextVar("request_id", default=None)


class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = _request_id_var.get() or "unknown"
        return True


class JSONFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", None),
        }
        if hasattr(record, "method"):
            payload["method"] = record.method
        if hasattr(record, "path"):
            payload["path"] = record.path
        if hasattr(record, "status_code"):
            payload["status_code"] = record.status_code
        if hasattr(record, "latency_ms"):
            payload["latency_ms"] = record.latency_ms
        if hasattr(record, "signal"):
            payload["signal"] = record.signal
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, separators=(",", ":"))


logging.config.dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {"request_id": {"()": RequestIDFilter}},
        "formatters": {"json": {"()": JSONFormatter}},
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
                "filters": ["request_id"],
            }
        },
        "root": {"handlers": ["console"], "level": "INFO"},
    }
)

logger = logging.getLogger("civicpulse")

_shutdown_requested = threading.Event()


def _handle_sigterm(signum, frame):
    logger.warning("SIGTERM received; initiating graceful shutdown", extra={"signal": signum})
    _shutdown_requested.set()


signal.signal(signal.SIGTERM, _handle_sigterm)

app = FastAPI(title="CivicPulse")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    token = _request_id_var.set(request_id)
    start = time.perf_counter()
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000)
        logger.exception(
            "request failed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": 500,
                "latency_ms": duration_ms,
            },
        )
        raise
    else:
        duration_ms = round((time.perf_counter() - start) * 1000)
        logger.info(
            "request completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "latency_ms": duration_ms,
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        _request_id_var.reset(token)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Cache", "X-Request-ID"],
)


@app.on_event("shutdown")
def graceful_shutdown():
    logger.warning("application shutdown started")


app.include_router(complaints.router)
app.include_router(health.router)
app.include_router(stats.router)
app.include_router(meta.router)