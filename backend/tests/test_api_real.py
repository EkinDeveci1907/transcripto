import io
import os
import sys
from importlib import reload
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

os.environ["USE_MOCK"] = "false"
os.environ.setdefault("OPENAI_API_KEY", "test-key")

import main  # type: ignore


class FakeAudioTranscriptions:
    def __init__(self):
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return "fake transcript"


class FakeAudio:
    def __init__(self):
        self.transcriptions = FakeAudioTranscriptions()


class FakeChatCompletions:
    def __init__(self):
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        message = SimpleNamespace(content="fake summary")
        choice = SimpleNamespace(message=message)
        return SimpleNamespace(choices=[choice])


class FakeChat:
    def __init__(self):
        self.completions = FakeChatCompletions()


class FakeClient:
    def __init__(self):
        self.audio = FakeAudio()
        self.chat = FakeChat()


@pytest.fixture()
def real_client(monkeypatch):
    reload(main)
    main.USE_MOCK = False
    monkeypatch.setattr(main, "get_openai_client", lambda: FakeClient())
    return TestClient(main.app)


def test_real_mode_flow_returns_transcript_and_summary(real_client: TestClient):
    dummy_audio = io.BytesIO(b"dummy audio data")
    files = {"file": ("clip.mp3", dummy_audio, "audio/mpeg")}

    resp = real_client.post("/upload", files=files)
    assert resp.status_code == 200

    data = resp.json()
    assert data["transcript"] == "fake transcript"
    assert data["summary"] == "fake summary"
