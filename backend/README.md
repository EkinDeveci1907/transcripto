# Transcripto Backend (FastAPI)

Provides `/upload` endpoint to accept an audio file, transcribe with OpenAI Whisper, and summarize with GPT.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env  # put your OPENAI_API_KEY
uvicorn main:app --reload --port 8000
```

## Endpoint

- POST `/upload`
  - Form: `file` (audio file: webm/mp3/wav/m4a)
  - Response: `{ "transcript": string, "summary": string }`

CORS allows http://localhost:3000 by default.
