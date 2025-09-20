import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import users

settings = get_settings()
logger = logging.getLogger(__name__)
logger.parent.setLevel(settings.LOG_LEVEL)


# TODO: Disable docs in production
app = FastAPI(title=settings.APP_NAME, root_path=settings.DEPLOYMENT_PREFIX)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex="http://localhost:*" if settings.APP_ENV == "development" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users")


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app="app.main:app", host="0.0.0.0", port=8000)
