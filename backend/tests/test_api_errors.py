import io
import os
import sys
from pathlib import Path
from importlib import reload

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

os.environ["USE_MOCK"] = "true"
import main  # type: ignore


def get_client():
    reload(main)
    main.USE_MOCK = True
    return TestClient(main.app)


def test_upload_unsupported_format_returns_400():
    client = get_client()
    # Use a .txt filename to trigger format validation
    dummy = io.BytesIO(b"not audio")
    files = {"file": ("note.txt", dummy, "text/plain")}
    resp = client.post("/upload", files=files)
    assert resp.status_code == 400
    assert resp.json()["detail"].lower().startswith("unsupported file format")
