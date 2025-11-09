# Transcripto Frontend

Record audio in the browser, send to FastAPI backend for transcription & summary.

## Features
- Web Audio API recording (MediaRecorder)
- Upload to `http://localhost:8000/upload`
- Displays transcript + AI summary
- Tailwind CSS styling

## Setup

```bash
npm install
npm run dev
```

Copy `.env.local.example` to `.env.local` if you need to point at a different backend origin (default proxy uses `http://127.0.0.1:8000`).

Ensure backend running at `http://localhost:8000`.

## Tests

```bash
npm run lint
npm test -- --runInBand
# for coverage:
npm run test:coverage
```
