import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import app.core.config as config  # noqa: E402


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A TestClient wired to an isolated, empty data dir — each test gets a freshly seeded app."""
    monkeypatch.setattr(config, "DATA_DIR", tmp_path)
    from app.main import app

    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c
