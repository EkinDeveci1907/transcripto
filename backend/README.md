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
