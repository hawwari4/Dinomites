from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException

from app.repositories.internship_description_repository import InternshipDescriptionRepository
from app.repositories.startup_repository import StartupRepository
from app.services.extraction_service import MAX_DOCX_BYTES, MAX_PDF_BYTES, ExtractionService

ALLOWED_EXTENSIONS = {"pdf", "docx"}


class InternshipDescriptionService:
    """Startup-side 'make a new internship description' flow: upload a job description
    (PDF or Word .docx — see `Approved_JD_Template.pdf`), store it, and auto-extract the
    skills/position/commitment it requires straight into the startup's needs[] — replaces
    the old manual Identified Needs tag editor."""

    def __init__(
        self,
        descriptions: InternshipDescriptionRepository,
        startups: StartupRepository,
        extraction: ExtractionService,
    ):
        self._descriptions = descriptions
        self._startups = startups
        self._extraction = extraction

    def list(self, startup_id: str) -> list[dict]:
        items = [d for d in self._descriptions.list() if d.get("startupId") == startup_id]
        return sorted(items, key=lambda d: d["uploadedAt"], reverse=True)

    def upload(self, startup_id: str, filename: str, file_bytes: bytes) -> dict:
        startup = self._startups.get(startup_id)
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Upload a PDF or .docx file")

        ext = (filename or "").rsplit(".", 1)[-1].lower() if "." in (filename or "") else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Upload a PDF or .docx job description")
        if ext == "pdf" and len(file_bytes) > MAX_PDF_BYTES:
            raise HTTPException(status_code=400, detail="Document is too large (max 15MB)")
        if ext == "docx" and len(file_bytes) > MAX_DOCX_BYTES:
            raise HTTPException(status_code=400, detail="Document is too large (max 15MB)")

        file_url = self._extraction.store_upload(file_bytes, ext)

        result: dict = {}
        try:
            if ext == "pdf":
                result = self._extraction.extract_job_pdf(file_bytes)
            else:
                text = self._extraction.read_docx_text(file_bytes)
                result = self._extraction.extract_job_skills(text)
        except Exception:
            pass  # best-effort — the document is still saved even if parsing fails

        skills = result.get("skills") or []

        record = self._descriptions.create(
            {
                "startupId": startup_id,
                "fileName": filename,
                "fileUrl": file_url,
                "extractedSkills": skills,
                "summary": result.get("summary"),
                "position": result.get("position"),
                "commitment": result.get("commitment"),
                "weeklyHours": result.get("weeklyHours"),
                "weeks": result.get("weeks"),
                "cycle": result.get("cycle"),
                "uploadedAt": datetime.now(timezone.utc).isoformat(),
            }
        )

        if skills:
            existing = startup.get("needs", [])
            merged = [*existing, *[s for s in skills if s not in existing]]
            self._startups.update(startup_id, {"needs": merged})

        return record
