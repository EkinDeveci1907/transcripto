# Transcripto

Early MVP scaffold for an audio recording + transcription + AI summarization app.

## Structure
```
PROJECTS/transcripto/
  frontend/   # Next.js 14 + Tailwind recording UI
  backend/    # FastAPI /upload → OpenAI Whisper transcription + GPT summary (mock fallback)
```

## Frontend (Next.js)
Features:
- Record via MediaRecorder
- Upload audio blob to `http://localhost:8000/upload`
- Show transcript + AI summary response
- Tailwind glassy card + gradient background

Run:
```bash
cd frontend
npm install
npm run dev
```
Visit: http://localhost:3000

## Backend (FastAPI)
- `POST /upload` (multipart/form-data `file`): returns `{ transcript, summary }`
- `GET /health`: returns `{ status, mock }` to confirm mode
- Mock mode enabled by default so you can test without hitting OpenAI (set `USE_MOCK=false` + `OPENAI_API_KEY=...` in `backend/.env` when you want real transcriptions)
- Requires Python 3.10+, FastAPI, and `python-multipart` to parse uploads

## Roadmap
- [x] Implement FastAPI backend proxy + mock fallback
- [ ] Add GitHub Actions CI (type-check, lint, build)
- [ ] Add basic unit tests (React component, FastAPI route)
- [ ] Dockerize services
- [ ] Deploy frontend (Vercel) & backend (Railway/Fly/DigitalOcean)

## Contributing
Create feature branches: `feat/<name>` -> PR into `main`. Use Conventional Commits.

## Environment Variables
Backend `.env` (see `backend/.env.example`):
```
USE_MOCK=true
OPENAI_API_KEY=sk-...
OPENAI_SUMMARY_MODEL=gpt-4o-mini
OPENAI_WHISPER_MODEL=whisper-1
```

Frontend `.env.local` (optional, see `frontend/.env.local.example`):
```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

## License
TBD.
