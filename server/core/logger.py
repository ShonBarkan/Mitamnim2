import os
import logging
from logging.handlers import RotatingFileHandler
from contextvars import ContextVar

# Context variable to hold the request-scoped trace ID asynchronously across tasks
trace_id_var: ContextVar[str] = ContextVar("trace_id", default="-")


class TraceIDFilter(logging.Filter):
    """
    Logging filter to intercept log records and inject the dynamic,
    context-scoped trace ID into the record properties before rendering.
    """

    def filter(self, record):
        record.trace_id = trace_id_var.get()
        return True


# Define path configurations for system logs
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, "app.log")

# Unified system log message formatter structure incorporating trace ID token placeholders
LOG_FORMAT = "%(asctime)s - %(levelname)s - [%(trace_id)s] - [%(filename)s:%(lineno)d] - %(message)s"
formatter = logging.Formatter(LOG_FORMAT)

# 1. Console Stream Handler (For real-time terminal output tracking)
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)

# 2. Rotating File Handler (Ensures server storage stability by restricting log size)
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10 * 1024 * 1024,  # 10 Megabytes per file ceiling
    backupCount=5  # Keeps up to 5 historical log generations rotation records
)
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.INFO)

# Root System Logger Node Configuration
logger = logging.getLogger("mitamnim_server")
logger.setLevel(logging.INFO)

# Avoid duplication handlers leakage if imported multiple times across execution blocks
if not logger.handlers:
    # Append trace isolation filters directly to outbound channels
    console_handler.addFilter(TraceIDFilter())
    file_handler.addFilter(TraceIDFilter())

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    logger.propagate = False