# Transcripto

Early MVP scaffold for an audio recording + transcription + AI summarization app.

## Structure
```
PROJECTS/transcripto/
  frontend/   # Next.js 14 + Tailwind recording UI
  backend/    # (to be implemented) FastAPI for /upload, Whisper transcription + GPT summary
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

## Backend (FastAPI) — Pending
Planned endpoint:
```
POST /upload  (multipart/form-data file=audio)
Response: { transcript: string, summary: string }
```
Will use OpenAI Whisper + GPT model. CORS + .env for `OPENAI_API_KEY`.

## Roadmap
- [ ] Implement FastAPI backend
- [ ] Add GitHub Actions CI (type-check, lint, build)
- [ ] Add basic unit tests (React component, FastAPI route)
- [ ] Dockerize services
- [ ] Deploy frontend (Vercel) & backend (Railway/Fly/DigitalOcean)

## Contributing
Create feature branches: `feat/<name>` -> PR into `main`. Use Conventional Commits.

## Environment Variables
Frontend: `NEXT_PUBLIC_API_BASE=http://localhost:8000`
Backend (planned): `OPENAI_API_KEY=sk-...`

## License
TBD.
