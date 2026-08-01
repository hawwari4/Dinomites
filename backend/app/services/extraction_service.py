from __future__ import annotations

import io
from datetime import datetime, timezone
from uuid import uuid4

import docx
from fastapi import HTTPException

from app.core import config
from app.repositories.cv_extraction_repository import CvExtractionRepository
from app.services.pdf_parsing import extract_pdf_text, parse_cv_text, parse_job_text

MAX_PDF_BYTES = 15 * 1024 * 1024
MAX_DOCX_BYTES = 15 * 1024 * 1024


class ExtractionService:
    """CV PDF -> application fields, and job-description text -> skills+summary. Both run
    through a local, deterministic text parser (`pdf_parsing.py`) — no external AI API call,
    so this works offline and needs no API key (see skill.md)."""

    def __init__(self, cv_extractions: CvExtractionRepository | None = None):
        self._cv_extractions = cv_extractions or CvExtractionRepository()

    def extract(self, pdf_bytes: bytes) -> dict:
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="Upload a CV PDF")
        if len(pdf_bytes) > MAX_PDF_BYTES:
            raise HTTPException(status_code=400, detail="CV PDF is too large (max 15MB)")

        try:
            text = extract_pdf_text(pdf_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Could not read the CV PDF — please fill the form manually") from e

        # Only persist the upload once we know it's a readable PDF, so a bad upload doesn't
        # leave an orphaned file behind in UPLOAD_DIR.
        cv_link = self._store_bytes(pdf_bytes, "pdf")
        data = parse_cv_text(text)
        extracted = {k: v for k, v in data.items() if v not in (None, "", [])}
        extracted["cvLink"] = cv_link
        self._cv_extractions.create({**extracted, "extractedAt": _now_iso()})
        return extracted

    def extract_job_pdf(self, pdf_bytes: bytes) -> dict:
        """Job-description PDF (e.g. `Approved_JD_Template.pdf`) -> {skills[], summary,
        position?, commitment?, weeklyHours?, weeks?, cycle?}."""
        try:
            text = extract_pdf_text(pdf_bytes)
        except Exception:
            return {"skills": [], "summary": None}
        return parse_job_text(text)

    def extract_job_skills(self, text: str) -> dict:
        """Job-description plain text (e.g. read out of a .docx) -> the same shape as
        `extract_job_pdf`."""
        if not text.strip():
            return {"skills": [], "summary": None}
        return parse_job_text(text)

    def read_docx_text(self, docx_bytes: bytes) -> str:
        try:
            document = docx.Document(io.BytesIO(docx_bytes))
        except Exception as e:
            raise HTTPException(status_code=400, detail="Could not read the Word document") from e
        return "\n".join(p.text for p in document.paragraphs if p.text.strip())

    def store_upload(self, data: bytes, ext: str) -> str:
        return self._store_bytes(data, ext)

    def _store_bytes(self, data: bytes, ext: str) -> str:
        config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        stored_name = f"{uuid4().hex}.{ext}"
        (config.UPLOAD_DIR / stored_name).write_bytes(data)
        return f"{config.BACKEND_BASE_URL}/uploads/{stored_name}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
