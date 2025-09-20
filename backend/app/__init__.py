import logging

logger = logging.getLogger(__name__)
formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s", "%Y-%m-%d %H:%M:%S")
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger.addHandler(handler)

for other_handler in logging.getLogger("uvicorn").handlers:
    other_handler.setFormatter(formatter)
