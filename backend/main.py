import os
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from openai import OpenAI

# Ensure values in .env override any previously exported shell variables (e.g. earlier USE_MOCK=true)
load_dotenv(override=True)

USE_MOCK = os.getenv("USE_MOCK", "true").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY and not USE_MOCK:
    raise RuntimeError("OPENAI_API_KEY not set in environment. Set USE_MOCK=true to run without external APIs.")

SUMMARY_MODEL = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4o-mini")
WHISPER_MODEL = os.getenv("OPENAI_WHISPER_MODEL", "whisper-1")

def get_openai_client():
    if USE_MOCK:
        return None
    try:
        # Rely on explicit api_key (can also use env var)
        return OpenAI(api_key=OPENAI_API_KEY)
    except TypeError as e:
        # Likely httpx incompatibility (proxies arg). Fallback to mock mode instructions.
        raise RuntimeError(f"Failed to initialize OpenAI client: {e}. Try pinning httpx==0.27.2 & httpcore==0.18.0 or upgrading openai.")

app = FastAPI(title="Transcripto Backend")

ALLOW_ALL_CORS = os.getenv("DEV_ALLOW_ALL_CORS", "false").lower() == "true"

cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if ALLOW_ALL_CORS:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

class TranscriptionResponse(BaseModel):
    transcript: str
    summary: Optional[str]
    summary_error: Optional[str] = None

@app.get("/health")
async def health():
    return {"status": "ok", "mock": USE_MOCK, "allow_all_cors": ALLOW_ALL_CORS}

@app.post("/upload", response_model=TranscriptionResponse)
async def upload(file: UploadFile = File(...)):
    # Accept common audio/video containers supported by Whisper
    if not any(ext in file.filename.lower() for ext in [
        ".webm", ".wav", ".mp3", ".m4a", ".ogg", ".mp4", ".mov"
    ]):
        raise HTTPException(status_code=400, detail="Unsupported file format")

    tmp_path = None
    try:
        # Save to temp file and capture size
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        summary_error: Optional[str] = None

        if USE_MOCK:
            transcript_text = f"[mock] Received {len(contents)} bytes from {file.filename}."
            summary_text = "[mock] Summary: Demo mode is enabled (no external API calls)."
        else:
            client = get_openai_client()
            # Transcribe with Whisper
            try:
                with open(tmp_path, "rb") as f:
                    transcription = client.audio.transcriptions.create(
                        model=WHISPER_MODEL,
                        file=f,
                        response_format="text"
                    )
                transcript_text = transcription
            except Exception as te:
                raise HTTPException(status_code=500, detail=f"transcription_failed: {te}")

            if not transcript_text.strip():
                raise HTTPException(status_code=500, detail="Empty transcript")

            # Attempt summary separately so we can still return transcript
            try:
                prompt = (
                    "You are an assistant that summarizes spoken content. Provide: 1) A concise summary (<=60 words). "
                    "2) 3 key bullet insights.\n\nTranscript:\n" + transcript_text
                )
                completion = client.chat.completions.create(
                    model=SUMMARY_MODEL,
                    messages=[{"role": "system", "content": "Summarize user audio."}, {"role": "user", "content": prompt}],
                    temperature=0.4,
                    max_tokens=300
                )
                summary_text = completion.choices[0].message.content.strip()
            except Exception as se:
                summary_text = None
                summary_error = f"summary_failed: {se}"

        return TranscriptionResponse(transcript=transcript_text, summary=summary_text, summary_error=summary_error)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except Exception:
                pass
