from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException

from app.repositories.candidate_repository import CandidateRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.startup_repository import StartupRepository


class NotificationService:
    """Lets a startup send a short question/message to an intern about their
    application — surfaced on the intern's portal as a small notifications feed."""

    def __init__(
        self,
        notifications: NotificationRepository,
        candidates: CandidateRepository,
        startups: StartupRepository,
    ):
        self._notifications = notifications
        self._candidates = candidates
        self._startups = startups

    def list_for_candidate(self, candidate_id: str) -> list[dict]:
        items = [n for n in self._notifications.list() if n.get("candidateId") == candidate_id]
        return sorted(items, key=lambda n: n["createdAt"], reverse=True)

    def create(self, candidate_id: str, startup_id: str, message: str) -> dict:
        if not self._candidates.get(candidate_id):
            raise HTTPException(status_code=404, detail="Candidate not found")
        startup = self._startups.get(startup_id)
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")
        if not message or not message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        return self._notifications.create(
            {
                "candidateId": candidate_id,
                "startupId": startup_id,
                "startupName": startup["name"],
                "message": message.strip(),
                "read": False,
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
        )

    def create_system(self, candidate_id: str, message: str) -> dict:
        """Admin/QSTP-originated notification (no startup involved), e.g. a contract
        being ready to sign — surfaced the same way as startup messages."""
        return self._notifications.create(
            {
                "candidateId": candidate_id,
                "startupId": None,
                "startupName": "QSTP Admin",
                "message": message,
                "read": False,
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
        )

    def mark_read(self, notification_id: str) -> dict:
        updated = self._notifications.update(notification_id, {"read": True})
        if not updated:
            raise HTTPException(status_code=404, detail="Notification not found")
        return updated
