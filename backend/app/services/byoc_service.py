from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.enums import ByocStatus, Track
from app.repositories.byoc_repository import ByocRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.startup_repository import StartupRepository
from app.utils.factories import CandidateFactory

QSTP_COHORT_CAP = 3
BYOC_CAP_FREE = 3
BYOC_CAP_PREMIUM = 3


class ByocService:
    def __init__(self, byoc: ByocRepository, candidates: CandidateRepository, startups: StartupRepository):
        self._byoc = byoc
        self._candidates = candidates
        self._startups = startups

    def list(self, startup_id: str | None = None) -> list[dict]:
        items = self._byoc.list()
        if startup_id:
            items = [b for b in items if b["startupId"] == startup_id]
        return items

    def submit(self, data: dict) -> dict:
        startup = self._startups.get(data["startupId"])
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")

        cap = BYOC_CAP_PREMIUM if startup.get("premium") else BYOC_CAP_FREE
        used = sum(
            1 for b in self._byoc.list()
            if b.get("startupId") == data["startupId"] and b.get("status") != ByocStatus.REJECTED.value
        )
        if used >= cap:
            raise HTTPException(
                status_code=400,
                detail=f"BYOC limit reached ({used}/{cap}). Upgrade to Premium for more submissions.",
            )

        if data.get("track") == Track.QSTP.value:
            if startup and startup.get("qstpCohortsUsed", 0) >= QSTP_COHORT_CAP:
                raise HTTPException(
                    status_code=400,
                    detail=f"QSTP cohort limit reached ({QSTP_COHORT_CAP}/{QSTP_COHORT_CAP}). Choose Work Placement.",
                )
        entry = {
            **data,
            "status": ByocStatus.PENDING.value,
            "submittedAt": datetime.now(timezone.utc).isoformat(),
        }
        return self._byoc.create(entry)

    def approve(self, byoc_id: str) -> dict:
        entry = self._byoc.get(byoc_id)
        if not entry:
            raise HTTPException(status_code=404, detail="BYOC entry not found")
        if entry.get("status") != ByocStatus.PENDING.value:
            raise HTTPException(status_code=400, detail=f"BYOC entry already {entry.get('status')}")
        entry = self._byoc.update(byoc_id, {"status": ByocStatus.APPROVED.value})
        self._candidates.create(CandidateFactory.from_byoc(entry))
        return entry

    def reject(self, byoc_id: str) -> dict:
        entry = self._byoc.get(byoc_id)
        if not entry:
            raise HTTPException(status_code=404, detail="BYOC entry not found")
        if entry.get("status") != ByocStatus.PENDING.value:
            raise HTTPException(status_code=400, detail=f"BYOC entry already {entry.get('status')}")
        return self._byoc.update(byoc_id, {"status": ByocStatus.REJECTED.value})
