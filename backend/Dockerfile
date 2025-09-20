# syntax=docker/dockerfile:1.7

# Build stage
FROM python:3.13-slim AS builder
WORKDIR /app

# Install dependencies into the system's python interpreter
ENV POETRY_VIRTUALENVS_CREATE=false \
    PIP_NO_CACHE_DIR=1
RUN pip install poetry
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-interaction --no-ansi --only main

# Runtime stage
FROM python:3.13-slim AS runtime

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Copy dependencies from the build stage
COPY --from=builder /usr/local /usr/local

# Load project files
COPY app ./app

# Run configuration
EXPOSE 8000
ENTRYPOINT [ "uvicorn", "app.main:app" ]
CMD [ "--host", "0.0.0.0", "--port", "8000" ]
