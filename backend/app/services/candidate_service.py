from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.enums import WORKFLOW_STATUS_MAP, CandidateStatus, Track, WorkflowStep
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.startup_repository import StartupRepository
from app.utils.factories import CandidateFactory
from app.utils.match_strategy import MatchStrategy


class CandidateService:
    def __init__(
        self,
        candidates: CandidateRepository,
        startups: StartupRepository,
        match_strategy: MatchStrategy,
    ):
        self._candidates = candidates
        self._startups = startups
        self._match_strategy = match_strategy

    def list(self, startup_id: str | None = None, university: str | None = None, track: str | None = None) -> list[dict]:
        items = self._candidates.list()
        if startup_id:
            items = [c for c in items if c.get("startupId") == startup_id]
        if university:
            items = [c for c in items if c.get("university") == university]
        if track:
            items = [c for c in items if c.get("track") == track]
        return items

    def get(self, candidate_id: str) -> dict:
        candidate = self._candidates.get(candidate_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return candidate

    def create_placement(self, university_name: str, data: dict) -> dict:
        candidate = CandidateFactory.build_placement(university_name, **data)
        return self._candidates.create(candidate)

    def bulk_create_placement(self, university_name: str, rows: list[dict]) -> list[dict]:
        return [self.create_placement(university_name, row) for row in rows]

    def create_self_apply(self, data: dict) -> dict:
        """Intern self-service application (New Application flow) — always QSTP track, starts at
        App Submitted, unassigned to any startup until matched."""
        candidate = CandidateFactory.build(
            **data,
            track=Track.QSTP.value,
            startupId=None,
            startupName="Unassigned",
            status=CandidateStatus.SUBMITTED.value,
            workflowIdx=1,
        )
        return self._candidates.create(candidate)

    def assign_to_startup(self, candidate_id: str, startup_id: str) -> dict:
        """A startup claims an unassigned candidate straight out of its AI Matchmaking Feed,
        kicking off the 5-step workflow tracker at Matched (mirrors what a BYOC approval or
        university push does, just triggered by the startup itself)."""
        candidate = self.get(candidate_id)
        if candidate.get("status") == CandidateStatus.REJECTED.value:
            raise HTTPException(status_code=400, detail="Candidate has been rejected and cannot be assigned")
        if candidate.get("startupId"):
            raise HTTPException(status_code=400, detail="Candidate is already assigned to a startup")
        startup = self._startups.get(startup_id)
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")
        score = self._match_strategy.score(startup.get("needs", []), candidate.get("skillSet", []))
        return self.update(
            candidate_id,
            {
                "startupId": startup_id,
                "startupName": startup["name"],
                "status": CandidateStatus.MATCHED.value,
                "workflowIdx": WorkflowStep.MATCHED.value,
                "match": score,
            },
        )

    def update(self, candidate_id: str, patch: dict) -> dict:
        # `patch` already reflects only explicitly-sent fields (routes call
        # `model_dump(exclude_unset=True)`), so an explicit `null` here means "clear this
        # field" and must be preserved — don't filter it back out.
        updated = self._candidates.update(candidate_id, patch)
        if not updated:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return updated

    def recompute_match(self, candidate_id: str) -> dict:
        candidate = self.get(candidate_id)
        startup = self._startups.get(candidate["startupId"]) if candidate.get("startupId") else None
        needs = startup["needs"] if startup else []
        score = self._match_strategy.score(needs, candidate.get("skillSet", []))
        return self.update(candidate_id, {"match": score})

    def startup_matches(self, candidate_id: str) -> list[dict]:
        """Every startup scored against this candidate's skill set — powers the intern's discovery feed."""
        candidate = self.get(candidate_id)
        skills = candidate.get("skillSet", [])
        scored = [
            {**startup, "score": self._match_strategy.score(startup.get("needs", []), skills)}
            for startup in self._startups.list()
        ]
        return sorted(scored, key=lambda s: s["score"], reverse=True)

    def advance_workflow(self, candidate_id: str) -> dict:
        candidate = self.get(candidate_id)
        if candidate.get("status") == CandidateStatus.REJECTED.value:
            raise HTTPException(status_code=400, detail="Candidate has been rejected and cannot be advanced")
        next_idx = min(WorkflowStep.ONBOARDING.value, (candidate.get("workflowIdx") or 0) + 1)
        status = WORKFLOW_STATUS_MAP.get(next_idx, CandidateStatus.SUBMITTED).value
        return self.update(
            candidate_id,
            {"workflowIdx": next_idx, "status": status, "decidedAt": datetime.now(timezone.utc).isoformat()},
        )

    def reject(self, candidate_id: str, feedback: str) -> dict:
        return self.update(
            candidate_id,
            {
                "status": CandidateStatus.REJECTED.value,
                "feedback": feedback,
                "decidedAt": datetime.now(timezone.utc).isoformat(),
            },
        )

    def delete(self, candidate_id: str) -> None:
        if not self._candidates.delete(candidate_id):
            raise HTTPException(status_code=404, detail="Candidate not found")

    def sign_contract_onboarding(self, candidate_id: str) -> dict:
        """Signing a contract also flips the candidate into onboarding (mirrors signContract() in the original app)."""
        return self.update(
            candidate_id,
            {"status": CandidateStatus.ONBOARDING.value, "contractSignedAt": datetime.now(timezone.utc).isoformat()},
        )
