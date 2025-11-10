# Transcripto

[![CI](https://github.com/ekindeveci1907/transcripto/actions/workflows/ci.yml/badge.svg)](https://github.com/ekindeveci1907/transcripto/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/ekindeveci1907/transcripto/branch/main/graph/badge.svg)](https://codecov.io/gh/ekindeveci1907/transcripto)

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
- `POST /upload` (multipart/form-data `file`): returns `{ transcript, summary, summary_error? }`
- `GET /health`: returns `{ status, mock, allow_all_cors, origins }` to confirm mode & CORS
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
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-vercel-deployment.vercel.app
```

Frontend `.env.local` (optional, see `frontend/.env.local.example`):
```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
# In server environments (Vercel), you can also set BACKEND_BASE_URL for the /api/upload route
# BACKEND_BASE_URL=https://transcripto-backend.onrender.com
```

## Deploy (recommended quick path)
Frontend on Vercel, backend on Render:

1) Backend (Render Web Service)
- Connect repo → root directory `backend/`
- Runtime: Python 3.11
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: `OPENAI_API_KEY`, `USE_MOCK=false`, optional model overrides, and `ALLOWED_ORIGINS` with your frontend URLs.

2) Frontend (Vercel)
- Import repo (project root). Framework: Next.js
- Env var: `BACKEND_BASE_URL` set to your Render backend URL
- Build with defaults and assign a domain. Re-deploy backend if you add a new domain to CORS.

Local Docker (optional):
```
export OPENAI_API_KEY=sk-...
docker compose build
docker compose up -d
# App: http://localhost:3000, API: http://localhost:8000/health
```

## Testing
- Backend: `cd backend && pytest --cov=main --cov-report=term-missing` (mock + real-path coverage)
- Frontend: `cd frontend && npm run lint && npm test` (use `npm run test:coverage` for coverage)

### CI & Coverage Badges
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Coverage badges powered by Codecov; set a `CODECOV_TOKEN` repository secret to let the workflow upload `backend/coverage.xml` and `frontend/coverage/lcov.info`.

## License
TBD.
