import io
import os
import sys
from importlib import reload
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure backend package root on sys.path when running via pytest
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure mock mode during tests before importing the app module
os.environ["USE_MOCK"] = "true"

# Import after forcing env flag so main picks it up
import main  # type: ignore


@pytest.fixture(scope="session")
def client():
    # Reload in case other tests mutate module-level state
    reload(main)
    main.USE_MOCK = True
    return TestClient(main.app)


def test_health_endpoint_reports_mock_mode(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["mock"] is True


def test_upload_returns_mock_transcript(client: TestClient):
    dummy_audio = io.BytesIO(b"dummy audio data")
    files = {"file": ("sample.webm", dummy_audio, "audio/webm")}

    resp = client.post("/upload", files=files)
    assert resp.status_code == 200

    data = resp.json()
    assert data["transcript"].startswith("[mock]")
    assert data["summary"].startswith("[mock]")
