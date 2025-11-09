# Transcripto Backend (FastAPI)

Provides `/upload` endpoint to accept an audio file, transcribe with OpenAI Whisper, and summarize with GPT.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# Option A: Demo mode (no API key required)
#   Ensure USE_MOCK=true in .env (default), then run:
uvicorn main:app --reload --port 8000

# Option B: Real transcription/summarization
#   Put your OPENAI_API_KEY in .env and set USE_MOCK=false, then run:
# uvicorn main:app --reload --port 8000
```

## Endpoint

- POST `/upload`
  - Form: `file` (audio file: webm/mp3/wav/m4a)
  - Response: `{ "transcript": string, "summary": string }`

CORS allows http://localhost:3000 by default.

## Tests

- Mock mode: `pytest tests/test_api.py`
- Real-path (stubbed OpenAI client): `pytest tests/test_api_real.py`
- Full suite: `pytest`

## Docker

Build argument defaults:
- `SUMMARY_MODEL` (default `gpt-4o-mini`)
- `WHISPER_MODEL` (default `whisper-1`)
- `USE_MOCK_FLAG` (default `true`)
- `PORT` (default `8000`)

Example usage:

```bash
# Build for staging with real models baked in
docker build \
  --build-arg SUMMARY_MODEL=gpt-4o-mini \
  --build-arg WHISPER_MODEL=whisper-1 \
  --build-arg USE_MOCK_FLAG=false \
  --build-arg PORT=8080 \
  -t transcripto-backend .

# Run in mock mode (default). Override OPENAI_API_KEY/USE_MOCK at runtime as needed.
docker run -p 8080:8080 \
  -e OPENAI_API_KEY=sk-your-key \
  -e USE_MOCK=false \
  transcripto-backend
```
