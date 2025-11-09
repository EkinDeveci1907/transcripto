import os
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set in environment.")

SUMMARY_MODEL = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4o-mini")
WHISPER_MODEL = os.getenv("OPENAI_WHISPER_MODEL", "whisper-1")

client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI(title="Transcripto Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class TranscriptionResponse(BaseModel):
    transcript: str
    summary: str

@app.post("/upload", response_model=TranscriptionResponse)
async def upload(file: UploadFile = File(...)):
    if file.content_type is None:
        raise HTTPException(status_code=400, detail="File content type missing")
    if not any(ext in file.filename.lower() for ext in [".webm", ".wav", ".mp3", ".m4a", ".ogg"]):
        raise HTTPException(status_code=400, detail="Unsupported file format")

    try:
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        # Transcribe with Whisper
        transcription = client.audio.transcriptions.create(
            model=WHISPER_MODEL,
            file=open(tmp_path, "rb"),
            response_format="text"
        )
        transcript_text = transcription

        if not transcript_text.strip():
            raise HTTPException(status_code=500, detail="Empty transcript")

        # Summarize with GPT
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

        return TranscriptionResponse(transcript=transcript_text, summary=summary_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass
