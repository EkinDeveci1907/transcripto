FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /app

ARG SUMMARY_MODEL="gpt-4o-mini"
ARG WHISPER_MODEL="whisper-1"
ARG USE_MOCK_FLAG="true"
ARG PORT="8000"

COPY requirements.txt .
RUN python -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . .

ENV PATH="/opt/venv/bin:$PATH" \
    OPENAI_SUMMARY_MODEL=${SUMMARY_MODEL} \
    OPENAI_WHISPER_MODEL=${WHISPER_MODEL} \
    USE_MOCK=${USE_MOCK_FLAG} \
    PORT=${PORT}

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
