import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"

load_dotenv(BASE_DIR / ".env")

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8000")
