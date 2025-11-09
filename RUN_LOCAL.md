# Daily Run Guide (Transcripto)

Use this quick reference each day you open VS Code.

## 0. Folder layout
```
transcripto/
  backend/
    .env            # NOT committed, holds OPENAI_API_KEY + USE_MOCK flag
    main.py
    requirements.txt
    .venv/          # Python virtual environment
  frontend/
    package.json
    app/ ...
```

## 1. One‑time setup (already done, repeat only if you delete environments)
```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

## 2. Decide mode
Mock mode (no API calls): set `USE_MOCK=true` and leave `OPENAI_API_KEY` empty.
Real mode (uses OpenAI): set `OPENAI_API_KEY=<your-key>` and `USE_MOCK=false`.

Edit (or create) `backend/.env`:
```
OPENAI_API_KEY=sk-REDACTED
USE_MOCK=false
OPENAI_SUMMARY_MODEL=gpt-4o-mini
OPENAI_WHISPER_MODEL=whisper-1
```
Do NOT commit `.env`.

## 3. Start backend
Open Terminal 1:
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```
Health check: open http://127.0.0.1:8000/health — should show `{"status":"ok","mock":false}` in real mode or `true` in mock.

If it still says `mock:true` after setting `.env` to false, you previously exported `USE_MOCK=true` in that shell; open a fresh terminal or run:
```bash
unset USE_MOCK
```
Then restart uvicorn.

## 4. Start frontend
Open Terminal 2:
```bash
cd frontend
npm run dev
```
Visit http://localhost:3000.

If backend is on 127.0.0.1 but frontend can’t reach it, create `frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```
Restart `npm run dev`.

## 5. Use the app
- Click Record → speak a sentence → Stop.
- Or drag/drop an audio/video file (mp3, wav, m4a, webm, ogg, mp4, mov).
- Transcript + summary should appear (no `[mock]` prefix in real mode).

## 6. Common issues
| Symptom | Fix |
| ------- | ---- |
| Network Error | Backend not running or CORS mismatch; check http://127.0.0.1:8000/health |
| 400 Unsupported file format | Rename file with supported extension |
| transcript empty | Audio too short/silent; record ≥2 seconds clearly |
| mock remains true | Remove exported USE_MOCK, restart uvicorn with .env having USE_MOCK=false |
| ECONNREFUSED in console | Frontend started before backend; start backend first |

## 7. Switching modes quickly
```bash
# Mock
sed -i '' 's/USE_MOCK=false/USE_MOCK=true/' backend/.env
# Real
sed -i '' 's/USE_MOCK=true/USE_MOCK=false/' backend/.env
```
Restart backend after changing.

## 8. Safe key rotation
If a key is exposed: revoke it in OpenAI dashboard → create new one → update `.env` → restart backend. Never commit the key.

## 9. Optional combined start helper (Mac)
Create `start.sh` in root if desired:
```bash
#!/usr/bin/env bash
(cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!
(cd frontend && npm run dev) &
FRONTEND_PID=$!
wait $FRONTEND_PID
kill $BACKEND_PID 2>/dev/null || true
```
Make executable:
```bash
chmod +x start.sh
./start.sh
```

## 10. Daily checklist
1. Open VS Code in `transcripto` root.
2. Confirm `backend/.env` has desired mode & key.
3. Start backend (Terminal 1).
4. Start frontend (Terminal 2).
5. Hit /health; upload or record test.
6. Begin development.

## 11. Troubleshooting deep dive
To see backend logs in another terminal:
```bash
lsof -ti tcp:8000      # find process id
# or run uvicorn with --log-level debug
uvicorn main:app --reload --port 8000 --log-level debug
```
Check OpenAI connectivity manually:
```bash
cd backend
source .venv/bin/activate
python - <<'PY'
import os
from openai import OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
print('First model id:', client.models.list().data[0].id)
PY
```

---
Keep this file updated if workflow changes. Enjoy building! 🚀
